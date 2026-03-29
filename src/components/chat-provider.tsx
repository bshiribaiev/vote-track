"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ChatWidget } from "./chat-widget";

interface PageContext {
  type?: string;
  candidateId?: string;
  electionId?: string;
  suggestedQuestions?: string[];
}

const ChatContext = createContext<{
  setPageContext: (ctx: PageContext) => void;
}>({
  setPageContext: () => {},
});

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<PageContext>({});

  return (
    <ChatContext.Provider value={{ setPageContext }}>
      {children}
      <ChatWidget pageContext={pageContext} />
    </ChatContext.Provider>
  );
}
