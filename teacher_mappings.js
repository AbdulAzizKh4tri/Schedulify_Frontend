const tableBody = document.querySelector("#teacherTable tbody");
const timetableSelect = document.getElementById("timetableSelect");
const overallSpan = document.getElementById("overallSatisfaction");

document.addEventListener("DOMContentLoaded", async () => {
    await loadTimetables();
    timetableSelect.addEventListener("change", loadData);
});

async function loadTimetables() {
    const res = await authFetch(`${HOST}/api/timetables/`);
    if (!res.ok) return;
    const data = await res.json();
    timetableSelect.innerHTML = data.map(t => `<option value="${t.id}">Timetable ${t.id}</option>`).join("");
    loadData();
}

async function loadData() {
    const timetableId = timetableSelect.value;
    if (!timetableId) return;

    const res = await authFetch(`${HOST}/api/teacher_mappings/?timetable_id=${timetableId}`);
    if (!res.ok) return;
    const data = await res.json();

    overallSpan.innerText = (data.overall_satisfaction*100).toFixed(1) + "%";

    tableBody.innerHTML = "";
    data.teachers.forEach(t => {
        const subjectsHtml = t.subjects.map(s => {
            const divs = s.divisions.join(", ");
            return `<span class="badge bg-primary badge-subj">${s.subject} → ${divs || "-"}</span>`;
        }).join(" ");

        tableBody.innerHTML += `
            <tr>
                <td>${t.teacher_name}</td>
                <td>${t.staff_id}</td>
                <td>${t.department || "-"}</td>
                <td>${t.used_workload}</td>
                <td>${t.max_workload}</td>
                <td>${(t.satisfaction*100).toFixed(1)}%</td>
                <td>${subjectsHtml}</td>
            </tr>
        `;
    });
}
