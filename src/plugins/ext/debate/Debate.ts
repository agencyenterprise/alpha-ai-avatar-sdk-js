import { RemoteTrack, Room, RoomEvent } from 'livekit-client';
import { AvatarClient } from '../../../core/AvatarClient';
import { OpenAIClient } from '../../llm/openai';
import { GetAvatarsResponse } from '../../../core/types';

export type DebateOptions = {
  apiKey: string;
  baseUrl: string;
  openAIApiKey: string;
  openAIResourceName: string;
};

export class Debate {
  apiKey: string = '';
  baseUrl: string = '';
  openAIApiKey: string = '';
  openAIResourceName: string = '';

  openAIClient: OpenAIClient | null = null;
  avatarClientA: AvatarClient | null = null;
  avatarClientB: AvatarClient | null = null;
  roomA: Room | null = null;
  roomB: Room | null = null;

  debateTheme = '';
  debateHistory: any = [];
  debateStarted: boolean = false;
  isAvatarSpeaking: boolean = false;
  currentSpeaker: string | null = 'A';
  prompt = [{ role: 'system', content: '' }];
  avatars: GetAvatarsResponse = [];

  onDebateHistoryUpdate:
    | ((debateHistory: [{ speaker: string; content: string }] | []) => void)
    | undefined;
  onAvatarSpeakingChange: ((isAvatarSpeaking: boolean) => void) | undefined;

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
    this.avatars = avatars;
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
      this.roomA = await this.avatarClientA.connect();
      this.roomB = await this.avatarClientB.connect();
      this.setupRoomListeners(this.roomA, videoRefA, audioRefA);
      this.setupRoomListeners(this.roomB, videoRefB, audioRefB);
      this.currentSpeaker = 'A';
    }
  }

  getAvatars() {
    return this.avatars;
  }

  setupRoomListeners(
    room: Room,
    videoRef: HTMLVideoElement,
    audioRef: HTMLAudioElement,
  ) {
    room
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === 'video') {
          track.attach(videoRef);
        } else if (track.kind === 'audio') {
          track.attach(audioRef);
        }
      })
      .on(RoomEvent.DataReceived, (data) => {
        const parsedMessage = JSON.parse(new TextDecoder().decode(data));
        if (parsedMessage.type === 1) {
          this.isAvatarSpeaking = parsedMessage.data.state === 2;
          if (this.onAvatarSpeakingChange) {
            this.onAvatarSpeakingChange(this.isAvatarSpeaking);
          }
        }
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });
  }

  startDebate() {
    this.debateStarted = true;
    this.prompt = [{ role: 'system', content: '' }];
    this.debateHistory = [];
    this.debate();
  }

  async debate() {
    if (
      !this.openAIClient ||
      !this.debateStarted ||
      this.avatarClientA === null ||
      this.avatarClientB === null
    )
      return;

    const currentAvatar =
      this.currentSpeaker === 'A' ? this.avatarClientA : this.avatarClientB;
    const role = this.currentSpeaker === 'A' ? 'affirmative' : 'negative';

    const content = await this.openAIClient.getCompletions(
      'alpha-avatar-gpt-4o',
      [
        {
          role: 'system',
          content: `You are in a debate where you are supporting the ${role} side of the topic: 
          "${this.debateTheme}". ${this.currentSpeaker === 'A' ? 'Please ask the first question and wait for our opponent response to continue the debate.' : 'Please reply to the first question and wait for our opponent response to continue the debate.'} The questions and 
          answers should be related to the topic and should be in a debate format.
          Important: Only return the data I need to say, nothing more.`,
        },
        ...this.prompt,
      ],
    );

    currentAvatar.say(content);

    this.prompt.push({ role: 'user', content });
    this.debateHistory.push({ speaker: this.currentSpeaker, content });

    if (this.onDebateHistoryUpdate) {
      this.onDebateHistoryUpdate(this.debateHistory);
    }

    this.currentSpeaker = this.currentSpeaker === 'A' ? 'B' : 'A';
  }
}

// Usage example:
// const debate = new Debate({
//   apiKey: "YOUR_API_KEY",
//   baseUrl: "https://staging.avatar.alpha.school",
//   openAIApiKey: "YOUR_OPENAI_API_KEY",
//   openAIResourceName: "alpha-school-avatar-openai-westus"
// });
//
// debate.onDebateHistoryUpdate = (history) => {
//   // Update UI with debate history
// };
//
// debate.onAvatarSpeakingChange = (isSpeaking) => {
//   // Update UI to reflect speaking state
// };
//
// Returns an array of avatars available
// const avatars = debate.getAvatars();
// // Set up the debate
// debate.setAvatarA(avatarAId);
// debate.setAvatarB(avatarBId);
// debate.setDebateTheme("Is AI killing human jobs?");
// await debate.connectAvatars(videoRefA, audioRefA, videoRefB, audioRefB);
// debate.startDebate();
