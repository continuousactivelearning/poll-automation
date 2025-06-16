import axios from 'axios';

export async function transcribeAudio(base64Audio: string, meetingId: string, speaker: string) {
  const response = await axios.post('http://localhost:8000/transcribe', {
    audio: base64Audio,
    meetingId,
    speaker,
  });
  return response.data;
}
