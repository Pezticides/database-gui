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