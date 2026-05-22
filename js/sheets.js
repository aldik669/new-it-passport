const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJN00c20lrVaYRDkPTJVYMDDBwiZ835SBLa0m1H3INoWy5Q5K1Vv-airLXWgIYsQer/exec";
const SESSION_ID_KEY = "kursor-session-id";

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function clearSessionId() {
  localStorage.removeItem(SESSION_ID_KEY);
}

// alias — app.js вызывает clearLeadId при сбросе
function clearLeadId() {
  clearSessionId();
}

async function sendLeadToGoogleSheets(payload) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Sent to Sheets:", payload);
    return true;
  } catch (err) {
    console.error("Sheets error:", err);
    return false;
  }
}

function sendInitialLead({ parentName, parentPhone, childName }) {
  const sessionId = getOrCreateSessionId();
  sendLeadToGoogleSheets({
    sessionId,
    parentName,
    parentPhone,
    childName,
    testCompleted: "Нет",
    profession: ""
  });
}

function sendCompletedLead({ parentName, parentPhone, childName, profession }) {
  const sessionId = getOrCreateSessionId(); // тот же id из localStorage
  return sendLeadToGoogleSheets({
    sessionId,
    parentName,
    parentPhone,
    childName,
    testCompleted: "Да",
    profession
  });
}
