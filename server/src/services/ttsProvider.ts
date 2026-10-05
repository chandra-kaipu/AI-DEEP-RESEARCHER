import OpenAI from 'openai';

export async function generateSpeechAudio(
  text: string,
  customKey?: string
): Promise<Buffer> {
  const apiKey = customKey || process.env.TTS_API_KEY || process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error('MISSING_KEY:TTS_API_KEY: Please set TTS_API_KEY or LLM_API_KEY to generate speech audio.');
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text.slice(0, 4000), // OpenAI TTS limit
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
