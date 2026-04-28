"""
    这里写处理 文档的 过程函数！
"""
from dataclasses import dataclass
from typing import Any
from langchain_core.documents import Document as LangChainDocument
from backend.db.minio.client import get_minio_client
import tempfile
import hashlib
import os
from pathlib import Path
from backend.config.cfg import settings
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
#from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

# 帮助自动生成 def __init__ (self, xxx) 这些类里面繁琐的函数
@dataclass
class DocumentToProcess:
    id: int 
    knowledge_base_id: int
    file_name: str
    file_path: str


@dataclass 
class ChunkBuildResult:
    vector_id: int
    chunk_index: int
    content: str
    content_hash: str
    metadata_json: dict[str, Any]
    langchain_document: LangChainDocument


@dataclass
class ProcessedDocumentResult:
    chunks: list[ChunkBuildResult]



def download_minio_object_to_temp(file_path: str, suffix: str) -> str:
    """
        根据 documents.file_path 从 MinIO 下载真实文件到本地临时文件。
        数据库保存的 file_path是minio里面的 object_name 
    """
    minio_client = get_minio_client()

    temp_file = tempfile.NamedTemporaryFile(delete = False, suffix = suffix) # suffix 是文件后缀

    temp_path = temp_file.name
    temp_file.close()

    minio_client.fget_object(
        bucket_name = settings.minio_bucket_name,
        object_name = file_path,  # 云端对象名 = 数据库里存的字符串
        file_path = temp_path     # 本地保存路径 = 刚刚创建的临时文件地址   注意此处的 file_path是minio自己的参数名  而上一行的file_path是数据库里面的
    )

    return temp_path


def load_file_to_documents(temp_path : str, file_name: str) -> list[LangChainDocument]: # 这里的filename 也是数据库里面的
    """
        根据文件拓展名 选择不同的langchain loader
    """
    ext = Path(file_name).suffix.lower() # 根据文件名 取出后缀

    if ext == ".pdf":
        loader = PyPDFLoader(temp_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(temp_path)
    elif ext in [".md", ".markdown"]:
        loader = UnstructuredMarkdownLoader(temp_path)
    elif ext == ".txt":
        loader = TextLoader(temp_path, encoding="utf-8")
    else:
        raise ValueError(f"暂不支持的文件类型: {ext}")

    return loader.load()


def split_documents(
    documents: list[LangChainDocument],
    chunk_size: int = 800, #默认800
    chunk_overlap: int = 120 # overlap 是为了保证 切片之后的上下文 关系 不会丢失太多 overlap = 重叠部分
) -> list[LangChainDocument]:
    """
        文档切块。

        中文文档建议加中文标点分隔符，否则容易把一句中文从中间切断。
    """
    spliter = RecursiveCharacterTextSplitter(
        chunk_size = chunk_size,
        chunk_overlap = chunk_overlap,
        length_function = len,
        separators=[
            "\n\n",
            "\n",
            " ",
            "。", "！", "？",
            "，", "、", "；",
            ".", "!", "?", ",", ";",
            "",
        ]
    )
    return spliter.split_documents(documents)


def build_vector_id(
    kb_id: int,
    doc_id: int,
    chunk_index: int,
    content: str
) -> str:
    """
        生成vector_id 
        加 chunk_index 是为了避免两个 chunk 内容一样时 ID 冲突。
    """

    raw = f"{kb_id}:{doc_id}:{chunk_index}:{content}"
    # 哈希加密 并返回 16进制的摘要
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_chunks(
    doc: DocumentToProcess,
    chunks: list[LangChainDocument]
) -> list[ChunkBuildResult]:
    """
    把 LangChain chunks 转成可以写 MySQL 和 Chroma 的结构。
    """
    results: list[ChunkBuildResult] = []

    for index, chunk in enumerate(chunks):
        content = chunk.page_content
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        vector_id = build_vector_id(
            kb_id = doc.knowledge_base_id,
            doc_id = doc.id,
            chunk_index = index,
            content = content
        )
        # langchaindocument里面是有metadata属性的  metadata_json是我自己定义的 
        metadata_json = dict(chunk.metadata or {})
        metadata_json.update(
            {
                "kb_id": doc.knowledge_base_id,
                "doc_id": doc.id,
                "file_name": doc.file_name,
                "file_path": doc.file_path,
                "chunk_index": index,
                "vector_id": vector_id
            }
        )
        # 这里是把我们 自定义的 metadata_json重新打包回 Langchaindocument
        langchain_doc = LangChainDocument(
            page_content = content,
            metadata = metadata_json
        )

        results.append(
            ChunkBuildResult(
                vector_id=vector_id,
                chunk_index=index,
                content=content,
                content_hash=content_hash,
                metadata_json=metadata_json,
                langchain_document=langchain_doc,
            )
        )
    return results


def parse_and_chunk_from_minio(
    doc: DocumentToProcess,
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> ProcessedDocumentResult:
    """
        完整解析流程：
        1. 从 MinIO 下载文件
        2. loader 读取文件
        3. split 成 chunk
        4. 生成 vector_id 和 metadata
    """
    suffix = Path(doc.file_name).suffix.lower()

    temp_path = None

    try: 
        temp_path = download_minio_object_to_temp(
            file_path = doc.file_path,
            suffix = suffix
        )

        raw_documents = load_file_to_documents(
            temp_path = temp_path,
            file_name = doc.file_name
        )

        chunks = split_documents(
            documents = raw_documents,
            chunk_size = chunk_size,
            chunk_overlap = chunk_overlap 
        )

        built_chunks = build_chunks(
            doc = doc,
            chunks = chunks
        )

        return ProcessedDocumentResult(chunks = built_chunks)
    
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

def get_vector_store(kb_id: int) -> Chroma:
    """
        获取当前知识库对应的 Chroma collection。

        学习阶段可以先用本地 persist_directory。
    
    """
    # embeddings = OpenAIEmbeddings(
    #     model="text-embedding-3-small",
    # )
    embeddings = OllamaEmbeddings(
        model = "nomic-embed-text",
        base_url="http://localhost:11434"
    )
    return Chroma(
        collection_name=f"kb_{kb_id}",
        embedding_function=embeddings,
        persist_directory="./data/chroma",
    )

# def add_chunks_to_vector_store(
#     kb_id: int,
#     chunks: list[ChunkBuildResult],
# ) -> None:
#     """
#     把 chunks 写入 Chroma。
#     这里会真正调用 embedding。
#     """
#     if not chunks:
#         return

#     vector_store = get_vector_store(kb_id)

#     vector_store.add_documents(
#         documents=[chunk.langchain_document for chunk in chunks],
#         ids=[chunk.vector_id for chunk in chunks],
#     )

def add_chunks_to_vector_store(
    kb_id: int,
    chunks: list[ChunkBuildResult],
    batch_size: int = 1,
) -> None:
    """
    测试版：分批写入 Chroma。

    为什么 batch_size=1？
    因为你现在是小 VPS + Ollama CPU embedding。
    一次性塞全部 chunks 很容易把服务器打满。
    """
    if not chunks:
        print(">>> 没有 chunks 需要 embedding")
        return

    vector_store = get_vector_store(kb_id)
    total = len(chunks)

    print(f">>> 开始写入向量库，总 chunk 数: {total}, batch_size={batch_size}")
    # batch_size 是指步长 结合下面的切片 可以优雅的实现多批次入向量库 
    for start in range(0, total, batch_size):
        batch = chunks[start:start + batch_size]
        batch_start = start + 1
        batch_end = start + len(batch)

        print(f">>> embedding batch {batch_start}-{batch_end} / {total}")

        vector_store.add_documents(
            documents=[chunk.langchain_document for chunk in batch],
            ids=[chunk.vector_id for chunk in batch],
        )

        print(f">>> embedding batch done {batch_start}-{batch_end} / {total}")

    print(">>> 所有 chunks 已写入 Chroma")

def delete_vectors_from_store(
    kb_id: int,
    vector_ids: list[str],
) -> None:
    """
    删除这个文档旧的向量。

    重新处理文档时，要先删旧向量，否则会重复检索。
    """
    if not vector_ids:
        return

    vector_store = get_vector_store(kb_id)
    vector_store.delete(ids=vector_ids) 