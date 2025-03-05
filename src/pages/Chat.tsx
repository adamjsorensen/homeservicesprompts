import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronLeft,
  Settings
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
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const AVAILABLE_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", description: "Efficient, cost-effective model" },
  { id: "openai/gpt-4o", name: "GPT-4o", description: "Latest OpenAI model with enhanced capabilities" },
  { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and economical" }
];

export default function Chat() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const actions = [
    { icon: FileText, label: "Research", onClick: () => console.log("Research") },
    { icon: Lightbulb, label: "Brainstorm", onClick: () => console.log("Brainstorm") },
    { icon: LineChart, label: "Analyze Data", onClick: () => console.log("Analyze") },
    { icon: ImageIcon, label: "Create images", onClick: () => console.log("Create images") },
    { icon: Code, label: "Code", onClick: () => console.log("Code") },
  ];

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const apiMessages = [
        { role: "system", content: "You are a helpful assistant." },
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: userMessage.role, content: userMessage.content }
      ];
      
      const assistantMessageId = Date.now().toString() + "-assistant";
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date()
      }]);
      
      console.log("Sending chat request:", {
        model,
        messageCount: apiMessages.length,
        streaming: true,
        userAuthenticated: !!user?.id,
        lastUserMessage: userMessage.content.substring(0, 50)
      });
      
      const response = await supabase.functions.invoke("chat-completion", {
        body: {
          messages: apiMessages,
          model,
          userId: user?.id,
          streaming: true
        }
      });
      
      console.log("Supabase function response received:", {
        hasError: !!response.error,
        errorMessage: response.error?.message,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataProperties: response.data ? Object.keys(response.data) : []
      });
      
      if (response.error) {
        console.error("Supabase function error:", response.error);
        throw new Error(response.error.message);
      }

      if (abortControllerRef.current?.signal.aborted) {
        console.log("Request was aborted before processing response");
        return;
      }

      if (!response.data) {
        console.error("Response data is null or undefined");
        throw new Error("No data received from function");
      }
      
      console.log("Response stream inspection:", {
        type: typeof response.data,
        isReadableStream: response.data instanceof ReadableStream,
        hasGetReader: typeof response.data.getReader === 'function'
      });
      
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Request was aborted during stream processing");
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream reading complete");
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        console.log("Received chunk:", { 
          chunkSize: value?.length, 
          bufferSize: buffer.length,
          chunkPreview: chunk.substring(0, 50) + '...'
        });
        
        let lineEnd;
        while ((lineEnd = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 2);
          
          console.log("Processing event:", { 
            eventLength: event.length, 
            eventPreview: event.substring(0, 50) + '...',
            remainingBuffer: buffer.length
          });
          
          if (event.startsWith('data: ')) {
            const data = event.slice(6);
            
            if (data === '[DONE]') {
              console.log('Received [DONE] event');
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              console.log("Parsed SSE data:", { 
                id: parsedData.id?.substring(0, 8) + '...',
                hasChoices: !!parsedData.choices,
                firstChoice: parsedData.choices?.[0] ? 'present' : 'missing',
                deltaContent: parsedData.choices?.[0]?.delta?.content 
                  ? parsedData.choices[0].delta.content.substring(0, 30) + '...' 
                  : 'missing'
              });
              
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                setMessages(prev => {
                  const newMessages = prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + parsedData.choices[0].delta.content }
                      : msg
                  );
                  
                  console.log("Updated message state:", {
                    messageCount: newMessages.length,
                    lastMessageId: newMessages[newMessages.length - 1].id,
                    lastMessagePreview: newMessages[newMessages.length - 1].content.substring(
                      Math.max(0, newMessages[newMessages.length - 1].content.length - 50)
                    )
                  });
                  
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Data:", data);
            }
          } else if (event.startsWith(':')) {
            console.log('OpenRouter processing comment:', event);
          } else if (event.includes('error')) {
            console.error('Error in stream:', event);
            try {
              const errorData = JSON.parse(event);
              toast.error(`Error: ${errorData.error || 'Unknown error'}`);
            } catch (e) {
              console.error('Error parsing error event:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error, "Stack:", error.stack);
      toast.error("Failed to send message: " + (error.message || "Unknown error"));
      
      setMessages(prev => prev.filter(msg => msg.role !== "assistant" || msg.content !== ""));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info("Response generation stopped");
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
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
        
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Model Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Model Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  Select the AI model to use for chat responses.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Save Changes</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center space-y-4 flex-grow flex flex-col justify-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Good {getTimeOfDay()}{user?.email ? `, ${user.email.split('@')[0]}` : ''}.
          </h1>
          <p className="text-3xl text-muted-foreground">
            How can I help you today?
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
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
        </div>
      ) : (
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-6">
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
                  {message.content ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  )}
                  
                  {message.role === "assistant" && message.content && (
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
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help?"
            className="pr-24 py-6 text-lg"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="absolute right-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isLoading}>
              <PaperclipIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isLoading}>
              <Link2 className="h-5 w-5" />
            </Button>
            {isLoading ? (
              <Button 
                onClick={stopGeneration}
                size="icon"
                className="h-9 w-9"
                variant="destructive"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={sendMessage}
                size="icon"
                className="h-9 w-9"
                disabled={!input.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
