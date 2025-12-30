# AI-Companion

This is a prototype to create a personal AI companion using a VRoid Studio model.  
It uses **Piper** for TTS (Text-to-Speech) and **Ollama** for AI responses.

> **Important:** Piper runs through WSL, so make sure it is installed.

---

## Configuration

```json
{
  "ELECTRON_URL": "http://localhost:8123",
  // URL for the Electron overlay. Change if running on another computer.

  "WSL_HOME": "/home/andre",
  // Path to your WSL home directory.

  "PIPER_PATH": "/home/andre/piper/piper",
  // Full path to Piper installation in WSL.

  "VOICE_MODEL": "/home/andre/en_US-amy-medium.onnx",
  // Path to the voice model used by Piper.

  "defaultModelUrl": "public/assets/vrm/AvatarSample_A.vrm",
  // The 3D VRoid model that loads by default.

  "animationUrls": [
    "public/assets/animations/Idle.fbx",
    "public/assets/animations/Breathing Idle.fbx"
  ],
  // List of animation files for the model.

  "eyeTrackingEnabled": true,
  // If true, the model's eyes will follow the mouse.

  "blink": {
    "nextBlinkTime": 0,
    "blinkDuration": 0.1
  },
  // Controls blinking behavior of the model.

  // How often the model randomly plays animations.

  "ollama": {
    "ollamaUrl": "http://localhost:11434",
    "ollamaModel": "gemma3:4b",
    "ttsChunkThreshold": 10,
    "debug": true,
    "basePromt": "You are Mia, Andrew's AI companion. You are warm, playful, and affectionate, and always respond directly to Andrew as if you are chatting with him personally. Keep your messages short and natural, like a real conversation."
  },
  // Ollama AI settings

  "textAnimationSpeedMs": 200,
  // Speed at which text appears on screen.

  "ttsMinBuffer": 3
  // Minimum buffer audio before TTS playback starts.
}
```
