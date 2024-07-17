import Anthropic from '@anthropic-ai/sdk';

export type ClaudeAIClientOptions = {
  apiKey: string;
};

export type MessageParam = {
  content: string;
  role: 'user' | 'assistant';
};

export class ClaudeAIClient {
  client: Anthropic;

  constructor(options: ClaudeAIClientOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
    });
  }

  async getCompletions(
    model: string,
    prompts: MessageParam[],
    options?: any,
  ): Promise<Anthropic.Messages.Message> {
    return this.client.messages.create({
      max_tokens: 1024,
      messages: prompts,
      model: model || 'claude-3-opus-20240229',
      ...options,
    });
  }
}
