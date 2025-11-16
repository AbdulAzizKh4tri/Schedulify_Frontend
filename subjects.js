const subjectsBody = document.getElementById("subjectsBody");
const deptSelect = document.getElementById("deptSelect");

let subjectModal = null;

document.addEventListener("DOMContentLoaded", () => {
    subjectModal = new bootstrap.Modal(document.getElementById("subjectModal"));
    loadAll();
});

// LOAD SUBJECTS + DEPARTMENTS -----------------------------------------------

async function loadAll() {
    await Promise.all([loadDepartments(), loadSubjects()]);
}

async function loadSubjects() {
    const res = await authFetch(`${HOST}/api/subjects/`);
    if (!res.ok) return;
    const data = await res.json();

    subjectsBody.innerHTML = "";
    data.forEach(s => {
        subjectsBody.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.code)}</td>
            <td>${s.lectures_per_week}</td>
            <td>${s.labs_per_week}</td>
            <td>${escapeHtml(s.department?.name || "")}</td>

            <td>
                <button class="btn btn-sm btn-warning me-1"
                    onclick='openEditModal(${JSON.stringify(s)})'>
                    Edit
                </button>

                <button class="btn btn-sm btn-danger"
                    onclick="deleteSubject(${s.id})">
                    Delete
                </button>
            </td>
        </tr>`;
    });
}

async function loadDepartments() {
    const res = await authFetch(`${HOST}/api/departments/`);
    if (!res.ok) return;
    const data = await res.json();

    deptSelect.innerHTML = `<option value="">-- Select Department --</option>`;
    data.forEach(dep => {
        deptSelect.innerHTML += `<option value="${dep.id}">${escapeHtml(dep.name)}</option>`;
    });
}

// MODALS --------------------------------------------------------------------

function openCreateModal() {
    document.getElementById("modalTitle").innerText = "Add Subject";
    document.getElementById("editId").value = "";
    document.getElementById("subName").value = "";
    document.getElementById("subCode").value = "";
    document.getElementById("lecPw").value = 0;
    document.getElementById("labPw").value = 0;
    deptSelect.value = "";

    subjectModal.show();
}

function openEditModal(s) {
    document.getElementById("modalTitle").innerText = "Edit Subject";
    document.getElementById("editId").value = s.id;
    document.getElementById("subName").value = s.name;
    document.getElementById("subCode").value = s.code;
    document.getElementById("lecPw").value = s.lectures_per_week;
    document.getElementById("labPw").value = s.labs_per_week;
    deptSelect.value = s.department?.id || "";

    subjectModal.show();
}

// SAVE -----------------------------------------------------------------------

async function saveSubject() {
    const id = document.getElementById("editId").value;

    const payload = {
        name: document.getElementById("subName").value.trim(),
        code: document.getElementById("subCode").value.trim(),
        lectures_per_week: parseInt(document.getElementById("lecPw").value, 10) || 0,
        labs_per_week: parseInt(document.getElementById("labPw").value, 10) || 0,
        department_id: deptSelect.value
    };

    let url = `${HOST}/api/subjects/`;
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
        subjectModal.hide();
        loadSubjects();
    } else {
        const err = await res.json().catch(() => ({ detail: "Invalid input" }));
        alert("Error: " + (err.detail || JSON.stringify(err)));
    }
}

// DELETE ---------------------------------------------------------------------

async function deleteSubject(id) {
    if (!confirm("Delete this subject?")) return;
    await authFetch(`${HOST}/api/subjects/${id}/`, { method: "DELETE" });
    loadSubjects();
}

// CSV UPLOAD -----------------------------------------------------------------

async function uploadCSV() {
    const file = document.getElementById("csvFile").files[0];
    if (!file) return alert("Pick a CSV file first.");

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;

    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const obj = {};

        for (let j = 0; j < header.length; j++) {
            const key = header[j];
            const val = cols[j] ?? "";

            if (["lectures_per_week", "labs_per_week"].includes(key)) {
                obj[key] = parseInt(val, 10) || 0;
            } else if (key === "department_id") {
                obj.department_id = val;
            } else {
                obj[key] = val;
            }
        }
        if (!obj.name) continue;
        items.push(obj);
    }

    const res = await authFetch(`${HOST}/api/subjects/csv_upload/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: items })
    });

    if (res.ok) {
        document.getElementById("csvFile").value = "";
        loadSubjects();
        alert("CSV uploaded.");
    } else {
        const e = await res.json().catch(() => ({ detail: "upload error" }));
        alert("Upload error: " + JSON.stringify(e));
    }
}
