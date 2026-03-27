import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('fetch')
  async fetchDocument(@Body() body: { url: string }) {
    if (!body.url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    return await this.documentService.fetchDocument(body.url);
  }

  @Post('fetch-multiple')
  async fetchMultipleDocuments(@Body() body: { urls: string[] }) {
    if (!body.urls || !Array.isArray(body.urls)) {
      throw new HttpException('URLs array is required', HttpStatus.BAD_REQUEST);
    }

    return await this.documentService.fetchMultipleDocuments(body.urls);
  }
}
