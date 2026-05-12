"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, ChevronLeft, ChevronRight, Clock,
  Loader2, MessageSquare, Search, CheckCircle, AlertCircle,
} from "lucide-react";

const API_PREFIX = "/backend";

interface RagRunSummary {
  id: number;
  run_type: string | null;
  user_id: number;
  knowledge_base_id: number | null;
  kb_ids: number[] | null;
  question: string;
  answer_preview: string | null;
  model_provider: string | null;
  model_name: string | null;
  top_k: number;
  latency_ms: number | null;
  status: string;
  created_at: string | null;
}

interface RagRunListResponse {
  page: number;
  page_size: number;
  has_more: boolean;
  items: RagRunSummary[];
}

export default function RunsPage() {
  const [data, setData] = useState<RagRunListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function loadRuns(p: number) {
    setLoading(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("rag_token") : null;
      const res = await fetch(`${API_PREFIX}/api/rag/runs?page=${p}&page_size=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`请求失败: ${res.status}`);
      setData(await res.json());
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRuns(1); }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">运行记录</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            查看 RAG Query 和 Chat 的历史运行记录
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-16 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-[var(--text-tertiary)] opacity-50" />
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">暂无运行记录</h3>
            <p className="text-sm text-[var(--text-tertiary)]">进行 Query 或 Chat 操作后，记录会显示在这里</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-[var(--border-color)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">问题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">模型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">延迟</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)]">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((run) => (
                    <tr key={run.id} className="border-b border-[var(--border-color)] transition-colors hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">{run.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                          run.run_type === "chat"
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {run.run_type === "chat" ? <MessageSquare className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                          {run.run_type || "unknown"}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs">{run.question}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">{run.model_name || "-"}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
                        {run.latency_ms != null ? `${run.latency_ms}ms` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          run.status === "success" ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {run.status === "success" ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
                        {run.created_at ? new Date(run.created_at).toLocaleString("zh-CN") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">
                第 {data.page} 页 · 每页 {data.page_size} 条
              </p>
              <div className="flex gap-2">
                <button onClick={() => loadRuns(page - 1)} disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30">
                  <ChevronLeft className="h-3 w-3" /> 上一页
                </button>
                <button onClick={() => loadRuns(page + 1)} disabled={!data.has_more}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30">
                  下一页 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
