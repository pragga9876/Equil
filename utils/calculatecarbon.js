module.exports = function calculateCarbon(data) {

  // ==========================
  // 1. TRAVEL
  // ==========================
  const t = data.travel || {};

  const travel =
    (parseFloat(t.carKm) || 0) * 0.21 +         // car (OK)
    (parseFloat(t.bikeKm) || 0) * 0.0 +         // bike = 0
    (parseFloat(t.busKm) || 0) * 0.05 +         // bus
    (parseFloat(t.trainKm) || 0) * 0.04 +       // train
    (parseFloat(t.flightHours) || 0) * 25;      // FIXED (25 kg/hour)


  // ==========================
  // 2. HOME ENERGY
  // ==========================
  const h = data.home || {};

  const home =
    (parseFloat(h.electricityKwh) || 0) * 0.82 +   // India avg
    (parseFloat(h.lpgCylinders) || 0) * 12.7 +     // FIXED LPG factor
    (parseFloat(h.waterUsage) || 0) * 0.0003;      // FIXED smaller factor


  // ==========================
  // 3. FOOD & DIET
  // ==========================
  const f = data.fooddiet || {};

  const dietFactors = {
    omnivore: 2.5,     // lower & realistic
    vegetarian: 1.7,
    vegan: 1.5,
  };

  // Meat impact (monthly realistic values)
  const meatScore =
    f.meatConsumption === "daily" ? 15 :
    f.meatConsumption === "weekly" ? 5 :
    1;

  const food =
    (dietFactors[f.dietType] || 2.3) * 20 +    // was ×30 → too big
    meatScore -
    ((parseFloat(f.localFoodPercentage) || 0) * 0.1); // smoother reduction


  // ==========================
  // 4. WASTE
  // ==========================
  const w = data.waste || {};

  const waste =
    (parseFloat(w.weeklyWasteKg) || 0) * 2 +      // FIXED smaller factor
    (w.recycle ? -5 : 0) +                        // was -10 (too big)
    (w.compost ? -7 : 0);                         // was -15 (too big)


  // ==========================
  // 5. TOTAL
  // ==========================
  const total = travel + home + food + waste;

  return {
    total: Number(total.toFixed(2)),
    breakdown: {
      travel: Number(travel.toFixed(2)),
      home: Number(home.toFixed(2)),
      food: Number(food.toFixed(2)),
      waste: Number(waste.toFixed(2)),
    }
  };
};
