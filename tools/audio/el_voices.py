"""ElevenLabs 직결 — 계정에 실제로 있는 보이스 목록을 뽑는다.
키는 절대 출력하지 않는다."""
import os
import json
import pathlib
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))


def key():
    # 머신 레벨 환경변수는 sk_ 이전의 낡은 키라서 .secrets 파일을 가린다.
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    # utf-8-sig: 키 파일에 BOM이 붙어 있어 plain utf-8로 읽으면 키가 깨진다.
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


r = requests.get(
    "https://api.elevenlabs.io/v2/voices",
    headers={"xi-api-key": key()},
    params={"page_size": 100},
    timeout=60,
)
r.raise_for_status()
data = r.json()
rows = []
for v in data.get("voices", []):
    labels = v.get("labels") or {}
    rows.append(
        {
            "voice_id": v.get("voice_id"),
            "name": v.get("name"),
            "category": v.get("category"),
            "gender": labels.get("gender"),
            "age": labels.get("age"),
            "accent": labels.get("accent"),
            "use_case": labels.get("use_case"),
            "descriptive": labels.get("descriptive"),
        }
    )
print(json.dumps({"count": len(rows), "voices": rows}, ensure_ascii=False, indent=1))
