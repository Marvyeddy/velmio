import asyncio
from io import BytesIO

import cloudinary
import cloudinary.uploader
import httpx

from server.core.config import config as cfg


cloudinary.config(
    cloud_name=cfg.CLOUDINARY_CLOUD_NAME,
    api_key=cfg.CLOUDINARY_API_KEY,
    api_secret=cfg.CLOUDINARY_API_SECRET,
    secure=True,
)


def _upload_document(
    file_bytes: bytes,
    document_id: str,
) -> dict:
    """Synchronous Cloudinary upload."""

    return cloudinary.uploader.upload(
        BytesIO(file_bytes),
        public_id=document_id,
        folder="velmio/documents",
        resource_type="raw",
        type="authenticated",
        overwrite=False,
    )


async def upload_document_to_cloudinary(
    file_bytes: bytes,
    document_id: str,
) -> dict:
    """Upload a document without blocking FastAPI's event loop."""

    return await asyncio.to_thread(
        _upload_document,
        file_bytes,
        document_id,
    )


async def delete_document_from_cloudinary(
    public_id: str,
) -> None:
    """Delete a previously uploaded document from Cloudinary."""

    result = await asyncio.to_thread(
        cloudinary.uploader.destroy,
        public_id,
        resource_type="raw",
        type="authenticated",
        invalidate=True,
    )

    if result.get("result") not in ("ok", "not found"):
        raise RuntimeError("Cloudinary document deletion failed.")


async def download_document_from_cloudinary(public_id: str) -> bytes:

    url, _ = cloudinary.utils.cloudinary_url(
        public_id, resource_type="raw", type="authenticated", sign_url=True, secure=True
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url)
        response.raise_for_status()

        return response.content
