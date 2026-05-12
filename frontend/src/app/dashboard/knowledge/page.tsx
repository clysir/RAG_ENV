"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  createKnowledgeBaseApi,
  listKnowledgeBaseApi,
} from "@/lib/api";
import type { KnowledgeBase } from "@/lib/types";

export default function KnowledgeManagementPage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadKbs() {
    try {
      const data = await listKnowledgeBaseApi();
      setKbs(data);
    } catch {
      setError("加载知识库列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKbs();
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("请输入知识库名称");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      await createKnowledgeBaseApi({ name, description });
      setSuccess("知识库创建成功！");
      setName("");
      setDescription("");
      setShowCreate(false);
      await loadKbs();
      // Notify sidebar to refresh
      window.dispatchEvent(new Event("kb-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">知识库管理</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              创建和管理你的 RAG 知识库
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30"
          >
            <Plus className="h-4 w-4" />
            创建知识库
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 animate-fade-in rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={() => setError("")} className="ml-2 opacity-70 hover:opacity-100">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 animate-fade-in rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
            <button onClick={() => setSuccess("")} className="ml-2 opacity-70 hover:opacity-100">×</button>
          </div>
        )}

        {/* Knowledge Base Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-shimmer rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6"
              >
                <div className="mb-3 h-5 w-32 rounded bg-[var(--bg-hover)]" />
                <div className="h-3 w-full rounded bg-[var(--bg-hover)]" />
                <div className="mt-2 h-3 w-2/3 rounded bg-[var(--bg-hover)]" />
                <div className="mt-6 h-8 w-full rounded bg-[var(--bg-hover)]" />
              </div>
            ))}
          </div>
        ) : kbs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-16 text-center">
            <Database className="mx-auto mb-4 h-16 w-16 text-[var(--text-tertiary)] opacity-50" />
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">
              暂无知识库
            </h3>
            <p className="mb-6 text-sm text-[var(--text-tertiary)]">
              创建你的第一个知识库来开始上传文档和智能问答
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-5 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              创建知识库
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kbs.map((kb, i) => (
              <Link
                key={kb.id}
                href={`/dashboard/kb/${kb.id}`}
                className="group animate-fade-in rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 transition-all duration-300 hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] hover:shadow-lg hover:shadow-black/10"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Database className="h-5 w-5 text-[var(--accent-blue)]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </div>

                <h3 className="mb-1 text-base font-semibold">{kb.name}</h3>
                {kb.description && (
                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
                    {kb.description}
                  </p>
                )}

                <div className="flex items-center gap-4 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {kb.documents?.length || 0} 文档
                  </span>
                  {kb.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(kb.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md animate-slide-up rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl shadow-black/30">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">创建知识库</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：技术文档知识库"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-tertiary)] transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简短描述这个知识库的用途..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-tertiary)] transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      创建
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
