"""
    后台处理函数
    author:cly
    date: 26.4.28 13:17
"""
import asyncio
from backend.models.document_chunks import DocumentChunk
from backend.app.document.chunk_crud import ChunkCrud
from backend.app.document.crud import DocCrud
from backend.app.document.process import (
    DocumentToProcess,
    parse_and_chunk_from_minio,
    add_chunks_to_vector_store,
    delete_vectors_from_store,
)
from backend.db.my_sql.connect import async_session

TEST_MAX_CHUNKS = 3


async def run_process_document_task(
    kb_id: int,
    doc_id: int, 
    chunk_size: int = 2000,
    chunk_overlap: int = 300,       
) -> None:
    """
        后台处理： ---> 不关心是哪个用户的 因此无user_id
        负责从minio获取下载好的文件
        然后扔进 langchain里面 --> 切片 --> 获得chunk
        删除旧chunk（防止文件重复导入的问题）
        添加新chunk信息进数据库  --> 入向量库
        statues = completed
    """
    # 后台任务不能用depends 注入的方式获取db数据 
    async with async_session() as db:
        try:
            # 防御性编程 防止用户提交文档之后 在处理过程中 又把之前的文档给删了
            doc = await DocCrud(db).get_doc_by_id(doc_id)
            if not doc:
                #raise HTTPException(status_code = 404, detail = f"文档(ID:{doc.id})不存在")
                print(f"文档(ID:{doc.id})不存在")
                return
            
            if doc.knowledge_base_id != kb_id:
                #raise HTTPException(status_code = 400, detail = f"文档不属于当前知识库")
                print(f"文档不属于当前知识库")
                doc.status = "failed"
                await db.commit()
                return

            doc.status = "processing"
            await db.commit()

            doc_to_process = DocumentToProcess(
                id = doc.id,
                knowledge_base_id = doc.knowledge_base_id,
                file_name = doc.file_name,
                file_path = doc.file_path 
            )
            # -- 从minio获取文档 + chunk
            processed_result = await asyncio.to_thread(
                parse_and_chunk_from_minio,
                doc_to_process,
                chunk_size,
                chunk_overlap
            )
            original_chunk_cout = len(processed_result.chunks)
            print(f"原始chunk数量为: {original_chunk_cout}")

            # Test模式 只处理前3个chunk
            if TEST_MAX_CHUNKS is not None:
                processed_result.chunks = processed_result.chunks[:TEST_MAX_CHUNKS]
                print(f">>> 当前为测试模式，只处理{len(processed_result.chunks)}个chunk")

            chunk_crud = ChunkCrud(db)

            # -- 查旧verctor
            old_vector_ids = await chunk_crud.get_vector_ids_by_doc_id(doc.id)
            print(f"  旧vector数量为：{len(old_vector_ids)}")
            # 删除旧 MySQL chunks
            await chunk_crud.delete_by_doc_id(doc.id)

            #  删除旧 Chroma vectors
            await asyncio.to_thread(
                delete_vectors_from_store,
                kb_id,
                old_vector_ids
            )

            # 写入新chunk --> 数据库
            chunk_rows: list[DocumentChunk] = []

            for chunk in processed_result.chunks:
                chunk_rows.append(
                    DocumentChunk(
                        document_id=doc.id,
                        knowledge_base_id=kb_id,
                        chunk_index=chunk.chunk_index,
                        content=chunk.content,
                        metadata_json=chunk.metadata_json,
                        content_hash=chunk.content_hash,
                        vector_id=chunk.vector_id,
                        vector_store="chroma",
                    )
                )
            await chunk_crud.add_chunks(chunk_rows)
            await db.commit()

            print(f"document_chunks 写入完成：{len(chunk_rows)}")
            # 写入chroma

            print("====== embedding -> chroma ..... =======")
            await asyncio.to_thread(
                add_chunks_to_vector_store,
                kb_id,
                processed_result.chunks,
                1
            )

            print("====== embedding -> chroma 完成 =======")

            doc = await DocCrud(db).get_doc_by_id(doc_id)
            if doc:
                doc.status = "completed"
                await db.commit()

            print("=========后台任务完成==========")
        except Exception as e:

            print(f"后台任务失败：{str(e)}")

            await db.rollback()

            doc = await DocCrud(db).get_doc_by_id(doc_id)
            if doc:
                doc.status = "failed"
                await db.commit()

            print("documents.status = failed")


# async def _process_kb_documents(
#     kb_id: int,
#     doc_id: int,
#     user_id: int,
#     db: AsyncSession, 
#     chunk_size: int = 800, 
#     chunk_overlap: int = 120
# ):
#     """
#         处理某个文档：
#     1. 校验知识库权限
#     2. 校验文档是否属于这个知识库
#     3. status = processing
#     4. 从 MinIO 下载并切 chunk
#     5. 删除旧 chunks / 旧 vectors
#     6. 写入新 chunks
#     7. 写入 Chroma
#     8. status = completed
#     """
#     kb = await KbCrud(db).get_owned_kb(user_id, kb_id)
#     if not kb:
#         raise HTTPException(status_code = 404, detail = f"知识库ID:{kb_id}不存在或您无权限访问")
#     doc = await DocCrud(db).get_doc_by_id(doc_id)
#     if not doc:
#         raise HTTPException(status_code=404, detail=f"文档(ID:{doc_id})不存在")

#     if doc.knowledge_base_id != kb_id:
#         raise HTTPException(status_code = 400, detail = "文档不属于当前知识库")
#     try:
#         # 1 给数据库标记 这个任务正在处理当中！ 
#         doc.status = "processing"
#         await db.commit()

#         doc_to_process = DocumentToProcess(
#             id = doc.id,
#             knowledge_base_id = doc.knowledge_base_id,
#             file_name = doc.file_name,
#             file_path = doc.file_path
#         )
#         # MinIO 下载、loader、chunk 都是阻塞操作，放到线程池里做
        
#         processed_result = await asyncio.to_thread(
#             parse_and_chunk_from_minio,
#             doc_to_process,
#             chunk_size,
#             chunk_overlap,
#         )
#         chunk_crud = ChunkCrud(db)
#         # 查旧 vector_id，准备删除旧向量
#         old_vector_ids = await chunk_crud.get_vector_ids_by_doc_id(doc.id)

#         # 删除旧 chunk 记录
#         await chunk_crud.delete_by_doc_id(doc.id)

#         # 删除旧 Chroma 向量
#         await asyncio.to_thread(
#             delete_vectors_from_store,
#             kb_id,
#             old_vector_ids,
#         )
#         # 写入新的 chunk 记录 -- 这里就用了数据库了
#         chunk_rows: list[DocumentChunk] = []

#         for chunk in processed_result.chunks:
#             chunk_rows.append(
#                 DocumentChunk(
#                     document_id=doc.id,
#                     knowledge_base_id=kb_id,
#                     chunk_index=chunk.chunk_index,
#                     content=chunk.content,
#                     metadata_json=chunk.metadata_json,
#                     content_hash=chunk.content_hash,
#                     vector_id=chunk.vector_id,
#                     vector_store="chroma",
#                 )
#             )
#         await chunk_crud.add_chunks(chunk_rows)
#         await db.commit()
#         print (">> 正在开启embedding中")
#         # 写入 Chroma，这一步会调用 embedding
#         await asyncio.to_thread(
#             add_chunks_to_vector_store,
#             kb_id,
#             processed_result.chunks,
#         )
#         print(">>embedding结束")
#         doc.status = "completed"
#         await db.commit()

#         return {
#             "doc_id": doc.id,
#             "kb_id": kb_id,
#             "status": "completed",
#             "chunk_count": len(processed_result.chunks),
#         }
#         # 错误处理
#     except Exception as e:
#         await db.rollback()

#         doc = await DocCrud(db).get_doc_by_id(doc_id) 
#         if doc:
#             doc.status = "failed"
#             await db.commit()
#         raise HTTPException(
#             status_code = 500, 
#             detail = f"文档处理失败:{str(e)}") from e