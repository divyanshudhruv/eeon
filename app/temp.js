"use client";
import Image from "next/image";
import "./style.css";
import Avvvatars from "avvvatars-react";

import { useState, createContext, useContext } from "react";
import { toast } from "sonner";
import { useTextArea } from "@/context/TextAreaContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

async function gemeniRes(message, basePrompt) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const requestBody = {
      contents: [{ role: "user", parts: [{ text: basePrompt + message }] }],
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  } catch (error) {
    return "Error occurred.";
  }
}

let promptValue = ""; // Global variable to store the prompt value

const ChatInputContext = createContext({});

function ChatInput({
  children,
  className,
  variant = "default",
  value,
  onChange,
  onSubmit,
  loading,
  onStop,
}) {
  const contextValue = {
    value,
    onChange,
    onSubmit,
    loading,
    onStop,
    variant,
  };

  return (
    <ChatInputContext.Provider value={contextValue}>
      <div
        className={cn(
          variant === "default" &&
            "flex flex-col items-end w-full p-2 rounded-2xl border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring focus-within:outline-none",
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

function ChatInputTextArea({
  onSubmit: onSubmitProp,
  value: valueProp,
  onChange: onChangeProp,
  className,
  variant: variantProp,
  ...props
}) {
  const context = useContext(ChatInputContext);
  const value = valueProp ?? context.value ?? "";
  const onChange = onChangeProp ?? context.onChange;
  const onSubmit = onSubmitProp ?? context.onSubmit;

  const variant =
    variantProp ?? (context.variant === "default" ? "unstyled" : "default");

  const handleKeyDown = (e) => {
    if (!onSubmit) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return;
      }
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      {...props}
      value={value}
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

function ChatInputSubmit({
  onSubmit: onSubmitProp,
  loading: loadingProp,
  onStop: onStopProp,
  className,
  ...props
}) {
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
          onSubmit?.();
        }
      }}
      {...props}
    >
      <ArrowUpIcon />
    </Button>
  );
}

ChatInputSubmit.displayName = "ChatInputSubmit";

function ChatInputDemo({ setMessages }) {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { type: "user", text: "Building request..." },
    ]);

    const userBasePrompt =
      "STRICTLY: Make the prompt given shorter and do not use any emoji  return to the point prompt for up to 17 words or less but more than 12 words. If the user entered a specific site name, use the site name too.";
    const userShortPrompt = await gemeniRes(inputValue, userBasePrompt);

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { type: "user", text: userShortPrompt };
      return updated;
    });

    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Loading answer..." },
    ]);

    setTimeout(async () => {
      const botBaseAnswer =
        "STRICTLY:Give a short heading starting with # and then a line br space." +
        userShortPrompt;
      const prompt2 =
        "Try to find a best emoji for the prompt. Then give a short description about why you found the emoji good and why will it work (in maximum 30 words) and then again line space br.";
      const promptAnswer = botBaseAnswer + prompt2 + inputValue;
      const botResponse = await gemeniRes(
        promptAnswer,
        "Generate top 5 emoji based on this prompt."
      );

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "bot", text: botResponse };
        return updated;
      });

      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-[425px] h-full">
      <ChatInput
        variant="default"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={isLoading}
        onStop={() => setIsLoading(false)}
      >
        <ChatInputTextArea />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="container">
      <div className="eeonSpace">
        <div className="top">
          <div className="answerContainer" id="answerContainer">
            {messages.map((msg, index) => (
              <div className={msg.type === "user" ? "user" : "bot"} key={index}>
                <div className="user">
                  <div className="pfp">
                    <Avvvatars
                      value={
                        msg.type === "user" ? "qrwtwdqwe21uw" : "yehfe43g9aeon"
                      }
                      style="shape"
                      size={55}
                    />
                  </div>
                  <div className="prompt">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="eeon">
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
              <div className="tagsContainer"></div>
              <div className="tag">Dev.to comments</div>
              <div className="tag">Ask</div>
              <div className="tag">Reaction for reddit</div>
              <div className="tag">Github discussion</div>
              <div className="tag">Snippet videos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom">
        <ChatInputDemo setMessages={setMessages} />
      </div>
    </div>
  );
}
