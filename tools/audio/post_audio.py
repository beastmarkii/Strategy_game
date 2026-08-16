"""생성한 원본을 게임에 바로 쓸 수 있는 상태로 굽는다.

무전 처리를 브라우저에서 실시간으로 걸지 않고 파일에 구워넣는 이유는, 재생 때마다
필터 그래프를 세우면 첫 소리가 늦게 나기 때문이다. 클릭한 순간 대답이 나와야
클릭에 대한 대답으로 들린다.

효과음은 앞뒤 무음을 잘라낸다. ElevenLabs는 요청한 길이를 정확히 채워서 돌려주므로
뒤쪽이 통째로 무음인 경우가 많고, 그대로 두면 "격파 소리가 늦게 난다"로 들린다.
"""
import os
import pathlib
import shutil
import subprocess
import sys

FFMPEG = os.getenv("FFMPEG", r"C:\Users\LUO\AppData\Local\ffmpeg-bin\ffmpeg.exe")
ROOT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio"
RAW = ROOT / "raw"
WORK = ROOT / "_work"

# 무전기 대역. 전화선보다 조금 넓게 잡아야 말이 뭉개지지 않으면서도 "기계를 거쳐 온
# 목소리"로 들린다. 압축을 세게 걸어 작은 소리까지 끌어올리는 것이 무전 특유의
# 납작한 질감을 만든다.
#
# 예전에는 여기에 acrusher(비트 크러셔)를 넣었는데, 그게 말끝마다 금속성 잔향을
# 만들어서 탬버린 흔드는 소리로 들렸다. 무전의 거친 질감은 디지털 계단이 아니라
# 잡음에서 나온다 — 크러셔를 빼고 아래 HISS를 깔아서 만든다.
RADIO = (
    "highpass=f=420,lowpass=f=2900,"
    "acompressor=threshold=-20dB:ratio=6:attack=5:release=80:makeup=3,"
    "alimiter=limit=0.95"
)
# 수신기 잡음. 목소리와 같은 대역으로 깎아야 "같은 기계에서 나오는 소리"로 들린다.
# 대사 전체에 깔리되 딸깍음과 함께 시작하고 끝나므로, 송신이 열렸다 닫히는 것으로 들린다.
#
# 이 값이 무전의 세기를 정하는 유일한 손잡이다. 0.16으로 깔았더니 대사보다 19dB
# 아래여서 사실상 안 들렸다 — 잡음 너머로 넘어오는 느낌은 12dB 안팎에서 생긴다.
# 더 지직거리게 하려면 올리고, 말이 안 들리면 내린다.
HISS_LEVEL = 0.34
HISS = f"highpass=f=500,lowpass=f=3000,volume={HISS_LEVEL}"
TRIM_HEAD = "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB"
TRIM_TAIL = "areverse," + TRIM_HEAD + ",areverse"
# 목소리를 효과음보다 낮게 잡는다. 또렷하게 앞에 나와 있으면 무전이 아니라
# 옆에서 말하는 사람이 된다 — 잡음 너머로 희미하게 넘어와야 무전이다.
LOUD_VOICE = "loudnorm=I=-18:TP=-1.5:LRA=11"
LOUD_SFX = "loudnorm=I=-17:TP=-1.5:LRA=11"

VOICES = [
    f"{unit}_select_{i}"
    for unit in ("infantry", "armor", "artillery", "spArtillery", "engineer", "battalionHQ")
    for i in (1, 2, 3)
] + ["work_complete", "unit_ready"]

SFX = [
    "move_infantry_1", "move_infantry_2",
    "move_armor_1", "move_armor_2",
    "move_artillery_1",
    "attack_rifle_1", "attack_rifle_2",
    "attack_tank_1", "attack_tank_2",
    "attack_howitzer_1", "attack_howitzer_2",
    "destroy_infantry_1", "destroy_infantry_2",
    "destroy_vehicle_1", "destroy_vehicle_2",
]


def run(args):
    proc = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        print(proc.stderr[-1500:])
        raise SystemExit(f"ffmpeg failed: {' '.join(args[:6])} ...")


def duration(path):
    proc = subprocess.run(
        [FFMPEG, "-i", str(path)], capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    # 이 머신에는 ffprobe가 없다 — ffmpeg -i 의 stderr에서 Duration을 읽는다.
    for line in proc.stderr.splitlines():
        if "Duration:" in line:
            stamp = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = stamp.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def make_click():
    """스퀠치 딸깍음. 목소리 앞뒤에 붙여 '무전으로 넘어온 말'로 만든다."""
    out = WORK / "click.wav"
    run([
        FFMPEG, "-y", "-i", str(RAW / "radio_click.mp3"),
        "-af", f"{TRIM_HEAD},atrim=0:0.22,{RADIO},{LOUD_SFX}",
        "-ac", "1", "-ar", "44100", str(out),
    ])
    return out


def build_voice(name, click, click_seconds):
    src = RAW / f"{name}.mp3"
    body = WORK / f"{name}.body.wav"
    run([
        FFMPEG, "-y", "-i", str(src),
        "-af", f"{TRIM_HEAD},{TRIM_TAIL},{RADIO},{LOUD_VOICE}",
        "-ac", "1", "-ar", "44100", str(body),
    ])
    # 앞 딸깍 - 대사 - 뒤 딸깍(작게). 뒤 딸깍은 "송신 끝"이라 반드시 있어야
    # 말이 잘린 게 아니라 끝난 것으로 들린다. 그 위에 잡음을 통째로 덮는다.
    total = duration(body) + click_seconds * 2 + 0.05
    dest = ROOT / f"{name}.mp3"
    run([
        FFMPEG, "-y",
        "-i", str(click), "-i", str(body), "-i", str(click),
        "-f", "lavfi", "-t", f"{total:.3f}", "-i", "anoisesrc=color=pink:amplitude=1:r=44100",
        "-filter_complex",
        "[0:a]volume=0.8[a];[2:a]volume=0.4[c];[a][1:a][c]concat=n=3:v=0:a=1[seq];"
        f"[3:a]{HISS}[hiss];"
        # normalize=0 이 없으면 amix가 입력 수만큼 나눠서 전체가 절반으로 준다.
        "[seq][hiss]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[out]",
        "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "96k", "-ac", "1", "-ar", "44100",
        str(dest),
    ])
    return dest


def build_sfx(name):
    src = RAW / f"{name}.mp3"
    dest = ROOT / f"{name}.mp3"
    run([
        FFMPEG, "-y", "-i", str(src),
        "-af", f"{TRIM_HEAD},{TRIM_TAIL},{LOUD_SFX}",
        "-c:a", "libmp3lame", "-b:a", "112k", "-ac", "1", "-ar", "44100",
        str(dest),
    ])
    return dest


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    click = make_click()
    click_seconds = duration(click)
    print(f"click {click_seconds:.2f}s")

    total = 0
    print("\n-- voices (radio) --")
    for name in VOICES:
        dest = build_voice(name, click, click_seconds)
        total += dest.stat().st_size
        print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>6} B")

    print("\n-- sfx --")
    for name in SFX:
        dest = build_sfx(name)
        total += dest.stat().st_size
        print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>6} B")

    shutil.rmtree(WORK, ignore_errors=True)
    print(f"\n{len(VOICES) + len(SFX)} files, {total / 1024:.0f} KB total -> {ROOT}")


if __name__ == "__main__":
    sys.exit(main())
