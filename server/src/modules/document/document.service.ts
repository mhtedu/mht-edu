import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentService {
  async fetchDocument(url: string) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const text = Buffer.from(buffer).toString('utf-8');
      
      return {
        url,
        content: text,
        status: 'success',
      };
    } catch (error) {
      return {
        url,
        content: '',
        status: 'error',
        error: error.message,
      };
    }
  }

  async fetchMultipleDocuments(urls: string[]) {
    const results = await Promise.all(
      urls.map(url => this.fetchDocument(url))
    );
    return results;
  }
}
