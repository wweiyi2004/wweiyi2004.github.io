"""验证查表、one-hot 等价关系，以及重复 ID 的梯度累加。"""
import torch
from torch import nn
import torch.nn.functional as F

torch.manual_seed(7)
vocab = {"[PAD]": 0, "猫": 1, "狗": 2, "喜欢": 3, "鱼": 4, "骨头": 5}
table = nn.Embedding(num_embeddings=len(vocab), embedding_dim=4, padding_idx=0)
ids = torch.tensor([[1, 3, 4], [2, 3, 0]], dtype=torch.long)

vectors = table(ids)                       # [batch=2, length=3, dim=4]
one_hot = F.one_hot(ids, num_classes=len(vocab)).float()
assert torch.allclose(vectors, one_hot @ table.weight)
print("shape:", tuple(vectors.shape))
print("lookup == one_hot @ E:", True)

# 特意使用简单的求和损失，只观察梯度走向。
vectors.sum().backward()
print("每一行第一个坐标的梯度:", table.weight.grad[:, 0].tolist())
# [0, 1, 1, 2, 1, 0]；“喜欢”出现两次，梯度累加成 2。
assert table.weight.grad[:, 0].tolist() == [0, 1, 1, 2, 1, 0]

before = table.weight.detach().clone()
optimizer = torch.optim.SGD(table.parameters(), lr=0.1)
optimizer.step()
print("喜欢这一行的改变量:", (table.weight[3] - before[3]).detach().tolist())
