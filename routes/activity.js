const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { evaluateBadges } = require("../utils/badges");
const { updateUserStreak } = require("../utils/streak");

// CO₂ emission constants (in kg)
const FACTORS = {
  travel: { car: 0.21, bus: 0.05, train: 0.06, bike: 0.0, walk: 0.0 },
  energy: { electricity: 0.82 },
  diet: { nonveg: 6.9, vegetarian: 2.0, vegan: 1.5 }
};

// 🌱 Add new activity form
router.get("/activities/new", isLoggedIn, (req, res) => {
  res.render("activities/new", {
    title: "Add Activity | EcoTrack",
    pageCSS: ["activity"],
    currentUser: req.user
  });
});

// 🌱 Handle form submission
router.post("/activities", isLoggedIn, async (req, res) => {
  const { type } = req.body;
  let co2 = 0;

  try {
    const {
      calculateTravelCO2,
      calculateEnergyCO2,
      calculateDietCO2
    } = require("../utils/calculatecarbon");

    // 🧮 Calculate CO₂
    if (type === "travel") {
      const { mode, distance } = req.body;
      co2 = await calculateTravelCO2(distance, mode);
      await Activity.create({ user: req.user._id, type, mode, distance, co2 });
      // after Activity.create(...) call (for any type)
      // e.g., after await Activity.create(...)
      await updateUserStreak(req.user._id, new Date()); // use activity.date if you set custom date

    } 
    else if (type === "energy") {
      const { kwh } = req.body;
      co2 = await calculateEnergyCO2(kwh);
      await Activity.create({ user: req.user._id, type, kwh, co2 });
      await updateUserStreak(req.user._id, new Date()); // use activity.date if you set custom date
    } 
    else if (type === "diet") {
      const { dietType } = req.body;
      co2 = await calculateDietCO2(dietType);
      await Activity.create({ user: req.user._id, type, dietType, co2 });
      await updateUserStreak(req.user._id, new Date()); // use activity.date if you set custom date
    }

    // 🏅 Badge Evaluation
    const user = await User.findById(req.user._id);

    // ✅ ensure username before saving
    if (!user.username && user.email) {
      user.username = user.email.split("@")[0];
    } else if (!user.username) {
      user.username = "User_" + Math.floor(Math.random() * 10000);
    }

    const newly = await evaluateBadges(user, Activity);

    if (newly && newly.length) {
      newly.forEach(nb => user.badges.push(nb));
      user.badgesEarned = user.badges.length;
    }

    // ✅ Safe save (prevents crash from validation)
    await user.save({ validateBeforeSave: false });

    req.flash("success", `✅ Activity added successfully! CO₂ = ${co2.toFixed(2)} kg`);
    res.redirect("/dashboard");

  } catch (err) {
    console.error("Activity save error:", err);
    req.flash("error", "⚠️ Error saving activity. Please try again.");
    res.redirect("/activities/new");
  }
});

// 🌱 Dashboard route
router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id }).sort({ date: -1 });

    const totals = { travel: 0, energy: 0, diet: 0, total: 0 };
    activities.forEach(a => {
      totals[a.type] += a.co2 || 0;
      totals.total += a.co2 || 0;
    });

    const apiOnline = req.session.apiOnline ?? true;
    req.session.apiOnline = null;

    // 📅 Last 7 days activities
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyActivities = activities.filter(a => a.date >= oneWeekAgo);
    const weeklyCO2 = weeklyActivities.reduce((sum, a) => sum + (a.co2 || 0), 0);

    const topType = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
    let ecoTip = "🌿 Keep tracking your activities!";
    if (topType === "travel") ecoTip = "🚗 Try walking, biking, or using public transport!";
    else if (topType === "energy") ecoTip = "💡 Reduce energy — unplug unused devices!";
    else if (topType === "diet") ecoTip = "🥗 Great job! Plant-based meals lower CO₂!";

    res.render("activities/dashboard", {
      title: "Dashboard | EcoTrack",
      pageCSS: ["dashboard"],
      currentUser: req.user,
      activities,
      totals,
      ecoTip,
      apiOnline,
      topType,
      weeklyCO2
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    req.flash("error", "⚠️ Failed to load dashboard");
    res.redirect("/");
  }
});

module.exports = router;
