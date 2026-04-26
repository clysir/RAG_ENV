# 然后导入所有的子模型 (确保文件名和类名匹配你的实际情况)
from .base import Base
from .user import User
from .knowledge import Knowledge
from .documents import Documents

"""
cly --- 26.4.23 -- 22:20 
    我当前先建 5张表
1. users

用途：登录、当前用户、知识库归属。
你已经在写 auth 了，这张表必需。

建议字段：

id
username
email
hashed_password
is_active
is_superuser
created_at
updated_at

2. knowledge_bases

用途：把文档按组管理，后面 chat 时可以限定检索范围。
我建议你保留知识库这一层，因为它会让你后面的检索边界更清晰。

建议字段：

id
user_id
name
description
created_at
updated_at
我建议第一版先不要加
parent_child_chunking

因为这个对你现在太早了。

3. documents

用途：存正式文档元数据。
我建议你保留这张表，而且第一版只保留最关键字段。

建议字段：

id
knowledge_base_id
file_name
file_path
file_size
content_type
file_hash
status
created_at
updated_at
为什么加 status

因为你第一版即使不做完整任务系统，也最好知道：

uploaded
processing
completed
failed

这样你后面接口更顺。

4. document_chunks

用途：存 chunk 元数据和引用关系。
我建议你保留这张表，但做轻量版。

建议字段：

id
document_id
knowledge_base_id
chunk_index
content
metadata_json
hash
created_at
为什么我建议加它

因为你后面如果想做：

引用来源
检索结果回显
chunk 级别调试
重新索引

这张表很有价值。

但和原项目不同的是

你第一版不用设计得那么“偏哈希主键化”，先用普通自增 id 也可以。

5. chat_messages

用途：先把聊天最小闭环做起来。
我甚至觉得你第一版可以先不单独建 chat_sessions，而只用一张消息表跑通最小功能。

建议字段：

id
user_id
knowledge_base_id
role (user / assistant)
content
sources_json
created_at
为什么我先不强推 chat_sessions

因为你现在最重要的是跑通：

提问
检索
回答
存消息

会话标题、会话管理以后再补。

"""