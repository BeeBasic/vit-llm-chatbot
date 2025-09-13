import express from "express";
import database from "../config/database.js";

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const stats = await database.getCollectionStats();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        vectorStore: "connected",
        documentCount: stats.documentCount,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: "disconnected",
        vectorStore: "disconnected",
      },
    });
  }
});

// Detailed health check
router.get("/detailed", async (req, res) => {
  try {
    const stats = await database.getCollectionStats();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: {
          status: "connected",
          type: "ChromaDB",
          documentCount: stats.documentCount,
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      },
      configuration: {
        port: process.env.PORT || 5000,
        maxFileSize: process.env.MAX_FILE_SIZE || "10MB",
        rateLimit: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: "disconnected",
        vectorStore: "disconnected",
      },
    });
  }
});

export default router;
