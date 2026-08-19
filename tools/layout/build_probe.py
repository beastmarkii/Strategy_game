# -*- coding: utf-8 -*-
"""폰 화면 실측판을 만든다.

이 도구가 있는 이유 — 크롬은 창 폭을 500px 아래로 못 줄인다. `--window-size=320,568`
으로 찍으면 높이만 320이 아니라 568로 들어가고 폭은 조용히 512가 된다. 그래서
「320px 폰에서 쟀다」는 측정이 전부 512px에서 찍힌 적이 있다(2026-08-19). 폭에
따라 카드 안 항목이 두 줄에서 세 줄로 접히므로, 폭이 틀리면 카드 높이도 전부 틀린다.

진짜 폭을 만드는 방법은 화면 안에 화면을 띄우는 것뿐이다. 폭·높이를 픽셀로 박은
<iframe>은 그 크기의 진짜 CSS 화면이 되고, dvh도 그 높이에서 나온다.

측정판을 index.html 복사본으로 떠 두면 index.html이 바뀔 때마다 조용히 낡는다.
그래서 복사본을 저장소에 두지 않고 필요할 때 여기서 찍어 낸다.

쓰는 법 (저장소 뿌리에서):
    python tools/layout/build_probe.py
    chrome --headless=new --disable-gpu --allow-file-access-from-files \
           --window-size=1400,1100 --virtual-time-budget=25000 \
           --dump-dom "file:///…/_probe_frame.html" > dom.txt      # 숫자
    chrome … --screenshot=phone.png "file:///…/_probe_shot.html"   # 그림
숫자는 <pre id="probe"> 안에 들어 있다.

만들어지는 _probe_*.html 넷은 저장소에 올리지 않는다(.gitignore).
"""
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MARK = '<script src="game.js"></script>'

# 재어 볼 화면. 320은 아직 팔리는 것 중 제일 좁은 폰, 414는 큰 폰이다.
SIZES = [(320, 568), (360, 640), (390, 844), (414, 896)]
SHOTS = [(320, 568, "#obj"), (320, 568, "#tile"), (320, 568, ""), (390, 844, "")]


def page(script_path, hash_hint=""):
    """index.html 뒤에 재는 코드를 붙인 판 하나."""
    base = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    body = io.open(os.path.join(HERE, script_path), encoding="utf-8").read()
    i = base.index(MARK) + len(MARK)
    j = base.rindex("</body>")
    return base[:i] + "\n" + body + "\n" + base[j:]


def frame(entries, title):
    """폭·높이를 픽셀로 박은 창들. 이게 진짜 폰 폭을 만드는 유일한 방법이다."""
    rows = "".join(
        '<div style="display:flex;flex-direction:column;gap:4px"><b>%dx%d%s</b>'
        '<iframe src="%s%s" style="width:%dpx;height:%dpx;border:1px solid #444">'
        "</iframe></div>" % (w, h, " 지형칸" if hs else "", src, hs, w, h)
        for (w, h, hs, src) in entries
    )
    return (
        '<!doctype html><html><head><meta charset="utf-8"><title>%s</title></head>'
        '<body style="margin:0;background:#222;display:flex;gap:10px;padding:10px;'
        'font:12px sans-serif;color:#eee">%s'
        '<pre id="probe" style="position:fixed;left:-9999px"></pre>'
        "%s</body></html>" % (title, rows, READER)
    )


# 창 안의 판이 적어 둔 숫자를 밖에서 걷어 온다. --allow-file-access-from-files
# 로 켜면 contentDocument를 그냥 읽을 수 있다. 줄바꿈을 String.fromCharCode(10)로
# 쓰는 것은, 파이썬 문자열 안에 진짜 줄바꿈을 넣으면 자바스크립트 문자열이
# 그 자리에서 끊겨 판 전체가 안 돌기 때문이다.
READER = """<script>
const NL=String.fromCharCode(10);
setTimeout(()=>{
  const fs=[...document.querySelectorAll("iframe")];
  const parts=fs.map((f,i)=>{
    let t="(no access)";
    try{ const d=f.contentDocument;
         t=d?((d.getElementById("probe")||{}).textContent||"(no pre)"):"(no doc)"; }
    catch(e){ t="ERR "+e.message; }
    return "["+f.style.width.replace("px","")+"x"+f.style.height.replace("px","")+"]"+NL+t;
  });
  document.getElementById("probe").textContent=parts.join(NL+NL);
},9000);
</script>"""


def write(name, text):
    io.open(os.path.join(ROOT, name), "w", encoding="utf-8").write(text)
    print(name)


if __name__ == "__main__":
    write("_probe_in.html", page("_measure.js.txt"))
    write("_probe_shot_in.html", page("_shot.js.txt"))
    write("_probe_frame.html", frame(
        [(w, h, "", "_probe_in.html") for (w, h) in SIZES], "측정"))
    write("_probe_shot.html", frame(
        [(w, h, hs, "_probe_shot_in.html") for (w, h, hs) in SHOTS], "촬영"))
