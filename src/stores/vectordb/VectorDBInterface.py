from abc import ABC, abstractmethod


class VectorDBInterface(ABC):

    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def create_collection(self, collection_name: str, embedding_function, distance_method: str):
        pass

    @abstractmethod
    def insert_documents(self, documents: list):
        pass

    @abstractmethod
    def search(self, query: str, k: int):
        pass
