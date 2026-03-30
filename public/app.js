const API = "http://localhost:3000";
let latestPayroll = null;

/* =========================
   DASHBOARD
========================= */
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/api/dashboard`);
        const data = await res.json();

        document.getElementById("totalPatients").innerText = data.patients ?? 0;
        document.getElementById("totalDoctors").innerText = data.doctors ?? 0;
        document.getElementById("totalWards").innerText = data.wards ?? 0;
        document.getElementById("totalBeds").innerText = data.beds ?? 0;
        document.getElementById("totalStaff").innerText = data.staff ?? 0;

        loadRecentActivities();
        loadUpcomingAppointments();
        loadAppointmentFormOptions();
    } catch (err) {
        console.error("Dashboard Error:", err);
    }
}

/* =========================
   LOAD DOCTORS + WARDS
========================= */
async function loadAllDoctorsToSelects() {
    try {
        const res = await fetch(`${API}/api/doctors`);
        const doctors = await res.json();

        const addDoctorSelect = document.getElementById("add_doctor_id");
        const editDoctorSelect = document.getElementById("edit_doctor_id");
        const medDoctorSelect = document.getElementById("med_doctor_id");
        const apptDoctorSelect = document.getElementById("appt_doctor_id");

        [addDoctorSelect, editDoctorSelect, medDoctorSelect, apptDoctorSelect].forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="">Select Doctor</option>';
            doctors.forEach(doc => {
                select.innerHTML += `<option value="${doc.doctor_id}">${doc.full_name}</option>`;
            });
        });
    } catch (err) {
        console.error("Load Doctors Error:", err);
    }
}

async function loadWardsToSelects() {
    try {
        const res = await fetch(`${API}/api/wards`);
        const wards = await res.json();

        const selects = [
            document.getElementById("add_staff_ward_id"),
            document.getElementById("edit_staff_ward_id"),
            document.getElementById("req_ward_id")
        ];

        selects.forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="">Select Ward</option>';
            wards.forEach(ward => {
                select.innerHTML += `<option value="${ward.ward_id}">${ward.ward_name}</option>`;
            });
        });
    } catch (err) {
        console.error("Load Wards Error:", err);
    }
}

async function loadDrugsToSelects() {
    try {
        const res = await fetch(`${API}/api/drugs`);
        const drugs = await res.json();

        const medDrugSelect = document.getElementById("med_drug_id");
        const reqDrugSelect = document.getElementById("req_drug_id");

        [medDrugSelect, reqDrugSelect].forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="">Select Drug</option>';
            drugs.forEach(drug => {
                select.innerHTML += `
                    <option value="${drug.drug_id}">
                        ${drug.drug_name} (${drug.stock_qty} stock)
                    </option>
                `;
            });
        });
    } catch (err) {
        console.error("Load Drugs Error:", err);
    }
}

/* =========================
   DOCTOR TABLE
========================= */
async function loadDoctors(search = "") {
    try {
        const res = await fetch(`${API}/api/doctors?search=${encodeURIComponent(search)}`);
        const doctors = await res.json();

        const table = document.getElementById("doctorTable");
        table.innerHTML = "";

        if (!doctors.length) {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">No doctors found</td></tr>`;
            return;
        }

        doctors.forEach(d => {
            table.innerHTML += `
                <tr>
                    <td>${d.doctor_id}</td>
                    <td>${d.full_name}</td>
                    <td>${d.clinic_number || "N/A"}</td>
                    <td>${d.position || "Doctor Staff"}</td>
                    <td><span class="ward-badge">${d.ward_name || "Unassigned"}</span></td>
                    <td>${d.total_patients || 0}</td>
                    <td class="actions">
                        <button class="view-btn" onclick="viewDoctor(${d.doctor_id})">👁️</button>
                        <button class="edit-btn" onclick="openAssignDoctorModal(${d.doctor_id}, '${escapeQuotes(d.full_name)}')">➕</button>
                        <button class="delete-btn" onclick="deleteDoctor(${d.doctor_id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Load Doctors Error:", err);
    }
}

async function viewDoctor(id) {
    try {
        const res = await fetch(`${API}/api/doctors/${id}`);
        const doctor = await res.json();

        document.getElementById("viewDoctorTitle").textContent = `${doctor.full_name} - Doctor Information`;
        document.getElementById("viewDoctorContent").innerHTML = `
            <div class="patient-details">
                <p><strong>Doctor ID:</strong> ${doctor.doctor_id}</p>
                <p><strong>Full Name:</strong> ${doctor.full_name}</p>
                <p><strong>Clinic Number:</strong> ${doctor.clinic_number || "N/A"}</p>
                <p><strong>Linked Staff:</strong> ${doctor.staff_first_name ? doctor.staff_first_name + " " + doctor.staff_last_name : "Not linked"}</p>
                <p><strong>Position:</strong> ${doctor.position || "N/A"}</p>
                <p><strong>Phone:</strong> ${doctor.tel_number || "N/A"}</p>
                <p><strong>Ward/Department:</strong> <span class="ward-badge">${doctor.ward_name || "Unassigned"}</span></p>
                <p><strong>Address:</strong> ${doctor.address || "N/A"}</p>
                <p><strong>Salary:</strong> ${doctor.salary ? "₱" + Number(doctor.salary).toLocaleString() : "N/A"}</p>

                <h4>Assigned Patients</h4>
                ${
                    doctor.patients && doctor.patients.length
                        ? `<ul>${doctor.patients.map(p => `<li>#${p.patient_id} - ${p.patient_name} (${p.sex || "N/A"})</li>`).join("")}</ul>`
                        : `<p>No assigned patients</p>`
                }

                <h4>Upcoming Appointments</h4>
                ${
                    doctor.appointments && doctor.appointments.length
                        ? `<ul>${doctor.appointments.map(a => `<li>${a.patient_name} - ${a.schedule}</li>`).join("")}</ul>`
                        : `<p>No upcoming appointments</p>`
                }
            </div>
        `;

        document.getElementById("viewDoctorModal").style.display = "block";
    } catch (err) {
        console.error("View Doctor Error:", err);
    }
}

function openAssignDoctorModal(doctorId, doctorName) {
    document.getElementById("assign_doctor_id").value = doctorId;
    document.getElementById("assignDoctorTitle").textContent = `Assign Patient to ${doctorName}`;
    loadPatientsForAssign();
    document.getElementById("assignDoctorModal").style.display = "block";
}

async function loadPatientsForAssign() {
    try {
        const res = await fetch(`${API}/api/patients`);
        const patients = await res.json();

        const select = document.getElementById("assign_patient_id");
        select.innerHTML = `<option value="">Select Patient</option>`;

        patients.forEach(p => {
            select.innerHTML += `<option value="${p.patient_id}">${p.first_name} ${p.last_name}</option>`;
        });
    } catch (err) {
        console.error("Load Patients For Assign Error:", err);
    }
}

async function assignPatientToDoctor() {
    const doctor_id = document.getElementById("assign_doctor_id").value;
    const patient_id = document.getElementById("assign_patient_id").value;

    if (!doctor_id || !patient_id) {
        alert("Please select a patient");
        return;
    }

    try {
        const res = await fetch(`${API}/api/doctors/${doctor_id}/assign-patient`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patient_id })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to assign patient");
            return;
        }

        closeAssignDoctorModal();
        loadDoctors(document.getElementById("doctorSearch").value);
        loadPatients(document.getElementById("search").value);
    } catch (err) {
        console.error("Assign Doctor Error:", err);
    }
}

async function deleteDoctor(id) {
    if (!confirm("Delete this doctor?")) return;

    try {
        const res = await fetch(`${API}/api/doctors/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to delete doctor");
            return;
        }

        loadDoctors(document.getElementById("doctorSearch").value);
        loadDashboard();
        loadAllDoctorsToSelects();
    } catch (err) {
        console.error("Delete Doctor Error:", err);
    }
}

/* =========================
   PATIENTS
========================= */
async function loadPatients(search = "") {
    try {
        const res = await fetch(`${API}/api/patients?search=${encodeURIComponent(search)}`);
        const data = await res.json();

        const table = document.getElementById("patientTable");
        table.innerHTML = "";

        if (!data.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:20px;">
                        No patients found
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(p => {
            table.innerHTML += `
                <tr>
                    <td>${p.patient_id}</td>
                    <td>${p.first_name} ${p.last_name}</td>
                    <td>${formatDate(p.dob)}</td>
                    <td>${p.sex || "N/A"}</td>
                    <td>${p.tel_no || "N/A"}</td>
                    <td>${p.doctor_name || "N/A"}</td>
                    <td><button class="med-btn" onclick="openMedicationModal(${p.patient_id}, '${escapeQuotes(p.first_name + " " + p.last_name)}')">💊</button></td>
                    <td class="actions">
                        <button class="view-btn" onclick="viewPatient(${p.patient_id})">👁️</button>
                        <button class="edit-btn" onclick="editPatient(${p.patient_id})">✏️</button>
                        <button class="delete-btn" onclick="deletePatient(${p.patient_id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Load Patients Error:", err);
    }
}

async function viewPatient(id) {
    try {
        const [patientRes, medsRes] = await Promise.all([
            fetch(`${API}/api/patients/${id}`),
            fetch(`${API}/api/patients/${id}/medications`)
        ]);

        const patient = await patientRes.json();
        const meds = await medsRes.json();

        document.getElementById("viewTitle").textContent = `${patient.first_name} ${patient.last_name} - Details`;
        document.getElementById("viewContent").innerHTML = `
            <div class="patient-details">
                <p><strong>ID:</strong> ${patient.patient_id}</p>
                <p><strong>Name:</strong> ${patient.first_name} ${patient.last_name}</p>
                <p><strong>Date of Birth:</strong> ${formatDate(patient.dob)}</p>
                <p><strong>Gender:</strong> ${patient.sex || "N/A"}</p>
                <p><strong>Phone:</strong> ${patient.tel_no || "N/A"}</p>
                <p><strong>Address:</strong> ${patient.address || "N/A"}</p>
                <p><strong>Marital Status:</strong> ${patient.marital_status || "N/A"}</p>
                <p><strong>Date Registered:</strong> ${formatDate(patient.date_registered)}</p>
                <p><strong>Doctor:</strong> ${patient.doctor_name || "N/A"}</p>
                <p><strong>Clinic Number:</strong> ${patient.clinic_number || "N/A"}</p>

                <h4>Patient Medications</h4>
                ${
                    meds.length
                        ? `<ul>${meds.map(m => `
                            <li>
                                <strong>${m.drug_name}</strong> - ${m.dosage || "N/A"} / ${m.frequency || "N/A"} / ${m.route || "N/A"}
                                <br>Status: ${m.status || "N/A"}
                                <br>Prescribed by: ${m.doctor_name || "N/A"}
                            </li>
                        `).join("")}</ul>`
                        : `<p>No medication records found</p>`
                }
            </div>
        `;

        document.getElementById("viewModal").style.display = "block";
    } catch (err) {
        console.error("View Patient Error:", err);
    }
}

async function editPatient(id) {
    try {
        const res = await fetch(`${API}/api/patients/${id}`);
        const patient = await res.json();

        document.getElementById("edit_patient_id").value = patient.patient_id;
        document.getElementById("edit_first_name").value = patient.first_name || "";
        document.getElementById("edit_last_name").value = patient.last_name || "";
        document.getElementById("edit_address").value = patient.address || "";
        document.getElementById("edit_phone").value = patient.tel_no || "";
        document.getElementById("edit_dob").value = patient.dob ? patient.dob.split("T")[0] : "";
        document.getElementById("edit_sex").value = patient.sex || "";
        document.getElementById("edit_marital_status").value = patient.marital_status || "";
        document.getElementById("edit_doctor_id").value = patient.doctor_id || "";

        document.getElementById("editModal").style.display = "block";
    } catch (err) {
        console.error("Edit Patient Error:", err);
    }
}

async function updatePatient() {
    const id = document.getElementById("edit_patient_id").value;
    const first_name = document.getElementById("edit_first_name").value.trim();
    const last_name = document.getElementById("edit_last_name").value.trim();
    const address = document.getElementById("edit_address").value.trim();
    const phone = document.getElementById("edit_phone").value.trim();
    const dob = document.getElementById("edit_dob").value;
    const sex = document.getElementById("edit_sex").value;
    const marital_status = document.getElementById("edit_marital_status").value;
    const doctor_id = document.getElementById("edit_doctor_id").value || null;

    if (!first_name || !last_name || !phone) {
        alert("Please fill required fields (Name, Phone)");
        return;
    }

    try {
        const res = await fetch(`${API}/api/patients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, address, phone, dob, sex, marital_status, doctor_id })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to update patient");
            return;
        }

        closeEditForm();
        loadPatients(document.getElementById("search").value);
        loadDashboard();
    } catch (err) {
        console.error("Update Patient Error:", err);
    }
}

async function saveNewPatient() {
    const first_name = document.getElementById("add_first_name").value.trim();
    const last_name = document.getElementById("add_last_name").value.trim();
    const address = document.getElementById("add_address").value.trim();
    const phone = document.getElementById("add_phone").value.trim();
    const dob = document.getElementById("add_dob").value;
    const sex = document.getElementById("add_sex").value;
    const marital_status = document.getElementById("add_marital_status").value;
    const doctor_id = document.getElementById("add_doctor_id").value || null;

    if (!first_name || !last_name || !phone) {
        alert("Please fill required fields (Name, Phone)");
        return;
    }

    try {
        const res = await fetch(`${API}/api/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, address, phone, dob, sex, marital_status, doctor_id })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to add patient");
            return;
        }

        clearAddForm();
        closeAddForm();
        loadPatients(document.getElementById("search").value);
        loadDashboard();
        loadAppointmentFormOptions();
    } catch (err) {
        console.error("Save Patient Error:", err);
    }
}

function clearAddForm() {
    document.getElementById("add_first_name").value = "";
    document.getElementById("add_last_name").value = "";
    document.getElementById("add_address").value = "";
    document.getElementById("add_phone").value = "";
    document.getElementById("add_dob").value = "";
    document.getElementById("add_sex").value = "";
    document.getElementById("add_marital_status").value = "";
    document.getElementById("add_doctor_id").value = "";
}

async function deletePatient(id) {
    if (!confirm("Delete this patient?")) return;

    try {
        const res = await fetch(`${API}/api/patients/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to delete patient");
            return;
        }

        loadPatients(document.getElementById("search").value);
        loadDashboard();
        loadAppointmentFormOptions();
    } catch (err) {
        console.error("Delete Patient Error:", err);
    }
}

/* =========================
   MEDICATIONS
========================= */
function openMedicationModal(patientId, patientName) {
    document.getElementById("med_patient_id").value = patientId;
    document.getElementById("medPatientTitle").textContent = `Prescribe Medication - ${patientName}`;
    document.getElementById("medicationModal").style.display = "block";
}

function closeMedicationModal() {
    document.getElementById("medicationModal").style.display = "none";
}

async function saveMedication() {
    const patient_id = document.getElementById("med_patient_id").value;
    const drug_id = document.getElementById("med_drug_id").value;
    const prescribed_by_doctor_id = document.getElementById("med_doctor_id").value || null;
    const dosage = document.getElementById("med_dosage").value.trim();
    const frequency = document.getElementById("med_frequency").value.trim();
    const route = document.getElementById("med_route").value.trim();
    const start_date = document.getElementById("med_start_date").value;
    const end_date = document.getElementById("med_end_date").value;
    const status = document.getElementById("med_status").value;
    const notes = document.getElementById("med_notes").value.trim();

    if (!patient_id || !drug_id) {
        alert("Please select a drug");
        return;
    }

    try {
        const res = await fetch(`${API}/api/patients/${patient_id}/medications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                drug_id,
                prescribed_by_doctor_id,
                dosage,
                frequency,
                route,
                start_date,
                end_date,
                status,
                notes
            })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to save medication");
            return;
        }

        closeMedicationModal();
        alert("Medication prescribed successfully");
    } catch (err) {
        console.error("Save Medication Error:", err);
    }
}

/* =========================
   STAFF
========================= */
async function loadStaff(search = "") {
    try {
        const res = await fetch(`${API}/api/staff?search=${encodeURIComponent(search)}`);
        const staff = await res.json();

        const table = document.getElementById("staffTable");
        table.innerHTML = "";

        if (!staff.length) {
            table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">No staff found</td></tr>`;
            return;
        }

        const payrollStaffSelect = document.getElementById("payroll_staff_id");
        if (payrollStaffSelect) {
            payrollStaffSelect.innerHTML = `<option value="">Select Staff</option>`;
            staff.forEach(s => {
                payrollStaffSelect.innerHTML += `<option value="${s.staff_id}">${s.first_name} ${s.last_name}</option>`;
            });
        }

        const reqStaffSelect = document.getElementById("req_staff_id");
        if (reqStaffSelect) {
            reqStaffSelect.innerHTML = `<option value="">Requested By Staff</option>`;
            staff.forEach(s => {
                reqStaffSelect.innerHTML += `<option value="${s.staff_id}">${s.first_name} ${s.last_name}</option>`;
            });
        }

        staff.forEach(s => {
            table.innerHTML += `
                <tr>
                    <td>${s.staff_id}</td>
                    <td>${s.first_name} ${s.last_name}</td>
                    <td>${s.position || "N/A"}</td>
                    <td>${s.tel_number || "N/A"}</td>
                    <td><span class="ward-badge">${s.ward_name || "Unassigned"}</span></td>
                    <td class="actions">
                        <button class="view-btn" onclick="viewStaff(${s.staff_id})">👁️</button>
                        <button class="edit-btn" onclick="editStaff(${s.staff_id})">✏️</button>
                        <button class="delete-btn" onclick="deleteStaff(${s.staff_id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Staff Error:", err);
    }
}

async function saveNewStaff() {
    const first_name = document.getElementById("add_staff_first_name").value.trim();
    const last_name = document.getElementById("add_staff_last_name").value.trim();
    const address = document.getElementById("add_staff_address").value.trim();
    const tel_number = document.getElementById("add_staff_tel_number").value.trim();
    const dob = document.getElementById("add_staff_dob").value;
    const sex = document.getElementById("add_staff_sex").value;
    const nin = document.getElementById("add_staff_nin").value.trim();
    const position = document.getElementById("add_staff_position").value.trim();
    const salary = document.getElementById("add_staff_salary").value;
    const salary_scale = document.getElementById("add_staff_salary_scale").value.trim();
    const ward_id = document.getElementById("add_staff_ward_id").value || null;

    if (!first_name || !last_name || !position) {
        alert("Please fill required staff fields");
        return;
    }

    try {
        const res = await fetch(`${API}/api/staff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                first_name,
                last_name,
                address,
                tel_number,
                dob,
                sex,
                nin,
                position,
                salary,
                salary_scale,
                ward_id
            })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to add staff");
            return;
        }

        closeAddStaffForm();
        clearAddStaffForm();
        loadStaff(document.getElementById("staffSearch").value);
        loadDashboard();
    } catch (err) {
        console.error("Add Staff Error:", err);
    }
}

async function viewStaff(id) {
    try {
        const res = await fetch(`${API}/api/staff/${id}`);
        const staff = await res.json();

        document.getElementById("viewStaffTitle").textContent = `${staff.first_name} ${staff.last_name} - Staff Details`;
        document.getElementById("viewStaffContent").innerHTML = `
            <div class="patient-details">
                <p><strong>Staff ID:</strong> ${staff.staff_id}</p>
                <p><strong>Name:</strong> ${staff.first_name} ${staff.last_name}</p>
                <p><strong>Position:</strong> ${staff.position || "N/A"}</p>
                <p><strong>Assigned Ward:</strong> <span class="ward-badge">${staff.ward_name || "Unassigned"}</span></p>
                <p><strong>Phone:</strong> ${staff.tel_number || "N/A"}</p>
                <p><strong>Address:</strong> ${staff.address || "N/A"}</p>
                <p><strong>DOB:</strong> ${formatDate(staff.dob)}</p>
                <p><strong>Sex:</strong> ${staff.sex || "N/A"}</p>
                <p><strong>NIN:</strong> ${staff.nin || "N/A"}</p>
                <p><strong>Salary:</strong> ${staff.salary ? "₱" + Number(staff.salary).toLocaleString() : "N/A"}</p>
                <p><strong>Salary Scale:</strong> ${staff.salary_scale || "N/A"}</p>

                <h4>Recent Payroll Records</h4>
                ${
                    staff.payroll && staff.payroll.length
                    ? `<ul>${staff.payroll.map(p => `
                        <li>${p.payroll_month}/${p.payroll_year} - Net Salary: ₱${Number(p.net_salary).toLocaleString()}</li>
                    `).join("")}</ul>`
                    : `<p>No payroll records yet</p>`
                }
            </div>
        `;

        document.getElementById("viewStaffModal").style.display = "block";
    } catch (err) {
        console.error("View Staff Error:", err);
    }
}

async function editStaff(id) {
    try {
        const res = await fetch(`${API}/api/staff/${id}`);
        const staff = await res.json();

        document.getElementById("edit_staff_id").value = staff.staff_id;
        document.getElementById("edit_staff_first_name").value = staff.first_name || "";
        document.getElementById("edit_staff_last_name").value = staff.last_name || "";
        document.getElementById("edit_staff_address").value = staff.address || "";
        document.getElementById("edit_staff_tel_number").value = staff.tel_number || "";
        document.getElementById("edit_staff_dob").value = staff.dob ? staff.dob.split("T")[0] : "";
        document.getElementById("edit_staff_sex").value = staff.sex || "";
        document.getElementById("edit_staff_nin").value = staff.nin || "";
        document.getElementById("edit_staff_position").value = staff.position || "";
        document.getElementById("edit_staff_salary").value = staff.salary || "";
        document.getElementById("edit_staff_salary_scale").value = staff.salary_scale || "";
        document.getElementById("edit_staff_ward_id").value = staff.ward_id || "";

        document.getElementById("editStaffModal").style.display = "block";
    } catch (err) {
        console.error("Edit Staff Error:", err);
    }
}

async function updateStaff() {
    const id = document.getElementById("edit_staff_id").value;

    const payload = {
        first_name: document.getElementById("edit_staff_first_name").value.trim(),
        last_name: document.getElementById("edit_staff_last_name").value.trim(),
        address: document.getElementById("edit_staff_address").value.trim(),
        tel_number: document.getElementById("edit_staff_tel_number").value.trim(),
        dob: document.getElementById("edit_staff_dob").value,
        sex: document.getElementById("edit_staff_sex").value,
        nin: document.getElementById("edit_staff_nin").value.trim(),
        position: document.getElementById("edit_staff_position").value.trim(),
        salary: document.getElementById("edit_staff_salary").value,
        salary_scale: document.getElementById("edit_staff_salary_scale").value.trim(),
        ward_id: document.getElementById("edit_staff_ward_id").value || null
    };

    if (!payload.first_name || !payload.last_name || !payload.position) {
        alert("Please fill required fields");
        return;
    }

    try {
        const res = await fetch(`${API}/api/staff/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to update staff");
            return;
        }

        closeEditStaffForm();
        loadStaff(document.getElementById("staffSearch").value);
    } catch (err) {
        console.error("Update Staff Error:", err);
    }
}

async function deleteStaff(id) {
    if (!confirm("Delete this staff?")) return;

    try {
        const res = await fetch(`${API}/api/staff/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to delete staff");
            return;
        }

        loadStaff(document.getElementById("staffSearch").value);
        loadDashboard();
    } catch (err) {
        console.error("Delete Staff Error:", err);
    }
}

/* =========================
   REPORTS
========================= */
async function loadStaffByWard() {
    try {
        const res = await fetch(`${API}/api/staff-by-ward`);
        const data = await res.json();

        const report = document.getElementById("reportContent");
        report.innerHTML = `
            <h3>Staff by Ward Report</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ward</th>
                            <th>Staff Count</th>
                            <th>Staff List</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                <td>${row.ward_name}</td>
                                <td>${row.staff_count}</td>
                                <td>${row.staff_list || "No staff assigned"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        console.error("Staff Report Error:", err);
    }
}

async function loadPatientsByWard() {
    try {
        const res = await fetch(`${API}/api/patients-by-ward`);
        const data = await res.json();

        const wardsReport = document.getElementById("wardsReport");
        wardsReport.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ward</th>
                            <th>Patient Count</th>
                            <th>Patient List</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                <td>${row.ward_name}</td>
                                <td>${row.patient_count}</td>
                                <td>${row.patient_list || "No patients admitted"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        console.error("Ward Report Error:", err);
    }
}

async function loadOutpatients() {
    try {
        const res = await fetch(`${API}/api/outpatients`);
        const outpatients = await res.json();

        const report = document.getElementById("reportContent");
        report.innerHTML = `
            <h3>Outpatients Report</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Date Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outpatients.length ? outpatients.map(p => `
                            <tr>
                                <td>${p.patient_id}</td>
                                <td>${p.patient_name}</td>
                                <td>${p.sex || "N/A"}</td>
                                <td>${p.tel_no || "N/A"}</td>
                                <td>${p.address || "N/A"}</td>
                                <td>${formatDate(p.date_registered)}</td>
                            </tr>
                        `).join("") : `
                            <tr><td colspan="6" style="text-align:center;padding:20px;">No outpatients found</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        console.error("Outpatients Error:", err);
    }
}

function loadWardReport() {
    loadPatientsByWard();
}
function loadStaffReport() {
    loadStaffByWard();
}

/* =========================
   APPOINTMENTS
========================= */
async function loadAppointmentFormOptions() {
    try {
        const res = await fetch(`${API}/api/appointment-form-options`);
        const data = await res.json();

        const patientSelect = document.getElementById("appt_patient_id");
        const doctorSelect = document.getElementById("appt_doctor_id");

        if (patientSelect) {
            patientSelect.innerHTML = `<option value="">Select Patient</option>`;
            data.patients.forEach(p => {
                patientSelect.innerHTML += `<option value="${p.patient_id}">${p.patient_name}</option>`;
            });
        }

        if (doctorSelect) {
            doctorSelect.innerHTML = `<option value="">Select Doctor</option>`;
            data.doctors.forEach(d => {
                doctorSelect.innerHTML += `<option value="${d.doctor_id}">${d.full_name}</option>`;
            });
        }
    } catch (err) {
        console.error("Appointment Options Error:", err);
    }
}

async function saveAppointment() {
    const patient_id = document.getElementById("appt_patient_id").value;
    const doctor_id = document.getElementById("appt_doctor_id").value;
    const date_time = document.getElementById("appt_date_time").value;

    if (!patient_id || !doctor_id || !date_time) {
        alert("Please fill all appointment fields");
        return;
    }

    try {
        const res = await fetch(`${API}/api/appointments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patient_id, doctor_id, date_time })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to save appointment");
            return;
        }

        document.getElementById("appt_patient_id").value = "";
        document.getElementById("appt_doctor_id").value = "";
        document.getElementById("appt_date_time").value = "";

        loadUpcomingAppointments();
        loadDoctors(document.getElementById("doctorSearch").value);
        alert("Appointment scheduled successfully");
    } catch (err) {
        console.error("Save Appointment Error:", err);
    }
}

async function loadUpcomingAppointments() {
    try {
        const res = await fetch(`${API}/api/upcoming-appointments`);
        const appointments = await res.json();

        const container = document.getElementById("upcomingAppointments");
        container.innerHTML = "";

        if (!appointments.length) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No upcoming appointments</div>';
            return;
        }

        appointments.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-item">
                    <div class="apt-patient">${apt.patient}</div>
                    <div class="apt-details">
                        <div class="apt-doctor">${apt.doctor || "N/A"}</div>
                        <div class="apt-time">${apt.time || "N/A"}</div>
                    </div>
                    <div class="apt-date">${apt.date || "N/A"}</div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Appointments Error:", err);
    }
}

/* =========================
   RECENT ACTIVITIES
========================= */
async function loadRecentActivities() {
    try {
        const res = await fetch(`${API}/api/recent-activities`);
        const activities = await res.json();

        const container = document.getElementById("recentActivities");
        container.innerHTML = "";

        if (!activities.length) {
            container.innerHTML = `<div style="text-align:center;padding:20px;color:#64748b;">No recent activities</div>`;
            return;
        }

        activities.forEach(activity => {
            const icon = activity.type === "admit" ? "👤" : "📋";
            container.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-message">${activity.message}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Activities Error:", err);
        document.getElementById("recentActivities").innerHTML =
            '<div style="text-align:center;padding:20px;color:#64748b;">No recent activities</div>';
    }
}

/* =========================
   REQUISITIONS / DRUG TRANSACTIONS
========================= */
async function saveRequisition() {
    const ward_id = document.getElementById("req_ward_id").value || null;
    const staff_id = document.getElementById("req_staff_id").value || null;
    const drug_id = document.getElementById("req_drug_id").value;
    const quantity_requested = document.getElementById("req_quantity").value;
    const notes = document.getElementById("req_notes").value.trim();

    if (!drug_id || !quantity_requested) {
        alert("Drug and quantity are required");
        return;
    }

    try {
        const res = await fetch(`${API}/api/requisitions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ward_id, staff_id, drug_id, quantity_requested, notes })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to submit requisition");
            return;
        }

        loadRequisitions();
        document.getElementById("req_quantity").value = "";
        document.getElementById("req_notes").value = "";
        alert("Medication requisition submitted");
    } catch (err) {
        console.error("Requisition Error:", err);
    }
}

async function loadRequisitions() {
    try {
        const res = await fetch(`${API}/api/requisitions`);
        const rows = await res.json();

        const container = document.getElementById("requisitionTable");
        if (!container) return;

        container.innerHTML = rows.length ? rows.map(r => `
            <tr>
                <td>${r.requisition_id}</td>
                <td>${r.drug_name}</td>
                <td>${r.ward_name}</td>
                <td>${r.requested_by || "N/A"}</td>
                <td>${r.quantity_requested}</td>
                <td>${r.status}</td>
                <td>${formatDateTime(r.request_date)}</td>
            </tr>
        `).join("") : `<tr><td colspan="7" style="text-align:center;padding:20px;">No requisitions yet</td></tr>`;
    } catch (err) {
        console.error("Load Requisitions Error:", err);
    }
}

/* =========================
   PAYROLL
========================= */
async function calculatePayroll() {
    const staff_id = document.getElementById("payroll_staff_id").value;
    const payroll_month = document.getElementById("payroll_month").value;
    const payroll_year = document.getElementById("payroll_year").value;
    const overtime_hours = document.getElementById("overtime_hours").value || 0;
    const allowances = document.getElementById("allowances").value || 0;
    const late_minutes = document.getElementById("late_minutes").value || 0;
    const cash_advance = document.getElementById("cash_advance").value || 0;

    if (!staff_id || !payroll_month || !payroll_year) {
        alert("Please fill payroll staff, month and year");
        return;
    }

    try {
        const res = await fetch(`${API}/api/payroll/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staff_id,
                payroll_month,
                payroll_year,
                overtime_hours,
                allowances,
                late_minutes,
                cash_advance
            })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to calculate payroll");
            return;
        }

        latestPayroll = data;

        document.getElementById("payrollResult").innerHTML = `
            <div class="table-container">
                <table>
                    <tbody>
                        <tr><th>Staff</th><td>${data.staff_name}</td></tr>
                        <tr><th>Position</th><td>${data.position || "N/A"}</td></tr>
                        <tr><th>Basic Salary</th><td>₱${Number(data.basic_salary).toLocaleString()}</td></tr>
                        <tr><th>Hourly Rate</th><td>₱${Number(data.hourly_rate).toLocaleString()}</td></tr>
                        <tr><th>Overtime Pay</th><td>₱${Number(data.overtime_pay).toLocaleString()}</td></tr>
                        <tr><th>Allowances</th><td>₱${Number(data.allowances).toLocaleString()}</td></tr>
                        <tr><th>SSS</th><td>₱${Number(data.sss).toLocaleString()}</td></tr>
                        <tr><th>PhilHealth</th><td>₱${Number(data.philhealth).toLocaleString()}</td></tr>
                        <tr><th>Pag-IBIG</th><td>₱${Number(data.pagibig).toLocaleString()}</td></tr>
                        <tr><th>Tax</th><td>₱${Number(data.tax).toLocaleString()}</td></tr>
                        <tr><th>Cash Advance</th><td>₱${Number(data.cash_advance).toLocaleString()}</td></tr>
                        <tr><th>Late Deduction</th><td>₱${Number(data.late_deduction).toLocaleString()}</td></tr>
                        <tr><th>Gross Salary</th><td>₱${Number(data.gross_salary).toLocaleString()}</td></tr>
                        <tr><th>Total Deductions</th><td>₱${Number(data.total_deductions).toLocaleString()}</td></tr>
                        <tr><th>Net Salary</th><td><strong>₱${Number(data.net_salary).toLocaleString()}</strong></td></tr>
                    </tbody>
                </table>
            </div>
            <button class="save-btn" onclick="savePayroll()">Save Payroll</button>
        `;
    } catch (err) {
        console.error("Calculate Payroll Error:", err);
    }
}

async function savePayroll() {
    if (!latestPayroll) {
        alert("Calculate payroll first");
        return;
    }

    try {
        const res = await fetch(`${API}/api/payroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(latestPayroll)
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Failed to save payroll");
            return;
        }

        alert("Payroll saved successfully");
        loadPayrollHistory();
    } catch (err) {
        console.error("Save Payroll Error:", err);
    }
}

async function loadPayrollHistory() {
    try {
        const res = await fetch(`${API}/api/payroll`);
        const rows = await res.json();

        const tbody = document.getElementById("payrollHistory");
        if (!tbody) return;

        tbody.innerHTML = rows.length ? rows.map(r => `
            <tr>
                <td>${r.staff_name}</td>
                <td>${r.position || "N/A"}</td>
                <td>${r.payroll_month}/${r.payroll_year}</td>
                <td>₱${Number(r.gross_salary).toLocaleString()}</td>
                <td>₱${Number(r.total_deductions).toLocaleString()}</td>
                <td>₱${Number(r.net_salary).toLocaleString()}</td>
            </tr>
        `).join("") : `<tr><td colspan="6" style="text-align:center;padding:20px;">No payroll history yet</td></tr>`;
    } catch (err) {
        console.error("Load Payroll History Error:", err);
    }
}

/* =========================
   NAVBAR
========================= */
function initNavbar() {
    const sections = document.querySelectorAll("section");
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const target = link.getAttribute("href").replace("#", "");

            sections.forEach(sec => {
                sec.style.display = sec.id === target ? "block" : "none";
            });
        });
    });
}

/* =========================
   MODALS
========================= */
function openAddForm() { document.getElementById("addModal").style.display = "block"; }
function closeAddForm() { document.getElementById("addModal").style.display = "none"; }
function closeViewForm() { document.getElementById("viewModal").style.display = "none"; }
function closeEditForm() { document.getElementById("editModal").style.display = "none"; }

function openAddStaffForm() { document.getElementById("addStaffModal").style.display = "block"; }
function closeAddStaffForm() { document.getElementById("addStaffModal").style.display = "none"; }
function closeViewStaffForm() { document.getElementById("viewStaffModal").style.display = "none"; }
function closeEditStaffForm() { document.getElementById("editStaffModal").style.display = "none"; }

function closeViewDoctorModal() { document.getElementById("viewDoctorModal").style.display = "none"; }
function closeAssignDoctorModal() { document.getElementById("assignDoctorModal").style.display = "none"; }

function clearAddStaffForm() {
    document.getElementById("add_staff_first_name").value = "";
    document.getElementById("add_staff_last_name").value = "";
    document.getElementById("add_staff_address").value = "";
    document.getElementById("add_staff_tel_number").value = "";
    document.getElementById("add_staff_dob").value = "";
    document.getElementById("add_staff_sex").value = "";
    document.getElementById("add_staff_nin").value = "";
    document.getElementById("add_staff_position").value = "";
    document.getElementById("add_staff_salary").value = "";
    document.getElementById("add_staff_salary_scale").value = "";
    document.getElementById("add_staff_ward_id").value = "";
}

window.onclick = function(event) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
};

/* =========================
   HELPERS
========================= */
function formatDate(dateString) {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString();
}

function escapeQuotes(str) {
    return String(str).replace(/'/g, "\\'");
}

/* =========================
   INIT
========================= */
window.onload = () => {
    loadDashboard();
    loadAllDoctorsToSelects();
    loadWardsToSelects();
    loadDrugsToSelects();

    loadPatients();
    loadDoctors();
    loadStaff();

    loadRequisitions();
    loadPayrollHistory();

    initNavbar();

    document.querySelectorAll("section").forEach(sec => {
        sec.style.display = sec.id === "dashboard" ? "block" : "none";
    });

    const patientSearch = document.getElementById("search");
    if (patientSearch) {
        patientSearch.addEventListener("keyup", function() {
            loadPatients(this.value);
        });
    }

    const doctorSearch = document.getElementById("doctorSearch");
    if (doctorSearch) {
        doctorSearch.addEventListener("keyup", function() {
            loadDoctors(this.value);
        });
    }

    const staffSearch = document.getElementById("staffSearch");
    if (staffSearch) {
        staffSearch.addEventListener("keyup", function() {
            loadStaff(this.value);
        });
    }
};