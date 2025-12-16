import subprocess
from pathlib import Path

# Text to speak
text = "Hello Andrew, this is Piper speaking with Amy."

# Current Windows folder
current_folder = Path().resolve()
output_file = current_folder / "amy_test.wav"

# Convert Windows path to WSL path
wsl_output_file = f"/mnt/{output_file.drive[0].lower()}{output_file.as_posix()[2:]}"

# Home directory in WSL for Piper executable and voice
wsl_home = "/home/andre"
piper_path = f"{wsl_home}/piper/piper"
voice_model = f"{wsl_home}/en_US-amy-medium.onnx"

# Run Piper via WSL
subprocess.run(
    [
        "wsl",
        piper_path,
        "--model", voice_model,
        "--output_file", wsl_output_file
    ],
    input=text.encode("utf-8")
)

print(f"Audio saved to Windows folder: {output_file}")
