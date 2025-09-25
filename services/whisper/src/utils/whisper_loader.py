import os
from faster_whisper import WhisperModel

def load_whisper_model() -> WhisperModel:
    MODEL_NAME = os.getenv("MODEL", "tiny")

    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        print(f"⚙️ [Whisper Loader] Using device: {device}, compute_type: {compute_type}")
    except ImportError:
        device = "cpu"
        compute_type = "int8"
        print("⚠️ [Whisper Loader] PyTorch not installed. Defaulting to CPU with int8 compute_type.")
    except Exception as e:
        device = "cpu"
        compute_type = "int8"
        print(f"❌ [Whisper Loader] Failed to initialize Torch. Reason: {e}")

    try:
        model = WhisperModel(MODEL_NAME, device=device, compute_type=compute_type)
        print(f"✅ [Whisper Loader] Model '{MODEL_NAME}' loaded on {device} with {compute_type}")
        return model
    except Exception as e:
        print(f"💥 [Whisper Loader] Failed to load Whisper model '{MODEL_NAME}': {e}")
        raise e
