
DROP DATABASE hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;


CREATE TABLE Ward (
    ward_id INT PRIMARY KEY,
    ward_name VARCHAR(50),
    location VARCHAR(50),
    total_beds INT,
    tel_extension VARCHAR(20)
);


CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    address VARCHAR(100),
    tel_number VARCHAR(20),
    dob DATE,
    sex VARCHAR(10),
    nin VARCHAR(20),
    position VARCHAR(50),
    salary INT,
    salary_scale VARCHAR(20)
);


CREATE TABLE Contract (
    contract_id INT PRIMARY KEY,
    staff_id INT,
    hours_per_week INT,
    contract_type VARCHAR(50),
    payment_type VARCHAR(50),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);


CREATE TABLE Qualification (
    qualification_id INT PRIMARY KEY,
    staff_id INT,
    qualification_type VARCHAR(50),
    qualification_date DATE,
    institution VARCHAR(50),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);


CREATE TABLE Work_Experience (
    experience_id INT PRIMARY KEY,
    staff_id INT,
    position VARCHAR(50),
    start_date DATE,
    finish_date DATE,
    organization VARCHAR(50),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);


CREATE TABLE Staff_Allocation (
    allocation_id INT PRIMARY KEY,
    staff_id INT,
    ward_id INT,
    shift VARCHAR(20),
    week_start_date DATE,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
);


CREATE TABLE Patient (
    patient_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dob DATE,
    sex VARCHAR(10),
    address VARCHAR(100),
    tel_no VARCHAR(20),
    marital_status VARCHAR(20),
    date_registered DATE
);


CREATE TABLE In_Patient (
    in_patient_id INT PRIMARY KEY,
    patient_id INT,
    ward_id INT,
    bed_number INT,
    date_placed DATE,
    expected_stay_days INT,
    date_leaves_expected DATE,
    actual_leave_date DATE,
    waiting_list_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
);


CREATE TABLE Next_of_Kin (
    nok_id INT PRIMARY KEY,
    patient_id INT,
    full_name VARCHAR(50),
    address VARCHAR(100),
    tel_no VARCHAR(20),
    relationship VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
);


CREATE TABLE Suppliers (
    supplier_id INT PRIMARY KEY,
    name VARCHAR(50),
    address VARCHAR(100),
    tel_no VARCHAR(20),
    fax VARCHAR(20)
);


CREATE TABLE Supplies (
    item_id INT PRIMARY KEY,
    supplier_id INT,
    supply_name VARCHAR(50),
    description VARCHAR(100),
    quantity_in_stock INT,
    reorder_level INT,
    cost_per_unit INT,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);


CREATE TABLE Drug (
    drug_id INT PRIMARY KEY,
    supplier_id INT,
    name VARCHAR(50),
    description VARCHAR(100),
    dosage VARCHAR(20),
    method_of_admin VARCHAR(50),
    cost_per_unit INT,
    quantity_in_stock INT,
    reorder_level INT,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);


CREATE TABLE Patient_Medication (
    medication_id INT PRIMARY KEY,
    patient_id INT,
    drug_id INT,
    units_per_day INT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (drug_id) REFERENCES Drug(drug_id)
);


CREATE TABLE Requisition_Form (
    requisition_id INT PRIMARY KEY,
    staff_id INT,
    ward_id INT,
    date_ordered DATE,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
);


CREATE TABLE Requisition_Item (
    req_item_id INT PRIMARY KEY,
    requisition_id INT,
    item_id INT,
    quantity INT,
    FOREIGN KEY (requisition_id) REFERENCES Requisition_Form(requisition_id),
    FOREIGN KEY (item_id) REFERENCES Supplies(item_id)
);


CREATE TABLE Local_Doctor (
    doctor_id INT PRIMARY KEY,
    full_name VARCHAR(50),
    clinic_number VARCHAR(50),
    address VARCHAR(100),
    tel_no VARCHAR(20)
);

CREATE TABLE Patient_Doctor (
    patient_id INT,
    doctor_id INT,
    PRIMARY KEY (patient_id, doctor_id),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Local_Doctor(doctor_id)
);


CREATE TABLE Appointment (
    appointment_id INT PRIMARY KEY,
    patient_id INT,
    staff_id INT,
    date_time DATETIME,
    examination_room VARCHAR(20),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);