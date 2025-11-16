const availabilityBody = document.getElementById("availability-body");
const saveBtn = document.getElementById("saveBtn");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = [
    "7:30-8:25",
    "8:25-9:20",
    "9:30-10:25",
    "10:25-11:20",
    "12:20-1:15",
    "1:15-2:10",
    "2:30-3:25",
    "3:25-4:20"
];

let availabilityBits = [];
let teacherId = null;

async function loadAvailability() {

    teacherId = JSON.parse(localStorage.getItem("user_data")).teacher.id;

    const res = await authFetch(`${HOST}/api/teachers/${teacherId}/`);
    const data = await res.json();

    availabilityBits = data.availability.split(""); // length 48

    renderGrid();
}

function renderGrid() {
    availabilityBody.innerHTML = "";

    for (let slot = 0; slot < 8; slot++) {
        const tr = document.createElement("tr");

        // first column = slot label
        const slotCell = document.createElement("td");
        slotCell.textContent = SLOTS[slot];
        tr.appendChild(slotCell);

        for (let day = 0; day < 6; day++) {

            // compute correct index with days on X-axis
            const index = slot * 6 + day;
            const bit = availabilityBits[index];

            const td = document.createElement("td");
            td.classList.add("availability-cell");
            td.classList.add(bit === "1" ? "avail-1" : "avail-0");

            td.dataset.index = index;
            td.textContent = bit === "1" ? "Available" : "Unavailable";

            td.onclick = () => toggleCell(td);

            tr.appendChild(td);
        }

        availabilityBody.appendChild(tr);
    }
}

function toggleCell(td) {
    const idx = parseInt(td.dataset.index);
    const current = availabilityBits[idx];

    if (current === "1") {
        availabilityBits[idx] = "0";
        td.classList.remove("avail-1");
        td.classList.add("avail-0");
        td.textContent = "Unavailable";
    } else {
        availabilityBits[idx] = "1";
        td.classList.remove("avail-0");
        td.classList.add("avail-1");
        td.textContent = "Available";
    }
}

saveBtn.onclick = async () => {

    const payload = {
        availability: availabilityBits.join("")
    };

    await authFetch(`${HOST}/api/teachers/${teacherId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    alert("Saved.");
};

loadAvailability();
