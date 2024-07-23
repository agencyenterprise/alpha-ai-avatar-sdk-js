export function getFirstSpeakerPrompt(
  currentSpeaker: string,
  debateTheme: string,
  role: string,
) {
  return {
    role: 'system',
    content: `You are in a debate where you are supporting the ${role} side of the topic: "${debateTheme}". 
    ${
      currentSpeaker === 'A'
        ? 'Please ask the first question and wait for our opponent response to continue the debate.'
        : 'Please reply to the first question and wait for our opponent response to continue the debate.'
    } 
  The questions and answers should be related to the topic and should be in a debate format.
  Important: Only return the data I need to say, nothing more.`,
  };
}
