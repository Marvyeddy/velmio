import asyncio
import os
import tempfile
from pathlib import Path

from fastapi import UploadFile
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    CSVLoader,
    Docx2txtLoader,
    PyPDFLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_PDF_PAGES = 200

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".csv"}


class DocumentProcessingError(Exception):
    """Raised when an uploaded document cannot be processed."""


def load_document(file_path: str, extension: str) -> list[Document]:
    """Load a document using its appropriate LangChain loader."""

    if extension == ".pdf":
        reader = PdfReader(file_path)

        if reader.is_encrypted:
            raise DocumentProcessingError("Password-protected PDFs are not supported.")

        if len(reader.pages) > MAX_PDF_PAGES:
            raise DocumentProcessingError(f"PDF cannot exceed {MAX_PDF_PAGES} pages.")

        loader = PyPDFLoader(
            file_path=file_path,
            mode="page",
        )
    elif extension == ".docx":
        loader = Docx2txtLoader(file_path=file_path)
    elif extension == ".csv":
        loader = CSVLoader(
            file_path=file_path,
            encoding="utf-8-sig",
            csv_args={"dialect": "excel"},
        )
    else:
        raise DocumentProcessingError("Unsupported document format.")

    return loader.load()


def load_and_split_document(
    file_path: str,
    extension: str,
    filename: str,
) -> tuple[list[Document], int]:
    """Load, normalize metadata, and split the document."""

    try:
        documents = load_document(file_path, extension)

        if not documents:
            raise DocumentProcessingError("The document contains no readable content.")

        # Normalize metadata across file formats.
        for document in documents:
            document.metadata["filename"] = filename
            document.metadata["file_type"] = extension.lstrip(".")

            # Do not expose temporary server paths as sources.
            document.metadata["source"] = filename

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

        chunks = splitter.split_documents(documents)

        chunks = [chunk for chunk in chunks if chunk.page_content.strip()]

        if not chunks:
            raise DocumentProcessingError("No extractable text found in this document.")

        return chunks, len(documents)

    except DocumentProcessingError:
        raise

    except Exception as exc:
        raise DocumentProcessingError("Unable to process this document.") from exc


async def process_document(
    file: UploadFile,
) -> tuple[list[Document], int]:
    """Validate an upload and process it using LangChain."""

    if not file.filename:
        raise DocumentProcessingError("A filename is required.")

    filename = Path(file.filename).name
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise DocumentProcessingError("Only PDF, DOCX, and CSV files are supported.")

    file_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not file_bytes:
        raise DocumentProcessingError("The uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise DocumentProcessingError("File size cannot exceed 10 MB.")

    # Basic file signature validation.
    if extension == ".pdf" and not file_bytes.startswith(b"%PDF-"):
        raise DocumentProcessingError("Invalid PDF file.")

    if extension == ".docx" and not file_bytes.startswith(b"PK"):
        raise DocumentProcessingError("Invalid DOCX file.")

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False,
        ) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        return await asyncio.to_thread(
            load_and_split_document,
            temp_path,
            extension,
            filename,
        )
    finally:
        if temp_path is not None:
            try:
                os.unlink(temp_path)
            except OSError:
                pass
