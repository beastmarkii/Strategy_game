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
// 놓여 있는 다리(bridges)
//   [[x, y], ...] — 작전이 시작될 때부터 그 자리에 서 있는 다리다. 전쟁 전부터
//   있던 마을 다리라서 주인이 없고(owner: "neutral"), 양쪽 다 그냥 건넌다.
//   이게 필요한 이유: 강 한가운데 뭍 한 칸을 박아 두면 지도에서는 강이 흙으로
//   막힌 것처럼 보인다. 물길은 끊기지 않게 그대로 흘리고, 그 위에 다리를 얹는다.
//   공병대가 새로 놓는 다리 두 개 제한과는 무관하다 — 이건 지을 것이 아니라
//   이미 있는 것이다.
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "총력전",
    summary: "노르망디 내륙. 양측 모두 상대 후방의 간선 출구를 노린다.",
    objectiveBrief: "상대 후방 간선 출구를 점령해 유지하라.",
    turnLimit: 30,
    // 첫날. 한 턴이 하루다 — 화면 가운데 뜨는 날짜가 여기서부터 세어 나간다.
    // 코브라 작전 개시일. 노르망디에서 내륙으로 뚫고 나간 그날이다.
    startDate: [1944, 7, 25],
    timeoutWinner: null,
    // 원래는 캉 앞바다(49.18, -0.36)를 잡고 있었다. 그래서 320칸 중 115칸, 판의 위쪽
    // 3분의 1이 영불해협이었는데 게임은 그걸 개활지로 쳐서 부대가 바다 위를 행군했다.
    // 이 작전의 설명이 "노르망디 내륙"이므로 지도만 남쪽 내륙으로 옮긴다.
    // 알랑송·에쿠브 숲 일대 — 바다 0칸이고 숲과 구릉이 많아 아래 지형 배치와도 맞는다.
    // 지형·목표·시작 위치는 하나도 건드리지 않았다.
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "PAYS D'AUGE", region: "NORMANDIE", city: "CAEN",
      towns: ["Saint-Lô", "Bayeux", "Lisieux", "Falaise", "Argentan", "Alençon"],
    },
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
      "PPPPPPBHHHPPPHPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPHHPPPPPHHHP",
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "도하 돌파",
    summary: "강 하나가 전선을 갈랐다. 도하 지점은 북·중·남 셋뿐이고, 시간은 공격 측 편이 아니다.",
    objectiveBrief: "기한 안에 강을 건너 동쪽 출구를 확보하라. 못 하면 공격 실패다.",
    turnLimit: 18,
    // 코브라 직전, 아직 산울타리 지대에서 강 하나에 발이 묶여 있던 무렵.
    startDate: [1944, 7, 16],
    // 시간이 끝나면 방어 측(동군)이 이긴다. 이게 "시간 내 돌파" 미션이다.
    timeoutWinner: "east",
    // 원래는 코탕탱 해안(49.34, -1.09)이라 320칸 중 153칸, 판의 절반이 바다였다.
    // 이 작전은 강 하나가 전선을 가르는 이야기인데, 정작 화면에 그려진 물은 강이 아니라
    // 위쪽 바다였다 — 규칙상의 강(세로 한 줄)과 눈에 보이는 물이 서로 딴 데 있었다.
    // 마옌 강이 판 한가운데를 세로로 흐르는 라발 일대로 옮긴다. 바다 0칸이고,
    // 지도에 보이는 강줄기와 규칙상의 강이 같은 방향으로 흐른다.
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "PAYS D'AUGE", region: "NORMANDIE", city: "CAEN",
      towns: ["Saint-Lô", "Bayeux", "Lisieux", "Falaise", "Argentan", "Alençon"],
    },
    // 강줄기가 9열에 자로 잰 듯 곧게 서 있었다. 규칙으로는 멀쩡하지만 지도로는
    // 강이 아니라 판을 반으로 자른 금이었다. 열을 8~10 사이로 비껴 흐르게 바꾼다.
    // 한 칸씩 어긋나도 이동은 상하좌우뿐이라 막는 힘은 그대로다 — 비껴 있는
    // 두 칸 사이로 빠져나가려면 결국 강 칸을 밟아야 한다.
    // 도하 지점은 예전 그대로 3·8·13행 셋이다. 다만 예전에는 그 세 줄에서 강 자체를
    // 지워 뭍으로 막아 놓았다 — 그러면 강이 위에서 내려오다 흙에 막히고 아래에서 다시
    // 시작하는, 세상에 없는 그림이 된다. 이제 물길은 끊지 않고 그대로 흘려보내고,
    // 그 위에 원래 있던 마을 다리를 얹는다(bridges). 건너는 자리도 건너는 값도
    // 예전과 똑같다 — 달라진 것은 그 자리가 흙더미가 아니라 다리로 보인다는 것뿐이다.
    terrain: [
      "PPFFPPPPPWPPHHPPPPPP",
      "PPFFPPPPPWPPHHPPPPBP",
      "PPPPPPPPPPWPPHPPPPPP",
      "CCCCCCCCCCWCCCPPPPPP",
      "PPPPPPPPPPWPPPFFPPPP",
      "PPPFFPPPPPWPPPFFPPPP",
      "PPPFFPPPPWPPPPPPPHHP",
      "PPPPPPPPPWPPPPPPPHHP",
      "CCCCCCCCWWCCCPPPPPPP",
      "PPPPPPPPWPPPPBPPPPPP",
      "PPPPHHPPWPPPPPPPPPPP",
      "PPPPHHPPPWPPFFPPPPPP",
      "PPPPPPPPPWPPFFPPPPPP",
      "CCCCCCCCCWWCCCCPPPPP",
      "PBPPPPPPPPWPPPPPPPPP",
      "PPPPPBPPPPWPPPPPPPPP",
    ],
    // 3·8·13행의 강 칸 위에 서 있는 마을 다리. 강줄기가 열을 비껴 흐르는 자리에서는
    // 물이 두 칸을 지나므로 다리도 두 칸이다.
    bridges: [
      [10, 3],
      [8, 8],
      [9, 8],
      [9, 13],
      [10, 13],
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "교차로 사수",
    summary: "산울타리 지대의 두 교차로. 동군이 밀고 들어오고, 서군은 증원이 올 때까지 버텨야 한다.",
    objectiveBrief: "기한이 끝날 때까지 두 교차로를 내주지 마라.",
    turnLimit: 14,
    // 모르탱 역습이 시작된 날. 밀고 들어오는 쪽과 버티는 쪽이 갈린 그 아침이다.
    startDate: [1944, 8, 7],
    // 시간이 끝나면 수비 측(서군)이 이긴다. 이게 "N턴 버티기" 미션이다.
    timeoutWinner: "west",
    // 원래 자리(49.12, -0.79)는 판의 오른쪽 위 모서리가 바다에 잠겨 69칸이 물이었다.
    // 간선도로가 실제로 여러 갈래로 갈리는 내륙(마메르·라페르테베르나르 일대)으로 옮긴다.
    // 바다 0칸이고 숲이 가장 많은 자리라, 교차로를 지키는 그림과도 맞는다.
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "PAYS D'AUGE", region: "NORMANDIE", city: "CAEN",
      towns: ["Saint-Lô", "Bayeux", "Lisieux", "Falaise", "Argentan", "Alençon"],
    },
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "사령부 사냥",
    summary: "양측 모두 대대 사령부를 하나씩만 데리고 나왔다. 사령부가 죽으면 증원도 보급도 끝이다.",
    objectiveBrief: "적 대대 사령부를 격파하라. 내 사령부를 잃으면 그것으로 끝이다.",
    turnLimit: 20,
    // 팔레즈 일대. 지휘 계통이 끊기는 것이 부대가 죽는 것보다 무서웠던 무렵.
    startDate: [1944, 8, 16],
    timeoutWinner: null,
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "PAYS D'AUGE", region: "NORMANDIE", city: "CAEN",
      towns: ["Saint-Lô", "Bayeux", "Lisieux", "Falaise", "Argentan", "Alençon"],
    },
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "고립 사령부 구조",
    summary: "포위망 한가운데 사령부 하나가 남았다. 사령부는 추격자보다 느리다 — 호위를 붙여 걸어서 빼낸다.",
    objectiveBrief: "고립된 사령부를 탈출 지점까지 데려가라. 잃으면 즉시 패배다. 사령부는 인접 아군이 있는 동안만 직접 피격을 면한다 — 엄호를 끊기지 마라.",
    // 사령부 이동력 2로 (13,6)→(2,8)은 방해가 전혀 없어도 7턴이다.
    // 12턴이면 싸우면서 갈 여유가 5턴 — 넉넉하지도 각박하지도 않게 잡았다.
    turnLimit: 12,
    // 팔레즈 포켓의 입이 닫히던 날. 걸어서 빠져나가는 것 말고는 길이 없던 그날.
    startDate: [1944, 8, 19],
    // 시간이 끝나면 포위한 쪽(동군)이 포켓을 짓뭉갠 것으로 본다.
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "PAYS D'AUGE", region: "NORMANDIE", city: "CAEN",
      towns: ["Saint-Lô", "Bayeux", "Lisieux", "Falaise", "Argentan", "Alençon"],
    },
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
    // 접어 둔 작전. 지도와 배치는 그대로 남겨 둔다 — 나중에 다시 쓸 판이다.
    // 이 한 줄만 지우면 명령서 목록에 그대로 돌아온다.
    retired: true,
    name: "보급선 개통",
    summary: "강이 전선을 둘로 갈랐다. 성한 다리는 북·중·남 셋뿐이고, 강폭이 두 칸이라 새로 놓으려면 공병대가 두 칸을 이어 붙여야 한다.",
    objectiveBrief: "동안의 화물역까지 보급선을 개통하고 유지하라. 부대를 세우는 것으로는 끝나지 않는다.",
    // 다리 하루, 창고 사흘, 철도 이틀. 짓는 시간까지 계산에 넣어야 하므로 기한이 길다.
    turnLimit: 24,
    // 마켓가든 개시일. 다리 하나에 작전 전체가 걸렸던 그 회랑의 첫날이다.
    startDate: [1944, 9, 17],
    // 시간이 끝나면 방어 측(동군)이 이긴다. 개통은 공격 측의 숙제다.
    timeoutWinner: "east",
    // 1944년 9월, 발 강. 다리 하나에 작전 전체가 걸렸던 그 회랑.
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "NOORDZEE", west: "BRABANT", east: "DE PEEL", region: "NEDERLAND", city: "NIJMEGEN",
      towns: ["Eindhoven", "Son", "Veghel", "Grave", "Elst", "Arnhem"],
    },
    // 9·10열이 강이다. 강폭은 위에서 아래까지 고르게 두 칸이다 — 예전에는 2·8·13행에서만
    // 10열을 뭍으로 바꿔 "한 칸으로 좁아지는 나루"를 만들었는데, 그러면 강 한복판에
    // 흙 한 칸이 떠 있는 그림이 된다. 물길은 그대로 두고, 그 세 자리에 원래 있던
    // 다리를 두 칸씩 얹었다(bridges). 건널 수 있는 자리는 예전과 똑같이 셋이다.
    // 새 다리를 놓으려면 공병대가 한 칸을 걸고, 그 위로 올라가 나머지 한 칸을 잇는다.
    terrain: [
      "PPPPPPPPPWWPPPPPPPPP",
      "PPFFPPPPPWWPPPPFFPPP",
      "PPFFPPPPPWWPPPPFFPPP",
      "CCCCCCCCCWWCCCCCCCCC",
      "PPPPPPPPPWWPPPPPHHBP",
      "PPPPHHPPPWWPPPPPHHPP",
      "PPPPHHPPPWWPPPPPPPPP",
      "PBPPPPPPPWWPPPPPPPPP",
      "CCCCCCCCCWWCCCCCCCCC",
      "PPPPPPPPPWWPPPPPPPPP",
      "PPPPPPPPPWWPPFFPPPPP",
      "PPPFFPPPPWWPPFFPPBPP",
      "PPPFFPPPPWWPPPPPPPPP",
      "CCCCCCCCCWWCCCCCCCCC",
      "PPBPPPPPPWWPPPPPPPPP",
      "PPPPPPPPPWWPPPPPPPPP",
    ],
    // 북·중·남 세 곳의 다리. 강폭이 두 칸이라 다리도 두 칸씩이다.
    bridges: [
      [9, 2],
      [10, 2],
      [9, 8],
      [10, 8],
      [9, 13],
      [10, 13],
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

  // ══════════════════════════════════════════════════════════════════════════
  //  실제 전투 열둘 (docs/작전-원본-12전투.md)
  //
  //  네 가지 원칙으로 옮겼다.
  //   1) 양쪽 다 이길 길이 있다. 한쪽만 목표를 가지면 다른 쪽은 관객이 된다.
  //   2) 기한은 계획이 아니라 판결이다 — 기한이 끝나면 누가 이기는지가 곧 그 전투의
  //      역사적 성격이다(엘 알라메인에서 시간은 롬멜의 적이 아니라 편이었다).
  //   3) 좌표가 곧 지형이다. 사막은 뚫려 있고, 보카주는 막혀 있고, 해협은 못 건넌다.
  //   4) 숫자는 맨 나중이다. 여기 적힌 배치는 판을 만들고, 세기는 에디터가 정한다.
  //
  //  lead는 그 전투에서 먼저 민 쪽이다. 목록 정렬과 카드 딱지에만 쓰인다 —
  //  규칙에는 아무 영향이 없다. 열두 작전 다 양쪽으로 할 수 있다.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: "elAlamein",
    name: "엘 알라메인",
    lead: "allies",
    summary: "북은 바다, 남은 소금 늪. 옆으로 돌 길이 없어 정면으로만 뚫는 회랑이다.",
    objectiveBrief: "연합군은 동쪽 능선을 점령하라. 추축군은 통로를 여는 공병대를 없애라.",
    turnLimit: 12,
    startDate: [1942, 10, 23],
    // 시간은 수비 측 편이다. 못 뚫으면 전선은 그대로 굳는다.
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "MEDITERRANEAN", west: "QATTARA", east: "RUWEISAT", region: "EGYPT", city: "EL ALAMEIN",
      towns: ["Tell el Eisa", "Miteiriya", "Deir el Shein", "Alam Halfa", "Naqb Abu Dweis", "El Taqa"],
    },
    // 위 두 줄은 지중해, 아래 세 줄은 카타라 저지대. 둘 다 통과 불가라 판이 옆으로
    // 새지 않는다 — 이 전투를 이 전투로 만드는 것은 바로 그 "돌 수 없음"이다.
    terrain: [
      "WWWWWWWWWWWWWWWWWWWW",
      "WWWWWWWWWWWWWWWWWWWW",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PBPPPPPPPPPPPPPPHHPP",
      "PPPPPPPPHHPPPPPPHHBP",
      "PPPPPPPPHHPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPHHPPPPPPHHPP",
      "PPBPPPPPHHPPPPPPHHPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPBPP",
      "WWWWWWWWWWWWWWWWWWWW",
      "WWWWWWWWWWWWWWWWWWWW",
      "WWWWWWWWWWWWWWWWWWWW",
    ],
    // 능선은 전부 서쪽에서 오는 공격을 막는다. 미는 쪽이 서군이기 때문이다.
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "................WW..",
      "........WW......WW..",
      "........WW..........",
      "....................",
      "....................",
      "........WW......WW..",
      "........WW......WW..",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 1, y: 4, production: 6 },
        { x: 2, y: 10, production: 5, neutral: true },
      ],
      // 공병이 둘이다. 추축군의 목표가 "공병 격멸"이라 하나뿐이면 첫 포격 한 방에
      // 판이 끝난다. 둘이면 잃어도 작전은 이어지고, 잃은 무게는 그대로 남는다.
      units: [
        ["infantry", 2, 3],
        ["infantry", 2, 5],
        ["infantry", 3, 10],
        ["armor", 3, 4],
        ["artillery", 1, 3],
        ["engineer", 2, 4],
        ["engineer", 3, 5],
        ["battalionHQ", 1, 5],
      ],
      objectives: [{ kind: "seize", x: 17, y: 9, label: "동쪽 능선" }],
    },
    east: {
      bases: [
        { x: 18, y: 5, production: 6 },
        { x: 17, y: 12, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 16, 6],
        ["infantry", 17, 6],
        ["infantry", 16, 11],
        ["armor", 16, 8],
        ["artillery", 18, 6],
        ["battalionHQ", 18, 4],
        ["battalionHQ", 17, 11],
      ],
      // 지뢰밭을 걷어내는 손을 없애면 기갑은 한 발도 못 나간다.
      objectives: [{ kind: "destroy", targetType: "engineer", label: "공병대" }],
    },
  },

  {
    id: "uranus",
    name: "천왕성",
    lead: "allies",
    summary: "돈 강이 판을 세로로 가른다. 건널 곳은 칼라치 다리 하나뿐이다.",
    objectiveBrief: "연합군은 칼라치 다리를 사흘 잡아라. 추축군은 서쪽 탈출로를 열어라.",
    turnLimit: 10,
    startDate: [1942, 11, 19],
    // 자루가 반쯤 닫힌 채 끝나면 어느 쪽도 이기지 못한 것이다.
    timeoutWinner: null,
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "VOLGA", west: "DON BEND", east: "STEPPE", region: "STALINGRAD", city: "KALACH",
      towns: ["Kletskaya", "Serafimovich", "Raspopinskaya", "Sovetsky", "Marinovka", "Abganerovo"],
    },
    terrain: [
      "PPPPPPPPPWPPPPPPPPPP",
      "PBPPPPPPPWPPPPPPPPPP",
      "PPPPPPPPPWPPPPPPPPBP",
      "PPPPPPPPPWPPPPPPPPPP",
      "CCCCCCCCCWCCCCCCCCCC",
      "PPPPPPPPPWPPPPPPPPPP",
      "PPPPHHPPPWPPPPHHPPPP",
      "PPPPHHPPPWPPPPHHPPPP",
      "CCCCCCCCCWCCCCCCCCCC",
      "PPPPPPPPPWPPPPPPPPPP",
      "PPPPPPPPPWPPPPPPPPPP",
      "PPBPPPPPPWPPPPPPPPPP",
      "PPPPPPPPPWPPPPPPPPPP",
      "CCCCCCCCCWCCCCCCCCCC",
      "PPPPPPPPPWPPPPPPPBPP",
      "PPPPPPPPPWPPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....EE........WW....",
      "....EE........WW....",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    // 다리 하나. 양쪽 다 여기를 지나야 하므로 이 한 칸이 전투 전체다.
    // 공병이 더 놓을 수는 있지만 두 개가 최대라 강은 여전히 목을 조른다.
    bridges: [[9, 8]],
    west: {
      bases: [
        { x: 1, y: 1, production: 6 },
        { x: 2, y: 11, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 1],
        ["infantry", 3, 11],
        ["armor", 3, 2],
        ["armor", 3, 10],
        ["artillery", 1, 2],
        ["engineer", 2, 2],
        ["battalionHQ", 1, 0],
      ],
      objectives: [{ kind: "seize", x: 9, y: 8, label: "칼라치 다리", holdTurns: 3 }],
    },
    east: {
      bases: [
        { x: 18, y: 2, production: 6 },
        { x: 17, y: 14, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 2],
        ["infantry", 17, 13],
        ["armor", 16, 3],
        ["armor", 16, 13],
        ["artillery", 18, 3],
        ["engineer", 18, 13],
        ["battalionHQ", 18, 1],
        ["battalionHQ", 16, 14],
      ],
      // 갇히기 전에 서쪽 끝으로 빠져나가면 포위는 실패다.
      objectives: [{ kind: "seize", x: 0, y: 8, label: "서쪽 탈출로" }],
    },
  },

  {
    id: "bagration",
    name: "바그라티온",
    lead: "allies",
    summary: "늪과 숲 사이로 난 간선 셋. 남북에서 동시에 집게를 닫아야 자루가 된다.",
    objectiveBrief: "연합군은 동쪽 거점 둘을 모두 점령하라. 추축군은 서군 사령부를 격멸하라.",
    turnLimit: 14,
    startDate: [1944, 6, 22],
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "BEREZINA", west: "PRIPYAT", east: "DNEPR", region: "BELORUSSIA", city: "BOBRUISK",
      towns: ["Vitebsk", "Orsha", "Mogilev", "Slutsk", "Osipovichi", "Minsk"],
    },
    terrain: [
      "PPFFPPPPPPWPPFFPPPPP",
      "PBFFPPPPPPWPPFFPPPBP",
      "PPPPPPPPPPWPPPPPPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPPFFPPPPWPPPPPPPPP",
      "PPPPFFPPPPWPPPPPPPPP",
      "PPPPPPPPPPWPPPPPPPPP",
      "PPPHHPPPPPWPPPPPPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPHHPPPPPWPPPPPPPPP",
      "PPPPPPPPPPWPPPPPPPPP",
      "PPFFPPPPPPWPPHHPPPPP",
      "PPFFPPPPPPWPPHHPPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPBPPPPPPPWPPPPPPPBP",
      "PPPPPPPPPPWPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...EE...............",
      "....................",
      "...EE...............",
      "....................",
      ".............WW.....",
      ".............WW.....",
      "....................",
      "....................",
      "....................",
    ],
    bridges: [
      [10, 3],
      [10, 8],
      [10, 13],
    ],
    west: {
      bases: [
        { x: 1, y: 1, production: 6 },
        { x: 2, y: 14, production: 5, neutral: true },
      ],
      // 사령부가 둘이다. 추축군의 목표가 사령부 격멸이므로 하나로는 판이 너무 짧다.
      units: [
        ["infantry", 2, 2],
        ["infantry", 3, 14],
        ["armor", 4, 1],
        ["armor", 4, 13],
        ["artillery", 1, 2],
        ["engineer", 2, 13],
        ["battalionHQ", 1, 0],
        ["battalionHQ", 3, 15],
      ],
      // 두 집게는 한 묶음이다. 하나만 닫으면 적은 그대로 빠져나간다.
      objectives: [
        { kind: "seize", x: 18, y: 1, label: "북쪽 집게", group: "pincer" },
        { kind: "seize", x: 18, y: 14, label: "남쪽 집게", group: "pincer" },
      ],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 18, y: 14, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 2],
        ["infantry", 17, 13],
        ["armor", 16, 1],
        ["armor", 16, 13],
        ["artillery", 18, 3],
        ["battalionHQ", 18, 2],
        ["battalionHQ", 17, 15],
      ],
      objectives: [{ kind: "destroy", targetType: "battalionHQ", label: "대대 사령부" }],
    },
  },

  {
    id: "cobra",
    name: "코브라",
    lead: "allies",
    summary: "보카주 울타리가 사방을 막는다. 남으로 뚫린 길은 가운데 회랑 하나뿐이다.",
    objectiveBrief: "연합군은 남쪽 출구까지 내려가라. 추축군은 회랑을 이틀 끊어라.",
    turnLimit: 10,
    startDate: [1944, 7, 25],
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "COTENTIN", east: "BOCAGE", region: "NORMANDIE", city: "SAINT-LO",
      towns: ["Marigny", "Coutances", "Périers", "Villedieu", "Vire", "Avranches"],
    },
    // 세로 간선 하나(10열)가 판을 위에서 아래로 관통한다. 숲이 그 옆을 다 막고 있어
    // 기갑은 회랑을 벗어나는 순간 느려진다 — 보카주가 하는 일이 바로 그것이다.
    terrain: [
      "PPPPPPPPPPCPPPPPPPPP",
      "PBPPFFPPPPCPPFFPPPBP",
      "PPPFFFPPPPCPPFFFPPPP",
      "PPPFFFPPPPCPPPFFPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPFFFPPPPPCPPPFFFPPP",
      "PPFFFPPHHPCPHHPFFPPP",
      "PPPPPPPHHPCPHHPPPPPP",
      "PPFFPPPPPPCPPPPFFPPP",
      "PPFFFPPPPPCPPPPFFPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPFFPPPPPCPPPFFFPPP",
      "PPFFFPPPPPCPPPFFPPPP",
      "PPFFPPPPPPCPPPPFPPPP",
      "PPPPPPPPPPCPPPPPPPBP",
      "PPBPPPPPPPCPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      ".......EE...WW......",
      ".......EE...WW......",
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
        { x: 1, y: 1, production: 6 },
        { x: 2, y: 15, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 1],
        ["infantry", 3, 15],
        ["armor", 1, 2],
        ["artillery", 1, 0],
        ["engineer", 2, 2],
        ["battalionHQ", 1, 3],
        ["battalionHQ", 2, 14],
      ],
      objectives: [{ kind: "seize", x: 10, y: 15, label: "남쪽 출구" }],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 18, y: 14, production: 5, neutral: true },
      ],
      // 회랑 양옆 고지에 미리 앉혀 둔다. 목표가 그 아래 한 칸이라 첫날부터 압박이 된다.
      units: [
        ["infantry", 17, 1],
        ["infantry", 12, 6],
        ["armor", 16, 2],
        ["armor", 13, 7],
        ["artillery", 18, 2],
        ["battalionHQ", 18, 0],
        ["battalionHQ", 17, 14],
      ],
      objectives: [{ kind: "seize", x: 10, y: 7, label: "회랑 절단점", holdTurns: 2 }],
    },
  },

  {
    id: "marketGarden",
    name: "마켓가든",
    lead: "allies",
    summary: "물길 셋을 가로지르는 외길. 다리 셋이 다 서 있어야 북쪽 교두보가 산다.",
    objectiveBrief: "연합군은 아른헴 교두보까지 보급선을 사흘 이어라. 추축군은 회랑을 끊어라.",
    turnLimit: 12,
    startDate: [1944, 9, 17],
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "NOORDZEE", west: "BRABANT", east: "DE PEEL", region: "NEDERLAND", city: "NIJMEGEN",
      towns: ["Eindhoven", "Son", "Veghel", "Grave", "Elst", "Arnhem"],
    },
    // 9열이 「지옥의 고속도로」다. 물길 세 줄을 건너는 자리에만 다리가 있어
    // 판 전체에서 남북으로 이동할 수 있는 경로는 이 한 줄뿐이다.
    terrain: [
      "PPPPPPPPPCPPPPPPPPPP",
      "PPFFPPPPPCPPPPFFPPBP",
      "PPFFPPPPPCPPPPFFPPPP",
      "WWWWWWWWWWWWWWWWWWWW",
      "PPPPPPPPPCPPPPPPPPPP",
      "PPPPPHHPPCPPHHPPPPPP",
      "PPPPPHHPPCPPHHPPPPPP",
      "WWWWWWWWWWWWWWWWWWWW",
      "PPPPBPPPPCPPPPPPPPPP",
      "PPFFPPPPPCPPPPFFPPPP",
      "PPFFPPPPPCPPPPFFPPPP",
      "WWWWWWWWWWWWWWWWWWWW",
      "PPPPPPPPPCPPPPPBPPPP",
      "PPPPPPPPPCPPPPPPPPPP",
      "PBPPPPPPPCPPPPPPPPPP",
      "PPPPPPPPPCPPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      ".....EE.....WW......",
      ".....EE.....WW......",
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
    bridges: [
      [9, 3],
      [9, 7],
      [9, 11],
    ],
    west: {
      bases: [
        { x: 1, y: 14, production: 6 },
        { x: 4, y: 8, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 14],
        ["infantry", 2, 13],
        ["armor", 1, 13],
        ["artillery", 1, 15],
        ["engineer", 2, 15],
        ["engineer", 3, 14],
        ["battalionHQ", 1, 12],
      ],
      // 밟는 것이 아니라 잇는 것이다. 회랑 위에 적이 한 부대라도 서 있으면 선이 끊긴다.
      objectives: [{ kind: "supply", x: 9, y: 2, label: "아른헴 교두보", holdTurns: 3 }],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 15, y: 12, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 12, 2],
        ["infantry", 9, 8],
        ["infantry", 9, 4],
        ["armor", 14, 4],
        ["artillery", 17, 2],
        ["engineer", 17, 1],
        ["battalionHQ", 18, 2],
        ["battalionHQ", 14, 12],
      ],
      // 가운데 다리에 앉으면 그것만으로 북쪽 보급선이 끊긴다. 목표 하나가 두 몫을 한다.
      objectives: [{ kind: "seize", x: 9, y: 7, label: "회랑 절단점", holdTurns: 2 }],
    },
  },

  {
    id: "imphal",
    name: "임팔·코히마",
    lead: "allies",
    summary: "산에 둘러싸인 진지 하나. 포위된 쪽이 남쪽 길을 다시 열어야 산다.",
    objectiveBrief: "연합군은 남쪽 도로까지 보급선을 사흘 이어라. 추축군은 임팔 진지를 점령하라.",
    turnLimit: 16,
    startDate: [1944, 3, 8],
    // 버티면 이긴다. 굶는 쪽은 포위한 쪽이었다.
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "CHINDWIN", west: "MANIPUR", east: "CHIN HILLS", region: "BURMA", city: "IMPHAL",
      towns: ["Kohima", "Sangshak", "Bishenpur", "Tamu", "Palel", "Tiddim"],
    },
    // 가운데 진지(8,6)를 고지가 빙 두르고 있다. 지키기는 쉽고 나가기는 어렵다 —
    // 그런데 이 판은 나가야 이긴다.
    terrain: [
      "PPHHPPPPHHPPPPHHPPPP",
      "PPHHPPPPHHPPPPHHPPBP",
      "PPPPPPPPHHPPPPHHPPPP",
      "PPFFPPPPPPPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPFFPPPHHHPPPPFFPPPP",
      "PPPPPPPHBHPPPPFFPPPP",
      "PPPPPPPHHHPPPPPPPPPP",
      "PPHHPPPPPPPPPPHHPPPP",
      "PPHHPPPPPPPPPPHHPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPFFPPPPPPPPFFPPPPPP",
      "PPFFPPPPPPPPFFPPPPPP",
      "CCCCCCCCBCCCCCCCCBCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPHHPPPPPPPP",
    ],
    hillDefense: [
      "..NN....NN....NN....",
      "..NN....NN....NN....",
      "........NN....NN....",
      "....................",
      "....................",
      ".......NNN..........",
      ".......W.E..........",
      ".......SSS..........",
      "..EE..........WW....",
      "..EE..........WW....",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "..........NN........",
    ],
    west: {
      bases: [
        { x: 8, y: 6, production: 6 },
        { x: 8, y: 13, production: 5, neutral: true },
      ],
      // 진지 둘레에 그대로 앉아 있다. 여기서 이기려면 이 고리를 스스로 풀고 내려가야 한다.
      units: [
        ["infantry", 7, 5],
        ["infantry", 9, 5],
        ["infantry", 8, 7],
        ["armor", 8, 5],
        ["artillery", 7, 6],
        ["engineer", 9, 6],
        ["engineer", 7, 7],
        ["battalionHQ", 9, 7],
      ],
      objectives: [{ kind: "supply", x: 12, y: 13, label: "남쪽 도로", holdTurns: 3 }],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 17, y: 13, production: 5, neutral: true },
      ],
      // 사방에서 조인다. 거점에서 멀리 나와 있어 시간이 갈수록 저쪽이 먼저 굶는다.
      units: [
        ["infantry", 5, 4],
        ["infantry", 11, 4],
        ["infantry", 6, 9],
        ["infantry", 11, 9],
        ["armor", 12, 6],
        ["artillery", 4, 6],
        ["battalionHQ", 16, 2],
        ["battalionHQ", 16, 13],
      ],
      objectives: [{ kind: "seize", x: 8, y: 6, label: "임팔 진지" }],
    },
  },

  {
    id: "sichelschnitt",
    name: "낫질",
    lead: "axis",
    summary: "아무도 기갑이 못 지난다고 한 숲 뒤에서 나온다. 강 하나만 건너면 해안까지 뚫린다.",
    objectiveBrief: "추축군은 서쪽 해안까지 내달려라. 연합군은 그 기갑을 모두 격파하라.",
    turnLimit: 12,
    startDate: [1940, 5, 13],
    // 낫이 닿기 전에 시간이 다 가면 전선은 다시 굳는다.
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "LA MANCHE", west: "PICARDIE", east: "ARDENNES", region: "FRANCE", city: "SEDAN",
      towns: ["Dinant", "Monthermé", "Bouillon", "Stonne", "Montcornet", "Abbeville"],
    },
    // 판이 가로로 길다. 이 전투는 "얼마나 멀리, 얼마나 빨리"의 이야기라
    // 세로로 넓은 판에서는 그 뜻이 나오지 않는다.
    terrain: [
      "PPFFFFPPPPWPPFFFFPPP",
      "PBFFFFPPPPWPPFFFFPPP",
      "PPFFFPPPPPWPPFFFFFPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPPPPPPPPWPPPFFFPPP",
      "PPPHHPPPPPWPPPPPPPBP",
      "PPPHHPPPPPWPPPPPPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPPPPPPPPWPPFFFFPPP",
      "PPBPPPPPPPWPPFFFFPPP",
      "PPPPPPPPPPWPPPPPPPPP",
      "PPPPPPPPPPWPPPPPPPBP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...EE...............",
      "...EE...............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    bridges: [
      [10, 3],
      [10, 7],
    ],
    west: {
      bases: [
        { x: 1, y: 1, production: 6 },
        { x: 2, y: 9, production: 5, neutral: true },
      ],
      // 다리 둘에 초병을 하나씩 세워 둔다. 여기서 하루를 벌면 뒤가 정리된다.
      units: [
        ["infantry", 2, 1],
        ["infantry", 3, 9],
        ["infantry", 9, 3],
        ["infantry", 9, 7],
        ["armor", 2, 2],
        ["artillery", 1, 2],
        ["engineer", 2, 8],
        ["battalionHQ", 1, 0],
        ["battalionHQ", 2, 10],
      ],
      // 기갑 셋을 다 잡아야 낫이 멈춘다.
      objectives: [{ kind: "destroy", targetType: "armor", label: "기갑부대" }],
    },
    east: {
      bases: [
        { x: 18, y: 5, production: 6 },
        { x: 18, y: 11, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 5],
        ["infantry", 17, 11],
        ["armor", 16, 4],
        ["armor", 16, 6],
        ["armor", 15, 8],
        ["artillery", 18, 6],
        ["engineer", 18, 4],
        ["battalionHQ", 18, 7],
        ["battalionHQ", 17, 10],
      ],
      objectives: [{ kind: "seize", x: 0, y: 7, label: "서쪽 해안" }],
    },
  },

  {
    id: "merkur",
    name: "메르쿠어",
    lead: "axis",
    summary: "하늘에서 내려앉은 부대가 거점 없이 흩어져 있다. 비행장을 잡기 전에 굶는다.",
    objectiveBrief: "추축군은 말레메 비행장을 이틀 잡아라. 연합군은 강하부대를 모두 쓸어라.",
    turnLimit: 8,
    startDate: [1941, 5, 20],
    // 여드레를 버티면 하늘에서 온 쪽이 먼저 말라 죽는다.
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "KRITIKO PELAGOS", west: "CHANIA", east: "RETHYMNO", region: "KRITI", city: "MALEME",
      towns: ["Galatas", "Platanias", "Souda", "Kastelli", "Georgioupoli", "Sfakia"],
    },
    terrain: [
      "WWWWWWWWWWWWWWWWWWWW",
      "WWWWWWWWWWWWWWWWWWWW",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPBPPPPPPPPPPPPP",
      "PPPHHPPPHHPPPHHPPPBP",
      "PPPHHPPPHHPPPHHPPPPP",
      "PBPPPPPPPPPPPPPPPPPP",
      "PPPHHPPPPPPPPHHPPPPP",
      "PPPHHPPPPPPPPHHPPBPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "WWWWWWWWWWWWWWWWWWWW",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "...EE...NN...WW.....",
      "...EE...NN...WW.....",
      "....................",
      "...EE........WW.....",
      "...EE........WW.....",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 6, y: 3, production: 6 },
        { x: 1, y: 6, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 5, 3],
        ["infantry", 7, 3],
        ["infantry", 2, 7],
        ["armor", 5, 4],
        ["artillery", 6, 2],
        ["engineer", 2, 6],
        ["battalionHQ", 6, 4],
      ],
      objectives: [{ kind: "destroy", targetType: "infantry", label: "강하부대" }],
    },
    east: {
      bases: [
        { x: 18, y: 4, production: 6 },
        { x: 17, y: 8, production: 5, neutral: true },
      ],
      // 기갑이 없다. 하늘로 온 부대는 전차를 데려오지 못한다 — 그것이 이 판의 전부다.
      // 앞의 넷은 거점에서 멀리 떨어진 채 시작해 첫날부터 보급이 흔들린다.
      units: [
        ["infantry", 8, 4],
        ["infantry", 9, 6],
        ["infantry", 11, 3],
        ["infantry", 10, 8],
        ["artillery", 16, 4],
        ["engineer", 17, 5],
        ["battalionHQ", 17, 4],
        ["battalionHQ", 16, 8],
      ],
      objectives: [{ kind: "seize", x: 6, y: 3, label: "말레메 비행장", holdTurns: 2 }],
    },
  },

  {
    id: "singapore",
    name: "싱가포르",
    lead: "axis",
    summary: "해협에 다리가 하나도 없다. 건너려면 공병이 놓아야 하고, 그 공병이 표적이다.",
    objectiveBrief: "추축군은 저수지를 사흘 잡아라. 연합군은 공병대를 모두 격파하라.",
    turnLimit: 10,
    startDate: [1942, 2, 8],
    // 물을 못 건너고 기한이 끝나면 요새는 그대로 남는다.
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "SELAT JOHOR", west: "KRANJI", east: "SERANGOON", region: "SINGAPURA", city: "BUKIT TIMAH",
      towns: ["Sarimbun", "Choa Chu Kang", "Jurong", "Pasir Panjang", "Nee Soon", "Changi"],
    },
    // bridges가 없다. 놓여 있는 다리가 한 칸도 없는 유일한 판이다.
    terrain: [
      "PPPPPPPPPPWPPPPPPPPP",
      "PPFFPPPPPPWPPFFPPPBP",
      "PPFFPPPPPPWPPFFPPPPP",
      "PPPPPPPPPPWPPPPPPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPPHHPPPPWPPPPPPPPP",
      "PPBPHHPPPPWPPPPPPPPP",
      "PPPPPPPPPPWPPPFFPPPP",
      "PPPPPPPPPPWPPPFFPPPP",
      "CCCCCCCCCCWCCCCCCCCC",
      "PPPPPPPPPPWPPPPPPPPP",
      "PPFFPPPPPPWPPPPPPPPP",
      "PPFFPPPPPPWPPPHHPPPP",
      "PBPPPPPPPPWPPPHHPPPP",
      "PPPPPPPPPPWPPPPPPPBP",
      "PPPPPPPPPPWPPPPPPPPP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....EE..............",
      "....EE..............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "..............WW....",
      "..............WW....",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 2, y: 6, production: 6 },
        { x: 1, y: 13, production: 5, neutral: true },
      ],
      // 수가 많지만 넓게 흩어져 있다. 요새의 병력은 늘 지도 위에서만 많았다.
      units: [
        ["infantry", 3, 5],
        ["infantry", 3, 7],
        ["infantry", 6, 2],
        ["infantry", 6, 11],
        ["armor", 4, 9],
        ["artillery", 1, 5],
        ["artillery", 2, 12],
        ["engineer", 1, 6],
        ["battalionHQ", 3, 6],
        ["battalionHQ", 2, 13],
      ],
      objectives: [{ kind: "destroy", targetType: "engineer", label: "공병대" }],
    },
    east: {
      bases: [
        { x: 18, y: 1, production: 6 },
        { x: 18, y: 14, production: 5, neutral: true },
      ],
      // 수는 적다. 대신 공병이 둘이라 해협을 두 곳에서 걸 수 있다.
      units: [
        ["infantry", 12, 4],
        ["infantry", 12, 9],
        ["armor", 14, 4],
        ["engineer", 11, 4],
        ["engineer", 11, 9],
        ["battalionHQ", 13, 4],
      ],
      objectives: [{ kind: "seize", x: 2, y: 6, label: "저수지", holdTurns: 3 }],
    },
  },

  {
    id: "gazala",
    name: "가잘라",
    lead: "axis",
    summary: "사막에 그은 선의 남쪽 끝은 늘 열려 있다. 돌아 들어간 쪽이 먼저 보급을 잃는다.",
    objectiveBrief: "연합군은 비르하케임을 닷새 잡고 적 사령부까지 격멸하라. 추축군은 토브룩을 점령하라.",
    turnLimit: 20,
    startDate: [1942, 5, 26],
    // 길어지면 뚫는 쪽이 먼저 말라붙는다.
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "MEDITERRANEAN", west: "GAZALA", east: "CYRENAICA", region: "LIBYA", city: "TOBRUK",
      towns: ["Bir Hakeim", "Acroma", "El Adem", "Knightsbridge", "Sidi Muftah", "Bir el Gubi"],
    },
    terrain: [
      "WWWWWWWWWWWWWWWWWWWW",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPBPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPHHPPPPPPPPPPPPBP",
      "PPPPHHPPPPPPHHPPPPPP",
      "PPPPPPPPPPPPHHPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPHHPPPPPPPPPPPP",
      "PPPPPPHHPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPBPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPBP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....EE..............",
      "....EE......WW......",
      "............WW......",
      "....................",
      "....................",
      "......EE............",
      "......EE............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 3, y: 2, production: 6 },
        { x: 2, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 4, 2],
        ["infantry", 4, 3],
        ["infantry", 3, 12],
        ["armor", 5, 3],
        ["armor", 4, 12],
        ["artillery", 2, 2],
        ["engineer", 3, 3],
        ["battalionHQ", 3, 1],
      ],
      // 남쪽 끝의 비르하케임은 아직 아무 것도 아니다 — 먼저 가서 잡고, 닷새를 버티고,
      // 그 사이 돌아 들어온 적 사령부까지 잡아야 한 묶음이 닫힌다.
      objectives: [
        { kind: "seize", x: 2, y: 13, label: "비르하케임", holdTurns: 5, group: "counter" },
        { kind: "destroy", targetType: "battalionHQ", label: "대대 사령부", group: "counter" },
      ],
    },
    east: {
      bases: [
        { x: 18, y: 4, production: 6 },
        { x: 18, y: 15, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 4],
        ["infantry", 16, 5],
        ["armor", 16, 3],
        ["armor", 15, 8],
        ["artillery", 18, 5],
        ["engineer", 18, 3],
        ["battalionHQ", 18, 6],
        ["battalionHQ", 17, 15],
      ],
      objectives: [{ kind: "seize", x: 3, y: 2, label: "토브룩 요새" }],
    },
  },

  {
    id: "kharkov",
    name: "하르코프",
    lead: "axis",
    summary: "너무 멀리 나온 쪽이 도시 안에 앉아 있고, 예비대는 아직 손도 대지 않았다.",
    objectiveBrief: "추축군은 하르코프를 되찾아라. 연합군은 동쪽 진출선까지 더 나아가라.",
    turnLimit: 14,
    startDate: [1943, 2, 19],
    // 반격이 늦으면 전선은 그 자리에서 굳는다.
    timeoutWinner: "east",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "SEVERSKY DONETS", west: "DNEPR", east: "OSKOL", region: "UKRAINE", city: "KHARKOV",
      towns: ["Krasnograd", "Pavlograd", "Losovaya", "Merefa", "Taranovka", "Chuguyev"],
    },
    // 서군의 거점이 판 한가운데(11,6)에 있다. 이미 밀고 들어와 있다는 뜻이고,
    // 그래서 뒤가 비어 있다 — 이 판의 위험은 전부 등 뒤에서 온다.
    terrain: [
      "PPFFPPPPPPPPPPFFPPPP",
      "PPFFPPPPPPPPPPFFPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPHHPPPPPPPPPPPP",
      "PPPPPPHHPPPBPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPBP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPFFPPPPPPPPPPPPPPPP",
      "PPFFPPPPPPPPHHPPPPPP",
      "PPPPPPPPPPPPHHPPPPPP",
      "PPPPBPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPBP",
    ],
    hillDefense: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "......EE............",
      "......EE............",
      "....................",
      "....................",
      "....................",
      "....................",
      "............WW......",
      "............WW......",
      "....................",
      "....................",
      "....................",
    ],
    west: {
      bases: [
        { x: 11, y: 6, production: 6 },
        { x: 4, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 10, 5],
        ["infantry", 12, 7],
        ["infantry", 13, 9],
        ["armor", 12, 5],
        ["armor", 11, 8],
        ["artillery", 10, 6],
        ["engineer", 10, 7],
        ["battalionHQ", 11, 7],
        ["battalionHQ", 5, 13],
      ],
      objectives: [{ kind: "seize", x: 19, y: 9, label: "동쪽 진출선" }],
    },
    east: {
      bases: [
        { x: 18, y: 8, production: 6 },
        { x: 18, y: 15, production: 5, neutral: true },
      ],
      // 예비 기갑 셋이 뒤에 모여 있다. 손대지 않은 주먹이 반격의 전부다.
      units: [
        ["infantry", 17, 8],
        ["infantry", 17, 10],
        ["armor", 16, 7],
        ["armor", 16, 9],
        ["armor", 17, 12],
        ["artillery", 18, 7],
        ["engineer", 18, 9],
        ["battalionHQ", 18, 6],
        ["battalionHQ", 17, 15],
      ],
      objectives: [{ kind: "seize", x: 11, y: 6, label: "하르코프" }],
    },
  },

  {
    id: "zitadelle",
    name: "성채",
    lead: "axis",
    summary: "능선 하나를 두고 정면으로 민다. 미는 쪽이 지치는 날, 다른 쪽 명령이 열린다.",
    objectiveBrief: "추축군은 올호바트카 능선을 점령하라. 연합군은 여드레를 버틴 뒤 동군 후방 거점을 잡아라.",
    turnLimit: 12,
    startDate: [1943, 7, 5],
    timeoutWinner: "west",
    map: { enabled: true },
    // 판에 깔린 그림은 어느 작전이나 같은 한 장이다. 이름만 이 전장의 것으로 바꿔 단다.
    mapLabels: {
      sea: "OKA", west: "KURSK", east: "STEPPE FRONT", region: "ORYOL", city: "PONYRI",
      towns: ["Olkhovatka", "Maloarkhangelsk", "Teploye", "Soborovka", "Samodurovka", "Fatezh"],
    },
    terrain: [
      "PPPPPPPPHHHPPPPPPPPP",
      "PPPPPPPPHHHPPPPPPPPP",
      "PPFFPPPPPPPPPPPPPPPP",
      "PBPPPPPPPPPPPPPPPPBP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPHHPPPPPPPHHPPPP",
      "PPPPPHHPPPPPPPHHPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "CCCCCCCCCCCCCCCCCCCC",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPFFPPPPPPPPFFPPPPPP",
      "PPFFPPPPPPPPFFPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPBPPPPPPPPPPPPPPPBP",
      "PPPPPPPPPPPPPPPPPPPP",
      "PPPPPPPPPPPPPPPPPPPP",
    ],
    // 능선은 남쪽에서 오는 공격을 막는다. 미는 쪽이 남에서 북으로 올라오기 때문이다.
    hillDefense: [
      "........SSS.........",
      "........SSS.........",
      "....................",
      "....................",
      "....................",
      ".....EE.......WW....",
      ".....EE.......WW....",
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
        { x: 1, y: 3, production: 6 },
        { x: 2, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 2, 2],
        ["infantry", 3, 3],
        ["infantry", 8, 2],
        ["infantry", 10, 2],
        ["armor", 2, 4],
        ["artillery", 1, 2],
        ["engineer", 2, 3],
        ["battalionHQ", 1, 4],
        ["battalionHQ", 3, 13],
      ],
      // 아흐레째가 되기 전에는 없는 명령이다. 그때까지는 능선을 내주지 않는 것만이 할 일이다.
      objectives: [{ kind: "seize", x: 18, y: 13, label: "동군 후방 거점", fromTurn: 9 }],
    },
    east: {
      bases: [
        { x: 18, y: 3, production: 6 },
        { x: 18, y: 13, production: 5, neutral: true },
      ],
      units: [
        ["infantry", 17, 3],
        ["infantry", 16, 2],
        ["armor", 16, 4],
        ["armor", 15, 3],
        ["artillery", 18, 4],
        ["engineer", 18, 2],
        ["battalionHQ", 18, 5],
        ["battalionHQ", 17, 13],
      ],
      objectives: [{ kind: "seize", x: 9, y: 0, label: "올호바트카 능선" }],
    },
  },
];

// 기본 작전. 아무 것도 고르기 전에 배경으로 깔리는 판이고, 저장된 작전을 못 찾을 때
// 돌아오는 자리다. 접어 둔 작전을 여기 두면 목록에 없는 판이 배경에 깔린다.
const defaultScenarioId = "cobra";

function findScenario(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios.find((scenario) => scenario.id === defaultScenarioId) ?? scenarios[0];
}
