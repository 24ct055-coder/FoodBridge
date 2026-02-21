let volunteerPoints = parseInt(localStorage.getItem("volunteerPoints")) || 0;
let mealsSaved = parseInt(localStorage.getItem("mealsSaved")) || 0;
let co2Reduced = parseFloat(localStorage.getItem("co2Reduced")) || 0;

function saveAll() {
    localStorage.setItem("volunteerPoints", volunteerPoints);
    localStorage.setItem("mealsSaved", mealsSaved);
    localStorage.setItem("co2Reduced", co2Reduced);
}

function getDonations() {
    return JSON.parse(localStorage.getItem("donations")) || [];
}

function saveDonations(data) {
    localStorage.setItem("donations", JSON.stringify(data));
}

// ── Auto remove expired unclaimed items ──────────────
function removeExpired() {
    const donations = getDonations();
    const now = new Date();
    const filtered = donations.filter(d =>
        isNaN(new Date(d.expiry).getTime()) ||
        new Date(d.expiry) > now ||
        d.status === "Claimed" ||
        d.status === "Delivered"
    );
    saveDonations(filtered);
}

function getStatus(item) {
    const now = new Date();
    const expiry = new Date(item.expiry);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";
    if (diff <= 2 * 60 * 60 * 1000) return "Expiring Soon";
    return item.status;
}

// ── NGO Food Listings ────────────────────────────────
function renderFood() {
    const container = document.getElementById("foodContainer");
    if (!container) return;
    container.innerHTML = "";

    let listings = getDonations();

    const filter = document.getElementById("filterLocation")?.value;
    const sort = document.getElementById("sortUrgency")?.value;

    if (filter)
        listings = listings.filter(i => i.location === filter);

    if (sort === "urgent")
        listings.sort((a, b) => a.urgency === "Urgent" ? -1 : 1);

    if (sort === "quantity")
        listings.sort((a, b) => b.serves - a.serves);

    listings.forEach(item => {
        item.status = getStatus(item);

        if (item.status !== "Available" && item.status !== "Expiring Soon") return;

        const card = document.createElement("div");
        card.className = "food-card";

        let badge = "";
        if (item.urgency === "Urgent")
            badge = '<span class="badge urgent">🔥 Urgent</span>';
        if (item.status === "Expiring Soon")
            badge += '<span class="badge expiring">⏳ Expiring Soon</span>';

        card.innerHTML = `
            <h3>${item.foodName}</h3>
            <p>Serves: ${item.serves}</p>
            <p>Location: ${item.location}</p>
            <p>Status: ${item.status}</p>
            <p>Expiry: ${new Date(item.expiry).toLocaleString()}</p>
            ${item.donorType === "business" ? `<p>🏨 ${item.businessName}</p>` : ""}
            ${badge}
            <br><br>
            <button onclick="claimFood(${item.id})">Claim</button>
        `;

        container.appendChild(card);
    });

    saveDonations(listings);
}

function claimFood(id) {
    const donations = getDonations();
    const updated = donations.map(item => {
        if (item.id === id) {
            item.status = "Claimed";
            mealsSaved += Number(item.serves);
            co2Reduced += Number(item.serves) * 2.5;
        }
        return item;
    });

    saveDonations(updated);
    saveAll();
    renderFood();
    renderPickups();
    renderAdmin();
    renderImpact();
}

// ── Volunteer Pickups ────────────────────────────────
function renderPickups() {
    const container = document.getElementById("pickupContainer");
    if (!container) return;
    container.innerHTML = "";

    const donations = getDonations();
    const available = donations.filter(d =>
        d.status === "Claimed" &&
        (d.location === localStorage.getItem("volunteerLocation") ||
        !localStorage.getItem("volunteerLocation"))
    );

    // Notification badge on navbar
    const badge = document.getElementById("volunteerNavBadge");
    if (badge) badge.innerText = available.length > 0 ? available.length : "";

    // Notification message on volunteer page
    const notif = document.getElementById("pickupNotif");
    if (notif) {
        notif.innerText = available.length > 0
            ? `🔔 ${available.length} new pickup${available.length > 1 ? "s" : ""} available from NGO!`
            : "";
    }

    if (available.length === 0) {
        container.innerHTML = "<p style='text-align:center;color:#888;'>No pickups available yet.</p>";
        if (document.getElementById("volPoints"))
            document.getElementById("volPoints").innerText =
                parseInt(localStorage.getItem("volunteerPoints")) || 0;
        return;
    }

    available.forEach(item => {
        const card = document.createElement("div");
        card.className = "food-card" + (item.urgent ? " urgent" : "");
        card.innerHTML = `
            <h3>${item.foodName}</h3>
            <p>📍 Pickup Location: ${item.location}</p>
            <p>🍽️ Serves: ${item.serves}</p>
            <p>🥘 Food Type: ${item.foodType}</p>
            <p>⏰ Expiry: ${new Date(item.expiry).toLocaleString()}</p>
            ${item.donorType === "business" ? `<p>🏨 ${item.businessName}</p>` : ""}
            ${item.urgent ? '<span class="badge urgent">🔥 Urgent</span>' : ""}
            <br>
            ${!item.volunteerAccepted ? `
                <button class="btn primary-btn" onclick="acceptPickup(${item.id})">
                    ✅ Accept Pickup
                </button>
            ` : "<p style='color:green;font-weight:600;margin-top:8px;'>✅ Pickup Accepted</p>"}
        `;
        container.appendChild(card);
    });

    if (document.getElementById("volPoints"))
        document.getElementById("volPoints").innerText =
            parseInt(localStorage.getItem("volunteerPoints")) || 0;
}

function acceptPickup(id) {
    const donations = getDonations();
    const updated = donations.map(d => {
        if (d.id === id) d.volunteerAccepted = true;
        return d;
    });
    saveDonations(updated);
    renderPickups();
}

function deliverFood(id) {
    const donations = getDonations();
    const updated = donations.map(item => {
        if (item.id === id) {
            item.status = "Delivered";
            volunteerPoints += 10;
            if (item.urgent) volunteerPoints += 5;
        }
        return item;
    });

    saveDonations(updated);
    saveAll();
    renderPickups();
    renderAdmin();
    renderImpact();
}

// ── Admin ────────────────────────────────────────────
function renderAdmin() {
    const container = document.getElementById("adminStats");
    if (!container) return;

    const donations = getDonations();
    const total     = donations.length;
    const available = donations.filter(i => i.status === "Available").length;
    const claimed   = donations.filter(i => i.status === "Claimed").length;
    const delivered = donations.filter(i => i.status === "Delivered").length;

    container.innerHTML = `
        <div class="dashboard-card">
            <h3>Total Listings</h3><p>${total}</p>
        </div>
        <div class="dashboard-card">
            <h3>Available</h3><p>${available}</p>
        </div>
        <div class="dashboard-card">
            <h3>Claimed</h3><p>${claimed}</p>
        </div>
        <div class="dashboard-card">
            <h3>Delivered</h3><p>${delivered}</p>
        </div>
        <div class="dashboard-card">
            <h3>Meals Saved</h3><p>${mealsSaved}</p>
        </div>
        <div class="dashboard-card">
            <h3>CO₂ Reduced (kg)</h3><p>${co2Reduced.toFixed(2)}</p>
        </div>
    `;
}

// ── Homepage Impact ──────────────────────────────────
function renderImpact() {
    const donations = getDonations();
    const total = document.getElementById("totalListings");
    const meals = document.getElementById("mealsSaved");
    const co2   = document.getElementById("co2Reduced");

    if (total) total.innerText = donations.length;
    if (meals) meals.innerText = mealsSaved;
    if (co2)   co2.innerText   = co2Reduced.toFixed(2);

    // Dynamic alert banner
    const banner = document.getElementById("alertBanner");
    if (banner) {
        const urgent = donations.filter(d => d.urgent && d.status === "Available");
        if (urgent.length > 0) {
            const locationCounts = urgent.reduce((acc, d) => {
                acc[d.location] = (acc[d.location] || 0) + 1;
                return acc;
            }, {});
            const parts = Object.entries(locationCounts)
                .map(([loc, count]) => `${count} in ${loc}`);
            banner.textContent = `⚠ Urgent pickup${urgent.length > 1 ? "s" : ""} needed: ${parts.join(", ")}`;
            banner.style.display = "block";
        } else {
            banner.style.display = "none";
        }
    }
}

// ── Volunteer Profile ────────────────────────────────
function loadProfile() {
    const name       = localStorage.getItem("volunteerName") || "Volunteer";
    const location   = localStorage.getItem("volunteerLocation") || "Not set";
    const donations  = getDonations();
    const deliveries = donations.filter(i => i.status === "Delivered").length;
    const points     = parseInt(localStorage.getItem("volunteerPoints")) || 0;

    const badge = points >= 100 ? "⭐ Champion"
                : points >= 50  ? "🤝 Reliable"
                :                 "🌱 Newcomer";

    if (document.getElementById("volunteerName"))
        document.getElementById("volunteerName").innerText = name;
    if (document.getElementById("volunteerLocation"))
        document.getElementById("volunteerLocation").innerText = "📍 " + location;
    if (document.getElementById("profilePoints"))
        document.getElementById("profilePoints").innerText = points;
    if (document.getElementById("totalDeliveries"))
        document.getElementById("totalDeliveries").innerText = deliveries;
    if (document.getElementById("volunteerBadge"))
        document.getElementById("volunteerBadge").innerText = badge;
}

function editProfile() {
    const name = prompt("Enter your name:", localStorage.getItem("volunteerName") || "");
    const loc  = prompt("Enter your area (e.g. Kochi):", localStorage.getItem("volunteerLocation") || "");
    if (name) localStorage.setItem("volunteerName", name);
    if (loc)  localStorage.setItem("volunteerLocation", loc);
    loadProfile();
    renderPickups();
}

// ── Dark Mode ────────────────────────────────────────
const darkToggle = document.getElementById("darkToggle");

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    if (darkToggle) darkToggle.textContent = "☀️";
}

if (darkToggle) {
    darkToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", isDark);
        darkToggle.textContent = isDark ? "☀️" : "🌙";
    });
}

// ── Volunteer storage event listener ─────────────────
window.addEventListener("storage", function(e) {
    if (e.key === "lastClaimed") {
        renderPickups();
    }
});

// ── Filters ──────────────────────────────────────────
document.getElementById("filterLocation")
    ?.addEventListener("input", renderFood);

document.getElementById("sortUrgency")
    ?.addEventListener("change", renderFood);

// ── Init ─────────────────────────────────────────────
removeExpired();
renderFood();
renderPickups();
renderAdmin();
renderImpact();
loadProfile();