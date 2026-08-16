// 시나리오 데이터층.
//
// 여기에는 규칙이 없다. 지형, 배치, 목표 "데이터"만 있다.
// 새 작전을 만들고 싶으면 이 파일에 객체 하나를 더하면 된다 — game.js는 건드리지 않는다.
//
// 지형 문자
//   P 개활지 / C 강변·접근로 / F 삼림 / H 고지 / W 하천(도하 불가) / B 보급 거점
// 고지 방어방향 문자
//   . 없음 / N 북 / E 동 / S 남 / W 서  (능선이 어느 쪽 공격을 막아주는가)
//
// 진영은 west / east로 고정한다. 플레이어가 연합군을 고르면 west, 추축군을 고르면 east를 잡는다.
// 그래서 목표도 timeoutWinner도 "플레이어 기준"이 아니라 "진영 기준"으로 적는다.
// 플레이어 기준으로 적으면 진영을 바꿔 고르는 순간 미션이 뒤집혀서 말이 안 된다.
//
// 보급 거점(bases)
//   각 진영은 거점 하나만 소유하고 시작한다. neutral: true가 붙은 거점은 무주공산이라
//   먼저 밟는 쪽이 가져간다 — 그래서 거점은 "받고 시작하는 것"이 아니라 "싸워서 여는 것"이다.
//   진영 블록 안에 적혀 있어도 소유가 아니라 위치만 그쪽 몫이라는 뜻이다.
//
// 목표(objective) 종류
//   seize    지정 칸을 점유하고 holdTurns 만큼 유지 → 즉시 승리
//            byTag를 주면 그 태그가 붙은 유닛만 인정한다 (탈출 미션용)
//   supply   지정 칸까지 "정상 보급"으로 선을 잇고 holdTurns 만큼 유지 → 즉시 승리
//            밟는 것이 아니라 잇는 것이다. 다리를 놓고, 창고를 앞으로 밀고,
//            철도를 깔아야 채워진다 — 공병대가 주인공인 목표.
//            상대 부대가 회랑 위에 서 있으면 선이 끊긴다(supplyLineCost).
//   destroy  상대 진영의 targetType 유닛이 전멸하면 → 즉시 승리
//   protect  tag가 붙은 아군 유닛이 죽으면 → 그 진영 즉시 패배 (실패 조건)
//
// turnLimit은 작전 시작 시 에디터의 "작전 기한 턴" 값을 이 숫자로 덮어쓴다.
// 그 뒤로는 에디터가 주인이다 — 게임 도중에 언제든 다시 바꿀 수 있다.
// null이면 에디터의 현재 값을 그대로 쓴다.
//
// timeoutWinner: "west" | "east" | null(무승부)

const scenarios = [
  {
    id: "totalWar",
    name: "총력전",
    summary: "노르망디 내륙. 양측 모두 상대 후방의 간선 출구를 노린다.",
    objectiveBrief: "상대 후방 간선 출구를 점령해 유지하라.",
    turnLimit: 30,
    timeoutWinner: null,
    map: { enabled: true, centerLat: 49.18, centerLon: -0.36, zoom: 10, radius: 2 },
    terrain: [
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPCCPPPPPPPPPPPPPP",
      "PPPPPCCCCPPPPPPCPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PCCCCCCCCCCCCCCCCCCP",
      "PPPPPPPPPPPPPBCCPPPP",
      "PPPPPPPPPPPPPPPBPPPP",
      "PPPPPPHHHPPPPHPPPPPP",
      "PPPPPPBHHHPPPHPPBPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPHHPPPPPHHHB",
      "PPPPPPPPPPBPPPPPHHPP",
      "PPPPPPPPPPPPPPPPHHPP",
      "PPPPPPPPPPPPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "......SEE....N......",
      ".......SEE...N......",
      "....................",
      ".........SS.....NNN.",
      "................NN..",
      "................NN..",
      "....................",
    ],
    // 사령부는 반드시 자기 거점 보급망 안에서 시작한다. 밖에서 시작하면 1턴차부터 죽어간다.
    west: {
      bases: [
        { x: 6, y: 10, production: 6 },
        { x: 10, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 12],
        ["armor", 4, 14],
        ["artillery", 2, 7],
        ["engineer", 2, 14],
        ["battalionHQ", 2, 8],
      ],
      // 남쪽 간선(11행)을 타고 동쪽 끝까지. 상대 시작선 3칸 안이라 스쳐 지나가서는 못 먹는다.
      objectives: [{ kind: "seize", x: 18, y: 11, label: "돌파 목표" }],
    },
    east: {
      bases: [
        { x: 13, y: 7, production: 6 },
        { x: 15, y: 8, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 3],
        ["armor", 18, 2],
        ["artillery", 18, 8],
        ["battalionHQ", 18, 6],
      ],
      // 북쪽 간선(5행)을 타고 서쪽 끝까지.
      objectives: [{ kind: "seize", x: 1, y: 5, label: "돌파 목표" }],
    },
  },

  {
    id: "riverBreak",
    name: "도하 돌파",
    summary: "강 하나가 전선을 갈랐다. 도하 지점은 북·중·남 셋뿐이고, 시간은 공격 측 편이 아니다.",
    objectiveBrief: "기한 안에 강을 건너 동쪽 출구를 확보하라. 못 하면 공격 실패다.",
    turnLimit: 18,
    // 시간이 끝나면 방어 측(동군)이 이긴다. 이게 "시간 내 돌파" 미션이다.
    timeoutWinner: "east",
    map: { enabled: true, centerLat: 49.34, centerLon: -1.09, zoom: 10, radius: 2 },
    terrain: [
      "PPFFPPPPPWPPHHPPPPPP",
      "PPFFPPPPPWPPHHPPPPBP",
      "PPPPPPPPPWPPPHPPPPPP",
      "CCCCCCCCCCCCCCPPPPPP",
      "PPPPPPPPPWPPPPFFPPPP",
      "PPPFFPPPPWPPPPFFPPPP",
      "PPPFFPPPPWPPPPPPPHHP",
      "PPPPPPPPPWPPPPPPPHHP",
      "CCCCCCCCCCCCCPPPPPPP",
      "PPPPPPPPPWPPPBPPPPPP",
      "PPPPHHPPPWPPPPPPPPPP",
      "PPPPHHPPPWPPFFPPPPPP",
      "PPPPPPPPPWPPFFPPPPPP",
      "CCCCCCCCCCCCCCCPPPPP",
      "PBPPPPPPPWPPPPPPPPPP",
      "PPPPPBPPPWPPPPPPPPPP",
    ],
    hillDefense: [
      "............WW......",
      "............WW......",
      ".............W......",
      "....................",
      "....................",
      "....................",
      ".................WW.",
      ".................WW.",
      "....................",
      "....................",
      "....EE..............",
      "....EE..............",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 1, y: 14, production: 6 },
        { x: 5, y: 15, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 13],
        ["armor", 3, 14],
        ["artillery", 1, 15],
        ["engineer", 2, 15],
        ["battalionHQ", 2, 14],
      ],
      // 중앙 도하선(8행)의 반대쪽 끝. 강을 건너지 않고는 도달할 수 없는 자리다.
      objectives: [{ kind: "seize", x: 19, y: 8, label: "도하 출구" }],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 13, y: 9, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 16, 2],
        ["armor", 16, 8],
        ["artillery", 17, 2],
        ["battalionHQ", 17, 1],
        // 도하 지점이 셋이라 방어 측도 사령부를 둘로 나눠야 한다. 하나로는 남북을 다 못 덮는다.
        ["battalionHQ", 14, 9],
      ],
      // 방어 측은 목표가 없다. 버티면 이긴다.
      objectives: [],
    },
  },

  {
    id: "crossroadsHold",
    name: "교차로 사수",
    summary: "산울타리 지대의 두 교차로. 동군이 밀고 들어오고, 서군은 증원이 올 때까지 버텨야 한다.",
    objectiveBrief: "기한이 끝날 때까지 두 교차로를 내주지 마라.",
    turnLimit: 14,
    // 시간이 끝나면 수비 측(서군)이 이긴다. 이게 "N턴 버티기" 미션이다.
    timeoutWinner: "west",
    map: { enabled: true, centerLat: 49.12, centerLon: -0.79, zoom: 10, radius: 2 },
    terrain: [
      "PPPPPPFFPPPPFFPPPPPP",
      "PPBPPPFFPPPPFFPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPFFPPHHPPPPPPFFPPPP",
      "PPFFPPHHPPPPPPFFPPBP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPFFPPPBPPPPPPPPPP",
      "PPPPFFPPPPPPPPPPFFPP",
      "PPPPPPPPPPPPPPPPFFPP",
      "PPPHHPPPPPPPPPPPPPPP",
      "PPPHHPPPPPPPPHHPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPFFPPPPPPPPPBPP",
      "PPPPPPFFPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "......EE............",
      "......EE............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...EE...............",
      "...EE........WW.....",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 2, y: 1, production: 6 },
        { x: 9, y: 7, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 3, 2],
        ["armor", 4, 6],
        ["artillery", 2, 2],
        ["engineer", 8, 8],
        // 사령부 하나로 두 교차로를 다 덮으려면 한가운데 접근로에 세울 수밖에 없다.
        // 안전한 자리는 아니다 — 그게 이 작전의 대가다.
        ["battalionHQ", 5, 5],
      ],
      objectives: [],
    },
    east: {
      bases: [
        { x: 18, y: 4, production: 6 },
        { x: 17, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 4],
        ["infantry", 16, 13],
        ["armor", 17, 5],
        ["artillery", 18, 5],
        ["battalionHQ", 18, 3],
        // 남북 두 갈래로 밀어붙이는 쪽이라 사령부도 둘이다. 대신 둘 다 잡히면 공격은 끝난다.
        ["battalionHQ", 17, 12],
      ],
      // 둘 중 하나만 뚫려도 방어선이 끝난다. 수비 측은 병력을 남북으로 쪼개야 한다.
      objectives: [
        { kind: "seize", x: 2, y: 5, label: "북 교차로" },
        { kind: "seize", x: 2, y: 12, label: "남 교차로" },
      ],
    },
  },

  {
    id: "hqHunt",
    name: "사령부 사냥",
    summary: "양측 모두 대대 사령부를 하나씩만 데리고 나왔다. 사령부가 죽으면 증원도 보급도 끝이다.",
    objectiveBrief: "적 대대 사령부를 격파하라. 내 사령부를 잃으면 그것으로 끝이다.",
    turnLimit: 20,
    timeoutWinner: null,
    map: { enabled: true, centerLat: 48.86, centerLon: -0.62, zoom: 10, radius: 2 },
    terrain: [
      "PPPPPPPPPPPPPPFFPPBP",
      "PPPPPPPPPPPPPPFFPPPP",
      "PPPPPPPPPPPHHPPPPPPP",
      "PPPPPPPPPPPHHPPPBPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPFFPPPPPPPPPPPPPP",
      "PPPPFFPPPPPPFFPPPPPP",
      "PPPPPPPPPPPPFFPPPPPP",
      "PPPPPPPHHPPPPPPPPPPP",
      "PPPPPPPHHPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPBPPPPPPPPPPFFPPPP",
      "PPPPPPPPPPPPPPFFPPPP",
      "PBPPPPFFPPPPPPPPPPPP",
      "PPPPPPFFPPPPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "...........SS.......",
      "...........SS.......",
      "....................",
      "....................",
      "....................",
      "....................",
      ".......NN...........",
      ".......NN...........",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 3, y: 12, production: 6 },
        { x: 1, y: 14, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 4, 12],
        ["armor", 5, 13],
        ["artillery", 2, 12],
        ["engineer", 2, 14],
        ["battalionHQ", 3, 13],
      ],
      objectives: [{ kind: "destroy", targetType: "battalionHQ", label: "대대 사령부" }],
    },
    east: {
      bases: [
        { x: 18, y: 0, production: 6 },
        { x: 16, y: 3, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 1],
        ["armor", 18, 1],
        ["artillery", 16, 2],
        ["battalionHQ", 17, 0],
      ],
      objectives: [{ kind: "destroy", targetType: "battalionHQ", label: "대대 사령부" }],
    },
  },

  {
    id: "pocketRescue",
    name: "고립 사령부 구조",
    summary: "포위망 한가운데 사령부 하나가 남았다. 사령부는 추격자보다 느리다 — 호위를 붙여 걸어서 빼낸다.",
    objectiveBrief: "고립된 사령부를 탈출 지점까지 데려가라. 잃으면 즉시 패배다. 사령부는 인접 아군이 있는 동안만 직접 피격을 면한다 — 엄호를 끊기지 마라.",
    // 사령부 이동력 2로 (13,6)→(2,8)은 방해가 전혀 없어도 7턴이다.
    // 12턴이면 싸우면서 갈 여유가 5턴 — 넉넉하지도 각박하지도 않게 잡았다.
    turnLimit: 12,
    // 시간이 끝나면 포위한 쪽(동군)이 포켓을 짓뭉갠 것으로 본다.
    timeoutWinner: "east",
    map: { enabled: true, centerLat: 48.76, centerLon: 0.11, zoom: 11, radius: 2 },
    // 이 작전만 지도가 16x12다. 판 크기는 terrain 배열이 정한다.
    terrain: [
      "PPPPFFPPPPPPFFPP",
      "PBPPFFPPPPPPPPPP",
      "PPPPPPPPPHHPPPPP",
      "CCCCCCCCCCCCCCCC",
      "PPPPPPPPPHHPPPBP",
      "PPFFPPPPPPPPPPPP",
      "PPFFPPPPPPPPPPPP",
      "PPPPPPPHHPPPPPPP",
      "CCCCCCCCCCCCCCCC",
      "PPPPPPPHHPPPPBPP",
      "PBPPPPPPPPFFPPPP",
      "PPPPPPPPPPFFPPPP",
    ],
    hillDefense: [
      "................",
      "................",
      ".........WW.....",
      "................",
      ".........WW.....",
      "................",
      "................",
      ".......WW.......",
      "................",
      ".......WW.......",
      "................",
      "................",
    ],
    west: {
      bases: [
        { x: 1, y: 1, production: 6 },
        { x: 1, y: 10, production: 5, neutral: true },
      ],
      // 본대에는 사령부가 없다. 구해야 할 그 사령부가 이 작전의 유일한 사령부다.
      units: [
        // 구조대. 사령부(이동력 2)는 추격자(보병 5, 전차 6)를 절대 못 따돌린다.
        // 그러니 이 작전은 경주가 아니다 — 구조대의 임무는 동쪽으로 달려가
        // 죽어나가는 호위를 대신할 몸을 계속 대주는 것이다.
        ["armor", 3, 1],
        ["armor", 3, 10],
        ["infantry", 2, 1],
        ["infantry", 2, 10],
        ["artillery", 1, 2],
        ["engineer", 2, 2],
        // 포켓은 적 보급 거점(14,4) 코앞이다. 얕게 두면 그냥 걸어 나가버려서
        // 포위가 아니라 산책이 된다.
        { type: "battalionHQ", x: 13, y: 6, tag: "trapped" },
        // 포켓의 잔존 호위. 사령부 엄호 규칙 덕에 이 셋 중 하나라도 사령부에
        // 붙어 있는 동안은 사령부가 직접 사격당하지 않는다. 서쪽 (12,6)은
        // 일부러 비워둔다 — 사령부가 걸어 나갈 문이다.
        ["infantry", 13, 5],
        ["infantry", 13, 7],
        ["infantry", 14, 6],
      ],
      objectives: [
        // 탈출은 도착하는 순간이 아니라 자기 턴을 그 자리에서 넘겼을 때 성립한다.
        { kind: "seize", x: 2, y: 8, label: "탈출 지점", byTag: "trapped", holdTurns: 1 },
        { kind: "protect", tag: "trapped", label: "고립 사령부" },
      ],
    },
    east: {
      bases: [
        { x: 14, y: 4, production: 6 },
        { x: 13, y: 9, production: 5, neutral: true },
      ],
      // 포위는 뒤에서 쫓는 게 아니라 둘러싸는 것이다. 전부 동쪽에 세우면
      // 포켓이 그냥 서쪽으로 걸어나가고 미션이 성립하지 않는다.
      // 그래서 절반은 추격(동쪽), 절반은 회랑 차단(서쪽)에 세운다.
      // 사령부를 첫 턴에 지목해 죽이는 배치는 피한다 — 엄호 규칙이 있어도
      // 호위를 한 턴에 다 걷어내면 결과가 같다.
      units: [
        // 추격조. 포켓의 등을 민다. 첫 턴에 호위를 한꺼번에 걷어내지 못하도록
        // 포켓(13,6)에 인접하지 않게 세운다.
        ["infantry", 15, 2],
        ["armor", 15, 10],
        ["artillery", 15, 5],
        ["battalionHQ", 15, 3],
        // 차단조. 탈출 회랑에 미리 앉아 있다. 구조대가 이쪽을 걷어내지 못하면
        // 포켓은 서쪽으로 한 걸음도 못 간다.
        ["infantry", 8, 4],
        ["infantry", 8, 9],
      ],
      // 포위 측은 목표가 없다. 사령부를 잡거나 시간을 넘기면 된다.
      objectives: [],
    },
  },
  {
    id: "supplyBridge",
    name: "보급선 개통",
    summary: "강이 전선을 둘로 갈랐다. 강폭은 두 칸이라 다리를 놓을 수 없고, 한 칸으로 좁아지는 나루는 북·중·남 셋뿐이다.",
    objectiveBrief: "동안의 화물역까지 보급선을 개통하고 유지하라. 부대를 세우는 것으로는 끝나지 않는다.",
    // 다리 하루, 창고 사흘, 철도 이틀. 짓는 시간까지 계산에 넣어야 하므로 기한이 길다.
    turnLimit: 24,
    // 시간이 끝나면 방어 측(동군)이 이긴다. 개통은 공격 측의 숙제다.
    timeoutWinner: "east",
    // 1944년 9월, 발 강. 다리 하나에 작전 전체가 걸렸던 그 회랑.
    map: { enabled: true, centerLat: 51.85, centerLon: 5.87, zoom: 10, radius: 2 },
    // 9·10열이 강이다. 두 칸 폭은 어디에도 다리를 놓을 수 없다(양쪽 기슭이 모두 뭍이어야
    // 교량이 선다). 2·8·13행에서만 10열이 뭍이 되어 강이 한 칸으로 좁아진다 —
    // 지도가 스스로 "여기가 나루다"라고 말하고, 그 사실을 양쪽이 똑같이 본다.
    terrain: [
      "PPPPPPPPPWWPPPPPPPPP",
      "PPFFPPPPPWWPPPPFFPPP",
      "PPFFPPPPPWPPPPPFFPPP",
      "CCCCCCCCCWWCCCCCCCCC",
      "PPPPPPPPPWWPPPPPHHBP",
      "PPPPHHPPPWWPPPPPHHPP",
      "PPPPHHPPPWWPPPPPPPPP",
      "PBPPPPPPPWWPPPPPPPPP",
      "CCCCCCCCCWCCCCCCCCCC",
      "PPPPPPPPPWWPPPPPPPPP",
      "PPPPPPPPPWWPPFFPPPPP",
      "PPPFFPPPPWWPPFFPPBPP",
      "PPPFFPPPPWWPPPPPPPPP",
      "CCCCCCCCCWCCCCCCCCCC",
      "PPBPPPPPPWWPPPPPPPPP",
      "PPPPPPPPPWWPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "................WW..",
      "....EE..........WW..",
      "....EE..............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 1, y: 7, production: 6 },
        { x: 2, y: 14, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 3, 7],
        ["infantry", 3, 13],
        ["armor", 2, 8],
        ["artillery", 1, 9],
        // 공병대 둘. 이 작전에서 이기는 쪽은 총이 아니라 삽이다.
        ["engineer", 2, 7],
        ["engineer", 3, 14],
        ["battalionHQ", 1, 8],
      ],
      // 중앙 나루에서 동쪽으로 다섯 칸. 다리만 놓아서는 보급 거리가 모자라고,
      // 서안에 창고를 붙여도 닿지 않는다 — 강을 건너 교두보를 굳히고 그 위에
      // 창고를 세워야 비로소 선이 닿는다. 그래서 이 목표는 공병대의 목표이자
      // 동시에 보병의 목표다.
      objectives: [{ kind: "supply", x: 15, y: 8, label: "화물역", holdTurns: 3 }],
    },
    east: {
      bases: [
        { x: 18, y: 4, production: 6 },
        { x: 17, y: 11, production: 5, neutral: true },
      ],
      units: [
        // 화물역 회랑 위에 앉는다. 개통 목표는 그 칸에 상대가 서 있기만 해도
        // 선이 끊기므로, 수비 측에게는 "밟고 버티기"가 그 자체로 유효한 수다.
        ["infantry", 12, 8],
        ["infantry", 12, 2],
        ["infantry", 12, 13],
        ["armor", 14, 9],
        ["artillery", 16, 8],
        ["engineer", 18, 5],
        ["battalionHQ", 17, 8],
        ["battalionHQ", 17, 3],
      ],
      // 방어 측은 목표가 없다. 회랑을 끊어 둔 채 기한을 넘기면 이긴다.
      objectives: [],
    },
  },
];

const defaultScenarioId = "totalWar";

function findScenario(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios.find((scenario) => scenario.id === defaultScenarioId) ?? scenarios[0];
}
