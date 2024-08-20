import { AvatarClient } from '../../../core/AvatarClient';
import { Avatars } from '../../../core/types';
import { OpenAIClient } from '../../llm/openai';
import { DebateHistory, DebateOptions, Prompt } from './types';
import { getFirstSpeakerPrompt } from './utils';

export class Debate {
  private apiKey: string;
  private baseUrl: string;
  private openAIApiKey: string;
  private openAIResourceName: string;

  private openAIClient: OpenAIClient | null = null;
  private avatarClientA: AvatarClient | null = null;
  private avatarClientB: AvatarClient | null = null;

  private debateTheme: string = '';
  private debateHistory: DebateHistory[] = [];

  private currentSpeaker: string = 'A';
  private avatarsAvailable: Avatars = [];

  private prompt: Prompt[] = [];

  onDebateHistoryChange?: (debateHistory: DebateHistory[]) => void;
  onAvatarSpeakingChange?: (isAvatarSpeaking: boolean) => void;

  constructor(options: DebateOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.openAIApiKey = options.openAIApiKey;
    this.openAIResourceName = options.openAIResourceName;
  }

  async init() {
    const tempClient = new AvatarClient({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
    });

    this.openAIClient = new OpenAIClient({
      apiKey: this.openAIApiKey,
      resourceName: this.openAIResourceName,
    });

    const avatars = await tempClient.getAvatars();
    this.avatarsAvailable = avatars;
    tempClient.disconnect();
  }

  get avatars() {
    return this.avatarsAvailable;
  }

  setAvatarA(avatarId: number) {
    this.avatarClientA = new AvatarClient({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      avatarId: avatarId,
    });
  }

  setAvatarB(avatarId: number) {
    this.avatarClientB = new AvatarClient({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      avatarId: avatarId,
    });
  }

  setDebateTheme(theme: string) {
    this.debateTheme = theme;
  }

  async connectAvatars(
    videoRefA: HTMLVideoElement,
    audioRefA: HTMLAudioElement,
    videoRefB: HTMLVideoElement,
    audioRefB: HTMLAudioElement,
  ) {
    if (this.avatarClientA && this.avatarClientB) {
      this.avatarClientA.init(videoRefA, audioRefA);
      this.avatarClientB.init(videoRefB, audioRefB);

      await this.avatarClientA.connect();
      await this.avatarClientB.connect();

      this.avatarClientA.addEventListener(
        'avatarSpeakingChange',
        (isSpeaking) => {
          this.onAvatarSpeakingChange &&
            this.onAvatarSpeakingChange(isSpeaking);
        },
      );

      this.avatarClientB.addEventListener(
        'avatarSpeakingChange',
        (isSpeaking) => {
          this.onAvatarSpeakingChange &&
            this.onAvatarSpeakingChange(isSpeaking);
        },
      );

      this.currentSpeaker = 'A';
    }
  }

  async debate() {
    const avatar =
      this.currentSpeaker === 'A' ? this.avatarClientA : this.avatarClientB;
    const role = this.currentSpeaker === 'A' ? 'affirmative' : 'negative';

    const content = await this.openAIClient?.getCompletions(
      'alpha-avatar-gpt-4o',
      [
        getFirstSpeakerPrompt(this.currentSpeaker, this.debateTheme, role),
        ...this.prompt,
      ],
    );

    if (!content || !avatar) {
      return;
    }

    avatar.say(content);

    this.prompt.push({ role: 'user', content });
    this.debateHistory.push({ speaker: this.currentSpeaker, content });

    if (this.onDebateHistoryChange) {
      this.onDebateHistoryChange(this.debateHistory);
    }

    this.currentSpeaker = this.currentSpeaker === 'A' ? 'B' : 'A';
  }

  stop() {
    if (this.avatarClientA && this.avatarClientB) {
      this.clearState();
      this.stopAvatars();
      this.disconnectAvatars();
    }
  }

  private clearState() {
    this.currentSpeaker = 'A';
    this.debateTheme = '';
    this.debateHistory = [];
    this.prompt = [];
  }

  private stopAvatars() {
    if (this.avatarClientA && this.avatarClientB) {
      this.avatarClientA.stop();
      this.avatarClientB.stop();
    }
  }

  private disconnectAvatars() {
    if (this.avatarClientA && this.avatarClientB) {
      this.avatarClientA.disconnect();
      this.avatarClientB.disconnect();
    }
  }
}
