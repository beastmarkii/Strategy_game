"""UI 클릭음 2종 (ElevenLabs 직결). 합성 소리를 코드에서 완전히 걷어내기 위한 마지막 조각."""
import os
import pathlib
import subprocess
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
ROOT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio"
RAW = ROOT / "raw"
FFMPEG = os.getenv("FFMPEG", r"C:\Users\LUO\AppData\Local\ffmpeg-bin\ffmpeg.exe")

JOBS = [
    ("ui_click", "single dry click of a bakelite switch on a wartime control panel, very short, close mic, no reverb", 1, 0.6),
    ("map_tap", "a single soft tap of a fingertip on a paper map spread over a wooden table, brief paper rustle, close mic", 1, 0.55),
]


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    for name, prompt, seconds, influence in JOBS:
        r = requests.post(
            "https://api.elevenlabs.io/v1/sound-generation",
            headers={"xi-api-key": key(), "Content-Type": "application/json"},
            json={"text": prompt, "duration_seconds": float(seconds), "prompt_influence": influence},
            timeout=300,
        )
        if r.status_code != 200:
            print(f"FAIL {name}: {r.status_code} {r.text[:300]}")
            return 1
        (RAW / f"{name}.mp3").write_bytes(r.content)
        # UI 소리는 짧아야 한다. 0.25초를 넘으면 연타할 때 서로 겹쳐 지저분해진다.
        subprocess.run([
            FFMPEG, "-y", "-i", str(RAW / f"{name}.mp3"),
            "-af", "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,"
                   "atrim=0:0.25,loudnorm=I=-20:TP=-2:LRA=11",
            "-c:a", "libmp3lame", "-b:a", "96k", "-ac", "1", "-ar", "44100",
            str(ROOT / f"{name}.mp3"),
        ], capture_output=True, check=True)
        print(f"ok {name}.mp3  {(ROOT / f'{name}.mp3').stat().st_size} B")
    return 0


if __name__ == "__main__":
    sys.exit(main())
