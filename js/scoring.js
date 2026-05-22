const SCORE_LEVELS = [
  {
    min: 18, max: 21,
    level: "Выраженный IT-талант",
    description: "У ребёнка выраженный цифровой талант. Самостоятельность, амбиции и тяга к технологиям — это сильные сигналы, что IT может стать его настоящим направлением. Этот потенциал важно вовремя раскрыть и направить в правильное русло.",
    direction: "Программирование / разработка"
  },
  {
    min: 13, max: 17,
    level: "Сильный цифровой потенциал",
    description: "Ребёнок проявляет уверенные признаки цифрового таланта — высокую вовлечённость, амбиции и интерес к тому, как устроены технологии. Есть сильные стороны, которые при правильном векторе могут вырасти в серьёзные навыки.",
    direction: "IT-разработка / технологии"
  },
  {
    min: 7, max: 12,
    level: "Цифровой потенциал есть",
    description: "У ребёнка есть реальный цифровой потенциал. Он проявляет амбиции и природное любопытство к технологиям — это хорошая база. Важно дать правильный вектор, чтобы этот талант начал раскрываться.",
    direction: "IT-направления"
  },
  {
    min: 0, max: 6,
    level: "Потенциал в стадии раскрытия",
    description: "Явные сигналы таланта пока не очевидны — но это не финальный ответ. Каждый ребёнок раскрывается по-своему и в своё время. Главное — дать правильный первый шаг.",
    direction: "Знакомство с IT"
  }
];

function buildStrengths(answers) {
  const candidates = [];

  // Q1: high screen time → digital engagement
  if (answers[0] === 0 || answers[0] === 1) {
    candidates.push("высокий интерес к цифровой среде");
  }
  if (answers[0] === 0) {
    candidates.push("быстро вовлекается в игры и технологии");
  }

  // Q2: troubleshoots tech → self-sufficiency
  if (answers[1] === 0) {
    candidates.push("самостоятельность в разборе задач");
    candidates.push("интерес к устройству техники");
  } else if (answers[1] === 1) {
    candidates.push("интерес к устройству техники");
  }

  // Q4: creates content
  if (answers[3] === 0) {
    candidates.push("первые попытки создавать цифровой контент");
    candidates.push("интерес к созданию, а не только потреблению");
  } else if (answers[3] === 1) {
    candidates.push("интерес к созданию, а не только потреблению");
  }

  // Q5: logic/puzzles
  if (answers[4] === 0 || answers[4] === 1) {
    candidates.push("логическое мышление");
  }

  // Q6: explains tech → tech leadership
  if ((answers[5] === 0 || answers[5] === 1) && !candidates.includes("самостоятельность в разборе задач")) {
    candidates.push("самостоятельность в разборе задач");
  }

  const unique = [...new Set(candidates)];
  const defaults = [
    "высокий интерес к цифровой среде",
    "быстро вовлекается в игры и технологии",
    "самостоятельность в разборе задач"
  ];
  while (unique.length < 3) {
    const d = defaults.find(x => !unique.includes(x));
    if (d) unique.push(d);
    else break;
  }
  return unique.slice(0, 3);
}

function buildGrowthZones(answers) {
  const zones = [];

  // Q1: high screen time → digital discipline
  if (answers[0] === 0 || answers[0] === 1) {
    zones.push("стоит развивать цифровую дисциплину и осознанное отношение к экранному времени");
  }

  // Q4: tried but quit → follow-through
  if (answers[3] === 1) {
    zones.push("важно работать над навыком доведения начатого до результата");
  }

  // Q4: never tried → self-initiative
  if (answers[3] === 2 || answers[3] === 3) {
    zones.push("стоит развивать самостоятельность в освоении новых цифровых инструментов");
  }

  // Q5: doesn't like puzzles → patience and focus
  if (answers[4] === 2 || answers[4] === 3) {
    zones.push("можно работать над концентрацией и усидчивостью при решении сложных задач");
  }

  const unique = [...new Set(zones)];
  const fallback = [
    "стоит уделить внимание цифровой этике и ответственному использованию технологий",
    "важно работать над навыком доведения начатого до результата"
  ];
  while (unique.length < 2) {
    const d = fallback.find(x => !unique.includes(x));
    if (d) unique.push(d);
    else break;
  }
  return unique.slice(0, 2);
}

function computeResult(answers) {
  let totalScore = 0;
  answers.forEach((answerIdx, qIdx) => {
    if (answerIdx !== undefined && answerIdx !== null && PARENT_QUESTIONS[qIdx]) {
      totalScore += PARENT_QUESTIONS[qIdx].options[answerIdx]?.score || 0;
    }
  });

  const scoreLevel = SCORE_LEVELS.find(l => totalScore >= l.min && totalScore <= l.max) || SCORE_LEVELS[3];
  const strengths = buildStrengths(answers);
  const growthZones = buildGrowthZones(answers);

  return { totalScore, scoreLevel, strengths, growthZones };
}
