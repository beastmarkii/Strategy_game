// 배포본 빌드. 예전에는 package.json 안에 `mkdir -p ... && cp -R ...` 한 줄로 있었는데,
// npm이 윈도우에서 스크립트를 cmd.exe로 돌리기 때문에 이 개발 환경에서는 아예 실행이
// 안 됐다("The syntax of the command is incorrect"). 그래서 dist가 scenarios.js가
// 생기기 전 상태로 굳어 있었다 — 배포본에는 시나리오 파일 자체가 없었다.
// 노드로 옮겨서 윈도우/맥/리눅스 어디서나 같은 결과가 나오게 한다.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

// 게임을 이루는 파일. 하나라도 빠지면 배포본은 조용히 옛날 게임이 된다.
// favicon.svg와 manifest는 index.html이 이름으로 불러오는 파일이다. 여기 안 적으면
// 배포본에서만 조용히 빠져서, 창 꼭지 그림과 「홈 화면에 추가」가 사라진다.
const clientFiles = [
  "index.html",
  "privacy.html",
  "styles.css",
  "scenarios.js",
  "game.js",
  "favicon.svg",
  "manifest.webmanifest",
];
// 호스팅이 어느 쪽을 정적 루트로 잡는지는 플랫폼 설정에 있어서 저장소에서는 알 수 없다.
// 둘 다 내보낸다 — 어느 쪽인지 확실해지면 이 배열에서 한 줄만 지우면 된다.
const clientDirs = ["client", "public"];

// 통째로 지우고 다시 만든다. 덮어쓰기만 하면 이름이 바뀐 옛 파일이 배포본에 남는다.
rmSync(dist, { recursive: true, force: true });

for (const name of clientDirs) {
  const out = join(dist, name);
  mkdirSync(out, { recursive: true });
  for (const file of clientFiles) cpSync(join(root, file), join(out, file));
  cpSync(join(root, "assets"), join(out, "assets"), {
    recursive: true,
    // units-hires 는 홍보용 고해상도 원본(22MB). 게임은 축소본만 쓴다.
    filter: (src) => !src.split("\\").join("/").includes("/assets/units-hires"),
  });
}

mkdirSync(join(dist, "server"), { recursive: true });
cpSync(join(root, "server", "index.js"), join(dist, "server", "index.js"));

mkdirSync(join(dist, ".openai"), { recursive: true });
cpSync(join(root, ".openai", "hosting.json"), join(dist, ".openai", "hosting.json"));

console.log(`빌드 완료: ${clientDirs.join(", ")} + server + .openai`);
