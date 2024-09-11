import { useEffect, useRef, useState } from 'react';
import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
import glassesImage from './assets/glasses.png';
import hatImage from './assets/hat.png';
import mustacheImage from './assets/mustache.png';
import { Button } from './Button';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initializeAvatar = async () => {
      if (videoRef.current && audioRef.current && canvasRef.current) {
        await avatar.init(
          {
            videoElement: videoRef.current,
          },
          audioRef.current,
          canvasRef.current,
        );
      }
    };

    initializeAvatar();

    return () => {
      avatar.disconnect();
    };
  }, []);

  const toggleAttribute = async (name: string) => {
    if (avatar.attributesList.has(name)) {
      avatar.removeAttribute(name);
    } else {
      const imageSrc =
        name === 'glasses'
          ? glassesImage
          : name === 'hat'
            ? hatImage
            : mustacheImage;
      await avatar.addAttribute(name, imageSrc);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
      <video
        ref={videoRef}
        width={512}
        height={512}
        style={{ position: 'absolute' }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        style={{ position: 'relative' }}
      />
      <audio ref={audioRef} style={{ display: 'none' }} autoPlay muted />

      <div style={{ display: 'flex', gap: '10px' }}>
        {isConnected ? (
          <>
            <Button onClick={() => avatar.stop()}>Stop</Button>
            <Button
              onClick={async () => {
                await avatar.switchAvatar(9);
                setIsConnected(true);
              }}>
              Switch
            </Button>
            <Button onClick={() => avatar.enableMicrophone()}>
              Enable Microphone
            </Button>
            <Button onClick={() => toggleAttribute('glasses')}>
              Toggle Glasses
            </Button>
            <Button onClick={() => toggleAttribute('hat')}>Toggle Hat</Button>
            <Button onClick={() => toggleAttribute('mustache')}>
              Toggle Mustache
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
