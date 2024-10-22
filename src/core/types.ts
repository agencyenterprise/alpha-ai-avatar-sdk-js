import { RemoteTrack } from 'livekit-client';

export declare type AvatarClientConfig = {
  apiKey: string;
  baseUrl?: string;
  avatarId?: number;
  landmarks?: boolean;
  conversational?: boolean;
  initialPrompt?: Prompt[];
  synthesizerOptions?: SynthesizerOptions;
  email?: string;
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

export declare type SynthesizerOptions = {
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
  TranscriberState = 3,
  Landmarks = 4,
}

export enum TranscriberStatus {
  Open = 0,
  Closed = 1,
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

export type IdleStateMessage = {
  data: {
    state: MessageState.Idle;
  };
  type: MessageType.State;
};

export type SpeakingStateMessage = {
  data: {
    state: MessageState.Speaking;
    message: string;
  };
  type: MessageType.State;
};

export type TranscriberStatusMessage = {
  data: {
    status: TranscriberStatus;
  };
  type: MessageType.TranscriberState;
};

export type LandmarksMessage = {
  data: {
    state: MessageState.Active;
    message: string;
  };
  type: MessageType.Landmarks;
};

export type StateMessage = IdleStateMessage | SpeakingStateMessage;

export type ErrorMessage = {
  data: {
    message: string;
  };
  type: MessageType.Error;
};

export type ParsedMessage =
  | TranscriptMessage
  | StateMessage
  | ErrorMessage
  | TranscriberStatusMessage
  | LandmarksMessage;

export type Landmarks = {
  x: number;
  y: number;
}[];

export type Prompt = {
  role: string;
  content: string;
};

export type CreateVideoConfig = {
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
  ssmlVoiceConfig?: string;
};

export type VideoPlayerConfig = {
  videoElement: HTMLVideoElement;
  videoTrack?: RemoteTrack;
  background?: string;
  avatarConfig?: AvatarVideoConfig;
  layers?: VideoPlayerLayer[];
};

export type AvatarVideoDimension = number | 'auto';

export type AvatarVideoConfig = {
  videoX: number;
  videoY: number;
  videoWidth: AvatarVideoDimension;
  videoHeight: AvatarVideoDimension;
};

export type VideoPlayerLayer = {
  element: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
  x?: number;
  y?: number;
  height: number;
  width: number;
};

export enum AvatarAction {
  STOP = 1,
  UPDATE_MESSAGES = 2,
  UPDATE_SYNTHESIZER_OPTIONS = 3,
  UPDATE_AVATAR_VERSION = 4,
}

export type AvatarAttribute = {
  image: HTMLImageElement;
  draw: (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmarks,
    image: HTMLImageElement,
  ) => void;
};

export type PresetAttribute = 'glasses' | 'hat' | 'mustache';

export type customizationType = 'ACCESSORY' | 'BACKGROUND' | 'VOICE';

export type Customization = {
  id: number;
  userId: number;
  persona: {
    id: number;
    avatarId: number;
    hasGreenScreen: boolean;
    hasLandmarks: boolean;
  };
  userCustomizationItems: {
    id: number;
    type: customizationType;
    item: {
      id: number;
      metadata: {
        accessoryAsset: string;
        accessorySet: string;
        azureVoiceName: string;
        backgroundSet: string;
        backgroundAsset: string;
        voiceSet: string;
        voicePitch: string;
        voicePreview: string;
        voiceSpeed: string;
        voiceStyle: string;
      };
    };
  }[];
};
