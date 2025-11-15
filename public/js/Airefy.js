console.log("Airefy.js loaded");

const $ = (id) => document.getElementById(id);

// Inputs
const searchInput = $("searchInput");

// Main display
const place = $("h-current");
const updated = $("updated");
const pm25 = $("pm25");

// Breakdown matching EXACT EJS IDs
const b_pm25 = $("b_pm25");
const b_pm10 = $("b_pm10");
const b_no2 = $("b_no2");
const b_so2 = $("b_so2");
const b_o3 = $("b_o3");
const b_co = $("b_co");

// Health
const recs = $("recs");
const healthIntro = $("healthIntro");

// RESET
const resetBtn = $("resetBtn");

// Fetch AQI from backend
async function fetchAQI(q) {
  try {
    const res = await fetch(`/airefy/api/aqi?q=${q}`);
    const json = await res.json();

    if (!json.success) {
      alert(json.error);
      return;
    }

    const d = json.data;

    // MAIN DISPLAY
    place.textContent = d.label;
    updated.textContent = "Updated: " + new Date(d.updatedAt).toLocaleString();
    pm25.textContent = d.pm25;

    // BREAKDOWN (FIXED)
    b_pm25.textContent = d.breakdown.pm25;
    b_pm10.textContent = d.breakdown.pm10;
    b_no2.textContent = d.breakdown.no2;
    b_so2.textContent = d.breakdown.so2;
    b_o3.textContent = d.breakdown.o3;
    b_co.textContent = d.breakdown.co;

    // HEALTH
    loadRecommendations(d.pm25);

  } catch (err) {
    console.error(err);
    alert("Error fetching AQI");
  }
}

function loadRecommendations(pm) {
  recs.innerHTML = "";

  if (pm <= 50) {
    recs.innerHTML = `<li>Air quality is good. Enjoy outdoor activities.</li>`;
  } else if (pm <= 100) {
    recs.innerHTML = `<li>Moderate — sensitive groups reduce prolonged exertion.</li>`;
  } else if (pm <= 200) {
    recs.innerHTML = `<li>Unhealthy for sensitive groups — wear a mask.</li>`;
  } else {
    recs.innerHTML = `<li>Unhealthy — avoid outdoor activities.</li>`;
  }
}

// SEARCH
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let q = searchInput.value.trim();
    if (q) fetchAQI(q);
  }
});

// RESET
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  place.textContent = "—";
  updated.textContent = "—";
  pm25.textContent = "—";
  recs.innerHTML = "<li>Search a supported location to see recommendations.</li>";
});
const darkBtn = document.getElementById("darkBtn");

darkBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});
