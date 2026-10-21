// 冒险者卡片上的个人信息 —— 改这里就行
// latin 开头的字段会被渲染成卡片上的「异世界文字」（本质是拉丁字母的变体），只支持 A-Z、0-9 和少量标点
window.PROFILE = {
  name: 'wweiyi',
  latinName: 'WWEIYI',

  job: '大魔法师见习',
  title: '通信工程',
  latinSub: '‹ JOB: ARCHWIZARD APPRENTICE; MAJOR: TELECOM ›',

  // 魔法棒照到后显示的简介，最多 3 行；中文会拉伸到和卡面文字一样宽，英文保持原样
  intro: [
    'Wuhan University',
    'Major in AI',
    'Love Meguminn',
  ],

  level: 22,

  // [中文名, 卡面文字, 数值]
  stats: [
    ['筋力', 'STRENGTH', 35],
    ['生命力', 'VITALITY', 62],
    ['魔力', 'MAGIC POWER', 86],
    ['灵巧', 'DEXTERITY', 82],
    ['敏捷', 'AGILITY', 68],
    ['幸运', 'LUCK', 99],
  ],

  // [显示名, 卡面文字]；不足 6 个的格子是「未习得」，只显示读不懂的异世界文字
  skills: [
    ['嵌入式开发', 'EMBEDDED'],
    ['深度学习', 'DEEP LEARNING'],
    ['计算机视觉', 'VISION'],
    ['强化学习', 'REINFORCE'],
    ['算法竞赛', 'ALGORITHM'],
  ],

  // 右下角职业纹章上的入口
  // icon 可选 book / image / quill / code / rss / user / bilibili / qq / bangumi
  // hint 是鼠标悬停时下方小框里显示的文字，不写就显示 label
  links: [
    { label: 'GitHub', icon: 'code', href: 'https://github.com/wweiyi2004' },
    { label: '博客', icon: 'book', href: 'guild/' },
    { label: 'Bilibili', icon: 'bilibili', href: 'https://space.bilibili.com/396966752' },
    {
      label: 'QQ', hint: 'QQ 2844938982', icon: 'qq',
      href: 'tencent://AddContact/?fromId=45&fromSubId=1&subcmd=all&uin=2844938982',
    },
    { label: 'Bangumi', icon: 'bangumi', href: 'https://bangumi.tv/user/wweiyi' },
  ],

  // 头像图片路径（会被处理成单色印刷效果）；留空则使用默认线稿剪影
  avatar: 'img/avatar.jpg',

  // 卡片左侧宝石的颜色：[高光, 主色, 暗部]
  gem: ['#ec5b72', '#b81d36', '#5e0c19'],

  // 卡面装饰文字的随机种子，换一个数字就换一套花纹
  seed: 20160114,
};
