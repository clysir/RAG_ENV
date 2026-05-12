"use client";

import { useEffect, useState, useRef } from "react";
import {
  ArrowUp, Database, Loader2, Sparkles, BookOpen, MessageSquare, Check, Globe
} from "lucide-react";
import { multiKbChatApi, listKnowledgeBaseApi } from "@/lib/api";
import type { KnowledgeBase, ChatResponse } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
  model?: string;
  timestamp: Date;
}

export default function GlobalChatPage() {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [selectedKbs, setSelectedKbs] = useState<number[]>([]);
  const [showKbSelect, setShowKbSelect] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatTopK, setChatTopK] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    listKnowledgeBaseApi().then((data) => {
      setKbs(data);
      // Default to empty array = global search
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatting]);

  function toggleKb(kbId: number) {
    if (selectedKbs.includes(kbId)) {
      setSelectedKbs(selectedKbs.filter((id) => id !== kbId));
    } else {
      setSelectedKbs([...selectedKbs, kbId]);
    }
  }

  async function handleChat() {
    const q = chatInput.trim();
    if (!q || chatting) return;
    
    setMessages((p) => [...p, { role: "user", content: q, timestamp: new Date() }]);
    setChatInput(""); 
    setChatting(true); 
    setError("");

    try {
      const res = await multiKbChatApi({
        question: q,
        kbIds: selectedKbs.length > 0 ? selectedKbs : undefined,
        topK: chatTopK
      });
      
      setMessages((p) => [...p, {
        role: "assistant", 
        content: res.answer,
        sources: res.sources, 
        model: res.model, 
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages((p) => [...p, {
        role: "assistant", 
        content: `❌ ${err instanceof Error ? err.message : "请求失败"}`,
        timestamp: new Date(),
      }]);
    } finally {
      setChatting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Globe className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">全局问答</h1>
            <p className="text-xs text-[var(--text-tertiary)]">跨多个知识库进行问答检索</p>
          </div>
        </div>
        
        {/* KB Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowKbSelect(!showKbSelect)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Database className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            {selectedKbs.length === 0 ? "全部知识库" : `已选 ${selectedKbs.length} 个知识库`}
          </button>
          
          {showKbSelect && (
            <div className="absolute right-0 top-full mt-2 w-64 animate-fade-in rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 shadow-2xl z-50">
              <div className="mb-2 px-2 pb-2 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                选择要检索的知识库（不选则检索全部）
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {kbs.map((kb) => (
                  <button
                    key={kb.id}
                    onClick={() => toggleKb(kb.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <span className="truncate pr-4">{kb.name}</span>
                    {selectedKbs.includes(kb.id) && <Check className="h-3.5 w-3.5 text-[var(--accent-blue)] shrink-0" />}
                  </button>
                ))}
                {kbs.length === 0 && (
                  <p className="py-4 text-center text-xs text-[var(--text-tertiary)]">暂无知识库</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-xl font-semibold">全局知识检索</h2>
              <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-[var(--text-tertiary)]">
                你可以向所有的知识库提问，系统会自动从相关文档中检索信息并生成回答。
              </p>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <div className="w-full max-w-4xl space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-sm shadow-purple-500/20">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user"
                    ? "rounded-2xl bg-[var(--bg-tertiary)] px-5 py-3.5 text-sm text-[var(--text-primary)]"
                    : ""}`}>
                    {msg.role === "assistant" ? (
                      <div>
                        <div className="markdown-content whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
                          {msg.content}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-medium text-[var(--text-tertiary)]">
                              <BookOpen className="mr-1 inline h-3 w-3" />引用来源
                            </p>
                            {msg.sources.map((s, si) => (
                              <div key={si} className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
                                <span className="font-medium text-[var(--text-secondary)]">
                                  [{si + 1}] {s.file_name || "未知文件"} (KB: {s.kb_id || "未知"})
                                </span>
                                {s.chunk_index != null && <span className="ml-2">chunk #{s.chunk_index}</span>}
                                {typeof s.score === "number" && (
                                  <span className="ml-2">相关度 {(s.score * 100).toFixed(1)}%</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.model && (
                          <p className="mt-2 text-xs text-[var(--text-tertiary)]">模型: {msg.model}</p>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {chatting && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-6 py-5">
          <div className="flex w-full justify-center">
            <div className="w-full max-w-4xl">
            <div className="flex items-end gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 transition-colors focus-within:border-[var(--border-light)]">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="在此输入问题..."
                rows={1}
                className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
              />
              <button onClick={handleChat} disabled={chatting || !chatInput.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] transition-all hover:opacity-80 disabled:opacity-30">
                {chatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
              <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">
                全局多知识库检索问答 · Top K: {chatTopK}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Click-away handler for popover */}
      {showKbSelect && (
        <div className="fixed inset-0 z-40" onClick={() => setShowKbSelect(false)} />
      )}
    </div>
  );
}
