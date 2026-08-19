# -*- coding: utf-8 -*-
"""영어 겉표지 그림(assets/cover-en.png)을 만든다.

한국어 겉표지(assets/cover.png)에는 제목이 그림 안에 박혀 있다. 영어권에
주소를 뿌리면 영어 설명 옆에 한글 제목이 붙은 그림이 뜬다 — 눌러 보기 전에
「내가 못 읽는 게임」으로 읽힌다.

지도판 부분은 그대로 두고, 금색 줄 아래 글자 띠만 다시 칠해서 영어로 적는다.
글자를 지우고 다시 쓰는 것이 아니라 덮어 칠하는 이유는, 한글이 밝은 색이라
어둡게만 해서는 비쳐 보이기 때문이다.

  python tools/layout/build_cover_en.py
"""
import io
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "cover.png")
DST = os.path.join(ROOT, "assets", "cover-en.png")

F = r"C:\Windows\Fonts"
BOLD = os.path.join(F, "segoeuib.ttf")
SEMI = os.path.join(F, "seguisb.ttf")
REG = os.path.join(F, "segoeui.ttf")

CREAM = (240, 236, 219)
GOLD = (198, 168, 92)
DIM = (176, 176, 158)

img = Image.open(SRC).convert("RGB")
W, H = img.size
d = ImageDraw.Draw(img)

# 금색 줄 바로 아래부터 밑변까지를 다시 칠한다. 줄 자체는 건드리지 않는다.
TOP = 432
for y in range(TOP, H):
    k = (y - TOP) / float(H - TOP)
    c = (int(28 - 13 * k), int(32 - 14 * k), int(21 - 10 * k))
    d.line([(0, y), (W, y)], fill=c)


def spaced(draw, xy, text, font, fill, extra):
    """글자 사이를 벌려 쓴다. 작은 대문자 줄은 벌려야 표제처럼 읽힌다."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + extra


X = 68
spaced(d, (X, 446), "WORLD WAR II  ·  TURN-BASED TACTICS",
       ImageFont.truetype(SEMI, 21), GOLD, 2.6)
d.text((X, 480), "FRONT COMMAND 1944", font=ImageFont.truetype(BOLD, 66), fill=CREAM)
d.text((X, 576), "12 Allied and Axis operations  ·  plays in your browser",
       font=ImageFont.truetype(REG, 24), fill=DIM)

url = "beastmarkii.github.io/Strategy_game"
uf = ImageFont.truetype(REG, 24)
d.text((W - 64 - d.textlength(url, font=uf), 576), url, font=uf, fill=DIM)

img.save(DST, optimize=True)
print("wrote", DST, os.path.getsize(DST), "bytes")
