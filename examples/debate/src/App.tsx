import { useState, useEffect, useRef } from 'react';
import { Debate, Avatars, DebateHistory } from 'alpha-ai-avatar-sdk-js';

const newDebate = new Debate({
  apiKey: 'API_KEY',
  baseUrl: 'BASE_URL',
  openAIApiKey: 'OPENAI_API_KEY',
  openAIResourceName: 'OPENAI_RESOURCE_NAME',
});

export const App = () => {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const audioRefA = useRef<HTMLAudioElement>(null);

  const videoRefB = useRef<HTMLVideoElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const [debate, setDebate] = useState<Debate>();
  const [debateTheme, setDebateTheme] = useState('');
  const [debateHistory, setDebateHistory] = useState<DebateHistory[]>([]);

  const [avatars, setAvatars] = useState<Avatars>([]);
  const [selectedAvatarA, setSelectedAvatarA] = useState<number>();
  const [selectedAvatarB, setSelectedAvatarB] = useState<number>();

  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  useEffect(() => {
    initDebate();
  }, []);

  useEffect(() => {
    if (debate) {
      debate.onDebateHistoryChange = (history) => {
        setDebateHistory(history);
      };

      debate.onAvatarSpeakingChange = (isSpeaking) => {
        setIsAvatarSpeaking(isSpeaking);
      };
    }
  }, [debate]);

  useEffect(() => {
    if (debate && !isAvatarSpeaking) {
      debate.debate();
    }
  }, [debate, isAvatarSpeaking]);

  const initDebate = async () => {
    await newDebate.init();
    setDebate(newDebate);
    setAvatars(newDebate.avatars);
  };

  const startDebate = async () => {
    if (debate && selectedAvatarA && selectedAvatarB && debateTheme) {
      debate.setAvatarA(selectedAvatarA);
      debate.setAvatarB(selectedAvatarB);
      debate.setDebateTheme(debateTheme);

      await debate.connectAvatars(
        videoRefA.current as HTMLVideoElement,
        audioRefA.current as HTMLAudioElement,
        videoRefB.current as HTMLVideoElement,
        audioRefB.current as HTMLAudioElement,
      );
      debate.debate();
    }
  };

  return (
    <>
      <h1>Avatar Debate</h1>

      <div style={{ display: 'flex', gap: '5px' }}>
        <label>Avatar A:</label>
        <select
          value={selectedAvatarA}
          onChange={(e) => setSelectedAvatarA(parseInt(e.target.value))}>
          <option value=''>Select Avatar</option>
          {avatars.map((avatar: any) => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <label>Avatar B:</label>
        <select
          value={selectedAvatarB}
          onChange={(e) => setSelectedAvatarB(parseInt(e.target.value))}>
          <option value=''>Select Avatar</option>
          {avatars.map((avatar: any) => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <label>Debate Theme:</label>
        <input
          type='text'
          value={debateTheme}
          onChange={(e) => setDebateTheme(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={startDebate}>Start Debate</button>
        <button
          onClick={() => {
            debate?.stop();
            setDebateTheme('');
            setDebateHistory([]);
            setIsAvatarSpeaking(false);
          }}>
          Stop Debate
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <h3>Avatar A</h3>
          <video ref={videoRefA} autoPlay muted />
          <audio ref={audioRefA} autoPlay />
        </div>
        <div>
          <h3>Avatar B</h3>
          <video ref={videoRefB} autoPlay muted />
          <audio ref={audioRefB} autoPlay />
        </div>
      </div>

      <div>
        <h2>Debate History:</h2>
        {debateHistory.map((entry: any, index) => (
          <div key={index}>
            <strong>{entry.speaker}:</strong> {entry.content}
          </div>
        ))}
      </div>
    </>
  );
};
