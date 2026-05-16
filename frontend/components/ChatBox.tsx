"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

interface Props {
  noticeId: string;
}

const INITIAL_MESSAGE: Message = {
  role:    "assistant",
  content: "I have read this notice. Ask me anything about it!"
};

export default function ChatBox({ noticeId }: Props) {
  const [messages,  setMessages]  = useState<Message[]>([INITIAL_MESSAGE]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // reset chat when notice changes
  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  }, [noticeId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // add user message instantly
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          notice_id: noticeId,
          question:  userMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to get answer");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer }
      ]);

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role:    "assistant",
          content: "Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
      // re-focus input after response
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/chat/${noticeId}`, {
        method: "DELETE"
      });
    } catch (err) {
      // silently fail — UI reset is more important
    } finally {
      setMessages([INITIAL_MESSAGE]);
      setInput("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">

      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">💬 Ask Questions</h2>
          <p className="text-xs text-gray-400">Ask anything about this notice</p>
        </div>
        <button
          onClick={clearChat}
          disabled={isLoading || messages.length <= 1}
          className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          🗑️ Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-2 rounded-2xl text-sm
                ${msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
                }
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask about deadlines, fees, requirements..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}