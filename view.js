let lastData = [];

async function fetchData(mode) {
    const container = document.getElementById('tableContainer');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    // We use a clean way to grab values based on the mode
    const payload = { mode };

    if (mode === 'event') {
        payload.faculty = document.getElementById('evFaculty')?.value || "";
        payload.type = document.getElementById('evType')?.value || "all_events";
        payload.start = document.getElementById('evStart')?.value || "";
        payload.end = document.getElementById('evEnd')?.value || "";
    } else if (mode === 'project') {
        payload.faculty = document.getElementById('pjFaculty')?.value || "";
        payload.agency = document.getElementById('pjAgency')?.value || "";
    } else {
        payload.start = document.getElementById('allStart')?.value || "";
        payload.end = document.getElementById('allEnd')?.value || "";
    }

    try {
        const res = await fetch('http://localhost:3000/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        lastData = await res.json();
        renderTable(lastData);
        document.getElementById('dlBtn').style.display = lastData.length ? 'block' : 'none';
    } catch (e) {
        container.innerHTML = '<div class="alert alert-danger">Error: Could not reach backend.</div>';
    }
}
function renderTable(data) {
    const container = document.getElementById('tableContainer');
    if(!data.length) { container.innerHTML = '<div class="alert alert-info">No data found.</div>'; return; }
    
    const cols = Object.keys(data[0]);
    let html = `<table class="table table-hover bg-white border"><thead><tr class="table-dark">`;
    cols.forEach(c => html += `<th>${c}</th>`);
    html += `</tr></thead><tbody>`;
    data.forEach(row => {
        html += `<tr>`;
        cols.forEach(c => {
            let val = row[c];
            if(c === 'Budget') val = '₹' + Number(val).toLocaleString('en-IN');
            if(c === 'Date') val = new Date(val).toLocaleDateString();
            html += `<td>${val || '-'}</td>`;
        });
        html += `</tr>`;
    });
    container.innerHTML = html + `</tbody></table>`;
}

function downloadCSV() {
    const headers = Object.keys(lastData[0]).join(',');
    const rows = lastData.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
 
   a.href = url; a.download = 'Report.csv'; a.click();
}
/*
async function downloadReport() {
    // Helper function to safely get values or return empty string
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const filters = {
        mode: getVal('reportMode'), // Verify this ID matches your <select>
        faculty: getVal('facultyFilter'),
        start: getVal('startDate'),
        end: getVal('endDate'),
        type: getVal('typeFilter'),
        agency: getVal('agencyFilter') // Only exists in project mode
    };

    // Check if the mandatory 'mode' is missing
    if (!filters.mode) {
        console.error("Error: Element with ID 'reportMode' not found in HTML.");
        alert("System Error: Report mode selection not found.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/report/download-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters)
        });

        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MCA_Report_${filters.mode}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (err) {
        alert("Error generating file: " + err.message);
    }
}*/
function downloadFile(type) {
    const startEl = document.getElementById('startDate');
    const endEl = document.getElementById('endDate');

    // Check if elements exist before accessing .value
    if (!startEl || !endEl) {
        console.error("Critical Error: HTML elements 'startDate' or 'endDate' are missing from the page.");
        alert("System error: Date inputs not found on this page.");
        return;
    }

    const start = startEl.value;
    const end = endEl.value;

    if (!start || !end) {
        alert("Please select both start and end dates first!");
        return;
    }

    const url = `http://localhost:3000/api/download/${type}?start=${start}&end=${end}`;
    
    // Using window.open or window.location.href to trigger the GET route
    window.location.href = url;
}

function clearResults() {
    // 1. Reset the Results Title
    document.getElementById('resTitle').innerText = "Search Results";
    
    // 2. Hide the Export/Download button
    const dlBtn = document.getElementById('dlBtn');
    if (dlBtn) dlBtn.style.display = 'none';
    
    // 3. Restore the empty state placeholder in the table container
    const container = document.getElementById('tableContainer');
    container.innerHTML = `
        <div class="p-5 text-center text-muted">
            <i class="bi bi-file-earmark-arrow-down display-1 opacity-25"></i>
            <p class="mt-3">Master Export mode active. Select dates above to download bulk records.</p>
        </div>
    `;
}