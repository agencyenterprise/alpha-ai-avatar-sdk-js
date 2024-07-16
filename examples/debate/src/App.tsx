import React, { useState, useEffect, useRef, FC } from 'react';
import {
  AvatarClient,
  OpenAIClient,
  RemoteTrack,
  Room,
  RoomEvent,
} from 'alpha-ai-avatar-sdk-js';

enum MessageState {
  Idle = 0,
  Loading = 1,
  Speaking = 2,
  Active = 3,
}

enum MessageType {
  Transcript = 0,
  State = 1,
  Error = 2,
}

type ParsedMessage = {
  data: {
    message: string;
    state: MessageState;
  };
  type: MessageType;
};

type AvatarDisplayProps = {
  avatarId: number;
  room: Room | undefined;
  onAvatarSpeaking: (isSpeaking: boolean) => void;
};

const AvatarDisplay: FC<AvatarDisplayProps> = ({
  avatarId,
  room,
  onAvatarSpeaking,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
        .on(RoomEvent.DataReceived, (data: Uint8Array) => {
          const parsedMessage: ParsedMessage = JSON.parse(
            new TextDecoder().decode(data),
          );
          if (parsedMessage.type === MessageType.State) {
            if (parsedMessage.data.state === MessageState.Speaking) {
              onAvatarSpeaking(true);
            } else {
              onAvatarSpeaking(false);
            }
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });
    }
  }, [room]);

  return (
    <div>
      <h3>Avatar {avatarId}</h3>
      <video ref={videoRef} autoPlay playsInline muted />
      <audio ref={audioRef} style={{ display: 'none' }} autoPlay muted />
    </div>
  );
};

const openAIClient = new OpenAIClient('AZURE_RESOURCE_NAME', 'API_KEY');

const CLIENT_A = 20;
const CLIENT_B = 42;

export const App = () => {
  const avatarClientA = useRef<AvatarClient>();
  const avatarClientB = useRef<AvatarClient>();

  const [prompt, setPrompt] = useState([{ role: 'system', content: '' }]);
  const [avatarRoomA, setAvatarRoomA] = useState<Room>();
  const [avatarRoomB, setAvatarRoomB] = useState<Room>();
  const [currentSpeaker, setCurrentSpeaker] = useState(CLIENT_A);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  useEffect(() => {
    const connectAvatar = async (
      avatarId: number,
      setRoom: React.Dispatch<React.SetStateAction<Room | undefined>>,
    ) => {
      const client = new AvatarClient({
        apiKey: 'API_KEY',
        baseUrl: 'BASE_URL',
        avatarId: avatarId,
      });

      try {
        const room = await client.connect();
        setRoom(room);
        return client;
      } catch (error) {
        console.error(`Failed to connect avatar ${avatarId}:`, error);
        return client;
      }
    };

    connectAvatar(CLIENT_A, setAvatarRoomA).then(
      (client) => (avatarClientA.current = client),
    );
    connectAvatar(CLIENT_B, setAvatarRoomB).then(
      (client) => (avatarClientB.current = client),
    );

    return () => {
      avatarClientA.current?.disconnect();
      avatarClientB.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isAvatarSpeaking && avatarRoomA && avatarRoomB) {
      debate();
    }
  }, [isAvatarSpeaking, avatarRoomA, avatarRoomB]);

  const debate = async () => {
    let content = '';
    if (currentSpeaker === CLIENT_A) {
      content = await openAIClient.streamChatCompletions(
        'alpha-avatar-gpt-4o',
        [
          {
            role: 'system',
            content: `You are in a debate where you are supporting the idea of 
            "AI is killing human jobs". Please ask the first question and wait 
            for our opponent response to continue the debate. The questions and 
            answers should be related to the topic and should be in a debate format.
            Important: Only return the data I need to say, nothing more.`,
          },
          ...prompt,
        ],
      );
      avatarClientA.current?.say(content);
    } else {
      content = await openAIClient.streamChatCompletions(
        'alpha-avatar-gpt-4o',
        [
          {
            role: 'system',
            content: `You are in a debate where you are against the idea of 
            "AI is killing human jobs". Please reply to the first question and wait for 
            our opponent response to continue the debate. The questions and 
            answers should be related to the topic and should be in a debate format.
            Important: Only return the data I need to say, nothing more.`,
          },
          ...prompt,
        ],
      );
      avatarClientB.current?.say(content);
    }

    console.log(content);
    setPrompt((prev) => [...prev, { role: 'user', content }]);
    currentSpeaker === 2 ? setCurrentSpeaker(4) : setCurrentSpeaker(2);
    sleep(500);
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}>
      <AvatarDisplay
        avatarId={2}
        room={avatarRoomA}
        onAvatarSpeaking={setIsAvatarSpeaking}
      />
      <AvatarDisplay
        avatarId={4}
        room={avatarRoomB}
        onAvatarSpeaking={setIsAvatarSpeaking}
      />
    </div>
  );
};
