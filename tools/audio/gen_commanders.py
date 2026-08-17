"""1944 전선 사령부 — 지휘관 한마디 생성 (ElevenLabs 직결 /v1/text-to-speech).

작전 명령서에서 장군을 고르면 그 사람이 한마디 한다. 명부의 숫자(공격 +2,
보급 -1)는 이 사람이 무엇을 잘하는지 알려 주지만 어떤 사람인지는 알려 주지
않는다. 한 줄이면 알려 준다 — 패튼은 옆구리를 신경 쓰지 말라 하고, 몽고메리는
포탄이 다 모이기 전에는 안 움직인다고 한다. 그 한 줄이 곧 그 장군의 계수다.

말은 그 사람 말로 한다. 미국·영국 장군은 영어, 소련 장군은 러시아어, 독일
장군은 독일어, 일본 장군은 일본어, 드골은 프랑스어. 소련 원수가 영어로 말하면
그건 소련 원수가 아니다 — 적 부대를 독일어로 말하게 만든 것과 같은 이유다.

목소리는 열아홉이 전부 다르다. 두 사람이 같은 목소리를 쓰면, 사람을 고르는
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
# 딱 한마디다. 처음에는 두세 문장을 시켰는데, 고르는 화면에서는 장군을 여럿
# 눌러 보게 되므로 두 번째 클릭에서 이미 길다. 그리고 긴 설명은 어차피 명부의
# 숫자가 하고 있다 — 여기서 알고 싶은 것은 이 사람이 어떤 사람인가뿐이다.
#
# 그래서 실제로 남긴 말이 있으면 그 말을 쓴다. 아래 대부분이 그 사람이 실제로
# 한 말이다(패튼의 "지금 거칠게 실행한 좋은 계획", 아이젠하워의 "계획은 쓸모없되
# 계획하는 일은 전부다", 구데리안의 "클로첸 니히트 클레커른", 야마시타가
# 싱가포르에서 퍼시벌에게 던진 "예스냐 노냐"). 남긴 말을 못 찾은 둘(만슈타인·
# 슈투덴트)만 그 사람의 방식대로 한 줄을 지어 넣었다.
#
# stability를 사람마다 다르게 준다. 낮으면 억양이 살아나고(패튼·구데리안처럼
# 몰아붙이는 사람), 높으면 평탄해진다(아이젠하워·모델처럼 눌러 말하는 사람).
# 목소리만 바꾸고 이걸 똑같이 두면 열세 명이 다 같은 온도로 말한다.
JOBS = [
    # ── 연합군 ──────────────────────────────────────────────────────────
    # 패튼이 실제로 한 말. 이 한 줄이 그 사람의 전부다 — 완벽을 기다리지 않는다.
    ("patton", "3bYmxTIwiCkFjkct32A2", 0.32,
     "A good plan violently executed now is better than a perfect plan next week."),

    # 몽고메리가 엘 알라메인에 부임해 처음 내린 말. 뒤로 물러날 계획을 태워 버렸다.
    ("montgomery", "dVvfgwuNNviTdZB4tqJt", 0.62,
     "Here we will stand and fight. There will be no further withdrawal."),

    # 아이젠하워가 남긴 말. 명령하는 사람이 아니라 붙여 놓는 사람의 문장이다.
    ("eisenhower", "zlNWXcnnZStiyXG49qLv", 0.7,
     "Plans are worthless, but planning is everything."),

    # 브래들리가 남긴 말. 병사 쪽에서 전쟁을 본 사람이라 용기를 이렇게 정의한다.
    ("bradley", "weNdhGmYaizQlfiLlyJq", 0.6,
     "Bravery is the capacity to perform properly even when scared half to death."),

    # 주코프가 아이젠하워에게 했다는 그 말. 서방 장군들이 가장 오래 기억한 한 줄이다.
    ("zhukov", "v51ymEttSm5ZPov6wHYz", 0.4,
     "Если впереди минное поле, пехота идёт так, будто его нет."),

    # 로코솝스키가 스탈린 앞에서 물러서지 않고 되풀이한 말(바그라티온 작전 계획).
    # 두 번 불려 나갔다 두 번 다 같은 말을 했고, 결국 그대로 됐다.
    ("rokossovsky", "TpZlRcB7rTBboAYWa2DC", 0.6,
     "Настаиваю на двух главных ударах."),

    # 슬림이 남긴 말. 진 군대를 다시 세운 사람의 문장이다.
    ("slim", "508nf3VEPxbaS0lpX17L", 0.62,
     "There are no bad regiments, only bad officers."),

    # ── 추축군 ──────────────────────────────────────────────────────────
    # 롬멜이 남긴 말. 속도를 말하는 사람인데, 정작 아끼는 것은 사람이다.
    ("rommel", "H3SlaMKe61Xu9asSseVc", 0.42,
     "Schweiß spart Blut, Blut spart Leben, Verstand spart beides."),

    # 구데리안의 그 한마디. "찔끔거리지 말고 뭉쳐서 쳐라" — 전차를 흩지 말라는 뜻이다.
    ("guderian", "3Yd4qpEiwKewi1JIdeMY", 0.3,
     "Klotzen, nicht kleckern!"),

    # 만슈타인은 짧게 남긴 말이 마땅치 않아 그의 방식대로 지었다. 땅을 붙들고
    # 있는 것이 아니라 때를 골라 치는 것이 이 사람의 전쟁이다.
    ("manstein", "5hobNnfFWAwxjwZSecAE", 0.66,
     "Nicht das Halten von Raum entscheidet, sondern der Schlag zur rechten Zeit."),

    # 모델이 마지막에 남긴 말. 방어전의 사람답게 끝이 닫혀 있다.
    ("model", "DUAKkudcC2PI6KEqJ60K", 0.72,
     "Ein deutscher Feldmarschall kapituliert nicht."),

    # 야마시타가 싱가포르 항복 회담에서 퍼시벌을 몰아붙인 그 말.
    ("yamashita", "OrIijq7uyVaGDbu9tqly", 0.55,
     "イエスかノーか、それだけだ。"),

    # 슈투덴트도 남긴 한마디가 마땅치 않아 지었다. 하늘에서 내려오는 사람이라
    # 전선이라는 말 자체를 다르게 쓴다.
    ("student", "bGkjVHUyQ9rRhorWJufM", 0.5,
     "Wir kommen von oben. Für uns gibt es keine Front."),

    # ── 그 작전에만 나오는 장군들 ─────────────────────────────────────────
    # 상설 명부와 달리 판 하나에만 선다. 그래서 대사도 그 판의 대사다 —
    # 파울루스는 포위 안에서, 무타구치는 보급 없이 산을 넘기 직전에 말한다.

    # 파울루스가 1943년 1월 24일 스탈린그라드에서 히틀러에게 보낸 전문 그대로.
    # 감정이 하나도 없다. 그래서 stability를 명부에서 가장 높게 준다 — 이 사람은
    # 절망도 보고서 문장으로 말한다.
    ("paulus", "daJ4gHLkIVFskWuoLuDX", 0.78,
     "Truppe ohne Munition und Verpflegung. Wirksame Führung nicht mehr möglich."),

    # 무타구치가 33사단에 실제로 내린 훈시. 게임의 보급 -3이 이 한 줄에서 나왔다.
    # 일본어 목소리는 야마시타가 이미 쓰고 있어 겹칠 수 없으므로, 겹치지 않는
    # 것 중 나이대와 음색이 가장 가까운 쪽으로 골랐다.
    ("mutaguchi", "2I36mEahS1u7ZnTKUoaB", 0.35,
     "日本人は元来草食動物である。この青い山の中で、食糧に困ることなどあるものか。"),

    # 프라이버그가 크레타에서 낸 그날의 명령. 실제로는 진다는 걸 알고 있었는데
    # 병사들에게는 이렇게 말했다.
    ("freyberg", "z7i51AlFqQJ8JzM16o7e", 0.5,
     "We shall maintain the integrity of Crete against any invader, and from this base we shall go forward."),

    # 퍼시벌이 항복을 앞두고 한 말. 야마시타의 "예스냐 노냐"와 짝이 되는 문장이다.
    ("percival", "L1aJrPa7pLJEyYlh3Ilq", 0.68,
     "I have my honour to consider, and what posterity will think of us."),

    # 리치는 남긴 한마디를 못 찾아 그의 방식대로 지었다. 가잘라에서 그가 실제로
    # 한 일이 이것이다 — 부대를 상자처럼 흩어 놓고 각자 버티게 했다.
    ("ritchie", "JWlKsAOcyfylxVyKfOQW", 0.58,
     "Every box holds its own ground. Nobody waits to be relieved."),

    # 드골이 1940년 6월 18일 런던에서 한 그 방송. 지고 있는 쪽의 문장이 아니다.
    ("degaulle", "yhf80q1381zd2JJQ4tM7", 0.45,
     "Quoi qu'il arrive, la flamme de la résistance française ne doit pas s'éteindre et ne s'éteindra pas."),
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
