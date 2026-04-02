import { LLMClient, Config } from "coze-coding-dev-sdk";
import fs from "fs";

const config = new Config();
const client = new LLMClient(config);

// 读取图片并转为 base64
const images = [
  { name: "首页1", path: "assets/server_1.png" },
  { name: "首页2", path: "assets/server_2.png" },
  { name: "教师列表", path: "assets/server_3.png" },
  { name: "教师详情", path: "assets/server_4.png" },
  { name: "我的页面1", path: "assets/server_5.png" },
  { name: "我的页面2", path: "assets/server_6.png" },
  { name: "消息页面", path: "assets/server_7.png" },
  { name: "登录页面", path: "assets/server_8.png" }
];

async function analyzeImages() {
  const contentParts = [
    { 
      type: "text", 
      text: `请分析这些教育小程序的截图，提取以下信息：

1. **首页布局**：
   - 顶部区域有什么内容？
   - 功能入口有哪些？图标和文字是什么？
   - 列表卡片的样式（教师卡片显示哪些信息）

2. **底部导航 TabBar**：
   - 有几个 Tab？
   - 每个 Tab 的图标和文字是什么？

3. **配色方案**：
   - 主色调是什么颜色
   - 背景色
   - 文字颜色

4. **组件样式**：
   - 卡片圆角大小
   - 按钮样式
   - 标签样式

5. **特殊功能**：
   - 是否有轮播图？
   - 是否有搜索框？
   - 是否有定位功能？

请详细描述每个页面的布局和设计。`
    }
  ];

  // 添加所有图片
  for (const img of images) {
    if (fs.existsSync(img.path)) {
      const buffer = fs.readFileSync(img.path);
      const base64 = buffer.toString("base64");
      contentParts.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${base64}`,
          detail: "high"
        }
      });
    }
  }

  const messages = [
    {
      role: "user",
      content: contentParts
    }
  ];

  console.log("正在分析截图...\n");
  
  const stream = client.stream(messages, {
    model: "doubao-seed-1-6-vision-250815",
    temperature: 0.3
  });

  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content.toString());
    }
  }
  console.log("\n");
}

analyzeImages().catch(console.error);
