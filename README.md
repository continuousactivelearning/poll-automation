# Poll Automation App

Poll Automation App is a standalone, open-source web application designed to intelligently generate and manage live polls in real-time during lectures, webinars, or meetings — without being tied to any specific video conferencing platform.
# AI Research for Poll Automation System

This fork focuses on the AI research component of the Poll Automation system. The aim is to develop an AI engine capable of generating relevant multiple-choice poll questions from live speech during classroom or meeting sessions.

## Overview

The core workflow involves capturing audio input, converting it to text using a speech-to-text model, and then generating contextually appropriate questions using a language model. The system is intended to run efficiently in near real-time and support local deployment when possible.

## Evaluation of Open-Source Language Models using Ollama

Ollama is a platform for running open-source large language models locally, without requiring continuous internet access. As part of the evaluation, several models were tested for their suitability in generating poll questions from transcripts.

**Models evaluated:**
- LLaMA 2 (7B, 13B)
- Mistral
- Gemma
- Starling
- Neural Chat
- Orca Mini
- Llava
- Code LLaMA

LLaMA 2 stood out for its balance between performance and speed, especially the 7B variant. Models responded quickly and maintained good contextual understanding. The simplicity of switching models in Ollama made experimentation efficient.

**Observations:**
- Models performed well in generating relevant, clear questions from text.
- Ollama’s local runtime allowed rapid testing without needing GPU servers or cloud resources.
- Integration with frameworks like LangChain was found to be straightforward.
- Managing model size vs. speed is important for real-time performance.
- LLaMA 2 was found ideal for prototyping the AI layer of the system.

## Research on RAG and Alternative AI Architectures

Research was conducted into Retrieval-Augmented Generation (RAG) and how it compares with other approaches such as fine-tuned models, hybrid methods, and ensemble techniques.

**Key points studied:**
- RAG combines document retrieval with generative modeling, helping the system generate more accurate and context-aware questions.
- Fine-tuned models offer good performance but may lack flexibility across different topics or domains unless continuously updated.
- Hybrid and ensemble approaches were considered for cases where both precision and adaptability are required.
- Challenges included deciding which method would be best suited for live, noisy, or imperfect transcriptions.
- Risk of hallucination in pure generative models was evaluated.

A comparison framework was developed based on criteria such as question quality, processing speed, relevance to speech context, and ability to adapt to new topics.

This research will inform the decision on whether to use RAG alone or a combined approach for the final AI engine in the poll generation system.