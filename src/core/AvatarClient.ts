import { RemoteTrack, Room, RoomEvent } from 'livekit-client';
import { HTTPClient } from './HTTPClient';
import {
  AvatarClientConfig,
  Avatars,
  CreateRoomResponse,
  GetSupportedVoicesResponse,
  MessageState,
  MessageType,
  ParsedMessage,
  SayOptions,
  Prompt,
  TranscriptMessage,
  CreateVideoConfig,
} from './types';

export class AvatarClient extends HTTPClient {
  private room?: Room;
  private avatarId?: number;
  private isAvatarSpeaking: boolean = false;
  private avatarsAvailable: Avatars = [];
  private conversational: boolean = false;
  private initialPrompt?: Prompt[];

  private videoElement?: HTMLVideoElement;
  private audioElement?: HTMLAudioElement;

  onAvatarSpeakingChange?: (isAvatarSpeaking: boolean) => void;
  onTranscription?: (transcript: TranscriptMessage['data']) => void;
  onTrascriberStatusChange?: (status: string) => void;

  constructor(config: AvatarClientConfig) {
    super(config.baseUrl ?? 'https://avatar.alpha.school', config.apiKey);
    this.avatarId = config.avatarId;
    this.conversational = config.conversational ?? false;
    this.initialPrompt = config.initialPrompt;
  }

  async init(videoElement: HTMLVideoElement, audioElement: HTMLAudioElement) {
    this.videoElement = videoElement;
    this.audioElement = audioElement;
    await this.fetchAvatars();
  }

  async connect(avatarId?: number) {
    const { serverUrl, token } = await this.post<CreateRoomResponse>('/rooms', {
      avatarId: avatarId ?? this.avatarId,
      conversational: this.conversational,
      initialPrompt: this.initialPrompt,
    });
    const room = new Room({ adaptiveStream: true });
    this.room = room;

    room.prepareConnection(serverUrl, token);
    this.setupRoomListeners();
    room.connect(serverUrl, token);
    return room;
  }

  get avatars() {
    return this.avatarsAvailable;
  }

  get isConnected() {
    return !!this.room;
  }

  get isSpeaking() {
    return this.isAvatarSpeaking;
  }

  getAvatars() {
    return this.get<Avatars>('/avatars');
  }

  getSupportedVoices() {
    return this.get<GetSupportedVoicesResponse>('/supported-voices');
  }

  say(message: string, options?: SayOptions) {
    this.sendMessage({ message, ...options });
  }

  stop() {
    this.isAvatarSpeaking = false;
    this.sendMessage({ message: '', avatarAction: 1 });
  }

  switchAvatar(avatarId: number) {
    this.disconnect();
    this.avatarId = avatarId;
    return this.connect(avatarId);
  }

  async enableMicrophone() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.isConnected) {
        this.room?.localParticipant?.setMicrophoneEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling conversational mode:', error);
    }
  }

  async disableMicrophone() {
    if (this.isConnected) {
      this.room?.localParticipant?.setMicrophoneEnabled(false);
    }
  }

  createVideo(avatarId: number, message: string, config?: CreateVideoConfig) {
    return this.post<{ url: string }>('/videos', {
      avatarId,
      message,
      ...config,
    });
  }

  disconnect() {
    this.removeRoomListeners();
    this.room?.disconnect();
    this.room = undefined;
  }

  private setupRoomListeners() {
    if (!this.room) return;

    this.room
      .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this))
      .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this))
      .on(RoomEvent.DataReceived, this.handleDataReceived.bind(this));
  }

  private removeRoomListeners() {
    if (!this.room) return;

    this.room
      .off(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this))
      .off(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this))
      .off(RoomEvent.DataReceived, this.handleDataReceived.bind(this));
  }

  private handleTrackSubscribed(track: RemoteTrack) {
    if (track.kind === 'video' && this.videoElement) {
      track.attach(this.videoElement);
    } else if (track.kind === 'audio' && this.audioElement) {
      track.attach(this.audioElement);
    }
  }

  private handleTrackUnsubscribed(track: RemoteTrack) {
    track.detach();
  }

  private handleDataReceived(data: Uint8Array) {
    const decoder = new TextDecoder();
    const message: ParsedMessage = JSON.parse(decoder.decode(data));

    if (message.type === MessageType.State) {
      const isAvatarSpeaking = message.data.state === MessageState.Speaking;
      this.isAvatarSpeaking = isAvatarSpeaking;
      if (this.onAvatarSpeakingChange) {
        this.onAvatarSpeakingChange(isAvatarSpeaking);
      }
    }

    if (message.type === MessageType.Transcript) {
      if (this.onTranscription) {
        this.onTranscription(message.data);
      }
    }

    if (message.type === MessageType.TranscriberStatus) {
      if (this.onTrascriberStatusChange) {
        this.onTrascriberStatusChange(message.data.status);
      }
    }
  }

  private async fetchAvatars() {
    const response = await this.getAvatars();
    this.avatarsAvailable = response;
    return this.avatarsAvailable;
  }

  private async sendMessage(message: any) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    await this.room?.localParticipant?.publishData(data, { reliable: true });
  }
}
