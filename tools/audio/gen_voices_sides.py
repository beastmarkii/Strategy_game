"""1944 전선 사령부 — 진영별·상황별 무전 응답 음성 생성 (ElevenLabs 직결).

한 부대에는 두 가지 목소리가 필요하다.

  내 부대를 눌렀다  -> 명령을 기다리는 보고.        (select)
  적 부대를 눌렀다  -> 방해받은 쪽의 쏘아붙임.      (taunt)

그리고 진영마다 말이 다르다. 적이 나에게 영어로 "준비되었습니다"라고 대답하면
그것은 적이 아니라 내 부대다. 독일군은 독일어로, 자기들끼리 쓰는 투로 말해야 한다.
플레이어가 추축군을 골라 판을 시작할 수도 있으므로(state.playerSide) 네 벌이 다 필요하다.

  us_*_select   연합군이 내 부대일 때 (영어, 보고)  <- gen_voices.py 가 이미 뽑아 둔 것
  us_*_taunt    연합군이 적일 때      (영어, 쏘아붙임)
  axis_*_select 추축군이 내 부대일 때 (독일어, 보고)
  axis_*_taunt  추축군이 적일 때      (독일어, 쏘아붙임)

연합군 보고 음성은 이미 게임에 실려 있으므로 여기서 다시 뽑지 않는다 —
통과한 소리는 건드리지 않는다.

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


# 연합군 목소리는 gen_voices.py 와 같은 사람이어야 한다. 같은 보병이 상황에 따라
# 보고도 하고 욕도 하는 것이지, 다른 사람이 되는 것이 아니다.
US_VOICES = {
    "infantry": "SOYHLrjzK2X1ezoPC6cr",     # Harry - Fierce Warrior
    "armor": "N2lVS1w4EtoT3dr4eOWO",        # Callum - Husky Trickster
    "artillery": "pqHfZKP75CvOlQylNhV4",    # Bill - Wise, Mature
    "spArtillery": "IKne3meq5aSn9XLyUdCD",  # Charlie - Energetic
    "engineer": "iP95p4xoKVk53GoZ742B",     # Chris - Down-to-Earth
    "battalionHQ": "onwK4e9ZLuTAKqWW03F9",  # Daniel - Steady Broadcaster
}

# 계정에 독일어 보이스가 하나도 없어서 공용 보이스 서고(shared voices)에서 골랐다.
# 공용 보이스 아이디는 계정에 담지 않아도 그대로 합성에 쓸 수 있다.
# 연합군과 마찬가지로 병종마다 나이·굵기가 멀리 떨어진 목소리를 고른다 —
# 무전 필터가 음색 차이를 크게 깎기 때문이다.
AXIS_VOICES = {
    "infantry": "uFS3DtxbVgSJItsTysil",     # Maximilian - 젊고 날 선
    "armor": "6NPDr9Vi2EfxqmZNbpnD",        # Lukas - 굵고 눌러 말하는 중년
    "artillery": "CD5xyRjkR74P5qby9tmm",    # Axel - 나이 든, 느리게 씹어 말하는
    "spArtillery": "2z1FNC3hpK58mQpkXz3h",  # Turbo Tim - 젊고 급한
    "engineer": "1EoY2TCAb6c0dNf9nl9s",     # Dieter - 무뚝뚝한 중년
    "battalionHQ": "X130stNoZZQ45LREXDXp",  # Michael Danisch - 늙고 울리는 지휘관
}

# 대사는 한 호흡을 넘기지 않는다. 클릭할 때마다 나오는 소리가 길면 두 번째 클릭에서
# 이미 방해가 된다. 세 줄씩 두는 것은 연달아 눌렀을 때 다른 말이 나오게 하려는 것이다.
#
# 적 응답은 명령을 받는 말투가 아니라 방해받은 말투다. 나에게 보고할 이유가 없는 자들이다.
LINES = {
    # 연합군이 적일 때 — 추축군 플레이어가 미군 부대를 눌렀다.
    "us_taunt": {
        "infantry": ["Back off, Kraut.", "You want some of this?", "Keep walking, Fritz."],
        "armor": ["Try it, Jerry.", "Get clear of my tracks.", "That won't even scratch us."],
        "artillery": ["We already have your range.", "Nothing personal, Fritz.", "You're standing in my grid."],
        "spArtillery": ["Too slow, Jerry.", "We hit and we're gone.", "You'll never catch us."],
        "engineer": ["I'm busy. Beat it.", "Get off my bridge.", "We'll blow it before you cross."],
        "battalionHQ": ["This is an American command post.", "You are not getting through.", "We're not moving. Ever."],
    },
    # 추축군이 내 부대일 때 — 추축군 플레이어가 자기 부대를 눌렀다.
    "axis_select": {
        "infantry": ["Schützengruppe gefechtsbereit.", "Wir warten auf Befehl.", "Stellung ist bezogen."],
        "armor": ["Panzer einsatzbereit.", "Motor läuft, Herr Major.", "Geben Sie mir ein Ziel."],
        "artillery": ["Batterie feuerbereit.", "Wir erwarten die Koordinaten.", "Die Rohre sind kalt."],
        "spArtillery": ["Wespe ist beweglich und bereit.", "Schießen und verschwinden.", "Bereit zum Feuern."],
        "engineer": ["Pioniere melden sich.", "Wir bauen, was Sie brauchen.", "Das Werkzeug ist bereit."],
        "battalionHQ": ["Bataillonsgefechtsstand.", "Gefechtsstand hört.", "Wir erwarten Ihre Befehle."],
    },
    # 추축군이 적일 때 — 연합군 플레이어가 독일군 부대를 눌렀다. 이것이 원래 문제였던 자리다.
    "axis_taunt": {
        "infantry": ["Was willst du denn?", "Lass uns in Ruhe!", "Verschwinde, Amerikaner!"],
        "armor": ["Was glotzt du?", "Weg da, oder wir walzen dich platt.", "Komm doch näher."],
        "artillery": ["Wir haben euch im Visier.", "Stör mich nicht.", "Gleich hagelt es Granaten."],
        "spArtillery": ["Zu spät, Amerikaner.", "Wir sind schneller als du.", "Feuer frei, verdammt!"],
        "engineer": ["Ich habe zu tun. Hau ab.", "Verdammte Schaufelarbeit.", "Wir sprengen alles, was ihr braucht."],
        "battalionHQ": ["Hier ist ein deutscher Gefechtsstand.", "Ihr kommt hier nicht durch.", "Wir halten die Stellung. Immer noch."],
    },
}

# 무전 알림도 진영을 따라간다. 추축군을 잡고 두는 판에서 공사 완료를 영어로 알리면
# 내 공병이 남의 군대 사람이 된다. 연합군 쪽 두 개는 이미 있으므로 추축군 것만 뽑는다.
AXIS_NOTICES = [
    ("engineer", "axis_work_complete", "Bau abgeschlossen."),
    ("battalionHQ", "axis_unit_ready", "Neue Einheit meldet sich zum Dienst."),
]

# 보고는 차분하고, 쏘아붙임은 억양이 튀어야 한다. stability를 낮추면 감정이 커지는 대신
# 같은 문장을 다시 뽑을 때 결과가 더 흔들린다 — 보고 쪽은 흔들리면 안 되므로 높게 잡는다.
SETTINGS = {
    "select": {"stability": 0.35, "similarity_boost": 0.75, "style": 0.45, "use_speaker_boost": True},
    "taunt": {"stability": 0.28, "similarity_boost": 0.75, "style": 0.6, "use_speaker_boost": True},
}


def gen(voice_id, text, dest, mood):
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={"text": text, "model_id": MODEL, "voice_settings": SETTINGS[mood]},
        timeout=180,
    )
    if r.status_code != 200:
        print(f"FAIL {dest.name}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    print(f"ok {dest.name}  {len(r.content)} bytes")
    return True


def jobs_for():
    out = []
    for family, table in LINES.items():
        voices = US_VOICES if family.startswith("us_") else AXIS_VOICES
        mood = "select" if family.endswith("select") else "taunt"
        prefix = "axis_" if family.startswith("axis_") else ""
        kind = "select" if mood == "select" else "taunt"
        for unit, lines in table.items():
            for i, text in enumerate(lines, start=1):
                out.append((voices[unit], f"{prefix}{unit}_{kind}_{i}", text, mood))
    for unit, name, text in AXIS_NOTICES:
        out.append((AXIS_VOICES[unit], name, text, "select"))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # 이름을 인자로 주면 그것만 다시 뽑는다. 통과한 소리는 건드리지 않는다.
    only = set(sys.argv[1:])
    jobs = [j for j in jobs_for() if not only or j[1] in only]
    missing = only - {j[1] for j in jobs_for()}
    if missing:
        print(f"모르는 이름: {', '.join(sorted(missing))}")
        return 1
    if not jobs:
        print("뽑을 것이 없다.")
        return 1

    ok = 0
    for voice_id, name, text, mood in jobs:
        if gen(voice_id, text, OUT / f"{name}.mp3", mood):
            ok += 1
    print(f"\n{ok}/{len(jobs)} generated -> {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
