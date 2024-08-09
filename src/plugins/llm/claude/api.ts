import { ClaudeResponse, MessageParam } from './ClaudeAIClient';

export async function createMessage(
  apiKey: string,
  model: string,
  messages: MessageParam[],
): Promise<ClaudeResponse> {
  const headers = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`https://avatar.alpha.school/claude/messages`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      api_key: apiKey,
      model: model,
      max_tokens: 1024,
      messages: messages,
    }),
  });

  return response.json();
}
