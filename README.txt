AFTER DOWNLOADING ALL THE FILES 
HOW TO IMPLEMENT THOSE FILES ON THE DATABASE

const db = require("./db");

db.query("SELECT 1", (err, result) => {
    if (err) {
        console.log(err);
    }

    console.log("database is working");
})

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/patients",(req,res)=>{
    db.query("SELECT * FROM patient",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

app.post("/patients",(req,res)=>{

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

    db.query(
        `INSERT INTO patient
        (first_name,last_name,address,phone,dob,sex,marital_status,date_registered,doctor_id)
        VALUES (?,?,?,?,?,?,?,NOW(),?)`,
        [first_name,last_name,address,phone,dob,sex,marital_status,doctor_id],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Patient added"});
        }
    );

});

app.put("/patients/:id",(req,res)=>{

    const id = req.params.id;
    const {first_name,last_name,phone} = req.body;

    db.query(
        "UPDATE patient SET first_name=?, last_name=?, phone=? WHERE patient_id=?",
        [first_name,last_name,phone,id],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Patient updated"});
        }
    );

});

app.delete("/patients/:id",(req,res)=>{

    const id = req.params.id;

    db.query(
        "DELETE FROM patient WHERE patient_id=?",
        [id],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Patient deleted"});
        }
    );

});

app.get("/doctors",(req,res)=>{
    db.query("SELECT * FROM local_doctor",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

app.post("/doctors",(req,res)=>{

    const {full_name,clinic_name,address,phone} = req.body;

    db.query(
        "INSERT INTO local_doctor(full_name,clinic_name,address,phone) VALUES(?,?,?,?)",
        [full_name,clinic_name,address,phone],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Doctor added"});
        }
    );

});

app.get("/wards",(req,res)=>{
    db.query("SELECT * FROM ward",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

app.get("/beds",(req,res)=>{
    db.query("SELECT * FROM bed",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

app.get("/patient-doctor",(req,res)=>{

    db.query(`
        SELECT
        p.first_name,
        p.last_name,
        d.full_name AS doctor
        FROM patient p
        JOIN local_doctor d
        ON p.doctor_id = d.doctor_id
    `,(err,result)=>{

        if(err) throw err;
        res.json(result);

    });

});

app.get("/ward-beds",(req,res)=>{

    db.query(`
        SELECT
        w.ward_name,
        COUNT(b.bed_id) AS beds
        FROM ward w
        LEFT JOIN bed b
        ON w.ward_id = b.ward_id
        GROUP BY w.ward_name
    `,(err,result)=>{

        if(err) throw err;
        res.json(result);

    });

});

app.listen(3000, ()=>{
    console.log("Wellmeadows server running on port 3000");
});

app.use(express.static("public"));

const API = "http://localhost:3000";

async function loadPatients(){

const res = await fetch(API+"/patients");
const data = await res.json();

let html = "<h2>Patients</h2>";

html += "<table>";
html += "<tr><th>ID</th><th>First</th><th>Last</th><th>Phone</th></tr>";

data.forEach(p=>{
html += `<tr>
<td>${p.patient_id}</td>
<td>${p.first_name}</td>
<td>${p.last_name}</td>
<td>${p.phone}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

async function loadDoctors(){

const res = await fetch(API+"/doctors");
const data = await res.json();

let html = "<h2>Doctors</h2>";

html += "<table>";
html += "<tr><th>ID</th><th>Name</th><th>Clinic</th><th>Phone</th></tr>";

data.forEach(d=>{
html += `<tr>
<td>${d.doctor_id}</td>
<td>${d.full_name}</td>
<td>${d.clinic_name}</td>
<td>${d.phone}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

async function loadWards(){

const res = await fetch(API+"/wards");
const data = await res.json();

let html = "<h2>Wards</h2>";

html += "<table>";
html += "<tr><th>ID</th><th>Name</th><th>Location</th><th>Beds</th></tr>";

data.forEach(w=>{
html += `<tr>
<td>${w.ward_id}</td>
<td>${w.ward_name}</td>
<td>${w.location}</td>
<td>${w.total_beds}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

async function loadBeds(){

const res = await fetch(API+"/beds");
const data = await res.json();

let html = "<h2>Beds</h2>";

html += "<table>";
html += "<tr><th>ID</th><th>Ward</th><th>Bed Number</th></tr>";

data.forEach(b=>{
html += `<tr>
<td>${b.bed_id}</td>
<td>${b.ward_id}</td>
<td>${b.bed_number}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

async function loadPatientDoctor(){

const res = await fetch(API+"/patient-doctor");
const data = await res.json();

let html = "<h2>Patient Doctor Report</h2>";

html += "<table>";
html += "<tr><th>Patient</th><th>Doctor</th></tr>";

data.forEach(r=>{
html += `<tr>
<td>${r.first_name} ${r.last_name}</td>
<td>${r.doctor}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

async function loadWardBeds(){

const res = await fetch(API+"/ward-beds");
const data = await res.json();

let html = "<h2>Ward Bed Count</h2>";

html += "<table>";
html += "<tr><th>Ward</th><th>Beds</th></tr>";

data.forEach(w=>{
html += `<tr>
<td>${w.ward_name}</td>
<td>${w.beds}</td>
</tr>`;
});

html += "</table>";

document.getElementById("content").innerHTML = html;

}

app.use(express.static("public"));


body{
font-family: Arial;
margin: 30px;
background:#f4f6f9;
}

h1{
color:#1e88e5;
}

button{
padding:10px 15px;
margin:5px;
border:none;
background:#1e88e5;
color:white;
cursor:pointer;
border-radius:5px;
}

button:hover{
background:#1565c0;
}

table{
border-collapse: collapse;
width:100%;
margin-top:20px;
background:white;
}

th,td{
padding:10px;
border:1px solid #ccc;
}

th{
background:#1e88e5;
color:white;
}


<!DOCTYPE html>
<html>
<head>
<title>Wellmeadows Hospital System</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<h1>Wellmeadows Hospital Management System</h1>

<div class="menu">

<button onclick="loadPatients()">Patients</button>
<button onclick="loadDoctors()">Doctors</button>
<button onclick="loadWards()">Wards</button>
<button onclick="loadBeds()">Beds</button>
<button onclick="loadPatientDoctor()">Patient + Doctor</button>
<button onclick="loadWardBeds()">Ward Bed Count</button>

</div>

<hr>

<div id="content"></div>

<script src="app.js"></script>

</body>
</html>

