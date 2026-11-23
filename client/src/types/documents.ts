
export type DocumentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "deleting";

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  chunk_count: number;
  created_at: string;
}


export interface UploadDocumentResponse {
    document_id: string;
    filename: string;
    status: DocumentStatus;
    message: string;
  }
  
  export interface DocumentProcessingStatus {
    document_id: string;
    filename: string;
    status: DocumentStatus;
    chunk_count: number;
  }
  