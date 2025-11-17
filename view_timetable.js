const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const numDays = days.length;
const slots = 8;

const slotTimings = [
    "7:30-8:25",
    "8:25-9:20",
    "9:30-10:25",
    "10:25-11:20",
    "12:20-1:15",
    "1:15-2:10",
    "2:30-3:25",
    "3:25-4:20"
];

const timetableSelect = document.getElementById("timetableSelect");
const divisionSelect = document.getElementById("divisionSelect");
const tableContainer = document.getElementById("timetable-container");
const thead = document.getElementById("timetable-thead");
const tbody = document.getElementById("timetable-body");

let timetableData = null;

// -----------------------------------------------------
// LOAD ALL TIMETABLES
// -----------------------------------------------------
async function loadTimetables() {
    const res = await fetch(`${HOST}/api/timetables/list_timetables/`);
    if (!res.ok) return;

    const data = await res.json();
    data.timetables.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = "Timetable " + t.id;
        timetableSelect.appendChild(opt);
    });
}

loadTimetables();


// -----------------------------------------------------
// WHEN A TIMETABLE IS SELECTED
// -----------------------------------------------------
timetableSelect.onchange = async () => {
    const id = timetableSelect.value;

    divisionSelect.innerHTML = `<option value="">-- Select --</option>`;
    divisionSelect.disabled = true;
    tableContainer.style.display = "none";
    tbody.innerHTML = "";

    if (!id) return;

    const res = await fetch(`${HOST}/api/timetables/${id}/`);
    if (!res.ok) return;

    timetableData = await res.json();

    const uniqueDivs = {};
    timetableData.entries.forEach(e => {
        uniqueDivs[e.division.id] = e.division;
    });

    Object.values(uniqueDivs).forEach(div => {
        const opt = document.createElement("option");
        opt.value = div.id;
        opt.textContent = div.name;
        divisionSelect.appendChild(opt);
    });

    divisionSelect.disabled = false;
};


// -----------------------------------------------------
// WHEN DIVISION IS SELECTED → RENDER GRID
// -----------------------------------------------------
divisionSelect.onchange = () => {
    const divId = parseInt(divisionSelect.value);
    if (!divId) {
        tableContainer.style.display = "none";
        return;
    }
    renderGrid(divId);
};


// -----------------------------------------------------
// RENDER BEAUTIFUL GRID
// -----------------------------------------------------
function renderGrid(divId) {
    tableContainer.style.display = "block";

    // HEADER
    thead.innerHTML = `
        <tr>
            <th>Slot</th>
            ${days.map(d => `<th>${d}</th>`).join("")}
        </tr>
    `;

    // Prepare grid
    const grid = Array.from({ length: slots }, () =>
        Array.from({ length: numDays }, () => null)
    );

    timetableData.entries.forEach(e => {
        if (e.division.id !== divId) return;

        const ts = e.time_slot;
        const dayIdx = ts % numDays;
        const slotIdx = Math.floor(ts / numDays);

        grid[slotIdx][dayIdx] = e;
    });

    tbody.innerHTML = "";

    for (let s = 0; s < slots; s++) {
        let row = `<tr><th>${slotTimings[s]}</th>`;

        for (let d = 0; d < numDays; d++) {
            const e = grid[s][d];

            if (!e) {
                row += `<td class="timetable-cell"></td>`;
            } else {
                const className =
                    e.session_type === "Lab"
                        ? "timetable-entry-lab"
                        : "timetable-entry-lecture";

                row += `
                <td class="timetable-cell">
                    <div class="${className}">
                        <strong>${e.subject.name}</strong>
                        <div>${e.teacher.user.full_name}</div>
                        <div>Room: ${e.classroom.number}</div>
                    </div>
                </td>
                `;
            }
        }

        row += "</tr>";
        tbody.innerHTML += row;
    }
}