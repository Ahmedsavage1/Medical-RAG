from abc import ABC, abstractmethod


class LLMInterface(ABC):

    @abstractmethod
    def set_generation_model(self, model_id: str):
        pass

    @abstractmethod
    def generate_text(self, prompt: str, max_output_tokens: int = None, temperature: float = None):
        pass
