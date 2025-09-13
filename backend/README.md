# VIT RAG Backend

Backend service for the VIT RAG-based chatbot application. This service handles document processing, vector storage, and chat functionality.

## Features

- **Document Processing**: Extract text from PDFs, Excel files, and CSV files
- **Vector Database**: Store and query document embeddings using ChromaDB
- **RAG Pipeline**: Retrieve relevant context for AI responses
- **Chat Management**: Store and manage user chat sessions
- **File Upload**: Handle document uploads and processing
- **Search API**: Search through processed documents

## Prerequisites

- Node.js 18+
- ChromaDB running locally or remotely
- OpenAI API key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

3. Start ChromaDB (if running locally):

```bash
# Using Docker
docker run -p 8000:8000 chromadb/chroma:latest

# Or using pip
pip install chromadb
chroma run --host localhost --port 8000
```

## Usage

### Start the server:

```bash
npm run dev
```

### Process the dataset:

```bash
npm run process-data
```

## API Endpoints

### Health Check

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health information

### Chat

- `POST /api/chat/session` - Create or get chat session
- `GET /api/chat/session/:userId/history` - Get chat history
- `POST /api/chat/message` - Send message and get RAG response
- `DELETE /api/chat/session/:userId` - Clear chat session
- `POST /api/chat/search` - Search documents

### Documents

- `POST /api/documents/upload` - Upload single document
- `POST /api/documents/upload-multiple` - Upload multiple documents
- `GET /api/documents/stats` - Get document statistics
- `POST /api/documents/search` - Search documents

## Data Processing Pipeline

1. **Document Ingestion**: Files are uploaded or processed from the dataset directory
2. **Text Extraction**: Content is extracted from PDFs, Excel, and CSV files
3. **Text Chunking**: Large documents are split into manageable chunks
4. **Embedding Generation**: OpenAI embeddings are generated for each chunk
5. **Vector Storage**: Embeddings are stored in ChromaDB for retrieval
6. **Query Processing**: User queries are embedded and matched against stored vectors

## Architecture

```
Frontend (React)
    ↓ HTTP API
Backend (Express.js)
    ↓
Document Processor → Embedding Service → Vector Database (ChromaDB)
    ↓
Chat API → Response Generation
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run process-data` - Process the dataset directory
- `npm test` - Run tests

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production ChromaDB instance
3. Set up proper logging and monitoring
4. Use a process manager like PM2
5. Set up reverse proxy (nginx)

## Environment Variables

| Variable                  | Description     | Default     |
| ------------------------- | --------------- | ----------- |
| `PORT`                    | Server port     | 5000        |
| `NODE_ENV`                | Environment     | development |
| `OPENAI_API_KEY`          | OpenAI API key  | Required    |
| `CHROMA_HOST`             | ChromaDB host   | localhost   |
| `CHROMA_PORT`             | ChromaDB port   | 8000        |
| `MAX_FILE_SIZE`           | Max upload size | 10MB        |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit      | 100/15min   |
