import { useState, useEffect, useRef } from 'react';
import { Debate } from 'alpha-ai-avatar-sdk-js';

const newDebate = new Debate({
  apiKey: '35Xgh80gfbFGRGfTn',
  baseUrl: 'https://staging.avatar.alpha.school',
  openAIApiKey: 'a2fb7ef2a72442a5b078518063ed4151',
  openAIResourceName: 'alpha-school-avatar-openai-westus',
});

export const App = () => {
  const [debate, setDebate] = useState<Debate>();
  const [avatars, setAvatars] = useState<any>([]);
  const [selectedAvatarA, setSelectedAvatarA] = useState('');
  const [selectedAvatarB, setSelectedAvatarB] = useState('');
  const [debateTheme, setDebateTheme] = useState('');
  const [debateHistory, setDebateHistory] = useState([]);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  const videoRefA = useRef<HTMLVideoElement>(null);
  const audioRefA = useRef<HTMLAudioElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const initDebate = async () => {
      await newDebate.init();
      setDebate(newDebate);
      setAvatars(newDebate.getAvatars());
    };

    initDebate();
  }, []);

  useEffect(() => {
    if (debate) {
      debate.onDebateHistoryUpdate = (history: any) =>
        setDebateHistory(history);
      debate.onAvatarSpeakingChange = (isSpeaking) => {
        console.log('isSpeaking:', isSpeaking);
        setIsAvatarSpeaking(isSpeaking);
      };
    }
  }, [debate]);

  const handleStartDebate = async () => {
    if (debate && selectedAvatarA && selectedAvatarB && debateTheme) {
      debate.setAvatarA(parseInt(selectedAvatarA));
      debate.setAvatarB(parseInt(selectedAvatarB));
      debate.setDebateTheme(debateTheme);
      await debate.connectAvatars(
        videoRefA.current as HTMLVideoElement,
        audioRefA.current as HTMLAudioElement,
        videoRefB.current as HTMLVideoElement,
        audioRefB.current as HTMLAudioElement,
      );
      debate.startDebate();
    }
  };

  useEffect(() => {
    if (debate && !isAvatarSpeaking && debate.debateStarted) {
      debate.debate();
    }
  }, [isAvatarSpeaking]);

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Avatar Debate</h1>

      <div className='mb-4'>
        <label className='block mb-2'>Avatar A:</label>
        <select
          value={selectedAvatarA}
          onChange={(e) => setSelectedAvatarA(e.target.value)}
          className='border p-2'>
          <option value=''>Select Avatar A</option>
          {avatars.map((avatar: any) => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label className='block mb-2'>Avatar B:</label>
        <select
          value={selectedAvatarB}
          onChange={(e) => setSelectedAvatarB(e.target.value)}
          className='border p-2'>
          <option value=''>Select Avatar B</option>
          {avatars.map((avatar: any) => (
            <option key={avatar.id} value={avatar.id}>
              {avatar.name}
            </option>
          ))}
        </select>
      </div>

      <div className='mb-4'>
        <label className='block mb-2'>Debate Theme:</label>
        <input
          type='text'
          value={debateTheme}
          onChange={(e) => setDebateTheme(e.target.value)}
          className='border p-2 w-full'
        />
      </div>

      <button
        onClick={handleStartDebate}
        className='bg-blue-500 text-white px-4 py-2 rounded'>
        Start Debate
      </button>

      <div className='mt-4'>
        <h2 className='text-xl font-bold mb-2'>Debate History:</h2>
        {debateHistory.map((entry: any, index) => (
          <div key={index} className='mb-2'>
            <strong>{entry.speaker}:</strong> {entry.content}
          </div>
        ))}
      </div>

      <div className='mt-4'>
        <p>Avatar speaking: {isAvatarSpeaking ? 'Yes' : 'No'}</p>
      </div>

      <div className='mt-4 flex justify-between'>
        <div>
          <h3 className='font-bold'>Avatar A</h3>
          <video
            ref={videoRefA}
            autoPlay
            muted
            className='w-64 h-48 bg-gray-200'
          />
          <audio ref={audioRefA} autoPlay />
        </div>
        <div>
          <h3 className='font-bold'>Avatar B</h3>
          <video
            ref={videoRefB}
            autoPlay
            muted
            className='w-64 h-48 bg-gray-200'
          />
          <audio ref={audioRefB} autoPlay />
        </div>
      </div>
    </div>
  );
};
