import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Brain,
  Code,
  FileText,
  ImageIcon,
  Link2,
  Lightbulb,
  LineChart,
  PaperclipIcon,
  Send,
  ThumbsDown,
  ThumbsUp,
  Share2,
  RotateCcw,
  ChevronLeft
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function Chat() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  const actions = [
    { icon: FileText, label: "Research", onClick: () => console.log("Research") },
    { icon: Lightbulb, label: "Brainstorm", onClick: () => console.log("Brainstorm") },
    { icon: LineChart, label: "Analyze Data", onClick: () => console.log("Analyze") },
    { icon: ImageIcon, label: "Create images", onClick: () => console.log("Create images") },
    { icon: Code, label: "Code", onClick: () => console.log("Code") },
  ];

  const sendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    // TODO: Implement actual message sending logic
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2" 
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Good morning{user?.email ? `, ${user.email.split('@')[0]}` : ''}.
        </h1>
        <p className="text-3xl text-muted-foreground">
          How can I help you today?
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent"
            onClick={action.onClick}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p>{message.content}</p>
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help?"
            className="pr-24 py-6 text-lg"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="absolute right-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <PaperclipIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Link2 className="h-5 w-5" />
            </Button>
            <Button 
              onClick={sendMessage}
              size="icon"
              className="h-9 w-9"
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
