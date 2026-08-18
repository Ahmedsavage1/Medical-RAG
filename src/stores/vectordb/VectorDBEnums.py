from enum import Enum


class VectorDBProviderTypeEnum(Enum):
    CHROMA = "CHROMA"


class DistanceMethodEnum(Enum):
    COSINE = "cosine"
