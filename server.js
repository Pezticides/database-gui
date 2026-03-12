// Import the database connection module
const db = require("./db");

// Import Express framework to handle HTTP requests
const express = require("express");

// Import CORS middleware to allow cross-origin requests
const cors = require("cors");

// Initialize the Express application
const app = express();

// Enable CORS so that frontend apps from different origins can access this API
app.use(cors());

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Serve static files (like HTML, CSS, JS) from the root directory
app.use(express.static(".")); 

// GET endpoint to fetch all patients
app.get("/patients",(req,res)=>{
    // Query the database for all patient records
    db.query("SELECT * FROM patient",(err,result)=>{
        if(err) throw err; // Throw error if query fails
        res.json(result);  // Send the query result as JSON
    });
});

// POST endpoint to admit a new patient
app.post("/patients",(req,res)=>{

    // Destructure patient info from the request body
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

    // Find the first available bed that is not assigned to any patient
    db.query(`
        SELECT bed_id FROM bed
        WHERE bed_id NOT IN (SELECT bed_id FROM patient WHERE bed_id IS NOT NULL)
        LIMIT 1
    `,(err,bedResult)=>{

        if(err) throw err;

        // If no bed is available, return a message
        if(bedResult.length === 0){
            return res.json({message:"No beds available"});
        }

        // Assign the first available bed
        const bed_id = bedResult[0].bed_id;

        // Insert the new patient into the database with the assigned bed
        db.query(
        `INSERT INTO patient
        (first_name,last_name,address,phone,dob,sex,marital_status,date_registered,doctor_id,bed_id)
        VALUES (?,?,?,?,?,?,?,NOW(),?,?)`,
        [first_name,last_name,address,phone,dob,sex,marital_status,doctor_id,bed_id],
        (err,result)=>{
            if(err) throw err;

            // Respond with a confirmation and the bed assigned
            res.json({
                message:"Patient admitted",
                bed_assigned: bed_id
            });
        });

    });

});

// PUT endpoint to update an existing patient's info by ID
app.put("/patients/:id",(req,res)=>{

    const id = req.params.id; // Get patient ID from URL
    const {first_name,last_name,phone} = req.body; // Updated info

    // Update patient record in the database
    db.query(
        "UPDATE patient SET first_name=?, last_name=?, phone=? WHERE patient_id=?",
        [first_name,last_name,phone,id],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Patient updated"}); // Send confirmation
        }
    );
});

// DELETE endpoint to remove a patient by ID
app.delete("/patients/:id",(req,res)=>{

    const id = req.params.id;

    // Delete patient record from the database
    db.query(
        "DELETE FROM patient WHERE patient_id=?",
        [id],
        (err,result)=>{
            if(err) throw err;
            res.json({message:"Patient deleted"}); // Send confirmation
        }
    );
});

// GET endpoint to fetch all doctors
app.get("/doctors",(req,res)=>{
    db.query("SELECT * FROM local_doctor",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

// GET endpoint to fetch all wards
app.get("/wards",(req,res)=>{
    db.query("SELECT * FROM ward",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

// GET endpoint to fetch all beds
app.get("/beds",(req,res)=>{
    db.query("SELECT * FROM bed",(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
});

// GET endpoint to fetch patient names with their assigned doctor
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

// GET endpoint to fetch ward names with total beds
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

// GET endpoint to fetch a single available bed
app.get("/available-bed", (req, res) => {

    db.query('SELECT b.bed_id, b.bed_number, w.ward_name FROM bed b LEFT JOIN ward w ON b.ward_id = w.ward_id WHERE p.bed_id IS NULL LIMIT1,', (err,result) => {
            
            if(err) throw err;

            if(result.length === 0) {
                return res.json({message:"No beds available"});
            }
            res.json(result[0]); // Return the first available bed
        
    });
});

// Start the server on port 3000
app.listen(3000, ()=>{
    console.log("Wellmeadows server running on port 3000");
});