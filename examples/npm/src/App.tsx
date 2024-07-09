import {
  AvatarClient,
  RemoteTrack,
  Room,
  RoomEvent,
} from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import React, { useEffect } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
});

export function App() {
  const [room, setRoom] = React.useState<Room>();

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (room) {
      room
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === 'video') {
            track.attach(videoRef.current!);
          } else if (track.kind === 'audio') {
            track.attach(audioRef.current!);
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        });
    }
  }, [room]);

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
        {room ? (
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
                const newAvatar = await avatar.switchAvatar(4);
                setRoom(newAvatar);
              }}>
              Switch
            </Button>
            <Button
              onClick={() => {
                avatar.disconnect();
                setRoom(undefined);
              }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              const newRoom = await avatar.connect();
              setRoom(newRoom);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
