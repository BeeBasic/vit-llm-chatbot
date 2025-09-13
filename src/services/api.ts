const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: string;
  sources?: Array<{
    fileName: string;
    chunkIndex: number;
  }>;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
}

export interface SearchResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    chunkIndex: number;
    similarity: number;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Chat API
  async createChatSession(userId: string): Promise<ChatSession> {
    return this.request<ChatSession>("/chat/session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getChatHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    hasMore: boolean;
  }> {
    return this.request(
      `/chat/session/${userId}/history?limit=${limit}&offset=${offset}`
    );
  }

  async sendMessage(
    userId: string,
    message: string,
    sessionId?: string
  ): Promise<{
    message: ChatMessage;
    context: {
      retrievedDocuments: number;
      sources: Array<{ fileName: string; chunkIndex: number }>;
    };
  }> {
    return this.request("/chat/message", {
      method: "POST",
      body: JSON.stringify({ userId, message, sessionId }),
    });
  }

  async clearChatSession(userId: string): Promise<{ message: string }> {
    return this.request(`/chat/session/${userId}`, {
      method: "DELETE",
    });
  }

  async searchDocuments(
    query: string,
    limit = 5
  ): Promise<{
    query: string;
    results: SearchResult[];
    total: number;
  }> {
    return this.request("/chat/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // Document API
  async uploadDocument(file: File): Promise<{
    message: string;
    fileName: string;
    chunksProcessed: number;
    embeddingsGenerated: number;
  }> {
    const formData = new FormData();
    formData.append("document", file);

    return this.request("/documents/upload", {
      method: "POST",
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async uploadMultipleDocuments(files: File[]): Promise<{
    message: string;
    processed: number;
    errors: number;
    results: Array<{
      fileName: string;
      chunksProcessed: number;
      status: string;
    }>;
    errors: Array<{
      fileName: string;
      error: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });

    return this.request("/documents/upload-multiple", {
      method: "POST",
      headers: {},
      body: formData,
    });
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    lastUpdated: string;
    vectorStore: string;
    status: string;
  }> {
    return this.request("/documents/stats");
  }

  async searchDocuments(
    query: string,
    limit = 10
  ): Promise<{
    query: string;
    results: SearchResult[];
    total: number;
  }> {
    return this.request("/documents/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // Health check
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    services: {
      database: string;
      vectorStore: string;
      documentCount: number;
    };
  }> {
    return this.request("/health");
  }
}

export const apiService = new ApiService();
