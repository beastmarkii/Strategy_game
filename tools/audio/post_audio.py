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
# 음악은 이 셋 중 가장 아래에 깐다. 효과음과 같은 크기로 구우면 무전 대사가
# 음악에 묻혀서 무슨 말인지 안 들린다 — 배경음악은 들리는 것이 아니라
# 있는 줄도 모르다가 꺼 보면 허전한 것이어야 한다.
LOUD_MUSIC = "loudnorm=I=-24:TP=-2:LRA=9"
# 타이틀과 종막은 예외다. 위 값은 무전 대사 밑에 깔리는 소리의 크기인데,
# 이 두 화면에서는 위에 엉힐 말이 없다. 곱이 화면의 배경이 아니라 화면 그 자체다.
# 같은 크기로 구우면 시작 버튼을 누를 때까지 음악이 켜졌는지도 모른다.
LOUD_MUSIC_FRONT = "loudnorm=I=-18:TP=-2:LRA=9"
FRONT_MUSIC = ("music_title", "music_ending")
# 되감을 때의 이음매. 곡 끝에서 뚝 끊고 처음으로 돌아가면 딸깍 소리가 나고,
# 그 딸깍이 매 100초마다 규칙적으로 들리면 사람이 그것만 기다리게 된다.
# 앞뒤를 짧게 여닫아 숨을 한 번 쉬게 한다.
FADE_IN = 1.5
FADE_OUT = 2.5

UNITS = ("infantry", "armor", "artillery", "spArtillery", "engineer", "battalionHQ")

# 네 벌 다 같은 무전 처리를 거친다. 연합군 것만 또렷하고 추축군 것은 안 그렇다면
# 두 소리가 다른 기계에서 나오는 것으로 들린다 — 같은 무전기여야 한다.
#   <병종>_select        연합군, 내 부대 (보고)
#   <병종>_taunt         연합군, 적 부대 (쏘아붙임)
#   axis_<병종>_select   추축군, 내 부대
#   axis_<병종>_taunt    추축군, 적 부대
#   ja_<병종>_select     일본군 지휘관 밑, 내 부대
#   ja_<병종>_taunt      일본군 지휘관 밑, 적 부대
VOICES = [
    f"{prefix}{unit}_{kind}_{i}"
    for prefix in ("", "axis_", "ja_")
    for kind in ("select", "taunt")
    for unit in UNITS
    for i in (1, 2, 3)
] + ["work_complete", "unit_ready", "axis_work_complete", "axis_unit_ready",
     "ja_work_complete", "ja_unit_ready"]

# 이동과 파괴는 병종만 가른다 — 궤도가 굴러가는 소리와 포탄이 터지는 소리에는
# 국적이 없다. 사격만 진영을 따라간다: 총은 나라마다 소리가 다르고, 그 차이가
# "지금 쏘는 쪽이 누구인가"를 눈으로 확인하기 전에 알려 준다.
SFX = [
    "move_infantry_1", "move_infantry_2",
    "move_engineer_1", "move_engineer_2",
    "move_armor_1", "move_armor_2",
    "move_spart_1", "move_spart_2",
    "move_artillery_1", "move_artillery_2",
    "move_hq_1", "move_hq_2",
    "build_start_1", "build_start_2",
    "attack_rifle_1", "attack_rifle_2",
    "attack_carbine_1", "attack_carbine_2",
    "attack_sidearm_1", "attack_sidearm_2",
    "attack_tank_1", "attack_tank_2",
    "attack_howitzer_1", "attack_howitzer_2",
    "attack_spg_1", "attack_spg_2",
    "axis_attack_rifle_1", "axis_attack_rifle_2",
    "axis_attack_carbine_1", "axis_attack_carbine_2",
    "axis_attack_sidearm_1", "axis_attack_sidearm_2",
    "axis_attack_tank_1", "axis_attack_tank_2",
    "axis_attack_howitzer_1", "axis_attack_howitzer_2",
    "axis_attack_spg_1", "axis_attack_spg_2",
    "destroy_infantry_1", "destroy_infantry_2",
    "destroy_engineer_1", "destroy_engineer_2",
    "destroy_hq_1", "destroy_hq_2",
    "destroy_gun_1", "destroy_gun_2",
    "destroy_vehicle_1", "destroy_vehicle_2",
]

# 배경음악. 진영 둘 × 상황 둘 + 작전 명령서 한 장.
#   <진영>_calm   평시 — 지도를 들여다보는 시간
#   <진영>_alert  교전 — 적이 보이는 시간
#   briefing      명령서 — 판을 고르는 시간. 진영을 고르기 전이라 진영이 없다.
MUSIC = ["music_allies_calm", "music_allies_alert", "music_axis_calm", "music_axis_alert", "music_briefing", "music_title", "music_ending"]

# 지휘관 한마디. 이것만 무전 처리를 안 거친다 — 부대는 무전기 너머에 있지만
# 장군은 지금 이 방에서 명령서를 앞에 두고 말하는 사람이다. 같은 잡음을 씌우면
# 사령부가 아니라 또 하나의 무전 채널로 들린다.
COMMANDERS = [
    "cmd_patton", "cmd_montgomery", "cmd_eisenhower", "cmd_bradley",
    "cmd_zhukov", "cmd_rokossovsky", "cmd_slim",
    "cmd_rommel", "cmd_guderian", "cmd_manstein", "cmd_model",
    "cmd_yamashita", "cmd_student",
    # 그 작전에만 나오는 여섯 — 파울루스·무타구치·프라이버그·퍼시벌·리치·드골.
    "cmd_paulus", "cmd_mutaguchi", "cmd_freyberg",
    "cmd_percival", "cmd_ritchie", "cmd_degaulle",
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


def build_music(name):
    """음악은 효과음과 두 군데가 다르다 — 스테레오로 남기고, 훨씬 낮게 굽는다.

    관현악을 모노로 접으면 현과 금관이 한 점에 뭉쳐서 소리가 답답해진다.
    효과음은 지도 위 한 칸에서 나는 소리라 모노가 맞지만, 음악은 화면 전체에
    깔리는 것이므로 폭이 있어야 한다.
    """
    src = RAW / f"{name}.mp3"
    body = WORK / f"{name}.body.wav"
    run([
        FFMPEG, "-y", "-i", str(src),
        "-af", f"{TRIM_HEAD},{TRIM_TAIL},{LOUD_MUSIC_FRONT if name in FRONT_MUSIC else LOUD_MUSIC}",
        "-ac", "2", "-ar", "44100", str(body),
    ])
    # 페이드아웃 시작점은 다듬은 뒤의 길이에서 역산한다. 원본 길이로 잡으면
    # 뒤쪽 무음을 잘라낸 만큼 어긋나서 곡이 끝나기 전에 소리가 빠진다.
    seconds = duration(body)
    dest = ROOT / f"{name}.mp3"
    run([
        FFMPEG, "-y", "-i", str(body),
        "-af", f"afade=t=in:st=0:d={FADE_IN},afade=t=out:st={max(0, seconds - FADE_OUT):.3f}:d={FADE_OUT}",
        "-c:a", "libmp3lame", "-b:a", "112k", "-ac", "2", "-ar", "44100", str(dest),
    ])
    return dest


def build_plain(name):
    """무전을 안 거치는 목소리. 앞뒤 무음만 자르고 크기만 맞춘다.

    딸깍음도 잡음도 대역 제한도 없다. 이 사람은 방 안에 있기 때문이다.
    다만 크기는 부대 무전과 같은 -18 LUFS로 맞춘다 — 같은 화면에서 번갈아
    들리는 소리라, 장군만 크면 명부를 넘길 때마다 깜짝 놀라게 된다.
    관현악 명령서 음악 위에 겹치므로 모노가 아니라 스테레오로 남긴다.
    """
    src = RAW / f"{name}.mp3"
    dest = ROOT / f"{name}.mp3"
    run([
        FFMPEG, "-y", "-i", str(src),
        "-af", f"{TRIM_HEAD},{TRIM_TAIL},{LOUD_VOICE}",
        "-c:a", "libmp3lame", "-b:a", "112k", "-ac", "2", "-ar", "44100",
        str(dest),
    ])
    return dest


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    # 이름을 인자로 주면 그것만 다시 굽는다. gen_sfx.py와 같은 이유다 —
    # 통과한 소리는 건드리지 않는다.
    only = set(sys.argv[1:])
    voices = [n for n in VOICES if not only or n in only]
    sfx = [n for n in SFX if not only or n in only]
    music = [n for n in MUSIC if not only or n in only]
    plain = [n for n in COMMANDERS if not only or n in only]
    missing = only - set(VOICES) - set(SFX) - set(MUSIC) - set(COMMANDERS)
    if missing:
        print(f"모르는 이름: {', '.join(sorted(missing))}")
        return 1

    total = 0
    if voices:
        click = make_click()
        click_seconds = duration(click)
        print(f"click {click_seconds:.2f}s")
        print("\n-- voices (radio) --")
        for name in voices:
            dest = build_voice(name, click, click_seconds)
            total += dest.stat().st_size
            print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>6} B")

    if sfx:
        print("\n-- sfx --")
        for name in sfx:
            dest = build_sfx(name)
            total += dest.stat().st_size
            print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>6} B")

    if music:
        print("\n-- music --")
        for name in music:
            dest = build_music(name)
            total += dest.stat().st_size
            print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>7} B")

    if plain:
        print("\n-- commanders (no radio) --")
        for name in plain:
            dest = build_plain(name)
            total += dest.stat().st_size
            print(f"{name:<26} {duration(dest):>5.2f}s  {dest.stat().st_size:>6} B")

    shutil.rmtree(WORK, ignore_errors=True)
    print(f"\n{len(voices) + len(sfx) + len(music) + len(plain)} files, {total / 1024:.0f} KB total -> {ROOT}")


if __name__ == "__main__":
    sys.exit(main())
