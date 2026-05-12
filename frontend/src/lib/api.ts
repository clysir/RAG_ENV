import type {
  ChatResponse,
  DocumentItem,
  KnowledgeBase,
  LoginResponse,
  QueryResponse,
  User,
} from "./types";

const API_PREFIX = "/backend";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rag_token");
}

export function setToken(token: string) {
  localStorage.setItem("rag_token", token);
}

export function clearToken() {
  localStorage.removeItem("rag_token");
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail?: unknown }).detail)
        : `请求失败: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function registerApi(params: {
  username: string;
  email: string;
  password: string;
}) {
  return request<User>("/api/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(params),
  });
}

export async function loginApi(params: {
  username: string;
  password: string;
}) {
  const form = new URLSearchParams();
  form.set("username", params.username);
  form.set("password", params.password);

  const response = await fetch(`${API_PREFIX}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail?: unknown }).detail)
        : `登录失败: ${response.status}`;

    throw new Error(message);
  }

  return data as LoginResponse;
}

export async function meApi() {
  return request<User>("/api/auth/me");
}

export async function createKnowledgeBaseApi(params: {
  name: string;
  description?: string;
}) {
  return request<KnowledgeBase>("/api/knowledge_base/create", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listKnowledgeBaseApi() {
  return request<KnowledgeBase[]>("/api/knowledge_base/list");
}

export async function getKnowledgeBaseApi(kbId: number) {
  return request<KnowledgeBase>(`/api/knowledge_base/${kbId}`);
}

export async function uploadDocumentsApi(kbId: number, files: File[]) {
  const form = new FormData();

  for (const file of files) {
    form.append("files", file);
  }

  return request<DocumentItem[]>(`/api/knowledge_base/${kbId}/documents/upload`, {
    method: "POST",
    body: form,
  });
}

export async function processDocumentApi(kbId: number, docId: number) {
  return request<{
    doc_id: number;
    kb_id: number;
    status: string;
    message?: string;
  }>(`/api/knowledge_base/${kbId}/documents/${docId}/process`, {
    method: "POST",
  });
}

export async function getDocumentStatusApi(kbId: number, docId: number) {
  try {
    return await request<{
      doc_id: number;
      kb_id: number;
      file_name?: string;
      status: string;
    }>(`/api/knowledge_base/${kbId}/documents/${docId}/status`, {
      method: "GET",
    });
  } catch {
    return request<{
      doc_id: number;
      kb_id: number;
      file_name?: string;
      status: string;
    }>(`/api/knowledge_base/${kbId}/documents/${docId}/status`, {
      method: "POST",
    });
  }
}

export async function queryKnowledgeBaseApi(params: {
  kbId: number;
  question: string;
  topK: number;
  documentIds?: number[];
}) {
  return request<QueryResponse>(`/api/knowledge_base/${params.kbId}/query`, {
    method: "POST",
    body: JSON.stringify({
      question: params.question,
      top_k: params.topK,
      document_ids: params.documentIds,
    }),
  });
}

export async function chatKnowledgeBaseApi(params: {
  kbId: number;
  question: string;
  topK: number;
  documentIds?: number[];
  presetName?: string;
}) {
  return request<ChatResponse>(`/api/knowledge_base/${params.kbId}/chat`, {
    method: "POST",
    body: JSON.stringify({
      question: params.question,
      top_k: params.topK,
      document_ids: params.documentIds,
      preset_name: params.presetName || "deepseek_v4_flash",
    }),
  });
}

export async function multiKbChatApi(params: {
  question: string;
  kbIds?: number[];
  documentIds?: number[];
  topK: number;
}) {
  return request<ChatResponse>(`/api/rag/runs/chat`, {
    method: "POST",
    body: JSON.stringify({
      question: params.question,
      kb_ids: params.kbIds,
      document_ids: params.documentIds,
      top_k: params.topK,
    }),
  });
}

// ===== 兼容旧页面命名：支持 login(username, password) 和 login({ username, password }) =====
export async function login(
  usernameOrParams: string | { username: string; password: string },
  password?: string
) {
  if (typeof usernameOrParams === "string") {
    return loginApi({
      username: usernameOrParams,
      password: password || "",
    });
  }

  return loginApi(usernameOrParams);
}

// ===== 兼容旧页面命名：支持 registerUser(username, email, password) 和 registerUser({ ... }) =====
export async function registerUser(
  usernameOrParams:
    | string
    | {
        username: string;
        email: string;
        password: string;
      },
  email?: string,
  password?: string
) {
  if (typeof usernameOrParams === "string") {
    return registerApi({
      username: usernameOrParams,
      email: email || "",
      password: password || "",
    });
  }

  return registerApi(usernameOrParams);
}

// ===== 兼容旧页面命名 =====
export const createKnowledgeBase = createKnowledgeBaseApi;
export const listKnowledgeBases = listKnowledgeBaseApi;
export const getKnowledgeBase = getKnowledgeBaseApi;

export const uploadDocuments = uploadDocumentsApi;
export const processDocument = processDocumentApi;
export const getDocumentStatus = getDocumentStatusApi;

export const queryKnowledgeBase = queryKnowledgeBaseApi;
export const chatKnowledgeBase = chatKnowledgeBaseApi;
