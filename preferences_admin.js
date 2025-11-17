const teachersBody = document.getElementById("teachersBody");
const prefModalEl = document.getElementById("prefModal");
let prefModal = null;
const prefModalBody = document.getElementById("prefModalBody");
const modalTeacherName = document.getElementById("modalTeacherName");

document.addEventListener("DOMContentLoaded", () => {
    prefModal = new bootstrap.Modal(prefModalEl);
    loadTeachers();
});

// ------------------------------------------------------
// LOAD TEACHERS + PREFERENCES
// ------------------------------------------------------
async function loadTeachers() {
    const res = await authFetch(`${HOST}/api/teachers/preferences/`);
    if (!res.ok) return;

    let data = await res.json();

    // Sort teachers by latest updated preference
    data.sort((a, b) => {
        const aTime = a.last_pref_update ? new Date(a.last_pref_update) : 0;
        const bTime = b.last_pref_update ? new Date(b.last_pref_update) : 0;
        return bTime - aTime;
    });

    teachersBody.innerHTML = "";
    data.forEach(t => {
        const top3 = t.preferences.slice(0, 3)
            .map(p => `<span class="badge bg-primary badge-pref">${p.subject.name} (${p.score})</span>`)
            .join(" ");

        const lastUpdated = t.last_pref_update 
            ? new Date(t.last_pref_update).toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : "-";

        teachersBody.innerHTML += `
        <tr>
            <td>${t.id}</td>
            <td>${t.name || "-"}</td>
            <td>${t.staff_id}</td>
            <td>${t.department || "-"}</td>
            <td>${top3}</td>
            <td class="last-updated">${lastUpdated}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick='openPrefModal(${JSON.stringify(t)})'>View All</button>
            </td>
        </tr>
        `;
    });
}

// ------------------------------------------------------
// OPEN MODAL WITH FULL PREFERENCES
// ------------------------------------------------------
function openPrefModal(teacher) {
    modalTeacherName.textContent = `${teacher.name} (${teacher.staff_id})`;
    prefModalBody.innerHTML = "";

    teacher.preferences.forEach(p => {
        const updated = new Date(p.updated_at).toLocaleString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        prefModalBody.innerHTML += `
        <tr>
            <td>${p.subject.name}</td>
            <td>${p.subject.department.name}</td>
            <td>${p.score}</td>
            <td>${updated}</td>
        </tr>
        `;
    });

    prefModal.show();
}
