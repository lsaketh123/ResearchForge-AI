import asyncio
import logging
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import httpx

logger = logging.getLogger("researchhub.academic_search")

async def search_arxiv(client: httpx.AsyncClient, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Queries the arXiv API and parses XML responses.
    """
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": limit
    }
    
    try:
        response = await client.get(url, params=params, timeout=10.0)
        if response.status_code != 200:
            logger.error(f"arXiv error: HTTP {response.status_code}")
            return []
            
        # Parse XML
        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        papers = []
        
        for entry in root.findall("atom:entry", ns):
            title = entry.find("atom:title", ns)
            title_text = title.text.strip().replace("\n", " ") if title is not None else "Untitled"
            
            # Extract authors
            authors = []
            for author in entry.findall("atom:author", ns):
                name = author.find("atom:name", ns)
                if name is not None:
                    authors.append(name.text.strip())
            authors_str = ", ".join(authors) if authors else "Unknown"
            
            summary = entry.find("atom:summary", ns)
            summary_text = summary.text.strip().replace("\n", " ") if summary is not None else ""
            
            published = entry.find("atom:published", ns)
            published_str = published.text.strip()[:10] if published is not None else ""
            
            id_url = entry.find("atom:id", ns)
            paper_url = id_url.text.strip() if id_url is not None else ""
            
            papers.append({
                "title": title_text,
                "authors": authors_str,
                "abstract": summary_text,
                "published_date": published_str,
                "url": paper_url,
                "source": "arxiv"
            })
            
        return papers
    except Exception as e:
        logger.error(f"Failed to query arXiv: {e}")
        return []

async def search_pubmed(client: httpx.AsyncClient, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Queries PubMed via NCBI E-utilities (esearch + esummary) and parses JSON responses.
    """
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    
    search_params = {
        "db": "pubmed",
        "term": query,
        "retmode": "json",
        "retmax": limit
    }
    
    try:
        # Step 1: Query IDs
        search_res = await client.get(search_url, params=search_params, timeout=10.0)
        if search_res.status_code != 200:
            logger.error(f"PubMed search error: HTTP {search_res.status_code}")
            return []
            
        search_data = search_res.json()
        id_list = search_data.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            return []
            
        # Step 2: Fetch Summary Details
        summary_params = {
            "db": "pubmed",
            "id": ",".join(id_list),
            "retmode": "json"
        }
        
        summary_res = await client.get(summary_url, params=summary_params, timeout=10.0)
        if summary_res.status_code != 200:
            logger.error(f"PubMed summary error: HTTP {summary_res.status_code}")
            return []
            
        summary_data = summary_res.json()
        results = summary_data.get("result", {})
        
        papers = []
        for pmid in id_list:
            paper_info = results.get(pmid)
            if not paper_info:
                continue
                
            title = paper_info.get("title", "Untitled")
            
            # Authors list
            authors = []
            for author in paper_info.get("authors", []):
                authors.append(author.get("name", ""))
            authors_str = ", ".join(authors) if authors else "Unknown"
            
            pub_date = paper_info.get("pubdate", "")
            paper_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
            
            # PubMed summaries don't contain full abstracts in basic esummary,
            # but we can return the article ids/journal as abstract context, or fetch them if needed.
            desc = f"Journal: {paper_info.get('source', '')}. PMID: {pmid}."
            
            papers.append({
                "title": title,
                "authors": authors_str,
                "abstract": desc,
                "published_date": pub_date,
                "url": paper_url,
                "source": "pubmed"
            })
            
        return papers
    except Exception as e:
        logger.error(f"Failed to query PubMed: {e}")
        return []

async def query_academic_databases(query: str, source: str = "all", limit: int = 5) -> List[Dict[str, Any]]:
    """
    Coordinates concurrent search across academic platforms.
    """
    if not query:
        return []
        
    async with httpx.AsyncClient() as client:
        tasks = []
        if source in ("all", "arxiv"):
            tasks.append(search_arxiv(client, query, limit))
        if source in ("all", "pubmed"):
            tasks.append(search_pubmed(client, query, limit))
            
        results = await asyncio.gather(*tasks)
        
        # Flatten results list
        flat_results = []
        for r in results:
            flat_results.extend(r)
            
        return flat_results
