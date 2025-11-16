// divisions.js
const divisionsBody = document.getElementById("divisionsBody");
const subjectsListDiv = document.getElementById("subjectsList");
const deptSelect = document.getElementById("deptSelect");

let divisionModal = null;

// constants
const DAYS = 6;
const SLOT_LABELS = [
  "7:30-8:25","8:25-9:20","9:30-10:25","10:25-11:20",
  "12:20-1:15","1:15-2:10","2:30-3:25","3:25-4:20"
];

let availabilityBits = Array(48).fill("0");
const SHIFT_1 = "111111111111111111111111111111111111000000000000";
const SHIFT_2 = "000000000000111111111111111111111111111111111111";

document.addEventListener("DOMContentLoaded", () => {
  divisionModal = new bootstrap.Modal(document.getElementById("divisionModal"));
  loadAll();
});

// -----------------------------
// LOADS
// -----------------------------
async function loadAll() {
  await Promise.all([loadDivisions(), loadDepartments(), loadAllSubjects()]);
}

let ALL_SUBJECTS = [];

// fetch ALL subjects (no filtering ever)
async function loadAllSubjects() {
  const res = await authFetch(`${HOST}/api/subjects/`);
  if (!res.ok) return;
  ALL_SUBJECTS = await res.json();
}

// fetch divisions list
async function loadDivisions() {
  const res = await authFetch(`${HOST}/api/divisions/`);
  if (!res.ok) return;
  const data = await res.json();

  divisionsBody.innerHTML = "";
  data.forEach(d => {
    divisionsBody.innerHTML += `
      <tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.semester}</td>
        <td>${d.department.name}</td>
        <td>${Array.isArray(d.subjects) ? d.subjects.length : 0}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick='openEditModal(${JSON.stringify(d)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick='deleteDivision(${d.id})'>Delete</button>
        </td>
      </tr>
    `;
  });
}

// fetch departments for select
async function loadDepartments() {
  const res = await authFetch(`${HOST}/api/departments/`);
  if (!res.ok) return;
  const data = await res.json();

  deptSelect.innerHTML = `<option value="">-- Select Dept --</option>`;
  data.forEach(dep => {
    deptSelect.innerHTML = deptSelect.innerHTML +
      `<option value="${dep.id}">${escapeHtml(dep.name)}</option>`;
  });
}

// -----------------------------
// AVAILABILITY GRID
// -----------------------------
function renderAvailabilityGrid() {
  const body = document.getElementById("availability-body");
  body.innerHTML = "";

  for (let slot = 0; slot < SLOT_LABELS.length; slot++) {
    const tr = document.createElement("tr");

    const slotCell = document.createElement("td");
    slotCell.textContent = SLOT_LABELS[slot];
    tr.appendChild(slotCell);

    for (let day = 0; day < DAYS; day++) {
      const idx = slot * DAYS + day;
      const bit = availabilityBits[idx];

      const td = document.createElement("td");
      td.className = "availability-cell " + (bit === "1" ? "avail-1" : "avail-0");
      td.dataset.index = idx;
      td.textContent = bit === "1" ? "A" : "X";
      td.onclick = () => toggleCell(td);
      tr.appendChild(td);
    }

    body.appendChild(tr);
  }
}

function toggleCell(td) {
  const idx = parseInt(td.dataset.index, 10);
  availabilityBits[idx] = availabilityBits[idx] === "1" ? "0" : "1";
  td.classList.toggle("avail-1");
  td.classList.toggle("avail-0");
  td.textContent = availabilityBits[idx] === "1" ? "A" : "X";
}

function applyShift1() {
  availabilityBits = SHIFT_1.split("");
  renderAvailabilityGrid();
}
function applyShift2() {
  availabilityBits = SHIFT_2.split("");
  renderAvailabilityGrid();
}

// -----------------------------
// CREATE modal
// -----------------------------
function openCreateModal() {
  document.getElementById("modalTitle").innerText = "Add Division";
  document.getElementById("editId").value = "";
  document.getElementById("divName").value = "";
  document.getElementById("divSemester").value = 1;
  deptSelect.value = "";

  renderSubjectsList(ALL_SUBJECTS, []);

  availabilityBits = Array(48).fill("0");
  renderAvailabilityGrid();

  divisionModal.show();
}

// -----------------------------
// EDIT modal
// -----------------------------
async function openEditModal(d) {
  document.getElementById("modalTitle").innerText = "Edit Division";
  document.getElementById("editId").value = d.id;
  document.getElementById("divName").value = d.name;
  document.getElementById("divSemester").value = d.semester || 1;
  deptSelect.value = d.department.id || "";

  renderSubjectsList(ALL_SUBJECTS, Array.isArray(d.subjects) ? d.subjects : []);

  availabilityBits = (typeof d.availability === "string"
    ? d.availability.split("")
    : Array(48).fill("0"));

  if (availabilityBits.length !== 48) availabilityBits = Array(48).fill("0");

  renderAvailabilityGrid();
  divisionModal.show();
}

// -----------------------------
// subject checkbox rendering
// -----------------------------
function renderSubjectsList(subjects, selectedIds = []) {
  subjectsListDiv.innerHTML = "";
  if (!subjects || subjects.length === 0) {
    subjectsListDiv.innerHTML = `<div class="text-muted">No subjects found.</div>`;
    return;
  }

  subjects.forEach(s => {
    const id = s.id;
    const checked = selectedIds.includes(id);
    const label = document.createElement("label");

    label.innerHTML =
      `<input type="checkbox" class="subject-checkbox" value="${id}" ${checked ? "checked" : ""}>
       ${escapeHtml(s.name)} (${escapeHtml(s.code || "")})`;

    subjectsListDiv.appendChild(label);
  });
}

// -----------------------------
// SAVE division
// -----------------------------
async function saveDivision() {
  const id = document.getElementById("editId").value;
  const name = document.getElementById("divName").value.trim();
  const semester = parseInt(document.getElementById("divSemester").value, 10) || 1;
  const department_id = deptSelect.value;

  const checked = Array.from(document.querySelectorAll(".subject-checkbox:checked"))
    .map(n => parseInt(n.value, 10));

  const payload = {
    name,
    semester,
    department_id,
    subjects: checked,
    availability: availabilityBits.join("")
  };

  let url = `${HOST}/api/divisions/`;
  let method = "POST";

  if (id) {
    url += `${id}/`;
    method = "PUT";
  }

  const res = await authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    divisionModal.hide();
    loadDivisions();
  } else {
    const err = await res.json().catch(() => ({ detail: "Invalid input" }));
    alert("Error: " + (err.detail || JSON.stringify(err)));
  }
}

// -----------------------------
// DELETE
// -----------------------------
async function deleteDivision(id) {
  if (!confirm("Delete this division?")) return;
  await authFetch(`${HOST}/api/divisions/${id}/`, { method: "DELETE" });
  loadDivisions();
}

// -----------------------------
// CSV UPLOAD
// -----------------------------
async function uploadCSV() {
  const file = document.getElementById("csvFile").files[0];
  if (!file) return alert("Pick a CSV file first.");

  const text = await file.text();
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  if (!lines.length) return alert("Empty file.");

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim());
    if (!cols.length) continue;

    const obj = {};

    for (let j = 0; j < header.length; j++) {
      const key = header[j];
      const val = cols[j] ?? "";

      if (key === "subjects") {
        obj.subjects = val.split(/[,;|]/)
          .map(x => parseInt(x.trim(), 10))
          .filter(x => !isNaN(x));
      } else if (key === "semester") {
        obj.semester = parseInt(val, 10) || 1;
      } else if (key === "availability") {
        obj.availability = (val.length === 48 ? val : SHIFT_2);
      } else {
        obj[key] = val;
      }
    }

    if (!obj.name) continue;
    if (!obj.department_id) continue;
    if (!obj.semester) obj.semester = 1;
    if (!Array.isArray(obj.subjects)) obj.subjects = [];

    items.push(obj);
  }

  if (!items.length) return alert("No valid rows found.");

  const res = await authFetch(`${HOST}/api/divisions/csv_upload/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ divisions: items })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: "error" }));
    alert("Upload error: " + JSON.stringify(e));
    return;
  }

  document.getElementById("csvFile").value = "";
  loadDivisions();
  alert("CSV uploaded.");
}
