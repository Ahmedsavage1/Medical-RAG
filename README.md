# Medical-RAG

A Retrieval-Augmented Generation (RAG) system for answering clinical questions grounded strictly in official medical guidance documents. Built as a hackathon proof of concept, with an architecture designed to scale to additional documents, domains, and retrieval strategies.

## Overview

The system ingests a clinical guideline document, indexes it as a searchable knowledge base, and answers natural language questions using only the retrieved content. Every answer is required to cite its source (document, page, and chunk), and the system is designed to decline questions that fall outside the scope of the ingested content rather than generate unsupported answers.

## Data Source

- **Source:** NICE (National Institute for Health and Care Excellence)
- **Document:** Hypertension in Adults: Diagnosis and Management (NG136)
- **Format:** PDF, downloaded directly from the official NICE guidance portal

## Pipeline

The current pipeline consists of the following stages, implemented in `main.ipynb`:

1. **Environment setup**
   Loads configuration (API keys) from a `.env` file using `python-dotenv`. Credentials are never hardcoded in source files.

2. **Document ingestion and validation**
   Loads the source PDF with `PyPDFLoader` and attaches metadata (document ID, title, version, publication date, page number) to every page. A validation step confirms the file is a genuine PDF, is non-empty, and contains extractable text before proceeding.

3. **Chunking and validation**
   Splits the document into overlapping chunks using `RecursiveCharacterTextSplitter`, preserving semantic boundaries (paragraphs, sentences) where possible. Each chunk receives a stable, unique chunk ID. A validation step checks for empty chunks, oversized chunks, and missing metadata before indexing.

4. **Embedding and vector storage**
   Converts each chunk into a vector embedding locally using `FastEmbedEmbeddings` (BAAI/bge-small-en-v1.5), avoiding external embedding API costs. Embeddings and their associated text and metadata are persisted to disk using Chroma, so the index does not need to be rebuilt on every run.

5. **LLM integration**
   Connects to an LLM (Llama 3.3 70B) via the Groq API, using an OpenAI-compatible interface through `langchain-openai`.

6. **RAG chain**
   Combines retrieval and generation into a single function:
   - Retrieves the top-k most relevant chunks for a given question via similarity search.
   - Formats the retrieved chunks, along with their citations, into a structured context block.
   - Passes the context and question to the LLM under a system prompt that constrains the assistant to:
     - answer only from the supplied context,
     - avoid diagnosis, prescription, or personalized treatment advice,
     - cite every factual statement with its source,
     - explicitly state when the context is insufficient to answer,
     - close every answer with an educational-use disclaimer.

7. **Evaluation**
   Includes manual test cases for in-scope questions, questions based on false premises, and questions entirely outside the scope of the ingested document, to verify the system does not hallucinate or answer beyond its grounding.

## Tech Stack

| Component | Tool |
|---|---|
| Orchestration | LangChain |
| PDF parsing | pypdf |
| Text splitting | langchain-text-splitters |
| Embeddings | FastEmbed (BAAI/bge-small-en-v1.5) |
| Vector store | Chroma (persistent) |
| LLM | Llama 3.3 70B via Groq API |
| Configuration | python-dotenv |

## Project Structure

```
Medical-RAG/
├── src/
│   ├── assets/          # Source PDF documents
│   ├── chroma_db/       # Persisted vector store (generated)
│   └── main.ipynb       # Pipeline implementation
├── .env                 # API keys (not committed)
├── .env.example          # Template for required environment variables
├── requirements.txt
└── README.md
```

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Create a `.env` file based on `.env.example` and add the required API key:
   ```
   GROQ_API_KEY=your_key_here
   ```

3. Run `main.ipynb` from top to bottom.

## Scalability

The architecture is intentionally modular so it can grow beyond a single-document proof of concept:

- **Multiple documents:** Additional guidelines can be ingested by repeating the load and chunk steps with a new `document_id`; all documents can share a single Chroma collection or be split into topic-specific collections.
- **Metadata-based filtering:** Existing metadata (document ID, title, version, publication date) enables filtered retrieval by source, topic, or recency as the knowledge base grows.
- **Swappable components:** The embedding model, vector store, and LLM provider are decoupled through LangChain interfaces, allowing any of them to be replaced without changing the rest of the pipeline.
- **Deployable retrieval logic:** The `ask_clinical_rag` function is self-contained and can be exposed directly behind an API endpoint or a UI layer without modification.
- **Extensible validation:** The validation checks introduced at each pipeline stage (PDF integrity, chunk quality, citation coverage) can be extended into a formal automated test suite as the system matures.

## Safety and Scope

This system is designed for educational and informational use only. It does not diagnose conditions, recommend treatment, or replace clinical judgment. All answers are grounded in the source document and include citations; the system is designed to decline questions it cannot answer from the ingested content.
