import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Upload,
  FileText,
  Download
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { FileUploadZone } from "./FileUploadZone";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  files?: Array<{ name: string; type: string; size: number }>;
}

const welcomeMessages: Message[] = [
  {
    id: '1',
    type: 'bot',
    content: "🎓 Welcome to VIT AI Assistant! I'm here to help you navigate university life. Ask me about credits, policies, deadlines, or upload documents for analysis.",
    timestamp: new Date()
  },
  {
    id: '2',
    type: 'bot',
    content: "You can ask me questions like:\n• What are the credit requirements for my degree?\n• When is the next NPTEL registration deadline?\n• How do I apply for hostel accommodation?\n• What clubs are available this semester?",
    timestamp: new Date()
  }
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I understand you're asking about university policies. Let me help you with that information. This is a simulated response - in the full version, I would connect to the VIT knowledge base to provide accurate, up-to-date information.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (files: File[]) => {
    const fileData = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `Uploaded ${files.length} file(s) for analysis`,
      timestamp: new Date(),
      files: fileData
    };

    setMessages(prev => [...prev, userMessage]);
    setShowFileUpload(false);

    // Simulate processing
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `📄 I've received your files: ${files.map(f => f.name).join(', ')}. In the full version, I would analyze these documents and extract relevant information to help answer your questions.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-chat-bot rounded-2xl px-4 py-3 max-w-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Upload Zone */}
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about VIT policies, deadlines, or upload documents..."
                className="pr-24 min-h-[48px] resize-none rounded-xl border-2 focus:border-primary transition-smooth"
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
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
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{inputValue.length}/2000</span>
          </div>
        </div>
      </div>
    </div>
  );
}