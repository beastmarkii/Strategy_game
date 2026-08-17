"""1944 전선 사령부 — 배경음악 생성 (ElevenLabs 직결 /v1/music).

넉 장이다. 진영 둘 × 상황 둘.

  <진영>_calm   평시   — 명령을 내리는 시간. 지도를 들여다보고 다음 수를 고른다.
  <진영>_alert  교전   — 적이 보이는 시간. 손이 빨라져야 한다.

진영을 가르는 이유는 효과음과 같다. 연합군 판과 추축군 판이 같은 노래를 쓰면
"내가 어느 쪽인가"가 소리로는 안 들린다. 다만 가르는 축이 효과음과 다르다 —
총소리는 무기가 다르지만 음악은 조성이 다르다. 연합군은 장조로 트인 소리(넓은
들판과 진군), 추축군은 단조로 죄인 소리(쇠와 행진)로 간다.

상황을 가르는 이유는 더 단순하다. 평시 음악이 계속 흐르면 적을 만나도 화면이
같은 온도로 보인다. 북이 빨라지는 순간이 "지금부터 다르다"를 말해 준다.

길이는 100초. 짧으면 같은 마디가 자꾸 돌아와 귀에 걸리고, 길면 판마다 앞부분만
듣고 끝난다. 한 턴을 넘길 만한 길이가 이쯤이다.

하드룰: Pikaso/Magnific 커넥터는 프로덕션 금지. api.elevenlabs.io 직결만 쓴다.
키는 절대 출력하지 않는다.
"""
import os
import pathlib
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
OUT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio" / "raw"
URL = "https://api.elevenlabs.io/v1/music"
LENGTH_MS = 100_000


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


# (파일명, 프롬프트)
#
# 프롬프트에 "no vocals"를 반드시 넣는다. 사람 목소리가 섞이면 무전 대사와
# 겹쳐서 둘 다 안 들린다. "loopable"도 넣는다 — 곡을 끝내려 들면 마지막에
# 크게 마무리하고 무음으로 떨어지는데, 그러면 되감을 때마다 침묵이 생긴다.
JOBS = [
    # ── 연합군 ──────────────────────────────────────────────────────────
    # 넓게 트인 장조. 미국 전쟁영화의 그 소리다 — 호른 하나가 멀리서 선율을
    # 끌고 가고 현이 받친다. 북은 아주 멀리, 거의 안 들리게.
    ("music_allies_calm",
     "Peaceful orchestral underscore for a wartime command map room. Warm sustained strings and a "
     "single distant French horn carrying a broad hopeful melody, soft woodwinds answering, very "
     "quiet timpani rolls far in the background. Slow, around 60 BPM, major key, dignified and "
     "restrained, no percussion drive, no build to a climax, even loopable texture throughout, "
     "instrumental only, no vocals"),

    # 북이 앞으로 나온다. 스네어가 행군 속도로 계속 굴러가고 팀파니가 박을 친다.
    # 금관은 짧게 끊어 찌르는 식 — 길게 늘이면 웅장하기만 하고 급하지 않다.
    ("music_allies_alert",
     "Tense heroic orchestral battle cue. Fast driving military snare drum rolls and pounding "
     "timpani in front, urgent low string ostinato underneath, short stabbing brass fanfare figures, "
     "American war film scoring, around 140 BPM, major key turning bright and defiant, relentless "
     "percussion held at the same intensity all the way through, loopable, instrumental only, no vocals"),

    # ── 추축군 ──────────────────────────────────────────────────────────
    # 같은 평시라도 온도가 다르다. 낮은 현과 첼로 독주, 단조. 아름답되 차갑다 —
    # 편안한 것이 아니라 조용한 것이다.
    ("music_axis_calm",
     "Solemn orchestral underscore in a dark German romantic style. Low warm strings with a lone "
     "cello line, muted horn, minor key with a cold restrained beauty, slow around 58 BPM, very "
     "quiet distant timpani, austere and still, no percussion drive, no build to a climax, even "
     "loopable texture throughout, instrumental only, no vocals"),

    # 쇠의 행진. 같은 빠른 북이지만 단조에 저음 금관이라 승리가 아니라 압박으로
    # 들린다. 연합군 교전곡과 나란히 들어야 차이가 확인된다.
    ("music_axis_alert",
     "Tense monumental orchestral battle cue in a grim Germanic style. Fast relentless military "
     "snare drums and heavy pounding timpani, low brass ostinato in a dark minor key, menacing "
     "rising string figures, iron marching feel, around 140 BPM, oppressive and monumental rather "
     "than triumphant, intensity held level all the way through, loopable, instrumental only, no vocals"),
]


def gen(name, prompt):
    dest = OUT / f"{name}.mp3"
    r = requests.post(
        URL,
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={"prompt": prompt, "music_length_ms": LENGTH_MS},
        timeout=600,
    )
    if r.status_code != 200:
        print(f"FAIL {name}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    print(f"ok {name}.mp3  {len(r.content) / 1024:.0f} KB")
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # 이름을 인자로 주면 그것만 다시 뽑는다. 통과한 곡은 건드리지 않는다.
    only = set(sys.argv[1:])
    jobs = [j for j in JOBS if not only or j[0] in only]
    missing = only - {j[0] for j in JOBS}
    if missing:
        print(f"모르는 이름: {', '.join(sorted(missing))}")
        return 1
    ok = sum(1 for name, prompt in jobs if gen(name, prompt))
    print(f"\n{ok}/{len(jobs)} generated -> {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
