from ..LLMInterface import LLMInterface
from langchain_openai import ChatOpenAI


class GroqProvider(LLMInterface):

    def __init__(self, api_key: str, base_url: str = "https://api.groq.com/openai/v1",
                 default_temperature: float = 0.1, default_max_tokens: int = 700):
        self.api_key = api_key
        self.base_url = base_url
        self.default_temperature = default_temperature
        self.default_max_tokens = default_max_tokens
        self.generation_model_id = None
        self.client = None

    def set_generation_model(self, model_id: str):
        self.generation_model_id = model_id
        self.client = ChatOpenAI(
            model=self.generation_model_id,
            base_url=self.base_url,
            api_key=self.api_key,
            temperature=self.default_temperature,
            max_tokens=self.default_max_tokens
        )

    def generate_text(self, prompt, max_output_tokens: int = None, temperature: float = None):
        if self.client is None:
            raise ValueError("Generation model not set. Call set_generation_model() first.")

        response = self.client.invoke(prompt)
        return response.content
