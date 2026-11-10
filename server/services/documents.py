import asyncio
import os
import tempfile
from pathlib import Path
import uuid

from fastapi import UploadFile
from langchain_core.documents import Document as LangDocument
from langchain_community.document_loaders import (
    CSVLoader,
    Docx2txtLoader,
    PyPDFLoader,
)
from zipfile import ZipFile, BadZipFile
from io import BytesIO
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.document import DocumentStatus
from server.core.logging import get_app_logger
from server.models.document import Document


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_PDF_PAGES = 200

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".csv"}

logger = get_app_logger(__name__)


class DocumentProcessingError(Exception):
    """Raised when an uploaded document cannot be processed."""


def load_document(file_path: str, extension: str) -> list[LangDocument]:
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
) -> tuple[list[LangDocument], int]:
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


async def validate_document(file: UploadFile) -> tuple[bytes, str, str]:
    """Read and validate an uploaded PDF, DOCX, or CSV."""

    if not file.filename:
        raise DocumentProcessingError("A filename is required.")

    filename = Path(file.filename.replace("\\", "/")).name
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise DocumentProcessingError("Only PDF, DOCX, and CSV files are supported.")

    if len(filename) > 255:
        raise DocumentProcessingError("Filename is too long.")

    file_bytes = await file.read(MAX_FILE_SIZE + 1)

    if not file_bytes:
        raise DocumentProcessingError("The uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise DocumentProcessingError("File cannot exceed 10 MB.")

    if extension == ".pdf" and not file_bytes.startswith(b"%PDF-"):
        raise DocumentProcessingError("Invalid PDF file.")

    if extension == ".docx":
        try:
            with ZipFile(BytesIO(file_bytes)) as archive:
                if "word/document.xml" not in archive.namelist():
                    raise DocumentProcessingError("Invalid DOCX file.")
        except BadZipFile as exc:
            raise DocumentProcessingError("Invalid DOCX file.") from exc

    return file_bytes, filename, extension


async def process_document_bytes(
    file_bytes: bytes,
    filename: str,
    extension: str,
) -> tuple[list[LangDocument], int]:
    """Load and split previously validated document bytes."""

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
                logger.warning(
                    "Failed to remove temporary document: %s",
                    temp_path,
                )


async def create_document_record(
    user_id: uuid.UUID,
    filename: str,
    file_type: str,
    file_size: int,
    session: AsyncSession,
) -> Document:
    document = Document(
        user_id=user_id,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        status=DocumentStatus.PENDING,
    )

    session.add(document)
    await session.commit()
    await session.refresh(document)

    return document


async def update_document_record(
    document: Document,
    session: AsyncSession,
    *,
    status: DocumentStatus,
    cloudinary_public_id: str | None = None,
    chunk_count: int | None = None,
) -> Document:
    document.status = status

    if cloudinary_public_id is not None:
        document.cloudinary_public_id = cloudinary_public_id

    if chunk_count is not None:
        document.chunk_count = chunk_count

    session.add(document)
    await session.commit()
    await session.refresh(document)

    return document
