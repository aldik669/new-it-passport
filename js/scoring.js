const PROFILE_LABELS = {
  visual: { title: "Creative / Visual", track: "Визуальное программирование и дизайн" },
  game: { title: "Game Developer", track: "Разработка игр" },
  web: { title: "Web / Frontend", track: "Веб и интерфейсы" },
  logic: { title: "Software / Logic", track: "Логика и алгоритмы" }
};

function emptyScores() {
  return { visual: 0, game: 0, web: 0, logic: 0 };
}

function sortProfiles(scores) {
  return Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b));
}

function applyGameInfluence(questionScores, memory, color, route) {
  const s = { ...questionScores };

  if (memory.accuracy >= 80) s.logic += 1;
  if (memory.accuracy >= 85 && memory.averageResponseTime <= 3500) s.game += 1;
  if (memory.completedLevels >= 4) s.visual += 1;
  if (memory.correctionsCount <= 2 && memory.accuracy >= 75) s.web += 1;

  if (color.colorAccuracy >= 80) s.logic += 1;
  if (color.averageReactionTime <= 1200 && color.colorAccuracy >= 70) s.game += 1;
  if (color.impulseErrors <= 2) s.web += 1;
  if (color.colorAccuracy >= 75) s.visual += 1;

  if (route.routeEfficiency >= 85) s.logic += 1;
  if (route.timeToStart <= 3000 && route.routeEfficiency >= 70) s.game += 1;
  if (route.wallHits === 0 && route.wrongDoorAttempts === 0) s.web += 1;
  if (route.extraCommands <= 2) s.visual += 1;

  return s;
}

function buildStrengths(memory, color, route, topProfiles) {
  const list = [];
  if (memory.accuracy >= 75) list.push("хорошо запоминает визуальные patterns");
  if (color.colorAccuracy >= 70) list.push("умеет быстро реагировать");
  if (route.routeEfficiency >= 70) list.push("хорошо понимает последовательность действий");
  if (topProfiles.includes("game")) list.push("проявляет интерес к игровым задачам");
  if (topProfiles.includes("web")) list.push("аккуратно выбирает решения");
  if (topProfiles.includes("visual")) list.push("внимательно воспринимает визуальные детали");

  const defaults = [
    "любознательность в IT-задачах",
    "готовность пробовать новые форматы",
    "позитивный подход к обучению"
  ];
  while (list.length < 3) {
    const d = defaults[list.length % defaults.length];
    if (!list.includes(d)) list.push(d);
  }
  return list.slice(0, 3);
}

function buildGrowthZones(memory, color, route) {
  const zones = [];
  if (memory.totalMissed > 2)
    zones.push("можно развивать внимательность к деталям");
  if (color.impulseErrors > 2)
    zones.push("можно тренировать устойчивость к заданиям с переключением внимания");
  if (route.extraCommands > 3)
    zones.push("можно усилить навык выбора короткого пути");
  if (memory.correctionsCount > 4)
    zones.push("можно развивать спокойное планирование перед действием");

  const fallback = [
    "можно развивать уверенность в новых цифровых задачах",
    "можно тренировать последовательность шагов в проектах"
  ];
  while (zones.length < 2) {
    const z = fallback[zones.length % fallback.length];
    if (!zones.includes(z)) zones.push(z);
  }
  return zones.slice(0, 3);
}

function computeFinalScores(questionScores, memory, color, route) {
  const influenced = applyGameInfluence(questionScores, memory, color, route);
  const ranking = sortProfiles(influenced);
  const totalScore = Object.values(influenced).reduce((a, b) => a + b, 0);

  const memoryScore = Math.min(100, Math.round(memory.accuracy * 0.7 + memory.completedLevels * 6));
  const focusScore = Math.min(
    100,
    Math.round(color.colorAccuracy * 0.8 + (100 - Math.min(color.impulseErrors * 8, 40)) * 0.2)
  );
  const routeScore = Math.min(100, Math.round(route.routeEfficiency));
  const accuracy = Math.round(
    (memory.accuracy + color.colorAccuracy + route.routeEfficiency) / 3
  );

  const top3 = ranking.slice(0, 3);
  const strengths = buildStrengths(memory, color, route, top3);
  const growthZones = buildGrowthZones(memory, color, route);

  const peerPercentile = Math.min(92, Math.max(68, 55 + Math.round(accuracy * 0.35)));
  const abstractTraits = [
    "гибкое мышление в цифровых задачах",
    "уверенность в новых форматах",
    "способность удерживать внимание",
    "интерес к исследованию и пробам",
    "потенциал для уверенного роста в IT"
  ];

  return {
    questionScores: influenced,
    topProfile: ranking[0],
    top3Profiles: top3,
    totalScore,
    memoryScore,
    focusScore,
    routeScore,
    accuracy,
    strengths,
    growthZones,
    directions: top3.map((k) => PROFILE_LABELS[k].track),
    abstractTraits: abstractTraits.slice(0, 3),
    peerPercentile,
    peerLabel: "выше среднего по детям, прошедшим диагностику"
  };
}
