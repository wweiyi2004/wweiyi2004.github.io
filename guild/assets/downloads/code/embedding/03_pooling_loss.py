"""Masked mean pooling 和 batch 内对比损失的最小张量实验。"""
import torch
import torch.nn.functional as F

def masked_mean(hidden, attention_mask):
    weights = attention_mask.unsqueeze(-1).to(hidden.dtype)
    return (hidden * weights).sum(dim=1) / weights.sum(dim=1).clamp_min(1)

# 最后一个位置是 PAD；特意放大数值，展示 mask 的必要性。
hidden = torch.tensor([[[1., 2.], [3., 4.], [100., 100.]]])
mask = torch.tensor([[1, 1, 0]])
print("naive mean:", hidden.mean(dim=1).tolist())
print("masked mean:", masked_mean(hidden, mask).tolist())
assert torch.allclose(masked_mean(hidden, mask), torch.tensor([[2., 3.]]))

# 第 i 个 query 与第 i 个 document 配对；本例数字为人为构造。
q_raw = torch.tensor([[1., 0.], [0., 1.], [-1., 0.]], requires_grad=True)
d_raw = torch.tensor([[0.9, 0.1], [0.1, 0.9], [-0.9, 0.1]], requires_grad=True)
q = F.normalize(q_raw, dim=-1)
d = F.normalize(d_raw, dim=-1)
temperature = 0.1
logits = (q @ d.T) / temperature        # [3, 3]，对角线是正样本
labels = torch.arange(len(q))
loss = F.cross_entropy(logits, labels)
loss.backward()
print("contrastive loss:", round(loss.item(), 6))
print("gradient reaches both sides:", q_raw.grad is not None and d_raw.grad is not None)
