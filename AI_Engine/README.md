# AI Engine - Contextual Poll Generator

## Overview
The AI Engine module is responsible for transforming audio content from instructors into rich educational polls. It converts speech to text and generates high-quality, context-aware multiple-choice questions (MCQs) to be consumed by students or learning systems.

## Modules
- **Audio to Transcript**: Converts professor lectures into clean, structured text using ASR (Automatic Speech Recognition).
- **Poll Generation**: Utilizes large language models (LLMs) to produce meaningful MCQs strictly based on lecture context.

## Features
- Transcript generation from lecture audio
- Deep context understanding using embeddings + LLM
- Outputs MCQs with 4 options, correct answer, explanation, and concept
- Sends the final JSON to the backend via HTTP

## Tech Stack
- Python 3.10+
- LangChain + Ollama (LLM and Embeddings)
- Chroma for vector storage
- FastAPI (lightweight serving)
