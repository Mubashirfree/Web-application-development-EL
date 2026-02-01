function renderActivities(data) {
    const grid = document.getElementById('activityGrid');
    document.getElementById('totalCount').innerText = data.length;

    if (data.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5">
            <i class="bi bi-inbox display-1 text-light"></i>
            <p class="text-muted">No activities found.</p>
        </div>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="col-md-6 col-xl-4">
            <div class="activity-card p-4 shadow-sm h-100">
                <div class="d-flex justify-content-between mb-3">
                    <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill small">
                        ${item.Category}
                    </span>
                    <span class="text-muted small"><i class="bi bi-calendar-event me-1"></i> ${item.Date}</span>
                </div>
                <h5 class="fw-bold mb-3">${item.Title}</h5>
                <p class="text-muted small">Record created for the department activity log.</p>
                <div class="mt-auto pt-3 border-top">
                    <a href="#" class="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-bold">
                        View Details <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}