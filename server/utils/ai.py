from langchain_core.messages import AIMessage, AIMessageChunk


def extract_text(message: AIMessage | AIMessageChunk) -> str:
    """Extract readable text from Gemini messages and streaming chunks."""

    text = getattr(message, "text", None)

    if isinstance(text, str):
        return text

    content = getattr(message, "content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "".join(
            block["text"]
            for block in content
            if isinstance(block, dict)
            and block.get("type") == "text"
            and isinstance(block.get("text"), str)
        )

    return ""
