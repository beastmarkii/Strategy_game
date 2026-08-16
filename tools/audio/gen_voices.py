"""1944 전선 사령부 — 병종별 무전 응답 음성 생성 (ElevenLabs 직결).

하드룰: Pikaso/Magnific 커넥터의 보이스 카탈로그는 실제 ElevenLabs 보이스에
매핑되지 않으므로 프로덕션에 쓰지 않는다. 여기서는 api.elevenlabs.io 직결만 쓴다.
키는 절대 출력하지 않는다.
"""
import os
import pathlib
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
OUT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio" / "raw"
MODEL = "eleven_multilingual_v2"


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


# 병종마다 다른 사람이 대답해야 스타크래프트처럼 "누가 대답했는지"가 귀로 구분된다.
# 무전 필터를 씌우면 음색 차이가 상당히 깎이므로, 애초에 나이·억양·거칠기가
# 서로 멀리 떨어진 목소리를 고른다.
VOICES = {
    "infantry": "SOYHLrjzK2X1ezoPC6cr",     # Harry - Fierce Warrior (young, american, rough)
    "armor": "N2lVS1w4EtoT3dr4eOWO",        # Callum - Husky Trickster (middle, american)
    "artillery": "pqHfZKP75CvOlQylNhV4",    # Bill - Wise, Mature (old, american, crisp)
    "spArtillery": "IKne3meq5aSn9XLyUdCD",  # Charlie - Energetic (young, australian)
    "engineer": "iP95p4xoKVk53GoZ742B",     # Chris - Down-to-Earth (middle, american)
    "battalionHQ": "onwK4e9ZLuTAKqWW03F9",  # Daniel - Steady Broadcaster (middle, british, formal)
}

# 대사는 짧아야 한다. 클릭할 때마다 나오는 소리가 길면 두 번째 클릭에서 이미 방해가 된다.
# 세 줄씩 두는 이유는 같은 부대를 연달아 눌렀을 때 다른 말이 나오게 하기 위해서다.
LINES = {
    "infantry": [
        "Rifle squad standing by.",
        "Say the word, sir.",
        "We're dug in and waiting.",
    ],
    "armor": [
        "Tank crew ready to roll.",
        "Give me a target.",
        "Engine's warm, sir.",
    ],
    "artillery": [
        "Gun battery, laid and ready.",
        "Send me the coordinates.",
        "Tubes are cold, sir.",
    ],
    "spArtillery": [
        "Self-propelled gun, mobile and ready.",
        "We shoot and we scoot.",
        "Standing by to fire.",
    ],
    "engineer": [
        "Engineers reporting.",
        "You want it built, we'll build it.",
        "Tools are out, sir.",
    ],
    "battalionHQ": [
        "Battalion headquarters.",
        "Command post, receiving.",
        "Awaiting your orders.",
    ],
}

# 작업 완료 알림. 공사는 공병이, 부대 편성 완료는 사령부가 알린다 —
# 누가 말하는지가 곧 무슨 일이 끝났는지를 알려주므로 자막 없이도 구분된다.
EXTRA = [
    ("engineer", "work_complete", "Construction complete."),
    ("battalionHQ", "unit_ready", "New unit reporting for duty."),
]


def gen(voice_id, text, dest):
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={
            "text": text,
            "model_id": MODEL,
            "voice_settings": {
                "stability": 0.35,
                "similarity_boost": 0.75,
                "style": 0.45,
                "use_speaker_boost": True,
            },
        },
        timeout=180,
    )
    if r.status_code != 200:
        print(f"FAIL {dest.name}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    print(f"ok {dest.name}  {len(r.content)} bytes")
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # Freepik(Pikaso)으로 뽑았던 파일은 프로덕션 금지 대상이라 지운다.
    for stale in OUT.glob("infantry_select_*.mp3"):
        stale.unlink()
        print(f"removed stale {stale.name}")

    jobs = []
    for unit, lines in LINES.items():
        for i, text in enumerate(lines, start=1):
            jobs.append((VOICES[unit], f"{unit}_select_{i}", text))
    for unit, name, text in EXTRA:
        jobs.append((VOICES[unit], name, text))

    ok = 0
    for voice_id, name, text in jobs:
        if gen(voice_id, text, OUT / f"{name}.mp3"):
            ok += 1
    print(f"\n{ok}/{len(jobs)} generated -> {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
