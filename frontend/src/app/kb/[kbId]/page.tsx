"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBox,
  Input,
  Label,
  SuccessBox,
  Textarea,
} from "@/components/ui";

import {
  chatKnowledgeBaseApi,
  getDocumentStatusApi,
  getKnowledgeBaseApi,
  processDocumentApi,
  queryKnowledgeBaseApi,
  uploadDocumentsApi,
} from "@/lib/api";

import type {
  ChatResponse,
  DocumentItem,
  KnowledgeBase,
  QueryResponse,
  RetrievedChunk,
} from "@/lib/types";

function getSource(chunk: RetrievedChunk) {
  if (chunk.source) return chunk.source;

  const metadata = chunk.metadata || {};

  return {
    doc_id: metadata.doc_id as number | undefined,
    kb_id: metadata.kb_id as number | undefined,
    file_name: metadata.file_name as string | undefined,
    file_path: metadata.file_path as string | undefined,
    chunk_index: metadata.chunk_index as number | undefined,
    page: metadata.page as number | undefined,
    title: metadata.title as string | undefined,
    vector_id: metadata.vector_id as string | undefined,
  };
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const kbId = Number(params.kbId);

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [question, setQuestion] = useState("这个知识库是描述什么的？");
  const [topK, setTopK] = useState(3);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  const [chatQuestion, setChatQuestion] = useState(
    "总结一下这个知识库里面讲了什么？"
  );
  const [chatTopK, setChatTopK] = useState(3);
  const [presetName, setPresetName] = useState("deepseek_v4_flash");
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);
  const [querying, setQuerying] = useState(false);
  const [chatting, setChatting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const documents = useMemo(() => kb?.documents || [], [kb]);

  async function loadKb() {
    setLoading(true);
    setError("");

    try {
      const data = await getKnowledgeBaseApi(kbId);
      setKb(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载知识库失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("请先选择文件");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadDocumentsApi(kbId, files);
      setFiles([]);
      setSuccess("上传成功");
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleProcess(docId: number) {
    setProcessingDocId(docId);
    setError("");
    setSuccess("");

    try {
      const result = await processDocumentApi(kbId, docId);
      setSuccess(result.message || "处理任务已提交");
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交处理任务失败");
    } finally {
      setProcessingDocId(null);
    }
  }

  async function handleRefreshStatus(docId: number) {
    setError("");
    setSuccess("");

    try {
      const result = await getDocumentStatusApi(kbId, docId);
      setSuccess(`文档 ${docId} 当前状态：${result.status}`);
      await loadKb();
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询状态失败");
    }
  }

  async function handleQuery() {
    setQuerying(true);
    setError("");
    setSuccess("");
    setQueryResult(null);

    try {
      const result = await queryKnowledgeBaseApi({
        kbId,
        question,
        topK,
      });

      setQueryResult(result);
      setSuccess(`检索完成，返回 ${result.chunks.length} 个 chunk`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "检索失败");
    } finally {
      setQuerying(false);
    }
  }

  async function handleChat() {
    setChatting(true);
    setError("");
    setSuccess("");
    setChatResult(null);

    try {
      const result = await chatKnowledgeBaseApi({
        kbId,
        question: chatQuestion,
        topK: chatTopK,
        presetName,
      });

      setChatResult(result);
      setSuccess(`回答生成完成，模型：${result.model}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat 请求失败");
    } finally {
      setChatting(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(kbId)) {
      loadKb();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbId]);

  return (
    <AppShell
      title={kb?.name || `知识库 ${kbId}`}
      description={kb?.description || "知识库详情、文档处理、Query 检索和 Chat 问答。"}
    >
      <div className="mb-6">
        <Link href="/kb" className="text-sm text-gray-500 hover:text-black">
          ← 返回知识库列表
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        <ErrorBox>{error}</ErrorBox>
        <SuccessBox>{success}</SuccessBox>
      </div>

      {loading && <p className="text-sm text-gray-500">加载中...</p>}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">上传文档</h2>

            <Input
              type="file"
              multiple
              onChange={(e) => {
                setFiles(Array.from(e.target.files || []));
              }}
            />

            {files.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <div className="font-medium">已选择：</div>
                <ul className="mt-1 list-inside list-disc text-gray-600">
                  {files.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button disabled={uploading} onClick={handleUpload}>
              {uploading ? "上传中..." : "上传到 MinIO"}
            </Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Query 检索测试</h2>

            <div>
              <Label>问题</Label>
              <Textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div>
              <Label>Top K</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
              />
            </div>

            <Button disabled={querying} onClick={handleQuery}>
              {querying ? "检索中..." : "开始检索"}
            </Button>

            <p className="text-xs text-gray-500">
              Query 只做向量检索，不调用 LLM。
            </p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Chat 问答</h2>

            <div>
              <Label>模型</Label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              >
                <option value="deepseek_v4_flash">DeepSeek V4 Flash</option>
                <option value="deepseek_v4_pro">DeepSeek V4 Pro</option>
              </select>
            </div>

            <div>
              <Label>问题</Label>
              <Textarea
                rows={4}
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
              />
            </div>

            <div>
              <Label>Top K</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={chatTopK}
                onChange={(e) => setChatTopK(Number(e.target.value))}
              />
            </div>

            <Button disabled={chatting} onClick={handleChat}>
              {chatting ? "生成中..." : "开始 Chat"}
            </Button>

            <p className="text-xs text-gray-500">
              Chat = Query 检索 chunks + LLM 基于资料生成回答。
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">文档列表</h2>

            {documents.length === 0 ? (
              <EmptyState>暂无文档，请先上传。</EmptyState>
            ) : (
              <div className="space-y-3">
                {documents.map((doc: DocumentItem) => (
                  <div key={doc.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{doc.file_name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          doc_id={doc.id}
                          {doc.file_size !== undefined
                            ? ` · size=${doc.file_size} bytes`
                            : ""}
                        </div>
                      </div>

                      <Badge status={doc.status}>{doc.status}</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        disabled={processingDocId === doc.id}
                        onClick={() => handleProcess(doc.id)}
                      >
                        {processingDocId === doc.id ? "提交中..." : "提交处理"}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => handleRefreshStatus(doc.id)}
                      >
                        查状态
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">检索结果</h2>

            {!queryResult ? (
              <EmptyState>
                输入问题后点击“开始检索”，这里会显示返回的 chunks。
              </EmptyState>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-3 text-sm">
                  <div>
                    <span className="font-medium">问题：</span>
                    {queryResult.question}
                  </div>
                  <div className="mt-1 text-gray-500">
                    kb_id={queryResult.kb_id} · top_k={queryResult.top_k}
                  </div>
                </div>

                {queryResult.chunks.map((chunk, index) => {
                  const source = getSource(chunk);

                  return (
                    <div key={index} className="rounded-xl border p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>#{index + 1}</span>

                        {typeof chunk.score === "number" && (
                          <span>score={chunk.score.toFixed(4)}</span>
                        )}

                        {source.file_name && <span>{source.file_name}</span>}

                        {source.chunk_index !== undefined && (
                          <span>chunk={source.chunk_index}</span>
                        )}

                        {source.page !== undefined && (
                          <span>page={source.page}</span>
                        )}
                      </div>

                      {source.title && (
                        <div className="mb-2 text-sm font-medium">
                          {source.title}
                        </div>
                      )}

                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-6">
                        {chunk.content}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Chat 回答</h2>

            {!chatResult ? (
              <EmptyState>
                输入问题后点击“开始 Chat”，这里会展示 LLM 生成的回答和引用来源。
              </EmptyState>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 p-3 text-sm">
                  <div>
                    <span className="font-medium">问题：</span>
                    {chatResult.question}
                  </div>

                  <div className="mt-1 text-gray-500">
                    kb_id={chatResult.kb_id} · model={chatResult.model}
                    {chatResult.provider ? ` · provider=${chatResult.provider}` : ""}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 text-sm font-medium text-gray-500">
                    回答
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7">
                    {chatResult.answer}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">引用来源</h3>

                  {chatResult.sources.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无引用来源。</p>
                  ) : (
                    <div className="space-y-2">
                      {chatResult.sources.map((source, index) => (
                        <div
                          key={`${source.doc_id}-${source.chunk_index}-${index}`}
                          className="rounded-xl border bg-gray-50 p-3 text-sm"
                        >
                          <div className="font-medium">
                            #{index + 1} {source.file_name || "unknown file"}
                          </div>

                          {source.title && (
                            <div className="mt-1 text-gray-600">
                              {source.title}
                            </div>
                          )}

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            {source.doc_id !== undefined &&
                              source.doc_id !== null && (
                                <span>doc_id={source.doc_id}</span>
                              )}

                            {source.chunk_index !== undefined &&
                              source.chunk_index !== null && (
                                <span>chunk={source.chunk_index}</span>
                              )}

                            {source.page !== undefined &&
                              source.page !== null && (
                                <span>page={source.page}</span>
                              )}

                            {typeof source.score === "number" && (
                              <span>score={source.score.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
