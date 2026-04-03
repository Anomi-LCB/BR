import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const embeddingModel = google.textEmbeddingModel('text-embedding-004');
export const chatModel = google('gemini-1.5-pro-latest');
