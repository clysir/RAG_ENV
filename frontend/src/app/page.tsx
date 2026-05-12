"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Database,
  MessageSquare,
  Search,
  Upload,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getToken } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Database,
    title: "知识库管理",
    description: "创建和管理多个知识库，灵活组织你的文档资料",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Upload,
    title: "文档上传",
    description: "支持多种文档格式，自动向量化存储到 Chroma",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Search,
    title: "语义检索",
    description: "基于 Embedding 的精准语义检索，找到最相关的内容",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    title: "智能问答",
    description: "RAG 增强的 AI 问答，基于知识库内容生成精准回答",
    color: "from-green-500 to-emerald-500",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If user is already logged in, redirect to dashboard
    const token = getToken();
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">RAG ENV</span>
        </div>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
          >
            登录
          </Link>
          <Link
            href="/login?mode=register"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15"
          >
            注册
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-16 text-center md:pt-28">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
            <span>FastAPI + MinIO + Chroma + DeepSeek</span>
          </div>

          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="gradient-text">智能知识库</span>
            <br />
            <span className="text-[var(--text-primary)]">RAG 问答系统</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
            上传你的文档，构建专属知识库。利用先进的 RAG 技术，
            让 AI 基于你的资料提供精准、可溯源的智能回答。
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30"
            >
              <Zap className="h-4 w-4" />
              开始使用
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-32">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-slide-up group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 transition-all duration-300 hover:border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-color)] px-6 py-6 text-center text-xs text-[var(--text-tertiary)]">
        RAG ENV © {new Date().getFullYear()} · Powered by FastAPI + Next.js
      </footer>
    </main>
  );
}
