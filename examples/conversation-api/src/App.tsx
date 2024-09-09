import {
  AvatarClient,
  Landmarks,
  TranscriberStatus,
} from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'qwmran1fyeedsiod',
  baseUrl: 'http://localhost:5001',
  landmarks: true,
  conversational: true,
  initialPrompt: [
    {
      role: 'system',
      content: 'Act like Albert Einstein',
    },
  ],
});

export function App() {
  const [isConnected, setIsConnected] = useState(avatar.isConnected);
  const [messages, setMessages] = useState<{ message: string; role: string }[]>(
    [],
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const transcriberStatusHandler = (status: TranscriberStatus) => {
      console.log('Transcriber status', status);
    };

    if (videoRef.current && audioRef.current) {
      avatar.init(
        {
          videoElement: videoRef.current,
        },
        audioRef.current,
      );
    }

    const transcriptionHandler = (transcription: {
      message: string;
      role: string;
      isFinal: boolean;
    }) => {
      console.log('Transcription', transcription);
      if (transcription.isFinal) {
        setMessages((prev) => [...prev, transcription]);
        return;
      }
    };

    const landmakrsHandler = (landmarks: Landmarks) => {
      console.log('Landmarks', landmarks);
    };

    avatar.addEventListener(
      'transcriberStatusChange',
      transcriberStatusHandler,
    );
    avatar.addEventListener('transcription', transcriptionHandler);
    avatar.addEventListener('landmarks', landmakrsHandler);

    return () => {
      avatar.disconnect();
      avatar.removeEventListener(
        'transcriberStatusChange',
        transcriberStatusHandler,
      );
      avatar.removeEventListener('landmarks', landmakrsHandler);
    };
  }, []);

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
            <Button
              onClick={async () => {
                await avatar.stop();
              }}>
              Stop
            </Button>
            <Button
              onClick={async () => {
                await avatar.switchAvatar(9);
                setIsConnected(true);
              }}>
              Switch
            </Button>
            <Button
              onClick={() => {
                avatar.enableMicrophone();
              }}>
              Enable Microphone
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px',
        }}>
        {messages.map((message, index) => (
          <div key={index}>
            <span>{message.role}: </span>
            <span>{message.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
