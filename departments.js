const tbody = document.getElementById("deptTableBody");

let editModal;

// INIT
document.addEventListener("DOMContentLoaded", () => {
    editModal = new bootstrap.Modal(document.getElementById("editDeptModal"));
    loadDepartments();
});


// ------------------------------------------------------
// LOAD DEPARTMENTS
// ------------------------------------------------------
async function loadDepartments() {
    const res = await authFetch(`${HOST}/api/departments/`);
    if (!res.ok) return;

    const data = await res.json();
    tbody.innerHTML = "";

    data.forEach(dep => {
        tbody.innerHTML += `
        <tr>
            <td>${dep.id}</td>
            <td>${dep.name}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="openEdit(${dep.id}, '${dep.name}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dep.id})">Delete</button>
            </td>
        </tr>
        `;
    });
}


// ------------------------------------------------------
// CREATE
// ------------------------------------------------------
async function createDepartment() {
    const name = document.getElementById("deptName").value.trim();
    if (!name) return;

    await authFetch(`${HOST}/api/departments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    document.getElementById("deptName").value = "";
    loadDepartments();
}


// ------------------------------------------------------
// DELETE
// ------------------------------------------------------
async function deleteDepartment(id) {
    await authFetch(`${HOST}/api/departments/${id}/`, {
        method: "DELETE"
    });

    loadDepartments();
}


// ------------------------------------------------------
// EDIT
// ------------------------------------------------------
function openEdit(id, name) {
    document.getElementById("editDeptId").value = id;
    document.getElementById("editDeptName").value = name;
    editModal.show();
}

async function saveEdit() {
    const id = document.getElementById("editDeptId").value;
    const name = document.getElementById("editDeptName").value.trim();

    if (!name) return;

    await authFetch(`${HOST}/api/departments/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    editModal.hide();
    loadDepartments();
}


// ------------------------------------------------------
// BULK CSV UPLOAD
// CSV format:   name
// ------------------------------------------------------
async function uploadCSV() {
    const file = document.getElementById("csvFile").files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const headers = lines[0].split(",");
    const departments = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");

        let obj = {};
        headers.forEach((h, idx) => {
            obj[h] = cols[idx]?.trim();
        });

        departments.push(obj);
    }

    await authFetch(`${HOST}/api/departments/csv_upload/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departments }),
    });

    document.getElementById("csvFile").value = "";
    loadDepartments();
}