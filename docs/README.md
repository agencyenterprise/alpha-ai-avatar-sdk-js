# Avatar SDK Functions Documentation

This documentation aims to provide a clear structure for users to easily understand and implement the Avatar SDK functionalities.

## Avatar Client

### Initialization

To create an instance of the `AvatarClient`, use the following code:

```javascript
const client = new AvatarClient({
  apiKey: 'YOUR_API_KEY', // Required: Your API key for authentication.
});
```

### Configuration Options

- **`apiKey`** (required): Your API key for authentication.
- **`baseUrl`** (optional): URL for the staging environment. Defaults to the production URL.

### Methods

- **`init`**: Init the avatar client, it's required a <video> element or / and an <audio> element.

    ```javascript
    client.init({
      videoElement: videoElement
    }, audioElement)

    ```
    - **`background`**: A URL of the background (can be an image or a video) to be applied on the avatar (only work with avatars that has green screen).
    - **`avatarConfig`**: With the avatarConfig you can configure the position and the dimension of the avatar inside the video.
    - **`layers`**: You can apply layers into the video by passing an <img>, <video> or a <canvas>

    ```javascript
    client.init({
      videoElement: videoElement,
      background: 'https://example.com/image.jpg',
      avatarConfig: {
        videoX: 60,
        videoY: 80,
        videoWidth: 254,
        videoHeight: 254,
      },
      layers: [
        {
          element: imageElement,
          x: 20,
          y: 20,
          height: 64,
          width: 64
        }
      ]
    })
    ```

- **`connect`**: Connect to the room.

    ```javascript
    client.connect(); // Optional: pass the avatar id to connect to a specific avatar.
    ```

- **`say`**: Makes the avatar say what you want with various options:

  - **`voiceName`**: Specify the voice name.
  - **`voiceStyle`**: Specify the voice style.

    ```javascript
    client.say('Hello, World!', {
      voiceName: 'en-US-DavisNeural',
      voiceStyle: 'angry',
    });
    ```

  - **`multilingualLang`**: To use a language other than English, ensure the `voiceName` supports multilingual and specify the language.

    ```javascript
    client.say('Hello, World!', {
      voiceName: 'en-US-AndrewMultilingualNeural',
      multilingualLang: 'es-ES',
    });
    ```

  - **`prosody`**: Configure pitch, contour, range, rate, and volume for text-to-speech output. Refer to [Azure documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody) for possible values.

    ```javascript
    client.sendMessage('Hello, World!', {
      voiceName: 'en-US-AndrewMultilingualNeural',
      prosody: {
        contour: '(0%, 20Hz) (10%,-2st) (40%, 10Hz)',
        pitch: 'high',
        range: '50%',
        rate: 'x-fast',
        volume: 'loud',
      },
    });
    ```

  - **`ssmlVoiceConfig`**: Allows for comprehensive SSML `voice` element configuration, including math, pauses, and silence.

    ```javascript
    client.sendMessage('', {
      multilingualLang: 'en-US',
      ssmlVoiceConfig:
        "<voice name='en-US-AndrewMultilingualNeural'><mstts:express-as style='angry'><mstts:viseme type='FacialExpression'>Hello, World!</mstts:viseme></mstts:express-as></voice>",
    });
    ```

- **`stop`**: Interrupts the avatar from speaking.

  ```javascript
  client.stop();
  ```

- **`switchAvatar`**: Switch to a different avatar available to your API Key.

  ```javascript
  client.switchAvatar(2);
  ```

- **`disconnect`**: Disconnect the avatar.
