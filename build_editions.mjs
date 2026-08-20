// 판 나누기 빌드. 무료판과 전체판을 각각 한 폴더씩 만들어 낸다.
//
// 핵심은 하나다 — 무료판에서 잠긴 작전은 "화면에서 가리는" 것이 아니라
// "파일에서 빼는" 것이다. 웹 게임은 파일 전부를 손님 컴퓨터로 내려보내고
// 실행하기 때문에, 화면만 가리면 개발자 도구를 연 사람은 그냥 다 본다.
// scenarios.js를 데이터로 읽어서 남길 작전만 골라 다시 써 낸다.
//
//   node build_editions.mjs          → dist-editions/free, dist-editions/full
//
// 여기 값만 고치면 판이 바뀐다. game.js는 건드릴 것이 없다.
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "dist-editions");

// 무료판에 넣을 작전. 연합군이 미는 판 하나, 추축군이 미는 판 하나 —
// 두 진영을 다 겪어봐야 게임이 어떤 것인지 알고, 그래야 나머지를 사고 싶어진다.
//   엘 알라메인: 연합군 공세. 옆으로 돌 길이 없는 정면 회랑이라 규칙이 가장 또렷하다.
//   낫질:        추축군 공세. 숲 뒤에서 나와 강을 건넌다 — 완전히 다른 지도다.
const freeScenarioIds = ["elAlamein", "sichelschnitt"];

// 무료판에서 기본으로 깔리는 판. 무료판에 남는 작전 중 하나여야 한다.
const freeDefaultScenarioId = "elAlamein";

const editions = {
  full: { scenarioIds: null, defaultScenarioId: null },
  free: { scenarioIds: freeScenarioIds, defaultScenarioId: freeDefaultScenarioId },
};

const clientFiles = [
  "index.html",
  "index.en.html",
  "privacy.html",
  "styles.css",
  "game.js",
  "favicon.svg",
  "manifest.webmanifest",
];

// scenarios.js를 그대로 돌려서 데이터를 꺼낸다. 정규식으로 잘라내면 중괄호 하나에
// 조용히 망가진다 - 자바스크립트에게 읽히는 것이 유일하게 확실한 방법이다.
function readScenarios() {
  const src = readFileSync(join(root, "scenarios.js"), "utf8");
  const box = {};
  runInNewContext(src + "\n;this.scenarios = scenarios; this.storeUrl = storeUrl;", box);
  return box;
}

function writeScenarios(path, scenarios, defaultScenarioId, edition, storeUrl) {
  const body = `// 이 파일은 build_editions.mjs가 만들어 낸 것이다. 손으로 고치지 마라 —
// 다음 빌드에서 지워진다. 원본은 저장소의 scenarios.js다.
// 판: ${edition} · 작전 ${scenarios.length}개
const scenarios = ${JSON.stringify(scenarios, null, 2)};

const defaultScenarioId = ${JSON.stringify(defaultScenarioId)};
const gameEdition = ${JSON.stringify(edition)};
const storeUrl = ${JSON.stringify(storeUrl)};

function findScenario(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios.find((scenario) => scenario.id === defaultScenarioId) ?? scenarios[0];
}
`;
  writeFileSync(path, body, "utf8");
}

const { scenarios: allScenarios, storeUrl } = readScenarios();
rmSync(out, { recursive: true, force: true });

for (const [edition, config] of Object.entries(editions)) {
  const dir = join(out, edition);
  mkdirSync(dir, { recursive: true });

  for (const file of clientFiles) cpSync(join(root, file), join(dir, file));
  cpSync(join(root, "assets"), join(dir, "assets"), { recursive: true });

  const kept = config.scenarioIds
    ? config.scenarioIds.map((id) => {
        const found = allScenarios.find((scenario) => scenario.id === id);
        // 이름을 잘못 적으면 그 작전만 조용히 빠진 판이 나간다. 그건 팔린 뒤에야
        // 발견된다 - 여기서 멈추는 편이 낫다.
        if (!found) throw new Error(`무료판 작전 이름이 틀렸다: ${id}`);
        return found;
      })
    : allScenarios;

  // 접어 둔 작전(retired)은 목록에 안 뜨지만 파일에는 남아 있다. 전체판에서는
  // 그대로 두고(나중에 되살릴 판이다), 무료판에서는 고른 것만 나가므로 자동으로 빠진다.
  const defaultId = config.defaultScenarioId ?? "cobra";
  writeScenarios(join(dir, "scenarios.js"), kept, defaultId, edition, storeUrl);

  const bytes = kept.reduce((sum, scenario) => sum + JSON.stringify(scenario).length, 0);
  console.log(`${edition}: 작전 ${kept.length}개 · 시나리오 ${(bytes / 1024).toFixed(0)}KB → dist-editions/${edition}`);
}
