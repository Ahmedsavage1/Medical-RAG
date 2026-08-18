from .VectorDBEnums import VectorDBProviderTypeEnum
from .providers.ChromaProvider import ChromaProvider


class VectorDBProviderFactory:

    def __init__(self, config: dict):
        self.config = config

    def create(self, provider: str):
        if provider == VectorDBProviderTypeEnum.CHROMA.value:
            return ChromaProvider(
                persist_directory=self.config.get("VECTOR_DB_PATH", "chroma_db")
            )
        return None
