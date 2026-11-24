
import { apiFetch } from "@/lib/api-client";
import type {
  Document,
  UploadDocumentResponse,
  DocumentProcessingStatus,
} from "@/types/documents";

export async function uploadDocument(
  file: File,
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(
    "/api/v1/documents/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Unable to upload document.");
  }

  return response.json() as Promise<UploadDocumentResponse>;
}

export async function listDocuments(): Promise<Document[]> {
  const response = await apiFetch("/api/v1/documents");

  if (!response.ok) {
    throw new Error("Unable to load documents.");
  }

  return response.json() as Promise<Document[]>;
}

export async function getDocumentStatus(
  documentId: string,
): Promise<DocumentProcessingStatus> {
  const response = await apiFetch(
    `/api/v1/documents/${encodeURIComponent(documentId)}/status`,
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve document status.");
  }

  return response.json() as Promise<DocumentProcessingStatus>;
}


export async function deleteDocument(
    documentId: string,
  ): Promise<void> {
    const response = await apiFetch(
      `/api/v1/documents/${encodeURIComponent(documentId)}`,
      {
        method: "DELETE",
      },
    );
  
    if (response.status === 404) {
      throw new Error("Document not found.");
    }
  
    if (response.status === 409) {
      throw new Error(
        "This document cannot be deleted while it is processing.",
      );
    }
  
    if (!response.ok) {
      throw new Error(
        "Unable to delete document. Please try again.",
      );
    }
  }
  