# DO NOT use this code, ONLY use it as a reference to understand how the Avatar SDK is implemented.

- **Important** note which methods are async and which are not.

```javascript
export declare type AvatarClientConfig = {
  apiKey: string;
  baseUrl?: string;
  avatarId?: number;
};

export declare type Avatars = {
  id: number;
  name: string;
  thumbnail: string;
}[];

export declare type CreateRoomResponse = {
  token: string;
  serverUrl: string;
};

export declare type GetSupportedVoicesResponse = {
  displayName: string;
  shortName: string;
  gender: string;
  locale: string;
  styleList: string[];
  wordsPerMinute: string;
}[];

export declare type SayOptions = {
  voiceName?: string;
  voiceStyle?: string;
  multilingualLang?: string;
  prosody?: {
    contour?: string;
    pitch?: string;
    range?: string;
    rate?: string;
    volume?: string;
  };
  ssmlVoiceConfig?: string; // Beta
};

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
    return this.get<Avatars>('/avatars');
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
```
