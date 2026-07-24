import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.models import Paper, PaperChunk, Conversation
from utils.vector_store import get_embedding, compute_cosine_similarity
from utils.groq_client import generate_chat_response

logger = logging.getLogger("researchhub.ai_engine")

# 1. Prompt Templates System
PROMPT_TEMPLATES = {
    "research_chat": (
        "You are ResearchHub AI, an elite Senior Research Scientist and Academic Peer Reviewer.\n"
        "Your task is to answer the user's query utilizing the provided context chunks and conversation history.\n\n"
        "--- SYSTEM INSTRUCTIONS ---\n"
        "1. **Context Adherence**: Answer based primarily on the provided context papers. If the context is insufficient, state this clearly, but draw on sound scientific reasoning to supplement the answer where helpful.\n"
        "2. **Citation Rule**: Whenever you mention a claim, finding, or method from a paper, explicitly cite it inline using the format: (Author et al., Year) or [Paper Title].\n"
        "3. **Minimize Hallucinations**: Do not invent metrics, benchmarks, or results that are not in the context. If papers contain contradictory findings, highlight the disagreement.\n"
        "4. **Formatting**: Use clean academic markdown (headings, bold text, blockquotes, bullet points, and LaTeX notation for equations where appropriate).\n\n"
        "--- RELATED PAPERS CONTEXT ---\n"
        "{context}\n\n"
        "--- CONVERSATION MEMORY ---\n"
        "{history}\n\n"
        "--- THINKING PROCESS (Reasoning loop) ---\n"
        "First, analyze the query to see which papers are most relevant. Then plan a structured answer. Finally, write the response."
    ),
    
    "summary": (
        "You are an academic editor. Analyze the paper context below and generate a comprehensive, structured research summary.\n\n"
        "Structure your response exactly as follows:\n"
        "1. **Core Objective**: What problem does this paper solve?\n"
        "2. **Methodology**: Summarize the experimental setup, datasets, and algorithms used.\n"
        "3. **Key Findings**: Bullet points outlining primary metrics, results, and improvements.\n"
        "4. **Significance**: Why does this work matter to the broader field?\n\n"
        "--- PAPER TEXT ---\n"
        "{text}"
    ),

    "comparison": (
        "You are a meta-analysis coordinator. Compare the provided research papers.\n\n"
        "Structure your response as follows:\n"
        "1. **Overview Table**: A markdown table comparing Title, Authors, Methodology, Key Metrics, and Limitations.\n"
        "2. **Synergies**: How do these papers build upon each other or share concepts?\n"
        "3. **Disagreements / Contradictions**: Do they disagree on assumptions, results, or scaling laws?\n\n"
        "--- PAPERS CONTEXT ---\n"
        "{text}"
    ),

    "gap_detection": (
        "You are a Research Director. Analyze the following group of publications to identify unresolved research gaps, limitations, and future directions.\n\n"
        "Structure your response as follows:\n"
        "1. **Identified Limitations**: What constraints did the authors explicitly admit or what weaknesses exist in their evaluation?\n"
        "2. **Research Gaps**: What areas remain unexplored or are poorly addressed by these works combined?\n"
        "3. **Proposed Projects**: Outline 2 concrete, innovative research project proposals that could resolve these gaps.\n\n"
        "--- PUBLICATIONS CONTEXT ---\n"
        "{text}"
    ),

    "literature_review": (
        "You are a Senior Academic Writer compiling a state-of-the-art literature review.\n\n"
        "Synthesize the provided papers into a structured literature review. Organize by common themes, trends in methodology, and analytical comparisons. Do NOT summarize each paper in turn; instead, write a cohesive, themed narrative citing the papers using (Author et al., Year) format.\n\n"
        "--- PAPERS METADATA & TEXTS ---\n"
        "{text}"
    )
}

# 2. RAG Context Retrieval Engine
def retrieve_semantic_context(
    query: str,
    paper_ids: List[int],
    db: Session,
    top_k: int = 5
) -> str:
    """
    Retrieves the top_k semantically similar text chunks from selected papers.
    """
    if not paper_ids:
        return "No paper context available."

    try:
        # Embed query
        query_vector = get_embedding(query)

        # Retrieve all chunks for selected papers
        chunks = db.query(PaperChunk).filter(PaperChunk.paper_id.in_(paper_ids)).all()
        if not chunks:
            return "No text chunks indexed for the selected papers."

        # Compute cosine similarities
        scores = []
        for chunk in chunks:
            if chunk.embedding:
                sim = compute_cosine_similarity(query_vector, chunk.embedding)
                scores.append((sim, chunk))

        # Sort by similarity score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        top_matches = scores[:top_k]

        # Format context block
        context_parts = []
        for rank, (score, chunk) in enumerate(top_matches, 1):
            paper = chunk.paper
            context_parts.append(
                f"[Chunk #{rank}] (Similarity: {score:.3f})\n"
                f"Source Paper: {paper.title}\n"
                f"Authors: {paper.authors}\n"
                f"Text:\n{chunk.text_content}\n"
                f"----------------------------------------"
            )
        
        return "\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"Error during semantic retrieval: {e}")
        return "Error loading semantic context."

# 3. Conversation Memory Engine
def build_conversation_memory(workspace_id: int, db: Session, limit: int = 8) -> str:
    """
    Retrieves and formats conversation logs within a workspace to maintain chatbot memory.
    """
    try:
        messages = db.query(Conversation).filter(
            Conversation.workspace_id == workspace_id
        ).order_by(Conversation.created_at.asc()).all()

        recent_messages = messages[-limit:] if len(messages) > limit else messages
        
        formatted = []
        for msg in recent_messages:
            formatted.append(f"{msg.role.capitalize()}: {msg.content}")
            
        return "\n".join(formatted)
    except Exception as e:
        logger.error(f"Error building memory: {e}")
        return ""

# 4. Core Query Dispatchers
def run_research_chat(
    workspace_id: int,
    query: str,
    db: Session
) -> str:
    """
    Runs the complete RAG research chat loop, retrieving workspace contexts, building memory,
    and invoking Groq.
    """
    # 1. Fetch all papers in workspace
    papers = db.query(Paper).filter(Paper.workspace_id == workspace_id).all()
    paper_ids = [p.id for p in papers]

    # 2. Retrieve semantic chunks
    context = retrieve_semantic_context(query, paper_ids, db, top_k=4)

    # 3. Build memory
    history = build_conversation_memory(workspace_id, db)

    # 4. Construct System Prompt using template
    system_prompt = PROMPT_TEMPLATES["research_chat"].format(
        context=context,
        history=history
    )

    # 5. Dispatch completion
    return generate_chat_response(system_prompt, query)

def run_paper_analysis(
    paper_ids: List[int],
    action: str,
    db: Session
) -> str:
    """
    Synthesizes multiple papers for summaries, comparisons, and gap detections.
    """
    papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
    if not papers:
        return "No publications selected."

    context_parts = []
    for idx, p in enumerate(papers, 1):
        content = p.extracted_text if p.extracted_text else (p.abstract or "No text available.")
        # Truncate content to keep it inside LLM token limits
        if len(content) > 6000:
            content = content[:6000] + "... [Content Truncated]"
        
        context_parts.append(
            f"Publication #{idx}:\n"
            f"Title: {p.title}\n"
            f"Authors: {p.authors}\n"
            f"Date: {p.published_date or 'N/A'}\n"
            f"Content:\n{content}\n"
            f"====================================="
        )

    text_context = "\n\n".join(context_parts)
    template = PROMPT_TEMPLATES.get(action)
    if not template:
        template = "Analyze the following publications:\n{text}"

    system_prompt = template.format(text=text_context)
    user_prompt = f"Perform {action} analysis on the selected publications."
    
    return generate_chat_response(system_prompt, user_prompt)
