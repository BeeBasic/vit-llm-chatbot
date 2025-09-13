# VIT RAG Chatbot

A full-stack RAG (Retrieval-Augmented Generation) based chatbot application for VIT University, built with React, Node.js, and ChromaDB.

## 🎯 Features

- **Document Processing**: Extract and process PDFs, Excel files, and CSV documents
- **Vector Search**: Semantic search through processed documents using embeddings
- **RAG Pipeline**: Context-aware responses using retrieved document chunks
- **Real-time Chat**: Interactive chat interface with file upload support
- **Source Attribution**: Shows document sources for each response
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓ HTTP API
Backend (Node.js + Express)
    ↓
Document Processor → Embedding Service → Vector Database (ChromaDB)
    ↓
Chat API → Response Generation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for ChromaDB)
- OpenAI API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd vit-llm-chatbot
npm install
```

### 2. Run Setup Script

```bash
node run-setup.js
```

### 3. Configure Environment

Edit `backend/.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start ChromaDB

```bash
docker run -p 8000:8000 chromadb/chroma:latest
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

### 6. Process Dataset

In a new terminal:

```bash
cd backend
npm run process-data
```

### 7. Start Frontend

In a new terminal:

```bash
npm run dev
```

Visit `http://localhost:5173` to use the application!

## 📁 Project Structure

```
vit-llm-chatbot/
├── src/                          # Frontend React app
│   ├── components/
│   │   ├── chat/                 # Chat interface components
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # Reusable UI components
│   ├── services/
│   │   └── api.ts                # API service layer
│   └── pages/                    # Application pages
├── backend/                      # Backend Node.js service
│   ├── src/
│   │   ├── config/               # Database configuration
│   │   ├── services/             # Business logic services
│   │   ├── routes/               # API routes
│   │   └── scripts/              # Data processing scripts
│   └── package.json
├── dataset/                      # Source documents
└── README.md
```

## 🔧 API Endpoints

### Health Check

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system information

### Chat

- `POST /api/chat/session` - Create chat session
- `GET /api/chat/session/:userId/history` - Get chat history
- `POST /api/chat/message` - Send message
- `DELETE /api/chat/session/:userId` - Clear session
- `POST /api/chat/search` - Search documents

### Documents

- `POST /api/documents/upload` - Upload single document
- `POST /api/documents/upload-multiple` - Upload multiple documents
- `GET /api/documents/stats` - Get document statistics
- `POST /api/documents/search` - Search documents

## 📊 Data Processing Pipeline

1. **Document Ingestion**: Files uploaded or processed from dataset directory
2. **Text Extraction**: Content extracted from PDFs, Excel, CSV files
3. **Text Chunking**: Large documents split into manageable chunks
4. **Embedding Generation**: OpenAI embeddings generated for each chunk
5. **Vector Storage**: Embeddings stored in ChromaDB for retrieval
6. **Query Processing**: User queries embedded and matched against stored vectors

## 🛠️ Development

### Frontend Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon
npm run process-data # Process dataset
npm start           # Start production server
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Set environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Backend (Render/Heroku/AWS)

1. Set up environment variables
2. Deploy the `backend` folder
3. Ensure ChromaDB is accessible
4. Run data processing after deployment

### Database

- **ChromaDB**: Use managed service or Docker container
- **Chat Storage**: Currently in-memory (upgrade to PostgreSQL for production)

## 🔑 Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_HOST=localhost
CHROMA_PORT=8000
MAX_FILE_SIZE=10485760
RATE_LIMIT_MAX_REQUESTS=100
```

## 📝 Usage Examples

### Ask Questions

- "What are the credit requirements for B.Tech CSE?"
- "When is the NPTEL registration deadline?"
- "What is the hostel code of conduct?"
- "What clubs are available at VIT?"

### Upload Documents

- Drag and drop PDF, Excel, or CSV files
- Documents are automatically processed and indexed
- Searchable immediately after upload

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **ChromaDB Connection Error**

   - Ensure ChromaDB is running on port 8000
   - Check firewall settings

2. **OpenAI API Error**

   - Verify API key is correct
   - Check API quota and billing

3. **File Upload Issues**

   - Check file size limits
   - Ensure file format is supported

4. **Processing Errors**
   - Check file permissions
   - Verify document format

### Getting Help

- Check the logs in `backend/logs/`
- Use the health check endpoint: `GET /api/health/detailed`
- Review the console for error messages

## 🎉 Success!

Your VIT RAG chatbot is now ready! Students can ask questions about university policies, academic regulations, and procedures, with responses backed by official VIT documents.
