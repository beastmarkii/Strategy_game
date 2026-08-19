// 판 크기와 지형은 시나리오가 정한다(scenarios.js). applyScenario()가 채운다.
let width = 20;
let height = 16;
let wartimeProductionFactor = 0.5;
// 원거리 포격의 잔존율. "안 뺏고 경제만 죽인다"는 선택이라 대가가 크다.
// 이 선택의 값은 그 턴을 점령이 아니라 포격에 썼다는 것이다.
let raidEfficiencyFactor = 0.7;
// 거점 위 전투로 생기는 부수 피해의 잔존율. 예전에는 포격과 같은 계수(0.7)를
// 썼는데, 점령하려는 쪽은 어차피 방어자를 때려야 하므로 그건 선택이 아니라
// 세금이었다. 실측: 보병 3대로 뺏으면 효율 24%, 야포 4대면 4%가 남았다.
// 생산 6짜리 거점이 0.12가 되니 뺏는 것보다 부수는 것이 이득인 게임이었다.
let combatBaseDamage = 0.9;
// 곱셈 감소에는 하한이 있어야 한다. 없으면 0으로 수렴하고, 그러면 "부수기만 하는
// 쪽"이 언제나 이겨서 거점을 다툴 이유가 사라진다. 아무리 두들겨도 거점은 거점이다.
let baseEfficiencyFloor = 0.25;
// 점령 그 자체로 깎이는 몫. 1이면 감소 없음이 기본이다 — 거점을 부순 것은
// 방어자를 없앤 공격들이고 그 값은 부수 피해에서 이미 받았으므로, 여기서 또
// 곱하면 같은 전투를 두 번 청구하게 된다. 그게 뺏은 거점을 껍데기로 만들었다.
// 다만 "적이 물러나며 시설을 태우고 간다"를 넣고 싶으면 0.85쯤으로 내리면 된다.
// 무주공산 거점에는 적용되지 않는다.
let captureEfficiencyLoss = 1;
let maxStackSize = 3;
let supplyRange = 6;
let strainedSupplyRange = 9;
let strainedSupplyMoralePenalty = 15;
let isolatedSupplyMoralePenalty = 35;
let isolatedAttritionDamage = 1;
// 보급선이 끊긴 부대는 더 빨리, 더 아프게 무너진다. 임팔처럼 뒤를 끊어 이기는 판이
// 성립하려면 끊긴 쪽이 실제로 아파야 한다. 셋 다 수치 편집 창에서 되돌릴 수 있다.
let cutSupplyMoralePenalty = 30;
let collapseGraceTurns = 3;
let collapseMaxDamage = 5;
let hqSupplyRange = 3;
let hqRecoveryRange = 1;
let hqOutOfRangeGraceTurns = 1;
let hqOutOfRangeMoralePenalty = 10;
let counterattackFactor = 0.5;
let operationTurnLimit = 30;
let objectiveHoldTurns = 2;
// 플레이어만 보급창고로 생산을 늘리면 후반에 물량이 일방적으로 기운다.
// 적도 공병대를 굴려 경제를 키운다. 0으로 두면 예전처럼 고정 생산이 된다.
// 목표는 고정값이 아니라 하한이다 — 실제 목표는 플레이어가 지은 만큼 따라 올라간다.
let enemyDepotGoal = 2;
let enemyEngineerLimit = 3;
// 적 전용 전투 정원은 없앴다. 예전에는 적한테만 「거점 수 × 기지당 정원」이라는
// 상한이 있었고 아군에는 아무 상한도 없었다. 같은 판에서 두 편이 다른 규칙으로
// 부대를 세웠다는 뜻이다 — 아군이 보급품 있는 만큼 한 턴에 셋을 세울 때, 적은
// 정원에 걸려 이틀에 하나였다.
// 지금은 양쪽의 문이 같다: 보급품과 사령부 지휘 범위 안의 빈 칸.
// 땅을 잃으면 여전히 군을 잃는다 — 거점이 줄면 수입이 줄고, 수입이 줄면 못 뽑는다.
// 상한이라는 두 번째 문을 따로 달지 않아도 같은 결론에 닿고, 문이 하나면 화면에
// 설명할 것도 하나다. 적이 어디까지 세울지는 이제 상한이 아니라 목표다
// (enemyForceTarget) — 아군 전투 부대 수를 난이도 배율만큼 따라간다.
// 이만큼 쌓이면 적은 모자란 병종만 채우는 대신 값비싼 쪽으로도 채운다.
let enemyRecruitSurplus = 24;
// 창고 공사는 3일이 걸리고 그동안 공병대는 움직이지 못한다. 이 거리 안에 적이
// 있으면 안전한 자리가 아니다 — AI는 아예 짓지 않고, 플레이어에게는 경고만 한다.
let depotSafeDistance = 4;
// 수비 미션의 적이 초소에 붙박이면 플레이어는 사거리 밖에서 안전하게 갉아먹는다.
// 이 반경 안으로 들어온 상대에게는 적이 나가서 맞선다. 0에 가까울수록 붙박이,
// 크게 잡을수록 초소를 비우고 쫓아나간다.
let enemyDefenseRadius = 4;
// 배치 조정 반경. 시나리오 좌표는 "기준선"이지 못 박은 자리가 아니다.
// 자동 배치는 이 반경 안에서만 부대를 옮겨 보급을 맞추고, 수동 배치도 이 반경
// 안에서만 허용된다 — 즉 이 숫자 하나가 "시나리오 의도에서 얼마나 벗어나도 되는가"다.
// 0으로 두면 시나리오 좌표에 그대로 고정된다.
let deployRange = 4;
// 예비대 비율(%). 참모부는 매 턴 병력의 이만큼을 축선에 붙이지 않고 뒤에 남긴다.
// 예비가 없는 군대는 한 번 밀리면 그걸로 끝이고, 전군이 한 줄로 밀려드는
// "다 같이 한 칸 전진"의 원인이기도 하다. 0으로 두면 전병력 즉시 투입.
let enemyReserveShare = 25;
// 주공 집중도(%). 축선에 붙일 병력 중 주공이 가져가는 몫.
// 100이면 다른 축선을 비우고 한 곳에 몰빵, 50이면 균등 분산에 가깝다.
// 전략이란 결국 "어디에 얼마를 걸 것인가"이고, 그 숫자가 이것이다.
let enemyMainEffortShare = 60;
// 우회 폭(칸). 목표가 하나뿐인 미션이 대부분인데, 목표가 하나라고 전군이 한 줄로
// 걸어가면 좁은 길목 하나만 막혀도 작전이 끝난다. 목표는 하나여도 접근로는 여럿이어야
// 한다. 이 값만큼 좌우로 벌려 우회 축선을 만든다. 0이면 정면 한 길로만 간다.
let enemyFlankSpread = 3;
// 야포 견인 거리(칸). 전선이 이보다 멀면 포를 트럭에 걸고 달리고, 이 안으로
// 들어오면 전개한다. 전환에 한 턴이 통째로 드니 어중간한 자리에서 왔다갔다 하면
// 그 포는 작전 내내 한 발도 못 쏜다. 0으로 두면 견인을 아예 쓰지 않는다.
let enemyTowDistance = 6;
// 보병 엄호 반경(칸). 아군 포병에게 적이 이만큼 접근하면 가장 가까운 보병 하나가
// 축선을 놓고 포병 앞에 선다. 포병은 반격을 못 견디는 병종이라, 엄호 없는 포는
// 사거리 이점이 아니라 그냥 헌납이다. 0으로 두면 보병은 엄호하지 않는다.
let enemyScreenRange = 3;
// 사령부 추종 거리(칸). 사령부는 주력의 무게중심에서 이만큼 뒤에 자리를 잡는다.
// 보급의 중심이 후방 거점에 눌러앉으면 전군이 제 발로 보급 밖으로 걸어 나가고,
// 그렇다고 앞장서면 반격 한 방에 진영 전체가 무너진다. 이 숫자가 그 사이의 거리다.
// 0으로 두면 사령부가 주력과 같이 붙어 다닌다.
let hqTrailDistance = 2;
// 사령부가 자리 지키기를 그만두고 살길을 찾기 시작하는 거리(칸). 이 안쪽에 적이 들어오면
// 사령부는 "주력 뒤"라는 평소의 자리를 버리고 참호(보급 거점)로 향한다. 사령부는 이동 1이라
// 발로 도망쳐서는 이동 2~3짜리 추격을 절대 못 뿌리친다 — 살길은 뛰는 것이 아니라 들어앉는 것이다.
// 기본 3인 이유는 이동 2 / 사거리 1짜리 보병이 다음 턴에 닿는 거리가 정확히 3이라서다.
// 0으로 두면 예전처럼 끝까지 자리만 지키다 잡힌다.
let hqPanicRange = 3;

// ── 난이도 ────────────────────────────────────────────────────────────────
// 난이도는 상대 참모부의 실력이다. 플레이어 쪽 규칙은 한 줄도 건드리지 않는다 —
// 내 부대가 갑자기 약해지는 난이도는 "어려운 것"이 아니라 "속이는 것"이고,
// 그런 판은 져도 왜 졌는지 배울 것이 없다. 바뀌는 것은 적 진영 넷뿐이다.
//   startUnits   작전 개시 시점에 적 전선에 더 서 있는(또는 빠지는) 부대 수
//   income       적 거점이 뽑아내는 보급품의 배율
//   startSupply  적이 1일차에 쥐고 시작하는 보급품
//   force        적이 아군 전투 부대 수의 몇 배까지 따라 세우는가
// 왜 이 넷인가: 적을 세게 만드는 방법은 "한 대가 더 아프게 때린다"와
// "한 대 더 온다" 두 가지뿐인데, 앞의 것은 무엇에 맞았는지 화면으로 알 수 없다.
// 뒤의 것은 지도에 그대로 보인다. 그래서 전부 머릿수와 보급으로만 조인다.
const difficultyLevels = [
  {
    id: "green",
    name: "신병",
    brief: "적 전선이 한 부대 얇고, 예비대도 아군보다 얇게 선다.",
    startUnits: -1,
    income: 0.75,
    startSupply: 6,
    force: 0.85,
  },
  {
    id: "regular",
    name: "정규",
    brief: "지금까지의 그 전선. 적 예비대는 아군과 같은 수로 선다.",
    startUnits: 0,
    income: 1,
    startSupply: 8,
    force: 1,
  },
  {
    id: "veteran",
    name: "노련",
    brief: "적이 두 부대 더 서서 시작하고, 예비대를 아군보다 조금 더 세운다.",
    startUnits: 2,
    income: 1.35,
    startSupply: 12,
    force: 1.25,
  },
  {
    id: "elite",
    name: "정예",
    brief: "적이 네 부대 더 서서 시작하고, 보급이 배 가까이 들어온다.",
    startUnits: 4,
    income: 1.7,
    startSupply: 18,
    force: 1.5,
  },
];
const defaultDifficultyId = "regular";

function findDifficulty(id) {
  return difficultyLevels.find((level) => level.id === id) ?? difficultyLevels.find((level) => level.id === defaultDifficultyId);
}

// 난이도를 안 고르고 시작하는 길이 여럿 있다(에디터의 「다시 시작」, 첫 로딩).
// 그때는 정규다. state가 없을 때도 불리므로 여기서 한 번에 막는다.
function currentDifficulty() {
  return findDifficulty(state?.difficulty ?? defaultDifficultyId);
}

// 난이도가 붙는 부대는 싸우는 부대뿐이다. 공병대와 사령부를 더 얹으면 적 경제와
// 보급망이 통째로 커져서, 머릿수 하나 늘리려던 것이 판 전체를 뒤집는다.
const difficultyReinforceOrder = ["infantry", "armor", "infantry", "artillery", "armor", "infantry"];

// ── 전장 안개 ─────────────────────────────────────────────────────────────
// 전장 안개. 1이면 부대는 누가 봐줘야 보이고, 0이면 예전처럼 지도 전체가 열린다.
// 규칙 전체를 한 스위치로 끌 수 있게 둔 것은 안개가 이 게임의 거의 모든 판단
// (전투·이동·적 참모부)에 얹히는 규칙이라, 밸런스를 볼 때 "안개 때문인가 아닌가"를
// 한 번에 갈라 볼 수 있어야 하기 때문이다.
let fogOfWar = 1;
// 고지에 서면 더해지는 시야(칸). 고지는 여태 방어와 사선 차단만 주는 땅이었다.
// 여기에 관측이 붙으면 능선 하나를 잡는 일이 화력이 아니라 정보의 문제가 된다.
let hillSightBonus = 2;
// 보급 거점이 스스로 보는 거리(칸). 후방 창고가 제 앞마당도 못 보면 침투 한 기에
// 소리 없이 뺏기고, 플레이어는 생산이 멈춘 뒤에야 알게 된다.
let baseSightRange = 2;
// 마지막으로 본 적의 자리가 기억에 남는 턴 수. 0이면 시야를 벗어나는 순간 잊는다.
// 이 값이 곧 "안개"의 두께다 — 적은 사라지는 것이 아니라 흐려져야 한다.
let contactMemoryTurns = 3;
// 행군 중 접적 정지가 걸리는 거리(칸). 0이면 아예 멈추지 않는다.
// 처음에는 이 값이 곧 시야였다 — 새 적이 시야 안에 들어오기만 하면 그 자리에서
// 멈췄다. 그래서 시야 6칸짜리 전차는 계곡 건너 적을 "알아본" 것만으로 이동력 6을
// 한 칸에 버리고 섰고, 화면에는 장애물도 없는데 멈춘 것처럼 보였다(목적지 46칸 중
// 20칸이 이렇게 잘렸고, 멈춘 지점의 적과의 거리는 예외 없이 정확히 6칸이었다).
// 멀리서 알아보는 것은 정찰이지 접적이 아니다. 발이 묶이는 건 코앞일 때뿐이다.
let contactHaltRange = 2;
// 전방 방어 거리(칸). 수비의 자리는 지킬 칸 위가 아니라 그 앞이다. 지켜야 할 칸을
// 밟고 서 있으면 적이 도달한 시점에 그 칸은 이미 전장이 되어 있다. 위협 방향으로
// 이만큼 나가 맞이한다. 0으로 두면 목표 위에 그대로 눌러앉는다.
let enemyForwardDefense = 2;
// 거점을 전부 잃은 뒤 패배 선고까지의 유예 턴. 진영당 거점 하나로 시작하게 되면서
// "거점 0 = 즉시 패배"는 기병 한 기의 후방 침투로 작전 전체가 끝나는 규칙이 됐다.
// 거점 상실은 파국이어야지 사고여선 안 된다 — 유예 동안 되찾으면 계속 싸운다.
// 0으로 두면 예전처럼 그 자리에서 끝난다.
let baseLossGraceTurns = 3;
// 거점 안에 들어앉은 부대가 받는 방어 버프. 부대 자체 방어력과는 별개로 더해진다 —
// 대대 사령부(방어 3)가 거점에 들어가면 합쳐서 6이 되어 아주 오래 버틴다.
// 예전에는 이 값이 지형표(terrain.B.defense)에 박혀 있었고, 그래서 공병대가 지은
// 보급창고에는 붙지 않았다. 같은 "보급 거점"인데 시나리오가 그린 것에만 엄폐가 있고
// 내가 지은 것에는 없는 셈이었다. 이제 거점이면 출신을 안 따진다.
let baseDefenseBonus = 3;
// 능선이 막아 주는 방향에서 때리면 그만큼 덜 들어간다. 지금까지 「방어방향 북쪽」은
// 지도와 정보칸에 글자로만 떠 있었고 피해 계산에는 한 푼도 안 들어갔다 — 화면이
// 거짓말을 하고 있었던 것이고, 그걸 읽고 우회한 사람만 손해를 봤다.
// 이 값은 지형 엄폐(coverAt)에 넣지 않고 전투 계산에서만 따로 뺀다. 엄폐에 섞으면
// AI가 자리를 고를 때 쓰는 다섯 군데가 전부 "누가 어느 쪽에서 오는가"를 모르는 채
// 방향값을 읽게 되어, 아무도 안 오는 방향의 능선을 명당으로 착각한다.
// 0으로 두면 예전처럼 글자만 뜨고 계산에는 안 들어간다.
let ridgeFacingDefense = 2;
// 내가 가진 보급 거점 위에 선 부대가 턴마다 회복하는 병력. 거점을 "생산 숫자가
// 붙은 칸"에서 "부대를 다시 세우는 자리"로 만든다. 0으로 두면 이 규칙이 꺼진다.
let baseRepairRate = 1;
// 거점 생산 효율이 턴마다 회복하는 폭. 여태 효율은 내려가기만 했다 — 습격당할 때마다
// 곱하기로 깎이고 되돌릴 방법이 없었다. 거점이 둘일 때는 반쪽만 죽는 일이었지만, 하나로
// 줄인 지금은 습격 서너 번이면 생산이 영구히 0에 수렴한다. 그건 전투의 결과가 아니라
// 회복 규칙이 없어서 생기는 사고다. 지키고 있으면 복구된다 — 다만 적이 붙어 있으면 못 한다.
// 0으로 두면 예전처럼 한 번 깎인 효율은 영영 안 돌아온다.
let baseEfficiencyRepair = 0.1;
// 적이 무주공산 거점을 확보하러 나가는 반경(칸). 중립 거점을 AI가 무시하면
// 플레이어만 주워 먹고 후반 물량이 일방적으로 기운다. 거리로 묶어 두는 이유는
// 지도 반대편 거점을 쫓아 전선을 비우지 않게 하기 위함이다. 0이면 안 나간다.
// 8은 묶는 값이 아니었다. 거리 계산이 체비쇼프라 반경 8은 17x17이고, 지도가
// 20x16이니 사실상 전 지도였다 — 슬라이더는 있는데 아무것도 제한하지 않았다.
// 5면 자기 전선 폭만큼이고, 그 밖의 거점은 전선을 밀어야 닿는다.
let enemyBaseSeekRange = 5;
const episodeLimits = {
  playerBattalionHQ: 1,
  enemyBattalionHQ: 1,
};
// 「지도 모드」를 켤지만 정한다. 켜면 칸이 지형 그림 대신 지도 표식으로 그려지고
// 안개도 옅어진다. 위도·경도·확대율도 예전에는 여기 있었는데, 그건 남의 지도
// 서버에서 그림을 받아 오던 시절의 값이라 지금은 쓰이지 않아 뺐다.
let mapConfig = {
  enabled: true,
};

let terrainMap = findScenario(defaultScenarioId).terrain;
let hillDefenseMap = findScenario(defaultScenarioId).hillDefense;
let activeScenario = findScenario(defaultScenarioId);

// 시나리오는 지형·배치·목표만 바꾼다. 규칙은 여기(game.js) 그대로다.
// 판 크기는 terrain 배열이 정하므로 시나리오마다 지도 크기가 달라도 된다.
function applyScenario(scenario) {
  activeScenario = scenario;
  terrainMap = scenario.terrain;
  hillDefenseMap = scenario.hillDefense;
  // 다리를 걸 수 있는 자리는 지형에서 나온다. 지형이 바뀌었으니 지난 판에서 재 둔
  // 값은 이제 남의 지도 이야기다(bridgeAxisAt).
  bridgeAxisCache.clear();
  width = scenario.terrain[0].length;
  height = scenario.terrain.length;
  mapConfig = { ...mapConfig, ...(scenario.map ?? {}) };
  // CSS가 20x16을 박아두고 있으면 다른 크기 지도가 찌그러진다. 격자는 JS가 알려준다.
  boardEl?.style.setProperty("--map-cols", String(width));
  boardEl?.style.setProperty("--map-rows", String(height));
  // 지도 크기가 바뀌면 눕힌 판의 높이도 바뀐다. 다시 화면에 맞춘다.
  scheduleBoardFit();
}

const unitTypes = {
  infantry: { label: "소총분대", mark: "보", domain: "land", hp: 10, move: 3, range: 1, attack: 4, cost: 3, supplyUse: 1, sight: 5 },
  armor: { label: "중형전차", mark: "전", domain: "land", hp: 14, move: 4, range: 1, attack: 6, cost: 5, supplyUse: 2, sight: 6 },
  // 장거리포는 지상 최속(기동 4)보다 멀리 쏴야 한다. 사거리 3이던 시절에는
  // 보병(3)이 한 턴에 붙었고 전차·공병·자주포(4)는 붙고도 한 칸이 남았다.
  // 포가 사거리 밖에서 맞기만 하는 부대였다는 뜻이다. 5로 올려 최속 기동에
  // 한 칸을 남긴다 — 포를 잡으려면 두 턴을 걸거나 엄호를 뚫어야 한다.
  artillery: { label: "야포대", mark: "포", domain: "land", hp: 8, move: 1, towedMove: 4, range: 5, attack: 5, cost: 6, supplyUse: 2, sight: 3 },
  // 값 300은 잠금장치였다. 아트도 3개국어 이름도 지형 제약도 다 들어와 있는데
  // 아무도 살 수 없어 사장돼 있었다. 야포(6)보다 비싼 대신 견인 없이 쏘고 달린다.
  // 대가는 값이 아니라 보급이다 — 소모 4/턴은 창고 없이 굴릴 수 없는 숫자이고,
  // 고지에도 못 오른다. 강하되 보급선을 요구하는 부대, 이 게임의 주제 그대로다.
  // 값 9는 과했다(체력+공격 대비 값이 전 병종 최하위였다). 야포와의 차이는
  // 이동의 자유이지 화력이 아니므로, 값은 야포에 붙이고 대가는 보급에 남긴다.
  // 자주포도 같은 장거리포라 사거리 5를 함께 받는다. 다만 기동 4를 그대로 두면
  // 이동 후 사격의 위협 반경이 9가 되어 야포와의 구분이 사라진다. 기동 3으로
  // 내려 야포(견인 4로 옮기고 그 턴은 못 쏨)와의 차이를 "옮긴 턴에도 쏜다"로
  // 좁힌다. 값 7과 소모 4는 그 자유의 대가로 남는다.
  spArtillery: { label: "자주포", mark: "자", domain: "land", hp: 10, move: 3, range: 5, attack: 5, cost: 7, supplyUse: 4, sight: 5 },
  // 공병대는 튼튼한 전투원이 아니라 빨리 가서 짓는 일꾼이다. 체력 12는 보병보다
  // 두텁고 이동 4는 보병보다 빨라서, 값 1 차이로 보병 자리를 통째로 빼앗고 있었다.
  // 이동 4는 남긴다 — 공사 자리까지 가는 게 이 부대의 일이다.
  engineer: { label: "공병대", mark: "공", domain: "land", hp: 10, move: 4, range: 1, attack: 2, cost: 4, supplyUse: 1, sight: 6 },
  // 방어 3은 사령부가 스스로 버티라고 준 값이다. 이동 1에 공격 1이라 도망도 반격도
  // 못 하는데, 지금까지는 개활지에서 전차 두 대면 정리됐다. 사령부가 죽으면 보급이
  // 통째로 끊기므로 그 한 번의 돌파가 전선 전체를 무너뜨렸다. 이제 보병은 세 번,
  // 전차는 두 번 붙어야 한다 — 잡을 수는 있되, 지나가는 길에 덤으로 잡히지는 않는다.
  battalionHQ: { label: "대대 사령부", mark: "지", domain: "land", hp: 9, move: 1, range: 1, attack: 1, cost: 6, supplyUse: 1, defense: 3, moraleAura: 10, commandRange: 2, supplyRange: hqSupplyRange, recoveryRange: hqRecoveryRange, sight: 3 },
};

const factionUnitProfiles = {
  allies: {
    infantry: { label: "M1 개런드 소총분대", shortLabel: "M1 소총분대", image: "infantry-allies.png" },
    armor: { label: "M4 셔먼 중형전차", shortLabel: "M4 셔먼", image: "armor-allies.png" },
    artillery: { label: "M2A1 105mm 야포대", shortLabel: "M2A1 야포", image: "artillery-allies.png" },
    spArtillery: { label: "M7 프리스트 자주포", shortLabel: "M7 프리스트", image: "sp-artillery-allies.png" },
    engineer: { label: "전투공병대", shortLabel: "전투공병대", image: "engineer-allies.png" },
    battalionHQ: { label: "대대 사령부", shortLabel: "대대 HQ", image: "hq-allies.png" },
  },
  axis: {
    infantry: { label: "Kar98k 소총분대", shortLabel: "Kar98k 분대", image: "infantry-axis.png" },
    armor: { label: "Panzer IV 중형전차", shortLabel: "Panzer IV", image: "armor-axis.png" },
    artillery: { label: "leFH 18 105mm 야포대", shortLabel: "leFH 18 야포", image: "artillery-axis.png" },
    spArtillery: { label: "Wespe 자주포", shortLabel: "Wespe 자주포", image: "sp-artillery-axis.png" },
    engineer: { label: "Pionier 공병대", shortLabel: "Pionier", image: "engineer-axis.png" },
    battalionHQ: { label: "대대 사령부", shortLabel: "대대 HQ", image: "hq-axis.png" },
  },
};

const defaultBalance = {
  rules: {
    wartimeProductionFactor,
    raidEfficiencyFactor,
    combatBaseDamage,
    baseEfficiencyFloor,
    captureEfficiencyLoss,
    maxStackSize,
    supplyRange,
    strainedSupplyRange,
    strainedSupplyMoralePenalty,
    isolatedSupplyMoralePenalty,
    isolatedAttritionDamage,
    cutSupplyMoralePenalty,
    collapseGraceTurns,
    collapseMaxDamage,
    hqSupplyRange,
    hqRecoveryRange,
    hqOutOfRangeGraceTurns,
    hqOutOfRangeMoralePenalty,
    counterattackFactor,
    operationTurnLimit,
    objectiveHoldTurns,
    enemyDepotGoal,
    enemyEngineerLimit,
    enemyRecruitSurplus,
    enemyDefenseRadius,
    deployRange,
    enemyReserveShare,
    enemyMainEffortShare,
    enemyFlankSpread,
    enemyTowDistance,
    enemyScreenRange,
    hqTrailDistance,
    hqPanicRange,
    fogOfWar,
    hillSightBonus,
    baseSightRange,
    contactMemoryTurns,
    contactHaltRange,
    enemyForwardDefense,
    // 이 넷은 balanceSnapshot과 ruleEditorFields에는 있는데 여기에만 빠져 있었다.
    // 에디터에서 만질 수는 있지만 "초기값 복원"이 되돌려 주지 않는다는 뜻이다.
    // 하필 거점 규칙만 통째로 빠져 있었다.
    baseLossGraceTurns,
    baseDefenseBonus,
    ridgeFacingDefense,
    baseRepairRate,
    baseEfficiencyRepair,
    enemyBaseSeekRange,
    depotSafeDistance,
    playerBattalionHQ: episodeLimits.playerBattalionHQ,
    enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
  },
  units: JSON.parse(JSON.stringify(unitTypes)),
};

// 게임에 처음부터 박혀 있는 값. 저장된 설정을 불러올 때 바탕으로 깔아 쓴다.
// defaultBalance 는 "초기값 저장"을 누르면 바뀌지만 이쪽은 절대 안 바뀐다.
const builtInBalance = JSON.parse(JSON.stringify(defaultBalance));

const DEFAULT_BALANCE_STORAGE_KEY = "ww2TacticalCommand.defaultBalance";

// 하다 만 판을 적어 두는 자리. 칸은 하나뿐이다 — 여러 칸을 만들면 "몇 번 칸에
// 저장할까"를 묻게 되고, 그건 이 게임이 사람에게 물을 일이 아니다.
const SAVED_OPERATION_KEY = "ww2TacticalCommand.savedOperation";
// 판의 생김새가 바뀌면 옛 저장본은 못 읽는다. 못 읽는 것을 억지로 읽으면 엉뚱한
// 판이 뜨느니만 못하므로, 번호가 다르면 그냥 버린다.
const SAVED_OPERATION_VERSION = 1;

const constructionCosts = {
  depot: 1,
  bridge: 2,
  rail: 1,
};

// 다리는 두 가지다. 이름이 같아서 하나로 취급했더니 서로의 규칙을 뒤집었다.
//
//   교량(roadBridge) — 시나리오에 처음부터 서 있는 마을 다리. 전쟁 전부터 있던
//                      것이라 주인이 없고 양쪽 다 그냥 건넌다. 공병은 짓지도
//                      고치지도 못한다. 한 번 무너지면 그 길목은 그 판 내내 막힌다.
//   부교(bridge)     — 공병이 놓는 도하 장비. 3칸 이하 강폭에만, 병렬 금지,
//                      진영당 2개. 놓고 부수고 다시 놓는 소모품이다.
//
// 둘 다 부술 수 있되 값이 정반대다.
//
//   교량 체력 20 · 방어 3 — 보병(공격 4)은 스무 번, 전차(6)는 일고여덟 번.
//     지나가는 길에 덤으로 끊기지 않고, 작정하고 포를 돌려야 끊긴다.
//   부교 체력 3 · 방어 -1 — 방어가 음수라 오히려 더 아프게 맞는다. 어떤 부대가
//     쏘든 한 방이다. 나룻배를 엮어 놓은 것이니 그래야 맞다.
//
// 그래서 판마다 같은 질문이 한 번씩 나온다 — 저 다리를 끊을 것인가 건널 것인가.
const bridgeKinds = {
  roadBridge: { hp: 20, defense: 3, name: "교량" },
  bridge: { hp: 3, defense: -1, name: "부교" },
};

// 다리 위는 난간뿐인 널판이다. 파고들 흙도 숨을 나무도 없이 물 위에 떠 있으므로
// 개활지(엄폐 0)보다도 맞기 쉽다. coverAt에서 빼는 값이라 전투 계산·피해 예측·
// AI의 자리 고르기가 전부 같은 숫자를 읽는다.
const bridgeExposure = 2;

const unitEditorFields = [
  ["hp", "체력", 1, 99, 1],
  ["move", "기동", 0, 12, 1],
  ["range", "사거리", 1, 8, 1],
  // 기동+2로 채워 두었을 뿐 기동에 묶여 있지는 않다. 여기서 보병만 올리면
  // 그날로 보병이 정찰병이 되고, 전차를 내리면 전차는 눈이 좁은 돌격 병기가 된다.
  ["sight", "시야", 0, 12, 1],
  ["attack", "공격", 0, 30, 1],
  // 지형 방어 보정과 같은 단위로 더해진다. 값이 없는 병종에는 아예 칸이 안 생긴다.
  ["defense", "방어", 0, 20, 1],
  ["cost", "비용", 0, 999, 1],
  ["supplyUse", "소모", 0, 20, 1],
  ["towedMove", "견인", 0, 12, 1],
  ["moraleAura", "사기+", 0, 50, 1],
  ["commandRange", "지휘", 0, 8, 1],
];

const ruleEditorFields = [
  ["wartimeProductionFactor", "전시 생산 배율", 0, 2, 0.1],
  ["raidEfficiencyFactor", "포격받은 생산 잔존율", 0.1, 1, 0.05],
  ["combatBaseDamage", "거점 위 전투 생산 잔존율", 0.1, 1, 0.05],
  ["baseEfficiencyFloor", "거점 효율 하한", 0, 1, 0.05],
  ["captureEfficiencyLoss", "점령 시 생산 잔존율 (1=감소 없음)", 0.1, 1, 0.05],
  ["maxStackSize", "동종 최대 중첩", 1, 9, 1],
  ["supplyRange", "기본 정상 보급선", 1, 20, 1],
  ["strainedSupplyRange", "기본 불안 보급선", 1, 30, 1],
  ["strainedSupplyMoralePenalty", "보급 불안 사기 감소", 0, 80, 5],
  ["isolatedSupplyMoralePenalty", "고립 사기 감소", 0, 100, 5],
  ["isolatedAttritionDamage", "고립 턴 피해", 0, 10, 1],
  ["cutSupplyMoralePenalty", "보급 두절 사기 감소", 0, 90, 5],
  ["collapseGraceTurns", "두절 후 붕괴 유예 턴", 0, 20, 1],
  ["collapseMaxDamage", "붕괴 턴당 최대 피해", 1, 10, 1],
  ["hqSupplyRange", "대대 HQ 보급 범위", 0, 12, 1],
  ["hqRecoveryRange", "대대 HQ 보충 범위", 0, 6, 1],
  ["hqOutOfRangeGraceTurns", "HQ 밖 유예 턴", 0, 10, 1],
  ["hqOutOfRangeMoralePenalty", "HQ 밖 턴당 사기 감소", 0, 50, 1],
  ["counterattackFactor", "반격 위력 배율", 0, 1.5, 0.05],
  ["operationTurnLimit", "작전 기한 턴 (0=무제한)", 0, 99, 1],
  ["objectiveHoldTurns", "목표 장악 유지 턴", 1, 10, 1],
  ["enemyDepotGoal", "적 보급창고 최소 목표 (0=안 지음)", 0, 12, 1],
  ["enemyEngineerLimit", "적 공병대 한도", 0, 6, 1],
  ["enemyRecruitSurplus", "적 증원 가속 보급품", 0, 200, 2],
  ["enemyDefenseRadius", "적 방어 출격 반경", 0, 10, 1],
  ["deployRange", "배치 조정 반경", 0, 10, 1],
  ["enemyReserveShare", "적 예비대 비율 (%)", 0, 60, 5],
  ["enemyMainEffortShare", "적 주공 집중도 (%)", 30, 100, 5],
  ["enemyFlankSpread", "적 우회 폭", 0, 8, 1],
  ["enemyTowDistance", "적 야포 견인 거리", 0, 14, 1],
  ["enemyScreenRange", "적 보병 엄호 반경", 0, 8, 1],
  ["hqTrailDistance", "사령부 추종 거리", 0, 8, 1],
  ["hqPanicRange", "사령부 위기 감지 거리", 0, 8, 1],
  ["fogOfWar", "전장 안개 (1=켬)", 0, 1, 1],
  ["hillSightBonus", "고지 시야 보너스", 0, 6, 1],
  ["baseSightRange", "거점 감시 거리", 0, 8, 1],
  ["contactMemoryTurns", "적 목격 기억 턴", 0, 10, 1],
  ["contactHaltRange", "행군 중 접적 정지 거리 (0=끔)", 0, 6, 1],
  ["enemyForwardDefense", "적 전방 방어 거리", 0, 6, 1],
  ["baseLossGraceTurns", "거점 상실 패배 유예 턴 (0=즉시)", 0, 20, 1],
  ["baseDefenseBonus", "거점 안 부대 방어 버프", 0, 8, 1],
  ["ridgeFacingDefense", "능선 정면 방어 보정", 0, 8, 1],
  ["baseRepairRate", "거점 위 재편성 회복 (0=끔)", 0, 5, 1],
  ["baseEfficiencyRepair", "거점 효율 턴당 복구 (0=끔)", 0, 0.5, 0.05],
  ["enemyBaseSeekRange", "적 중립 거점 확보 반경 (0=안 감)", 0, 20, 1],
  ["depotSafeDistance", "보급창고 안전 거리", 1, 12, 1],
  ["playerBattalionHQ", "연합군 HQ 한도", 0, 9, 1],
  ["enemyBattalionHQ", "적군 HQ 한도", 0, 9, 1],
];

const terrain = {
  P: { name: "개활지", className: "plain", cost: 1, defense: 0, elevation: 0, artilleryCover: 0 },
  C: { name: "강변/접근로", className: "coast", cost: 1, defense: 0, elevation: 0, artilleryCover: 0 },
  F: { name: "삼림", className: "forest", cost: 2, defense: 1, elevation: 0, artilleryCover: 1 },
  H: { name: "고지/산등성이", className: "hill", cost: 1, defense: 2, elevation: 2, artilleryCover: 2 },
  W: { name: "하천/강", className: "water", cost: Infinity, defense: 0, elevation: -1, artilleryCover: 0 },
  // 창고와 하역장이 들어선 시가지다. 고지와 같은 엄폐를 주되 고지가 아니므로 관측 이점은
  // 없고, 포장된 바닥이라 전차도 그대로 들어온다. 지키는 쪽이 유리하지만 지형만으로는
  // 못 버틴다 — 거점을 지키려면 결국 부대를 붙여야 한다.
  // 방어 보정이 0인 건 거점에 엄폐가 없어서가 아니라, 그 몫이 baseDefenseBonus로
  // 옮겨갔기 때문이다. 지형이 아니라 거점이 주는 버프여야 공병대가 지은 창고에도 붙는다.
  B: { name: "보급 거점", className: "base", cost: 1, defense: 0, elevation: 0, artilleryCover: 2 },
};

const localePacks = {
  en: {
    title: "1944 Tactical Command",
    side: { player: "Allies", enemy: "Axis" },
    units: {
      infantry: "Rifle Squad",
      armor: "Medium Tank",
      artillery: "Field Artillery",
      spArtillery: "Self-Propelled Gun",
      engineer: "Engineers",
      battalionHQ: "Battalion HQ",
    },
    terrain: {
      P: "Open Ground",
      C: "Riverbank/Approach",
      F: "Forest",
      H: "Ridge/High Ground",
      W: "River",
      B: "Supply Base",
    },
    buttons: {
      recruit: "Reinforce",
      deploy: "Deploy",
      build: "Build",
      lay: "Lay",
      bridge: "Bridge",
      depot: "Supply Depot",
      rail: "Railway",
      tow: "Tow by Truck",
      endTurn: "End Turn",
      restart: "New Operation",
      command: "Command",
    },
    // 계기 띠 다섯 칸. 폰에서 폭이 정해진 자리라 긴 낱말은 안 들어간다 —
    // Initiative(10칸)는 「주도권」(6칸)보다 넓어서 띠를 한 줄 더 접게 만든다.
    status: ["Day", "Turn", "Supply", "Income", "Units"],
    legend: "Legend",
    more: "More",
    folds: ["Army Reinforcements", "Navy", "Air Force", "AI"],
    hint: "Click a unit to show available commands.",
    select: "Select a unit",
    editor: "Game Values Editor",
    // 저장 안내와 「기록 지우기」. 이건 게임 규칙이 아니라 이 기계에 무엇을 적어
    // 두는지 알리는 글이라, 읽는 사람이 못 읽으면 알린 것이 아니다.
    privacy: {
      noticeTitle: "Nothing is sent to a server",
      noticeBody:
        "A few things are written to this device so you can resume an unfinished operation. No cookies are used.",
      noticeMore: "See what is stored",
      noticeOk: "Got it",
      clear: "Erase stored data",
      clearArmed: "Confirm — your saved operation goes too",
      policy: "Privacy Policy",
    },
  },
  zh: {
    title: "1944 前线司令部",
    side: { player: "同盟国", enemy: "轴心国" },
    units: {
      infantry: "步枪班",
      armor: "中型坦克",
      artillery: "野战炮队",
      spArtillery: "自行火炮",
      engineer: "工兵队",
      battalionHQ: "营部",
    },
    terrain: {
      P: "开阔地",
      C: "海岸",
      F: "森林",
      H: "高地/山脊",
      W: "河川",
      B: "补给基地",
    },
    buttons: {
      recruit: "增援",
      deploy: "投入",
      build: "建造",
      lay: "铺设",
      bridge: "桥梁",
      depot: "补给仓库",
      rail: "铁路",
      tow: "卡车牵引",
      endTurn: "结束回合",
      restart: "新作战",
      command: "指挥",
    },
    status: ["作战日", "主动权", "补给", "下回补给", "战斗部队"],
    legend: "图例",
    more: "更多",
    folds: ["陆军增援", "海军", "空军", "AI"],
    hint: "点击部队显示可用命令。",
    select: "选择部队",
    editor: "游戏数值编辑器",
    privacy: {
      noticeTitle: "不会发送到任何服务器",
      noticeBody: "为了让你能接着玩未完成的作战，只在本机记录几项内容。不使用 Cookie。",
      noticeMore: "查看记录了什么",
      noticeOk: "知道了",
      clear: "清除记录",
      clearArmed: "确认清除 · 未完成的作战也会消失",
      policy: "隐私政策",
    },
  },
  ja: {
    title: "1944 前線司令部",
    side: { player: "連合軍", enemy: "枢軸軍" },
    units: {
      infantry: "小銃分隊",
      armor: "中戦車",
      artillery: "野砲隊",
      spArtillery: "自走砲",
      engineer: "工兵隊",
      battalionHQ: "大隊司令部",
    },
    terrain: {
      P: "開けた地形",
      C: "海岸",
      F: "森林",
      H: "高地/山稜",
      W: "河川",
      B: "補給拠点",
    },
    buttons: {
      recruit: "増援",
      deploy: "投入",
      build: "建設",
      lay: "敷設",
      bridge: "橋",
      depot: "補給倉庫",
      rail: "鉄道",
      tow: "トラック牽引",
      endTurn: "作戦終了",
      restart: "新作戦",
      command: "指揮",
    },
    status: ["作戦日", "主導権", "補給", "次回補給", "戦闘部隊"],
    legend: "凡例",
    more: "詳細",
    folds: ["陸軍増援", "海軍", "空軍", "AI"],
    hint: "部隊をクリックすると使用可能な命令が表示されます。",
    select: "部隊を選択",
    editor: "ゲーム数値エディター",
    privacy: {
      noticeTitle: "サーバーへ送るものはありません",
      noticeBody:
        "途中の作戦を後で続けられるように、いくつかだけこの端末に記録します。クッキーは使いません。",
      noticeMore: "何を記録するか見る",
      noticeOk: "了解",
      clear: "記録を消す",
      clearArmed: "本当に消す · 途中の作戦も消えます",
      policy: "プライバシーポリシー",
    },
  },
};

const activeLocale = detectLocale();
const activePack = localePacks[activeLocale];

/* ─── 낱말장 ───────────────────────────────────────────────────────────────
   게임 안의 글자는 한국어가 원본이다. 코드 주석도 한국어고, 새 기능을 붙일
   때 손이 먼저 가는 말도 한국어다. 그러니 원본을 딴 이름표(예: MSG_ATTACK)로
   바꿔 놓으면, 코드를 읽을 때 그 자리에 무슨 말이 나오는지 다시 찾아봐야 한다.

   그래서 한국어 문장 자체를 열쇠로 쓴다. t("보급 두절")이라고 적으면 코드에는
   한국어가 그대로 남고, 영어를 고른 사람에게만 영어가 나간다. 낱말장에 없는
   말은 한국어 그대로 나간다 — 빠뜨려도 화면이 비지는 않는다.

   숫자나 부대 이름처럼 그때그때 달라지는 것은 {이름}으로 자리만 비워 둔다.
   한국어와 영어는 말 순서가 다르므로(「적 3대대를 격파했다」 / 「destroyed the
   3rd Battalion」) 자리를 비워 두어야 각 말이 제 순서로 설 수 있다.

   중국어·일본어 자리는 아직 비어 있다. 비어 있으면 영어로 대신 내보낸다 —
   한국어보다는 읽을 수 있는 사람이 많다.
   ────────────────────────────────────────────────────────────────────────── */
// prettier-ignore
const uiDict = {
  en: {
    "이 판에서 이기는 법": "How you win this one",
    "지도 위 노란 줄이 이번 작전의 목표다. 몇 번 칸을 며칠 쥐고 있어야 하는지가 거기 적혀 있다.": "The yellow bar above the map is this operation's objective. It says which tile to hold, and for how many days.",
    "부대를 고른다": "Pick a unit",
    "내 부대를 하나 누른다. 갈 수 있는 칸이 지도에 밝게 뜬다.": "Tap one of your units. The tiles it can reach light up on the map.",
    "고른 부대를 옮긴다": "Move it",
    "밝은 칸 하나를 누르면 그리로 간다. 한 부대는 하루에 한 번만 움직인다.": "Tap one of the lit tiles and the unit goes there. Each unit moves once a day.",
    "적을 친다": "Attack",
    "붉은 부대가 사거리 안에 들어오면, 그 부대를 누르는 것이 곧 공격이다. 사거리 밖이면 눌러도 아무 일도 일어나지 않는다.": "Once a red unit is in range, tapping it is the attack. Out of range, tapping does nothing.",
    "하루를 끝낸다": "End the day",
    "「턴 종료」를 누르면 적이 움직이고 다음 날 아침이 온다. 판은 그때마다 저절로 저장된다.": "Press End Turn: the enemy moves and the next morning comes. The game saves itself each time.",
    "보급품으로 늘린다": "Spend your supply",
    "위쪽 「보급품」이 매일 들어온다. 「지휘」를 눌러 증원하거나 다리·창고를 짓는 데 쓴다.": "Supply comes in every day — it is the figure at the top. Press Command to raise units, or to build bridges and depots.",
    "보급 두절 › 해당 부대는 매 턴 병력이 녹는다 · 보급선 안으로 후퇴시킬 것": "Supply cut › those units bleed strength every turn · pull them back inside the line",
    "기한 임박 › {n}턴 남음 · 목표 달성을 최우선으로": "Deadline near › {n} turns left · the objective comes first",
    "보급 고갈 › 보급은 거점에서 나온다 · 거점을 지키거나 공병대로 보급창고를 세울 것": "Out of supply › supply comes from bases · hold a base, or have engineers build a depot",
    "적 접촉 › 부대를 고르고 사거리 안의 적을 누르면 사격 · 고지와 숲은 방어에 유리하다": "Contact › pick a unit and tap an enemy in range to fire · high ground and woods favour the defender",
    "목표 진입 › 장악은 눌러앉아야 오른다 · 상대 턴을 넘기고도 남아 있어야 한 턴이다": "On the objective › holding only counts while you sit on it · you must still be there after their turn",
    "도하 › 공병대를 물가에 붙이고 「부교 건설」 · 한 도하에 {n}줄까지": "Crossing › put engineers on the bank and build a pontoon · up to {n} spans per crossing",
    "증원 › 대대사령부를 고른 뒤 편성 · 도착한 부대는 다음 턴부터 움직인다": "Reinforcing › select a battalion HQ, then raise a unit · it moves from the next turn",
    "작전 개시 › 부대를 눌러 강조된 칸으로 이동 · 지도 밑줄이 왜 안 되는지 알려 준다": "Get moving › tap a unit and move onto a marked tile · the note under the map says why one is blocked",
    "{staff} 「{name}」 · {brief}": "{staff} “{name}” · {brief}",
    "보급 두절": "Supply cut",
    "음악 켜기": "Music on",
    "음악 끄기": "Music off",
    "{side} › 작전 개시 · 지휘 {co}": "{side} › operation begins · CO {co}",
    "{side} 방어선 › 지휘관 미상 · 적 대대사령부 확인 요망": "{side} line › CO unknown · locate the enemy battalion HQ",
    "공병대 배치 · 다리 1일, 보급창고·철도 수일 소요": "Engineers deployed · bridge 1 day, depot and rail several",
    "공병대 › 보병보다 빠르고 튼튼 · 전투력은 소총분대의 80%": "Engineers › faster and tougher than infantry · 80% of a rifle squad in a fight",
    "배치 단계 › 부대를 강조된 칸으로 옮긴 뒤 「배치 완료」 · 조정 반경 {n}칸": "Deployment › move units onto the marked tiles, then press Deploy done · radius {n} tiles",
    "참모부 › {n}개 부대 배치 조정 ({co} 보급 역량)": "Staff › {n} units repositioned ({co} supply reach)",
    "현행 수치 › 초기값으로 저장": "Current values › saved as the defaults",
    "{unit} › ({x},{y}) {foe} 발견 · 정지": "{unit} › ({x},{y}) spotted {foe} · halted",
    "{unit} › ({x},{y}) 기동": "{unit} › ({x},{y}) moved",
    "{unit} › ({x},{y}) 기동 · 공격 가능": "{unit} › ({x},{y}) moved · can attack",
    "배치 완료 › 작전 개시": "Deploy done › operation begins",
    "경고 › {n}개 부대가 보급 범위 밖에서 개시": "Warning › {n} units start outside supply range",
    "증원 불가 › 대대사령부를 먼저 선택": "No reinforcement › select a battalion HQ first",
    "증원 불가 › {unit} · 이 작전의 편성 대상 아님": "No reinforcement › {unit} · not raised in this operation",
    "증원 불가 › 배속된 대대사령부 전부 투입됨": "No reinforcement › every attached battalion HQ is already committed",
    "증원 불가 › 대대사령부 주변에 빈 칸 없음": "No reinforcement › no empty tile beside the battalion HQ",
    "{unit} › 전선 도착 · 편성 중, 내일부터 기동": "{unit} › reached the front · forming up, moves from tomorrow",
    "야포대 › 견인 연결 · 다음 턴 고속 이동, 포격 불가": "Artillery › hitched · fast move next turn, cannot fire",
    "야포대 › 포 전개 · 다음 턴부터 포격 가능": "Artillery › unlimbered · can fire from next turn",
    "공사 불가 › {what}에 보급품 {n} 필요": "Cannot build › {what} needs {n} supply",
    "공병대 › ({x},{y}) {what} 착공 · {n}일 소요": "Engineers › ({x},{y}) started {what} · {n} days",
    "경고 › 공사 중 공병대는 이동 불가 · 이 자리는 안전하지 않음": "Warning › engineers cannot move while building · this tile is not safe",
    "{what} 공사 취소": "{what} construction cancelled",
    "{side} › 반격 개시": "{side} › counter-attack begins",
    "{side} 보급 +{n}": "{side} supply +{n}",
    "보급 +{n}": "Supply +{n}",
    "{side} {what} › 시공 부대 소실 · 공사 중단": "{side} {what} › builders lost · work stopped",
    "{side} {what} › 완공까지 {n}일": "{side} {what} › {n} days to completion",
    "{side} {what} › 완공": "{side} {what} › complete",
    "{side} › 대대사령부 상실 · 예비대 편성 중단": "{side} › battalion HQ lost · no more reserves",
    "{unit} 예비대 투입": "{unit} committed from reserve",
    "{side} › 보급 부족 · 예비대 투입 지연": "{side} › short of supply · reserves delayed",
    "{side} › 전개 공간 없음 · 예비대 투입 지연": "{side} › no room to deploy · reserves delayed",
    "{side} › 사령부 포위 · 증원 불가": "{side} › HQ encircled · no reinforcement",
    "{side} › 공병대 투입 · 후방 보급 공사": "{side} › engineers committed · building supply in the rear",
    "포격 불가 › 견인 중 · 포를 전개할 것": "Cannot fire › still hitched · unlimber the gun",
    "포격 무효 › 능선이 사선을 차단": "No effect › the ridge blocks the line of fire",
    "{unit} 격파": "{unit} destroyed",
    "{unit} › 사거리 밖 포격 · 반격 없음": "{unit} › fired from beyond reach · no return fire",
    "{unit} › 반격 · {foe} 피해 {n}": "{unit} › returned fire · {foe} takes {n}",
    "{unit} 반격에 격파": "{unit} destroyed by return fire",
    "거점 포격 불가 › 견인 중 · 포를 전개할 것": "Cannot shell the base › still hitched · unlimber the gun",
    "거점 포격 불가 › 능선 뒤 · 사선 없음": "Cannot shell the base › behind the ridge · no line of fire",
    "{unit} › ({x},{y}) 보급 거점 타격": "{unit} › ({x},{y}) hit the supply base",
    "{side} 거점 생산 효율 {n}%로 하락": "{side} base output falls to {n}%",
    "{unit} 포격 › 보급 시설 피해 누적": "{unit} shelling › damage piling up on the supply works",
    "{side} › 고립 {n}개 부대 포위 압박 · 각 피해 {dmg}": "{side} › {n} cut-off units under pocket pressure · {dmg} each",
    "{side} › 보급 두절 {n}개 부대 붕괴 · 총 피해 {dmg}": "{side} › {n} unsupplied units collapsing · {dmg} total",
    "{unit} 보급 붕괴로 소멸": "{unit} gone — supply collapse",
    "{side} 대대사령부 › 인접 {n}개 부대 병력 +1": "{side} battalion HQ › {n} adjacent units +1 strength",
    "{side} › 거점 재편성 {n}개 부대 · 병력 +{hp}": "{side} › {n} units refitted at a base · +{hp} strength",
    "{side} › 거점 {n}곳 복구 · 생산 효율 상승": "{side} › {n} bases repaired · output rising",
    "{side} › ({x},{y}) 무혈 접수 · 효율 {n}%": "{side} › ({x},{y}) taken unopposed · {n}% output",
    "{side} › ({x},{y}) 거점 장악 · 효율 {n}%": "{side} › ({x},{y}) base seized · {n}% output",
    "{where} 보급선 개통": "supply line open to {where}",
    "{where} 장악": "{where} held",
    "{side} › {what} · 유지 {held}/{need}턴": "{side} › {what} · held {held}/{need} turns",
    "{where} 보급선 차단됨": "supply line to {where} cut",
    "{where} 장악 상실": "{where} lost",
    "{side} › {what} · 유지 턴 초기화": "{side} › {what} · hold count reset",
    "{unit} › ({x},{y}) {what} 포격 · 피해 {n}": "{unit} › ({x},{y}) shelled {what} · {n} damage",
    "{what} 잔존 · 내구 {hp}/{max}": "{what} still standing · {hp}/{max}",
    "{unit} › 견인 연결": "{unit} › hitched",
    "{unit} › 포 전개": "{unit} › unlimbered",
    "{side} 공병대 › ({x},{y}) 임시 교량 완성": "{side} engineers › ({x},{y}) pontoon bridge complete",
    "{side} 공병대 › ({x},{y}) 철도 부설 착공": "{side} engineers › ({x},{y}) rail laying started",
    "{side} 공병대 › ({x},{y}) 보급창고 착공": "{side} engineers › ({x},{y}) depot started",
    "({x},{y}) {what} 붕괴": "({x},{y}) {what} collapsed",
    "{unit}{rest} 다리와 함께 수몰": "{unit}{rest} went down with the bridge",
    " 외 {n}": " +{n} more",
    "({x},{y}) {what} 붕괴 · 도하 차단": "({x},{y}) {what} collapsed · crossing cut",
    "{unit} › 다리와 함께 수몰": "{unit} › went down with the bridge",
    "{unit} › 반격": "{unit} › counter-attack",
    "{unit} › {where} 진격": "{unit} › advance on {where}",
    "{head} · {victim} 격파": "{head} · destroyed {victim}",
    "교량": "Bridge",
    "부교": "Pontoon",
    "연합군은 능선 아래 통로를 뚫어라. 추축군은 통로를 여는 공병대를 없애라.": "Allies: force the pass below the ridge. Axis: destroy the engineers opening it.",
    "연합군은 칼라치 다리를 사흘 잡아라. 추축군은 다리 동쪽 진지를 사흘 지켜라.": "Allies: hold the Kalach bridge for three days. Axis: hold the east bank position for three days.",
    "추축군은 올호바트카 능선을 점령하라. 연합군은 이레를 버틴 뒤 동군 보급로를 끊어라.": "Axis: take the Olkhovatka ridge. Allies: hold seven days, then cut the eastern supply road.",
    "연합군 공세": "Allied offensive",
    "추축군 공세": "Axis offensive",
    "{n}일": "{n} days",
    "기한 없음": "No deadline",
    "기한 넘기면 무승부": "Time out = draw",
    "기한 넘기면 연합군": "Time out = Allies",
    "기한 넘기면 추축군": "Time out = Axis",
    "사기 +{m} · 공격 {a} · 방어 {d} · 이동 {v} · 보급 {s}": "Morale +{m} · Atk {a} · Def {d} · Move {v} · Supply {s}",
    "개시 병력 +{n}": "Start force +{n}",
    "개시 병력 {n}": "Start force {n}",
    "개시 병력 그대로": "Start force as usual",
    "보급 ×{n}": "Supply ×{n}",
    "예비대 아군과 같이": "Reserves match yours",
    "예비대 아군의 ×{n}": "Reserves ×{n} yours",
    "적 참모부": "Enemy staff",
    "신병": "Green",
    "정규": "Regular",
    "노련": "Veteran",
    "정예": "Elite",
    "적 전선이 한 부대 얇고, 예비대도 아군보다 얇게 선다.": "The enemy line is one unit thinner, and their reserves come in below yours.",
    "지금까지의 그 전선. 적 예비대는 아군과 같은 수로 선다.": "The line as it has always been. Enemy reserves match yours unit for unit.",
    "적이 두 부대 더 서서 시작하고, 예비대를 아군보다 조금 더 세운다.": "The enemy starts with two more units and fields slightly more reserves than you.",
    "적이 네 부대 더 서서 시작하고, 보급이 배 가까이 들어온다.": "The enemy starts with four more units and draws nearly double the supply.",
    "열기": "Open",
    "닫기": "Close",
    "상륙정 준비 중": "Landing craft — soon",
    "구축함 준비 중": "Destroyer — soon",
    "정찰기 준비 중": "Recon plane — soon",
    "전술폭격 준비 중": "Tactical bomber — soon",
    "자동 편제 준비 중": "Auto-organise — soon",
    "자동 보급 준비 중": "Auto-supply — soon",
    "조작 안내": "How to play",
    "그만 보기": "Don't show again",
    "다음": "Next",
    "작전 명령서": "Operation Orders",
    "기밀": "SECRET",
    "중단된 작전": "Operation in progress",
    "이어하기": "Resume",
    "지우기": "Discard",
    "지휘관 명부": "Commander file",
    "아군 지휘": "Our CO",
    "진영": "Side",
    "명령서 지휘관": "Commander",
    "연합군": "Allies",
    "추축군": "Axis",
    "개방 대기": "Locked",
    "진영 지정 후 개방": "Unlocks after side",
    "작전 지정 후 개방": "Unlocks after operation",
    "초기 배치": "Opening deployment",
    "참모부 자동 배치": "Staff deploys for me",
    "직접 배치": "I deploy myself",
    "자동 배치는 장군의 보급 역량에 맞춰 부대 간격을 좁힙니다. 직접 배치는 작전 개시 전 배치 단계를 엽니다.": "Staff deployment tightens unit spacing to match your general's supply reach. Deploying yourself opens a placement step before the operation begins.",
    "지휘관 지정 후 개방": "Unlocks after commander",
    "상대 참모부": "Enemy staff",
    "배치 방식 지정 후 개방": "Unlocks after deployment",
    "취소": "Cancel",
    "작전 개시": "Begin operation",
    "작전 상황": "Operation status",
    "진영 선택": "Choose a side",
    "작전 선택": "Choose an operation",
    "초기 배치 방식": "Deployment method",
    "난이도 선택": "Choose a difficulty",
    "작전 이력": "Operation log",
    "전장 이상 없음": "All quiet",
    "작전": "Operation",
    // 부대 이름과 작전 목표 이름. 장비 이름은 원래 표기를 그대로 둔다.
    "Kar98k 분대": "Kar98k sqd",
    "Kar98k 소총분대": "Kar98k rifle sqd",
    "M1 개런드 소총분대": "M1 Garand rifle sqd",
    "M1 소총분대": "M1 rifle sqd",
    "M2A1 105mm 야포대": "M2A1 105mm bty",
    "M2A1 야포": "M2A1 gun",
    "M4 셔먼": "M4 Sherman",
    "M4 셔먼 중형전차": "M4 Sherman medium tank",
    "M7 프리스트": "M7 Priest",
    "M7 프리스트 자주포": "M7 Priest SPG",
    "Panzer IV 중형전차": "Panzer IV medium tank",
    "Pionier 공병대": "Pionier engineers",
    "Wespe 자주포": "Wespe SPG",
    "leFH 18 105mm 야포대": "leFH 18 105mm bty",
    "leFH 18 야포": "leFH 18 gun",
    "대대 HQ": "Bn HQ",
    "전투공병대": "Combat engineers",
    "능선 아래 통로": "Pass Below Ridge",
    "동군 보급로": "E Supply Road",
    "칼라치 동안 진지": "Kalach E Bank",
    "정면": "front",
    // 카드에 값으로 찍히는 말. 이름표만 고치면 값이 한글로 남는다.
    "고립 {n}/4": "Cut off {n}/4",
    "대대 보급": "HQ supply",
    "보급선 두절": "Line cut",
    "사령부 전멸": "HQ lost",
    "전진 보급": "Forward",
    "정상 보급": "Normal",
    "보급 불안": "Strained",
    "보급선 이탈": "Out of range",
    "강변 또는 주요 접근로 / 이동 가능": "Riverbank or main approach / passable",
    "원거리 포격 차단 / 전차, 자주포 진입 불가": "Blocks arty fire / no tanks or SPGs",
    "하천: 교량 없이는 통과 불가": "River: impassable without a bridge",
    "다리 위: 엄폐가 없어 개활지보다 맞기 쉽고, 다리가 끊기면 함께 빠진다": "On the bridge: no cover, easier to hit than open ground, and lost with the bridge",
    "방어 유리 / 포격 효과 감소": "Good cover / arty less effective",
    "시가지 창고: 방어 +2 / 포격 효과 감소 / 전차 진입 가능": "Town depot: defence +2 / arty less effective / tanks may enter",
    " / 소유 시 주둔 부대 병력 +{n}": " / while held, garrison recovers +{n}",
    "일반": "Standard",
    "HQ {n}": "HQ {n}",
    "거점 {n}": "Base {n}",
    "단절": "Cut",
    "보급선 두절 / 발급 불가": "Line cut / cannot issue",
    "보충 {a}칸 / 보급 {b}칸": "Refit {a} / supply {b}",
    "정상 {a}칸 / 불안 {b}칸": "Normal {a} / strained {b}",
    "고지 +{n}": "High +{n}",
    "저지 {n}": "Low {n}",
    "북쪽": "North",
    "동쪽": "East",
    "남쪽": "South",
    "서쪽": "West",
    "지정 없음": "None",
    "단절 (도하로 없음)": "Cut (no ford)",
    "개통": "open",
    "초과": "over",
    // 부대 카드·지형 카드의 이름표. 카드 한 줄은 폰에서 두 칸씩 들어가므로
    // 긴 낱말은 줄을 밀어낸다 — 승인된 약자 규칙대로 핵심만 남겼다.
    "위치": "Tile",
    "지형": "Terrain",
    "방어 보정": "Cover",
    "거점 엄폐": "Base Cover",
    "지형 특성": "Trait",
    "전투력": "Strength",
    "부대 방어": "Armour",
    "사기": "Morale",
    "행동": "Action",
    "보급": "Supply",
    "기동력": "Move",
    "사거리": "Range",
    "중첩": "Stack",
    "지휘관": "CO",
    "장군 이동": "CO Move",
    "장군 보급": "CO Supply",
    "상태": "State",
    "보급선": "Line",
    "소모": "Upkeep",
    "두절 지속": "Cut For",
    "두절 사기 손실": "Cut Morale",
    "다음 턴 붕괴 피해": "Next Collapse",
    "지휘 범위": "Command",
    "보급권": "Covers",
    "사령부 보너스": "HQ Bonus",
    "작전 목표": "Objective",
    "이동 비용": "Move Cost",
    "다리 위 노출": "On Bridge",
    "고도": "Elev",
    "포격 엄폐": "Arty Cover",
    "방어방향": "Faces",
    "특성": "Trait",
    "개량": "Works",
    "소유": "Owner",
    "생산": "Output",
    "효율": "Eff.",
    "공사": "Building",
    // 카드에 들어가는 값.
    "장악 유지": "Hold",
    "개통 유지": "Keep open",
    "통과 불가": "Impassable",
    "없음": "none",
    "철도": "Rail",
    "보급창고": "Depot",
    "완료": "Done",
    "가능": "Ready",
    "이동 완료 / 공격 가능": "Moved / can attack",
    "편성 중 / 내일부터": "Forming / from tomorrow",
    "견인": "Towed",
    "전개": "Deployed",
    "부대를 선택하세요": "Select a unit",
    "강변/접근로": "Riverbank",
    "하천/강": "River",
    "평지": "Open",
    "숲": "Forest",
    "고지/산등성이": "Ridge",
    "보급 거점": "Supply Base",
    "{n}턴": "{n} turns",
    "{a}/{b}턴": "{a}/{b} turns",
    "{n}/턴": "{n}/turn",
    "총력전": "Total War",
    "도하 돌파": "River Push",
    "교차로 사수": "Hold Crossroad",
    "사령부 사냥": "Hunt the HQ",
    "고립 사령부 구조": "Break Out the HQ",
    "보급선 개통": "Open Supply",
    "엘 알라메인": "El Alamein",
    "천왕성": "Uranus",
    "바그라티온": "Bagration",
    "코브라": "Cobra",
    "마켓가든": "Market Garden",
    "임팔·코히마": "Imphal–Kohima",
    "낫질": "Sickle Cut",
    "메르쿠어": "Mercury",
    "싱가포르": "Singapore",
    "가잘라": "Gazala",
    "하르코프": "Kharkov",
    "성채": "Citadel",
    "노르망디 내륙. 양측 모두 상대 후방의 간선 출구를 노린다.": "Inland Normandy. Both sides are after the highway exit behind the other's lines.",
    "강 하나가 전선을 갈랐다. 도하 지점은 북·중·남 셋뿐이고, 시간은 공격 측 편이 아니다.": "One river splits the front. There are only three crossings — north, centre, south — and time is not on the attacker's side.",
    "산울타리 지대의 두 교차로. 동군이 밀고 들어오고, 서군은 증원이 올 때까지 버텨야 한다.": "Two crossroads in hedgerow country. East pushes in; West has to hold until reinforcements arrive.",
    "양측 모두 대대 사령부를 하나씩만 데리고 나왔다. 사령부가 죽으면 증원도 보급도 끝이다.": "Each side brought exactly one battalion HQ. Lose it and both reinforcements and supply stop.",
    "포위망 한가운데 사령부 하나가 남았다. 사령부는 추격자보다 느리다 — 호위를 붙여 걸어서 빼낸다.": "One HQ is left inside the pocket. It is slower than its pursuers — give it an escort and walk it out.",
    "강이 전선을 둘로 갈랐다. 성한 다리는 북·중·남 셋뿐이고, 강폭이 두 칸이라 새로 놓으려면 공병대가 두 칸을 이어 붙여야 한다.": "A river splits the front in two. Only three bridges are intact — north, centre, south — and the water is two tiles wide, so a new crossing means engineers laying two spans.",
    "북은 바다, 남은 소금 늪. 옆으로 돌 길이 없어 정면으로만 뚫는 회랑이다.": "Sea to the north, salt marsh to the south. There is no way around — this corridor is forced from the front or not at all.",
    "돈 강이 판을 세로로 가른다. 건널 곳은 칼라치 다리 하나뿐이다.": "The Don cuts the board from top to bottom. The only way across is the bridge at Kalach.",
    "늪과 숲 사이로 난 간선 셋. 남북에서 동시에 집게를 닫아야 자루가 된다.": "Three highways threading marsh and forest. The pocket closes only if both pincers, north and south, shut together.",
    "보카주 울타리가 사방을 막는다. 남으로 뚫린 길은 가운데 회랑 하나뿐이다.": "Bocage hedgerows block every direction. The only road south is the single corridor down the middle.",
    "물길 셋을 가로지르는 외길. 다리 셋이 다 서 있어야 북쪽 교두보가 산다.": "One road across three waterways. The northern bridgehead lives only while all three bridges stand.",
    "산에 둘러싸인 진지 하나. 포위된 쪽이 남쪽 길을 다시 열어야 산다.": "A single position ringed by mountains. The side inside survives only by reopening the road south.",
    "아무도 기갑이 못 지난다고 한 숲 뒤에서 나온다. 강 하나만 건너면 해안까지 뚫린다.": "The armour comes out of the forest everyone said armour could not cross. One river, and the road to the coast is open.",
    "비행장을 둘러싸고 흩어져 내렸다. 강바닥에 급조한 보급소 하나로는 여드레를 못 버틴다.": "They came down scattered all around the airfield. One dump improvised in a dry riverbed will not last eight days.",
    "해협에 다리가 하나도 없다. 건너려면 공병이 놓아야 하고, 그 공병이 표적이다.": "Not one bridge spans the strait. Crossing means engineers build one — and those engineers are the target.",
    "사막에 그은 선의 남쪽 끝은 늘 열려 있다. 돌아 들어간 쪽이 먼저 보급을 잃는다.": "The southern end of a line drawn in the desert is always open. Whoever goes around it loses their supply first.",
    "너무 멀리 나온 쪽이 도시 안에 앉아 있고, 예비대는 아직 손도 대지 않았다.": "The side that ran too far ahead is sitting inside the city, and the reserves have not been touched yet.",
    "능선 하나를 두고 정면으로 민다. 미는 쪽이 지치는 날, 다른 쪽 명령이 열린다.": "A head-on push for one ridge. The day the attacker tires, the other side's orders come open.",
    "상대 후방 간선 출구를 점령해 유지하라.": "Take the highway exit behind the enemy line and hold it.",
    "기한 안에 강을 건너 동쪽 출구를 확보하라. 못 하면 공격 실패다.": "Cross the river and secure the eastern exit before the deadline. Fail and the attack has failed.",
    "기한이 끝날 때까지 두 교차로를 내주지 마라.": "Give up neither crossroads before the deadline expires.",
    "적 대대 사령부를 격파하라. 내 사령부를 잃으면 그것으로 끝이다.": "Destroy the enemy battalion HQ. If you lose your own, it is over.",
    "고립된 사령부를 탈출 지점까지 데려가라. 잃으면 즉시 패배다. 사령부는 인접 아군이 있는 동안만 직접 피격을 면한다 — 엄호를 끊기지 마라.": "Walk the cut-off HQ to the escape point. Lose it and you lose at once. It is spared direct fire only while a friendly unit stands beside it — never let the escort break.",
    "동안의 화물역까지 보급선을 개통하고 유지하라. 부대를 세우는 것으로는 끝나지 않는다.": "Open a supply line to the freight yard on the east bank and keep it open. Parking a unit there is not enough.",
    "연합군은 동쪽 능선을 점령하라. 추축군은 통로를 여는 공병대를 없애라.": "Allies: take the eastern ridge. Axis: destroy the engineers opening the lane.",
    "연합군은 칼라치 다리를 사흘 잡아라. 추축군은 서쪽 탈출로를 열어라.": "Allies: hold the Kalach bridge for three days. Axis: open the escape route west.",
    "연합군은 동쪽 거점 둘을 모두 점령하라. 추축군은 서군 사령부를 격멸하라.": "Allies: take both eastern bases. Axis: wipe out the western battalion HQ.",
    "연합군은 남쪽 출구까지 내려가라. 추축군은 회랑을 이틀 끊어라.": "Allies: get down to the southern exit. Axis: cut the corridor for two days.",
    "연합군은 아른헴 교두보까지 보급선을 사흘 이어라. 추축군은 회랑을 끊어라.": "Allies: run a supply line to the Arnhem bridgehead for three days. Axis: cut the corridor.",
    "연합군은 남쪽 도로까지 보급선을 사흘 이어라. 추축군은 임팔 진지를 점령하라.": "Allies: run a supply line to the southern road for three days. Axis: take the Imphal position.",
    "추축군은 서쪽 해안까지 내달려라. 연합군은 그 기갑을 모두 격파하라.": "Axis: race to the western coast. Allies: destroy every one of those armoured units.",
    "추축군은 말레메 비행장을 이틀 잡아라. 연합군은 강하부대를 모두 쓸어라.": "Axis: hold Maleme airfield for two days. Allies: sweep away every paratroop unit.",
    "추축군은 저수지를 사흘 잡아라. 연합군은 공병대를 모두 격파하라.": "Axis: hold the reservoir for three days. Allies: destroy every engineer unit.",
    "연합군은 비르하케임을 닷새 잡고 적 사령부까지 격멸하라. 추축군은 토브룩을 점령하라.": "Allies: hold Bir Hakeim for five days and destroy the enemy battalion HQ. Axis: take Tobruk.",
    "추축군은 하르코프를 되찾아라. 연합군은 동쪽 진출선까지 더 나아가라.": "Axis: retake Kharkov. Allies: push on to the eastern start line.",
    "추축군은 올호바트카 능선을 점령하라. 연합군은 여드레를 버틴 뒤 동군 후방 거점을 잡아라.": "Axis: take the Olkhovatka ridge. Allies: survive eight days, then take the eastern rear base.",
    "돌파 목표": "Breakthrough",
    "도하 출구": "Ford Exit",
    "북 교차로": "N Crossroad",
    "남 교차로": "S Crossroad",
    "대대 사령부": "Battalion HQ",
    "탈출 지점": "Exit Point",
    "고립 사령부": "Cut-off HQ",
    "화물역": "Rail Yard",
    "동쪽 능선": "E Ridge",
    "공병대": "Engrs",
    "칼라치 다리": "Kalach Bridge",
    "서쪽 탈출로": "W Escape",
    "북쪽 집게": "N Pincer",
    "남쪽 집게": "S Pincer",
    "남쪽 출구": "S Exit",
    "회랑 절단점": "Cut Point",
    "아른헴 교두보": "Arnhem Bridge",
    "남쪽 도로": "S Road",
    "임팔 진지": "Imphal",
    "기갑부대": "Armour",
    "서쪽 해안": "W Coast",
    "강하부대": "Paratroops",
    "말레메 비행장": "Maleme Airfield",
    "저수지": "Water",
    "비르하케임": "Bir Hakeim",
    "토브룩 요새": "Tobruk",
    "동쪽 진출선": "E Start Line",
    "동군 후방 거점": "E Rear Base",
    "올호바트카 능선": "Olkhovatka Ridge",
    "미국": "USA",
    "영국": "UK",
    "소련": "USSR",
    "프랑스": "France",
    "뉴질랜드": "NZL",
    "독일": "GER",
    "일본": "Japan",
    "대장": "Gen",
    "원수": "FM",
    "중장": "Lt Gen",
    "소장": "Maj Gen",
    "준장": "Brig",
    "상급대장": "Col Gen",
    "기갑 돌파": "Armd Breakout",
    "신중한 준비": "Methodical",
    "연합 지휘": "Coalition",
    "보병 운용": "Infantry",
    "대규모 공세": "Offensive",
    "기동 포위": "Encirclement",
    "악지 작전": "Bad Ground",
    "분산 배치": "Dispersed",
    "요새 방비": "Fortress",
    "끈질긴 방어": "Stubborn",
    "기갑 반격": "Armd Counter",
    "전차 집중": "Massed Armd",
    "방어전": "Defence",
    "기동 방어": "Mobile Def",
    "작전 기동": "Op Manoeuvre",
    "참모의 계산": "Staff Work",
    "공수 작전": "Airborne",
    "정글 기동": "Jungle",
    "무보급 강행": "No-Supply Push",
    "작전 「{name}」 개시 · {side} {commander} 지휘": "Operation “{name}” begins · {side} · {commander} commanding",
    "작전 「{name}」 — {summary}": "Operation “{name}” — {summary}",
    "지정 부대만 인정": "designated unit only",
    " / {side} {label} · 유지 {held}/{need}턴{only}": " / {side} {label} · held {held}/{need} turns{only}",
    "{label} ({x}, {y}) 지점": "{label} at ({x}, {y})",
    "{n}일차부터": "from day {n}",
    "둘 다 달성": "both required",
    "목표": "Goal",
    "지정 부대가 ": "with the designated unit, ",
    "{label} ({x}, {y}) {who}{need}턴 유지{note}": "Hold {label} ({x}, {y}) {who}for {need} turns{note}",
    "{label} ({x}, {y}) 보급선 개통 {need}턴 유지{note}": "Open a supply line to {label} ({x}, {y}) and hold it {need} turns{note}",
    "적": "foe",
    "아군": "ours",
    "{whose} {label} 격파{note}": "Destroy the {whose} {label}{note}",
    "{label} 사수": "Hold {label} at all costs",
    "{label}{은} 오늘 막 도착해 아직 편성 중입니다. 내일부터 움직이고 쏩니다.": "{label} arrived only today and is still forming up. It moves and fires from tomorrow.",
    "{enemy} {target} 격파했습니다.": "The {enemy} {target} has been destroyed.",
    "{enemy}이 아군 {target} 격파했습니다.": "The {enemy} destroyed our {target}.",
    "{where}까지 보급선을 개통했습니다.": "A supply line is open all the way to {where}.",
    "{enemy}이 {where}까지 보급선을 개통했습니다.": "The {enemy} opened a supply line all the way to {where}.",
    "{where}을 확보해 작전 목표를 달성했습니다.": "{where} secured — the operation's objective is met.",
    "{enemy}이 {where}을 확보했습니다.": "The {enemy} has secured {where}.",
    "사수해야 할 {target} 잃었습니다.": "{target}, which had to be held, is lost.",
    "{enemy}의 {target} 무너뜨렸습니다.": "The {enemy}'s {target} has fallen.",
    " 사수 시 승리": " — hold to the end and you win",
    " 안에 달성 실패 시 패배": " — fail to finish inside it and you lose",
    "작전 기한 {limit}턴{tail}": "Deadline {limit} turns{tail}",
    "작전 기한 없음": "No deadline",
    "아군: {goal}": "Ours: {goal}",
    "적: {goal}": "Theirs: {goal}",
    "작전 기한이 끝날 때까지 전선을 지켜냈습니다.": "The line held until the deadline ran out.",
    "작전 기한 안에 목표를 달성하지 못했습니다.": "The objective was not met inside the deadline.",
    "작전 기한이 끝나 전선이 교착되었습니다.": "The deadline ran out with the front deadlocked.",
    "작전 기한 {left}턴 남음": "{left} turns left on the deadline",
    "{enemy} 전선이 붕괴되었습니다.": "The {enemy} front has collapsed.",
    "{player} 교두보를 상실했습니다.": "The {player} bridgehead is lost.",
    "{side} › 보급 거점 전부 상실 · {grace}턴 내 탈환 못하면 전선 붕괴": "{side} › every supply base lost · retake one within {grace} turns or the front collapses",
    "승리": "Victory",
    "패배": "Defeat",
    "무승부": "Draw",
    "승 리": "VICTORY",
    "패 배": "DEFEAT",
    "작전 {days}일 · 적 격파·탈취 {kills} · 아군 손실 {losses}": "Day {days} · enemy destroyed/taken {kills} · own losses {losses}",
  },
  zh: {},
  ja: {},
};

function fillSlots(line, vars) {
  if (!vars) return line;
  return line.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole));
}

function t(ko, vars) {
  if (activeLocale === "ko") return fillSlots(ko, vars);
  const pack = uiDict[activeLocale];
  const line = (pack && pack[ko]) || uiDict.en[ko] || ko;
  return fillSlots(line, vars);
}

const commanders = [
  { id: "patton", side: "Allies", name: "George S. Patton", nation: "미국", rank: "대장", trait: "기갑 돌파", morale: 6, attack: 2, defense: -1, move: 2, supply: 0, stackMorale: 4 },
  { id: "montgomery", side: "Allies", name: "Bernard Montgomery", nation: "영국", rank: "원수", trait: "신중한 준비", morale: 6, attack: -1, defense: 3, move: -1, supply: 2, stackMorale: 6 },
  { id: "eisenhower", side: "Allies", name: "Dwight D. Eisenhower", nation: "미국", rank: "대장", trait: "연합 지휘", morale: 8, attack: 0, defense: 1, move: 0, supply: 3, stackMorale: 8 },
  { id: "bradley", side: "Allies", name: "Omar Bradley", nation: "미국", rank: "대장", trait: "보병 운용", morale: 5, attack: 1, defense: 1, move: 1, supply: 1, stackMorale: 5 },
  { id: "zhukov", side: "Allies", name: "Georgy Zhukov", nation: "소련", rank: "원수", trait: "대규모 공세", morale: 8, attack: 2, defense: -1, move: 1, supply: -1, stackMorale: 3 },
  { id: "rokossovsky", side: "Allies", name: "Konstantin Rokossovsky", nation: "소련", rank: "원수", trait: "기동 포위", morale: 7, attack: 1, defense: 1, move: 2, supply: 0, stackMorale: 5 },
  { id: "slim", side: "Allies", name: "William Slim", nation: "영국", rank: "원수", trait: "악지 작전", morale: 7, attack: 0, defense: 2, move: 1, supply: 2, stackMorale: 7 },
  { id: "rommel", side: "Axis", name: "Erwin Rommel", nation: "독일", rank: "원수", trait: "기동 방어", morale: 7, attack: 1, defense: 2, move: 2, supply: -1, stackMorale: 5 },
  { id: "guderian", side: "Axis", name: "Heinz Guderian", nation: "독일", rank: "상급대장", trait: "전차 집중", morale: 6, attack: 2, defense: -1, move: 3, supply: -1, stackMorale: 4 },
  { id: "manstein", side: "Axis", name: "Erich von Manstein", nation: "독일", rank: "원수", trait: "작전 기동", morale: 7, attack: 2, defense: 0, move: 2, supply: 1, stackMorale: 4 },
  { id: "model", side: "Axis", name: "Walter Model", nation: "독일", rank: "원수", trait: "방어전", morale: 6, attack: -1, defense: 4, move: -1, supply: 2, stackMorale: 5 },
  { id: "yamashita", side: "Axis", name: "Tomoyuki Yamashita", nation: "일본", rank: "대장", trait: "정글 기동", morale: 6, attack: 0, defense: 2, move: 2, supply: -1, stackMorale: 6 },
  { id: "student", side: "Axis", name: "Kurt Student", nation: "독일", rank: "상급대장", trait: "공수 작전", morale: 4, attack: 1, defense: -1, move: 3, supply: -2, stackMorale: 4 },

  // 여기부터는 그 작전 하나에만 나오는 사람들이다(only). 위의 상설 명부와 달리
  // 아무 판에나 부를 수 없다 — 그 사람의 전쟁이 거기서 시작하거나 거기서 끝났기
  // 때문이다. 그래서 값도 「잘하는 장군/못하는 장군」이 아니라 그 판을 어떻게
  // 치르게 만들지로 정했다. 붙여 놓은 설명은 숫자 풀이가 아니라 손맛이다.

  // 파울루스 — 계산은 맞는데 발이 안 떨어진다. 진지에 들어앉으면 잘 버티고
  // 보급선도 길게 뻗지만, 치고 나가려 하면 매번 한 박자 늦는다. 포위가 조여드는
  // 천왕성에서 「가만히 있으면 안전한데 가만히 있으면 죽는」 판을 만든다.
  { id: "paulus", side: "Axis", only: ["uranus"], name: "Friedrich Paulus", nation: "독일", rank: "상급대장", trait: "참모의 계산", morale: 5, attack: -1, defense: 3, move: -2, supply: 2, stackMorale: 7 },

  // 무타구치 — 병사는 어디로든 가고 어디서든 싸운다. 다만 보급선이 게임에서 가장
  // 짧다. 임팔에서는 진격 자체가 어렵지 않고, 진격한 다음이 어렵다.
  { id: "mutaguchi", side: "Axis", only: ["imphal"], name: "Renya Mutaguchi", nation: "일본", rank: "중장", trait: "무보급 강행", morale: 8, attack: 2, defense: -2, move: 2, supply: -3, stackMorale: 3 },

  // 프라이버그 — 물러서지 않는다. 공격은 평범하지만 자리를 잡고 있으면 좀처럼
  // 밀리지 않고, 여럿을 한 칸에 몰아 두어도 사기가 잘 안 꺾인다. 하늘에서 쏟아지는
  // 메르쿠어에서 「버티는 쪽」을 실제로 버티게 해 준다.
  { id: "freyberg", side: "Allies", only: ["merkur"], name: "Bernard Freyberg", nation: "뉴질랜드", rank: "소장", trait: "끈질긴 방어", morale: 7, attack: 0, defense: 3, move: 0, supply: 0, stackMorale: 6 },

  // 퍼시벌 — 창고는 가득한데 사기가 얇다. 보급선이 길게 가고 방어도 되지만
  // 먼저 치고 나갈 힘이 없다. 싱가포르에서 「지키기만 해서는 이길 수 없는」
  // 답답함이 이 사람에게서 나온다.
  { id: "percival", side: "Allies", only: ["singapore"], name: "Arthur Percival", nation: "영국", rank: "중장", trait: "요새 방비", morale: 4, attack: -2, defense: 2, move: -1, supply: 3, stackMorale: 7 },

  // 리치 — 부대를 한 칸에 겹쳐 두면 사기가 게임에서 제일 빨리 무너진다. 대신 발은
  // 빠르다. 가잘라에서 실제로 그랬듯 「뭉치지 말고 흩어서 각자 버텨라」를
  // 강요당한다 — 잘 쓰면 넓게 걸치고, 못 쓰면 하나씩 잡아먹힌다.
  { id: "ritchie", side: "Allies", only: ["gazala"], name: "Neil Ritchie", nation: "영국", rank: "중장", trait: "분산 배치", morale: 5, attack: 1, defense: 1, move: 2, supply: 1, stackMorale: 2 },

  // 드골 — 게임에서 가장 세게 치고 가장 멀리 간다. 대신 맞으면 그대로 무너지고
  // 보급도 짧다. 낫질에서 무너지는 전선을 상대로 「한 번의 반격에 전부 거는」
  // 판을 만든다.
  { id: "degaulle", side: "Allies", only: ["sichelschnitt"], name: "Charles de Gaulle", nation: "프랑스", rank: "준장", trait: "기갑 반격", morale: 7, attack: 3, defense: -2, move: 3, supply: -2, stackMorale: 4 },
];

let state;
let pendingUnitMoves = [];
let pendingCombatEvents = [];
let audioContext;
let lastUiSoundAt = 0;
// 소리는 전부 녹음된 파일(assets/audio)이다. 코드는 고르고 재생하는 일만 한다.
const soundVolume = 0.95;

const boardEl = document.querySelector("#battlefield");
const battlefieldWrapEl = document.querySelector(".battlefield-wrap");
const logEl = document.querySelector("#battleLog");
const selectedCardEl = document.querySelector("#selectedCard");
const commanderListEl = document.querySelector("#commanderList");
const turnLabelEl = document.querySelector("#turnLabel");
const phaseLabelEl = document.querySelector("#phaseLabel");
const resourceLabelEl = document.querySelector("#resourceLabel");
const baseLabelEl = document.querySelector("#baseLabel");
const forceLabelEl = document.querySelector("#forceLabel");
const hudTurnLabelEl = document.querySelector("#hudTurnLabel");
const hudPhaseLabelEl = document.querySelector("#hudPhaseLabel");
const hudResourceLabelEl = document.querySelector("#hudResourceLabel");
const hudBaseLabelEl = document.querySelector("#hudBaseLabel");
const hudForceLabelEl = document.querySelector("#hudForceLabel");
const hudAlertLabelEl = document.querySelector("#hudAlertLabel");
const balanceEditorEl = document.querySelector("#balanceEditor");
const operationModalEl = document.querySelector("#newOperationModal");
const operationCommanderChoicesEl = document.querySelector("#operationCommanderChoices");
const operationScenarioChoicesEl = document.querySelector("#operationScenarioChoices");
const operationDifficultyChoicesEl = document.querySelector("#operationDifficultyChoices");
const operationConfirmEl = document.querySelector("#confirmOperationSetup");
const operationCancelEl = document.querySelector("#cancelOperationSetup");
const resumeNoticeEl = document.querySelector("#resumeNotice");
const resumeNoticeMetaEl = document.querySelector("#resumeNoticeMeta");
const resumeOperationEl = document.querySelector("#resumeOperation");
const discardOperationEl = document.querySelector("#discardOperation");
const missionNameLabelEl = document.querySelector("#missionNameLabel");
const missionBriefLabelEl = document.querySelector("#missionBriefLabel");
// 저장 알림 띠. 첫 판 안내(coachAllowed)가 이 띠에게 자리를 비켜 주므로,
// 그쪽보다 먼저 잡아 둔다 — 뒤에 두면 부팅 순서가 조금만 바뀌어도 터진다.
const storageNoticeEl = document.querySelector("#storageNotice");
const resultScreenEl = document.querySelector("#resultScreen");
const resultVerdictEl = document.querySelector("#resultVerdict");
const resultReasonEl = document.querySelector("#resultReason");
const resultTallyEl = document.querySelector("#resultTally");
const resultLogEl = document.querySelector("#resultLog");
const bannerEl = document.createElement("div");
bannerEl.className = "banner";
document.body.appendChild(bannerEl);
let mapZoom = 1;

document.querySelector("#endTurn").addEventListener("click", endPlayerTurn);
document.querySelector("#endDeploy")?.addEventListener("click", finishDeployment);
document.querySelector("#restart").addEventListener("click", openNewOperationSetup);
document.querySelector("#recruitInfantry").addEventListener("click", () => recruit("infantry"));
document.querySelector("#recruitArmor").addEventListener("click", () => recruit("armor"));
document.querySelector("#recruitArtillery")?.addEventListener("click", () => recruit("artillery"));
document.querySelector("#recruitSpArtillery")?.addEventListener("click", () => recruit("spArtillery"));
document.querySelector("#recruitEngineer").addEventListener("click", () => recruit("engineer"));
document.querySelector("#recruitBattalionHQ")?.addEventListener("click", () => recruit("battalionHQ"));
document.querySelector("#buildBridge").addEventListener("click", () => engineerBuild("bridge"));
document.querySelector("#buildDepot").addEventListener("click", () => engineerBuild("depot"));
document.querySelector("#buildRail").addEventListener("click", () => engineerBuild("rail"));
document.querySelector("#toggleTow")?.addEventListener("click", toggleArtilleryTow);
document.querySelector("#toggleCommandPanel")?.addEventListener("click", toggleCommandPanel);
document.querySelector("#focusCommandPanel")?.addEventListener("click", openCommandPanel);
document.querySelector("#panelScrim")?.addEventListener("click", closeCommandPanel);

/* ── 수치 편집은 만드는 사람의 연장이다 ──────────────────────────────────────
   이 게임의 모든 숫자를 그 자리에서 고칠 수 있는 창이 상황판 단추 하나 뒤에
   붙어 있다. 균형을 잡는 동안에는 그게 있어야 하지만, 판을 사는 사람에게는
   그 단추가 곧 "여기 눌러서 이기기"다. 한 번 눌러 본 사람에게 이 게임은
   더 이상 겨루는 물건이 아니게 된다.

   지우지는 않는다 — 지우면 균형을 잡을 방법이 없어진다. 주소 끝에 ?edit=1을
   붙인 사람에게만 단추가 보이고, 그 사실은 이 기계에 적혀서 다음에 켤 때도
   그대로 남는다. ?edit=0으로 다시 감춘다.

   단추만 감춰서는 부족하다. 창은 화면 밖으로 밀려 있을 뿐 살아 있어서, Tab 키만
   눌러 가면 안쪽 숫자칸 아흔 몇 개에 그대로 닿는다. 그래서 단추를 감출 때 창도
   같이 잠근다(inert) — 창의 생김새는 건드리지 않고 손잡이만 뗀다. */
const EDIT_TOOLS_KEY = "ww2TacticalCommand.editTools";

let editToolsOn = false;

/* 수치 편집 창이 「지금 실제로 손 닿는 자리에 있는가」를 한 군데서만 정한다.

   전에는 잠금(inert)은 「편집 연장을 켰는가」로, 없는 셈 치기(aria-hidden)는
   「창을 펼쳤는가」로 각각 따로 정하고 있었다. 기준이 둘이니 서로 어긋났다.
   ?edit=1로 켜기만 하고 창은 안 펼친 순간에는 창이 화면 밖에 접혀 있는데도
   「여기 있다」고 적혀서, 눈으로 못 보는 사람에게는 닫힌 창 안의 입력칸
   아흔여덟 개가 통째로 읽혔다. 반대로 켠 채 창을 접으면 「없다」고 적어 놓고는
   잠그지는 않아서, Tab 키는 그 없다는 자리로 그대로 걸어 들어갔다.

   창이 눈에 보이는 때는 편집 연장이 켜져 있고 또 펼쳐져 있을 때뿐이다.
   그 하나를 두 표시에 똑같이 먹인다. 보이면 열고, 안 보이면 둘 다 닫는다. */
function syncEditorPanelReach() {
  const panel = document.querySelector("#editorPanel");
  if (!panel) return;
  const shown = editToolsOn && document.body.classList.contains("editor-open");
  panel.inert = !shown;
  panel.setAttribute("aria-hidden", shown ? "false" : "true");
}

function syncEditTools() {
  let on = false;
  try {
    const asked = new URLSearchParams(location.search).get("edit");
    if (asked !== null) localStorage.setItem(EDIT_TOOLS_KEY, asked === "0" ? "0" : "1");
    on = localStorage.getItem(EDIT_TOOLS_KEY) === "1";
  } catch (error) {
    on = false;
  }
  editToolsOn = on;
  const button = document.querySelector("#toggleEditorPanel");
  if (button) button.hidden = !on;
  // 감추는 김에 열려 있던 창도 닫는다. ?edit=0으로 껐는데 창이 남아 있으면
  // 그건 끈 것이 아니다.
  if (!on) document.body.classList.remove("editor-open");
  syncEditorPanelReach();
}

syncEditTools();

// 부대 카드는 지도 위에 얹힌 쪽지라 늘 스물두 줄을 펴 두면 전장이 가려진다.
// 접혀 있을 때는 핵심 여섯 줄만 띄우고, 누르면 나머지가 펴진다.
// (넓은 화면에서는 카드 전체가 마우스를 통과시키고, '자세히' 글씨 한 줄만
//  마우스를 받는다. 그래서 이 누름은 그 한 줄에서만 들어온다 — styles.css)
selectedCardEl?.addEventListener("click", () => {
  if (!selectedCardEl.querySelector(".unit-stats")) return;
  selectedCardEl.classList.toggle("expanded");
});
// 임무줄도 같은 이치다. 이기는 조건은 늘 보여야 하지만, 휴대폰에서 두 줄을
// 계속 펴 두면 그 한 줄이 지도 한 칸이다. 평소에는 한 줄만 두고 누르면 펴진다.
document.querySelector("#missionBar")?.addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("expanded");
});
document.querySelector("#toggleEditorPanel")?.addEventListener("click", toggleEditorPanel);
battlefieldWrapEl?.addEventListener("wheel", handleMapWheel, { passive: false });
document.addEventListener("pointerdown", handleGlobalPointerSound, true);
operationModalEl?.addEventListener("change", handleOperationSetupChange);
document.querySelector("#resultDone")?.addEventListener("click", closeResultScreen);
// 이력이 흐르는 도중에 목록을 누르면 남은 줄이 한꺼번에 뜬다. 30일짜리 작전의
// 이력을 끝까지 앉아서 기다리게 하면, 두 번째 판부터는 아무도 안 읽는다.
resultLogEl?.addEventListener("click", revealWholeChronicle);
document.querySelector("#cancelOperationSetup")?.addEventListener("click", closeNewOperationSetup);
document.querySelector("#confirmOperationSetup")?.addEventListener("click", confirmNewOperationSetup);
balanceEditorEl?.addEventListener("input", handleBalanceEditorInput);
balanceEditorEl?.addEventListener("click", handleBalanceEditorClick);

function detectLocale() {
  const override = new URLSearchParams(window.location.search).get("lang");
  const language = (override || navigator.language || navigator.userLanguage || "ko").toLowerCase();
  if (language.startsWith("en")) return "en";
  if (language.startsWith("zh")) return "zh";
  if (language.startsWith("ja")) return "ja";
  if (language.startsWith("ko")) return "ko";
  // 넷 중 어디에도 안 걸리는 언어(불어, 독어, 스페인어 …)는 영어로 연다.
  // 한국어 기계는 위에서 이미 걸러졌으므로 여기까지 오지 않는다.
  return "en";
}

function handleMapWheel(event) {
  if (!battlefieldWrapEl || !boardEl || event.target.closest(".operation-hud")) return;
  event.preventDefault();

  const previousZoom = mapZoom;
  const direction = event.deltaY < 0 ? 1 : -1;
  const nextZoom = clamp(previousZoom + direction * 0.08, 0.6, 1.8);
  if (nextZoom === previousZoom) return;

  const wrapRect = battlefieldWrapEl.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  const pointerXInWrap = event.clientX - wrapRect.left;
  const pointerInsideBoardX = event.clientX >= boardRect.left && event.clientX <= boardRect.right;
  const pointerBoardRatioX = pointerInsideBoardX
    ? clamp((event.clientX - boardRect.left) / Math.max(1, boardRect.width), 0, 1)
    : 0.5;

  mapZoom = Number(nextZoom.toFixed(2));
  boardEl.style.transformOrigin = `${Math.round(pointerBoardRatioX * 100)}% 58%`;
  battlefieldWrapEl.style.setProperty("--map-layout-width", mapZoom > 1 ? `${Math.round(mapZoom * 100)}%` : "100%");
  battlefieldWrapEl.style.setProperty("--map-visual-scale", mapZoom < 1 ? String(mapZoom) : "1");
  battlefieldWrapEl.dataset.zoom = String(Math.round(mapZoom * 100));

  requestAnimationFrame(() => {
    // 확대·축소하면 눕힌 판의 빈 자리 크기도 달라진다. 여백을 다시 잡아 준다.
    // 여기서는 판을 화면에 다시 맞추지 않는다 — 확대는 일부러 크게 보려는 것이다.
    trimBoardBox();
    const nextBoardRect = boardEl.getBoundingClientRect();
    const nextBoardLeftInContent = battlefieldWrapEl.scrollLeft + nextBoardRect.left - wrapRect.left;
    const targetContentX = nextBoardLeftInContent + nextBoardRect.width * pointerBoardRatioX;
    const maxScrollLeft = Math.max(0, battlefieldWrapEl.scrollWidth - battlefieldWrapEl.clientWidth);
    battlefieldWrapEl.scrollLeft = clamp(targetContentX - pointerXInWrap, 0, maxScrollLeft);
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ─── 한 화면 맞추기 ───────────────────────────────────────────────────────
// 지도판은 눕혀 놓았기 때문에(rotateX 58도) 브라우저가 잡아 두는 자리와 실제로
// 그려지는 자리가 다르다. 20x16 판을 재 보면 자리는 808px인데 그림은 578px만
// 쓰고, 위에 187px 아래에 44px이 빈 채로 남는다. 그 빈 자리 때문에 화면이 넘쳐
// 스크롤이 생겼다. 각도와 원근이 고정값이라 비율로 계산하면 지도 크기가 바뀔 때
// 틀어지므로, 눕히기 전후를 직접 재서 빈 만큼만 걷어낸다.
function measureBoardBox() {
  const keep = boardEl.style.transform;
  boardEl.style.transform = "none";
  const flat = boardEl.getBoundingClientRect();
  boardEl.style.transform = keep;
  return { flat, tilted: boardEl.getBoundingClientRect() };
}

// 위아래 빈 자리를 음수 여백으로 걷어낸다. 그림은 그대로 두고 자리만 줄인다.
function trimBoardBox() {
  if (!boardEl || !battlefieldWrapEl) return null;
  boardEl.style.marginTop = "0px";
  boardEl.style.marginBottom = "0px";
  battlefieldWrapEl.style.setProperty("--map-lift", "0px");
  const { flat, tilted } = measureBoardBox();
  const lift = Math.max(0, Math.round(tilted.top - flat.top));
  boardEl.style.marginTop = `${-lift}px`;
  boardEl.style.marginBottom = `${-Math.max(0, Math.round(flat.bottom - tilted.bottom))}px`;
  // 판을 끌어올린 만큼 소실점도 따라 올려야 보는 각도가 그대로 유지된다.
  battlefieldWrapEl.style.setProperty("--map-lift", `${-lift}px`);
  return { flat, tilted };
}

// ─── 좁은 화면에서 판 키우기 ─────────────────────────────────────────────
// 휴대폰 화면은 세로로 길고 판은 가로로 넓다(20:16). 판을 화면 폭에 맞추면
// 한 칸이 16px — 손가락으로 짚을 수 없는 크기가 되고, 그러고도 세로로 300px이
// 그냥 남는다. 그래서 반대로 한다. 남는 세로를 다 쓸 만큼 판을 키우고, 화면
// 밖으로 나간 가로는 손가락으로 밀어서 본다. 전략게임의 지도는 원래 그렇게 본다.
// 다만 화면 두 배까지만 키운다 — 그보다 넓어지면 전선 전체가 한눈에 안 들어온다.
let phoneMapCentered = false;

// 판을 키운 뒤 처음 한 번은 아군이 있는 쪽을 보여 준다. 20칸짜리 전선에서 판이
// 화면보다 넓으면, 가운데를 보여 줬을 때 아군 부대가 통째로 화면 왼쪽 밖에 있다 —
// 게임을 켰는데 내 부대가 하나도 안 보이는 화면이 된다.
function centerPhoneMapOnOwnForces(stage) {
  const max = Math.max(0, stage.scrollWidth - stage.clientWidth);
  const own = boardEl.querySelectorAll(".unit.player");
  if (!own.length) {
    stage.scrollLeft = max / 2;
    return false;
  }
  const stageLeft = stage.getBoundingClientRect().left;
  let sum = 0;
  own.forEach((el) => {
    const r = el.getBoundingClientRect();
    sum += r.left + r.width / 2 - stageLeft + stage.scrollLeft;
  });
  stage.scrollLeft = clamp(sum / own.length - stage.clientWidth / 2, 0, max);
  return true;
}

function fitBoardToPhone() {
  const stage = document.querySelector("#mapStage");
  if (!stage || !boardEl || !battlefieldWrapEl) return;

  battlefieldWrapEl.style.setProperty("--map-fit-scale", "1");
  battlefieldWrapEl.style.setProperty("--map-layout-width", "100%");
  battlefieldWrapEl.style.setProperty("--map-lift", "0px");
  boardEl.style.marginTop = "0px";
  boardEl.style.marginBottom = "0px";

  const room = stage.clientHeight;
  let grow = 1;
  // 무대가 이보다 낮으면 키우기를 건너뛴다. 문지방을 숫자로 박아 두면,
  // 무대 바닥(styles.css의 .map-stage min-height)을 조금만 내려도 그 아래로
  // 들어가 키우기가 통째로 안 돌고 판이 기본 크기로 남는다 — 세로를 아끼려다
  // 지도만 더 작아진다. 그래서 최소 칸 두 줄에서 끌어 쓴다. 칸 크기를 바꾸면
  // 이 문지방도 같이 따라온다.
  if (room > MIN_TOUCH_TILE * 2) {
    // 판을 키우면 눕힌 높이가 키운 배율만큼만 커지지 않는다 — 원근 때문에 앞쪽이
    // 더 크게 벌어져서 계산보다 늘 더 높아진다. 그래서 한 번에 맞히지 않고,
    // 재고 고치기를 몇 번 되풀이해 무대 높이에 붙인다. 0.97은 마지막 한두 픽셀이
    // 잘려 나가지 않게 두는 여유다.
    for (let pass = 0; pass < 5; pass += 1) {
      battlefieldWrapEl.style.setProperty("--map-layout-width", `${(grow * 100).toFixed(1)}%`);
      const { tilted } = measureBoardBox();
      if (tilted.height < 40) break;
      const ratio = (room * 0.97) / tilted.height;
      if (Math.abs(ratio - 1) < 0.02) break;
      const next = clamp(grow * ratio, PHONE_MAP_GROW_MIN, PHONE_MAP_GROW_MAX);
      if (next === grow) break;
      grow = next;
    }
  }
  growForTouchableTiles(grow);

  // 키운 뒤에 눕힌 판의 위아래 빈 자리를 걷어내고, 아군이 있는 쪽을 보여 준다.
  requestAnimationFrame(() => {
    trimBoardBox();
    if (!phoneMapCentered) phoneMapCentered = centerPhoneMapOnOwnForces(stage);
  });
}

// 손가락으로 짚을 수 있는 최소 칸 크기. 아래로는 못 내려간다.
//
// 화면 높이에 맞추는 계산만 두면 세로줄이 많은 지도(20×16 같은)에서 한 칸이
// 18px까지 내려간다. 그 크기는 눌러도 옆 칸이 잡힌다. 그래서 높이에 맞춘 결과가
// 이 값을 밑돌면 그 값을 버리고 칸 크기 쪽을 택한다 — 대신 넘친 세로는 스크롤로
// 본다(styles.css의 .map-stage overflow-y).
//
// 이 규칙은 어느 지도에서 시작하든 똑같이 걸린다. 지도마다 배율을 따로 적어 두면
// 지도를 하나 더 만들 때마다 그 값을 또 정해야 하므로, 칸 크기 한 줄로 정한다.
const MIN_TOUCH_TILE = 44;
const PHONE_MAP_GROW_MIN = 1;
const PHONE_MAP_GROW_MAX = 3.5;

// offsetWidth로 잰다. getBoundingClientRect는 눕힌 각도가 섞여 들어와서 뒷줄
// 칸이 앞줄보다 좁게 나온다 — 그 값으로 맞추면 앞줄이 필요 이상으로 커진다.
function growForTouchableTiles(grow) {
  const tile = boardEl?.querySelector(".tile");
  if (!tile) return;
  const width = tile.offsetWidth;
  if (!(width > 0) || width >= MIN_TOUCH_TILE) return;
  const next = clamp(grow * (MIN_TOUCH_TILE / width), PHONE_MAP_GROW_MIN, PHONE_MAP_GROW_MAX);
  if (next === grow) return;
  battlefieldWrapEl.style.setProperty("--map-layout-width", `${(next * 100).toFixed(1)}%`);
}

// 빈 자리를 걷어내고도 화면보다 길면, 판을 그만큼 줄여서 스크롤을 없앤다.
// 글자는 건드리지 않는다 — 줄이는 것은 지도판 하나뿐이다.
function fitBoardToScreen() {
  if (!boardEl || !battlefieldWrapEl) return;
  // 좁은 화면인지 재는 자는 isPhoneLayout 하나뿐이다. 여기서 innerWidth를 따로
  // 보면 안 된다 — 데스크톱 브라우저의 세로 스크롤막대는 innerWidth에는 들어가고
  // CSS 폭에는 안 들어가서, 막대 폭만큼의 구간에서 화면은 폰 배치인데 판만 넓은
  // 화면 계산으로 맞춰진다. 그 구간에서 판이 세로로 어긋난다.
  if (isPhoneLayout()) {
    fitBoardToPhone();
    return;
  }

  battlefieldWrapEl.style.setProperty("--map-fit-scale", "1");
  battlefieldWrapEl.style.setProperty("--map-lift", "0px");
  boardEl.style.marginTop = "0px";
  boardEl.style.marginBottom = "0px";

  const { tilted } = measureBoardBox();
  // 판을 뺀 나머지(임무 띠·상황판·범례·안내줄·안쪽 여백)가 이미 먹고 있는 높이.
  // 예전에는 이걸 "틀 전체 높이 - 판 높이"로 구했는데, 틀이 화면 높이만큼
  // 늘어나면(아래 align-self: stretch) 그 뺄셈이 곧바로 틀린 값이 된다.
  // 그래서 판 위쪽과 아래쪽을 따로 재서 더한다 — 틀이 얼마나 크든 같은 값이다.
  const stageEl = document.querySelector("#mapStage");
  const wrapStyle = window.getComputedStyle(battlefieldWrapEl);
  const hintEl = document.getElementById("actionHint");
  const rowGap = parseFloat(wrapStyle.rowGap) || 0;
  const belowMap = hintEl ? hintEl.offsetHeight + rowGap : 0;
  const chrome = (stageEl?.offsetTop ?? 0) + belowMap + (parseFloat(wrapStyle.paddingBottom) || 0);
  const room = window.innerHeight - battlefieldWrapEl.getBoundingClientRect().top - 16 - chrome;
  // 남는 자리가 적다고 손을 놓으면 안 된다. 예전 문턱(120px)에서는 낮은 화면일수록
  // 아예 줄이지 않았고, 그 결과 판이 제 크기로 남아 아래에 있던 부대 카드를 화면
  // 밖으로 밀어냈다 — 줄여야 할 때 정확히 안 줄이고 있었다는 뜻이다. 판이 작아지는
  // 것과 고른 부대가 안 보이는 것 중에는 전자가 낫다.
  let fit = 1;
  if (room > 80 && tilted.height > room) fit = room / tilted.height;
  // 가로도 본다. 판을 눕히면 앞쪽(아래쪽) 변이 원근 때문에 뒤쪽보다 넓게 벌어져서,
  // 1440 폭 화면에서는 맨 아랫줄 양쪽 끝 한 칸씩이 화면 밖으로 잘려 나가고 있었다.
  //
  // 여기서 오래 틀렸던 것: 칸(.tile)만 재고 있었다. 판에는 칸 말고도 제 몫의
  // 두께가 있다 — 6px 테두리와 5px 안쪽 여백. 눕힌 판의 앞쪽 변에서는 그 두께도
  // 원근을 타고 같이 벌어져서, 칸은 다 들어와 있는데 판의 아래 두 모서리만
  // 틀 밖으로 삐져나왔다. 그래서 칸의 폭과 판 자신의 폭 중 넓은 쪽으로 잰다.
  const cells = boardEl.querySelectorAll(".tile");
  if (cells.length) {
    let left = Infinity;
    let right = -Infinity;
    cells.forEach((cell) => {
      const r = cell.getBoundingClientRect();
      if (r.left < left) left = r.left;
      if (r.right > right) right = r.right;
    });
    const board = boardEl.getBoundingClientRect();
    const span = Math.max(right - left, board.width);
    // 판이 들어앉을 자리는 무대(#mapStage)의 안쪽 폭이다. 예전에는 바깥 틀의
    // 폭에서 8px만 뺐는데, 그 값은 틀의 안쪽 여백(18px×2)을 그대로 품고 있어서
    // 실제로 쓸 수 있는 자리보다 28px 넓었다 — 딱 그만큼 넘쳐 나오고 있었다.
    const stageWidth = stageEl?.clientWidth ?? battlefieldWrapEl.clientWidth;
    const widthRoom = stageWidth - 8;
    if (widthRoom > 200 && span > widthRoom) fit = Math.min(fit, widthRoom / span);
  }
  if (fit < 1) battlefieldWrapEl.style.setProperty("--map-fit-scale", clamp(fit, 0.42, 1).toFixed(3));
  trimBoardBox();
  placeUnitCard();
}

// 부대 카드는 지도 오른쪽 위 모서리에 얹힌다. 그런데 지도가 시작하는 높이는
// 고정이 아니다 — 범례를 접고 펴거나 임무 문구가 두 줄이 되면 지도가 오르내린다.
// 그래서 지도판이 실제로 시작하는 자리를 재서 카드에게 알려 준다(styles.css).
// 좁은 화면인가. styles.css의 폰 블록과 같은 경계(861px)를 쓴다 — 두 곳이 다른
// 숫자를 들면 자바스크립트가 계산한 자리를 CSS가 무시하는 상태가 조용히 생긴다.
// 켤 때 한 번 재고 마는 것이 아니라 부를 때마다 잰다. 폰을 눕히면 넘어가기 때문이다.
function isPhoneLayout() {
  return !window.matchMedia("(min-width: 861px)").matches;
}

function placeUnitCard() {
  const stage = document.querySelector("#mapStage");
  if (!stage || !battlefieldWrapEl || isPhoneLayout()) return;
  // 판이 무대 안에서 가운데에 놓이므로, 무대가 시작하는 자리가 아니라 판이
  // 실제로 그려지기 시작하는 자리를 잡아야 카드가 지도 모서리에 붙는다.
  let top = stage.offsetTop;
  if (boardEl) {
    const board = boardEl.getBoundingClientRect();
    const wrap = battlefieldWrapEl.getBoundingClientRect();
    if (board.height > 0) top = Math.max(top, board.top - wrap.top);
  }
  battlefieldWrapEl.style.setProperty("--card-top", `${Math.round(top)}px`);
}

// 카드는 늘 지도 오른쪽 위에 얹혀 있었다. 그런데 오른쪽 끝에 선 부대를 누르면
// 그 부대가 카드 밑으로 들어간다 — 보려고 누른 것이 보려던 것을 가리는 셈이다.
// 지도를 세로로 셋으로 나눠, 고른 부대가 오른쪽 칸에 있을 때만 카드를 왼쪽으로
// 옮긴다. 가운데와 왼쪽은 그대로 둔다. 부대를 옮길 때마다 카드가 좌우로 튀면
// 그것대로 눈이 따라다니느라 어지럽기 때문이다.
//
// 기준은 창 너비가 아니라 지도가 놓인 틀이다. 넓은 화면에서는 오른쪽에 지휘칸이
// 따로 있어서, 창으로 재면 지도의 오른쪽 끝이 '가운데'로 계산되어 정작 가려지는
// 자리에서 안 옮겨진다.
function placeCardAwayFromUnit() {
  if (!battlefieldWrapEl || isPhoneLayout()) return;
  const focused = selectedUnit() ?? inspectedUnit();
  let flip = false;
  const element = focused ? findUnitElement(focused.id) : null;
  if (element) {
    const box = element.getBoundingClientRect();
    const wrap = battlefieldWrapEl.getBoundingClientRect();
    if (wrap.width > 0 && box.width > 0) {
      flip = (box.left + box.width / 2 - wrap.left) / wrap.width > 2 / 3;
    }
  }
  battlefieldWrapEl.classList.toggle("card-left", flip);
}

let boardFitTimer = 0;
function scheduleBoardFit() {
  window.clearTimeout(boardFitTimer);
  // requestAnimationFrame은 창이 가려져 있으면 아예 돌지 않는다. 배경 탭에서
  // 열어 둔 판이 맞춰지지 않은 채로 남으므로, 타이머로만 미룬다.
  boardFitTimer = window.setTimeout(fitBoardToScreen, 60);
}

window.addEventListener("resize", scheduleBoardFit);

// ─── 소리 ────────────────────────────────────────────────────────────────
// 예전에는 여기서 소리를 합성했다. 사인파와 잡음으로 만든 총성은 어떻게 손을 봐도
// 총성이 되지 않아서, 전부 녹음된 파일로 갈아치웠다. 무전 특유의 대역 제한과 압축은
// 파일에 이미 구워져 있으므로 재생할 때 필터를 세우지 않는다 — 그래프를 만드는
// 시간만큼 첫 소리가 늦어지면 클릭에 대한 "대답"으로 들리지 않는다.
const audioBasePath = "assets/audio/";

// 무슨 소리를 낼지는 병종이 정한다. 클릭 응답은 병종마다 목소리가 다르고,
// 이동·공격·파괴는 "무엇이 움직이고 무엇이 터지는가"로 묶인다 — 공병대는 걸어서
// 이동하고, 자주포는 궤도로 굴러가므로 각각 보병·전차 소리를 나눠 쓴다.
// 변주를 둘씩 둔 것은 같은 소리가 연달아 나면 귀가 금방 지치기 때문이다.
// 무전 응답은 두 가지로 갈린다.
//
//   내 부대를 눌렀다 -> 명령을 기다리는 보고.       (select)
//   적 부대를 눌렀다 -> 방해받은 쪽의 쏘아붙임.     (taunt)
//
// 그리고 진영마다 쓰는 말이 다르다. 적이 나에게 영어로 "준비되었습니다"라고
// 대답하면 그건 적이 아니라 내 부대다 — 독일군은 독일어로, 자기들 투로 말한다.
// 플레이어가 추축군을 골라 시작할 수도 있으므로(state.playerSide) 네 벌이 다 있다.
const voiceUnitTypes = ["infantry", "armor", "artillery", "spArtillery", "engineer", "battalionHQ"];

function voiceLines(prefix, kind) {
  return Object.fromEntries(
    voiceUnitTypes.map((type) => [type, [1, 2, 3].map((i) => `${prefix}${type}_${kind}_${i}`)]),
  );
}

const soundBank = {
  select: voiceLines("", "select"),          // 연합군, 내 부대
  taunt: voiceLines("", "taunt"),            // 연합군, 적 부대
  axisSelect: voiceLines("axis_", "select"), // 추축군, 내 부대
  axisTaunt: voiceLines("axis_", "taunt"),   // 추축군, 적 부대
  jaSelect: voiceLines("ja_", "select"),     // 일본군 지휘관 밑, 내 부대
  jaTaunt: voiceLines("ja_", "taunt"),       // 일본군 지휘관 밑, 적 부대
  // 이동은 병종이 정한다. 공병은 삽과 곡괭이를 지고 걷고, 자주포는 전차보다
  // 얇은 궤도로 빠르게 굴러간다. 국적은 보지 않는다 — 궤도가 굴러가는 소리에
  // 국적은 없고, 나누면 파일만 두 배가 되고 아무도 차이를 못 듣는다.
  move: {
    infantry: ["move_infantry_1", "move_infantry_2"],
    engineer: ["move_engineer_1", "move_engineer_2"],
    armor: ["move_armor_1", "move_armor_2"],
    spArtillery: ["move_spart_1", "move_spart_2"],
    artillery: ["move_artillery_1", "move_artillery_2"],
    // 사령부는 야포와 같은 견인차 소리를 쓰고 있었다. 무거운 포를 끄는 차와
    // 지휘 차량은 무게가 다르므로 소리도 갈라 둔다.
    battalionHQ: ["move_hq_1", "move_hq_2"],
  },
  // 공사 시작. 유닛 종류별로 나눌 이유가 없지만(공병만 짓는다) 같은 표를 쓰면
  // 재생과 변주 고르기가 한 갈래로 유지된다.
  build: {
    engineer: ["build_start_1", "build_start_2"],
  },
  // 사격만 진영을 따라간다. 총은 나라마다 소리가 다르고, 그 차이가 눈으로
  // 확인하기 전에 "지금 쏘는 쪽이 누구인가"를 알려 준다 — MG42의 톱질 소리와
  // M1 소총의 낱발 소리는 한 번 들으면 헷갈리지 않는다.
  attack: {
    infantry: ["attack_rifle_1", "attack_rifle_2"],
    engineer: ["attack_carbine_1", "attack_carbine_2"],
    battalionHQ: ["attack_sidearm_1", "attack_sidearm_2"],
    armor: ["attack_tank_1", "attack_tank_2"],
    artillery: ["attack_howitzer_1", "attack_howitzer_2"],
    spArtillery: ["attack_spg_1", "attack_spg_2"],
  },
  axisAttack: {
    infantry: ["axis_attack_rifle_1", "axis_attack_rifle_2"],
    engineer: ["axis_attack_carbine_1", "axis_attack_carbine_2"],
    battalionHQ: ["axis_attack_sidearm_1", "axis_attack_sidearm_2"],
    armor: ["axis_attack_tank_1", "axis_attack_tank_2"],
    artillery: ["axis_attack_howitzer_1", "axis_attack_howitzer_2"],
    spArtillery: ["axis_attack_spg_1", "axis_attack_spg_2"],
  },
  // 파괴도 병종만 본다. 공병 진지가 날아가면 쌓아 둔 자재가 무너지고, 지휘소가
  // 날아가면 천막과 무전기가 부서지고, 야포가 죽으면 옆의 포탄이 따라 터진다.
  destroy: {
    infantry: ["destroy_infantry_1", "destroy_infantry_2"],
    engineer: ["destroy_engineer_1", "destroy_engineer_2"],
    battalionHQ: ["destroy_hq_1", "destroy_hq_2"],
    armor: ["destroy_vehicle_1", "destroy_vehicle_2"],
    artillery: ["destroy_gun_1", "destroy_gun_2"],
    spArtillery: ["destroy_vehicle_1", "destroy_vehicle_2"],
  },
};

// 종류별 크기. 무전 응답은 말을 알아들어야 하므로 가장 크고, 이동은 한 턴에 여러
// 부대가 동시에 움직여 겹치므로 가장 작다.
// taunt 는 select 와 같은 자리에서 나는 소리이므로 같은 크기를 쓴다.
// commander가 1을 넘는 이유: 장군은 무전기 너머가 아니라 이 방에서 말하는
// 사람이라 무전 처리를 안 걸었고(post_audio.py의 build_plain), 그래서 같은
// 숫자를 주면 무전 목소리보다 오히려 얌전하게 들린다. 앞으로 당겨 놓는다.
const soundLevels = { select: 1, taunt: 1, move: 0.42, attack: 0.7, destroy: 0.85, notice: 0.95, ui: 0.3, build: 0.6, commander: 1.35 };
const noticeSounds = ["work_complete", "unit_ready", "axis_work_complete", "axis_unit_ready", "ja_work_complete", "ja_unit_ready"];
const uiSounds = ["ui_click", "map_tap", "hatch_open"];

const sampleData = new Map();
const sampleBuffers = new Map();
const samplePending = new Map();
const lastVariantPick = new Map();
const channelSources = new Map();

// 말은 진영이 아니라 그 부대를 이끄는 지휘관의 나라가 정한다. 야마시타를 골라 놓고
// 부대가 독일어로 되받으면, 내가 고른 장군이 그 순간 남의 군대 사람이 된다.
// 아직 말 한 벌이 없는 나라(소련·영국·프랑스·뉴질랜드)는 그 진영의 말로 물러선다 —
// 없는 파일을 부르면 아무 소리도 안 나기 때문이다.
const voiceLangByNation = { 독일: "axis", 일본: "ja" };
const voiceBankByLang = {
  us: { select: "select", taunt: "taunt" },
  axis: { select: "axisSelect", taunt: "axisTaunt" },
  ja: { select: "jaSelect", taunt: "jaTaunt" },
};

// 판이 아직 안 깔린 자리(첫 화면의 미리 받기)에서도 불리므로, 명부와 진영을 밖에서
// 넘겨받을 수 있게 열어 둔다. 안 넘기면 지금 판의 것을 본다.
function voiceLangFor(owner, roster = state?.commanders, playerSide = state?.playerSide ?? "allies") {
  const nation = roster?.[owner === "player" ? "player" : "enemy"]?.nation;
  if (voiceLangByNation[nation]) return voiceLangByNation[nation];
  const side = owner === "player" ? playerSide : playerSide === "axis" ? "allies" : "axis";
  return side === "axis" ? "axis" : "us";
}

// 한 판에 쓰이는 무전은 여섯 벌 중 두 벌뿐이다 — 내 쪽의 보고와, 상대 쪽의 쏘아붙임.
// 나머지는 다른 장군을 골라야 나오므로 미리 받아 둘 이유가 없다. 목소리 한 벌이
// 열여덟 개라, 다 받으면 첫 화면에서 쓸데없이 세 배를 내려받는다.
function selectVoiceBanks(playerSide = state?.playerSide ?? "allies", roster = state?.commanders) {
  return [
    voiceBankByLang[voiceLangFor("player", roster, playerSide)].select,
    voiceBankByLang[voiceLangFor("enemy", roster, playerSide)].taunt,
  ];
}

// 사격음은 무전과 달리 두 벌 다 필요하다. 한 판에서 내 부대도 쏘고 적 부대도 쏘므로,
// 미제 총소리와 독일제 총소리가 같은 판에서 번갈아 난다.
function allSoundNames(playerSide = state?.playerSide ?? "allies", roster = state?.commanders) {
  const names = new Set([...noticeSounds, ...uiSounds]);
  const wanted = new Set([...selectVoiceBanks(playerSide, roster), "move", "build", "attack", "axisAttack", "destroy"]);
  Object.entries(soundBank).forEach(([bank, group]) => {
    if (!wanted.has(bank)) return;
    Object.values(group).forEach((list) => list.forEach((name) => names.add(name)));
  });
  return [...names];
}

// 파일은 첫 클릭 전에 미리 받아 둔다. 브라우저는 사용자가 화면을 건드리기 전에는
// 소리를 내주지 않지만, 내려받는 데는 그런 제약이 없다. 이걸 안 해두면 첫 클릭에서만
// 대답이 늦게 온다.
function prefetchSounds(playerSide, roster) {
  allSoundNames(playerSide, roster).forEach((name) => {
    if (sampleData.has(name)) return;
    fetch(`${audioBasePath}${name}.mp3`)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((data) => {
        if (data) sampleData.set(name, data);
      })
      .catch(() => {});
  });
}

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

// decodeAudioData는 넘겨받은 데이터를 비워버린다. 재시도할 수 있게 사본을 넘긴다.
function loadSample(name) {
  if (sampleBuffers.has(name)) return Promise.resolve(sampleBuffers.get(name));
  if (samplePending.has(name)) return samplePending.get(name);
  const context = ensureAudio();
  if (!context) return Promise.resolve(null);
  const raw = sampleData.has(name)
    ? Promise.resolve(sampleData.get(name))
    : fetch(`${audioBasePath}${name}.mp3`).then((response) => {
        if (!response.ok) throw new Error(`${name} ${response.status}`);
        return response.arrayBuffer();
      });
  const pending = raw
    .then((data) => context.decodeAudioData(data.slice(0)))
    .then((buffer) => {
      sampleBuffers.set(name, buffer);
      return buffer;
    })
    .catch(() => {
      samplePending.delete(name);
      return null;
    });
  samplePending.set(name, pending);
  return pending;
}

// channel을 주면 그 채널에서 나던 앞 소리를 끊는다. 부대를 연달아 클릭했을 때
// 무전 응답 두 개가 겹치면 둘 다 못 알아듣는다.
function playSample(name, { level = 1, channel = null } = {}) {
  if (!name) return;
  const context = ensureAudio();
  if (!context) return;
  markSound(name);
  loadSample(name).then((buffer) => {
    if (!buffer || !audioContext) return;
    const source = audioContext.createBufferSource();
    const volume = audioContext.createGain();
    source.buffer = buffer;
    volume.gain.value = clamp(level * soundVolume, 0, 1.6);
    source.connect(volume).connect(audioContext.destination);
    if (channel) {
      try {
        channelSources.get(channel)?.stop();
      } catch (error) {
        // 이미 끝난 소리를 끊으려 한 것뿐이다.
      }
    }
    source.start();
    if (channel) {
      channelSources.set(channel, source);
      source.onended = () => {
        if (channelSources.get(channel) === source) channelSources.delete(channel);
      };
    }
  });
}

// 같은 변주가 연달아 나오지 않게 직전에 쓴 것을 후보에서 뺀다. 무작위로만 뽑으면
// 같은 부대를 세 번 눌렀을 때 같은 대사가 세 번 나오는 일이 실제로 생긴다.
function pickVariant(key, options) {
  if (!options || !options.length) return null;
  if (options.length === 1) return options[0];
  const previous = lastVariantPick.get(key);
  const pool = options.filter((name) => name !== previous);
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? options[0];
  lastVariantPick.set(key, choice);
  return choice;
}

function markSound(name) {
  window.__lastGameSound = {
    name,
    time: new Date().toISOString(),
    contextState: audioContext?.state ?? "none",
  };
}

function playUiSound() {
  const context = ensureAudio();
  if (!context) return;
  const now = context.currentTime;
  // 연타로 소리가 겹치면 지저분하다. 사람이 두 번 눌렀다고 느끼는 간격만 통과시킨다.
  if (now - lastUiSoundAt < 0.055) return;
  lastUiSoundAt = now;
  playSample("ui_click", { level: soundLevels.ui });
}

function handleGlobalPointerSound(event) {
  if (event.target.closest("button, summary, label, input, select, textarea")) playUiSound();
}

// 지도의 빈 칸을 짚었을 때. 예전에는 지형마다 다른 잡음을 냈지만 그 차이는 아무도
// 알아듣지 못했다. 지금은 지도 위를 짚는 소리 하나로 통일한다.
function playMapTapSound() {
  const context = ensureAudio();
  if (!context) return;
  const now = context.currentTime;
  if (now - lastUiSoundAt < 0.055) return;
  lastUiSoundAt = now;
  playSample("map_tap", { level: soundLevels.ui });
}

// 어느 소리표를 볼 것인가.
//
//   무전 응답 — 말은 그 부대를 이끄는 지휘관의 나라가 정하고(일본 장군 밑이면
//               일본어), 말투는 그 부대가 내 것인지 적 것인지가 정한다.
//   사격     — 진영만 본다. 총은 장비다 — 지휘관이 바뀌어도 그 부대가 든 것은
//               여전히 그 군대의 소총이고, MG42는 누가 지휘하든 MG42 소리를 낸다.
//   나머지   — 이동과 파괴에는 국적이 없다. 표가 하나뿐이다.
function soundBankFor(unit, action) {
  if (action === "select") {
    const owner = unit?.owner === "player" ? "player" : "enemy";
    return voiceBankByLang[voiceLangFor(owner)][owner === "player" ? "select" : "taunt"];
  }
  if (action === "attack") return sideKeyForUnit(unit) === "axis" ? "axisAttack" : "attack";
  return action;
}

function playUnitSound(unitOrMove, action) {
  const type = unitOrMove?.type;
  if (!type) return;
  const bank = soundBankFor(unitOrMove, action);
  const group = soundBank[bank];
  if (!group) return;
  const name = pickVariant(`${bank}:${type}`, group[type]);
  if (!name) return;
  // 무전 응답은 한 번에 하나만 나가야 한다. 나머지는 전장에서 동시에 나는 소리이므로
  // 겹쳐도 상관없다 — 오히려 겹쳐야 여러 부대가 함께 움직이는 것으로 들린다.
  playSample(name, { level: soundLevels[action] ?? 1, channel: action === "select" ? "voice" : null });
}

// 파괴는 양쪽 다 들린다. 지도 위에서 터지는 것은 누구 부대든 보이기 때문이다.
function playDestroySound(unit) {
  const type = unit?.type;
  const options = soundBank.destroy[type] ?? soundBank.destroy.infantry;
  playSample(pickVariant(`destroy:${type}`, options), { level: soundLevels.destroy });
}

// 무전으로 넘어오는 알림. 내 쪽 소식만 들린다 — 적의 공사 완료를 우리 무전병이
// 알려줄 리 없다.
function playNoticeSound(name) {
  // 알림은 내 쪽 소식이다. 내 무전병은 내 장군과 같은 말을 쓴다 —
  // 야마시타 밑에서 공사 완료를 독일어로 알릴 이유가 없다.
  const lang = voiceLangFor("player");
  const prefix = lang === "axis" ? "axis_" : lang === "ja" ? "ja_" : "";
  playSample(`${prefix}${name}`, { level: soundLevels.notice, channel: "voice" });
}

// ── 배경음악 ────────────────────────────────────────────────────────────
//
// 효과음과는 다른 길로 간다. 총소리는 한 발이 1초라 통째로 받아 메모리에 풀어
// 두지만, 음악은 한 곡이 100초다. 같은 식으로 풀면 한 곡에 35MB, 넉 장이면
// 140MB — 휴대폰에서 그 짐을 지면 게임이 죽는다. 음악은 <audio>로 흘려 듣는다.
//
// 다만 <audio>의 제 볼륨 손잡이는 아이폰이 아예 듣지 않는다(사파리가 무시한다).
// 그래서 소리를 GainNode에 물려 그쪽으로 크기를 다룬다 — 이 길은 막히지 않는다.
// 페이드가 되는 것도 이 덕분이다.
const musicMoods = ["calm", "alert"];
const musicTracks = new Map(); // mood -> { el, gain }
let musicSide = null;
let musicMood = null;
let musicStarted = false;
let musicLastContactTurn = -99;
// 명령서가 열려 있는 동안 전투 음악을 눌러 둔다. musicSuppress 참고.
let musicSuppressed = false;
// 사람이 직접 끈 상태. 위의 것들과 달리 이건 게임 사정이 아니라 사람의 뜻이라,
// 판이 바뀌어도 안 풀리고 다음에 켤 때까지 이 기계에 적혀 남는다.
let musicMuted = false;
// 탭을 넘겼거나 폰을 덮었다. audioSleep 참고.
let audioAsleep = false;

// 지금 음악을 낼 수 있는가. 끈 사람의 뜻과 화면을 떠난 사정, 둘 중 하나라도
// 걸리면 안 낸다. 트는 자리마다 따로 따지면 언젠가 한 자리를 빠뜨리고,
// 빠뜨린 그 자리가 곧 "껐는데 소리가 난다"가 된다.
function musicAllowed() {
  return !musicMuted && !audioAsleep;
}

function musicPlayEl(el) {
  if (el && musicAllowed()) el.play().catch(() => {});
}
// 굽는 단계에서 이미 효과음보다 7dB 낮게 잡아 두었다(-24 LUFS). 여기서는 그 위에
// 한 번 더 낮춘다 — 음악은 들리는 것이 아니라 꺼 보고서야 허전한 것이어야 한다.
const musicLevel = 0.75;
// 3초. 한 박에 바뀌면 놀라고, 십 초면 이미 총을 맞은 뒤에 북이 들어온다.
const musicFadeSeconds = 3;
// 적을 놓친 그 턴에 바로 평시로 돌아가면, 적이 언덕 뒤로 한 칸 물러설 때마다
// 음악이 오르내린다. 한 턴은 참는다.
const musicCalmDelayTurns = 1;

function musicTeardown() {
  musicTracks.forEach(({ el }) => {
    try {
      el.pause();
    } catch (error) {
      // 아직 틀지도 않은 것을 멈추려 한 것뿐이다.
    }
  });
  musicTracks.clear();
  musicSide = null;
  musicMood = null;
  musicStarted = false;
}

// 내 진영 몫 두 곡만 건다. 상대 진영 음악은 이 판에서 한 번도 울리지 않는다.
function musicSetup(side) {
  const context = ensureAudio();
  if (!context || !context.createMediaElementSource) return;
  if (musicSide === side && musicTracks.size) return;
  musicTeardown();
  musicMoods.forEach((mood) => {
    const el = new Audio(`${audioBasePath}music_${side}_${mood}.mp3`);
    el.loop = true;
    el.preload = "auto";
    const gain = context.createGain();
    gain.gain.value = 0;
    try {
      context.createMediaElementSource(el).connect(gain).connect(context.destination);
    } catch (error) {
      return;
    }
    musicTracks.set(mood, { el, gain });
  });
  musicSide = musicTracks.size ? side : null;
}

// 두 곡을 '동시에' 튼다. 한 곡만 틀어 놓고 나중에 갈아 끼우려 하면 아이폰에서
// 막힌다 — 사파리는 사람이 화면을 건드린 그 순간에만 재생을 허락하고, 3초 뒤에
// 부르는 play()는 손길과 무관한 것으로 본다. 그래서 교전곡도 지금 같이 틀되
// 크기를 0으로 눌러 둔다. 나중에 하는 일은 크기를 올리는 것뿐이다.
function musicStart() {
  if (musicStarted) return;
  const context = ensureAudio();
  if (!context) return;
  musicSetup((state?.playerSide ?? "allies") === "axis" ? "axis" : "allies");
  if (!musicTracks.size) return;
  musicStarted = true;
  musicMood = "calm";
  musicTracks.forEach(({ el, gain }, mood) => {
    // 예약(setValueAtTime)이 아니라 값을 바로 박는다. 예약은 오디오 시계가 그
    // 시각에 닿아야 반영되는데, 시작하는 이 순간에는 아직 닿기 전이라 첫 몇
    // 밀리초 동안 평시곡이 0으로 남는 일이 생긴다.
    gain.gain.value = !musicSuppressed && mood === "calm" ? musicLevel : 0;
    musicPlayEl(el);
  });
}

// seconds: 얼마에 걸쳐 옮길 것인가. delay: 몇 초 뒤에 옮기기 시작할 것인가.
// 둘을 따로 받는 이유는 명령서 음악과의 교대 때문이다 — 겹치지 않게 하려면
// "이쪽이 다 빠진 다음에 저쪽이 들어온다"를 시간으로 적어야 한다.
function musicRampGains(seconds = musicFadeSeconds, delay = 0) {
  if (!musicStarted || !audioContext) return;
  const now = audioContext.currentTime;
  musicTracks.forEach((track, key) => {
    const level = track.gain.gain;
    level.cancelScheduledValues(now);
    // 지금 값에서 출발시키지 않으면 넘어가던 중에 방향이 바뀔 때 소리가 튄다.
    level.setValueAtTime(level.value, now);
    // 기다리는 동안 값이 안 움직이도록 한 번 더 박아 둔다. 이게 없으면 브라우저가
    // 지금부터 목표까지를 한 줄로 이어 버려서, 기다리라고 한 동안에 이미 올라온다.
    if (delay > 0) level.setValueAtTime(level.value, now + delay);
    const target = !musicSuppressed && key === musicMood ? musicLevel : 0;
    level.linearRampToValueAtTime(target, now + delay + seconds);
  });
}

function musicSetMood(mood) {
  if (!musicStarted || musicMood === mood || !audioContext) return;
  musicMood = mood;
  musicRampGains();
}

// 명령서가 열려 있는 동안 전투 음악을 눌러 둔다. 멈추지 않고 눌러만 두는 이유는,
// 아이폰에서 한 번 멈춘 <audio>는 다음 손길이 있어야 다시 도는데 명령서를 닫는
// 그 순간이 반드시 손길인 것은 아니기 때문이다(취소 버튼은 손길이지만, 판이
// 시작되면서 저절로 닫히는 경우도 있다).
function musicSuppress(on, seconds, delay) {
  if (musicSuppressed === on) return;
  musicSuppressed = on;
  musicRampGains(seconds, delay);
}

// 크기를 0으로 눌러 두는 것만으로는 마음이 안 놓인다. 예약해 둔 값이 한 번이라도
// 어긋나면 그 자리에서 오케스트라가 둘이 되기 때문이다. 그래서 다 빠진 다음에는
// 아예 세운다 — 세워 두면 어떤 경로로도 소리가 샐 수 없다.
function musicPauseTracks() {
  musicTracks.forEach(({ el }) => {
    try {
      el.pause();
    } catch (error) {
      // 아직 틀지도 않은 것을 멈추려 한 것뿐이다.
    }
  });
}

// 다시 민다. 반드시 사람이 누른 그 순간 안에서 불러야 한다 — 아이폰은 손길과
// 떨어진 play()를 거절하므로, 닫기 단추의 처리 중에 곧바로 부른다.
function musicResumeTracks() {
  musicTracks.forEach(({ el }) => {
    if (el.paused) musicPlayEl(el);
  });
}

// ── 작전 명령서 음악 ─────────────────────────────────────────────────
//
// 여태 이 화면에서는 평시곡이 그대로 돌았다. 그래서 명령서를 덮고 판이 시작돼도
// 소리는 하나도 안 바뀌었다 — "작전이 시작됐다"가 귀로는 안 들렸다는 뜻이다.
// 이 화면만의 곡을 따로 두면, 곡이 바뀌는 그 순간이 곧 개시 신호가 된다.
//
// 진영을 안 가른다. 진영을 고르는 화면이라 아직 어느 편도 아니기 때문이다.
const briefingLevel = 0.8;
// 전투곡의 3초보다 짧다. 여기서는 창을 여닫는 동작에 소리가 따라붙어야 한다.
const briefingFadeSeconds = 1.2;
// 교대는 겹치지 않고 이어져야 한다. 전투곡을 3초에 걸쳐 빼면서 명령서 곡을
// 동시에 올리면 그 3초 동안 오케스트라가 둘이 된다 — 실제로 그렇게 들렸다.
// 그래서 빼는 쪽은 짧게(0.45초) 끊고, 넣는 쪽은 그만큼 기다렸다가 들어온다.
const musicDuckSeconds = 0.45;
const briefingEnterDelay = 0.5;
let briefingTrack = null;
// 명령서가 열려 있는가. 닫을 때 예약해 둔 일이 늦게 도착했는데 그 사이 창이
// 다시 열렸다면, 그 예약은 무시해야 한다.
let briefingOpen = false;

function briefingMusicPlay() {
  const context = ensureAudio();
  if (!context || !context.createMediaElementSource) return;
  briefingOpen = true;
  if (!briefingTrack) {
    const el = new Audio(`${audioBasePath}music_briefing.mp3`);
    el.loop = true;
    el.preload = "auto";
    const gain = context.createGain();
    gain.gain.value = 0;
    try {
      context.createMediaElementSource(el).connect(gain).connect(context.destination);
    } catch (error) {
      return;
    }
    briefingTrack = { el, gain };
  }
  // 전투곡 먼저 끊는다. 다 빠지면 아예 세운다 — 크기만 눌러 두면 어딘가에서
  // 값이 되살아났을 때 곧바로 두 곡이 겹친다.
  musicSuppress(true, musicDuckSeconds);
  window.setTimeout(() => {
    if (briefingOpen) musicPauseTracks();
  }, musicDuckSeconds * 1000 + 60);
  const now = context.currentTime;
  const level = briefingTrack.gain.gain;
  level.cancelScheduledValues(now);
  level.setValueAtTime(level.value, now);
  // 전투곡이 다 빠질 때까지 0에 머물렀다가 올라온다.
  level.setValueAtTime(level.value, now + briefingEnterDelay);
  level.linearRampToValueAtTime(briefingLevel, now + briefingEnterDelay + briefingFadeSeconds);
  musicPlayEl(briefingTrack.el);
}

function briefingMusicStop() {
  briefingOpen = false;
  // 나갈 때도 순서는 같다. 명령서 곡을 0.45초에 끊고, 전투곡은 그 뒤에 들어온다.
  // 다시 미는 것은 여기서 바로 한다 — 이 함수는 닫기 단추를 누른 그 처리 안에서
  // 돌기 때문에, 여기가 아이폰이 재생을 허락하는 유일한 자리다. 크기는 아직 0이라
  // 밀어도 소리는 안 난다.
  // 판이 처음 시작되는 경우에는 전투곡이 아직 걸리지도 않았다(첫 손길이 명령서
  // 안에서 났으므로 musicNudge가 지나갔다). 여기서 건다 — 여기도 손길 안이다.
  musicStart();
  musicResumeTracks();
  musicSuppress(false, musicFadeSeconds, briefingEnterDelay);
  if (!briefingTrack || !audioContext) return;
  const { el, gain } = briefingTrack;
  const now = audioContext.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + musicDuckSeconds);
  // 다 잦아든 다음에 멈춘다. 그 자리에서 멈추면 소리가 뚝 끊긴다.
  window.setTimeout(() => {
    if (briefingOpen || briefingTrack?.el !== el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch (error) {
      // 아직 틀지도 않은 것을 멈추려 한 것뿐이다.
    }
  }, musicDuckSeconds * 1000 + 80);
}

// 장군이 말하는 동안 명령서 음악을 눌러 둔다.
//
// 처음에는 이걸 안 했다. 그랬더니 장군을 눌러도 "아무 답이 없다"고 했다 —
// 실제로는 소리가 나고 있었다. 오케스트라가 깔린 위에 사람 목소리 한 줄을
// 같은 크기로 얹으면, 소리가 안 나는 것과 귀에는 똑같다. 방송에서 진행자가
// 말할 때 배경음악을 내리는 것과 같은 이유다.
//
// 0으로 안 내리고 4분의 1만 남긴다. 아주 꺼 버리면 장군을 누를 때마다 음악이
// 끊겼다 붙었다 해서 그게 더 거슬린다.
const briefingDuckLevel = 0.24;

function briefingMusicDuck(seconds) {
  if (!briefingOpen || !briefingTrack || !audioContext) return;
  const now = audioContext.currentTime;
  const level = briefingTrack.gain.gain;
  const floor = briefingLevel * briefingDuckLevel;
  level.cancelScheduledValues(now);
  level.setValueAtTime(level.value, now);
  // 내리는 건 빨리(말이 이미 시작됐다), 올리는 건 천천히(말이 끝난 티가 안 나게).
  level.linearRampToValueAtTime(floor, now + 0.18);
  level.setValueAtTime(floor, now + seconds);
  level.linearRampToValueAtTime(briefingLevel, now + seconds + 0.8);
}

// 적이 눈에 들어왔는가. 안개를 켜고 두면 '보이는 적'이 곧 답이고, 끄고 두면
// 모든 적이 늘 보이므로 그것으로는 답이 안 된다 — 그때는 내 부대의 시야 안에
// 들어온 적만 센다. 어느 쪽이든 뜻은 하나다: 우리 정찰이 적을 짚었다.
function musicEnemyContact() {
  if (!state?.units) return false;
  const foes = state.units.filter((unit) => unit.owner !== "player");
  if (!foes.length) return false;
  if (fogOfWar) return foes.some((foe) => unitVisibleTo(foe, "player"));
  const mine = state.units.filter((unit) => unit.owner === "player");
  return foes.some((foe) => mine.some((unit) => distance(unit, foe) <= sightRangeOf(unit)));
}

function musicUpdate() {
  if (!musicStarted) return;
  // 판이 끝나면 북을 멈춘다. 결과 화면 뒤로 교전곡이 계속 도는 건 이상하다.
  if (state?.gameOver) {
    musicSetMood("calm");
    return;
  }
  if (musicEnemyContact()) musicLastContactTurn = state.turn;
  musicSetMood(state.turn - musicLastContactTurn <= musicCalmDelayTurns ? "alert" : "calm");
}

// 첫 손길에 시작한다. 브라우저는 사람이 화면을 건드리기 전에는 소리를 내주지
// 않으므로, 이보다 먼저 부를 수 있는 자리가 없다. 이미 돌고 있으면 그냥 지나간다
// (탭을 옮겼다 돌아왔을 때 멈춰 있는 것만 다시 민다).
function musicNudge() {
  // 명령서가 열려 있는 동안에는 전투곡을 건드리지 않는다. 여기서 밀어 버리면
  // 방금 세워 둔 것이 되살아나서, 명령서 안을 누를 때마다 곡이 겹친다.
  if (briefingOpen) {
    if (briefingTrack?.el.paused) musicPlayEl(briefingTrack.el);
    return;
  }
  // 판정이 찍힌 화면에서는 아무것도 되살리지 않는다. finishGame이 전투곡을 세워
  // 두는데, 결과 화면에서 「완료」를 누르는 그 손길이 곧 여기를 지나므로 세운 것이
  // 그 자리에서 다시 돈다. 크기가 0이라 안 들릴 뿐이고, 값이 한 번이라도 어긋나면
  // 다 끝난 판에 교전곡이 붙는다. 세워 둔 것은 세워 둔 채로 넘긴다.
  if (state?.gameOver) return;
  musicStart();
  musicResumeTracks();
  musicUpdate();
}

// ── 화면을 떠나면 소리도 떠난다 ──────────────────────────────────────
//
// 탭을 넘기거나 폰에서 다른 앱으로 가도 브라우저는 이 페이지를 멈추지 않는다.
// <audio>는 그대로 돌아서, 창을 다 닫은 것처럼 보여도 소리만 남는다 — 실제로
// "브라우저를 다 껐는데 음악이 계속 난다"는 말을 들었다. 그리고 그 상태에서
// 게임을 다시 열면, 뒤에 남아 있던 곡 위에 새 곡이 얹혀 둘이 겹친다.
// 여태 겹침을 이 파일 안에서만 찾았던 것이 잘못이었다. 겹치는 두 곡은 한 판이
// 아니라 두 판에서 나오고 있었다.
//
// 그래서 화면에서 사라지면 소리도 사라지게 한다. 크기를 0으로 눌러 두는 것이
// 아니라 아예 세우고 오디오 시계까지 멈춘다 — 눌러 두기만 하면 어딘가에서 값이
// 되살아났을 때 다시 새어 나온다. 소리를 내는 판은 언제나 지금 보고 있는 판
// 하나뿐이다.
// 지금 나고 있는 곡을 전부 세운다.
function musicSilence() {
  musicPauseTracks();
  try {
    briefingTrack?.el.pause();
  } catch (error) {
    // 아직 틀지도 않은 것을 멈추려 한 것뿐이다.
  }
}

// 지금 화면에 맞는 한 곡만 되돌린다. 명령서가 떠 있으면 명령서 곡, 판이 돌고
// 있으면 전투 곡 — 둘을 같이 밀면 그게 곧 겹침이다.
function musicRestore() {
  if (!musicAllowed()) return;
  if (briefingOpen) musicPlayEl(briefingTrack?.el);
  else if (musicStarted && !musicSuppressed) musicResumeTracks();
}

function audioSleep() {
  if (audioAsleep) return;
  audioAsleep = true;
  musicSilence();
  audioContext?.suspend?.()?.catch?.(() => {});
}

function audioWake() {
  if (!audioAsleep) return;
  audioAsleep = false;
  audioContext?.resume?.()?.catch?.(() => {});
  musicRestore();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) audioSleep();
  else audioWake();
});
// 폰에서는 앱을 밀어 치울 때 unload가 안 올 수도 있다. pagehide는 온다.
window.addEventListener("pagehide", audioSleep);
window.addEventListener("pageshow", audioWake);

// 창 두 개를 나란히 띄우면 둘 다 '보이는' 판이라 위의 잣대로는 안 걸러진다.
// 그때는 나중에 켠 쪽이 소리를 가져가고 먼저 켠 쪽이 입을 다문다 — 사람이
// 지금 손대고 있는 판은 방금 연 그 판이기 때문이다.
const audioFloor = (() => {
  try {
    return new BroadcastChannel("frontline-audio");
  } catch (error) {
    return null;
  }
})();
if (audioFloor) {
  audioFloor.addEventListener("message", (event) => {
    if (event.data === "mine") audioSleep();
  });
  const claimFloor = () => {
    audioFloor.postMessage("mine");
    audioWake();
  };
  claimFloor();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) claimFloor();
  });
}

// -- 음악 손잡이 -------------------------------------------------------
//
// 여태 소리를 끄는 방법이 브라우저 탭의 작은 스피커 표시뿐이었다. 그건 게임이
// 준 손잡이가 아니라 브라우저가 준 손잡이라, 폰에서는 아예 없다시피 하다.
// 화면 어디에 있든 한 번에 닿아야 하므로 판 위에 얹지 않고 화면에 고정한다 --
// 명령서가 떠 있든 결과 보고가 떠 있든 같은 자리에 같은 단추가 있다.
//
// 끄는 것은 음악뿐이다. 무전 음성과 총소리는 그대로 둔다 -- 그것들은 배경이
// 아니라 방금 내린 명령에 대한 대답이라, 안 들리면 명령이 먹혔는지를 모른다.
const MUSIC_MUTE_KEY = "frontline.music.muted";

function readMusicMuted() {
  try {
    return localStorage.getItem(MUSIC_MUTE_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function writeMusicMuted(on) {
  try {
    localStorage.setItem(MUSIC_MUTE_KEY, on ? "1" : "0");
  } catch (error) {
    // 저장이 막힌 기계다. 이번 판만 기억한다.
  }
}

const musicToggleEl = document.querySelector("#musicToggle");

function syncMusicToggle() {
  if (!musicToggleEl) return;
  musicToggleEl.dataset.state = musicMuted ? "off" : "on";
  musicToggleEl.setAttribute("aria-pressed", musicMuted ? "true" : "false");
  const label = musicMuted ? t("음악 켜기") : t("음악 끄기");
  musicToggleEl.setAttribute("aria-label", label);
  musicToggleEl.title = label;
}

function setMusicMuted(on) {
  musicMuted = on;
  writeMusicMuted(on);
  if (on) musicSilence();
  else musicRestore();
  syncMusicToggle();
}

musicMuted = readMusicMuted();
syncMusicToggle();
musicToggleEl?.addEventListener("click", (event) => {
  // 이 단추를 누른 것은 음악을 끄겠다는 뜻이지 판을 건드리겠다는 뜻이 아니다.
  // 막지 않으면 아래 깔린 칸이 같이 눌린다.
  event.stopPropagation();
  setMusicMuted(!musicMuted);
});

["pointerdown", "keydown"].forEach((type) => document.addEventListener(type, musicNudge));

prefetchSounds();

// index.html 에 표시해 둔 자리를 한 번만 훑어서 원래 한글을 적어 둔다.
// 표시가 없어져도 조용히 넘어가지 않도록, 처음 훑을 때 개수를 남긴다.
let markedTextNodes = null;
let markedAttrNodes = null;
function collectMarkedNodes() {
  if (markedTextNodes) return;
  markedTextNodes = [];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    if (node.children.length) return; // 안에 다른 칸이 든 자리는 건드리지 않는다
    const ko = node.textContent.trim();
    // 표시에 값이 있으면 그 값이 사전 열쇠다. 같은 한글이 자리마다 다른 영어를
    // 가져야 할 때 쓴다. 값이 없으면 한글 자신이 열쇠다.
    markedTextNodes.push({ node, ko, key: node.dataset.i18n || ko });
  });
  markedAttrNodes = [];
  document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    const names = node.getAttribute("data-i18n-attr").split(/\s*,\s*/).filter(Boolean);
    names.forEach((name) => {
      const ko = node.getAttribute(name);
      if (ko) markedAttrNodes.push({ node, name, ko });
    });
  });
}

function applyMarkedNodes() {
  collectMarkedNodes();
  markedTextNodes.forEach(({ node, ko, key }) => {
    node.textContent = activeLocale === "ko" ? ko : t(key);
  });
  markedAttrNodes.forEach(({ node, name, ko }) => {
    node.setAttribute(name, activeLocale === "ko" ? ko : t(ko));
  });
}

function applyLocale() {
  if (!activePack) return;
  document.documentElement.lang = activeLocale;
  applyMarkedNodes();
  document.title = activePack.title;
  document.querySelector("h1").textContent = activePack.title;
  document.querySelector(".command-panel")?.setAttribute("aria-label", activePack.title);
  document.querySelector(".battlefield-wrap")?.setAttribute("aria-label", "Battlefield");
  document.querySelector(".balance-editor")?.setAttribute("aria-label", activePack.editor);
  // 접힌 카드 바닥의 「자세히 ▾」. 이 글자는 CSS 가 그려서 DOM 에 없다.
  // 값만 넘겨 주고 그리는 것은 그대로 CSS 에 맡긴다.
  if (activePack.more) {
    document.documentElement.style.setProperty("--card-more", JSON.stringify(activePack.more));
  }
  if (activePack.folds) {
    document.querySelectorAll(".command-panel details > summary").forEach((node, index) => {
      if (activePack.folds[index]) node.textContent = activePack.folds[index];
    });
  }

  Object.entries(activePack.units).forEach(([type, label]) => {
    if (unitTypes[type]) unitTypes[type].label = label;
  });
  Object.entries(activePack.terrain).forEach(([key, name]) => {
    if (terrain[key]) terrain[key].name = name;
  });

  document.querySelectorAll(".operation-hud .hud-stat > span").forEach((node, index) => {
    if (activePack.status[index]) node.textContent = activePack.status[index];
  });
  if (!state?.selectedId && !state?.inspectedId && !state?.inspectedTile) {
    document.querySelector("#selectedCard").innerHTML = `<span class="muted">${activePack.select}</span>`;
  }
  document.querySelector("#actionHint").textContent = activePack.hint;

  setButtonText("#recruitInfantry", `${unitLabel("player", "infantry")} ${activePack.buttons.recruit}`);
  setButtonText("#recruitArmor", `${unitLabel("player", "armor")} ${activePack.buttons.deploy}`);
  setButtonText("#recruitArtillery", `${unitLabel("player", "artillery")} ${activePack.buttons.deploy}`);
  setButtonText("#recruitSpArtillery", `${unitLabel("player", "spArtillery")} ${activePack.buttons.deploy}`);
  setButtonText("#recruitEngineer", `${unitLabel("player", "engineer")} ${activePack.buttons.deploy}`);
  setButtonText("#recruitBattalionHQ", `${unitLabel("player", "battalionHQ")} ${activePack.buttons.deploy}`);
  setButtonText("#buildBridge", `${activePack.buttons.bridge} ${activePack.buttons.build}`);
  setButtonText("#buildDepot", `${activePack.buttons.depot} ${activePack.buttons.build}`);
  setButtonText("#buildRail", `${activePack.buttons.rail} ${activePack.buttons.lay}`);
  document.querySelector("#toggleTow").textContent = activePack.buttons.tow;
  document.querySelector("#endTurn").textContent = activePack.buttons.endTurn;
  document.querySelector("#restart").textContent = activePack.buttons.restart;
  // 폰에서만 보이는 지휘 서랍 단추. 옛 언어팩에는 이 자리가 없으니 있을 때만 손댄다.
  if (activePack.buttons.command) {
    const commandButton = document.querySelector("#focusCommandPanel");
    if (commandButton) commandButton.textContent = activePack.buttons.command;
  }

  // 저장 안내와 「기록 지우기」. 다른 글자는 다 바뀌는데 이 넷만 한국어로 남아
  // 있으면, 무엇을 적어 두는지 알리는 글을 정작 그 사람은 못 읽는다.
  const privacyPack = activePack.privacy;
  if (privacyPack) {
    setText("#storageNoticeTitle", privacyPack.noticeTitle);
    setText("#storageNotice .storage-notice-text p", privacyPack.noticeBody);
    setText("#storageNotice .storage-notice-actions a", privacyPack.noticeMore);
    setText("#storageNoticeOk", privacyPack.noticeOk);
    setText(".privacy-row a", privacyPack.policy);
    // 「정말 지운다」로 바뀌어 있는 중이라면 그 글자를 덮어쓰지 않는다.
    // 덮어쓰면 경고가 사라진 채로 다음 누름이 진짜 지우는 누름이 된다.
    if (clearStoredDataEl && !clearArmed) clearStoredDataEl.textContent = privacyPack.clear;
  }

  const legend = document.querySelector(".legend");
  const legendSummary = legend?.querySelector("summary");
  if (legendSummary && activePack.legend) legendSummary.textContent = activePack.legend;
  const legendItems = legend?.querySelector(".legend-items");
  if (legendItems) {
    legendItems.innerHTML = `
      <span><i class="chip player"></i>${activePack.side.player}</span>
      <span><i class="chip enemy"></i>${activePack.side.enemy}</span>
      <span><i class="terrain plain"></i>${terrain.P.name}</span>
      <span><i class="terrain coast"></i>${terrain.C.name}</span>
      <span><i class="terrain hill"></i>${terrain.H.name}</span>
      <span><i class="terrain base"></i>${terrain.B.name}</span>
    `;
  }
}

// 글자만 갈아 끼운다. 그 자리가 없는 화면(다른 페이지)에서도 조용히 넘어간다.
function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function setButtonText(selector, text) {
  const button = document.querySelector(selector);
  const badge = button?.querySelector("span");
  if (!button) return;
  button.childNodes[0].textContent = `${text} `;
  if (badge) button.appendChild(badge);
}

function localizeRenderedText() {
  if (!activePack) return;
  applyLocale();
  const resetButton = balanceEditorEl?.querySelector('[data-editor-action="reset"]');
  const saveButton = balanceEditorEl?.querySelector('[data-editor-action="save-defaults"]');
  const restartButton = balanceEditorEl?.querySelector('[data-editor-action="restart"]');
  if (resetButton) resetButton.textContent = activeLocale === "en" ? "Restore Defaults" : activeLocale === "zh" ? "恢复默认" : "初期値に戻す";
  if (saveButton) saveButton.textContent = activeLocale === "en" ? "Save as Initial Defaults" : activeLocale === "zh" ? "保存为初始值" : "初期値として保存";
  if (restartButton) restartButton.textContent = activeLocale === "en" ? "Apply Values & Restart" : activeLocale === "zh" ? "应用数值并重开" : "数値を適用して新作戦";
}

// ── 명령서는 한 칸씩 열린다 ────────────────────────────────────────
//
// 다섯 칸을 한꺼번에 펼쳐 두면 어디부터 정해야 하는지가 안 보이고, 그러면
// 고르는 화면이 아니라 채우는 양식이 된다. 순서는 명령이 실제로 내려오는
// 순서다 — 어느 군인지가 먼저 정해져야 그 군의 작전이 나오고, 작전이 정해져야
// 그 작전에 나갈 장군이 나온다. 마지막 칸(상대 참모부)만 성격이 다르다.
// 그건 전쟁의 사실이 아니라 이 판을 얼마나 세게 할지라서 맨 끝에 둔다.
//
// 앞 칸을 다시 고치면 뒤 칸은 도로 닫히고 골라 둔 것도 지워진다. 진영을 바꿨는데
// 아까 고른 추축군 장군이 그대로 남아 있으면, 그건 열린 칸이 아니라 남은 찌꺼기다.
const OPERATION_STAGES = ["side", "scenario", "commander", "deploy", "difficulty"];

function operationStageEl(key) {
  return operationModalEl?.querySelector(`.stage[data-stage="${key}"]`) ?? null;
}

function openOperationStage(key) {
  const el = operationStageEl(key);
  if (!el || el.classList.contains("is-open")) return;
  el.classList.remove("is-closing");
  el.classList.add("is-open");
  playHatchSound();
  // 열린 칸이 화면 밖에 있으면 열린 줄을 모른다. 문이 다 갈라진 뒤에 끌어온다.
  window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 360);
}

function sealOperationStagesFrom(key) {
  const from = OPERATION_STAGES.indexOf(key);
  if (from < 0) return;
  OPERATION_STAGES.slice(from).forEach((stageKey) => {
    const el = operationStageEl(stageKey);
    if (!el) return;
    if (el.classList.contains("is-open")) {
      el.classList.add("is-closing");
      window.setTimeout(() => el.classList.remove("is-closing"), 320);
    }
    el.classList.remove("is-open");
    // 상대 참모부만은 골라 둔 것을 지우지 않는다. 나머지 넷은 앞 칸이 바뀌면
    // 뜻이 달라지지만, 난이도는 진영을 바꿔도 "보통"이 그대로 보통이다.
    if (stageKey === "difficulty") return;
    el.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.checked = false;
    });
  });
}

// 넷을 다 정하기 전에는 서명할 수 없다. 단추가 눌리는데 아무 일도 안 일어나는
// 것보다, 아직 눌리지 않는 편이 정직하다.
function updateOperationReady() {
  if (!operationConfirmEl) return;
  const ready = ["operationSide", "operationScenario", "operationCommander", "operationDeploy"].every(
    (name) => operationModalEl?.querySelector(`input[name="${name}"]:checked`),
  );
  operationConfirmEl.disabled = !ready;
}

function resetOperationStages() {
  OPERATION_STAGES.forEach((key) => operationStageEl(key)?.classList.remove("is-open", "is-closing"));
  operationModalEl?.querySelectorAll('input[name="operationSide"], input[name="operationDeploy"]').forEach((input) => {
    input.checked = false;
  });
  if (operationScenarioChoicesEl) operationScenarioChoicesEl.innerHTML = "";
  if (operationCommanderChoicesEl) operationCommanderChoicesEl.innerHTML = "";
  updateOperationReady();
}

// 문이 갈라지는 소리. 화면만 갈라지고 아무 소리도 안 나면 그림이 움직인 것이지
// 문이 열린 것이 아니다.
function playHatchSound() {
  playSample("hatch_open", { level: 0.7, channel: "hatch" });
}

// 아직 한 판도 시작하지 않았는가. 게임을 켜면 명령서가 먼저 뜨는데, 그때는
// 「취소」를 눌러도 돌아갈 곳이 없다 — 뒤에 있는 판은 아무도 고르지 않은 판이다.
// 그래서 첫 명령서에서는 취소를 감추고, 한 판이라도 개시한 뒤부터 보여 준다.
let operationCommenced = false;

function openNewOperationSetup() {
  resetOperationStages();
  renderOperationDifficultyChoices();
  renderResumeNotice();
  // 취소는 "보던 판으로 돌아간다"는 뜻이다. 판정이 찍힌 판에는 돌아갈 것이 없다 —
  // 눌러 봐야 승패가 난 지도를 다시 보여 주고, 그 위에 전투곡까지 다시 얹힌다.
  // 그래서 시작한 판이 있고 그 판이 아직 안 끝났을 때만 내민다.
  if (operationCancelEl) operationCancelEl.hidden = !operationCommenced || !!state?.gameOver;
  if (operationModalEl) operationModalEl.hidden = false;
  // 명령서가 올라온 순간 아래에 깔린 것들을 물린다. 게임을 켤 때는 판이 먼저
  // 그려지고(render → 띠가 뜬다) 명령서가 그 다음에 오므로, 여기서 다시 묻지
  // 않으면 띠가 명령서 밑에 깔린 채 「작전 개시」를 덮는다.
  storageNoticeSync();
  coachSync();
  briefingMusicPlay();
  // 창이 뜨자마자 첫 칸이 열린다. 한 박자 늦게 여는 이유는 열리는 동작 자체가
  // 이 화면의 첫인상이기 때문이다 — 이미 열려 있으면 그냥 양식이다.
  window.setTimeout(() => openOperationStage("side"), 280);
}

function selectedOperationScenarioId() {
  return operationModalEl?.querySelector('input[name="operationScenario"]:checked')?.value ?? state?.scenarioId ?? defaultScenarioId;
}

// 명령서에 걸리는 작전 목록.
//
// retired가 붙은 작전은 목록에서 빠진다. 파일에서 지우는 것이 아니라 접어 두는 것이라,
// 나중에 그 지도를 다시 쓰고 싶으면 그 한 줄만 지우면 그대로 돌아온다.
//
// 내 군이 주도한 작전만 건다. 열두 작전 중 여섯이 남는다.
//
// 열두 개를 모두 보이면 고를 것이 많아 보이지만, 실제로는 "내가 미는 판"과 "내가
// 막는 판"이 한 줄에 섞여 나와 무엇을 고르는지가 흐려진다. 주도한 쪽만 남기면
// 연합군 여섯 · 추축군 여섯으로 정확히 갈린다(scenarios.js의 lead 값 기준).
//
// 어느 쪽 lead도 아닌 작전이 생기거나 한쪽이 통째로 접히면 목록이 비어 버리므로,
// 걸러서 남는 것이 없을 때만 전체를 되돌려 준다.
function scenariosForSide(side) {
  const live = scenarios.filter((scenario) => !scenario.retired);
  const pool = live.length ? live : scenarios;
  const led = pool.filter((scenario) => scenario.lead === side);
  return led.length ? led.slice() : pool.slice();
}

// 이 작전에서 먼저 움직인 쪽. 카드에 붙여 두면 "내가 미는 판인지 막는 판인지"를
// 고르기 전에 안다.
function scenarioLeadLabel(scenario) {
  if (scenario.lead === "allies") return t("연합군 공세");
  if (scenario.lead === "axis") return t("추축군 공세");
  return "";
}

function renderOperationScenarioChoices(side) {
  if (!operationScenarioChoicesEl) return;
  operationScenarioChoicesEl.innerHTML = scenariosForSide(side)
    .map((scenario) => {
      const size = `${scenario.terrain[0].length}×${scenario.terrain.length}`;
      const deadline = scenario.turnLimit ? t("{n}일", { n: scenario.turnLimit }) : t("기한 없음");
      const opened = scenario.startDate ? `${scenario.startDate[0]}.${scenario.startDate[1]}.${scenario.startDate[2]}` : "";
      const lead = scenarioLeadLabel(scenario);
      const badge = lead ? `<span class="scenario-choice-lead" data-lead="${scenario.lead}">${lead}</span>` : "";
      // 두 칸짜리 카드에서 이 줄은 자주 두 줄이 된다. 그건 괜찮은데, 「추축군」이
      // 「추축 / 군」으로 갈라지는 건 안 된다. 토막마다 줄바꿈을 막아 두면
      // 줄은 언제나 가운뎃점 자리에서만 넘어간다.
      const meta = [opened, size, deadline, scenarioOutcomeLabel(scenario)]
        .filter(Boolean)
        .map((part) => `<span class="meta-part">${part}</span>`)
        .join(" · ");
      return `
      <label class="scenario-choice">
        <input type="radio" name="operationScenario" value="${scenario.id}" />
        <span class="scenario-choice-body">
          <span class="scenario-choice-head"><strong>${t(scenario.name)}</strong>${badge}</span>
          <span class="scenario-choice-meta">${meta}</span>
          <span class="scenario-choice-goal">${t(scenario.objectiveBrief)}</span>
        </span>
      </label>
    `;
    })
    .join("");
}

// 기한이 끝났을 때 누가 이기는지가 곧 미션의 성격이다. 고르기 전에 그걸 보여준다.
// 두 칸짜리 카드에서 "기한 만료 시 추축군 승리"는 마지막 낱말이 잘려 내려간다.
// 글자를 줄일 수는 없으니 말을 줄인다 — 뜻은 그대로다.
function scenarioOutcomeLabel(scenario) {
  if (!scenario.timeoutWinner) return t("기한 넘기면 무승부");
  return scenario.timeoutWinner === "west" ? t("기한 넘기면 연합군") : t("기한 넘기면 추축군");
}

function closeNewOperationSetup() {
  if (operationModalEl) operationModalEl.hidden = true;
  briefingMusicStop();
  // 판은 명령서가 닫히기 전에 이미 그려진다. 그때는 명령서가 아직 화면을 덮고
  // 있어서 안내가 스스로 물러나 있고, 그 뒤로는 다시 그릴 일이 없다 — 즉 여기서
  // 한 번 더 부르지 않으면 첫 마디는 플레이어가 무엇이든 누를 때까지 안 뜬다.
  storageNoticeSync();
  coachSync();
}

function selectedOperationSide() {
  return operationModalEl?.querySelector('input[name="operationSide"]:checked')?.value ?? "allies";
}

function selectedOperationDeployMode() {
  return operationModalEl?.querySelector('input[name="operationDeploy"]:checked')?.value ?? "auto";
}

function selectedOperationDifficulty() {
  return operationModalEl?.querySelector('input[name="operationDifficulty"]:checked')?.value ?? state?.difficulty ?? defaultDifficultyId;
}

// 난이도 칸은 고를 때 무엇이 달라지는지를 그 자리에서 읽을 수 있어야 한다.
// "쉬움/보통/어려움"만 적어 두면 무엇이 어려워지는지 알 수 없고, 그러면 고르는
// 것이 아니라 찍는 것이 된다. 그래서 칸마다 바뀌는 숫자를 그대로 적는다.
function renderOperationDifficultyChoices() {
  if (!operationDifficultyChoicesEl) return;
  const selectedId = selectedOperationDifficulty();
  operationDifficultyChoicesEl.innerHTML = difficultyLevels
    .map((level) => {
      const force = level.startUnits > 0
        ? t("개시 병력 +{n}", { n: level.startUnits })
        : level.startUnits < 0
          ? t("개시 병력 {n}", { n: level.startUnits })
          : t("개시 병력 그대로");
      const income = t("보급 ×{n}", { n: level.income });
      // 예비대가 아군을 어떻게 따라오는지가 이제 적 병력이 정해지는 유일한 방식이라
      // 칸에 그대로 적는다. 1이면 아군과 같은 수, 1.5면 아군의 한 배 반이다.
      const cadence = level.force === 1 ? t("예비대 아군과 같이") : t("예비대 아군의 ×{n}", { n: level.force });
      return `
      <label class="difficulty-choice">
        <input type="radio" name="operationDifficulty" value="${level.id}" ${level.id === selectedId ? "checked" : ""} />
        <span class="difficulty-choice-body">
          <strong>${t(level.name)}</strong>
          <span class="difficulty-choice-meta">${force} · ${income} · ${cadence}</span>
          <span>${t(level.brief)}</span>
        </span>
      </label>
    `;
    })
    .join("");
}

function commanderSideName(side) {
  return side === "axis" ? "Axis" : "Allies";
}

function opponentSide(side) {
  return side === "axis" ? "allies" : "axis";
}

function sideKeyForUnit(ownerOrUnit) {
  const owner = typeof ownerOrUnit === "object" ? ownerOrUnit.owner : ownerOrUnit;
  const playerSide = state?.playerSide ?? "allies";
  return owner === "player" ? playerSide : opponentSide(playerSide);
}

// 적 참모부에도 그 전장의 사람이 앉는다. 임팔의 일본군을 롬멜이 지휘하면
// 적 부대가 독일어로 되받는다 — 내가 고른 장군만 고쳐서는 반쪽이다.
function defaultCommanderForSide(side, scenarioId) {
  const fitted = scenarioId ? commandersForOperation(side, scenarioId)[0] : null;
  if (fitted) return fitted;
  const preferred = side === "axis" ? "rommel" : "patton";
  return commanders.find((commander) => commander.id === preferred) ?? commanders.find((commander) => commander.side === commanderSideName(side));
}

// 이 작전에서 그 자리에 실제로 서 있던 군대의 나라. 장군 명부를 세우는 순서에만
// 쓴다 — 규칙이 아니라 지도에 딸린 사실이라 scenarios.js에 적는다.
function operationArmyNation(side, scenarioId) {
  const scenario = findScenario(scenarioId);
  return scenario?.[side === "axis" ? "east" : "west"]?.army ?? null;
}

// 이 작전의 명령서에 이름을 올릴 장군들. 그 군의 상설 명부 전부에, 이 작전에만
// 나오는 장군이 있으면 맨 앞에 붙인다(only). 파울루스는 스탈린그라드 말고
// 어디에도 서지 않고, 퍼시벌은 싱가포르 말고 어디에도 서지 않는다 — 그 사람의
// 전쟁이 거기서 끝났기 때문이다.
function commandersForOperation(side, scenarioId) {
  const commanderSide = commanderSideName(side);
  const roster = commanders.filter((commander) => commander.side === commanderSide);
  const guests = roster.filter((commander) => commander.only?.includes(scenarioId));
  const standing = roster.filter((commander) => !commander.only);
  // 그 전장에서 실제로 싸운 나라의 장군이 먼저 선다. 임팔 명부의 맨 앞이 롬멜이면
  // 고르는 사람은 매번 아래로 훑어 내려가야 한다. 아무도 명부에서 빠지지 않는다 —
  // 야마시타를 크레타에 데려가는 것은 여전히 되고, 그때는 부대가 일본어를 쓴다.
  const army = operationArmyNation(side, scenarioId);
  const fitting = army ? standing.filter((commander) => commander.nation === army) : [];
  const rest = standing.filter((commander) => !fitting.includes(commander));
  return [...guests, ...fitting, ...rest];
}

// 미리 골라 두지 않는다. 이 칸은 문이 열리고 나서 사람이 직접 고르는 칸이라,
// 열자마자 누가 이미 뽑혀 있으면 고른 것이 아니라 떠맡은 것이 된다.
function renderOperationCommanderChoices(side, scenarioId) {
  if (!operationCommanderChoicesEl) return;
  operationCommanderChoicesEl.innerHTML = commandersForOperation(side, scenarioId)
    .map((commander) => `
      <label class="commander-choice">
        <input type="radio" name="operationCommander" value="${commander.id}" />
        <img
          class="commander-photo"
          src="${commanderPhoto(commander)}"
          alt="${commander.name} portrait"
          data-initials="${commanderInitials(commander)}"
          onerror="replaceCommanderPhoto(this, '${commanderInitials(commander)}', '${commander.side}')"
        />
        <span class="commander-choice-body">
          <strong>${commander.name}</strong>
          <span>${t(commander.nation)} ${t(commander.rank)} / ${t(commander.trait)}</span>
          <span>${commanderStatSummary(commander)}</span>
        </span>
      </label>
    `)
    .join("");
}

// 한 칸을 정하면 그 뒤는 전부 무효가 된다. 그래서 먼저 뒤를 닫고, 새로 채우고,
// 바로 다음 칸 하나만 연다. 두 칸을 한꺼번에 열면 순서가 있다는 사실이 지워진다.
function handleOperationSetupChange(event) {
  const field = event.target.name;
  if (field === "operationSide") {
    sealOperationStagesFrom("scenario");
    renderOperationScenarioChoices(event.target.value);
    openOperationStage("scenario");
  } else if (field === "operationScenario") {
    sealOperationStagesFrom("commander");
    renderOperationCommanderChoices(selectedOperationSide(), event.target.value);
    openOperationStage("commander");
  } else if (field === "operationCommander") {
    sealOperationStagesFrom("deploy");
    openOperationStage("deploy");
  } else if (field === "operationDeploy") {
    openOperationStage("difficulty");
  }
  updateOperationReady();
}

// 장군을 누르면 그 사람이 한마디 한다. 명부의 숫자(공격 +2, 보급 -1)는 이 사람이
// 무엇을 잘하는지 알려 주지만 어떤 사람인지는 알려 주지 않는다. 한 줄이면 알려
// 준다 — 패튼은 측면을 신경 쓰지 말라 하고, 몽고메리는 포탄이 다 모이기 전에는
// 안 움직인다고 한다. 그 한 줄이 곧 그 장군의 계수다.
//
// 말은 그 사람 말로 한다. 미국·영국은 영어, 소련은 러시아어, 독일은 독일어,
// 야마시타는 일본어. 소련 원수가 영어로 대답하면 그건 소련 원수가 아니다.
//
// change가 아니라 click으로 받는 이유는, 이미 골라 둔 장군을 다시 눌렀을 때도
// 말해야 하기 때문이다. change는 고른 것이 바뀔 때만 울린다.
function playCommanderLine(commanderId) {
  if (!commanderId) return;
  const name = `cmd_${commanderId}`;
  // 먼저 소리를 받아 놓는 이유는 길이를 알아야 하기 때문이다. 말이 3초짜리인지
  // 6초짜리인지 알아야 음악을 그만큼만 눌러 둘 수 있다 — 넉넉히 잡아 두면 말이
  // 끝나고도 한참 음악이 죽어 있고, 짧게 잡으면 끝나기 전에 도로 덮인다.
  loadSample(name).then((buffer) => {
    if (!buffer) return;
    briefingMusicDuck(buffer.duration + 0.35);
    // channel "voice": 다른 장군을 연달아 누르면 앞사람 말을 끊는다. 두 장군이
    // 동시에 말하면 둘 다 못 알아듣는다.
    playSample(name, { level: soundLevels.commander, channel: "voice" });
  });
}

operationCommanderChoicesEl?.addEventListener("click", (event) => {
  const label = event.target.closest?.(".commander-choice");
  playCommanderLine(label?.querySelector('input[name="operationCommander"]')?.value);
});

function signedStat(value) {
  return value > 0 ? `+${value}` : String(value);
}

function commanderStatSummary(commander) {
  return t("사기 +{m} · 공격 {a} · 방어 {d} · 이동 {v} · 보급 {s}", {
    m: commander.morale,
    a: signedStat(commander.attack),
    d: signedStat(commander.defense),
    v: signedStat(commander.move ?? 0),
    s: signedStat(commander.supply ?? 0),
  });
}

function confirmNewOperationSetup() {
  const chosenSide = selectedOperationSide();
  const commanderId = operationCommanderChoicesEl?.querySelector('input[name="operationCommander"]:checked')?.value;
  startGame({
    scenarioId: selectedOperationScenarioId(),
    playerSide: chosenSide,
    playerCommanderId: commanderId,
    deployMode: selectedOperationDeployMode(),
    difficulty: selectedOperationDifficulty(),
  });
  operationCommenced = true;
  // 개시하는 그 순간부터 적어 둔다. 첫날에 창을 닫아도 고른 것(작전·진영·장군·
  // 배치·난이도)이 남아 있어야, 다시 켰을 때 그 다섯 개를 또 고르지 않는다.
  saveOperation();
  closeNewOperationSetup();
}

// ── 중간 저장·이어하기 ────────────────────────────────────────────────
//
// 한 판은 열흘 안팎, 짧아도 수십 번의 결정이다. 폰으로 하다 전화가 오면 그 판이
// 통째로 없어졌고, 그러면 사람은 다시 시작하지 않는다.
// 그래서 하루가 넘어갈 때마다 판을 통째로 적어 둔다. 저장 단추는 없다 — 저장을
// 사람이 챙겨야 하는 순간, 안 챙긴 사람은 반드시 한 번 잃는다.

// 「기록 지우기」가 켜 두는 빗장. 지운 뒤로는 무슨 일이 있어도 다시 적지 않는다.
let storageErased = false;

function saveOperation() {
  // 아직 명령서에 서명하지 않은 판(게임을 켜면 뒤에 깔리는 배경)은 적지 않는다.
  // 고른 적 없는 작전을 「중단된 작전」이라고 내미는 건 거짓말이다.
  if (storageErased) return;
  if (!operationCommenced || !state || state.gameOver) return;
  try {
    const { deployZones, commanders: leaders, ...rest } = state;
    const { year, month, day } = missionDate(state.turn);
    localStorage.setItem(
      SAVED_OPERATION_KEY,
      JSON.stringify({
        version: SAVED_OPERATION_VERSION,
        // 안내에 그대로 찍을 문구를 여기서 만들어 둔다. 저장본을 읽는 시점에는
        // 그 판이 아직 깔려 있지 않아 날짜도 진영도 계산할 수가 없다.
        label: {
          operation: state.mission?.name ?? "",
          date: `${year}.${month}.${day}`,
          turn: state.turn,
          side: state.playerSide === "axis" ? "추축군" : "연합군",
          commander: leaders?.player?.name ?? "",
        },
        // 저장한 날의 규칙까지 같이 적는다. 이 숫자들은 에디터에서 언제든 바뀌므로,
        // 규칙 없이 판만 되살리면 어제와 다른 규칙으로 이어 두게 된다.
        balance: balanceSnapshot(),
        state: {
          ...rest,
          // 배치 구역은 Set이다. 글로 옮기면 빈 껍데기가 되므로 칸 목록으로 눕힌다.
          deployZones: {
            player: [...(deployZones?.player ?? [])],
            enemy: [...(deployZones?.enemy ?? [])],
          },
          // 장군은 명부에 있는 그 사람을 가리키던 것이다. 통째로 베껴 두면 되살릴 때
          // 명부와 남남인 복제본이 서게 된다 — 이름표만 적고 명부에서 다시 찾는다.
          commanderIds: { player: leaders?.player?.id ?? null, enemy: leaders?.enemy?.id ?? null },
        },
      }),
    );
  } catch (error) {
    // 저장이 막힌 브라우저(사생활 보호 창 등)도 있다. 판은 그래도 굴러가야 한다.
    console.warn("Failed to save operation", error);
  }
}

function readSavedOperation() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_OPERATION_KEY));
    if (!saved || saved.version !== SAVED_OPERATION_VERSION) return null;
    if (!saved.state?.scenarioId || !Array.isArray(saved.state.units)) return null;
    return saved;
  } catch (error) {
    return null;
  }
}

function clearSavedOperation() {
  try {
    localStorage.removeItem(SAVED_OPERATION_KEY);
  } catch (error) {
    console.warn("Failed to clear saved operation", error);
  }
  renderResumeNotice();
}

// 저장한 날의 규칙으로 되돌린다. 저장본에 없는 값(저장한 뒤에 새로 생긴 규칙)은
// 게임이 정한 제값으로 남는다 — mergeSaved* 가 하는 일이 그것이다.
function applySavedBalance(balance) {
  if (!balance?.units || !balance?.rules) return;
  Object.entries(mergeSavedUnits(balance.units)).forEach(([type, stats]) => {
    if (unitTypes[type]) Object.assign(unitTypes[type], stats);
  });
  Object.entries(mergeSavedRules(balance.rules)).forEach(([key, value]) => setRuleValue(key, value));
}

// 저장해 둔 판을 그대로 다시 깐다. 되살렸으면 true.
//
// 순서가 전부다. 지도(지형·크기·물길)는 판 바깥에 놓인 물건이라, 그 작전의 지도를
// 먼저 깔아야 적어 둔 좌표가 제자리를 찾는다. 규칙을 그 다음에 얹고, 판은 맨 마지막에
// 앉힌다 — 중간에 무엇이 잘못되면 판을 건드리기 전에 멈추기 위해서다.
function restoreSavedOperation() {
  const saved = readSavedOperation();
  if (!saved) return false;
  try {
    const scenario = findScenario(saved.state.scenarioId);
    if (!scenario) return false;
    pendingUnitMoves = [];
    pendingCombatEvents = [];
    enemyPlan = new Map();
    // 되살린 판은 언제나 평시 음악으로 시작한다. 저장하던 순간의 접전을 물려받으면
    // 적이 안 보이는데 북이 울린다.
    musicLastContactTurn = -99;
    applyScenario(scenario);
    applySavedBalance(saved.balance);
    // 병종 이름은 규칙을 얹으면서 처음 박혀 있던 것으로 돌아온다. 말은 그 뒤에 입힌다.
    applyLocale();
    const { commanderIds, ...rest } = saved.state;
    const playerSide = rest.playerSide === "axis" ? "axis" : "allies";
    const aiSide = playerSide === "axis" ? "allies" : "axis";
    const findCommander = (id, side) => commanders.find((commander) => commander.id === id) ?? defaultCommanderForSide(side, scenario.id);
    state = {
      ...rest,
      deployZones: {
        player: new Set(saved.state.deployZones?.player ?? []),
        enemy: new Set(saved.state.deployZones?.enemy ?? []),
      },
      commanders: {
        player: findCommander(commanderIds?.player, playerSide),
        enemy: findCommander(commanderIds?.enemy, aiSide),
      },
    };
    prefetchSounds(playerSide, state.commanders);
    bannerEl.classList.remove("show");
    bannerEl.textContent = "";
    hideResultScreen();
    renderBalanceEditor();
    render();
    return true;
  } catch (error) {
    // 되살리다 엎어졌으면 그 저장본은 못 쓰는 것이다. 남겨 두면 켤 때마다 같은 자리에서
    // 엎어지므로 버린다 — 부른 쪽은 false를 받고 새 판을 깔면 된다.
    console.warn("Failed to restore operation", error);
    clearSavedOperation();
    return false;
  }
}

// 명령서 맨 위에 뜨는 「중단된 작전」 한 줄.
function renderResumeNotice() {
  if (!resumeNoticeEl) return;
  const saved = readSavedOperation();
  resumeNoticeEl.hidden = !saved;
  if (!saved || !resumeNoticeMetaEl) return;
  const label = saved.label ?? {};
  resumeNoticeMetaEl.textContent = [
    label.operation ? `「${label.operation}」` : "",
    label.date ? `${label.date} · ${label.turn}일차` : "",
    [label.side, label.commander].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");
}

resumeOperationEl?.addEventListener("click", () => {
  // 게임을 켤 때 이미 그 판을 배경으로 깔아 두었지만, 그 사이에 다른 작전을 골라
  // 봤을 수도 있다. 여기서 한 번 더 깔면 두 경우가 같아진다.
  if (!restoreSavedOperation()) {
    renderResumeNotice();
    return;
  }
  operationCommenced = true;
  // 여기서 무전 기록에 한 줄 적지 않는다. 기록은 저장본 안에 들어 있는 물건이라,
  // 되살릴 때마다 한 줄씩 얹으면 그 줄이 다음 저장본에 그대로 실린다. 켰다 껐다를
  // 몇 번 하면 열넉 줄이 전부 「지휘 재개」로 차서 진짜 전투 기록이 밀려 나간다.
  // 게다가 새로고침으로 되살리는 길(맨 아래 restoreSavedOperation)은 이 줄을 안
  // 적으므로, 같은 저장본인데 어느 길로 들어왔느냐에 따라 기록이 달라졌다.
  // 재개했다는 사실은 명령서의 「중단된 작전」 안내가 이미 보여 준다.
  render();
  closeNewOperationSetup();
});

discardOperationEl?.addEventListener("click", () => {
  clearSavedOperation();
});

// 폰에서는 전화 한 통, 알림 하나에 화면이 넘어간다. 그때가 곧 판을 잃는 순간이라,
// 화면이 뒤로 물러나면 그 자리에서 적어 둔다.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveOperation();
});

/* ── 첫 판 안내 ──────────────────────────────────────────────────────────────
   설명서를 먼저 읽히지 않는다. 여섯 마디를 하나씩 띄우고, 그 마디가 시키는 짓을
   실제로 해내면 저절로 다음으로 넘어간다. 읽고 넘기는 안내는 읽지 않고 넘기지만,
   해 보고 넘어가는 안내는 손이 기억한다.

   짚어 주는 자리는 화면에 테두리로 그린다. 안내 쪽지는 늘 화면 아래에 붙는다 —
   짚는 곳 옆에 붙이면 폰에서는 그 쪽지가 곧 지도를 덮는다. */

const COACH_KEY = "ww2TacticalCommand.firstRunCoach";

const coachSteps = [
  {
    id: "goal",
    title: "이 판에서 이기는 법",
    body: "지도 위 노란 줄이 이번 작전의 목표다. 몇 번 칸을 며칠 쥐고 있어야 하는지가 거기 적혀 있다.",
    target: () => document.querySelector("#missionBar"),
  },
  {
    id: "select",
    title: "부대를 고른다",
    body: "내 부대를 하나 누른다. 갈 수 있는 칸이 지도에 밝게 뜬다.",
    target: () => document.querySelector("#mapStage"),
    // 눌렀는지는 눌렀는지로 안다. 「다음」을 눌러 넘기는 길은 두지 않는다.
    // 마디를 띄운 뒤에 부대를 누른 횟수가 늘었는가만 본다(coachSelectTicks).
    done: (base) => coachSelectTicks > base.selected,
  },
  {
    id: "move",
    title: "고른 부대를 옮긴다",
    body: "밝은 칸 하나를 누르면 그리로 간다. 한 부대는 하루에 한 번만 움직인다.",
    target: () => document.querySelector("#mapStage"),
    done: (base) => coachMoveTicks > base.moved,
  },
  {
    id: "attack",
    title: "적을 친다",
    // 안내 쪽지가 화면 아래를 쓰는 동안에는 명령 안내줄이 가려질 수 있다.
    // 그래서 "지도 밑에 뜬다"고 가리키지 않고, 여기서 바로 말해 준다.
    body: "붉은 부대가 사거리 안에 들어오면, 그 부대를 누르는 것이 곧 공격이다. 사거리 밖이면 눌러도 아무 일도 일어나지 않는다.",
    target: () => document.querySelector("#mapStage"),
  },
  {
    id: "endTurn",
    title: "하루를 끝낸다",
    body: "「턴 종료」를 누르면 적이 움직이고 다음 날 아침이 온다. 판은 그때마다 저절로 저장된다.",
    target: () => document.querySelector("#endTurn"),
    done: (base) => (state?.turn ?? 1) > base.turn,
  },
  {
    id: "supply",
    title: "보급품으로 늘린다",
    body: "위쪽 「보급품」이 매일 들어온다. 「지휘」를 눌러 증원하거나 다리·창고를 짓는 데 쓴다.",
    target: () => document.querySelector(".operation-hud"),
  },
];

let coachIndex = -1;

/* 「했는가」는 판의 상태가 아니라 이 마디를 띄운 뒤에 했는가여야 한다.
   판의 상태로 물으면 사흘째 판에서 「조작 안내」를 다시 눌렀을 때 「하루를
   끝낸다」가 이미 끝난 것으로 셈해져 통째로 건너뛰고, 번호가 1 → 4 → 6으로
   튄다. 그래서 마디가 바뀌는 순간의 판을 적어 두고 그것과 견준다. */
let coachBaseIndex = -1;
let coachBase = { turn: 1, moved: 0, selected: 0 };

/* 「골랐다」와 「옮겼다」는 판을 들여다봐서 알아내지 않고, 그 일이 실제로
   일어난 자리에서 하나씩 센다. 판을 보는 방식은 두 군데서 새는데 —

   하나. 옮긴 부대 수는 아침마다 0으로 돌아간다. 기준선을 3에서 잡아 두고
   그날 밤이 지나면, 다음 날에는 넷을 옮겨야 「옮겼다」가 된다.
   둘. 이미 골라 둔 부대를 다시 누르는 것은 「고른 부대가 바뀌었나」로는
   영영 안 잡힌다. 그 사람은 아무리 눌러도 다음으로 못 넘어간다.

   세어 둔 수는 되돌아가지 않으므로 둘 다 안 생긴다. */
let coachMoveTicks = 0;
let coachSelectTicks = 0;

function coachBaseline() {
  return {
    turn: state?.turn ?? 1,
    moved: coachMoveTicks,
    selected: coachSelectTicks,
  };
}

const coachEl = document.querySelector("#coach");
const coachTitleEl = document.querySelector("#coachTitle");
const coachBodyEl = document.querySelector("#coachBody");
const coachCountEl = document.querySelector("#coachCount");
const coachNextEl = document.querySelector("#coachNext");
const coachSkipEl = document.querySelector("#coachSkip");
const coachSpotEl = document.querySelector("#coachSpot");
const showCoachEl = document.querySelector("#showCoach");

function coachRead() {
  try {
    return localStorage.getItem(COACH_KEY);
  } catch (error) {
    return "done"; // 저장을 못 읽는 브라우저라면 안내를 매번 다시 띄우느니 안 띄운다.
  }
}

let coachWritten = null;

function coachWrite(value) {
  // 화면을 다시 그릴 때마다, 손가락으로 지도를 밀 때마다 coachSync가 돈다.
  // 같은 값을 그때마다 다시 적으면 밀 때마다 저장을 두드리게 된다.
  if (value === coachWritten) return;
  coachWritten = value;
  try {
    localStorage.setItem(COACH_KEY, value);
  } catch (error) {
    /* 저장이 막혀 있어도 이번 판 안내는 그대로 굴러간다. */
  }
}

function coachFinish() {
  coachIndex = -1;
  coachWrite("done");
  if (coachEl) coachEl.hidden = true;
  if (coachSpotEl) coachSpotEl.hidden = true;
}

function coachStart(fromScratch = false) {
  if (fromScratch) coachWrite("0");
  // 저장값이 망가져 음수로 들어오면(외부에서 손댄 경우) 안내가 영영 안 뜬다.
  coachIndex = fromScratch ? 0 : Math.max(0, Number(coachRead() ?? 0) || 0);
  if (coachIndex >= coachSteps.length) coachIndex = 0;
  coachBaseIndex = -1;
  coachSync();
}

// 안내가 나올 수 있는 화면인가. 명령서·결과 화면이 떠 있거나 배치 중일 때는
// 지금 해야 할 일이 따로 있으므로 끼어들지 않는다.
function coachAllowed() {
  if (coachIndex < 0 || coachIndex >= coachSteps.length) return false;
  if (!state || state.gameOver) return false;
  if (state.phase !== "player") return false;
  if (operationModalEl && !operationModalEl.hidden) return false;
  if (resultScreenEl && !resultScreenEl.hidden) return false;
  // 저장 알림 띠와 안내 쪽지는 화면 같은 자리(아래)를 쓴다. 둘이 겹치면 둘 다
  // 못 읽으므로, 띠가 물러날 때까지 안내는 기다린다.
  if (storageNoticeEl && !storageNoticeEl.hidden) return false;
  return true;
}

function coachSync() {
  if (!coachEl) return;
  if (!coachAllowed()) {
    coachEl.hidden = true;
    if (coachSpotEl) coachSpotEl.hidden = true;
    return;
  }
  // 마디가 바뀌었으면 그 순간의 판을 적어 둔다. 이 다음 줄의 물음은 전부
  // 이 기준선과의 비교다.
  if (coachBaseIndex !== coachIndex) {
    coachBaseIndex = coachIndex;
    coachBase = coachBaseline();
  }
  // 마디를 띄운 뒤에 시킨 것을 해냈으면 다음으로 넘어간다.
  while (coachIndex < coachSteps.length && coachSteps[coachIndex].done?.(coachBase)) {
    coachIndex += 1;
    coachBaseIndex = coachIndex;
    coachBase = coachBaseline();
  }
  if (coachIndex >= coachSteps.length) {
    coachFinish();
    return;
  }
  const step = coachSteps[coachIndex];
  coachWrite(String(coachIndex));
  coachEl.hidden = false;
  coachEl.dataset.step = step.id;
  if (coachTitleEl) coachTitleEl.textContent = t(step.title);
  if (coachBodyEl) coachBodyEl.textContent = t(step.body);
  if (coachCountEl) coachCountEl.textContent = `${coachIndex + 1} / ${coachSteps.length}`;
  // 해내야 넘어가는 마디에는 「다음」이 없다. 버튼이 있으면 그걸 누르지, 시킨 것을
  // 하지 않는다.
  if (coachNextEl) coachNextEl.hidden = Boolean(step.done);
  dockAboveHudActions(coachEl);
  coachPlaceSpot(step.target?.());
}

/* ── 화면 아래에 붙는 쪽지가 무엇을 덮는가 ──────────────────────────────────
   폰에서는 「턴 종료」·「지휘」 띠가 화면 바닥에 못 박혀 있다(styles.css의
   860px 이하). 그 위에 안내 쪽지를 겹쳐 놓으면, 쪽지가 누르라고 시킨 바로 그
   단추를 쪽지가 막는다 — 층이 1500 대 45라 언제나 쪽지가 이긴다.

   띠의 높이는 화면 폭과 안전 영역(노치)에 따라 달라지므로 CSS에 숫자로 적어
   둘 수 없다. 그래서 그때그때 재서 그만큼 위에 앉힌다. 넓은 화면에서는 띠가
   바닥에 붙지 않으므로(position이 fixed가 아니다) 손대지 않고 CSS에 맡긴다. */
function hudActionsClearance() {
  const bar = document.querySelector(".hud-actions");
  if (!bar || bar.hidden) return 0;
  if (getComputedStyle(bar).position !== "fixed") return 0;
  const rect = bar.getBoundingClientRect();
  if (!rect.height) return 0;
  return Math.max(0, Math.round(window.innerHeight - rect.top));
}

function dockAboveHudActions(el) {
  if (!el) return;
  const clearance = hudActionsClearance();
  // 0이면 CSS가 정한 자리를 그대로 쓴다. 여기서 값을 적어 두면 화면을 넓혔을 때
  // 그 값이 남아 CSS를 이긴다.
  el.style.bottom = clearance ? `${clearance + 10}px` : "";
}

function coachPlaceSpot(target) {
  if (!coachSpotEl) return;
  const rect = target?.getBoundingClientRect?.();
  if (!rect || !rect.width || !rect.height) {
    coachSpotEl.hidden = true;
    return;
  }
  const pad = 6;
  coachSpotEl.hidden = false;
  coachSpotEl.style.left = `${rect.left - pad}px`;
  coachSpotEl.style.top = `${rect.top - pad}px`;
  coachSpotEl.style.width = `${rect.width + pad * 2}px`;
  coachSpotEl.style.height = `${rect.height + pad * 2}px`;
}

coachNextEl?.addEventListener("click", () => {
  coachIndex += 1;
  if (coachIndex >= coachSteps.length) coachFinish();
  else coachSync();
});

coachSkipEl?.addEventListener("click", coachFinish);

showCoachEl?.addEventListener("click", () => {
  // 안내를 가리지 않으려고 접는 것이다. 사람이 지휘칸을 닫은 것이 아니다.
  setCommandPanel(true, { byUser: false });
  coachStart(true);
});

// 테두리는 화면에 그린 것이라, 화면이 움직이면 같이 따라가야 한다. 안 따라가면
// 엉뚱한 곳을 짚은 채로 남는다.
//
// 다만 손가락으로 지도를 한 번 밀면 스크롤이 수십 번 들어온다. 그때마다 자리를
// 재고(getBoundingClientRect) 곧바로 자리를 적으면(style) 브라우저가 매번 화면
// 계산을 다시 한다 — 미는 손이 뻑뻑해진다. 그래서 한 번 그리는 사이에 한 번만
// 한다.
let coachFrame = 0;

function coachSyncSoon() {
  if (coachFrame) return;
  coachFrame = window.requestAnimationFrame(() => {
    coachFrame = 0;
    // 알림 띠도 같은 자리(화면 아래)에 붙으므로 같이 다시 앉힌다.
    if (storageNoticeEl && !storageNoticeEl.hidden) dockAboveHudActions(storageNoticeEl);
    coachSync();
  });
}

window.addEventListener("resize", coachSyncSoon);
window.addEventListener("scroll", coachSyncSoon, true);

/* ── 이 기계에 무엇을 적어 두는지 ─────────────────────────────────────────────
   이 게임은 계정도 없고 서버로 보내는 것도 없다. 그래도 판을 이어서 하려면
   몇 가지를 브라우저에 적어 둬야 하고, 그 사실은 처음 온 사람에게 한 번은
   말해야 한다.

   동의를 받는 창이 아니다. 받을 동의가 없기 때문이다 — 여기 적어 두는 다섯은
   전부 게임이 굴러가는 데 필요한 것이고 광고도 추적도 아니다. 그래서 「거부」
   단추를 두지 않는다. 아무것도 안 하면서 거부 단추만 세워 두는 쪽이 오히려
   거짓말이다. 대신 무엇을 적는지 다 적어 둔 문서(privacy.html)로 가는 길과,
   그것을 통째로 지우는 단추를 준다.

   명령서가 닫힌 뒤에 뜬다. 명령서 위에 겹쳐 띄우면 화면 아래에 있는 「작전
   개시」를 이 띠가 덮는다. */

const STORAGE_NOTICE_KEY = "ww2TacticalCommand.storageNotice";

// 「기록 지우기」가 지우는 것 전부. 새 저장 항목을 만들면 여기에도 넣어야 한다 —
// 안 넣으면 지웠다고 말해 놓고 남겨 두는 것이 된다.
const GAME_STORAGE_KEYS = [
  DEFAULT_BALANCE_STORAGE_KEY,
  SAVED_OPERATION_KEY,
  EDIT_TOOLS_KEY,
  COACH_KEY,
  STORAGE_NOTICE_KEY,
];

// storageNoticeEl은 첫 판 안내가 먼저 참조하므로 파일 위쪽에서 잡아 둔다.
const storageNoticeOkEl = document.querySelector("#storageNoticeOk");
const clearStoredDataEl = document.querySelector("#clearStoredData");

/* 「알겠다」를 눌렀다는 사실은 이 판이 도는 동안에도 따로 쥐고 있어야 한다.
   저장이 막힌 브라우저(사파리 비공개 창, 저장 공간이 꽉 찬 경우)에서는 적어
   두기만 실패하고 읽기는 멀쩡히 도는 일이 있다. 그러면 눌러서 띠를 닫아도
   화면을 다시 그리는 순간 storageNoticeSync가 "아직 안 봤다"고 판단해 도로
   띄운다. 띠가 서 있는 동안에는 첫 판 안내도 못 나오므로(coachAllowed),
   그 사람은 안내 1번에서 영영 못 벗어난다. */
let storageNoticeDismissed = false;

function storageNoticeSeen() {
  if (storageNoticeDismissed) return true;
  try {
    return localStorage.getItem(STORAGE_NOTICE_KEY) === "seen";
  } catch (error) {
    // 저장이 막힌 브라우저라면 적어 두는 것 자체가 없다. 알릴 것도 없다.
    return true;
  }
}

function storageNoticeSync() {
  if (!storageNoticeEl) return;
  // 배치 중에는 안 띄운다. 그때는 화면 아래쪽 칸에 부대를 손으로 놓는 중이라,
  // 이 띠가 그 칸들을 덮으면 놓을 자리가 안 보인다. 배치가 끝나면 그때 나온다.
  const deploying = state?.phase === "deploy";
  const show =
    !storageNoticeSeen() &&
    !deploying &&
    (!operationModalEl || operationModalEl.hidden) &&
    (!resultScreenEl || resultScreenEl.hidden);
  storageNoticeEl.hidden = !show;
  // 폰에서는 「턴 종료」 띠가 화면 바닥에 붙어 있다. 그 위에 겹치면 이 띠가
  // 단추를 먹는다.
  if (show) dockAboveHudActions(storageNoticeEl);
}

storageNoticeOkEl?.addEventListener("click", () => {
  storageNoticeDismissed = true;
  try {
    localStorage.setItem(STORAGE_NOTICE_KEY, "seen");
  } catch (error) {
    /* 못 적어도 이번 판에서는 닫힌 채로 간다. */
  }
  if (storageNoticeEl) storageNoticeEl.hidden = true;
  // 띠가 비켜야 첫 판 안내가 그 자리에 들어온다.
  coachSync();
});

// 한 번 누르면 지워지지 않는다. 여기서 지우는 것에는 하다 만 판도 들어 있어서,
// 잘못 누른 사람은 그 판을 잃는다. 그래서 두 번 누르게 하고, 잠깐 두면 저절로
// 원래 단추로 돌아간다.
let clearArmed = false;
let clearArmedTimer = 0;
let clearArmedAt = 0;

// 두 번째 누름을 이만큼은 기다린다. 이게 없으면 두 번 눌러야 한다는 규칙이
// 아무 소용이 없다 — 폰에서 손가락이 튀거나 마우스로 따닥 두 번 누르면 두
// 번의 누름이 한 동작으로 들어와서, 읽을 새도 없이 판이 지워진다.
const CLEAR_MIN_GAP_MS = 700;

// 화면 글자가 다른 말로 바뀌어 있으면 그 말로 되돌린다. 한국어로 보고 있으면
// activePack이 없으므로 아래 기본값이 그대로 쓰인다.
function clearLabel(kind) {
  const pack = activePack?.privacy;
  if (kind === "armed") return pack?.clearArmed ?? "정말 지운다 · 하던 판도 사라짐";
  return pack?.clear ?? "기록 지우기";
}

function clearArmReset() {
  clearArmed = false;
  clearArmedAt = 0;
  window.clearTimeout(clearArmedTimer);
  if (clearStoredDataEl) clearStoredDataEl.textContent = clearLabel("idle");
}

clearStoredDataEl?.addEventListener("click", () => {
  if (!clearArmed) {
    clearArmed = true;
    clearArmedAt = Date.now();
    clearStoredDataEl.textContent = clearLabel("armed");
    clearArmedTimer = window.setTimeout(clearArmReset, 6000);
    return;
  }
  // 아직 읽을 시간이 안 됐다. 지우지는 않되, 아무 일도 안 일어난 것처럼
  // 보이게 두지는 않는다. 손가락이 빠른 사람에게 조용한 무시는 「단추가
  // 고장 났다」로 읽힌다. 글자를 한 번 깜빡여서 "여기 있으니 한 번 더 읽어라"만
  // 알린다 — 글자 자체는 「정말 지운다」 그대로 세워 둔다.
  if (Date.now() - clearArmedAt < CLEAR_MIN_GAP_MS) {
    clearStoredDataEl.classList.remove("clear-too-soon");
    void clearStoredDataEl.offsetWidth; // 연달아 눌러도 깜빡임이 다시 시작되게
    clearStoredDataEl.classList.add("clear-too-soon");
    return;
  }
  window.clearTimeout(clearArmedTimer);
  // 먼저 저장을 끈다. 아래에서 다시 켤 때 화면이 내려가는데, 그 내려가는 길에
  // 「하던 판을 적어 두는」 손이 한 번 더 돈다(visibilitychange). 그러면 방금
  // 지운 판이 지우자마자 다시 적혀서, 지웠다는 말이 거짓말이 된다.
  storageErased = true;
  for (const key of GAME_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* 지울 수 없는 브라우저라면 애초에 적힌 것도 없다. */
    }
  }
  // 지운 다음에는 다시 켠다. 안 그러면 지금 화면이 쥐고 있는 판이 다음 턴에
  // 그대로 다시 저장되어, 지운 것이 지운 것이 아니게 된다.
  //
  // 그냥 새로고침하면 안 된다. 주소 끝에 ?edit=1을 붙여 둔 채로 지운 사람은,
  // 새로 켜지는 길에 그 주소가 다시 읽혀서 「편집 연장을 켰다」가 즉시 도로
  // 적힌다. 방금 지운 것이 눈앞에서 되살아나는 셈이다. 그래서 그 한 조각만
  // 주소에서 떼고 켠다 — 언어(?lang) 같은 나머지는 그대로 둔다.
  const next = new URL(location.href);
  next.searchParams.delete("edit");
  location.replace(next.toString());
});

function startGame(config = {}) {
  applyLocale();
  pendingUnitMoves = [];
  pendingCombatEvents = [];
  // 적 참모부의 계획은 이제 어제 것을 참고한다. 새 작전에서까지 지난 작전의
  // 배정을 물려받으면, 부대 번호가 겹치는 만큼 엉뚱한 임무로 시작한다.
  enemyPlan = new Map();
  const playerSide = config.playerSide ?? state?.playerSide ?? "allies";
  const aiSide = playerSide === "axis" ? "allies" : "axis";
  // 음악도 진영을 따라간다. 연합군으로 두다가 추축군으로 새 판을 열면 장조가
  // 단조로 바뀐다. 여기는 "작전 개시"를 누른 손길 안이라 다시 트는 것이 허락된다.
  // 새 판은 언제나 평시로 시작한다 — 지난 판의 접전을 물려받지 않는다.
  musicLastContactTurn = -99;
  const musicWanted = playerSide === "axis" ? "axis" : "allies";
  if (musicSide && musicSide !== musicWanted) {
    musicTeardown();
    musicStart();
  }
  const scenario = findScenario(config.scenarioId ?? state?.scenarioId ?? defaultScenarioId);
  const playerCommander = commanders.find((commander) => commander.id === config.playerCommanderId && commander.side === commanderSideName(playerSide)) ?? defaultCommanderForSide(playerSide, scenario.id);
  const aiCommander = defaultCommanderForSide(aiSide, scenario.id);
  // 무전은 장군이 정해진 다음에 받는다. 어느 진영인지만 알아서는 어느 말을 쓸지
  // 모른다 — 같은 추축군이라도 야마시타 밑이면 일본어가 필요하다.
  // (첫 화면에서 이미 받아 둔 것은 건너뛴다.)
  prefetchSounds(playerSide, { player: playerCommander, enemy: aiCommander });
  const scenarioChanged = state?.scenarioId !== scenario.id;
  applyScenario(scenario);
  // 시나리오의 기한은 "시작값"이다. 작전을 바꿔 고를 때만 실어준다.
  // 같은 작전을 다시 시작하는 건 대개 "에디터에서 만진 숫자로 다시 해보자"는 뜻이라,
  // 그때 시나리오 기본값으로 되돌려버리면 방금 만진 값이 증발한다.
  if (scenarioChanged && Number.isFinite(scenario.turnLimit)) operationTurnLimit = scenario.turnLimit;
  const difficulty = findDifficulty(config.difficulty ?? state?.difficulty ?? defaultDifficultyId);
  const deployment = deploymentForScenario(scenario, playerSide, difficulty);
  state = {
    playerSide,
    difficulty: difficulty.id,
    scenarioId: scenario.id,
    // 배치 방식은 작전 설정에서 고른다. 새 작전 창을 거치지 않고 다시 시작하면
    // 직전 작전에서 쓰던 방식을 이어간다 — 수동 배치를 좋아하는 사람이 매번 다시
    // 고르게 만들 이유가 없다.
    deployMode: config.deployMode ?? state?.deployMode ?? "auto",
    turn: 1,
    phase: "player",
    resources: 8,
    // 플레이어의 시작 보급은 난이도와 무관하게 8이다. 바뀌는 것은 적 쪽뿐이다.
    enemyResources: difficulty.startSupply,
    selectedId: null,
    inspectedId: null,
    inspectedTile: null,
    // 방금 "왜 못 쳤는지". 못 치는 적을 누른 순간에만 채워지고, 다른 것을 누르면 지워진다.
    attackNotice: null,
    gameOver: false,
    // 거점을 전부 잃은 시점의 턴. 되찾으면 다시 null로 지워진다. baseLossCollapsed 참고.
    baseLossSince: { player: null, enemy: null },
    commanders: {
      player: playerCommander,
      enemy: aiCommander,
    },
    bases: deployment.bases,
    // 시나리오에 처음부터 서 있는 마을 다리. 전쟁 전부터 있던 것이라 주인이 없고,
    // 양쪽 다 그냥 건넌다. 공병대의 다리 두 개 제한에도 안 들어간다(builtCrossingCount).
    // 부교와 달리 튼튼하고, 한 번 끊기면 공병도 다시 세우지 못한다.
    improvements: (scenario.bridges ?? []).map(([x, y]) => newDeck("roadBridge", "neutral", x, y)),
    constructions: [],
    units: deployment.units,
    // 마지막으로 목격한 적의 자리. 진영마다 따로 쥔다 — 이게 곧 "각자 아는 만큼만
    // 안다"는 뜻이고, 안개가 양쪽에 공평하게 걸린다는 뜻이다.
    contacts: { player: {}, enemy: {} },
    mission: {
      id: scenario.id,
      name: scenario.name,
      summary: scenario.summary,
      objectiveBrief: scenario.objectiveBrief,
      // 시나리오는 승자를 진영(west/east)으로 적는다. 플레이어가 어느 쪽을 잡았는지에 따라
      // 여기서 플레이어 기준으로 뒤집는다. 진영을 바꿔 골라도 미션이 뒤집히지 않게 하는 지점이다.
      timeoutOutcome: timeoutOutcomeFor(scenario.timeoutWinner, playerSide),
      objectives: deployment.objectives,
    },
    log: [],
    // 작전 이력. 끝나고 결과 화면에서 통째로 읽는 물건이라 무전 기록과 달리
    // 밀려나지 않는다. 새 판은 반드시 백지에서 시작한다 — 지난 작전의 전사자가
    // 이번 보고서에 섞이면 그 보고서는 아무 말도 안 하는 것이 된다.
    chronicle: [],
    // 이미 내려간 작전 지령. 새 판에서는 비워야 지령이 처음부터 다시 내려온다.
    ordersGiven: {},
  };
  // 배치 구역은 반드시 정돈 전에 잡는다. 정돈된 자리를 기준 삼으면 같은 작전을
  // 다시 시작할 때마다 구역이 조금씩 밀려나서, 두 번째 판이 첫 판과 달라진다.
  state.deployZones = { player: buildDeployZone("player"), enemy: buildDeployZone("enemy") };
  // 적은 언제나 자동이다. 플레이어가 수동을 골랐으면 시나리오 좌표 그대로 넘겨주고
  // 배치 단계를 연다 — 자동이 미리 손봐두면 "내가 짠 배치"가 아니게 된다.
  const tidied = state.deployMode === "manual" ? 0 : tidyAutoDeployment("player", state.deployZones.player);
  tidyAutoDeployment("enemy", state.deployZones.enemy);
  if (state.deployMode === "manual") state.phase = "deploy";
  bannerEl.classList.remove("show");
  // 숨기는 것만으로는 지난 작전의 승패 문구가 DOM에 남는다. 새 작전은 백지에서 시작한다.
  bannerEl.textContent = "";
  hideResultScreen();
  // 첫날도 날짜부터 찍는다. 가장 먼저 넣어야 기록의 맨 아래에 깔린다.
  logDayLine();
  addLog(t("{side} › 작전 개시 · 지휘 {co}", { side: sideName("player"), co: state.commanders.player.name }));
  addChronicle(
    t("작전 「{name}」 개시 · {side} {commander} 지휘", {
      name: t(scenario.name),
      side: sideName("player"),
      commander: state.commanders.player.name,
    }),
    "start"
  );
  addLog(t("작전 「{name}」 — {summary}", { name: t(scenario.name), summary: t(scenario.summary) }));
  addLog(missionBriefText());
  // 맞은편 장군 이름은 여기서 안 알려 준다. 개전 전문에 이름을 박아 두면 사령부를
  // 찾아낼 이유가 없어진다 — 적 대대사령부를 눌러야 누구인지 알게 해 두었다.
  addLog(t("{side} 방어선 › 지휘관 미상 · 적 대대사령부 확인 요망", { side: sideName("enemy") }));
  addLog(t("{staff} 「{name}」 · {brief}", { staff: t("적 참모부"), name: t(difficulty.name), brief: t(difficulty.brief) }));
  addLog(t("공병대 배치 · 다리 1일, 보급창고·철도 수일 소요"));
  addLog(t("공병대 › 보병보다 빠르고 튼튼 · 전투력은 소총분대의 80%"));
  if (state.deployMode === "manual") {
    addLog(t("배치 단계 › 부대를 강조된 칸으로 옮긴 뒤 「배치 완료」 · 조정 반경 {n}칸", { n: deployRange }), "order");
  } else if (tidied) {
    addLog(t("참모부 › {n}개 부대 배치 조정 ({co} 보급 역량)", { n: tidied, co: state.commanders.player.name }));
  }
  renderBalanceEditor();
  render();
}

// 연합군을 고르면 west, 추축군을 고르면 east를 잡는다. 지도는 그대로고 서는 자리만 바뀐다.
function scenarioSideKey(playerSide) {
  return playerSide === "axis" ? "east" : "west";
}

// 이 작전에서 아예 편성할 수 없는 병종. 시작 배치에 없는 것과 끝까지 못 사는 것은
// 다른 이야기다 — 크레타의 강하부대에게 전차를 파는 순간 「하늘로 온 부대는 그것들을
// 데려오지 못한다」는 이 판의 전제가 통째로 무너진다. 숫자가 아니라 규칙이라
// 편집 창이 아니라 시나리오에 적는다(scenarios.js의 noRecruit).
function recruitBanFor(owner) {
  const playerKey = scenarioSideKey(state?.playerSide ?? "allies");
  const key = owner === "player" ? playerKey : playerKey === "west" ? "east" : "west";
  return activeScenario?.[key]?.noRecruit ?? [];
}

function canRecruitType(owner, type) {
  return !recruitBanFor(owner).includes(type);
}

function timeoutOutcomeFor(timeoutWinner, playerSide) {
  if (!timeoutWinner) return "draw";
  return timeoutWinner === scenarioSideKey(playerSide) ? "playerWin" : "playerLose";
}

function deploymentForScenario(scenario, playerSide, difficulty = findDifficulty(defaultDifficultyId)) {
  const playerKey = scenarioSideKey(playerSide);
  const enemyKey = playerKey === "west" ? "east" : "west";
  const playerDeployment = scenario[playerKey];
  const enemyDeployment = scenario[enemyKey];
  const units = [
    ...playerDeployment.units.map((entry) => createScenarioUnit("player", entry)),
    ...enemyDeployment.units.map((entry) => createScenarioUnit("enemy", entry)),
  ];
  applyDifficultyToEnemyForce(units, difficulty);
  return {
    // 진영 블록 안에 적혀 있다고 다 그 진영 것은 아니다. neutral이 붙은 거점은
    // 위치만 그쪽 몫이고 소유는 아무에게도 없다 — 먼저 밟는 쪽이 가져간다.
    bases: [
      ...playerDeployment.bases.map((base) => createBase(base.x, base.y, base.neutral ? "neutral" : "player", base.production)),
      ...enemyDeployment.bases.map((base) => createBase(base.x, base.y, base.neutral ? "neutral" : "enemy", base.production)),
    ],
    units,
    objectives: [
      ...(playerDeployment.objectives ?? []).map((entry) => createObjective("player", entry)),
      ...(enemyDeployment.objectives ?? []).map((entry) => createObjective("enemy", entry)),
    ],
  };
}

// 난이도가 적 전선의 머릿수를 바꾼다. 자리는 여기서 정하지 않는다 — 기존 적 부대
// 위에 겹쳐 놓기만 하면 바로 뒤에 도는 tidyAutoDeployment("enemy")가 배치 구역 안의
// 빈 칸으로 알아서 흩어 준다. 여기서 좌표를 직접 찍으면 시나리오마다 강과 산을 다시
// 확인해야 하고, 한 군데만 틀리면 적 한 부대가 강 속에 서서 작전을 시작한다.
// 태그가 붙은 부대는 건드리지 않는다 — 그 부대는 목표가 가리키는 부대다.
function applyDifficultyToEnemyForce(units, difficulty) {
  const extra = difficulty?.startUnits ?? 0;
  if (!extra) return;
  const anchors = units.filter((unit) => unit.owner === "enemy" && !unit.tag && isCombatUnit(unit));
  if (!anchors.length) return;
  if (extra > 0) {
    for (let i = 0; i < extra; i += 1) {
      const type = difficultyReinforceOrder[i % difficultyReinforceOrder.length];
      const anchor = anchors[i % anchors.length];
      units.push(createUnit("enemy", type, anchor.x, anchor.y));
    }
    return;
  }
  // 빼는 쪽은 가장 흔한 병종에서 뺀다. 한 대뿐인 전차를 지우면 난이도를 낮춘 것이
  // 아니라 그 작전의 성격을 지운 것이 된다. 마지막 한 부대는 남긴다.
  for (let i = 0; i < -extra; i += 1) {
    const pool = units.filter((unit) => unit.owner === "enemy" && !unit.tag && isCombatUnit(unit));
    if (pool.length <= 1) return;
    const counts = new Map();
    pool.forEach((unit) => counts.set(unit.type, (counts.get(unit.type) ?? 0) + 1));
    const commonest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const victim = pool.reverse().find((unit) => unit.type === commonest);
    if (!victim) return;
    units.splice(units.indexOf(victim), 1);
  }
}

// ── 배치 ──────────────────────────────────────────────────────────────────
// 시나리오가 적은 좌표는 "기준선"이지 못 박은 자리가 아니다. 실제로 설 자리는
// 지휘관에 따라 달라져야 한다 — 보급 -2인 슈투덴트가 보급 +3인 아이젠하워와
// 똑같은 자리에 서면 그건 지휘관 선택이 아니라 첫 턴부터 안고 시작하는 벌칙이다.
// 그래서 배치는 두 가지를 한다:
//   1) 같은 칸에 두 부대를 세우지 않는다.
//   2) 보급이 닿지 않는 부대는 당겨 붙인다 — 보급이 약한 지휘관일수록 촘촘해진다.

// 배치 규칙은 이동 규칙보다 한 칸 더 엄격하다. 게임 중에는 같은 종류끼리 겹칠 수
// 있지만(canOccupy), 시작부터 겹쳐 세우면 중첩 사기 감점을 그대로 안고 출발한다.
// 그 손해는 플레이어가 고른 것이 아니라 배치가 떠넘긴 것이므로 아예 막는다.
function canDeployAt(unit, x, y) {
  if (!canEnterTerrain(unit, x, y)) return false;
  return !state.units.some((other) => other.id !== unit.id && other.x === x && other.y === y);
}

// 배치 시점의 보급 판정. normalizedSupplyStatus와 같은 규칙을 쓰되, 부대를 실제로
// 옮겨보지 않고 "그 자리에 서면 보급이 닿는가"만 묻는다.
// 사령부는 자기 자신을 보급원으로 못 쓰므로 거점 보급망만 본다.
function deploySupplyOk(unit, x, y) {
  if (unit.type !== "battalionHQ") {
    const hqs = state.units.filter((other) => other.owner === unit.owner && other.type === "battalionHQ");
    if (hqs.some((hq) => distance({ x, y }, hq) <= effectiveHQSupplyRange(unit.owner))) return true;
  }
  return supplyLineCost({ owner: unit.owner, x, y }) <= effectiveSupplyRange(unit);
}

// 배치 구역. 시나리오가 그 진영에 준 시작 좌표와 거점에서 deployRange 안.
// 자동 배치가 부대를 옮길 수 있는 범위이자, 수동 배치에서 플레이어가 세울 수 있는
// 범위다 — 둘이 같은 숫자를 쓰는 건 의도한 것이다. 자동이 갈 수 있는 곳이면
// 사람도 갈 수 있어야 공평하고, 지도 반대편으로 순간이동하는 것도 같이 막힌다.
// 반드시 정돈 전 좌표로 잡아야 한다. 정돈된 자리를 기준 삼으면 다시 시작할 때마다
// 구역이 조금씩 밀려난다.
function buildDeployZone(owner) {
  const zone = new Set();
  const anchors = [
    ...state.units.filter((unit) => unit.owner === owner).map((unit) => ({ x: unit.x, y: unit.y })),
    ...state.bases.filter((base) => base.owner === owner),
  ];
  anchors.forEach((anchor) => {
    for (let dy = -deployRange; dy <= deployRange; dy += 1) {
      for (let dx = -deployRange; dx <= deployRange; dx += 1) {
        if (inBounds(anchor.x + dx, anchor.y + dy)) zone.add(posKey(anchor.x + dx, anchor.y + dy));
      }
    }
  });
  return zone;
}

// 사령부가 먼저 자리를 잡아야 한다. 나머지 부대의 보급 판정이 사령부 위치에 걸려
// 있으므로, 기준점이 정해지기 전에 예하 부대를 옮기면 엉뚱한 자리로 간다.
// 공병대는 마지막이다 — 전투 부대가 좋은 자리를 먼저 가져가는 게 맞다.
function deployOrder(unit) {
  if (unit.type === "battalionHQ") return 0;
  if (unit.type === "engineer") return 2;
  return 1;
}

function tidyAutoDeployment(owner, zone) {
  const mine = state.units.filter((unit) => unit.owner === owner).sort((a, b) => deployOrder(a) - deployOrder(b));
  let moved = 0;
  mine.forEach((unit) => {
    const spot = bestDeploySpot(unit, zone);
    if (unit.x === spot.x && unit.y === spot.y) return;
    unit.x = spot.x;
    unit.y = spot.y;
    moved += 1;
  });
  return moved;
}

// 자리 고르기의 우선순위:
//   1. 원래 자리가 비어 있고 보급도 닿으면 그대로 — 시나리오 의도가 이긴다.
//   2. 가까운 순으로 보급이 닿는 빈 칸.
//   3. 그런 칸이 없으면 다시 원래 자리 — 어차피 아무 데도 보급이 안 닿는데
//      옆칸으로 밀어봐야 시나리오만 흐트러진다.
//   4. 원래 자리마저 막혔으면 보급망에 연결은 된 빈 칸, 그마저 없으면 아무 빈 칸.
// 4번에서 "연결됨"을 따로 보는 건 강 건너 고립된 칸으로 밀려나지 않게 하려는 것이다.
function bestDeploySpot(unit, zone) {
  const home = { x: unit.x, y: unit.y };
  // 태그가 붙은 부대는 손대지 않는다. 시나리오가 태그를 단 건 목표가 그 부대를
  // 가리키기 때문이고, 「고립 사령부 구조」에서는 그 부대가 놓인 상황 자체가 미션이다.
  // 보급이 안 닿는 게 사고가 아니라 설계인 자리 — 참모부가 고칠 자리가 아니다.
  if (unit.tag) return home;
  const homeFree = canDeployAt(unit, home.x, home.y);
  if (homeFree && deploySupplyOk(unit, home.x, home.y)) return home;
  let connected = null;
  let anyFree = null;
  const seen = new Set([posKey(home.x, home.y)]);
  let frontier = [home];
  for (let step = 0; step < deployRange && frontier.length; step += 1) {
    const next = [];
    for (const point of frontier) {
      for (const spot of neighbors(point.x, point.y)) {
        const key = posKey(spot.x, spot.y);
        if (seen.has(key)) continue;
        seen.add(key);
        if (!zone.has(key)) continue;
        next.push(spot);
        if (!canDeployAt(unit, spot.x, spot.y)) continue;
        if (deploySupplyOk(unit, spot.x, spot.y)) return spot;
        if (!connected && Number.isFinite(supplyLineCost({ owner: unit.owner, x: spot.x, y: spot.y }))) connected = spot;
        if (!anyFree) anyFree = spot;
      }
    }
    frontier = next;
  }
  if (homeFree) return home;
  return connected ?? anyFree ?? home;
}

// 시나리오는 ["infantry", 2, 12] 처럼 짧게 적어도 되고,
// 태그가 필요하면 { type, x, y, tag } 로 적어도 된다. 태그는 목표가 특정 유닛을 가리킬 때 쓴다.
function createScenarioUnit(owner, entry) {
  const spec = Array.isArray(entry) ? { type: entry[0], x: entry[1], y: entry[2], tag: entry[3] } : entry;
  const unit = createUnit(owner, spec.type, spec.x, spec.y);
  if (spec.tag) unit.tag = spec.tag;
  return unit;
}

// 목표는 시나리오가 주는 데이터고, 유지 턴 수는 에디터가 주는 숫자다.
// holdTurns를 비워두면 에디터 값을 따라간다 — 시나리오가 덮어쓸 수 있는 자리로 남겨둔다.
function createObjective(owner, spec) {
  return {
    owner,
    kind: spec.kind ?? "seize",
    x: spec.x,
    y: spec.y,
    label: spec.label ?? "작전 목표",
    byTag: spec.byTag ?? null,
    tag: spec.tag ?? null,
    targetType: spec.targetType ?? null,
    held: 0,
    holdTurns: spec.holdTurns ?? null,
    // 같은 이름을 단 목표끼리 한 묶음. 묶음은 전부 이루어져야 이긴다(포위·양면 작전).
    group: spec.group ?? null,
    // 이 턴이 되기 전에는 없는 목표로 친다(뒤늦게 열리는 반격 명령).
    fromTurn: spec.fromTurn ?? null,
  };
}

function createBase(x, y, owner, production) {
  return { x, y, owner, production, efficiency: 1, builtByEngineer: false };
}

function createUnit(owner, type, x, y) {
  return {
    id: makeId(),
    owner,
    type,
    x,
    y,
    hp: unitTypes[type].hp,
    acted: false,
    moved: false,
    towed: false,
    hqOutTurns: 0,
  };
}

// 갓 편성된 부대는 그날 움직이지도 싸우지도 못한다.
//
// 이 줄이 없던 동안 사령부는 부대를 뽑는 곳이 아니라 전선으로 쏘는 발사대였다.
// 사령부 옆 칸에서 태어난 부대가 그 턴에 그대로 달려가 때렸으니, 전차는 사령부에서
// 6칸, 자주포는 9칸 밖의 적을 그날 쳤다. 거리가 아무 의미도 없어진다는 뜻이다.
// 이 게임이 하려는 이야기는 보급과 거리인데, 예비대만 거리를 건너뛰고 있었다.
// 도착 당일 전투에 들어가는 신편 부대는 현실에도 없다.
//
// 적은 자기 턴 맨 끝에 뽑아서 이 규칙을 원래부터 지키고 있었다(enemyTurn 순서).
// 그래서 이건 사람 쪽만 막는 규칙이 아니라, 한쪽 사정으로 지켜지던 것을
// 양쪽에 적힌 글로 옮기는 일이다.
function deployReinforcement(owner, type, x, y) {
  const unit = createUnit(owner, type, x, y);
  unit.acted = true;
  unit.moved = true;
  unit.justArrived = true;
  return unit;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `unit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ─── 전장 안개 한 장으로 그리기 ───────────────────────────────────────────
// 예전에는 안 보이는 칸마다 유리막을 한 장씩 덮었다. 규칙대로는 맞지만 안개가
// 칸 모서리를 따라 계단처럼 각져서, 안개가 아니라 모자이크로 보였다.
//
// 규칙은 그대로 칸 단위다 — 보이면 보이고 안 보이면 안 보인다. 바꾼 것은 그림뿐이다.
// 칸을 한 변 12점으로 잘게 나눠 칠한 뒤 경계만 번지게 흐린다. 칸 한가운데는 예전과
// 똑같이 완전히 맑거나 완전히 흐리고, 흐려지는 곳은 칸 경계 앞뒤 반 칸뿐이다.
// 그래서 "여기까지 보인다"는 판단은 예전과 같은 정확도로 할 수 있다.
//
// 처음에는 예전처럼 뒷배경을 흐리는 막(backdrop-filter) 한 장에 본을 오려 씌워 봤다.
// 본은 정확히 맞았지만, 경계가 부드러운 본을 씌우면 크롬이 뒷배경 흐리기를 판 전체에
// 발라 버려서 지도 색이 통째로 허옇게 떴다. 그래서 막을 씌우는 대신 안개를 직접 칠한다 —
// 어느 점을 얼마나 덮을지 우리가 정하니 브라우저마다 다르게 나올 일이 없다.
const FOG_CELL_DOTS = 12; // 한 칸을 몇 점으로 나눠 그리는가
// 번지는 폭. 여기 적는 값은 반지름이 아니라 표준편차라, 실제로는 이 값의 세 배쯤
// 퍼진다. 0.18이면 경계 앞뒤로 약 반 칸 — 눈에는 부드럽고, "이 칸이 보이는 칸인가"는
// 여전히 칸 한가운데만 보면 바로 안다. 더 키우면 안개가 두 칸 너머까지 스며서
// 보이는 칸까지 덩달아 흐려진다.
const FOG_BLUR_CELLS = 0.18;
const FOG_INK = "12 18 30"; // 안개 색. 칸마다 덮던 시절과 같은 푸른 회색
const FOG_DENSITY = 0.44; // 보통 판에서의 짙기
const FOG_DENSITY_MAP = 0.54; // 위성 지도 위에서는 같은 짙기로는 티가 안 난다
let fogBlanketEl = null;
let fogStepCanvas = null;

// 판 바깥으로 한 칸 넓게 그린 뒤 가운데만 잘라 쓴다. 그러지 않으면 판 가장자리에서
// 안개가 바깥의 빈 곳과 섞여 저 혼자 옅어진다.
function paintFogBlanket(alphaByCell, cols, rows) {
  const dots = FOG_CELL_DOTS;
  const padW = (cols + 2) * dots;
  const padH = (rows + 2) * dots;
  if (!fogStepCanvas) fogStepCanvas = document.createElement("canvas");
  if (fogStepCanvas.width !== padW || fogStepCanvas.height !== padH) {
    fogStepCanvas.width = padW;
    fogStepCanvas.height = padH;
  }
  if (fogBlanketEl.width !== cols * dots || fogBlanketEl.height !== rows * dots) {
    fogBlanketEl.width = cols * dots;
    fogBlanketEl.height = rows * dots;
  }

  const density = mapConfig.enabled ? FOG_DENSITY_MAP : FOG_DENSITY;
  const stepCtx = fogStepCanvas.getContext("2d");
  stepCtx.clearRect(0, 0, padW, padH);
  for (let y = -1; y <= rows; y += 1) {
    for (let x = -1; x <= cols; x += 1) {
      const alpha = alphaByCell[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)];
      if (alpha <= 0) continue;
      stepCtx.fillStyle = `rgb(${FOG_INK} / ${(alpha * density).toFixed(3)})`;
      stepCtx.fillRect((x + 1) * dots, (y + 1) * dots, dots, dots);
    }
  }

  const ctx = fogBlanketEl.getContext("2d");
  ctx.clearRect(0, 0, fogBlanketEl.width, fogBlanketEl.height);
  ctx.filter = `blur(${(dots * FOG_BLUR_CELLS).toFixed(2)}px)`;
  // 흐림은 판 바깥까지 그려 둔 그림 위에서 돌리고, 가운데 판만 잘라 온다.
  ctx.drawImage(fogStepCanvas, -dots, -dots);
  ctx.filter = "none";
}

function applyFogBlanket(alphaByCell, cols, rows) {
  if (!alphaByCell.some((alpha) => alpha > 0)) {
    fogBlanketEl?.remove();
    return;
  }
  if (!fogBlanketEl) {
    fogBlanketEl = document.createElement("canvas");
    fogBlanketEl.className = "fog-blanket";
    fogBlanketEl.setAttribute("aria-hidden", "true");
  }
  paintFogBlanket(alphaByCell, cols, rows);
  // 판을 다시 그릴 때마다 자식이 통째로 날아가므로 매번 다시 얹는다.
  boardEl.appendChild(fogBlanketEl);
}

// ─── 물줄기 한 장으로 그리기 ─────────────────────────────────────────────
// 예전에는 하천과 강변을 칸마다 한 장씩 칠했다. 그랬더니 강이 강으로 안 보이고
// 네모 도장을 나란히 찍어 놓은 것처럼 보였다 — 칸마다 물결 무늬가 똑같이 반복되고,
// 칸과 칸 사이에 종이색 실금이 남았기 때문이다.
//
// 안개와 같은 방법을 쓴다. 칸을 잘게 나눠 칠한 뒤 경계만 번지게 흐려서 한 줄기로
// 잇는다. 규칙은 그대로 칸 단위다 — 못 건너는 칸은 여전히 그 칸이고, 바뀐 것은
// 그림뿐이다.
//
// 흐린 그림을 두 번 겹쳐 그린다. 한 번은 넓게, 한 번은 좁게. 겹치는 한가운데가
// 저절로 진해지고 가장자리는 옅게 풀려서, 색연필로 물길을 칠한 것처럼 강기슭이 생긴다.
const RIBBON_CELL_DOTS = 20; // 한 칸을 몇 점으로 나눠 그리는가
// 흐리는 폭. 반지름이 아니라 표준편차라 실제로는 세 배쯤 퍼진다.
const RIBBON_BLUR_TIGHT = 0.05;
const RIBBON_BLUR_SOFT = 0.2;
// 하천은 못 건너는 유일한 지형이라 가장 세게 보여야 한다. 종이 지도의 강처럼
// 잉크빛 파랑으로 간다 — 판 위쪽 바다(아주 옅은 찬 미색)와도, 모래빛 강변과도 겹치지 않는다.
// 물길을 한 겹으로 칠하면 파란 테이프를 붙여 놓은 것처럼 보인다. 실제 강은 가장자리가
// 가장 어둡고(그늘진 기슭과 깊은 물), 한복판이 가장 밝다(물이 하늘을 비춘다).
// 그래서 같은 줄기를 넓은 것부터 좁은 것 순으로 네 번 겹쳐 긋는다. 바깥일수록 어둡고
// 안쪽일수록 밝아지므로, 선 하나가 저절로 단면(기슭 → 깊은 물 → 여울 → 물빛)이 된다.
const RIVER_LAYERS = [
  { ink: "26 58 86", alpha: 0.5, width: 0.74 }, // 기슭 그늘 — 물과 땅의 경계선
  { ink: "46 96 134", alpha: 0.52, width: 0.56 }, // 깊은 물
  { ink: "92 152 178", alpha: 0.34, width: 0.32 }, // 여울
  { ink: "208 232 238", alpha: 0.24, width: 0.11 }, // 한복판에 앉는 물빛
];
// 도하 목에 덧칠하는 얕은 물. 자갈빛을 옅게 한 번, 물빛을 더 옅게 한 번 얹으면
// 강줄기 중에서 그 목만 밝아진다 — 여기가 걸어서 건널 수 있는 자리라는 표시다.
const FORD_LAYERS = [
  { ink: "212 194 144", alpha: 0.48, width: 0.64 }, // 자갈 바닥
  { ink: "240 246 240", alpha: 0.32, width: 0.3 }, // 얕아서 밝게 튀는 물
];
// 강기슭. 물길을 따라 넓게 한 번 더 깔아 주는 모래빛 그림자다.
const SHORE_INK = "124 102 56";
const SHORE_ALPHA = 0.13;
const SHORE_WIDTH = 1.05;
// 접근로는 물이 아니라 길이다. 가늘게 그어야 길로 보인다.
const TRACK_ALPHA = 0.34;
const TRACK_WIDTH = 0.2;
let waterRibbonEl = null;
let ribbonStepCanvas = null;

// 칸 한가운데를 조금씩 밀어 주는 값. 좌표만으로 계산하므로 같은 지도는 언제나
// 같은 굽이가 나온다. 최대 0.32칸이라 밀려도 제 칸 밖으로는 안 나간다 —
// 규칙(못 건너는 칸)과 그림이 어긋나지 않아야 하기 때문이다.
function ribbonDrift(x, y) {
  // 굽이는 긴 것과 짧은 것을 겹쳐 만든다. 짧은 흔들림만 있으면 뒤에서 마디를
  // 문지를 때(paintRibbon) 평균에 묻혀 사라지고, 지형이 곧게 뻗은 지도에서는
  // 강이 자로 그은 직선이 된다. 긴 굽이를 크게 넣어야 문지른 뒤에도 남는다.
  return {
    dx: 0.3 * Math.sin(y * 0.62 + x * 0.33) + 0.1 * Math.sin(y * 1.87 + 1.7),
    dy: 0.3 * Math.sin(x * 0.58 + y * 0.31) + 0.1 * Math.sin(x * 1.93 + 0.6),
  };
}

// 이웃한 칸의 한가운데끼리 이어서 한 줄기로 긋는다. 네모를 나란히 칠하는 대신
// 선으로 긋기 때문에 굽이도 생기고, 칸 경계에 각진 계단도 안 남는다.
// 대각선 이웃까지 잇는 이유는 강이 한 칸씩 비껴 흐르기 때문이다.
// 판 바깥으로 한 칸 넓게 그린 뒤 가운데만 잘라 쓴다 — 그러지 않으면 판
// 가장자리에서 물줄기가 저 혼자 옅어져 끊긴다.
function paintRibbon(ctx, cells, cols, rows, layers, blur) {
  const dots = RIBBON_CELL_DOTS;
  const at = (x, y) => cells[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)];
  const home = (x, y) => {
    const d = ribbonDrift(x, y);
    return [(x + 1.5 + d.dx) * dots, (y + 1.5 + d.dy) * dots];
  };
  // 물길이 한 칸씩 비껴 흐르면(9열 → 10열 → 9열) 칸 한가운데를 곧게 이었을 때
  // 강이 아니라 번개 표시가 된다. 그래서 잇기 전에 마디마다 이웃들의 평균 쪽으로
  // 두 번 문질러 둔다 — 곧게 흐르는 구간은 그대로고, 꺾이는 구간만 굽이가 된다.
  // 제 칸 한가운데에서 0.42칸 넘게는 못 벗어나게 묶어 둔다. 그림이 규칙(못 건너는
  // 칸)보다 멀리 나가면, 눈에 보이는 강과 실제로 막히는 칸이 어긋나기 때문이다.
  const nodeKey = (x, y) => `${x},${y}`;
  let nodes = new Map();
  for (let y = -1; y <= rows; y += 1) {
    for (let x = -1; x <= cols; x += 1) {
      if (at(x, y)) nodes.set(nodeKey(x, y), home(x, y));
    }
  }
  const leash = 0.42 * dots;
  for (let pass = 0; pass < 2; pass += 1) {
    const eased = new Map();
    nodes.forEach((point, id) => {
      const [nx, ny] = id.split(",").map(Number);
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (!ox && !oy) continue;
          const q = nodes.get(nodeKey(nx + ox, ny + oy));
          if (!q) continue;
          sx += q[0];
          sy += q[1];
          n += 1;
        }
      }
      if (!n) { eased.set(id, point); return; }
      const anchor = home(nx, ny);
      const mixed = [point[0] * 0.45 + (sx / n) * 0.55, point[1] * 0.45 + (sy / n) * 0.55];
      eased.set(id, [
        clamp(mixed[0], anchor[0] - leash, anchor[0] + leash),
        clamp(mixed[1], anchor[1] - leash, anchor[1] + leash),
      ]);
    });
    nodes = eased;
  }
  const px = (x, y) => nodes.get(nodeKey(x, y)) ?? home(x, y);
  const stepCtx = ribbonStepCanvas.getContext("2d");
  // 물길을 칸 한가운데끼리 잇는 선으로만 그리면, 물이 한 줄로 흐를 때는 강이 되지만
  // 물(또는 강변)이 두 칸 이상 두께로 퍼진 자리에서는 선과 선 사이가 뚫린 채로 남아
  // 그물이 된다. 「총력전」의 5·6행처럼 강변이 두 줄로 이어진 곳이 그랬다 —
  // 강물이 아니라 어망을 펼쳐 놓은 그림이었다.
  // 그래서 잇는 선과 함께, 네 칸이 통째로 물인 자리는 그 네 마디를 꼭짓점으로 하는
  // 면을 만들어 안쪽을 메운다. 한 줄로 흐르는 강에는 그런 자리가 없으므로 지금
  // 모습 그대로고, 넓게 퍼진 물만 속이 꽉 찬다.
  const path = new Path2D();
  let painted = false;
  for (let y = -1; y <= rows; y += 1) {
    for (let x = -1; x <= cols; x += 1) {
      if (!at(x, y)) continue;
      painted = true;
      const a = px(x, y);
      // 이웃이 없는 외톨이 칸도 점 하나로 남도록 제자리에 아주 짧게 긋는다.
      path.moveTo(a[0], a[1]);
      path.lineTo(a[0] + 0.01, a[1]);
      for (const [ox, oy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        if (!at(x + ox, y + oy)) continue;
        const b = px(x + ox, y + oy);
        path.moveTo(a[0], a[1]);
        path.lineTo(b[0], b[1]);
      }
      // 오른쪽·아래·오른쪽 아래까지 넷이 다 물이면 그 사이를 메운다.
      if (!at(x + 1, y) || !at(x, y + 1) || !at(x + 1, y + 1)) continue;
      const b = px(x + 1, y);
      const c = px(x + 1, y + 1);
      const d = px(x, y + 1);
      path.moveTo(a[0], a[1]);
      path.lineTo(b[0], b[1]);
      path.lineTo(c[0], c[1]);
      path.lineTo(d[0], d[1]);
      path.closePath();
    }
  }
  if (!painted) return;
  stepCtx.lineCap = "round";
  stepCtx.lineJoin = "round";
  // 한 겹씩 따로 그린다. 메우기와 긋기는 붓질이 두 번이라, 둘을 같은 판에 반투명으로
  // 겹치면 만나는 자리만 두 번 진해져 얼룩이 진다. 그래서 겹마다 판을 비우고 불투명
  // 으로 칠한 뒤, 판째로 지정한 만큼 흐리게 얹는다. 넓고 어두운 겹을 먼저 깔고 좁고
  // 밝은 겹을 그 위에 얹으므로, 가장자리는 어둡고 한복판이 밝은 물빛이 된다.
  for (const layer of layers) {
    stepCtx.clearRect(0, 0, ribbonStepCanvas.width, ribbonStepCanvas.height);
    stepCtx.fillStyle = `rgb(${layer.ink})`;
    stepCtx.strokeStyle = `rgb(${layer.ink})`;
    stepCtx.lineWidth = dots * layer.width;
    stepCtx.fill(path);
    stepCtx.stroke(path);
    ctx.globalAlpha = layer.alpha;
    ctx.filter = `blur(${(dots * blur).toFixed(2)}px)`;
    ctx.drawImage(ribbonStepCanvas, -dots, -dots);
  }
  ctx.globalAlpha = 1;
  ctx.filter = "none";
}

// 한 겹짜리(강기슭·접근로)는 예전처럼 부르게 둔다.
function strokeRibbonPath(ctx, cells, cols, rows, ink, alpha, widthCells, blur) {
  paintRibbon(ctx, cells, cols, rows, [{ ink, alpha, width: widthCells }], blur);
}

function applyWaterRibbon(riverCells, bankCells, cols, rows) {
  const any = riverCells.some(Boolean) || bankCells.some(Boolean);
  if (!mapConfig.enabled || !any) {
    waterRibbonEl?.remove();
    return;
  }
  if (!waterRibbonEl) {
    waterRibbonEl = document.createElement("canvas");
    waterRibbonEl.className = "water-ribbon";
    waterRibbonEl.setAttribute("aria-hidden", "true");
  }
  if (!ribbonStepCanvas) ribbonStepCanvas = document.createElement("canvas");
  const dots = RIBBON_CELL_DOTS;
  ribbonStepCanvas.width = (cols + 2) * dots;
  ribbonStepCanvas.height = (rows + 2) * dots;
  waterRibbonEl.width = cols * dots;
  waterRibbonEl.height = rows * dots;

  // 강변/접근로(C)는 한 지형인데 하는 일이 둘이다. 물에 잇닿아 있으면 강기슭이고,
  // 물에서 떨어져 있으면 도하 지점으로 이어지는 길이다. 도하 돌파 지도에서는
  // 이 칸이 판을 가로지르는 줄로 깔려 있어서, 전부 모래빛으로 칠하면 지도에
  // 굵은 띠 세 줄이 그어진다. 길은 길답게 가늘게 긋는다.
  const shore = new Array(cols * rows).fill(false);
  const track = new Array(cols * rows).fill(false);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!bankCells[y * cols + x]) continue;
      let touchesWater = false;
      for (let oy = -1; oy <= 1 && !touchesWater; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          if (riverCells[ny * cols + nx]) { touchesWater = true; break; }
        }
      }
      (touchesWater ? shore : track)[y * cols + x] = true;
    }
  }

  // 도하 지점. 「도하 돌파」의 3·8·13행처럼 강을 가로지르는 접근로 칸이다.
  // 규칙으로는 건널 수 있는 칸이 맞지만, 그림에서까지 물이 뚝 끊겨서 강 한 줄기가
  // 서너 토막으로 잘려 보였다 — 강이 아니라 물웅덩이 몇 개였다.
  // 여기서는 물을 이어 긋되 얕게 칠한다. 규칙은 한 줄도 안 바뀌고, 대신 "어디로
  // 건널 수 있는가"가 지도에서 바로 보인다 — 강이 옅어지는 그 목이다.
  const ford = new Array(cols * rows).fill(false);
  const waterNear = (x, y, axis) => {
    for (let o = -1; o <= 1; o += 1) {
      const nx = axis === "v" ? x + o : x;
      const ny = axis === "v" ? y : y + o;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (riverCells[ny * cols + nx]) return true;
    }
    return false;
  };
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!bankCells[y * cols + x]) continue;
      // 위아래가 다 물이면 남북으로 흐르는 강을 가로지르는 목이고, 좌우가 다 물이면
      // 동서로 흐르는 강을 가로지르는 목이다. 한쪽만 물인 칸은 그냥 강기슭이다.
      // 한쪽은 반드시 바로 위(또는 바로 아래)가 물이어야 한다 — 대각선만 보고 잡으면
      // 곧게 흐르는 강에서 좌우 옆칸까지 목으로 딸려 들어와, 강 한복판에 마름모가
      // 세 개 부풀어 오른다. 강이 비껴 흐르는 자리에서만 두 칸이 목이 된다.
      const inLine = (dy) => y + dy >= 0 && y + dy < rows && riverCells[(y + dy) * cols + x] === true;
      const inLineH = (dx) => x + dx >= 0 && x + dx < cols && riverCells[y * cols + (x + dx)] === true;
      const crosses =
        (waterNear(x, y - 1, "v") && waterNear(x, y + 1, "v") && (inLine(-1) || inLine(1))) ||
        (waterNear(x - 1, y, "h") && waterNear(x + 1, y, "h") && (inLineH(-1) || inLineH(1)));
      if (!crosses) continue;
      ford[y * cols + x] = true;
      shore[y * cols + x] = false;
      track[y * cols + x] = false;
    }
  }
  // 물줄기는 하천 칸과 도하 목을 한 줄기로 본다. 그래야 강이 끊기지 않는다.
  const channel = riverCells.map((wet, i) => wet || ford[i]);

  const ctx = waterRibbonEl.getContext("2d");
  ctx.clearRect(0, 0, waterRibbonEl.width, waterRibbonEl.height);
  // 아래에서부터: 강기슭(넓고 흐리게) → 물길(좁고 또렷하게) → 도하 목(얕게) → 길(가늘게).
  strokeRibbonPath(ctx, channel, cols, rows, SHORE_INK, SHORE_ALPHA, SHORE_WIDTH, RIBBON_BLUR_SOFT);
  strokeRibbonPath(ctx, shore, cols, rows, SHORE_INK, SHORE_ALPHA, SHORE_WIDTH, RIBBON_BLUR_SOFT);
  paintRibbon(ctx, channel, cols, rows, RIVER_LAYERS, RIBBON_BLUR_TIGHT);
  paintRibbon(ctx, ford, cols, rows, FORD_LAYERS, RIBBON_BLUR_TIGHT);
  strokeRibbonPath(ctx, track, cols, rows, SHORE_INK, TRACK_ALPHA, TRACK_WIDTH, RIBBON_BLUR_TIGHT);
  // 칸(z-index 2)과 같은 층이되 먼저 얹으므로 부대와 이동 표시는 물 위에 그려진다.
  boardEl.appendChild(waterRibbonEl);
}

function render() {
  boardEl.innerHTML = "";
  // map-enabled는 판의 생김새(칸 그림·격자·표식)를 바꾸는 표시다. 예전에는 여기서
  // 항공사진 격 실제 지도 타일도 같이 깔았는데, 그 층(.map-underlay)은 display:none이라
  // 화면에 한 픽셀도 안 나오면서 화면을 다시 그릴 때마다 남의 서버에서 그림 스물다섯
  // 장을 받아 오고 있었다. 보이지도 않는 그림 때문에 "밖으로 나가는 것은 없다"는
  // 처리방침이 거짓말이 되고, 어느 작전을 골랐는지가 그 좌표로 남의 기록에 남았다.
  // 그래서 받아 오는 일을 없앴다 — 화면은 그대로다.
  boardEl.classList.toggle("map-enabled", mapConfig.enabled);
  renderMapLabels();
  // 물줄기는 칸을 그리기 전에 깔아야 부대와 이동 표시가 그 위에 온다.
  {
    const river = new Array(width * height).fill(false);
    const bank = new Array(width * height).fill(false);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const key = getTerrainKey(x, y);
        if (key === "W") river[y * width + x] = true;
        else if (key === "C") bank[y * width + x] = true;
      }
    }
    applyWaterRibbon(river, bank, width, height);
  }
  const highlights = getHighlights();
  // 클릭한 사령부/거점의 보급권. 지도 한 장에 한 번만 계산한다 — 칸마다 BFS를 다시 돌리면
  // 320칸을 그리는 동안 320번을 돈다.
  const coverage = supplyCoverageFocus();
  // 그리기 직전에 눈에 든 것을 기록한다. 부대가 움직일 때마다 render가 다시 도니
  // 시야가 열리는 그 순간에 기억도 갱신된다.
  recordContacts("player");
  // 이번 화면의 아군 시야. 칸마다 canSee를 부르면 같은 계산을 320번 하게 되므로
  // 한 번 받아서 들고 다닌다.
  const seen = fogOfWar ? visionField("player") : null;
  // 시야를 벗어난 적의 마지막 자리. 칸별로 찾을 수 있게 자리 열쇠로 묶어 둔다.
  const ghosts = new Map();
  staleContacts("player").forEach((memo) => {
    if (!ghosts.has(posKey(memo.x, memo.y))) ghosts.set(posKey(memo.x, memo.y), memo);
  });

  // 안개는 칸마다 유리막을 한 장씩 덮는 대신, 판 전체를 덮는 한 장으로 그린다.
  // 칸별 짙기만 여기 모아 두고, 판을 다 그린 뒤 한 번에 번지게 한다(applyFogBlanket).
  const fogAlpha = new Array(width * height).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tileKey = getTerrainKey(x, y);
      const tile = terrain[tileKey];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `tile ${tile.className}`;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.title = `${displayTileName(x, y)} (${x}, ${y})`;
      const hillDirection = hillDefenseDirection(x, y);
      if (hillDirection) {
        cell.classList.add("ridge-shield", `ridge-${hillDirection}`);
        cell.title += ` / ${t("방어방향")} ${ridgeDirectionLabel(hillDirection)}${ridgeFacingDefense ? ` ${t("정면")} +${ridgeFacingDefense}` : ""}`;
      }
      // 교량과 부교는 그림이 달라야 한다. 하나는 돌기둥에 얹힌 트러스 다리고
      // 하나는 물에 띄운 널판이다 — 생김새가 같으면 어느 쪽이 한 방에 끊기는지
      // 플레이어가 클릭해 보기 전에는 알 수 없다.
      const deck = deckAt(x, y);
      if (deck) cell.classList.add(deck.type, `deck-${deckOrientation(x, y)}`);
      if (hasImprovement(x, y, "rail")) cell.classList.add("rail");
      if (hasImprovement(x, y, "depot")) cell.classList.add("depot");
      // 대대 사령부의 주 역할은 보급이다. 그런데 그 범위가 지도에 안 보이면
      // 플레이어는 기능 자체가 없는 줄 안다. 전진 보급 반경을 늘 그려둔다.
      const battalionReach = battalionSupplyReach("player", x, y);
      if (battalionReach) {
        cell.classList.add(`hq-${battalionReach}`);
        cell.title += battalionReach === "recovery" ? " / 대대 보충 범위" : " / 대대 보급 범위";
      }
      const coverBand = coverage?.field.get(posKey(x, y));
      if (coverBand) {
        cell.classList.add("supply-cover", `supply-cover-${coverBand}`, `supply-cover-${coverage.owner}`);
        cell.title += ` / ${supplyCoverLabel(coverage.kind, coverBand, coverage.owner)}`;
        // 보급권은 칸 테두리가 아니라 칸 안에 깔린 판 한 장으로 그린다. 처음에는
        // box-shadow로 그렸는데 지도 모드의 `.map-enabled .tile { box-shadow: none }`이
        // 더 강해서 한 칸도 안 보였다 — 카드에는 숫자가 뜨는데 지도는 텅 빈 꼴이었다.
        // 자식 요소는 그 규칙과 무관하고, 덤으로 이동·공격 테두리와도 안 겹친다.
        const wash = document.createElement("span");
        wash.className = "supply-wash";
        cell.appendChild(wash);
      }
      if (highlights.moves.has(posKey(x, y))) cell.classList.add("reachable");
      if (highlights.attacks.has(posKey(x, y))) cell.classList.add("attackable");
      if (highlights.raids.has(posKey(x, y))) cell.classList.add("raidable");
      if (selectedUnit()?.x === x && selectedUnit()?.y === y) cell.classList.add("selected");
      cell.addEventListener("click", () => handleTileClick(x, y));

      const base = getBaseAt(x, y);
      if (base) renderBase(cell, base);

      const objective = objectiveAt(x, y);
      if (objective) renderObjective(cell, objective);

      renderImprovements(cell, x, y);

      // 안개는 땅이 아니라 사람을 가린다. 지형·거점·목표는 지도에 그려진 것이니 늘 보이고,
      // 가려지는 것은 그 위에 선 적과 적이 파는 공사뿐이다. 안 보이는 칸은 색을 죽여
      // "여긴 지금 아무도 안 보고 있다"를 한눈에 알린다.
      const lit = !fogOfWar || seen.has(posKey(x, y));
      if (!lit) {
        cell.classList.add("fogged");
        // 지금 명령을 고르는 중인 칸은 안개를 걷는다. 흐려 보이면 선택 자체가
        // 어려워진다. 완전히 걷지 않고 3분의 1만 남겨 "여기도 안 보이는 곳"은 알린다.
        const picking =
          cell.classList.contains("reachable") ||
          cell.classList.contains("attackable") ||
          cell.classList.contains("raidable") ||
          cell.classList.contains("selected");
        fogAlpha[y * width + x] = picking ? 0.33 : 1;
      }

      const construction = getConstructionAt(x, y);
      if (construction && (lit || construction.owner === "player")) renderConstruction(cell, construction);

      const units = getUnitsAt(x, y).filter((unit) => unitVisibleTo(unit, "player"));
      if (units.length) {
        cell.classList.add("occupied");
        renderUnitStack(cell, units);
      } else if (fogOfWar && ghosts.has(posKey(x, y))) {
        // 마지막으로 본 자리. 지금 거기 있다는 뜻이 아니라 "거기서 봤다"는 뜻이다 —
        // 그래서 실루엣만 흐리게 남긴다. 이 표시가 없으면 적은 사라지는 게 아니라
        // 존재한 적도 없는 것이 되어, 플레이어가 세울 수 있는 계획이 없어진다.
        cell.classList.add("contact-memory");
        const memo = ghosts.get(posKey(x, y));
        const ghost = document.createElement("div");
        ghost.className = `unit ghost ${memo.owner} ${sideKeyForUnit(memo.owner)} ${memo.type}`;
        const ghostIcon = document.createElement("span");
        ghostIcon.className = `unit-icon ${memo.type} ${memo.owner} ${sideKeyForUnit(memo.owner)}`;
        ghost.appendChild(ghostIcon);
        ghost.title = `${sideUnitLabel(memo.owner, memo.type)} 목격 지점 (${state.turn - memo.turn}일 전)`;
        cell.appendChild(ghost);
      }

      boardEl.appendChild(cell);
    }
  }

  applyFogBlanket(fogAlpha, width, height);
  // 지령은 무전 창을 그리기 전에 넣는다. 그려 놓고 넣으면 방금 내려온 지령이
  // 한 박자 뒤 화면에나 뜬다.
  issueOrders();
  updatePanel();
  localizeRenderedText();
  // 부대를 다 그린 다음에 잰다. 그리기 전에는 방금 고른 부대가 판 위에 없어서
  // 자리를 잴 수가 없다.
  placeCardAwayFromUnit();
  const moveAnimationDelay = playUnitMoveAnimations();
  playCombatAnimations(moveAnimationDelay);
  // 음악은 화면을 다시 그릴 때마다 제 자리를 확인한다. 부대가 한 칸 움직여
  // 시야가 열리는 그 순간이 곧 화면을 다시 그리는 순간이기 때문이다.
  musicUpdate();
  // 첫 판 안내는 화면이 바뀔 때마다 "이제 다음 걸 배울 차례인가"를 스스로 본다.
  // 클릭 자리마다 안내를 부르지 않는 이유는, 그러면 조작 하나를 새로 만들 때마다
  // 안내를 부르는 줄도 같이 넣어야 하고 언젠가 빼먹기 때문이다.
  storageNoticeSync();
  coachSync();
}

// 판에 깔린 그림(operation-map.svg)은 어느 작전에서나 같은 한 장이다. 예전에는
// 거기 노르망디 지명이 박혀 있어서, 엘 알라메인 사막에서도 「CAEN」이 보였다.
// 이제 자리는 코드가 정하고 이름은 작전이 들고 온다. 자리는 그림 속 마을 점과
// 물길에 맞춰 잡은 값이라 작전이 바뀌어도 그대로 두고 이름만 갈아 끼운다.
const MAP_LABEL_SLOTS = {
  // 위쪽 물줄기/바다 띠 — 큰 글자, 자간 넓게.
  sea: { x: 700, y: 112, size: 44, weight: 700, track: 7 },
  // 좌우 지방 이름.
  west: { x: 200, y: 760, size: 36, weight: 700, track: 3 },
  east: { x: 1240, y: 660, size: 36, weight: 700, track: 3 },
  // 판 전체를 부르는 이름. 가장 큰 글자.
  region: { x: 1005, y: 1395, size: 68, weight: 800, track: 4 },
  // 중심 도시.
  city: { x: 610, y: 1065, size: 38, weight: 700, track: 0 },
};

// 마을 이름이 앉는 자리. 그림의 점 일곱 개 중 여섯 개 옆이다.
const MAP_TOWN_SLOTS = [
  { x: 228, y: 1092 },
  { x: 452, y: 944 },
  { x: 1284, y: 880 },
  { x: 1508, y: 1010 },
  { x: 1648, y: 1180 },
  { x: 1780, y: 1372 },
];

function renderMapLabels() {
  const labels = activeScenario?.mapLabels;
  if (!labels) return;

  const NS = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(NS, "g");
  const put = (slot, text, size) => {
    if (!text) return;
    const node = document.createElementNS(NS, "text");
    node.setAttribute("x", String(slot.x));
    node.setAttribute("y", String(slot.y));
    node.setAttribute("font-size", String(size ?? slot.size));
    node.setAttribute("font-weight", String(slot.weight ?? 400));
    if (slot.track) node.setAttribute("letter-spacing", String(slot.track));
    node.textContent = text;
    group.appendChild(node);
  };

  Object.entries(MAP_LABEL_SLOTS).forEach(([key, slot]) => put(slot, labels[key]));
  (labels.towns ?? []).forEach((town, index) => {
    const slot = MAP_TOWN_SLOTS[index];
    if (slot) put({ ...slot, weight: 400 }, town, 26);
  });
  if (!group.childNodes.length) return;

  // 판 배경은 center/cover로 깔린다. 글자도 같은 방식으로 잘려야 지명이 그림 속
  // 제자리에 앉는다 — SVG에서 cover에 해당하는 말이 slice다.
  const layer = document.createElementNS(NS, "svg");
  layer.setAttribute("class", "map-labels");
  layer.setAttribute("viewBox", "0 0 2000 1600");
  layer.setAttribute("preserveAspectRatio", "xMidYMid slice");
  layer.setAttribute("aria-hidden", "true");
  layer.appendChild(group);
  boardEl.appendChild(layer);
}

function renderBase(cell, base) {
  cell.title += ` / ${sideName(base.owner)} 생산 ${formatNumber(baseProduction(base))}, 효율 ${Math.round(base.efficiency * 100)}%`;

  // 지도 모드에서 거점은 여태 아무것도 그리지 않았다. `.map-enabled .tile`이 배경을 지우고
  // `.tile.base::after`까지 꺼 놓아서, 남는 건 구석의 점 하나와 숫자뿐이었다 — 게임의 중심이
  // 되는 칸이 개활지와 구분이 안 됐다는 뜻이다. 자식 요소는 그 규칙들과 무관하므로,
  // 보급권을 면으로 그릴 때 쓴 수법을 그대로 쓴다. 소유에 따라 색이 달라져서
  // 무주공산 거점은 회색으로 남고, 그 회색이 곧 "가서 밟으라"는 표시가 된다.
  const depot = document.createElement("span");
  depot.className = `depot-mark ${base.owner}`;
  cell.appendChild(depot);

  const mark = document.createElement("span");
  mark.className = `owner-mark ${base.owner}`;
  cell.appendChild(mark);

  const supply = document.createElement("span");
  supply.className = "supply-rate";
  supply.textContent = formatNumber(baseProduction(base));
  cell.appendChild(supply);
}

function renderObjective(cell, objective) {
  const need = objectiveHoldRequirement(objective);
  cell.classList.add("objective", `objective-${objective.owner}`);
  if (objective.held > 0) cell.classList.add("objective-held");
  cell.title += t(" / {side} {label} · 유지 {held}/{need}턴{only}", {
    side: sideName(objective.owner),
    label: t(objective.label),
    held: objective.held,
    need,
    only: objectiveNoteText(objective, { byTag: true }),
  });

  const flag = document.createElement("span");
  flag.className = `objective-flag ${objective.owner}`;
  flag.setAttribute("aria-hidden", "true");
  cell.appendChild(flag);

  const badge = document.createElement("span");
  badge.className = `objective-badge ${objective.owner}`;
  badge.textContent = objective.held > 0 ? `${objective.held}/${need}` : t("목표");
  cell.appendChild(badge);
}

function renderConstruction(cell, construction) {
  const site = document.createElement("span");
  site.className = `construction-site ${construction.type}`;
  cell.appendChild(site);

  const badge = document.createElement("span");
  badge.className = `construction-badge ${construction.type}`;
  badge.textContent = `${constructionLabel(construction.type)} ${construction.remaining}`;
  cell.appendChild(badge);
}

function renderImprovements(cell, x, y) {
  const improvements = ["roadBridge", "bridge", "rail", "depot"].filter((type) => hasImprovement(x, y, type));
  improvements.forEach((type) => {
    const mark = document.createElement("span");
    mark.className = `improvement ${type}`;
    mark.setAttribute("aria-hidden", "true");
    cell.appendChild(mark);
  });
  // 다리도 맞으면 깎인다. 남은 체력이 안 보이면 "저 다리 한 번 더 때리면 끊기나"를
  // 플레이어가 알 수 없고, 그러면 다리를 끊을지 건널지 고를 수가 없다.
  const deck = deckAt(x, y);
  if (deck && deck.hp < deck.maxHp) {
    const bar = document.createElement("span");
    bar.className = "deck-hp";
    bar.style.setProperty("--deck-hp", `${Math.max(0, deck.hp / deck.maxHp) * 100}%`);
    bar.setAttribute("aria-hidden", "true");
    cell.appendChild(bar);
  }
}

function renderUnitStack(cell, units) {
  const unit = units[0];
  const supply = supplyStatus(unit);
  const constructing = Boolean(activeConstructionForBuilder(unit));
  const unitEl = document.createElement("div");
  const sideClass = sideKeyForUnit(unit);
  unitEl.className = `unit ${unit.owner} ${sideClass} ${unit.type} supply-${supply.level} ${unit.towed ? "towed" : ""} ${unit.acted ? "waited" : ""} ${constructing ? "constructing" : ""}`;
  unitEl.dataset.unitId = unit.id;
  // 미션이 특정 부대를 지목했으면(구조 대상 등) 그 부대는 한눈에 구분돼야 한다.
  const missionRole = missionRoleFor(unit);
  if (missionRole) unitEl.classList.add("mission-unit");
  const baseLabel = `${sideUnitLabel(unit)} / ${supply.label}${missionRole ? ` / ${missionRole}` : ""}`;
  const forecast = attackForecast(selectedUnit(), unit);
  const forecastText = forecast ? formatAttackForecast(forecast) : "";
  unitEl.setAttribute("aria-label", forecast ? `${baseLabel} / ${forecastText}` : baseLabel);
  unitEl.title = forecast ? `${baseLabel}\n${forecastText}` : baseLabel;
  if (forecast?.counterKills) unitEl.classList.add("counter-lethal");
  else if (forecast?.counter) unitEl.classList.add("counter-risk");
  const icon = document.createElement("span");
  icon.className = `unit-icon ${unit.type} ${unit.owner} ${sideClass}`;
  unitEl.appendChild(icon);
  const hp = document.createElement("span");
  hp.className = "hp";
  hp.textContent = unit.hp;
  unitEl.appendChild(hp);
  // 보급 상태 배지. 상태에 따른 점선 테두리는 .unit에 그려지는데, 부대 아이콘이
  // translateZ로 앞에 떠 있어서 그 테두리를 덮어버린다 — 즉 규칙은 살아 있어도
  // 화면에서는 안 보인다. 보급이 이 게임의 중심 자원인데 그 상태를 눈으로 못 읽으면
  // 플레이어는 부대가 죽고 나서야 안다. 그래서 아이콘 바깥 모서리에 따로 세운다.
  if (supply.level !== "full") {
    const flag = document.createElement("span");
    flag.className = `supply-flag ${supply.level}`;
    flag.textContent = supplyFlagMark(supply.level);
    flag.setAttribute("aria-hidden", "true");
    unitEl.appendChild(flag);
  }
  if (units.length > 1) {
    const stack = document.createElement("span");
    stack.className = "stack-count";
    stack.textContent = `x${units.length}`;
    unitEl.appendChild(stack);
  }
  cell.appendChild(unitEl);
}

// 배지 글자는 한 칸이다. 타일이 작아지면 두 글자는 읽히지 않는다.
// 자세한 상태 문구는 이미 툴팁(unitEl.title)과 부대 카드에 있으니,
// 여기서는 "지금 어느 단계인가"만 구분되면 된다.
function supplyFlagMark(level) {
  if (level === "isolated") return "포";
  if (level === "cut") return "끊";
  return "불";
}

// 한 칸을 지나는 데 걸리는 시간(ms). 걸음 수에 곱해서 전체 이동 시간이 나온다.
// 짧으면 순간이동처럼 보이고, 길면 적 턴에 부대가 줄줄이 걸어가는 걸 지켜봐야 한다.
const unitStepTime = 165;

function recordUnitMove(unit, toX, toY) {
  if (unit.x === toX && unit.y === toY) return;
  pendingUnitMoves.push({
    id: unit.id,
    owner: unit.owner,
    type: unit.type,
    fromX: unit.x,
    fromY: unit.y,
    toX,
    toY,
    // 경로는 지금 뽑아야 한다. 이 함수가 돌아가자마자 호출자가 unit.x를 도착점으로
    // 덮어써서, 그 뒤에는 어디서 출발했는지조차 남지 않는다.
    path: movementPath(unit, toX, toY),
  });
}

// 부대는 실제로 지나간 칸을 순서대로 밟는다. 예전에는 출발점에서 도착점까지 그냥
// 직선으로 미끄러졌다 — 그래서 고지를 못 넘는 전차가 화면에서는 고지를 가로질렀고,
// 다리 없는 강 위를 부대가 지나갔다. 눈에 보이는 것과 규칙이 서로 다른 말을 했다.
function playUnitMoveAnimations() {
  if (!pendingUnitMoves.length) return 0;
  const moves = pendingUnitMoves;
  pendingUnitMoves = [];
  const movementPlans = moves.map((move) => {
    const path = move.path?.length > 1 ? move.path : [{ x: move.fromX, y: move.fromY }, { x: move.toX, y: move.toY }];
    // 시간은 걸음 수로 잰다. 직선거리로 재면 멀리 돌아간 부대가 같은 시간에 도착해서,
    // 두 배 먼 길을 두 배 빨리 달리는 것처럼 보인다.
    const steps = path.length - 1;
    return { ...move, path, stepTime: unitStepTime, duration: clamp(240 + steps * unitStepTime, 380, 1600) };
  });
  const longestDuration = Math.max(...movementPlans.map((move) => move.duration), 0);

  window.requestAnimationFrame(() => {
    movementPlans.forEach((move) => {
      const unitEl = findUnitElement(move.id);
      const tiles = move.path.map((spot) => tileElementAt(spot.x, spot.y));
      if (!unitEl || tiles.some((tile) => !tile)) return;

      const points = tiles.map((tile) => {
        const rect = tile.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      const unitRect = unitEl.getBoundingClientRect();
      const ghost = unitEl.cloneNode(true);
      ghost.classList.add("unit-move-ghost");
      ghost.style.left = `${points[0].x - unitRect.width / 2}px`;
      ghost.style.top = `${points[0].y - unitRect.height / 2}px`;
      ghost.style.width = `${unitRect.width}px`;
      ghost.style.height = `${unitRect.height}px`;
      // 아이콘의 위아래 흔들림은 한 걸음에 한 번씩 돈다. 이동 전체에 한 번만 흔들리면
      // 긴 이동이 미끄러지는 판때기처럼 보인다.
      ghost.style.setProperty("--step-duration", `${move.stepTime}ms`);
      document.body.appendChild(ghost);
      playUnitSound(move, "move");

      animateAlongPath(ghost, points, move.duration);

      unitEl.classList.add("unit-arriving-hidden");
      window.setTimeout(() => {
        unitEl.classList.remove("unit-arriving-hidden");
        ghost.remove();
      }, move.duration);
    });
  });

  // 전투는 이동이 끝난 뒤에 시작한다. 다만 여기서 너무 오래 기다리면 적 턴 전체가
  // 늘어지므로, 이동이 길어도 상한을 둔다.
  return Math.min(720, longestDuration || 0);
}

// 각 칸에 도착하는 시각은 남은 거리에 비례해서 정한다. 칸마다 같은 시간을 주면
// 꺾이는 지점마다 속도가 튄다. 가감속은 경로 전체에 한 번만 준다 — 걸음마다
// 서고 다시 출발하면 그게 예전의 그 끊김이다.
function animateAlongPath(element, points, duration) {
  if (typeof element.animate !== "function") return;
  const legs = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const total = legs.reduce((sum, leg) => sum + leg, 0);
  if (!total) return;

  let travelled = 0;
  const frames = points.map((point, index) => {
    if (index > 0) travelled += legs[index - 1];
    const dx = point.x - points[0].x;
    const dy = point.y - points[0].y;
    // 진행 방향으로 살짝 기운다. 꺾이는 칸에서 기울기가 바뀌면서 "돌았다"가 읽힌다.
    const lean = index === 0 ? 0 : clamp((point.x - points[index - 1].x) * 0.08, -3, 3);
    return {
      offset: clamp(travelled / total, 0, 1),
      transform: `translate(${dx}px, ${dy}px) rotate(${(-1 + lean).toFixed(2)}deg)`,
      easing: "linear",
    };
  });

  element.animate(frames, { duration, easing: "cubic-bezier(0.4, 0, 0.28, 1)", fill: "both" });
}

function tileElementAt(x, y) {
  return boardEl.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
}

// ── 전투 연출 ───────────────────────────────────────────────────────────────
// 병종마다 무기가 다르면 그림도 달라야 한다. 예전에는 "야포냐 아니냐" 불리언
// 하나뿐이라, 소총분대와 중형전차와 공병대가 전부 똑같은 흰 선을 그었다.
// 전투 로그를 읽기 전에는 무엇이 나를 때렸는지 알 수 없었다.
//
// 여기 있는 값은 전부 그림에만 쓰인다. 피해량은 combatDamage 하나가 정하고,
// 이 표는 그 결과를 어떻게 보여줄지만 정한다 — 그래서 에디터에 올리지 않는다.
const unitWeapons = {
  infantry: "rifle",
  armor: "cannon",
  artillery: "howitzer",
  spArtillery: "howitzer",
  engineer: "charge",
  battalionHQ: "sidearm",
};

// shots    한 번의 교전에서 나가는 발수. 소총은 점사, 전차 주포는 한 발.
// shotGap  점사 간격(ms).
// stepTime 한 칸을 나는 데 걸리는 시간(ms). 0이면 날아가는 것이 없다(근접).
//          사거리 3 야포는 이 값 때문에 실제로 한참 뒤에 떨어진다.
// arc      포탄이 그리는 곡선의 높이. 칸 하나를 1로 본다. 0이면 직사.
// burst    착탄 연출의 크기 배수.
// shards   튀는 파편 수.
// shake    화면 흔들림 세기. 0이면 흔들지 않는다.
// embers   튀어 오르는 불티 수. 파편과 달리 포물선을 그리고 떨어진다.
const weaponProfiles = {
  rifle: { shots: 3, shotGap: 66, stepTime: 22, arc: 0, burst: 0.74, shards: 4, embers: 4, shake: 0 },
  cannon: { shots: 1, shotGap: 0, stepTime: 40, arc: 0.16, burst: 1.2, shards: 9, embers: 8, shake: 1 },
  howitzer: { shots: 1, shotGap: 0, stepTime: 128, arc: 0.9, burst: 1.48, shards: 12, embers: 11, shake: 1 },
  charge: { shots: 1, shotGap: 0, stepTime: 0, arc: 0, burst: 1.02, shards: 8, embers: 7, shake: 1 },
  sidearm: { shots: 2, shotGap: 86, stepTime: 20, arc: 0, burst: 0.5, shards: 3, embers: 3, shake: 0 },
};

// 반격은 공격이 끝난 뒤에 나가야 반격으로 읽힌다. 같은 프레임에 같이 터지면
// 둘 중 누가 먼저 쐈는지 화면만 봐서는 알 수 없다.
const counterAnimationPause = 300;
// 한 턴에 여러 부대가 쏠 때 조금씩 어긋나게 낸다. 완전히 동시에 터지면 화면이
// 한 번 번쩍이고 끝나서 몇 번의 교전이 있었는지 세지지 않는다.
const combatEventStagger = 110;

function weaponFor(unit) {
  return unitWeapons[unit?.type] ?? "rifle";
}

function recordCombatEvent(attacker, target, options = {}) {
  pendingCombatEvents.push({
    attackerId: attacker.id,
    attackerX: attacker.x,
    attackerY: attacker.y,
    targetId: target.id ?? null,
    targetX: target.x,
    targetY: target.y,
    weapon: weaponFor(attacker),
    artillery: isArtilleryUnit(attacker),
    killed: Boolean(options.killed),
    damage: options.damage ?? null,
    base: Boolean(options.base),
    // 반격 표시는 호출하는 쪽에서 줄곧 넘어오고 있었는데 여기서 조용히 버려졌다.
    // 그래서 반격이 공격과 한 글자도 다르지 않게 생겼다.
    counter: Boolean(options.counter),
  });
}

function playCombatAnimations(delay = 0) {
  if (!pendingCombatEvents.length) return;
  const events = pendingCombatEvents;
  pendingCombatEvents = [];

  let lastAttackStart = delay;
  let nextStart = delay;
  const timeline = events.map((event) => {
    const start = event.counter ? lastAttackStart + counterAnimationPause : nextStart;
    if (!event.counter) lastAttackStart = start;
    nextStart = Math.max(nextStart, start + combatEventStagger);
    return { event, start };
  });

  timeline.forEach(({ event, start }) => {
    const run = () => window.requestAnimationFrame(() => playCombatEvent(event));
    if (start > 0) window.setTimeout(run, start);
    else run();
  });
}

// 한 번의 교전은 세 박자다: 쏘고 → 날아가고 → 맞는다. 예전에는 셋이 같은 프레임에
// 시작해서, 세 칸 밖의 야포가 쏘는 순간 이미 착탄해 있었다.
function playCombatEvent(event) {
  const fromTile = tileElementAt(event.attackerX, event.attackerY);
  const toTile = tileElementAt(event.targetX, event.targetY);
  if (!fromTile || !toTile) return;

  const profile = weaponProfiles[event.weapon] ?? weaponProfiles.rifle;
  const from = boardPoint(fromTile);
  const to = boardPoint(toTile);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const tileSpan = Math.max(1, Math.hypot(event.targetX - event.attackerX, event.targetY - event.attackerY));
  const flight = Math.round(profile.stepTime * tileSpan);
  // 반격은 한 급 작게 낸다. 위력도 절반(counterattackFactor)이므로 그림도 그래야 한다.
  const scale = effectScale(toTile) * profile.burst * (event.counter ? 0.78 : 1);

  const attackerEl = findUnitElement(event.attackerId);
  const defenderEl = findUnitElement(event.targetId);

  // 방향은 여기서 픽셀로 바꿔서 넘긴다. CSS 안에서 cos()/sin()을 쓸 수도 있지만,
  // 그 함수를 모르는 브라우저에서는 transform 값 전체가 무효가 되어 애니메이션이
  // 통째로 사라진다. 픽셀은 어디서나 픽셀이다.
  const kick = Math.max(2, from.w * 0.11);
  if (attackerEl) {
    attackerEl.style.setProperty("--fire-x", `${(-Math.cos(angle) * kick).toFixed(2)}px`);
    attackerEl.style.setProperty("--fire-y", `${(-Math.sin(angle) * kick).toFixed(2)}px`);
    attackerEl.style.setProperty("--lunge-x", `${(Math.cos(angle) * kick * 1.6).toFixed(2)}px`);
    attackerEl.style.setProperty("--lunge-y", `${(Math.sin(angle) * kick * 1.6).toFixed(2)}px`);
    addTempClass(attackerEl, `fx-fire-${event.weapon}`, 560);
    if (event.counter) addTempClass(attackerEl, "fx-fire-counter", 560);
  }

  if (profile.stepTime > 0) spawnMuzzleFlash(from, angle, event, scale);

  for (let shot = 0; shot < profile.shots; shot += 1) {
    const finalShot = shot === profile.shots - 1;
    window.setTimeout(() => {
      if (profile.stepTime > 0) spawnProjectile(from, to, angle, flight, profile, event, scale);
      window.setTimeout(() => {
        if (!finalShot) {
          spawnImpact(to, toTile, angle, { ...profile, shards: 1 }, { ...event, killed: false, damage: null }, scale * 0.5);
          return;
        }
        if (defenderEl) {
          const push = Math.max(3, to.w * 0.17);
          defenderEl.style.setProperty("--hit-x", `${(Math.cos(angle) * push).toFixed(2)}px`);
          defenderEl.style.setProperty("--hit-y", `${(Math.sin(angle) * push).toFixed(2)}px`);
          addTempClass(defenderEl, event.counter ? "fx-hit-counter" : "fx-hit", 460);
        }
        spawnImpact(to, toTile, angle, profile, event, scale);
        if (event.killed) shakeBoard("heavy");
        else if (profile.shake && !event.counter) shakeBoard("light");
      }, flight);
    }, shot * profile.shotGap);
  }
}

// 판은 58도로 눕혀져 있다(styles.css의 .battlefield transform). 그래서 화면 좌표와
// 판 안쪽 좌표가 다르다 — 화면에서 잰 타일 높이는 실제의 절반쯤이다.
// 예전 코드는 getBoundingClientRect(화면 좌표)로 재서 left/top(판 좌표)에 넣었다.
// 그래서 착탄 효과가 맞은 타일 위가 아니라 그 아래 어딘가에서 터졌고, 멀리 있는
// 칸일수록 더 많이 어긋났다. offsetLeft/offsetTop은 처음부터 판 좌표라 어긋나지 않는다.
function boardPoint(tile) {
  return {
    x: tile.offsetLeft + tile.offsetWidth / 2,
    y: tile.offsetTop + tile.offsetHeight / 2,
    w: tile.offsetWidth,
    h: tile.offsetHeight,
  };
}

// 타일은 화면 크기와 지도 크기에 따라 작아진다. 효과 크기를 픽셀로 못 박으면
// 좁은 화면에서는 폭발이 세 칸을 덮고, 넓은 화면에서는 점만 해진다.
function effectScale(tile) {
  return clamp(tile.offsetWidth / 46, 0.5, 1.8);
}

function findUnitElement(id) {
  if (!id) return null;
  return Array.from(boardEl.querySelectorAll(".unit")).find((element) => element.dataset.unitId === id) ?? null;
}

function addTempClass(element, className, life) {
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), life);
}

// 격파는 판이 흔들릴 만한 일이다. 다만 흔들림은 멀미의 지름길이라 크기는 작게,
// 시간은 짧게 둔다. 움직임을 줄이겠다고 한 사용자에게는 CSS가 통째로 끈다.
function shakeBoard(strength) {
  if (!boardEl) return;
  addTempClass(boardEl, `fx-shake-${strength}`, strength === "heavy" ? 520 : 260);
}

// 격파 순간의 화면 번쩍임. 여러 부대가 한 턴에 격파되면 번쩍임도 겹치는데,
// 두 장이 포개지면 두 배로 하얘져서 판이 안 보인다. 한 장만 유지한다.
function flashBoard() {
  if (!boardEl) return;
  boardEl.querySelectorAll(".fx-blast").forEach((old) => old.remove());
  const blast = document.createElement("span");
  blast.className = "fx-blast";
  blast.setAttribute("aria-hidden", "true");
  boardEl.appendChild(blast);
  window.setTimeout(() => blast.remove(), 220);
}

function spawnEffect(className, x, y, life, styles = {}) {
  const element = document.createElement("span");
  element.className = className;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  Object.entries(styles).forEach(([name, value]) => element.style.setProperty(name, value));
  boardEl.appendChild(element);
  window.setTimeout(() => element.remove(), life);
  return element;
}

// 총구 화염. 쏜 부대가 어느 쪽을 보고 쐈는지가 여기서 정해진다.
function spawnMuzzleFlash(from, angle, event, scale) {
  const reach = from.w * 0.3;
  spawnEffect(
    `fx-muzzle fx-${event.weapon}${event.counter ? " fx-counter" : ""}`,
    from.x + Math.cos(angle) * reach,
    from.y + Math.sin(angle) * reach,
    260,
    { "--fx-angle": `${angle}rad`, "--fx-scale": scale.toFixed(3) },
  );
}

// 실제로 날아가는 포탄. 예전에는 선 하나를 clip-path로 쓸어냈을 뿐이라, 사거리 3
// 곡사포가 레이저처럼 보였다. 곡사는 arc 값만큼 위로 떠서 포물선을 그린다.
function spawnProjectile(from, to, angle, flight, profile, event, scale) {
  const shot = spawnEffect(
    `fx-shot fx-${event.weapon}${event.counter ? " fx-counter" : ""}`,
    from.x,
    from.y,
    flight + 90,
    { "--fx-angle": `${angle}rad`, "--fx-scale": scale.toFixed(3) },
  );
  if (typeof shot.animate !== "function") return;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // 포물선은 중간 지점을 위로 들어 올려서 만든다. 세 점이면 충분하다 —
  // 브라우저가 사이를 이어 준다.
  const lift = profile.arc * from.h * 1.6;
  shot.animate(
    [
      { offset: 0, transform: `translate(-50%, -50%) rotate(${angle}rad) scale(${scale})`, opacity: 0.2 },
      { offset: 0.12, opacity: 1 },
      {
        offset: 0.5,
        transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - lift}px)) rotate(${angle - profile.arc * 0.45}rad) scale(${scale * 1.06})`,
      },
      { offset: 1, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${angle + profile.arc * 0.5}rad) scale(${scale})`, opacity: 1 },
    ],
    { duration: Math.max(60, flight), easing: profile.arc > 0 ? "cubic-bezier(0.35, 0, 0.65, 1)" : "linear", fill: "both" },
  );
}

// 착탄. 층을 나눠 쌓는다 — 섬광이 먼저 꺼지고, 불덩이가 뜨고, 충격파가 퍼지고,
// 먼지가 지면을 훑고, 파편과 불티가 흩어지고, 연기가 마지막까지 남는다.
// 층마다 시작과 끝이 달라야 폭발로 읽힌다. 전부 같은 시간에 나타났다 사라지면
// 그건 폭발이 아니라 도형 하나가 깜빡인 것이다.
//
// 격파는 여기서 한 급이 아니라 두 급 위다: 화주가 솟고, 연기가 세 뭉치로 피어오르고,
// 큰 잔해가 텀블링하며 떨어지고, 판 전체가 한 번 번쩍인다. 부대 하나가 사라지는
// 일이니 화면에서도 그만큼의 사건이어야 한다.
function spawnImpact(to, tile, angle, profile, event, scale) {
  const kind = event.base ? "base" : event.killed ? "kill" : "hit";
  const life = event.killed ? 2300 : 900;
  const impact = spawnEffect(
    `fx-impact fx-${kind} fx-${event.weapon}${event.counter ? " fx-counter" : ""}`,
    to.x,
    to.y,
    life,
    { "--fx-angle": `${angle}rad`, "--fx-scale": scale.toFixed(3) },
  );

  // 빛무리는 섬광보다 넓고 흐리다. 폭발이 주변을 잠깐 밝히는 것처럼 보이게 하는
  // 유일한 층이라, 이게 없으면 불덩이가 배경에서 오려 붙인 스티커처럼 뜬다.
  impact.appendChild(makeLayer("fx-glow"));
  impact.appendChild(makeLayer("fx-flash"));
  impact.appendChild(makeLayer("fx-fire"));

  // 불길. 화구는 이제 뿌리일 뿐이고 폭발의 몸통은 여기서 뻗어 나간다.
  // 동그란 화구 하나가 커졌다 사라지는 것은 아무리 색을 겹쳐도 장난감으로 보인다 —
  // 터지는 것에 컴퍼스로 그린 테두리가 있을 리 없기 때문이다. 갈래마다 길이와
  // 굵기와 방향과 시작 시각을 다르게 줘서, 같은 폭발이 두 번 나오지 않게 한다.
  const flames = event.killed ? 10 : 6;
  for (let index = 0; index < flames; index += 1) {
    // 고르게 돌려 두고 한 갈래씩 흔든다. 방향을 통째로 무작위로 뽑으면 우연히
    // 한쪽에 몰려서 반쪽만 타는 폭발이 나온다.
    const heading = (index / flames) * 360 + (Math.random() - 0.5) * (320 / flames);
    // 화면 기준 위쪽(-90도)에 가까울수록 길게 뻗는다. 불은 땅속으로 자라지 않는다.
    const lift = Math.max(0, Math.cos(((heading + 90) * Math.PI) / 180));
    const reach = (0.58 + Math.random() * 0.5 + lift * 0.5) * to.w * 0.6 * scale;
    impact.appendChild(makeLayer("fx-flame", {
      "--flame-angle": `${heading.toFixed(1)}deg`,
      "--flame-len": `${reach.toFixed(1)}px`,
      // 굵기는 길이에 매단다. 굵기를 따로 뽑으면 짧고 뚱뚱한 갈래가 섞여
      // 불길이 아니라 꽃잎처럼 보인다.
      "--flame-girth": `${(reach * (0.34 + Math.random() * 0.18)).toFixed(1)}px`,
      "--flame-delay": `${Math.round(Math.random() * 70)}ms`,
    }));
  }

  impact.appendChild(makeLayer("fx-ring"));
  // 먼지는 지면에 붙어 넓게 퍼진다. 충격파 고리가 "압력"이라면 이쪽은 "흙"이다.
  impact.appendChild(makeLayer("fx-dust"));

  const shards = profile.shards + (event.killed ? 6 : 0);
  // 파편은 착탄 방향을 중심으로 부채꼴로 튄다. 뒤로도 조금 튀어야 폭발로 보인다.
  for (let index = 0; index < shards; index += 1) {
    const spread = (Math.random() - 0.5) * Math.PI * 1.5;
    const shardAngle = angle + spread;
    const distance = (0.45 + Math.random() * 0.85) * to.w * 0.7 * scale;
    impact.appendChild(makeLayer("fx-shard", {
      "--shard-x": `${Math.cos(shardAngle) * distance}px`,
      "--shard-y": `${Math.sin(shardAngle) * distance - to.h * 0.18}px`,
      "--shard-delay": `${Math.round(Math.random() * 60)}ms`,
      "--shard-spin": `${Math.round((Math.random() - 0.5) * 540)}deg`,
    }));
  }

  // 불티는 파편과 다르다. 파편은 직선으로 튀고 불티는 솟았다가 떨어진다.
  // 이 낙하가 있어야 폭발에 무게가 생긴다 — 전부 직선으로만 뻗으면 불꽃놀이가 된다.
  const embers = (profile.embers ?? 4) + (event.killed ? 8 : 0);
  for (let index = 0; index < embers; index += 1) {
    const emberAngle = Math.random() * Math.PI * 2;
    const reach = (0.3 + Math.random() * 0.9) * to.w * 0.62 * scale;
    const rise = (0.55 + Math.random() * 0.8) * to.h * 0.9 * scale;
    impact.appendChild(makeLayer("fx-ember", {
      "--ember-x": `${Math.cos(emberAngle) * reach}px`,
      "--ember-peak": `${-rise}px`,
      "--ember-drop": `${rise * 0.35}px`,
      "--ember-delay": `${Math.round(Math.random() * 110)}ms`,
      "--ember-size": `${(2 + Math.random() * 2.4).toFixed(2)}px`,
    }));
  }

  if (event.killed) {
    // 화주. 폭발이 위로 뻗는 층이 하나는 있어야 한다 — 나머지는 전부 옆으로 퍼지는
    // 원이라, 이 세로선이 없으면 아무리 키워도 납작한 얼룩으로 보인다.
    impact.appendChild(makeLayer("fx-column"));
    // 연기는 한 덩이가 아니라 세 뭉치다. 서로 다른 시각에 다른 자리에서 피어올라야
    // 하나의 기둥으로 읽힌다. 원 하나를 키우면 그냥 커지는 원이다.
    [0, 1, 2].forEach((index) => {
      impact.appendChild(makeLayer("fx-smoke", {
        "--smoke-delay": `${index * 190}ms`,
        "--smoke-x": `${((index - 1) * 0.26 * to.w * scale).toFixed(1)}px`,
        "--smoke-size": `${(0.78 + index * 0.22).toFixed(2)}`,
      }));
    });
    // 큰 잔해. 파편보다 무겁고 느리게, 회전하면서 포물선을 그리고 떨어진다.
    for (let index = 0; index < 5; index += 1) {
      const debrisAngle = angle + (Math.random() - 0.5) * Math.PI * 1.2;
      const reach = (0.4 + Math.random() * 0.7) * to.w * 0.66 * scale;
      impact.appendChild(makeLayer("fx-debris", {
        "--debris-x": `${Math.cos(debrisAngle) * reach}px`,
        "--debris-peak": `${-(0.7 + Math.random() * 0.6) * to.h * scale}px`,
        "--debris-spin": `${Math.round((Math.random() - 0.5) * 900)}deg`,
        "--debris-delay": `${Math.round(Math.random() * 90)}ms`,
      }));
    }
    // 격파된 부대는 이 시점에 이미 판에서 지워져 있다(state에서 먼저 뺀다).
    // 그래서 "부대가 무너지는" 연출을 붙일 요소가 없다 — 잔해를 대신 세운다.
    impact.appendChild(makeLayer("fx-wreck"));
    addTempClass(tile, "fx-scorched", 2300);
    // 판 전체가 한 번 번쩍인다. 아주 짧게 — 길면 눈이 아프고, 짧으면 소리 없이도
    // "쾅" 소리가 난 것처럼 느껴진다. 클래스가 아니라 자식 한 장으로 까는 것은
    // .battlefield의 ::before/::after를 이미 지도 격자가 쓰고 있기 때문이다.
    flashBoard();
  }

  if (event.damage !== null) {
    const pill = makeLayer("fx-damage");
    pill.textContent = `-${event.damage}`;
    impact.appendChild(pill);
  }
}

function makeLayer(className, styles = {}) {
  const layer = document.createElement("span");
  layer.className = className;
  Object.entries(styles).forEach(([name, value]) => layer.style.setProperty(name, value));
  return layer;
}

function renderBalanceEditor() {
  if (!balanceEditorEl) return;
  balanceEditorEl.innerHTML = `
    <div class="editor-actions">
      <button type="button" data-editor-action="save-defaults">현재 수치를 초기값으로 저장</button>
      <button type="button" data-editor-action="reset">초기값 복원</button>
      <button type="button" data-editor-action="restart">수치 적용 후 새 작전</button>
    </div>
    <section class="editor-section">
      <h3>유닛 수치</h3>
      <div class="editor-grid">
        <div class="editor-row">
          <span class="editor-head">유닛</span>
          <span class="editor-head">체력</span>
          <span class="editor-head">기동</span>
          <span class="editor-head">공격</span>
        </div>
        ${Object.entries(unitTypes).map(([type, spec]) => renderUnitEditorRow(type, spec)).join("")}
      </div>
    </section>
    <section class="editor-section">
      <h3>게임 규칙</h3>
      <div class="editor-grid">
        ${ruleEditorFields.map(([key, label, min, max, step]) => renderRuleEditorRow(key, label, min, max, step)).join("")}
      </div>
    </section>
  `;
}

function renderUnitEditorRow(type, spec) {
  const primary = ["hp", "move", "attack"];
  const secondary = unitEditorFields.filter(([key]) => !primary.includes(key) && spec[key] !== undefined);
  return `
    <div class="editor-row">
      <span class="editor-name">${spec.label}</span>
      ${primary.map((key) => renderUnitEditorInput(type, key)).join("")}
    </div>
    ${secondary.map(([key, label]) => `
      <div class="editor-row wide">
        <label for="edit-${type}-${key}">${spec.label} ${label}</label>
        ${renderUnitEditorInput(type, key)}
      </div>
    `).join("")}
  `;
}

function renderUnitEditorInput(type, key) {
  const [, , min, max, step] = unitEditorFields.find(([field]) => field === key) ?? [key, key, 0, 999, 1];
  return `<input id="edit-${type}-${key}" type="number" min="${min}" max="${max}" step="${step}" value="${unitTypes[type][key]}" data-editor-kind="unit" data-unit-type="${type}" data-field="${key}" />`;
}

function renderRuleEditorRow(key, label, min, max, step) {
  return `
    <div class="editor-row wide">
      <label for="edit-rule-${key}">${label}</label>
      <input id="edit-rule-${key}" type="number" min="${min}" max="${max}" step="${step}" value="${ruleValue(key)}" data-editor-kind="rule" data-field="${key}" />
    </div>
  `;
}

function handleBalanceEditorInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.editorKind) return;
  const value = numericEditorValue(input);
  if (input.dataset.editorKind === "unit") {
    const type = input.dataset.unitType;
    const field = input.dataset.field;
    unitTypes[type][field] = value;
    if (field === "hp") clampUnitHp(type);
  } else {
    setRuleValue(input.dataset.field, value);
  }
  updatePanel();
  render();
}

function handleBalanceEditorClick(event) {
  const button = event.target.closest("[data-editor-action]");
  if (!button) return;
  if (button.dataset.editorAction === "reset") {
    restoreDefaultBalance();
    renderBalanceEditor();
    render();
  }
  if (button.dataset.editorAction === "save-defaults") {
    saveCurrentAsDefaultBalance();
    renderBalanceEditor();
    render();
  }
  if (button.dataset.editorAction === "restart") openNewOperationSetup();
}

function numericEditorValue(input) {
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const parsed = Number(input.value);
  const fallback = Number(input.defaultValue);
  const raw = Number.isFinite(parsed) ? parsed : fallback;
  const value = Number(input.step) >= 1 ? Math.round(raw) : raw;
  return Math.min(max, Math.max(min, value));
}

function clampUnitHp(type) {
  const maxHp = unitTypes[type].hp;
  state?.units
    .filter((unit) => unit.type === type)
    .forEach((unit) => {
      unit.hp = Math.min(unit.hp, maxHp);
    });
}

function restoreDefaultBalance() {
  Object.entries(defaultBalance.units).forEach(([type, defaults]) => {
    if (!unitTypes[type]) return;
    // 처음 박혀 있던 값을 바탕에 깔고 그 위에 초기값을 얹는다. 예전처럼 키를 전부
    // 지우고 덮어쓰면, 초기값에 없는 항목은 되돌아오는 게 아니라 아예 없어진다.
    Object.assign(
      unitTypes[type],
      JSON.parse(JSON.stringify(builtInBalance.units[type] || {})),
      JSON.parse(JSON.stringify(defaults)),
    );
  });
  Object.entries(defaultBalance.rules).forEach(([key, value]) => setRuleValue(key, value));
  state?.units.forEach((unit) => {
    unit.hp = Math.min(unit.hp, unitTypes[unit.type].hp);
  });
}

function saveCurrentAsDefaultBalance() {
  const snapshot = balanceSnapshot();
  defaultBalance.units = JSON.parse(JSON.stringify(snapshot.units));
  defaultBalance.rules = { ...snapshot.rules };
  localStorage.setItem(DEFAULT_BALANCE_STORAGE_KEY, JSON.stringify(snapshot));
  addLog(t("현행 수치 › 초기값으로 저장"));
}

// 예전에 저장해 둔 설정에는 그 뒤에 새로 생긴 값이 들어 있지 않다. 예전에는 저장본을
// 통째로 갈아끼웠기 때문에, 저장한 날 이후에 추가된 규칙은 불러오는 순간 사라졌다.
// 거점 안에서 받는 방어 버프가 없어지던 것이 그 증상이고, 유닛 쪽은 더 나빠서 —
// 키를 전부 지운 뒤 저장본을 덮어썼기 때문에 — 나중에 생긴 시야 값까지 통째로
// 날아가 전장 안개가 엉뚱하게 돌았다.
// 그래서 지금은 처음부터 박혀 있는 값을 바탕에 깔고, 저장본 중 지금도 쓰는 값만 위에
// 얹는다. 저장한 뒤에 생긴 값은 게임이 정한 제값으로 남고, 사용자가 만졌던 값은 그대로다.
function mergeSavedRules(saved) {
  const merged = { ...builtInBalance.rules };
  Object.entries(saved).forEach(([key, value]) => {
    if (key in merged && Number.isFinite(Number(value))) merged[key] = value;
  });
  return merged;
}

function mergeSavedUnits(saved) {
  const merged = JSON.parse(JSON.stringify(builtInBalance.units));
  // 에디터가 만질 수 있는 숫자만 받는다. 이름·그림 같은 건 저장본에 옛것이 들어 있어도
  // 무시한다 — 균형 설정이 병종의 정체까지 되돌리면 안 된다.
  const editable = unitEditorFields.map(([key]) => key);
  Object.entries(saved).forEach(([type, stats]) => {
    if (!merged[type] || !stats) return;
    editable.forEach((key) => {
      if (!(key in merged[type]) || !(key in stats)) return;
      if (Number.isFinite(Number(stats[key]))) merged[type][key] = stats[key];
    });
  });
  return merged;
}

function loadSavedDefaultBalance() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEFAULT_BALANCE_STORAGE_KEY));
    if (!saved?.units || !saved?.rules) return;
    defaultBalance.units = mergeSavedUnits(saved.units);
    defaultBalance.rules = mergeSavedRules(saved.rules);
    restoreDefaultBalance();
  } catch (error) {
    console.warn("Failed to load saved balance defaults", error);
  }
}

function balanceSnapshot() {
  return {
    units: JSON.parse(JSON.stringify(unitTypes)),
    rules: {
      wartimeProductionFactor,
      raidEfficiencyFactor,
      combatBaseDamage,
      baseEfficiencyFloor,
      captureEfficiencyLoss,
      maxStackSize,
      supplyRange,
      strainedSupplyRange,
      strainedSupplyMoralePenalty,
      isolatedSupplyMoralePenalty,
      isolatedAttritionDamage,
      cutSupplyMoralePenalty,
      collapseGraceTurns,
      collapseMaxDamage,
      hqSupplyRange,
      hqRecoveryRange,
      hqOutOfRangeGraceTurns,
      hqOutOfRangeMoralePenalty,
      counterattackFactor,
      operationTurnLimit,
      objectiveHoldTurns,
      enemyDepotGoal,
      enemyEngineerLimit,
      enemyRecruitSurplus,
      enemyDefenseRadius,
      deployRange,
      enemyReserveShare,
      enemyMainEffortShare,
      enemyFlankSpread,
      enemyTowDistance,
      enemyScreenRange,
      hqTrailDistance,
      hqPanicRange,
      fogOfWar,
      hillSightBonus,
      baseSightRange,
      contactMemoryTurns,
      contactHaltRange,
      enemyForwardDefense,
      baseLossGraceTurns,
      baseDefenseBonus,
      ridgeFacingDefense,
      baseRepairRate,
      baseEfficiencyRepair,
      enemyBaseSeekRange,
      depotSafeDistance,
      playerBattalionHQ: episodeLimits.playerBattalionHQ,
      enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
    },
  };
}

function ruleValue(key) {
  const values = {
    wartimeProductionFactor,
    raidEfficiencyFactor,
    combatBaseDamage,
    baseEfficiencyFloor,
    captureEfficiencyLoss,
    maxStackSize,
    supplyRange,
    strainedSupplyRange,
    strainedSupplyMoralePenalty,
    isolatedSupplyMoralePenalty,
    isolatedAttritionDamage,
    cutSupplyMoralePenalty,
    collapseGraceTurns,
    collapseMaxDamage,
    hqSupplyRange,
    hqRecoveryRange,
    hqOutOfRangeGraceTurns,
    hqOutOfRangeMoralePenalty,
    counterattackFactor,
    operationTurnLimit,
    objectiveHoldTurns,
    enemyDepotGoal,
    enemyEngineerLimit,
    enemyRecruitSurplus,
    enemyDefenseRadius,
    deployRange,
    enemyReserveShare,
    enemyMainEffortShare,
    enemyFlankSpread,
    enemyTowDistance,
    enemyScreenRange,
    hqTrailDistance,
    hqPanicRange,
    fogOfWar,
    hillSightBonus,
    baseSightRange,
    contactMemoryTurns,
    contactHaltRange,
    enemyForwardDefense,
    baseLossGraceTurns,
    baseDefenseBonus,
    ridgeFacingDefense,
    baseRepairRate,
    baseEfficiencyRepair,
    enemyBaseSeekRange,
    depotSafeDistance,
    playerBattalionHQ: episodeLimits.playerBattalionHQ,
    enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
  };
  return values[key];
}

function setRuleValue(key, value) {
  if (key === "wartimeProductionFactor") wartimeProductionFactor = value;
  if (key === "raidEfficiencyFactor") raidEfficiencyFactor = value;
  if (key === "combatBaseDamage") combatBaseDamage = value;
  if (key === "baseEfficiencyFloor") baseEfficiencyFloor = value;
  if (key === "captureEfficiencyLoss") captureEfficiencyLoss = value;
  if (key === "maxStackSize") maxStackSize = value;
  if (key === "supplyRange") supplyRange = value;
  if (key === "strainedSupplyRange") strainedSupplyRange = value;
  if (key === "strainedSupplyMoralePenalty") strainedSupplyMoralePenalty = value;
  if (key === "isolatedSupplyMoralePenalty") isolatedSupplyMoralePenalty = value;
  if (key === "isolatedAttritionDamage") isolatedAttritionDamage = value;
  if (key === "cutSupplyMoralePenalty") cutSupplyMoralePenalty = value;
  if (key === "collapseGraceTurns") collapseGraceTurns = value;
  if (key === "collapseMaxDamage") collapseMaxDamage = value;
  if (key === "hqSupplyRange") hqSupplyRange = value;
  if (key === "hqRecoveryRange") hqRecoveryRange = value;
  if (key === "hqOutOfRangeGraceTurns") hqOutOfRangeGraceTurns = value;
  if (key === "hqOutOfRangeMoralePenalty") hqOutOfRangeMoralePenalty = value;
  if (key === "counterattackFactor") counterattackFactor = value;
  if (key === "operationTurnLimit") operationTurnLimit = value;
  if (key === "objectiveHoldTurns") objectiveHoldTurns = value;
  if (key === "enemyDepotGoal") enemyDepotGoal = value;
  if (key === "enemyEngineerLimit") enemyEngineerLimit = value;
  if (key === "enemyRecruitSurplus") enemyRecruitSurplus = value;
  if (key === "enemyDefenseRadius") enemyDefenseRadius = value;
  if (key === "deployRange") deployRange = value;
  if (key === "enemyReserveShare") enemyReserveShare = value;
  if (key === "enemyMainEffortShare") enemyMainEffortShare = value;
  if (key === "enemyFlankSpread") enemyFlankSpread = value;
  if (key === "enemyTowDistance") enemyTowDistance = value;
  if (key === "enemyScreenRange") enemyScreenRange = value;
  if (key === "hqTrailDistance") hqTrailDistance = value;
  if (key === "hqPanicRange") hqPanicRange = value;
  // 시야에 얽힌 값이 바뀌면 캐시가 옛 시야를 들고 있게 된다. 열쇠는 배치만 보므로
  // 부대가 그대로면 새 값이 반영되지 않는다 — 에디터에서 슬라이더를 밀었는데
  // 지도가 그대로인 것이 이 한 줄이 없을 때의 증상이다.
  if (key === "fogOfWar") fogOfWar = value;
  if (key === "hillSightBonus") hillSightBonus = value;
  if (key === "baseSightRange") baseSightRange = value;
  if (key === "contactMemoryTurns") contactMemoryTurns = value;
  // 정지 거리는 시야 계산에 끼지 않으므로 캐시를 비울 필요가 없다.
  if (key === "contactHaltRange") contactHaltRange = value;
  if (["fogOfWar", "hillSightBonus", "baseSightRange", "contactMemoryTurns"].includes(key)) {
    visionCache = { key: "", byOwner: new Map() };
  }
  if (key === "enemyForwardDefense") enemyForwardDefense = value;
  if (key === "baseLossGraceTurns") baseLossGraceTurns = value;
  if (key === "baseDefenseBonus") baseDefenseBonus = value;
  if (key === "ridgeFacingDefense") ridgeFacingDefense = value;
  if (key === "baseRepairRate") baseRepairRate = value;
  if (key === "baseEfficiencyRepair") baseEfficiencyRepair = value;
  if (key === "enemyBaseSeekRange") enemyBaseSeekRange = value;
  if (key === "depotSafeDistance") depotSafeDistance = value;
  if (key === "playerBattalionHQ") episodeLimits.playerBattalionHQ = value;
  if (key === "enemyBattalionHQ") episodeLimits.enemyBattalionHQ = value;
  unitTypes.battalionHQ.supplyRange = hqSupplyRange;
  unitTypes.battalionHQ.recoveryRange = hqRecoveryRange;
}

function turnDisplay() {
  const limit = missionTurnLimit();
  if (!Number.isFinite(limit)) return String(state.turn);
  // 기한이 끝나면 턴은 limit+1까지 올라가 있다. 화면에 "4 / 3"을 띄우지는 않는다.
  return `${Math.min(state.turn, limit)} / ${limit}`;
}

function updatePanel() {
  // 왼쪽 판의 다섯 칸은 지도 위 상황판과 겹쳐서 지웠다. 나중에 되살릴 수도 있으니
  // 참조는 남겨 두되, 없어도 그냥 넘어가게 한다.
  if (turnLabelEl) turnLabelEl.textContent = turnDisplay();
  if (phaseLabelEl) phaseLabelEl.textContent = phaseDisplayName();
  if (resourceLabelEl) resourceLabelEl.textContent = formatNumber(state.resources);
  if (baseLabelEl) baseLabelEl.textContent = formatNumber(projectedIncome("player"));
  if (forceLabelEl) forceLabelEl.textContent = `${combatCountFor("player")}`;
  updateOperationHud();
  renderSelectedCard();
  renderCommanderList();

  // 옛 저장분에는 줄이 문자열로만 들어 있다. 불러오다가 화면이 통째로 비지 않게
  // 두 모양을 다 받는다.
  logEl.innerHTML = state.log
    .map((item) => {
      const text = typeof item === "string" ? item : item.text;
      const kind = typeof item === "string" ? "" : item.kind;
      return `<p${kind ? ` class="log-${kind}"` : ""}>${text}</p>`;
    })
    .join("");
  syncRecruitButtonCosts();
  syncConstructionButtonCosts();
  updateActionPanel();
  // 편성 버튼을 잠그는 것은 이제 보급품과 사령부 선택 여부뿐이다. 예전에는
  // 전투 정원이 찼다는 이유로도 잠갔는데, 아군에게는 그 정원이 없어졌다.
  document.querySelector("#recruitInfantry").disabled = !selectedBattalionHQ() || state.resources < unitTypes.infantry.cost || state.gameOver;
  document.querySelector("#recruitArmor").disabled = !selectedBattalionHQ() || state.resources < unitTypes.armor.cost || state.gameOver;
  document.querySelector("#recruitArtillery").disabled = !selectedBattalionHQ() || state.resources < unitTypes.artillery.cost || state.gameOver;
  document.querySelector("#recruitSpArtillery").disabled = !selectedBattalionHQ() || state.resources < unitTypes.spArtillery.cost || state.gameOver;
  document.querySelector("#recruitEngineer").disabled = !selectedBattalionHQ() || state.resources < unitTypes.engineer.cost || state.gameOver;
  const hqButton = document.querySelector("#recruitBattalionHQ");
  if (hqButton) {
    hqButton.querySelector("span").textContent = `${unitTypes.battalionHQ.cost} · ${remainingBattalionHQ("player")}/${battalionHQLimit("player")}`;
    hqButton.disabled =
      !selectedBattalionHQ() ||
      state.resources < unitTypes.battalionHQ.cost ||
      state.gameOver ||
      remainingBattalionHQ("player") <= 0;
  }
  // 배치 단계에는 턴 종료가 아니라 배치 완료를 누르게 한다. 두 버튼을 동시에
  // 띄우면 "턴 종료"부터 눌러 배치를 건너뛰는 사고가 난다.
  const deploying = state.phase === "deploy" && !state.gameOver;
  const endTurnBtn = document.querySelector("#endTurn");
  endTurnBtn.hidden = deploying;
  endTurnBtn.disabled = state.phase !== "player" || state.gameOver;
  const endDeployBtn = document.querySelector("#endDeploy");
  if (endDeployBtn) endDeployBtn.hidden = !deploying;

  const engineer = selectedEngineer();
  document.querySelector("#buildBridge").disabled = !engineer || !canBuildBridge(engineer);
  document.querySelector("#buildDepot").disabled = !engineer || !canStartConstruction(engineer, "depot");
  document.querySelector("#buildRail").disabled = !engineer || !canStartConstruction(engineer, "rail");

  const selected = selectedUnit();
  const towButton = document.querySelector("#toggleTow");
  if (towButton) {
    towButton.disabled = state.phase !== "player" || state.gameOver || selected?.owner !== "player" || selected.type !== "artillery" || selected.acted;
    towButton.textContent = selected?.type === "artillery" && selected.towed ? "포병 전개" : "트럭 견인";
  }
}

function updateOperationHud() {
  const phaseName = phaseDisplayName();
  if (hudTurnLabelEl) hudTurnLabelEl.textContent = turnDisplay();
  if (hudPhaseLabelEl) hudPhaseLabelEl.textContent = phaseName;
  if (hudResourceLabelEl) hudResourceLabelEl.textContent = formatNumber(state.resources);
  if (hudBaseLabelEl) hudBaseLabelEl.textContent = formatNumber(projectedIncome("player"));
  if (hudForceLabelEl) hudForceLabelEl.textContent = `${combatCountFor("player")}`;
  // 경보칸은 두 얼굴이다. 실제로 경보가 떴을 때는 노란 불이 들어와야 하고,
  // 아무 일도 없을 때는 "전장 이상 없음" 한 줄이 화면 34px을 차지한다.
  // 휴대폰에서는 그 34px이 지도 두 칸 반이라, 조용할 때는 칸째로 접는다
  // (styles.css의 .hud-alerts.clear). 넓은 화면에서는 그대로 둔다.
  if (hudAlertLabelEl) {
    const alerts = operationAlerts();
    hudAlertLabelEl.textContent = alerts.length ? alerts.join(" · ") : t("전장 이상 없음");
    hudAlertLabelEl.classList.toggle("clear", alerts.length === 0);
  }
  if (missionNameLabelEl) missionNameLabelEl.textContent = state.mission?.name ? t(state.mission.name) : t("작전");
  // 브리핑은 한 번 뜨고 로그에 묻힌다. 목표는 매 턴 보이는 자리에 있어야 한다.
  if (missionBriefLabelEl) missionBriefLabelEl.textContent = missionBriefText();
}

// 경보 목록. 비어 있으면 "이상 없음"이라는 뜻이고, 그 판단을 부르는 쪽에서
// 하도록 문자열이 아니라 목록으로 돌려준다.
function operationAlerts() {
  const playerUnits = state.units.filter((unit) => unit.owner === "player");
  const isolated = playerUnits.filter((unit) => supplyStatus(unit).level === "isolated").length;
  const cut = playerUnits.filter((unit) => supplyStatus(unit).level === "cut");
  const strained = playerUnits.filter((unit) => supplyStatus(unit).level === "strained").length;
  const collapsing = cut.filter((unit) => collapseDamageFor(unit) > 0).length;
  const constructing = state.constructions.filter((construction) => construction.owner === "player").length;
  const parts = [];
  // 기한과 목표는 다른 어떤 경보보다 앞에 온다. 남은 턴이 곧 남은 선택지다.
  const deadline = turnsRemaining();
  if (Number.isFinite(deadline) && deadline <= 5) parts.push(`작전 기한 ${deadline}턴`);
  objectivesFor("player")
    .filter((objective) => objective.held > 0)
    .forEach((objective) => parts.push(`목표 확보 ${objective.held}/${objectiveHoldRequirement(objective)}`));
  objectivesFor("enemy")
    .filter((objective) => objective.held > 0)
    .forEach((objective) => parts.push(`후방 피탈 ${objective.held}/${objectiveHoldRequirement(objective)}`));
  // 사령부가 포위되면 보급품이 아무리 쌓여도 증원이 안 나온다. 이건 단추가
  // 고장 난 것이 아니라 판이 그렇게 된 것이고, 말해 주지 않으면 구별할 방법이 없다.
  if (recruitEncircled("player")) parts.push("사령부 포위 · 증원 불가");
  if (isolated) parts.push(`고립 ${isolated}`);
  if (collapsing) parts.push(`붕괴 ${collapsing}`);
  if (cut.length - collapsing > 0) parts.push(`보급 두절 ${cut.length - collapsing}`);
  if (strained) parts.push(`보급 불안 ${strained}`);
  if (constructing) parts.push(`건설 중 ${constructing}`);
  return parts;
}

// 좁은 화면에서 지휘칸은 아래에서 올라오는 서랍이다. 넓은 화면에서는 예전처럼
// 왼쪽에 접었다 폈다 하는 칸이다. 여닫는 상태는 두 경우 모두 command-collapsed
// 한 가지로 나타내고, 여기서 막(scrim)만 같이 켜고 끈다.
function syncCommandPanelState() {
  const collapsed = document.body.classList.contains("command-collapsed");
  const button = document.querySelector("#toggleCommandPanel");
  if (button) {
    button.setAttribute("aria-expanded", String(!collapsed));
    button.textContent = collapsed ? t("열기") : t("닫기");
  }
  const scrim = document.querySelector("#panelScrim");
  // 좁은 화면인지 재는 자는 하나뿐이다. 여기만 innerWidth를 따로 보면 경계가
  // 하나 더 생기고, 두 값이 어긋나는 폭에서 막만 안 뜨는 상태가 조용히 생긴다.
  if (scrim) scrim.hidden = collapsed || !isPhoneLayout();
}

// 사람이 지휘칸을 한 번이라도 직접 여닫았는가. 폰을 눕히고 세우는 것은 화면
// 모양이 바뀐 것이지 사람의 뜻이 바뀐 것이 아니다. 닫아 둔 칸이 회전 한 번에
// 혼자 열리면 그건 게임이 사람 말을 덮어쓴 것이다.
let commandPanelTouched = false;

// 여닫는 곳은 여기 하나다. 사람이 누른 것인지 기계가 정리한 것인지를 받아서
// 구분한다 — 안내를 보여 주려고 지휘칸을 접는 것은 기계의 사정이지 사람의 뜻이
// 아니다. 그것까지 뜻으로 세면 안내를 한 번 열어 본 것만으로 그 판 내내 화면
// 모양에 맞춰 주는 동작이 죽는다.
function setCommandPanel(collapsed, { byUser = true } = {}) {
  if (byUser) commandPanelTouched = true;
  document.body.classList.toggle("command-collapsed", collapsed);
  syncCommandPanelState();
}

function toggleCommandPanel() {
  setCommandPanel(!document.body.classList.contains("command-collapsed"));
}

function openCommandPanel() {
  setCommandPanel(false);
}

function closeCommandPanel() {
  setCommandPanel(true);
}

function toggleEditorPanel() {
  const open = document.body.classList.toggle("editor-open");
  const button = document.querySelector("#toggleEditorPanel");
  if (button) button.setAttribute("aria-expanded", String(open));
  // 잠금과 없는 셈 치기는 한 군데서만 정한다 — syncEditorPanelReach 위 설명 참고.
  syncEditorPanelReach();
}

function syncRecruitButtonCosts() {
  const buttons = [
    ["#recruitInfantry", "infantry"],
    ["#recruitArmor", "armor"],
    ["#recruitArtillery", "artillery"],
    ["#recruitSpArtillery", "spArtillery"],
    ["#recruitEngineer", "engineer"],
  ];
  buttons.forEach(([selector, type]) => {
    const badge = document.querySelector(`${selector} span`);
    if (badge) badge.textContent = unitTypes[type].cost;
  });
}

// 어느 단추가 어느 병종인가. 편성 금지를 단추에 비추려면 이 짝이 한 군데 있어야 한다.
const recruitButtonTypes = {
  "#recruitInfantry": "infantry",
  "#recruitArmor": "armor",
  "#recruitArtillery": "artillery",
  "#recruitSpArtillery": "spArtillery",
  "#recruitEngineer": "engineer",
  "#recruitBattalionHQ": "battalionHQ",
};

function updateActionPanel() {
  const selected = selectedUnit();
  const isOwnReady = selected?.owner === "player" && state.phase === "player" && !state.gameOver;
  const isHQ = isOwnReady && selected.type === "battalionHQ";
  const isEngineer = isOwnReady && selected.type === "engineer" && !selected.acted;
  const isArtillery = isOwnReady && selected.type === "artillery" && !selected.acted;
  const groups = {
    hq: Object.keys(recruitButtonTypes),
    hqMenus: ["#armyCommandMenu", "#navyCommandMenu", "#airCommandMenu", "#aiCommandMenu"],
    engineer: ["#buildBridge", "#buildDepot", "#buildRail"],
    artillery: ["#toggleTow"],
  };

  Object.values(groups).flat().forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) element.hidden = true;
  });

  groups.hqMenus.forEach((selector) => setActionVisible(selector, isHQ));
  // 이 작전에서 못 데려오는 병종은 단추째 내린다. 눌러 보고 나서 안 된다고 듣는 것보다
  // 처음부터 없는 편이 지휘관에게 정직하다.
  if (isHQ) groups.hq.forEach((selector) => setActionVisible(selector, canRecruitType("player", recruitButtonTypes[selector])));
  if (isEngineer) groups.engineer.forEach((selector) => setActionVisible(selector, true));
  if (isArtillery) groups.artillery.forEach((selector) => setActionVisible(selector, true));

  const hint = document.querySelector("#actionHint");
  if (!hint) return;
  if (state.phase === "deploy") {
    hint.textContent = selected
      ? `${unitLabel(selected)} — 강조된 칸을 클릭해 자리를 옮기십시오.`
      : `배치 단계입니다. 부대를 클릭한 뒤 배치할 칸을 클릭하십시오. (조정 반경 ${deployRange}칸)`;
    return;
  }
  // 못 치는 적을 눌렀다면 그 이유가 먼저다. 이 줄이 없던 동안, 사거리 밖이든 호위에
  // 가렸든 화면은 똑같이 아무 말도 하지 않았고 플레이어에게는 그게 고장으로 보였다.
  if (state.attackNotice) {
    hint.textContent = state.attackNotice;
    hint.classList.add("hint-blocked");
    return;
  }
  hint.classList.remove("hint-blocked");
  if (!selected) hint.textContent = "부대를 클릭하면 가능한 기능이 표시됩니다.";
  else if (selected.owner !== "player") hint.textContent = "적 부대는 정보만 확인할 수 있습니다.";
  else if (isHQ) hint.textContent = "대대사령부 기능: 증원과 투입을 지휘합니다.";
  else if (isEngineer) hint.textContent = "공병대 기능: 교량, 보급창고, 철도를 건설합니다.";
  else if (isArtillery) hint.textContent = "야포 기능: 트럭 견인과 전개를 전환합니다.";
  else hint.textContent = "이 부대는 현재 별도 기능이 없습니다. 이동과 공격은 지도에서 수행합니다.";
}

function setActionVisible(selector, visible) {
  const element = document.querySelector(selector);
  if (element) element.hidden = !visible;
}

function syncConstructionButtonCosts() {
  const buttons = [
    ["#buildBridge", "bridge"],
    ["#buildDepot", "depot"],
    ["#buildRail", "rail"],
  ];
  buttons.forEach(([selector, type]) => {
    const badge = document.querySelector(`${selector} span`);
    if (badge) badge.textContent = `${constructionCosts[type]} · ${constructionDuration(type)}일`;
  });
}

function unitProfile(ownerOrUnit, type) {
  const side = sideKeyForUnit(ownerOrUnit);
  const unitType = typeof ownerOrUnit === "object" ? ownerOrUnit.type : type;
  return factionUnitProfiles[side]?.[unitType] ?? {};
}

function unitLabel(ownerOrUnit, type, options = {}) {
  const profile = unitProfile(ownerOrUnit, type);
  if (options.short && profile.shortLabel) return t(profile.shortLabel);
  const name = profile.label ?? unitTypes[typeof ownerOrUnit === "object" ? ownerOrUnit.type : type]?.label ?? "";
  return name ? t(name) : "";
}

// 진영명은 한 번만 붙인다. 부대 이름 자체에 진영이 들어 있는 것들이 있어서
// (연합군 대대 사령부, 추축군 대대 사령부 …) 앞에 또 붙이면
// "연합군 연합군 대대 사령부"가 된다. 이름 텍스트는 언어팩마다 다르므로
// 라벨을 고치는 대신 붙이는 자리에서 걸러야 어느 언어에서도 맞는다.
function sideUnitLabel(ownerOrUnit, type, options) {
  const owner = typeof ownerOrUnit === "object" ? ownerOrUnit.owner : ownerOrUnit;
  const side = sideName(owner);
  const label = unitLabel(ownerOrUnit, type, options);
  return label.startsWith(side) ? label : `${side} ${label}`;
}

function unitImageFor(ownerOrUnit, type) {
  const profile = unitProfile(ownerOrUnit, type);
  if (profile.image) return `assets/units/${profile.image}`;
  const unitType = typeof ownerOrUnit === "object" ? ownerOrUnit.type : type;
  const files = {
    infantry: "infantry.png",
    armor: "armor.png",
    artillery: "artillery.png",
    spArtillery: "sp-artillery.png",
    engineer: "engineer.png",
  };
  return files[unitType] ? `assets/units/${files[unitType]}` : "";
}

function renderUnitCardVisual(unit, spec) {
  const image = unitImageFor(unit);
  const visual = image
    ? `<span class="unit-card-image" style="background-image: url('${image}')"></span>`
    : `<span class="unit-card-image icon-only"><span class="unit-icon ${unit.type} ${unit.owner} ${sideKeyForUnit(unit)}"></span></span>`;
  // 이름을 두 벌 심어 두고 접힘/펼침에 따라 CSS가 하나만 보여 준다.
  // 접힌 카드의 이름은 한 줄로 잘리는데, 한국어 부대 이름은 병종이 늘 끝에 있어서
  // 그대로 자르면 하필 병종이 지워진다 — 「추축군 leFH 18 105mm …」가 되어
  // 견인 야포인지 자주포인지 구별할 수 없다. 둘은 규칙이 다르다(야포는 움직인 턴에
  // 못 쏘고, 자주포는 고지에 못 들어간다). 짧은 이름은 병종을 앞으로 당겨 둔 이름이라
  // 잘릴 일이 없고, 언어팩마다 따로 있어서 영어판에서도 같은 규칙이 통한다.
  return `
    <div class="unit-card-visual">
      ${visual}
      <h2><span class="name-short">${sideUnitLabel(unit, undefined, { short: true })}</span><span class="name-full">${sideUnitLabel(unit)}</span></h2>
    </div>
  `;
}

// 맞은편 장군은 여기서 처음 만난다. 적 대대사령부를 찾아 눌렀을 때만 나온다 —
// 사령부를 찾아내는 일 자체가 정보이기 때문이다. 다른 적 부대를 눌러서는 알 수 없다.
// 얼굴과 함께 능력치도 다 편다. 알아냈으면 다 알아낸 것이지, 반만 알려 주는 정찰은 없다.
function renderEnemyCommanderStrip(unit) {
  if (unit.owner !== "enemy" || unit.type !== "battalionHQ") return "";
  const commander = state.commanders.enemy;
  if (!commander) return "";
  return `
    <div class="unit-card-commander">
      <img
        class="commander-photo"
        src="${commanderPhoto(commander)}"
        alt="${commander.name} portrait"
        loading="lazy"
        onerror="replaceCommanderPhoto(this, '${commanderInitials(commander)}', '${commander.side}')"
      />
      <span class="unit-card-commander-body">
        <span class="commander-tag">적군 지휘</span>
        <strong>${commander.name}</strong>
        <span>${t(commander.nation)} ${t(commander.rank)} · ${t(commander.trait)}</span>
        <span>${commanderStatSummary(commander)}</span>
      </span>
    </div>
  `;
}

function renderSelectedCard() {
  // 좁은 화면에서 부대 카드는 지도 위에 떠 있고, 처음에는 핵심 몇 줄만 보인다.
  // 새 부대를 고를 때마다 다시 접어 둔다 — 안 그러면 앞 부대에서 펴 둔 상태가
  // 그대로 남아 지도를 계속 가린다.
  selectedCardEl.classList.remove("expanded");
  const unit = selectedUnit() ?? inspectedUnit();
  if (!unit && state.inspectedTile) {
    renderTileCard(state.inspectedTile.x, state.inspectedTile.y);
    return;
  }
  if (!unit) {
    selectedCardEl.innerHTML = '<span class="muted">${t("부대를 선택하세요")}</span>';
    return;
  }

  const spec = unitTypes[unit.type];
  const tile = tileAt(unit.x, unit.y);
  const stack = getUnitsAt(unit.x, unit.y).filter((other) => other.owner === unit.owner && other.type === unit.type);
  const supply = supplyStatus(unit);
  selectedCardEl.innerHTML = `
    ${renderUnitCardVisual(unit, spec)}
    ${renderEnemyCommanderStrip(unit)}
    <div class="unit-stats">
      <span>${t("위치")} <strong>${displayTileName(unit.x, unit.y)}</strong></span>
      <span>${t("지형")} <strong>${terrainDescription(tile)}</strong></span>
      <span>${t("방어 보정")} <strong>+${coverAt(unit.x, unit.y)}</strong></span>
      ${getBaseAt(unit.x, unit.y) && baseDefenseBonus ? `<span>${t("거점 엄폐")} <strong>+${baseDefenseBonus}</strong></span>` : ""}
      <span>${t("지형 특성")} <strong>${terrainTraitText(unit.x, unit.y)}</strong></span>
      <span class="key">${t("전투력")} <strong>${unit.hp}/${spec.hp}</strong></span>
      ${spec.defense ? `<span>${t("부대 방어")} <strong>+${spec.defense}</strong></span>` : ""}
      <span class="key">${t("사기")} <strong>${effectiveMorale(unit)}%</strong></span>
      <!-- 접힌 카드는 좁은 폰에서 이 여섯 줄 중 앞의 서너 개만 보여 준다(나머지는
           카드 안에서 굴러간다). 그래서 매 턴 바뀌는 것을 앞에 둔다 — 전투력·사기·
           행동·보급은 턴마다 달라지고, 기동력·사거리는 병종을 알면 늘 같은 값이다.
           화면이 몇 px이든 이 순서면 먼저 보이는 것이 먼저 알아야 할 것이 된다. -->
      <span class="key">${t("행동")} <strong>${t(unit.justArrived ? "편성 중 / 내일부터" : unit.acted ? "완료" : unit.moved ? "이동 완료 / 공격 가능" : "가능")}</strong></span>
      <span class="key">${t("보급")} <strong>${supply.label}</strong></span>
      <span class="key">${t("기동력")} <strong>${effectiveMove(unit)}</strong></span>
      <span class="key">${t("사거리")} <strong>${spec.range}</strong></span>
      <span>${t("중첩")} <strong>${stack.length}/${maxStackSize}</strong></span>
      ${unit.owner === "player" ? `<span>${t("지휘관")} <strong>${commanderFor(unit.owner).name.split(" ").at(-1)}</strong></span>` : ""}
      ${unit.owner === "player" && commanderFor(unit.owner).move ? `<span>${t("장군 이동")} <strong>${signedStat(commanderFor(unit.owner).move)}</strong></span>` : ""}
      ${unit.owner === "player" && commanderFor(unit.owner).supply ? `<span>${t("장군 보급")} <strong>${signedStat(commanderFor(unit.owner).supply)}</strong></span>` : ""}
      ${unit.type === "artillery" ? `<span>${t("상태")} <strong>${t(unit.towed ? "견인" : "전개")}</strong></span>` : ""}
      <span>${t("보급선")} <strong>${formatSupplyDistance(supply)}</strong></span>
      <span>${t("소모")} <strong>${t("{n}/턴", { n: spec.supplyUse })}</strong></span>
      ${(unit.hqOutTurns ?? 0) ? `<span>${t("두절 지속")} <strong>${t("{n}턴", { n: unit.hqOutTurns })}</strong></span>` : ""}
      ${hqOutOfRangeMoraleLoss(unit) ? `<span>${t("두절 사기 손실")} <strong>-${hqOutOfRangeMoraleLoss(unit)}%</strong></span>` : ""}
      ${supply.level === "cut" ? `<span>${t("다음 턴 붕괴 피해")} <strong>${collapseDamageFor({ hqOutTurns: (unit.hqOutTurns ?? 0) + 1 })}</strong></span>` : ""}
      ${unit.type === "battalionHQ" ? `<span>${t("지휘 범위")} <strong>${spec.commandRange}</strong></span>` : ""}
      ${unit.type === "battalionHQ" ? `<span>${t("보급권")} <strong>${battalionCoverageText(unit)}</strong></span>` : ""}
      ${hqMoraleBonus(unit) ? `<span>${t("사령부 보너스")} <strong>+${hqMoraleBonus(unit)}%</strong></span>` : ""}
    </div>
  `;
}

function renderTileCard(x, y) {
  const tile = tileAt(x, y);
  const base = getBaseAt(x, y);
  const construction = getConstructionAt(x, y);
  const hillDirection = hillDefenseDirection(x, y);
  const deck = deckAt(x, y);
  const improvements = [
    deck ? `${bridgeKinds[deck.type].name} ${deck.hp}/${deck.maxHp}` : null,
    hasImprovement(x, y, "rail") ? t("철도") : null,
    hasImprovement(x, y, "depot") ? t("보급창고") : null,
  ].filter(Boolean);
  const moveCost = movementCostForTile(x, y);
  const objective = objectiveAt(x, y);
  // 부대 카드와 같은 껍데기를 쓴다. 「누르면 펴진다」는 표시가 이 껍데기에 붙어
  // 있어서, 한쪽만 안 감싸면 그 카드에서만 표시가 사라진다 — 눌러서 펴지는 기능은
  // 살아 있는데 펴진다는 것을 알 방법이 없는 상태가 된다. 폰에서는 범례도 접혀
  // 있어서, 지형을 읽을 다른 자리가 없다.
  //
  // key가 붙은 줄만 접힌 카드에 남는다. 지형 카드에는 그 표시가 한 줄도 없어서
  // 접으면 제목만 남는 빈 상자였다. 매 턴 판단에 쓰는 셋(지형·이동 비용·방어
  // 보정)과, 떠 있을 때는 그것이 곧 승패인 작전 목표 두 줄에 붙인다.
  //
  // 작전 목표 두 줄을 맨 앞에 둔다. 접힌 카드는 줄을 흘려 넣고 넘친 만큼을
  // 잘라내므로, 뒤에 두면 승패를 정하는 「유지 0/3턴」이 가장 먼저 사라진다.
  // 목표 이름은 한 줄을 통째로 먹어서 목표 칸에서만 줄 수가 늘어난다.
  // 앞에 오는 순서 기준은 부대 카드와 같다 — 매 턴 바뀌는 값이 먼저다.
  // 지형·이동 비용·방어 보정은 한 판 내내 안 바뀌고, 유지 턴수는 매 턴 바뀐다.
  selectedCardEl.innerHTML = `
    <div class="unit-card-visual"><h2>${displayTileName(x, y)} (${x}, ${y})</h2></div>
    <div class="unit-stats">
      ${objective ? `<span class="key">${t("작전 목표")} <strong>${sideName(objective.owner)} ${t(objective.label)}</strong></span>` : ""}
      ${objective ? `<span class="key">${t(objective.kind === "supply" ? "개통 유지" : "장악 유지")} <strong>${objectiveOpen(objective) ? t("{a}/{b}턴", { a: objective.held, b: objectiveHoldRequirement(objective) }) : t("{n}일차부터", { n: objective.fromTurn })}</strong>${objectiveNoteText(objective, { byTag: true, fromTurn: false })}</span>` : ""}
      ${objective?.kind === "supply" ? `<span>${t("보급선")} <strong>${objectiveSupplyText(objective)}</strong></span>` : ""}
      <span class="key">${t("지형")} <strong>${terrainDescription(tile)}</strong></span>
      <span class="key">${t("이동 비용")} <strong>${Number.isFinite(moveCost) ? formatNumber(moveCost) : t("통과 불가")}</strong></span>
      <span class="key">${t("방어 보정")} <strong>${coverAt(x, y) >= 0 ? "+" : ""}${coverAt(x, y)}</strong></span>
      ${deck ? `<span>${t("다리 위 노출")} <strong>-${bridgeExposure}</strong></span>` : ""}
      ${base && baseDefenseBonus ? `<span>${t("거점 엄폐")} <strong>+${baseDefenseBonus}</strong></span>` : ""}
      <span>${t("고도")} <strong>${formatElevation(tile.elevation)}</strong></span>
      <span>${t("포격 엄폐")} <strong>${tile.artilleryCover ? `-${tile.artilleryCover}` : t("없음")}</strong></span>
      ${hillDirection ? `<span>${t("방어방향")} <strong>${ridgeDirectionLabel(hillDirection)}</strong>${ridgeFacingDefense ? ` ${t("정면")} <strong>+${ridgeFacingDefense}</strong>` : ""}</span>` : ""}
      <span>${t("특성")} <strong>${terrainTraitText(x, y)}</strong></span>
      <span>${t("개량")} <strong>${improvements.length ? improvements.join(", ") : t("없음")}</strong></span>
      ${base ? `<span>${t("소유")} <strong>${sideName(base.owner)}</strong></span>` : ""}
      ${base ? `<span>${t("생산")} <strong>${formatNumber(baseProduction(base))}</strong></span>` : ""}
      ${base ? `<span>${t("효율")} <strong>${Math.round(base.efficiency * 100)}%</strong></span>` : ""}
      ${base ? `<span>${t("보급권")} <strong>${baseCoverageText(base)}</strong></span>` : ""}
      ${construction ? `<span>${t("공사")} <strong>${constructionName(construction.type)} ${t("{n}턴", { n: construction.remaining })}</strong></span>` : ""}
    </div>
  `;
}

function terrainDescription(tile) {
  if (tile.className === "coast") return t("강변/접근로");
  if (tile.className === "water") return t("하천/강");
  if (tile.className === "plain") return t("평지");
  if (tile.className === "forest") return t("숲");
  if (tile.className === "hill") return t("고지/산등성이");
  if (tile.className === "base") return t("보급 거점");
  return tile.name;
}

function formatElevation(elevation) {
  if (elevation > 0) return t("고지 +{n}", { n: elevation });
  if (elevation < 0) return t("저지 {n}", { n: elevation });
  return t("평지");
}

function terrainTraitText(x, y) {
  if (getTerrainKey(x, y) === "C") return t("강변 또는 주요 접근로 / 이동 가능");
  if (getTerrainKey(x, y) === "H") return t("원거리 포격 차단 / 전차, 자주포 진입 불가");
  if (getTerrainKey(x, y) === "W" && !deckAt(x, y)) return t("하천: 교량 없이는 통과 불가");
  if (deckAt(x, y)) return t("다리 위: 엄폐가 없어 개활지보다 맞기 쉽고, 다리가 끊기면 함께 빠진다");
  if (getTerrainKey(x, y) === "F") return t("방어 유리 / 포격 효과 감소");
  // 거점만 "일반"으로 나오면 지도에서 왜 이 칸을 다투는지가 카드에 한 줄도 안 적힌다.
  if (getTerrainKey(x, y) === "B") {
    const refit = baseRepairRate > 0 ? t(" / 소유 시 주둔 부대 병력 +{n}", { n: baseRepairRate }) : "";
    return t("시가지 창고: 방어 +2 / 포격 효과 감소 / 전차 진입 가능") + refit;
  }
  return t("일반");
}

// 명부는 얼굴을 보는 자리다. 능력치는 장군을 고를 때 이미 다 읽었으므로 여기서
// 또 늘어놓을 이유가 없다 — 사진을 키우고 이름과 한 줄만 남긴다.
//
// 여기 서는 것은 내 장군 하나뿐이다. 예전에는 맞은편 장군을 나란히 걸어 두었는데,
// 그러면 판이 시작되자마자 상대가 누구이고 무엇을 잘하는지 알게 된다 — 정찰
// 한 번 없이 얻는 정보다. 맞은편 장군은 적 대대사령부를 찾아서 눌러야 알게
// 했다(renderEnemyCommanderStrip). 사령부를 찾아내는 일 자체가 정보다.
//
// 둘이 하나가 되면서 사진을 위아래로 세울 이유도 없어졌다. 사진은 왼쪽, 글은
// 오른쪽에 눕힌다 — 사진 크기는 그대로인데 명부 높이는 절반이 되고, 그래서
// 이 칸에 있던 스크롤이 없어진다. 초상화를 굴려서 보는 것은 명부가 아니다.
function renderCommanderList() {
  const commander = state.commanders.player;
  commanderListEl.innerHTML = `
    <h2>${t("지휘관 명부")}</h2>
    <div class="commander-grid">
      <article class="commander-entry">
        <img
          class="commander-photo"
          src="${commanderPhoto(commander)}"
          alt="${commander.name} portrait"
          loading="lazy"
          onerror="replaceCommanderPhoto(this, '${commanderInitials(commander)}', '${commander.side}')"
        />
        <span class="commander-entry-body">
          <span class="commander-tag">${t("아군 지휘")}</span>
          <strong>${commander.name}</strong>
          <span>${t(commander.nation)} ${t(commander.rank)} · ${t(commander.trait)}</span>
        </span>
      </article>
    </div>
  `;
}

// 사진은 이름표를 따라간다. 예전에는 장군 열셋의 파일 경로를 여기에 손으로
// 한 줄씩 적어 뒀는데, 장군을 하나 늘릴 때마다 명부와 이 목록 두 곳을 고쳐야
// 했고 한쪽을 잊으면 사진만 조용히 사라졌다. 사진이 없으면 아래 초상 자리가
// 알아서 이름 첫 글자로 바뀌므로(onerror), 없는 파일을 가리켜도 화면은 멀쩡하다.
function commanderPhoto(commander) {
  return `assets/commanders/${commander.id}.jpg`;
}

function commanderInitials(commander) {
  return commander.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function replaceCommanderPhoto(image, initials, side) {
  const fallback = document.createElement("span");
  fallback.className = `commander-photo fallback ${side === "Axis" ? "axis" : "allies"}`;
  fallback.setAttribute("aria-label", image.alt || `${initials} portrait fallback`);
  fallback.innerHTML = `
    <span class="commander-silhouette" aria-hidden="true"></span>
    <span class="commander-initials">${initials}</span>
  `;
  image.replaceWith(fallback);
}

function handleTileClick(x, y) {
  if (state.gameOver) return;
  ensureAudio();
  if (state.phase === "deploy") {
    handleDeployClick(x, y);
    return;
  }
  if (state.phase !== "player") return;

  // "왜 못 쳤는지" 안내는 그 클릭 한 번에만 붙는다. 다음에 무엇을 누르든 먼저 지우고
  // 시작해야, 이미 해결된 이유가 화면에 남아 사람을 헷갈리게 하지 않는다.
  state.attackNotice = null;

  const clickedUnit = getSelectableUnitAt(x, y, "player");
  const clickedEnemy = getTargetUnitAt(x, y, "enemy");
  const clickedBase = getBaseAt(x, y);
  const selected = selectedUnit();

  // 보급 거점은 대개 수비대가 올라앉아 있다. 클릭이 늘 부대에 먼저 먹히면 거점 자체는
  // 영영 못 보게 되고, 거점 보급권도 같이 못 본다. 이미 고른 부대를 한 번 더 누르면
  // 그 아래 거점으로 넘어간다 — 스택에서 부대를 돌려 고르는 기능이 없으므로 잃는 것도 없다.
  if (clickedBase && clickedUnit && selected?.id === clickedUnit.id) {
    inspectTile(x, y);
    return;
  }

  if (clickedUnit) {
    playUnitSound(clickedUnit, "select");
    if (clickedUnit.owner === "player") coachSelectTicks += 1;
    state.selectedId = clickedUnit.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    render();
    return;
  }

  // 오늘 막 뽑은 부대는 고를 수가 없다(행동 완료 상태다). 여기서 조용히 넘어가면
  // 방금 보급품을 쓴 사람 눈에는 부대가 사라졌거나 클릭이 안 먹는 것으로 보인다.
  // 그래서 이유를 한 줄 띄우고 부대 카드까지 보여 준다. 고르는 것(selectedId)이
  // 아니라 들여다보는 것(inspectedId)이라 명령은 여전히 한 줄도 나가지 않는다.
  const forming = getUnitsAt(x, y).find((unit) => unit.owner === "player" && unit.justArrived);
  if (forming && !clickedEnemy) {
    playUnitSound(forming, "select");
    state.attackNotice = formingNotice(forming);
    state.selectedId = null;
    state.inspectedId = forming.id;
    state.inspectedTile = null;
    render();
    return;
  }

  if (clickedEnemy && (!selected || selected.acted)) {
    playUnitSound(clickedEnemy, "select");
    // 이미 할 일을 마친 부대를 쥔 채로 적을 눌렀다면, 그것도 "왜 안 되는지"에 해당한다.
    if (selected) state.attackNotice = attackBlockReason(selected, clickedEnemy);
    state.selectedId = null;
    state.inspectedId = clickedEnemy.id;
    state.inspectedTile = null;
    render();
    return;
  }

  if (!selected || selected.acted) {
    inspectTile(x, y);
    return;
  }

  if (clickedEnemy && canAttack(selected, clickedEnemy)) {
    attack(selected, clickedEnemy);
    selected.acted = true;
    captureBase(selected);
    state.selectedId = null;
    state.inspectedId = clickedEnemy.id;
    state.inspectedTile = null;
    checkVictory();
    render();
    return;
  }

  if (clickedEnemy) {
    playUnitSound(clickedEnemy, "select");
    state.inspectedId = clickedEnemy.id;
    state.inspectedTile = null;
    // 칠 수 없는 적을 눌렀다. 조용히 정보만 띄우면 플레이어는 화면이 고장 났다고
    // 생각한다. 왜 안 되는지, 무엇을 해야 되는지를 지도 밑에 적어 준다.
    const reason = attackBlockReason(selected, clickedEnemy);
    state.attackNotice = reason;
    if (reason) addLog(reason);
    render();
    return;
  }

  if (!clickedEnemy && clickedBase?.owner === "enemy" && canRaidBase(selected, clickedBase)) {
    raidBase(selected, clickedBase);
    selected.acted = true;
    state.selectedId = null;
    state.inspectedId = null;
    state.inspectedTile = null;
    checkVictory();
    render();
    return;
  }

  // 다리 포격은 이동보다 뒤에 둔다. 걸어 올라갈 수 있는 다리를 눌렀을 때 부대가
  // 건너지 않고 쏘아 버리면, 다리를 건너려던 클릭이 다리를 끊는 클릭이 된다.
  // 그래서 실제로 쏘게 되는 것은 이번 턴에 닿지 못하는 다리 — 대개 강 건너편이다.
  const clickedDeck = deckAt(x, y);
  if (clickedDeck && !clickedEnemy && !canMoveTo(selected, x, y) && canBombardDeck(selected, clickedDeck)) {
    bombardDeck(selected, clickedDeck);
    selected.acted = true;
    state.selectedId = null;
    state.inspectedId = null;
    state.inspectedTile = { x, y };
    checkVictory();
    render();
    return;
  }

  if (canMoveTo(selected, x, y)) {
    if (!confirmConstructionMove(selected)) return;
    // 가는 길에 적을 발견하면 거기서 멈춘다. 명령한 칸까지 그냥 밀어 넣으면
    // 매복을 밟고도 지나쳐 서 있게 된다.
    const halt = ambushHalt(selected, x, y);
    const stopAt = halt && !halt.atGoal ? halt : { x, y };
    recordUnitMove(selected, stopAt.x, stopAt.y);
    selected.x = stopAt.x;
    selected.y = stopAt.y;
    selected.moved = true;
    coachMoveTicks += 1;
    selected.acted = selected.type === "artillery";
    captureBase(selected);
    state.selectedId = selected.acted ? null : selected.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    if (halt) {
      addLog(t("{unit} › ({x},{y}) {foe} 발견 · 정지", { unit: unitLabel(selected), x: stopAt.x, y: stopAt.y, foe: sideUnitLabel(halt.foe) }));
    }
    addLog(selected.acted
      ? t("{unit} › ({x},{y}) 기동", { unit: unitLabel(selected), x: stopAt.x, y: stopAt.y })
      : t("{unit} › ({x},{y}) 기동 · 공격 가능", { unit: unitLabel(selected), x: stopAt.x, y: stopAt.y }));
    checkVictory();
    render();
    return;
  }

  inspectTile(x, y);
}

// 배치 단계의 클릭은 이동 규칙이 아니라 배치 규칙을 쓴다. 이동력도 지형 비용도
// 아직 의미가 없다 — 전투가 시작되기 전이니까. 배치 구역 안의 빈 칸이면 그만이다.
// 조작은 평소와 같다: 부대를 누르고, 갈 칸을 누른다. 새 조작을 가르치지 않는다.
function handleDeployClick(x, y) {
  const mine = getSelectableUnitAt(x, y, "player");
  if (mine) {
    playUnitSound(mine, "select");
    coachSelectTicks += 1;
    state.selectedId = mine.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    render();
    return;
  }

  const selected = selectedUnit();
  if (selected && canDeployHere(selected, x, y)) {
    selected.x = x;
    selected.y = y;
    state.inspectedId = null;
    state.inspectedTile = null;
    render();
    return;
  }

  inspectTile(x, y);
}

// 수동 배치도 자동 배치와 같은 반경 안에서만 허용한다. 사람에게만 지도 반대편까지
// 열어주면 시나리오가 짜놓은 전선 자체가 무의미해진다.
function canDeployHere(unit, x, y) {
  if (!state.deployZones?.player?.has(posKey(x, y))) return false;
  if (getBaseAt(x, y)?.owner === "enemy") return false;
  if (state.units.some((other) => other.owner === "enemy" && other.x === x && other.y === y)) return false;
  return canDeployAt(unit, x, y);
}

// 배치를 끝내야 1일차가 시작된다. 끝내기 전에 보급이 닿지 않는 부대가 있으면
// 막지는 않되 반드시 알려준다 — 그렇게 두는 것도 하나의 선택이지만,
// 모르고 그렇게 되는 건 선택이 아니다.
function finishDeployment() {
  if (state.gameOver || state.phase !== "deploy") return;
  state.phase = "player";
  state.selectedId = null;
  const stranded = state.units.filter((unit) => unit.owner === "player" && normalizedSupplyStatus(unit).level !== "full");
  addLog(t("배치 완료 › 작전 개시"));
  if (stranded.length) addLog(t("경고 › {n}개 부대가 보급 범위 밖에서 개시", { n: stranded.length }));
  render();
  // 손으로 짠 배치는 되돌릴 수 없는 일이다. 여기서 적어 두지 않으면 창을 닫는 순간
  // 그 배치를 통째로 다시 짜야 한다.
  saveOperation();
}

function inspectTile(x, y) {
  playMapTapSound();
  state.selectedId = null;
  state.inspectedId = null;
  state.inspectedTile = { x, y };
  render();
}

function getHighlights() {
  const unit = selectedUnit();
  const moves = new Set();
  const attacks = new Set();
  const raids = new Set();
  // 배치 단계에서는 "갈 수 있는 칸"이 곧 "세울 수 있는 칸"이다. 이동과 같은 표시를
  // 그대로 쓴다 — 단계마다 다른 색을 새로 가르칠 이유가 없다.
  if (state.phase === "deploy") {
    if (unit) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (canDeployHere(unit, x, y)) moves.add(posKey(x, y));
        }
      }
    }
    return { moves, attacks, raids };
  }
  if (!unit || state.phase !== "player") return { moves, attacks, raids };
  const canStillMove = !unit.acted && !unit.moved && !activeConstructionForBuilder(unit);
  const canStillAttack = !unit.acted;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const target = getTargetUnitAt(x, y, "enemy");
      const base = getBaseAt(x, y);
      if (canStillMove && canMoveTo(unit, x, y)) moves.add(posKey(x, y));
      if (canStillAttack && target && canAttack(unit, target)) attacks.add(posKey(x, y));
      if (canStillAttack && !target && base?.owner !== unit.owner && canRaidBase(unit, base)) raids.add(posKey(x, y));
      // 다리도 포격 표적으로 켠다. 단 이번 턴에 걸어 올라갈 수 있는 다리는 빼는데,
      // 클릭 처리에서 이동이 이기기 때문이다 — 표시와 실제 동작이 달라지면 안 된다.
      const deck = deckAt(x, y);
      if (canStillAttack && !target && deck && !moves.has(posKey(x, y)) && canBombardDeck(unit, deck)) {
        raids.add(posKey(x, y));
      }
    }
  }
  return { moves, attacks, raids };
}

function recruit(type) {
  if (state.phase !== "player" || state.gameOver) return;
  const hq = selectedBattalionHQ();
  if (!hq) {
    addLog(t("증원 불가 › 대대사령부를 먼저 선택"));
    render();
    return;
  }
  const spec = unitTypes[type];
  // 단추는 이미 내려가 있다. 그래도 규칙은 화면이 아니라 여기서 지킨다 —
  // 화면만 막으면 저장 파일을 손대거나 단추를 되살린 판에서 그대로 뚫린다.
  if (!canRecruitType("player", type)) {
    addLog(t("증원 불가 › {unit} · 이 작전의 편성 대상 아님", { unit: t(spec.label) }));
    render();
    return;
  }
  if (state.resources < spec.cost) return;
  if (type === "battalionHQ" && remainingBattalionHQ("player") <= 0) {
    addLog(t("증원 불가 › 배속된 대대사령부 전부 투입됨"));
    render();
    return;
  }
  // 아군 편성을 막는 것은 보급품 하나뿐이다. 적도 같다(enemyForceTarget 참고).
  // 남는 문은 자리다 — 사령부가 부대를 낳을 수 있는 곳은 지휘 범위 안의 빈 칸뿐이고,
  // 겹쳐 세울 수는 없다(findHQSpawn 참고). 그래서 "보급품이 있는 만큼"이라 해도
  // 한 턴에 한 사령부가 토해 낼 수 있는 양에는 여전히 끝이 있다.
  const spawn = findHQSpawn(hq, type);
  if (!spawn) {
    addLog(t("증원 불가 › 대대사령부 주변에 빈 칸 없음"));
    render();
    return;
  }

  state.resources -= spec.cost;
  state.units.push(deployReinforcement("player", type, spawn.x, spawn.y));
  addLog(t("{unit} › 전선 도착 · 편성 중, 내일부터 기동", { unit: unitLabel("player", type) }));
  playNoticeSound("unit_ready");
  render();
}

function toggleArtilleryTow() {
  const unit = selectedUnit();
  if (state.phase !== "player" || state.gameOver || unit?.owner !== "player" || unit.type !== "artillery" || unit.acted) return;
  unit.towed = !unit.towed;
  unit.acted = true;
  state.selectedId = null;
  addLog(unit.towed ? t("야포대 › 견인 연결 · 다음 턴 고속 이동, 포격 불가") : t("야포대 › 포 전개 · 다음 턴부터 포격 가능"));
  render();
}

function engineerBuild(type) {
  const engineer = selectedEngineer();
  if (!engineer) return;
  const cost = constructionCosts[type] ?? 0;
  if (state.resources < cost) {
    addLog(t("공사 불가 › {what}에 보급품 {n} 필요", { what: constructionName(type), n: cost }));
    render();
    return;
  }

  if (type === "bridge") {
    // 발 닿는 곳의 아직 다리가 없는 물칸 전부. 그중 규칙을 통과하는 것을 고르고,
    // 하나도 없으면 왜 안 되는지를 이 목록을 보고 말해 준다.
    const spots = neighbors(engineer.x, engineer.y).filter(
      (spot) => getTerrainKey(spot.x, spot.y) === "W" && !deckAt(spot.x, spot.y),
    );
    const water = spots.find((spot) => canPlaceBridge(engineer.owner, spot.x, spot.y));
    if (!water) {
      addLog(bridgeRefusalReason(engineer.owner, spots));
      render();
      return;
    }
    state.resources -= cost;
    state.improvements.push(newDeck("bridge", engineer.owner, water.x, water.y));
    engineer.acted = true;
    state.selectedId = null;
    // 강이 뚫렸으니 어제 그린 길은 이제 거짓말이다(적 공병대 쪽과 같은 처리).
    clearRouteFields();
    // 강폭이 남아 있으면 아직 건널 수 없다. 공병대가 다리 위로 올라서서 다음 칸을
    // 이어야 한다 — 그 말을 안 해 주면 플레이어는 다리를 놓고도 왜 못 건너는지 모른다.
    // 건너는 방향으로만 본다. 강을 따라 위아래에 있는 물은 이 다리가 이을 물이 아니다.
    const ahead = bridgeAxisAt(water.x, water.y) === "h" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    const gap = ahead.some(
      ([dx, dy]) =>
        inBounds(water.x + dx, water.y + dy) &&
        getTerrainKey(water.x + dx, water.y + dy) === "W" &&
        !deckAt(water.x + dx, water.y + dy),
    );
    addLog(
      gap
        ? `공병대 › (${water.x},${water.y}) 교량 1칸 · 강폭 남음, 다리 위로 올라 다음 칸을 이을 것`
        : `공병대 › (${water.x},${water.y}) 임시 교량 완성`,
    );
    // 교량만 그 자리에서 끝난다. 나머지 공사는 completeConstruction에서 알린다.
    playNoticeSound("work_complete");
    render();
    return;
  }

  if (!canStartConstruction(engineer, type)) return;
  const duration = constructionDuration(type);
  state.resources -= cost;
  state.constructions.push({ type, owner: engineer.owner, builderId: engineer.id, x: engineer.x, y: engineer.y, remaining: duration });
  engineer.acted = true;
  state.selectedId = null;
  addLog(t("공병대 › ({x},{y}) {what} 착공 · {n}일 소요", { x: engineer.x, y: engineer.y, what: constructionName(type), n: duration }));
  // 공사는 여러 턴이 걸려서 명령을 넣어도 화면이 거의 그대로다. 삽질 소리가
  // 나야 명령이 들어간 것을 안다.
  if (engineer.owner === "player") playUnitSound(engineer, "build");
  // 적 AI는 안전하지 않은 자리를 아예 고르지 않지만, 플레이어는 막지 않고 경고만 한다.
  // 위험을 알면서 최전선에 창고를 미는 것도 하나의 수다 — 다만 모르고 하면 안 된다.
  if (type === "depot" && !isSafeDepotSite(engineer.owner, engineer.x, engineer.y)) {
    addLog(t("경고 › 공사 중 공병대는 이동 불가 · 이 자리는 안전하지 않음"));
  }
  render();
}

function canBuildBridge(engineer) {
  if (state.phase !== "player" || state.gameOver || engineer.acted || engineer.type !== "engineer") return false;
  if (state.resources < constructionCosts.bridge) return false;
  return neighbors(engineer.x, engineer.y).some((spot) => canPlaceBridge(engineer.owner, spot.x, spot.y));
}

// "이 칸에 이걸 지을 수 있는가"는 진영과 무관한 규칙이다. 적 AI도 같은 자를 써야
// 플레이어가 본 것과 다른 규칙으로 적이 짓는 일이 생기지 않는다.
function canBuildHere(x, y, type) {
  if (getTerrainKey(x, y) === "W") return false;
  if (getConstructionAt(x, y)) return false;
  if (type === "depot") return !getBaseAt(x, y) && !hasImprovement(x, y, "depot");
  if (type === "rail") return !hasImprovement(x, y, "rail");
  return false;
}

function canStartConstruction(engineer, type) {
  if (state.phase !== "player" || state.gameOver || engineer.acted || engineer.type !== "engineer") return false;
  if (state.resources < (constructionCosts[type] ?? 0)) return false;
  return canBuildHere(engineer.x, engineer.y, type);
}

function constructionDuration(type) {
  if (type === "bridge") return 1;
  if (type === "depot") return 3;
  if (type === "rail") return 2;
  return 1;
}

function activeConstructionForBuilder(unit) {
  if (!unit?.id) return null;
  return state.constructions.find((construction) => construction.builderId === unit.id);
}

function confirmConstructionMove(unit) {
  const construction = activeConstructionForBuilder(unit);
  if (!construction) return true;
  const proceed = window.confirm("이동하면 건설이 취소 됩니다. 이동합니까?");
  if (!proceed) return false;
  cancelConstruction(construction);
  return true;
}

function cancelConstruction(construction) {
  state.constructions = state.constructions.filter((item) => item !== construction);
  addLog(t("{what} 공사 취소", { what: constructionName(construction.type) }));
}

function endPlayerTurn() {
  if (state.gameOver || state.phase !== "player") return;
  updateBattalionSupplyPressure("player");
  applySupplyAttrition("player");
  advanceObjectiveHold("player");
  checkVictory();
  if (state.gameOver) {
    render();
    return;
  }
  state.phase = "enemy";
  state.selectedId = null;
  state.units.forEach((unit) => {
    if (unit.owner === "enemy") {
      unit.acted = false;
      unit.moved = false;
      // 편성은 하룻밤이면 끝난다. 이 줄이 없으면 갓 온 부대는 영영 굳어 있다.
      unit.justArrived = false;
      // 총구 화염은 한 턴만 간다. 쏜 자리는 그 턴 동안만 상대에게 드러나고,
      // 다음 턴이 오면 다시 안개 속으로 들어간다 — 이게 "쏘고 옮긴다"를 성립시킨다.
      unit.firedFrom = null;
    }
  });
  replenishNearBattalionHQ("enemy");
  refitOnOwnBase("enemy");
  repairOwnBases("enemy");
  addLog(t("{side} › 반격 개시", { side: sideName("enemy") }));
  render();
  window.setTimeout(enemyTurn, 420);
}

function enemyTurn() {
  if (state.gameOver) return;

  // 적 공사도 시간이 흘러야 완성된다. 이 한 줄이 없으면 적은 삽만 뜨고 영영 못 짓는다.
  advanceConstructions("enemy");

  // 지난 턴에 다리가 놓였거나 철도가 깔렸으면 어제 그린 길은 이미 틀렸다.
  clearRouteFields();

  // 계획보다 먼저 정찰이다. 참모부가 세우는 계획은 "지금 보이는 것 + 마지막으로 본 것"
  // 위에서만 세워져야 한다. 이 줄이 계획 뒤로 가면 적은 이번 턴에 본 것을 이번 턴 계획에
  // 반영하지 못하고 늘 한 턴 늦게 움직인다.
  recordContacts("enemy");

  // 부대가 움직이기 전에 참모부가 먼저 계획을 세운다. 부대마다 따로 판단하면
  // 같은 답이 나와 전군이 한 덩어리로 몰린다.
  buildEnemyPlan();

  // 공병대가 먼저 움직인다. 나루의 물가는 대개 한 칸뿐이라, 전차가 먼저 그 칸에
  // 올라서면 다리를 놓을 공병대는 영영 그 자리에 서지 못한다. 실제로 그랬다 —
  // 적은 자기 전차에 막혀 16턴 내내 강가에 서 있었다. 길을 여는 쪽이 먼저다.
  // 나머지 순서는 건드리지 않는다(사령부 추종은 지금 순서를 전제로 맞춰 두었다).
  const enemies = state.units.filter((unit) => unit.owner === "enemy");
  const ordered = [
    ...enemies.filter((unit) => unit.type === "engineer"),
    ...enemies.filter((unit) => unit.type !== "engineer"),
  ];
  ordered.forEach((unit) => {
    if (!state.units.includes(unit) || state.gameOver) return;

    if (unit.type === "battalionHQ") {
      enemyHQTurn(unit);
    } else if (unit.type === "engineer") {
      enemyEngineerTurn(unit);
    } else {
      enemyFieldTurn(unit);
    }
    captureBase(unit);
    // 한 부대가 전진하면 그 부대의 눈도 같이 전진한다. 매 부대 뒤에 다시 적어 두어야
    // 선두가 발견한 것을 후속 부대가 같은 턴에 쓸 수 있다 — 척후가 앞서 나가는 이유다.
    recordContacts("enemy");
    checkVictory();
  });

  updateBattalionSupplyPressure("enemy");
  applySupplyAttrition("enemy");
  advanceObjectiveHold("enemy");
  checkVictory();

  if (state.gameOver) {
    render();
    return;
  }

  const enemyIncome = projectedIncome("enemy");
  state.enemyResources += enemyIncome;
  addLog(t("{side} 보급 +{n}", { side: sideName("enemy"), n: formatNumber(enemyIncome) }));
  maybeEnemyRecruit();

  state.phase = "player";
  state.turn += 1;
  if (resolveTurnLimit()) {
    render();
    return;
  }
  advanceConstructions("player");
  const income = projectedIncome("player");
  state.resources += income;
  state.units.forEach((unit) => {
    if (unit.owner === "player") {
      unit.acted = false;
      unit.moved = false;
      // 편성은 하룻밤이면 끝난다. 이 줄이 없으면 갓 온 부대는 영영 굳어 있다.
      unit.justArrived = false;
      unit.firedFrom = null;
    }
  });
  replenishNearBattalionHQ("player");
  refitOnOwnBase("player");
  repairOwnBases("player");
  // 하루가 넘어간 자리를 기록에도 남긴다. 판 가운데 뜨는 날짜는 1초면 사라져서,
  // 나중에 기록을 훑을 때 이 열두 줄이 며칠 일인지 알 길이 없었다.
  // 자리는 그날 맨 처음이다. 기록은 새 줄이 위로 쌓이므로, 이 줄 위쪽이 곧
  // 그날 있었던 일이 된다 — 아래로 내려갈수록 어제로 간다.
  logDayLine();
  addLog(t("보급 +{n}", { n: formatNumber(income) }));
  render();
  showTurnCard();
  // 하루가 넘어간 이 자리가 중간 저장 지점이다. 턴 한가운데서 적으면 반쯤 움직인
  // 부대가 그대로 굳으므로, 언제나 "내 차례가 막 시작된 아침"으로 되살아난다.
  saveOperation();
}

// ── 턴이 넘어간 표시 ─────────────────────────────────────────────────
//
// 「작전 종료」를 눌러도 화면이 그대로였다. 숫자 하나가 조용히 1 올라갈 뿐이라,
// 눌렀는데 아무 일도 안 일어난 것처럼 보였다 — 실제로는 적이 한 바퀴 다 두고
// 보급까지 들어온 뒤인데도. 판 한가운데를 잠깐 덮어서 "여기서 하루가 끊겼다"를
// 눈으로 보여준다.
//
// 누르는 것을 막지 않는다(pointer-events: none). 이건 확인 창이 아니라 화면이
// 넘어가는 표시이므로, 성급한 사람은 그 위로 그냥 다음 수를 두면 된다.
//
// 「DAY 3」과 「1944.08.09」를 둘 다 만들어 놓고 눈으로 보고 골랐다. 날짜로 간다.
// 며칠째인가는 위쪽 「작전일 3 / 14」가 이미 말해 주고 있어서, 여기서 한 번 더
// 세는 것은 같은 말의 반복이었다. 날짜는 대신 이 판이 1944년 어느 계절인지를
// 얹어 준다 — 작전마다 첫날을 다르게 잡아 둔 것이 그래야 뜻을 갖는다.
// 뜨고 지는 속도. 여기 숫자와 styles.css의 .turn-card 전환 시간은 짝이다 —
// 한쪽만 고치면 글자가 아직 보이는데 화면에서 치워지거나, 다 사라진 자리를
// 한참 붙들고 있게 된다.
const turnCardFadeInMs = 620;
const turnCardHoldMs = 1000;
const turnCardFadeOutMs = 900;
const turnCardEl = document.createElement("div");
turnCardEl.className = "turn-card";
turnCardEl.hidden = true;
// 창 한가운데가 아니라 지도 한가운데다. 창을 기준으로 잡으면 왼쪽 지휘판 몫만큼
// 밀려서, 판 위가 아니라 판 왼쪽 어깨에 뜬다.
(document.querySelector(".battlefield-wrap") ?? document.body).appendChild(turnCardEl);
let turnCardTimer = null;

// 작전마다 첫날이 다르다. 날짜를 안 쥐고 있으면 「1944.12.19」를 만들 수가 없고,
// 여섯 작전이 다 같은 날이면 날짜를 쓰는 뜻이 없다(1944년 어디쯤인가가 곧
// 그 작전의 성격이다 — 여름의 돌파와 12월의 사수는 같은 전쟁의 다른 계절이다).
function missionDate(turn) {
  const start = findScenario(state?.scenarioId ?? defaultScenarioId)?.startDate ?? [1944, 6, 6];
  // Date로 더하는 이유는 월말을 손으로 넘기면 30일과 31일에서 반드시 틀리기 때문이다.
  const date = new Date(start[0], start[1] - 1, start[2] + Math.max(0, turn - 1));
  return {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    day: String(date.getDate()).padStart(2, "0"),
  };
}

// 무전 기록에 남기는 날짜 줄. 가운데 뜨는 날짜 판과 같은 날짜를 쓴다 — 둘이
// 다르면 어느 쪽이 맞는지 확인할 방법이 플레이어에게 없다.
function logDayLine() {
  const { year, month, day } = missionDate(state.turn);
  addLog(`${year}.${month}.${day}`, "day");
}

function showTurnCard() {
  if (!turnCardEl || state?.gameOver) return;
  const left = turnsRemaining();
  const deadline = Number.isFinite(left) ? `기한 ${left}일 남음` : "기한 없음";
  const { year, month, day } = missionDate(state.turn);
  const headline = `${year}.${month}.${day}`;
  turnCardEl.innerHTML = `
    <p class="turn-card-eyebrow">${state.mission?.name ?? ""}</p>
    <p class="turn-card-main">${headline}</p>
    <p class="turn-card-sub">${deadline}</p>
  `;
  turnCardEl.hidden = false;
  // 붙였다 바로 클래스를 주면 브라우저가 처음 상태를 못 보고 건너뛴다 — 한 프레임 쉰다.
  window.clearTimeout(turnCardTimer);
  turnCardEl.classList.remove("show");
  requestAnimationFrame(() => turnCardEl.classList.add("show"));
  // 다 뜬 뒤에 1초를 온전히 세워 둔다. 그래서 기다리는 시간은 "떠오르는 동안 +
  // 1초"다 — 떠오르는 시간까지 1초 안에 밀어 넣으면 다 밝아지자마자 곧바로
  // 지기 시작해서, 읽을 틈이 없다.
  turnCardTimer = window.setTimeout(() => {
    turnCardEl.classList.remove("show");
    // 다 잦아들고 나서 치운다. 사라지는 시간(styles.css의 .turn-card)보다 짧게
    // 잡으면 아직 보이는 것을 hidden으로 꺼서 뚝 끊긴다.
    turnCardTimer = window.setTimeout(() => {
      turnCardEl.hidden = true;
    }, turnCardFadeOutMs + 60);
  }, turnCardFadeInMs + turnCardHoldMs);
}

function advanceConstructions(owner) {
  // 삽을 든 사람이 없으면 공사도 없다. 예전에는 시공하던 공병대가 죽어도 공사가
  // 혼자 굴러가 완공됐다 — 공병대를 잡는 것이 아무 의미가 없었다는 뜻이다.
  // 다리가 끊기면서 그 위에 있던 공병대가 통째로 물에 빠지는 경우가 생겨 더 자주
  // 드러난다. 시공자가 판에서 사라진 공사는 여기서 접는다.
  const abandoned = state.constructions.filter(
    (construction) => construction.owner === owner && !state.units.some((unit) => unit.id === construction.builderId),
  );
  abandoned.forEach((construction) =>
    addLog(t("{side} {what} › 시공 부대 소실 · 공사 중단", { side: sideName(construction.owner), what: constructionName(construction.type) })),
  );
  if (abandoned.length) state.constructions = state.constructions.filter((construction) => !abandoned.includes(construction));

  state.constructions
    .filter((construction) => construction.owner === owner)
    .forEach((construction) => {
      construction.remaining -= 1;
      if (construction.remaining > 0) {
        // 이제 양측이 함께 공사하므로 누구 공사인지 적어야 로그가 읽힌다.
        addLog(t("{side} {what} › 완공까지 {n}일", { side: sideName(construction.owner), what: constructionName(construction.type), n: construction.remaining }));
      }
    });

  const completed = state.constructions.filter((construction) => construction.owner === owner && construction.remaining <= 0);
  completed.forEach((construction) => completeConstruction(construction));
  state.constructions = state.constructions.filter((construction) => construction.remaining > 0);
}

function completeConstruction(construction) {
  if (construction.type === "depot") {
    state.bases.push({ x: construction.x, y: construction.y, owner: construction.owner, production: 4, efficiency: 1, builtByEngineer: true });
    state.improvements.push({ type: "depot", owner: construction.owner, x: construction.x, y: construction.y });
  } else {
    state.improvements.push({ type: construction.type, owner: construction.owner, x: construction.x, y: construction.y });
  }
  addLog(t("{side} {what} › 완공", { side: sideName(construction.owner), what: constructionName(construction.type) }));
  if (construction.owner === "player") playNoticeSound("work_complete");
}

// 자세별 목표 편성비. 숫자는 "몇 기"가 아니라 "몇 할"이다 — 정원이 늘면 함께 는다.
// 수비는 진지에서 쏘는 포가, 공격은 밀고 들어가는 기동이, 사냥은 발이 필요하다.
// 예전에는 편성이 아니라 각본이었다: 전차 세 대를 채우면 그 뒤로는 영원히 보병.
// 그래서 적의 편성은 미션이 무엇이든 똑같았고, 미션은 바뀌어도 적은 안 바뀌었다.
const enemyForceMix = {
  attack: { armor: 0.3, infantry: 0.4, artillery: 0.1, spArtillery: 0.2 },
  defend: { armor: 0.15, infantry: 0.45, artillery: 0.3, spArtillery: 0.1 },
  hunt: { armor: 0.4, infantry: 0.45, artillery: 0.05, spArtillery: 0.1 },
};

// 정원은 싸우는 부대만 센다. 공병대는 짓고 대대 사령부는 보급한다 — 둘 다
// 전선에 세우려고 뽑는 부대가 아니다. 이걸 안 걸렀더니 사령부 두 기를 든 쪽은
// 정원 여섯 중 둘을 앉아서 잃었고, 보급품 216을 쌓아둔 채 한 기도 못 불렀다.
function isCombatUnit(unit) {
  return unit.type !== "engineer" && unit.type !== "battalionHQ";
}

// 두 진영이 서로 다른 문으로 병력을 낸다.
//
// 아군을 막는 것은 보급품 하나뿐이다. 정원과 보급품, 두 개의 문이 나란히 서
// 있으면 사람은 늘 먼저 닫히는 문만 본다. 보급품 137을 깔고 앉은 채 "정원
// 6개를 채웠습니다"만 읽고 있으면, 보급이라는 이 게임의 본줄기가 화면에서
// 사라진다. 뽑을 수 있는 만큼 뽑되 그 값을 보급품으로 치르게 하는 편이,
// 편제표 한 줄로 막는 것보다 낫다. 무한정 쏟아지지는 않는다 — 사령부가 부대를
// 낳을 수 있는 자리는 제 칸과 둘레 여덟 칸뿐이라, 한 턴에 나올 수 있는 양에는
// 여전히 끝이 있다.
//
// 이제 두 진영이 같은 문으로 병력을 낸다.
//
// 아군도 적도 막는 것은 보급품과 자리 둘뿐이다. 적한테만 걸려 있던 「거점 수 ×
// 기지당 정원」은 없앴다. 그 상한이 있던 동안 적은 이틀에 하나씩 여섯 기까지만
// 세웠고, 아군은 보급품이 있는 만큼 한 턴에 셋도 세웠다 — 같은 판에서 두 편이
// 다른 규칙으로 싸운 것이다.
//
// 땅을 잃으면 여전히 군을 잃는다. 거점이 줄면 수입이 줄고, 수입이 줄면 못 뽑는다.
// 상한이라는 두 번째 문이 없어도 결론은 같은 곳에 닿는다 —
// baseLossGraceTurns의 붕괴 유예와 같은 방향이다.
//
// 대신 적에게는 목표가 있다. 아군 전투 부대 수를 난이도 배율만큼 따라간다.
// 이 방식은 enemyDepotTarget·desiredEnemyEngineers가 이미 쓰고 있는 것과 같다 —
// 적의 규모를 지도 크기나 고정 숫자가 아니라 플레이어가 실제로 세운 것에 맞춘다.
// 그래서 어느 지도에서든 손볼 값이 없다. 아군이 얇게 가면 적도 얇고, 아군이
// 부풀리면 적도 따라 부푼다. 최소 1은 깔아 둔다 — 아군 전투 부대가 0이 되는
// 순간(사령부만 남은 판) 적 증원이 통째로 죽으면 판이 굳는다.
function enemyForceTarget() {
  return Math.max(1, Math.round(combatCountFor("player") * currentDifficulty().force));
}

function combatCountFor(owner) {
  return state.units.filter((unit) => unit.owner === owner && isCombatUnit(unit)).length;
}

// 사령부는 서 있는데 부대를 놓을 자리가 없다 — 지휘 범위 안이 통째로 막혔다는 뜻이다.
// 적이 둘러쌌든 제 부대로 꽉 찼든 결과는 같다: 증원이 안 나온다.
//
// 새 규칙을 만드는 것이 아니라 이미 일어나던 일에 이름을 붙이는 것이다. findSpawn이
// 자리를 못 찾으면 예전에도 증원은 없었고, 다만 화면에 아무 말이 없어서 사람은
// 단추가 고장 난 줄 알았다. 지도와 무관하게 돌아간다 — 재는 자가 findSpawn 하나뿐이라
// 지휘 범위를 바꾸든 다리를 놓든 같이 움직인다.
function recruitableTypes(owner) {
  return Object.keys(unitTypes).filter((type) => canRecruitType(owner, type));
}

function recruitEncircled(owner) {
  if (!battalionHQs(owner).length) return false;
  return !recruitableTypes(owner).some((type) => findSpawn(owner, type));
}

// 지금 무엇이 모자란가. 편성비에서 가장 크게 벌어진 병종을 부른다.
// 여유가 있으면 같은 값일 때 비싼 쪽을 고른다 — 보급품 137을 깔고 앉아
// 3원짜리 보병만 부르던 것이 후반이 무너지던 이유였다.
function enemyRecruitChoice(combat, target, flush) {
  const mix = enemyForceMix[enemyPosture()] ?? enemyForceMix.attack;
  let best = null;
  Object.entries(mix).forEach(([type, share]) => {
    if (!canRecruitType("enemy", type)) return;
    const cost = unitTypes[type]?.cost ?? Infinity;
    if (state.enemyResources < cost) return;
    if (!findSpawn("enemy", type)) return;
    const have = combat.filter((unit) => unit.type === type).length;
    const shortfall = share * target - have;
    // 여유가 없으면 모자란 병종만 본다. 여유가 있으면 목표가 빈 만큼은 채운다.
    if (shortfall <= 0 && !flush) return;
    const score = shortfall * 10 + (flush ? cost : 0);
    if (!best || score > best.score) best = { type, score };
  });
  return best?.type ?? null;
}

function maybeEnemyRecruit() {
  // 사령부가 없으면 증원도 없다. 플레이어와 같은 규칙이다. 한 번만 적어 준다 —
  // 매 턴 적으면 로그가 같은 문장으로 도배된다.
  if (!battalionHQs("enemy").length) {
    if (!state.enemyRecruitHalted) {
      state.enemyRecruitHalted = true;
      addLog(t("{side} › 대대사령부 상실 · 예비대 편성 중단", { side: sideName("enemy") }));
    }
    return;
  }
  state.enemyRecruitHalted = false;

  // 공병대를 먼저 본다. 경제를 키우는 부대가 전투 부대에 밀려 영영 안 나오면
  // 적 생산은 첫 턴 그대로 굳는다.
  if (maybeEnemyRecruitEngineer()) return;

  // 예전에는 여기서 「이틀에 한 번」 같은 주기를 봤다. 그 주기가 없어졌다 —
  // 아군은 보급품이 있는 만큼 한 턴에 여러 기를 세우는데 적만 하루 걸러 하나면
  // 두 편이 다른 규칙으로 싸운다. 이제 적도 한 턴 안에서 돌면서, 아군과 똑같이
  // 보급품이 떨어지거나 사령부 둘레에 빈 칸이 없을 때 멈춘다.
  const target = enemyForceTarget();
  const mix = enemyForceMix[enemyPosture()] ?? enemyForceMix.attack;
  const cheapest = Math.min(...Object.keys(mix).map((key) => unitTypes[key]?.cost ?? Infinity));
  let placed = 0;
  let blockedByMoney = false;
  let blockedBySpace = false;
  // 사령부 지휘 범위 안의 빈 칸은 한 줌이라 실제로는 몇 바퀴면 끝난다. 그래도
  // 상한을 박아 둔다 — 조건 하나가 틀어져도 판이 멈추지는 않게.
  for (let guard = 0; guard < 32; guard += 1) {
    const combat = state.units.filter((unit) => unit.owner === "enemy" && isCombatUnit(unit));
    if (combat.length >= target) break;
    const flush = state.enemyResources >= enemyRecruitSurplus;
    const type = enemyRecruitChoice(combat, target, flush);
    if (!type) {
      // 고를 것이 없는 이유가 돈인지 자리인지를 갈라 둔다. 둘은 사람이 할 수 있는
      // 대응이 다르다 — 돈이면 거점을 더 먹어야 하고, 자리면 포위를 풀어야 한다.
      if (state.enemyResources < cheapest) blockedByMoney = true;
      else blockedBySpace = true;
      break;
    }
    const spawn = findSpawn("enemy", type);
    if (!spawn) {
      blockedBySpace = true;
      break;
    }
    state.enemyResources -= unitTypes[type].cost;
    state.units.push(deployReinforcement("enemy", type, spawn.x, spawn.y));
    addLog(t("{unit} 예비대 투입", { unit: sideUnitLabel("enemy", type) }));
    placed += 1;
  }

  // 막힌 이유는 한 턴에 한 줄만 적는다. 한 기마다 적으면 로그가 같은 문장으로 덮인다.
  const encircled = recruitEncircled("enemy");
  if (!encircled) state.enemyEncircleNoted = false;
  if (placed) return;
  if (blockedByMoney) {
    addLog(t("{side} › 보급 부족 · 예비대 투입 지연", { side: sideName("enemy") }));
    return;
  }
  if (!blockedBySpace) return;
  if (!encircled) {
    addLog(t("{side} › 전개 공간 없음 · 예비대 투입 지연", { side: sideName("enemy") }));
    return;
  }
  // 포위는 풀리기 전까지 계속되는 상태다. 상태는 한 번만 알린다.
  if (!state.enemyEncircleNoted) {
    state.enemyEncircleNoted = true;
    addLog(t("{side} › 사령부 포위 · 증원 불가", { side: sideName("enemy") }));
  }
}

// 짓는 중인 것까지 함께 센다. 완성된 것만 세면 같은 목표를 두 번 세우게 된다.
function enemyDepotCount() {
  const built = state.bases.filter((base) => base.owner === "enemy" && base.builtByEngineer).length;
  const building = state.constructions.filter((work) => work.owner === "enemy" && work.type === "depot").length;
  return built + building;
}

function depotCountFor(owner) {
  return state.bases.filter((base) => base.owner === owner && base.builtByEngineer).length;
}

// 적의 창고 목표는 고정 숫자가 아니라 하한이다. 기한 없는 작전에서 플레이어가
// 공병대 여러 기로 계속 창고를 늘리면, 고정 목표를 든 적은 반드시 뒤처진다.
// 그래서 목표는 "플레이어가 지은 만큼"까지 따라 올라간다 — 앞지르지는 않는다.
function enemyDepotTarget() {
  if (enemyDepotGoal <= 0) return 0;
  if (!worthBuildingDepot()) return enemyDepotCount();
  const economy = Math.max(enemyDepotGoal, depotCountFor("player"));
  // 개통 임무의 창고는 경제가 아니라 작전 수단이다. 목표까지 선을 늘리려면
  // 창고를 앞으로 밀어야 하는데, 경제 목표를 다 채웠다는 이유로 삽을 놓으면
  // 적은 자기 승리 조건을 스스로 포기하는 셈이 된다. 그래서 두 기를 더 얹는다.
  return enemyOpenSupplyObjective() ? economy + 2 : economy;
}

// 완성도 못 할 공사는 시작하지 않는다. 짓는 기간만큼은 더 굴려야 본전이라,
// 남은 턴이 그에 못 미치면 적은 삽 대신 총을 든다. 기한이 없으면 계속 짓는다.
function worthBuildingDepot() {
  const limit = missionTurnLimit();
  if (!Number.isFinite(limit)) return true;
  return limit - state.turn >= constructionDuration("depot") * 2;
}

// 공병대 수도 플레이어를 따라간다. 플레이어가 3기로 계속 짓는데 적이 1기로 맞서면
// 격차는 좁혀지지 않는다. 에디터의 한도는 그 위에 씌우는 천장이다.
function desiredEnemyEngineers() {
  const playerEngineers = state.units.filter((unit) => unit.owner === "player" && unit.type === "engineer").length;
  return Math.min(enemyEngineerLimit, Math.max(1, playerEngineers));
}

function maybeEnemyRecruitEngineer() {
  if (!canRecruitType("enemy", "engineer")) return false;
  const target = enemyDepotTarget();
  if (target <= 0) return false;
  const engineers = state.units.filter((unit) => unit.owner === "enemy" && unit.type === "engineer").length;
  if (engineers >= desiredEnemyEngineers()) return false;
  // 이미 목표만큼 짓고 있거나 지을 손이 충분하면 더 뽑지 않는다.
  if (engineers + enemyDepotCount() >= target) return false;
  const spawn = findSpawn("enemy", "engineer");
  if (!spawn) return false;
  // 뽑고 나서 지을 돈이 없으면 공병대는 놀고만 있게 된다. 공사비까지 남는지 본다.
  const cost = unitTypes.engineer.cost + (constructionCosts.depot ?? 0);
  if (state.enemyResources < cost) return false;
  state.enemyResources -= unitTypes.engineer.cost;
  state.units.push(deployReinforcement("enemy", "engineer", spawn.x, spawn.y));
  addLog(t("{side} › 공병대 투입 · 후방 보급 공사", { side: sideName("enemy") }));
  return true;
}

function attack(attacker, defender) {
  if (isTowedArtillery(attacker)) {
    addLog(t("포격 불가 › 견인 중 · 포를 전개할 것"));
    return;
  }

  if (ridgeBlocksFire(attacker, defender)) {
    addLog(t("포격 무효 › 능선이 사선을 차단"));
    return;
  }

  // 쏘면 드러난다. 안개 속에서 포문을 열면 총구 화염과 포성이 자리를 알려주니,
  // 매복은 한 번뿐이고 그 다음은 자리를 옮겨야 하는 문제가 된다. 자리를 따로 적어 두는
  // 이유는 쏘고 나서 부대가 죽거나 밀려나도 "거기서 쐈다"는 사실은 남아야 하기 때문이다.
  attacker.firedFrom = { x: attacker.x, y: attacker.y };

  const damage = combatDamage(attacker, defender);
  // 다리 위의 부대를 쏘면 포탄은 다리에도 떨어진다. 절반은 널판이 받고 나머지가
  // 부대에 간다 — 나누어 갖되 다리 몫에서 다리 방어도를 또 빼지는 않는다. 그건
  // 다리를 직접 겨냥했을 때 쓰는 값이다.
  //
  // 그래서 "저 다리를 건너 오는 적을 쏘면 내가 나중에 쓸 다리가 상한다"는 문제가
  // 매번 따라온다. 특히 부교(체력 3)는 위에 부대를 세워 둔 채로 한 번 맞으면
  // 다리와 부대가 같이 간다.
  const deck = deckAt(defender.x, defender.y);
  const deckShare = deck ? Math.floor(damage / 2) : 0;
  const unitShare = damage - deckShare;
  playUnitSound(attacker, "attack");
  defender.hp -= unitShare;
  defender.hitSinceRefit = true;
  recordCombatEvent(attacker, defender, { damage: unitShare, killed: defender.hp <= 0 });
  addLog(
    deckShare
      ? `${sideUnitLabel(attacker)} › ${sideUnitLabel(defender)} 피해 ${unitShare} · ${bridgeKinds[deck.type].name} 피해 ${deckShare}`
      : `${sideUnitLabel(attacker)} › ${sideUnitLabel(defender)} 피해 ${damage}`,
  );

  const baseUnderDefender = getBaseAt(defender.x, defender.y);
  if (baseUnderDefender?.owner === defender.owner) damageBaseProduction(baseUnderDefender, attacker, { collateral: true });

  if (defender.hp <= 0) {
    // 격파음은 공격음보다 조금 늦게 깔아야 "쏘고 나서 터졌다"로 들린다.
    // 사격과 동시에 터지면 둘이 한 덩어리로 뭉개진다.
    window.setTimeout(() => playDestroySound(defender), 260);
    state.units = state.units.filter((unit) => unit.id !== defender.id);
    addLog(t("{unit} 격파", { unit: sideUnitLabel(defender) }));
    chronicleKill(attacker, defender);
    if (deckShare) damageDeck(deck, deckShare);
    return;
  }

  // 다리를 먼저 처리한다. 다리가 끊기면 위의 부대는 물로 가므로, 죽은 부대가
  // 반격하는 일이 없어야 한다.
  if (deckShare && damageDeck(deck, deckShare)) return;

  resolveCounterattack(attacker, defender);
}

// 반격은 "살아남은 방어자가 자기 사거리로 공격자를 물 수 있는가"만 본다.
// 포병이 사거리 3에서 때리면 사거리 1인 방어자는 닿지 않으므로 반격이 없다 —
// 포병 면제를 따로 예외로 적지 않고 사거리 규칙에서 저절로 나오게 한다.
// 야포/자주포는 근접 방어 무기가 아니므로 반격하지 않는다(그래서 artilleryVulnerability가 있다).
function canCounterattack(defender, attacker) {
  if (!defender || !attacker || defender.hp <= 0) return false;
  if (isArtilleryUnit(defender)) return false;
  if (supplyStatus(defender).level === "isolated") return false;
  if (distance(defender, attacker) > unitTypes[defender.type].range) return false;
  return !ridgeBlocksFire(defender, attacker);
}

// 반격은 반응이므로 행동력(acted/moved)을 쓰지 않는다. 맞았다고 다음 턴까지 벌받으면
// 방어가 이중으로 손해다. 대신 위력은 counterattackFactor로 깎아서,
// 선공이 여전히 유리하되 공짜는 아니게 만든다.
// 반격을 숨기면 규칙이 아니라 함정이 된다. 공격 전에 "내가 몇 대 때리고
// 몇 대 맞는지"를 그대로 보여준다. 계산은 실제 전투와 같은 함수를 쓴다 —
// 예측과 결과가 다르면 플레이어는 규칙을 못 배운다.
function attackForecast(attacker, defender) {
  if (!attacker || !defender || attacker.owner === defender.owner) return null;
  // 사거리 밖은 여기서 끊는다. canAttack/combatDamage는 보급 BFS를 타므로
  // 매 렌더마다 전 유닛에 대해 돌리면 비싸다.
  if (distance(attacker, defender) > unitTypes[attacker.type].range) return null;
  if (!canAttack(attacker, defender)) return null;

  const damage = combatDamage(attacker, defender);
  const kills = damage >= defender.hp;
  const counter = !kills && canCounterattack(defender, attacker)
    ? Math.max(1, Math.round(combatDamage(defender, attacker) * counterattackFactor))
    : 0;
  return { damage, kills, counter, counterKills: counter >= attacker.hp };
}

function formatAttackForecast(forecast) {
  const head = `예상 피해 ${forecast.damage}${forecast.kills ? " · 격파" : ""}`;
  if (forecast.kills) return head;
  if (!forecast.counter) return `${head} · 반격 없음`;
  return `${head} · 반격 ${forecast.counter}${forecast.counterKills ? " (아군 격파)" : ""}`;
}

// AI는 아직 표적 점수 계산이 없고 "가장 가까운 적"만 친다(5번 항목).
// 반격이 생긴 이상 그대로 두면 손상된 부대가 고지의 전차에 달려들어 자살한다.
// 표적 선정을 통째로 고치는 건 5번으로 미루고, 여기서는 최소한의 금지선만 긋는다:
// 상대를 못 죽이는데 반격에 내가 죽는 공격은 하지 않는다.
function attackIsSuicidal(attacker, defender) {
  if (combatDamage(attacker, defender) >= defender.hp) return false;
  if (!canCounterattack(defender, attacker)) return false;
  return Math.max(1, Math.round(combatDamage(defender, attacker) * counterattackFactor)) >= attacker.hp;
}

function resolveCounterattack(attacker, defender) {
  if (!canCounterattack(defender, attacker)) {
    if (isArtilleryUnit(attacker) && distance(attacker, defender) > unitTypes[defender.type].range) {
      addLog(t("{unit} › 사거리 밖 포격 · 반격 없음", { unit: unitLabel(attacker) }));
    }
    return;
  }

  // 반격도 사격이다. 되받아친 쪽 역시 자기 자리를 알린다.
  defender.firedFrom = { x: defender.x, y: defender.y };
  const damage = Math.max(1, Math.round(combatDamage(defender, attacker) * counterattackFactor));
  attacker.hp -= damage;
  attacker.hitSinceRefit = true;
  recordCombatEvent(defender, attacker, { damage, killed: attacker.hp <= 0, counter: true });
  addLog(t("{unit} › 반격 · {foe} 피해 {n}", { unit: sideUnitLabel(defender), foe: unitLabel(attacker), n: damage }));

  if (attacker.hp <= 0) {
    window.setTimeout(() => playDestroySound(attacker), 260);
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    addLog(t("{unit} 반격에 격파", { unit: sideUnitLabel(attacker) }));
    chronicleKill(defender, attacker, { counter: true });
  }
}

function combatDamage(attacker, defender) {
  const attackerSpec = unitTypes[attacker.type];
  const defenderTile = tileAt(defender.x, defender.y);
  const elevationDelta = tileAt(attacker.x, attacker.y).elevation - defenderTile.elevation;
  const heightModifier = elevationDelta > 0 ? 2 : elevationDelta < 0 ? -2 : 0;
  const artilleryPenalty = isArtilleryUnit(attacker) ? defenderTile.artilleryCover : 0;
  const commander = commanderFor(attacker.owner);
  const directArtilleryVulnerability = isArtilleryUnit(defender) && unitTypes[attacker.type].range <= 1 ? artilleryVulnerability(defender) : 0;
  const defenderSupplyPenalty = supplyDefensePenalty(defender);
  // 부대 자체의 방어력. 지형 보정과 같은 단위로 빠진다. 값을 안 준 병종은 0이라
  // 지금까지의 피해표가 그대로 남는다 — 지금은 대대 사령부만 이 값을 가진다.
  const defenderArmor = unitTypes[defender.type].defense ?? 0;
  // 지휘관의 공격 보정은 싸우는 부대에만 붙는다. 정액이라 공격력이 낮은 쪽이
  // 상대적으로 크게 받는데, 그 결과 공병대(공3)와 소총분대(공4)의 개활지 실피해가
  // 똑같이 6이 됐다. 체력도 이동도 나은 공병대가 1원 더 주면 되는 상위호환이었고,
  // 대대 사령부(공1)조차 보병의 3분의 2를 때렸다. 지휘관은 전투를 지휘하지,
  // 삽질과 보급을 지휘해 적을 때리지 않는다.
  const commanderAttack = isCombatUnit(attacker) ? commander.attack : 0;
  // 엄폐는 지형만이 아니라 거점에서도 온다. 셋(지형·거점·부대)이 각각 따로 빠지므로
  // 거점 위의 대대 사령부는 3 + 3이 겹쳐 정면으로는 좀처럼 뚫리지 않는다.
  // 능선 방어방향은 여기서만 빠진다. 미리보기도 자살 공격 판정도 이 함수를 거치므로
  // 화면에 뜨는 숫자와 실제로 들어가는 피해가 저절로 같아진다.
  const ridgeFacing = ridgeFacingBonus(attacker, defender);
  const rawDamage = attackerSpec.attack + heightModifier + commanderAttack + directArtilleryVulnerability + defenderSupplyPenalty - coverAt(defender.x, defender.y) - defenderArmor - artilleryPenalty - ridgeFacing;
  const moraleAdjusted = rawDamage * (effectiveMorale(attacker) / 100);
  return Math.max(1, Math.round(moraleAdjusted));
}

function raidBase(attacker, base) {
  if (isTowedArtillery(attacker)) {
    addLog(t("거점 포격 불가 › 견인 중 · 포를 전개할 것"));
    return;
  }

  if (ridgeBlocksFire(attacker, base)) {
    addLog(t("거점 포격 불가 › 능선 뒤 · 사선 없음"));
    return;
  }
  addLog(t("{unit} › ({x},{y}) 보급 거점 타격", { unit: sideUnitLabel(attacker), x: base.x, y: base.y }));
  playUnitSound(attacker, "attack");
  recordCombatEvent(attacker, base, { base: true });
  damageBaseProduction(base, attacker);
}

// 거점을 깎는 길은 두 가지이고, 값이 서로 달라야 한다.
// - 의도적 포격(raidBase): 점령을 포기하고 경제만 죽인다. 잔존율 0.7, 포병은 두 번.
// - 부수 피해(collateral): 거점 위 방어자를 때리다 시설이 상한다. 잔존율 0.9, 포병 보너스 없음.
// 둘을 같은 계수로 묶었더니 점령이 곧 파괴가 됐다. 포병 2배는 "포격을 골랐다"는
// 선택에 붙는 보상이지, 유닛을 때리는 김에 딸려오는 공짜가 아니다.
// 어느 쪽이든 baseEfficiencyFloor 밑으로는 안 내려간다.
function damageBaseProduction(base, attacker, { collateral = false } = {}) {
  const factor = collateral ? combatBaseDamage : raidEfficiencyFactor;
  // 하한에 닿아 값이 안 움직여도 맞은 건 맞은 거다. 표식을 아래 return 뒤에 두면
  // 하한에 닿은 거점이 포화 속에서 복구를 시작한다.
  markBaseHit(base);
  if (!applyBaseEfficiencyLoss(base, factor)) return;
  addLog(t("{side} 거점 생산 효율 {n}%로 하락", { side: sideName(base.owner), n: Math.round(base.efficiency * 100) }));

  if (!collateral && isArtilleryUnit(attacker) && applyBaseEfficiencyLoss(base, raidEfficiencyFactor)) {
    addLog(t("{unit} 포격 › 보급 시설 피해 누적", { unit: unitLabel(attacker) }));
  }
}

// 하한에 닿았으면 아무 일도 안 일어난다. 이때 로그까지 찍으면 "떨어졌습니다"가
// 매 턴 쌓이면서 실제로는 멀쩡한 거점을 무너지는 중인 것처럼 읽히게 만든다.
// 포격당한 거점은 그 턴에 복구하지 못한다. 부대의 재편성과 같은 이유다 — 여기도
// 인접만 봤기 때문에, 사거리 밖에서 쏘는 포병은 복구를 전혀 방해하지 못했다.
function markBaseHit(base) {
  base.hitSinceRepair = true;
}

function applyBaseEfficiencyLoss(base, factor) {
  const next = Math.max(baseEfficiencyFloor, base.efficiency * factor);
  if (next >= base.efficiency) return false;
  base.efficiency = next;
  return true;
}

// 두절 지속 턴에 따른 누진 피해. 선형이면 보병(체력 10)이 녹는 데 20턴 가까이 걸려
// 위협으로 안 느껴진다. 누진이면 유예가 끝난 뒤 4~5턴에 무너져서
// "지금 돌아가면 산다, 뭉개면 죽는다"가 된다.
function collapseDamageFor(unit) {
  const turns = unit.hqOutTurns ?? 0;
  if (turns <= collapseGraceTurns) return 0;
  return Math.min(collapseMaxDamage, turns - collapseGraceTurns);
}

function applySupplyAttrition(owner) {
  const mine = state.units.filter((unit) => unit.owner === owner);

  // 전술적 포위(3면)는 즉시·정액. 전략적 보급 두절은 유예 후·누진. 같은 결말, 다른 경로.
  const encircled = mine.filter((unit) => supplyStatus(unit).level === "isolated");
  encircled.forEach((unit) => {
    unit.hp -= isolatedAttritionDamage;
  });
  if (encircled.length) {
    addLog(t("{side} › 고립 {n}개 부대 포위 압박 · 각 피해 {dmg}", { side: sideName(owner), n: encircled.length, dmg: isolatedAttritionDamage }));
  }

  const collapsing = mine
    .filter((unit) => supplyStatus(unit).level === "cut")
    .map((unit) => ({ unit, damage: collapseDamageFor(unit) }))
    .filter((entry) => entry.damage > 0);
  collapsing.forEach(({ unit, damage }) => {
    unit.hp -= damage;
  });
  if (collapsing.length) {
    const total = collapsing.reduce((sum, entry) => sum + entry.damage, 0);
    addLog(t("{side} › 보급 두절 {n}개 부대 붕괴 · 총 피해 {dmg}", { side: sideName(owner), n: collapsing.length, dmg: total }));
  }

  const destroyed = state.units.filter((unit) => unit.owner === owner && unit.hp <= 0);
  if (destroyed.length) {
    destroyed.forEach((unit) => addLog(t("{unit} 보급 붕괴로 소멸", { unit: sideUnitLabel(unit) })));
    // 한 턴에 여러 부대가 함께 무너져도 소리는 한 번만 낸다. 겹쳐 울리면
    // 개수가 늘수록 커지는 잡음이 될 뿐이다.
    playDestroySound(destroyed[0]);
    state.units = state.units.filter((unit) => unit.hp > 0);
  }
}

// 두절이 몇 턴째인지만 센다. 사기 하락도 붕괴 소모도 전부 이 카운터에서 파생된다.
// 예전에는 여기서 protectedByFriendlySupplyBase(거점 1칸 이내)를 면제 기준으로 썼는데,
// 보급 표시(normalizedSupplyStatus)는 BFS 6칸을 정상으로 쳐서 둘이 어긋났다 —
// 화면에 "정상 보급"이라고 나오는 부대의 사기가 조용히 빠지고 있었다. 기준을 하나로 통일한다.
function updateBattalionSupplyPressure(owner) {
  state.units
    .filter((unit) => unit.owner === owner)
    .forEach((unit) => {
      if (supplyStatus(unit).level === "cut") {
        unit.hqOutTurns = (unit.hqOutTurns ?? 0) + 1;
      } else {
        unit.hqOutTurns = 0;
      }
    });
}

function replenishNearBattalionHQ(owner) {
  // 보급선이 끊긴 사령부는 병력을 보충해 주지 못한다. 보충할 물자가 안 들어오니까.
  const hqs = suppliedBattalionHQs(owner);
  if (!hqs.length) return;

  const recovered = state.units.filter((unit) =>
    unit.owner === owner &&
    unit.hp < unitTypes[unit.type].hp &&
    // 자기 자신은 뺀다 — 자기까지의 거리는 0이라 사령부가 매 턴 스스로 회복해 버린다.
    // 다만 사령부가 둘이면 서로 보충한다. 보급 판정과 같은 규칙이어야 한다.
    hqs.some((hq) => hq.id !== unit.id && distance(unit, hq) <= hqRecoveryRange)
  );

  recovered.forEach((unit) => {
    unit.hp = Math.min(unitTypes[unit.type].hp, unit.hp + 1);
  });

  if (recovered.length) addLog(t("{side} 대대사령부 › 인접 {n}개 부대 병력 +1", { side: sideName(owner), n: recovered.length }));
}

// 거점 위 재편성. 보급 거점은 여태 "생산 숫자가 붙은 칸"일 뿐이어서, 지형으로서는
// 개활지와 다를 게 없었다 — 밟을 이유가 점령 말고는 없었다는 뜻이다. 내가 가진 거점 위에
// 선 부대는 창고를 열어 병력을 다시 채운다. 사령부 보충과 겹쳐도 상관없다. 거점까지 물러난
// 부대가 사령부 곁에 있는 부대보다 빨리 회복하는 건 이상한 일이 아니다.
// 두절된 거점은 채워줄 물자가 없다 — 대대 보충과 같은 논리다.
function refitOnOwnBase(owner) {
  // 표식 지우기는 어떤 이유로 빠져나가든 먼저 끝낸다. 아래 두 줄 뒤에 두면 회복률이
  // 0이거나 거점이 없는 동안 표식이 영원히 남아, 규칙이 다시 켜진 첫 턴에 멀쩡한 부대까지
  // 한 번씩 회복을 건너뛴다.
  const wasHit = new Set(state.units.filter((unit) => unit.owner === owner && unit.hitSinceRefit).map((unit) => unit.id));
  state.units.forEach((unit) => {
    if (unit.owner === owner) unit.hitSinceRefit = false;
  });

  if (baseRepairRate <= 0) return;
  const depots = state.bases.filter((base) => base.owner === owner);
  if (!depots.length) return;

  const refitted = state.units.filter((unit) =>
    unit.owner === owner &&
    unit.hp < unitTypes[unit.type].hp &&
    depots.some((base) => base.x === unit.x && base.y === unit.y) &&
    // 붙어 있는 적이 있으면 재편성하지 못한다. repairOwnBases에는 처음부터 이 조건이
    // 있었는데 여기에만 빠져 있었다 — 창고는 포화 아래서 못 고치면서 부대는 고쳤다는 뜻이다.
    // 그 구멍이 규칙 하나를 통째로 망가뜨렸다. 거점 방어로 피해가 줄고 매 턴 1씩 차오르면
    // 수비수를 한 부대로 때리는 한 막타가 영영 안 나온다.
    nearestOpposingDistance(owner, unit.x, unit.y) > 1 &&
    // 인접만 보면 포병이 규칙을 통째로 우회한다. 사거리 5에서 쏘는 야포는 영원히
    // "붙어 있지 않은 적"이라, 거점 방어 3 + 포격 엄폐 2에 피해가 1로 깎이고 회복이 1이면
    // 정확히 상쇄된다 — 야포 백 대로 백 턴을 쏴도 수비수 한 기가 안 죽는다.
    // 맞았느냐를 봐야지 붙었느냐를 보면 안 된다. 턴 번호로는 비교할 수 없다 —
    // 적 턴의 피격과 아군 재편성 사이에 state.turn이 이미 올라가 있기 때문이다.
    !wasHit.has(unit.id)
  );

  refitted.forEach((unit) => {
    unit.hp = Math.min(unitTypes[unit.type].hp, unit.hp + baseRepairRate);
  });

  if (refitted.length) addLog(t("{side} › 거점 재편성 {n}개 부대 · 병력 +{hp}", { side: sideName(owner), n: refitted.length, hp: baseRepairRate }));
}

// 거점 복구. 효율은 여태 내려가기만 하는 값이었다 — 습격 한 번에 곱하기로 깎이고
// 되돌릴 길이 없었으니, 거점 하나로 시작하는 지금은 습격 서너 번으로 생산이 영구히
// 0에 수렴한다. 지고 나서가 아니라 지는 중에 되돌릴 방법이 있어야 방어에 값어치가 생긴다.
// 적이 붙어 있는 동안은 복구하지 못한다 — 포화 아래에서 창고를 다시 세울 수는 없다.
function repairOwnBases(owner) {
  if (baseEfficiencyRepair <= 0) return;
  const mended = state.bases.filter((base) => {
    if (base.owner !== owner || base.efficiency >= 1) return false;
    if (base.hitSinceRepair) return false;
    return nearestOpposingDistance(owner, base.x, base.y) > 1;
  });

  // 표식은 복구 여부와 상관없이 매번 지운다. mended가 비었다고 일찍 빠져나가면
  // 효율이 이미 1인 거점의 표식이 영원히 남아, 나중에 깎였을 때 복구가 안 된다.
  state.bases.forEach((base) => {
    if (base.owner === owner) base.hitSinceRepair = false;
  });
  if (!mended.length) return;

  mended.forEach((base) => {
    base.efficiency = Math.min(1, base.efficiency + baseEfficiencyRepair);
  });
  addLog(t("{side} › 거점 {n}곳 복구 · 생산 효율 상승", { side: sideName(owner), n: mended.length }));
}

// 반격이 생기면서 공격자가 attack() 안에서 죽을 수 있게 됐다. 호출부들은
// 공격 직후 captureBase(unit)을 부르므로, 죽은 부대가 거점을 점령하지 않도록 여기서 막는다.
function captureBase(unit) {
  if (!unit || unit.hp <= 0) return;
  const base = getBaseAt(unit.x, unit.y);
  if (!base || base.owner === unit.owner) return;
  // 무주공산 거점은 아무도 지키지 않았으니 부술 것도 없었다. 빼앗은 거점에만 붙는
  // 효율 감소를 여기에 그대로 적용하면, 먼저 달려간 보상이 "반쯤 부서진 거점"이 된다.
  // 그러면 아무도 안 가고 개편의 의도 자체가 죽는다.
  const wasNeutral = base.owner === "neutral";
  base.owner = unit.owner;
  if (wasNeutral) {
    addLog(t("{side} › ({x},{y}) 무혈 접수 · 효율 {n}%", { side: sideName(unit.owner), x: unit.x, y: unit.y, n: Math.round(base.efficiency * 100) }));
    addChronicle(
      `${sideUnitLabel(unit)} › (${unit.x},${unit.y}) 보급 거점 무혈 접수`,
      unit.owner === "player" ? "kill" : "loss",
    );
    return;
  }
  // 예전에는 여기서 무조건 raidEfficiencyFactor를 한 번 더 곱했다. 이중청구였다 —
  // 거점을 부순 것은 방금 그 부대를 없앤 공격들이고, 그 값은 attack()의 부수 피해에서
  // 이미 받았다. 점령은 부수는 행위가 아니라 부순 뒤에 들어가 앉는 행위다.
  // 값을 두 번 매기면 뺏은 거점이 껍데기가 되고, 부수기만 하는 쪽이 언제나 이긴다.
  applyBaseEfficiencyLoss(base, captureEfficiencyLoss);
  addLog(t("{side} › ({x},{y}) 거점 장악 · 효율 {n}%", { side: sideName(unit.owner), x: unit.x, y: unit.y, n: Math.round(base.efficiency * 100) }));
  addChronicle(
    `${sideUnitLabel(unit)} › (${unit.x},${unit.y}) 보급 거점 탈취`,
    unit.owner === "player" ? "kill" : "loss",
  );
}

function missionObjectives() {
  return state.mission?.objectives ?? [];
}

function objectivesFor(owner) {
  return missionObjectives().filter((objective) => objective.owner === owner);
}

// 좌표가 없는 목표(사령부 격파, 사수 대상)도 있다. 타일에 그릴 수 있는 건 좌표가 있는 것뿐이다.
function objectiveAt(x, y) {
  return missionObjectives().find((objective) => objective.x === x && objective.y === y);
}

// 아직 열리지 않은 목표가 있다. "여드레를 버틴 뒤에야 반격에 나선다" 같은 작전은
// 그날이 오기 전까지 목표가 없는 것과 같아야 한다 — 미리 가서 앉아 있어도 유지 턴이
// 쌓이면 안 되고, 달성 판정에도 걸리면 안 된다.
function objectiveOpen(objective) {
  return !objective.fromTurn || state.turn >= objective.fromTurn;
}

// 좌표가 있는 목표 전부. AI가 "어디로 가야 하는가"를 물을 때 보는 목록이고,
// 유지 턴이 도는 목표이기도 하다. 점령이든 개통이든 지도 위의 한 점을 두고
// 다투는 것은 같으므로, 자세·축선·초소는 이 목록 하나만 보면 된다.
function objectiveTiles(owner) {
  return objectivesFor(owner)
    .filter(objectiveOpen)
    .filter((objective) => objective.kind === "seize" || objective.kind === "supply");
}

// 이 칸이 그 진영의 거점 보급망에 "정상" 등급으로 이어져 있는가.
// 자는 부대에 쓰는 것과 똑같다(normalizedSupplyStatus의 거점 경로) — 목표만 다른
// 자를 쓰면 화면에 뜨는 보급 표시와 승패 판정이 서로 다른 말을 하게 된다.
// supplyLineCost는 상대 부대가 선 칸을 통과하지 못한다. 그래서 수비 측은
// 회랑 위에 서 있는 것만으로 개통을 끊을 수 있다 — 이게 이 목표의 승부처다.
function supplyOpenAt(owner, x, y) {
  const cost = supplyLineCost({ owner, x, y });
  return Number.isFinite(cost) && cost <= effectiveSupplyRange({ owner });
}

// 개통 목표를 클릭했을 때 보이는 한 줄. "안 된다"만 알려주면 플레이어는 무엇을
// 해야 할지 모른다. 길이 없는 것(다리)과 너무 먼 것(창고·철도)은 다른 문제다.
function objectiveSupplyText(objective) {
  const cost = supplyLineCost({ owner: objective.owner, x: objective.x, y: objective.y });
  if (!Number.isFinite(cost)) return t("단절 (도하로 없음)");
  const need = effectiveSupplyRange({ owner: objective.owner });
  return `${formatNumber(cost)} / ${formatNumber(need)}${cost <= need ? " " + t("개통") : " " + t("초과")}`;
}

function taggedUnits(owner, tag) {
  return state.units.filter((unit) => unit.owner === owner && unit.tag === tag);
}

// 이 부대가 미션에서 이름이 불린 부대인가. 불렸다면 그 이름을 돌려준다.
function missionRoleFor(unit) {
  if (!unit.tag) return "";
  const mine = missionObjectives().filter((objective) => objective.owner === unit.owner);
  // 사수 대상(protect)의 이름이 그 부대의 이름이다. 탈출 지점 이름을 부대에 붙이면 헷갈린다.
  const named = mine.find((objective) => objective.tag === unit.tag) ?? mine.find((objective) => objective.byTag === unit.tag);
  return named ? t(named.label) : "";
}

function objectiveHoldRequirement(objective) {
  return objective.holdTurns ?? objectiveHoldTurns;
}

// 좌표 뒤에 조사를 바로 붙이면 "(4, 12)을"처럼 읽히는 대로 틀린다. "지점"으로 끊고 붙인다.
function objectiveName(objective) {
  return t("{label} ({x}, {y}) 지점", { label: t(objective.label), x: objective.x, y: objective.y });
}

// 타일 하나에는 한쪽 부대만 설 수 있으므로(canMoveTo) 점유 = 장악이다.
// byTag가 붙은 목표는 아무 부대나로는 안 된다 — 그 부대가 직접 그 칸에 서야 한다(탈출 미션).
function controlsObjective(objective) {
  // 개통 목표는 밟는 것이 아니라 잇는 것이다. 그 칸이 비어 있어도 보급선이 닿으면
  // 달성이고, 부대를 올려놓아도 선이 끊겨 있으면 미달성이다.
  if (objective.kind === "supply") return supplyOpenAt(objective.owner, objective.x, objective.y);
  return state.units.some(
    (unit) =>
      unit.owner === objective.owner &&
      unit.x === objective.x &&
      unit.y === objective.y &&
      (!objective.byTag || unit.tag === objective.byTag),
  );
}

// 장악은 자기 턴이 끝나는 순간에만 한 칸 오른다. 사이에 상대 턴이 통째로 끼어 있으니
// 유지 턴이 2면 "상대의 반격을 한 번 넘기고도 그 자리에 남아 있어라"가 된다.
// 빼앗기면 0으로 돌아간다 — 누적이 아니라 유지여야 목표가 방어할 값어치를 가진다.
function advanceObjectiveHold(owner) {
  objectiveTiles(owner).forEach((objective) => {
    const holding = controlsObjective(objective);
    const previous = objective.held;
    objective.held = holding ? objective.held + 1 : 0;
    const need = objectiveHoldRequirement(objective);
    const where = objectiveName(objective);
    const opened = objective.kind === "supply";
    if (holding && objective.held < need) {
      const what = opened ? t("{where} 보급선 개통", { where }) : t("{where} 장악", { where });
      addLog(t("{side} › {what} · 유지 {held}/{need}턴", { side: sideName(owner), what, held: objective.held, need }));
    } else if (!holding && previous > 0) {
      const what = opened ? t("{where} 보급선 차단됨", { where }) : t("{where} 장악 상실", { where });
      addLog(t("{side} › {what} · 유지 턴 초기화", { side: sideName(owner), what }));
    }
  });
}

// 목표 하나가 이루어졌는가. 아래 두 함수가 같이 쓴다.
function objectiveMet(objective) {
  if (!objectiveOpen(objective)) return false;
  if (objective.kind === "seize" || objective.kind === "supply") return objective.held >= objectiveHoldRequirement(objective);
  if (objective.kind === "destroy") {
    const prey = objective.owner === "player" ? "enemy" : "player";
    return !state.units.some((unit) => unit.owner === prey && unit.type === objective.targetType);
  }
  return false;
}

// 달성된 "승리 목표". protect는 승리 목표가 아니라 실패 조건이라 여기서 빠진다.
//
// 같은 group 이름을 단 목표는 한 묶음이다 — 남북 두 집게가 다 닫혀야 포위이고,
// 하나만 성공하면 적은 그대로 빠져나간다. 그래서 묶음은 전부 이루어져야 이긴다.
// group이 없는 목표는 예전처럼 저 혼자로 이긴다.
function completedObjective() {
  const groups = new Map();
  const solo = [];
  missionObjectives().forEach((objective) => {
    if (!objective.group) {
      solo.push(objective);
      return;
    }
    const key = `${objective.owner}:${objective.group}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(objective);
  });
  for (const members of groups.values()) {
    if (members.every(objectiveMet)) return members[members.length - 1];
  }
  return solo.find(objectiveMet);
}

// 지켜야 할 대상이 사라졌으면 그 진영이 진다. 승리 목표보다 먼저 본다 —
// 사령부를 잃고서 같은 턴에 목표를 밟았다고 이기는 건 말이 안 된다.
function failedObjective() {
  return missionObjectives().find(
    (objective) => objective.kind === "protect" && taggedUnits(objective.owner, objective.tag).length === 0,
  );
}

// 목표 줄 뒤에 붙는 단서. 셋 다 "이 목표 하나만 봐서는 알 수 없는 것"이라
// 명령서에 반드시 적혀야 한다 — 언제부터 유효한지, 혼자로 되는지, 아무 부대나 되는지.
//
// 명령서 말고 지형 카드와 지도 툴팁도 이 함수를 부른다. 안 부르면 아직 열리지
// 않은 목표가 카드에서 살아 있는 목표와 똑같이 보인다 — 「유지 0/2턴」이 붙어
// 있는데 그 칸에 부대를 올려도 숫자가 영영 0이다(유지는 열린 목표만 센다).
// 폰에서는 명령서가 접힌 명령 패널 뒤에 있어서, 카드가 안 알려 주면 확인할
// 자리가 아예 없다.
//
// byTag는 명령서에서만 문장 안쪽에("지정 부대가 3턴 유지") 들어가므로 부르는
// 쪽이 켠다. 켜지 않으면 명령서에서 같은 말이 두 번 나온다.
//
// fromTurn을 끄는 쪽은 지형 카드다. 카드는 아직 안 열린 목표에서 유지 숫자
// 자체를 "4일차부터"로 바꾼다 — 안 열린 목표의 0/2턴은 셀 수 없는 숫자라 없는
// 편이 낫고, 뒤에 단서로 덧붙이면 320px 카드에서 줄이 하나 늘어 지형이 밀려난다.
// 같은 자리를 쓰면서 더 정확해진다.
function objectiveNoteText(objective, options = {}) {
  const notes = [];
  if (objective.fromTurn && options.fromTurn !== false) notes.push(t("{n}일차부터", { n: objective.fromTurn }));
  if (objective.group) notes.push(t("둘 다 달성"));
  if (options.byTag && objective.byTag) notes.push(t("지정 부대만 인정"));
  return notes.length ? ` · ${notes.join(" · ")}` : "";
}

function objectiveGoalText(objective) {
  const note = objectiveNoteText(objective);
  if (objective.kind === "seize") {
    const need = objectiveHoldRequirement(objective);
    const who = objective.byTag ? t("지정 부대가 ") : "";
    return t("{label} ({x}, {y}) {who}{need}턴 유지{note}", {
      label: t(objective.label),
      x: objective.x,
      y: objective.y,
      who,
      need,
      note,
    });
  }
  // 개통 목표는 "가라"가 아니라 "이어라"다. 무엇을 해야 하는지가 이름에 드러나야
  // 플레이어가 부대 대신 공병대를 먼저 움직인다.
  if (objective.kind === "supply") {
    return t("{label} ({x}, {y}) 보급선 개통 {need}턴 유지{note}", {
      label: t(objective.label),
      x: objective.x,
      y: objective.y,
      need: objectiveHoldRequirement(objective),
      note,
    });
  }
  // 격파 목표의 이름은 "무엇을"만 적는다. "누구 것을"은 목표 주인이 정하므로 여기서 붙인다.
  if (objective.kind === "destroy") {
    return t("{whose} {label} 격파{note}", {
      whose: objective.owner === "player" ? t("적") : t("아군"),
      label: t(objective.label),
      note,
    });
  }
  if (objective.kind === "protect") return t("{label} 사수", { label: t(objective.label) });
  return t(objective.label);
}

// 목표 이름은 시나리오가 짓는다. 받침을 코드가 모르면 "사령부을 잃었습니다"가 나온다.
// 한글이 아닌 끝(좌표 괄호 등)은 기존 표기대로 "을"을 쓴다.
// 한국어가 아닌 판에서는 아무것도 안 붙인다 — "Battalion HQ을"이 되면 안 된다.
function objectParticle(word) {
  if (activeLocale !== "ko") return "";
  const code = String(word).trimEnd().slice(-1).charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return "을";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

// "이/가"도 마찬가지다. 다리가 두 종류(교량/부교)가 되면서 한쪽은 받침이 있고
// 한쪽은 없어졌다 — 어느 쪽으로 못 박아도 절반은 "부교이 무너졌습니다"가 된다.
function subjectParticle(word) {
  if (activeLocale !== "ko") return "";
  const code = String(word).trimEnd().slice(-1).charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return "이";
  return (code - 0xac00) % 28 === 0 ? "가" : "이";
}

// 같은 이유로 "은/는"도 코드가 골라야 한다. 부대 이름은 편성마다 달라서
// ("M7 프리스트 자주포", "셔먼 전차") 한쪽으로 못 박으면 반드시 틀린 쪽이 나온다.
function topicParticle(word) {
  if (activeLocale !== "ko") return "";
  const code = String(word).trimEnd().slice(-1).charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

// 갓 도착한 부대를 눌렀을 때 하는 말. 오늘은 명령이 안 먹는 부대라, 화면이
// 조용하면 플레이어는 뽑은 부대가 사라졌거나 버튼이 고장 났다고 생각한다.
function formingNotice(unit) {
  const label = unitLabel(unit);
  return t("{label}{은} 오늘 막 도착해 아직 편성 중입니다. 내일부터 움직이고 쏩니다.", {
    label,
    "은": topicParticle(label),
  });
}

function completionMessage(objective) {
  if (objective.kind === "destroy") {
    const target = `${t(objective.label)}${objectParticle(objective.label)}`;
    return objective.owner === "player"
      ? { verdict: "win", reason: t("{enemy} {target} 격파했습니다.", { enemy: sideName("enemy"), target }) }
      : { verdict: "lose", reason: t("{enemy}이 아군 {target} 격파했습니다.", { enemy: sideName("enemy"), target }) };
  }
  const where = objectiveName(objective);
  if (objective.kind === "supply") {
    return objective.owner === "player"
      ? { verdict: "win", reason: t("{where}까지 보급선을 개통했습니다.", { where }) }
      : { verdict: "lose", reason: t("{enemy}이 {where}까지 보급선을 개통했습니다.", { enemy: sideName("enemy"), where }) };
  }
  // 점령 목표가 늘 "적 후방 돌파"인 건 아니다(탈출 지점, 교차로…). 목표 이름이 상황을 말하게 둔다.
  return objective.owner === "player"
    ? { verdict: "win", reason: t("{where}을 확보해 작전 목표를 달성했습니다.", { where }) }
    : { verdict: "lose", reason: t("{enemy}이 {where}을 확보했습니다.", { enemy: sideName("enemy"), where }) };
}

function failureMessage(objective) {
  const target = `${t(objective.label)}${objectParticle(objective.label)}`;
  return objective.owner === "player"
    ? { verdict: "lose", reason: t("사수해야 할 {target} 잃었습니다.", { target }) }
    : { verdict: "win", reason: t("{enemy}의 {target} 무너뜨렸습니다.", { enemy: sideName("enemy"), target }) };
}

function missionTurnLimit() {
  return operationTurnLimit > 0 ? operationTurnLimit : Infinity;
}

function turnsRemaining() {
  const limit = missionTurnLimit();
  return Number.isFinite(limit) ? Math.max(0, limit - state.turn + 1) : Infinity;
}

function missionBriefText() {
  const limit = missionTurnLimit();
  const outcome = state.mission?.timeoutOutcome ?? "draw";
  const deadlineTail =
    outcome === "playerWin" ? t(" 사수 시 승리") : outcome === "playerLose" ? t(" 안에 달성 실패 시 패배") : "";
  const deadline = Number.isFinite(limit)
    ? t("작전 기한 {limit}턴{tail}", { limit, tail: deadlineTail })
    : t("작전 기한 없음");
  const mine = objectivesFor("player").map((objective) => t("아군: {goal}", { goal: objectiveGoalText(objective) }));
  const theirs = objectivesFor("enemy").map((objective) => t("적: {goal}", { goal: objectiveGoalText(objective) }));
  return [deadline, ...mine, ...theirs].join(" · ");
}

function timeoutMessage() {
  const outcome = state.mission?.timeoutOutcome ?? "draw";
  if (outcome === "playerWin") return { verdict: "win", reason: t("작전 기한이 끝날 때까지 전선을 지켜냈습니다.") };
  if (outcome === "playerLose") return { verdict: "lose", reason: t("작전 기한 안에 목표를 달성하지 못했습니다.") };
  return { verdict: "draw", reason: t("작전 기한이 끝나 전선이 교착되었습니다.") };
}

// 턴이 오른 직후에 부른다. 기한이 지났으면 true를 돌려주고 호출부가 턴 진행을 멈춘다.
function resolveTurnLimit() {
  if (state.gameOver) return true;
  const limit = missionTurnLimit();
  if (!Number.isFinite(limit)) return false;
  if (state.turn > limit) {
    finishGame(timeoutMessage());
    return true;
  }
  const left = turnsRemaining();
  if (left === 5 || left === 3 || left === 1) addLog(t("작전 기한 {left}턴 남음", { left }));
  return false;
}

function checkVictory() {
  if (state.gameOver) return;

  const failed = failedObjective();
  if (failed) {
    finishGame(failureMessage(failed));
    return;
  }

  const objective = completedObjective();
  if (objective) {
    finishGame(completionMessage(objective));
    return;
  }

  const playerUnits = state.units.some((unit) => unit.owner === "player");
  const enemyUnits = state.units.some((unit) => unit.owner === "enemy");
  const playerCollapsed = baseLossCollapsed("player");
  const enemyCollapsed = baseLossCollapsed("enemy");

  if (!enemyUnits || enemyCollapsed) {
    finishGame({ verdict: "win", reason: t("{enemy} 전선이 붕괴되었습니다.", { enemy: sideName("enemy") }) });
  } else if (!playerUnits || playerCollapsed) {
    finishGame({ verdict: "lose", reason: t("{player} 교두보를 상실했습니다.", { player: sideName("player") }) });
  }
}

// 거점을 전부 잃었는가, 그리고 그 상태가 유예 턴을 넘겼는가.
// 진영당 거점 하나로 시작하게 되면서 "거점 0 = 즉시 패배"는 후방으로 흘러든 전차 한 대가
// 작전 전체를 끝내는 규칙이 됐다. 그건 전략의 결과가 아니라 사고다. 유예를 주면 거점 상실은
// "졌다"가 아니라 "지금 당장 되찾지 않으면 진다"가 된다 — 그래야 역습에 의미가 생긴다.
function baseLossCollapsed(owner) {
  if (state.bases.some((base) => base.owner === owner)) {
    state.baseLossSince[owner] = null;
    return false;
  }
  if (state.baseLossSince[owner] == null) {
    state.baseLossSince[owner] = state.turn;
    if (baseLossGraceTurns > 0) {
      addLog(
        t("{side} › 보급 거점 전부 상실 · {grace}턴 내 탈환 못하면 전선 붕괴", {
          side: sideName(owner),
          grace: baseLossGraceTurns,
        })
      );
    }
  }
  return state.turn - state.baseLossSince[owner] >= baseLossGraceTurns;
}

/* 판정(win/lose/draw)과 이유를 따로 받는다.

   전에는 "승리: …" 한 줄만 넘기고, 화면 쪽에서 앞 두 글자를 잘라 판정을
   알아냈다. 한국어로만 쓸 때는 맞는 말이었지만, 영어판에서는 그 두 글자가
   "Victory"가 되므로 어느 것과도 안 맞아 이긴 판이 무승부로 찍힌다.
   말은 나라마다 달라도 이긴 것은 이긴 것이다 — 판정은 글자에서 알아낼 것이
   아니라 만드는 쪽이 말해 주는 것이다. */
function finishGame(outcome) {
  state.gameOver = true;
  // 판정이 찍혔으면 전투곡도 끝난다. 여기서 안 끊으면 승패 화면이 떠 있는 내내
  // 교전곡이 계속 돌아서, 다 끝난 판인데 아직 싸우는 중인 것처럼 들린다.
  // 끊는 방법은 명령서로 넘어갈 때와 똑같다 — 0.45초에 걸쳐 빼고, 다 빠진 다음에
  // 세운다. 세운 것이 다시 돌지 않게 막는 것은 musicNudge의 gameOver 문이다.
  // 다시 트는 것은 다음 판의 「작전 개시」가 맡는다(briefingMusicStop).
  musicSuppress(true, musicDuckSeconds);
  window.setTimeout(musicPauseTracks, musicDuckSeconds * 1000 + 60);
  // 끝난 작전은 이어할 것이 없다. 남겨 두면 다음에 켤 때 이미 승패가 난 판을
  // 「중단된 작전」이라고 내밀게 된다.
  clearSavedOperation();
  const message = `${verdictWord(outcome.verdict)}: ${outcome.reason}`;
  addLog(message);
  addChronicle(message, "end");
  showResultScreen(outcome);
}

function verdictWord(verdict) {
  if (verdict === "win") return t("승리");
  if (verdict === "lose") return t("패배");
  return t("무승부");
}

// ── 작전 종료 보고 ────────────────────────────────────────────────
// 승패 문구는 "승리: …" / "패배: …" 꼴로 온다. 앞의 두 글자는 크게 찍고 뒤는
// 이유로 쓴다. 문구를 만드는 자리(completionMessage 등)가 여럿이라, 판정을
// 여기 한 곳에서만 읽어야 새 문구가 생겨도 화면이 어긋나지 않는다.
let chronicleTimer = null;
let chronicleCursor = 0;

// 커다랗게 찍는 판정 글자. 한국어는 두 글자 사이를 벌려 도장처럼 보이게 하지만
// 영어에는 그 관습이 없으므로 낱말장에서 그냥 한 낱말로 받는다.
function verdictBanner(verdict) {
  if (verdict === "win") return t("승 리");
  if (verdict === "lose") return t("패 배");
  return t("무승부");
}

function showResultScreen(outcome) {
  if (!resultScreenEl) return;
  const chronicle = state.chronicle ?? [];
  const kills = chronicle.filter((entry) => entry.kind === "kill").length;
  const losses = chronicle.filter((entry) => entry.kind === "loss").length;

  resultScreenEl.dataset.verdict = outcome.verdict;
  if (resultVerdictEl) resultVerdictEl.textContent = verdictBanner(outcome.verdict);
  if (resultReasonEl) resultReasonEl.textContent = outcome.reason;
  // 셋 다 "얼마나 걸렸고 무엇을 주고받았는가"다. 이긴 판과 진 판을 비교할 수 있는
  // 최소한의 숫자이자, 아래 이력을 다 읽지 않아도 남는 한 줄이다.
  if (resultTallyEl) {
    resultTallyEl.textContent = t("작전 {days}일 · 적 격파·탈취 {kills} · 아군 손실 {losses}", {
      days: state.turn,
      kills,
      losses,
    });
  }
  if (resultLogEl) resultLogEl.innerHTML = "";
  chronicleCursor = 0;
  window.clearInterval(chronicleTimer);

  resultScreenEl.hidden = false;
  // 한 프레임 쉬고 클래스를 준다. 붙이자마자 주면 브라우저가 처음 상태를 못 보고
  // 건너뛰어서, 떠오르는 것이 아니라 그냥 나타난다(턴 날짜판과 같은 이치).
  requestAnimationFrame(() => resultScreenEl.classList.add("show"));

  // 한 줄씩 흘린다. 260ms는 "읽히는 속도"가 아니라 "일이 벌어지는 속도"다 —
  // 이력은 정독하는 글이 아니라 지나가는 전문이고, 눈에 걸리는 줄에서 손이
  // 멈추면 그때 눌러서 전부 펴면 된다.
  chronicleTimer = window.setInterval(() => {
    if (chronicleCursor >= chronicle.length) {
      window.clearInterval(chronicleTimer);
      chronicleTimer = null;
      return;
    }
    appendChronicleLine(chronicle[chronicleCursor]);
    chronicleCursor += 1;
  }, 260);
}

function appendChronicleLine(entry) {
  if (!resultLogEl || !entry) return;
  const line = document.createElement("p");
  line.className = `result-line${entry.kind ? ` result-${entry.kind}` : ""}`;
  line.innerHTML = `<b>${entry.date}</b><span>${entry.text}</span>`;
  resultLogEl.appendChild(line);
  requestAnimationFrame(() => line.classList.add("show"));
  resultLogEl.scrollTop = resultLogEl.scrollHeight;
}

function revealWholeChronicle() {
  const chronicle = state?.chronicle ?? [];
  if (chronicleCursor >= chronicle.length) return;
  window.clearInterval(chronicleTimer);
  chronicleTimer = null;
  while (chronicleCursor < chronicle.length) {
    appendChronicleLine(chronicle[chronicleCursor]);
    chronicleCursor += 1;
  }
}

// 「완료」는 이력이 흐르는 도중에도 눌린다. 누르면 곧바로 새 작전 명령서로 간다 —
// 끝난 판을 다시 들여다볼 이유는 없고, 여기서 멈춰 세우면 그 자리가 막다른 길이 된다.
function closeResultScreen() {
  hideResultScreen();
  openNewOperationSetup();
}

function hideResultScreen() {
  window.clearInterval(chronicleTimer);
  chronicleTimer = null;
  chronicleCursor = 0;
  if (!resultScreenEl) return;
  resultScreenEl.classList.remove("show");
  resultScreenEl.hidden = true;
  if (resultLogEl) resultLogEl.innerHTML = "";
}

function baseProduction(base) {
  return base.production * wartimeProductionFactor * base.efficiency;
}

// 적 수입에만 난이도 배율이 붙는다. 여기 한 곳에서 곱하는 이유는, 매 턴 들어오는
// 실제 보급과 화면에 뜨는 「다음 보급」이 둘 다 이 함수를 쓰기 때문이다.
// 곱하는 자리를 나누면 화면에 적힌 숫자와 실제로 들어오는 양이 어긋난다.
function projectedIncome(owner) {
  const raw = state.bases
    .filter((base) => base.owner === owner)
    .reduce((total, base) => total + baseProduction(base), 0);
  return owner === "enemy" ? raw * currentDifficulty().income : raw;
}

function supplyStatus(unit) {
  return normalizedSupplyStatus(unit);
}

function commanderSupplyBonus(ownerOrUnit) {
  const owner = typeof ownerOrUnit === "object" ? ownerOrUnit.owner : ownerOrUnit;
  return commanderFor(owner)?.supply ?? 0;
}

function effectiveSupplyRange(unit) {
  return Math.max(1, supplyRange + commanderSupplyBonus(unit));
}

function effectiveStrainedSupplyRange(unit) {
  return Math.max(effectiveSupplyRange(unit), strainedSupplyRange + commanderSupplyBonus(unit));
}

function effectiveHQSupplyRange(ownerOrUnit) {
  const owner = typeof ownerOrUnit === "object" ? ownerOrUnit.owner : ownerOrUnit;
  return Math.max(0, hqSupplyRange + commanderSupplyBonus(owner));
}

// 보급은 2층이다. 1층 = 대대 HQ(전진 보급소), 2층 = 거점 보급망(BFS).
// 둘 중 하나라도 닿으면 정상. 둘 다 잃었을 때만 "두절"이 되고, 두절만이 부대를 죽인다.
//
// 사령부 자신은 거리로 판정하지 않는다. 전진 보급소가 존재하는 이유가 "거점에서
// 멀어도 보급을 중계한다"인데, 그 거리를 사령부 자신에게 그대로 물리면 제 역할을
// 하러 나갈 때마다 스스로 "보급 불안"이 떴다 — 보급의 원천이 보급을 못 받는 꼴이다.
// 사령부는 보급선이 이어져 있는가만 본다. 끊기면(BFS 미도달) 그때는 두절이다.
// 거리가 아니라 차단으로만 위험해지므로 "고립 사령부 구조" 상황은 그대로 성립한다.
function normalizedSupplyStatus(unit) {
  const hqDistanceNow = nearestBattalionHQDistance(unit);
  const enemyFaces = adjacentEnemyFaceCount(unit);
  if (enemyFaces >= 3) {
    return { level: "isolated", via: "none", label: t("고립 {n}/4", { n: enemyFaces }), cost: supplyLineCost(unit), hqDistance: hqDistanceNow };
  }

  if (hqDistanceNow <= effectiveHQSupplyRange(unit)) {
    return { level: "full", via: "hq", label: t("대대 보급"), cost: hqDistanceNow, hqDistance: hqDistanceNow };
  }

  const costNow = supplyLineCost(unit);
  if (!Number.isFinite(costNow)) {
    const label = battalionHQs(unit.owner).length ? t("보급선 두절") : t("사령부 전멸");
    return { level: "cut", via: "none", label, cost: costNow, hqDistance: hqDistanceNow };
  }
  if (unit.type === "battalionHQ") {
    return { level: "full", via: "base", label: t("전진 보급"), cost: costNow, hqDistance: hqDistanceNow };
  }
  if (costNow <= effectiveSupplyRange(unit)) return { level: "full", via: "base", label: t("정상 보급"), cost: costNow, hqDistance: hqDistanceNow };
  if (costNow <= effectiveStrainedSupplyRange(unit)) return { level: "strained", via: "base", label: t("보급 불안"), cost: costNow, hqDistance: hqDistanceNow };
  return { level: "cut", via: "none", label: t("보급선 이탈"), cost: costNow, hqDistance: hqDistanceNow };
}

function adjacentEnemyFaceCount(unit) {
  return neighbors(unit.x, unit.y).filter((spot) =>
    state.units.some((other) => other.owner !== unit.owner && other.x === spot.x && other.y === spot.y)
  ).length;
}

function supplyLineCost(unit) {
  const sources = state.bases.filter((base) => base.owner === unit.owner);
  if (!sources.length) return Infinity;

  const queue = sources.map((base) => ({ x: base.x, y: base.y, cost: 0 }));
  const best = new Map(queue.map((source) => [posKey(source.x, source.y), 0]));

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.x === unit.x && current.y === unit.y) return current.cost;
    if (current.cost > (best.get(posKey(current.x, current.y)) ?? Infinity)) continue;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = movementCostForTile(next.x, next.y);
      const blockers = getUnitsAt(next.x, next.y);
      if (!Number.isFinite(tileCost) || blockers.some((other) => other.owner !== unit.owner)) return;
      const railBonus = hasImprovement(next.x, next.y, "rail") ? 0.35 : 1;
      const newCost = current.cost + tileCost * railBonus;
      const key = posKey(next.x, next.y);
      if (newCost < (best.get(key) ?? Infinity)) {
        best.set(key, newCost);
        queue.push({ ...next, cost: newCost });
      }
    });
  }

  return Infinity;
}

// 보급선이 실제로 지나는 길. supplyLineCost는 값만 돌려주므로 "어디에 철도를
// 깔아야 이 선이 짧아지는가"에 답할 수 없다. 왔던 칸을 적어 두었다가 되짚는다.
// 규칙(통행 비용, 철도 할인, 적 부대가 선 칸은 못 지나감)은 supplyLineCost와 같아야
// 한다 — 자가 둘이면 공병대가 엉뚱한 곳에 철도를 깐다.
function supplyRouteTo(owner, x, y) {
  const sources = state.bases.filter((base) => base.owner === owner);
  if (!sources.length) return { cost: Infinity, path: [] };

  const queue = sources.map((base) => ({ x: base.x, y: base.y, cost: 0 }));
  const best = new Map(queue.map((source) => [posKey(source.x, source.y), 0]));
  const from = new Map();

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.x === x && current.y === y) {
      const path = [];
      let at = posKey(x, y);
      let here = { x, y };
      while (here) {
        path.unshift(here);
        here = from.get(at) ?? null;
        at = here ? posKey(here.x, here.y) : null;
      }
      return { cost: current.cost, path };
    }
    if (current.cost > (best.get(posKey(current.x, current.y)) ?? Infinity)) continue;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = movementCostForTile(next.x, next.y);
      const blockers = getUnitsAt(next.x, next.y);
      if (!Number.isFinite(tileCost) || blockers.some((other) => other.owner !== owner)) return;
      const railBonus = hasImprovement(next.x, next.y, "rail") ? 0.35 : 1;
      const newCost = current.cost + tileCost * railBonus;
      const key = posKey(next.x, next.y);
      if (newCost < (best.get(key) ?? Infinity)) {
        best.set(key, newCost);
        from.set(key, { x: current.x, y: current.y });
        queue.push({ ...next, cost: newCost });
      }
    });
  }

  return { cost: Infinity, path: [] };
}

// 실제로 어느 층에서 보급받는지를 그대로 보여준다. 예전에는 hqDistance가 유한하면
// 무조건 "HQ n"을 찍어서, 두절된 대대 사령부 카드에 자기 자신까지의 거리인 "HQ 0"이
// 떠 있었다 — 같은 카드 안에서 "보급선 이탈"과 정면으로 모순됐다.
function formatSupplyDistance(supply) {
  if (supply.via === "hq") return t("HQ {n}", { n: formatNumber(supply.hqDistance) });
  return Number.isFinite(supply.cost) ? t("거점 {n}", { n: formatNumber(supply.cost) }) : t("단절");
}

function battalionHQs(owner) {
  return state.units.filter((unit) => unit.owner === owner && unit.type === "battalionHQ");
}

function battalionHQLimit(owner) {
  return owner === "player" ? episodeLimits.playerBattalionHQ : episodeLimits.enemyBattalionHQ;
}

function remainingBattalionHQ(owner) {
  return Math.max(0, battalionHQLimit(owner) - battalionHQs(owner).length);
}

// 보급선에 이어진 사령부가 어느 것인지는 부대마다 달라지지 않는다 — 지도 위 배치가
// 그대로면 답도 같다. 배치를 한 줄로 적어 열쇠로 삼고, 그게 바뀔 때만 다시 센다.
// 이 캐시가 없으면 부대 하나를 판정할 때마다 사령부 수만큼 BFS를 새로 돈다.
let suppliedHQCache = { key: "", byOwner: new Map() };

function supplyLayoutKey() {
  const units = state.units.map((unit) => `${unit.id}@${unit.x},${unit.y}`).join("|");
  const bases = state.bases.map((base) => `${base.x},${base.y}:${base.owner}`).join("|");
  const built = state.improvements.map((item) => `${item.x},${item.y}:${item.type}`).join("|");
  return `${units}#${bases}#${built}`;
}

// 거점 보급망에 이어진 사령부만 전진 보급을 발급한다. 끊긴 사령부가 계속 보급을
// 나눠 주면, 포위망 안에서 사령부만 "보급선 두절"이고 그 부하들은 "대대 보급 정상"인
// 그림이 나온다 — 보급의 원천이 굶는데 그 아래는 멀쩡한 셈이다.
// 사령부는 보급을 만들어내는 곳이 아니라 중계하는 곳이다. 원천이 끊기면 아래도 끊긴다.
function suppliedBattalionHQs(owner) {
  const key = supplyLayoutKey();
  if (suppliedHQCache.key !== key) suppliedHQCache = { key, byOwner: new Map() };
  if (!suppliedHQCache.byOwner.has(owner)) {
    suppliedHQCache.byOwner.set(owner, battalionHQs(owner).filter((hq) => Number.isFinite(supplyLineCost(hq))));
  }
  return suppliedHQCache.byOwner.get(owner);
}

// 자기 자신은 세지 않는다. 사령부까지의 거리를 자기 자신으로 재면 늘 0이라
// 모든 사령부가 무조건 보급 정상이 되고, 포위된 사령부조차 위험해지지 않는다.
// 예전에는 그걸 막으려고 supplyStatus 안에서 "HQ면 1층을 통째로 못 쓴다"고
// 잘라냈는데, 그 바람에 사령부 둘이 나란히 서 있어도 서로를 보급하지 못했다.
// 제외해야 할 것은 1층 전체가 아니라 자기 자신 하나였다.
function nearestBattalionHQDistance(unit) {
  const hqs = suppliedBattalionHQs(unit.owner).filter((hq) => hq.id !== unit.id);
  if (!hqs.length) return Infinity;
  return Math.min(...hqs.map((hq) => distance(unit, hq)));
}

function inBattalionSupplyRange(unit) {
  return nearestBattalionHQDistance(unit) <= effectiveHQSupplyRange(unit);
}

// 이 칸이 대대 사령부의 어느 고리에 드는가. "recovery"는 매 턴 체력이 1씩 차는
// 안쪽 고리, "supply"는 거점 보급망이 끊겨도 정상 보급으로 쳐주는 바깥 고리다.
// 안쪽이 더 좁으므로 먼저 본다.
// 보급선이 끊긴 사령부는 고리를 그리지 않는다 — 지도에 그려진 고리와 실제 판정이
// 다르면, 플레이어는 안전하다고 믿고 들어간 자리에서 부대를 잃는다.
function battalionSupplyReach(owner, x, y) {
  const hqs = suppliedBattalionHQs(owner);
  if (!hqs.length) return "";
  const nearest = Math.min(...hqs.map((hq) => distance({ x, y }, hq)));
  if (nearest <= hqRecoveryRange) return "recovery";
  return nearest <= effectiveHQSupplyRange(owner) ? "supply" : "";
}

// 지도에 늘 깔려 있는 고리는 아군 사령부 전체의 합집합이다. 그래서 "이 고리가 어느
// 사령부의 것인가"에 답하지 못하고, 거점 보급망은 아예 보이지 않았다 — 보급이 이 게임의
// 중심인데 정작 보급이 어디까지 닿는지는 부대를 하나씩 눌러 카드를 읽어야 알 수 있었다.
// 사령부나 보급 거점을 클릭하면 그 하나만의 보급권을 따로 그린다. 합집합 고리는 그대로
// 두고 그 위에 덮는다 — 늘 보이던 것을 뺏지 않으면서 지금 보고 있는 것만 도드라지게.
function supplyCoverageFocus() {
  const unit = selectedUnit() ?? inspectedUnit();
  if (unit?.type === "battalionHQ") return battalionCoverage(unit);
  const tile = state.inspectedTile;
  const base = tile ? getBaseAt(tile.x, tile.y) : null;
  return base ? baseCoverage(base) : null;
}

// 사령부 하나의 두 고리. 보급선이 끊긴 사령부도 고리를 그리되 "무효"로 칠한다.
// 아무것도 안 그리면 플레이어는 클릭이 먹지 않은 줄 알지만, 무효로 칠해 두면
// 왜 이 사령부 주변 부대까지 같이 굶는지가 그 자리에서 보인다.
function battalionCoverage(hq) {
  const live = suppliedBattalionHQs(hq.owner).some((other) => other.id === hq.id);
  const supplyReach = effectiveHQSupplyRange(hq);
  const field = new Map();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const step = distance({ x, y }, hq);
      if (step > supplyReach && step > hqRecoveryRange) continue;
      if (!live) field.set(posKey(x, y), "dead");
      else field.set(posKey(x, y), step <= hqRecoveryRange ? "recovery" : "supply");
    }
  }
  return { kind: "hq", owner: hq.owner, live, field };
}

// 거점 하나가 어디까지 먹이는가. supplyLineCost는 아군 거점 전부를 한꺼번에 출발점으로
// 삼아 "이 부대가 받는가"에 답한다. 여기서는 방향이 반대다 — 클릭한 거점 하나만 출발점이다.
// 확장 규칙(통행 비용, 철도 0.35 할인, 적 부대 차단)은 supplyLineCost와 반드시 같아야 한다.
// 여기서 갈라지면 지도에 그린 보급권과 실제 판정이 어긋나고, 그건 플레이어를 속이는 것이다.
function baseCoverage(base) {
  const normal = effectiveSupplyRange(base);
  const limit = effectiveStrainedSupplyRange(base);
  const best = new Map([[posKey(base.x, base.y), 0]]);
  const queue = [{ x: base.x, y: base.y, cost: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost > (best.get(posKey(current.x, current.y)) ?? Infinity)) continue;
    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = movementCostForTile(next.x, next.y);
      const blockers = getUnitsAt(next.x, next.y);
      if (!Number.isFinite(tileCost) || blockers.some((other) => other.owner !== base.owner)) return;
      const railBonus = hasImprovement(next.x, next.y, "rail") ? 0.35 : 1;
      const newCost = current.cost + tileCost * railBonus;
      // 불안 사거리 너머는 어차피 보급권이 아니다. 거기서 끊어야 지도 한 장을 다 뒤지지 않는다.
      if (newCost > limit) return;
      const key = posKey(next.x, next.y);
      if (newCost < (best.get(key) ?? Infinity)) {
        best.set(key, newCost);
        queue.push({ x: next.x, y: next.y, cost: newCost });
      }
    });
  }

  const field = new Map();
  best.forEach((cost, key) => field.set(key, cost <= normal ? "supply" : "strained"));
  return { kind: "base", owner: base.owner, live: true, field };
}

function supplyCoverLabel(kind, band, owner) {
  if (band === "dead") return "보급 두절 사령부 / 무효";
  if (kind === "hq") return band === "recovery" ? "대대 보충권" : "대대 보급권";
  // 무주공산 거점의 보급권은 "지금 받는 것"이 아니라 "가져가면 받을 것"이다.
  // 같은 말로 적으면 이미 내 것인 줄 안다.
  const prefix = owner === "neutral" ? "확보 시 " : "";
  return band === "supply" ? `${prefix}거점 보급권` : `${prefix}거점 보급 불안권`;
}

// 지도 색만으로는 "몇 칸을 먹이는가"를 눈으로 세어야 안다. 카드에 숫자로 같이 적는다.
function battalionCoverageText(hq) {
  const coverage = battalionCoverage(hq);
  if (!coverage.live) return t("보급선 두절 / 발급 불가");
  const bands = [...coverage.field.values()];
  const recovery = bands.filter((band) => band === "recovery").length;
  return t("보충 {a}칸 / 보급 {b}칸", { a: recovery, b: bands.length });
}

function baseCoverageText(base) {
  const bands = [...baseCoverage(base).field.values()];
  const normal = bands.filter((band) => band === "supply").length;
  return t("정상 {a}칸 / 불안 {b}칸", { a: normal, b: bands.length - normal });
}

function canMoveTo(unit, x, y) {
  if (!inBounds(x, y)) return false;
  if (unit.acted || unit.moved) return false;
  if (activeConstructionForBuilder(unit)) return false;
  return canOccupy(unit, x, y) && movementCost(unit.x, unit.y, x, y, unit) <= effectiveMove(unit);
}

function effectiveMove(unit) {
  const rawMove = unit.type === "artillery" && unit.towed ? unitTypes.artillery.towedMove : unitTypes[unit.type].move;
  const baseMove = Math.max(1, rawMove + (commanderFor(unit.owner).move ?? 0));
  const supply = supplyStatus(unit);
  if (supply.level === "isolated") return Math.min(baseMove, 1);
  // 두절은 일부러 불안과 같은 페널티만 준다. 여기서 발을 묶으면 복귀가 불가능해져서
  // 두절 = 확정 사망이 된다. 되돌아갈 수 있어야 플레이어의 선택이 된다.
  if (supply.level === "cut") return Math.max(1, baseMove - 1);
  if (supply.level === "strained") return Math.max(1, baseMove - 1);
  return baseMove;
}

function isArtilleryUnit(unit) {
  return unit?.type === "artillery" || unit?.type === "spArtillery";
}

function isTowedArtillery(unit) {
  return unit?.type === "artillery" && unit.towed;
}

function artilleryVulnerability(unit) {
  return unit.type === "spArtillery" ? 1 : 2;
}

function canOccupy(unit, x, y) {
  if (!canEnterTerrain(unit, x, y)) return false;
  const occupants = getUnitsAt(x, y);
  if (!occupants.length) return traversalCostForUnit(unit, x, y) < Infinity;
  return occupants.every((other) => other.owner === unit.owner && other.type === unit.type) && occupants.length < maxStackSize;
}

function canEnterTerrain(unit, x, y) {
  if (!inBounds(x, y)) return false;
  if (!canUnitDomainEnter(unit, x, y)) return false;
  if (getTerrainKey(x, y) === "H" && (unit.type === "armor" || unit.type === "spArtillery")) return false;
  return traversalCostForUnit(unit, x, y) < Infinity;
}

// 다리가 놓인 물칸은 뭍처럼 건넌다. 이 한 줄이 없어서 지금까지 다리는 반쪽이었다 —
// movementCostForTile은 다리를 알아보므로 보급선은 강을 건넜지만, 정작 부대는
// 못 건넜다. 그러면 다리를 놓을 이유가 없고, 강을 사이에 둔 작전 자체가 성립하지 않는다.
function canUnitDomainEnter(unit, x, y) {
  const domain = unitTypes[unit?.type]?.domain ?? "land";
  const terrainKey = getTerrainKey(x, y);
  if (domain === "naval") return terrainKey === "W";
  if (domain === "air") return true;
  return terrainKey !== "W" || hasBridgeableCrossing(x, y);
}

function movementCost(startX, startY, targetX, targetY, unit) {
  const queue = [{ x: startX, y: startY, cost: 0 }];
  const best = new Map([[posKey(startX, startY), 0]]);

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.x === targetX && current.y === targetY) return current.cost;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = traversalCostForUnit(unit, next.x, next.y);
      const blockers = getUnitsAt(next.x, next.y);
      if (!canEnterTerrain(unit, next.x, next.y) || !Number.isFinite(tileCost) || blockers.some((other) => other.owner !== unit.owner)) return;
      const newCost = current.cost + tileCost;
      const key = posKey(next.x, next.y);
      if (newCost < (best.get(key) ?? Infinity)) {
        best.set(key, newCost);
        queue.push({ ...next, cost: newCost });
      }
    });
  }
  return Infinity;
}

// movementCost와 완전히 같은 규칙으로 걷되, 비용 대신 지나간 칸을 순서대로 돌려준다.
// 규칙을 두 벌로 적지 않으려면 여기가 그 함수를 그대로 베낀 모양이어야 한다 —
// 한쪽만 고치면 화면 속 부대가 규칙이 금지한 길을 걷게 된다.
function movementPath(unit, targetX, targetY) {
  const startKey = posKey(unit.x, unit.y);
  const targetKey = posKey(targetX, targetY);
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  const best = new Map([[startKey, 0]]);
  const cameFrom = new Map();

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost > (best.get(posKey(current.x, current.y)) ?? Infinity)) continue;
    if (current.x === targetX && current.y === targetY) break;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = traversalCostForUnit(unit, next.x, next.y);
      const blockers = getUnitsAt(next.x, next.y);
      if (!canEnterTerrain(unit, next.x, next.y) || !Number.isFinite(tileCost) || blockers.some((other) => other.owner !== unit.owner)) return;
      const newCost = current.cost + tileCost;
      const key = posKey(next.x, next.y);
      if (newCost < (best.get(key) ?? Infinity)) {
        best.set(key, newCost);
        cameFrom.set(key, { x: current.x, y: current.y });
        queue.push({ x: next.x, y: next.y, cost: newCost });
      }
    });
  }

  // 길을 못 찾으면 직선으로 되돌린다. 여기까지 왔다는 건 규칙(canMoveTo)이 이미
  // 허락했다는 뜻이라 정상적으로는 일어나지 않지만, 화면이 멈추는 것보다는 낫다.
  if (!best.has(targetKey)) return [{ x: unit.x, y: unit.y }, { x: targetX, y: targetY }];

  const path = [{ x: targetX, y: targetY }];
  let cursor = targetKey;
  while (cursor !== startKey) {
    const step = cameFrom.get(cursor);
    if (!step) break;
    path.unshift(step);
    cursor = posKey(step.x, step.y);
  }
  return path;
}

function movementCostForTile(x, y) {
  let cost = getTerrainKey(x, y) === "W" && hasBridgeableCrossing(x, y) ? 1 : tileAt(x, y).cost;
  if (hasImprovement(x, y, "rail") && Number.isFinite(cost)) cost = Math.min(cost, 0.5);
  return cost;
}

function traversalCostForUnit(unit, x, y) {
  const domain = unitTypes[unit?.type]?.domain ?? "land";
  const terrainKey = getTerrainKey(x, y);
  if (domain === "naval") return terrainKey === "W" ? 1 : Infinity;
  if (domain === "air") return 1;
  return terrainKey === "W" && !hasBridgeableCrossing(x, y) ? Infinity : movementCostForTile(x, y);
}

function hasBridgeableCrossing(x, y) {
  const deck = deckAt(x, y);
  if (!deck) return false;
  // 마을 교량은 전쟁 전부터 완성되어 있던 다리다. 강폭 3칸 규칙은 공병이 지금
  // 새로 놓는 부교에만 건다 — 이미 서 있는 다리에 "너무 길어서 못 건넌다"고
  // 하는 것은 말이 안 된다.
  return deck.type === "roadBridge" || isBridgeableWater(x, y);
}

// 다리 규칙은 여기 한 곳에서만 정한다. 플레이어의 공병대와 적의 공병대가 같은 자를
// 써야, 내가 못 놓은 자리에 적이 놓는 일이 생기지 않는다.
//
// 한 다리가 이을 수 있는 물의 최대 칸 수. 강폭이 이보다 넓으면 기슭에 닿지 않는다.
// 3으로 잡은 이유: 판에서 가장 넓은 강이 두 칸(보급선 개통)이라 두 칸은 반드시
// 놓을 수 있어야 하고, 세 칸을 넘어가면 그건 강이 아니라 만이다.
const bridgeSpanLimit = 3;
// 한 진영이 새로 놓을 수 있는 다리(도하로)의 수. 붙어 있는 칸은 몇 칸이든 한 다리다.
// 시나리오에 처음부터 서 있던 마을 다리(owner: "neutral")는 여기에 안 센다 —
// 그건 지은 것이 아니라 원래 있던 것이다.
const bridgeLimitPerSide = 2;

// 이 칸의 물이 그 방향으로 몇 칸 이어지는가. 끝까지 갔는데 판 밖이면 기슭이 없다는
// 뜻이라 Infinity — 바다로 나가는 물에는 다리를 걸 수 없다.
function waterRunLength(x, y, axis) {
  const stepX = axis === "h" ? 1 : 0;
  const stepY = axis === "h" ? 0 : 1;
  let length = 1;
  for (const dir of [1, -1]) {
    let cx = x + stepX * dir;
    let cy = y + stepY * dir;
    while (inBounds(cx, cy) && getTerrainKey(cx, cy) === "W") {
      length += 1;
      cx += stepX * dir;
      cy += stepY * dir;
    }
    if (!inBounds(cx, cy)) return Infinity;
  }
  return length;
}

// 다리가 놓이는 방향. 물이 짧게 끝나는 쪽으로 건넌다 — 강줄기를 따라 길게 까는 것은
// 다리가 아니라 둑이다. 지형은 작전 내내 바뀌지 않으므로 한 번 잰 값을 재사용한다
// (이 함수는 길찾기가 칸마다 부르는 자리라 매번 강을 훑으면 판이 느려진다).
const bridgeAxisCache = new Map();

function bridgeAxisAt(x, y) {
  if (getTerrainKey(x, y) !== "W") return null;
  const key = posKey(x, y);
  if (bridgeAxisCache.has(key)) return bridgeAxisCache.get(key);
  const across = waterRunLength(x, y, "h");
  const along = waterRunLength(x, y, "v");
  const axis = Math.min(across, along) > bridgeSpanLimit ? null : across <= along ? "h" : "v";
  bridgeAxisCache.set(key, axis);
  return axis;
}

function isBridgeableWater(x, y) {
  return bridgeAxisAt(x, y) !== null;
}

// 다리는 나란히 두 줄로 놓을 수 없다. 건너는 방향이 가로면 강은 세로로 흐르므로,
// 강을 따라 바로 위아래 칸에 다리가 있는지를 본다. 거기 이미 다리가 있다면 이건
// 새 도하로가 아니라 기존 다리 옆에 똑같은 다리를 하나 더 까는 것이다.
function isParallelToExistingBridge(x, y) {
  const axis = bridgeAxisAt(x, y);
  if (!axis) return false;
  // 마을 교량도 이미 서 있는 다리다. 그 바로 옆에 부교를 하나 더 까는 것을 허용하면
  // "저 다리를 끊는다"가 의미를 잃는다 — 끊자마자 옆에 새로 놓으면 그만이기 때문이다.
  const alongRiver = axis === "h" ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  return alongRiver.some(([dx, dy]) => inBounds(x + dx, y + dy) && deckAt(x + dx, y + dy));
}

// 붙어 있는 다리 칸은 한 다리로 센다. 두 칸짜리 강에 두 칸을 걸어도 다리는 하나다.
function builtCrossingCount(owner) {
  const pending = new Set(
    state.improvements.filter((item) => item.type === "bridge" && item.owner === owner).map((item) => posKey(item.x, item.y)),
  );
  let crossings = 0;
  while (pending.size) {
    const [seed] = pending;
    pending.delete(seed);
    const queue = [seed];
    while (queue.length) {
      const [cx, cy] = queue.pop().split(",").map(Number);
      for (const spot of neighbors(cx, cy)) {
        const key = posKey(spot.x, spot.y);
        if (!pending.has(key)) continue;
        pending.delete(key);
        queue.push(key);
      }
    }
    crossings += 1;
  }
  return crossings;
}

// 이미 서 있는 다리에 한 칸을 잇는 것인가(= 같은 도하로를 넓히는 것), 아니면
// 새 도하로를 여는 것인가. 나란히 놓기는 위에서 이미 막았으므로, 여기 남는
// 이웃은 건너는 방향으로 이어지는 칸뿐이다.
function extendsExistingBridge(x, y) {
  return neighbors(x, y).some((spot) => hasImprovement(spot.x, spot.y, "bridge"));
}

function canPlaceBridge(owner, x, y) {
  if (!isBridgeableWater(x, y)) return false;
  // 이미 다리가 있는 자리에는 못 놓는다. 마을 교량이 무너져 내려앉은 자리라면
  // 다시 물이므로 부교는 걸 수 있다 — 다만 그건 교량을 고친 것이 아니라
  // 그 자리에 임시 도하로를 새로 연 것이고, 진영당 두 개 제한에 그대로 걸린다.
  if (deckAt(x, y)) return false;
  if (isParallelToExistingBridge(x, y)) return false;
  return extendsExistingBridge(x, y) || builtCrossingCount(owner) < bridgeLimitPerSide;
}

// 왜 못 놓는지는 규칙을 배우는 자리다. "자리가 없다" 한 마디로 뭉뚱그리면 플레이어는
// 다리 규칙을 영영 모른 채 보급품만 들고 강가를 헤맨다.
function bridgeRefusalReason(owner, spots) {
  if (!spots.length) return "가설 불가 › 공병대 주변에 하천 없음";
  if (spots.some((spot) => isParallelToExistingBridge(spot.x, spot.y))) {
    return "가설 불가 › 기존 다리와 나란히 놓을 수 없음 · 한 도하에 한 줄";
  }
  if (spots.some((spot) => !isBridgeableWater(spot.x, spot.y))) {
    return `가설 불가 › 강폭이 ${bridgeSpanLimit}칸 초과 · 건너편에 닿지 않음`;
  }
  return `가설 불가 › 진영당 ${bridgeLimitPerSide}개 한도 · 기존 다리에 이어 붙일 것`;
}

// 사령부 엄호 규칙은 걷어냈다. 옆에 호위가 붙어 있다고 해서 사거리 안에 든 사령부를
// 못 치는 전장은 없다 — 포탄은 옆 부대를 보고 비켜 가지 않는다. 규칙으로 사령부를
// 가려 주는 대신, 사령부는 제 방어력과 거점 위 방어 보너스로 버틴다.
// 그 자리에 있던 함수(isScreenedHQ)와 에디터 값(hqScreening)도 같이 없앴다.

function canAttack(attacker, defender) {
  if (!attacker || !defender || attacker.owner === defender.owner) return false;
  if (attacker.type === "artillery" && attacker.moved) return false;
  if (isTowedArtillery(attacker)) return false;
  if (supplyStatus(attacker).level === "isolated" && unitTypes[attacker.type].range > 1) return false;
  // 안 보이는 적은 못 친다. 그리고 멀리 쏘는 부대는 자기 눈이 아니라 아군의 눈이 필요하다 —
  // 사거리 5짜리 야포의 시야는 3이라, 관측 없이는 자기 사거리의 절반밖에 못 쏜다.
  // 이 두 줄이 "포병 앞에는 정찰이 선다"를 규칙으로 만든다. 붙어서 치는 백병(사거리 1)은
  // 눈앞의 일이니 관측을 따지지 않는다.
  if (!unitVisibleTo(defender, attacker.owner)) return false;
  if (!hasObservation(attacker, defender)) return false;
  return distance(attacker, defender) <= unitTypes[attacker.type].range && !ridgeBlocksFire(attacker, defender);
}

// 못 치는 이유를 한 줄로 알려준다. 여태 못 치는 적을 누르면 아무 일도 일어나지
// 않고 정보만 떴다 — 플레이어가 보기에는 "버튼이 고장 난 화면"이다. 규칙이
// 아무리 그럴듯해도 화면이 말해 주지 않으면 그건 규칙이 아니라 버그로 읽힌다.
// 순서는 canAttack이 막는 순서와 똑같이 둔다. 그래야 알려 준 이유를 없애면
// 실제로 칠 수 있게 된다.
function attackBlockReason(attacker, defender) {
  if (!attacker || !defender || attacker.owner === defender.owner) return null;
  const spec = unitTypes[attacker.type];
  // 행동을 마친 부대는 canAttack이 따지지 않는다(그건 사거리·시야를 보는 함수다).
  // 대신 클릭이 공격까지 가지 못하고 되돌아 나오므로, 이 이유가 가장 먼저다.
  if (attacker.justArrived) return formingNotice(attacker);
  if (attacker.acted) {
    const label = unitLabel(attacker);
    return `${label} › 이번 턴 행동 완료`;
  }
  if (canAttack(attacker, defender)) return null;
  if (attacker.type === "artillery" && attacker.moved) return "야포 › 움직인 턴에는 사격 불가 · 다음 턴에 사격 (자주포는 가능)";
  if (isTowedArtillery(attacker)) return "야포 › 견인 중 · 전개해야 사격";
  if (supplyStatus(attacker).level === "isolated" && spec.range > 1) return "보급 두절 › 포탄 없음 · 보급선 안으로 후퇴할 것";
  if (!unitVisibleTo(defender, attacker.owner)) return "미확인 적 › 가까이 가서 봐야 사격 가능";
  if (!hasObservation(attacker, defender)) return "관측 없음 › 앞에 부대를 세워야 원거리 사격 가능";
  const gap = distance(attacker, defender);
  if (gap > spec.range) return `사거리 밖 › ${gap}칸 이격, 사거리 ${spec.range}칸`;
  if (ridgeBlocksFire(attacker, defender)) return "능선이 사선 차단 › 우회하거나 붙어서 타격";
  return "현재 이 적을 타격할 수 없음";
}

function canRaidBase(attacker, base) {
  if (!attacker || !base || attacker.owner === base.owner) return false;
  if (attacker.type === "artillery" && attacker.moved) return false;
  if (isTowedArtillery(attacker)) return false;
  if (supplyStatus(attacker).level === "isolated") return false;
  return distance(attacker, base) <= unitTypes[attacker.type].range && !ridgeBlocksFire(attacker, base);
}

// 빈 다리를 겨냥한다. 위에 부대가 서 있으면 그 부대를 쳐야 하고(그때 다리는
// 절반을 나눠 받는다), 걸어 올라갈 수 있는 다리라면 쏘기보다 건너는 쪽이 먼저다 —
// 그 우선순위는 클릭 처리와 강조 표시에서 정한다.
function canBombardDeck(attacker, deck) {
  if (!attacker || !deck) return false;
  if (attacker.type === "artillery" && attacker.moved) return false;
  if (isTowedArtillery(attacker)) return false;
  if (supplyStatus(attacker).level === "isolated") return false;
  return distance(attacker, deck) <= unitTypes[attacker.type].range && !ridgeBlocksFire(attacker, deck);
}

function bombardDeck(attacker, deck) {
  const kind = bridgeKinds[deck.type];
  attacker.firedFrom = { x: attacker.x, y: attacker.y };
  const damage = deckDamage(attacker, deck);
  playUnitSound(attacker, "attack");
  addLog(t("{unit} › ({x},{y}) {what} 포격 · 피해 {n}", { unit: sideUnitLabel(attacker), x: deck.x, y: deck.y, what: t(kind.name), n: damage }));
  if (!damageDeck(deck, damage)) {
    addLog(t("{what} 잔존 · 내구 {hp}/{max}", { what: t(kind.name), hp: deck.hp, max: deck.maxHp }));
  }
}

function ridgeBlocksFire(attacker, target) {
  if (unitTypes[attacker.type].range <= 1 || distance(attacker, target) <= 1) return false;
  if (getTerrainKey(target.x, target.y) === "H") return true;
  return pathsBetween(attacker, target).every((path) =>
    path.some((point) => (point.x !== target.x || point.y !== target.y) && getTerrainKey(point.x, point.y) === "H"),
  );
}

function pathsBetween(start, end) {
  const horizontalFirst = [];
  const verticalFirst = [];
  let x = start.x;
  let y = start.y;

  while (x !== end.x) {
    x += Math.sign(end.x - x);
    horizontalFirst.push({ x, y });
  }
  while (y !== end.y) {
    y += Math.sign(end.y - y);
    horizontalFirst.push({ x, y });
  }

  x = start.x;
  y = start.y;
  while (y !== end.y) {
    y += Math.sign(end.y - y);
    verticalFirst.push({ x, y });
  }
  while (x !== end.x) {
    x += Math.sign(end.x - x);
    verticalFirst.push({ x, y });
  }

  return [horizontalFirst, verticalFirst];
}

// ── 전장 안개 ──────────────────────────────────────────────────────────────
// 여태 이 게임은 양쪽이 패를 깔아놓고 두는 장기였다. 첫 턴부터 적 배치가 전부
// 보이니 매복도 기만도 성립하지 않았고, 정찰이라는 개념 자체가 없었다.
// 안개의 규칙은 하나다: 지형은 늘 보이고, 부대는 누가 봐줘야 보인다.
// 지형까지 가리지 않는 것은 지도가 곧 작전 브리핑이기 때문이다 — 어느 쪽에
// 강이 있는지 모르는 것은 전략이 아니라 불편이다.

// 능선이 시야를 막는가. 사격 차단(ridgeBlocksFire)과 일부러 규칙을 다르게 둔다.
// 사격은 고지 위의 표적 자체를 못 맞히지만, 시야는 반대다 — 능선 위에 선 것은
// 오히려 하늘을 배경으로 드러난다. 가리는 것은 사이에 낀 산등성이뿐이고,
// 관측자가 그 산등성이만큼 높이 서 있으면 넘겨다본다.
function ridgeBlocksSight(from, to) {
  if (distance(from, to) <= 1) return false;
  if (getTerrainKey(from.x, from.y) === "H") return false;
  return pathsBetween(from, to).every((path) =>
    path.some(
      (point) =>
        (point.x !== to.x || point.y !== to.y) &&
        (point.x !== from.x || point.y !== from.y) &&
        getTerrainKey(point.x, point.y) === "H",
    ),
  );
}

// 이 부대가 지금 몇 칸을 보는가. 기본값은 기동+2로 채워 두었지만 병종마다
// 따로 쥔 값이다 — 시야를 기동에 묶어 버리면 "빠른 부대 = 잘 보는 부대"가 되어
// 정찰이 독립된 임무로 서질 못한다. 에디터에서 보병만 올리면 그날로 정찰병이 된다.
function sightRangeOf(unit) {
  return sightRangeAt(unit, unit.x, unit.y);
}

// 저 칸에 서면 몇 칸을 보는가. 서 있는 자리를 따로 받는 것은 "가 보면 뭐가 보이는가"를
// 미리 재야 하기 때문이다 — 행군 중 접적 정지(ambushHalt)가 이 계산을 쓴다.
function sightRangeAt(unit, x, y) {
  const spec = unitTypes[unit.type];
  const base = spec.sight ?? spec.move + 2;
  // 고지에 서면 멀리 본다. 고지 쟁탈이 화력 싸움에서 정보 싸움으로 넓어지는 자리다.
  return base + (getTerrainKey(x, y) === "H" ? hillSightBonus : 0);
}

// 행군 중 접적. 안개가 있는데 이동만 예전처럼 순간이동이면, 부대는 적의 코앞을
// 스쳐 지나 목적지에 서 있고 플레이어는 지나온 길에 뭐가 있었는지 영영 모른다.
// 그래서 가는 길을 한 칸씩 밟아 보며 두 가지를 나눠 처리한다.
//
//   본다   — 새 적이 시야에 들어오면 그 자리에서 목격 기록을 남긴다. 목적지에서
//            다시 안 보이더라도 지나가며 본 것은 본 것이다. 이게 정찰의 값어치다.
//   멈춘다 — 그중 contactHaltRange 안까지 붙은 적이 있을 때만 발이 묶인다.
//
// 이 둘을 하나로 묶어 두었던 것이 셔먼이 장애물도 없이 한 칸 만에 서던 원인이다.
// 시야 6칸짜리 전차는 계곡 건너를 알아본 것만으로 이동력 6을 통째로 버렸다.
// 나눠 놓아야 "한 칸씩 조심해서 나간다"와 "일단 끝까지 달린다"가 서로 다른 선택이
// 되고, 매복은 시야가 아니라 거리로 성립한다.
//
// 목격 기록을 여기서 직접 쓰는 것은 그 자리를 아는 곳이 여기뿐이기 때문이다 —
// 부대는 곧 지나쳐 가므로 나중에 다시 물어볼 수가 없다.
// 목적지에서 처음 붙는 경우는 멈출 것이 없으니(이미 다 왔다) 알림만 남긴다.
function ambushHalt(unit, targetX, targetY) {
  if (!fogOfWar) return null;
  const path = movementPath(unit, targetX, targetY);
  // 출발 전에 이미 알고 있던 적. 이 명단에 없는 것이 나타나야 "새로 발견"이다.
  // 행군 중에 본 적을 여기에 보태면 안 된다 — 2킬로 밖에서 알아본 순간 명단에
  // 올라가 버려서, 정작 코앞까지 붙었을 때는 "아는 놈"이라며 그냥 지나친다.
  // 알아보는 것과 맞닥뜨리는 것은 다른 사건이고, 발을 묶는 쪽은 뒤엣것이다.
  const known = new Set(visibleFoes(unit.owner).map((foe) => foe.id));
  const noted = new Set();
  const book = state.contacts?.[unit.owner];
  let halt = null;

  for (let i = 1; i < path.length && !halt; i += 1) {
    const spot = path[i];
    const range = sightRangeAt(unit, spot.x, spot.y);
    state.units.forEach((foe) => {
      if (foe.owner === unit.owner || known.has(foe.id)) return;
      const gap = distance(spot, foe);
      if (gap > range || ridgeBlocksSight(spot, foe)) return;
      if (book && !noted.has(foe.id)) {
        noted.add(foe.id);
        book[foe.id] = { id: foe.id, x: foe.x, y: foe.y, type: foe.type, owner: foe.owner, turn: state.turn };
      }
      if (!halt && contactHaltRange > 0 && gap <= contactHaltRange) {
        halt = { x: spot.x, y: spot.y, foe, atGoal: i === path.length - 1 };
      }
    });
  }

  return halt;
}

// 진영이 지금 보고 있는 칸 전부. 시야는 부대마다 재지만 아는 것은 진영이 공유한다 —
// 정찰병이 본 것을 후방의 야포가 모른다면 관측이라는 말 자체가 성립하지 않는다.
// 한 턴에 여러 번 불리므로(칸 320개를 그리는 동안 특히) 배치가 그대로면 캐시를 쓴다.
let visionCache = { key: "", byOwner: new Map() };

function visionKey() {
  return `${state.turn}:${state.units.map((unit) => `${unit.id}@${unit.x},${unit.y}`).join("|")}:${state.bases
    .map((base) => `${base.owner}@${base.x},${base.y}`)
    .join("|")}`;
}

function visionField(owner) {
  const key = visionKey();
  if (visionCache.key !== key) visionCache = { key, byOwner: new Map() };
  const cached = visionCache.byOwner.get(owner);
  if (cached) return cached;

  const seen = new Set();
  const eyes = [
    ...state.units.filter((unit) => unit.owner === owner).map((unit) => ({ x: unit.x, y: unit.y, range: sightRangeOf(unit) })),
    // 거점도 눈이다. 후방 창고가 제 앞마당조차 못 본다면 침투 한 기에 소리 없이
    // 뺏기고, 플레이어는 생산이 멈춘 뒤에야 알게 된다.
    ...state.bases.filter((base) => base.owner === owner).map((base) => ({ x: base.x, y: base.y, range: baseSightRange })),
  ];

  eyes.forEach((eye) => {
    for (let y = Math.max(0, eye.y - eye.range); y <= Math.min(height - 1, eye.y + eye.range); y += 1) {
      for (let x = Math.max(0, eye.x - eye.range); x <= Math.min(width - 1, eye.x + eye.range); x += 1) {
        if (distance(eye, { x, y }) > eye.range) continue;
        if (ridgeBlocksSight(eye, { x, y })) continue;
        seen.add(posKey(x, y));
      }
    }
  });

  visionCache.byOwner.set(owner, seen);
  return seen;
}

function canSee(owner, x, y) {
  if (!fogOfWar) return true;
  return visionField(owner).has(posKey(x, y));
}

// 이 부대가 상대 진영에게 보이는가. 자기 부대는 언제나 보인다.
// 쏜 부대는 그 턴 동안 드러난다 — 매복의 대가다. 한 방 먹이고 계속 숨어 있을 수
// 있다면 그건 매복이 아니라 무적이고, 맞은 쪽은 어디서 날아왔는지도 모른 채
// 전멸한다. 총구 화염은 숨길 수 없다.
function unitVisibleTo(unit, owner) {
  if (!fogOfWar) return true;
  if (unit.owner === owner) return true;
  if (unit.firedFrom && canSee(owner, unit.firedFrom.x, unit.firedFrom.y)) return true;
  return canSee(owner, unit.x, unit.y);
}

// 이 진영이 지금 볼 수 있는 상대 부대 전부. AI가 적을 훑는 자리는 전부 이 함수를
// 거쳐야 한다 — 한 군데라도 state.units를 직접 훑으면 그 함수만 안개를 뚫고 보게 되고,
// AI는 "보이지도 않는 부대를 정확히 피해 다니는" 이상한 물건이 된다.
function visibleFoes(owner) {
  return state.units.filter((unit) => unit.owner !== owner && unitVisibleTo(unit, owner));
}

// 마지막으로 목격한 자리. 진짜 안개의 느낌은 여기서 나온다 — 적이 숲으로 사라져도
// "저 근처에 있었다"는 것은 남고, 몇 턴이 지나면 그것마저 흐려진다.
// AI도 이 기록을 보고 수색한다. 이게 없으면 적은 시야에서 놓친 순간 상대를
// 처음부터 없었던 것처럼 잊고 제자리에 선다.
function recordContacts(owner) {
  if (!fogOfWar || !state.contacts) return;
  const book = state.contacts[owner];
  visibleFoes(owner).forEach((foe) => {
    book[foe.id] = { id: foe.id, x: foe.x, y: foe.y, type: foe.type, owner: foe.owner, turn: state.turn };
  });
  // 기록을 지우는 이유는 둘뿐이다: 그 부대가 죽었거나, 본 지 너무 오래됐거나.
  // "지금 그 칸이 비어 있는 게 보인다"는 지우는 이유가 아니다 — 적이 눈앞에서
  // 숲으로 걸어 들어간 그 순간, 마지막으로 선 자리야말로 유일한 단서이기 때문이다.
  // (처음엔 그 조건으로 지웠는데, 그러면 기록이 남는 경우가 사실상 없어서
  //  안개는 그림만 남고 수색이라는 행동 자체가 사라졌다.)
  Object.keys(book).forEach((id) => {
    const memo = book[id];
    const gone = !state.units.some((unit) => String(unit.id) === String(id));
    const stale = contactMemoryTurns > 0 && state.turn - memo.turn > contactMemoryTurns;
    if (gone || stale) delete book[id];
  });
}

// 목격 기록 중 지금 눈에 보이지 않는 것만. 화면에는 흐린 표식으로, AI에게는
// 수색 목적지로 쓰인다. 지금 보이는 부대까지 섞이면 AI가 "수색"과 "교전"을
// 구분하지 못하고, 화면에는 실체 위에 유령이 겹쳐 찍힌다.
function staleContacts(owner) {
  if (!fogOfWar) return [];
  return Object.values(state.contacts[owner] ?? {}).filter(
    (memo) => !state.units.some((unit) => String(unit.id) === String(memo.id) && unitVisibleTo(unit, owner)),
  );
}

// 포병이 지금 이 표적을 쏠 수 있는가. 사거리 5에 시야 3인 야포는 자기 눈으로는
// 절대 닿지 않는 곳을 때린다 — 그 자리를 누가 봐주느냐가 곧 정찰의 존재 이유다.
// 사거리 1짜리 부대는 눈앞을 치는 것이라 이 규칙과 무관하다.
function hasObservation(attacker, target) {
  if (!fogOfWar) return true;
  if (unitTypes[attacker.type].range <= 1) return true;
  return canSee(attacker.owner, target.x, target.y);
}

function bestRaidTarget(unit, owner) {
  return state.bases
    .filter((base) => base.owner === owner && canRaidBase(unit, base) && raidIsWorthIt(base))
    .sort((a, b) => baseProduction(b) - baseProduction(a))[0];
}

// 이미 부술 것이 남지 않은 거점은 때려도 아무 일이 일어나지 않는다. 효율은 곱하기로
// 깎이므로 바닥 근처에서는 한 턴을 온전히 써도 생산이 0.01 줄어드는 식이다.
// 그 한 턴은 밟으러 가는 데 쓰는 것이 낫다.
function raidIsWorthIt(base) {
  // 하한에 닿은 거점은 더 이상 깎이지 않는다. 이걸 안 보면 AI는 아무것도
  // 일어나지 않는 포격에 매 턴을 갈아 넣는다.
  if (base.efficiency <= baseEfficiencyFloor) return false;
  return baseProduction(base) * (1 - raidEfficiencyFactor) >= 0.25;
}

// 거점 하나의 값어치. 효율이 아니라 생산 정수로 잰다 — 습격으로 0%가 된 거점도
// 밟아서 가져오면 복구되고, 무엇보다 상대에게서 뺏는 것은 내가 얻는 동시에
// 상대가 잃는 일이라 같은 생산이라도 두 배로 친다.
// 이 거점을 빼앗으면 그 진영에는 거점이 하나도 남지 않는가. 무주공산 거점은
// 잃을 진영이 없으므로 언제나 아니다.
function isLastBaseOf(base) {
  if (base.owner === "neutral") return false;
  return !state.bases.some((other) => other.owner === base.owner && other !== base);
}

function baseSeatValue(base, owner) {
  return base.production * (base.owner === owner || base.owner === "neutral" ? 1 : 2);
}

// 눈앞에 열려 있는 무방비 거점. 습격은 효율을 깎을 뿐이고, 효율이 바닥나면 습격은
// 아무것도 하지 않는다 — 무저항 10턴을 돌려보니 적은 아군 거점을 0%로 만들어 놓고도
// 끝내 밟지 않았다. 이기고 있으면서 끝내지 않는 모습이다.
// 지키는 부대가 없고 이번 턴에 발이 닿는다면, 그 칸은 때릴 표적이 아니라 밟을 자리다.
// 사령부는 뺀다 — 보급의 중심을 최전선 거점에 세우는 것은 점령이 아니라 헌납이다.
function openBaseSeat(unit) {
  if (unit.type === "battalionHQ") return null;
  const reach = reachableTiles(unit);
  if (!reach.length) return null;

  const seats = state.bases
    .filter((base) => base.owner !== unit.owner && !getUnitsAt(base.x, base.y).length)
    // 포병은 최전선 거점에 홀로 서면 반격 한 번에 사라진다. 작전을 끝내는
    // 마지막 한 곳일 때만 예외로 둔다 — 그때는 잃어도 그걸로 끝이니까.
    .filter((base) => !isArtilleryUnit(unit) || isLastBaseOf(base))
    .map((base) => ({ base, seat: reach.find((tile) => tile.x === base.x && tile.y === base.y) }))
    .filter((entry) => entry.seat)
    .sort((a, b) => baseSeatValue(b.base, unit.owner) - baseSeatValue(a.base, unit.owner));

  return seats[0]?.seat ?? null;
}

// 점령은 습격보다 먼저다. tryEnemyStrike를 먼저 부르면 옆칸의 거점을 때리느라 행동을
// 다 쓰고, 다음 턴에도 또 때린다. 그 반복이 "이기고도 안 끝내는" 적을 만들었다.
function tryEnemyCapture(unit) {
  const seat = openBaseSeat(unit);
  if (!seat) return false;
  moveEnemyUnit(unit, seat);
  captureBase(unit);
  // 밟은 뒤에도 사거리 안에 표적이 있으면 친다. 점령이 공격을 대신하지는 않는다.
  tryEnemyStrike(unit);
  return true;
}

// ── 적 AI 정책 ──────────────────────────────────────────────────────────────
// 적의 자세는 미션이 정한다. 시나리오에 따로 적을 필요가 없다 — 목표가 곧 자세다.
//   hunt   : 잡아야 할 상대가 지목되어 있다(적 사령부 사냥, 플레이어의 사수 대상).
//   attack : 밟아야 할 칸이 있다. 그 칸을 향해 민다.
//   defend : 내 목표는 없고 시계가 내 편이다. 플레이어의 목표를 막는다.
// 예전 AI는 자세가 없어서 어느 미션에서든 "가장 가까운 거점 습격"만 했다.
function enemyPosture() {
  // 아직 열리지 않은 목표(나중에 떨어지는 반격 명령)는 없는 것으로 친다.
  // 그것까지 세면 첫날부터 후방 거점으로 달려가는 우스운 적이 된다.
  const mine = objectivesFor("enemy").filter(objectiveOpen);
  if (mine.some((objective) => objective.kind === "destroy")) return "hunt";
  // 플레이어가 지켜야 하는 부대는 곧 적이 노려야 할 사냥감이다.
  if (objectivesFor("player").some((objective) => objective.kind === "protect")) return "hunt";
  // 개통 목표도 공격이다. 강 건너의 칸을 보급망으로 이으려면 결국 그 칸까지
  // 밀고 나가 그 자리를 지켜야 한다 — 앉아서는 절대 채워지지 않는 목표다.
  if (mine.some((objective) => objective.kind === "seize" || objective.kind === "supply")) return "attack";
  // 목표가 없다 = 버티기만 하면 이긴다. 앉아 있으라는 뜻은 아니다(아래 출격 규칙).
  if (objectiveTiles("player").length || state.mission?.timeoutOutcome === "playerLose") return "defend";
  return "attack";
}

// ── 적 참모부 ──────────────────────────────────────────────────────────────
// 예전에는 부대마다 따로 "가장 가까운 적이 어디냐"를 물었다. 전군이 같은 질문에
// 같은 답을 내니 결과는 한 덩어리 전진이었다 — 그건 전략이 아니라 무리 짓기다.
// 이제는 턴이 시작될 때 참모부가 한 번 계획을 세운다: 축선을 고르고, 어디에
// 주력을 걸지 정하고, 예비를 떼어 남긴다. 부대는 배정받은 임무만 수행한다.
let enemyPlan = new Map();

// 이번 턴에 노릴 축선. 자세가 무엇을 축선으로 볼지 정한다.
function enemyAxes() {
  const posture = enemyPosture();

  if (posture === "hunt") {
    const seen = enemyPreyUnits().map((prey) => ({ x: prey.x, y: prey.y, label: "표적", key: `표적:${prey.id}` }));
    if (seen.length) return seen;
    // 사냥감이 안개로 들어갔다. 그렇다고 사냥을 그만두는 것은 아니다 —
    // 마지막으로 본 자리가 이번 턴의 수색 축선이 된다.
    const tracks = huntTracks();
    if (tracks.length) return tracks;
    // 흔적조차 없으면 상대의 보급 거점을 훑는다. 지켜야 할 부대는 결국
    // 보급을 등지고 움직이니, 거점 주변이 가장 그럴듯한 수색 구역이다.
    return state.bases
      .filter((base) => base.owner === "player")
      .map((base) => ({ x: base.x, y: base.y, label: "수색", key: `수색:${base.x},${base.y}` }));
  }

  if (posture === "defend") {
    return defensePosts("enemy").map((post) => defenseAnchor("enemy", post));
  }

  const seats = objectiveTiles("enemy").map((objective) => ({
    x: objective.x,
    y: objective.y,
    label: "목표",
    key: `목표:${objective.x},${objective.y}`,
  }));
  if (seats.length) return seats;
  // 좌표 목표가 없으면 플레이어의 보급 거점이 축선이다. 보급이 이 게임의 중심이니
  // 그걸 끊는 것이 언제나 유효한 작전이다.
  return state.bases
    .filter((base) => base.owner === "player")
    .map((base) => ({ x: base.x, y: base.y, label: "거점", key: `거점:${base.x},${base.y}` }));
}

// ── 수비 교리 ──────────────────────────────────────────────────────────────
// 예전 수비는 초소를 밟고 서서 적이 사거리에 들어오기를 기다리는 것이었다.
// 그건 수비가 아니라 대기다. riverBreak 8턴을 재보니 보병은 8턴, 전차는 7턴을
// 제자리에 서 있었다. 지킨다는 것은 적이 목표에 닿기 전에 막는다는 뜻이다.

// 지킬 칸 앞의 자리. 어느 쪽이 앞인지는 나침반이 아니라 적이 정한다.
function defenseAnchor(owner, post) {
  // key는 계획을 잇는 손잡이고, label은 그 계획을 사람이 읽을 때 쓰는 이름이다.
  // 둘 다 화면에는 안 나간다 — 번역 대상이 아니다. 전방 자리는 적이
  // 움직이면 좌표가 흔들리므로, 흔들리지 않는 초소 좌표로 이름을 붙인다. 그래야
  // 같은 초소를 맡은 부대가 매 턴 "다른 축선"으로 읽히지 않는다.
  const base = { x: post.x, y: post.y, label: "초소", key: `초소:${post.x},${post.y}` };
  if (enemyForwardDefense <= 0) return base;
  const foes = visibleFoes(owner);
  if (!foes.length) return base;
  const cx = foes.reduce((sum, unit) => sum + unit.x, 0) / foes.length;
  const cy = foes.reduce((sum, unit) => sum + unit.y, 0) / foes.length;
  const dx = cx - post.x;
  const dy = cy - post.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return base;
  const x = clampToBoard(Math.round(post.x + (dx / length) * enemyForwardDefense), width);
  const y = clampToBoard(Math.round(post.y + (dy / length) * enemyForwardDefense), height);
  if (x === post.x && y === post.y) return base;
  return { x, y, label: "전방", key: `전방:${post.x},${post.y}`, post: { x: post.x, y: post.y } };
}

// 수비의 축선 분할은 좌우가 아니라 앞뒤다. 한 줄로 늘어선 방어선은 한 번 뚫리면
// 그 뒤가 텅 비어 있고, 그때 남는 것은 방어가 아니라 추격당하는 행렬이다.
function defenseLanes(anchor) {
  if (!anchor.post) return [anchor];
  return [
    { x: anchor.x, y: anchor.y, label: "전방", key: anchor.key ?? `전방:${anchor.post.x},${anchor.post.y}` },
    { x: anchor.post.x, y: anchor.post.y, label: "종심", key: `종심:${anchor.post.x},${anchor.post.y}` },
  ];
}

// 초소가 실제로 밟히는 순간 예비는 풀린다. 뚫린 뒤에 도착하는 예비는
// 예비가 아니라 잔당이고, 아껴 둔 보람은 거기서 사라진다.
function enemyBreach(unit) {
  if (enemyPosture() !== "defend") return null;
  const posts = defensePosts(unit.owner);
  if (!posts.length) return null;
  const broken = visibleFoes(unit.owner).filter((foe) =>
    posts.some((post) => distance(foe, post) <= enemyDefenseRadius),
  );
  return broken.length ? nearestOf(unit, broken) : null;
}

// 어느 축선에 주력을 걸 것인가. 공격이면 "적이 얇은 곳", 수비면 "적이 몰려오는 곳".
// 둘 다 결국 같은 원칙이다 — 결정이 날 곳에 무게를 싣는다.
function axisWeight(axis, units) {
  const defenders = visibleFoes("enemy").filter((foe) => distance(foe, axis) <= 3).length;
  const closeness = units.length
    ? units.reduce((sum, unit) => sum + distance(unit, axis), 0) / units.length
    : 0;
  if (enemyPosture() === "defend") {
    // 수비: 위협이 큰 초소가 주공. 몰려오는 쪽을 비워두면 그대로 뚫린다.
    return defenders * 4 - closeness * 0.5;
  }
  // 공격: 얇은 곳이 주공. 가깝기도 하면 더 좋다.
  return -defenders * 2.5 - closeness;
}

// 매 턴 새로 짠다. 부대가 죽고 전선이 밀리면 어제의 계획은 이미 남의 계획이다.
// 계획을 새로 짜면 뒤에 있던 예비가 자연히 전방 부대로 승격되므로,
// "예비 투입" 규칙을 따로 두지 않아도 결원이 메워진다.
function buildEnemyPlan() {
  // 어제의 계획은 버리되, 누가 무엇을 맡았는지는 기억해 둔다. 매 턴 백지에서
  // 다시 뽑으면 뒤로 한 발 물러선 부대가 그 이유만으로 예비가 되고, 다음 턴에
  // 다시 전방이 된다. 그러면 부대는 앞뒤로 왕복만 하다가 작전이 끝난다.
  // 임무는 상황이 바뀌어야 바뀌는 것이지, 계산을 다시 했다고 바뀌는 게 아니다.
  const lastPlan = enemyPlan;
  const wasRole = (unit, role) => (lastPlan.get(unit.id)?.role === role ? 0 : 1);
  const lastAxisKey = (unit) => lastPlan.get(unit.id)?.axis?.key ?? null;

  enemyPlan = new Map();
  const units = state.units.filter((unit) => unit.owner === "enemy" && isAssaultUnit(unit));
  const axes = enemyAxes();
  if (!units.length || !axes.length) return;

  // 예비는 가장 뒤에 있는 부대에서 뗀다. 이미 붙어 있는 부대를 뒤로 빼는 건
  // 그 자체로 손해고, 뒤에 있는 부대는 어차피 이번 턴에 결판에 못 닿는다.
  // 다만 어제 예비였던 부대가 먼저다 — 예비를 매 턴 갈아치우면 아껴 둔 부대가
  // 없는 것과 같다.
  const byRear = units
    .slice()
    .sort(
      (a, b) =>
        wasRole(a, "reserve") - wasRole(b, "reserve") ||
        nearestOpposingDistance("enemy", b.x, b.y) - nearestOpposingDistance("enemy", a.x, a.y),
    );
  const reserveCount = Math.min(units.length - 1, Math.floor((units.length * enemyReserveShare) / 100));
  const reserves = byRear.slice(0, Math.max(0, reserveCount));
  const committed = units.filter((unit) => !reserves.includes(unit));

  // 축선이 하나뿐이면 갈라 만든다. 목표가 하나인 것과 길이 하나인 것은 다른
  // 이야기다. 다만 공격과 수비는 가르는 방향이 다르다 — 공격은 좌우로 벌려
  // 접근로를 늘리고, 수비는 앞뒤로 겹쳐 종심을 만든다.
  const spread =
    axes.length !== 1
      ? axes
      : enemyPosture() === "defend"
        ? defenseLanes(axes[0])
        : approachLanes(axes[0], committed);
  const ranked = spread.slice().sort((a, b) => axisWeight(b, committed) - axisWeight(a, committed));
  const main = ranked[0];
  const others = ranked.slice(1);

  // 주공 몫을 먼저 떼고, 나머지를 남은 축선에 돌린다. 축선이 하나뿐이면
  // 몫을 나눌 데가 없으니 전부 그리로 간다 — 그때는 예비가 유일한 종심이다.
  const mainCount = others.length
    ? Math.max(1, Math.round((committed.length * enemyMainEffortShare) / 100))
    : committed.length;
  // 주공도 어제 주공이었던 부대를 먼저 세운다. 거리만 보면 한 칸 뒤처졌다는
  // 이유로 선두가 매 턴 뒤바뀌고, 그때마다 앞뒤 대열이 통째로 갈린다.
  const forMain = committed
    .slice()
    .sort((a, b) => wasRole(a, "main") - wasRole(b, "main") || distance(a, main) - distance(b, main))
    .slice(0, mainCount);
  forMain.forEach((unit) => enemyPlan.set(unit.id, { role: "main", axis: main }));

  const rest = committed.filter((unit) => !forMain.includes(unit));
  rest.forEach((unit, index) => {
    // 어제 맡았던 축선이 아직 살아 있으면 그리로 간다. 조공이 매 턴 가까운 쪽으로
    // 갈아타면 좌우로 왕복만 하고 어느 쪽에도 도착하지 못한다.
    const prior = others.find((axis) => axis.key && axis.key === lastAxisKey(unit));
    const axis = prior ?? (others.length ? nearestOf(unit, others) ?? others[index % others.length] : main);
    enemyPlan.set(unit.id, { role: "support", axis });
  });

  // 예비의 집결지는 주공 축선과 자기 거점 사이. 전선에 닿지는 않되
  // 결판이 나는 곳으로 한 번에 달려갈 수 있는 자리다.
  const rally = enemyRallyPoint(main);
  reserves.forEach((unit) => enemyPlan.set(unit.id, { role: "reserve", axis: rally }));
}

// 목표 하나를 여러 접근로로 나눈다. 부대 무게중심에서 목표를 향한 방향을 구하고,
// 그 직각 방향으로 좌우에 우회 지점을 세운다. 정면 하나, 좌우 하나씩 — 셋이면
// 길목 하나를 막아 작전 전체를 끝내지는 못한다.
function approachLanes(axis, units) {
  if (enemyFlankSpread <= 0 || units.length < 3) return [axis];
  const cx = units.reduce((sum, unit) => sum + unit.x, 0) / units.length;
  const cy = units.reduce((sum, unit) => sum + unit.y, 0) / units.length;
  // 이미 목표에 붙었으면 우회는 끝이다. 여기서도 좌우로 벌리면 무게중심에서
  // 목표를 향한 벡터가 너무 짧아 매 턴 방향이 뒤집히고, 부대는 목표 앞에서
  // 좌우로 왕복만 한다. 우회는 접근 수단이지 도착지가 아니다.
  const closed = units.every((unit) => distance(unit, axis) <= enemyFlankSpread);
  if (closed) return [axis];
  const dx = axis.x - cx;
  const dy = axis.y - cy;
  const length = Math.hypot(dx, dy);
  if (length < 1) return [axis];
  // 진행 방향의 직각 단위벡터. 좌우로 이만큼 벌린 지점이 우회로의 입구가 된다.
  const px = -dy / length;
  const py = dx / length;
  const lanes = [{ ...axis, label: "정면", key: `정면:${axis.key ?? `${axis.x},${axis.y}`}`, target: axis }];
  [1, -1].forEach((side) => {
    const x = clampToBoard(Math.round(axis.x + px * enemyFlankSpread * side), width);
    const y = clampToBoard(Math.round(axis.y + py * enemyFlankSpread * side), height);
    if (x === axis.x && y === axis.y) return;
    // 우회로 입구는 무게중심이 움직일 때마다 좌표가 흔들린다. 그래서 손잡이는
    // 좌표가 아니라 "목표의 어느 쪽인가"로 잡는다. 같은 쪽 우회로는 좌표가 달라져도
    // 같은 길이며, 그래야 조공이 매 턴 좌우로 갈아타지 않는다.
    lanes.push({ x, y, label: "우회", key: `우회${side}:${axis.key ?? `${axis.x},${axis.y}`}`, target: axis });
  });
  return lanes;
}

function clampToBoard(value, limit) {
  return Math.max(0, Math.min(limit - 1, value));
}

function enemyRallyPoint(main) {
  const anchor = state.bases.filter((base) => base.owner === "enemy").sort((a, b) => distance(a, main) - distance(b, main))[0];
  if (!anchor) return main;
  return { x: Math.round((anchor.x + main.x) / 2), y: Math.round((anchor.y + main.y) / 2), label: "집결지" };
}

function enemyRoleFor(unit) {
  return enemyPlan.get(unit.id)?.role ?? null;
}

function postureVerb(unit) {
  // 병종이 하는 일이 다르면 전황판에 찍히는 말도 달라야 한다. 야포가 "주공으로
  // 전진"했다고 적히면 플레이어는 무슨 일이 벌어지는지 읽을 수 없다.
  if (isArtilleryUnit(unit)) return "사격 진지로 이동";
  if (unit && infantryScreenGoal(unit)) return "포병 엄호로 이동";
  const role = unit ? enemyRoleFor(unit) : null;
  if (role === "reserve") return "예비로 집결";
  if (role === "support") return "조공으로 기동";
  if (role === "main") return "주공으로 전진";
  const posture = enemyPosture();
  if (posture === "defend") return "방어 위치로 이동";
  if (posture === "hunt") return "표적을 향해 기동";
  return "전진";
}

// 미션이 지목한 사냥감. 격파 목표가 가리키는 부대와, 플레이어가 사수해야 하는 부대.
// 안개가 켜져 있으면 지금 눈에 든 것만 돌려준다 — 사냥감이 어디 있는지 처음부터
// 알고 시작하는 사냥은 사냥이 아니다. 놓친 사냥감은 huntTracks가 이어받는다.
function enemyPreyUnits() {
  const prey = [];
  objectivesFor("enemy")
    .filter((objective) => objective.kind === "destroy")
    .forEach((objective) => {
      prey.push(...state.units.filter((unit) => unit.owner === "player" && unit.type === objective.targetType));
    });
  objectivesFor("player")
    .filter((objective) => objective.kind === "protect")
    .forEach((objective) => prey.push(...taggedUnits("player", objective.tag)));
  return prey.filter((unit) => unitVisibleTo(unit, "enemy"));
}

// 놓친 사냥감의 흔적. 격파 목표가 병종을 지목했으면 그 병종의 목격 기록만,
// 지목이 없으면(사수 목표 등) 남은 목격 기록 전부가 수색 대상이 된다.
function huntTracks() {
  const wanted = new Set(
    objectivesFor("enemy")
      .filter((objective) => objective.kind === "destroy")
      .map((objective) => objective.targetType),
  );
  return staleContacts("enemy")
    .filter((memo) => memo.owner === "player" && (!wanted.size || wanted.has(memo.type)))
    .map((memo) => ({ x: memo.x, y: memo.y, label: "수색", key: `수색:${memo.x},${memo.y}` }));
}

// 목표 칸을 맡을 부대. 공병대는 공사가 임무고, 사령부는 보급의 중심이라
// 최전선 칸을 맡기지 않는다.
function isAssaultUnit(unit) {
  return unit.type !== "engineer" && unit.type !== "battalionHQ";
}

function nearestOf(unit, candidates) {
  return candidates.slice().sort((a, b) => distance(unit, a) - distance(unit, b))[0] ?? null;
}

// 점령 목표는 한 부대가 그 칸에 서 있으면 채워진다. 전군이 한 칸으로 몰리면
// 나머지는 길만 막으므로, 목표마다 가장 가까운 한 부대에게만 그 칸을 맡긴다.
function assaultSeatFor(unit) {
  if (!isAssaultUnit(unit)) return null;
  const claimants = state.units.filter((other) => other.owner === unit.owner && isAssaultUnit(other));
  // 개통 목표도 한 부대를 앉힌다. 그 칸이 비어 있으면 상대가 올라서기만 해도
  // 보급선이 끊기기 때문이다 — 개통은 열고 끝이 아니라 지켜야 하는 것이다.
  for (const objective of objectiveTiles(unit.owner)) {
    const pool = objective.byTag ? claimants.filter((other) => other.tag === objective.byTag) : claimants;
    const closest = pool.slice().sort((a, b) => distance(a, objective) - distance(b, objective))[0];
    if (closest && closest.id === unit.id) return { x: objective.x, y: objective.y };
  }
  return null;
}

// 지킬 곳: 플레이어가 노리는 칸이 먼저다. 그런 칸이 없으면 내 보급 거점을 지킨다.
function defensePosts(owner) {
  const foe = owner === "enemy" ? "player" : "enemy";
  const contested = objectiveTiles(foe).map((objective) => ({ x: objective.x, y: objective.y }));
  if (contested.length) return contested;
  return state.bases.filter((base) => base.owner === owner).map((base) => ({ x: base.x, y: base.y }));
}

function defensePostFor(unit) {
  const posts = defensePosts(unit.owner);
  if (!posts.length) return null;
  // 이미 아군이 선 초소는 비워둔다. 한 칸에 전군이 몰리면 나머지 초소가 빈다.
  const open = posts.filter(
    (post) => !state.units.some((other) => other.owner === unit.owner && other.id !== unit.id && other.x === post.x && other.y === post.y),
  );
  return nearestOf(unit, open.length ? open : posts);
}

// 초소 반경 안까지 들어온 상대. 수비라고 가만히 서서 맞을 이유는 없다.
function nearestIntruder(unit, post) {
  const intruders = visibleFoes(unit.owner).filter((foe) => distance(foe, post) <= enemyDefenseRadius);
  return intruders.length ? nearestOf(unit, intruders) : null;
}

// ── 병종 교리 ──────────────────────────────────────────────────────────────
// 예전에는 야포도 전차도 보병과 똑같이 "목표를 향해 한 칸"이었다. 그래서 야포가
// 보병처럼 접촉까지 걸어 들어가 사거리 3을 한 번도 못 쓰고 죽었다. 병종이 다르다는
// 것은 능력치가 다르다는 뜻이 아니라 할 일이 다르다는 뜻이다.

// 노출된 아군 포병을 엄호할 보병 하나를 고른다. 전 보병이 포를 둘러싸면 축선이
// 비므로, 포 하나당 가장 가까운 보병 하나만 붙인다.
function infantryScreenGoal(unit) {
  if (unit.type !== "infantry" || enemyScreenRange <= 0) return null;
  const guns = state.units.filter((other) => other.owner === unit.owner && isArtilleryUnit(other));
  if (!guns.length) return null;
  const naked = guns.filter((gun) => {
    if (nearestOpposingDistance(gun.owner, gun.x, gun.y) > enemyScreenRange) return false;
    // 이미 누가 붙어 있으면 엄호는 끝난 것이다.
    return !state.units.some(
      (other) => other.owner === gun.owner && other.id !== gun.id && !isArtilleryUnit(other) && distance(other, gun) <= 1,
    );
  });
  if (!naked.length) return null;
  const gun = nearestOf(unit, naked);
  const closest = state.units
    .filter((other) => other.owner === unit.owner && other.type === "infantry")
    .sort((a, b) => distance(a, gun) - distance(b, gun))[0];
  return closest?.id === unit.id ? { x: gun.x, y: gun.y, label: "엄호" } : null;
}

// 무주공산 거점을 확보하러 갈 부대 하나를 고른다.
// 거점을 진영당 하나로 줄이면서 지도에는 주인 없는 거점이 남게 됐다. AI가 이걸 무시하면
// 플레이어만 전부 주워 담고, 후반에 물량이 일방적으로 기운다 — 예전에 "적 보급량이 고정이라
// 나중엔 너무 쉬워진다"던 그 문제가 그대로 돌아온다. 그렇다고 전군을 보내면 전선이 빈다.
// 거점 하나당 가장 가까운 부대 하나만, 그것도 반경 안에 있을 때만 뗀다.
// 사령부와 포병은 빼는데, 둘 다 혼자 걸어가면 죽는 병종이라 파견 자체가 헌납이기 때문이다.
function unclaimedBaseGoal(unit) {
  if (enemyBaseSeekRange <= 0) return null;
  if (unit.type === "battalionHQ" || isArtilleryUnit(unit)) return null;
  const open = state.bases.filter((base) => base.owner === "neutral" && distance(unit, base) <= enemyBaseSeekRange);
  if (!open.length) return null;

  const base = nearestOf(unit, open);
  const closest = state.units
    .filter((other) => other.owner === unit.owner && other.type !== "battalionHQ" && !isArtilleryUnit(other))
    .sort((a, b) => distance(a, base) - distance(b, base))[0];
  return closest?.id === unit.id ? { x: base.x, y: base.y, label: "거점 확보" } : null;
}

// 포병의 자리 고르기. 좋은 자리란 "표적은 닿고 나는 안 닿는 자리"다.
// 야포는 한 턴에 이동과 사격 중 하나만 하므로, 지금 쏠 수 있는 자리로 걸어가는 것은
// 그 턴을 버리는 짓이다. 다음 턴에 안전하게 쏠 수 있는 자리가 언제나 더 값지다.
function bestFiringPost(unit, goal) {
  const range = unitTypes[unit.type].range;
  // 포병은 보이는 표적만 센다. 안 보이는 적까지 세면 "관측 없이는 못 쏜다"는 규칙과
  // 어긋나, 쏘지도 못할 자리를 명당으로 읽고 그리로 기어들어 간다.
  const foes = visibleFoes(unit.owner);
  const scored = [{ x: unit.x, y: unit.y }, ...reachableTiles(unit)].map((tile) => {
    const spot = { owner: unit.owner, type: unit.type, x: tile.x, y: tile.y };
    return {
      x: tile.x,
      y: tile.y,
      // 표적: 이 칸에서 닿는 상대. 능선에 가리면 사거리 안이어도 못 쏜다.
      targets: foes.filter((foe) => distance(spot, foe) <= range && !ridgeBlocksFire(spot, foe)).length,
      // 노출: 상대가 지금 선 자리에서 이 칸을 때릴 수 있는가. 이게 0인 칸이 포병의 자리다.
      exposed: foes.filter((foe) => distance(spot, foe) <= unitTypes[foe.type].range).length,
      // 다음 턴 위협: 걸어와서 때릴 수 있는가. 사격 진지끼리 비교할 때만 쓴다.
      stalked: foes.filter((foe) => distance(spot, foe) <= unitTypes[foe.type].range + unitTypes[foe.type].move).length,
      cover: coverAt(tile.x, tile.y),
      reach: distance(tile, goal),
      here: tile.x === unit.x && tile.y === unit.y,
    };
  });
  // 동점이면 제자리가 이긴다. 포병은 옮기는 순간 그 턴 사격을 잃으므로,
  // 점수가 같은 칸으로 옮기는 것은 순손해다. 이게 없으면 진지 주변을
  // 매 턴 배회하며 한 발도 쏘지 않는다.
  const stay = (a, b) => (a.here === b.here ? 0 : a.here ? -1 : 1);

  // 쏠 수 있는 자리가 있으면 그 중에서 고른다. 진지 싸움에서는 노출이 전부고
  // 목표까지의 거리는 곁다리다.
  const firing = scored.filter((tile) => tile.targets > 0 && tile.exposed === 0);
  if (firing.length) {
    return firing.sort(
      (a, b) => b.targets - a.targets || a.stalked - b.stalked || b.cover - a.cover || a.reach - b.reach || stay(a, b),
    )[0];
  }

  // 쏠 자리가 없으면 전진이 임무다. 여기서 다음 턴 위협까지 피하려 들면 포는
  // 후방에 눌러앉아 작전 내내 한 발도 못 쏜다 — 지금 맞을 자리만 피하고 나아간다.
  const safe = scored.filter((tile) => tile.exposed === 0);
  return (safe.length ? safe : scored).sort(
    (a, b) => a.exposed - b.exposed || a.reach - b.reach || b.cover - a.cover || a.stalked - b.stalked || stay(a, b),
  )[0];
}

// 견인 판단. 전선이 멀면 포를 걸고 달리는 편이 빠르고, 사거리 언저리에 들어왔으면
// 전개해야 한다. 전환에 한 턴이 통째로 드니 이 판단이 흔들리면 그 포는 작전 내내
// 트럭에 매달린 채 끝난다.
function enemyTowDecision(gun, goal) {
  if (gun.type !== "artillery" || gun.acted || gun.moved || enemyTowDistance <= 0) return false;
  const threat = nearestOpposingDistance(gun.owner, gun.x, gun.y);
  // 자리에 도착했으면 적이 멀어도 전개한다. 적 거리만 보면 수비 미션의 포는
  // 초소에 앉은 채 영원히 트럭에 매달려 있게 된다 — 그건 포가 아니라 짐이다.
  const posted = goal ? distance(gun, goal) <= unitTypes[gun.type].range : false;
  if (!gun.towed && threat > enemyTowDistance && !posted) {
    gun.towed = true;
    gun.acted = true;
    addLog(t("{unit} › 견인 연결", { unit: sideUnitLabel(gun) }));
    return true;
  }
  if (gun.towed && (threat <= enemyTowDistance || posted)) {
    gun.towed = false;
    gun.acted = true;
    addLog(t("{unit} › 포 전개", { unit: sideUnitLabel(gun) }));
    return true;
  }
  return false;
}

// 전차의 자리 고르기. 전차의 값어치는 맷집이 아니라 속도다. 고지와 삼림에 박힌
// 방어선을 정면으로 갈아내는 것은 그 값어치를 스스로 버리는 짓이므로, 같은 거리면
// 트인 땅으로 돌아 들어간다. 엄폐를 찾아다니는 보병의 규칙을 그대로 쓰면 안 된다.
function enemyArmorStep(unit, goal) {
  // 전차도 길을 따라 재야 한다. 직선거리로 재면 강 건너의 목표가 코앞으로 보이고,
  // 전차는 그 강가에서 작전이 끝날 때까지 서 있게 된다.
  const here = routeCostFrom(unit, goal, unit.x, unit.y);
  const foes = visibleFoes(unit.owner);
  let best = null;
  reachableTiles(unit).forEach((tile) => {
    let score = routeCostFrom(unit, goal, tile.x, tile.y);
    // 험지는 전차의 발을 묶는다. 엄폐 보너스보다 통과 비용이 먼저다.
    score += traversalCostForUnit(unit, tile.x, tile.y) * 0.25;
    // 험지에 박힌 상대와 맞붙는 자리는 소모전 자리다. 붙을 거면 트인 땅에서 붙는다.
    foes.forEach((foe) => {
      if (distance(tile, foe) <= 1) score += coverAt(foe.x, foe.y) * 0.6;
    });
    if (!best || score < best.score) best = { x: tile.x, y: tile.y, score };
  });
  return best && distance(best, goal) < here ? best : null;
}

// 이번 턴에 어디를 향할 것인가. 참모부의 계획이 먼저다.
// 계획에 없는 부대(공병·사령부, 또는 계획이 비어 있는 경우)만 예전 규칙으로 떨어진다.
function enemyGoalFor(unit) {
  // 보병의 임무는 확보와 엄호다. 축선을 향해 걷는 것보다 급한 일이 하나 있는데,
  // 노출된 아군 포병 앞에 서는 것이다. 포병은 반격 한 번에 무너지는 병종이라
  // 여기서 한 턴 늦는 것이 포 하나를 잃는 것보다 싸다.
  const screen = infantryScreenGoal(unit);
  if (screen) return screen;

  // 참모부 계획보다 먼저 본다. 계획은 축선을 향해 걷는 일이고, 주인 없는 거점은
  // 걷는 동안 사라지는 기회다 — 플레이어가 먼저 밟으면 그걸로 끝이다.
  const unclaimed = unclaimedBaseGoal(unit);
  if (unclaimed) return unclaimed;

  const assignment = enemyPlan.get(unit.id);
  if (assignment) {
    // 예비는 결판이 나는 곳에 끌려들어가지 않는다. 집결지에 모여 있는 것이 임무다.
    // 단 하나, 초소가 밟혔을 때만은 예외다 — 그 순간이 예비를 아껴 둔 이유다.
    if (assignment.role === "reserve") return enemyBreach(unit) ?? assignment.axis;
    // 우회로 입구에 닿았으면 이제 목표로 꺾는다. 그러지 않으면 조공이 측면에
    // 도착해서 그대로 눌러앉는다 — 우회는 도는 것이지 비켜서는 것이 아니다.
    const lane = assignment.axis;
    // 입구에 닿았거나, 돌아가는 것이 무의미할 만큼 목표에 가까워졌으면 꺾는다.
    // 앞의 조건만 두면 입구 칸이 지형에 막혔을 때 부대가 그 앞에서 멈춰 선다.
    const turned = lane.target && (distance(unit, lane) <= 1 || distance(unit, lane.target) <= distance(lane, lane.target));
    const axis = turned ? lane.target : lane;
    // 축선 반경 안에 상대가 들어와 있으면 축선 자체보다 그 상대가 급하다.
    // 방어 초소를 밟고 서서 옆칸의 적을 구경하는 일을 막는 규칙이다.
    return nearestIntruder(unit, axis) ?? axis;
  }

  const posture = enemyPosture();

  if (posture === "hunt") {
    const prey = enemyPreyUnits();
    if (prey.length) return nearestOf(unit, prey);
    // 사냥감을 놓쳤으면 마지막 흔적으로 간다. 여기서 포기하면 아래의 nearestEnemy로
    // 떨어져 아무나 쫓게 되고, 사냥 미션이 그냥 난전이 된다.
    const tracks = huntTracks();
    if (tracks.length) return nearestOf(unit, tracks);
  }

  if (posture === "attack") {
    const seat = assaultSeatFor(unit);
    if (seat) return seat;
  }

  if (posture === "defend") {
    const post = defensePostFor(unit);
    if (post) return nearestIntruder(unit, post) ?? post;
  }

  return nearestEnemy(unit, "player") ?? null;
}

// 사거리 안의 표적 중 가장 값진 것을 고른다. 예전에는 "가장 가까운 적"이라
// 반쯤 죽은 전차를 두고 멀쩡한 보병을 쳤다.
function bestEnemyStrike(unit) {
  const prey = enemyPreyUnits();
  let best = null;
  visibleFoes(unit.owner).forEach((foe) => {
    if (attackIsSuicidal(unit, foe)) return;
    const forecast = attackForecast(unit, foe);
    if (!forecast) return;
    let score = forecast.damage - forecast.counter;
    if (forecast.kills) score += 8;
    if (prey.includes(foe)) score += 12; // 미션이 지목한 사냥감
    if (foe.type === "battalionHQ") score += 6; // 보급의 중심
    if (foe.type === "engineer") score += 3; // 경제를 짓는 손
    if (!best || score > best.score) best = { foe, score };
  });
  return best?.foe ?? null;
}

// 예전 AI는 거점 습격을 늘 먼저 봐서, 눈앞의 부대에게 맞고만 있었다.
// 죽일 수 있거나 어차피 상대 사거리 안이면 부대를 먼저 친다. 그게 아니면
// 경제를 때리는 습격이 남는 장사다.
function strikeBeatsRaid(unit, foe) {
  if (!foe) return false;
  if (combatDamage(unit, foe) >= foe.hp) return true;
  return canAttack(foe, unit);
}

function tryEnemyStrike(unit) {
  if (unit.acted) return false;
  const foe = bestEnemyStrike(unit);
  const raid = bestRaidTarget(unit, "player");
  if (foe && (!raid || strikeBeatsRaid(unit, foe))) {
    attack(unit, foe);
    return true;
  }
  if (raid) {
    raidBase(unit, raid);
    return true;
  }
  const deck = bestDeckTarget(unit);
  if (deck) {
    bombardDeck(unit, deck);
    return true;
  }
  return false;
}

// 다리 끊기는 칠 것도 습격할 것도 없을 때만 한다 — 눈앞의 적을 두고 다리를
// 때리는 것은 언제나 손해다. 그리고 적군이 노리는 것은 플레이어가 놓은 부교뿐이다.
// 마을 교량은 적군도 건너야 하는 길이라, 자기가 쓸 다리를 끊게 두면 AI가 스스로
// 진격로를 막고 판이 멈춰 선다.
//
// 이 규칙이 없으면 다리 끊기는 플레이어 전용 기술이 된다. 강 하나 사이에 두고
// 다리를 끊어 버리면 적은 영영 건너오지 못하는데, 적은 내 부교를 못 건드린다.
function bestDeckTarget(unit) {
  if (unit.acted) return null;
  return state.improvements.find(
    (item) => item.type === "bridge" && item.owner === "player" && canBombardDeck(unit, item) && !getTargetUnitAt(item.x, item.y, "player"),
  ) ?? null;
}

// 전투 부대의 한 턴. 어디로 갈지는 임무가, 어떻게 갈지는 병종이,
// 무엇을 칠지는 표적 점수가 정한다.
function enemyFieldTurn(unit) {
  // 무방비 거점이 발밑에 열려 있으면 그것이 이 턴의 최선이다. 사격보다 먼저 본다.
  if (tryEnemyCapture(unit)) return;
  if (tryEnemyStrike(unit)) return;

  const goal = enemyGoalFor(unit);
  if (!goal) return;

  // 포병은 전선을 향해 걷는 게 아니라 사격 진지를 고른다.
  if (isArtilleryUnit(unit)) {
    if (enemyTowDecision(unit, goal)) return;
    const post = bestFiringPost(unit, goal);
    if (post && (post.x !== unit.x || post.y !== unit.y)) moveEnemyUnit(unit, post);
    tryEnemyStrike(unit);
    return;
  }

  const step = unit.type === "armor" ? enemyArmorStep(unit, goal) : bestReachableStepToward(unit, goal);
  if (step) moveEnemyUnit(unit, step);
  tryEnemyStrike(unit);
}

function moveEnemyUnit(unit, step) {
  // 접적 정지는 양쪽에 똑같이 걸린다. 적만 안개를 뚫고 목적지까지 내리 달리면
  // 매복은 플레이어에게만 걸리는 함정이 되고, 그건 규칙이 아니라 편애다.
  const halt = ambushHalt(unit, step.x, step.y);
  const stopAt = halt && !halt.atGoal ? halt : step;
  recordUnitMove(unit, stopAt.x, stopAt.y);
  unit.x = stopAt.x;
  unit.y = stopAt.y;
  unit.moved = true;
  // 야포는 이동한 턴에 쏘지 못한다(canAttack). 행동까지 닫아 두지 않으면
  // 이동 후 사격을 다시 시도하며 매 턴 헛수고를 한다.
  if (unit.type === "artillery") unit.acted = true;
  addLog(`${sideUnitLabel(unit)} › ${postureVerb(unit)}`);
}

// 적 공병대는 싸우러 가지 않는다. 무엇을 지을지는 미션이 정한다.
//   1) 개통 목표가 강 건너라 아예 안 닿는다  → 다리를 놓는다
//   2) 닿지만 보급선이 너무 길다             → 목표 쪽으로 창고, 안 되면 철도
//   3) 그런 목표가 없다                      → 예전대로 후방 창고로 생산을 키운다
// 예전에는 3번만 있었다. 그래서 적은 강가에서 창고만 짓고 작전을 시작하지 못했다.
function enemyEngineerTurn(engineer) {
  // 공사 중인 공병대는 현장을 지킨다(움직이면 공사가 취소된다).
  if (activeConstructionForBuilder(engineer)) return;

  const crossing = enemyBridgeSite(engineer);
  const focus = enemyOpenSupplyObjective();

  // 나루가 정해진 공병대는 그 일만 한다. 여기서 창고를 먼저 보면, 서 있는 자리가
  // 마침 안전하다는 이유로 삽을 뜨고 — 3일 뒤 다시 같은 자리에서 또 삽을 뜬다.
  // 실제로 그랬다: 적 공병대는 강가에 창고를 두 채 세우고 강은 끝내 건너지 않았다.
  // 강을 못 건너면 창고를 아무리 지어도 작전은 시작되지 않는다.
  if (crossing && isEnemyBridgeBuilder(engineer, crossing)) {
    if (tryStartEnemyBridge(engineer, crossing)) return;
    const approach = bestReachableStepToward(engineer, crossing.stand);
    if (approach) {
      recordUnitMove(engineer, approach.x, approach.y);
      engineer.x = approach.x;
      engineer.y = approach.y;
      engineer.moved = true;
    }
    // 도착했으면 그 턴에 바로 놓는다. 물가는 오래 서 있을 자리가 아니다.
    tryStartEnemyBridge(engineer, enemyBridgeSite(engineer));
    return;
  }

  // 창고가 철도보다 먼저다. 창고 하나는 보급망의 출발점을 통째로 앞으로 옮기지만,
  // 철도는 지나는 칸 하나의 값만 깎는다. 그래서 창고 자리가 없을 때만 철도를 본다.
  const depot = bestEnemyDepotSite(engineer, focus);
  const rail = depot ? null : bestEnemyRailSite(engineer, focus);
  if (tryStartEnemyRail(engineer, rail)) return;
  if (tryStartEnemyDepot(engineer, focus)) return;

  const goal = rail ?? depot ?? nearestOwnedBase(engineer);
  if (!goal) return;

  const step = bestReachableStepToward(engineer, goal);
  if (!step) return;
  recordUnitMove(engineer, step.x, step.y);
  engineer.x = step.x;
  engineer.y = step.y;
  engineer.moved = true;
  // 도착했으면 그 턴에 바로 삽을 뜬다. 한 턴을 통째로 버리면 목표를 채우지 못한다.
  if (tryStartEnemyRail(engineer, rail)) return;
  tryStartEnemyDepot(engineer, focus);
}

// 다리는 하나면 된다. 공병대가 여럿일 때 전원이 나루로 몰려가면 경제가 멈춘다.
// 나루에 가장 가까운 한 기만 보내고, 나머지는 하던 대로 창고를 짓는다.
function isEnemyBridgeBuilder(engineer, site) {
  const engineers = state.units.filter((unit) => unit.owner === "enemy" && unit.type === "engineer");
  if (engineers.length <= 1) return true;
  // 공사 중인 공병대는 부를 수 없다. 전원이 공사 중이면 그때는 순위를 그대로 쓴다.
  const free = engineers.filter((unit) => !activeConstructionForBuilder(unit));
  const pool = free.length ? free : engineers;
  const first = pool
    .slice()
    .sort((a, b) => distance(a, site.stand) - distance(b, site.stand) || String(a.id).localeCompare(String(b.id)))[0];
  return first?.id === engineer.id;
}

// 아직 채우지 못한 적의 개통 목표. 공병대의 임무는 이 칸까지 선을 잇는 것이다.
function enemyOpenSupplyObjective() {
  return objectiveTiles("enemy").find(
    (objective) => objective.kind === "supply" && objective.held < objectiveHoldRequirement(objective),
  );
}

// 이번 작전에서 적이 끝내 닿아야 하는 칸. 다리를 놓을 값어치가 있는지는
// 이 칸에 걸어서 갈 수 있는가로만 판단한다.
function enemyCrossingGoal() {
  const tiles = objectiveTiles("enemy");
  if (tiles.length) return tiles[0];
  const prey = enemyPreyUnits();
  if (prey.length) return { x: prey[0].x, y: prey[0].y };
  const base = state.bases.find((candidate) => candidate.owner === "player");
  return base ? { x: base.x, y: base.y } : null;
}

// 다리는 "지금 걸어서 못 가는 곳"에만 값어치가 있다. 이 판단이 없으면 적 공병대는
// 강가마다 다리를 놓다가 보급품을 다 쓴다. 후보는 이쪽 기슭에서 발로 닿는 물칸뿐이다 —
// 강 건너의 더 좋은 자리는 거기까지 갈 수가 없으니 자리가 아니다.
function enemyBridgeSite(engineer) {
  // 다리는 공격 수단이다. 수비 중에 강에 다리를 놓으면 그 다리로 건너오는 것은
  // 상대다 — 자기 방벽에 스스로 문을 뚫는 셈이다. 실제로 수비 자세의 적이
  // 플레이어 거점 쪽으로 다리를 놓아 도하로를 거저 내줬다.
  if (enemyPosture() === "defend") return null;
  if (state.enemyResources < (constructionCosts.bridge ?? 0)) return null;
  const goal = enemyCrossingGoal();
  if (!goal || routeConnected(engineer, goal)) return null;

  const reach = routeReach(engineer);
  let best = null;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!canPlaceBridge(engineer.owner, x, y)) continue;
      // 설 수 없는 물가는 나루가 아니다. 이미 아군이 올라선 칸을 목표로 잡으면
      // 공병대는 그 뒤에서 평생 기다린다 — 그러느니 다른 나루를 찾는 게 낫다.
      const stand = neighbors(x, y)
        .filter((spot) => reach.has(posKey(spot.x, spot.y)))
        .filter(
          (spot) =>
            (spot.x === engineer.x && spot.y === engineer.y) ||
            canOccupy(engineer, spot.x, spot.y),
        )
        .sort((a, b) => reach.get(posKey(a.x, a.y)) - reach.get(posKey(b.x, b.y)))[0];
      if (!stand) continue;
      // 가까운 나루를 먼저 보되, 목표에서 한참 벗어난 나루로 돌아가지는 않는다.
      const score = reach.get(posKey(stand.x, stand.y)) + distance({ x, y }, goal) * 1.5;
      if (!best || score < best.score) best = { x, y, stand, score };
    }
  }
  return best;
}

// 다리는 플레이어와 똑같이 하루 만에 걸린다(engineerBuild). 양쪽이 다른 규칙으로
// 강을 건너면 그건 더 이상 같은 게임이 아니다.
function tryStartEnemyBridge(engineer, site) {
  if (!site || engineer.acted) return false;
  if (!neighbors(engineer.x, engineer.y).some((spot) => spot.x === site.x && spot.y === site.y)) return false;
  // 자리는 지난 판단에서 골랐다. 그 사이에 다른 공병대가 옆에 다리를 놓았을 수 있으니
  // 놓기 직전에 규칙을 한 번 더 본다 — 플레이어가 못 하는 것을 적이 하면 안 된다.
  if (!canPlaceBridge(engineer.owner, site.x, site.y)) return false;
  const cost = constructionCosts.bridge ?? 0;
  if (state.enemyResources < cost) return false;

  state.enemyResources -= cost;
  state.improvements.push(newDeck("bridge", engineer.owner, site.x, site.y));
  engineer.acted = true;
  // 지형이 바뀌었으니 어제 그린 길은 이제 거짓말이다.
  clearRouteFields();
  addLog(t("{side} 공병대 › ({x},{y}) 임시 교량 완성", { side: sideName("enemy"), x: site.x, y: site.y }));
  return true;
}

// 철도는 통행 비용을 0.35배로 깎는다. 보급선이 지나는 칸에 깔아야 값어치가 있고,
// 비싼 칸(숲)일수록 깎이는 값이 크다. 선이 이미 짧으면 깔 이유가 없다.
function bestEnemyRailSite(engineer, focus) {
  if (!focus) return null;
  if (state.enemyResources < (constructionCosts.rail ?? 0)) return null;
  const route = supplyRouteTo("enemy", focus.x, focus.y);
  if (!Number.isFinite(route.cost)) return null;
  if (route.cost <= effectiveSupplyRange({ owner: "enemy" })) return null;

  let best = null;
  route.path.forEach((tile) => {
    if (!canBuildHere(tile.x, tile.y, "rail")) return;
    if (!Number.isFinite(traversalCostForUnit(engineer, tile.x, tile.y))) return;
    // 공사 중에는 도망칠 수 없다. 창고와 같은 자를 쓴다 — 철도도 임무 공사다.
    if (!isSafeDepotSite("enemy", tile.x, tile.y, true)) return;
    const saving = movementCostForTile(tile.x, tile.y) * 0.65;
    const score = saving * 10 - distance(engineer, tile) * 1.5;
    if (!best || score > best.score) best = { x: tile.x, y: tile.y, score };
  });
  return best;
}

function tryStartEnemyRail(engineer, site) {
  if (!site || engineer.acted) return false;
  if (engineer.x !== site.x || engineer.y !== site.y) return false;
  const cost = constructionCosts.rail ?? 0;
  if (state.enemyResources < cost) return false;
  if (!canBuildHere(site.x, site.y, "rail")) return false;

  state.enemyResources -= cost;
  state.constructions.push({
    type: "rail",
    owner: engineer.owner,
    builderId: engineer.id,
    x: site.x,
    y: site.y,
    remaining: constructionDuration("rail"),
  });
  engineer.acted = true;
  addLog(t("{side} 공병대 › ({x},{y}) 철도 부설 착공", { side: sideName("enemy"), x: site.x, y: site.y }));
  return true;
}

function tryStartEnemyDepot(engineer, focus) {
  if (engineer.acted) return false;
  if (enemyDepotCount() >= enemyDepotTarget()) return false;
  if (!canBuildHere(engineer.x, engineer.y, "depot")) return false;
  const cost = constructionCosts.depot ?? 0;
  if (state.enemyResources < cost) return false;
  // 안전한 자리가 아니면 삽을 뜨지 않는다. 공사 중에는 도망칠 수 없어서,
  // 전선 근처 창고는 짓는 순간 공병대와 공사비를 함께 헌납하는 짓이다.
  if (!isSafeDepotSite(engineer.owner, engineer.x, engineer.y, Boolean(focus))) return false;

  state.enemyResources -= cost;
  state.constructions.push({
    type: "depot",
    owner: engineer.owner,
    builderId: engineer.id,
    x: engineer.x,
    y: engineer.y,
    remaining: constructionDuration("depot"),
  });
  engineer.acted = true;
  addLog(t("{side} 공병대 › ({x},{y}) 보급창고 착공", { side: sideName("enemy"), x: engineer.x, y: engineer.y }));
  return true;
}

// 보급창고는 반드시 안전한 곳에 짓는다. 점수로 "웬만하면 안전한 쪽"을 고르는 게
// 아니라, 안전하지 않은 자리는 아예 후보에서 뺀다 — 공사는 3일이 걸리고 그동안
// 공병대는 못 움직이므로, 전선 근처 창고는 지어지기 전에 반드시 털린다.
// 조건은 셋이다: 적에게서 충분히 멀 것, 내 거점보다 적이 가깝지 않을 것,
// 내 보급망이 이미 닿는 곳일 것(내 뒷마당이라는 뜻).
// forward는 "임무 창고"라는 뜻이다. 개통 목표의 창고는 앞으로 나가야만 값어치가
// 있는데, 앞으로 나갈수록 내 거점은 멀어지므로 "적보다 내 거점이 가까울 것"이라는
// 후방 조건은 영영 만족되지 않는다. 그 조건을 그대로 두면 적 AI는 자기 승리 조건을
// 구조적으로 채울 수 없다. 그래서 임무 창고에서는 후방 조건만 뺀다 —
// 진짜 안전 조건(적과의 최소 거리, 내 보급망이 이미 닿을 것)은 그대로다.
// 즉 적은 여전히 교두보를 굳혀 적을 네 칸 밖으로 밀어낸 뒤에야 삽을 뜰 수 있다.
function isSafeDepotSite(owner, x, y, forward = false) {
  const threat = nearestOpposingDistance(owner, x, y);
  if (threat < depotSafeDistance) return false;
  const ownBase = nearestOwnedBaseDistance(owner, x, y);
  if (!Number.isFinite(ownBase)) return false;
  if (!forward && threat <= ownBase) return false;
  return Number.isFinite(supplyLineCost({ owner, x, y }));
}

function bestEnemyDepotSite(engineer, focus) {
  if (enemyDepotCount() >= enemyDepotTarget()) return null;
  let best = null;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!canBuildHere(x, y, "depot")) continue;
      if (!Number.isFinite(traversalCostForUnit(engineer, x, y))) continue;
      if (!isSafeDepotSite(engineer.owner, x, y, Boolean(focus))) continue;
      const score = enemyDepotSiteScore(engineer, x, y, focus);
      if (!Number.isFinite(score)) continue;
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best;
}

// 안전한 자리들 중에서 고르는 기준: 내 거점에서 두 칸쯤 떨어져 있고
// (붙여 지으면 보급망이 안 넓어진다), 적에게서 멀고, 지금 걸어갈 만한 곳.
// 개통 임무가 걸려 있으면 자가 바뀐다 — 창고가 곧 보급망의 새 출발점이므로,
// 목표까지 남는 이동 비용이 짧은 자리가 곧 짧은 보급선이다. 안전 조건은 그대로다:
// 전선 코앞의 창고는 지어지기 전에 털린다는 사실이 임무가 있다고 달라지지 않는다.
// 그래서 적은 다리를 건너 교두보를 굳힌 뒤에야 그쪽에 창고를 세울 수 있다.
function enemyDepotSiteScore(engineer, x, y, focus) {
  const ownBase = nearestOwnedBaseDistance(engineer.owner, x, y);
  if (!Number.isFinite(ownBase)) return -Infinity;
  const threat = nearestOpposingDistance(engineer.owner, x, y);
  if (focus) {
    let score = -routeCostFrom(engineer, focus, x, y) * 6;
    score += Math.min(threat, 8) * 2;
    score -= distance(engineer, { x, y }) * 1.5;
    return score;
  }
  let score = 0;
  score += Math.min(threat, 8) * 3;
  score -= Math.abs(ownBase - 2) * 4;
  score -= distance(engineer, { x, y }) * 1.5;
  return score;
}

// 이동력 안에 설 수 있는 칸을 한 번의 탐색으로 모두 구한다. 칸마다 canMoveTo를
// 부르면 판 하나에 다익스트라를 수백 번 돌리게 되어 적 턴이 눈에 띄게 느려진다.
// 판정 기준은 canMoveTo와 같다 — 설 수 있고, 비용이 이동력 안인 칸.
function reachableTiles(unit) {
  if (unit.acted || unit.moved || activeConstructionForBuilder(unit)) return [];
  const budget = effectiveMove(unit);
  const best = new Map([[posKey(unit.x, unit.y), { x: unit.x, y: unit.y, cost: 0 }]]);
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost > (best.get(posKey(current.x, current.y))?.cost ?? Infinity)) continue;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = traversalCostForUnit(unit, next.x, next.y);
      if (!canEnterTerrain(unit, next.x, next.y) || !Number.isFinite(tileCost)) return;
      // 적 부대가 선 칸은 통과할 수 없다(movementCost와 같은 규칙).
      if (getUnitsAt(next.x, next.y).some((other) => other.owner !== unit.owner)) return;
      const cost = current.cost + tileCost;
      if (cost > budget) return;
      const key = posKey(next.x, next.y);
      if (cost < (best.get(key)?.cost ?? Infinity)) {
        best.set(key, { x: next.x, y: next.y, cost });
        queue.push({ x: next.x, y: next.y, cost });
      }
    });
  }

  // 지나갈 수는 있어도 설 수는 없는 칸이 있다(아군이 꽉 찬 칸 등).
  return [...best.values()].filter((tile) => (tile.x !== unit.x || tile.y !== unit.y) && canOccupy(unit, tile.x, tile.y));
}

// 한 칸씩 걷지 않고 이동력만큼 간다. 전차 이동력이 3인데 한 칸씩 기어가면
// 기한 있는 작전에서 적은 도착하지도 못하고 얻어맞기만 한다.
function bestReachableStepToward(unit, target) {
  // 길이 있는 목표라면 이동 비용으로 간다. 직선거리는 강 건너의 목표를 코앞으로
  // 보여주지만, 부대는 그 강을 못 건넌다.
  const routed = routeStepToward(unit, target);
  if (routed) return routed;

  const here = distance(unit, target);
  let best = null;
  reachableTiles(unit).forEach((tile) => {
    // 가까워지되 엄폐가 나은 칸을 고른다. 개활지로 뛰어드는 돌격은 반격에 녹는다.
    const score = distance(tile, target) - coverAt(tile.x, tile.y) * 0.2;
    if (!best || score < best.score) best = { x: tile.x, y: tile.y, score };
  });
  if (!best) return null;
  return distance(best, target) < here ? best : null;
}

// ── 경로 ────────────────────────────────────────────────────────────────────
// 예전에는 "직선거리가 줄어드는 칸"만 골랐다. 그래서 앞이 숲이나 강으로 막히면
// 옆으로 한 칸 돌아가는 길을 후퇴로 판정해 거부했고, 부대는 장애물 앞에 서서
// 작전이 끝날 때까지 기다렸다. 사령부가 8턴 동안 한 칸을 움직인 것도 이 때문이다.
// 우회는 후퇴가 아니다. 그래서 기준을 거리에서 "목표까지 남은 이동 비용"으로 바꾼다.
// 이 지도 위에서는 막다른 골짜기가 생기지 않는다 — 길이 있는 한 반드시 내려가는
// 이웃 칸이 있고, 없다면 그건 애초에 갈 수 없는 목표다.
let routeFieldCache = new Map();

// 지형이 바뀌면(다리·철도 완공) 어제 그린 길은 거짓말이 된다.
function clearRouteFields() {
  routeFieldCache = new Map();
}

// 목표에서 거꾸로 퍼뜨린 이동 비용 지도. 부대 위치는 넣지 않는다 — 부대는 매 턴
// 움직여서 지도를 다시 그려야 하고, 실제로 막힌 칸은 reachableTiles가 이미 걸러
// 준다. 여기서 알고 싶은 건 "이 방향이 뚫려 있는가"이지 "지금 비어 있는가"가 아니다.
function routeField(unit, target) {
  const key = `${unit.type}:${target.x},${target.y}`;
  const cached = routeFieldCache.get(key);
  if (cached) return cached;

  const field = new Map();
  if (!inBounds(target.x, target.y)) return field;
  field.set(posKey(target.x, target.y), 0);
  const queue = [{ x: target.x, y: target.y, cost: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost > (field.get(posKey(current.x, current.y)) ?? Infinity)) continue;
    neighbors(current.x, current.y).forEach((next) => {
      // 목표 칸 자체는 통과 불가 지형일 수 있다(사령부가 강 건너를 노릴 때 등).
      // 그래도 "그 칸에 들어가는 비용"은 이웃에서 재야 하므로 현재 칸이 아니라
      // 다음 칸의 비용을 더한다.
      const stepCost = traversalCostForUnit(unit, current.x, current.y);
      if (!canEnterTerrain(unit, next.x, next.y) || !Number.isFinite(traversalCostForUnit(unit, next.x, next.y))) return;
      if (!Number.isFinite(stepCost) && (current.x !== target.x || current.y !== target.y)) return;
      const cost = current.cost + (Number.isFinite(stepCost) ? stepCost : 0);
      const at = posKey(next.x, next.y);
      if (cost < (field.get(at) ?? Infinity)) {
        field.set(at, cost);
        queue.push({ x: next.x, y: next.y, cost });
      }
    });
  }

  routeFieldCache.set(key, field);
  return field;
}

// 어떤 칸에서 목표까지 남은 이동 비용. 길이 없으면 직선거리로 답한다 —
// 거친 대답이 대답 없는 것보다 낫다.
function routeCostFrom(unit, target, x, y) {
  const value = routeField(unit, target).get(posKey(x, y));
  return value === undefined ? distance({ x, y }, target) : value;
}

// 걸어서 닿는가. routeCostFrom은 길이 없을 때 직선거리로 둘러대므로 "연결되어
// 있는가"를 물을 때는 쓸 수 없다. 다리를 놓을지 말지가 이 답 하나로 갈린다.
function routeConnected(unit, target) {
  return routeField(unit, target).get(posKey(unit.x, unit.y)) !== undefined;
}

// 이 부대가 지금 발로 갈 수 있는 칸 전부(비용표). 강 이쪽 기슭이 어디까지인지를
// 한 번의 탐색으로 알려준다.
function routeReach(unit) {
  return routeField(unit, { x: unit.x, y: unit.y });
}

function routeStepToward(unit, target) {
  const field = routeField(unit, target);
  const here = field.get(posKey(unit.x, unit.y));
  // 길이 아예 없으면 이 규칙은 할 말이 없다. 그때는 부르는 쪽이 직선거리로 되돌아간다.
  if (here === undefined) return null;

  let best = null;
  reachableTiles(unit).forEach((tile) => {
    const remain = field.get(posKey(tile.x, tile.y));
    if (remain === undefined) return;
    // 남은 길이 짧은 칸이 우선, 같으면 엄폐가 나은 칸. 개활지로 뛰어드는 돌격은
    // 반격에 녹는다는 원칙은 그대로 둔다.
    const score = remain - coverAt(tile.x, tile.y) * 0.2;
    if (!best || score < best.score) best = { x: tile.x, y: tile.y, score, remain };
  });
  if (!best) return null;
  return best.remain < here ? best : null;
}

function nearestOwnedBase(unit) {
  return state.bases
    .filter((base) => base.owner === unit.owner)
    .sort((a, b) => distance(unit, a) - distance(unit, b))[0] ?? null;
}

// 이 자리에서 가장 가까운 "아는" 적까지의 거리. 안개가 켜지면 모르는 적은 위협으로
// 세지 않는다 — 그게 기습이 성립하는 이유다. 붙어 있는 적(거리 1)은 어떤 병종이라도
// 시야 안이므로, 이 함수에 기대는 재정비·점령 규칙은 예전 그대로 움직인다.
function nearestOpposingDistance(owner, x, y) {
  const foes = visibleFoes(owner);
  if (!foes.length) return 99;
  return Math.min(...foes.map((unit) => distance({ x, y }, unit)));
}

function enemyHQTurn(hq) {
  const step = bestSafeHQStep(hq);
  if (step && (step.x !== hq.x || step.y !== hq.y)) {
    const station = hqStation(hq);
    const closing = distance(step, station) < distance(hq, station);
    recordUnitMove(hq, step.x, step.y);
    hq.x = step.x;
    hq.y = step.y;
    hq.moved = true;
    addLog(
      closing
        ? `${sideName("enemy")} 대대사령부 › 주력 따라 전진 · 보급 범위 이동`
        : `${sideName("enemy")} 대대사령부 › 호위 뒤로 위치 조정`,
    );
  }

  const target = nearestEnemy(hq, "player");
  // 사령부는 공격 1 / 체력 9라 반격 한 방에 죽는 경우가 흔하다. 보급의 중심이
  // 화풀이 공격으로 사라지면 진영 전체가 무너지므로, 자살 공격은 특히 막아야 한다.
  if (target && canAttack(hq, target) && hqGuardCount(hq, hq.x, hq.y) > 0 && !attackIsSuicidal(hq, target)) {
    attack(hq, target);
  }
}

function bestSafeHQStep(hq) {
  const candidates = [hq, ...neighbors(hq.x, hq.y).filter((spot) => canMoveTo(hq, spot.x, spot.y))];
  const scored = candidates
    .map((spot) => ({ ...spot, score: hqSafetyScore(hq, spot.x, spot.y) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;
  const currentScore = hqSafetyScore(hq, hq.x, hq.y);
  // 제자리에 붙는 값. 집결지는 주력의 무게중심이라 아군이 한 칸만 움직여도 같이
  // 흔들리는데, 문턱이 0.25면 사령부는 그 미세한 떨림을 매 턴 쫓아 한 칸씩 오간다.
  // 그게 "여기저기 방황"의 절반이다.
  // 반 걸음(한 걸음 값 1.5의 절반)으로 잡는다. 부대 다섯이면 하나가 한 칸 움직여도
  // 무게중심은 0.2칸만 밀리므로 그 떨림은 여기서 걸러지고, 진짜로 한 걸음 뒤처지면
  // 이득이 1.5라 문턱을 넘어 따라붙는다. 문턱을 한 걸음 값에 딱 맞추면 안 된다 —
  // 이득과 문턱이 같아져서 사령부가 영원히 전진하지 않는다.
  return best.score > currentScore + 0.75 ? best : null;
}

// 사령부가 서 있어야 할 자리. 우산은 비를 따라가야 우산이다 — 보급의 중심이
// 후방 거점에 눌러앉으면 전군이 제 발로 보급 밖으로 걸어 나간다. 그래서 자리의
// 기준은 "내 거점에서 얼마나 가까운가"가 아니라 "주력에서 얼마나 뒤인가"다.
function hqStation(hq) {
  const flock = state.units.filter((unit) => unit.owner === hq.owner && unit.id !== hq.id && isAssaultUnit(unit));
  const rear = nearestOwnedBase(hq);
  if (!flock.length) return rear ?? { x: hq.x, y: hq.y };
  const cx = flock.reduce((sum, unit) => sum + unit.x, 0) / flock.length;
  const cy = flock.reduce((sum, unit) => sum + unit.y, 0) / flock.length;
  if (!rear || hqTrailDistance <= 0) return { x: clampToBoard(Math.round(cx), width), y: clampToBoard(Math.round(cy), height) };
  // 무게중심에서 아군 거점 쪽으로 추종 거리만큼 물러난 지점. 뒤가 어디인지는
  // 나침반이 아니라 내 보급 거점이 정한다.
  const dx = rear.x - cx;
  const dy = rear.y - cy;
  const length = Math.hypot(dx, dy);
  if (length < 1) return { x: clampToBoard(Math.round(cx), width), y: clampToBoard(Math.round(cy), height) };
  return {
    x: clampToBoard(Math.round(cx + (dx / length) * hqTrailDistance), width),
    y: clampToBoard(Math.round(cy + (dy / length) * hqTrailDistance), height),
  };
}

// 궁지에 몰린 사령부가 향할 곳. 평소의 집결지는 "주력 뒤"지만 그건 안전할 때 우산을
// 펴는 자리다. 쫓기는 중에 필요한 건 참호이고, 이 판에서 참호는 보급 거점이다 —
// 방어 3짜리 사령부가 거점에 들어앉으면 거점 버프가 얹혀 6이 되어 정면으로는
// 좀처럼 뚫리지 않는다. 이동 1로 이동 3짜리 추격을 뿌리치는 건 불가능하니
// 사령부의 살길은 뛰는 것이 아니라 들어앉는 것이다.
// 적이 이미 올라앉았거나 붙어 있는 거점은 참호가 아니라 함정이라 뺀다.
function hqRefuge(hq) {
  const shelters = state.bases.filter(
    (base) => base.owner === hq.owner && nearestOpposingDistance(hq.owner, base.x, base.y) > 1,
  );
  if (!shelters.length) return null;
  return shelters
    .slice()
    .sort((a, b) => routeCostFrom(hq, a, hq.x, hq.y) - routeCostFrom(hq, b, hq.x, hq.y))[0];
}

function hqSafetyScore(hq, x, y) {
  const enemyDistances = visibleFoes(hq.owner).map((unit) => distance({ x, y }, unit));
  const nearestThreat = enemyDistances.length ? Math.min(...enemyDistances) : 99;
  // 지금 쫓기고 있는가. 기준은 사령부가 선 자리이지 후보 칸이 아니다 — 후보마다
  // 따로 판정하면 위험한 칸만 "위기"로 읽혀 도망 규칙과 자리 규칙이 뒤섞이고,
  // 사령부는 두 자를 번갈아 대며 제자리에서 왔다 갔다 한다. 그게 그 방황의 정체다.
  const cornered = hqPanicRange > 0 && nearestOpposingDistance(hq.owner, hq.x, hq.y) <= hqPanicRange;
  const guards = hqGuardCount(hq, x, y);
  const commandCoverage = state.units.filter((unit) =>
    unit.owner === hq.owner &&
    unit.id !== hq.id &&
    distance({ x, y }, unit) <= unitTypes.battalionHQ.commandRange
  ).length;
  const supplyCoverage = state.units.filter((unit) =>
    unit.owner === hq.owner &&
    unit.id !== hq.id &&
    distance({ x, y }, unit) <= effectiveHQSupplyRange(hq)
  ).length;
  // 쫓기는 중이면 목적지를 갈아탄다. 계속 "주력 뒤"를 향하면 사령부는 추격자와
  // 집결지 사이에 끼여 한 칸씩 오가다 잡힌다 — 주력이 앞으로 나가는 중이면
  // 그 집결지는 대개 추격자 쪽에 있다.
  const station = (cornered ? hqRefuge(hq) : null) ?? hqStation(hq);

  let score = 0;
  score += Math.min(nearestThreat, 5) * 4;
  // 거점은 사령부의 방공호다 — 단, 쫓길 때만. 이 항이 없어서 AI는 거점을 그냥
  // 개활지로 읽었고, 발밑의 참호를 두고 들판으로 걸어 나갔다.
  // 평시 가중치가 0인 것은 실수가 아니다. 안전할 때도 엄폐를 세면 사령부는 거점 위에
  // 눌러앉아 버린다 — 엄폐 3에 1.5만 곱해도 4.5라, 주력을 따라 한 걸음 나가는 이득
  // 1.5를 언제나 이긴다. 그러면 "우산은 비를 따라가야 우산이다"가 다시 깨지고
  // 야전 부대가 제 발로 보급 밖으로 걸어 나간다. 참호는 비 올 때만 참호다.
  score += coverAt(x, y) * (cornered ? 4 : 0);
  score += guards * 8;
  score += commandCoverage * 3;
  score += supplyCoverage;
  // 예전에는 여기서 자기 거점까지의 거리를 뺐다. 그래서 사령부는 전선이 15칸을
  // 나아가는 동안 한 칸을 움직였고, 야전 부대가 전부 「보급 압박」으로 끝났다.
  // 이제 기준은 주력 뒤의 자리다. 다만 보급망을 벗어난 칸은 여전히 금물 —
  // 사령부 자신이 보급을 못 받으면 우산이 아니라 짐이다.
  // 거리가 아니라 남은 이동 비용이다. 직선거리로 재면 숲 하나를 사이에 둔 두 칸이
  // 같은 점수를 받고, 그러면 사령부는 "나아지지 않는다"며 제자리에 눌러앉는다.
  // 비용으로 재면 숲을 돌아가는 칸이 분명히 더 낫고, 사령부는 그리로 걷는다.
  // 가중치를 낮춘 것은 규칙이 바뀌어서가 아니라 자가 바뀌어서다 — 이 판은 상하좌우로만
  // 움직이므로 같은 거리라도 비용은 대각선만큼 더 나온다.
  score -= routeCostFrom(hq, station, x, y) * 1.5;
  if (!Number.isFinite(supplyLineCost({ owner: hq.owner, x, y }))) score -= 20;
  if (nearestThreat <= 1) score -= 60;
  else if (nearestThreat <= 2) score -= 24;
  if (guards === 0) score -= 18;
  return score;
}

function hqGuardCount(hq, x, y) {
  return state.units.filter((unit) =>
    unit.owner === hq.owner &&
    unit.type !== "battalionHQ" &&
    distance({ x, y }, unit) <= 2
  ).length;
}

function nearestOwnedBaseDistance(owner, x, y) {
  const bases = state.bases.filter((base) => base.owner === owner);
  if (!bases.length) return Infinity;
  return Math.min(...bases.map((base) => distance({ x, y }, base)));
}

// 가장 가까운 "아는" 상대. 보이는 것이 없으면 마지막으로 본 자리로 간다.
// 이 되돌림이 없으면 안개가 켜진 순간 적 전군은 갈 곳을 잃고 제자리에 선다 —
// 안개의 값은 적을 눈멀게 하는 데 있는 것이 아니라 수색하게 만드는 데 있다.
function nearestEnemy(unit, owner) {
  const seen = visibleFoes(opponentOwner(owner))
    .filter((target) => target.owner === owner)
    .sort((a, b) => distance(unit, a) - distance(unit, b))[0];
  if (seen) return seen;
  return staleContacts(opponentOwner(owner))
    .filter((memo) => memo.owner === owner)
    .map((memo) => ({ x: memo.x, y: memo.y, label: "수색", key: `수색:${memo.x},${memo.y}` }))
    .sort((a, b) => distance(unit, a) - distance(unit, b))[0];
}

// 진영의 반대편. sideKey(연합군/추축군)가 아니라 owner(player/enemy)를 다룬다 —
// opponentSide와 헷갈리기 쉬워 이름을 따로 둔다.
function opponentOwner(owner) {
  return owner === "player" ? "enemy" : "player";
}

// 증원이 나오는 곳은 대대 사령부다 — 어느 쪽이든 그렇다. 예전에는 적만 보급 거점에서
// 부대를 뽑았고, 그래서 사령부를 지켜야 하는 쪽은 플레이어뿐이었다. 적 사령부는 잡아도
// 예비대가 계속 나왔으니, 사령부를 노리는 것 자체가 플레이어에게만 손해인 규칙이었다.
// 이제 사령부를 잃은 쪽은 양쪽 다 증원이 끊긴다.
function findSpawn(owner, type) {
  // 사령부가 여럿이면 전선에서 먼 쪽에서 뽑는다. 갓 나온 부대가 나오자마자
  // 반격당하지 않게 하는 것이 후방 편성의 뜻이다.
  const hqs = battalionHQs(owner)
    .slice()
    .sort((a, b) => nearestOpposingDistance(owner, b.x, b.y) - nearestOpposingDistance(owner, a.x, a.y));
  for (const hq of hqs) {
    const spot = findHQSpawn(hq, type);
    if (spot) return spot;
  }
  return null;
}

// 증원은 아무도 없는 칸에 나온다. 사령부 지휘 범위 안에서 가장 가까운 빈 칸이다.
//
// 겹치기를 막는 이유: canOccupy는 같은 병종이면 세 겹까지 허락한다. 그 규칙으로
// 증원을 뽑으면 사령부 옆 한 칸에 소총 셋이 쌓이고, 그 한 칸이 길목을 통째로
// 막는 벽이 된다. 뚫는 쪽은 셋을 다 없애야 지나가는데 쌓는 쪽은 한 칸 값만 낸다.
// 겹치기 자체는 남긴다 — 이미 판에 있는 부대가 걸어 들어가 겹치는 것은 이동을 써서
// 하는 판단이다. 아무것도 안 하고 사령부 옆에 쌓아 올리는 쪽만 막는다.
//
// 둘레 네 칸만 보면 안 되는 이유: neighbors는 상하좌우 넷뿐이다. 하르코프 서군
// 전방 사령부는 그 넷 중 셋이 하천·지도 밖이라 빈 칸이 하나밖에 없고, 그 하나는
// 자기 보급 거점이다 — 게임이 매 턴 수리해 주는 칸이라 부대를 세우라고 권하는
// 자리다. 권한 대로 세우면 그 사령부의 증원이 영영 막힌다. 난수가 없으므로
// 그 상태는 저절로 풀리지 않는다. 임팔·싱가포르·마켓가든은 사령부가 하나뿐인데
// 빈 칸이 둘씩이라, 그 둘이 차면 그 진영의 증원이 통째로 멈춘다.
//
// 그래서 한 겹씩 넓혀 나가며 처음 만나는 빈 칸에 세운다. 끝은 사령부 지휘
// 범위다 — 지휘가 닿지 않는 곳에 부대를 내려놓지는 않는다.
//
// 넓힐 때 "지나갈 수 있는 칸인가"를 같이 본다. 도착 칸만 보면 안 되는 이유:
// neighbors는 지도 안이기만 하면 다 돌려주므로 하천 칸을 밟고 그 너머까지
// 퍼진다. 마켓가든은 가로줄 셋이 통째로 하천이고 다리는 x=9 세 곳뿐인데,
// 도착 칸만 보면 증원이 그 다리를 안 쓰고 강 건너에 생겼다 — 시나리오의 전제가
// 통째로 무너진다. 적이 선 칸도 마찬가지다. 걸어서는 못 지나가는 차단선인데
// 증원은 그 너머에 나왔다. 그래서 통과 조건을 이동과 같은 자로 잰다.
// 다리를 놓으면 그 순간부터 다리 너머가 후보가 되는 것도 여기서 같이 따라온다.
//
// 지도가 무엇이든, 지휘 범위를 편집기에서 몇으로 바꾸든 이 규칙으로 같이 움직인다.
// 다만 지휘 범위 0은 예외다. 편집기의 「지휘」 최저 눈금이 0인데, 그대로 쓰면
// 링이 사령부 제 칸 하나뿐이고 그 칸에는 사령부가 서 있어 영원히 빈 칸이 없다 —
// 손잡이 하나를 끝까지 내린 것만으로 양측 증원이 통째로 죽는다. 바닥을 1로 깐다.
function findHQSpawn(hq, type) {
  const probe = { owner: hq.owner, type };
  const reach = Math.max(1, unitTypes.battalionHQ.commandRange ?? 1);
  const seen = new Set([`${hq.x},${hq.y}`]);
  let ring = [hq];
  for (let step = 0; step <= reach; step += 1) {
    const hit = ring.find((spot) => !getUnitsAt(spot.x, spot.y).length && canOccupy(probe, spot.x, spot.y));
    if (hit) return hit;
    const next = [];
    ring.forEach((spot) =>
      neighbors(spot.x, spot.y).forEach((point) => {
        const key = `${point.x},${point.y}`;
        if (seen.has(key)) return;
        seen.add(key);
        // 못 밟는 땅과 적이 선 칸은 여기서 멈춘다. 그 칸 자체도 후보가 아니고,
        // 그 너머로도 안 퍼진다.
        //
        // 재는 자는 도착 판정과 같은 것을 쓴다. 통행비만 보는 자(traversalCostForUnit)는
        // 병종별 금지를 모른다 — 전차와 자주포는 고지에 못 오르는데 그 자는 오를 수
        // 있다고 답한다. 임팔 (8,6) 거점은 사방이 전부 고지라, 그 자로 재면 전차가
        // 그 칸에 배치되고 어느 방향으로도 영영 못 나온다.
        if (!canEnterTerrain(probe, point.x, point.y)) return;
        if (getUnitsAt(point.x, point.y).some((unit) => unit.owner !== hq.owner)) return;
        next.push(point);
      }),
    );
    if (!next.length) return null;
    ring = next;
  }
  return null;
}

function effectiveMorale(unit) {
  const stackSize = getUnitsAt(unit.x, unit.y).filter((other) => other.owner === unit.owner && other.type === unit.type).length;
  const commander = commanderFor(unit.owner);
  const stackPenalty = Math.max(0, stackSize - 1) * Math.max(2, 12 - commander.stackMorale);
  return Math.max(20, 100 + commander.morale + hqMoraleBonus(unit) - stackPenalty - supplyMoralePenalty(unit) - hqOutOfRangeMoraleLoss(unit));
}

function hqMoraleBonus(unit) {
  if (!unit || unit.type === "battalionHQ") return 0;
  return state.units.some((other) =>
    other.owner === unit.owner &&
    other.type === "battalionHQ" &&
    distance(unit, other) <= unitTypes.battalionHQ.commandRange
  )
    ? unitTypes.battalionHQ.moraleAura
    : 0;
}

// 면제 판정을 여기서 따로 하지 않는다. supplyStatus 하나가 유일한 기준이다.
// 예전에는 protectedByFriendlySupplyBase(거점 1칸)로 면제했는데, 표시 함수는 BFS 6칸을
// 정상으로 쳐서 "정상 보급"으로 보이는 부대의 사기가 몰래 빠졌다.
function supplyMoralePenalty(unit) {
  const level = supplyStatus(unit).level;
  if (level === "isolated") return isolatedSupplyMoralePenalty;
  if (level === "cut") return cutSupplyMoralePenalty;
  if (level === "strained") return strainedSupplyMoralePenalty;
  return 0;
}

// 두절 즉시 -25(위 flat)에 더해, 유예가 지나면 턴마다 더 깎인다.
// 사기 → 소모 순서로 무너지게 만드는 장치. 대대 사령부도 예외가 아니다 —
// 보급망에서 끊긴 사령부는 실제로 위험해야 "고립 사령부 구조" 미션이 성립한다.
function hqOutOfRangeMoraleLoss(unit) {
  if (!unit) return 0;
  const exposedTurns = Math.max(0, (unit.hqOutTurns ?? 0) - hqOutOfRangeGraceTurns);
  return exposedTurns * hqOutOfRangeMoralePenalty;
}

function supplyDefensePenalty(unit) {
  const level = supplyStatus(unit).level;
  if (level === "isolated") return 2;
  if (level === "cut") return 2;
  if (level === "strained") return 1;
  return 0;
}

function commanderFor(owner) {
  return state.commanders[owner];
}

function selectedUnit() {
  return state.units.find((unit) => unit.id === state.selectedId);
}

function inspectedUnit() {
  const unit = state.units.find((other) => other.id === state.inspectedId);
  // 봤던 적이 안개로 물러나면 카드도 같이 닫힌다. 안 그러면 화면에서는 사라진 부대의
  // 체력과 좌표가 옆 패널에서 실시간으로 갱신되어, 안개가 그림에만 있고 정보에는 없게 된다.
  return unit && unitVisibleTo(unit, "player") ? unit : null;
}

function selectedEngineer() {
  const unit = selectedUnit();
  return unit?.owner === "player" && unit.type === "engineer" && !unit.acted && !activeConstructionForBuilder(unit) ? unit : null;
}

function selectedBattalionHQ() {
  const unit = selectedUnit();
  return unit?.owner === "player" && unit.type === "battalionHQ" ? unit : null;
}

function getSelectableUnitAt(x, y, owner) {
  return getUnitsAt(x, y).find((unit) => unit.owner === owner && !unit.acted);
}

// 안 보이는 적은 클릭 대상도 아니다. 이 한 곳만 막으면 "안 보이는데 카드에는 체력이 뜬다",
// "빈 칸을 눌렀는데 공격이 나간다" 같은 구멍이 한꺼번에 닫힌다 — 플레이어가 적을 건드리는
// 길은 전부 이 함수를 지나기 때문이다. 화면에 없는 것은 게임에도 없어야 안개다.
function getTargetUnitAt(x, y, owner) {
  const viewer = owner === "enemy" ? "player" : "enemy";
  return getUnitsAt(x, y)
    .filter((unit) => unit.owner === owner && unitVisibleTo(unit, viewer))
    .sort((a, b) => a.hp - b.hp)[0];
}

function getUnitsAt(x, y) {
  return state.units.filter((unit) => unit.x === x && unit.y === y);
}

function getBaseAt(x, y) {
  return state.bases.find((base) => base.x === x && base.y === y);
}

function getConstructionAt(x, y) {
  return state.constructions.find((construction) => construction.x === x && construction.y === y);
}

function hasImprovement(x, y, type) {
  return state.improvements.some((improvement) => improvement.x === x && improvement.y === y && improvement.type === type);
}

// 교량이든 부교든 "건널 수 있는 널판"이라는 점에서는 하나다. 통행·표시·엄폐·피격은
// 전부 이 함수만 보고, 건설 규칙(진영당 두 개)만 부교를 따로 센다. 다리를 두 종류로
// 나눈 뒤 통행 판정이 한 군데라도 옛 이름을 보고 있으면, 마을 다리 위에서 부대가
// 물에 빠진 것처럼 굳어 버린다.
function deckAt(x, y) {
  return state.improvements.find((item) => item.x === x && item.y === y && bridgeKinds[item.type]) ?? null;
}

// 다리가 놓인 방향. 건너는 쪽은 물이 짧게 이어지는 쪽이다 — 강폭보다 강줄기가
// 늘 기니까. bridgeAxisAt과 달리 3칸 제한을 안 보는데, 그림은 강폭이 넓어도
// 그려야 하기 때문이다(마을 교량).
function deckOrientation(x, y) {
  return waterRunLength(x, y, "h") <= waterRunLength(x, y, "v") ? "h" : "v";
}

function newDeck(type, owner, x, y) {
  const kind = bridgeKinds[type];
  return { type, owner, x, y, hp: kind.hp, maxHp: kind.hp };
}

// 다리를 직접 겨냥했을 때의 피해. 부대를 칠 때와 같은 값에서 다리의 방어도만 뺀다 —
// 고도차도 사기도 다리에는 의미가 없다(다리는 도망가지도 겁먹지도 않는다).
//
//   교량(방어 3)  — 소총분대 4에 지휘관 1을 얹어도 한 번에 2. 체력 20이니 열 번이다.
//                   야포(공격 8)라야 여섯 번에 끊는다. 작정하고 포를 돌려야 끊긴다.
//   부교(방어 -1) — 방어가 음수라 오히려 더 아프게 맞는다. 체력 3이라 전투 부대는
//                   무엇으로 쏘든 한 방이다.
function deckDamage(attacker, deck) {
  const bonus = isCombatUnit(attacker) ? commanderFor(attacker.owner).attack : 0;
  return Math.max(1, unitTypes[attacker.type].attack + bonus - bridgeKinds[deck.type].defense);
}

// 다리에 피해를 먹이고, 끊겼으면 무너뜨린다. 부대를 때리다 딸려 들어오는 몫과
// 작정하고 다리를 겨냥한 몫이 모두 이 문을 지난다 — 무너지는 처리가 두 군데
// 있으면 한쪽에서만 부대가 물에 빠진다.
function damageDeck(deck, amount) {
  deck.hp -= amount;
  if (deck.hp > 0) return false;
  collapseDeck(deck);
  return true;
}

function collapseDeck(deck) {
  state.improvements = state.improvements.filter((item) => item !== deck);
  // 강이 다시 막혔으니 어제 그린 길은 거짓말이다.
  clearRouteFields();
  const name = bridgeKinds[deck.type].name;
  addLog(t("({x},{y}) {what} 붕괴", { x: deck.x, y: deck.y, what: t(name) }));
  addChronicle(t("({x},{y}) {what} 붕괴 · 도하 차단", { x: deck.x, y: deck.y, what: t(name) }));
  // 다리 위에 서 있던 부대는 다리와 함께 물로 간다. 다리가 사라진 자리는 하천이고,
  // 하천에는 육상 부대가 설 수 없다 — 살려 두면 건널 수도 나올 수도 없는 유령이 된다.
  // 그래서 "다리 위에서 턴을 끝내지 마라"가 이 게임의 규칙이 된다.
  //
  // 한 칸에는 같은 병종이 셋까지 겹친다. find는 그중 하나만 집어내므로, 셋이 얹힌
  // 다리가 끊기면 하나만 빠지고 둘은 물 위에 그대로 남았다 — 하천에는 설 수 없는
  // 부대가 하천 칸에 서서, 나올 수도 없고 건널 수도 없는 상태가 되었다.
  // 그래서 그 칸에 있는 것을 전부 걷어낸다. 겹치기 상한이 몇으로 바뀌든 이 줄은
  // 그대로 맞는다.
  const riders = state.units.filter((unit) => unit.x === deck.x && unit.y === deck.y);
  if (!riders.length) return;
  const sunk = new Set(riders.map((unit) => unit.id));
  state.units = state.units.filter((unit) => !sunk.has(unit.id));
  // 소리는 겹쳐 울리면 한 번 크게 난 것으로 들린다. 조금씩 밀어 셋이 빠졌음을 귀로도 안다.
  riders.forEach((rider, index) => window.setTimeout(() => playDestroySound(rider), 260 + index * 140));
  // 무전 기록은 열넉 줄이 전부다. 수몰 셋을 세 줄로 적으면 붕괴 한 번에 그 전 턴이
  // 통째로 밀려나서, 무슨 일이 있었는지 되짚을 근거가 사라진다. 한 사건은 한 줄이다.
  // 이력(240줄)은 넉넉하므로 거기에는 부대별로 남긴다 — 끝나고 몰아서 읽는 곳이다.
  const rest = riders.length > 1 ? t(" 외 {n}", { n: riders.length - 1 }) : "";
  addLog(t("{unit}{rest} 다리와 함께 수몰", { unit: sideUnitLabel(riders[0]), rest }));
  riders.forEach((rider) =>
    addChronicle(t("{unit} › 다리와 함께 수몰", { unit: sideUnitLabel(rider) }), rider.owner === "enemy" ? "kill" : "loss"),
  );
}

function getTerrainKey(x, y) {
  return terrainMap[y][x];
}

function tileAt(x, y) {
  return terrain[getTerrainKey(x, y)];
}

// 그 칸에 서면 실제로 깎이는 피해량. 지형 엄폐 + 거점 버프다.
// 전투 계산과 AI의 자리 고르기가 이 함수 하나만 보게 해야 한다 — 따로 세면
// AI는 거점을 그냥 개활지로 읽고, 방어할 만한 자리를 지나쳐 들판에 선다.
// 다리 위는 난간뿐인 널판이다. 파고들 흙도 숨을 나무도 없이 물 위에 떠 있으므로
// 개활지(엄폐 0)보다도 맞기 쉽다. 여기서 빼기 때문에 전투 계산·피해 예측·AI의
// 자리 고르기가 전부 같은 숫자를 읽는다.
// 능선이 어느 쪽을 막고 있고, 때리는 쪽이 그 쪽에서 왔는가.
//
// 방향은 두 부대의 좌표 차이가 큰 축으로 정한다. 대각선으로 붙은 경우 세로가
// 이긴다 — 어느 쪽을 골라도 되지만 하나로 고정해야 같은 판이 같은 결과를 낸다.
// 이 게임에는 난수가 없고, 그 성질을 여기서도 깨지 않는다.
//
// 시나리오는 손대지 않는다. 열두 작전 전부 hillDefense 표를 이미 갖고 있어서
// 이 함수 하나로 모든 지도에 같이 적용된다.
function ridgeFacingBonus(attacker, defender) {
  if (!ridgeFacingDefense) return 0;
  const facing = hillDefenseDirection(defender.x, defender.y);
  if (!facing) return 0;
  const dx = attacker.x - defender.x;
  const dy = attacker.y - defender.y;
  if (!dx && !dy) return 0;
  const from = Math.abs(dy) >= Math.abs(dx) ? (dy < 0 ? "n" : "s") : dx < 0 ? "w" : "e";
  return from === facing ? ridgeFacingDefense : 0;
}

function coverAt(x, y) {
  return tileAt(x, y).defense + (getBaseAt(x, y) ? baseDefenseBonus : 0) - (deckAt(x, y) ? bridgeExposure : 0);
}

function displayTileName(x, y) {
  const deck = deckAt(x, y);
  if (deck) return bridgeKinds[deck.type].name;
  if (hasImprovement(x, y, "rail")) return `${tileAt(x, y).name} / 철도`;
  return tileAt(x, y).name;
}

function hillDefenseDirection(x, y) {
  if (getTerrainKey(x, y) !== "H") return "";
  return hillDefenseMap[y]?.[x]?.toLowerCase() === "." ? "" : hillDefenseMap[y]?.[x]?.toLowerCase() ?? "";
}

function ridgeDirectionLabel(direction) {
  return {
    n: t("북쪽"),
    e: t("동쪽"),
    s: t("남쪽"),
    w: t("서쪽"),
  }[direction] ?? t("지정 없음");
}

function neighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ].filter((point) => inBounds(point.x, point.y));
}

function distance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function inBounds(x, y) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

function posKey(x, y) {
  return `${x},${y}`;
}

// "주도권" 칸은 phase를 그대로 진영명으로 바꿔 찍었다. 배치 단계가 생기면서
// deploy가 들어오면 sideName이 이를 모르는 값으로 보고 적 진영명을 찍는다 —
// 내가 배치 중인데 화면은 적 차례라고 말하게 된다. 단계 이름은 여기서 따로 정한다.
function phaseDisplayName() {
  if (state.phase === "deploy") return "배치";
  return state.phase === "player" ? sideName("player") : sideName("enemy");
}

function sideName(owner) {
  // 거점은 주인이 없을 수 있다. sideKeyForUnit은 "player가 아니면 적"으로 접기 때문에
  // 여기서 먼저 걸러내지 않으면 무주공산 거점이 적 거점으로 표시된다.
  if (owner === "neutral") return "중립";
  const side = sideKeyForUnit(owner);
  if (activePack) return side === "allies" ? activePack.side.player : activePack.side.enemy;
  return side === "allies" ? "연합군" : "추축군";
}

function constructionName(type) {
  if (activePack && type === "depot") return activePack.buttons.depot;
  if (activePack && type === "bridge") return activePack.buttons.bridge;
  if (activePack) return activePack.buttons.rail;
  // 한국어에는 activePack이 없다. 여기서 bridge를 안 걸러 주면 부교 공사 거절
  // 메시지가 "철도 공사에는 보급품 2가 필요합니다"로 나온다.
  if (type === "depot") return "보급창고";
  return type === "bridge" ? bridgeKinds.bridge.name : "철도";
}

function constructionLabel(type) {
  return constructionName(type).slice(0, 1);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// ── 작전 지령 ────────────────────────────────────────────────────────────
//
// 무전 기록은 여태 "무슨 일이 있었다"만 적었다. 그런데 판을 처음 잡은 사람이
// 정작 알아야 하는 것은 "지금 무엇을 하라"다. 그 말을 위해 창을 따로 띄우면
// 판이 끊기므로, 같은 무전 창으로 내려보낸다 — 사령부에서 오는 전문처럼.
// 노란 줄이 그것이다.
//
// 규칙은 셋이다.
//   · 한 번만 — 같은 지령이 매 턴 되풀이되면 그건 지령이 아니라 잔소리다.
//   · 때가 되어야 — 강이 없는 판에서 도하 지령이 내려오면 안 된다.
//   · 한 턴에 하나 — 여럿이 한꺼번에 뜨면 노란 줄이 창을 덮어 도로 어지럽다.
//
// 순서가 곧 우선순위다. 위에 있을수록 급한 것이라, 부대가 굶고 있는 판에
// "증원을 뽑으십시오"가 먼저 내려오는 일이 없다.
const orderBook = [
  {
    id: "isolated",
    when: () =>
      state.units.some((unit) => unit.owner === "player" && supplyStatus(unit).level === "isolated"),
    text: () => t("보급 두절 › 해당 부대는 매 턴 병력이 녹는다 · 보급선 안으로 후퇴시킬 것"),
  },
  {
    id: "deadline",
    when: () => turnsRemaining() <= 3,
    text: () => t("기한 임박 › {n}턴 남음 · 목표 달성을 최우선으로", { n: turnsRemaining() }),
  },
  {
    id: "supplyShort",
    when: () => state.turn >= 3 && state.resources < unitTypes.infantry.cost,
    text: () => t("보급 고갈 › 보급은 거점에서 나온다 · 거점을 지키거나 공병대로 보급창고를 세울 것"),
  },
  {
    id: "contact",
    when: () => visibleFoes("player").length > 0,
    text: () =>
      t("적 접촉 › 부대를 고르고 사거리 안의 적을 누르면 사격 · 고지와 숲은 방어에 유리하다"),
  },
  {
    id: "holding",
    when: () => objectiveTiles("player").some((objective) => objective.held > 0),
    text: () => t("목표 진입 › 장악은 눌러앉아야 오른다 · 상대 턴을 넘기고도 남아 있어야 한 턴이다"),
  },
  {
    id: "crossing",
    when: () =>
      state.turn >= 2 &&
      state.units.some((unit) => unit.owner === "player" && unit.type === "engineer") &&
      terrainMap.some((row) => row.includes("W")),
    text: () => t("도하 › 공병대를 물가에 붙이고 「부교 건설」 · 한 도하에 {n}줄까지", { n: bridgeLimitPerSide }),
  },
  {
    id: "reinforce",
    when: () => state.turn >= 2 && state.resources >= unitTypes.armor.cost,
    text: () => t("증원 › 대대사령부를 고른 뒤 편성 · 도착한 부대는 다음 턴부터 움직인다"),
  },
  {
    id: "advance",
    when: () => state.phase === "player",
    text: () => t("작전 개시 › 부대를 눌러 강조된 칸으로 이동 · 지도 밑줄이 왜 안 되는지 알려 준다"),
  },
];

// 화면을 다시 그릴 때마다 확인한다. 턴이 바뀔 때만 보면, 부대를 움직여 적이
// 눈에 들어온 그 순간을 놓치고 다음 턴에야 "적 접촉"이 뜬다 — 한 박자 늦은
// 지령은 지령이 아니다.
function issueOrders() {
  if (!state || state.gameOver) return;
  if (!state.ordersGiven) state.ordersGiven = {};
  const due = orderBook.find((order) => !state.ordersGiven[order.id] && order.when());
  if (!due) return;
  state.ordersGiven[due.id] = true;
  addLog(due.text(), "order");
}

// 무전 기록. 한 줄은 글이 아니라 전문(電文)이다 — 무전병이 받아 적은 것이지
// 소설이 아니다. 그래서 "습니다"로 끝나지 않고, 주어와 행동 사이에 ›를 넣고,
// 자리를 (9,13)으로 찍는다. 열두 줄이 전부 문장이면 읽는 것이 아니라 훑게 되고,
// 훑으면 정작 중요한 한 줄을 놓친다.
//
// kind는 그 한 줄이 어떤 종류인가다. 지금은 "order"(작전 지령) 하나뿐이고,
// 지령만 노란색으로 뜬다. 색을 하나 더 늘리지 않는 이유는, 이 창이 어지럽다는
// 것이 애초의 문제였기 때문이다 — 색이 셋이면 어느 것도 눈에 띄지 않는다.
function addLog(message, kind = "") {
  state.log.unshift({ text: message, kind });
  state.log = state.log.slice(0, 14);
}

// 작전 이력. 무전 기록과 다른 물건이다 — 무전 기록은 "지금 무슨 일이 나고 있는가"라
// 열넉 줄만 쥐고 계속 밀어내지만, 이력은 "이 작전에서 무슨 일이 있었는가"라 끝까지
// 남는다. 그래서 여기 들어오는 줄은 피해량 같은 경과가 아니라 되돌릴 수 없게 된
// 일들뿐이다 — 부대가 없어졌다, 거점의 주인이 바뀌었다, 다리가 끊겼다.
// 매 줄에 날짜를 박는 이유는 끝나고 몰아서 읽기 때문이다. 그때는 "몇 턴째"가 아니라
// "며칠에"로 읽힌다.
function addChronicle(text, kind = "") {
  if (!state?.chronicle) return;
  const { year, month, day } = missionDate(state.turn);
  state.chronicle.push({ date: `${year}.${month}.${day}`, text, kind });
  // 아주 긴 판에서도 종이 한 장 분량을 넘지 않게 한다. 넘치면 오래된 것부터
  // 버린다 — 결과 화면에서 눈이 머무는 곳은 마지막 며칠이다.
  if (state.chronicle.length > 240) state.chronicle.shift();
}

// 격파는 누가 누구를 없앴는지가 전부다. 자리를 같이 적는 이유는 그것이 이 게임의
// 사건이 일어나는 유일한 단위이기 때문이다 — (9,13)이 어디인지는 판을 본 사람만 안다.
function chronicleKill(attacker, victim, options = {}) {
  const where = `(${victim.x},${victim.y})`;
  const head = options.counter
    ? t("{unit} › 반격", { unit: sideUnitLabel(attacker) })
    : t("{unit} › {where} 진격", { unit: sideUnitLabel(attacker), where });
  addChronicle(t("{head} · {victim} 격파", { head, victim: sideUnitLabel(victim) }), victim.owner === "enemy" ? "kill" : "loss");
}

// 범례는 넓고 높은 화면에서만 펴 둔다. 좁거나 낮은 화면에서는 접힌 채로 두어
// 그 자리를 지도에 준다. 범례는 처음 한 번 보는 표지, 매 턴 보는 것이 아니다.
const legendFold = document.getElementById("legendFold");
if (legendFold) legendFold.open = !isPhoneLayout() && window.innerHeight > 820;
// 범례를 접고 펴면 지도가 위아래로 움직인다. 지도 모서리에 얹힌 부대 카드도
// 같이 따라가야 모서리에 붙어 있는 것처럼 보인다.
// 범례를 사람이 직접 여닫았는가. 우리가 코드로 여닫아도 toggle 소식은 똑같이
// 오므로, 우리가 건드릴 때는 표시를 세워 두고 그 한 번만 그냥 넘긴다.
let legendFoldTouched = false;
let legendFoldAuto = false;
legendFold?.addEventListener("toggle", () => {
  if (legendFoldAuto) legendFoldAuto = false;
  else legendFoldTouched = true;
  scheduleBoardFit();
});

// 좁은 화면에서 지휘칸은 아래에서 올라오는 서랍이다. 처음에는 닫아 두고 전장을
// 먼저 보여 준다 — 게임을 켜서 맨 처음 봐야 할 것은 증원 목록이 아니라 전선이다.
//
// 폰을 눕히면 넓은 화면이 되고, 세우면 다시 좁아진다. 켤 때 한 번 재고 마는
// 값을 쓰면 그 사이에 돌린 만큼 화면과 어긋난다 — 가로로 켠 뒤 세우면 서랍이
// 전장을 덮은 채로 뜨고, 세로로 켠 뒤 눕히면 넓은 화면인데 지휘칸이 접혀 있다.
// 그래서 경계를 넘을 때마다 다시 맞춘다. 카드 자리 계산과 같은 자를 쓴다.
function applyScreenWidthLayout() {
  const phone = isPhoneLayout();
  // 사람이 손댄 적이 없을 때만 화면 모양에 맞춘다. 한 번이라도 직접 여닫았으면
  // 그 뜻이 위다. 범례도 같다 — 접어 둔 것이 회전 한 번에 다시 펴지지 않는다.
  // 클래스를 직접 켜고 끄지 않는다. 여닫는 손이 둘이면 setCommandPanel 쪽만
  // 손봤을 때 이 줄이 조용히 안 따라온다. 화면 폭에 맞춘 정리는 사람의 뜻이 아니다.
  if (!commandPanelTouched) setCommandPanel(phone, { byUser: false });
  if (legendFold && !legendFoldTouched) {
    const want = !phone && window.innerHeight > 820;
    if (legendFold.open !== want) {
      legendFoldAuto = true;
      legendFold.open = want;
    }
  }
  syncCommandPanelState();
}
applyScreenWidthLayout();
window.matchMedia("(min-width: 861px)").addEventListener("change", applyScreenWidthLayout);

loadSavedDefaultBalance();
// 게임을 켜면 판이 아니라 명령서가 먼저다. 여태는 아무도 고르지 않은 기본 작전이
// 곧바로 시작돼서, 판을 한 번 보고 나서야 「새 작전」을 눌러 제 작전을 골랐다.
// 순서가 거꾸로였다 — 군인이 전선에 서기 전에 명령서를 먼저 받는다.
//
// startGame()을 먼저 부르는 이유는 명령서 뒤에 깔릴 판이 있어야 하기 때문이다.
// 그 판은 고른 것이 아니라 배경이고, 명령서에 서명하는 순간 고른 작전으로 다시 깔린다.
//
// 하다 만 판이 있으면 그것을 배경으로 깐다. 「이어하기」를 누르는 순간 명령서만
// 닫히면 되도록 — 그때부터 판을 되살리기 시작하면 이어하는 느낌이 안 난다.
if (restoreSavedOperation()) operationCommenced = true;
else startGame();
openNewOperationSetup();

// 이 기계에서 한 번도 안 해 본 사람에게만 안내가 붙는다. 「그만 보기」를 누르거나
// 여섯 마디를 다 넘기면 다시는 안 뜬다 — 다시 보고 싶으면 지휘 서랍의 「조작 안내」.
if (coachRead() !== "done") coachStart();
