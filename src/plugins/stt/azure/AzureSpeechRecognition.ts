import {
  AudioConfig,
  CancellationReason,
  ResultReason,
  SpeechConfig,
  SpeechRecognizer,
} from 'microsoft-cognitiveservices-speech-sdk';

import { AzureToken } from './AzureToken';

export class AzureSpeechRecognition {
  recognizer: SpeechRecognizer | undefined;

  isRunning(): boolean {
    return this.recognizer !== undefined;
  }

  async start(
    subscriptionKey: string,
    region: string,
    onSpeechRecognized: (transcript: string, isFinal: boolean) => void,
    onSpeechRecognitionEnded: () => void,
  ) {
    const token = await AzureToken.getToken(subscriptionKey, region);

    const speechConfig = SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = 'en-US';

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();

    this.recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer.recognizing = (_, event) => {
      if (event.result.reason === ResultReason.RecognizingSpeech) {
        onSpeechRecognized(event.result.text, false);
      }
    };

    this.recognizer.recognized = (_, event) => {
      if (event.result.reason === ResultReason.RecognizedSpeech) {
        onSpeechRecognized(event.result.text, true);
      }
    };

    this.recognizer.canceled = (_, event) => {
      if (event.reason === CancellationReason.Error) {
        console.error('Error in speech recognition:', event.errorDetails);
      }
      this.recognizer?.stopContinuousRecognitionAsync();
      onSpeechRecognitionEnded();
    };

    this.recognizer.sessionStopped = () => {
      this.recognizer?.stopContinuousRecognitionAsync();
      onSpeechRecognitionEnded();
    };

    await this.recognizer.startContinuousRecognitionAsync();
  }

  async stop() {
    if (this.recognizer) {
      await new Promise<void>((resolve) => {
        this.recognizer!.stopContinuousRecognitionAsync(
          () => {
            this.recognizer!.close();
            this.recognizer = undefined;
            resolve();
          },
          (error) => {
            console.error('Error stopping continuous recognition:', error);
            resolve();
          },
        );
      });
    }
  }
}
