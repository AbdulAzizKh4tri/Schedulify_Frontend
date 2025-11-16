const classroomsBody = document.getElementById("classroomsBody");
let classroomModal = null;

const DAYS = 6;
const SLOT_LABELS = [
  "7:30-8:25","8:25-9:20","9:30-10:25","10:25-11:20",
  "12:20-1:15","1:15-2:10","2:30-3:25","3:25-4:20"
];

let availabilityBits = Array(48).fill("1"); // default all 1s for new classrooms

document.addEventListener("DOMContentLoaded", () => {
  classroomModal = new bootstrap.Modal(document.getElementById("classroomModal"));
  loadClassrooms();
});

async function loadClassrooms() {
  const res = await authFetch(`${HOST}/api/classrooms/`);
  if (!res.ok) return;
  const data = await res.json();

  classroomsBody.innerHTML = "";
  data.forEach(c => {
    classroomsBody.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${escapeHtml(c.number)}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick='openEditModal(${JSON.stringify(c)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick='deleteClassroom(${c.id})'>Delete</button>
        </td>
      </tr>
    `;
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

// -----------------------------
// CREATE / EDIT modal
// -----------------------------
function openCreateModal() {
  document.getElementById("modalTitle").innerText = "Add Classroom";
  document.getElementById("editId").value = "";
  document.getElementById("classNumber").value = "";
  availabilityBits = Array(48).fill("1"); // all 1s for new classroom
  renderAvailabilityGrid();
  classroomModal.show();
}

function openEditModal(c) {
  document.getElementById("modalTitle").innerText = "Edit Classroom";
  document.getElementById("editId").value = c.id;
  document.getElementById("classNumber").value = c.number;

  availabilityBits = (typeof c.availability === "string" ? c.availability.split("") : Array(48).fill("1"));
  if (availabilityBits.length !== 48) availabilityBits = Array(48).fill("1");

  renderAvailabilityGrid();
  classroomModal.show();
}

// -----------------------------
// SAVE classroom
// -----------------------------
async function saveClassroom() {
  const id = document.getElementById("editId").value;
  const number = document.getElementById("classNumber").value.trim();

  if (!number) return alert("Classroom number required.");

  const payload = { number, availability: availabilityBits.join("") };
  let url = `${HOST}/api/classrooms/`;
  let method = "POST";

  if (id) { url += `${id}/`; method = "PUT"; }

  const res = await authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    classroomModal.hide();
    loadClassrooms();
  } else {
    const err = await res.json().catch(() => ({ detail: "Invalid input" }));
    alert("Error: " + (err.detail || JSON.stringify(err)));
  }
}

// -----------------------------
// DELETE
// -----------------------------
async function deleteClassroom(id) {
  if (!confirm("Delete this classroom?")) return;
  await authFetch(`${HOST}/api/classrooms/${id}/`, { method: "DELETE" });
  loadClassrooms();
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

      if (key === "availability") {
        obj.availability = (val.length === 48 ? val : Array(48).fill("1").join(""));
      } else { obj[key] = val; }
    }

    if (!obj.number) continue;
    if (!obj.availability) obj.availability = Array(48).fill("1").join("");

    items.push(obj);
  }

  if (!items.length) return alert("No valid rows found.");

  const res = await authFetch(`${HOST}/api/classrooms/csv_upload/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classrooms: items })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: "error" }));
    alert("Upload error: " + JSON.stringify(e));
    return;
  }

  document.getElementById("csvFile").value = "";
  loadClassrooms();
  alert("CSV uploaded.");
}
