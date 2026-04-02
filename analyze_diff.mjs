import { LLMClient, Config } from "coze-coding-dev-sdk";
import fs from "fs";

const config = new Config();
const client = new LLMClient(config);

async function analyze() {
  const currentPreview = fs.readFileSync("assets/current_preview.png");
  const serverHome1 = fs.readFileSync("assets/server_1.png");
  const serverHome2 = fs.readFileSync("assets/server_2.png");

  const messages = [
    {
      role: "user",
      content: [
        { 
          type: "text", 
          text: `请对比当前开发环境预览图和服务器设计图，找出具体差异。

第一张图：当前开发环境预览（需要修改）
第二、三张图：服务器设计目标（需要达到的效果）

请详细列出：
1. 页面整体布局差异
2. 顶部区域差异
3. 功能入口区域差异
4. 列表卡片样式差异
5. 颜色和字体差异
6. 具体需要修改的代码位置和内容

请用中文回答。`
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${currentPreview.toString("base64")}`, detail: "high" }
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

  console.log("正在分析差异...\n");
  
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

analyze().catch(console.error);
