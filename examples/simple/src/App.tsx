import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import React, { useEffect, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
});

export function App() {
  const [isConnected, setIsConnected] = useState(avatar.isConnected);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      avatar.init(videoRef.current, audioRef.current);
    }
    return () => {
      avatar.disconnect();
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
            <select
              onChange={(e) => avatar.switchAvatar(Number(e.target.value))}>
              {avatar.avatars.map((avatar) => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </option>
              ))}
            </select>
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
