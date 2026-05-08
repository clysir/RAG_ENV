import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">RAG ENV</h1>

        <p className="mt-3 text-gray-600">
          一个用于演示 RAG 知识库系统的前端页面，支持登录、注册、知识库管理、文档上传、后台处理、Query 检索和 Chat 问答。
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            登录 / 注册
          </Link>

          <Link
            href="/kb"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            进入知识库
          </Link>
        </div>
      </div>
    </main>
  );
}
