import { HTTPClient } from './HTTPClient';
import { Room } from 'livekit-client';
import {
  AvatarClientConfig,
  CreateRoomResponse,
  GetAvatarsResponse,
  GetSupportedVoicesResponse,
  SayOptions,
} from './types';

export class AvatarClient extends HTTPClient {
  private room?: Room;
  private avatarId?: number;

  constructor(config: AvatarClientConfig) {
    super(config.baseUrl ?? 'https://avatar.alpha.school', config.apiKey);
    this.avatarId = config.avatarId;
  }

  async connect(avatarId?: number) {
    const { serverUrl, token } = await this.post<CreateRoomResponse>('/rooms', {
      avatarId: avatarId ?? this.avatarId,
    });
    const room = new Room({ adaptiveStream: true });
    room.connect(serverUrl, token);
    this.room = room;
    return room;
  }

  getAvatars() {
    return this.get<GetAvatarsResponse>('/avatars');
  }

  getSupportedVoices() {
    return this.get<GetSupportedVoicesResponse>('/supported-voices');
  }

  say(message: string, options?: SayOptions) {
    this.sendMessage({ message, ...options });
  }

  stop() {
    this.sendMessage({ message: '', avatarAction: 1 });
  }

  switchAvatar(avatarId: number) {
    this.disconnect();
    return this.connect(avatarId);
  }

  disconnect() {
    this.room?.disconnect();
  }

  private async sendMessage(message: any) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    await this.room?.localParticipant?.publishData(data, { reliable: true });
  }
}
