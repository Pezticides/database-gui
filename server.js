const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function getNextId(table, idField) {
    const rows = await query(`SELECT COALESCE(MAX(${idField}), 0) + 1 AS nextId FROM ${table}`);
    return rows[0].nextId;
}

/* =========================
   DASHBOARD
========================= */
app.get("/api/dashboard", async (req, res) => {
    try {
        const patients = await query("SELECT COUNT(*) AS total FROM Patient");
        const doctors = await query("SELECT COUNT(*) AS total FROM Local_Doctor");
        const wards = await query("SELECT COUNT(*) AS total FROM Ward");
        const beds = await query("SELECT COUNT(*) AS total FROM In_Patient");
        const staff = await query("SELECT COUNT(*) AS total FROM Staff");

        res.json({
            patients: patients[0].total,
            doctors: doctors[0].total,
            wards: wards[0].total,
            beds: beds[0].total,
            staff: staff[0].total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   DOCTORS
========================= */
app.get("/api/doctors", async (req, res) => {
    try {
        const search = req.query.search || "";
        const value = `%${search}%`;

        const sql = `
            SELECT 
                d.doctor_id,
                d.full_name,
                d.clinic_number,
                d.staff_id,
                s.position,
                s.tel_number,
                COALESCE(w.ward_name, 'Unassigned') AS ward_name,
                COUNT(DISTINCT pd.patient_id) AS total_patients
            FROM Local_Doctor d
            LEFT JOIN Staff s ON d.staff_id = s.staff_id
            LEFT JOIN Staff_Allocation sa ON s.staff_id = sa.staff_id
            LEFT JOIN Ward w ON sa.ward_id = w.ward_id
            LEFT JOIN Patient_Doctor pd ON d.doctor_id = pd.doctor_id
            WHERE d.full_name LIKE ?
               OR d.clinic_number LIKE ?
               OR COALESCE(s.position, '') LIKE ?
               OR COALESCE(w.ward_name, '') LIKE ?
            GROUP BY d.doctor_id, d.full_name, d.clinic_number, d.staff_id, s.position, s.tel_number, w.ward_name
            ORDER BY d.doctor_id ASC
        `;

        const results = await query(sql, [value, value, value, value]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/doctors/:id", async (req, res) => {
    try {
        const doctorRows = await query(`
            SELECT 
                d.doctor_id,
                d.full_name,
                d.clinic_number,
                d.staff_id,
                s.first_name AS staff_first_name,
                s.last_name AS staff_last_name,
                s.position,
                s.tel_number,
                s.address,
                s.salary,
                s.salary_scale,
                COALESCE(w.ward_name, 'Unassigned') AS ward_name
            FROM Local_Doctor d
            LEFT JOIN Staff s ON d.staff_id = s.staff_id
            LEFT JOIN Staff_Allocation sa ON s.staff_id = sa.staff_id
            LEFT JOIN Ward w ON sa.ward_id = w.ward_id
            WHERE d.doctor_id = ?
        `, [req.params.id]);

        if (!doctorRows.length) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const patients = await query(`
            SELECT 
                p.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                p.sex,
                p.tel_no,
                p.date_registered
            FROM Patient_Doctor pd
            JOIN Patient p ON pd.patient_id = p.patient_id
            WHERE pd.doctor_id = ?
            ORDER BY p.patient_id ASC
        `, [req.params.id]);

        const appointments = await query(`
            SELECT 
                a.appointment_id,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                DATE_FORMAT(a.date_time, '%Y-%m-%d %h:%i %p') AS schedule
            FROM Appointment a
            JOIN Patient p ON a.patient_id = p.patient_id
            JOIN Local_Doctor d ON a.staff_id = d.staff_id
            WHERE d.doctor_id = ?
            ORDER BY a.date_time ASC
            LIMIT 10
        `, [req.params.id]);

        res.json({
            ...doctorRows[0],
            patients,
            appointments
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/doctors/:id/assign-patient", async (req, res) => {
    try {
        const doctor_id = req.params.id;
        const { patient_id } = req.body;

        if (!patient_id) {
            return res.status(400).json({ error: "patient_id is required" });
        }

        await query("DELETE FROM Patient_Doctor WHERE patient_id = ?", [patient_id]);
        await query("INSERT INTO Patient_Doctor (patient_id, doctor_id) VALUES (?, ?)", [patient_id, doctor_id]);

        res.json({ message: "Patient assigned to doctor successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/doctors/:id", async (req, res) => {
    try {
        const doctor_id = req.params.id;

        await query("UPDATE Patient_Doctor SET doctor_id = NULL WHERE doctor_id = ?", [doctor_id]).catch(() => {});
        await query("DELETE FROM Patient_Doctor WHERE doctor_id = ?", [doctor_id]).catch(() => {});
        await query("DELETE FROM Local_Doctor WHERE doctor_id = ?", [doctor_id]);

        res.json({ message: "Doctor deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   WARDS
========================= */
app.get("/api/wards", async (req, res) => {
    try {
        const rows = await query(`
            SELECT ward_id, ward_name, location, total_beds, tel_extension
            FROM Ward
            ORDER BY ward_id ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   PATIENTS
========================= */
app.get("/api/patients", async (req, res) => {
    try {
        const search = req.query.search || "";
        let sql = `
            SELECT 
                p.patient_id,
                p.first_name,
                p.last_name,
                p.dob,
                p.sex,
                p.address,
                p.tel_no,
                p.marital_status,
                p.date_registered,
                pd.doctor_id,
                d.full_name AS doctor_name
            FROM Patient p
            LEFT JOIN Patient_Doctor pd ON p.patient_id = pd.patient_id
            LEFT JOIN Local_Doctor d ON pd.doctor_id = d.doctor_id
        `;
        let params = [];

        if (search) {
            const value = `%${search}%`;
            sql += `
                WHERE p.first_name LIKE ?
                   OR p.last_name LIKE ?
                   OR p.tel_no LIKE ?
                   OR p.address LIKE ?
                   OR p.sex LIKE ?
                   OR p.marital_status LIKE ?
                   OR d.full_name LIKE ?
            `;
            params = [value, value, value, value, value, value, value];
        }

        sql += " ORDER BY p.patient_id ASC";

        const rows = await query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/patients/:id", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                p.patient_id,
                p.first_name,
                p.last_name,
                p.dob,
                p.sex,
                p.address,
                p.tel_no,
                p.marital_status,
                p.date_registered,
                pd.doctor_id,
                d.full_name AS doctor_name,
                d.clinic_number
            FROM Patient p
            LEFT JOIN Patient_Doctor pd ON p.patient_id = pd.patient_id
            LEFT JOIN Local_Doctor d ON pd.doctor_id = d.doctor_id
            WHERE p.patient_id = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/patients", async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            address,
            phone,
            dob,
            sex,
            marital_status,
            doctor_id
        } = req.body;

        const nextId = await getNextId("Patient", "patient_id");

        await query(`
            INSERT INTO Patient
            (patient_id, first_name, last_name, dob, sex, address, tel_no, marital_status, date_registered)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `, [
            nextId,
            first_name,
            last_name,
            dob || null,
            sex || null,
            address || null,
            phone || null,
            marital_status || null
        ]);

        if (doctor_id) {
            await query(`INSERT INTO Patient_Doctor (patient_id, doctor_id) VALUES (?, ?)`, [nextId, doctor_id]);
        }

        res.json({ message: "Patient added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/patients/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const {
            first_name,
            last_name,
            address,
            phone,
            dob,
            sex,
            marital_status,
            doctor_id
        } = req.body;

        await query(`
            UPDATE Patient
            SET first_name = ?,
                last_name = ?,
                dob = ?,
                sex = ?,
                address = ?,
                tel_no = ?,
                marital_status = ?
            WHERE patient_id = ?
        `, [
            first_name,
            last_name,
            dob || null,
            sex || null,
            address || null,
            phone || null,
            marital_status || null,
            id
        ]);

        await query("DELETE FROM Patient_Doctor WHERE patient_id = ?", [id]);

        if (doctor_id) {
            await query("INSERT INTO Patient_Doctor (patient_id, doctor_id) VALUES (?, ?)", [id, doctor_id]);
        }

        res.json({ message: "Patient updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/patients/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await query("DELETE FROM Patient_Doctor WHERE patient_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Patient_Medication WHERE patient_id = ?", [id]).catch(() => {});
        await query("DELETE FROM In_Patient WHERE patient_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Next_of_Kin WHERE patient_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Appointment WHERE patient_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Patient WHERE patient_id = ?", [id]);

        res.json({ message: "Patient deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   PATIENT MEDICATIONS
========================= */
app.get("/api/patients/:id/medications", async (req, res) => {
    try {
        const rows = await query(`
            SELECT
                pm.medication_id,
                d.drug_name,
                d.generic_name,
                d.category,
                pm.dosage,
                pm.frequency,
                pm.route,
                pm.start_date,
                pm.end_date,
                pm.status,
                pm.notes,
                ld.full_name AS doctor_name
            FROM Patient_Medication pm
            JOIN Drug d ON pm.drug_id = d.drug_id
            LEFT JOIN Local_Doctor ld ON pm.prescribed_by_doctor_id = ld.doctor_id
            WHERE pm.patient_id = ?
            ORDER BY pm.medication_id DESC
        `, [req.params.id]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/patients/:id/medications", async (req, res) => {
    try {
        const patient_id = req.params.id;
        const {
            drug_id,
            prescribed_by_doctor_id,
            dosage,
            frequency,
            route,
            start_date,
            end_date,
            status,
            notes
        } = req.body;

        const nextId = await getNextId("Patient_Medication", "medication_id");

        await query(`
            INSERT INTO Patient_Medication
            (medication_id, patient_id, drug_id, prescribed_by_doctor_id, dosage, frequency, route, start_date, end_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            patient_id,
            drug_id,
            prescribed_by_doctor_id || null,
            dosage || null,
            frequency || null,
            route || null,
            start_date || null,
            end_date || null,
            status || "Active",
            notes || null
        ]);

        res.json({ message: "Medication prescribed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   DRUGS
========================= */
app.get("/api/drugs", async (req, res) => {
    try {
        const search = req.query.search || "";
        const value = `%${search}%`;

        const rows = await query(`
            SELECT *
            FROM Drug
            WHERE drug_name LIKE ?
               OR generic_name LIKE ?
               OR category LIKE ?
            ORDER BY drug_name ASC
        `, [value, value, value]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   STAFF
========================= */
app.get("/api/staff", async (req, res) => {
    try {
        const search = req.query.search || "";
        const value = `%${search}%`;

        const rows = await query(`
            SELECT 
                s.staff_id,
                s.first_name,
                s.last_name,
                s.address,
                s.tel_number,
                s.dob,
                s.sex,
                s.nin,
                s.position,
                s.salary,
                s.salary_scale,
                COALESCE(w.ward_name, 'Unassigned') AS ward_name,
                sa.ward_id
            FROM Staff s
            LEFT JOIN Staff_Allocation sa ON s.staff_id = sa.staff_id
            LEFT JOIN Ward w ON sa.ward_id = w.ward_id
            WHERE s.first_name LIKE ?
               OR s.last_name LIKE ?
               OR s.position LIKE ?
               OR COALESCE(w.ward_name, '') LIKE ?
            ORDER BY s.staff_id ASC
        `, [value, value, value, value]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/staff/:id", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                s.*,
                COALESCE(w.ward_name, 'Unassigned') AS ward_name,
                sa.ward_id
            FROM Staff s
            LEFT JOIN Staff_Allocation sa ON s.staff_id = sa.staff_id
            LEFT JOIN Ward w ON sa.ward_id = w.ward_id
            WHERE s.staff_id = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({ error: "Staff not found" });
        }

        const payroll = await query(`
            SELECT *
            FROM Payroll
            WHERE staff_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [req.params.id]);

        res.json({
            ...rows[0],
            payroll
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/staff", async (req, res) => {
    try {
        const {
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
        } = req.body;

        const staff_id = await getNextId("Staff", "staff_id");

        await query(`
            INSERT INTO Staff
            (staff_id, first_name, last_name, address, tel_number, dob, sex, nin, position, salary, salary_scale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            staff_id,
            first_name,
            last_name,
            address || null,
            tel_number || null,
            dob || null,
            sex || null,
            nin || null,
            position,
            salary || 0,
            salary_scale || null
        ]);

        if (ward_id) {
            await query(`
                INSERT INTO Staff_Allocation (staff_id, ward_id)
                VALUES (?, ?)
            `, [staff_id, ward_id]);
        }

        res.json({ message: "Staff added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/staff/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const {
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
        } = req.body;

        await query(`
            UPDATE Staff
            SET first_name = ?,
                last_name = ?,
                address = ?,
                tel_number = ?,
                dob = ?,
                sex = ?,
                nin = ?,
                position = ?,
                salary = ?,
                salary_scale = ?
            WHERE staff_id = ?
        `, [
            first_name,
            last_name,
            address || null,
            tel_number || null,
            dob || null,
            sex || null,
            nin || null,
            position || null,
            salary || 0,
            salary_scale || null,
            id
        ]);

        await query("DELETE FROM Staff_Allocation WHERE staff_id = ?", [id]);
        if (ward_id) {
            await query("INSERT INTO Staff_Allocation (staff_id, ward_id) VALUES (?, ?)", [id, ward_id]);
        }

        res.json({ message: "Staff updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/staff/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await query("DELETE FROM Staff_Allocation WHERE staff_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Payroll WHERE staff_id = ?", [id]).catch(() => {});
        await query("DELETE FROM Staff WHERE staff_id = ?", [id]);

        res.json({ message: "Staff deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   STAFF BY WARD
========================= */
app.get("/api/staff-by-ward", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                w.ward_name,
                COUNT(sa.staff_id) AS staff_count,
                GROUP_CONCAT(
                    CONCAT(s.first_name, ' ', s.last_name, ' (', s.position, ')')
                    ORDER BY s.first_name
                    SEPARATOR ', '
                ) AS staff_list
            FROM Ward w
            LEFT JOIN Staff_Allocation sa ON w.ward_id = sa.ward_id
            LEFT JOIN Staff s ON sa.staff_id = s.staff_id
            GROUP BY w.ward_id, w.ward_name
            ORDER BY w.ward_id ASC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   PATIENTS BY WARD
========================= */
app.get("/api/patients-by-ward", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                w.ward_name,
                COUNT(ip.patient_id) AS patient_count,
                GROUP_CONCAT(
                    CONCAT(p.first_name, ' ', p.last_name)
                    ORDER BY p.first_name
                    SEPARATOR ', '
                ) AS patient_list
            FROM Ward w
            LEFT JOIN In_Patient ip ON w.ward_id = ip.ward_id
            LEFT JOIN Patient p ON ip.patient_id = p.patient_id
            GROUP BY w.ward_id, w.ward_name
            ORDER BY w.ward_id ASC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   OUTPATIENTS
========================= */
app.get("/api/outpatients", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                p.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                p.sex,
                p.tel_no,
                p.address,
                p.date_registered
            FROM Patient p
            LEFT JOIN In_Patient ip ON p.patient_id = ip.patient_id
            WHERE ip.patient_id IS NULL
            ORDER BY p.patient_id ASC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   APPOINTMENTS
========================= */
app.get("/api/appointment-form-options", async (req, res) => {
    try {
        const patients = await query(`
            SELECT patient_id, CONCAT(first_name, ' ', last_name) AS patient_name
            FROM Patient
            ORDER BY first_name, last_name
        `);

        const doctors = await query(`
            SELECT doctor_id, full_name, clinic_number, staff_id
            FROM Local_Doctor
            ORDER BY full_name
        `);

        res.json({ patients, doctors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/appointments", async (req, res) => {
    try {
        const { patient_id, doctor_id, date_time } = req.body;

        if (!patient_id || !doctor_id || !date_time) {
            return res.status(400).json({ error: "patient_id, doctor_id and date_time are required" });
        }

        const doctorRows = await query("SELECT staff_id FROM Local_Doctor WHERE doctor_id = ?", [doctor_id]);

        if (!doctorRows.length || !doctorRows[0].staff_id) {
            return res.status(400).json({ error: "Selected doctor is not linked to a staff record yet" });
        }

        const appointment_id = await getNextId("Appointment", "appointment_id");

        await query(`
            INSERT INTO Appointment (appointment_id, patient_id, staff_id, date_time)
            VALUES (?, ?, ?, ?)
        `, [appointment_id, patient_id, doctorRows[0].staff_id, date_time]);

        res.json({ message: "Appointment scheduled successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/upcoming-appointments", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                CONCAT(p.first_name, ' ', p.last_name) AS patient,
                ld.full_name AS doctor,
                DATE_FORMAT(a.date_time, '%h:%i %p') AS time,
                CASE
                    WHEN DATE(a.date_time) = CURDATE() THEN 'Today'
                    WHEN DATE(a.date_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Tomorrow'
                    ELSE DATE_FORMAT(a.date_time, '%Y-%m-%d')
                END AS date
            FROM Appointment a
            JOIN Patient p ON a.patient_id = p.patient_id
            LEFT JOIN Local_Doctor ld ON a.staff_id = ld.staff_id
            WHERE a.date_time >= NOW()
            ORDER BY a.date_time ASC
            LIMIT 5
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   RECENT ACTIVITIES
========================= */
app.get("/api/recent-activities", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                CONCAT('New patient registered: ', first_name, ' ', last_name) AS activity_type,
                TIMESTAMPDIFF(MINUTE, TIMESTAMP(date_registered), NOW()) AS minutes_ago
            FROM Patient
            WHERE date_registered >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY date_registered DESC
            LIMIT 5
        `);

        const formatted = rows.map(row => ({
            type: "admit",
            message: row.activity_type,
            time: formatTimeAgo(row.minutes_ago)
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   MEDICATION REQUISITIONS
========================= */
app.get("/api/requisitions", async (req, res) => {
    try {
        const rows = await query(`
            SELECT
                mr.requisition_id,
                mr.request_date,
                mr.quantity_requested,
                mr.quantity_approved,
                mr.status,
                mr.notes,
                d.drug_name,
                COALESCE(w.ward_name, 'N/A') AS ward_name,
                CONCAT(s.first_name, ' ', s.last_name) AS requested_by
            FROM Medication_Requisition mr
            JOIN Drug d ON mr.drug_id = d.drug_id
            LEFT JOIN Ward w ON mr.ward_id = w.ward_id
            LEFT JOIN Staff s ON mr.staff_id = s.staff_id
            ORDER BY mr.request_date DESC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/requisitions", async (req, res) => {
    try {
        const { ward_id, staff_id, drug_id, quantity_requested, notes } = req.body;

        const requisition_id = await getNextId("Medication_Requisition", "requisition_id");

        await query(`
            INSERT INTO Medication_Requisition
            (requisition_id, ward_id, staff_id, drug_id, quantity_requested, status, notes)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?)
        `, [
            requisition_id,
            ward_id || null,
            staff_id || null,
            drug_id,
            quantity_requested,
            notes || null
        ]);

        res.json({ message: "Requisition submitted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   PAYROLL / TRANSACTIONS
========================= */
app.get("/api/payroll", async (req, res) => {
    try {
        const rows = await query(`
            SELECT 
                p.*,
                CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
                s.position
            FROM Payroll p
            JOIN Staff s ON p.staff_id = s.staff_id
            ORDER BY p.created_at DESC
        `);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/payroll/calculate", async (req, res) => {
    try {
        const {
            staff_id,
            payroll_month,
            payroll_year,
            overtime_hours = 0,
            allowances = 0,
            late_minutes = 0,
            cash_advance = 0
        } = req.body;

        const staffRows = await query("SELECT * FROM Staff WHERE staff_id = ?", [staff_id]);

        if (!staffRows.length) {
            return res.status(404).json({ error: "Staff not found" });
        }

        const staff = staffRows[0];
        const basic_salary = Number(staff.salary || 0);

        const hourly_rate = basic_salary / 22 / 8;
        const overtime_pay = Number(overtime_hours) * hourly_rate * 1.5;

        const sss = basic_salary * 0.045;
        const philhealth = basic_salary * 0.025;
        const pagibig = Math.min(basic_salary * 0.02, 100);
        const tax = basic_salary > 30000 ? basic_salary * 0.10 : basic_salary * 0.03;
        const late_deduction = (Number(late_minutes) / 60) * hourly_rate;

        const gross_salary = basic_salary + Number(allowances) + overtime_pay;
        const total_deductions = sss + philhealth + pagibig + tax + Number(cash_advance) + late_deduction;
        const net_salary = gross_salary - total_deductions;

        res.json({
            staff_id,
            staff_name: `${staff.first_name} ${staff.last_name}`,
            position: staff.position,
            payroll_month,
            payroll_year,
            basic_salary: round2(basic_salary),
            hourly_rate: round2(hourly_rate),
            overtime_hours: Number(overtime_hours),
            overtime_pay: round2(overtime_pay),
            allowances: round2(Number(allowances)),
            sss: round2(sss),
            philhealth: round2(philhealth),
            pagibig: round2(pagibig),
            tax: round2(tax),
            cash_advance: round2(Number(cash_advance)),
            late_minutes: Number(late_minutes),
            late_deduction: round2(late_deduction),
            gross_salary: round2(gross_salary),
            total_deductions: round2(total_deductions),
            net_salary: round2(net_salary)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/payroll", async (req, res) => {
    try {
        const nextId = await getNextId("Payroll", "payroll_id");

        const {
            staff_id,
            payroll_month,
            payroll_year,
            basic_salary,
            hourly_rate,
            overtime_hours,
            overtime_pay,
            allowances,
            sss,
            philhealth,
            pagibig,
            tax,
            cash_advance,
            late_minutes,
            late_deduction,
            gross_salary,
            total_deductions,
            net_salary
        } = req.body;

        await query(`
            INSERT INTO Payroll
            (payroll_id, staff_id, payroll_month, payroll_year, basic_salary, hourly_rate, overtime_hours, overtime_pay,
             allowances, sss, philhealth, pagibig, tax, cash_advance, late_minutes, late_deduction,
             gross_salary, total_deductions, net_salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            staff_id,
            payroll_month,
            payroll_year,
            basic_salary,
            hourly_rate,
            overtime_hours,
            overtime_pay,
            allowances,
            sss,
            philhealth,
            pagibig,
            tax,
            cash_advance,
            late_minutes,
            late_deduction,
            gross_salary,
            total_deductions,
            net_salary
        ]);

        res.json({ message: "Payroll saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   HELPERS
========================= */
function formatTimeAgo(minutes) {
    if (minutes === null || minutes === undefined) return "Unknown";
    if (minutes < 60) return `${minutes} minute(s) ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hour(s) ago`;
    return `${Math.floor(minutes / 1440)} day(s) ago`;
}

function round2(num) {
    return Number(Number(num).toFixed(2));
}

/* =========================
   SERVER
========================= */
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});