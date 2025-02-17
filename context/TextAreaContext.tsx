"use client"; // Ensure this runs on the client side

import { createContext, useContext, useState, ReactNode } from "react";
import { useMemo } from "react";

type TextAreaContextType = {
  text: string;
  setText: (value: string) => void;
};

const TextAreaContext = createContext<TextAreaContextType | undefined>(undefined);

export function TextAreaProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [text, setText] = useState("");

  const value = useMemo(() => ({ text, setText }), [text]);

  return (
    <TextAreaContext.Provider value={value}>
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
