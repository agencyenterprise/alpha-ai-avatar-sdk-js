import { createMessage } from './api';
export type ClaudeAIClientOptions = {
  apiKey: string;
};

export type MessageParam = {
  content: string;
  role: 'user' | 'assistant';
};

export type ClaudeContent = {
  text: string;
  type: string;
};

export type ClaudeUsage = {
  input_tokens: number;
  output_tokens: number;
};

export type ClaudeResponse = {
  content: ClaudeContent[];
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: string | null;
  type: string;
  usage: ClaudeUsage;
};

export class ClaudeAIClient {
  apiKey: string;

  constructor(options: ClaudeAIClientOptions) {
    this.apiKey = options.apiKey;
  }

  async getCompletions(
    model: string,
    messages: MessageParam[],
  ): Promise<ClaudeResponse> {
    return createMessage(this.apiKey, model, messages);
  }
}
