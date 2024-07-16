import {
  OpenAIClient as AzureOpenAIClient,
  AzureKeyCredential,
  Completions,
  ChatRequestMessageUnion,
} from '@azure/openai';

export class OpenAIClient {
  client: AzureOpenAIClient;

  constructor(resourceName: string, apiKey: string) {
    this.client = new AzureOpenAIClient(
      `https://${resourceName}.openai.azure.com/`,
      new AzureKeyCredential(apiKey),
    );
  }

  async getCompletions(
    deploymentId: string,
    prompts: string[],
    options?: any,
  ): Promise<Completions> {
    return this.client.getCompletions(deploymentId, prompts, options);
  }

  async streamChatCompletions(
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
