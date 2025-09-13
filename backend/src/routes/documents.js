import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import documentProcessor from "../services/documentProcessor.js";
import embeddingService from "../services/embeddingService.js";
import database from "../config/database.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".doc"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(
            ", "
          )}`
        ),
        false
      );
    }
  },
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDir();

// Upload and process single document
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log(`📄 Processing uploaded file: ${req.file.originalname}`);

    // Process the uploaded file
    const chunks = await documentProcessor.processFile(req.file.path);

    if (chunks.length === 0) {
      return res.status(400).json({
        error: "No content could be extracted from the file",
      });
    }

    // Generate embeddings
    const processedChunks = await embeddingService.processChunksWithEmbeddings(
      chunks
    );

    // Prepare data for ChromaDB
    const documents = processedChunks.map((chunk) => chunk.content);
    const embeddings = processedChunks.map((chunk) => chunk.embedding);
    const metadatas = processedChunks.map((chunk) => chunk.metadata);

    // Store in vector database
    await database.addDocuments(documents, embeddings, metadatas);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      message: "Document processed and indexed successfully",
      fileName: req.file.originalname,
      chunksProcessed: chunks.length,
      embeddingsGenerated: embeddings.length,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to clean up file:", cleanupError);
      }
    }

    res.status(500).json({
      error: "Failed to process document",
      message: error.message,
    });
  }
});

// Upload and process multiple documents
router.post(
  "/upload-multiple",
  upload.array("documents", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "No files uploaded",
        });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          console.log(`📄 Processing: ${file.originalname}`);

          const chunks = await documentProcessor.processFile(file.path);

          if (chunks.length > 0) {
            const processedChunks =
              await embeddingService.processChunksWithEmbeddings(chunks);

            const documents = processedChunks.map((chunk) => chunk.content);
            const embeddings = processedChunks.map((chunk) => chunk.embedding);
            const metadatas = processedChunks.map((chunk) => chunk.metadata);

            await database.addDocuments(documents, embeddings, metadatas);

            results.push({
              fileName: file.originalname,
              chunksProcessed: chunks.length,
              status: "success",
            });
          } else {
            errors.push({
              fileName: file.originalname,
              error: "No content could be extracted",
            });
          }

          // Clean up file
          await fs.unlink(file.path);
        } catch (error) {
          errors.push({
            fileName: file.originalname,
            error: error.message,
          });

          // Clean up file on error
          try {
            await fs.unlink(file.path);
          } catch (cleanupError) {
            console.error("Failed to clean up file:", cleanupError);
          }
        }
      }

      res.json({
        message: "Batch processing completed",
        processed: results.length,
        errors: errors.length,
        results,
        errors,
      });
    } catch (error) {
      console.error("Batch upload error:", error);
      res.status(500).json({
        error: "Failed to process documents",
        message: error.message,
      });
    }
  }
);

// Get document statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await database.getCollectionStats();

    res.json({
      totalDocuments: stats.documentCount,
      lastUpdated: new Date().toISOString(),
      vectorStore: "ChromaDB",
      status: "active",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get document statistics",
      message: error.message,
    });
  }
});

// Search documents
router.post("/search", async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    const results = await database.queryDocuments(query, parseInt(limit));

    const searchResults =
      results.documents?.[0]?.map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: results.distances[0][index],
      })) || [];

    res.json({
      query,
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to search documents",
      message: error.message,
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: `File size exceeds ${
          process.env.MAX_FILE_SIZE || "10MB"
        } limit`,
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files",
        message: "Maximum 10 files allowed per upload",
      });
    }
  }

  if (error.message.includes("File type")) {
    return res.status(400).json({
      error: "Invalid file type",
      message: error.message,
    });
  }

  next(error);
});

export default router;
