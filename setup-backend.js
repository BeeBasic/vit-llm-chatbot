#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Setting up VIT RAG Backend...\n");

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

if (majorVersion < 18) {
  console.error("❌ Node.js 18+ is required. Current version:", nodeVersion);
  process.exit(1);
}

console.log("✅ Node.js version check passed:", nodeVersion);

// Create necessary directories
const directories = ["backend/uploads", "backend/data", "backend/logs"];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Install backend dependencies
console.log("\n📦 Installing backend dependencies...");
try {
  execSync("npm install", {
    cwd: "backend",
    stdio: "inherit",
  });
  console.log("✅ Backend dependencies installed");
} catch (error) {
  console.error("❌ Failed to install backend dependencies:", error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = "backend/.env";
if (!fs.existsSync(envPath)) {
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Database Configuration (for chat storage)
DATABASE_URL=sqlite://./data/chat.db

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

  fs.writeFileSync(envPath, envContent);
  console.log("📝 Created .env file with default configuration");
}

// Install ChromaDB
console.log("\n🗄️  Setting up ChromaDB...");
try {
  // Check if Docker is available
  try {
    execSync("docker --version", { stdio: "pipe" });
    console.log("🐳 Docker detected. You can run ChromaDB with:");
    console.log("   docker run -p 8000:8000 chromadb/chroma:latest");
  } catch {
    console.log("📦 Docker not found. Install ChromaDB with pip:");
    console.log("   pip install chromadb");
    console.log("   chroma run --host localhost --port 8000");
  }
} catch (error) {
  console.log("⚠️  ChromaDB setup instructions provided above");
}

console.log("\n🎉 Backend setup completed!");
console.log("\n📋 Next steps:");
console.log("1. Add your OpenAI API key to backend/.env");
console.log("2. Start ChromaDB (see instructions above)");
console.log("3. Run: cd backend && npm run dev");
console.log("4. Process dataset: cd backend && npm run process-data");
console.log("\n🔗 Backend will be available at: http://localhost:5000");
