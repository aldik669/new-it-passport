const ADMIN_PASSWORD = "kursor2026";
const STORAGE_KEY = "kursor-it-passport-results";

function loadResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveResults(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function saveLead(row) {
  const rows = loadResults();
  rows.unshift({ ...row, id: crypto.randomUUID(), createdAt: new Date().toISOString(), leadStatus: "new" });
  saveResults(rows);
}

function updateLeadStatus(id, status) {
  const rows = loadResults().map((r) => (r.id === id ? { ...r, leadStatus: status } : r));
  saveResults(rows);
}

function exportCsv(rows) {
  const header = [
    "date",
    "childName",
    "ageGroup",
    "parentName",
    "parentPhone",
    "topProfile",
    "top3",
    "totalScore",
    "accuracy",
    "leadStatus"
  ];
  const lines = rows.map((r) =>
    [
      r.createdAt,
      r.childName,
      r.ageGroup,
      r.parentName,
      r.parentPhone,
      r.topProfile,
      (r.top3Profiles || []).join("|"),
      r.totalScore,
      r.accuracy,
      r.leadStatus
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kursor-passport-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initAdmin() {
  const loginBox = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");
  const passInput = document.getElementById("admin-password");
  const loginBtn = document.getElementById("admin-login-btn");
  const err = document.getElementById("admin-error");
  const search = document.getElementById("admin-search");
  const filter = document.getElementById("admin-filter");
  const exportBtn = document.getElementById("admin-export");
  const tbody = document.querySelector("#admin-table tbody");

  function render() {
    const q = search.value.trim().toLowerCase();
    const pf = filter.value;
    const rows = loadResults().filter((r) => {
      const text =
        !q ||
        r.childName.toLowerCase().includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        r.parentPhone.toLowerCase().includes(q);
      const prof = pf === "all" || r.topProfile === pf;
      return text && prof;
    });

    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${new Date(r.createdAt).toLocaleString("ru-RU")}</td>
        <td>${r.childName}</td>
        <td>${r.ageGroup}</td>
        <td>${r.parentName}</td>
        <td>${r.parentPhone}</td>
        <td>${r.topProfile}</td>
        <td>${r.totalScore ?? "—"}</td>
        <td>
          <select data-id="${r.id}" class="lead-select">
            ${["new", "contacted", "booked_trial", "paid", "lost"]
              .map((s) => `<option value="${s}" ${r.leadStatus === s ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".lead-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        updateLeadStatus(e.target.dataset.id, e.target.value);
      });
    });
  }

  loginBtn.addEventListener("click", () => {
    if (passInput.value === ADMIN_PASSWORD) {
      loginBox.hidden = true;
      panel.hidden = false;
      err.hidden = true;
      render();
    } else {
      err.textContent = "Неверный пароль";
      err.hidden = false;
    }
  });

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  exportBtn.addEventListener("click", () => exportCsv(loadResults()));

  if (location.hash === "#admin") {
    document.getElementById("screen-admin").classList.add("screen--active");
    document.querySelectorAll(".screen:not(#screen-admin)").forEach((s) => s.classList.remove("screen--active"));
  }
}
