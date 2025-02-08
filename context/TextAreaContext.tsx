"use client"; // Ensure this runs on the client side

import { createContext, useContext, useState, ReactNode } from "react";

type TextAreaContextType = {
  text: string;
  setText: (value: string) => void;
};

const TextAreaContext = createContext<TextAreaContextType | undefined>(undefined);

export function TextAreaProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");

  return (
    <TextAreaContext.Provider value={{ text, setText }}>
      {children}
    </TextAreaContext.Provider>
  );
}

export function useTextArea() {
  const context = useContext(TextAreaContext);
  if (!context) {
    throw new Error("useTextArea must be used within a TextAreaProvider");
  }
  return context;
}
