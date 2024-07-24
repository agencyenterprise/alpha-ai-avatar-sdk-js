// Types
export type * from './core/types';

// Classes
export { AvatarClient } from './core/AvatarClient';

// LiveKit
export { Room, RoomEvent, Track, RemoteTrack } from 'livekit-client';

// Plugins
export {
  AzureSpeechRecognition,
  OpenAIClient,
  ClaudeAIClient,
  MessageParam,
  ClaudeResponse,
  ClaudeUsage,
  ClaudeContent,
  Debate,
  DebateHistory,
  DebateOptions,
} from './plugins';
