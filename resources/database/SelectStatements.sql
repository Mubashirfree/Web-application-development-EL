-- Select Statements
/* PURPOSE: Fetch all research projects granted funding within a specific date range.
   TABLES USED: Grants (g), Proposals (prop), Project_Master (p), Faculty (f)
*/
SELECT 
    g.SanctionDate,               -- The date the money was officially approved
    p.ProjectName,                -- Title of the research project
    f.Name AS PI_Name,            -- The Faculty member leading the project
    g.SanctionedAmount,           -- Total money approved
    g.FundingAgency               -- Who gave the money (e.g., DST, AICTE)
FROM Grants g
-- Link Grant to the Proposal it came from
JOIN Proposals prop ON g.ProposalID = prop.ProposalID
-- Link Proposal to the Project details
JOIN Project_Master p ON prop.ProjectID = p.ProjectID
-- Link Project to the Faculty table to get the PI's name
JOIN Faculty f ON p.PI_ID = f.FacultyID
-- DURATION FILTER: Change these dates to your desired range
WHERE g.SanctionDate BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY g.SanctionDate ASC;

/* PURPOSE: List all events organized by the department during a specific timeframe.
   TABLES USED: Dept_Events (de), Event_Coordinators (ec), Faculty (f)
*/
SELECT 
    de.EventDate,                 -- When the event happened
    de.Topic,                     -- The title of the workshop/lecture
    de.EventType,                 -- Category (Workshop, Seminar, etc.)
    de.StudentCount,              -- Number of students who attended
    -- This function combines multiple faculty names into one comma-separated list
    GROUP_CONCAT(f.Name SEPARATOR ', ') AS Coordinators
FROM Dept_Events de
-- Link Event to the mapping table that stores coordinators
JOIN Event_Coordinators ec ON de.EventID = ec.EventID
-- Link mapping table to Faculty to get their actual names
JOIN Faculty f ON ec.FacultyID = f.FacultyID
-- DURATION FILTER: Only show events in this timeframe
WHERE de.EventDate BETWEEN '2024-06-01' AND '2024-12-31'
-- Grouping by ID is required when using GROUP_CONCAT
GROUP BY de.EventID
ORDER BY de.EventDate ASC;

/* PURPOSE: Create a single chronological timeline of ALL departmental activity.
   LOGIC: Combines rows from Grants and Dept_Events into one view.
*/
/* PURPOSE: Combine Grants and Events into one single timeline.
   LOGIC: We wrap the UNION in a subquery (Timeline) so we can filter 
   the dates for the entire department at once.
*/

SELECT * FROM (
    -- PART 1: Fetching Research Grant data
    SELECT 
        g.SanctionDate AS ActivityDate, 
        CONCAT('GRANT RECEIVED: ', p.ProjectName) AS ActivityTitle, 
        'Research & Funding' AS Category 
    FROM Grants g 
    JOIN Proposals pr ON g.ProposalID = pr.ProposalID 
    JOIN Project_Master p ON pr.ProjectID = p.ProjectID

    UNION ALL

    -- PART 2: Fetching Departmental Event data
    SELECT 
        de.EventDate AS ActivityDate, 
        de.Topic AS ActivityTitle, 
        de.EventType AS Category 
    FROM Dept_Events de
) AS Timeline 

-- Apply the Duration filter to the combined results here
WHERE ActivityDate BETWEEN '2024-01-01' AND '2025-12-31'

-- Sort everything chronologically
ORDER BY ActivityDate ASC;



/* PURPOSE: Get a "360-degree view" of a specific Faculty member's contributions.
   LOGIC: Combines Projects (as PI or Co-PI), Consultancy work, and Organized Events.
*/

-- Step 1: Find Projects where they are PI or Co-PI
(SELECT 
    'Research Project' AS Role_Type,
    p.ProjectName AS Activity_Name,
    'Lead/Co-Lead' AS Designation,
    'Research' AS Category
 FROM Project_Master p
 JOIN Faculty f ON (p.PI_ID = f.FacultyID OR p.CoPI_ID = f.FacultyID)
 WHERE f.Name LIKE '%Amit%') -- Change name here

UNION ALL

-- Step 2: Find Consultancy Work they were involved in
(SELECT 
    'Consultancy' AS Role_Type,
    c.WorkTitle AS Activity_Name,
    'Consultant' AS Designation,
    'Industry Interaction' AS Category
 FROM Consultancy_Activities c
 JOIN Consultancy_Faculty cf ON c.ConsultancyID = cf.ConsultancyID
 JOIN Faculty f ON cf.FacultyID = f.FacultyID
 WHERE f.Name LIKE '%Amit%') -- Change name here

UNION ALL

-- Step 3: Find Events they Coordinated
(SELECT 
    'Department Event' AS Role_Type,
    de.Topic AS Activity_Name,
    'Coordinator' AS Designation,
    de.EventType AS Category
 FROM Dept_Events de
 JOIN Event_Coordinators ec ON de.EventID = ec.EventID
 JOIN Faculty f ON ec.FacultyID = f.FacultyID
 WHERE f.Name LIKE '%Amit%'); -- Change name here
