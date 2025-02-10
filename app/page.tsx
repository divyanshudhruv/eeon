"use client";
import "./style.css";
import Avvvatars from "avvvatars-react";
import { useState, useRef, useEffect } from "react";
import { incrementPageView } from "./../lib/actions";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import React from "react";
import { createContext, useContext } from "react";

import { logVisitor } from "../lib/actions";
import { logClick } from "../lib/actions";

interface GeminiRequestBody {
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function gemeniRes(message: string, basePrompt: string): Promise<string> {
  try {
    const apiKey: string | undefined = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Get Gemini API Key from environment
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const requestBody: GeminiRequestBody = {
      contents: [{ role: "user", parts: [{ text: basePrompt + message }] }],
    };

    const res: Response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data: GeminiResponse = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  } catch (error) {
    return "Error occurred." + error;
  }
}

// UI components from 21st.dev
//=========================================================
interface ChatInputContextValue {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: () => void;
  loading?: boolean;
  onStop?: () => void;
  variant?: "default" | "unstyled";
}

const ChatInputContext = createContext<ChatInputContextValue>({});

interface ChatInputProps extends Omit<ChatInputContextValue, "variant"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "unstyled";
}

function ChatInput({
  children,
  className,
  variant = "default",
  value,
  onChange,
  onSubmit,
  loading,
  onStop,
}: ChatInputProps) {
  const contextValue: ChatInputContextValue = {
    value,
    onChange,
    onSubmit,
    loading,
    onStop,
    variant,
  };

  return (
    <ChatInputContext.Provider value={contextValue}>
      {/*BG WHITE - BG  TRANSPARENT */}
      <div
        className={cn(
          variant === "default" &&
            "flex flex-col items-end w-full p-2 rounded-2xl border border-input bg-white focus-within:ring-1 focus-within:ring-ring focus-within:outline-none",
          variant === "unstyled" && "flex items-start gap-2 w-full",
          className
        )}
      >
        {children}
      </div>
    </ChatInputContext.Provider>
  );
}

ChatInput.displayName = "ChatInput";

interface ChatInputTextAreaProps extends React.ComponentProps<typeof Textarea> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: () => void;
  variant?: "default" | "unstyled";
}

function ChatInputTextArea({
  onSubmit: onSubmitProp,
  value: valueProp,
  onChange: onChangeProp,
  className,
  variant: variantProp,
  ...props
}: ChatInputTextAreaProps) {
  const context = useContext(ChatInputContext);
  const value = valueProp ?? context.value ?? "";
  const onChange = onChangeProp ?? context.onChange;
  const onSubmit = onSubmitProp ?? context.onSubmit;

  // Convert parent variant to textarea variant unless explicitly overridden
  const variant =
    variantProp ?? (context.variant === "default" ? "unstyled" : "default");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!onSubmit) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      if (typeof value !== "string" || value.trim().length === 0) {
        // Prevent sending empty messages

        return;
      }
      e.preventDefault();
      onSubmit();
      logClick(); // Track user click
    }
  };

  return (
    <Textarea
      {...props}
      value={value}
      placeholder="Type or paste your prompt here..."
      onChange={onChange}
      onKeyDown={handleKeyDown}
      style={{ resize: "none", scrollbarWidth: "none" }}
      spellCheck={false}
      className={cn(
        "max-h-[450px] min-h-0 resize-none overflow-x-hidden",
        variant === "unstyled" &&
          "border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
        className
      )}
    />
  );
}

ChatInputTextArea.displayName = "ChatInputTextArea";

interface ChatInputSubmitProps extends React.ComponentProps<typeof Button> {
  onSubmit?: () => void; // Submit button
  loading?: boolean;
  onStop?: () => void; // Stop button
}

function ChatInputSubmit({
  onSubmit: onSubmitProp,
  loading: loadingProp,
  onStop: onStopProp,
  className,
  ...props
}: ChatInputSubmitProps) {
  const context = useContext(ChatInputContext);
  const loading = loadingProp ?? context.loading;
  const onStop = onStopProp ?? context.onStop;
  const onSubmit = onSubmitProp ?? context.onSubmit;

  if (loading && onStop) {
    return (
      <Button
        onClick={onStop}
        className={cn(
          "shrink-0 rounded-full p-1.5 h-fit border dark:border-zinc-600",
          className
        )}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Stop"
        >
          <title>Stop</title>
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      </Button>
    );
  }

  const isDisabled =
    typeof context.value !== "string" || context.value.trim().length === 0;

  return (
    <Button
      className={cn(
        "shrink-0 rounded-full p-1.5 h-fit border dark:border-zinc-600",
        className
      )}
      disabled={isDisabled}
      onClick={(event) => {
        event.preventDefault();
        if (!isDisabled) {
          onSubmit?.(); // Submit button
          logClick(); // Track user click
        }
      }}
      {...props}
    >
      <ArrowUpIcon />
    </Button>
  );
}

ChatInputSubmit.displayName = "ChatInputSubmit";

interface Message {
  id: number;
  type: "user" | "bot";
  content: string;
}

interface ChatInputDemoProps {
  onNewMessage: (message: Message) => void;
}

const ChatInputDemo: React.FC<ChatInputDemoProps> = ({ onNewMessage }) => {
  const [value, setValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = () => {
    const eeonDiv = document.getElementById("eeonDiv"); // Get eeon div
    if (eeonDiv) {
      eeonDiv.style.animation = "eeonOut 0.5s forwards"; //  Hide eeon div
    }

    setTimeout(() => {
      const answerContainer = document.getElementById("answerContainer");
      if (answerContainer) {
        answerContainer.style.display = "flex"; // Show answer container
      }
      if (!value.trim()) return; // Prevent sending empty messages
      setIsLoading(true);

      const userMessage: Message = {
        id: Date.now(), // Get current date
        type: "user",
        content: value,
      };

      onNewMessage(userMessage); // Add user message to UI
      setValue(""); // Clear input field

      setTimeout(async () => {
        setIsLoading(true);
        const formatBotResponse = (response: string) => {
          // Function to format RAW bot response
          return response
            .split("\n")
            .map((line) => {
              if (line.startsWith("#")) {
                // Heading
                return `<p style="font-size: 26px;"><b>${line
                  .substring(1)
                  .trim()}</b></p>`;
              } else if (line.startsWith(">")) {
                // Emoji list
                return `<pre style="background-color: #f5f5f5; padding: 8px; border-radius: 6px; font-size: 22px; text-align: center; margin: 5px 0; display: flex;line-break:anywhere;text-warp:pre;">${line
                  .substring(1)
                  .trim()}</pre>`; // Emoji block
              } else {
                return `<p>${line.trim()}</p>`; // Default text
              }
            })
            .join(""); // Join to keep content as a string
        };

        // Get bot response
        const botAnswer = await gemeniRes(
          // Use actual response + prompt
          value,
          `Analyze the given promptabove according to  these points and generate the most relevant emojis for context representation. Follow these strict guidelines:

1️. Validation:
ANSWER EVERY DETAILED AND LONG QUESTIONS NO MATTER WHAT THEY ASK
The emojis must be contextually relevant and align with the original prompt's intent only.


2️. Response Structure:
A short, meaningful heading starting with # (summarizes the prompt in 2-5 words).
A concise explanation (max 30 words) explaining why the selected emojis are relevant. 🚫 No emojis in this explanation.
A list of best-suited emojis for the context starting with >. Each emoji must be on a new line and separated by exactly 2 spaces. Maximum 4 emojies allowed

3️. Example Output:
# Groundbreaking Innovation  

This breakthrough is set to change the industry and improve efficiency.  

> 🚀   🌟   🔥  

4️ Language: Strictly English.

5. IMPORTANT:
The emojis must be contextually relevant and align with the original prompt's intent only.
If no suitable emojis exist, DO NOT force irrelevant ones and of different color theme.
Ensure clear line breaks and correct formatting.

6.VERY IMPORTANT VALIDATION:
`
        );

        const botMessage: Message = {
          id: Date.now(),
          type: "bot",
          content: formatBotResponse(botAnswer), // Use actual response
        };

        onNewMessage(botMessage); // Add bot message after delay
        setIsLoading(false); // Stop loading (button active)
      }, 1000);
    }, 500);
  };

  return (
    <div className="w-full max-w-[425px] h-fit">
      <ChatInput
        variant="default"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={isLoading}
        onStop={() => setIsLoading(false)}
      >
        <ChatInputTextArea />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
};
//=========================================================

interface Message {
  id: number;
  type: "user" | "bot";
  content: string;
}

export default function Home() {
  useEffect(() => {
    logVisitor(); // Log visitor (neondb)
  }, []);
  useEffect(() => {
    incrementPageView(); // Increment page view (neondb)
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleNewMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]); // Add new message to the list
  };

  useEffect(() => {
    // Scroll to the latest message when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to the latest message
  }, [messages]);

  return (
    <>
      <div className="container">
        <div className="eeonSpace">
          <div className="top">
            <div className="answerContainer" id="answerContainer">
              {messages.map((msg) =>
                msg.type === "user" ? (
                  <div key={msg.id} className="user">
                    <div className="pfp">
                      <Avvvatars
                        value="qrwtwdqwe21uw"
                        style="shape"
                        size={55}
                      />
                    </div>
                    <div className="prompt">{msg.content}</div>
                  </div>
                ) : (
                  <div key={msg.id} className="bot">
                    <div className="index">
                      <div className="pfp">
                        <Avvvatars
                          value="yehfe43g9aeon"
                          style="shape"
                          size={55}
                        />
                      </div>
                      <div className="prompt">
                        <span>Finding the best emojis for you...</span>
                      </div>
                    </div>
                    <div
                      className="answer"
                      id="botAnswer"
                      dangerouslySetInnerHTML={{ __html: msg.content }} // Render HTML content strictly
                    ></div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="eeon" id="eeonDiv">
              <div className="eeonTop">
                <div className="profilePic">
                  <Avvvatars value="yehfe43g9aeon" style="shape" size={100} />
                </div>

                <div className="textTop">Talk data to me</div>
                <div className="textBottom">
                  Write your own prompt or select from the template and start
                  chatting with eeon
                </div>
              </div>
              <div className="eeonBottom">
                <div className="textBottom">Ask about:</div>
                <div className="tagsContainer">
                  <div className="tag">Dev.to comments</div>
                  <div className="tag">Ask</div>
                  <div className="tag">Reaction for Reddit</div>
                  <div className="tag">GitHub discussion</div>
                  <div className="tag">Snippet videos</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom">
            <ChatInputDemo onNewMessage={handleNewMessage} />
          </div>
        </div>
      </div>
      {/* <div className="backHome" onClick={window.location.reload}>
        <ArrowLeft color="#ffffff" size={18}/>
      </div> */}
    </>
  );
}
