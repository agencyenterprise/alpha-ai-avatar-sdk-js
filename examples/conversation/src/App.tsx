import { AvatarClient, AzureSpeechRecognition } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
});

const stt = new AzureSpeechRecognition();

export function App() {
  const [isConnected, setIsConnected] = useState(avatar.isConnected);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      avatar.init(videoRef.current, audioRef.current);
    }

    return () => {
      stt.stop();
      avatar.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      stt.start('SUBSCRIPTION_KEY', 'REGION', (transcript) => {
        avatar.say(transcript);
        console.log(transcript);
      });
    }
  }, [isConnected]);

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
            <Button onClick={() => avatar.say("Hello, I'm a robot!")}>
              Say
            </Button>
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
