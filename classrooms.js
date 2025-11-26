const classroomsBody = document.getElementById("classroomsBody");
let classroomModal = null;

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const DAYS = 6;
const SLOT_LABELS = [
    "7:30-8:25", "8:25-9:20", "9:30-10:25", "10:25-11:20",
    "12:20-1:15", "1:15-2:10", "2:30-3:25", "3:25-4:20"
];

// default: all available
let availabilityBits = Array(48).fill("1");

document.addEventListener("DOMContentLoaded", () => {
    classroomModal = new bootstrap.Modal(document.getElementById("classroomModal"));
    loadClassrooms();
});

// ------------------------------------------------------------
// LOAD CLASSROOMS
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// AVAILABILITY GRID
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// CREATE MODAL
// ------------------------------------------------------------
function openCreateModal() {
    document.getElementById("modalTitle").innerText = "Add Classroom";
    document.getElementById("editId").value = "";
    document.getElementById("classNumber").value = "";

    availabilityBits = Array(48).fill("1");
    renderAvailabilityGrid();

    classroomModal.show();
}

// ------------------------------------------------------------
// EDIT MODAL
// ------------------------------------------------------------
function openEditModal(c) {
    document.getElementById("modalTitle").innerText = "Edit Classroom";
    document.getElementById("editId").value = c.id;
    document.getElementById("classNumber").value = c.number;

    if (typeof c.availability === "string" && c.availability.length === 48) {
        availabilityBits = c.availability.split("");
    } else {
        availabilityBits = Array(48).fill("1");
    }

    renderAvailabilityGrid();
    classroomModal.show();
}

// ------------------------------------------------------------
// SAVE CLASSROOM
// ------------------------------------------------------------
async function saveClassroom() {
    const id = document.getElementById("editId").value;
    const number = document.getElementById("classNumber").value.trim();

    if (!number) {
        alert("Classroom number required.");
        return;
    }

    const payload = {
        number,
        availability: availabilityBits.join("")
    };

    let url = `${HOST}/api/classrooms/`;
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
        classroomModal.hide();
        loadClassrooms();
    }
}

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------
async function deleteClassroom(id) {
    if (!confirm("Delete this classroom?")) return;

    await authFetch(`${HOST}/api/classrooms/${id}/`, { method: "DELETE" });
    loadClassrooms();
}

// ------------------------------------------------------------
// CSV UPLOAD
// CSV format: number,availability
// ------------------------------------------------------------
async function uploadCSV() {
    const file = document.getElementById("csvFile").files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const entries = lines.map(line => {
        const [number, availability] = line.split(",");
        return {
            number,
            availability: (availability && availability.length === 48) ? availability : "1".repeat(48)
        };
    });

    await authFetch(`${HOST}/api/classrooms/csv_upload/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
    });

    document.getElementById("csvFile").value = "";
    loadClassrooms();
}
