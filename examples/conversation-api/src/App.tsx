import { AvatarClient, TranscriberStatus } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';

const avatar = new AvatarClient({
  baseUrl: 'http://localhost:5000',
  apiKey: 'qwmran1fyeedsiod',
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

  const [videoHeight, setVideoHeight] = useState(0);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoPosX, setVideoPosX] = useState(0);
  const [videoPosY, setVideoPosY] = useState(0);

  const [layer, setLayer] = useState<string | null>(null);

  useEffect(() => {
    const transcriberStatusHandler = (status: TranscriberStatus) => {
      console.log('Transcriber status', status);
    };

    if (videoRef.current && audioRef.current) {
      avatar.init(
        {
          videoElement: videoRef.current,
          background:
            'https://replicate.delivery/czjl/cLcf9QleNwif8pl1FRUgV7RjzTeKU0JWKbwZLLF2KoRP6epaC/output.jpg',
          filters: ['dog'],
        },
        audioRef.current,
        // 'https://replicate.delivery/czjl/cLcf9QleNwif8pl1FRUgV7RjzTeKU0JWKbwZLLF2KoRP6epaC/output.jpg',
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

  const onChangeVideoConfig = () => {
    console.log(avatar.videoPlayer);

    avatar.videoPlayer?.setAvatarDimensions(videoHeight, videoWidth);
    avatar.videoPlayer?.setAvatarPosition(videoPosX, videoPosY);
  };

  const addExampleLayer = () => {
    const element = new Image();

    element.src = layer!;

    avatar.videoPlayer?.addLayer({
      element,
      height: 256,
      width: 256,
      x: 0,
      y: 50,
    });

    console.log(avatar.videoPlayer?.layers);
  };

  const removeExampleLayer = () => {
    avatar.videoPlayer?.removeLayer(0);

    console.log(avatar.videoPlayer?.layers);
  };

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
            <div>
              <label>Avatar Height</label>
              <input
                type='number'
                placeholder='Height'
                onChange={(e) => setVideoHeight(Number(e.target.value))}
                value={videoHeight}
              />
              <label>Avatar Width</label>
              <input
                type='number'
                placeholder='Width'
                onChange={(e) => setVideoWidth(Number(e.target.value))}
                value={videoWidth}
              />
              <label>Avatar Pos X</label>
              <input
                type='number'
                placeholder='PosX'
                onChange={(e) => setVideoPosX(Number(e.target.value))}
                value={videoPosX}
              />
              <label>Avatar Pos Y</label>
              <input
                type='number'
                placeholder='PosY'
                onChange={(e) => setVideoPosY(Number(e.target.value))}
                value={videoPosY}
              />
              <Button onClick={onChangeVideoConfig}>Change video config</Button>
            </div>
            <div>
              <label>Layer URL</label>
              <input
                type='text'
                placeholder='Layer URL'
                onChange={(e) => setLayer(e.target.value)}
                value={layer || ''}
              />
              <Button onClick={addExampleLayer}>Add Layer</Button>
              <Button onClick={removeExampleLayer}>Remove Layer</Button>
            </div>
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
              await avatar.connect(6);
              avatar.enableMicrophone();
              setIsConnected(true);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
