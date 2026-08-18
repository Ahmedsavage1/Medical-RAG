from .LLMEnums import LLMProviderTypeEnum
from .providers.GroqProvider import GroqProvider


class LLMProviderFactory:

    def __init__(self, config: dict):
        self.config = config

    def create(self, provider: str):
        if provider == LLMProviderTypeEnum.GROQ.value:
            return GroqProvider(
                api_key=self.config.get("GROQ_API_KEY"),
                default_temperature=self.config.get("DEFAULT_TEMPERATURE", 0.1),
                default_max_tokens=self.config.get("DEFAULT_MAX_TOKENS", 700)
            )
        return None
    