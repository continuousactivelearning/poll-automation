import { Buffer } from "buffer";

export type WhisperResult = { text: string; confidence: number };
export type AudioChunk = { data: Buffer; timestamp: number };
export type TranscriptionResult = { transcript: string; confidence: number };
export type SomeType = any; // Replace with your actual type
export * from './websocket';
export * from './HostSettings';