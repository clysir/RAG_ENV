"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { Button } from "@/components/ui";

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-lg font-bold">
              RAG ENV
            </Link>
            <div className="mt-1 text-xs text-gray-500">
              FastAPI + MinIO + Chroma + Ollama + DeepSeek
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/kb" className="text-sm text-gray-600 hover:text-black">
              知识库
            </Link>

            <Button
              variant="secondary"
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
            >
              退出
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="mt-1 text-gray-500">{description}</p>}
        </div>

        {children}
      </section>
    </main>
  );
}
