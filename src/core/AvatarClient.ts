import { EventEmitter } from 'events';
import {
  ConnectionState,
  RemoteTrack,
  Room,
  RoomEvent,
  RoomOptions,
} from 'livekit-client';
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
  SynthesizerOptions,
  AvatarAction,
  Landmarks,
  AvatarAttribute,
  PresetAttribute,
  Customization,
} from './types';
import { VideoPlayer } from './VideoPlayer';
import { drawGlasses, drawHat, drawMustache } from './customizations';

export class AvatarClient extends HTTPClient {
  private room?: Room;
  private avatarId?: number;
  private isAvatarSpeaking: boolean = false;
  private avatarsAvailable: Avatars = [];
  private landmarks: boolean = false;
  private conversational: boolean = false;
  private initialPrompt?: Prompt[];
  private synthesizeOptions?: SynthesizerOptions;

  private audioElement?: HTMLAudioElement;
  private _videoPlayer?: VideoPlayer;
  private videoPlayerConfig?: VideoPlayerConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private currentLandmarks: Landmarks = [];
  private targetLandmarks: Landmarks = [];
  private previousLandmarks: Landmarks = [];
  private lerpFactor: number = 0.07;
  private isLerpingActive: boolean = false;
  private animationFrameId: number | null = null;
  private readonly LERP_THRESHOLD: number = 0.01;
  private readonly MAX_DISTANCE_THRESHOLD: number = 70;

  private attributes: Map<string, AvatarAttribute> = new Map();
  private eventEmitter: EventEmitter;

  private customPreset?: Customization;

  constructor(config: AvatarClientConfig) {
    super(config.baseUrl ?? 'https://avatar.alpha.school', config.apiKey);
    this.avatarId = config.avatarId;
    this.landmarks = config.landmarks ?? false;
    this.conversational = config.conversational ?? false;
    this.initialPrompt = config.initialPrompt;
    this.synthesizeOptions = config.synthesizerOptions;
    this.eventEmitter = new EventEmitter();
  }

  async init(
    videoPlayerConfig: VideoPlayerConfig,
    audioElement: HTMLAudioElement,
    canvas?: HTMLCanvasElement,
  ) {
    this.audioElement = audioElement;
    this.videoPlayerConfig = videoPlayerConfig;
    this.canvas = canvas ?? null;
    this.ctx = canvas?.getContext('2d') ?? null;
    await this.fetchAvatars();
  }

  async connect(
    avatarId?: number,
    roomOpts: RoomOptions & Omit<AvatarClientConfig, 'apiKey'> = {
      adaptiveStream: true,
    },
  ) {
    if (roomOpts.email) {
      this.customPreset = (await this.get(
        `/users/${roomOpts.email}/customization`,
      )) as Customization;
    }

    let customAvatar: number | undefined;
    if (
      this.customPreset &&
      this.customPreset.persona.avatarId &&
      this.customPreset.persona.avatarId > 0
    ) {
      customAvatar = this.customPreset.persona.avatarId;
    }

    const { serverUrl, token } = await this.post<CreateRoomResponse>('/rooms', {
      avatarId: avatarId ?? customAvatar ?? this.avatarId,
      landmarks: roomOpts.landmarks ?? this.landmarks ?? false,
      conversational: roomOpts.conversational ?? this.conversational ?? false,
      initialPrompt: roomOpts.initialPrompt ?? this.initialPrompt,
      synthesizeOptions: roomOpts.synthesizerOptions ?? this.synthesizeOptions,
    });
    const room = new Room(roomOpts);
    this.room = room;

    await room.prepareConnection(serverUrl, token);
    this.setupRoomListeners();
    await room.connect(serverUrl, token);
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

  get attributesList() {
    return this.attributes;
  }

  getAvatars() {
    return this.get<Avatars>('/avatars');
  }

  getSupportedVoices() {
    return this.get<GetSupportedVoicesResponse>('/supported-voices');
  }

  say(message: string, options?: SynthesizerOptions) {
    this.sendMessage({ message, ...options });
  }

  stop() {
    this.isAvatarSpeaking = false;
    this.sendMessage({ message: '', avatarAction: AvatarAction.STOP });
  }

  setMessagesHistory(messages: Prompt[]) {
    this.sendMessage({
      AvatarAction: AvatarAction.UPDATE_MESSAGES,
      promptMessages: messages,
    });
  }

  setSynthesizerOptions(options: SynthesizerOptions) {
    this.sendMessage({
      avatarAction: AvatarAction.UPDATE_SYNTHESIZER_OPTIONS,
      ...options,
    });
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
      this.room?.localParticipant?.setMicrophoneEnabled(true);
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

  async addAttribute(
    name: string,
    imageSrc: string,
    drawFunction?: (
      ctx: CanvasRenderingContext2D,
      landmarks: Landmarks,
      image: HTMLImageElement,
    ) => void,
  ) {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    this.attributes.set(name, {
      image,
      draw: drawFunction || this.getPresetDrawFunction(name as PresetAttribute),
    });
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  disconnect() {
    this.stopLerping();
    this.clearRect();
    this.removeRoomListeners();
    this.room?.disconnect();
    this.room = undefined;
  }

  loadPresetAttributes() {
    if (
      this.customPreset &&
      this.customPreset.userCustomizationItems?.length > 0
    ) {
      this.customPreset.userCustomizationItems.forEach(async (data) => {
        if (!data.item.metadata) return;

        if (data.type === 'BACKGROUND') {
          this.videoPlayer?.setBackground(data.item.metadata.backgroundAsset);
        } else if (data.type === 'ACCESSORY') {
          await this.addAttribute(
            data.item.metadata.accessorySet,
            data.item.metadata.accessoryAsset,
          );
        } else if (data.type === 'VOICE') {
          this.setSynthesizerOptions({
            voiceName: data.item.metadata.azureVoiceName,
            voiceStyle: data.item.metadata.voiceStyle,
            prosody: {
              pitch: data.item.metadata.voicePitch,
              rate: data.item.metadata.voiceSpeed,
            },
          });
        }
      });
    }
  }

  private lerp(start: number, end: number): number {
    return start + (end - start) * this.lerpFactor;
  }

  private startLerping() {
    if (!this.isLerpingActive) {
      this.isLerpingActive = true;
      this.animationFrameId = requestAnimationFrame(
        this.updateAndEmitLerpedLandmarks.bind(this),
      );
    }
  }

  private stopLerping() {
    if (this.isLerpingActive) {
      this.isLerpingActive = false;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  private getPresetDrawFunction(
    preset: PresetAttribute,
  ): (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmarks,
    image: HTMLImageElement,
  ) => void {
    switch (preset) {
      case 'glasses':
        return drawGlasses;
      case 'hat':
        return drawHat;
      case 'mustache':
        return drawMustache;
      default:
        return () => {};
    }
  }

  private drawAttributes(landmarks: Landmarks) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const [_, attribute] of this.attributes.entries()) {
      attribute.draw(this.ctx, landmarks, attribute.image);
    }
  }

  private clearRect() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
      this.loadPresetAttributes();
    } else if (track.kind === 'audio' && this.audioElement) {
      track.attach(this.audioElement);
    }
  }

  private handleTrackUnsubscribed(track: RemoteTrack) {
    track.detach();

    this.destroyEmitter();

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
      this.targetLandmarks = this.processLandmarks(newLandmarks);

      if (this.currentLandmarks.length === 0) {
        this.currentLandmarks = JSON.parse(
          JSON.stringify(this.targetLandmarks),
        );
        this.emitLandmarks(this.currentLandmarks);
      }
      this.startLerping();
    }
  }

  private processLandmarks(newLandmarks: Landmarks): Landmarks {
    if (this.previousLandmarks.length === 0) {
      this.previousLandmarks = newLandmarks;
      return newLandmarks;
    }

    const processedLandmarks: Landmarks = newLandmarks.map(
      (newLandmark, index) => {
        const prevLandmark = this.previousLandmarks[index];
        if (!prevLandmark) return newLandmark;

        const distance = this.calculateDistance(newLandmark, prevLandmark);

        if (distance > this.MAX_DISTANCE_THRESHOLD) {
          return { x: prevLandmark.x, y: prevLandmark.y };
        }

        return newLandmark;
      },
    );

    this.previousLandmarks = processedLandmarks;
    return processedLandmarks;
  }

  private calculateDistance(
    landmark1: { x: number; y: number },
    landmark2: { x: number; y: number },
  ): number {
    return Math.sqrt(
      Math.pow(landmark1.x - landmark2.x, 2) +
        Math.pow(landmark1.y - landmark2.y, 2),
    );
  }

  private updateAndEmitLerpedLandmarks() {
    if (
      this.currentLandmarks.length === 0 ||
      this.targetLandmarks.length === 0
    ) {
      return;
    }

    let hasChanged = false;
    const newLandmarks: Landmarks = [];

    for (let i = 0; i < this.currentLandmarks.length; i++) {
      const current = this.currentLandmarks[i];
      const target = this.targetLandmarks[i];

      if (!current || !target) {
        newLandmarks.push(current || { x: 0, y: 0 });
        continue;
      }

      const newX = this.lerp(current.x, target.x);
      const newY = this.lerp(current.y, target.y);

      const distance = this.calculateDistance({ x: newX, y: newY }, current);

      let newLandmark: { x: number; y: number };
      if (distance > this.MAX_DISTANCE_THRESHOLD) {
        newLandmark = { x: current.x, y: current.y };
      } else {
        newLandmark = { x: newX, y: newY };
      }

      newLandmarks.push(newLandmark);

      if (
        Math.abs(newLandmark.x - current.x) > this.LERP_THRESHOLD ||
        Math.abs(newLandmark.y - current.y) > this.LERP_THRESHOLD
      ) {
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.currentLandmarks = newLandmarks;
      this.emitLandmarks(this.currentLandmarks);
      this.drawAttributes(this.currentLandmarks);
      this.animationFrameId = requestAnimationFrame(
        this.updateAndEmitLerpedLandmarks.bind(this),
      );
    } else {
      this.stopLerping();
    }
  }

  private emitLandmarks(landmarks: Landmarks) {
    this.eventEmitter.emit('landmarks', {
      state: MessageState.Active,
      message: landmarks,
    });
  }

  private destroyEmitter() {
    this.eventEmitter.removeAllListeners();
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
