"""1944 전선 사령부 — 지휘관 한마디 생성 (ElevenLabs 직결 /v1/text-to-speech).

작전 명령서에서 장군을 고르면 그 사람이 한마디 한다. 명부의 숫자(공격 +2,
보급 -1)는 이 사람이 무엇을 잘하는지 알려 주지만 어떤 사람인지는 알려 주지
않는다. 한 줄이면 알려 준다 — 패튼은 옆구리를 신경 쓰지 말라 하고, 몽고메리는
포탄이 다 모이기 전에는 안 움직인다고 한다. 그 한 줄이 곧 그 장군의 계수다.

말은 그 사람 말로 한다. 미국·영국 장군은 영어, 소련 장군은 러시아어, 독일
장군은 독일어, 야마시타는 일본어. 소련 원수가 영어로 말하면 그건 소련 원수가
아니다 — 적 부대를 독일어로 말하게 만든 것과 같은 이유다.

목소리는 열셋이 전부 다르다. 두 사람이 같은 목소리를 쓰면, 사람을 고르는
화면에서 사람이 안 바뀐 것으로 들린다. 여기 쓴 아이디는 부대 무전 목소리
(gen_voices.py / gen_voices_sides.py)와도 하나도 겹치지 않는다.

무전 처리는 걸지 않는다(post_audio.py의 build_plain). 부대는 무전기 너머에
있지만 장군은 지금 이 방에서 명령서를 앞에 두고 말하는 사람이다. 같은 잡음을
씌우면 사령부가 아니라 또 하나의 무전 채널이 된다.

하드룰: Pikaso/Magnific 커넥터는 프로덕션 금지. api.elevenlabs.io 직결만 쓴다.
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


# (지휘관 id, 보이스 id, 대사)
#
# 대사는 한 호흡이다. 고르는 화면에서 장군을 여럿 눌러 보게 되는데, 길면 두 번째
# 클릭에서 이미 방해가 된다.
#
# stability를 사람마다 다르게 준다. 낮으면 억양이 살아나고(패튼·구데리안처럼
# 몰아붙이는 사람), 높으면 평탄해진다(아이젠하워·모델처럼 눌러 말하는 사람).
# 목소리만 바꾸고 이걸 똑같이 두면 열세 명이 다 같은 온도로 말한다.
JOBS = [
    # ── 연합군 ──────────────────────────────────────────────────────────
    # 패튼: 측면을 걱정하지 않는 사람이다. 그래서 첫마디가 측면 이야기다.
    ("patton", "3bYmxTIwiCkFjkct32A2", 0.32,
     "Forget your flanks, gentlemen. We drive straight through, and we do not stop to admire it."),

    # 몽고메리: 준비가 끝나기 전에는 한 발도 안 뗀다. 신중이 곧 이 사람의 계수다.
    ("montgomery", "dVvfgwuNNviTdZB4tqJt", 0.62,
     "We will not move one yard until every gun and every round is in position. Then we will not stop."),

    # 아이젠하워: 명령하는 사람이 아니라 붙여 놓는 사람이다. 말투가 평탄한 이유다.
    ("eisenhower", "zlNWXcnnZStiyXG49qLv", 0.7,
     "This is a coalition, not an army. Everyone advances together, or nobody advances at all."),

    # 브래들리: 병사 쪽에서 말한다. 땅을 얼마나 먹었는가가 아니라 몇 명이 돌아오는가.
    ("bradley", "weNdhGmYaizQlfiLlyJq", 0.6,
     "Take the ground. Hold the ground. And bring as many of them home as you can."),

    # 주코프: 포병이 먼저다. 짧고 거칠게.
    ("zhukov", "v51ymEttSm5ZPov6wHYz", 0.4,
     "Сначала артиллерия. Потом танки. Мы прорвём фронт там, где они нас не ждут."),

    # 로코솝스키: 같은 소련이지만 정반대의 사람이다. 정면으로 안 간다.
    ("rokossovsky", "TpZlRcB7rTBboAYWa2DC", 0.6,
     "Лобовой атаки не будет. Обойдём с флангов и замкнём кольцо."),

    # 슬림: 조건이 나쁘다는 것을 먼저 인정하고, 그래도 간다고 말한다.
    ("slim", "508nf3VEPxbaS0lpX17L", 0.62,
     "The ground is against us. The weather is against us. We are going anyway."),

    # ── 추축군 ──────────────────────────────────────────────────────────
    # 롬멜: 속도가 무기라고 말하는 사람.
    ("rommel", "H3SlaMKe61Xu9asSseVc", 0.42,
     "Geschwindigkeit ist unsere stärkste Waffe. Wir schlagen zu, bevor sie sich eingraben können."),

    # 구데리안: 전차를 흩지 말라. 급하게, 밀어붙이듯.
    ("guderian", "3Yd4qpEiwKewi1JIdeMY", 0.3,
     "Panzer werden konzentriert eingesetzt, niemals verzettelt. Alles auf einen Punkt. Vorwärts!"),

    # 만슈타인: 차갑고 정확하다. 적이 기대하는 곳을 말한 다음 반대를 말한다.
    ("manstein", "5hobNnfFWAwxjwZSecAE", 0.66,
     "Der Gegner erwartet uns im Norden. Genau deshalb kommen wir aus dem Süden."),

    # 모델: 방어전의 사람. 문장이 짧고 끝이 닫혀 있다.
    ("model", "DUAKkudcC2PI6KEqJ60K", 0.72,
     "Diese Stellung wird gehalten. Keinen Schritt zurück. Das ist kein Vorschlag."),

    # 야마시타: 결단의 속도를 말한다.
    ("yamashita", "OrIijq7uyVaGDbu9tqly", 0.55,
     "迷えば負ける。決断は今、この場で下す。"),

    # 슈투덴트: 하늘에서 내려오는 사람이라, 전선이라는 말 자체를 다르게 쓴다.
    ("student", "bGkjVHUyQ9rRhorWJufM", 0.5,
     "Wir landen hinter ihren Linien. Für uns gibt es keine Front, nur den Himmel."),
]


def gen(cid, voice, stability, text):
    dest = OUT / f"cmd_{cid}.mp3"
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={
            "text": text,
            "model_id": MODEL,
            "voice_settings": {"stability": stability, "similarity_boost": 0.8, "style": 0.35},
        },
        timeout=180,
    )
    if r.status_code != 200:
        print(f"FAIL {cid}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    print(f"ok cmd_{cid}.mp3  {len(r.content) / 1024:.0f} KB")
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    jobs = [j for j in JOBS if not only or j[0] in only]
    missing = only - {j[0] for j in JOBS}
    if missing:
        print(f"unknown: {', '.join(sorted(missing))}")
        return 1
    ok = sum(1 for job in jobs if gen(*job))
    print(f"\n{ok}/{len(jobs)} generated -> {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
