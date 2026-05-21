const SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwLSurp2Qeby7IuoBkShClFl0ddpRj4pufQr5BVXKhJ1YHpG_DFvmzu6Yloc9bvY2U8/exec";

const LEAD_ID_KEY = "kursor-lead-id";

const PROFESSION_RU = {
  visual: "Creative Developer / визуальное программирование",
  game: "Game Developer / разработка игр",
  web: "Frontend Developer / веб-разработка",
  logic: "Python / Software Developer / логика"
};

function professionLabel(profileKey) {
  return PROFESSION_RU[profileKey] || PROFILE_LABELS?.[profileKey]?.title || profileKey || "";
}

function getOrCreateLeadId() {
  let id = localStorage.getItem(LEAD_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "lead-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(LEAD_ID_KEY, id);
  }
  return id;
}

function postToSheets(data) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    body.append(key, value == null ? "" : String(value));
  });

  fetch(SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  }).catch(() => {});
}

function sheetsCreateLead({ childName, parentName, parentPhone }) {
  const leadId = getOrCreateLeadId();
  postToSheets({
    action: "create",
    leadId,
    childName,
    parentName,
    parentPhone,
    testPassed: "Нет",
    miniGamesPassed: "Нет",
    profession: ""
  });
  return leadId;
}

function sheetsUpdateLead(fields) {
  const leadId = getOrCreateLeadId();
  postToSheets({
    action: "update",
    leadId,
    ...fields
  });
}

function sheetsMarkTestPassed(professionKey) {
  sheetsUpdateLead({
    testPassed: "Да",
    profession: professionLabel(professionKey)
  });
}

function sheetsMarkMiniGamesPassed() {
  sheetsUpdateLead({
    miniGamesPassed: "Да"
  });
}

function sheetsSaveContacts({ childName, parentName, parentPhone }) {
  if (localStorage.getItem(LEAD_ID_KEY)) {
    sheetsUpdateLead({ childName, parentName, parentPhone });
  } else {
    sheetsCreateLead({ childName, parentName, parentPhone });
  }
}

function clearLeadId() {
  localStorage.removeItem(LEAD_ID_KEY);
}
