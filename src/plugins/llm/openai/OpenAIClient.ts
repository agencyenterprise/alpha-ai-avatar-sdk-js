import {
  OpenAIClient as AzureOpenAIClient,
  AzureKeyCredential,
  ChatRequestMessageUnion,
} from '@azure/openai';

export type OpenAIClientOptions = {
  resourceName: string;
  apiKey: string;
};

export class OpenAIClient {
  client: AzureOpenAIClient;

  constructor(options: OpenAIClientOptions) {
    this.client = new AzureOpenAIClient(
      `https://${options.resourceName}.openai.azure.com/`,
      new AzureKeyCredential(options.apiKey),
    );
  }

  async getCompletions(
    deploymentId: string,
    prompts: ChatRequestMessageUnion[],
    options?: any,
  ): Promise<string> {
    let text = '';
    const events = await this.client.streamChatCompletions(
      deploymentId,
      prompts,
      options,
    );
    for await (const event of events) {
      for (const choice of event.choices) {
        const delta = choice.delta?.content;
        if (delta !== undefined) {
          text += delta;
        }
      }
    }
    return text;
  }
}
