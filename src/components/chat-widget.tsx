"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Profile } from "@/lib/types/database";

function ThinkingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-muted-foreground font-mono">
      {".".repeat(dots)}
    </span>
  );
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
}

interface PageContext {
  type?: string;
  candidateId?: string;
  electionId?: string;
  suggestedQuestions?: string[];
}

export function ChatWidget({ pageContext }: { pageContext?: PageContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(192);
  const isDraggingSidebar = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate persisted state from localStorage
  useEffect(() => {
    const sidebar = localStorage.getItem("chat-sidebar");
    if (sidebar !== null) setShowSidebar(sidebar !== "false");
    const width = localStorage.getItem("chat-sidebar-width");
    if (width) setSidebarWidth(parseInt(width, 10));
  }, []);

  // Load profile and sessions
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(20),
      ]);

      setProfile(profileRes.data);
      setSessions(sessionsRes.data || []);
    });
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setFollowUpQuestions([]);
      return;
    }

    const supabase = createClient();

    // Load messages and cached follow-ups in parallel
    Promise.all([
      supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("chat_sessions")
        .select("follow_up_questions")
        .eq("id", activeSessionId)
        .single(),
    ]).then(([messagesRes, sessionRes]) => {
      setMessages(
        (messagesRes.data || []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setFollowUpQuestions(sessionRes.data?.follow_up_questions || []);
    });
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        page_context: pageContext || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create session:", error);
      return null;
    }

    if (data) {
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      return data.id;
    }
    return null;
  }, [pageContext]);

  const saveMessage = useCallback(
    async (sessionId: string, role: string, content: string) => {
      const supabase = createClient();
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role,
        content,
      });
      // Update session timestamp
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    },
    []
  );

  const updateSessionTitle = useCallback(
    async (sessionId: string, firstMessage: string) => {
      const title =
        firstMessage.length > 50
          ? firstMessage.slice(0, 50) + "..."
          : firstMessage;
      const supabase = createClient();
      await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      );
    },
    []
  );

  async function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    setInput("");
    setFollowUpQuestions([]);
    if (inputRef.current) inputRef.current.style.height = "38px";
    setIsStreaming(true);

    let sessionId = activeSessionId;
    const isNewSession = !sessionId;

    if (!sessionId) {
      sessionId = await createSession();
      if (!sessionId) {
        setIsStreaming(false);
        return;
      }
    }

    // Capture current messages before adding new ones
    const priorMessages = [...messages];

    // Add user message to UI
    const userMsg: ChatMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage(sessionId, "user", messageText);

    // Auto-title on first message
    if (isNewSession) {
      updateSessionTitle(sessionId, messageText);
    }

    // Add placeholder for assistant
    const assistantMsg: ChatMessage = { role: "assistant", content: "", sources: [] };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          sessionMessages: priorMessages.slice(-10),
          pageContext,
          userProfile: profile,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: Array<{ title: string; url: string }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const json = JSON.parse(line.replace("data: ", ""));

          if (json.type === "text") {
            fullContent += json.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullContent,
                sources,
              };
              return updated;
            });
          } else if (json.type === "sources") {
            sources = json.sources;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                sources,
              };
              return updated;
            });
          } else if (json.type === "followUp") {
            setFollowUpQuestions(json.questions);
            // Cache in DB
            if (sessionId) {
              const supabase = createClient();
              supabase
                .from("chat_sessions")
                .update({ follow_up_questions: json.questions })
                .eq("id", sessionId)
                .then(() => {});
            }
          } else if (json.type === "error") {
            fullContent = json.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullContent,
              };
              return updated;
            });
          }
        }
      }

      await saveMessage(sessionId, "assistant", fullContent);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    }

    setIsStreaming(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setIsMaximized(false);
  }

  const suggestedQuestions = pageContext?.suggestedQuestions || [];

  return (
    <div suppressHydrationWarning>
      {/* Bubble */}
      <button
        onClick={handleOpen}
        style={{
          transform: isOpen ? "scale(0)" : "scale(1)",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
        }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      </button>

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          width: isMaximized ? "calc(100vw - 48px)" : "min(45vw, 700px)",
          height: isMaximized ? "calc(100vh - 48px)" : "75vh",
          transform: isOpen ? "scale(1)" : "scale(0.95)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transformOrigin: "bottom right",
          transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), width 400ms cubic-bezier(0.16, 1, 0.3, 1), height 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !showSidebar;
              setShowSidebar(next);
              localStorage.setItem("chat-sidebar", String(next));
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="font-semibold text-sm">VoteTrack AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div
            className="border-r bg-gray-50/50 flex flex-col overflow-hidden shrink-0 relative"
            style={{ width: sidebarWidth, minWidth: 140, maxWidth: 300 }}
          >
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setActiveSessionId(null);
                  setMessages([]);
                }}
              >
                + New chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center rounded-lg mb-0.5 transition-colors ${
                    activeSessionId === session.id
                      ? "bg-primary/10"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex-1 text-left px-3 py-2 text-xs truncate ${
                      activeSessionId === session.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {session.title || "New conversation"}
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const supabase = createClient();
                      await supabase.from("chat_sessions").delete().eq("id", session.id);
                      setSessions((prev) => prev.filter((s) => s.id !== session.id));
                      if (activeSessionId === session.id) {
                        setActiveSessionId(null);
                        setMessages([]);
                        setFollowUpQuestions([]);
                      }
                    }}
                    className="shrink-0 p-1.5 mr-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
            {/* Drag handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingSidebar.current = true;
                const startX = e.clientX;
                const startWidth = sidebarWidth;

                const onMouseMove = (e: MouseEvent) => {
                  if (!isDraggingSidebar.current) return;
                  const newWidth = Math.min(300, Math.max(140, startWidth + (e.clientX - startX)));
                  setSidebarWidth(newWidth);
                };

                const onMouseUp = () => {
                  isDraggingSidebar.current = false;
                  localStorage.setItem("chat-sidebar-width", String(sidebarWidth));
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
            />
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary text-lg font-bold">V</span>
                </div>
                <p className="font-semibold mb-1">VoteTrack AI</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                  Ask me anything about elections, candidates, or voting in NYC.
                </p>
                {suggestedQuestions.length > 0 && (
                  <div className="space-y-2 w-full max-w-[280px]">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:underline [&_a]:text-primary [&_table]:w-full [&_table]:text-xs [&_th]:bg-gray-200 [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_th]:text-left [&_tr]:border-b [&_br]:block [&_br]:mt-3 [&_hr]:my-4 [&_hr]:border-gray-200">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <ThinkingDots />
                    )
                  ) : (
                    <p>{msg.content}</p>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Sources:
                      </p>
                      <div className="space-y-0.5">
                        {msg.sources.map((s, j) => (
                          <a
                            key={j}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary underline truncate"
                          >
                            {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested follow-ups — sticky above input */}
          {messages.length > 0 &&
            !isStreaming &&
            followUpQuestions.length > 0 && (
              <div className="px-4 py-2 flex gap-1.5 flex-wrap">
                {followUpQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-2.5 py-1 rounded-full border hover:border-primary/30 hover:bg-primary/5 transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

          {/* Input */}
          <div className="border-t px-4 py-3">
            <div className="flex items-stretch gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-expand
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 72) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about elections, candidates..."
                className="flex-1 resize-none rounded-xl border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                style={{ height: "38px", maxHeight: "72px" }}
                rows={1}
                disabled={isStreaming}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="shrink-0 rounded-xl bg-primary text-primary-foreground px-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
