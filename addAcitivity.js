document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Faculty list into the scroll bar
    const facultySelect = document.getElementById('facultySelect');
    try {
        const response = await fetch('http://localhost:3000/api/faculty');
        const faculties = await response.json();
        faculties.forEach(f => {
            const option = document.createElement('option');
            option.value = f.FacultyId;
            option.textContent = f.Name;
            facultySelect.appendChild(option);
        });
    } catch (err) { console.error("Error loading faculty:", err); }
});

// Show/Hide custom input for 'Other'
function toggleOtherType(select) {
    const otherInput = document.getElementById('otherEventType');
    if (select.value === 'Other') {
        otherInput.classList.remove('d-none');
        otherInput.required = true;
    } else {
        otherInput.classList.add('d-none');
        otherInput.required = false;
    }
}

document.getElementById('addEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Extract all selected faculty IDs as an array
    const selectedFaculties = Array.from(document.getElementById('facultySelect').selectedOptions).map(opt => opt.value);
    data.FacultyIDs = selectedFaculties;

    // Use Custom Type if "Other" was picked
    if (data.EventType === 'Other') {
        data.EventType = data.CustomType;
    }

    try {
        const response = await fetch('http://localhost:3000/api/addActivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Record added successfully!");
            e.target.reset();
            document.getElementById('otherEventType').classList.add('d-none');
        }
    } catch (err) {
        alert("Server error. Check console.");
    }
});
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Populate Faculty Scroll Bars (PI and Co-PI)
    try {
        const response = await fetch('http://localhost:3000/api/faculty');
        const facultyData = await response.json();
        
        const piSelect = document.getElementById('piSelect');
        const copiSelect = document.getElementById('copiSelect');

        // Clear existing options first to prevent double-loading
        piSelect.innerHTML = '<option value="" disabled selected>-- Select PI --</option>';
        copiSelect.innerHTML = '<option value="">-- None --</option>';

        facultyData.forEach(f => {
            const option = `<option value="${f.FacultyId}">${f.Name}</option>`;
            piSelect.innerHTML += option;
            copiSelect.innerHTML += option;
        });
    } catch (err) { console.error("Faculty load error:", err); }

    // 2. Handle Project Form Submit
    document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // --- NEW: LOGIC FOR CUSTOM CATEGORY ---
        if (data.Category === 'Other') {
            data.Category = data.CustomCategory;
        }

        // --- IMPROVED: PI & Co-PI SELECTION LOGIC ---
        data.PI_ID = document.getElementById('piSelect').value;
        const selectedCoPI = document.getElementById('copiSelect').value;
        
        // Ensure CoPI is a null object if "-- None --" is chosen
        data.CoPI_ID = (selectedCoPI === "" || selectedCoPI === null) ? null : selectedCoPI;

        // Validation: Ensure PI is selected
        if (!data.PI_ID) {
            alert("Please select a Principal Investigator (PI).");
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const result = await res.json();
                alert(result.message || "Project record created successfully!");
                location.reload();
            } else {
                const errData = await res.json();
                alert("Error: " + errData.error);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            alert("Failed to connect to server. Check if backend is running.");
        }
    });
});

// --- TOGGLE FUNCTION FOR PROJECT CATEGORY ---
function toggleProjectOtherType(select) {
    const customInput = document.getElementById('otherProjectCategory');
    if (select.value === 'Other') {
        customInput.classList.remove('d-none');
        customInput.setAttribute('required', 'true');
        customInput.focus();
    } else {
        customInput.classList.add('d-none');
        customInput.removeAttribute('required');
        customInput.value = ""; // Clear it if they switch back
    }
}

function toggleProjectOtherType(select) {
    const customInput = document.getElementById('otherProjectCategory');
    if (select.value === 'Other') {
        customInput.classList.remove('d-none');
        customInput.setAttribute('required', 'true');
    } else {
        customInput.classList.add('d-none');
        customInput.removeAttribute('required');
    }
}