const db = require("./db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // serve html files

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