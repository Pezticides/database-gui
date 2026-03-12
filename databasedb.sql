DROP DATABASE IF EXISTS weallowsdb;
CREATE DATABASE weallowsdb;
USE weallowsdb;

CREATE TABLE ward (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100),
    location VARCHAR(100),
    tel_extension VARCHAR(20),
    total_beds INT
);

CREATE TABLE bed (
    bed_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT,
    bed_number INT,
    FOREIGN KEY (ward_id) REFERENCES ward(ward_id)
);

CREATE TABLE local_doctor (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    clinic_name VARCHAR(100),
    address VARCHAR(200),
    phone VARCHAR(20)
);

CREATE TABLE ward_staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    address VARCHAR(200),
    phone VARCHAR(20),
    date_of_birth DATE,
    sex VARCHAR(10),
    nin VARCHAR(20),
    position VARCHAR(50),
    current_salary DECIMAL(10,2),
    salary_scale VARCHAR(20),
    salary_payment_type VARCHAR(20),
    hours_per_week INT,
    contract_type VARCHAR(20)
);

CREATE TABLE patient (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    address VARCHAR(200),
    phone VARCHAR(20),
    dob DATE,
    sex VARCHAR(10),
    marital_status VARCHAR(20),
    date_registered DATE,
    doctor_id INT,
    FOREIGN KEY (doctor_id) REFERENCES local_doctor(doctor_id)
);

CREATE TABLE next_of_kin (
    kin_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    full_name VARCHAR(100),
    relationship VARCHAR(50),
    address VARCHAR(200),
    phone VARCHAR(20),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
);

USE weallowsdb;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE next_of_kin;
TRUNCATE TABLE patient;
TRUNCATE TABLE ward_staff;
TRUNCATE TABLE local_doctor;
TRUNCATE TABLE bed;
TRUNCATE TABLE ward;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO ward (ward_name, location, tel_extension, total_beds) VALUES
('Orthopaedic','Block A','711',20),
('Cardiology','Block B','712',18),
('Neurology','Block C','713',16),
('Pediatrics','Block D','714',22),
('General Surgery','Block E','715',24),
('Maternity','Block F','716',20),
('Oncology','Block G','717',14),
('ICU','Block H','718',10),
('ENT','Block I','719',12),
('Dermatology','Block J','720',15);

INSERT INTO bed (ward_id, bed_number) VALUES
(1,101),(1,102),
(2,201),(2,202),
(3,301),(3,302),
(4,401),(4,402),
(5,501),(5,502),
(6,601),(6,602),
(7,701),(7,702),
(8,801),(8,802),
(9,901),(9,902),
(10,1001),(10,1002);

INSERT INTO local_doctor (full_name, clinic_name, address, phone) VALUES
('Dr. Helen Parson','Parson Family Clinic','12 Rose St','0917000001'),
('Dr. Mark Lewis','Lewis Health Center','14 King St','0917000002'),
('Dr. Anna Reed','Reed Medical Clinic','16 Queen St','0917000003'),
('Dr. John Carter','Carter Care','18 Hill St','0917000004');


INSERT INTO ward_staff
(first_name,last_name,address,phone,date_of_birth,sex,nin,position,current_salary,salary_scale,salary_payment_type,hours_per_week,contract_type)
VALUES
('Moira','Samuel','9 School Road','0908000001','1961-05-30','Female','NIN0001','Charge Nurse',85000,'Scale 7','Monthly',40,'Permanent'),
('John','Miller','11 Park Ave','0908000002','1980-01-10','Male','NIN0002','Staff Nurse',42000,'Scale 3','Monthly',40,'Permanent'),
('Sarah','Lopez','15 River Rd','0908000003','1985-03-12','Female','NIN0003','Consultant',120000,'Scale 9','Monthly',35,'Permanent'),
('David','Garcia','20 Lake View','0908000004','1979-07-22','Male','NIN0004','Staff Nurse',45000,'Scale 3','Monthly',40,'Permanent'),
('Emily','Cruz','25 Forest Dr','0908000005','1988-11-05','Female','NIN0005','Auxiliary Nurse',30000,'Scale 1','Monthly',38,'Temporary'),
('Michael','Reyes','30 Central St','0908000006','1982-02-14','Male','NIN0006','Charge Nurse',78000,'Scale 6','Monthly',40,'Permanent'),
('Jessica','Tan','35 Hilltop','0908000007','1990-09-18','Female','NIN0007','Staff Nurse',47000,'Scale 3','Monthly',40,'Permanent');


INSERT INTO patient
(first_name,last_name,address,phone,dob,sex,marital_status,date_registered,doctor_id)
VALUES
('Anne','Phelps','44 North Bridges','0918000001','1933-12-12','Female','Single','2025-02-21',1),
('Robert','McDonald','10 Queen Rd','0918000002','1950-06-18','Male','Married','2025-02-22',2),
('Sophie','Turner','12 Main St','0918000003','1998-03-14','Female','Single','2025-02-23',3),
('Daniel','Lee','14 Pine St','0918000004','1987-08-20','Male','Married','2025-02-24',4),
('Grace','Martin','16 Oak St','0918000005','1979-11-05','Female','Married','2025-02-25',1),
('Henry','Walker','18 Elm St','0918000006','1968-01-30','Male','Widowed','2025-02-26',2),
('Ella','Hall','20 Cedar St','0918000007','2001-04-09','Female','Single','2025-02-27',3);

INSERT INTO next_of_kin (patient_id,full_name,relationship,address,phone) VALUES
(1,'James Phelps','Father','145 Rossland Street','0927000001'),
(2,'Maria McDonald','Wife','10 Queen Rd','0927000002'),
(3,'Lucy Turner','Mother','12 Main St','0927000003'),
(4,'Hannah Lee','Wife','14 Pine St','0927000004'),
(5,'Paul Martin','Husband','16 Oak St','0927000005'),
(6,'Claire Walker','Daughter','18 Elm St','0927000006'),
(7,'Robert Hall','Father','20 Cedar St','0927000007');

select * from patient


