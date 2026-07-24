import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("researchhub.groq")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Check if key is configured
is_mock = not GROQ_API_KEY or GROQ_API_KEY.startswith("gsk_your_")

client = None
if not is_mock:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        logger.info(f"Groq client initialized with model: {GROQ_MODEL}")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}. Switching to offline simulation mode.")
        is_mock = True
else:
    logger.info("Groq API key not configured or placeholder. Running in simulated mock mode.")

MODEL_CONFIG = {
    "model": GROQ_MODEL,
    "temperature": 0.3,
    "max_tokens": 2000,
    "top_p": 0.9
}

def generate_chat_response(system_prompt: str, user_message: str) -> str:
    """
    Generates a chat completion using Groq Llama 3.3 70B, with a mock fallback.
    """
    if is_mock:
        return _get_mock_response(user_message, system_prompt)
        
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            **MODEL_CONFIG
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API error: {e}. Returning mock fallback.")
        return f"[Simulated Response - Groq Error: {e}]\n\n" + _get_mock_response(user_message, system_prompt)

def generate_multi_paper_analysis(action: str, papers_context: str) -> str:
    """
    Orchestrates multi-paper tasks like Summaries, Key Insights, and Literature Reviews.
    """
    prompt = f"Analyze the following papers:\n{papers_context}"
    
    if action == "summary":
        system_prompt = "You are a professional research assistant. Provide a concise, highly structured 7-bullet summary for each of the provided research papers, outlining their objectives, methodology, and main results."
    elif action == "insights":
        system_prompt = "You are an expert research analyst. Extract key insights, common trends, methodology advancements, and research gaps across all the provided papers. Present your findings in a detailed markdown report."
    elif action == "review":
        system_prompt = "You are a senior academic writer. Write a comprehensive, cohesive literature review synthesising the provided papers. Connect similar findings, highlight debates or contradictory conclusions, and write a structured academic review."
    else:
        system_prompt = "You are an expert research assistant."
        
    return generate_chat_response(system_prompt, prompt)

def _get_mock_response(message: str, system_prompt: str) -> str:
    """
    Offline/mock response generator for testing.
    """
    message_lower = message.lower()
    
    if "transformer" in message_lower and "cnn" in message_lower:
        return (
            "### Comparison between Transformer and CNN Architectures\n\n"
            "Based on the provided research context, here is a synthesis comparing them:\n\n"
            "1. **Inductive Biases**: CNNs possess strong translation equivariance and locality biases, making them highly efficient on small datasets. Transformers lack these biases and require larger training sets but scale better.\n"
            "2. **Receptive Field**: CNNs process locally (receptive field increases with depth). Transformers have a global receptive field from the very first layer via self-attention.\n"
            "3. **Computational Complexity**: CNNs scale linearly with spatial resolution. Transformers scale quadratically with sequence length unless optimized (e.g., flash attention).\n"
            "4. **Feature Representation**: Transformers capture long-range contextual relationships, making them superior for both complex vision tasks (ViT) and language understanding."
        )
        
    if "summarize" in message_lower or "summary" in message_lower:
        return (
            "### AI-Generated Workspace Summary\n\n"
            "The workspace contains research papers detailing **Agentic AI systems** and **Language Model Architectures**.\n\n"
            "**Key Findings:**\n"
            "- Multi-agent coordination platforms improve reasoning by separating concerns (roles like planning, coding, verification).\n"
            "- Using local dense vector embeddings (e.g., Sentence-Transformers) enables fast RAG pipelines with 0% query costs.\n"
            "- Fine-tuning or context-injection using Groq LLM API provides sub-second conversational latency."
        )
        
    if "insights" in message_lower:
        return (
            "### Extracted Key Insights & Research Trends\n\n"
            "- **Trend 1: Agentic Workflows**: Moving away from single-shot prompts toward agentic loops featuring memory buffers and tool executions.\n"
            "- **Trend 2: Efficient RAG**: Optimizations in vector stores and local embedding generation allow desktop-grade AI assistants to handle thousands of PDF sheets.\n"
            "- **Trend 3: Scale-to-Speed Tradeoffs**: Systems utilize fast API endpoints (like Groq) to make multi-agent loops practical."
        )

    return (
        f"### ResearchHub AI Chat Assistant\n\n"
        f"This is a context-aware simulated response (running in offline mode).\n\n"
        f"**User Query**: \"{message}\"\n\n"
        f"**Context Analyzed**: Selected papers and workspace history have been injected into the system prompt to customize this response. Let me know if you would like me to summarize paper details or extract methodologies!"
    )
