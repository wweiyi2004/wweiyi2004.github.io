// 卡片背面的学术主页 —— 改这里就行
// 文字可以写成 { en: '...', zh: '...' } 两种语言，也可以只写一个字符串（两种语言下都显示它）
// 标着「待填 / TODO」的是占位，换成你自己的信息；不需要的条目整行删掉即可，整个板块留空数组就不显示
//
// 页面板块依次是：简介（含研究兴趣、教育经历）· 经历 · 荣誉 · 项目 · 近期文章 · 论文 · 联系方式
window.ACADEMIC = {
  name: { en: 'Yi Wei', zh: '隗一' },
  alias: 'wweiyi',                                   // 显示在姓名下方的网名；和姓名相同时不显示
  role: { en: 'Undergraduate Student', zh: '本科生' },
  affiliation: {
    en: 'School of Electronic Information, Wuhan University',
    zh: '武汉大学 电子信息学院',
  },
  location: { en: 'Wuhan, China', zh: '中国 · 武汉' },

  // 头像沿用冒险者卡片的
  avatar: 'img/avatar.jpg',

  // 左栏的链接；href 留空的条目会显示成灰色的「待填」
  links: [
    { icon: 'mail', label: 'Email', text: 'wweiyi2004@whu.edu.cn', href: 'mailto:wweiyi2004@whu.edu.cn' },
    { icon: 'github', label: 'GitHub', text: 'wweiyi2004', href: 'https://github.com/wweiyi2004' },
    // 有 Google Scholar 主页后再加：{ icon: 'scholar', label: 'Google Scholar', text: '', href: 'https://scholar.google.com/citations?user=...' },
    { icon: 'cv', label: { en: 'CV (PDF)', zh: '简历 (PDF)' }, text: '', href: '' }, // TODO: 去掉手机号等隐私后放到 files/cv.pdf，再写 'files/cv.pdf'
    { icon: 'blog', label: { en: 'Blog', zh: '博客' }, text: { en: 'Axel Adventurers\' Guild', zh: '阿克塞尔冒险者公会' }, href: 'guild/' },
  ],

  // ---------- 简介 ----------
  // 每项一段
  bio: [
    {
      en: 'I am an undergraduate student in Communication Engineering at Wuhan University. I follow the frontier of artificial intelligence, and work towards technology that benefits everyone and a community with a shared future for mankind.',
      zh: '我是武汉大学通信工程专业的本科生，关注人工智能等前沿领域，为实现技术普惠和人类命运共同体而奋斗。',
    },
    {
      en: 'I took part in the Olympiad in Informatics (OI) in high school, and I still keep notes on algorithms, my studies and all sorts of things on my blog.',
      zh: '高中参与过信息学竞赛（OI），现在仍会在博客里记录算法、学习笔记以及各种见闻。',
    },
  ],

  interests: [
    { en: 'Frontier AI', zh: '人工智能前沿领域' },
    { en: 'Computer Vision', zh: '计算机视觉' },
    { en: 'Large Language Models', zh: '大语言模型' },
    { en: 'MCU / Embedded Systems', zh: '单片机/嵌入式' },
  ],

  education: [
    {
      time: '2023 – ',                                  // 结尾留「– 」会显示成「至今」
      degree: { en: 'B.Eng. in Communication Engineering (AI Special Class)', zh: '通信工程（人工智能特色班） 工学学士（在读）' },
      school: { en: 'Wuhan University', zh: '武汉大学' },
      note: { en: 'GPA 3.83 / 4.00 · Rank 37 / 175 (first six semesters)', zh: 'GPA 3.83 / 4.00 · 专业排名 37 / 175（前六学期）' },
    },
    {
      time: '2020 – 2023',
      degree: { en: 'High school', zh: '高中' },
      school: { en: 'Xiangyang No.5 High School', zh: '襄阳市第五中学' },
      note: '',
    },
  ],

  // ---------- 经历：科研、实习、助教、社团等 ----------
  // items 是要点列表，可不写
  experience: [
    {
      time: '2026 – ',
      role: { en: 'Research Intern', zh: '科研实习' },
      org: { en: 'TODO: Lab name, Wuhan University', zh: ' 武汉大学' },
      place: { en: 'Wuhan', zh: '武汉' },
      note: { en: 'Supervisor: Prof. Jiayi Ma', zh: '导师：马佳义 教授' },
      items: [],
    },
    {
      time: '2023 – ',
      role: { en: 'Member', zh: '成员' },
      org: { en: 'AI Special Class, School of Electronic Information, Wuhan University', zh: '武汉大学电子信息学院 人工智能特色班' },
      place: { en: 'Wuhan', zh: '武汉' },
      note: '',
      items: [],
    },
  ],

  // ---------- 荣誉 ----------
  // org 是一个小标签（这里写级别），link 可放证书链接
  awards: [
    {
      time: '2025',
      title: { en: 'Third Prize, National Finals (FPGA Innovation Track), 8th National College Student Embedded Chip and System Design Competition', zh: '第八届全国大学生嵌入式芯片与系统设计竞赛 FPGA 创新设计赛道 全国总决赛 三等奖' },
      org: { en: 'National', zh: '国家级' }, text: '', link: '',
    },
    {
      time: '2025',
      title: { en: 'First Prize, National Undergraduate Electronic Design Contest (TI Cup), Hubei Division', zh: '全国大学生电子设计竞赛（TI 杯）湖北赛区 一等奖' },
      org: { en: 'Provincial', zh: '省级' }, text: '', link: '',
    },
    {
      time: '2025.07',
      title: { en: 'Second Prize, 9th National College Student IC Innovation and Entrepreneurship Competition, Central China Division', zh: '第九届全国大学生集成电路创新创业大赛 华中分赛区 二等奖' },
      org: { en: 'Provincial', zh: '省级' }, text: '', link: '',
    },
    {
      time: '2025',
      title: { en: 'Third Prize, Contemporary Undergraduate Mathematical Contest in Modeling, Hubei Division (team leader)', zh: '全国大学生数学建模竞赛 湖北赛区 三等奖（队长）' },
      org: { en: 'Provincial', zh: '省级' }, text: '', link: '',
    },
    {
      time: '2025.05',
      title: { en: 'Second Prize, "Huazhong Cup" Mathematical Modeling Challenge', zh: '"华中杯"大学生数学建模挑战赛 二等奖' },
      org: { en: 'Provincial', zh: '省级' }, text: '', link: '',
    },
    {
      time: '2025.05',
      title: { en: 'Second Prize, Lanqiao Cup (C/C++, University Group A), Hubei Division', zh: '蓝桥杯全国软件和信息技术专业人才大赛（C/C++ 大学 A 组）湖北赛区 二等奖' },
      org: { en: 'Provincial', zh: '省级' }, text: '', link: '',
    },
    {
      time: '2024 – 2025',
      title: { en: 'Outstanding Student & Grade-C Scholarship, Wuhan University', zh: '武汉大学优秀学生 · 丙等奖学金' },
      org: { en: 'University', zh: '校级' }, text: '', link: '',
    },
    // TODO: 高中 OI 的奖项（如 CSP-S / NOIP）可以照上面的格式补在这里
  ],

  // ---------- 项目 ----------
  projects: [
    {
      time: '2024.07 – 2025.12',
      title: { en: 'Live-Streaming Follow Robot (Provincial Undergraduate Innovation Project)', zh: '直播跟随机器人设计与实现（省级大学生创新训练项目）' },
      text: { en: 'A teaching-assistant robot for PE classes, together with a camera car that follows and live-streams students. Completed and passed review.', zh: '面向体育课的助教机器人与跟拍直播小车系统，已结题（合格）。' },
      items: [
        { en: 'Robot: DuoS board driving 16 serial-bus servos, with a gait learned by PPO.', zh: '助教机器人：DuoS 平台驱动 16 路总线舵机，步态由 PPO 强化学习训练。' },
        { en: 'Follow car: YOLOv5n + DeepSORT + OSNet tracking on the Duo256M, dual-mode PID following, and RTP streaming to a web page.', zh: '跟拍小车：Duo256M 上运行 YOLOv5n + DeepSORT + OSNet 目标跟踪，双模态 PID 跟随，RTP 推流到网页端。' },
        { en: 'My part: model deployment on the edge board, and tuning of the visual-feedback PID and the gait control.', zh: '本人工作：模型在端侧平台的部署，视觉反馈 PID 与步态控制的联调。' },
      ],
      links: [],
    },
    {
      time: '2024 – 2025',
      title: { en: 'Signal Analysis System on a Domestic FPGA', zh: '基于国产 FPGA 的智能信号分析系统' },
      text: { en: 'Entry to the Embedded Chip and System Design Competition; I was responsible for the FPGA logic.', zh: '嵌入式芯片与系统设计竞赛作品，本人负责 FPGA 逻辑设计。' },
      items: [
        { en: 'Pango PG2L100H with a dual-channel 14-bit AD9643 ADC (up to 250 MSPS, LVDS).', zh: '紫光同创 PG2L100H + 双通道 14 位 AD9643（最高 250 MSPS，LVDS）。' },
        { en: '1024-point FFT (vendor IP core, with my own AXI4-Stream control and post-processing), a 50-tap distributed-arithmetic FIR, THD, frequency, amplitude, duty-cycle and phase measurement, and dual lock-in amplification.', zh: '1024 点 FFT（原厂 IP 核，自行完成 AXI4-Stream 控制与后处理）、50 阶分布式运算 FIR、THD、等精度测频、幅度 / 占空比 / 相位差测量与双锁相放大。' },
      ],
      links: [],
    },
    {
      time: '2026',
      title: { en: 'API Nexus — a local gateway for AI model APIs', zh: 'API Nexus —— 本地 AI 模型网关' },
      text: { en: 'Keeps the API keys of DeepSeek, OpenAI, Zhipu, Kimi and others in one local gateway, so every client is configured only once.', zh: '把 DeepSeek、OpenAI、智谱、Kimi 等各家的 API Key 收进一个本地网关，各个客户端只需配置一次。' },
      items: [],
      links: [{ label: { en: 'Write-up', zh: '介绍' }, href: 'guild/q/173.html' }],
    },
    {
      time: '2026',
      title: { en: 'Expert Chat — a bring-your-own-key cross-platform LLM client', zh: 'Expert Chat —— 自带钥匙的跨平台 LLM 客户端' },
      text: { en: 'A fully local client that runs on my own devices with my own API key, bringing the core of the DeepSeek web app — visible reasoning, web search and file upload.', zh: '纯本地、自带 API Key 的客户端，把 DeepSeek 官网的深度思考、联网搜索、文件上传等核心体验搬到自己的设备上。' },
      items: [],
      links: [{ label: { en: 'Write-up', zh: '介绍' }, href: 'guild/q/174.html' }],
    },
  ],

  // ---------- 近期文章：自动取博客最新的几篇，填 0 不显示 ----------
  recentPosts: 0,

  // ---------- 论文 ----------
  // authors 里和 me 相同的名字会加粗；暂时没有论文，列表为空时整个板块不显示。以后照这个格式加：
  // { year: '2027', title: 'Paper Title', authors: 'Yi Wei, Coauthor', venue: 'Conference / Journal',
  //   status: { en: 'under review', zh: '审稿中' }, links: [{ label: 'PDF', href: '' }, { label: 'Code', href: '' }] },
  me: 'Yi Wei',
  publications: [],

  // ---------- 联系方式 ----------
  contact: {
    text: { en: 'Feel free to reach me by email.', zh: '欢迎通过邮件联系我。' },
    items: [
      { icon: 'mail', text: 'wweiyi2004@whu.edu.cn', href: 'mailto:wweiyi2004@whu.edu.cn' },
      { icon: 'pin', text: { en: 'Wuhan University, Wuhan, Hubei 430072', zh: '湖北省武汉市 武汉大学 430072' } },
    ],
  },
};
