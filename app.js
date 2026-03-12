// Base URL of the API server
const API = "http://localhost:3000";

// Function to load all patients from the API and display them
async function loadPatients(){

    // Fetch patient data from the API endpoint
    const res = await fetch(API+"/patients");
    // Parse the JSON response
    const data = await res.json();

    // Start building the HTML content
    let html = "<h2>Patients</h2>";

    // Create table header
    html += "<table>";
    html += "<tr><th>ID</th><th>First</th><th>Last</th><th>Phone</th></tr>";

    // Add a row for each patient
    data.forEach(p=>{
        html += `<tr>
<td>${p.patient_id}</td>
<td>${p.first_name}</td>
<td>${p.last_name}</td>
<td>${p.phone}</td>
</tr>`;
    });

    // Close the table
    html += "</table>";

    // Insert the HTML into the page element with id "content"
    document.getElementById("content").innerHTML = html;

}

// Function to load all doctors from the API and display them
async function loadDoctors(){

    const res = await fetch(API+"/doctors"); // Fetch doctors
    const data = await res.json();           // Parse JSON response

    let html = "<h2>Doctors</h2>";           // Page heading

    html += "<table>";                        // Start table
    html += "<tr><th>ID</th><th>Name</th><th>Clinic</th><th>Phone</th></tr>"; // Table header

    data.forEach(d=>{                         // Add each doctor as a table row
        html += `<tr>
<td>${d.doctor_id}</td>
<td>${d.full_name}</td>
<td>${d.clinic_name}</td>
<td>${d.phone}</td>
</tr>`;
    });

    html += "</table>";                        // Close table
    document.getElementById("content").innerHTML = html; // Display HTML
}

// Function to load all wards from the API and display them
async function loadWards(){

    const res = await fetch(API+"/wards"); // Fetch wards
    const data = await res.json();         // Parse JSON response

    let html = "<h2>Wards</h2>";           // Heading

    html += "<table>";                      // Start table
    html += "<tr><th>ID</th><th>Name</th><th>Location</th><th>Beds</th></tr>"; // Table header

    data.forEach(w=>{                       // Add each ward row
        html += `<tr>
<td>${w.ward_id}</td>
<td>${w.ward_name}</td>
<td>${w.location}</td>
<td>${w.total_beds}</td>
</tr>`;
    });

    html += "</table>";                      // Close table
    document.getElementById("content").innerHTML = html; // Display HTML

}

// Function to load all beds from the API and display them
async function loadBeds(){

    const res = await fetch(API+"/beds"); // Fetch beds
    const data = await res.json();        // Parse JSON response

    let html = "<h2>Beds</h2>";           // Heading

    html += "<table>";                     // Start table
    html += "<tr><th>ID</th><th>Ward</th><th>Bed Number</th></tr>"; // Table header

    data.forEach(b=>{                      // Add each bed row
        html += `<tr>
<td>${b.bed_id}</td>
<td>${b.ward_id}</td>
<td>${b.bed_number}</td>
</tr>`;
    });

    html += "</table>";                     // Close table
    document.getElementById("content").innerHTML = html; // Display HTML

}

// Function to display patient-doctor assignments
async function loadPatientDoctor(){

    const res = await fetch(API+"/patient-doctor"); // Fetch report
    const data = await res.json();                  // Parse JSON

    let html = "<h2>Patient Doctor Report</h2>";    // Heading

    html += "<table>";                              // Start table
    html += "<tr><th>Patient</th><th>Doctor</th></tr>"; // Table header

    data.forEach(r=>{                               // Add each assignment
        html += `<tr>
<td>${r.first_name} ${r.last_name}</td>
<td>${r.doctor}</td>
</tr>`;
    });

    html += "</table>";                             // Close table
    document.getElementById("content").innerHTML = html; // Display HTML

}

// Function to show ward bed counts
async function loadWardBeds(){

    const res = await fetch(API+"/ward-beds"); // Fetch data
    const data = await res.json();             // Parse JSON

    let html = "<h2>Ward Bed Count</h2>";     // Heading

    html += "<table>";                         // Start table
    html += "<tr><th>Ward</th><th>Beds</th></tr>"; // Table header

    data.forEach(w=>{                          // Add each ward count
        html += `<tr>
<td>${w.ward_name}</td>
<td>${w.beds}</td>
</tr>`;
    });

    html += "</table>";                         // Close table
    document.getElementById("content").innerHTML = html; // Display HTML

}

// Function to populate a dropdown with doctors
async function loadDoctorDropdown(){

    const res = await fetch(API+"/doctors"); // Fetch doctors
    const doctors = await res.json();        // Parse JSON

    let select = document.getElementById("doctorSelect"); // Get dropdown element
    let html="";                                        // Initialize options HTML

    doctors.forEach(d=>{                               // Add each doctor as an option
        html += `<option value="${d.doctor_id}">
${d.full_name}
</option>`;
    });

    select.innerHTML = html;                            // Insert options into dropdown

}

// Handle form submission for adding a patient
document.getElementById("patientForm").addEventListener("submit", async function(e){

    e.preventDefault(); // Prevent default form submission

    // Collect patient data from the form
    const patient = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        address: document.getElementById("address").value,
        phone: document.getElementById("phone").value,
        dob: document.getElementById("dob").value,
        sex: document.getElementById("sex").value,
        marital_status: document.getElementById("marital_status").value,
        doctor_id: document.getElementById("doctorSelect").value
    };

    // Send a POST request to add the patient
    const res = await fetch(API+"/patients",{
        method:"POST",                             // HTTP method
        headers:{
            "Content-Type":"application/json"     // JSON content type
        },
        body: JSON.stringify(patient)             // Convert patient object to JSON
    });

    const data = await res.json();                // Parse response
    // Show alert with result message and assigned bed
    alert(data.message + " | Bed Assigned: " + data.bed_assigned);

});

// Serve static files from the "public" directory
app.use(express.static("public"));