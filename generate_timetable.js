const deptTableBody = document.querySelector("#deptSummary tbody");
const subjectTableBody = document.querySelector("#subjectSummary tbody");
const totalCountsDiv = document.getElementById("totalCounts");
const generateBtn = document.getElementById("generateBtn");
const errorMsg = document.getElementById("errorMsg");
const timerDisplay = document.getElementById("timerDisplay");
const timeoutInput = document.getElementById("timeoutInput");

let timerInterval = null;
let elapsed = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadSummary();
});

async function loadSummary() {
    const res = await authFetch(`${HOST}/api/summary/`);
    if (!res.ok) return;
    const data = await res.json();

    totalCountsDiv.innerHTML = `
        <div class="col-md-2"><div class="card card-tile text-center">Departments<br><strong>${data.total.departments}</strong></div></div>
        <div class="col-md-2"><div class="card card-tile text-center">Teachers<br><strong>${data.total.teachers}</strong></div></div>
        <div class="col-md-2"><div class="card card-tile text-center">Subjects<br><strong>${data.total.subjects}</strong></div></div>
        <div class="col-md-2"><div class="card card-tile text-center">Classrooms<br><strong>${data.total.classrooms}</strong></div></div>
        <div class="col-md-2"><div class="card card-tile text-center">Divisions<br><strong>${data.total.divisions}</strong></div></div>
    `;

    deptTableBody.innerHTML = "";
    data.departments.forEach(d => {
        deptTableBody.innerHTML += `
            <tr>
                <td>${d.name}</td>
                <td>${d.num_teachers}</td>
                <td>${d.num_subjects}</td>
            </tr>
        `;
    });

    subjectTableBody.innerHTML = "";
    data.subjects.forEach(s => {
        subjectTableBody.innerHTML += `
            <tr>
                <td>${s.name}</td>
                <td>${s.num_teachers}</td>
                <td>${s.num_divisions}</td>
            </tr>
        `;
    });
}

function startTimer() {
    elapsed = 0;
    timerDisplay.innerText = `Time elapsed: 0s`;
    timerInterval = setInterval(() => {
        elapsed++;
        timerDisplay.innerText = `Time elapsed: ${elapsed}s`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.innerText = `Time elapsed: ${elapsed}s`;
}

generateBtn.onclick = async () => {
    errorMsg.innerText = "";
    generateBtn.disabled = true;
    generateBtn.innerText = "Generating...";

    const timeout = parseInt(timeoutInput.value) || 60;
    startTimer();

    try {
        const res = await authFetch(`${HOST}/api/generate/?timeout=${timeout}`);

        if (res.ok) {
            const data = await res.json();
            window.location.href = "view_timetable.html";
        } else {
            const err = await res.json().catch(() => ({message:"Unknown error"}));
            errorMsg.innerText = "Error: " + (err.message || JSON.stringify(err));
        }
    } catch (e) {
        errorMsg.innerText = "Error: " + e.message;
    } finally {
        stopTimer();
        generateBtn.disabled = false;
        generateBtn.innerText = "Generate Timetable";
    }
};
