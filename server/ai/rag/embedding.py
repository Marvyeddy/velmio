from langchain_google_genai import GoogleGenerativeAIEmbeddings
from server.core.config import config as cfg

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", google_api_key=cfg.GOOGLE_API_KEY
)
