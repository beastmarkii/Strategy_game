"""장군 초상 내려받기. 위키백과 대표 사진 원본을 그대로 받아 놓기만 한다.

자르기는 여기서 하지 않는다. 사람 얼굴이 사진 어디에 있는지는 사진마다 다르고,
「가운데를 잘라라」 같은 규칙으로는 어떤 사람은 이마가 잘리고 어떤 사람은
어깨만 남는다. 그래서 이 스크립트는 원본만 받아 두고, 자를 자리는 사람이
사진을 보고 crop_portraits.py에 한 줄씩 적는다.

받아 온 주소는 sources.md에 남긴다. 기존 열세 장은 어디서 왔는지 기록이
없어서 나중에 확인할 방법이 없었다 — 같은 일을 반복하지 않으려는 것이다.

콘솔이 GBK라 한글·독일어를 print하면 죽는다. 결과는 파일로만 쓴다.
"""
import json
import pathlib
import urllib.parse
import urllib.request

OUT = pathlib.Path(__file__).resolve().parent / "raw"
UA = "StrategyGame-portrait-fetch/1.0 (https://github.com/beastmarkii/Strategy_game)"

# (파일 이름, 위키백과 문서 제목). 제목은 영문 위키 기준이다.
PEOPLE = [
    ("paulus", "Friedrich Paulus"),
    ("mutaguchi", "Renya Mutaguchi"),
    ("freyberg", "Bernard Freyberg, 1st Baron Freyberg"),
    ("percival", "Arthur Percival"),
    ("ritchie", "Neil Ritchie"),
    ("degaulle", "Charles de Gaulle"),
]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def summary(title):
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(
        title.replace(" ", "_"), safe=""
    )
    return json.loads(get(url).decode("utf-8"))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lines = ["# 장군 초상 출처", "", "위키백과 대표 사진에서 받았다.", ""]
    log = []
    for name, title in PEOPLE:
        try:
            data = summary(title)
            src = (data.get("originalimage") or data.get("thumbnail") or {}).get("source")
            if not src:
                log.append(f"FAIL {name}: no image")
                continue
            # 주소 뒤에 붙어 오는 추적용 꼬리표(utm_*)는 떼고 적는다.
            # 사진과 아무 상관 없고, 기록으로 남길 것은 사진이 있는 자리뿐이다.
            clean = src.split("?", 1)[0]
            blob = get(src)
            ext = pathlib.Path(urllib.parse.urlparse(src).path).suffix.lower() or ".jpg"
            dest = OUT / f"{name}{ext}"
            dest.write_bytes(blob)
            lines.append(f"- `{name}` — [{title}]({data['content_urls']['desktop']['page']})")
            lines.append(f"  - 사진: {clean}")
            log.append(f"ok {name} {ext} {len(blob)} B")
        except Exception as exc:  # noqa: BLE001 — 어느 한 장이 실패해도 나머지는 받는다
            log.append(f"FAIL {name}: {exc}")
    (OUT.parent / "sources.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (OUT / "fetch.log").write_text("\n".join(log) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
