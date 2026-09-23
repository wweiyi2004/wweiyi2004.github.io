"""运行：python 04_search.py；首次需联网下载模型，之后可用缓存。"""
import json
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_ID = "BAAI/bge-small-zh-v1.5"
REVISION = "7999e1d3359715c523056ef9478215996d62a620"
QUERY_PREFIX = "为这个句子生成表示以用于检索相关文章："
documents = [
    "忘记密码时，可以在登录页面点击找回密码，通过邮箱验证后设置新密码。",
    "修改头像需要进入个人资料页面，上传图片后保存。",
    "向量检索把问题和文档编码为向量，再根据相似度找到相关内容。",
    "订单发货后，可以在订单详情页查看物流单号。",
    "训练神经网络时，反向传播计算梯度，优化器根据梯度更新参数。",
]
queries = ["账号密码忘了该怎么办？", "怎样按语义搜索文章？", "模型参数是怎么学出来的？"]
model = SentenceTransformer(MODEL_ID, revision=REVISION, device="cpu")
model.max_seq_length = 512

# 文档可预先编码；BGE 的这个模型只给检索查询加指令。
doc_vectors = model.encode(documents, normalize_embeddings=True,
                           convert_to_numpy=True, show_progress_bar=False)
query_vectors = model.encode([QUERY_PREFIX + q for q in queries],
                             normalize_embeddings=True,
                             convert_to_numpy=True, show_progress_bar=False)
scores = query_vectors @ doc_vectors.T   # [3, 512] @ [512, 5] -> [3, 5]
print("documents:", doc_vectors.shape, "queries:", query_vectors.shape)
for query, row in zip(queries, scores):
    print("\n问题:", query)
    for index in np.argsort(-row)[:3]:
        print(f"  {row[index]:.4f}  D{index + 1}  {documents[index]}")

# 同时保存向量、原文和编码约定，后续查询必须使用相同配置。
output = Path("embedding-demo-output")
output.mkdir(exist_ok=True)
np.save(output / "documents.npy", doc_vectors)
metadata = {"model": MODEL_ID, "revision": REVISION, "normalized": True,
            "query_prefix": QUERY_PREFIX, "max_seq_length": 512,
            "documents": documents, "queries": queries, "scores": scores.tolist()}
(output / "metadata.json").write_text(
    json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
