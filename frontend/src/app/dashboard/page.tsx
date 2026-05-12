"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Upload,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { listKnowledgeBaseApi } from "@/lib/api";
import type { KnowledgeBase } from "@/lib/types";

export default function DashboardHome() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listKnowledgeBaseApi()
      .then(setKbs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      icon: Plus,
      title: "创建知识库",
      description: "新建一个知识库来组织你的文档",
      href: "/dashboard/knowledge",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Upload,
      title: "上传文档",
      description: "向已有知识库上传文档",
      href: "/dashboard/knowledge",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Search,
      title: "语义检索",
      description: "在知识库中检索相关内容",
      href: kbs[0] ? `/dashboard/kb/${kbs[0].id}` : "/dashboard/knowledge",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: MessageSquare,
      title: "智能问答",
      description: "基于知识库进行 AI 对话",
      href: kbs[0] ? `/dashboard/kb/${kbs[0].id}` : "/dashboard/knowledge",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-8 py-10">
        {/* Welcome */}
        <div className="mb-10 animate-fade-in">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-tertiary)]">
            <Sparkles className="h-3 w-3 text-[var(--accent-amber)]" />
            RAG 知识库系统
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            你好，欢迎回来 👋
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            管理你的知识库、上传文档、进行智能问答。
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <Link
              key={action.title}
              href={action.href}
              className="group animate-slide-up rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 transition-all duration-300 hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}
              >
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{action.title}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Knowledge Bases */}
        <div className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近的知识库</h2>
            <Link
              href="/dashboard/knowledge"
              className="flex items-center gap-1 text-xs text-[var(--accent-blue)] transition-colors hover:text-blue-400"
            >
              查看全部
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-shimmer rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5"
                >
                  <div className="mb-3 h-4 w-24 rounded bg-[var(--bg-hover)]" />
                  <div className="h-3 w-full rounded bg-[var(--bg-hover)]" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-[var(--bg-hover)]" />
                </div>
              ))}
            </div>
          ) : kbs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-10 text-center">
              <Database className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
              <p className="mb-1 text-sm font-medium text-[var(--text-secondary)]">
                暂无知识库
              </p>
              <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                创建你的第一个知识库来开始使用
              </p>
              <Link
                href="/dashboard/knowledge"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-4 py-2 text-xs font-medium text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                创建知识库
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kbs.slice(0, 6).map((kb) => (
                <Link
                  key={kb.id}
                  href={`/dashboard/kb/${kb.id}`}
                  className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-hover)]">
                      <Database className="h-4 w-4 text-[var(--accent-blue)]" />
                    </div>
                    <h3 className="text-sm font-semibold truncate">{kb.name}</h3>
                  </div>
                  {kb.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
                      {kb.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span>ID: {kb.id}</span>
                    {kb.created_at && (
                      <span>
                        {new Date(kb.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
