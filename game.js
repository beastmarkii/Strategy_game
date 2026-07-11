const width = 20;
const height = 16;
let wartimeProductionFactor = 0.5;
let raidEfficiencyFactor = 0.7;
let maxStackSize = 3;
let supplyRange = 6;
let strainedSupplyRange = 9;
let strainedSupplyMoralePenalty = 15;
let isolatedSupplyMoralePenalty = 35;
let isolatedAttritionDamage = 1;
let hqSupplyRange = 3;
let hqRecoveryRange = 1;
let hqOutOfRangeGraceTurns = 1;
let hqOutOfRangeMoralePenalty = 10;
const episodeLimits = {
  playerBattalionHQ: 1,
  enemyBattalionHQ: 1,
};
const mapConfig = {
  enabled: true,
  centerLat: 49.18,
  centerLon: -0.36,
  zoom: 10,
  radius: 2,
};

const terrainMap = [
  "WWWWWWWWWWWWWWCCBBPP",
  "WWWWWWWWWWWWWWCCBBPP",
  "WWWWWWWWWWWWWWWWCCPP",
  "WWWWWWWWWWWWWWWWCCPP",
  "WWWWWWWWWWWWWWWWCCPP",
  "WWWWWWWWWWWWWWWWCCPP",
  "BBCCCCCCCCCCCCCCPPBB",
  "BBCCCCCCCCCCCCCCPPBB",
  "PPPPPPPPPPPPPPPPPPPP",
  "PPPPPPPPPPPPPPPPPPPP",
  "PPFFFFPPPPHHFFFFPPPP",
  "PPFFFFPPPPHHFFFFPPPP",
  "PPPPPPPPPPPPPPHHPPPP",
  "PPPPPPPPPPPPPPHHPPPP",
  "PPBBPPPPPPPPHHPPPPPP",
  "PPBBPPPPPPPPHHPPPPPP",
];

const unitTypes = {
  infantry: { label: "소총분대", mark: "보", hp: 10, move: 3, range: 1, attack: 4, cost: 3, supplyUse: 1 },
  armor: { label: "중형전차", mark: "전", hp: 14, move: 4, range: 1, attack: 6, cost: 5, supplyUse: 2 },
  artillery: { label: "야포대", mark: "포", hp: 8, move: 1, towedMove: 4, range: 3, attack: 5, cost: 6, supplyUse: 2 },
  spArtillery: { label: "자주포", mark: "자", hp: 10, move: 4, range: 3, attack: 5, cost: 300, supplyUse: 4 },
  engineer: { label: "공병대", mark: "공", hp: 12, move: 4, range: 1, attack: 3, cost: 4, supplyUse: 1 },
  battalionHQ: { label: "대대 사령부", mark: "지", hp: 9, move: 1, range: 1, attack: 1, cost: 6, supplyUse: 1, moraleAura: 10, commandRange: 2, supplyRange: hqSupplyRange, recoveryRange: hqRecoveryRange },
};

const defaultBalance = {
  rules: {
    wartimeProductionFactor,
    raidEfficiencyFactor,
    maxStackSize,
    supplyRange,
    strainedSupplyRange,
    strainedSupplyMoralePenalty,
    isolatedSupplyMoralePenalty,
    isolatedAttritionDamage,
    hqSupplyRange,
    hqRecoveryRange,
    hqOutOfRangeGraceTurns,
    hqOutOfRangeMoralePenalty,
    playerBattalionHQ: episodeLimits.playerBattalionHQ,
    enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
  },
  units: JSON.parse(JSON.stringify(unitTypes)),
};

const unitEditorFields = [
  ["hp", "체력", 1, 99, 1],
  ["move", "기동", 0, 12, 1],
  ["range", "사거리", 1, 8, 1],
  ["attack", "공격", 0, 30, 1],
  ["cost", "비용", 0, 999, 1],
  ["supplyUse", "소모", 0, 20, 1],
  ["towedMove", "견인", 0, 12, 1],
  ["moraleAura", "사기+", 0, 50, 1],
  ["commandRange", "지휘", 0, 8, 1],
];

const ruleEditorFields = [
  ["wartimeProductionFactor", "전시 생산 배율", 0, 2, 0.1],
  ["raidEfficiencyFactor", "공격받은 생산 잔존율", 0.1, 1, 0.05],
  ["maxStackSize", "동종 최대 중첩", 1, 9, 1],
  ["supplyRange", "기본 정상 보급선", 1, 20, 1],
  ["strainedSupplyRange", "기본 불안 보급선", 1, 30, 1],
  ["strainedSupplyMoralePenalty", "보급 불안 사기 감소", 0, 80, 5],
  ["isolatedSupplyMoralePenalty", "고립 사기 감소", 0, 100, 5],
  ["isolatedAttritionDamage", "고립 턴 피해", 0, 10, 1],
  ["hqSupplyRange", "대대 HQ 보급 범위", 0, 12, 1],
  ["hqRecoveryRange", "대대 HQ 보충 범위", 0, 6, 1],
  ["hqOutOfRangeGraceTurns", "HQ 밖 유예 턴", 0, 10, 1],
  ["hqOutOfRangeMoralePenalty", "HQ 밖 턴당 사기 감소", 0, 50, 1],
  ["playerBattalionHQ", "연합군 HQ 한도", 0, 9, 1],
  ["enemyBattalionHQ", "추축군 HQ 한도", 0, 9, 1],
];

const terrain = {
  P: { name: "개활지", className: "plain", cost: 1, defense: 0, elevation: 0, artilleryCover: 0 },
  C: { name: "해안", className: "coast", cost: 1, defense: 0, elevation: 0, artilleryCover: 0 },
  F: { name: "삼림", className: "forest", cost: 2, defense: 1, elevation: 0, artilleryCover: 1 },
  H: { name: "고지/산등성이", className: "hill", cost: 1, defense: 2, elevation: 2, artilleryCover: 2 },
  W: { name: "바다/수역", className: "water", cost: Infinity, defense: 0, elevation: -1, artilleryCover: 0 },
  B: { name: "보급 거점", className: "base", cost: 1, defense: 1, elevation: 0, artilleryCover: 1 },
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
      C: "Coast",
      F: "Forest",
      H: "Ridge/High Ground",
      W: "Sea/Water",
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
      W: "海面/水域",
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
      W: "海/水域",
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
  { id: "patton", side: "Allies", name: "George S. Patton", nation: "미국", rank: "대장", trait: "기갑 돌파", morale: 8, attack: 1, defense: 0, stackMorale: 4 },
  { id: "montgomery", side: "Allies", name: "Bernard Montgomery", nation: "영국", rank: "원수", trait: "신중한 준비", morale: 6, attack: 0, defense: 1, stackMorale: 6 },
  { id: "eisenhower", side: "Allies", name: "Dwight D. Eisenhower", nation: "미국", rank: "대장", trait: "연합 지휘", morale: 7, attack: 0, defense: 0, stackMorale: 8 },
  { id: "bradley", side: "Allies", name: "Omar Bradley", nation: "미국", rank: "대장", trait: "보병 운용", morale: 5, attack: 0, defense: 1, stackMorale: 5 },
  { id: "zhukov", side: "Allies", name: "Georgy Zhukov", nation: "소련", rank: "원수", trait: "대규모 공세", morale: 9, attack: 1, defense: 0, stackMorale: 3 },
  { id: "rokossovsky", side: "Allies", name: "Konstantin Rokossovsky", nation: "소련", rank: "원수", trait: "기동 포위", morale: 7, attack: 1, defense: 1, stackMorale: 5 },
  { id: "slim", side: "Allies", name: "William Slim", nation: "영국", rank: "원수", trait: "악지 작전", morale: 8, attack: 0, defense: 1, stackMorale: 7 },
  { id: "rommel", side: "Axis", name: "Erwin Rommel", nation: "독일", rank: "원수", trait: "기동 방어", morale: 8, attack: 1, defense: 1, stackMorale: 5 },
  { id: "guderian", side: "Axis", name: "Heinz Guderian", nation: "독일", rank: "상급대장", trait: "전차 집중", morale: 7, attack: 1, defense: 0, stackMorale: 4 },
  { id: "manstein", side: "Axis", name: "Erich von Manstein", nation: "독일", rank: "원수", trait: "작전 기동", morale: 7, attack: 1, defense: 1, stackMorale: 4 },
  { id: "model", side: "Axis", name: "Walter Model", nation: "독일", rank: "원수", trait: "방어전", morale: 6, attack: 0, defense: 2, stackMorale: 5 },
  { id: "yamashita", side: "Axis", name: "Tomoyuki Yamashita", nation: "일본", rank: "대장", trait: "정글 기동", morale: 7, attack: 0, defense: 1, stackMorale: 6 },
  { id: "student", side: "Axis", name: "Kurt Student", nation: "독일", rank: "상급대장", trait: "공수 작전", morale: 5, attack: 1, defense: 0, stackMorale: 4 },
];

let state;
let pendingUnitMoves = [];
let pendingCombatEvents = [];

const boardEl = document.querySelector("#battlefield");
const logEl = document.querySelector("#battleLog");
const selectedCardEl = document.querySelector("#selectedCard");
const commanderListEl = document.querySelector("#commanderList");
const turnLabelEl = document.querySelector("#turnLabel");
const phaseLabelEl = document.querySelector("#phaseLabel");
const resourceLabelEl = document.querySelector("#resourceLabel");
const baseLabelEl = document.querySelector("#baseLabel");
const balanceEditorEl = document.querySelector("#balanceEditor");
const bannerEl = document.createElement("div");
bannerEl.className = "banner";
document.body.appendChild(bannerEl);

document.querySelector("#endTurn").addEventListener("click", endPlayerTurn);
document.querySelector("#restart").addEventListener("click", startGame);
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

  setButtonText("#recruitInfantry", `${unitTypes.infantry.label} ${activePack.buttons.recruit}`);
  setButtonText("#recruitArmor", `${unitTypes.armor.label} ${activePack.buttons.deploy}`);
  setButtonText("#recruitArtillery", `${unitTypes.artillery.label} ${activePack.buttons.deploy}`);
  setButtonText("#recruitSpArtillery", `${unitTypes.spArtillery.label} ${activePack.buttons.deploy}`);
  setButtonText("#recruitEngineer", `${unitTypes.engineer.label} ${activePack.buttons.deploy}`);
  setButtonText("#recruitBattalionHQ", `${unitTypes.battalionHQ.label} ${activePack.buttons.deploy}`);
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
      <span><i class="terrain water"></i>${terrain.W.name}</span>
      <span><i class="terrain coast"></i>${terrain.C.name}</span>
      <span><i class="terrain forest"></i>${terrain.F.name}</span>
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
  const editorButtons = balanceEditorEl?.querySelectorAll("[data-editor-action]");
  if (editorButtons?.[0]) editorButtons[0].textContent = activeLocale === "en" ? "Restore Defaults" : activeLocale === "zh" ? "恢复默认" : "初期値に戻す";
  if (editorButtons?.[1]) editorButtons[1].textContent = activeLocale === "en" ? "Apply Values & Restart" : activeLocale === "zh" ? "应用数值并重开" : "数値を適用して新作戦";
}

function startGame() {
  applyLocale();
  pendingUnitMoves = [];
  pendingCombatEvents = [];
  state = {
    turn: 1,
    phase: "player",
    resources: 8,
    enemyResources: 8,
    selectedId: null,
    inspectedId: null,
    inspectedTile: null,
    gameOver: false,
    commanders: {
      player: commanders.find((commander) => commander.id === "patton"),
      enemy: commanders.find((commander) => commander.id === "rommel"),
    },
    bases: [
      createBase(16, 0, "enemy", 6),
      createBase(0, 6, "player", 6),
      createBase(18, 6, "enemy", 5),
      createBase(2, 14, "player", 5),
    ],
    improvements: [],
    constructions: [],
    units: [
      createUnit("player", "infantry", 2, 12),
      createUnit("player", "armor", 4, 14),
      createUnit("player", "artillery", 0, 8),
      createUnit("player", "engineer", 2, 14),
      createUnit("player", "battalionHQ", 0, 6),
      createUnit("enemy", "infantry", 16, 2),
      createUnit("enemy", "armor", 14, 0),
      createUnit("enemy", "artillery", 18, 8),
      createUnit("enemy", "battalionHQ", 18, 6),
    ],
    log: [],
  };
  bannerEl.classList.remove("show");
  addLog("공병대가 전선에 배치되었습니다. 다리는 하루 안에 놓지만, 보급창고와 철도는 며칠의 공사가 필요합니다.");
  addLog("공병대는 보병보다 빠르고 튼튼하지만 직접 전투력은 소총분대의 약 80% 수준입니다.");
  renderBalanceEditor();
  render();
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
      if (hasImprovement(x, y, "bridge")) cell.classList.add("bridge");
      if (hasImprovement(x, y, "rail")) cell.classList.add("rail");
      if (hasImprovement(x, y, "depot")) cell.classList.add("depot");
      if (highlights.moves.has(posKey(x, y))) cell.classList.add("reachable");
      if (highlights.attacks.has(posKey(x, y))) cell.classList.add("attackable");
      if (highlights.raids.has(posKey(x, y))) cell.classList.add("raidable");
      if (selectedUnit()?.x === x && selectedUnit()?.y === y) cell.classList.add("selected");
      cell.addEventListener("click", () => handleTileClick(x, y));

      const base = getBaseAt(x, y);
      if (base) renderBase(cell, base);

      renderImprovements(cell, x, y);

      const construction = getConstructionAt(x, y);
      if (construction) renderConstruction(cell, construction);

      const units = getUnitsAt(x, y);
      if (units.length) renderUnitStack(cell, units);

      boardEl.appendChild(cell);
    }
  }

  updatePanel();
  localizeRenderedText();
  playUnitMoveAnimations();
  playCombatAnimations();
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
  const mark = document.createElement("span");
  mark.className = `owner-mark ${base.owner}`;
  cell.appendChild(mark);

  const supply = document.createElement("span");
  supply.className = "supply-rate";
  supply.textContent = formatNumber(baseProduction(base));
  cell.appendChild(supply);
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
  const unitEl = document.createElement("div");
  unitEl.className = `unit ${unit.owner} ${unit.type} supply-${supply.level} ${unit.towed ? "towed" : ""} ${unit.acted ? "waited" : ""}`;
  unitEl.dataset.unitId = unit.id;
  unitEl.setAttribute("aria-label", `${sideName(unit.owner)} ${unitTypes[unit.type].label} / ${supply.label}`);
  unitEl.title = `${sideName(unit.owner)} ${unitTypes[unit.type].label} / ${supply.label}`;
  const icon = document.createElement("span");
  icon.className = `unit-icon ${unit.type}`;
  unitEl.appendChild(icon);
  const hp = document.createElement("span");
  hp.className = "hp";
  hp.textContent = unit.hp;
  unitEl.appendChild(hp);
  if (units.length > 1) {
    const stack = document.createElement("span");
    stack.className = "stack-count";
    stack.textContent = `x${units.length}`;
    unitEl.appendChild(stack);
  }
  cell.appendChild(unitEl);
}

function recordUnitMove(unit, toX, toY) {
  if (unit.x === toX && unit.y === toY) return;
  pendingUnitMoves.push({
    id: unit.id,
    fromX: unit.x,
    fromY: unit.y,
    toX,
    toY,
  });
}

function playUnitMoveAnimations() {
  if (!pendingUnitMoves.length) return;
  const moves = pendingUnitMoves;
  pendingUnitMoves = [];

  window.requestAnimationFrame(() => {
    moves.forEach((move) => {
      const unitEl = Array.from(boardEl.querySelectorAll(".unit")).find((element) => element.dataset.unitId === move.id);
      const fromTile = tileElementAt(move.fromX, move.fromY);
      const toTile = tileElementAt(move.toX, move.toY);
      if (!unitEl || !fromTile || !toTile) return;

      const fromRect = fromTile.getBoundingClientRect();
      const toRect = toTile.getBoundingClientRect();
      unitEl.style.setProperty("--move-x", `${fromRect.left - toRect.left}px`);
      unitEl.style.setProperty("--move-y", `${fromRect.top - toRect.top}px`);
      unitEl.classList.add("unit-moving");
    });
  });
}

function tileElementAt(x, y) {
  return boardEl.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
}

function recordCombatEvent(attacker, target, options = {}) {
  pendingCombatEvents.push({
    attackerId: attacker.id,
    attackerX: attacker.x,
    attackerY: attacker.y,
    targetId: target.id ?? null,
    targetX: target.x,
    targetY: target.y,
    artillery: isArtilleryUnit(attacker),
    killed: Boolean(options.killed),
    damage: options.damage ?? null,
    base: Boolean(options.base),
  });
}

function playCombatAnimations() {
  if (!pendingCombatEvents.length) return;
  const events = pendingCombatEvents;
  pendingCombatEvents = [];

  window.requestAnimationFrame(() => {
    events.forEach((event) => {
      const attackerEl = event.attackerId ? Array.from(boardEl.querySelectorAll(".unit")).find((element) => element.dataset.unitId === event.attackerId) : null;
      const defenderEl = event.targetId ? Array.from(boardEl.querySelectorAll(".unit")).find((element) => element.dataset.unitId === event.targetId) : null;
      const fromTile = tileElementAt(event.attackerX, event.attackerY);
      const toTile = tileElementAt(event.targetX, event.targetY);
      if (!fromTile || !toTile) return;

      if (attackerEl) attackerEl.classList.add(event.artillery ? "unit-firing" : "unit-striking");
      if (defenderEl) defenderEl.classList.add(event.killed ? "unit-destroyed" : "unit-hit");

      spawnCombatLine(fromTile, toTile, event.artillery);
      spawnCombatBurst(toTile, event);
    });
  });
}

function spawnCombatLine(fromTile, toTile, artillery) {
  const boardRect = boardEl.getBoundingClientRect();
  const fromRect = fromTile.getBoundingClientRect();
  const toRect = toTile.getBoundingClientRect();
  const fromX = fromRect.left + fromRect.width / 2 - boardRect.left;
  const fromY = fromRect.top + fromRect.height / 2 - boardRect.top;
  const toX = toRect.left + toRect.width / 2 - boardRect.left;
  const toY = toRect.top + toRect.height / 2 - boardRect.top;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const line = document.createElement("span");
  line.className = `combat-line ${artillery ? "shell" : "strike"}`;
  line.style.left = `${fromX}px`;
  line.style.top = `${fromY}px`;
  line.style.width = `${Math.hypot(dx, dy)}px`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  boardEl.appendChild(line);
  window.setTimeout(() => line.remove(), artillery ? 620 : 420);
}

function spawnCombatBurst(tile, event) {
  const burst = document.createElement("span");
  burst.className = `combat-burst ${event.artillery ? "shell" : "impact"} ${event.killed ? "destroyed" : ""} ${event.base ? "base-hit" : ""}`;
  if (event.damage !== null) burst.dataset.damage = `-${event.damage}`;
  tile.appendChild(burst);
  window.setTimeout(() => burst.remove(), event.killed ? 760 : 620);
}

function renderBalanceEditor() {
  if (!balanceEditorEl) return;
  balanceEditorEl.innerHTML = `
    <div class="editor-actions">
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
  if (button.dataset.editorAction === "restart") startGame();
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

function ruleValue(key) {
  const values = {
    wartimeProductionFactor,
    raidEfficiencyFactor,
    maxStackSize,
    supplyRange,
    strainedSupplyRange,
    strainedSupplyMoralePenalty,
    isolatedSupplyMoralePenalty,
    isolatedAttritionDamage,
    hqSupplyRange,
    hqRecoveryRange,
    hqOutOfRangeGraceTurns,
    hqOutOfRangeMoralePenalty,
    playerBattalionHQ: episodeLimits.playerBattalionHQ,
    enemyBattalionHQ: episodeLimits.enemyBattalionHQ,
  };
  return values[key];
}

function setRuleValue(key, value) {
  if (key === "wartimeProductionFactor") wartimeProductionFactor = value;
  if (key === "raidEfficiencyFactor") raidEfficiencyFactor = value;
  if (key === "maxStackSize") maxStackSize = value;
  if (key === "supplyRange") supplyRange = value;
  if (key === "strainedSupplyRange") strainedSupplyRange = value;
  if (key === "strainedSupplyMoralePenalty") strainedSupplyMoralePenalty = value;
  if (key === "isolatedSupplyMoralePenalty") isolatedSupplyMoralePenalty = value;
  if (key === "isolatedAttritionDamage") isolatedAttritionDamage = value;
  if (key === "hqSupplyRange") hqSupplyRange = value;
  if (key === "hqRecoveryRange") hqRecoveryRange = value;
  if (key === "hqOutOfRangeGraceTurns") hqOutOfRangeGraceTurns = value;
  if (key === "hqOutOfRangeMoralePenalty") hqOutOfRangeMoralePenalty = value;
  if (key === "playerBattalionHQ") episodeLimits.playerBattalionHQ = value;
  if (key === "enemyBattalionHQ") episodeLimits.enemyBattalionHQ = value;
  unitTypes.battalionHQ.supplyRange = hqSupplyRange;
  unitTypes.battalionHQ.recoveryRange = hqRecoveryRange;
}

function updatePanel() {
  turnLabelEl.textContent = state.turn;
  phaseLabelEl.textContent = state.phase === "player" ? "연합군" : "추축군";
  resourceLabelEl.textContent = formatNumber(state.resources);
  baseLabelEl.textContent = formatNumber(projectedIncome("player"));
  renderSelectedCard();
  renderCommanderList();

  logEl.innerHTML = state.log.map((item) => `<p>${item}</p>`).join("");
  syncRecruitButtonCosts();
  updateActionPanel();
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
  document.querySelector("#endTurn").disabled = state.phase !== "player" || state.gameOver;

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
    engineer: ["#buildBridge", "#buildDepot", "#buildRail"],
    artillery: ["#toggleTow"],
  };

  Object.values(groups).flat().forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) element.hidden = true;
  });

  if (isHQ) groups.hq.forEach((selector) => setActionVisible(selector, true));
  if (isEngineer) groups.engineer.forEach((selector) => setActionVisible(selector, true));
  if (isArtillery) groups.artillery.forEach((selector) => setActionVisible(selector, true));

  const hint = document.querySelector("#actionHint");
  if (!hint) return;
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
  const stack = getUnitsAt(unit.x, unit.y).filter((other) => other.owner === unit.owner && other.type === unit.type);
  const supply = supplyStatus(unit);
  selectedCardEl.innerHTML = `
    <h2>${sideName(unit.owner)} ${spec.label}</h2>
    <div class="unit-stats">
      <span>전투력 <strong>${unit.hp}/${spec.hp}</strong></span>
      <span>기동력 <strong>${effectiveMove(unit)}</strong></span>
      <span>사거리 <strong>${spec.range}</strong></span>
      <span>사기 <strong>${effectiveMorale(unit)}%</strong></span>
      <span>중첩 <strong>${stack.length}/${maxStackSize}</strong></span>
      <span>지휘관 <strong>${commanderFor(unit.owner).name.split(" ").at(-1)}</strong></span>
      ${unit.type === "artillery" ? `<span>상태 <strong>${unit.towed ? "견인" : "전개"}</strong></span>` : ""}
      <span>행동 <strong>${unit.acted ? "완료" : unit.moved ? "이동 완료 / 공격 가능" : "가능"}</strong></span>
      <span>보급 <strong>${supply.label}</strong></span>
      <span>보급선 <strong>${formatSupplyDistance(supply)}</strong></span>
      <span>소모 <strong>${spec.supplyUse}/턴</strong></span>
      ${unit.type !== "battalionHQ" ? `<span>HQ 밖 <strong>${unit.hqOutTurns ?? 0}턴</strong></span>` : ""}
      ${hqOutOfRangeMoraleLoss(unit) ? `<span>HQ 사기 손실 <strong>-${hqOutOfRangeMoraleLoss(unit)}%</strong></span>` : ""}
      ${unit.type === "battalionHQ" ? `<span>지휘 범위 <strong>${spec.commandRange}</strong></span>` : ""}
      ${hqMoraleBonus(unit) ? `<span>사령부 보너스 <strong>+${hqMoraleBonus(unit)}%</strong></span>` : ""}
    </div>
  `;
}

function renderTileCard(x, y) {
  const tile = tileAt(x, y);
  const base = getBaseAt(x, y);
  const construction = getConstructionAt(x, y);
  const improvements = [
    hasImprovement(x, y, "bridge") ? "임시 교량" : null,
    hasImprovement(x, y, "rail") ? "철도" : null,
    hasImprovement(x, y, "depot") ? "보급창고" : null,
  ].filter(Boolean);
  const moveCost = movementCostForTile(x, y);
  selectedCardEl.innerHTML = `
    <h2>${displayTileName(x, y)} (${x}, ${y})</h2>
    <div class="unit-stats">
      <span>지형 <strong>${terrainDescription(tile)}</strong></span>
      <span>이동 비용 <strong>${Number.isFinite(moveCost) ? formatNumber(moveCost) : "통과 불가"}</strong></span>
      <span>방어 보정 <strong>+${tile.defense}</strong></span>
      <span>고도 <strong>${formatElevation(tile.elevation)}</strong></span>
      <span>포격 엄폐 <strong>${tile.artilleryCover ? `-${tile.artilleryCover}` : "없음"}</strong></span>
      <span>특성 <strong>${terrainTraitText(x, y)}</strong></span>
      <span>개량 <strong>${improvements.length ? improvements.join(", ") : "없음"}</strong></span>
      ${base ? `<span>소유 <strong>${sideName(base.owner)}</strong></span>` : ""}
      ${base ? `<span>생산 <strong>${formatNumber(baseProduction(base))}</strong></span>` : ""}
      ${base ? `<span>효율 <strong>${Math.round(base.efficiency * 100)}%</strong></span>` : ""}
      ${construction ? `<span>공사 <strong>${constructionName(construction.type)} ${construction.remaining}턴</strong></span>` : ""}
    </div>
  `;
}

function terrainDescription(tile) {
  if (tile.className === "coast") return "해안/상륙 가능 지형";
  if (tile.className === "water") return "바다/수역";
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
  if (getTerrainKey(x, y) === "C") return "해안선 지형 / 이동 가능";
  if (getTerrainKey(x, y) === "H") return "원거리 포격 차단 / 전차, 자주포 진입 불가";
  if (getTerrainKey(x, y) === "W" && !hasImprovement(x, y, "bridge")) return "교량 없이는 통과 불가";
  if (getTerrainKey(x, y) === "F") return "방어 유리 / 포격 효과 감소";
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
              onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'commander-photo fallback', textContent: '${commanderInitials(commander)}' }))"
            />
            <p>
              <strong>${commander.name}</strong>
              <span>${commander.nation} ${commander.rank} / ${commander.trait}</span>
            </p>
          </article>
        `,
      )
      .join("")}
  `;
}

function commanderPhoto(commander) {
  const photos = {
    patton: "https://commons.wikimedia.org/wiki/Special:FilePath/General%20George%20Patton.jpg",
    rommel: "https://commons.wikimedia.org/wiki/Special:FilePath/Bundesarchiv%20Bild%20146-1973-012-43%2C%20Erwin%20Rommel.jpg",
    montgomery: "https://commons.wikimedia.org/wiki/Special:FilePath/Bernard%20Montgomery%201945.jpg",
    eisenhower: "https://commons.wikimedia.org/wiki/Special:FilePath/Dwight%20D.%20Eisenhower%2C%20official%20photo%20portrait%2C%20May%2029%2C%201959.jpg",
    zhukov: "https://commons.wikimedia.org/wiki/Special:FilePath/Georgy%20Zhukov%201944.jpg",
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

function handleTileClick(x, y) {
  if (state.gameOver || state.phase !== "player") return;

  const clickedUnit = getSelectableUnitAt(x, y, "player");
  const clickedEnemy = getTargetUnitAt(x, y, "enemy");
  const clickedBase = getBaseAt(x, y);
  const selected = selectedUnit();

  if (clickedUnit) {
    state.selectedId = clickedUnit.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    render();
    return;
  }

  if (clickedEnemy && (!selected || selected.acted)) {
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
    recordUnitMove(selected, x, y);
    selected.x = x;
    selected.y = y;
    selected.moved = true;
    selected.acted = selected.type === "artillery";
    captureBase(selected);
    state.selectedId = selected.acted ? null : selected.id;
    state.inspectedId = null;
    state.inspectedTile = null;
    addLog(selected.acted ? `${unitTypes[selected.type].label}이 (${x}, ${y}) 좌표로 기동했습니다.` : `${unitTypes[selected.type].label}이 (${x}, ${y}) 좌표로 기동했습니다. 아직 공격할 수 있습니다.`);
    checkVictory();
    render();
    return;
  }

  inspectTile(x, y);
}

function inspectTile(x, y) {
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
  if (!unit || state.phase !== "player") return { moves, attacks, raids };
  const canStillMove = !unit.acted && !unit.moved;
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

  const spawn = findHQSpawn(hq, type);
  if (!spawn) {
    addLog("대대사령부 주변에 증원 가능한 칸이 없습니다.");
    render();
    return;
  }

  state.resources -= spec.cost;
  state.units.push(createUnit("player", type, spawn.x, spawn.y));
  addLog(`${spec.label} 증원이 전선에 도착했습니다.`);
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

  if (type === "bridge") {
    const water = neighbors(engineer.x, engineer.y).find((spot) => getTerrainKey(spot.x, spot.y) === "W" && !hasImprovement(spot.x, spot.y, "bridge"));
    if (!water) {
      addLog("공병대 주변에 다리를 놓을 하천이 없습니다.");
      render();
      return;
    }
    state.improvements.push({ type: "bridge", owner: engineer.owner, x: water.x, y: water.y });
    engineer.acted = true;
    state.selectedId = null;
    addLog(`공병대가 (${water.x}, ${water.y}) 하천에 임시 교량을 완성했습니다.`);
    render();
    return;
  }

  if (!canStartConstruction(engineer, type)) return;
  const duration = type === "depot" ? 3 : 2;
  state.constructions.push({ type, owner: engineer.owner, x: engineer.x, y: engineer.y, remaining: duration });
  engineer.acted = true;
  state.selectedId = null;
  addLog(`공병대가 (${engineer.x}, ${engineer.y})에서 ${constructionName(type)} 공사를 시작했습니다. ${duration}일이 필요합니다.`);
  render();
}

function canBuildBridge(engineer) {
  if (state.phase !== "player" || state.gameOver || engineer.acted || engineer.type !== "engineer") return false;
  return neighbors(engineer.x, engineer.y).some((spot) => getTerrainKey(spot.x, spot.y) === "W" && !hasImprovement(spot.x, spot.y, "bridge"));
}

function canStartConstruction(engineer, type) {
  if (state.phase !== "player" || state.gameOver || engineer.acted || engineer.type !== "engineer") return false;
  if (getTerrainKey(engineer.x, engineer.y) === "W") return false;
  if (getConstructionAt(engineer.x, engineer.y)) return false;
  if (type === "depot") return !getBaseAt(engineer.x, engineer.y) && !hasImprovement(engineer.x, engineer.y, "depot");
  if (type === "rail") return !hasImprovement(engineer.x, engineer.y, "rail");
  return false;
}

function endPlayerTurn() {
  if (state.gameOver || state.phase !== "player") return;
  updateBattalionSupplyPressure("player");
  applySupplyAttrition("player");
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
    }
  });
  replenishNearBattalionHQ("enemy");
  addLog("추축군이 반격 작전을 시작합니다.");
  render();
  window.setTimeout(enemyTurn, 420);
}

function enemyTurn() {
  if (state.gameOver) return;

  const enemies = state.units.filter((unit) => unit.owner === "enemy");
  enemies.forEach((unit) => {
    if (!state.units.includes(unit) || state.gameOver) return;

    if (unit.type === "battalionHQ") {
      enemyHQTurn(unit);
      captureBase(unit);
      checkVictory();
      return;
    }

    const raidableBase = bestRaidTarget(unit, "player");
    if (raidableBase) {
      raidBase(unit, raidableBase);
      captureBase(unit);
      checkVictory();
      return;
    }

    const target = nearestEnemy(unit, "player");
    if (!target) return;

    if (canAttack(unit, target)) {
      attack(unit, target);
    } else {
      const step = bestStepToward(unit, target);
      if (step) {
        recordUnitMove(unit, step.x, step.y);
        unit.x = step.x;
        unit.y = step.y;
        unit.moved = true;
        if (unit.type === "artillery") unit.acted = true;
        addLog(`추축군 ${unitTypes[unit.type].label}가 전진했습니다.`);
        const afterMoveRaid = bestRaidTarget(unit, "player");
        const afterMoveTarget = nearestEnemy(unit, "player");
        if (!unit.acted && afterMoveRaid) raidBase(unit, afterMoveRaid);
        else if (!unit.acted && afterMoveTarget && canAttack(unit, afterMoveTarget)) attack(unit, afterMoveTarget);
      }
    }
    captureBase(unit);
    checkVictory();
  });

  updateBattalionSupplyPressure("enemy");
  applySupplyAttrition("enemy");
  checkVictory();

  if (state.gameOver) {
    render();
    return;
  }

  const enemyIncome = projectedIncome("enemy");
  state.enemyResources += enemyIncome;
  addLog(`추축군이 ${formatNumber(enemyIncome)} 보급품을 확보했습니다.`);
  maybeEnemyRecruit();

  state.phase = "player";
  state.turn += 1;
  advanceConstructions("player");
  const income = projectedIncome("player");
  state.resources += income;
  state.units.forEach((unit) => {
    if (unit.owner === "player") {
      unit.acted = false;
      unit.moved = false;
    }
  });
  replenishNearBattalionHQ("player");
  addLog(`${formatNumber(income)} 보급품을 확보했습니다.`);
  render();
}

function advanceConstructions(owner) {
  state.constructions
    .filter((construction) => construction.owner === owner)
    .forEach((construction) => {
      construction.remaining -= 1;
      if (construction.remaining > 0) {
        addLog(`${constructionName(construction.type)} 공사 완료까지 ${construction.remaining}일 남았습니다.`);
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
  addLog(`${constructionName(construction.type)} 공사가 완료되었습니다.`);
}

function maybeEnemyRecruit() {
  const enemyCount = state.units.filter((unit) => unit.owner === "enemy").length;
  if (enemyCount >= 6 || state.turn % 2 !== 0) return;
  const type = enemyCount < 3 ? "armor" : "infantry";
  const spawn = findSpawn("enemy", type);
  if (!spawn) return;
  const cost = unitTypes[type].cost;
  if (state.enemyResources < cost) {
    addLog("추축군 보급 부족으로 예비대 투입이 지연되었습니다.");
    return;
  }
  state.enemyResources -= cost;
  state.units.push(createUnit("enemy", type, spawn.x, spawn.y));
  addLog(`추축군 ${unitTypes[type].label} 예비대가 투입되었습니다.`);
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

  const damage = combatDamage(attacker, defender);
  defender.hp -= damage;
  recordCombatEvent(attacker, defender, { damage, killed: defender.hp <= 0 });
  addLog(`${sideName(attacker.owner)} ${unitTypes[attacker.type].label}가 ${sideName(defender.owner)} ${unitTypes[defender.type].label}에 ${damage} 피해를 입혔습니다.`);
  if (isArtilleryUnit(attacker)) addLog(`${unitTypes[attacker.type].label}는 장거리 포격 후 즉각적인 근접 반격을 받지 않습니다.`);

  const baseUnderDefender = getBaseAt(defender.x, defender.y);
  if (baseUnderDefender?.owner === defender.owner) damageBaseProduction(baseUnderDefender, attacker);

  if (defender.hp <= 0) {
    state.units = state.units.filter((unit) => unit.id !== defender.id);
    addLog(`${sideName(defender.owner)} ${unitTypes[defender.type].label}가 전투 불능이 되었습니다.`);
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
  const rawDamage = attackerSpec.attack + heightModifier + commander.attack + directArtilleryVulnerability + defenderSupplyPenalty - defenderTile.defense - artilleryPenalty;
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
  addLog(`${sideName(attacker.owner)} ${unitTypes[attacker.type].label}가 (${base.x}, ${base.y}) 보급 거점을 공격했습니다.`);
  recordCombatEvent(attacker, base, { base: true });
  damageBaseProduction(base, attacker);
}

function damageBaseProduction(base, attacker) {
  base.efficiency *= raidEfficiencyFactor;
  addLog(`${sideName(base.owner)} 보급 거점 생산 효율이 ${Math.round(base.efficiency * 100)}%로 떨어졌습니다.`);

  if (isArtilleryUnit(attacker)) {
    base.efficiency *= raidEfficiencyFactor;
    addLog(`${unitTypes[attacker.type].label} 포격으로 보급 시설 피해가 한 번 더 누적되었습니다.`);
  }
}

function applySupplyAttrition(owner) {
  const isolated = state.units.filter((unit) => unit.owner === owner && supplyStatus(unit).level === "isolated");
  if (!isolated.length) return;

  isolated.forEach((unit) => {
    unit.hp -= isolatedAttritionDamage;
  });
  addLog(`${sideName(owner)} 고립 부대 ${isolated.length}개가 보급 부족으로 ${isolatedAttritionDamage} 피해를 받았습니다.`);

  const destroyed = isolated.filter((unit) => unit.hp <= 0);
  if (destroyed.length) {
    destroyed.forEach((unit) => addLog(`${sideName(unit.owner)} ${unitTypes[unit.type].label}가 보급 붕괴로 전투 불능이 되었습니다.`));
    state.units = state.units.filter((unit) => unit.hp > 0);
  }
}

function updateBattalionSupplyPressure(owner) {
  state.units
    .filter((unit) => unit.owner === owner)
    .forEach((unit) => {
      if (unit.type === "battalionHQ" || inBattalionSupplyRange(unit)) {
        unit.hqOutTurns = 0;
      } else {
        unit.hqOutTurns = (unit.hqOutTurns ?? 0) + 1;
      }
    });
}

function replenishNearBattalionHQ(owner) {
  const hqs = battalionHQs(owner);
  if (!hqs.length) return;

  const recovered = state.units.filter((unit) =>
    unit.owner === owner &&
    unit.type !== "battalionHQ" &&
    unit.hp < unitTypes[unit.type].hp &&
    hqs.some((hq) => distance(unit, hq) <= hqRecoveryRange)
  );

  recovered.forEach((unit) => {
    unit.hp = Math.min(unitTypes[unit.type].hp, unit.hp + 1);
  });

  if (recovered.length) addLog(`${sideName(owner)} 대대사령부가 밀접 부대 ${recovered.length}개의 병력을 1씩 보충했습니다.`);
}

function captureBase(unit) {
  const base = getBaseAt(unit.x, unit.y);
  if (base && base.owner !== unit.owner) {
    base.owner = unit.owner;
    base.efficiency *= raidEfficiencyFactor;
    addLog(`${sideName(unit.owner)}이 (${unit.x}, ${unit.y}) 보급 거점을 장악했습니다. 전투 피해로 생산 효율이 ${Math.round(base.efficiency * 100)}%가 되었습니다.`);
  }
}

function checkVictory() {
  const playerUnits = state.units.some((unit) => unit.owner === "player");
  const enemyUnits = state.units.some((unit) => unit.owner === "enemy");
  const playerBases = state.bases.some((base) => base.owner === "player");
  const enemyBases = state.bases.some((base) => base.owner === "enemy");

  if ((!enemyUnits || !enemyBases) && !state.gameOver) finishGame("승리: 추축군 전선이 붕괴되었습니다.");
  if ((!playerUnits || !playerBases) && !state.gameOver) finishGame("패배: 연합군 교두보를 상실했습니다.");
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
  const hqs = battalionHQs(unit.owner);
  if (!hqs.length) return { level: "isolated", label: "사령부 전멸", cost: Infinity, hqDistance: Infinity };

  const hqDistance = nearestBattalionHQDistance(unit);
  if (hqDistance <= hqSupplyRange) return { level: "full", label: "대대 보급", cost: hqDistance, hqDistance };

  const cost = supplyLineCost(unit);
  if (cost <= supplyRange) return { level: "strained", label: "사령부권 밖", cost, hqDistance };
  if (cost <= strainedSupplyRange) return { level: "strained", label: "보급 불안", cost, hqDistance };
  return { level: "isolated", label: "고립", cost, hqDistance };
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

function formatSupplyDistance(supply) {
  if (Number.isFinite(supply.hqDistance)) return `HQ ${formatNumber(supply.hqDistance)}`;
  return Number.isFinite(supply.cost) ? formatNumber(supply.cost) : "단절";
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

function nearestBattalionHQDistance(unit) {
  const hqs = battalionHQs(unit.owner);
  if (!hqs.length) return Infinity;
  return Math.min(...hqs.map((hq) => distance(unit, hq)));
}

function inBattalionSupplyRange(unit) {
  return nearestBattalionHQDistance(unit) <= hqSupplyRange;
}

function canMoveTo(unit, x, y) {
  if (!inBounds(x, y)) return false;
  if (unit.acted || unit.moved) return false;
  return canOccupy(unit, x, y) && movementCost(unit.x, unit.y, x, y, unit) <= effectiveMove(unit);
}

function effectiveMove(unit) {
  const baseMove = unit.type === "artillery" && unit.towed ? unitTypes.artillery.towedMove : unitTypes[unit.type].move;
  const supply = supplyStatus(unit);
  if (supply.level === "isolated") return Math.min(baseMove, 1);
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
  if (!occupants.length) return movementCostForTile(x, y) < Infinity;
  return occupants.every((other) => other.owner === unit.owner && other.type === unit.type) && occupants.length < maxStackSize;
}

function canEnterTerrain(unit, x, y) {
  if (!inBounds(x, y)) return false;
  if (getTerrainKey(x, y) === "H" && (unit.type === "armor" || unit.type === "spArtillery")) return false;
  return movementCostForTile(x, y) < Infinity;
}

function movementCost(startX, startY, targetX, targetY, unit) {
  const queue = [{ x: startX, y: startY, cost: 0 }];
  const best = new Map([[posKey(startX, startY), 0]]);

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.x === targetX && current.y === targetY) return current.cost;

    neighbors(current.x, current.y).forEach((next) => {
      const tileCost = movementCostForTile(next.x, next.y);
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

function movementCostForTile(x, y) {
  let cost = getTerrainKey(x, y) === "W" && hasImprovement(x, y, "bridge") ? 1 : tileAt(x, y).cost;
  if (hasImprovement(x, y, "rail") && Number.isFinite(cost)) cost = Math.min(cost, 0.5);
  return cost;
}

function canAttack(attacker, defender) {
  if (!attacker || !defender || attacker.owner === defender.owner) return false;
  if (attacker.type === "artillery" && attacker.moved) return false;
  if (isTowedArtillery(attacker)) return false;
  if (supplyStatus(attacker).level === "isolated" && unitTypes[attacker.type].range > 1) return false;
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

function bestRaidTarget(unit, owner) {
  return state.bases
    .filter((base) => base.owner === owner && canRaidBase(unit, base))
    .sort((a, b) => baseProduction(b) - baseProduction(a))[0];
}

function bestStepToward(unit, target) {
  let best = null;
  neighbors(unit.x, unit.y).forEach((next) => {
    if (!canMoveTo(unit, next.x, next.y)) return;
    const score = distance(next, target) + tileAt(next.x, next.y).defense * -0.2;
    if (!best || score < best.score) best = { ...next, score };
  });
  return best;
}

function enemyHQTurn(hq) {
  const step = bestSafeHQStep(hq);
  if (step && (step.x !== hq.x || step.y !== hq.y)) {
    recordUnitMove(hq, step.x, step.y);
    hq.x = step.x;
    hq.y = step.y;
    hq.moved = true;
    addLog("추축군 대대 사령부가 호위 부대 뒤로 신중하게 위치를 조정했습니다.");
  }

  const target = nearestEnemy(hq, "player");
  if (target && canAttack(hq, target) && hqGuardCount(hq, hq.x, hq.y) > 0) {
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
  return best.score > currentScore + 0.25 ? best : null;
}

function hqSafetyScore(hq, x, y) {
  const enemyDistances = state.units
    .filter((unit) => unit.owner !== hq.owner)
    .map((unit) => distance({ x, y }, unit));
  const nearestThreat = enemyDistances.length ? Math.min(...enemyDistances) : 99;
  const guards = hqGuardCount(hq, x, y);
  const commandCoverage = state.units.filter((unit) =>
    unit.owner === hq.owner &&
    unit.id !== hq.id &&
    distance({ x, y }, unit) <= unitTypes.battalionHQ.commandRange
  ).length;
  const supplyCoverage = state.units.filter((unit) =>
    unit.owner === hq.owner &&
    unit.id !== hq.id &&
    distance({ x, y }, unit) <= hqSupplyRange
  ).length;
  const ownedBaseDistance = nearestOwnedBaseDistance(hq.owner, x, y);

  let score = 0;
  score += Math.min(nearestThreat, 5) * 4;
  score += guards * 8;
  score += commandCoverage * 3;
  score += supplyCoverage;
  score -= Number.isFinite(ownedBaseDistance) ? ownedBaseDistance * 1.4 : 12;
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

function nearestEnemy(unit, owner) {
  return state.units
    .filter((target) => target.owner === owner)
    .sort((a, b) => distance(unit, a) - distance(unit, b))[0];
}

function findSpawn(owner, type) {
  const ownedBases = state.bases.filter((base) => base.owner === owner);
  const probe = { owner, type };
  for (const base of ownedBases) {
    const candidates = [base, ...neighbors(base.x, base.y)];
    const open = candidates.find((spot) => canOccupy(probe, spot.x, spot.y) && Number.isFinite(movementCostForTile(spot.x, spot.y)));
    if (open) return open;
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

function supplyMoralePenalty(unit) {
  const level = supplyStatus(unit).level;
  if (level === "isolated") return isolatedSupplyMoralePenalty;
  if (level === "strained") return strainedSupplyMoralePenalty;
  return 0;
}

function hqOutOfRangeMoraleLoss(unit) {
  if (!unit || unit.type === "battalionHQ") return 0;
  const exposedTurns = Math.max(0, (unit.hqOutTurns ?? 0) - hqOutOfRangeGraceTurns);
  return exposedTurns * hqOutOfRangeMoralePenalty;
}

function supplyDefensePenalty(unit) {
  const level = supplyStatus(unit).level;
  if (level === "isolated") return 2;
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
  return state.units.find((unit) => unit.id === state.inspectedId);
}

function selectedEngineer() {
  const unit = selectedUnit();
  return unit?.owner === "player" && unit.type === "engineer" && !unit.acted ? unit : null;
}

function selectedBattalionHQ() {
  const unit = selectedUnit();
  return unit?.owner === "player" && unit.type === "battalionHQ" ? unit : null;
}

function getSelectableUnitAt(x, y, owner) {
  return getUnitsAt(x, y).find((unit) => unit.owner === owner && !unit.acted);
}

function getTargetUnitAt(x, y, owner) {
  return getUnitsAt(x, y)
    .filter((unit) => unit.owner === owner)
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

function displayTileName(x, y) {
  if (getTerrainKey(x, y) === "W" && hasImprovement(x, y, "bridge")) return "임시 교량";
  if (hasImprovement(x, y, "rail")) return `${tileAt(x, y).name} / 철도`;
  return tileAt(x, y).name;
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

function sideName(owner) {
  if (activePack) return owner === "player" ? activePack.side.player : activePack.side.enemy;
  return owner === "player" ? "연합군" : "추축군";
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

startGame();
