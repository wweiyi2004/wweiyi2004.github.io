"""教学用 full-softmax Skip-gram；小语料只用于观察训练机制。"""
import torch
from torch import nn
import torch.nn.functional as F

torch.manual_seed(7)
torch.set_num_threads(1)
sentences = [
    "猫 喜欢 吃 鱼", "狗 喜欢 吃 骨头", "猫 是 可爱 宠物",
    "狗 是 可爱 宠物", "苹果 是 新鲜 水果", "香蕉 是 新鲜 水果",
    "我 喜欢 苹果", "我 喜欢 香蕉",
]
corpus = [sentence.split() for sentence in sentences]
words = sorted({word for sentence in corpus for word in sentence})
vocab = {word: i for i, word in enumerate(words)}
pairs = []
for sentence in corpus:
    ids = [vocab[word] for word in sentence]
    for i, center in enumerate(ids):
        for j in range(max(0, i - 2), min(len(ids), i + 3)):
            if i != j:
                pairs.append((center, ids[j]))

centers, contexts = torch.tensor(pairs, dtype=torch.long).T
input_table = nn.Embedding(len(vocab), 16)   # 中心词矩阵 V
output_table = nn.Embedding(len(vocab), 16)  # 上下文矩阵 U
optimizer = torch.optim.Adam(
    list(input_table.parameters()) + list(output_table.parameters()), lr=0.03
)

def objective():
    logits = input_table(centers) @ output_table.weight.T
    return F.cross_entropy(logits, contexts)

initial = objective().item()
for step in range(300):
    optimizer.zero_grad()
    loss = objective()
    loss.backward()
    optimizer.step()

final = objective().item()
print(f"vocab={len(vocab)}, pairs={len(pairs)}")
print(f"loss: {initial:.4f} -> {final:.4f}")
assert final < initial
with torch.no_grad():
    vectors = F.normalize(input_table.weight, dim=-1)
    scores = vectors @ vectors[vocab["猫"]]
    scores[vocab["猫"]] = -torch.inf
    for index in scores.topk(3).indices.tolist():
        print(words[index], f"{scores[index]:.4f}")
