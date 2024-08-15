import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ s3Url }: { s3Url: string }) => {
  const [videoUrl, setVideoUrl] = useState<string>();

  useEffect(() => {
    const downloadVideo = async () => {
      try {
        const response = await fetch(s3Url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } catch (error) {
        console.error('Error downloading video:', error);
      }
    };

    if (s3Url) {
      downloadVideo();
    }

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [s3Url, videoUrl]);

  return (
    <div className='video-player'>
      {videoUrl ? (
        <video controls width='100%'>
          <source src={videoUrl} type='video/mp4' />
          Your browser does not support the video tag.
        </video>
      ) : (
        <p>Loading video...</p>
      )}
    </div>
  );
};

export default VideoPlayer;
