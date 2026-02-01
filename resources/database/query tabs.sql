use DepartmentEvent;

-- creating master tables
 drop table Proposals;
 drop table Facutly;
 drop table Student;
 drop table Project_Master;
 
 drop table Grants;
 -- Creating Table
 
 create table Faculty(
  FacultyId int primary key,
  Name Varchar(100) not null,
  Designation varchar(100) not null,
  Email varchar(255) not null unique
 );
 create table Student(
 StudentId int primary key,
 Name Varchar(100) not null,
 RollNumber varchar(20) not null unique,
 BatchYear int not null 
 );
 
 create table Project_Master(
  ProjectID int primary key,
  ProjectName varchar(100) not null
  
 );
 -- transaction tables
 create table Proposals(
  ProposalID int primary key,
  ProjectID int not null,
   SubmiitedTo varchar(100) not null,
   SubmissionDate Date not null,
   BudgetAmount Decimal not null,
   Status Varchar(20),
   DocumentUrl text ,
  CONSTRAINT Proposal_projectid foreign key(ProjectID) references Project_Master(ProjectID)
 );
 
 create table Grants(
 GrandID int primary key,
 ProposalID int not null,
 FundingAgency Varchar(150) not null,
 SanctionedAmount Decimal not null,
 SanctionDate date not null,
 SanctionYear int not null,
 AmountRecieved Decimal not null,
 Remarks text not null,
 constraint Grant_projectid foreign key(ProposalID) references Proposals(ProposalID)
 );
 CREATE TABLE Consultancy_Activities (
    ConsultancyID INT PRIMARY KEY,
    WorkTitle VARCHAR(255) NOT NULL,
    FundingAgency VARCHAR(150) NOT NULL,
    AmountReceived DECIMAL(15,2) NOT NULL,
    StartDate DATE,
    Status ENUM('Ongoing', 'Completed') DEFAULT 'Ongoing'
);
CREATE TABLE Dept_Events (
    EventID INT PRIMARY KEY,
    Topic VARCHAR(255) NOT NULL,
    EventType ENUM('Expert Lecture', 'Workshop', 'Seminar', 'Conference') NOT NULL,
    ResourcePersonName VARCHAR(100),
    ResourcePersonOrg VARCHAR(255), -- Name and Address of their Org
    EventDate DATE NOT NULL,
    StudentCount INT DEFAULT 0,
    FacultyCount INT DEFAULT 0,
    IndustryCount INT DEFAULT 0,
    ProofURL TEXT,
    OrganizedBy VARCHAR(100) DEFAULT 'MCA Department'
);
CREATE TABLE Faculty_External_Participation (
    ParticipationID INT PRIMARY KEY,
    FacultyID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Venue VARCHAR(255),
    DateAttended DATE NOT NULL,
    CertificateURL TEXT,
    FOREIGN KEY (FacultyID) REFERENCES Faculty(FacultyID)
);
-- Relationship (Junction) Tables

-- Bridge table for Event Coordinators
CREATE TABLE Event_Coordinators (
    EventID INT,
    FacultyID INT,
    PRIMARY KEY (EventID, FacultyID),
    FOREIGN KEY (EventID) REFERENCES Dept_Events(EventID),
    FOREIGN KEY (FacultyID) REFERENCES Faculty(FacultyID)
);

-- Bridge table to link multiple faculty to one consultancy
CREATE TABLE Consultancy_Faculty (
    ConsultancyID INT,
    FacultyID INT,
    PRIMARY KEY (ConsultancyID, FacultyID),
    FOREIGN KEY (ConsultancyID) REFERENCES Consultancy_Activities(ConsultancyID),
    FOREIGN KEY (FacultyID) REFERENCES Faculty(FacultyID)
);
 
 
 -- add foreign key to project_master table
 
 alter table Project_Master add PI_ID int ; 
 alter table Project_Master modify column PI_ID int not null;
 alter table Project_Master add constraint faculty_PIID foreign key (PI_ID) references Faculty(FacultyID);

 alter table Project_Master add column CoPI_ID int ; 
 alter table Project_Master add constraint foreign key(CoPI_ID) references Faculty(FacultyID);
 
 Desc Project_Master;
 
 
 -- inserting the values 
 insert into Faculty values(101,"Dr Amit Sharama","Professor &HOD","amitsharam@rvce.edu.in")
                            ,(102,"Dr Priya Nair","Associate Professor","priyanair@rvce.edu.in"),
                            (103,"Prof.Rajesh Lyer","Assistant Professor","rajeshiyer@rvce.edu.in");
 
 insert into Project_Master values (1, 'AI-Based Traffic Management System', 101, 102),
(2, 'Secure Blockchain Voting Portal', 102, 103),
(3, 'Cloud-Native Student Analytics Tool', 103, NULL);
update  Project_Master set PI_ID=101 where ProjectID=2;

 
 INSERT INTO Proposals (ProposalID, ProjectID, SubmiitedTo, SubmissionDate, BudgetAmount, Status, DocumentUrl) VALUES 
(501, 1, 'DST-SERB', '2024-02-15', 1500000, 'Approved', 'https://docs.google.com/document/d/1kOlxnKOclPjJXZnnyBHqHE3hno6e3Dzd/edit?usp=sharing&ouid=108055445359007122844&rtpof=true&sd=true'),
(502, 2, 'AICTE-MODROBS', '2024-03-10', 800000, 'Approved', 'https://docs.google.com/document/d/1kOlxnKOclPjJXZnnyBHqHE3hno6e3Dzd/edit?usp=sharing&ouid=108055445359007122844&rtpof=true&sd=true'),
(503, 3, 'UGC-Major-Project', '2024-05-20', 1200000, 'Rejected', 'https://docs.google.com/document/d/1kOlxnKOclPjJXZnnyBHqHE3hno6e3Dzd/edit?usp=sharing&ouid=108055445359007122844&rtpof=true&sd=true');
 
 INSERT INTO Grants (GrandID, ProposalID, FundingAgency, SanctionedAmount, SanctionDate, SanctionYear, AmountRecieved, Remarks) VALUES 
(9001, 501, 'Dept of Science & Technology', 1200000, '2024-06-01', 2024, 400000, 
'Project approved for 3 years. First installment of 4 Lakhs received for high-end GPU server procurement.'),
(9002, 502, 'AICTE', 750000, '2024-08-15', 2024, 750000, 
'Full amount sanctioned for MCA Lab modernization. Procurement of 20 new workstations completed.');
 
 INSERT INTO Student (StudentID, Name, RollNumber, BatchYear) VALUES 
(201, 'Rahul Verma', '1RV24MC001', 2024),
(202, 'Sneha Kapoor', '1RV24MC002', 2024);
 
 -- Projects (Master)
INSERT INTO Project_Master (ProjectID, ProjectName, PI_ID, CoPI_ID, ProjectType) VALUES 
(4, 'Deep Learning for Medical Imaging', 101, 103, 'Research');

-- Proposals (Transaction)
INSERT INTO Proposals (ProposalID, ProjectID, SubmittedTo, SubmissionDate,BudgetAmount, Status,DocumentUrl,Category) VALUES 
(504, 4, 'UGC', '2024-12-25',1200000.00, 'Approved','https://drive.google.com/mca/quantum_talk.pdf','Research');

-- Grants (Transaction)
INSERT INTO Grants (GrantID, ProposalID, FundingAgency, SanctionedAmount, SanctionDate, SanctionYear, AmountReceived, Remarks) VALUES 
(9003, 504, 'UGC India', 1000000.00, '2025-01-10', 2025, 500000.00, 'Initial grant for high-performance computing setup.');
 
 -- Consultancy Activity
INSERT INTO Consultancy_Activities (ConsultancyID, WorkTitle, FundingAgency, AmountReceived, StartDate, Status) VALUES 
(801, 'Security Audit for E-Commerce Portal', 'TechSafe Solutions', 150000.00, '2024-11-05', 'Completed');

-- Link Faculty 102 to this Consultancy
INSERT INTO Consultancy_Faculty (ConsultancyID, FacultyID) VALUES (801, 102);
 
 -- Organized Event 1: Expert Lecture
INSERT INTO Dept_Events (EventID, Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL) VALUES 
(701, 'Future of Quantum Computing', 'Expert Lecture', 'Dr. John Doe', 'IBM Research', '2024-12-15', 120, 15, 2, 'https://drive.google.com/mca/quantum_talk.pdf');

-- Organized Event 2: Workshop
INSERT INTO Dept_Events (EventID, Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL) VALUES 
(702, 'Hands-on Blockchain Workshop', 'Workshop', 'Mr. Sam Smith', 'EtherCorp', '2025-01-05', 60, 10, 5, 'https://drive.google.com/mca/blockchain_ws.pdf');

-- Assign Coordinators (Dr. Amit and Prof. Rajesh for the Workshop)
INSERT INTO Event_Coordinators (EventID, FacultyID) VALUES 
(701, 101), -- Dr. Amit coordinated the lecture
(702, 101), -- Dr. Amit is Lead Coordinator for Workshop
(702, 103); -- Prof. Rajesh is Co-Coordinator
 
 
 INSERT INTO Faculty_External_Participation (ParticipationID, FacultyID, Title, Venue, DateAttended, CertificateURL) VALUES 
(601, 103, 'National FDP on Microservices', 'IIT Bombay', '2024-09-12', 'https://cert-link.com/rajesh123');
 
 -- 1. Inauguration of First Year MCA (General Event)
INSERT INTO Dept_Events (EventID, Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL) VALUES 
(703, 'Inauguration of MCA Batch 2025-27', 'Event', 'Principal, RVCE', 'RVCE Administration', '2025-08-01', 120, 20, 0, 'https://drive.google.com/mca/inauguration_2025.pdf');

-- 2. National Conference (Conference)
INSERT INTO Dept_Events (EventID, Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL) VALUES 
(704, 'National Conference on Applied AI', 'Conference', 'Various Speakers', 'Multi-Org', '2025-03-15', 250, 45, 15, 'https://drive.google.com/mca/conf_ai_2025.pdf');

-- 3. Seminar on Research Ethics (Seminar)
INSERT INTO Dept_Events (EventID, Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL) VALUES 
(705, 'Seminar on Intellectual Property Rights', 'Seminar', 'Adv. Meera Rao', 'IP India Office', '2024-10-20', 80, 12, 1, 'https://drive.google.com/mca/ipr_seminar.pdf');

-- 4. Assign Coordinators for these new events
INSERT INTO Event_Coordinators (EventID, FacultyID) VALUES 
(703, 101), -- HOD coordinated the Inauguration
(704, 101), -- Dr. Amit (Conference Chair)
(704, 102), -- Dr. Priya (Conference Co-Chair)
(705, 103); -- Prof. Rajesh (Seminar Coordinator)
 
 
 
 
 
 
 
 Select *From Faculty;
 
 -- Select based on faculty name
SELECT f.Name, p.ProjectName, g.SanctionedAmount,prop.DocumentUrl,g.Remarks
FROM Faculty f
JOIN Project_Master p ON (f.FacultyID = p.PI_ID OR f.FacultyID = p.CoPI_ID)
JOIN Proposals prop ON p.ProjectID = prop.ProjectID
JOIN Grants g ON prop.ProposalID = g.ProposalID
WHERE f.Name = 'Dr Amit Sharama';
 -- Select based on mont
 SELECT p.ProjectName, g.SanctionedAmount, g.SanctionDate
FROM Grants g
JOIN Proposals prop ON g.ProposalID = prop.ProposalID
JOIN Project_Master p ON prop.ProjectID = p.ProjectID
WHERE MONTH(g.SanctionDate) = 6; -- 6 represents June
 -- select based on a time period
 SELECT p.ProjectName, g.FundingAgency, g.SanctionedAmount, g.SanctionDate
FROM Grants g
JOIN Proposals prop ON g.ProposalID = prop.ProposalID
JOIN Project_Master p ON prop.ProjectID = p.ProjectID
WHERE g.SanctionDate BETWEEN '2024-01-01' AND '2024-08-30';
 -- Select based on faculty involvement in a specfic month
 SELECT f.Name, p.ProjectName, g.SanctionedAmount, g.SanctionDate
FROM Faculty f
JOIN Project_Master p ON (f.FacultyID = p.PI_ID OR f.FacultyID = p.CoPI_ID)
JOIN Proposals prop ON p.ProjectID = prop.ProjectID
JOIN Grants g ON prop.ProposalID = g.ProposalID
WHERE f.Name LIKE '%Priya%' 
  AND MONTH(g.SanctionDate) = 6; -- Month of August
 
 -- Alter statements
 -- Add Department and Expertise to Faculty
ALTER TABLE Faculty 
ADD COLUMN Department VARCHAR(50) DEFAULT 'MCA',
ADD COLUMN Expertise VARCHAR(255);
 
 -- Add Project Type to distinguish categories
ALTER TABLE Project_Master 
ADD COLUMN ProjectType ENUM('Research', 'Consultancy', 'Training') DEFAULT 'Research';
 
 -- Add Category to Proposals
ALTER TABLE Proposals 
ADD COLUMN Category ENUM('Research', 'Workshop', 'FDP', 'Consultancy') DEFAULT 'Research';

-- Fix the typo in your current table (SubmiitedTo -> SubmittedTo)
ALTER TABLE Proposals 
CHANGE COLUMN SubmiitedTo SubmittedTo VARCHAR(100) NOT NULL;
 
 -- Rename column typo if you used 'GrandID'
ALTER TABLE Grants 
CHANGE COLUMN GrandID GrantID INT;

-- Ensure AmountRecieved typo is fixed to AmountReceived
ALTER TABLE Grants 
CHANGE COLUMN AmountRecieved AmountReceived DECIMAL(15,2) NOT NULL;
 
 -- Update Statements
 
 -- Update Faculty 101 (HOD)
UPDATE Faculty 
SET Department = 'MCA', Expertise = 'Data Science & Academic Administration' 
WHERE FacultyID = 101;

-- Update Faculty 102
UPDATE Faculty 
SET Department = 'MCA', Expertise = 'Cyber Security & Blockchain' 
WHERE FacultyID = 102;

-- Update Faculty 103
UPDATE Faculty 
SET Department = 'MCA', Expertise = 'Cloud Computing & Virtualization' 
WHERE FacultyID = 103;

-- Setting existing research projects
UPDATE Project_Master SET ProjectType = 'Research' WHERE ProjectID IN (1, 2);

-- Setting the third one as Training (since it was for student analytics)
UPDATE Project_Master SET ProjectType = 'Training' WHERE ProjectID = 3;





 -- Proposal 501 was for the AI project
UPDATE Proposals SET Category = 'Research' WHERE ProposalID = 501;

-- Proposal 502 was for AICTE-MODROBS (Modernization of Labs - often FDP/Workshop related)
UPDATE Proposals SET Category = 'FDP' WHERE ProposalID = 502;

-- Proposal 503 was a University grant
UPDATE Proposals SET Category = 'Research' WHERE ProposalID = 503;
 
 -- Update existing Faculty with new Master data
UPDATE Faculty SET Department = 'MCA', Expertise = 'Data Science & AI' WHERE FacultyID = 101;
UPDATE Faculty SET Department = 'MCA', Expertise = 'Cyber Security & Blockchain' WHERE FacultyID = 102;
UPDATE Faculty SET Department = 'MCA', Expertise = 'Cloud Computing' WHERE FacultyID = 103;
 
 
 ALTER TABLE Dept_Events 
MODIFY COLUMN EventType ENUM('Expert Lecture', 'Workshop', 'Seminar', 'Conference', 'Event', 'FDP') NOT NULL;
 
 
 
 -- verification Query
 SELECT 
    f.Name, 
    f.Expertise, 
    p.ProjectName, 
    p.ProjectType, 
    prop.Category, 
    g.SanctionedAmount
FROM Faculty f
JOIN Project_Master p ON f.FacultyID = p.PI_ID
JOIN Proposals prop ON p.ProjectID = prop.ProjectID
LEFT JOIN Grants g ON prop.ProposalID = g.ProposalID;
 SELECT 
    f.Name AS Faculty, 
    e.Topic AS Event_Coordinated, 
    e.StudentCount AS Attendees
FROM Faculty f
JOIN Event_Coordinators ec ON f.FacultyID = ec.FacultyID
JOIN Dept_Events e ON ec.EventID = e.EventID;
 
 Select * From Project_Master;
 
 
 
 