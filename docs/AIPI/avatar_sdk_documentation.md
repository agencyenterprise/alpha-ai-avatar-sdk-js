# Interactive Avatar SDK - Documentation for Claude:

## Required Method To Import SDK:

```jsx
const [sdkIsLoaded, setSdkIsLoaded] = useState(false);
const [avatarClient, setAvatarClient] = useState(null);

useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/alpha-ai-avatar-sdk-js@0.0.1/index.js';
    script.async = true;
    script.onload = () => setSdkIsLoaded(true);
    script.onerror = (err) => throw new Error('Failed to load Alpha AI Avatar SDK. ', err);
    document.body.appendChild(script);

    return () => {
        document.body.removeChild(script);
    };
}, []);

useEffect(() => {
    if (sdkIsLoaded && window.Avatar) {
        const client = new window.Avatar.AvatarClient({
            apiKey: <API_KEY_GOES_HERE>,
            baseUrl: <API_URL_GOES_HERE>
        });
        setAvatarClient(client);
    }
}, [sdkIsLoaded]);
```

> Note: Before returning the full component, make sure the SDK is loaded

```jsx
if (!sdkLoaded) {
  return <div>Loading Alpha AI Avatar SDK...</div>;
}
```

> **Important:** You must call the `connect` method to get the room object before attaching the video and audio elements.

## Handling Avatar Rendering:

1. You need to `await` the `connect` method to get the room object, and save it to state.

- Connect method:

```jsx
const connectAvatarRoom = async () => {
  const newRoom = await avatarClient.connect();
  setRoom(newRoom);
};
```

- Connecting to a specific avatar when creating room (optional):

```jsx
const connectAvatarRoom = async () => {
  const avatarID = 29; // all avatars have a numeric ID
  const newRoom = await avatarClient.connect(avatarID);
  setRoom(newRoom);
};
```

- Disconnecting:

```jsx
const handleDisconnect = () => {
  avatarClient.disconnect();
  setRoom(null);
};
```

2. You must then attach the video and audio elements to the room object.

```jsx
const videoRef = useRef(null);
const audioRef = useRef(null);

useEffect(() => {
  if (room && window.Avatar) {
    room
      .on(window.Avatar.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'video') {
          track.attach(videoRef.current);
        } else if (track.kind === 'audio') {
          track.attach(audioRef.current);
        }
      })
      .on(window.Avatar.RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });
  }
}, [room]);
```

3. Only render the video and audio elements when the room object is available.

```jsx
{
  room ? (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className='w-full h-64 bg-gray-200 rounded'
      />
      <audio ref={audioRef} style={{ display: 'none' }} autoPlay />
    </>
  ) : (
    <button
      onClick={handleConnect}
      className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
      Connect
    </button>
  );
}
```

## Methods:

#### `avatarClient.say(message: string, options: SayOptions = {})`

- This method is used to make the avatar speak.
- This method adds each message to a queue and plays them one by one, this is designed so you can stack multiple messages in a text-stream situation since shorter chunks are better for latency.

```jsx
avatarClient.say("Hello, I'm an AI Avatar!");
```

- Advanced customization (all properties are optional).
- See section "Customizing Voice, Prosody & SSML" for more details

```jsx
type SayOptions = {
  voiceName?: string;
  voiceStyle?: string;
  multilingualLang?: string; // e.g. 'en-US', 'es-ES', 'fr-FR'
  prosody?: {
    contour?: string;
    pitch?: string; // e.g. '+20%', '-10%'
    range?: string; // e.g. '50%'
    rate?: string; // e.g. '-10%'
    volume?: string;
  };
}

// example
avatarClient.say('Hello, World!', {
  prosody: {
    contour: '(0%, 20Hz) (10%,-2st) (40%, 10Hz)',
    pitch: '+20%',
    rate: '-10%',
  },
});
```

#### `avatarClient.stop()`

- This method is used to stop the avatar mid-speech. Used if you want to interrupt the avatar speaking or clear the `say` queue.

```jsx
avatarClient.stop();
```

#### `avatarClient.getAvatars()`

- Returns array of all avatars supported by the SDK.
- Response Type:

```jsx
type Avatars = {
  id: number; // use this to switch avatar
  name: string;
  thumbnail: string;
}[]
```

#### `avatarClient.switchAvatar(id: number)`

- This method is used to switch the avatar.

```jsx
const newAvatar = await avatarClient.switchAvatar(4); // Switching to avatar with ID 4
setRoom(newAvatar);
```

#### `avatarClient.getSupportedVoices`

- Returns array of all voices supported by the SDK.
- Response Type:

```jsx
type GetSupportedVoicesResponse = {
    [language-local: string]: {
        displayName: string;
        shortName: string;
        Gender: string; // Note: capital G
        locale: string;
        styleList: string[];
        wordsPerMinute: string;
    }[]
}
// example: { en-AU: Array(14), en-CA: Array(2), en-GB: Array(17), ...}
```

- Example of configuring voice:

```jsx
avatarClient.say('Hello, World!', {
  voiceName: 'en-US-DavisNeural', // shortName
  voiceStyle: 'angry', // optional, some voices don't have any styles in `styleList[]`
});
```

# Customizing Voice:

## Empasis using `<emphasis>` tag:

```jsx
avatarClient.say(
  'I can help you join your <emphasis level="moderate">meetings</emphasis> fast.',
);
```

## Multiple languages in the same voice:

- If using a `Multilingual` voice, you can switch languages in the same `say()` method through SSML

```
avatarClient.say(`
    <lang xml:lang="es-MX">
        ¡Esperamos trabajar con usted!
    </lang>
    <lang xml:lang="en-US">
        We look forward to working with you!
    </lang>
    <lang xml:lang="fr-FR">
        Nous avons hâte de travailler avec vous!
    </lang>
`, {
    voiceName: "en-US-AvaMultilingualNeural", // All multi-lingual voices have `Multilingual` in their shortName
})
```

## Pronunciation using Phonemes:

- `alphabet` options for declaring phoneme set: ["sapi", "ipa", "x-sampa", "ups"]
- **IMPORTANT** If the specified string contains unrecognized phones, text to speech rejects the entire SSML document and produces none of the speech output specified in the document.
- For ipa, to stress one syllable by placing stress symbol before this syllable, you need to mark all syllables for the word. Or else, the syllable before this stress symbol is stressed. For sapi, if you want to stress one syllable, you need to place the stress symbol after this syllable, whether or not all syllables of the word are marked.

```jsx
// ipa example
avatarClient.say("Some say <phoneme alphabet="ipa" ph="tə.ˈmeɪ.toʊ"> tomato </phoneme> others say <phoneme alphabet="ipa" ph="təmeɪˈtoʊ"> tomato </phoneme>)

// sapi example
avatarClient.say("<phoneme alphabet="sapi" ph="iy eh n y uw eh s"> en US </phoneme>")

// x-sampa example
avatarClient.say("<phoneme alphabet='x-sampa' ph='he."lou'>hello</phoneme>")

// ups example
avatarClient.say("His name is Mike <phoneme alphabet="ups" ph="JH AU"> Zhou </phoneme>")
```
