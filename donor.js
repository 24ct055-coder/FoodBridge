const form = document.getElementById("donorForm");
let donorType = "individual";

function setDonorType(type) {
    donorType = type;
    document.getElementById("businessFields").style.display =
        type === "business" ? "block" : "none";
    document.getElementById("addItemBtn").style.display =
        type === "business" ? "block" : "none";
    document.getElementById("individualBtn").classList.toggle("active", type === "individual");
    document.getElementById("businessBtn").classList.toggle("active", type === "business");

    // Switch profile card
    document.getElementById("individualProfile").style.display =
        type === "individual" ? "flex" : "none";
    document.getElementById("businessProfile").style.display =
        type === "business" ? "flex" : "none";

    if (type === "business") updateBusinessProfile();
}

function addFoodRow() {
    const container = document.getElementById("foodItemsContainer");
    const row = document.createElement("div");
    row.className = "food-item-row";
    row.innerHTML = `
        <input type="text" class="foodNameInput" placeholder="Food Name" required>
        <input type="number" class="servesInput" placeholder="Serves" required>
        <select class="foodTypeInput">
            <option value="">Food Type</option>
            <option>Veg 🌿</option>
            <option>Non-Veg 🍗</option>
            <option>Bakery 🥐</option>
            <option>Packaged 📦</option>
        </select>
        <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(row);
}

function getDonations() {
    return JSON.parse(localStorage.getItem("donations")) || [];
}

function saveDonations(data) {
    localStorage.setItem("donations", JSON.stringify(data));
}

function renderDonations() {
    const list = document.getElementById("donationList");
    if (!list) return;

    const donations = getDonations();
    list.innerHTML = "";

    if (donations.length === 0) {
        list.innerHTML = "<p style='text-align:center;color:#888;'>No donations yet.</p>";
        return;
    }

    donations.forEach(d => {
        const div = document.createElement("div");
        div.className = "food-card" + (d.urgent ? " urgent" : "");
        div.innerHTML = `
            <p><strong>${d.foodName}</strong></p>
            <p>Serves: ${d.serves} people</p>
            <p>Location: ${d.location}</p>
            <p>Type: ${d.foodType}</p>
            <p>Expiry: ${new Date(d.expiry).toLocaleString()}</p>
            <p>Status: <span class="badge">${d.status}</span></p>
            ${d.donorType === "business" ? `<p>🏨 ${d.businessName} (${d.scheduleType})</p>` : ""}
            ${d.urgent ? '<span class="badge urgent">⚠ Urgent</span>' : ''}
        `;
        list.appendChild(div);
    });
}

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const location      = document.getElementById("location").value;
    const expiry        = document.getElementById("expiry").value;
    const contact       = document.getElementById("contact").value;
    const notes         = document.getElementById("notes").value;
    const packed        = document.getElementById("packed").checked;
    const stored        = document.getElementById("stored").checked;
    const prepared      = document.getElementById("prepared").checked;
    const businessName  = donorType === "business" ? document.getElementById("businessName").value : "";
    const scheduleType  = donorType === "business" ? document.getElementById("scheduleType").value : "";
    const preferredTime = donorType === "business" ? document.getElementById("preferredTime").value : "";

    // Business field validation
    if (donorType === "business") {
        if (!businessName) {
            alert("Please enter your business name.");
            return;
        }
        if (!preferredTime) {
            alert("Please enter your preferred pickup time.");
            return;
        }
    }

    if (!packed || !stored || !prepared) {
        alert("Please confirm all safety checklist items.");
        return;
    }

    const expiryDate = new Date(expiry);
    if (!expiry || isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        alert("Please enter a valid future date and time.");
        return;
    }

    const urgent = (expiryDate - new Date()) < 2 * 60 * 60 * 1000;

    // Collect all food rows
    const foodNames = document.querySelectorAll(".foodNameInput");
    const servesAll = document.querySelectorAll(".servesInput");
    const foodTypes = document.querySelectorAll(".foodTypeInput");

    const donations = getDonations();

    foodNames.forEach((nameInput, i) => {
        const donation = {
            id: Date.now() + i,
            donorType,
            businessName,
            scheduleType,
            preferredTime,
            foodName: nameInput.value,
            serves: servesAll[i].value,
            foodType: foodTypes[i].value,
            location,
            expiry,
            contact,
            notes,
            packed,
            stored,
            prepared,
            urgent,
            status: "Available"
        };
        donations.push(donation);
    });

    saveDonations(donations);

    if (donorType === "business" && scheduleType === "daily") {
        alert(`✅ ${foodNames.length} item(s) submitted! We'll remind you to post tomorrow's surplus.`);
        localStorage.setItem("donorSchedule", scheduleType);
        localStorage.setItem("lastPostedDate", new Date().toDateString());
    } else {
        alert(`✅ ${foodNames.length} item(s) submitted successfully!`);
    }
    const submittedType = donorType;

    form.reset();
    setDonorType("individual");

    // Reset food items container back to single row
    document.getElementById("foodItemsContainer").innerHTML = `
        <div class="food-item-row">
            <input type="text" class="foodNameInput" placeholder="Food Name" required>
            <input type="number" class="servesInput" placeholder="Serves" required>
            <select class="foodTypeInput">
                <option value="">Food Type</option>
                <option>Veg 🌿</option>
                <option>Non-Veg 🍗</option>
                <option>Bakery 🥐</option>
                <option>Packaged 📦</option>
            </select>
        </div>
    `;

    if (submittedType === "business") updateBusinessProfile(); // change donorType → submittedType
renderDonations();
});

renderDonations();

// Individual donor profile
function updateDonorProfile() {
    const trust = parseInt(localStorage.getItem("donorTrust")) || 0;
    const donations = getDonations().filter(d => d.donorType !== "business");
    const total = donations.length;

    const badge = trust >= 100 ? "🥇 Verified Donor"
                : trust >= 50  ? "🥈 Trusted Donor"
                :                "🥉 New Donor";

    if (document.getElementById("donorTrustScore"))
        document.getElementById("donorTrustScore").innerText = trust;
    if (document.getElementById("donorBadge"))
        document.getElementById("donorBadge").innerText = badge;
    if (document.getElementById("totalDonations"))
        document.getElementById("totalDonations").innerText = total;
}

// Business donor profile
function updateBusinessProfile() {
    const trust = parseInt(localStorage.getItem("businessTrust")) || 0;
    const donations = getDonations().filter(d => d.donorType === "business");
    const total = donations.length;
    const lastDonation = donations[donations.length - 1];

    const badge = trust >= 100 ? "🥇 Verified Partner"
                : trust >= 50  ? "🥈 Trusted Partner"
                :                "🥉 New Partner";

    if (document.getElementById("businessProfileName") && lastDonation)
        document.getElementById("businessProfileName").innerText = lastDonation.businessName;
    if (document.getElementById("businessTrustScore"))
        document.getElementById("businessTrustScore").innerText = trust;
    if (document.getElementById("businessBadge"))
        document.getElementById("businessBadge").innerText = badge;
    if (document.getElementById("businessTotalDonations"))
        document.getElementById("businessTotalDonations").innerText = total;
    if (document.getElementById("businessPickupTime") && lastDonation)
        document.getElementById("businessPickupTime").innerText = lastDonation.preferredTime || "-";
    if (document.getElementById("businessSchedule") && lastDonation) {
        const scheduleMap = {
            daily: "Usually donates daily",
            weekly: "Usually donates weekly",
            occasionally: "Donates occasionally"
        };
        document.getElementById("businessSchedule").innerText =
            scheduleMap[lastDonation.scheduleType] || "-";
    }
}

updateDonorProfile();

// Load business profile if business donations already exist
const existingBusinessDonations = getDonations().filter(d => d.donorType === "business");
if (existingBusinessDonations.length > 0) updateBusinessProfile();