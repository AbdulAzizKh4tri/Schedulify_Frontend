
const subjectContainer = document.getElementById("subjectContainer");
const submitBtn = document.getElementById("submitBtn");
const validationMsg = document.getElementById("validationMsg");
const minRequiredElement = document.getElementById("minRequired");

let subjects = [];
let teacherData = JSON.parse(localStorage.getItem("user_data")).teacher;
let teacherDept = teacherData.department.id;
let teacherId = teacherData.id;
let requiredTotalMin = 0;

async function getSubjects() {
    const res = await authFetch(`${HOST}/api/subjects/?department=${teacherDept}`);
    const list = await res.json();

    subjects = list

    requiredTotalMin = (subjects.length * 10) / 2;
    minRequiredElement.innerText = requiredTotalMin;

    renderTable();
}

function renderTable() {
    let html = `
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Code</th>
                <th style="width:150px">Score</th>
            </tr>
        </thead>
        <tbody>
    `;

    subjects.forEach(s => {
        html += `
        <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.code)}</td>
            <td>
                <input 
                    id="score_${s.id}"
                    type="number" 
                    class="form-control scoreInput" 
                    data-id="${s.id}" 
                    min="1" max="10" 
                >
            </td>
        </tr>
        `;
    });

    html += `</tbody></table>`;
    subjectContainer.innerHTML = html;


    document.querySelectorAll(".scoreInput").forEach(inp => {
        inp.addEventListener("input", validateScores);
    });


    validateScores();
    
}

function validateScores() {
    let total = 0;
    let valid = true;

    document.querySelectorAll(".scoreInput").forEach(inp => {
        const v = parseInt(inp.value);

        if (isNaN(v) || v < 1 || v > 10) valid = false;
        total += v;
    });

    if (!valid) {
        validationMsg.innerText = "All scores must be integers 1–10.";
        validationMsg.style.display = "block";
        submitBtn.disabled = true;
        return;
    }

    if (total < requiredTotalMin) {
        validationMsg.innerText = 
            `Total = ${total}. Minimum required = ${requiredTotalMin}.`;
        validationMsg.style.display = "block";
        submitBtn.disabled = true;
        return;
    }

    validationMsg.style.display = "none";
    submitBtn.disabled = false;
}

submitBtn.onclick = async () => {
    const scores = {};
    
    document.querySelectorAll(".scoreInput").forEach(inp => {
        scores[inp.dataset.id] = parseInt(inp.value);
    });
    const payload = { preferences: scores };
    payload["teacher_id"] = teacherId
    
    const res = await authFetch(`${HOST}/api/preferences/bulk_update/`, {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        alert("Error submitting preferences");
        return;
    }

    alert("Preferences saved successfully!");
    window.location.href = "dashboard_teacher.html";
};

async function fillPreferences() {
    const res = await authFetch(`${HOST}/api/preferences/?teacher=${teacherId}`);
    if (!res.ok) return;
    const data = await res.json();


    data.forEach(pref => {
        const inp = document.getElementById(`score_${pref.subject.id}`);
        if (inp) {
            inp.value = pref.score;
        }
    });
}

async function init() {
    await getSubjects();
    await fillPreferences();
}

init();
