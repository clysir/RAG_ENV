"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  Input,
  Label,
  SuccessBox,
  Textarea,
} from "@/components/ui";
import { createKnowledgeBaseApi, listKnowledgeBaseApi } from "@/lib/api";
import type { KnowledgeBase } from "@/lib/types";

export default function KnowledgeBaseListPage() {
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [name, setName] = useState("论文知识库");
  const [description, setDescription] = useState("用于测试 RAG 的论文知识库");

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const data = await listKnowledgeBaseApi();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      await createKnowledgeBaseApi({
        name,
        description,
      });

      setSuccess("创建成功");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell title="知识库" description="管理你的 RAG 知识库。">
      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">创建知识库</h2>

          <div>
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>描述</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button disabled={creating} onClick={handleCreate}>
            {creating ? "创建中..." : "创建"}
          </Button>

          <ErrorBox>{error}</ErrorBox>
          <SuccessBox>{success}</SuccessBox>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">知识库列表</h2>
            <Button variant="secondary" onClick={loadData}>
              刷新
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">加载中...</p>
          ) : items.length === 0 ? (
            <EmptyState>暂无知识库，请先创建。</EmptyState>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/kb/${item.id}`}
                  className="block rounded-xl border p-4 transition hover:bg-gray-50"
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="mt-1 text-sm text-gray-500">ID: {item.id}</div>
                  {item.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
