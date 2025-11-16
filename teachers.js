const tableBody = document.getElementById("teachersBody");

let teacherModal = null;

document.addEventListener("DOMContentLoaded", () => {
    teacherModal = new bootstrap.Modal(document.getElementById("teacherModal"));
    loadAll();
});

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const DAYS = 6;
const SLOT_LABELS = [
    "7:30-8:25", "8:25-9:20", "9:30-10:25", "10:25-11:20",
    "12:20-1:15", "1:15-2:10", "2:30-3:25", "3:25-4:20"
];

// 48 bits
let availabilityBits = Array(48).fill("0");

// ------------------------------------------------------------
// SHIFT TEMPLATES
// ------------------------------------------------------------
const SHIFT_1 = "111111111111111111111111111111111111000000000000";
const SHIFT_2 = "000000000000111111111111111111111111111111111111";

function applyShift1() {
    availabilityBits = SHIFT_1.split("");
    renderAvailabilityGrid();
}

function applyShift2() {
    availabilityBits = SHIFT_2.split("");
    renderAvailabilityGrid();
}

// ------------------------------------------------------------
async function loadAll() {
    await Promise.all([loadTeachers(), loadUsers(), loadDepartments()]);
}

// ------------------------------------------------------------
async function loadTeachers() {
    const res = await authFetch(`${HOST}/api/teachers/`);
    if (!res.ok) return;

    const data = await res.json();
    tableBody.innerHTML = "";

    data.forEach(t => {
        tableBody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td>${t.user?.full_name}</td>
                <td>${t.staff_id}</td>
                <td>${t.department.name}</td>
                <td>${t.max_workload}</td>

                <td>
                    <button class="btn btn-sm btn-warning" onclick='openEditModal(${JSON.stringify(t)})'>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${t.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// ------------------------------------------------------------
async function loadUsers() {
    const res = await authFetch(`${HOST}/api/teachers/users/`);
    if (!res.ok) return;

    const data = await res.json();
    const userSelect = document.getElementById("userSelect");

    userSelect.innerHTML = `<option value="">None</option>`; // always add None

    data.users.forEach(u => {
        userSelect.innerHTML += `<option value="${u.id}">
            ${u.full_name} (${u.email})
        </option>`;
    });
}

// ------------------------------------------------------------
async function loadDepartments() {
    const res = await authFetch(`${HOST}/api/departments/`);
    if (!res.ok) return;

    const data = await res.json();
    const deptSelect = document.getElementById("deptSelect");

    deptSelect.innerHTML = "";
    data.forEach(d => {
        deptSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
}

// ------------------------------------------------------------
// AVAILABILITY GRID
// ------------------------------------------------------------
function renderAvailabilityGrid() {
    const body = document.getElementById("availability-body");
    body.innerHTML = "";

    for (let slot = 0; slot < 8; slot++) {
        const tr = document.createElement("tr");

        const slotCell = document.createElement("td");
        slotCell.textContent = SLOT_LABELS[slot];
        tr.appendChild(slotCell);

        for (let day = 0; day < DAYS; day++) {
            const index = slot * DAYS + day;
            const bit = availabilityBits[index];

            const td = document.createElement("td");
            td.classList.add("availability-cell");
            td.classList.add(bit === "1" ? "avail-1" : "avail-0");
            td.dataset.index = index;
            td.textContent = bit === "1" ? "A" : "X";

            td.onclick = () => toggleCell(td);
            tr.appendChild(td);
        }

        body.appendChild(tr);
    }
}

function toggleCell(td) {
    const idx = parseInt(td.dataset.index);
    const current = availabilityBits[idx];

    availabilityBits[idx] = current === "1" ? "0" : "1";

    td.classList.toggle("avail-1");
    td.classList.toggle("avail-0");
    td.textContent = availabilityBits[idx] === "1" ? "A" : "X";
}

// ------------------------------------------------------------
// CREATE
// ------------------------------------------------------------
function openCreateModal() {
    document.getElementById("modalTitle").innerText = "Add Teacher";
    loadUsers();


    document.getElementById("editId").value = "";
    document.getElementById("staffId").value = "";
    document.getElementById("maxLoad").value = "";

    availabilityBits = Array(48).fill("0");
    renderAvailabilityGrid();

    teacherModal.show();
}

// ------------------------------------------------------------
// EDIT
// ------------------------------------------------------------
async function openEditModal(t) {
    document.getElementById("modalTitle").innerText = "Edit Teacher";

    document.getElementById("editId").value = t.id;
    document.getElementById("staffId").value = t.staff_id;
    document.getElementById("deptSelect").value = t.department.id;
    document.getElementById("maxLoad").value = t.max_workload;

    // Load all unassigned users first
    await loadUsers();

    const userSelect = document.getElementById("userSelect");

    // Always add the currently linked user if it exists
    if (t.user) {
        userSelect.innerHTML += `
            <option value="${t.user.id}">
                ${t.user.full_name} (${t.user.email})
            </option>
        `;
        userSelect.value = t.user.id;
    } else {
        // If teacher has no linked user, show "None"
        userSelect.value = "";
    }

    // Load availability grid
    availabilityBits = t.availability.split("");
    renderAvailabilityGrid();

    teacherModal.show();
}


// ------------------------------------------------------------
// SAVE
// ------------------------------------------------------------
async function saveTeacher() {
    const id = document.getElementById("editId").value;

    const payload = {
        user_id: document.getElementById("userSelect").value,
        staff_id: document.getElementById("staffId").value,
        department_id: document.getElementById("deptSelect").value,
        max_workload: document.getElementById("maxLoad").value,
        availability: availabilityBits.join("")
    };

    let url = `${HOST}/api/teachers/`;
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
        teacherModal.hide();
        loadTeachers();
    }
}

// ------------------------------------------------------------
async function deleteTeacher(id) {
    if (!confirm("Delete this teacher?")) return;

    await authFetch(`${HOST}/api/teachers/${id}/`, { method: "DELETE" });
    loadTeachers();
}

// ------------------------------------------------------------
async function uploadCSV() {
    const file = document.getElementById("csvFile").files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const objects = lines.map(line => {
        const [
            user_id,
            staff_id,
            department_id,
            max_workload,
            availability
        ] = line.split(",");

        return { 
            user_id,
            staff_id,
            department_id,
            max_workload,
            availability
        };
    });

    await authFetch(`${HOST}/api/teachers/csv_upload/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: objects })
    });

    document.getElementById("csvFile").value = "";
    loadTeachers();
}
