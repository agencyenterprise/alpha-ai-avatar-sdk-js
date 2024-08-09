// Types
export type * from './core/types';

// Classes
export { AvatarClient } from './core/AvatarClient';

// LiveKit
export { RemoteTrack, Room, RoomEvent, Track } from 'livekit-client';

// Plugins
export {
  AzureSpeechRecognition, ClaudeAIClient, ClaudeContent, ClaudeResponse,
  ClaudeUsage, Debate,
  DebateHistory,
  DebateOptions, MessageParam, OpenAIClient
} from './plugins';
