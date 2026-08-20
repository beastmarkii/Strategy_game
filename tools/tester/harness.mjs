// 게임판을 브라우저 없이 띄우는 장치.
//
// 본 게임 코드(scenarios.js / game.js)는 한 글자도 고치지 않는다. index.html에서
// 화면 뼈대만 떼어다 jsdom에 올리고, 그 위에 게임 코드를 그대로 얹는다.
// 크롬을 띄우고 웹서버를 켜던 예전 방식은 한 판에 수 초씩 걸려 96판을 재는 데
// 몇 분이 들었다. 여기서는 같은 96판이 몇 초다.
//
// 화면·소리는 없는 셈 치고 가짜로 막는다. 규칙만 돌면 되는 자리이므로
// 그림이 안 그려지는 것은 손해가 아니다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, "..", "..");

const read = (name) => readFileSync(join(repoRoot, name), "utf8");

// 캔버스에 그리는 시늉만 하는 붓. jsdom에는 진짜 캔버스가 없어서 getContext가
// 빈손으로 돌아오고, 게임의 안개·물결 그리기가 그 자리에서 넘어진다.
// 무엇을 그렸는지는 검사에 쓰이지 않으므로 받아만 주고 버린다.
function fakeContext() {
  const noop = () => {};
  const ctx = {
    canvas: null,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    filter: "none",
    font: "10px sans-serif",
    textAlign: "start",
    textBaseline: "alphabetic",
    shadowBlur: 0,
    shadowColor: "transparent",
    imageSmoothingEnabled: true,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: (x, y, w = 1, h = 1) => ({
      data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
      width: w,
      height: h,
    }),
    putImageData: noop,
    createImageData: (w = 1, h = 1) => ({
      data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
      width: w,
      height: h,
    }),
  };
  for (const name of [
    "save", "restore", "beginPath", "closePath", "moveTo", "lineTo", "arc", "arcTo",
    "rect", "roundRect", "ellipse", "quadraticCurveTo", "bezierCurveTo", "fill", "stroke",
    "clip", "clearRect", "fillRect", "strokeRect", "fillText", "strokeText", "drawImage",
    "translate", "rotate", "scale", "transform", "setTransform", "resetTransform",
    "setLineDash", "getLineDash",
  ]) {
    ctx[name] = name === "getLineDash" ? () => [] : noop;
  }
  return ctx;
}

// 한 판을 위한 게임판을 새로 차린다.
export function bootGame({ quiet = true, speed = true } = {}) {
  const virtualConsole = new VirtualConsole();
  const noise = [];
  virtualConsole.on("jsdomError", (err) => noise.push(String(err.message || err)));
  if (!quiet) virtualConsole.sendTo(console);

  // 화면 뼈대만 쓴다. <script>는 전부 떼고 우리가 순서대로 직접 얹는다.
  // 그래야 무엇이 언제 도는지가 검사자 손에 남는다.
  const shell = read("index.html").replace(/<script\b[\s\S]*?<\/script>/gi, "");

  const dom = new JSDOM(shell, {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;

  // ── 없는 셈 치는 것들 ───────────────────────────────────────────────
  window.HTMLCanvasElement.prototype.getContext = function () {
    const ctx = fakeContext();
    ctx.canvas = this;
    return ctx;
  };
  window.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: "",
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
  }
  // 소리 장치는 아예 없는 기계로 둔다. game.js는 없으면 조용히 넘어간다.
  delete window.AudioContext;
  delete window.webkitAudioContext;

  // jsdom에는 fetch가 없다. game.js가 소리 파일을 미리 받으려고 부르는 자리에서
  // 그대로 넘어져 나머지 초기화가 통째로 중단됐다. 검사에서 소리는 필요 없으므로
  // 영영 안 끝나는 약속을 돌려준다 - 거절을 돌려주면 잡히지 않은 거절이 쌓인다.
  window.fetch = () => new Promise(() => {});

  // 그림 도구도 없는 셈 친다. 무엇을 그렸는지는 규칙 검사에 쓰이지 않는다.
  if (!window.Path2D) {
    window.Path2D = class {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
      roundRect() {}
    };
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // ── 시계를 당긴다 ──────────────────────────────────────────────────
  // 적 차례는 endPlayerTurn이 420밀리초 뒤로 예약한다. 사람이 볼 때는 그 틈이
  // 「생각하는 시간」이지만 검사에서는 그냥 기다림이다. 기다림만 없앤다.
  // 순서는 그대로 둔다 - 예약을 즉시 실행으로 바꾸면 호출이 겹쳐 규칙이 꼬인다.
  if (speed) {
    const realTimeout = window.setTimeout;
    window.setTimeout = function (fn, delay, ...rest) {
      return realTimeout.call(window, fn, 0, ...rest);
    };
  }

  // ── 게임 코드를 얹는다 ─────────────────────────────────────────────
  // 실제 index.html과 같은 순서다. 붙는 방식도 같은 고전 스크립트다.
  // 진짜 <script> 태그로 넣는다. window.eval로 넣으면 최상위 let/const가
  // 그 eval 안에만 갇혀 scenarios.js의 값이 game.js에서 안 보인다.
  const inject = (source) => {
    const tag = window.document.createElement("script");
    tag.textContent = source;
    window.document.body.appendChild(tag);
  };
  inject(read("scenarios.js"));
  inject(read("game.js"));

  // game.js의 최상위 let/const는 window에 붙지 않는다. 같은 전역에서 한 번 더
  // 평가해 손잡이를 만들어 둔다. 값을 복사하지 않고 그때그때 읽는다.
  inject(`window.__probe = {
    get state() { return state; },
    get scenarios() { return scenarios; },
    get difficultyLevels() { return difficultyLevels; },
    get operationTurnLimit() { return operationTurnLimit; },
    startGame,
    endPlayerTurn,
    missionTurnLimit,
    objectivesFor,
    objectiveHoldRequirement,
    supplyLineCost,
  };`);

  return { dom, window, probe: window.__probe, noise };
}
