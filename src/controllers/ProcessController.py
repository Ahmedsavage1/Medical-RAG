import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.prompts import ChatPromptTemplate

from stores.llm.LLMProviderFactory import LLMProviderFactory
from stores.llm.LLMEnums import LLMProviderTypeEnum
from stores.vectordb.VectorDBProviderFactory import VectorDBProviderFactory
from stores.vectordb.VectorDBEnums import VectorDBProviderTypeEnum


SYSTEM_PROMPT = """You are a clinical education assistant.
Use ONLY the supplied context. If the context is insufficient, say: "The provided document does not contain enough information to answer that."
Do not diagnose, prescribe, recommend drug doses, or select personalized treatment.
For concerning symptoms, advise assessment by a qualified clinician.
Every factual paragraph must end with one or more citations exactly in this format: [Document ID | p. X | Chunk ID].
Keep the answer clear and concise. End with: "Educational information only; not a diagnosis or medical advice.\""""


class ProcessController:

    def __init__(self, config: dict):
        self.config = config
        self.pages = []
        self.chunks = []

        self.llm = LLMProviderFactory(config).create(LLMProviderTypeEnum.GROQ.value)
        self.llm.set_generation_model(config.get("GENERATION_MODEL", "llama-3.3-70b-versatile"))

        self.embedding_model = FastEmbedEmbeddings(
            model_name=config.get("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
        )

        self.vectordb = VectorDBProviderFactory(config).create(VectorDBProviderTypeEnum.CHROMA.value)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human", "Context:\n{context}\n\nQuestion: {question}")
        ])

    def validate_pdf(self, pdf_path: str) -> None:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"File not found: {pdf_path}")
        if not pdf_path.lower().endswith(".pdf"):
            raise ValueError(f"File is not a PDF: {pdf_path}")
        with open(pdf_path, "rb") as f:
            if f.read(5) != b"%PDF-":
                raise ValueError(f"Invalid PDF header: {pdf_path}")
        if os.path.getsize(pdf_path) == 0:
            raise ValueError(f"File is empty: {pdf_path}")

    def load_pdf(self, pdf_path: str, document_id: str, title: str, version: str, publication_date: str):
        self.validate_pdf(pdf_path)

        loader = PyPDFLoader(pdf_path)
        self.pages = loader.load()

        for page in self.pages:
            page.metadata.update({
                "document_id": document_id,
                "title": title,
                "version": version,
                "publication_date": publication_date,
                "page_number": page.metadata.get("page", 0) + 1,
            })

        total_chars = sum(len(p.page_content) for p in self.pages)
        if total_chars == 0:
            raise ValueError("No extractable text found in the PDF.")

        return self.pages

    def chunk_documents(self, document_id: str, chunk_size: int = 850, chunk_overlap: int = 150):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        self.chunks = splitter.split_documents(self.pages)

        for i, chunk in enumerate(self.chunks, start=1):
            chunk.metadata["chunk_id"] = f"{document_id}-CH-{i:03d}"

        empty_chunks = [c.metadata["chunk_id"] for c in self.chunks if not c.page_content.strip()]
        if empty_chunks:
            raise ValueError(f"Found empty chunks: {empty_chunks}")

        return self.chunks

    def build_vectorstore(self, collection_name: str):
        self.vectordb.create_collection(
            collection_name=collection_name,
            embedding_function=self.embedding_model,
            distance_method="cosine"
        )

        existing = self.vectordb.vectorstore.get()
        if existing["ids"]:
            self.vectordb.vectorstore.delete(ids=existing["ids"])

        self.vectordb.insert_documents(self.chunks)

    def format_docs(self, docs) -> str:
        blocks = []
        for d in docs:
            m = d.metadata
            citation = f"[{m['document_id']} | p. {m['page_number']} | {m['chunk_id']}]"
            blocks.append(f"SOURCE {citation}\n{d.page_content}")
        return "\n\n".join(blocks)

    def ask(self, question: str, k: int = 4) -> dict:
        docs = self.vectordb.search(question, k=k)
        context = self.format_docs(docs)

        messages = self.prompt.format_messages(context=context, question=question)
        answer = self.llm.generate_text(messages)

        return {
            "answer": answer,
            "retrieved_sources": [
                {
                    "document_id": d.metadata["document_id"],
                    "page": d.metadata["page_number"],
                    "chunk_id": d.metadata["chunk_id"],
                    "preview": d.page_content[:180].replace("\n", " ")
                }
                for d in docs
            ]
        }
