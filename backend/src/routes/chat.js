import express from "express";
import { v4 as uuidv4 } from "uuid";
import database from "../config/database.js";
import embeddingService from "../services/embeddingService.js";

const router = express.Router();

// In-memory chat storage (in production, use a proper database)
const chatSessions = new Map();

// Get or create chat session
router.post("/session", (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    if (!chatSessions.has(userId)) {
      chatSessions.set(userId, {
        sessionId: uuidv4(),
        userId,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });
    }

    const session = chatSessions.get(userId);
    session.lastActivity = new Date().toISOString();

    res.json({
      sessionId: session.sessionId,
      userId: session.userId,
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create chat session",
      message: error.message,
    });
  }
});

// Get chat history
router.get("/session/:userId/history", (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!chatSessions.has(userId)) {
      return res.json({
        messages: [],
        total: 0,
        hasMore: false,
      });
    }

    const session = chatSessions.get(userId);
    const messages = session.messages
      .slice(offset, offset + parseInt(limit))
      .reverse(); // Most recent first

    res.json({
      messages,
      total: session.messages.length,
      hasMore: offset + messages.length < session.messages.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get chat history",
      message: error.message,
    });
  }
});

// Send message and get RAG response
router.post("/message", async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "User ID and message are required",
      });
    }

    // Get or create session
    if (!chatSessions.has(userId)) {
      chatSessions.set(userId, {
        sessionId: sessionId || uuidv4(),
        userId,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });
    }

    const session = chatSessions.get(userId);

    // Add user message to session
    const userMessage = {
      id: uuidv4(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(userMessage);
    session.lastActivity = new Date().toISOString();

    // Generate embedding for the query
    const queryEmbedding = await embeddingService.generateEmbedding(message);

    // Query the vector database
    const searchResults = await database.queryDocuments(message, 5);

    // Prepare context from retrieved documents
    let context = "";
    if (searchResults.documents && searchResults.documents[0]) {
      context = searchResults.documents[0]
        .map((doc, index) => {
          const metadata = searchResults.metadatas[0][index];
          const similarity = searchResults.distances[0][index];
          return `[Source: ${
            metadata.fileName
          }, Relevance: ${similarity.toFixed(3)}]\n${doc}`;
        })
        .join("\n\n");
    }

    // Generate response (simplified - in production, use a proper LLM)
    const botResponse = generateRAGResponse(message, context, searchResults);

    // Add bot response to session
    const botMessage = {
      id: uuidv4(),
      type: "bot",
      content: botResponse,
      timestamp: new Date().toISOString(),
      sources:
        searchResults.metadatas?.[0]?.map((meta) => ({
          fileName: meta.fileName,
          chunkIndex: meta.chunkIndex,
        })) || [],
    };

    session.messages.push(botMessage);
    session.lastActivity = new Date().toISOString();

    res.json({
      message: botMessage,
      context: {
        retrievedDocuments: searchResults.documents?.[0]?.length || 0,
        sources: botMessage.sources,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Failed to process message",
      message: error.message,
    });
  }
});

// Clear chat history
router.delete("/session/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    if (chatSessions.has(userId)) {
      chatSessions.delete(userId);
    }

    res.json({
      message: "Chat session cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear chat session",
      message: error.message,
    });
  }
});

// Search documents
router.post("/search", async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

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

// Helper function to generate RAG response
function generateRAGResponse(query, context, searchResults) {
  // This is a simplified response generator
  // In production, you would use a proper LLM like GPT-4 or Claude

  if (!context || context.trim().length === 0) {
    return `I apologize, but I couldn't find specific information about "${query}" in the VIT documents. Please try rephrasing your question or ask about a different topic related to VIT policies, academic regulations, or procedures.`;
  }

  // Extract key information from context
  const sources =
    searchResults.metadatas?.[0]?.map((meta) => meta.fileName) || [];
  const uniqueSources = [...new Set(sources)];

  return `Based on the VIT documents, here's what I found regarding "${query}":

${context.substring(0, 1000)}${context.length > 1000 ? "..." : ""}

This information was retrieved from: ${uniqueSources.join(", ")}

Please note that this is a simplified response. For the most accurate and up-to-date information, please refer to the official VIT documents or contact the relevant department directly.`;
}

export default router;
