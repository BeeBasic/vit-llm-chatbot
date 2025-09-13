import { ChromaClient } from "chromadb";
import { config } from "dotenv";

config();

class DatabaseManager {
  constructor() {
    this.chromaClient = null;
    this.collection = null;
    this.initializeChroma();
  }

  async initializeChroma() {
    try {
      this.chromaClient = new ChromaClient({
        path: `http://${process.env.CHROMA_HOST || "localhost"}:${
          process.env.CHROMA_PORT || 8000
        }`,
      });

      // Create or get the collection for VIT documents
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: "vit_documents",
        metadata: {
          description: "VIT academic documents and policies",
          created_at: new Date().toISOString(),
        },
      });

      console.log("✅ ChromaDB connected successfully");
    } catch (error) {
      console.error("❌ Failed to connect to ChromaDB:", error.message);
      throw error;
    }
  }

  async addDocuments(documents, embeddings, metadatas) {
    try {
      const ids = documents.map((_, index) => `doc_${Date.now()}_${index}`);

      await this.collection.add({
        ids,
        documents,
        embeddings,
        metadatas,
      });

      console.log(`✅ Added ${documents.length} documents to ChromaDB`);
      return ids;
    } catch (error) {
      console.error("❌ Failed to add documents to ChromaDB:", error.message);
      throw error;
    }
  }

  async queryDocuments(query, nResults = 5) {
    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults,
      });

      return results;
    } catch (error) {
      console.error("❌ Failed to query ChromaDB:", error.message);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const count = await this.collection.count();
      return { documentCount: count };
    } catch (error) {
      console.error("❌ Failed to get collection stats:", error.message);
      throw error;
    }
  }
}

export default new DatabaseManager();
