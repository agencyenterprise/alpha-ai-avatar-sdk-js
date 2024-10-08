import { AvatarClient, TranscriberStatus } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
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

    avatar.addEventListener(
      'transcriberStatusChange',
      transcriberStatusHandler,
    );

    return () => {
      avatar.disconnect();
      avatar.removeEventListener(
        'transcriberStatusChange',
        transcriberStatusHandler,
      );
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
                await avatar.switchAvatar(20);
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
                avatar.setMessagesHistory([
                  {
                    role: 'system',
                    content: 'Act like Cleoprata',
                  },
                ]);
              }}>
              Switch prompt
            </Button>
            <Button
              onClick={() => {
                avatar.setSynthesizerOptions({
                  voiceName: 'en-US-AndrewMultilingualNeural',
                  voiceStyle: 'default',
                  multilingualLang: 'en',
                });
              }}>
              Switch voice
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
