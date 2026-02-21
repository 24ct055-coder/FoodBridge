function getDonations() {
    return JSON.parse(localStorage.getItem("donations")) || [];
}

function saveDonations(data) {
    localStorage.setItem("donations", JSON.stringify(data));
}

function ngoClaim(id) {
    const donations = getDonations();
    const updated = donations.map(d => {
        if (d.id === id) d.status = "Claimed";
        return d;
    });
    saveDonations(updated);
    localStorage.setItem("lastClaimed", Date.now());
    renderNGO();
}

function safetyPassed(id) {
    const donations = getDonations();
    const updated = donations.map(d => {
        if (d.id === id) d.safetyVerified = true;
        return d;
    });
    saveDonations(updated);

    const item = updated.find(d => d.id === id);
    if (item && item.packed && item.stored && item.prepared) {
        if (item.donorType === "business") {
            let businessTrust = parseInt(localStorage.getItem("businessTrust")) || 0;
            businessTrust += 10;
            localStorage.setItem("businessTrust", businessTrust);
            alert(`✅ Food verified as safe! Restaurant trust score updated to ${businessTrust} points.`);
        } else {
            let donorTrust = parseInt(localStorage.getItem("donorTrust")) || 0;
            donorTrust += 10;
            localStorage.setItem("donorTrust", donorTrust);
            alert(`✅ Food verified as safe! Donor trust score updated to ${donorTrust} points.`);
        }
    } else {
        alert("⚠️ Safety checks were not fully completed by donor. No points awarded.");
    }

    renderNGO();
}

function markReceived(id) {
    const donations = getDonations();
    const updated = donations.map(d => {
        if (d.id === id) d.status = "Delivered";
        return d;
    });
    saveDonations(updated);

    let volunteerPoints = parseInt(localStorage.getItem("volunteerPoints")) || 0;
    volunteerPoints += 10;
    localStorage.setItem("volunteerPoints", volunteerPoints);

    renderNGO();
}

function getUrgencyScore(d) {
    const now = new Date();
    const expiry = new Date(d.expiry);
    const diff = expiry - now;
    if (diff <= 0) return 999;
    if (diff <= 2 * 60 * 60 * 1000) return 1;
    if (diff <= 6 * 60 * 60 * 1000) return 2;
    return 3;
}

function renderNGO() {
    const container = document.getElementById("ngoList");
    if (!container) return;

    let donations = getDonations();
    const now = new Date();

    // Auto-remove expired unclaimed donations, keep Claimed and Delivered
    donations = donations.filter(d =>
        new Date(d.expiry) > now ||
        d.status === "Claimed" ||
        d.status === "Delivered"
    );
    saveDonations(donations);

    const filterLocation = document.getElementById("filterLocation")?.value || "";
    const sortBy = document.getElementById("sortUrgency")?.value || "";

    let filtered = donations.filter(d =>
        d.status === "Available" ||
        d.status === "Claimed" ||
        d.status === "Delivered"
    );

    if (filterLocation) {
        filtered = filtered.filter(d => d.location === filterLocation);
    }

    if (sortBy === "quantity") {
    filtered.sort((a, b) => Number(b.serves) - Number(a.serves));
} else if (sortBy === "urgent") {
    filtered.sort((a, b) => getUrgencyScore(a) - getUrgencyScore(b));
} else {
    filtered.sort((a, b) => b.id - a.id); // newest first by default
}

    container.innerHTML = "";

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center;color:#888;'>No donations available.</p>";
        return;
    }

    filtered.forEach(d => {
        const diff = new Date(d.expiry) - now;
        const isExpiringSoon = diff <= 2 * 60 * 60 * 1000;

        const div = document.createElement("div");
        div.className = "food-card";
        div.innerHTML = `
            <h3>${d.foodName}</h3>
            <p>Serves: ${d.serves}</p>
            <p>Location: ${d.location}</p>
            ${d.donorType === "business" ? `
    <p>🏨 <strong>${d.businessName}</strong></p>
    <p>🕐 Pickup Time: ${d.preferredTime} (${d.scheduleType})</p>
` : ""}
            <p>Expiry: ${new Date(d.expiry).toLocaleString()}</p>
            ${d.status === "Available" || d.status === "Claimed" ? `
    <p><span class="countdown" data-expiry="${d.expiry}"></span></p>
` : ""}
            <p>Status: <strong>${d.status}</strong></p>
            ${isExpiringSoon && d.status === "Available" ? '<span class="badge urgent">⏰ Expiring Soon</span>' : ''}
            ${d.status === "Available" ? `
                <button class="btn primary-btn" onclick="ngoClaim(${d.id})">📋 Claim</button>
            ` : ""}
            ${d.status === "Claimed" ? `
    <button class="btn secondary-btn" onclick="markReceived(${d.id})"
        ${!d.volunteerAccepted ? "disabled" : ""}>
        ${!d.volunteerAccepted ? "⏳ Awaiting Volunteer" : "📦 Mark Received"}
    </button>
` : ""}
            ${d.status === "Delivered" ? `
                <button class="btn primary-btn" onclick="safetyPassed(${d.id})" ${d.safetyVerified ? "disabled" : ""}>
                    ${d.safetyVerified ? "✅ Safety Verified" : "✅ Food is Safe"}
                </button>
            ` : ""}
        `;
        container.appendChild(div);
    });
}
function startCountdowns() {
    setInterval(() => {
        document.querySelectorAll(".countdown").forEach(el => {
            const expiry = new Date(el.dataset.expiry);
            const diff = expiry - new Date();
            if (diff <= 0) {
                el.textContent = "⛔ Expired";
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            el.textContent = `⏳ Expires in ${h}h ${m}m ${s}s`;
        });
    }, 1000);
}

document.getElementById("filterLocation")?.addEventListener("change", renderNGO);
document.getElementById("sortUrgency")?.addEventListener("change", renderNGO);

startCountdowns();
renderNGO();
