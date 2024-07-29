# Plugins

## Speech to Text (STT)

Converts spoken language into written text. It enables applications to transcribe audio input in real-time or from recordings, facilitating voice commands, transcription, and accessibility features.

### Azure

[Azure Speech-to-Text (STT)](https://azure.microsoft.com/en-us/products/ai-services/speech-to-text) documentation.

#### Usage

1. **Import the Plugin**

   To use the Azure Speech-to-Text plugin, start by importing it:

   ```javascript
   import { AzureSpeechRecognition } from 'alpha-ai-avatar-sdk-js/plugins/stt/azure';
   ```

2. **Configure the Plugin**

   Use the plugin by initializing it with your Azure subscription key and service region. Define a callback function to handle the recognized speech:

   ```javascript
   const azureService =  new AzureSpeechRecognition()

   azureService.start(
      'AZURE_SUBSCRIPTION_KEY',
      'SERVICE_REGION', // e.g., 'westus', 'eastus'
      onSpeechRecognized: (transcript) => {
         console.log(transcript);
         say(transcript);
      },
   )
   ```

   To stop the recognition you just need to call:

   ```javascript
   azureService.close()
   ```

3. **Example**

   For a complete example, refer to our [Using LLM example](/examples/llm).

## LLM

Large Language Model (LMM) is a type of AI (Artificial Intelligence) that can recognize and generate texts.

### Claude AI

[Claude AI](https://docs.anthropic.com/en/docs/intro-to-claude) documentation.

#### Usage

1. **Import the Plugin**

  To use Claude AI to generate a message, start by importing it:

   ```javascript
   import { ClaudeAIClient } from 'alpha-ai-avatar-sdk-js/plugins/llm/claude'
   ```

2. **Configure the Plugin**

   Use the plugin by initializing it with your Claude AI API Key.
   Then you can send a prompt to generate a response:

   ```javascript
   const claudeAIClient = new ClaudeAIClient('CLAUDE_AI_API_KEY')

   const response = await claudeAIClient.getCompletions(
      'MODEL_NAME', // eg: 'claude-3-5-sonnet-20240620'
      [
         {
            content: `You're an assistant created by Alpha School to help students with their homework`
         },
         {
            content: `What it's quantum physics?`,
            role: 'user'
         }
      ]
   )

   console.log(response.content[0].message)
   ```

3. **Example**

   For a complete example, refer to our [Using LLM example](/examples/llm).

### OpenAI

[OpenAI](https://platform.openai.com/docs/overview) documentation.

#### Usage

1. **Import the Plugin**

  To use OpenAI to generate a message, start by importing it:

   ```javascript
   import { OpenAIClient } from 'alpha-ai-avatar-sdk-js/plugins/llm/openai'
   ```

2. **Configure the Plugin**

   Use the plugin by initializing it with your OpenAI API Key.
   Then you can send a prompt to generate a response:

   ```javascript
   const openAIClient = new OpenAIClient({
      resourceName: 'OPEN_AI_AZURE_RESOURCE_NAME',
      apiKey: 'OPEN_AI_AZURE_API_KEY'
   })

   const message = await openAIClient.getCompletions(
      'DEPLOYMENT_ID',
      [
         {
            content: `You're an assistant created by Alpha School to help students with their homework`
         },
         {
            content: `What it's quantum physics?`,
            role: 'user'
         }
      ]
   )

   console.log(message)
   ```

3. **Example**

   For a complete example, refer to our [Using LLM example](/examples/llm).
