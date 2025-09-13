import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Mic, Smile } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { FileUploadZone } from "./FileUploadZone";
import { apiService, type ChatMessage as ApiChatMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  files?: Array<{ name: string; type: string; size: number }>;
  sources?: Array<{ fileName: string; chunkIndex: number }>;
}

const welcomeMessages: Message[] = [
  {
    id: "1",
    type: "bot",
    content:
      "🎓 Welcome to VIT AI Assistant! I'm here to help you navigate university life. Ask me about credits, policies, deadlines, or upload documents for analysis.",
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "bot",
    content:
      "You can ask me questions like:\n• What are the credit requirements for my degree?\n• When is the next NPTEL registration deadline?\n• How do I apply for hostel accommodation?\n• What clubs are available this semester?",
    timestamp: new Date(),
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [userId] = useState(
    () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use this ref to access the **viewport inside ScrollArea**
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto scroll effect
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Create session if not exists
      if (!sessionId) {
        const session = await apiService.createChatSession(userId);
        setSessionId(session.sessionId);
      }

      // Send message to API
      const response = await apiService.sendMessage(
        userId,
        currentInput,
        sessionId || undefined
      );

      const botMessage: Message = {
        id: response.message.id,
        type: "bot",
        content: response.message.content,
        timestamp: new Date(response.message.timestamp),
        sources: response.message.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const fileData = files.map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `Uploaded ${files.length} file(s) for analysis`,
      timestamp: new Date(),
      files: fileData,
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowFileUpload(false);
    setIsLoading(true);

    try {
      if (files.length === 1) {
        // Single file upload
        const response = await apiService.uploadDocument(files[0]);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `📄 Successfully processed "${response.fileName}". Generated ${response.chunksProcessed} chunks and ${response.embeddingsGenerated} embeddings. The document is now searchable!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Multiple file upload
        const response = await apiService.uploadMultipleDocuments(files);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `📄 Processed ${response.processed} files successfully. ${response.errors} files had errors. The documents are now searchable!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Failed to upload files:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process uploaded files. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Sorry, I encountered an error processing your files. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        {/* Give the viewport a ref */}
        <div ref={viewportRef} className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-chat-bot rounded-2xl px-4 py-3 max-w-xs animate-pulse">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Upload */}
      {showFileUpload && (
        <div className="p-4 border-t">
          <FileUploadZone
            onFileUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about VIT policies, deadlines..."
              className="pr-24 min-h-[48px] rounded-xl border-2 focus:border-primary transition-smooth"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
