const usersBody = document.getElementById("usersBody");
const userModal = new bootstrap.Modal(document.getElementById("userModal"));

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

async function loadUsers() {
    const res = await authFetch(`${HOST}/api/auth/users/`);
    if (!res.ok) return;
    const data = await res.json();

    usersBody.innerHTML = "";
    data.forEach(u => {
        usersBody.innerHTML += `
        <tr>
            <td>${u.id}</td>
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td>${u.phone_number}</td>
            <td>${u.gender}</td>
            <td>${u.role}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick='openEditModal(${JSON.stringify(u)})'>Edit</button>
                <button class="btn btn-sm btn-danger" onclick='deleteUser(${u.id})'>Delete</button>
            </td>
        </tr>
        `;
    });
}

function openCreateModal() {
    document.getElementById("modalTitle").innerText = "Add User";
    document.getElementById("editId").value = "";
    document.getElementById("fullName").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("gender").value = "Male";
    document.getElementById("role").value = "Student";
    document.getElementById("password").value = "";
    document.getElementById("isStaff").checked = false;
    document.getElementById("isSuperuser").checked = false;
    userModal.show();
}

function openEditModal(user) {
    document.getElementById("modalTitle").innerText = "Edit User";
    document.getElementById("editId").value = user.id;
    document.getElementById("fullName").value = user.full_name;
    document.getElementById("email").value = user.email;
    document.getElementById("phone").value = user.phone_number;
    document.getElementById("gender").value = user.gender;
    document.getElementById("role").value = user.role;
    document.getElementById("password").value = "";
    document.getElementById("isStaff").checked = user.is_staff;
    document.getElementById("isSuperuser").checked = user.is_superuser;
    userModal.show();
}

async function saveUser() {
    const id = document.getElementById("editId").value;
    const payload = {
        full_name: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone_number: document.getElementById("phone").value.trim(),
        gender: document.getElementById("gender").value,
        role: document.getElementById("role").value,
        is_staff: document.getElementById("isStaff").checked,
        is_superuser: document.getElementById("isSuperuser").checked
    };

    const pwd = document.getElementById("password").value.trim();
    if (pwd) payload.password = pwd;

    let url = `${HOST}/api/auth/users/`;
    let method = "POST";

    if (id) {
        url += `${id}/`;
        method = "PATCH";
    }

    const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        userModal.hide();
        loadUsers();
    } else {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        alert("Error: " + (err.detail || JSON.stringify(err)));
    }
}

async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await authFetch(`${HOST}/api/auth/users/${id}/`, { method: "DELETE" });
    loadUsers();
}

// -----------------------------
// CSV upload
// CSV should include headers: full_name,email,phone_number,gender,role,password,is_staff,is_superuser
// -----------------------------
async function uploadCSV() {
    const file = document.getElementById("csvFile").files[0];
    if (!file) return alert("Pick a CSV file first.");

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    if (!lines.length) return alert("Empty file.");

    const header = lines[0].split(",").map(h => h.trim());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (!cols.length) continue;
        let obj = {};
        for (let j = 0; j < header.length; j++) {
            obj[header[j]] = cols[j] ?? "";
        }
        items.push(obj);
    }

    if (!items.length) return alert("No valid rows found.");

    const res = await authFetch(`${HOST}/api/auth/users/csv_upload/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: items })
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "error" }));
        alert("Upload error: " + JSON.stringify(e));
        return;
    }

    document.getElementById("csvFile").value = "";
    loadUsers();
    alert("CSV uploaded successfully!");
}
