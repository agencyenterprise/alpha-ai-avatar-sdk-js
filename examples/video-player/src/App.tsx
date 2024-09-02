import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [avatarDimension, setAvatarDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 64,
    height: 64,
  });
  const [avatarPosition, setAvatarPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 80,
    y: 90,
  });
  const [layer, setLayer] = useState<{
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'image' | 'video';
  }>({
    url: '',
    x: 0,
    y: 0,
    width: 64,
    height: 64,
    type: 'image',
  });
  const [background, setBackground] = useState<string>('');

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      avatar.init(
        {
          videoElement: videoRef.current,
        },
        audioRef.current,
      );
    }
  }, []);

  const onUpdateAvatarBackground = () => {
    avatar.videoPlayer?.setBackground(background);
  };

  const onRemoveAvatarBackground = () => {
    avatar.videoPlayer?.removeBackground();
  };

  const onUpdateAvatarDimensions = () => {
    avatar.videoPlayer?.setAvatarDimensions(
      avatarDimension.width,
      avatarDimension.height,
    );
  };

  const onUpdateAvatarPosition = () => {
    avatar.videoPlayer?.setAvatarPosition(avatarPosition.x, avatarPosition.y);
  };

  const onAddLayer = async () => {
    const fileTYpe = await avatar.videoPlayer?.getURLFileType(layer.url);
    let element =
      fileTYpe === 'image' ? new Image() : document.createElement('video');

    if (fileTYpe === 'image') {
      element.src = layer.url;
      element.crossOrigin = 'anonymous';
    } else {
      const videoElement = element as HTMLVideoElement;
      videoElement.src = layer.url;
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.loop = true;
      videoElement.addEventListener('loadeddata', () => {
        videoElement.play();
      });
    }

    avatar.videoPlayer?.addLayer({
      element,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    });
  };

  const onRemoveLastLayer = () => {
    const layers = avatar.videoPlayer?.layers || [];

    if (layers.length > 0) {
      avatar.videoPlayer?.removeLayer(layers?.length - 1);
    }
  };

  const onSelectBackground = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBackground(url);
    };

    reader.readAsDataURL(file);
  };

  const onSelectLayer = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const url = event.target?.result as string;

      setLayer({
        ...layer,
        url,
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: '20px',
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <audio ref={audioRef} style={{ display: 'none' }} autoPlay muted />
        <Button
          onClick={async () => {
            await avatar.connect();
            avatar.enableMicrophone();
            setIsConnected(true);
          }}>
          Connect
        </Button>
      </div>
      {isConnected && (
        <div>
          <div>
            <h2>Set Avatar Dimensions</h2>
            <div>
              <div>
                <label>Width</label>
                <input
                  value={avatarDimension.width}
                  onChange={(event) =>
                    setAvatarDimensions({
                      ...avatarDimension,
                      width: Number(event.target.value),
                    })
                  }
                  type='number'
                  min={1}
                />
              </div>
              <div>
                <label>Height</label>
                <input
                  value={avatarDimension.height}
                  onChange={(event) =>
                    setAvatarDimensions({
                      ...avatarDimension,
                      height: Number(event.target.value),
                    })
                  }
                  type='number'
                  min={1}
                />
              </div>
              <Button onClick={onUpdateAvatarDimensions}>
                Update Avatar Dimensions
              </Button>
            </div>
          </div>
          <div>
            <h2>Set Avatar position</h2>
            <div>
              <div>
                <label>X</label>
                <input
                  value={avatarPosition.x}
                  onChange={(event) =>
                    setAvatarPosition({
                      ...avatarPosition,
                      x: Number(event.target.value),
                    })
                  }
                  type='number'
                />
              </div>
              <div>
                <label>Y</label>
                <input
                  value={avatarPosition.y}
                  type='number'
                  onChange={(event) =>
                    setAvatarPosition({
                      ...avatarPosition,
                      y: Number(event.target.value),
                    })
                  }
                />
              </div>
              <Button onClick={onUpdateAvatarPosition}>
                Update Avatar Position
              </Button>
            </div>
          </div>
          <div>
            <h2>Set Avatar Background</h2>
            <div>
              <input
                type='file'
                onChange={onSelectBackground}
                accept='image/*,video/*'
              />
              <Button onClick={onUpdateAvatarBackground}>
                Update Avatar Background
              </Button>
              <Button onClick={onRemoveAvatarBackground}>
                Remove Avatar Background
              </Button>
            </div>
          </div>
          <div>
            <h2>Add Layer</h2>
            <div>
              <div>
                <label>X</label>
                <input
                  value={layer.x}
                  onChange={(event) =>
                    setLayer({
                      ...layer,
                      x: Number(event.target.value),
                    })
                  }
                  type='number'
                />
                <label>Y</label>
                <input
                  value={layer.y}
                  onChange={(event) =>
                    setLayer({
                      ...layer,
                      y: Number(event.target.value),
                    })
                  }
                  type='number'
                />
                <label>Width</label>
                <input
                  value={layer.width}
                  onChange={(event) =>
                    setLayer({
                      ...layer,
                      width: Number(event.target.value),
                    })
                  }
                  type='number'
                />
                <label>Height</label>
                <input
                  value={layer.height}
                  onChange={(event) =>
                    setLayer({
                      ...layer,
                      height: Number(event.target.value),
                    })
                  }
                  type='number'
                />
              </div>
              <input
                type='file'
                onChange={onSelectLayer}
                accept='image/*,video/*'
              />
              <Button onClick={onAddLayer}>Add Layer</Button>
            </div>
          </div>
          <div>
            <h2>Remove layer</h2>
            <Button onClick={onRemoveLastLayer}>Remove last layer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
