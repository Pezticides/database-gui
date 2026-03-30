DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Patient_Medication;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Next_of_Kin;
DROP TABLE IF EXISTS In_Patient;
DROP TABLE IF EXISTS Patient_Doctor;
DROP TABLE IF EXISTS Staff_Allocation;
DROP TABLE IF EXISTS Contract;
DROP TABLE IF EXISTS Qualification;
DROP TABLE IF EXISTS Work_Experience;
DROP TABLE IF EXISTS Patient;
DROP TABLE IF EXISTS Local_Doctor;
DROP TABLE IF EXISTS Drug;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Ward;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- WARD
-- =========================
CREATE TABLE Ward (
    ward_id INT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    total_beds INT DEFAULT 0,
    tel_extension VARCHAR(20)
);

-- =========================
-- STAFF
-- =========================
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address VARCHAR(150),
    tel_number VARCHAR(20),
    dob DATE,
    sex VARCHAR(10),
    nin VARCHAR(30),
    position VARCHAR(50),
    salary DECIMAL(10,2),
    salary_scale VARCHAR(20)
);

-- =========================
-- STAFF ALLOCATION
-- =========================
CREATE TABLE Staff_Allocation (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    ward_id INT NOT NULL,
    date_allocated DATE DEFAULT (CURDATE()),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- CONTRACT
-- =========================
CREATE TABLE Contract (
    contract_id INT PRIMARY KEY,
    staff_id INT NOT NULL,
    hours_per_week INT,
    contract_type VARCHAR(50),
    payment_type VARCHAR(50),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- QUALIFICATION
-- =========================
CREATE TABLE Qualification (
    qualification_id INT PRIMARY KEY,
    staff_id INT NOT NULL,
    qualification_type VARCHAR(100),
    qualification_date DATE,
    institution VARCHAR(100),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- WORK EXPERIENCE
-- =========================
CREATE TABLE Work_Experience (
    experience_id INT PRIMARY KEY,
    staff_id INT NOT NULL,
    position VARCHAR(100),
    start_date DATE,
    end_date DATE,
    organization VARCHAR(100),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- LOCAL DOCTOR
-- =========================
CREATE TABLE Local_Doctor (
    doctor_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    clinic_number VARCHAR(30),
    tel_no VARCHAR(20)
);

-- =========================
-- PATIENT
-- =========================
CREATE TABLE Patient (
    patient_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE,
    sex VARCHAR(10),
    address VARCHAR(150),
    tel_no VARCHAR(20) NOT NULL,
    marital_status VARCHAR(20),
    date_registered DATE DEFAULT (CURDATE())
);

-- =========================
-- PATIENT DOCTOR
-- =========================
CREATE TABLE Patient_Doctor (
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    PRIMARY KEY (patient_id, doctor_id),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Local_Doctor(doctor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- IN PATIENT
-- =========================
CREATE TABLE In_Patient (
    inpatient_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    ward_id INT NOT NULL,
    bed_no VARCHAR(20),
    date_placed DATE DEFAULT (CURDATE()),
    expected_stay INT,
    actual_leave_date DATE,
    UNIQUE KEY uq_patient_inpatient (patient_id),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES Ward(ward_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- NEXT OF KIN
-- =========================
CREATE TABLE Next_of_Kin (
    kin_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    address VARCHAR(150),
    tel_no VARCHAR(20),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- APPOINTMENT
-- =========================
CREATE TABLE Appointment (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    staff_id INT NOT NULL,
    date_time DATETIME NOT NULL,
    examination_room VARCHAR(50),
    reason VARCHAR(255),
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- DRUG
-- =========================
CREATE TABLE Drug (
    drug_id INT PRIMARY KEY,
    drug_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    category VARCHAR(50),
    unit VARCHAR(30),
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    stock_qty INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    notes VARCHAR(255)
);

-- =========================
-- PATIENT MEDICATION
-- =========================
CREATE TABLE Patient_Medication (
    medication_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    drug_id INT NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES Drug(drug_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- SAMPLE DATA
-- =========================

INSERT INTO Ward (ward_id, ward_name, location, total_beds, tel_extension) VALUES
(1, 'General Ward', '1st Floor', 20, '101'),
(2, 'ICU', '2nd Floor', 10, '102'),
(3, 'Pediatrics', '3rd Floor', 15, '103'),
(4, 'Maternity', '4th Floor', 12, '104');

INSERT INTO Staff (staff_id, first_name, last_name, address, tel_number, dob, sex, nin, position, salary, salary_scale) VALUES
(1, 'John', 'Doe', 'CDO City', '09171234567', '1985-05-12', 'Male', 'NIN001', 'Doctor', 50000, 'A1'),
(2, 'Jane', 'Smith', 'Carmen, CDO', '09181234567', '1990-07-21', 'Female', 'NIN002', 'Nurse', 25000, 'B1'),
(3, 'Mark', 'Lee', 'Bulua, CDO', '09191234567', '1988-11-30', 'Male', 'NIN003', 'Surgeon', 70000, 'A2'),
(4, 'Ana', 'Reyes', 'Lapasan, CDO', '09201234567', '1992-03-15', 'Female', 'NIN004', 'Receptionist', 18000, 'C1');

INSERT INTO Staff_Allocation (staff_id, ward_id, date_allocated) VALUES
(1, 1, CURDATE()),
(2, 1, CURDATE()),
(3, 2, CURDATE()),
(4, 3, CURDATE());

INSERT INTO Contract (contract_id, staff_id, hours_per_week, contract_type, payment_type) VALUES
(1, 1, 40, 'Permanent', 'Monthly'),
(2, 2, 40, 'Permanent', 'Monthly'),
(3, 3, 48, 'Permanent', 'Monthly'),
(4, 4, 40, 'Contractual', 'Monthly');

INSERT INTO Qualification (qualification_id, staff_id, qualification_type, qualification_date, institution) VALUES
(1, 1, 'MD', '2010-04-15', 'Xavier University'),
(2, 2, 'BS Nursing', '2012-03-20', 'USTP'),
(3, 3, 'MD Surgery', '2009-05-10', 'MSU-IIT'),
(4, 4, 'BS Office Admin', '2014-03-25', 'Liceo');

INSERT INTO Work_Experience (experience_id, staff_id, position, start_date, end_date, organization) VALUES
(1, 1, 'Resident Doctor', '2011-01-01', '2015-12-31', 'Maria Reyna Hospital'),
(2, 2, 'Ward Nurse', '2013-01-01', '2018-12-31', 'Polymedic Hospital'),
(3, 3, 'Assistant Surgeon', '2010-01-01', '2016-12-31', 'CMC Hospital'),
(4, 4, 'Admin Assistant', '2015-01-01', '2020-12-31', 'Private Clinic');

INSERT INTO Local_Doctor (doctor_id, full_name, clinic_number, tel_no) VALUES
(1, 'Dr. John Doe', 'C101', '09170000001'),
(2, 'Dr. Mark Lee', 'C102', '09170000002'),
(3, 'Dr. Sarah Tan', 'C103', '09170000003');

INSERT INTO Patient (patient_id, first_name, last_name, dob, sex, address, tel_no, marital_status, date_registered) VALUES
(1, 'Peter', 'Parker', '2001-08-10', 'Male', 'Nazareth, CDO', '09990000001', 'Single', CURDATE()),
(2, 'Mary', 'Jane', '2000-02-14', 'Female', 'Macasandig, CDO', '09990000002', 'Single', CURDATE()),
(3, 'Bruce', 'Wayne', '1995-04-17', 'Male', 'Downtown, CDO', '09990000003', 'Single', CURDATE()),
(4, 'Diana', 'Prince', '1998-06-25', 'Female', 'Patag, CDO', '09990000004', 'Married', CURDATE());

INSERT INTO Patient_Doctor (patient_id, doctor_id) VALUES
(1, 1),
(2, 2),
(3, 1),
(4, 3);

INSERT INTO In_Patient (patient_id, ward_id, bed_no, date_placed, expected_stay, actual_leave_date) VALUES
(1, 1, 'G-01', CURDATE(), 3, NULL),
(2, 2, 'ICU-02', CURDATE(), 5, NULL);

INSERT INTO Next_of_Kin (patient_id, full_name, relationship, address, tel_no) VALUES
(1, 'May Parker', 'Aunt', 'Nazareth, CDO', '09181111111'),
(2, 'Harry Osborn', 'Friend', 'Macasandig, CDO', '09182222222'),
(3, 'Alfred Pennyworth', 'Guardian', 'Downtown, CDO', '09183333333'),
(4, 'Steve Trevor', 'Spouse', 'Patag, CDO', '09184444444');

INSERT INTO Appointment (patient_id, staff_id, date_time, examination_room, reason) VALUES
(3, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Room 1', 'General Checkup'),
(4, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Room 2', 'Follow-up Consultation');

INSERT INTO Drug (drug_id, drug_name, generic_name, category, unit, unit_cost, stock_qty, reorder_level, notes) VALUES
(1, 'Biogesic', 'Paracetamol', 'Analgesic', 'Tablet', 2.50, 500, 50, 'For fever/pain'),
(2, 'Amoxil', 'Amoxicillin', 'Antibiotic', 'Capsule', 12.00, 300, 40, 'Prescription required'),
(3, 'Advil', 'Ibuprofen', 'NSAID', 'Tablet', 6.50, 200, 30, 'For pain/inflammation'),
(4, 'Cetirizine', 'Cetirizine', 'Antihistamine', 'Tablet', 4.00, 250, 25, 'For allergies'),
(5, 'ORS', 'Oral Rehydration Salts', 'Hydration', 'Sachet', 15.00, 120, 20, 'For dehydration');

INSERT INTO Patient_Medication (patient_id, drug_id, dosage, frequency, start_date, end_date) VALUES
(1, 1, '500mg', 'Every 6 hours', CURDATE(), NULL),
(2, 2, '250mg', 'Every 8 hours', CURDATE(), NULL);

INSERT INTO Drug (drug_id, drug_name, generic_name, category, unit, unit_cost, stock_qty, reorder_level, notes)
VALUES
(1, 'Biogesic', 'Paracetamol', 'Analgesic', 'Tablet', 2.50, 500, 50, 'For fever/pain'),
(2, 'Amoxil', 'Amoxicillin', 'Antibiotic', 'Capsule', 12.00, 300, 40, 'Prescription required'),
(3, 'Advil', 'Ibuprofen', 'NSAID', 'Tablet', 6.50, 200, 30, 'For pain/inflammation'),
(4, 'Cetirizine', 'Cetirizine', 'Antihistamine', 'Tablet', 4.00, 250, 25, 'For allergies'),
(5, 'ORS', 'Oral Rehydration Salts', 'Hydration', 'Sachet', 15.00, 120, 20, 'For dehydration')
ON DUPLICATE KEY UPDATE
    drug_name = VALUES(drug_name),
    generic_name = VALUES(generic_name),
    category = VALUES(category),
    unit = VALUES(unit),
    unit_cost = VALUES(unit_cost),
    stock_qty = VALUES(stock_qty),
    reorder_level = VALUES(reorder_level),
    notes = VALUES(notes);
    
SELECT * FROM Drug;