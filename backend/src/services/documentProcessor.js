import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import XLSX from "xlsx";
import csv from "csv-parser";
import { createReadStream } from "fs";
import { v4 as uuidv4 } from "uuid";

class DocumentProcessor {
  constructor() {
    this.supportedFormats = [".pdf", ".xlsx", ".xls", ".csv"];
    this.chunkSize = 1000; // characters per chunk
    this.chunkOverlap = 200; // overlap between chunks
  }

  async processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    console.log(`📄 Processing: ${fileName}`);

    try {
      let content = "";
      let metadata = {
        fileName,
        fileType: ext,
        processedAt: new Date().toISOString(),
        fileSize: (await fs.stat(filePath)).size,
      };

      switch (ext) {
        case ".pdf":
          content = await this.processPDF(filePath);
          break;
        case ".xlsx":
        case ".xls":
          content = await this.processExcel(filePath);
          break;
        case ".csv":
          content = await this.processCSV(filePath);
          break;
        default:
          throw new Error(`Unsupported file format: ${ext}`);
      }

      // Clean and normalize content
      content = this.cleanText(content);

      // Generate chunks
      const chunks = this.createChunks(content, metadata);

      console.log(
        `✅ Processed ${fileName}: ${chunks.length} chunks generated`
      );
      return chunks;
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
      throw error;
    }
  }

  async processPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  async processExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      let content = "";

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to readable text format
        jsonData.forEach((row) => {
          if (Array.isArray(row)) {
            content +=
              row
                .filter((cell) => cell !== undefined && cell !== null)
                .join(" | ") + "\n";
          }
        });
        content += "\n";
      });

      return content;
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      let content = "";
      const results = [];

      createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          // Convert CSV data to readable text
          results.forEach((row) => {
            Object.entries(row).forEach(([key, value]) => {
              content += `${key}: ${value}\n`;
            });
            content += "\n";
          });
          resolve(content);
        })
        .on("error", (error) => {
          reject(new Error(`CSV processing failed: ${error.message}`));
        });
    });
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n\n") // Replace multiple newlines with double newline
      .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
      .trim();
  }

  createChunks(text, metadata) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would exceed chunk size, save current chunk
      if (
        currentChunk.length + trimmedSentence.length > this.chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push({
          id: uuidv4(),
          content: currentChunk.trim(),
          metadata: {
            ...metadata,
            chunkIndex,
            chunkLength: currentChunk.length,
            startIndex: text.indexOf(currentChunk),
            endIndex: text.indexOf(currentChunk) + currentChunk.length,
          },
        });

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-this.chunkOverlap);
        currentChunk = overlapText + " " + trimmedSentence;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex,
          chunkLength: currentChunk.length,
          startIndex: text.indexOf(currentChunk),
          endIndex: text.indexOf(currentChunk) + currentChunk.length,
        },
      });
    }

    return chunks;
  }

  async processDirectory(directoryPath) {
    const files = await fs.readdir(directoryPath);
    const allChunks = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const ext = path.extname(file).toLowerCase();

      if (this.supportedFormats.includes(ext)) {
        try {
          const chunks = await this.processFile(filePath);
          allChunks.push(...chunks);
        } catch (error) {
          console.error(`Skipping ${file}: ${error.message}`);
        }
      }
    }

    return allChunks;
  }
}

export default new DocumentProcessor();
