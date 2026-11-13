import asyncio
from functools import lru_cache
import uuid

from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

from server.ai.rag.embedding import embeddings
from server.core.config import config as cfg


@lru_cache(maxsize=1)
def get_pinecone_index():
    pc = Pinecone(api_key=cfg.PINECONE_API_KEY)
    return pc.Index(name=cfg.PINECONE_INDEX_NAME)


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    return PineconeVectorStore(
        index=get_pinecone_index(),
        embedding=embeddings,
    )


async def index_document(
    chunks: list[Document],
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[str]:
    """Generate embeddings and index document chunks."""

    document_id_str = str(document_id)
    user_id_str = str(user_id)

    prepared_chunks = []
    vector_ids = []

    for chunk_index, chunk in enumerate(chunks):
        vector_id = f"{document_id_str}:{chunk_index}"

        metadata = {
            **chunk.metadata,
            "document_id": document_id_str,
            "user_id": user_id_str,
            "chunk_index": chunk_index,
        }

        prepared_chunks.append(
            Document(
                page_content=chunk.page_content,
                metadata=metadata,
            )
        )

        vector_ids.append(vector_id)

    # Run synchronous indexing outside the event loop.
    await asyncio.to_thread(
        get_vector_store().add_documents,
        documents=prepared_chunks,
        ids=vector_ids,
    )

    return vector_ids


async def delete_document_vectors(
    document_id: uuid.UUID,
    chunk_count: int,
) -> None:
    """Delete document vectors using deterministic IDs."""

    vector_ids = [f"{document_id}:{index}" for index in range(chunk_count)]

    if not vector_ids:
        return

    await asyncio.to_thread(
        get_pinecone_index().delete,
        ids=vector_ids,
    )


async def search_user_documents(
    query: str,
    user_id: uuid.UUID,
    document_id: uuid.UUID | None = None,
    limit: int = 5,
) -> list[Document]:
    """Search only documents belonging to the current user."""

    metadata_filter = {"user_id": {"$eq": str(user_id)}}

    if document_id is not None:
        metadata_filter = {
            "$and": [
                {"user_id": {"$eq": str(user_id)}},
                {"document_id": {"$eq": str(document_id)}},
            ]
        }

    results = await asyncio.to_thread(
        get_vector_store().similarity_search,
        query=query,
        k=limit,
        filter=metadata_filter,
    )

    return results
