import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    fetchDocument(body: {
        url: string;
    }): Promise<{
        url: string;
        content: string;
        status: string;
        error?: undefined;
    } | {
        url: string;
        content: string;
        status: string;
        error: any;
    }>;
    fetchMultipleDocuments(body: {
        urls: string[];
    }): Promise<({
        url: string;
        content: string;
        status: string;
        error?: undefined;
    } | {
        url: string;
        content: string;
        status: string;
        error: any;
    })[]>;
}
