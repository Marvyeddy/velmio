from pinecone import Pinecone, ServerlessSpec
from server.core.config import config as cfg

pc = Pinecone(api_key=cfg.PINECONE_API_KEY)

index_name = "velmio-vectors"

if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1",
        ),
    )

    print("Pinecone index created successfully!")
else:
    print("Index already exists!")

index = pc.describe_index(index_name)

print("Name:", index.name)
print("Dimension:", index.dimension)
print("Status:", index.status)
