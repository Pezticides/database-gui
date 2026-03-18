// server.js - CLEAN & PERFECT
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ------------------- DASHBOARD -------------------
app.get("/api/dashboard", async (req, res) => {
    const queries = {
        patients: "SELECT COUNT(*) AS total FROM patient",
        doctors: "SELECT COUNT(*) AS total FROM local_doctor",
        wards: "SELECT COUNT(*) AS total FROM ward",
        beds: "SELECT COUNT(*) AS total FROM bed",
        staff: "SELECT COUNT(*) AS total FROM ward_staff"
    };

    try {
        const [patientResult, doctorResult, wardResult, bedResult, staffResult] = await Promise.all([
            new Promise((resolve, reject) => db.query(queries.patients, (err, result) => err ? reject(err) : resolve(result))),
            new Promise((resolve, reject) => db.query(queries.doctors, (err, result) => err ? reject(err) : resolve(result))),
            new Promise((resolve, reject) => db.query(queries.wards, (err, result) => err ? reject(err) : resolve(result))),
            new Promise((resolve, reject) => db.query(queries.beds, (err, result) => err ? reject(err) : resolve(result))),
            new Promise((resolve, reject) => db.query(queries.staff, (err, result) => err ? reject(err) : resolve(result)))
        ]);

        res.json({
            patients: patientResult[0].total,
            doctors: doctorResult[0].total,
            wards: wardResult[0].total,
            beds: bedResult[0].total,
            staff: staffResult[0].total
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ------------------- GET DOCTORS -------------------
app.get("/api/doctors", (req, res) => {
    db.query("SELECT doctor_id, full_name FROM local_doctor ORDER BY full_name", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ------------------- GET PATIENTS LIST (GLOBAL SEARCH) -------------------
app.get("/api/patients", (req, res) => {
    const search = req.query.search || "";
    
    if (search) {
        const sql = `
            SELECT p.*, d.full_name AS doctor_name
            FROM patient p
            LEFT JOIN local_doctor d ON p.doctor_id = d.doctor_id
            WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ?
               OR p.address LIKE ? OR d.full_name LIKE ? OR p.sex LIKE ?
               OR p.marital_status LIKE ?
            ORDER BY p.patient_id ASC
        `;
        const value = `%${search}%`;
        db.query(sql, [value, value, value, value, value, value, value], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    } else {
        const sql = `
            SELECT p.*, d.full_name AS doctor_name
            FROM patient p
            LEFT JOIN local_doctor d ON p.doctor_id = d.doctor_id
            ORDER BY p.patient_id ASC
        `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    }
});

// ------------------- GET SINGLE PATIENT (View/Edit) -------------------
app.get("/api/patients/:id", (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT p.*, d.full_name AS doctor_name, d.clinic_name
        FROM patient p
        LEFT JOIN local_doctor d ON p.doctor_id = d.doctor_id
        WHERE p.patient_id = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ error: "Patient not found" });
        res.json(results[0]);
    });
});

// ------------------- UPDATE PATIENT -------------------
app.put("/api/patients/:id", (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, address, phone, dob, sex, marital_status, doctor_id } = req.body;

    const sql = `
        UPDATE patient 
        SET first_name = ?, last_name = ?, address = ?, phone = ?, dob = ?, 
            sex = ?, marital_status = ?, doctor_id = ?
        WHERE patient_id = ?
    `;
    db.query(sql, [first_name, last_name, address, phone, dob, sex, marital_status, doctor_id || null, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Patient updated successfully" });
    });
});

// ------------------- ADD PATIENT -------------------
app.post("/api/patients", (req, res) => {
    const { first_name, last_name, address, phone, dob, sex, marital_status, doctor_id } = req.body;

    const sql = `
        INSERT INTO patient
        (first_name, last_name, address, phone, dob, sex, marital_status, date_registered, doctor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    db.query(sql, [first_name, last_name, address, phone, dob, sex, marital_status, doctor_id || null], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Patient added successfully" });
    });
});

// ------------------- DELETE PATIENT -------------------
app.delete("/api/patients/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM patient WHERE patient_id = ?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Patient deleted successfully" });
    });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));