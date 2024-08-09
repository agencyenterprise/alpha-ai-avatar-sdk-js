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

export enum MessageState {
  Idle = 0,
  Loading = 1,
  Speaking = 2,
  Active = 3,
}

export enum MessageType {
  Transcript = 0,
  State = 1,
  Error = 2,
}

export type TranscriptMessage = {
  data: {
    message: string;
    role: string;
    isFinal: boolean;
  };
  type: MessageType.Transcript;
};

export type StateMessage = {
  data: {
    state: MessageState;
    message?: string;
  };
  type: MessageType.State;
};

export type ErrorMessage = {
  data: {
    message: string;
  };
  type: MessageType.Error;
};

export type ParsedMessage = TranscriptMessage | StateMessage | ErrorMessage;
