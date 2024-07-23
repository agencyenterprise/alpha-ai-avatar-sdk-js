import {
  AvatarClient,
  OpenAIClient,
  ClaudeAIClient,
} from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
  baseUrl: 'BASE_URL',
});

const openai = new OpenAIClient({
  apiKey: 'API_KEY',
  resourceName: 'RESOURCE_NAME',
});

const claude = new ClaudeAIClient({
  apiKey: 'API_KEY',
});

export function App() {
  const prompt: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: `Hello, how are you doing?`,
    },
  ];

  const [isConnected, setIsConnected] = useState(avatar.isConnected);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      avatar.init(videoRef.current, audioRef.current);
    }
    return () => {
      avatar.disconnect();
    };
  }, []);

  async function sayOpenAIResponse() {
    const openAIResponse = await openai.getCompletions(
      'alpha-avatar-gpt-4o',
      prompt,
    );
    avatar.say(openAIResponse);
  }

  async function sayClaudeResponse() {
    const claudeResponse = await claude.getCompletions(
      'claude-3-opus-20240229',
      prompt,
    );
    avatar.say(claudeResponse.content[0].text);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <audio ref={audioRef} style={{ display: 'none' }} autoPlay muted />

      <div style={{ display: 'flex', gap: '10px' }}>
        {isConnected ? (
          <>
            <Button onClick={sayOpenAIResponse}>Say OpenAI Response</Button>
            <Button onClick={sayClaudeResponse}>Say Claude Response</Button>
            <Button
              onClick={async () => {
                await avatar.stop();
              }}>
              Stop
            </Button>
            <Button
              onClick={() => {
                avatar.disconnect();
                setIsConnected(false);
              }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              await avatar.connect();
              setIsConnected(true);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
