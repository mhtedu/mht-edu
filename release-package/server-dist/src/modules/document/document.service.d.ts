export declare class DocumentService {
    fetchDocument(url: string): Promise<{
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
    fetchMultipleDocuments(urls: string[]): Promise<({
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
