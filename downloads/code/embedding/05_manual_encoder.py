"""把 BGE 的 tokenize -> encoder -> CLS -> normalize 展开。"""
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

MODEL_ID = "BAAI/bge-small-zh-v1.5"
REVISION = "7999e1d3359715c523056ef9478215996d62a620"
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, revision=REVISION)
encoder = AutoModel.from_pretrained(MODEL_ID, revision=REVISION)
encoder.eval()  # 关闭 dropout 等训练行为；它本身不负责关闭梯度。
texts = [
    "为这个句子生成表示以用于检索相关文章：账号密码忘了该怎么办？",
    "忘记密码时，可以在登录页面点击找回密码，通过邮箱验证后设置新密码。",
]
batch = tokenizer(texts, padding=True, truncation=True,
                  max_length=512, return_tensors="pt")
with torch.inference_mode():             # 推理无需保存反向传播计算图
    hidden = encoder(**batch).last_hidden_state  # [B, L, 512]
    pooled = hidden[:, 0, :]             # 本模型训练约定：最终层 CLS
    vectors = F.normalize(pooled, p=2, dim=-1)

print("input_ids:", tuple(batch["input_ids"].shape))
print("hidden:", tuple(hidden.shape))
print("sentence vectors:", tuple(vectors.shape))
print("query tokens:", tokenizer.convert_ids_to_tokens(batch["input_ids"][0]))
print("cosine:", round((vectors[0] @ vectors[1]).item(), 4))
