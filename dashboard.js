// dashboard.js
const HOST = "http://127.0.0.1:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOT_LABELS = [
  "7:30-8:25",
  "8:25-9:20",
  "9:30-10:25",
  "10:25-11:20",
  "12:20-1:15",
  "1:15-2:10",
  "2:30-3:25",
  "3:25-4:20"
];

const NUM_DAYS = 6;          // Mon-Sat
const NUM_SLOTS = SLOT_LABELS.length; // 8 slots

// ----------------- network & auth -----------------
async function loadProfile() {
  try {
    const res = await authFetch(`${HOST}/api/auth/me/`);
    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    document.getElementById("username").innerText = data.user.full_name

    if (data.timetable) {
      renderTimetable(data.timetable);
    }

  } catch (err) {
    window.location.href = "login.html";
  }
}

document.getElementById("logoutBtn").onclick = async () => {
  try { await fetch(`${HOST}/api/auth/logout/`, { method: "POST" }); } catch (e) { }
  clearTokens();
  window.location.href = "login.html";
};

// ----------------- CORRECT MAPPING -----------------
/*
Correct rule:

time_slot increases across DAYS first.
So:

time_slot = dayIndex + slotIndex * 6

Therefore:

day  = time_slot % 6  
slot = Math.floor(time_slot / 6)
*/
function getDaySlot(timeSlot) {
  const day = timeSlot % NUM_DAYS;
  const slot = Math.floor(timeSlot / NUM_DAYS);
  return { day, slot };
}

// ----------------- rendering -----------------
function renderTimetable(timetableArray) {
  const container = document.getElementById("timetable-container");
  const table = document.getElementById("timetable-table");
  const tbody = document.getElementById("timetable-body");

  container.style.display = "block";

  // Empty grid [slot][day]
  const grid = Array.from({ length: NUM_SLOTS }, () =>
    Array.from({ length: NUM_DAYS }, () => null)
  );

  // Fill grid with correct mapping
  for (const entry of timetableArray) {
    const { day, slot } = getDaySlot(entry.time_slot);

    if (slot < NUM_SLOTS && day < NUM_DAYS) {
      grid[slot][day] = entry;
    }
  }

  // Build header: Time + Days
  const thead = table.querySelector("thead");
  thead.innerHTML = "";
  const headRow = document.createElement("tr");

  const thTime = document.createElement("th");
  thTime.className = "table-dark text-center align-middle";
  thTime.innerText = "Time";
  headRow.appendChild(thTime);

  for (const d of DAYS) {
    const th = document.createElement("th");
    th.className = "table-dark text-center align-middle";
    th.innerText = d;
    headRow.appendChild(th);
  }

  thead.appendChild(headRow);

  // Body rows
  tbody.innerHTML = "";

  for (let slot = 0; slot < NUM_SLOTS; slot++) {
    const tr = document.createElement("tr");

    // time label
    const th = document.createElement("th");
    th.className = "table-secondary text-center align-middle";
    th.innerText = SLOT_LABELS[slot];
    tr.appendChild(th);

    for (let day = 0; day < NUM_DAYS; day++) {
      const td = document.createElement("td");
      td.className = "timetable-cell align-middle";

      const cell = grid[slot][day];
      if (cell) {
        if (cell.session_type.toLowerCase() === "lecture") {
          td.innerHTML = `
          <div class="timetable-entry-lecture p-2">
            <div><strong>${cell.time_slot} - ${escapeHtml(cell.session_type)}</strong></div>
            <div style="font-size:0.85em">Div: ${escapeHtml(String(cell.division.name))} &nbsp; • &nbsp; Sub: ${escapeHtml(String(cell.subject.code))}</div>
            <div style="font-size:0.85em">Room: ${escapeHtml(String(cell.classroom.number))}</div>
          </div>
        `;
        } else {
          td.innerHTML = `
          <div class="timetable-entry-lab p-2">
            <div><strong>${cell.time_slot} - ${escapeHtml(cell.session_type)}</strong></div>
            <div style="font-size:0.85em">Div: ${escapeHtml(String(cell.division.name))} &nbsp; • &nbsp; Sub: ${escapeHtml(String(cell.subject.code))}</div>
            <div style="font-size:0.85em">Room: ${escapeHtml(String(cell.classroom.number))}</div>
          </div>
        `;
        }
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}

loadProfile();
