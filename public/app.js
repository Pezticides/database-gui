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
   POPULATE ALL DOCTOR DROPDOWNS
========================= */
async function loadAllDoctors() {
    try {
        const res = await fetch(`${API}/api/doctors`);
        const doctors = await res.json();
        
        // Add Modal
        const addDoctorSelect = document.getElementById("add_doctor_id");
        addDoctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        doctors.forEach(doc => {
            addDoctorSelect.innerHTML += `<option value="${doc.doctor_id}">${doc.full_name}</option>`;
        });
        
        // Edit Modal  
        const editDoctorSelect = document.getElementById("edit_doctor_id");
        editDoctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        doctors.forEach(doc => {
            editDoctorSelect.innerHTML += `<option value="${doc.doctor_id}">${doc.full_name}</option>`;
        });
    } catch (err) {
        console.error("Load Doctors Error:", err);
    }
}

/* =========================
   LOAD PATIENTS (GLOBAL SEARCH)
========================= */
async function loadPatients(search = "") {
    try {
        const res = await fetch(`${API}/api/patients?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        console.log("Patients data:", data);

        const table = document.getElementById("patientTable");
        table.innerHTML = "";

        if (data.length === 0) {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No patients found matching "${search || 'any criteria'}"</td></tr>`;
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
                <td class="actions">
                    <button class="view-btn" onclick="viewPatient(${p.patient_id})" title="View Details">👁️</button>
                    <button class="edit-btn" onclick="editPatient(${p.patient_id})" title="Edit">✏️</button>
                    <button class="delete-btn" onclick="deletePatient(${p.patient_id})" title="Delete">🗑️</button>
                </td>
            </tr>`;
        });
    } catch (err) {
        console.error("Load Patients Error:", err);
    }
}



/* =========================
   VIEW PATIENT
========================= */
async function viewPatient(id) {
    try {
        const res = await fetch(`${API}/api/patients/${id}`);
        const patient = await res.json();
        
        document.getElementById("viewTitle").textContent = `${patient.first_name} ${patient.last_name} - Details`;
        document.getElementById("viewContent").innerHTML = `
            <div class="patient-details">
                <p><strong>ID:</strong> ${patient.patient_id}</p>
                <p><strong>Name:</strong> ${patient.first_name} ${patient.last_name}</p>
                <p><strong>Date of Birth:</strong> ${new Date(patient.dob).toLocaleDateString()}</p>
                <p><strong>Gender:</strong> ${patient.sex}</p>
                <p><strong>Phone:</strong> ${patient.phone}</p>
                <p><strong>Address:</strong> ${patient.address || 'N/A'}</p>
                <p><strong>Marital Status:</strong> ${patient.marital_status || 'N/A'}</p>
                <p><strong>Date Registered:</strong> ${new Date(patient.date_registered).toLocaleDateString()}</p>
                <p><strong>Doctor:</strong> ${patient.doctor_name || 'N/A'}</p>
                ${patient.clinic_name ? `<p><strong>Clinic:</strong> ${patient.clinic_name}</p>` : ''}
            </div>
        `;
        document.getElementById("viewModal").style.display = "block";
    } catch (err) {
        console.error("View Patient Error:", err);
    }
}

/* =========================
   EDIT PATIENT
========================= */
async function editPatient(id) {
    try {
        const res = await fetch(`${API}/api/patients/${id}`);
        const patient = await res.json();
        
        // Populate edit form
        document.getElementById("edit_patient_id").value = patient.patient_id;
        document.getElementById("edit_first_name").value = patient.first_name;
        document.getElementById("edit_last_name").value = patient.last_name;
        document.getElementById("edit_address").value = patient.address || '';
        document.getElementById("edit_phone").value = patient.phone;
        document.getElementById("edit_dob").value = patient.dob;
        document.getElementById("edit_sex").value = patient.sex;
        document.getElementById("edit_marital_status").value = patient.marital_status || '';
        document.getElementById("edit_doctor_id").value = patient.doctor_id || '';
        
        document.getElementById("editModal").style.display = "block";
    } catch (err) {
        console.error("Edit Patient Error:", err);
    }
}

/* =========================
   UPDATE PATIENT
========================= */
async function updatePatient() {
    const id = document.getElementById("edit_patient_id").value;
    const first_name = document.getElementById("edit_first_name").value;
    const last_name = document.getElementById("edit_last_name").value;
    const address = document.getElementById("edit_address").value;
    const phone = document.getElementById("edit_phone").value;
    const dob = document.getElementById("edit_dob").value;
    const sex = document.getElementById("edit_sex").value;
    const marital_status = document.getElementById("edit_marital_status").value;
    const doctor_id = document.getElementById("edit_doctor_id").value || null;

    if (!first_name || !last_name || !phone) {
        alert("Please fill required fields (Name, Phone)");
        return;
    }

    try {
        await fetch(`${API}/api/patients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, address, phone, dob, sex, marital_status, doctor_id })
        });
        closeEditForm();
        loadPatients();
        loadDashboard();
    } catch (err) {
        console.error("Update Patient Error:", err);
    }
}

/* =========================
   SAVE NEW PATIENT (Fixed Form Clear)
========================= */
async function saveNewPatient() {
    const first_name = document.getElementById("add_first_name").value;
    const last_name = document.getElementById("add_last_name").value;
    const address = document.getElementById("add_address").value;
    const phone = document.getElementById("add_phone").value;
    const dob = document.getElementById("add_dob").value;
    const sex = document.getElementById("add_sex").value;
    const marital_status = document.getElementById("add_marital_status").value;
    const doctor_id = document.getElementById("add_doctor_id").value || null;

    if (!first_name || !last_name || !phone) {
        alert("Please fill required fields (Name, Phone)");
        return;
    }

    try {
        await fetch(`${API}/api/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, address, phone, dob, sex, marital_status, doctor_id })
        });
        closeAddForm();
        loadPatients();
        loadDashboard();
        clearAddForm(); // Clear all fields
    } catch (err) {
        console.error("Save Patient Error:", err);
    }
}

function clearAddForm() {
    document.getElementById("add_first_name").value = '';
    document.getElementById("add_last_name").value = '';
    document.getElementById("add_address").value = '';
    document.getElementById("add_phone").value = '';
    document.getElementById("add_dob").value = '';
    document.getElementById("add_sex").value = '';
    document.getElementById("add_marital_status").value = '';
    document.getElementById("add_doctor_id").value = '';
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
   MODAL FUNCTIONS (MISSING!)
========================= */
function openAddForm() { 
    document.getElementById("addModal").style.display = "block"; 
}

function closeAddForm() { 
    document.getElementById("addModal").style.display = "none"; 
}

function closeViewForm() { 
    document.getElementById("viewModal").style.display = "none"; 
}

function closeEditForm() { 
    document.getElementById("editModal").style.display = "none"; 
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}

/* =========================
   INIT (Fixed - Call loadAllDoctors)
========================= */
window.onload = () => {
    loadDashboard();
    loadAllDoctors();  // ✅ FIXED: Load doctors for ALL modals
    loadPatients();
    initNavbar();

    document.querySelectorAll("section").forEach(sec => {
        sec.style.display = sec.id === "dashboard" ? "block" : "none";
    });

    // Search patients
    document.getElementById("search").addEventListener("keyup", function() {
        loadPatients(this.value);
    });
};