const API = "http://localhost:3000";

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/api/dashboard`);
        const data = await res.json();

        document.getElementById("totalPatients").innerText = data.patients;
        document.getElementById("totalDoctors").innerText = data.doctors;
        document.getElementById("totalWards").innerText = data.wards;
        document.getElementById("totalBeds").innerText = data.beds;
        document.getElementById("totalStaff").innerText = data.staff;
    } catch (err) {
        console.error("Dashboard Error:", err);
    }
}

/* =========================
   LOAD PATIENTS
========================= */
async function loadPatients(search = "") {
    try {
        const res = await fetch(`${API}/api/patients?search=${search}`);
        const data = await res.json();
        console.log("Patients data:", data); // debug

        const table = document.getElementById("patientTable");
        table.innerHTML = "";

        if (data.length === 0) {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center;">No patients found</td></tr>`;
            return;
        }

        data.forEach(p => {
            table.innerHTML += `
            <tr>
                <td>${p.patient_id}</td>
                <td>${p.first_name} ${p.last_name}</td>
                <td>${new Date(p.dob).toLocaleDateString()}</td>
                <td>${p.sex}</td>
                <td>${p.phone}</td>
                <td>${p.doctor_name || "N/A"}</td>
                <td>
                    <button onclick="deletePatient(${p.patient_id})">Delete</button>
                </td>
            </tr>`;
        });
    } catch (err) {
        console.error("Load Patients Error:", err);
    }
}

/* =========================
   LOAD DOCTORS
========================= */
async function loadDoctors() {
    try {
        const res = await fetch(`${API}/api/doctors`);
        const doctors = await res.json();
        console.log("Doctors data:", doctors); // debug

        const select = document.getElementById("doctor_id");
        select.innerHTML = '<option value="">Select Doctor</option>';

        doctors.forEach(doc => {
            select.innerHTML += `<option value="${doc.doctor_id}">${doc.full_name}</option>`;
        });
    } catch (err) {
        console.error("Load Doctors Error:", err);
    }
}

/* =========================
   ADD PATIENT
========================= */
async function savePatient() {
    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    const address = document.getElementById("address").value;
    const dob = document.getElementById("dob").value;
    const sex = document.getElementById("sex").value;
    const phone = document.getElementById("phone").value;
    const marital_status = document.getElementById("marital_status").value;
    const doctor_id = document.getElementById("doctor_id").value || null;

    try {
        await fetch(`${API}/api/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, address, dob, sex, phone, marital_status, doctor_id })
        });

        closeForm();
        loadPatients();
        loadDashboard();
    } catch (err) {
        console.error("Save Patient Error:", err);
    }
}

/* =========================
   DELETE PATIENT
========================= */
async function deletePatient(id) {
    if (!confirm("Delete this patient?")) return;

    try {
        await fetch(`${API}/api/patients/${id}`, { method: "DELETE" });
        loadPatients();
        loadDashboard();
    } catch (err) {
        console.error("Delete Patient Error:", err);
    }
}

/* =========================
   MODAL
========================= */
function openForm() {
    document.getElementById("formModal").style.display = "block";
}

function closeForm() {
    document.getElementById("formModal").style.display = "none";
}

/* =========================
   NAVBAR SECTION SWITCHING
========================= */
function initNavbar() {
    const sections = document.querySelectorAll("section");
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const target = link.getAttribute("href").replace("#", "");
            sections.forEach(sec => sec.style.display = sec.id === target ? "block" : "none");
        });
    });
}

/* =========================
   INIT
========================= */
window.onload = () => {
    loadDashboard();
    loadPatients();
    loadDoctors();
    initNavbar();

    document.querySelectorAll("section").forEach(sec => {
        sec.style.display = sec.id === "dashboard" ? "block" : "none";
    });

    // Search patients
    document.getElementById("search").addEventListener("keyup", function() {
        loadPatients(this.value);
    });
};