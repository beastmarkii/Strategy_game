"""1944 전선 사령부 — 일본군 무전 응답 음성 생성 (ElevenLabs 직결).

야마시타를 골라 놓고 부대가 독일어로 대답하면, 그 순간 지휘관은 남의 군대 사람이 된다.
말은 진영이 아니라 그 부대를 이끄는 지휘관의 나라가 정한다. 그래서 세 번째 말 한 벌이
필요하다 — 영어, 독일어, 그리고 일본어.

  ja_<병종>_select   내 부대일 때 (일본어, 보고)
  ja_<병종>_taunt    적 부대일 때 (일본어, 쏘아붙임)
  ja_work_complete   공사 완료
  ja_unit_ready      신편 부대 착임

하드룰: Pikaso/Magnific 커넥터는 프로덕션 금지. api.elevenlabs.io 직결만 쓴다.
키는 절대 출력하지 않는다. 이 기계의 콘솔은 GBK라 일본어를 print 하면 죽는다 —
진행 상황은 파일에만 적는다.
"""
import os
import pathlib
import re
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
OUT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio" / "raw"
LOG = pathlib.Path(__file__).resolve().parents[2] / "tools" / "audio" / "gen_voices_ja.log"
MODEL = "eleven_multilingual_v2"


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


# 계정에 일본어 보이스가 없어서 공용 보이스 서고에서 골랐다. 독일군 쪽과 같은 원칙 —
# 병종마다 나이와 굵기를 멀리 떨어뜨린다. 무전 필터가 음색 차이를 크게 깎기 때문이다.
# 야마시타(OrIijq7uyVaGDbu9tqly)와 무타구치(2I36mEahS1u7ZnTKUoaB)는 장군 목소리로
# 이미 쓰고 있으므로 부대에는 쓰지 않는다 — 지휘관과 병사가 같은 목소리면 안 된다.
JA_VOICES = {
    "infantry": "kK7FEcVu0AG4SgYvg5eK",     # Mike - 젊고 날 선
    "armor": "BTUNhQfNpOekzVjlvRHS",        # Nagi - 굵고 눌러 말하는 중년
    "artillery": "C6EwdDpfpjUWhKn1xeaG",    # Makoto - 나이 든, 느린
    "spArtillery": "xya0RvcJtofTcFTOdX4E",  # Koemugi - 젊고 급한
    "engineer": "NJe2GiH1oR1yNsBerWAd",     # Chosuke Toyo - 무뚝뚝한 중년
    "battalionHQ": "VDClGpojHSdifnTtoT9y",  # Kenshow - 울리는 지휘관
}

# 대사는 한 호흡을 넘기지 않는다. 독일군 대사와 같은 자리, 같은 뜻으로 짝을 맞췄다 —
# 같은 상황에서 나라만 바뀌는 것이지 성격이 바뀌는 것이 아니다.
LINES = {
    "select": {
        "infantry": ["歩兵分隊、戦闘準備よし。", "命令を待っています。", "陣地についた。"],
        "armor": ["戦車隊、出撃の準備よし。", "エンジンは回っている。", "目標を指示されたし。"],
        "artillery": ["砲兵中隊、射撃準備よし。", "座標を送られたし。", "砲身はまだ冷たい。"],
        "spArtillery": ["自走砲、移動準備よし。", "撃ってすぐ下がります。", "発射の用意よし。"],
        "engineer": ["工兵隊、報告します。", "必要なものを造ります。", "器材は揃っている。"],
        "battalionHQ": ["大隊指揮所です。", "こちら指揮所、感度良好。", "ご命令を待っています。"],
    },
    "taunt": {
        "infantry": ["何の用だ。", "近寄るな！", "引き返せ。"],
        "armor": ["何を見ている。", "どけ、踏み潰すぞ。", "来られるものなら来い。"],
        "artillery": ["もう照準に入っている。", "邪魔をするな。", "すぐに砲弾が降るぞ。"],
        "spArtillery": ["遅い、遅すぎる。", "こちらの方が速い。", "撃て、構うな！"],
        "engineer": ["忙しい、あっちへ行け。", "この橋は渡らせん。", "渡る前に爆破してやる。"],
        "battalionHQ": ["ここは日本軍の指揮所だ。", "ここは通さん。", "我々は退かん。断じて。"],
    },
}

NOTICES = [
    ("engineer", "ja_work_complete", "作業が完了しました。"),
    ("battalionHQ", "ja_unit_ready", "新編部隊、着任しました。"),
]

SETTINGS = {
    "select": {"stability": 0.35, "similarity_boost": 0.75, "style": 0.45, "use_speaker_boost": True},
    "taunt": {"stability": 0.28, "similarity_boost": 0.75, "style": 0.6, "use_speaker_boost": True},
}

log_lines = []


def note(msg):
    log_lines.append(msg)


def gen(voice_id, text, dest, mood):
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={"text": text, "model_id": MODEL, "voice_settings": SETTINGS[mood]},
        timeout=180,
    )
    if r.status_code != 200:
        note(f"FAIL {dest.name}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    note(f"ok {dest.name}  {len(r.content)} bytes")
    return True


KANA = re.compile(u"[぀-ヿ]")


def check_lines(jobs):
    """가나가 한 글자도 없는 대사를 막는다.

    여러 나라 말을 함께 읽는 모델은 한자만 늘어선 줄을 일본어로 알아보지 못하고
    중국어로 읽는다. 「戦車隊、出撃準備完了。」가 실제로 중국어로 나왔다.
    한자는 두 말이 함께 쓰므로, 어느 말인지 알려 주는 것은 가나뿐이다.
    """
    bad = [(name, text) for _, name, text, _ in jobs if not KANA.search(text)]
    if bad:
        for name, text in bad:
            note("KANA MISSING " + name + ": " + text)
        raise SystemExit("가나 없는 대사 " + str(len(bad)) + "개 — 중국어로 읽힌다")


def jobs_for():
    out = []
    for kind, table in LINES.items():
        for unit, lines in table.items():
            for i, text in enumerate(lines, start=1):
                out.append((JA_VOICES[unit], f"ja_{unit}_{kind}_{i}", text, kind))
    for unit, name, text in NOTICES:
        out.append((JA_VOICES[unit], name, text, "select"))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    every = jobs_for()
    check_lines(every)
    jobs = [j for j in every if not only or j[1] in only]
    missing = only - {j[1] for j in every}
    if missing:
        note("unknown names: " + ", ".join(sorted(missing)))
        LOG.write_text("\n".join(log_lines), encoding="utf-8")
        return 1

    ok = 0
    for voice_id, name, text, mood in jobs:
        if gen(voice_id, text, OUT / f"{name}.mp3", mood):
            ok += 1
    note(f"{ok}/{len(jobs)} generated -> {OUT}")
    LOG.write_text("\n".join(log_lines), encoding="utf-8")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
