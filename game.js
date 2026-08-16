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
let cutSupplyMoralePenalty = 25;
let collapseGraceTurns = 4;
let collapseMaxDamage = 4;
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
// 전투 정원은 이제 땅에서 나온다. 거점 하나가 몇 개 부대를 먹여 살리는가.
// 예전 정원은 "적 여섯 기, 플레이어 무제한"이었고, 그래서 적은 일곱 턴이면 정원을
// 채운 뒤 보급품을 쌓아만 뒀다 — 14턴 실측에서 34를 깔고 앉아 아무것도 사지 않았다.
// 정원을 지도에 묶으면 그 저축이 사라진다. 거점을 더 먹은 쪽이 더 큰 군을 굴리고,
// 거점을 잃으면 군이 줄어든다. 보급 거점을 다투는 이유가 생산 숫자 하나에서
// "몇 개 부대를 세울 수 있는가"로 바뀐다. 양 진영에 똑같이 적용된다.
let forcePerBase = 6;
// 공병대가 세운 보급창고 몫. 원래 거점보다 작다 — 창고는 전선을 늘리는 물건이지
// 사단을 통째로 앉히는 자리가 아니다.
let forcePerDepot = 3;
// 이만큼 쌓이면 적은 격턴 제한을 풀고 매 턴 부른다. 격턴은 자원이 빠듯할 때의
// 절약책이지, 창고가 늘어난 뒤에도 지킬 규칙이 아니다.
let enemyRecruitSurplus = 24;
// 창고 공사는 3일이 걸리고 그동안 공병대는 움직이지 못한다. 이 거리 안에 적이
// 있으면 안전한 자리가 아니다 — AI는 아예 짓지 않고, 플레이어에게는 경고만 한다.
let depotSafeDistance = 4;
// 사령부 엄호 규칙 켜기(1)/끄기(0). 자세한 설명은 isScreenedHQ에.
let hqScreening = 1;
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
let mapConfig = {
  enabled: true,
  centerLat: 49.18,
  centerLon: -0.36,
  zoom: 10,
  radius: 2,
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
  width = scenario.terrain[0].length;
  height = scenario.terrain.length;
  mapConfig = { ...mapConfig, ...(scenario.map ?? {}) };
  // CSS가 20x16을 박아두고 있으면 다른 크기 지도가 찌그러진다. 격자는 JS가 알려준다.
  boardEl?.style.setProperty("--map-cols", String(width));
  boardEl?.style.setProperty("--map-rows", String(height));
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
    forcePerBase,
    forcePerDepot,
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
    baseRepairRate,
    baseEfficiencyRepair,
    enemyBaseSeekRange,
    depotSafeDistance,
    hqScreening,
    playerBattalionHQ: episodeLimits.playerBattalionHQ,
    enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
  },
  units: JSON.parse(JSON.stringify(unitTypes)),
};

const DEFAULT_BALANCE_STORAGE_KEY = "ww2TacticalCommand.defaultBalance";

const constructionCosts = {
  depot: 1,
  bridge: 2,
  rail: 1,
};

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
  ["forcePerBase", "보급 기지당 전투 정원", 0, 20, 1],
  ["forcePerDepot", "보급창고당 전투 정원", 0, 20, 1],
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
  ["baseRepairRate", "거점 위 재편성 회복 (0=끔)", 0, 5, 1],
  ["baseEfficiencyRepair", "거점 효율 턴당 복구 (0=끔)", 0, 0.5, 0.05],
  ["enemyBaseSeekRange", "적 중립 거점 확보 반경 (0=안 감)", 0, 20, 1],
  ["depotSafeDistance", "보급창고 안전 거리", 1, 12, 1],
  ["hqScreening", "사령부 엄호 (0=끔)", 0, 1, 1],
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
    },
    status: ["Day", "Initiative", "Supplies", "Next Supply"],
    hint: "Click a unit to show available commands.",
    select: "Select a unit",
    editor: "Game Values Editor",
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
    },
    status: ["作战日", "主动权", "补给", "下回补给"],
    hint: "点击部队显示可用命令。",
    select: "选择部队",
    editor: "游戏数值编辑器",
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
    },
    status: ["作戦日", "主導権", "補給", "次回補給"],
    hint: "部隊をクリックすると使用可能な命令が表示されます。",
    select: "部隊を選択",
    editor: "ゲーム数値エディター",
  },
};

const activeLocale = detectLocale();
const activePack = localePacks[activeLocale];

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
];

let state;
let pendingUnitMoves = [];
let pendingCombatEvents = [];
let audioContext;
let lastUiSoundAt = 0;
const soundVolume = 3.8;

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
const missionNameLabelEl = document.querySelector("#missionNameLabel");
const missionBriefLabelEl = document.querySelector("#missionBriefLabel");
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
document.querySelector("#toggleEditorPanel")?.addEventListener("click", toggleEditorPanel);
battlefieldWrapEl?.addEventListener("wheel", handleMapWheel, { passive: false });
document.addEventListener("pointerdown", handleGlobalPointerSound, true);
operationModalEl?.addEventListener("change", handleOperationSetupChange);
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
  return "ko";
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

function audioNow() {
  return audioContext?.currentTime ?? 0;
}

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function soundGain(gain) {
  return Math.min(0.45, gain * soundVolume);
}

function markSound(name) {
  window.__lastGameSound = {
    name,
    time: new Date().toISOString(),
    contextState: audioContext?.state ?? "none",
  };
}

function playTone({ frequency = 440, duration = 0.08, type = "sine", gain = 0.04, when = null, detune = 0, name = "tone" }) {
  const context = ensureAudio();
  if (!context) return;
  const startAt = when ?? context.currentTime + 0.005;
  const actualGain = soundGain(gain);
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.detune.setValueAtTime(detune, startAt);
  volume.gain.setValueAtTime(0.0001, startAt);
  volume.gain.exponentialRampToValueAtTime(actualGain, startAt + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
  markSound(name);
}

function playNoise({ duration = 0.08, gain = 0.05, when = null, filter = 900, type = "bandpass", name = "noise" }) {
  const context = ensureAudio();
  if (!context) return;
  const startAt = when ?? context.currentTime + 0.005;
  const actualGain = soundGain(gain);
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  const source = context.createBufferSource();
  const filterNode = context.createBiquadFilter();
  const volume = context.createGain();
  source.buffer = buffer;
  filterNode.type = type;
  filterNode.frequency.value = filter;
  volume.gain.setValueAtTime(actualGain, startAt);
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.connect(filterNode).connect(volume).connect(context.destination);
  source.start(startAt);
  markSound(name);
}

function playThump({ frequency = 80, duration = 0.08, gain = 0.06, when = null, name = "thump" }) {
  const context = ensureAudio();
  if (!context) return;
  const startAt = when ?? context.currentTime + 0.005;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * 0.45), startAt + duration);
  volume.gain.setValueAtTime(0.0001, startAt);
  volume.gain.exponentialRampToValueAtTime(soundGain(gain), startAt + 0.006);
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
  markSound(name);
}

function playUiSound() {
  const context = ensureAudio();
  if (!context) return;
  const now = context.currentTime;
  if (now - lastUiSoundAt < 0.055) return;
  lastUiSoundAt = now;
  playNoise({ duration: 0.026, gain: 0.055, when: now + 0.005, filter: 2600, type: "highpass", name: "ui-paper-tap" });
  playThump({ frequency: 130, duration: 0.035, gain: 0.025, when: now + 0.008, name: "ui-soft-thump" });
}

function handleGlobalPointerSound(event) {
  if (event.target.closest("button, summary, label, input, select, textarea")) playUiSound();
}

function playTerrainSound(x, y) {
  const key = getTerrainKey(x, y);
  const map = {
    P: { filter: 850, gain: 0.045 },
    C: { filter: 620, gain: 0.05 },
    F: { filter: 420, gain: 0.055 },
    H: { filter: 300, gain: 0.06 },
    W: { filter: 1100, gain: 0.04 },
    B: { filter: 1500, gain: 0.055 },
  };
  const sound = map[key] ?? map.P;
  playNoise({ duration: 0.05, gain: sound.gain, filter: sound.filter, type: "bandpass", name: `terrain-${key}` });
  playThump({ frequency: key === "H" ? 70 : 95, duration: 0.035, gain: 0.018, name: `terrain-body-${key}` });
}

function playUnitSound(unitOrMove, action) {
  const type = unitOrMove?.type;
  if (!type) return;
  const context = ensureAudio();
  if (!context) return;
  const now = context.currentTime;

  if (action === "select") {
    playNoise({ duration: 0.035, gain: 0.055, when: now + 0.005, filter: type === "battalionHQ" ? 1800 : 1250, type: "bandpass", name: `select-cloth-${type}` });
    if (type === "battalionHQ") playNoise({ duration: 0.045, gain: 0.035, when: now + 0.035, filter: 2400, type: "highpass", name: "select-radio-click" });
    return;
  }

  if (action === "move") {
    if (type === "infantry" || type === "engineer") {
      playThump({ frequency: 72, duration: 0.11, gain: 0.055, when: now + 0.005, name: `move-boot-thump-${type}` });
      playNoise({ duration: 0.1, gain: 0.075, when: now + 0.012, filter: 210, type: "lowpass", name: `move-boot-body-${type}` });
      playThump({ frequency: 68, duration: 0.1, gain: 0.048, when: now + 0.27, name: `move-boot-thump-${type}` });
      playNoise({ duration: 0.095, gain: 0.064, when: now + 0.278, filter: 230, type: "lowpass", name: `move-boot-body-${type}` });
      if (type === "engineer") playNoise({ duration: 0.07, gain: 0.035, when: now + 0.14, filter: 760, type: "bandpass", name: "move-tool-heavy-rattle" });
    } else if (type === "armor" || type === "spArtillery") {
      playThump({ frequency: 42, duration: 0.34, gain: 0.095, when: now + 0.005, name: `move-heavy-body-${type}` });
      playNoise({ duration: 0.48, gain: 0.12, when: now + 0.012, filter: 150, type: "lowpass", name: `move-track-rumble-${type}` });
      playNoise({ duration: 0.26, gain: 0.045, when: now + 0.06, filter: 520, type: "bandpass", name: `move-track-clank-${type}` });
    } else if (type === "artillery") {
      playThump({ frequency: 58, duration: 0.16, gain: 0.065, when: now + 0.005, name: "move-artillery-heavy-wheel" });
      playNoise({ duration: 0.2, gain: 0.075, when: now + 0.012, filter: 190, type: "lowpass", name: "move-artillery-wheel-body" });
      playNoise({ duration: 0.06, gain: 0.03, when: now + 0.17, filter: 680, type: "bandpass", name: "move-artillery-metal" });
    } else {
      playThump({ frequency: 62, duration: 0.16, gain: 0.055, when: now + 0.005, name: `move-heavy-${type}` });
      playNoise({ duration: 0.2, gain: 0.065, when: now + 0.012, filter: 220, type: "lowpass", name: `move-${type}` });
    }
    return;
  }

  if (action === "attack") {
    if (type === "infantry" || type === "engineer" || type === "battalionHQ") {
      playNoise({ duration: 0.035, gain: 0.18, when: now + 0.005, filter: 2400, type: "bandpass", name: `attack-rifle-crack-${type}` });
      playNoise({ duration: 0.09, gain: 0.07, when: now + 0.018, filter: 650, type: "lowpass", name: `attack-rifle-body-${type}` });
      playNoise({ duration: 0.032, gain: 0.15, when: now + 0.12, filter: 2200, type: "bandpass", name: `attack-rifle-crack-${type}` });
    } else if (type === "armor") {
      playNoise({ duration: 0.045, gain: 0.17, when: now + 0.005, filter: 1350, type: "bandpass", name: "attack-tank-blast" });
      playThump({ frequency: 48, duration: 0.28, gain: 0.12, when: now + 0.018, name: "attack-tank-thump" });
      playNoise({ duration: 0.32, gain: 0.09, when: now + 0.04, filter: 360, type: "lowpass", name: "attack-tank-smoke" });
    } else if (type === "artillery" || type === "spArtillery") {
      playNoise({ duration: 0.055, gain: 0.19, when: now + 0.005, filter: 980, type: "bandpass", name: `attack-artillery-blast-${type}` });
      playThump({ frequency: 38, duration: 0.36, gain: 0.16, when: now + 0.02, name: `attack-artillery-thump-${type}` });
      playNoise({ duration: 0.46, gain: 0.095, when: now + 0.06, filter: 300, type: "lowpass", name: `attack-artillery-tail-${type}` });
    }
  }
}

function applyLocale() {
  if (!activePack) return;
  document.documentElement.lang = activeLocale;
  document.title = activePack.title;
  document.querySelector("h1").textContent = activePack.title;
  document.querySelector(".command-panel")?.setAttribute("aria-label", activePack.title);
  document.querySelector(".battlefield-wrap")?.setAttribute("aria-label", "Battlefield");
  document.querySelector(".balance-editor")?.setAttribute("aria-label", activePack.editor);
  document.querySelector("summary").textContent = activePack.editor;

  Object.entries(activePack.units).forEach(([type, label]) => {
    if (unitTypes[type]) unitTypes[type].label = label;
  });
  Object.entries(activePack.terrain).forEach(([key, name]) => {
    if (terrain[key]) terrain[key].name = name;
  });

  document.querySelectorAll(".status-grid span").forEach((node, index) => {
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

  const legend = document.querySelector(".legend");
  if (legend) {
    legend.innerHTML = `
      <span><i class="chip player"></i>${activePack.side.player}</span>
      <span><i class="chip enemy"></i>${activePack.side.enemy}</span>
      <span><i class="terrain plain"></i>${terrain.P.name}</span>
      <span><i class="terrain coast"></i>${terrain.C.name}</span>
      <span><i class="terrain hill"></i>${terrain.H.name}</span>
      <span><i class="terrain base"></i>${terrain.B.name}</span>
    `;
  }
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

function openNewOperationSetup() {
  renderOperationScenarioChoices();
  renderOperationCommanderChoices(selectedOperationSide());
  if (operationModalEl) operationModalEl.hidden = false;
}

function selectedOperationScenarioId() {
  return operationModalEl?.querySelector('input[name="operationScenario"]:checked')?.value ?? state?.scenarioId ?? defaultScenarioId;
}

function renderOperationScenarioChoices() {
  if (!operationScenarioChoicesEl) return;
  const selectedId = selectedOperationScenarioId();
  operationScenarioChoicesEl.innerHTML = scenarios
    .map((scenario) => {
      const size = `${scenario.terrain[0].length}×${scenario.terrain.length}`;
      const deadline = scenario.turnLimit ? `${scenario.turnLimit}턴` : "기한 없음";
      return `
      <label class="scenario-choice">
        <input type="radio" name="operationScenario" value="${scenario.id}" ${scenario.id === selectedId ? "checked" : ""} />
        <span class="scenario-choice-body">
          <strong>${scenario.name}</strong>
          <span class="scenario-choice-meta">${size} · ${deadline} · ${scenarioOutcomeLabel(scenario)}</span>
          <span>${scenario.summary}</span>
          <span class="scenario-choice-goal">${scenario.objectiveBrief}</span>
        </span>
      </label>
    `;
    })
    .join("");
}

// 기한이 끝났을 때 누가 이기는지가 곧 미션의 성격이다. 고르기 전에 그걸 보여준다.
function scenarioOutcomeLabel(scenario) {
  if (!scenario.timeoutWinner) return "기한 만료 시 무승부";
  return scenario.timeoutWinner === "west" ? "기한 만료 시 연합군 승리" : "기한 만료 시 추축군 승리";
}

function closeNewOperationSetup() {
  if (operationModalEl) operationModalEl.hidden = true;
}

function selectedOperationSide() {
  return operationModalEl?.querySelector('input[name="operationSide"]:checked')?.value ?? "allies";
}

function selectedOperationDeployMode() {
  return operationModalEl?.querySelector('input[name="operationDeploy"]:checked')?.value ?? "auto";
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

function defaultCommanderForSide(side) {
  const preferred = side === "axis" ? "rommel" : "patton";
  return commanders.find((commander) => commander.id === preferred) ?? commanders.find((commander) => commander.side === commanderSideName(side));
}

function renderOperationCommanderChoices(side) {
  if (!operationCommanderChoicesEl) return;
  const commanderSide = commanderSideName(side);
  const available = commanders.filter((commander) => commander.side === commanderSide);
  const checkedId = operationCommanderChoicesEl.querySelector('input[name="operationCommander"]:checked')?.value;
  const selectedId = available.some((commander) => commander.id === checkedId) ? checkedId : defaultCommanderForSide(side)?.id;
  operationCommanderChoicesEl.innerHTML = available
    .map((commander) => `
      <label class="commander-choice">
        <input type="radio" name="operationCommander" value="${commander.id}" ${commander.id === selectedId ? "checked" : ""} />
        <img
          class="commander-photo"
          src="${commanderPhoto(commander)}"
          alt="${commander.name} portrait"
          data-initials="${commanderInitials(commander)}"
          onerror="replaceCommanderPhoto(this, '${commanderInitials(commander)}', '${commander.side}')"
        />
        <span class="commander-choice-body">
          <strong>${commander.name}</strong>
          <span>${commander.nation} ${commander.rank} / ${commander.trait}</span>
          <span>${commanderStatSummary(commander)}</span>
        </span>
      </label>
    `)
    .join("");
}

function handleOperationSetupChange(event) {
  if (event.target.name === "operationSide") renderOperationCommanderChoices(event.target.value);
}

function signedStat(value) {
  return value > 0 ? `+${value}` : String(value);
}

function commanderStatSummary(commander) {
  return `사기 +${commander.morale} · 공격 ${signedStat(commander.attack)} · 방어 ${signedStat(commander.defense)} · 이동 ${signedStat(commander.move ?? 0)} · 보급 ${signedStat(commander.supply ?? 0)}`;
}

function confirmNewOperationSetup() {
  const chosenSide = selectedOperationSide();
  const commanderId = operationCommanderChoicesEl?.querySelector('input[name="operationCommander"]:checked')?.value;
  startGame({
    scenarioId: selectedOperationScenarioId(),
    playerSide: chosenSide,
    playerCommanderId: commanderId,
    deployMode: selectedOperationDeployMode(),
  });
  closeNewOperationSetup();
}

function startGame(config = {}) {
  applyLocale();
  pendingUnitMoves = [];
  pendingCombatEvents = [];
  // 적 참모부의 계획은 이제 어제 것을 참고한다. 새 작전에서까지 지난 작전의
  // 배정을 물려받으면, 부대 번호가 겹치는 만큼 엉뚱한 임무로 시작한다.
  enemyPlan = new Map();
  const playerSide = config.playerSide ?? state?.playerSide ?? "allies";
  const aiSide = playerSide === "axis" ? "allies" : "axis";
  const playerCommander = commanders.find((commander) => commander.id === config.playerCommanderId && commander.side === commanderSideName(playerSide)) ?? defaultCommanderForSide(playerSide);
  const aiCommander = defaultCommanderForSide(aiSide);
  const scenario = findScenario(config.scenarioId ?? state?.scenarioId ?? defaultScenarioId);
  const scenarioChanged = state?.scenarioId !== scenario.id;
  applyScenario(scenario);
  // 시나리오의 기한은 "시작값"이다. 작전을 바꿔 고를 때만 실어준다.
  // 같은 작전을 다시 시작하는 건 대개 "에디터에서 만진 숫자로 다시 해보자"는 뜻이라,
  // 그때 시나리오 기본값으로 되돌려버리면 방금 만진 값이 증발한다.
  if (scenarioChanged && Number.isFinite(scenario.turnLimit)) operationTurnLimit = scenario.turnLimit;
  const deployment = deploymentForScenario(scenario, playerSide);
  state = {
    playerSide,
    scenarioId: scenario.id,
    // 배치 방식은 작전 설정에서 고른다. 새 작전 창을 거치지 않고 다시 시작하면
    // 직전 작전에서 쓰던 방식을 이어간다 — 수동 배치를 좋아하는 사람이 매번 다시
    // 고르게 만들 이유가 없다.
    deployMode: config.deployMode ?? state?.deployMode ?? "auto",
    turn: 1,
    phase: "player",
    resources: 8,
    enemyResources: 8,
    selectedId: null,
    inspectedId: null,
    inspectedTile: null,
    gameOver: false,
    // 거점을 전부 잃은 시점의 턴. 되찾으면 다시 null로 지워진다. baseLossCollapsed 참고.
    baseLossSince: { player: null, enemy: null },
    commanders: {
      player: playerCommander,
      enemy: aiCommander,
    },
    bases: deployment.bases,
    improvements: [],
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
  addLog(`${sideName("player")} 작전 개시. 지휘관은 ${state.commanders.player.name}입니다.`);
  addLog(`작전 「${scenario.name}」 — ${scenario.summary}`);
  addLog(missionBriefText());
  addLog(`${sideName("enemy")} 방어선 지휘관은 ${state.commanders.enemy.name}입니다.`);
  addLog("공병대가 전선에 배치되었습니다. 다리는 하루 안에 놓지만, 보급창고와 철도는 며칠의 공사가 필요합니다.");
  addLog("공병대는 보병보다 빠르고 튼튼하지만 직접 전투력은 소총분대의 약 80% 수준입니다.");
  if (state.deployMode === "manual") {
    addLog(`배치 단계입니다. 부대를 골라 강조된 칸으로 옮긴 뒤 「배치 완료」를 누르십시오. (조정 반경 ${deployRange}칸)`);
  } else if (tidied) {
    addLog(`참모부가 ${state.commanders.player.name} 장군의 보급 역량에 맞춰 ${tidied}개 부대의 배치를 조정했습니다.`);
  }
  renderBalanceEditor();
  render();
}

// 연합군을 고르면 west, 추축군을 고르면 east를 잡는다. 지도는 그대로고 서는 자리만 바뀐다.
function scenarioSideKey(playerSide) {
  return playerSide === "axis" ? "east" : "west";
}

function timeoutOutcomeFor(timeoutWinner, playerSide) {
  if (!timeoutWinner) return "draw";
  return timeoutWinner === scenarioSideKey(playerSide) ? "playerWin" : "playerLose";
}

function deploymentForScenario(scenario, playerSide) {
  const playerKey = scenarioSideKey(playerSide);
  const enemyKey = playerKey === "west" ? "east" : "west";
  const playerDeployment = scenario[playerKey];
  const enemyDeployment = scenario[enemyKey];
  return {
    // 진영 블록 안에 적혀 있다고 다 그 진영 것은 아니다. neutral이 붙은 거점은
    // 위치만 그쪽 몫이고 소유는 아무에게도 없다 — 먼저 밟는 쪽이 가져간다.
    bases: [
      ...playerDeployment.bases.map((base) => createBase(base.x, base.y, base.neutral ? "neutral" : "player", base.production)),
      ...enemyDeployment.bases.map((base) => createBase(base.x, base.y, base.neutral ? "neutral" : "enemy", base.production)),
    ],
    units: [
      ...playerDeployment.units.map((entry) => createScenarioUnit("player", entry)),
      ...enemyDeployment.units.map((entry) => createScenarioUnit("enemy", entry)),
    ],
    objectives: [
      ...(playerDeployment.objectives ?? []).map((entry) => createObjective("player", entry)),
      ...(enemyDeployment.objectives ?? []).map((entry) => createObjective("enemy", entry)),
    ],
  };
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

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `unit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  boardEl.innerHTML = "";
  boardEl.classList.toggle("map-enabled", mapConfig.enabled);
  if (mapConfig.enabled) renderMapUnderlay();
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
        cell.title += ` / 방어방향 ${ridgeDirectionLabel(hillDirection)}`;
      }
      if (hasImprovement(x, y, "bridge")) cell.classList.add("bridge");
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
        // 안개막은 가상 요소가 아니라 자식 한 장으로 깐다 — 철도·초토화 표시가
        // 이미 ::after를 쓰고 있어서, 가상 요소로 그리면 둘 중 하나가 사라진다.
        const veil = document.createElement("span");
        veil.className = "fog-veil";
        veil.setAttribute("aria-hidden", "true");
        cell.appendChild(veil);
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

  updatePanel();
  localizeRenderedText();
  const moveAnimationDelay = playUnitMoveAnimations();
  playCombatAnimations(moveAnimationDelay);
}

function renderMapUnderlay() {
  const underlay = document.createElement("div");
  underlay.className = "map-underlay";
  const center = lonLatToTile(mapConfig.centerLon, mapConfig.centerLat, mapConfig.zoom);
  const diameter = mapConfig.radius * 2 + 1;

  for (let y = -mapConfig.radius; y <= mapConfig.radius; y += 1) {
    for (let x = -mapConfig.radius; x <= mapConfig.radius; x += 1) {
      const tile = document.createElement("img");
      tile.alt = "";
      tile.draggable = false;
      tile.src = `https://tile.openstreetmap.org/${mapConfig.zoom}/${center.x + x}/${center.y + y}.png`;
      tile.style.left = `${((x + mapConfig.radius) / diameter) * 100}%`;
      tile.style.top = `${((y + mapConfig.radius) / diameter) * 100}%`;
      tile.style.width = `${100 / diameter}%`;
      tile.style.height = `${100 / diameter}%`;
      underlay.appendChild(tile);
    }
  }

  boardEl.appendChild(underlay);
}

function lonLatToTile(lon, lat, zoom) {
  const scale = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lon + 180) / 360) * scale),
    y: Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale),
  };
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
  const only = objective.byTag ? " · 지정 부대만 인정" : "";
  cell.title += ` / ${sideName(objective.owner)} ${objective.label} · 유지 ${objective.held}/${need}턴${only}`;

  const flag = document.createElement("span");
  flag.className = `objective-flag ${objective.owner}`;
  flag.setAttribute("aria-hidden", "true");
  cell.appendChild(flag);

  const badge = document.createElement("span");
  badge.className = `objective-badge ${objective.owner}`;
  badge.textContent = objective.held > 0 ? `${objective.held}/${need}` : "목표";
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
  const improvements = ["bridge", "rail", "depot"].filter((type) => hasImprovement(x, y, type));
  improvements.forEach((type) => {
    const mark = document.createElement("span");
    mark.className = `improvement ${type}`;
    mark.setAttribute("aria-hidden", "true");
    cell.appendChild(mark);
  });
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
    Object.keys(unitTypes[type]).forEach((key) => delete unitTypes[type][key]);
    Object.assign(unitTypes[type], JSON.parse(JSON.stringify(defaults)));
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
  addLog("현재 유닛/규칙 수치를 초기값으로 저장했습니다.");
}

function loadSavedDefaultBalance() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEFAULT_BALANCE_STORAGE_KEY));
    if (!saved?.units || !saved?.rules) return;
    defaultBalance.units = JSON.parse(JSON.stringify(saved.units));
    defaultBalance.rules = { ...saved.rules };
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
      forcePerBase,
      forcePerDepot,
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
      baseRepairRate,
      baseEfficiencyRepair,
      enemyBaseSeekRange,
      depotSafeDistance,
      hqScreening,
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
    forcePerBase,
    forcePerDepot,
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
    baseRepairRate,
    baseEfficiencyRepair,
    enemyBaseSeekRange,
    depotSafeDistance,
    hqScreening,
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
  if (key === "forcePerBase") forcePerBase = value;
  if (key === "forcePerDepot") forcePerDepot = value;
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
  if (key === "baseRepairRate") baseRepairRate = value;
  if (key === "baseEfficiencyRepair") baseEfficiencyRepair = value;
  if (key === "enemyBaseSeekRange") enemyBaseSeekRange = value;
  if (key === "depotSafeDistance") depotSafeDistance = value;
  if (key === "hqScreening") hqScreening = value;
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
  turnLabelEl.textContent = turnDisplay();
  phaseLabelEl.textContent = phaseDisplayName();
  resourceLabelEl.textContent = formatNumber(state.resources);
  baseLabelEl.textContent = formatNumber(projectedIncome("player"));
  if (forceLabelEl) forceLabelEl.textContent = forceDisplay("player");
  updateOperationHud();
  renderSelectedCard();
  renderCommanderList();

  logEl.innerHTML = state.log.map((item) => `<p>${item}</p>`).join("");
  syncRecruitButtonCosts();
  syncConstructionButtonCosts();
  updateActionPanel();
  // 전투 정원이 찼으면 전투 병종 버튼은 잠근다. 공병대는 정원 밖이라 계속 열려
  // 있어야 한다 — 정원을 늘리는 유일한 수단이 창고 건설이기 때문이다.
  const forceFull = forceIsFull("player");
  document.querySelector("#recruitInfantry").disabled = !selectedBattalionHQ() || state.resources < unitTypes.infantry.cost || state.gameOver || forceFull;
  document.querySelector("#recruitArmor").disabled = !selectedBattalionHQ() || state.resources < unitTypes.armor.cost || state.gameOver || forceFull;
  document.querySelector("#recruitArtillery").disabled = !selectedBattalionHQ() || state.resources < unitTypes.artillery.cost || state.gameOver || forceFull;
  document.querySelector("#recruitSpArtillery").disabled = !selectedBattalionHQ() || state.resources < unitTypes.spArtillery.cost || state.gameOver || forceFull;
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
  if (hudForceLabelEl) hudForceLabelEl.textContent = forceDisplay("player");
  if (hudAlertLabelEl) hudAlertLabelEl.textContent = operationAlertText();
  if (missionNameLabelEl) missionNameLabelEl.textContent = state.mission?.name ?? "작전";
  // 브리핑은 한 번 뜨고 로그에 묻힌다. 목표는 매 턴 보이는 자리에 있어야 한다.
  if (missionBriefLabelEl) missionBriefLabelEl.textContent = missionBriefText();
}

function operationAlertText() {
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
  if (isolated) parts.push(`고립 ${isolated}`);
  if (collapsing) parts.push(`붕괴 ${collapsing}`);
  if (cut.length - collapsing > 0) parts.push(`보급 두절 ${cut.length - collapsing}`);
  if (strained) parts.push(`보급 불안 ${strained}`);
  if (constructing) parts.push(`건설 중 ${constructing}`);
  return parts.length ? parts.join(" · ") : "전장 이상 없음";
}

function toggleCommandPanel() {
  const collapsed = document.body.classList.toggle("command-collapsed");
  const button = document.querySelector("#toggleCommandPanel");
  if (button) {
    button.setAttribute("aria-expanded", String(!collapsed));
    button.textContent = collapsed ? "열기" : "정보";
  }
}

function openCommandPanel() {
  document.body.classList.remove("command-collapsed");
  const button = document.querySelector("#toggleCommandPanel");
  if (button) {
    button.setAttribute("aria-expanded", "true");
    button.textContent = "정보";
  }
}

function toggleEditorPanel() {
  const open = document.body.classList.toggle("editor-open");
  const button = document.querySelector("#toggleEditorPanel");
  const panel = document.querySelector("#editorPanel");
  if (button) button.setAttribute("aria-expanded", String(open));
  if (panel) panel.setAttribute("aria-hidden", String(!open));
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

function updateActionPanel() {
  const selected = selectedUnit();
  const isOwnReady = selected?.owner === "player" && state.phase === "player" && !state.gameOver;
  const isHQ = isOwnReady && selected.type === "battalionHQ";
  const isEngineer = isOwnReady && selected.type === "engineer" && !selected.acted;
  const isArtillery = isOwnReady && selected.type === "artillery" && !selected.acted;
  const groups = {
    hq: ["#recruitInfantry", "#recruitArmor", "#recruitArtillery", "#recruitSpArtillery", "#recruitEngineer", "#recruitBattalionHQ"],
    hqMenus: ["#armyCommandMenu", "#navyCommandMenu", "#airCommandMenu", "#aiCommandMenu"],
    engineer: ["#buildBridge", "#buildDepot", "#buildRail"],
    artillery: ["#toggleTow"],
  };

  Object.values(groups).flat().forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) element.hidden = true;
  });

  groups.hqMenus.forEach((selector) => setActionVisible(selector, isHQ));
  if (isHQ) groups.hq.forEach((selector) => setActionVisible(selector, true));
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
  if (options.short && profile.shortLabel) return profile.shortLabel;
  return profile.label ?? unitTypes[typeof ownerOrUnit === "object" ? ownerOrUnit.type : type]?.label ?? "";
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
  return `
    <div class="unit-card-visual">
      ${visual}
      <h2>${sideUnitLabel(unit)}</h2>
    </div>
  `;
}

function renderSelectedCard() {
  const unit = selectedUnit() ?? inspectedUnit();
  if (!unit && state.inspectedTile) {
    renderTileCard(state.inspectedTile.x, state.inspectedTile.y);
    return;
  }
  if (!unit) {
    selectedCardEl.innerHTML = '<span class="muted">부대를 선택하세요</span>';
    return;
  }

  const spec = unitTypes[unit.type];
  const tile = tileAt(unit.x, unit.y);
  const stack = getUnitsAt(unit.x, unit.y).filter((other) => other.owner === unit.owner && other.type === unit.type);
  const supply = supplyStatus(unit);
  selectedCardEl.innerHTML = `
    ${renderUnitCardVisual(unit, spec)}
    <div class="unit-stats">
      <span>위치 <strong>${displayTileName(unit.x, unit.y)}</strong></span>
      <span>지형 <strong>${terrainDescription(tile)}</strong></span>
      <span>방어 보정 <strong>+${coverAt(unit.x, unit.y)}</strong></span>
      ${getBaseAt(unit.x, unit.y) && baseDefenseBonus ? `<span>거점 엄폐 <strong>+${baseDefenseBonus}</strong></span>` : ""}
      <span>지형 특성 <strong>${terrainTraitText(unit.x, unit.y)}</strong></span>
      <span>전투력 <strong>${unit.hp}/${spec.hp}</strong></span>
      <span>기동력 <strong>${effectiveMove(unit)}</strong></span>
      <span>사거리 <strong>${spec.range}</strong></span>
      ${spec.defense ? `<span>부대 방어 <strong>+${spec.defense}</strong></span>` : ""}
      <span>사기 <strong>${effectiveMorale(unit)}%</strong></span>
      <span>중첩 <strong>${stack.length}/${maxStackSize}</strong></span>
      <span>지휘관 <strong>${commanderFor(unit.owner).name.split(" ").at(-1)}</strong></span>
      ${commanderFor(unit.owner).move ? `<span>장군 이동 <strong>${signedStat(commanderFor(unit.owner).move)}</strong></span>` : ""}
      ${commanderFor(unit.owner).supply ? `<span>장군 보급 <strong>${signedStat(commanderFor(unit.owner).supply)}</strong></span>` : ""}
      ${unit.type === "artillery" ? `<span>상태 <strong>${unit.towed ? "견인" : "전개"}</strong></span>` : ""}
      <span>행동 <strong>${unit.acted ? "완료" : unit.moved ? "이동 완료 / 공격 가능" : "가능"}</strong></span>
      <span>보급 <strong>${supply.label}</strong></span>
      <span>보급선 <strong>${formatSupplyDistance(supply)}</strong></span>
      <span>소모 <strong>${spec.supplyUse}/턴</strong></span>
      ${(unit.hqOutTurns ?? 0) ? `<span>두절 지속 <strong>${unit.hqOutTurns}턴</strong></span>` : ""}
      ${hqOutOfRangeMoraleLoss(unit) ? `<span>두절 사기 손실 <strong>-${hqOutOfRangeMoraleLoss(unit)}%</strong></span>` : ""}
      ${supply.level === "cut" ? `<span>다음 턴 붕괴 피해 <strong>${collapseDamageFor({ hqOutTurns: (unit.hqOutTurns ?? 0) + 1 })}</strong></span>` : ""}
      ${unit.type === "battalionHQ" ? `<span>지휘 범위 <strong>${spec.commandRange}</strong></span>` : ""}
      ${unit.type === "battalionHQ" ? `<span>보급권 <strong>${battalionCoverageText(unit)}</strong></span>` : ""}
      ${unit.type === "battalionHQ" && hqScreening ? `<span>엄호 <strong>${isScreenedHQ(unit) ? "받는 중 (직접 피격 불가)" : "없음 (직접 피격 가능)"}</strong></span>` : ""}
      ${hqMoraleBonus(unit) ? `<span>사령부 보너스 <strong>+${hqMoraleBonus(unit)}%</strong></span>` : ""}
    </div>
  `;
}

function renderTileCard(x, y) {
  const tile = tileAt(x, y);
  const base = getBaseAt(x, y);
  const construction = getConstructionAt(x, y);
  const hillDirection = hillDefenseDirection(x, y);
  const improvements = [
    hasImprovement(x, y, "bridge") ? "임시 교량" : null,
    hasImprovement(x, y, "rail") ? "철도" : null,
    hasImprovement(x, y, "depot") ? "보급창고" : null,
  ].filter(Boolean);
  const moveCost = movementCostForTile(x, y);
  const objective = objectiveAt(x, y);
  selectedCardEl.innerHTML = `
    <h2>${displayTileName(x, y)} (${x}, ${y})</h2>
    <div class="unit-stats">
      <span>지형 <strong>${terrainDescription(tile)}</strong></span>
      <span>이동 비용 <strong>${Number.isFinite(moveCost) ? formatNumber(moveCost) : "통과 불가"}</strong></span>
      <span>방어 보정 <strong>+${coverAt(x, y)}</strong></span>
      ${base && baseDefenseBonus ? `<span>거점 엄폐 <strong>+${baseDefenseBonus}</strong></span>` : ""}
      <span>고도 <strong>${formatElevation(tile.elevation)}</strong></span>
      <span>포격 엄폐 <strong>${tile.artilleryCover ? `-${tile.artilleryCover}` : "없음"}</strong></span>
      ${hillDirection ? `<span>방어방향 <strong>${ridgeDirectionLabel(hillDirection)}</strong></span>` : ""}
      <span>특성 <strong>${terrainTraitText(x, y)}</strong></span>
      <span>개량 <strong>${improvements.length ? improvements.join(", ") : "없음"}</strong></span>
      ${base ? `<span>소유 <strong>${sideName(base.owner)}</strong></span>` : ""}
      ${base ? `<span>생산 <strong>${formatNumber(baseProduction(base))}</strong></span>` : ""}
      ${base ? `<span>효율 <strong>${Math.round(base.efficiency * 100)}%</strong></span>` : ""}
      ${base ? `<span>보급권 <strong>${baseCoverageText(base)}</strong></span>` : ""}
      ${construction ? `<span>공사 <strong>${constructionName(construction.type)} ${construction.remaining}턴</strong></span>` : ""}
      ${objective ? `<span>작전 목표 <strong>${sideName(objective.owner)} ${objective.label}</strong></span>` : ""}
      ${objective ? `<span>${objective.kind === "supply" ? "개통" : "장악"} 유지 <strong>${objective.held}/${objectiveHoldRequirement(objective)}턴</strong></span>` : ""}
      ${objective?.kind === "supply" ? `<span>보급선 <strong>${objectiveSupplyText(objective)}</strong></span>` : ""}
    </div>
  `;
}

function terrainDescription(tile) {
  if (tile.className === "coast") return "강변/접근로";
  if (tile.className === "water") return "하천/강";
  if (tile.className === "plain") return "평지";
  if (tile.className === "forest") return "숲";
  if (tile.className === "hill") return "고지/산등성이";
  if (tile.className === "water") return "하천";
  if (tile.className === "base") return "보급 거점";
  return tile.name;
}

function formatElevation(elevation) {
  if (elevation > 0) return `고지 +${elevation}`;
  if (elevation < 0) return `저지 ${elevation}`;
  return "평지";
}

function terrainTraitText(x, y) {
  if (getTerrainKey(x, y) === "C") return "강변 또는 주요 접근로 / 이동 가능";
  if (getTerrainKey(x, y) === "H") return "원거리 포격 차단 / 전차, 자주포 진입 불가";
  if (getTerrainKey(x, y) === "W" && !hasImprovement(x, y, "bridge")) return "하천: 교량 없이는 통과 불가";
  if (getTerrainKey(x, y) === "F") return "방어 유리 / 포격 효과 감소";
  // 거점만 "일반"으로 나오면 지도에서 왜 이 칸을 다투는지가 카드에 한 줄도 안 적힌다.
  if (getTerrainKey(x, y) === "B") {
    const refit = baseRepairRate > 0 ? ` / 소유 시 주둔 부대 병력 +${baseRepairRate}` : "";
    return `시가지 창고: 방어 +2 / 포격 효과 감소 / 전차 진입 가능${refit}`;
  }
  return "일반";
}

function renderCommanderList() {
  const active = [state.commanders.player, state.commanders.enemy];
  commanderListEl.innerHTML = `
    <h2>지휘관 명부</h2>
    ${active
      .map(
        (commander) => `
          <article class="commander-entry">
            <img
              class="commander-photo"
              src="${commanderPhoto(commander)}"
              alt="${commander.name} portrait"
              loading="lazy"
              onerror="replaceCommanderPhoto(this, '${commanderInitials(commander)}', '${commander.side}')"
            />
            <p>
              <strong>${commander.name}</strong>
              <span>${commander.nation} ${commander.rank} / ${commander.trait}</span>
              <span>${commanderStatSummary(commander)}</span>
            </p>
          </article>
        `,
      )
      .join("")}
  `;
}

function commanderPhoto(commander) {
  const photos = {
    patton: "assets/commanders/patton.jpg",
    montgomery: "assets/commanders/montgomery.jpg",
    eisenhower: "assets/commanders/eisenhower.jpg",
    bradley: "assets/commanders/bradley.jpg",
    zhukov: "assets/commanders/zhukov.jpg",
    rokossovsky: "assets/commanders/rokossovsky.jpg",
    slim: "assets/commanders/slim.jpg",
    rommel: "assets/commanders/rommel.jpg",
    guderian: "assets/commanders/guderian.jpg",
    manstein: "assets/commanders/manstein.jpg",
    model: "assets/commanders/model.jpg",
    yamashita: "assets/commanders/yamashita.jpg",
    student: "assets/commanders/student.jpg",
  };
  return photos[commander.id] ?? "";
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
    state.selectedId = clickedUnit.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    render();
    return;
  }

  if (clickedEnemy && (!selected || selected.acted)) {
    playUnitSound(clickedEnemy, "select");
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
    selected.acted = selected.type === "artillery";
    captureBase(selected);
    state.selectedId = selected.acted ? null : selected.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    if (halt) {
      addLog(`${unitLabel(selected)}이 (${stopAt.x}, ${stopAt.y})에서 ${sideUnitLabel(halt.foe)}를 발견했습니다.`);
    }
    addLog(selected.acted ? `${unitLabel(selected)}이 (${stopAt.x}, ${stopAt.y}) 좌표로 기동했습니다.` : `${unitLabel(selected)}이 (${stopAt.x}, ${stopAt.y}) 좌표로 기동했습니다. 아직 공격할 수 있습니다.`);
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
  addLog("배치를 마쳤습니다. 작전을 개시합니다.");
  if (stranded.length) addLog(`경고: ${stranded.length}개 부대가 보급 범위 밖에서 작전을 시작합니다.`);
  render();
}

function inspectTile(x, y) {
  playTerrainSound(x, y);
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
    }
  }
  return { moves, attacks, raids };
}

function recruit(type) {
  if (state.phase !== "player" || state.gameOver) return;
  const hq = selectedBattalionHQ();
  if (!hq) {
    addLog("증원과 투입은 대대사령부를 선택했을 때만 가능합니다.");
    render();
    return;
  }
  const spec = unitTypes[type];
  if (state.resources < spec.cost) return;
  if (type === "battalionHQ" && remainingBattalionHQ("player") <= 0) {
    addLog("이번 작전에 배속된 대대사령부는 이미 모두 투입되었습니다.");
    render();
    return;
  }
  // 전투 정원은 적에게만 있던 제약이었다. 이제 양쪽 다 쥔 거점만큼만 세운다.
  // 공병대와 대대사령부는 정원에서 빠진다 — 짓고 먹이는 부대까지 정원으로 세면
  // 보급선을 늘리는 선택 자체가 벌점이 된다.
  if (isCombatUnit({ type })) {
    const limit = forceLimitFor("player");
    if (combatCountFor("player") >= limit) {
      addLog(`전투 정원 ${limit}개를 모두 채웠습니다. 거점을 더 확보하거나 공병대로 보급창고를 지어야 편제가 늘어납니다.`);
      render();
      return;
    }
  }

  const spawn = findHQSpawn(hq, type);
  if (!spawn) {
    addLog("대대사령부 주변에 증원 가능한 칸이 없습니다.");
    render();
    return;
  }

  state.resources -= spec.cost;
  state.units.push(createUnit("player", type, spawn.x, spawn.y));
  addLog(`${unitLabel("player", type)} 증원이 전선에 도착했습니다.`);
  render();
}

function toggleArtilleryTow() {
  const unit = selectedUnit();
  if (state.phase !== "player" || state.gameOver || unit?.owner !== "player" || unit.type !== "artillery" || unit.acted) return;
  unit.towed = !unit.towed;
  unit.acted = true;
  state.selectedId = null;
  addLog(unit.towed ? "야포대가 트럭에 포를 연결했습니다. 다음 턴에는 빠르게 이동하지만 포격할 수 없습니다." : "야포대가 포를 전개했습니다. 다음 턴부터 포격할 수 있습니다.");
  render();
}

function engineerBuild(type) {
  const engineer = selectedEngineer();
  if (!engineer) return;
  const cost = constructionCosts[type] ?? 0;
  if (state.resources < cost) {
    addLog(`${constructionName(type)} 공사에는 보급품 ${cost}이 필요합니다.`);
    render();
    return;
  }

  if (type === "bridge") {
    const water = neighbors(engineer.x, engineer.y).find((spot) => isBridgeableWater(spot.x, spot.y) && !hasImprovement(spot.x, spot.y, "bridge"));
    if (!water) {
      addLog("공병대 주변에 다리를 놓을 하천이 없습니다.");
      render();
      return;
    }
    state.resources -= cost;
    state.improvements.push({ type: "bridge", owner: engineer.owner, x: water.x, y: water.y });
    engineer.acted = true;
    state.selectedId = null;
    addLog(`공병대가 (${water.x}, ${water.y}) 하천에 임시 교량을 완성했습니다.`);
    render();
    return;
  }

  if (!canStartConstruction(engineer, type)) return;
  const duration = constructionDuration(type);
  state.resources -= cost;
  state.constructions.push({ type, owner: engineer.owner, builderId: engineer.id, x: engineer.x, y: engineer.y, remaining: duration });
  engineer.acted = true;
  state.selectedId = null;
  addLog(`공병대가 (${engineer.x}, ${engineer.y})에서 ${constructionName(type)} 공사를 시작했습니다. ${duration}일이 필요합니다.`);
  // 적 AI는 안전하지 않은 자리를 아예 고르지 않지만, 플레이어는 막지 않고 경고만 한다.
  // 위험을 알면서 최전선에 창고를 미는 것도 하나의 수다 — 다만 모르고 하면 안 된다.
  if (type === "depot" && !isSafeDepotSite(engineer.owner, engineer.x, engineer.y)) {
    addLog("경고: 이 자리는 안전하지 않습니다. 공사 중 공병대는 이동할 수 없어 창고와 공병대를 함께 잃을 수 있습니다.");
  }
  render();
}

function canBuildBridge(engineer) {
  if (state.phase !== "player" || state.gameOver || engineer.acted || engineer.type !== "engineer") return false;
  if (state.resources < constructionCosts.bridge) return false;
  return neighbors(engineer.x, engineer.y).some((spot) => isBridgeableWater(spot.x, spot.y) && !hasImprovement(spot.x, spot.y, "bridge"));
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
  addLog(`${constructionName(construction.type)} 공사가 취소되었습니다.`);
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
      // 총구 화염은 한 턴만 간다. 쏜 자리는 그 턴 동안만 상대에게 드러나고,
      // 다음 턴이 오면 다시 안개 속으로 들어간다 — 이게 "쏘고 옮긴다"를 성립시킨다.
      unit.firedFrom = null;
    }
  });
  replenishNearBattalionHQ("enemy");
  refitOnOwnBase("enemy");
  repairOwnBases("enemy");
  addLog(`${sideName("enemy")}이 반격 작전을 시작합니다.`);
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
  addLog(`${sideName("enemy")}이 ${formatNumber(enemyIncome)} 보급품을 확보했습니다.`);
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
      unit.firedFrom = null;
    }
  });
  replenishNearBattalionHQ("player");
  refitOnOwnBase("player");
  repairOwnBases("player");
  addLog(`${formatNumber(income)} 보급품을 확보했습니다.`);
  render();
}

function advanceConstructions(owner) {
  state.constructions
    .filter((construction) => construction.owner === owner)
    .forEach((construction) => {
      construction.remaining -= 1;
      if (construction.remaining > 0) {
        // 이제 양측이 함께 공사하므로 누구 공사인지 적어야 로그가 읽힌다.
        addLog(`${sideName(construction.owner)} ${constructionName(construction.type)} 공사 완료까지 ${construction.remaining}일 남았습니다.`);
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
  addLog(`${sideName(construction.owner)} ${constructionName(construction.type)} 공사가 완료되었습니다.`);
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

// 전투 정원은 지도에서 나온다. 원래 있던 보급 기지가 기지당 forcePerBase,
// 공병대가 세운 보급창고가 창고당 forcePerDepot. 양 진영에 똑같은 식이 돌아간다.
// 이전에는 적만 상한이 있었고 플레이어는 무제한이었다. 그래서 한쪽은 여섯 기에
// 묶여 보급품을 쌓아만 뒀고, 다른 쪽은 뽑을 수 있는 만큼 뽑았다. 이제 양쪽 다
// "몇 개 거점을 쥐고 있느냐"가 세울 수 있는 부대 수를 정한다 — 거점 하나가
// 생산 숫자 몇 점이 아니라 사단 하나만큼의 값어치가 된다.
// 거점을 전부 잃은 쪽은 정원이 0이라 증원이 끊긴다. 이는 baseLossGraceTurns의
// 붕괴 유예 창과 같은 방향이다 — 땅을 잃으면 군도 잃는다.
function forceLimitFor(owner) {
  const bases = state.bases.filter((base) => base.owner === owner);
  const depots = bases.filter((base) => base.builtByEngineer).length;
  const supplyBases = bases.length - depots;
  return supplyBases * forcePerBase + depots * forcePerDepot;
}

function combatCountFor(owner) {
  return state.units.filter((unit) => unit.owner === owner && isCombatUnit(unit)).length;
}

function forceIsFull(owner) {
  return combatCountFor(owner) >= forceLimitFor(owner);
}

// 정원은 화면에 있어야 규칙이다. 안 보이면 그냥 버튼이 안 눌리는 버그로 읽힌다.
function forceDisplay(owner) {
  return `${combatCountFor(owner)} / ${forceLimitFor(owner)}`;
}

// 지금 무엇이 모자란가. 편성비에서 가장 크게 벌어진 병종을 부른다.
// 여유가 있으면 같은 값일 때 비싼 쪽을 고른다 — 보급품 137을 깔고 앉아
// 3원짜리 보병만 부르던 것이 후반이 무너지던 이유였다.
function enemyRecruitChoice(combat, limit, flush) {
  const mix = enemyForceMix[enemyPosture()] ?? enemyForceMix.attack;
  let best = null;
  Object.entries(mix).forEach(([type, share]) => {
    const cost = unitTypes[type]?.cost ?? Infinity;
    if (state.enemyResources < cost) return;
    if (!findSpawn("enemy", type)) return;
    const have = combat.filter((unit) => unit.type === type).length;
    const shortfall = share * limit - have;
    // 여유가 없으면 모자란 병종만 본다. 여유가 있으면 정원이 빈 만큼은 채운다.
    if (shortfall <= 0 && !flush) return;
    const score = shortfall * 10 + (flush ? cost : 0);
    if (!best || score > best.score) best = { type, score };
  });
  return best?.type ?? null;
}

function maybeEnemyRecruit() {
  // 격턴 제한은 자원이 빠듯할 때의 절약책이다. 창고가 늘어 보급품이 쌓이는데도
  // 이 제한을 지키면 적은 돈을 쌓아두고 굶는다.
  // 사령부가 없으면 증원도 없다. 플레이어와 같은 규칙이다. 한 번만 적어 준다 —
  // 매 턴 적으면 로그가 같은 문장으로 도배된다.
  if (!battalionHQs("enemy").length) {
    if (!state.enemyRecruitHalted) {
      state.enemyRecruitHalted = true;
      addLog(`${sideName("enemy")} 대대 사령부가 사라져 예비대 편성이 중단되었습니다.`);
    }
    return;
  }
  state.enemyRecruitHalted = false;

  const flush = state.enemyResources >= enemyRecruitSurplus;
  if (!flush && state.turn % 2 !== 0) return;

  // 공병대를 먼저 본다. 경제를 키우는 부대가 전투 정원에 밀려 영영 안 나오면
  // 적 생산은 첫 턴 그대로 굳는다.
  if (maybeEnemyRecruitEngineer()) return;

  const combat = state.units.filter((unit) => unit.owner === "enemy" && isCombatUnit(unit));
  const limit = forceLimitFor("enemy");
  if (combat.length >= limit) return;

  const type = enemyRecruitChoice(combat, limit, flush);
  if (!type) {
    // 고를 것이 없는 이유가 돈이면 그렇게 적는다. 자리가 없어서라면 조용히 넘긴다.
    const mix = enemyForceMix[enemyPosture()] ?? enemyForceMix.attack;
    const cheapest = Math.min(...Object.keys(mix).map((key) => unitTypes[key]?.cost ?? Infinity));
    if (state.enemyResources < cheapest) addLog(`${sideName("enemy")} 보급 부족으로 예비대 투입이 지연되었습니다.`);
    return;
  }
  const spawn = findSpawn("enemy", type);
  if (!spawn) return;
  state.enemyResources -= unitTypes[type].cost;
  state.units.push(createUnit("enemy", type, spawn.x, spawn.y));
  addLog(`${sideUnitLabel("enemy", type)} 예비대가 투입되었습니다.`);
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
  state.units.push(createUnit("enemy", "engineer", spawn.x, spawn.y));
  addLog(`${sideName("enemy")} 공병대가 후방 보급 공사를 위해 투입되었습니다.`);
  return true;
}

function attack(attacker, defender) {
  if (isTowedArtillery(attacker)) {
    addLog("견인 중인 야포대는 포격할 수 없습니다. 포를 전개해야 합니다.");
    return;
  }

  if (ridgeBlocksFire(attacker, defender)) {
    addLog("산등성이가 사선을 가로막아 포격이 효과를 내지 못했습니다.");
    return;
  }

  // 쏘면 드러난다. 안개 속에서 포문을 열면 총구 화염과 포성이 자리를 알려주니,
  // 매복은 한 번뿐이고 그 다음은 자리를 옮겨야 하는 문제가 된다. 자리를 따로 적어 두는
  // 이유는 쏘고 나서 부대가 죽거나 밀려나도 "거기서 쐈다"는 사실은 남아야 하기 때문이다.
  attacker.firedFrom = { x: attacker.x, y: attacker.y };

  const damage = combatDamage(attacker, defender);
  playUnitSound(attacker, "attack");
  defender.hp -= damage;
  defender.hitSinceRefit = true;
  recordCombatEvent(attacker, defender, { damage, killed: defender.hp <= 0 });
  addLog(`${sideUnitLabel(attacker)}가 ${sideUnitLabel(defender)}에 ${damage} 피해를 입혔습니다.`);

  const baseUnderDefender = getBaseAt(defender.x, defender.y);
  if (baseUnderDefender?.owner === defender.owner) damageBaseProduction(baseUnderDefender, attacker, { collateral: true });

  if (defender.hp <= 0) {
    state.units = state.units.filter((unit) => unit.id !== defender.id);
    addLog(`${sideUnitLabel(defender)}가 전투 불능이 되었습니다.`);
    return;
  }

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
      addLog(`${unitLabel(attacker)}는 사거리 밖에서 포격해 반격을 받지 않았습니다.`);
    }
    return;
  }

  // 반격도 사격이다. 되받아친 쪽 역시 자기 자리를 알린다.
  defender.firedFrom = { x: defender.x, y: defender.y };
  const damage = Math.max(1, Math.round(combatDamage(defender, attacker) * counterattackFactor));
  attacker.hp -= damage;
  attacker.hitSinceRefit = true;
  recordCombatEvent(defender, attacker, { damage, killed: attacker.hp <= 0, counter: true });
  addLog(`${sideUnitLabel(defender)}가 반격해 ${unitLabel(attacker)}에 ${damage} 피해를 입혔습니다.`);

  if (attacker.hp <= 0) {
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    addLog(`${sideUnitLabel(attacker)}가 반격으로 전투 불능이 되었습니다.`);
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
  const rawDamage = attackerSpec.attack + heightModifier + commanderAttack + directArtilleryVulnerability + defenderSupplyPenalty - coverAt(defender.x, defender.y) - defenderArmor - artilleryPenalty;
  const moraleAdjusted = rawDamage * (effectiveMorale(attacker) / 100);
  return Math.max(1, Math.round(moraleAdjusted));
}

function raidBase(attacker, base) {
  if (isTowedArtillery(attacker)) {
    addLog("견인 중인 야포대는 보급 거점을 포격할 수 없습니다. 먼저 포를 전개해야 합니다.");
    return;
  }

  if (ridgeBlocksFire(attacker, base)) {
    addLog("산등성이 뒤의 보급 거점은 현재 위치에서 포격할 수 없습니다.");
    return;
  }
  addLog(`${sideUnitLabel(attacker)}가 (${base.x}, ${base.y}) 보급 거점을 공격했습니다.`);
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
  addLog(`${sideName(base.owner)} 보급 거점 생산 효율이 ${Math.round(base.efficiency * 100)}%로 떨어졌습니다.`);

  if (!collateral && isArtilleryUnit(attacker) && applyBaseEfficiencyLoss(base, raidEfficiencyFactor)) {
    addLog(`${unitLabel(attacker)} 포격으로 보급 시설 피해가 한 번 더 누적되었습니다.`);
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
    addLog(`${sideName(owner)} 고립 부대 ${encircled.length}개가 포위 압박으로 ${isolatedAttritionDamage} 피해를 받았습니다.`);
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
    addLog(`${sideName(owner)} 보급 두절 부대 ${collapsing.length}개가 붕괴로 총 ${total} 피해를 받았습니다.`);
  }

  const destroyed = state.units.filter((unit) => unit.owner === owner && unit.hp <= 0);
  if (destroyed.length) {
    destroyed.forEach((unit) => addLog(`${sideUnitLabel(unit)}가 보급 붕괴로 전투 불능이 되었습니다.`));
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

  if (recovered.length) addLog(`${sideName(owner)} 대대사령부가 밀접 부대 ${recovered.length}개의 병력을 1씩 보충했습니다.`);
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

  if (refitted.length) addLog(`${sideName(owner)} 부대 ${refitted.length}개가 보급 거점에서 재편성해 병력을 ${baseRepairRate}씩 회복했습니다.`);
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
  addLog(`${sideName(owner)} 보급 거점 ${mended.length}곳의 복구 작업이 진행되어 생산 효율이 올랐습니다.`);
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
    addLog(`${sideName(unit.owner)}이 (${unit.x}, ${unit.y}) 무주공산 보급 거점을 온전히 접수했습니다. 생산 효율 ${Math.round(base.efficiency * 100)}%.`);
    return;
  }
  // 예전에는 여기서 무조건 raidEfficiencyFactor를 한 번 더 곱했다. 이중청구였다 —
  // 거점을 부순 것은 방금 그 부대를 없앤 공격들이고, 그 값은 attack()의 부수 피해에서
  // 이미 받았다. 점령은 부수는 행위가 아니라 부순 뒤에 들어가 앉는 행위다.
  // 값을 두 번 매기면 뺏은 거점이 껍데기가 되고, 부수기만 하는 쪽이 언제나 이긴다.
  applyBaseEfficiencyLoss(base, captureEfficiencyLoss);
  addLog(`${sideName(unit.owner)}이 (${unit.x}, ${unit.y}) 보급 거점을 장악했습니다. 전투 피해로 생산 효율은 ${Math.round(base.efficiency * 100)}%입니다.`);
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

// 좌표가 있는 목표 전부. AI가 "어디로 가야 하는가"를 물을 때 보는 목록이고,
// 유지 턴이 도는 목표이기도 하다. 점령이든 개통이든 지도 위의 한 점을 두고
// 다투는 것은 같으므로, 자세·축선·초소는 이 목록 하나만 보면 된다.
function objectiveTiles(owner) {
  return objectivesFor(owner).filter((objective) => objective.kind === "seize" || objective.kind === "supply");
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
  if (!Number.isFinite(cost)) return "단절 (도하로 없음)";
  const need = effectiveSupplyRange({ owner: objective.owner });
  return `${formatNumber(cost)} / ${formatNumber(need)}${cost <= need ? " 개통" : " 초과"}`;
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
  return named ? named.label : "";
}

function objectiveHoldRequirement(objective) {
  return objective.holdTurns ?? objectiveHoldTurns;
}

// 좌표 뒤에 조사를 바로 붙이면 "(4, 12)을"처럼 읽히는 대로 틀린다. "지점"으로 끊고 붙인다.
function objectiveName(objective) {
  return `${objective.label} (${objective.x}, ${objective.y}) 지점`;
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
      const what = opened ? `${where}까지 보급선을 열었습니다` : `${where}을 장악했습니다`;
      addLog(`${sideName(owner)}이 ${what}. 유지 ${objective.held}/${need}턴.`);
    } else if (!holding && previous > 0) {
      const what = opened ? `${where}의 보급선이 끊겼습니다` : `${where}의 장악을 잃었습니다`;
      addLog(`${sideName(owner)}${what}. 유지 턴이 초기화됩니다.`);
    }
  });
}

// 달성된 "승리 목표". protect는 승리 목표가 아니라 실패 조건이라 여기서 빠진다.
function completedObjective() {
  return missionObjectives().find((objective) => {
    if (objective.kind === "seize" || objective.kind === "supply") return objective.held >= objectiveHoldRequirement(objective);
    if (objective.kind === "destroy") {
      const prey = objective.owner === "player" ? "enemy" : "player";
      return !state.units.some((unit) => unit.owner === prey && unit.type === objective.targetType);
    }
    return false;
  });
}

// 지켜야 할 대상이 사라졌으면 그 진영이 진다. 승리 목표보다 먼저 본다 —
// 사령부를 잃고서 같은 턴에 목표를 밟았다고 이기는 건 말이 안 된다.
function failedObjective() {
  return missionObjectives().find(
    (objective) => objective.kind === "protect" && taggedUnits(objective.owner, objective.tag).length === 0,
  );
}

function objectiveGoalText(objective) {
  if (objective.kind === "seize") {
    const need = objectiveHoldRequirement(objective);
    const who = objective.byTag ? "지정 부대가 " : "";
    return `${objective.label} (${objective.x}, ${objective.y}) ${who}${need}턴 유지`;
  }
  // 개통 목표는 "가라"가 아니라 "이어라"다. 무엇을 해야 하는지가 이름에 드러나야
  // 플레이어가 부대 대신 공병대를 먼저 움직인다.
  if (objective.kind === "supply") {
    return `${objective.label} (${objective.x}, ${objective.y}) 보급선 개통 ${objectiveHoldRequirement(objective)}턴 유지`;
  }
  // 격파 목표의 이름은 "무엇을"만 적는다. "누구 것을"은 목표 주인이 정하므로 여기서 붙인다.
  if (objective.kind === "destroy") return `${objective.owner === "player" ? "적" : "아군"} ${objective.label} 격파`;
  if (objective.kind === "protect") return `${objective.label} 사수`;
  return objective.label;
}

// 목표 이름은 시나리오가 짓는다. 받침을 코드가 모르면 "사령부을 잃었습니다"가 나온다.
// 한글이 아닌 끝(좌표 괄호 등)은 기존 표기대로 "을"을 쓴다.
function objectParticle(word) {
  const code = String(word).trimEnd().slice(-1).charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return "을";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

function completionMessage(objective) {
  if (objective.kind === "destroy") {
    const target = `${objective.label}${objectParticle(objective.label)}`;
    return objective.owner === "player"
      ? `승리: ${sideName("enemy")} ${target} 격파했습니다.`
      : `패배: ${sideName("enemy")}이 아군 ${target} 격파했습니다.`;
  }
  const where = objectiveName(objective);
  if (objective.kind === "supply") {
    return objective.owner === "player"
      ? `승리: ${where}까지 보급선을 개통했습니다.`
      : `패배: ${sideName("enemy")}이 ${where}까지 보급선을 개통했습니다.`;
  }
  // 점령 목표가 늘 "적 후방 돌파"인 건 아니다(탈출 지점, 교차로…). 목표 이름이 상황을 말하게 둔다.
  return objective.owner === "player"
    ? `승리: ${where}을 확보해 작전 목표를 달성했습니다.`
    : `패배: ${sideName("enemy")}이 ${where}을 확보했습니다.`;
}

function failureMessage(objective) {
  const target = `${objective.label}${objectParticle(objective.label)}`;
  return objective.owner === "player"
    ? `패배: 사수해야 할 ${target} 잃었습니다.`
    : `승리: ${sideName("enemy")}의 ${target} 무너뜨렸습니다.`;
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
  const deadlineTail = outcome === "playerWin" ? " 사수 시 승리" : outcome === "playerLose" ? " 안에 달성 실패 시 패배" : "";
  const deadline = Number.isFinite(limit) ? `작전 기한 ${limit}턴${deadlineTail}` : "작전 기한 없음";
  const mine = objectivesFor("player").map((objective) => `아군: ${objectiveGoalText(objective)}`);
  const theirs = objectivesFor("enemy").map((objective) => `적: ${objectiveGoalText(objective)}`);
  return [deadline, ...mine, ...theirs].join(" · ");
}

function timeoutMessage() {
  const outcome = state.mission?.timeoutOutcome ?? "draw";
  if (outcome === "playerWin") return "승리: 작전 기한이 끝날 때까지 전선을 지켜냈습니다.";
  if (outcome === "playerLose") return "패배: 작전 기한 안에 목표를 달성하지 못했습니다.";
  return "무승부: 작전 기한이 끝나 전선이 교착되었습니다.";
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
  if (left === 5 || left === 3 || left === 1) addLog(`작전 기한까지 ${left}턴 남았습니다.`);
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

  if (!enemyUnits || enemyCollapsed) finishGame("승리: 추축군 전선이 붕괴되었습니다.");
  else if (!playerUnits || playerCollapsed) finishGame("패배: 연합군 교두보를 상실했습니다.");
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
      addLog(`${sideName(owner)}이 보급 거점을 모두 상실했습니다. ${baseLossGraceTurns}턴 안에 되찾지 못하면 전선이 붕괴합니다.`);
    }
  }
  return state.turn - state.baseLossSince[owner] >= baseLossGraceTurns;
}

function finishGame(message) {
  state.gameOver = true;
  bannerEl.textContent = message;
  bannerEl.classList.add("show");
  addLog(message);
}

function baseProduction(base) {
  return base.production * wartimeProductionFactor * base.efficiency;
}

function projectedIncome(owner) {
  return state.bases
    .filter((base) => base.owner === owner)
    .reduce((total, base) => total + baseProduction(base), 0);
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
    return { level: "isolated", via: "none", label: `고립 ${enemyFaces}/4`, cost: supplyLineCost(unit), hqDistance: hqDistanceNow };
  }

  if (hqDistanceNow <= effectiveHQSupplyRange(unit)) {
    return { level: "full", via: "hq", label: "대대 보급", cost: hqDistanceNow, hqDistance: hqDistanceNow };
  }

  const costNow = supplyLineCost(unit);
  if (!Number.isFinite(costNow)) {
    const label = battalionHQs(unit.owner).length ? "보급선 두절" : "사령부 전멸";
    return { level: "cut", via: "none", label, cost: costNow, hqDistance: hqDistanceNow };
  }
  if (unit.type === "battalionHQ") {
    return { level: "full", via: "base", label: "전진 보급", cost: costNow, hqDistance: hqDistanceNow };
  }
  if (costNow <= effectiveSupplyRange(unit)) return { level: "full", via: "base", label: "정상 보급", cost: costNow, hqDistance: hqDistanceNow };
  if (costNow <= effectiveStrainedSupplyRange(unit)) return { level: "strained", via: "base", label: "보급 불안", cost: costNow, hqDistance: hqDistanceNow };
  return { level: "cut", via: "none", label: "보급선 이탈", cost: costNow, hqDistance: hqDistanceNow };
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
  if (supply.via === "hq") return `HQ ${formatNumber(supply.hqDistance)}`;
  return Number.isFinite(supply.cost) ? `거점 ${formatNumber(supply.cost)}` : "단절";
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
  if (!coverage.live) return "보급선 두절 / 발급 불가";
  const bands = [...coverage.field.values()];
  const recovery = bands.filter((band) => band === "recovery").length;
  return `보충 ${recovery}칸 / 보급 ${bands.length}칸`;
}

function baseCoverageText(base) {
  const bands = [...baseCoverage(base).field.values()];
  const normal = bands.filter((band) => band === "supply").length;
  return `정상 ${normal}칸 / 불안 ${bands.length - normal}칸`;
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
  return hasImprovement(x, y, "bridge") && isBridgeableWater(x, y);
}

function isBridgeableWater(x, y) {
  if (getTerrainKey(x, y) !== "W") return false;
  const horizontalBanks = inBounds(x - 1, y) && inBounds(x + 1, y) && getTerrainKey(x - 1, y) !== "W" && getTerrainKey(x + 1, y) !== "W";
  const verticalBanks = inBounds(x, y - 1) && inBounds(x, y + 1) && getTerrainKey(x, y - 1) !== "W" && getTerrainKey(x, y + 1) !== "W";
  return horizontalBanks || verticalBanks;
}

// 사령부 엄호. 사령부는 예하 부대 뒤에 선다 — 인접한 아군 전투부대가 하나라도
// 있으면 직접 사격 대상이 되지 않는다. 호위를 먼저 걷어내야 사령부에 닿는다.
// 이 규칙이 없으면 "고립 사령부 구조"는 미션이 아니라 처형이다. 체력 9짜리
// 사령부에 네 부대가 화력을 모으면 플레이어가 손도 대기 전에 첫 턴에 끝난다.
// 부수 효과도 의도한 것이다: 사령부 사냥이 "호위를 뚫는 작전"이 되고,
// 보급의 중심인 사령부를 앞에 세우면 안 된다는 압력이 양쪽에 똑같이 걸린다.
// 에디터에서 0으로 두면 규칙이 꺼져 예전처럼 사령부를 바로 칠 수 있다.
function isScreenedHQ(unit) {
  if (!hqScreening || unit.type !== "battalionHQ") return false;
  return neighbors(unit.x, unit.y).some((spot) =>
    getUnitsAt(spot.x, spot.y).some((other) => other.owner === unit.owner && other.type !== "battalionHQ"),
  );
}

function canAttack(attacker, defender) {
  if (!attacker || !defender || attacker.owner === defender.owner) return false;
  if (isScreenedHQ(defender)) return false;
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

function canRaidBase(attacker, base) {
  if (!attacker || !base || attacker.owner === base.owner) return false;
  if (attacker.type === "artillery" && attacker.moved) return false;
  if (isTowedArtillery(attacker)) return false;
  if (supplyStatus(attacker).level === "isolated") return false;
  return distance(attacker, base) <= unitTypes[attacker.type].range && !ridgeBlocksFire(attacker, base);
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
  const mine = objectivesFor("enemy");
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
  // key는 화면에 찍히는 이름(label)과 달리 계획을 잇는 손잡이다. 전방 자리는 적이
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
    addLog(`${sideUnitLabel(gun)}가 포를 트럭에 걸었습니다.`);
    return true;
  }
  if (gun.towed && (threat <= enemyTowDistance || posted)) {
    gun.towed = false;
    gun.acted = true;
    addLog(`${sideUnitLabel(gun)}가 포를 전개했습니다.`);
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
  // 사냥감이 엄호를 받고 있으면 사냥감 자체는 못 친다. 그럴 때 아무나 치면
  // 사냥이 흐지부지된다(사령부 사냥이 무승부로 끝나던 이유). 엄호하는 부대를
  // 표적으로 승격시켜, 호위를 걷어내는 것이 곧 사냥이 되게 한다.
  const screens = prey
    .filter((target) => isScreenedHQ(target))
    .flatMap((target) => neighbors(target.x, target.y).flatMap((spot) => getUnitsAt(spot.x, spot.y)))
    .filter((guard) => guard.owner !== unit.owner && unitVisibleTo(guard, unit.owner));
  let best = null;
  visibleFoes(unit.owner).forEach((foe) => {
    if (attackIsSuicidal(unit, foe)) return;
    const forecast = attackForecast(unit, foe);
    if (!forecast) return;
    let score = forecast.damage - forecast.counter;
    if (forecast.kills) score += 8;
    if (prey.includes(foe)) score += 12; // 미션이 지목한 사냥감
    if (screens.includes(foe)) score += 10; // 사냥감을 가린 호위 — 이걸 걷어내야 닿는다
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
  return false;
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
  addLog(`${sideUnitLabel(unit)}가 ${postureVerb(unit)}했습니다.`);
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
      if (!isBridgeableWater(x, y) || hasImprovement(x, y, "bridge")) continue;
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
  const cost = constructionCosts.bridge ?? 0;
  if (state.enemyResources < cost) return false;

  state.enemyResources -= cost;
  state.improvements.push({ type: "bridge", owner: engineer.owner, x: site.x, y: site.y });
  engineer.acted = true;
  // 지형이 바뀌었으니 어제 그린 길은 이제 거짓말이다.
  clearRouteFields();
  addLog(`${sideName("enemy")} 공병대가 (${site.x}, ${site.y}) 하천에 임시 교량을 완성했습니다.`);
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
  addLog(`${sideName("enemy")} 공병대가 (${site.x}, ${site.y})에서 철도 부설을 시작했습니다.`);
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
  addLog(`${sideName("enemy")} 공병대가 (${engineer.x}, ${engineer.y})에서 보급창고 공사를 시작했습니다.`);
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
        ? `${sideName("enemy")} 대대 사령부가 주력을 따라 전진해 보급 범위를 옮겼습니다.`
        : `${sideName("enemy")} 대대 사령부가 호위 부대 뒤로 신중하게 위치를 조정했습니다.`,
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

function findHQSpawn(hq, type) {
  const probe = { owner: hq.owner, type };
  const candidates = [hq, ...neighbors(hq.x, hq.y)];
  return candidates.find((spot) => canOccupy(probe, spot.x, spot.y));
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

function getTerrainKey(x, y) {
  return terrainMap[y][x];
}

function tileAt(x, y) {
  return terrain[getTerrainKey(x, y)];
}

// 그 칸에 서면 실제로 깎이는 피해량. 지형 엄폐 + 거점 버프다.
// 전투 계산과 AI의 자리 고르기가 이 함수 하나만 보게 해야 한다 — 따로 세면
// AI는 거점을 그냥 개활지로 읽고, 방어할 만한 자리를 지나쳐 들판에 선다.
function coverAt(x, y) {
  return tileAt(x, y).defense + (getBaseAt(x, y) ? baseDefenseBonus : 0);
}

function displayTileName(x, y) {
  if (getTerrainKey(x, y) === "W" && hasImprovement(x, y, "bridge")) return "임시 교량";
  if (hasImprovement(x, y, "rail")) return `${tileAt(x, y).name} / 철도`;
  return tileAt(x, y).name;
}

function hillDefenseDirection(x, y) {
  if (getTerrainKey(x, y) !== "H") return "";
  return hillDefenseMap[y]?.[x]?.toLowerCase() === "." ? "" : hillDefenseMap[y]?.[x]?.toLowerCase() ?? "";
}

function ridgeDirectionLabel(direction) {
  return {
    n: "북쪽",
    e: "동쪽",
    s: "남쪽",
    w: "서쪽",
  }[direction] ?? "지정 없음";
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
  return type === "depot" ? "보급창고" : "철도";
}

function constructionLabel(type) {
  return constructionName(type).slice(0, 1);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 12);
}

loadSavedDefaultBalance();
startGame();
