import { Controller, Post, Body } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Controller('vision')
export class VisionController {
  private client: LLMClient;

  constructor() {
    const config = new Config();
    this.client = new LLMClient(config);
  }

  @Post('analyze')
  async analyzeImage(@Body() body: { imageUrl: string }) {
    const { imageUrl } = body;
    
    const messages = [
      {
        role: 'user' as const,
        content: [
          { 
            type: 'text' as const, 
            text: '请详细描述这个页面的布局、功能和设计特点。包括：1. 页面标题和主要文字内容 2. 页面布局结构 3. 功能按钮和入口 4. 配色方案 5. 与教育平台相关的功能模块' 
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageUrl,
              detail: 'high' as const,
            },
          },
        ],
      },
    ];

    const response = await this.client.invoke(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: 0.7,
    });

    return { description: response.content };
  }
}
