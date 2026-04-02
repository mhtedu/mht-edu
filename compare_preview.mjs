import { LLMClient, Config } from "coze-coding-dev-sdk";
import fs from "fs";

const config = new Config();
const client = new LLMClient(config);

async function compare() {
  const sandboxPreview = fs.readFileSync("assets/sandbox_preview.png");
  const serverHome1 = fs.readFileSync("assets/server_1.png");
  const serverHome2 = fs.readFileSync("assets/server_2.png");

  const messages = [
    {
      role: "user",
      content: [
        { 
          type: "text", 
          text: `我正在开发一个教育小程序，请你对比沙箱开发环境预览图和服务器设计图，找出差异并给出调整建议。

第一张图是沙箱开发环境预览（当前效果）
第二、三张图是服务器设计（目标效果）

请分析：
1. 布局差异
2. 样式差异（颜色、字体大小、间距等）
3. 功能入口差异
4. 需要调整的地方

请给出具体的调整建议。`
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${sandboxPreview.toString("base64")}`, detail: "high" }
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${serverHome1.toString("base64")}`, detail: "high" }
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${serverHome2.toString("base64")}`, detail: "high" }
        }
      ]
    }
  ];

  console.log("正在对比分析...\n");
  
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

compare().catch(console.error);
