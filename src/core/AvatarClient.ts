import { EventEmitter } from 'events';
import { ConnectionState, RemoteTrack, Room, RoomEvent } from 'livekit-client';
import { HTTPClient } from './HTTPClient';
import {
  AvatarClientConfig,
  Avatars,
  CreateRoomResponse,
  CreateVideoConfig,
  GetSupportedVoicesResponse,
  MessageState,
  MessageType,
  ParsedMessage,
  Prompt,
  VideoPlayerConfig,
  SayOptions,
  Landmarks,
} from './types';
import { VideoPlayer } from './VideoPlayer';

export class AvatarClient extends HTTPClient {
  private room?: Room;
  private avatarId?: number;
  private isAvatarSpeaking: boolean = false;
  private avatarsAvailable: Avatars = [];
  private landmarks: boolean = false;
  private conversational: boolean = false;
  private initialPrompt?: Prompt[];

  private audioElement?: HTMLAudioElement;
  private _videoPlayer?: VideoPlayer;
  private videoPlayerConfig?: VideoPlayerConfig;

  private currentLandmarks: Landmarks = [];
  private targetLandmarks: Landmarks = [];
  private lerpFactor: number = 0.1;
  private isLerpingActive: boolean = false;
  private lerpIntervalId: number | null = null;
  private readonly LERP_THRESHOLD: number = 0.001;

  private eventEmitter: EventEmitter;

  constructor(config: AvatarClientConfig) {
    super(config.baseUrl ?? 'https://avatar.alpha.school', config.apiKey);
    this.avatarId = config.avatarId;
    this.landmarks = config.landmarks ?? false;
    this.conversational = config.conversational ?? false;
    this.initialPrompt = config.initialPrompt;
    this.eventEmitter = new EventEmitter();
  }

  async init(
    videoPlayerConfig: VideoPlayerConfig,
    audioElement: HTMLAudioElement,
  ) {
    this.audioElement = audioElement;
    this.videoPlayerConfig = videoPlayerConfig;

    await this.fetchAvatars();
  }

  async connect(avatarId?: number) {
    const { serverUrl, token } = await this.post<CreateRoomResponse>('/rooms', {
      avatarId: avatarId ?? this.avatarId,
      landmarks: this.landmarks,
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
    return !!this.room && this.room.state === ConnectionState.Connected;
  }

  get isSpeaking() {
    return this.isAvatarSpeaking;
  }

  public get videoPlayer() {
    return this._videoPlayer;
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

  addEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, listener);
  }

  removeEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(eventName, listener);
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

  setLerpFactor(factor: number) {
    if (factor >= 0 && factor <= 1) {
      this.lerpFactor = factor;
    } else {
      console.warn('Lerp factor must be between 0 and 1');
    }
  }

  disconnect() {
    this.stopLerping();
    this.removeRoomListeners();
    this.room?.disconnect();
    this.room = undefined;
  }

  private lerp(start: number, end: number): number {
    return start + (end - start) * this.lerpFactor;
  }

  private startLerping() {
    if (!this.isLerpingActive) {
      this.isLerpingActive = true;
      this.lerpIntervalId = window.setInterval(
        () => this.updateAndEmitLerpedLandmarks(),
        1000 / 60,
      );
    }
  }

  private stopLerping() {
    if (this.isLerpingActive) {
      this.isLerpingActive = false;
      if (this.lerpIntervalId !== null) {
        window.clearInterval(this.lerpIntervalId);
        this.lerpIntervalId = null;
      }
    }
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
    if (track.kind === 'video' && this.videoPlayerConfig?.videoElement) {
      this.videoPlayerConfig.videoTrack = track;
      this._videoPlayer = new VideoPlayer(this.videoPlayerConfig);
    } else if (track.kind === 'audio' && this.audioElement) {
      track.attach(this.audioElement);
    }
  }

  private handleTrackUnsubscribed(track: RemoteTrack) {
    track.detach();

    if (track.kind === 'video') {
      this._videoPlayer?.destroy();
    }
  }

  private handleDataReceived(data: Uint8Array) {
    const decoder = new TextDecoder();
    const message: ParsedMessage = JSON.parse(decoder.decode(data));

    if (message.type === MessageType.State) {
      const isAvatarSpeaking = message.data.state === MessageState.Speaking;
      this.isAvatarSpeaking = isAvatarSpeaking;
      this.eventEmitter.emit('avatarSpeakingChange', isAvatarSpeaking);
    }

    if (message.type === MessageType.Transcript) {
      this.eventEmitter.emit('transcription', message.data);
    }

    if (message.type === MessageType.TranscriberState) {
      this.eventEmitter.emit('transcriberStatusChange', message.data.status);
    }

    if (message.type === MessageType.Landmarks) {
      const newLandmarks = JSON.parse(message.data.message) as Landmarks;
      this.targetLandmarks = newLandmarks;

      if (this.currentLandmarks.length === 0) {
        this.currentLandmarks = JSON.parse(JSON.stringify(newLandmarks));
        this.eventEmitter.emit('landmarks', {
          state: MessageState.Active,
          message: this.currentLandmarks,
        });
      }
      this.startLerping();
    }
  }

  private updateAndEmitLerpedLandmarks() {
    if (
      this.currentLandmarks.length === 0 ||
      this.targetLandmarks.length === 0
    ) {
      return;
    }

    let hasChanged = false;
    const newLandmarks: Landmarks = new Array(this.currentLandmarks.length);

    for (let i = 0; i < this.currentLandmarks.length; i++) {
      const current = this.currentLandmarks[i];
      const target = this.targetLandmarks[i];

      if (!current || !target) {
        continue;
      }

      const newX = this.lerp(current.x, target.x);
      const newY = this.lerp(current.y, target.y);

      if (
        Math.abs(newX - current.x) > this.LERP_THRESHOLD ||
        Math.abs(newY - current.y) > this.LERP_THRESHOLD
      ) {
        hasChanged = true;
      }

      newLandmarks[i] = { x: newX, y: newY };
    }

    if (hasChanged) {
      this.currentLandmarks = newLandmarks;
      this.eventEmitter.emit('landmarks', {
        state: MessageState.Active,
        message: this.currentLandmarks,
      });
    } else {
      this.stopLerping();
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
