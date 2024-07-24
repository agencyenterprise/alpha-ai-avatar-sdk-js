export type DebateOptions = {
  apiKey: string;
  baseUrl: string;
  openAIApiKey: string;
  openAIResourceName: string;
};

export type DebateHistory = {
  speaker: string;
  content: string;
};

export type Prompt = {
  role: string;
  content: string;
};
