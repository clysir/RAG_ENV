"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User as UserIcon,
  FileText,
  BarChart3,
  Loader2,
  Home,
} from "lucide-react";
import { clearToken, getToken, meApi, listKnowledgeBaseApi } from "@/lib/api";
import type { KnowledgeBase, User } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [userData, kbData] = await Promise.all([
        meApi(),
        listKnowledgeBaseApi(),
      ]);
      setUser(userData);
      setKbs(kbData);
    } catch {
      clearToken();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for custom events to refresh KB list
  useEffect(() => {
    const handler = () => {
      listKnowledgeBaseApi().then(setKbs).catch(() => {});
    };
    window.addEventListener("kb-refresh", handler);
    return () => window.removeEventListener("kb-refresh", handler);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
          <p className="text-sm text-[var(--text-tertiary)]">正在加载...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", icon: Home, label: "主页" },
    { href: "/dashboard/chat", icon: MessageSquare, label: "全局问答" },
    { href: "/dashboard/knowledge", icon: Database, label: "知识库管理" },
    { href: "/dashboard/runs", icon: BarChart3, label: "运行记录" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[280px]"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[56px] items-center justify-between border-b border-[var(--border-color)] px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">RAG ENV</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-3 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-[var(--bg-hover)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Knowledge Bases */}
        {!collapsed && (
          <div className="mt-5 flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                知识库
              </span>
              <Link
                href="/dashboard/knowledge"
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-white"
                title="新建知识库"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-1 space-y-1 overflow-y-auto px-3" style={{ maxHeight: "calc(100vh - 340px)" }}>
              {kbs.length === 0 ? (
                <p className="px-2.5 py-2 text-xs text-[var(--text-tertiary)]">
                  暂无知识库
                </p>
              ) : (
                kbs.map((kb) => {
                  const isActive = pathname === `/dashboard/kb/${kb.id}`;
                  return (
                    <Link
                      key={kb.id}
                      href={`/dashboard/kb/${kb.id}`}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-[var(--bg-hover)] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
                      <span className="truncate">{kb.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User section */}
        <div className="relative mt-auto border-t border-[var(--border-color)] p-3">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.username || "用户"}</p>
                {user?.email && <p className="truncate text-xs text-[var(--text-tertiary)]">{user.email}</p>}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 animate-fade-in rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-1.5 shadow-2xl shadow-black/40">
              <div className="border-b border-[var(--border-color)] px-3 py-2.5 text-xs text-[var(--text-tertiary)]">
                {user?.email || user?.username}
              </div>
              <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute right-6 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </main>

      {/* Click-away handler for user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
