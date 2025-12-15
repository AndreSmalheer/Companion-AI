from flask import Flask, request, Response, render_template_string, stream_with_context
import struct
import requests

app = Flask(__name__)
TTS_SERVER = "http://127.0.0.1:9880"

HTML_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Streaming TTS Demo</title></head>
<body>
<h2>Streaming TTS Demo</h2>
<textarea id="ttsText" rows="3" cols="50">As the sun dipped below the horizon, painting the sky in shades of gold and crimson, she stood silently at the edge of the cliff, feeling the wind whip through her hair, and wondered how many more sunsets she would witness before the world changed forever.</textarea><br><br>
<button onclick="startTTS()" id="speakBtn">Speak (Stream)</button>
<button onclick="saveToFile()">Save to File (Debug)</button>
<p id="status"></p>
<p id="bufferStatus" style="color: #666; font-size: 12px;"></p>

<script>
let audioContext = null;
let nextStartTime = 0;
let isPlaying = false;
let audioBuffer = [];
let hasStartedPlaying = false;
const BUFFER_CHUNKS_THRESHOLD = 100; // number of chunks to buffer before starting playback

async function startTTS() {
    if (isPlaying) return;

    const text = document.getElementById("ttsText").value;
    const statusEl = document.getElementById("status");
    const bufferStatusEl = document.getElementById("bufferStatus");
    const btn = document.getElementById("speakBtn");

    btn.disabled = true;
    isPlaying = true;
    hasStartedPlaying = false;
    audioBuffer = [];
    statusEl.textContent = "Connecting...";
    bufferStatusEl.textContent = "Buffering...";

    if (!audioContext) audioContext = new AudioContext();
    nextStartTime = audioContext.currentTime;

    try {
        const response = await fetch('/stream_tts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text, model: "Example"})
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const reader = response.body.getReader();
        let receivedData = new Uint8Array(0);
        let headerParsed = false;
        let sampleRate = 32000;
        let channels = 1;
        let dataStartOffset = 44;

        const playbackInterval = setInterval(() => {
            // Only start playback if buffer has enough chunks
            if (audioBuffer.length >= BUFFER_CHUNKS_THRESHOLD || hasStartedPlaying) {
                if (audioBuffer.length > 0) {
                    const chunk = audioBuffer.shift();
                    playAudioChunk(chunk, sampleRate, channels);
                    bufferStatusEl.textContent = `Buffer: ${audioBuffer.length} chunks`;
                    if (!hasStartedPlaying) {
                        hasStartedPlaying = true;
                        statusEl.textContent = "Playing...";
                    }
                }
            } else {
                bufferStatusEl.textContent = `Buffering... (${audioBuffer.length}/${BUFFER_CHUNKS_THRESHOLD})`;
            }
        }, 50);

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const tmp = new Uint8Array(receivedData.length + value.length);
            tmp.set(receivedData);
            tmp.set(value, receivedData.length);
            receivedData = tmp;

            if (!headerParsed && receivedData.length >= 44) {
                const view = new DataView(receivedData.buffer);
                const riff = String.fromCharCode(...receivedData.slice(0, 4));
                if (riff !== 'RIFF') throw new Error('Invalid WAV header');
                channels = view.getUint16(22, true);
                sampleRate = view.getUint32(24, true);
                headerParsed = true;
                console.log(`WAV format: ${sampleRate}Hz, ${channels}ch`);
            }

            if (headerParsed && receivedData.length > dataStartOffset) {
                const audioData = receivedData.slice(dataStartOffset);
                if (audioData.length > 0) audioBuffer.push(audioData);
                receivedData = new Uint8Array(44);
                dataStartOffset = 44;
            }
        }

        // Final leftover
        if (headerParsed && receivedData.length > dataStartOffset) {
            audioBuffer.push(receivedData.slice(dataStartOffset));
        }

        // Wait for playback to finish
        const waitForEnd = setInterval(() => {
            if (audioBuffer.length === 0 && nextStartTime <= audioContext.currentTime) {
                clearInterval(waitForEnd);
                clearInterval(playbackInterval);
                statusEl.textContent = "Complete!";
                bufferStatusEl.textContent = "";
                btn.disabled = false;
                isPlaying = false;
            }
        }, 100);

    } catch (err) {
        console.error(err);
        statusEl.textContent = `Error: ${err.message}`;
        bufferStatusEl.textContent = "";
        btn.disabled = false;
        isPlaying = false;
    }
}

function playAudioChunk(pcmData, sampleRate, channels) {
    const samples = pcmData.length / 2;
    const float32Data = new Float32Array(samples);
    const view = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);

    for (let i = 0; i < samples; i++) {
        float32Data[i] = view.getInt16(i * 2, true) / 32768.0;
    }

    const audioBuf = audioContext.createBuffer(channels, samples, sampleRate);
    audioBuf.getChannelData(0).set(float32Data);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuf;
    source.connect(audioContext.destination);

    const startTime = Math.max(nextStartTime, audioContext.currentTime);
    source.start(startTime);
    nextStartTime = startTime + audioBuf.duration;
}

</script>

</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML_PAGE)

def make_wav_header(sample_rate=32000, bits_per_sample=16, channels=1):
    """
    Generate a streaming-compatible WAV header.
    Uses maximum file size (0xFFFFFFFF) for unknown length.
    """
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    
    # Use max values for streaming (length unknown)
    chunk_size = 0xFFFFFFFF - 8
    data_size = 0xFFFFFFFF - 44
    
    header = struct.pack('<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        chunk_size,
        b'WAVE',
        b'fmt ',
        16,
        1,
        channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b'data',
        data_size
    )
    return header

@app.route("/stream_tts", methods=["POST"])
def stream_tts():
    data = request.get_json() or {}
    payload = {
        "text": data.get("text", "Hello"),
        "text_lang": "en",
        "ref_audio_path": "C:/Projects/Companion-AI/models/Example/ref_audio.ogg",
        "prompt_lang": "en",
        "prompt_text": "You've been all over, so you must've seen a lot. When you've got the time, tell me your story, yea?",
        "streaming_mode": True,
        "media_type": "wav"
    }

    try:
        r = requests.post(f"{TTS_SERVER}/tts", json=payload, stream=True, timeout=120)
        r.raise_for_status()

        def generate():
            first_chunk = True
            
            for chunk in r.iter_content(chunk_size=4096):
                if not chunk:
                    continue
                    
                if first_chunk:
                    if len(chunk) >= 44:
                        if chunk[:4] == b'RIFF':
                            yield chunk
                            first_chunk = False
                            continue
                    
                    # Create header with 32kHz default
                    sample_rate = 32000
                    header = make_wav_header(sample_rate=sample_rate, bits_per_sample=16, channels=1)
                    yield header
                    first_chunk = False
                
                yield chunk

        return Response(
            stream_with_context(generate()), 
            mimetype="audio/wav",
            headers={
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff'
            }
        )

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 502


@app.route("/save_tts", methods=["POST"])
def save_tts():
    """Save TTS output to file for debugging"""
    data = request.get_json() or {}
    payload = {
        "text": data.get("text", "Hello"),
        "text_lang": "en",
        "ref_audio_path": "C:/Projects/Companion-AI/models/Example/ref_audio.ogg",
        "prompt_lang": "en",
        "prompt_text": "You've been all over, so you must've seen a lot. When you've got the time, tell me your story, yea?",
        "streaming_mode": False
    }

    try:
        r = requests.post(f"{TTS_SERVER}/tts", json=payload, timeout=120)
        r.raise_for_status()
        
        filename = "debug_output.wav"
        with open(filename, "wb") as f:
            f.write(r.content)
        
        return {"message": f"Saved to {filename}", "size": len(r.content)}, 200
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 502


if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)