import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
});

export function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
      {videoUrl && <VideoPlayer s3Url={videoUrl} />}

      <Button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const data = await avatar.createVideo(
            20,
            'Hello, how are you doing today?',
          );
          setVideoUrl(data.url);
          setLoading(false);
        }}>
        {loading ? 'Creating video...' : 'Create video & Play'}
      </Button>
    </div>
  );
}
