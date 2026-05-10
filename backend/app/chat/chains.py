"""
此处 prompt -> llm -> parser 采用了 langchain的 LCEL 风格

"""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

RAG_SYSTEM_PROMPT = """ 你是一个严谨的知识库问答助手。
你必须遵守以下规则：
1. 只能根据给定资料回答问题
2. 如果资料中没有相关信息，必须回答“根据我现有的资料，我无法回答这个问题。”
3. 不能编造信息，必须实事求是地回答问题
4. 你的回答必须简洁明了，直接切入正题
5. 如果资料来自论文，可以总结其研究问题、方法和结论
"""


def build_rag_answer_chain(llm):
    """
    LCEL 风格：
    prompt | llm | parser

    输入:
    {
        "context": "...",
        "question": "..."
    }

    输出:
    str
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", RAG_SYSTEM_PROMPT),
            (
                "human",
                """下面是从知识库中检索到的资料：

                {context}
                
                用户问题：{question}
                
                请基于资料回答用户问题。 """,
            ),
        ]
    )
    # "|"  为管道符
    return prompt | llm | StrOutputParser()


def build_context_from_chunks(chunks: list[dict], max_chars: int = 10000) -> str:
    """
    把检索到的 chunks 拼成给 LLM 的 context。

    max_chars 用来避免一次塞太多内容导致模型上下文过长。
    """
    parts: list[str] = []
    current_len = 0

    for index, chunk in enumerate(chunks, start=1):
        content = chunk.get("content", "")
        metadata = (
            chunk.get("metadata") or chunk.get("source") or {}
        )  # 兼容两种命名方式

        file_name = metadata.get("file_name", "unknown")
        chunk_index = metadata.get("chunk_index", "unknown")
        page = metadata.get("page", "unknown")

        block = f"""[资料 {index}]
        来源文件:{file_name},
        页码:{page}
        chunk_index:{chunk_index}

        {content}
        """

        if current_len + len(block) > max_chars:
            break

        parts.append(block)
        current_len += len(block)

    return "\n\n".join(parts)
