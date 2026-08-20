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


// 수치 편집 창은 판에 넣지 않는다. 확장판에서 따로 팔 물건이다.
// 단추만 감춰서는 소용이 없다 - 웹 게임은 파일을 통째로 손님 컴퓨터에 내려보내므로,
// 주소 끝에 ?edit=1을 붙인 사람은 감춰 둔 창을 그대로 꺼내 쓴다. 파일에서 잘라낸다.
// 저장소의 index.html은 손대지 않는다. 잘리는 것은 빌드 결과물뿐이다.
function stripEditor(html) {
  const cuts = [
    ["<!-- 균형을 잡는 사람의 연장이다.", "수치 편집</button>"],
    ["<aside class='balance-editor'".split("'").join('"'), "</aside>"],
  ];
  let out = html;
  for (const [open, close] of cuts) {
    const start = out.indexOf(open);
    if (start < 0) throw new Error(`에디터를 못 찾았다: ${open}`);
    const end = out.indexOf(close, start);
    if (end < 0) throw new Error(`에디터 끝을 못 찾았다: ${close}`);
    out = out.slice(0, start) + out.slice(end + close.length);
  }
  // 잘라낸 뒤에도 이름이 남아 있으면 뭔가 빠뜨린 것이다. 판이 나가기 전에 멈춘다.
  for (const mark of ["toggleEditorPanel", "editorPanel", "balanceEditor"]) {
    if (out.includes(mark)) throw new Error(`에디터 흔적이 남았다: ${mark}`);
  }
  return out;
}

const { scenarios: allScenarios, storeUrl } = readScenarios();
rmSync(out, { recursive: true, force: true });

for (const [edition, config] of Object.entries(editions)) {
  const dir = join(out, edition);
  mkdirSync(dir, { recursive: true });

  for (const file of clientFiles) cpSync(join(root, file), join(dir, file));
  // 복사한 index.html에서 수치 편집 창을 도려낸다.
  const indexPath = join(dir, "index.html");
  writeFileSync(indexPath, stripEditor(readFileSync(indexPath, "utf8")), "utf8");
  // assets/audio/raw 는 음량 맞추기 전의 원본이다. 게임은 쓰지 않는데 18MB라서
  // 그대로 넣으면 처음 여는 사람이 두 배를 기다린다. 판에서는 뺀다.
  cpSync(join(root, "assets"), join(dir, "assets"), {
    recursive: true,
    filter: (src) => !src.split("\\").join("/").includes("/assets/audio/raw"),
  });

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
