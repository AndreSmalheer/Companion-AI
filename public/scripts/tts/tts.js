import { playAudioWithLipSync } from "../lipSync/lipSync.js";

export const callTTS = (() => {
  const ttsQueue = [];
  let isPlaying = false;

  const playNext = () => {
    if (ttsQueue.length === 0) {
      isPlaying = false;
      return;
    }

    isPlaying = true;
    const nextInput = ttsQueue.shift();

    console.log("Processing TTS:", nextInput);

    const url = `http://127.0.0.1:5000/say?text=${encodeURIComponent(
      nextInput
    )}`;

    playAudioWithLipSync(url, window.vrm, () => {
      console.log("Finished TTS:", nextInput);
      playNext();
    });
  };

  return (input) => {
    console.log("Queueing TTS for:", input);
    ttsQueue.push(input);
    if (!isPlaying) playNext();
  };
})();
