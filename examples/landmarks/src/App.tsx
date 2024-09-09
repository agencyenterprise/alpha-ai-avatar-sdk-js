import { useEffect, useRef, useState } from 'react';
import { AvatarClient, Landmarks } from 'alpha-ai-avatar-sdk-js';
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
    const landmarksHandler = (landmarks: {
      state: number;
      message: Landmarks;
    }) => {
      drawClownNose(landmarks.message);
    };

    if (videoRef.current && audioRef.current) {
      avatar.init(
        {
          videoElement: videoRef.current,
        },
        audioRef.current,
      );
    }

    avatar.addEventListener('landmarks', landmarksHandler);

    return () => {
      avatar.disconnect();
      avatar.removeEventListener('landmarks', landmarksHandler);
    };
  }, []);

  const drawClownNose = (landmarks: Landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const noseTip = landmarks[4];

    if (noseTip && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(noseTip.x, noseTip.y, 40, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeStyle = 'darkred';
      ctx.lineWidth = 2;
      ctx.stroke();
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
            <Button
              onClick={() => {
                avatar.disconnect();
                setIsConnected(false);

                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              await avatar.connect(9);
              setIsConnected(true);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
