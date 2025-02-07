"use client";
import Image from "next/image";
import "./style.css";
import Avvvatars from "avvvatars-react";

import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextArea,
} from "@/components/ui/chat-input";
import { useState } from "react";
import { toast } from "sonner";

function ChatInputDemo() {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast(value);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-[400px] h-full">
      <ChatInput
        variant="default"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={isLoading}
        onStop={() => setIsLoading(false)}
      >
        <ChatInputTextArea placeholder="Type a message..." />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
}

export { ChatInputDemo };

export default function Home() {
  return (
    <>
      <div className="container">
        <div className="eeonSpace">
          <div className="top">
            {" "}
            {/* <div className="answerContainer"></div> */}
            <div className="eeon">
              <div className="eeonTop">
                <div className="profilePic">
                  {" "}
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
                  <div className="tag">Reaction for reddit</div>
                  <div className="tag">Github discussion</div>
                  <div className="tag">Snippet videos</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bottom">
            {" "}
            <ChatInputDemo />
          </div>
        </div>
      </div>
    </>
  );
}
