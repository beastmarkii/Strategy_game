"""UI 클릭음 2종 (ElevenLabs 직결). 합성 소리를 코드에서 완전히 걷어내기 위한 마지막 조각.

처음 만든 소리는 "빈 깡통 때리는 소리"였다. 원인이 둘이었고 둘 다 여기서 고쳐 놓았다.

1) 프롬프트. 'bakelite switch on a wartime control panel' 처럼 딱딱한 재질과 넓은 공간을
   같이 적으면 금속 울림이 섞여 들어온다. 지금 프롬프트는 전부 '울리지 않는 재질 +
   죽은 공간(dry / dead room / no ring)'으로 못박아 둔다. 이 문구를 빼면 깡통으로 돌아간다.

2) 자르는 방법. 예전에는 atrim으로 그냥 잘랐는데, 잘린 자리에서 파형이 뚝 끊겨
   '퍽' 하는 잡음이 생겼다. 그래서 자르기 직전에 afade로 끝을 닫는다.

버튼음과 지도음은 서로 구분되어야 하므로 재질을 일부러 다르게 잡았다(스위치 / 종이).
지도는 버튼보다 훨씬 자주 눌리므로 3dB 정도 조용하게 맞춘다 — 그게 loudnorm 목표값의
차이(-21 대 -25)다.
"""
import os
import pathlib
import subprocess
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
ROOT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio"
RAW = ROOT / "raw"
FFMPEG = os.getenv("FFMPEG", r"C:\Users\LUO\AppData\Local\ffmpeg-bin\ffmpeg.exe")

# (파일명, 프롬프트, 남길 길이, 페이드 시작, 음량 목표, 피크 상한)
JOBS = [
    (
        "ui_click",
        "one quiet damped click of a small toggle switch, tight and short, "
        "dull not metallic, no ring, dry studio",
        0.18, 0.13, -21, -3,
    ),
    (
        "map_tap",
        "a fingertip tapping once on a thick paper map, short dry paper thud "
        "with a faint crinkle, close mic, dead room",
        0.20, 0.15, -25, -5,
    ),
    # 명령서 칸이 열릴 때 나는 소리. 앞의 둘과 성격이 반대다 — 저 둘은 손가락 소리라
    # 짧고 조용해야 하지만, 이건 빗장이 풀리고 강판 두 짝이 갈라지는 소리라 무거운
    # 쇳덩이 한 번(빗장) 뒤에 끌리는 소리(문짝)가 붙어야 한다. 화면에서 문이 680ms에
    # 걸쳐 열리므로 소리도 그 언저리(0.72초)에서 끝난다. 더 길면 문은 다 열렸는데
    # 소리만 남고, 더 짧으면 문이 소리 없이 미끄러진다.
    (
        "hatch_open",
        "a heavy steel latch snapping open with one solid metallic clunk, "
        "followed by two thick armored panels sliding apart on rails, "
        "low mechanical grind, close mic, dry, no reverb tail",
        0.72, 0.60, -23, -3,
    ),
]

# 앞쪽 무음 제거. ElevenLabs는 요청한 길이를 무음으로 채워서 돌려주므로 그대로 두면
# 클릭하고 한참 뒤에 소리가 난다.
TRIM_HEAD = "silenceremove=start_periods=1:start_duration=0.005:start_threshold=-52dB"


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    # 이름을 인자로 주면 그것만 다시 만든다. 하나가 마음에 안 들 때 나머지 둘까지
    # 다시 뽑으면 이미 통과한 소리가 매번 다른 소리로 바뀐다(생성이 매번 다르므로).
    want = set(sys.argv[1:])
    for name, prompt, keep, fade_at, loud, peak in JOBS:
        if want and name not in want:
            continue
        r = requests.post(
            "https://api.elevenlabs.io/v1/sound-generation",
            headers={"xi-api-key": key(), "Content-Type": "application/json"},
            # prompt_influence를 0.55보다 올리면 프롬프트의 '무전기/전쟁' 같은 단어에
            # 끌려가 소리가 길고 극적으로 나온다. UI 소리는 짧고 밋밋해야 한다.
            json={"text": prompt, "duration_seconds": 1.0, "prompt_influence": 0.55},
            timeout=300,
        )
        if r.status_code != 200:
            print(f"FAIL {name}: {r.status_code} {r.text[:300]}")
            return 1
        (RAW / f"{name}.mp3").write_bytes(r.content)
        # UI 소리는 0.25초를 넘으면 연타할 때 서로 겹쳐 지저분해진다.
        subprocess.run([
            FFMPEG, "-y", "-i", str(RAW / f"{name}.mp3"),
            "-af", f"{TRIM_HEAD},"
                   f"afade=t=out:st={fade_at}:d={keep - fade_at:.2f},atrim=0:{keep},"
                   f"loudnorm=I={loud}:TP={peak}:LRA=11",
            "-c:a", "libmp3lame", "-b:a", "96k", "-ac", "1", "-ar", "44100",
            str(ROOT / f"{name}.mp3"),
        ], capture_output=True, check=True)
        print(f"ok {name}.mp3  {(ROOT / f'{name}.mp3').stat().st_size} B")
    return 0


if __name__ == "__main__":
    sys.exit(main())
