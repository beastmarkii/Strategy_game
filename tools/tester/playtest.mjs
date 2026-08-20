// 자동 플레이 검사기.
//
// 검사 방식은 하나다 - 플레이어가 아무것도 안 한다. 턴만 넘긴다.
// 그러면 AI 혼자 판을 굴리게 되고, 결과는 「AI 승리」가 정상이다.
// 가만히 있던 쪽이 이겼다면 그 작전은 규칙이 새는 것이다.
//
// 쓰는 법
//   node tools/tester/playtest.mjs                    전 작전 x 양 진영 x 4난이도
//   node tools/tester/playtest.mjs --only elAlamein   작전 지정(쉼표로 여럿)
//   node tools/tester/playtest.mjs --diff green,elite 난이도 지정
//   node tools/tester/playtest.mjs --quiet            판별 줄 없이 요약만
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bootGame, repoRoot } from "./harness.mjs";

const argv = process.argv.slice(2);
const flag = (name) => {
  const at = argv.indexOf(name);
  return at >= 0 ? argv[at + 1] : null;
};
const has = (name) => argv.includes(name);

const onlyArg = flag("--only");
const diffArg = flag("--diff");
const quiet = has("--quiet");

// 한 부대가 같은 칸에 몇 턴 서 있으면 「멈췄다」로 볼 것인가.
// 방어 진지를 지키는 것은 정상이므로 넉넉히 잡는다. 다섯 턴을 넘게 제자리인
// 부대는 지키는 것이 아니라 걸린 것이다.
const STALL_TURNS = 5;

const outDir = join(repoRoot, "tools", "tester", "out");

// 판이 스스로 굴러갈 틈을 준다. 적 차례는 예약으로 넘어오므로 예약이 다 풀릴
// 때까지 기다려야 한다. 조건이 찰 때까지 짧게 여러 번 양보한다.
function waitFor(window, test, rounds = 4000) {
  return new Promise((resolve) => {
    let left = rounds;
    (function spin() {
      if (test() || left-- <= 0) {
        resolve(test());
        return;
      }
      window.setTimeout(spin, 0);
    })();
  });
}

async function playOne({ scenarioId, playerSide, difficulty }) {
  const { dom, window, probe, noise } = bootGame();
  const record = {
    scenarioId,
    playerSide,
    difficulty,
    verdict: "미결",
    turns: 0,
    limit: null,
    error: null,
    stalls: [],
    crashes: [],
  };
  try {
    probe.startGame({ scenarioId, playerSide, difficulty });
    const limit = Number.isFinite(probe.operationTurnLimit) ? probe.operationTurnLimit : 40;
    record.limit = limit;

    // 부대별로 「같은 칸에 몇 턴째인가」를 센다.
    const parked = new Map();

    let guard = 0;
    while (!probe.state.gameOver && probe.state.turn <= limit + 2 && guard++ < limit + 8) {
      const ok = await waitFor(window, () => probe.state.phase === "player" || probe.state.gameOver);
      if (probe.state.gameOver) break;
      if (!ok) {
        record.error = "차례가 안 돌아옴";
        break;
      }

      const turn = probe.state.turn;
      for (const unit of probe.state.units) {
        if (unit.owner !== "enemy") continue;
        const seen = parked.get(unit.id);
        if (seen && seen.x === unit.x && seen.y === unit.y) {
          seen.turns += 1;
          seen.until = turn;
        } else {
          parked.set(unit.id, { x: unit.x, y: unit.y, type: unit.type, turns: 1, from: turn, until: turn });
        }
      }

      probe.endPlayerTurn();
    }

    for (const [, seen] of parked) {
      if (seen.turns > STALL_TURNS) {
        record.stalls.push(seen.type + "(" + seen.x + "," + seen.y + ") " + seen.turns + "턴");
      }
    }

    record.turns = probe.state.turn;
    const screen = window.document.querySelector("#resultScreen");
    record.verdict = probe.state.gameOver ? screen?.dataset?.verdict ?? "판정없음" : "기한초과";
  } catch (err) {
    record.error = String(err && err.message ? err.message : err);
  }
  record.crashes = noise.slice(0, 3);
  dom.window.close();
  return record;
}

// ── 검사 목록을 짠다 ──────────────────────────────────────────────────
const boot = bootGame();
const allScenarios = boot.probe.scenarios
  .filter((one) => !one.retired)
  .map((one) => ({ id: one.id, name: one.name ?? one.id }));
const allDiffs = boot.probe.difficultyLevels.map((one) => ({ id: one.id, name: one.name ?? one.id }));
boot.dom.window.close();

const nameOfScenario = new Map(allScenarios.map((one) => [one.id, one.name]));
const nameOfDiff = new Map(allDiffs.map((one) => [one.id, one.name]));

const scenarioIds = onlyArg ? onlyArg.split(",") : allScenarios.map((one) => one.id);
const diffIds = diffArg ? diffArg.split(",") : allDiffs.map((one) => one.id);
const sides = ["allies", "axis"];

const jobs = [];
for (const difficulty of diffIds) {
  for (const scenarioId of scenarioIds) {
    for (const playerSide of sides) jobs.push({ scenarioId, playerSide, difficulty });
  }
}

const sideName = { allies: "연합군", axis: "추축군" };
// 가만히 있던 쪽이 이기면 결함이다. 그 외에는 정상.
const isDefect = (row) => row.error !== null || row.verdict === "win" || row.verdict === "기한초과";
const verdictName = { win: "플레이어 승", lose: "AI 승", draw: "무승부" };

console.log("FRONT COMMAND 1944 · 자동 플레이 검사");
console.log("작전 " + scenarioIds.length + " x 진영 2 x 난이도 " + diffIds.length + " = " + jobs.length + "판");
console.log("검사 기준: 플레이어는 아무것도 안 한다. AI가 이겨야 정상이다.\n");

const started = Date.now();
const rows = [];
for (const job of jobs) {
  const row = await playOne(job);
  rows.push(row);
  if (!quiet) {
    const mark = isDefect(row) ? "결함" : "정상";
    const tail = row.error ? " · " + row.error : row.stalls.length ? " · 멈춤 " + row.stalls.length + "건" : "";
    console.log(
      "[" + mark + "] " +
        (nameOfDiff.get(row.difficulty) ?? row.difficulty).padEnd(4) + " " +
        (nameOfScenario.get(row.scenarioId) ?? row.scenarioId).padEnd(14) + " " +
        sideName[row.playerSide] + "  " +
        (verdictName[row.verdict] ?? row.verdict).padEnd(8) + " " +
        row.turns + "/" + row.limit + "턴" + tail,
    );
  }
}
const took = ((Date.now() - started) / 1000).toFixed(1);

// ── 요약 ──────────────────────────────────────────────────────────────
const defects = rows.filter(isDefect);
const stalled = rows.filter((row) => row.stalls.length);

console.log("\n── 요약 ──────────────────────────────────");
console.log("총 " + rows.length + "판 · 정상 " + (rows.length - defects.length) + " · 결함 " + defects.length + " · " + took + "초");

for (const diff of diffIds) {
  const mine = rows.filter((row) => row.difficulty === diff);
  console.log("  " + (nameOfDiff.get(diff) ?? diff).padEnd(4) + " " + mine.length + "판 중 결함 " + mine.filter(isDefect).length);
}

if (defects.length) {
  console.log("\n결함 목록 (가만히 있던 쪽이 이겼거나 판이 안 끝남)");
  for (const row of defects) {
    console.log(
      "  " + (nameOfScenario.get(row.scenarioId) ?? row.scenarioId) + " · " +
        (nameOfDiff.get(row.difficulty) ?? row.difficulty) + " · " + sideName[row.playerSide] + " · " +
        (verdictName[row.verdict] ?? row.verdict) + " " + row.turns + "/" + row.limit + "턴" +
        (row.error ? " · " + row.error : ""),
    );
  }
}

if (stalled.length) {
  console.log("\n" + STALL_TURNS + "턴 넘게 제자리인 AI 부대");
  for (const row of stalled) {
    console.log(
      "  " + (nameOfScenario.get(row.scenarioId) ?? row.scenarioId) + " · " +
        (nameOfDiff.get(row.difficulty) ?? row.difficulty) + " · " + sideName[row.playerSide] + " · " + row.stalls.join(", "),
    );
  }
}

// ── 파일로 남긴다 ─────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "report.json"), JSON.stringify({ rows, took }, null, 2), "utf8");

const md = [
  "# 자동 플레이 검사 결과",
  "",
  "- 검사 판수: " + rows.length + "판 (작전 " + scenarioIds.length + " x 진영 2 x 난이도 " + diffIds.length + ")",
  "- 결함: **" + defects.length + "건**",
  "- 걸린 시간: " + took + "초",
  "- 검사 기준: 플레이어는 턴만 넘긴다. AI가 이겨야 정상이다.",
  "",
  "## 난이도별",
  "",
  "| 난이도 | 판수 | 결함 |",
  "|---|---|---|",
  ...diffIds.map((diff) => {
    const mine = rows.filter((row) => row.difficulty === diff);
    return "| " + (nameOfDiff.get(diff) ?? diff) + " | " + mine.length + " | " + mine.filter(isDefect).length + " |";
  }),
  "",
  "## 전체 판정",
  "",
  "| 판정 | 난이도 | 작전 | 플레이어 | 결과 | 턴 |",
  "|---|---|---|---|---|---|",
  ...rows.map(
    (row) =>
      "| " + (isDefect(row) ? "**결함**" : "정상") + " | " + (nameOfDiff.get(row.difficulty) ?? row.difficulty) + " | " +
      (nameOfScenario.get(row.scenarioId) ?? row.scenarioId) + " | " + sideName[row.playerSide] + " | " +
      (verdictName[row.verdict] ?? row.verdict) + (row.error ? " (" + row.error + ")" : "") + " | " + row.turns + "/" + row.limit + " |",
  ),
  "",
  "## " + STALL_TURNS + "턴 넘게 제자리인 AI 부대",
  "",
  stalled.length
    ? stalled
        .map(
          (row) =>
            "- " + (nameOfScenario.get(row.scenarioId) ?? row.scenarioId) + " · " + (nameOfDiff.get(row.difficulty) ?? row.difficulty) + " · " + sideName[row.playerSide] + ": " + row.stalls.join(", "),
        )
        .join("\n")
    : "없음",
  "",
].join("\n");
writeFileSync(join(outDir, "report.md"), md, "utf8");

console.log("\n리포트: tools/tester/out/report.md · tools/tester/out/report.json");
process.exit(defects.length ? 1 : 0);
