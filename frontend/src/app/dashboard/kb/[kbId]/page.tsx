"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ArrowUp, Database, FileText, Loader2, MessageSquare,
  Search, Upload, RefreshCw, CheckCircle, AlertCircle,
  Clock, ChevronDown, Sparkles, BookOpen, X, File,
} from "lucide-react";
import {
  getKnowledgeBaseApi, uploadDocumentsApi, processDocumentApi,
  getDocumentStatusApi, queryKnowledgeBaseApi, chatKnowledgeBaseApi,
} from "@/lib/api";
import type {
  KnowledgeBase, DocumentItem, QueryResponse,
  ChatResponse, RetrievedChunk,
} from "@/lib/types";

type Tab = "chat" | "documents" | "query";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
  model?: string;
  timestamp: Date;
}

function getSource(chunk: RetrievedChunk) {
  return chunk.source || {
    doc_id: (chunk.metadata?.doc_id as number) ?? undefined,
    file_name: (chunk.metadata?.file_name as string) ?? undefined,
    chunk_index: (chunk.metadata?.chunk_index as number) ?? undefined,
    page: (chunk.metadata?.page as number) ?? undefined,
  };
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: "text-emerald-400", label: "已完成" },
  processing: { icon: Loader2, color: "text-amber-400", label: "处理中" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "失败" },
  uploaded: { icon: Clock, color: "text-blue-400", label: "已上传" },
};

export default function KbDetailPage() {
  const params = useParams();
  const kbId = Number(params.kbId);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [tab, setTab] = useState<Tab>("chat");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Documents
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const documents = useMemo(() => kb?.documents || [], [kb]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [showDocSelect, setShowDocSelect] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatTopK, setChatTopK] = useState(3);

  // Query
  const [queryInput, setQueryInput] = useState("");
  const [querying, setQuerying] = useState(false);
  const [queryTopK, setQueryTopK] = useState(3);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  async function loadKb() {
    setLoading(true);
    try {
      setKb(await getKnowledgeBaseApi(kbId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(kbId)) loadKb();
  }, [kbId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatting]);

  // Upload
  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      await uploadDocumentsApi(kbId, Array.from(files));
      setSuccess("文件上传成功！");
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Process doc
  async function handleProcess(docId: number) {
    setProcessingId(docId); setError("");
    try {
      const r = await processDocumentApi(kbId, docId);
      setSuccess(r.message || "处理任务已提交");
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setProcessingId(null);
    }
  }

  // Refresh status
  async function handleRefreshStatus(docId: number) {
    try {
      const r = await getDocumentStatusApi(kbId, docId);
      setSuccess(`文档状态：${r.status}`);
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询失败");
    }
  }

  // Chat
  async function handleChat() {
    const q = chatInput.trim();
    if (!q || chatting) return;
    const userMsg: ChatMessage = { role: "user", content: q, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setChatInput(""); setChatting(true); setError("");
    try {
      const res = await chatKnowledgeBaseApi({ 
        kbId, 
        question: q, 
        topK: chatTopK,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
      });
      setMessages((p) => [...p, {
        role: "assistant", content: res.answer,
        sources: res.sources, model: res.model, timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages((p) => [...p, {
        role: "assistant", content: `❌ ${err instanceof Error ? err.message : "请求失败"}`,
        timestamp: new Date(),
      }]);
    } finally {
      setChatting(false);
    }
  }

  // Query
  async function handleQuery() {
    const q = queryInput.trim();
    if (!q || querying) return;
    setQuerying(true); setError(""); setQueryResult(null);
    try {
      setQueryResult(await queryKnowledgeBaseApi({ 
        kbId, 
        question: q, 
        topK: queryTopK,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "检索失败");
    } finally {
      setQuerying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
      </div>
    );
  }

  const tabs: { key: Tab; icon: typeof MessageSquare; label: string }[] = [
    { key: "chat", icon: MessageSquare, label: "智能问答" },
    { key: "documents", icon: FileText, label: "文档管理" },
    { key: "query", icon: Search, label: "语义检索" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4 border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center gap-3 mr-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Database className="h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">{kb?.name || `知识库 ${kbId}`}</h1>
            {kb?.description && (
              <p className="text-xs text-[var(--text-tertiary)] max-w-[300px] truncate">{kb.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 rounded-xl bg-[var(--bg-secondary)] p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        
        {/* Document Selector Popover */}
        {(tab === "chat" || tab === "query") && (
          <div className="relative ml-2">
            <button 
              onClick={() => setShowDocSelect(!showDocSelect)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
            >
              <File className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              {selectedDocIds.length === 0 ? "全部文档" : `已选 ${selectedDocIds.length} 个文档`}
            </button>
            
            {showDocSelect && (
              <div className="absolute right-0 top-full mt-2 w-64 animate-fade-in rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 shadow-2xl z-50">
                <div className="mb-2 px-2 pb-2 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  选择特定文档进行范围限定（不选则默认全部）
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {documents.map((doc) => {
                    const isSuccess = doc.status === "completed";
                    return (
                      <button
                        key={doc.id}
                        disabled={!isSuccess}
                        onClick={() => {
                          if (!isSuccess) return;
                          if (selectedDocIds.includes(doc.id)) {
                            setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                          } else {
                            setSelectedDocIds([...selectedDocIds, doc.id]);
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          isSuccess
                            ? "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                            : "opacity-50 cursor-not-allowed text-[var(--text-tertiary)]"
                        }`}
                        title={!isSuccess ? "文档处理成功后可选" : ""}
                      >
                        <span className="truncate pr-4">{doc.file_name}</span>
                        {selectedDocIds.includes(doc.id) && <CheckCircle className="h-4 w-4 text-[var(--accent-blue)] shrink-0" />}
                      </button>
                    );
                  })}
                  {documents.length === 0 && (
                    <p className="py-4 text-center text-xs text-[var(--text-tertiary)]">暂无文档</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Notifications */}
      {(error || success) && (
        <div className="px-6 pt-3">
          {error && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
              <button onClick={() => setError("")}><X className="h-3 w-3" /></button>
            </div>
          )}
          {success && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
              {success}
              <button onClick={() => setSuccess("")}><X className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      )}

      {/* ===== CHAT TAB ===== */}
      {tab === "chat" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-3 text-xl font-semibold">开始提问</h2>
                <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-[var(--text-tertiary)]">
                  基于「{kb?.name}」知识库中的文档，AI 将为你提供精准回答
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["这个知识库讲了什么？", "总结一下主要内容", "有哪些关键概念？"].map((q) => (
                    <button key={q} onClick={() => { setChatInput(q); }}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-2.5 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-center">
                <div className="w-full max-w-4xl space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
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
                                    [{si + 1}] {s.file_name || "未知文件"}
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
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
                  placeholder="输入你的问题..."
                  rows={1}
                  className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
                />
                <button onClick={handleChat} disabled={chatting || !chatInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] transition-all hover:opacity-80 disabled:opacity-30">
                  {chatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
                <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">
                  基于知识库内容生成回答 · Top K: {chatTopK}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DOCUMENTS TAB ===== */}
      {tab === "documents" && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-4xl">
            {/* Upload area */}
            <div className="mb-6 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center transition-colors hover:border-[var(--border-light)]">
              <Upload className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
              <p className="mb-1 text-sm font-medium">拖拽文件到这里或点击上传</p>
              <p className="mb-4 text-xs text-[var(--text-tertiary)]">文件将上传到 MinIO 存储</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-5 py-2.5 text-sm font-medium text-white">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "上传中..." : "选择文件"}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>

            {/* Document list */}
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">
              文档列表 ({documents.length})
            </h2>
            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-color)] p-10 text-center text-sm text-[var(--text-tertiary)]">
                暂无文档，请先上传
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: DocumentItem) => {
                  const st = statusConfig[doc.status] || statusConfig.uploaded;
                  const StIcon = st.icon;
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-colors hover:bg-[var(--bg-tertiary)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-hover)]">
                          <File className="h-5 w-5 text-[var(--text-tertiary)]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.file_name}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            ID: {doc.id}
                            {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(1)} KB` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 text-xs ${st.color}`}>
                          <StIcon className={`h-3.5 w-3.5 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                          {st.label}
                        </span>
                        <button onClick={() => handleProcess(doc.id)} disabled={processingId === doc.id}
                          className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50">
                          {processingId === doc.id ? "提交中..." : "处理"}
                        </button>
                        <button onClick={() => handleRefreshStatus(doc.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)]">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== QUERY TAB ===== */}
      {tab === "query" && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
              <h2 className="mb-3 text-sm font-semibold">语义检索</h2>
              <p className="mb-4 text-xs text-[var(--text-tertiary)]">只做向量检索，不调用 LLM 生成回答</p>
              <div className="flex gap-3">
                <input value={queryInput} onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleQuery(); }}
                  placeholder="输入检索问题..." 
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]" />
                <input type="number" min={1} max={10} value={queryTopK}
                  onChange={(e) => setQueryTopK(Number(e.target.value))}
                  className="w-20 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-center text-sm text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                  title="Top K" />
                <button onClick={handleQuery} disabled={querying || !queryInput.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  {querying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  检索
                </button>
              </div>
            </div>

            {queryResult && (
              <div className="animate-fade-in space-y-3">
                <div className="rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-tertiary)]">
                  问题: <span className="text-[var(--text-primary)]">{queryResult.question}</span>
                  {" · "}返回 {queryResult.chunks.length} 条结果
                </div>
                {queryResult.chunks.map((chunk, i) => {
                  const src = getSource(chunk);
                  return (
                    <div key={i} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                        <span className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 font-medium">#{i + 1}</span>
                        {typeof chunk.score === "number" && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[var(--accent-blue)]">
                            {(chunk.score * 100).toFixed(1)}%
                          </span>
                        )}
                        {src.file_name && <span>{src.file_name}</span>}
                        {src.chunk_index != null && <span>chunk #{src.chunk_index}</span>}
                      </div>
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--bg-primary)] p-3 text-xs leading-6 text-[var(--text-secondary)]">
                        {chunk.content}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Click-away handler for popover */}
      {showDocSelect && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDocSelect(false)} />
      )}
    </div>
  );
}
