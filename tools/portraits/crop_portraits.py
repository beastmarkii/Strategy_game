"""내려받은 원본을 명부에 쓰는 144x160 초상으로 자른다.

자를 자리는 사진을 눈으로 보고 한 장씩 정했다. 자동으로 「가운데를 잘라라」로
맞추면 어떤 사람은 모자가 잘리고 어떤 사람은 얼굴이 콩알만 해진다.
기준은 기존 열세 장과 같다 — 모자 위에 손톱만큼 여백, 아래는 가슴 중간까지.

원본은 흑백 사진이므로 회색조로 한 번 눕혀서 저장한다. 한 장만 누렇게 뜨면
명부에서 그 사람만 튄다.

콘솔이 GBK라 결과는 파일로 쓴다.
"""
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / "raw"
DEST = HERE.parent.parent / "assets" / "commanders"

SIZE = (144, 160)  # 기존 열세 장과 같은 크기

# 이름: (왼쪽, 위, 오른쪽, 아래) — 원본 사진의 픽셀 좌표
BOXES = {
    "paulus": (0, 7, 404, 456),
    "mutaguchi": (0, 44, 750, 877),
    "freyberg": (0, 23, 806, 919),
    "percival": (0, 11, 270, 311),
    "ritchie": (249, 147, 897, 867),
    "degaulle": (62, 40, 1821, 1995),
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    log = []
    for name, box in BOXES.items():
        src = RAW / f"{name}.jpg"
        if not src.exists():
            log.append(f"FAIL {name}: no source")
            continue
        with Image.open(src) as img:
            cut = img.convert("L").crop(box).resize(SIZE, Image.LANCZOS).convert("RGB")
        out = DEST / f"{name}.jpg"
        cut.save(out, "JPEG", quality=88, optimize=True)
        log.append(f"ok {name} {out.stat().st_size} B")
    (HERE / "crop.log").write_text("\n".join(log) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
