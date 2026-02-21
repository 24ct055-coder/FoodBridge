function getDonations() {
    return JSON.parse(localStorage.getItem("donations")) || [];
}
function drawChart(available, claimed, delivered) {
    const ctx = document.getElementById("statusChart");
    if (!ctx) return;
    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Available", "Claimed", "Delivered"],
            datasets: [{
                data: [available, claimed, delivered],
                backgroundColor: ["#66BB6A", "#FFA000", "#1976D2"],
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                title: {
                    display: true,
                    text: "Donation Status Overview",
                    font: { size: 16 }
                }
            }
        }
    });
}


function updateImpact() {
    const donations = getDonations();
    const total     = donations.length;
    const available = donations.filter(d => d.status === "Available").length;
    const claimed   = donations.filter(d => d.status === "Claimed").length;
    const delivered = donations.filter(d => d.status === "Delivered").length;
    const meals     = donations.reduce((sum, d) => sum + Number(d.serves), 0);
    const co2       = donations.reduce((sum, d) => sum + Number(d.serves) * 2.5, 0);

    document.getElementById("adminStats").innerHTML = `
        <div class="dashboard-card"><h3>Total Listings</h3><p>${total}</p></div>
        <div class="dashboard-card"><h3>Available</h3><p>${available}</p></div>
        <div class="dashboard-card"><h3>Claimed</h3><p>${claimed}</p></div>
        <div class="dashboard-card"><h3>Delivered</h3><p>${delivered}</p></div>
        <div class="dashboard-card"><h3>Meals Served</h3><p>${meals}</p></div>
        <div class="dashboard-card"><h3>CO₂ Saved</h3><p>${co2.toFixed(2)} kg</p></div>
    `;

    drawChart(available, claimed, delivered); // ADD THIS
}

updateImpact();