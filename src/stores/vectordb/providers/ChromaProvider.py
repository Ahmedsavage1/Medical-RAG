from ..VectorDBInterface import VectorDBInterface
from langchain_chroma import Chroma


class ChromaProvider(VectorDBInterface):

    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        self.vectorstore = None

    def connect(self):
        pass

    def create_collection(self, collection_name: str, embedding_function, distance_method: str = "cosine"):
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=embedding_function,
            persist_directory=self.persist_directory,
            collection_metadata={"hnsw:space": distance_method}
        )
        return self.vectorstore

    def insert_documents(self, documents: list):
        if self.vectorstore is None:
            raise ValueError("Collection not created. Call create_collection() first.")
        self.vectorstore.add_documents(documents)

    def search(self, query: str, k: int = 4):
        if self.vectorstore is None:
            raise ValueError("Collection not created. Call create_collection() first.")
        return self.vectorstore.similarity_search(query, k=k)

    def search_with_scores(self, query: str, k: int = 4):
        if self.vectorstore is None:
            raise ValueError("Collection not created. Call create_collection() first.")
        return self.vectorstore.similarity_search_with_relevance_scores(query, k=k)
