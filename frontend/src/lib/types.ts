export type User = {
  id: number;
  username: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type KnowledgeBase = {
  id: number;
  user_id?: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  documents?: DocumentItem[];
};

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed"
  | string;

export type DocumentItem = {
  id: number;
  knowledge_base_id: number;
  file_name: string;
  file_path?: string;
  file_size?: number;
  content_type?: string;
  file_hash?: string;
  status: DocumentStatus;
  created_at?: string;
  updated_at?: string;
};

export type QueryRequest = {
  question: string;
  top_k: number;
};

export type RetrievedSource = {
  doc_id?: number | null;
  kb_id?: number | null;
  file_name?: string | null;
  file_path?: string | null;
  chunk_index?: number | null;
  page?: number | null;
  title?: string | null;
  vector_id?: string | null;
};

export type RetrievedChunk = {
  content: string;
  score?: number | null;
  metadata?: Record<string, unknown>;
  source?: RetrievedSource;
};

export type QueryResponse = {
  kb_id: number;
  question: string;
  top_k: number;
  chunks: RetrievedChunk[];
};

export type ChatSource = {
  doc_id?: number | null;
  kb_id?: number | null;
  file_name?: string | null;
  file_path?: string | null;
  chunk_index?: number | null;
  page?: number | null;
  title?: string | null;
  score?: number | null;
};

export type ChatResponse = {
  kb_id: number;
  question: string;
  answer: string;
  sources: ChatSource[];
  model: string;
  preset_name?: string;
  provider?: string;
};

export type ApiError = {
  detail?: string;
};

// ===== 兼容旧页面类型命名 =====
export type KnowledgeResponse = KnowledgeBase;
export type DocumentResponse = DocumentItem;
