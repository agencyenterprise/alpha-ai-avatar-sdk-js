import { useCallback, useEffect, useRef, useState } from 'react';
import { AvatarClient, Landmarks } from 'alpha-ai-avatar-sdk-js';
import glassesImage from './assets/sunglasses.png';
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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [glasses, setGlasses] = useState<HTMLImageElement | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const loadImage = useCallback(() => {
    const img = new Image();
    img.src = glassesImage;
    img.onload = () => {
      setGlasses(img);
      setImagesLoaded(true);
    };
  }, []);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }
  }, []);

  const drawGlasses = useCallback(
    (landmarks: Landmarks) => {
      if (!imagesLoaded || !ctxRef.current || !glasses) {
        console.log('Images not loaded or context not available');
        return;
      }

      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const leftEye = landmarks[133];
      const rightEye = landmarks[362];
      const noseTop = landmarks[6];

      if (!leftEye || !rightEye || !noseTop) {
        console.error('Required landmarks not detected');
        return;
      }

      const eyeDistance = Math.hypot(
        rightEye.x - leftEye.x,
        rightEye.y - leftEye.y,
      );
      const glassesWidth = eyeDistance * 3.8;
      const glassesHeight = glassesWidth * (glasses.height / glasses.width);
      const glassesX = leftEye.x - glassesWidth * 0.25;
      const glassesY = noseTop.y - glassesHeight * 0.5;

      ctx.drawImage(
        glasses,
        glassesX - 27,
        glassesY,
        glassesWidth,
        glassesHeight,
      );
    },
    [glasses, imagesLoaded],
  );

  useEffect(() => {
    const landmarksHandler = (landmarks: {
      state: number;
      message: Landmarks;
    }) => {
      drawGlasses(landmarks.message);
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
  }, [drawGlasses]);

  const clearRect = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.clearRect(0, 0, 512, 512);
    }
  }, []);

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
                clearRect();
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
