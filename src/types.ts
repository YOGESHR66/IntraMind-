export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[];
  tokenCount?: number;
}

export interface PDFDocument {
  id: string;
  name: string;
  fileSize: number;
  pageCount: number;
  uploadedAt: string;
  chunkCount: number;
  fileType?: 'pdf' | 'docx' | 'image' | 'json' | 'txt' | 'code' | 'other';
  mimeType?: string;
  isSample?: boolean;
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number; // 0 to 1
  scorePercentage: number;
}

export interface Citation {
  sourceId: number; // 1, 2, 3...
  chunkId: string;
  docId: string;
  docName: string;
  pageNumber: number;
  chunkIndex: number;
  textSnippet: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  retrievedChunks?: SearchResult[];
  reasoningTimeMs?: number;
  isStreaming?: boolean;
}

export interface RAGSettings {
  topK: number;
  similarityThreshold: number; // 0 to 1
  temperature: number;
  selectedDocIds: string[]; // empty array = search all docs
}

export type UploadStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'ocr'
  | 'chunking'
  | 'embedding'
  | 'finalizing'
  | 'complete'
  | 'aborted'
  | 'error';

export interface UploadProgressState {
  stage: UploadStage;
  percent: number; // 0 to 100
  fileName: string;
  fileSize?: number;
  currentChunk?: number;
  totalChunks?: number;
  detail: string;
  isAborting?: boolean;
}

