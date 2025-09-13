#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 VIT RAG Application Setup\n");

// Check if we're in the right directory
if (!fs.existsSync("package.json") || !fs.existsSync("backend/package.json")) {
  console.error("❌ Please run this script from the project root directory");
  process.exit(1);
}

try {
  // Run backend setup
  console.log("📦 Setting up backend...");
  execSync("node setup-backend.js", { stdio: "inherit" });

  console.log("\n✅ Setup completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Add your OpenAI API key to backend/.env");
  console.log("2. Start ChromaDB:");
  console.log("   docker run -p 8000:8000 chromadb/chroma:latest");
  console.log("3. Start the backend:");
  console.log("   cd backend && npm run dev");
  console.log("4. Process the dataset:");
  console.log("   cd backend && npm run process-data");
  console.log("5. Start the frontend:");
  console.log("   npm run dev");
} catch (error) {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
}
