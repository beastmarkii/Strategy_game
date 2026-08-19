"""전선 사령부 — 배경음악 생성 (ElevenLabs 직결 /v1/music).

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

    # ── 작전 명령서 ──────────────────────────────────────────────────────
    # 명령서를 읽는 동안 흐르는 곡. 여태 이 화면에서는 평시곡이 돌았는데,
    # 판이 시작되면 같은 곡이 그대로 이어져서 "작전이 시작됐다"가 소리로는
    # 안 들렸다. 그래서 이 화면만의 곡을 따로 둔다.
    #
    # 교전곡과도 갈라야 한다. 교전곡은 빠른 스네어로 손을 재촉하는 소리인데,
    # 명령서 화면에서는 손이 할 일이 없다 — 읽고 고르는 시간이다. 그래서
    # 급한 것을 북이 아니라 저음이 낸다: 콘트라베이스와 저음 금관이 눌러
    # 깔리고, 그 위에 초침 같은 짧은 음이 규칙적으로 떨어진다. 빠르지 않은데
    # 조급한 소리, 진영을 고르기 전이라 어느 편도 아닌 소리다.
    ("music_briefing",
     "Dark tense orchestral cue for a war room briefing before an operation. Heavy low strings and "
     "contrabass ostinato deep in the bass register, low brass swells, quiet ticking clock-like "
     "pizzicato pulse, distant low timpani hits, brooding minor key, slow around 70 BPM, building "
     "pressure without any fast drums and without releasing into a climax, even loopable texture "
     "throughout, cinematic and grave, instrumental only, no vocals"),

    # ── 타이틀 ──────────────────────────────────────────
    # 첫 화면에서 도는 곳. 여기만은 진영이 없다 — 연합군을 고를지 추축군을 고를지를
    # 아직 정하지 않았기 때문이다. 그래서 장조로 가되 어느 나라 군가도 아닌 소리,
    # 그냥 "진군한다"만 말하는 소리로 간다.
    #
    # 교전곳과도 갈라야 한다. 교전곳은 복복한 소리로 손을 재촉하지만, 타이틀은
    # 손이 할 일이 단추 하나다. 급한 것이 아니라 큰 것이어야 한다 — 금관이 앞에
    # 나오고 북은 받치기만 한다.
    ("music_title",
     "Grand triumphant orchestral military march for a war film main title. Bold full brass fanfare "
     "carrying a broad memorable melody in unison, sweeping high strings answering, crashing cymbals "
     "and a confident snare drum march pattern, deep timpani accents, wide symphonic scoring, around "
     "112 BPM in a bright major key, majestic and stirring, cinematic main-theme energy sustained "
     "evenly all the way through, loopable, instrumental only, no vocals"),

    # ── 종막 ───────────────────────────────────────────
    # 판이 끝나고 마지막으로 남는 소리. 이겼든 졌든 같은 곱을 둔다 — 이긴 사람에게도
    # 어느 칸에서 부대가 지워졌는지는 남아 있기 때문이다.
    #
    # 타이틀과 정반대로 간다. 행진곱은 금관이 앞에 나오고 북이 받치는데, 이쪽은
    # 북이 아예 없다. 피아노가 느린 세잛으로 같은 모양을 계속 굴리고, 그 위로 현이
    # 한 줄씩 떠오른다. 원곡을 그대로 따가면 남의 공이 되므로, 질감만 빌리고
    # 선율은 새로 쓴다.
    ("music_ending",
     "Slow mournful orchestral closing piece for the end of a war film. A solo piano playing steady "
     "quiet triplet arpeggios in a dark minor key throughout, a simple aching melody entering above "
     "it on muted strings and a lone cello, distant soft horn, no drums and no percussion at all, "
     "around 54 BPM, contemplative and elegiac, restrained and never swelling into a climax, an "
     "original nocturne rather than any existing piece, even loopable texture, instrumental only, no vocals"),
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
