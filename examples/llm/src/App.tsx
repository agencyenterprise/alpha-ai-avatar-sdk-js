import {
  AvatarClient,
  OpenAIClient,
  ClaudeAIClient,
  RemoteTrack,
  Room,
  RoomEvent,
} from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import React, { useEffect } from 'react';

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
  const [room, setRoom] = React.useState<Room>();

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (room) {
      room
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === 'video') {
            track.attach(videoRef.current!);
          } else if (track.kind === 'audio') {
            track.attach(audioRef.current!);
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        });
    }
  }, [room]);

  async function sayOpenAIResponse() {
    const openAIResponse = await openai.getCompletions('alpha-avatar-gpt-4o', [
      {
        role: 'user',
        content: `Hello, how are you doing?`,
      },
    ]);
    avatar.say(openAIResponse);
  }

  async function sayClaudeResponse() {
    const claudeResponse = await claude.getCompletions(
      'claude-3-opus-20240229',
      [
        {
          role: 'user',
          content: `Hello, how are you doing?`,
        },
      ],
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
        {room ? (
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
              onClick={async () => {
                const newAvatar = await avatar.switchAvatar(4);
                setRoom(newAvatar);
              }}>
              Switch
            </Button>
            <Button
              onClick={() => {
                avatar.disconnect();
                setRoom(undefined);
              }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              const newRoom = await avatar.connect();
              setRoom(newRoom);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
