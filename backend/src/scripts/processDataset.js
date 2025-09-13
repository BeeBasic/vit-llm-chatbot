#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import documentProcessor from "../services/documentProcessor.js";
import embeddingService from "../services/embeddingService.js";
import database from "../config/database.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../../.env") });

class DatasetProcessor {
  constructor() {
    this.datasetPath = path.join(__dirname, "../../../dataset");
    this.processedCount = 0;
    this.errorCount = 0;
  }

  async processDataset() {
    console.log("🚀 Starting VIT Dataset Processing...");
    console.log(`📁 Dataset path: ${this.datasetPath}`);

    try {
      // Check if dataset directory exists
      const fs = await import("fs/promises");
      try {
        await fs.access(this.datasetPath);
      } catch (error) {
        throw new Error(`Dataset directory not found: ${this.datasetPath}`);
      }

      // Process all documents in the dataset directory
      console.log("📄 Processing documents...");
      const chunks = await documentProcessor.processDirectory(this.datasetPath);

      if (chunks.length === 0) {
        console.log("⚠️  No documents found to process");
        return;
      }

      console.log(`📊 Generated ${chunks.length} text chunks`);

      // Generate embeddings for all chunks
      console.log("🧠 Generating embeddings...");
      const processedChunks =
        await embeddingService.processChunksWithEmbeddings(chunks);

      // Prepare data for ChromaDB
      const documents = processedChunks.map((chunk) => chunk.content);
      const embeddings = processedChunks.map((chunk) => chunk.embedding);
      const metadatas = processedChunks.map((chunk) => chunk.metadata);

      // Store in ChromaDB
      console.log("💾 Storing in vector database...");
      await database.addDocuments(documents, embeddings, metadatas);

      // Get collection stats
      const stats = await database.getCollectionStats();
      console.log(
        `📈 Collection stats: ${stats.documentCount} documents stored`
      );

      console.log("✅ Dataset processing completed successfully!");
      console.log(`📊 Summary:`);
      console.log(`   - Documents processed: ${chunks.length}`);
      console.log(`   - Embeddings generated: ${embeddings.length}`);
      console.log(`   - Vector database updated: ✅`);
    } catch (error) {
      console.error("❌ Dataset processing failed:", error.message);
      process.exit(1);
    }
  }

  async testQuery() {
    console.log("\n🔍 Testing query functionality...");

    try {
      const testQueries = [
        "What are the credit requirements for B.Tech CSE?",
        "When is the NPTEL registration deadline?",
        "What is the hostel code of conduct?",
        "What clubs are available at VIT?",
      ];

      for (const query of testQueries) {
        console.log(`\nQuery: "${query}"`);
        const results = await database.queryDocuments(query, 3);

        if (results.documents && results.documents[0]) {
          console.log(
            `Found ${results.documents[0].length} relevant documents:`
          );
          results.documents[0].forEach((doc, index) => {
            const metadata = results.metadatas[0][index];
            console.log(
              `  ${index + 1}. ${
                metadata.fileName
              } (similarity: ${results.distances[0][index].toFixed(3)})`
            );
            console.log(`     Preview: ${doc.substring(0, 100)}...`);
          });
        } else {
          console.log("  No relevant documents found");
        }
      }
    } catch (error) {
      console.error("❌ Query test failed:", error.message);
    }
  }
}

// Main execution
async function main() {
  const processor = new DatasetProcessor();

  // Process the dataset
  await processor.processDataset();

  // Test query functionality
  await processor.testQuery();

  console.log("\n🎉 All done! Your RAG system is ready.");
  process.exit(0);
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export default DatasetProcessor;
