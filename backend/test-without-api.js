// Test script to verify basic functionality without OpenAI API
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'mock',
      vectorStore: 'mock',
      documentCount: 0
    },
    message: 'Running in test mode without OpenAI API'
  });
});

// Mock chat endpoint
app.post('/api/chat/message', (req, res) => {
  const { message } = req.body;
  
  res.json({
    message: {
      id: 'test-123',
      type: 'bot',
      content: `Test response: I received your message "${message}". This is a mock response - add your OpenAI API key for real RAG functionality.`,
      timestamp: new Date().toISOString(),
      sources: []
    },
    context: {
      retrievedDocuments: 0,
      sources: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('📝 This is a mock server - add OpenAI API key for full functionality');
});
