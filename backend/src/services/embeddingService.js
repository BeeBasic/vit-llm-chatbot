import OpenAI from "openai";
import { config } from "dotenv";

config();

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "text-embedding-3-small"; // Cost-effective model
    this.batchSize = 100; // Process embeddings in batches
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("❌ Failed to generate embedding:", error.message);
      throw error;
    }
  }

  async generateEmbeddingsBatch(texts) {
    try {
      const batches = this.createBatches(texts, this.batchSize);
      const allEmbeddings = [];

      for (const batch of batches) {
        console.log(`🔄 Processing embedding batch: ${batch.length} texts`);

        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
          encoding_format: "float",
        });

        allEmbeddings.push(...response.data.map((item) => item.embedding));

        // Add small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Generated ${allEmbeddings.length} embeddings`);
      return allEmbeddings;
    } catch (error) {
      console.error("❌ Failed to generate embeddings batch:", error.message);
      throw error;
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async processChunksWithEmbeddings(chunks) {
    try {
      console.log(`🔄 Processing ${chunks.length} chunks for embeddings...`);

      const texts = chunks.map((chunk) => chunk.content);
      const embeddings = await this.generateEmbeddingsBatch(texts);

      // Combine chunks with their embeddings
      const processedChunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      }));

      return processedChunks;
    } catch (error) {
      console.error(
        "❌ Failed to process chunks with embeddings:",
        error.message
      );
      throw error;
    }
  }

  // Calculate similarity between two embeddings (cosine similarity)
  calculateSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same length");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

export default new EmbeddingService();
