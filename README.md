# Getting Started

[![npm version](https://badge.fury.io/js/alpha-ai-avatar-sdk-js.svg)](https://badge.fury.io/js/alpha-ai-avatar-sdk-js)

Hello! 👋 This tutorial will help you get started with the **Avatar SDK for JS**.

## Table of Contents

- [Getting Started](#getting-started)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Minified JS](#minified-js)
  - [Usage](#usage)
    - [Importing and Initializing](#importing-and-initializing)
      - [Available Options](#available-options)
    - [Integrating with React](#integrating-with-react)
  - [Examples](#examples)

## Installation

### NPM

To install the package, run the following command:

```bash
npm i alpha-ai-avatar-sdk-js
```

### Minified JS

To use the SDK without a package manager, you can include it with a script tag:

```javascript
<script src='https://unpkg.com/alpha-ai-avatar-sdk-js/index.js'></script>
```

The module will be exported under `Avatar` in the global namespace. When accessing symbols from the class, you'd need to prefix them with `Avatar.` For example, `AvatarClient` becomes `Avatar.AvatarClient`.

## Usage

### Importing and Initializing

To get started, first import the AvatarClient from the SDK:

```javascript
import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
```

Next, initialize `AvatarClient` outside the component with your configuration. Replace `YOUR_API_KEY` with the API key provided by our team:

```javascript
const client = new AvatarClient({ apiKey: 'YOUR_API_KEY' });
```

#### Available Options

- `apiKey` (required): Your API key for authentication.
- `baseUrl` (optional): Send `'https://staging.avatar.alpha.school'` to use the staging environment. Defaults to the production URL.

### Integrating with React

Example of a code integrating with a React app.

```javascript
import { AvatarClient } from 'alpha-ai-avatar-sdk-js';
import { Button } from './Button';
import React, { useEffect, useState } from 'react';

const avatar = new AvatarClient({
  apiKey: 'API_KEY',
});

export function App() {
  const [isConnected, setIsConnected] = useState(avatar.isConnected);

  const videoRef = React.useRef < HTMLVideoElement > null;
  const audioRef = React.useRef < HTMLAudioElement > null;

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      avatar.init(videoRef.current, audioRef.current);
    }
    return () => {
      avatar.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <audio ref={audioRef} style={{ display: 'none' }} autoPlay muted />

      <div style={{ display: 'flex', gap: '10px' }}>
        {isConnected ? (
          <>
            <select
              onChange={(e) => avatar.switchAvatar(Number(e.target.value))}>
              {avatar.avatars.map((avatar) => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </option>
              ))}
            </select>
            <Button onClick={() => avatar.say("Hello, I'm a robot!")}>
              Say
            </Button>
            <Button
              onClick={async () => {
                await avatar.stop();
              }}>
              Stop
            </Button>
            <Button
              onClick={() => {
                avatar.disconnect();
                setIsConnected(false);
              }}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={async () => {
              await avatar.connect();
              setIsConnected(true);
            }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
```

## Plugins

You can explore our comprehensive list of plugins supported within the Avatar SDK to streamline and accelerate your application development process. For detailed information about each plugin, refer to our [plugins documentation](docs/plugins).

## Examples

You can find a few examples in the [examples](examples/) folder of the library. These examples demonstrates how to configure and use the SDK in a JS project.

## Documentation

For a detailed overview of all supported methods, please refer to our comprehensive [documentation](docs/).

---

**Note:** Always ensure you keep your API key secure and do not expose it in publicly accessible code.

Congratulations! You have successfully integrated the Avatar SDK into your JS app. 🎉 Feel free to experiment and build more complex projects with avatars.
