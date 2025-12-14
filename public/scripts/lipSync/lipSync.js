export let audioContext, analyser, audioSource, audioElement;
export let lipSyncActive = false;
export const lipSyncData = new Uint8Array(128);

export function playAudioWithLipSync(mp3Url, currentVrm, onEnded) {
  if (!currentVrm) return;

  if (!audioContext) audioContext = new AudioContext();

  audioElement = new Audio(mp3Url);
  audioElement.crossOrigin = "anonymous";

  audioSource = audioContext.createMediaElementSource(audioElement);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  audioElement.play();
  lipSyncActive = true;

  audioElement.onended = () => {
    lipSyncActive = false;
    currentVrm.expressionManager.setValue("aa", 0);
    currentVrm.expressionManager.setValue("oh", 0);
    currentVrm.expressionManager.setValue("ee", 0);

    if (onEnded) onEnded();
  };

  audioElement.onerror = (err) => {
    console.error("Audio playback error:", err);
    lipSyncActive = false;
    if (onEnded) onEnded();
  };
}
