

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json()); // To read JSON sent via fetch
app.use(express.urlencoded({ extended: true })); // To read standard HTML form submits

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'mca037', // Update this
    database: 'DepartmentEvent'
};

app.post('/api/report', async (req, res) => {
    const { mode, faculty, start, end, type, agency } = req.body;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        let sql = "";
        let params = [];
        

        if (mode === 'project') {
            sql = `SELECT p.ProjectName AS 'Title', f.Name AS 'PI', g.FundingAgency AS 'Agency', 
                   g.SanctionedAmount AS 'Budget', g.SanctionDate AS 'Date', g.Remarks AS 'Remarks'
                   FROM Project_Master p
                   LEFT JOIN Faculty f ON p.PI_ID = f.FacultyId
                   LEFT JOIN Proposals pr ON p.ProjectID = pr.ProjectID
                   LEFT JOIN Grants g ON pr.ProposalID = g.ProposalID WHERE 1=1`;
            if (faculty) { sql += " AND f.Name LIKE ?"; params.push(`%${faculty}%`); }
            if (agency) { sql += " AND g.FundingAgency LIKE ?"; params.push(`%${agency}%`); }
        } 
        else if (mode === 'event') {
            // MATCHING EXACT CASING: f.FacultyId vs ec.FacultyID
            sql = `SELECT de.EventDate AS 'Date', de.Topic AS 'Event Title', de.EventType AS 'Category', 
                   IFNULL(GROUP_CONCAT(f.Name SEPARATOR ', '), 'No Coordinator') AS 'Coordinator', 
                   de.StudentCount AS 'Participants'
                   FROM Dept_Events de
                   LEFT JOIN Event_Coordinators ec ON de.EventID = ec.EventID
                   LEFT JOIN Faculty f ON ec.FacultyID = f.FacultyId 
                   WHERE 1=1`;
            
            if (faculty) { 
                // Subquery also updated for casing
                sql += " AND de.EventID IN (SELECT ec2.EventID FROM Event_Coordinators ec2 JOIN Faculty f2 ON ec2.FacultyID = f2.FacultyId WHERE f2.Name LIKE ?)"; 
                params.push(`%${faculty}%`); 
            }
            
            if (type && type !== 'all_events') {
                let dbType = (type === 'General Event' || type === 'Event') ? 'Event' : type;
                sql += " AND de.EventType = ?"; 
                params.push(dbType); 
            }
            
            if (start && end) { 
                sql += " AND de.EventDate BETWEEN ? AND ?"; 
                params.push(start, end); 
            }

            sql += " GROUP BY de.EventID"; 
        }
         
        else { // Mode: ALL
            sql = `SELECT * FROM (
                SELECT de.EventDate AS Date, de.Topic AS Title, de.EventType AS Type, 
                IFNULL(GROUP_CONCAT(f.Name SEPARATOR ', '), 'N/A') AS Faculty 
                FROM Dept_Events de 
                LEFT JOIN Event_Coordinators ec ON de.EventID = ec.EventID 
                LEFT JOIN Faculty f ON ec.FacultyID = f.FacultyId 
                GROUP BY de.EventID
                UNION ALL
                SELECT g.SanctionDate AS Date, p.ProjectName AS Title, 'Project' AS Type, f.Name AS Faculty 
                FROM Project_Master p 
                LEFT JOIN Faculty f ON p.PI_ID = f.FacultyId 
                LEFT JOIN Proposals pr ON p.ProjectID = pr.ProjectID 
                LEFT JOIN Grants g ON pr.ProposalID = g.ProposalID
            ) AS Combined WHERE 1=1`;
            if (start && end) { sql += " AND Date BETWEEN ? AND ?"; params.push(start, end); }
        }

        sql += " ORDER BY Date DESC";
        
        const [rows] = await connection.execute(sql, params);
        
        // --- DEBUGGING LOG ---
        console.log(`Report generated: ${rows.length} rows found for mode: ${mode}`);
        
        res.json(rows);
    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.end();
    }
});//app.listen(3000, () => console.log('Backend running on port 3000'));

// --- 2. UPDATE ROUTE (The new functionality) ---
// Get Faculty for the scrollable list
app.get('/api/faculty', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT FacultyId, Name FROM Faculty ORDER BY Name ASC");
        
        // This sends the actual data back to the browser
        res.json(rows); 
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (connection) await connection.end();
    }
});
// Add Event and link multiple Coordinators
app.post('/api/addActivity', async (req, res) => {
    const { Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL, OrganizedBy, FacultyIDs } = req.body;
    let conn;

    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction();

        // 1. Insert into Dept_Events (Auto-ID is handled by DB)
        const [eventRes] = await conn.execute(
            `INSERT INTO Dept_Events 
            (Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL, OrganizedBy) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Topic, EventType, ResourcePersonName, ResourcePersonOrg, EventDate, StudentCount, FacultyCount, IndustryCount, ProofURL, OrganizedBy]
        );

        const newEventId = eventRes.insertId;

        // 2. Insert Multiple Faculty Coordinators
        const coordinatorQueries = FacultyIDs.map(id => {
            return conn.execute("INSERT INTO Event_Coordinators (EventID, FacultyID) VALUES (?, ?)", [newEventId, id]);
        });

        await Promise.all(coordinatorQueries);
        await conn.commit();

        res.json({ success: true });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.end();
    }
});
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, TextRun, AlignmentType, ExternalHyperlink } = require("docx");

// --- 1. DOWNLOAD DEPARTMENT EVENTS DOCX ---
app.get('/api/download/events', async (req, res) => {
    const { start, end } = req.query;
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                DATE_FORMAT(de.EventDate, '%d-%m-%Y') AS 'Date', 
                de.Topic AS 'Event Title', 
                de.EventType AS 'Category', 
                IFNULL(GROUP_CONCAT(DISTINCT f.Name SEPARATOR ', '), 'N/A') AS 'Coordinators', 
                de.ResourcePersonName AS 'Resource Person',
                de.ResourcePersonOrg AS 'Organization',
                de.StudentCount AS 'Participants',
                de.ProofURL AS 'Proof Link'
            FROM Dept_Events de
            LEFT JOIN Event_Coordinators ec ON de.EventID = ec.EventID
            LEFT JOIN Faculty f ON ec.FacultyID = f.FacultyId
            WHERE de.EventDate BETWEEN ? AND ?
            GROUP BY de.EventID 
            ORDER BY de.EventDate DESC`;

        const [rows] = await conn.execute(sql, [start, end]);
        if (rows.length === 0) return res.status(404).send("No data found for this range.");

        const buffer = await generateDocxBuffer("DEPARTMENTAL ACTIVITIES REPORT", rows);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=Events_Report.docx');
        res.send(buffer);
    } catch (err) {
        res.status(500).send(err.message);
    } finally { if (conn) await conn.end(); }
});

// --- 2. DOWNLOAD RESEARCH PROJECTS DOCX ---
app.get('/api/download/projects', async (req, res) => {
    const { start, end } = req.query;
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                p.ProjectName AS 'Project Title', 
                f.Name AS 'Principal Investigator', 
                g.FundingAgency AS 'Funding Agency', 
                CONCAT('₹', FORMAT(g.SanctionedAmount, 2)) AS 'Budget (INR)', 
                DATE_FORMAT(g.SanctionDate, '%d-%m-%Y') AS 'Sanction Date',
                g.Remarks AS 'Remarks'
            FROM Project_Master p
            LEFT JOIN Faculty f ON p.PI_ID = f.FacultyId
            LEFT JOIN Proposals pr ON p.ProjectID = pr.ProjectID
            LEFT JOIN Grants g ON pr.ProposalID = g.ProposalID
            WHERE g.SanctionDate BETWEEN ? AND ?
            ORDER BY g.SanctionDate DESC`;

        const [rows] = await conn.execute(sql, [start, end]);
        if (rows.length === 0) return res.status(404).send("No data found for this range.");

        const buffer = await generateDocxBuffer("RESEARCH & CONSULTANCY REPORT", rows);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=Projects_Report.docx');
        res.send(buffer);
    } catch (err) {
        res.status(500).send(err.message);
    } finally { if (conn) await conn.end(); }
});

// --- HELPER: Handles Table Creation & Links ---
async function generateDocxBuffer(title, rows) {
    const headers = Object.keys(rows[0]);

    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            // Header Row
            new TableRow({
                children: headers.map(h => new TableCell({
                    children: [new Paragraph({ 
                        children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
                        alignment: AlignmentType.CENTER 
                    })],
                    shading: { fill: "2F5597" }
                }))
            }),
            // Data Rows
            ...rows.map(row => new TableRow({
                children: headers.map(h => {
                    const cellValue = row[h] ? row[h].toString() : "N/A";
                    let paraChildren = [];

                    // Logic for Proof Links
                    if (h === 'Proof Link' && cellValue.startsWith('http')) {
                        paraChildren.push(new ExternalHyperlink({
                            children: [new TextRun({ text: "View Proof", color: "0563C1", underline: true })],
                            link: cellValue,
                        }));
                    } else {
                        paraChildren.push(new TextRun({ text: cellValue }));
                    }

                    return new TableCell({
                        children: [new Paragraph({ children: paraChildren })]
                    });
                })
            }))
        ]
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ 
                    text: `Generated on: ${new Date().toLocaleDateString('en-IN')}`, 
                    spacing: { before: 200, after: 200 } 
                }),
                table
            ]
        }]
    });
    return await Packer.toBuffer(doc);
}


app.post('/api/projects', async (req, res) => {
    const { 
        ProjectName, PI_ID, CoPI_ID, Category, 
        FundingAgency, SanctionedAmount, SanctionDate, 
        AmountReceived, Remarks, DocumentUrl 
    } = req.body;

    // Calculate year, defaulting to current year if date is invalid
    const sanctionYear = SanctionDate ? new Date(SanctionDate).getFullYear() : new Date().getFullYear();
    
    // Safety check: ensure numbers are numbers and CoPI is null if empty
    const cleanCoPI = (CoPI_ID && CoPI_ID !== "") ? CoPI_ID : null;
    const cleanAmountReceived = AmountReceived || 0;

    let conn;

    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.beginTransaction(); 

        // 1. Insert into Project_Master (ProjectType is now VARCHAR(50))
        const [proj] = await conn.execute(
            "INSERT INTO Project_Master (ProjectName, PI_ID, CoPI_ID, ProjectType) VALUES (?, ?, ?, ?)",
            [ProjectName, PI_ID, cleanCoPI, Category]
        );
        const projectId = proj.insertId;

        // 2. Insert into Proposals
        const [prop] = await conn.execute(
            "INSERT INTO Proposals (ProjectID, SubmittedTo, SubmissionDate, BudgetAmount, Status, DocumentUrl, Category) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [projectId, FundingAgency, SanctionDate, SanctionedAmount, 'Approved', DocumentUrl, Category]
        );
        const proposalId = prop.insertId;

        // 3. Insert into Grants
        await conn.execute(
            "INSERT INTO Grants (ProposalID, FundingAgency, SanctionedAmount, SanctionDate, SanctionYear, AmountReceived, Remarks) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [proposalId, FundingAgency, SanctionedAmount, SanctionDate, sanctionYear, cleanAmountReceived, Remarks]
        );

        await conn.commit(); 
        res.json({ success: true, message: "Project, Proposal, and Grant records created successfully!" });

    } catch (err) {
        if (conn) await conn.rollback(); 
        console.error("Database Transaction Error:", err);
        res.status(500).json({ error: "Database error: " + err.message });
    } finally {
        if (conn) await conn.end();
    }
});



app.listen(3000, () => console.log('Backend running on port 3000'));