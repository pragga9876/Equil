// ✅ utils/badges.js — improved & safe badge evaluation

const BADGE_DEFS = [
  {
    id: "green_beginner",
    name: "🪴 Green Beginner",
    description: "Log 5 activities to earn this badge.",
    type: "count",
    key: "totalActivities",
    threshold: 5,
  },
  {
    id: "eco_explorer",
    name: "🚴 Eco Explorer",
    description: "Reduce travel emissions by 20% compared to your first week.",
    type: "relative_reduction",
    key: "travel",
    thresholdPercent: 20,
  },
  {
    id: "energy_saver",
    name: "⚡ Energy Saver",
    description: "Have 3 energy entries under 1 kWh.",
    type: "energy_low_entries",
    key: "energy",
    thresholdCount: 3,
  },
];

// ✅ Check if a user already has the badge
function hasBadge(user, badgeId) {
  if (!user || !Array.isArray(user.badges)) return false;
  return user.badges.some((b) => b.id === badgeId);
}

// ✅ Safely evaluate badges (avoids undefined user/activities)
async function evaluateBadges(user, Activity) {
  const newlyEarned = [];

  // ⛔ Return early if user or Activity model missing
  if (!user || !user._id || !Activity) return newlyEarned;

  // Get all activities for this user
  const activities = await Activity.find({ user: user._id }).catch(() => []);
  if (!Array.isArray(activities)) return newlyEarned;

  // Aggregates
  const agg = {
    totalActivities: activities.length || 0,
    travelEmitted: 0,
    energyEntries: [],
    firstWeekTravel: 0,
  };

  activities.forEach((a) => {
    if (a.type === "travel") agg.travelEmitted += a.co2 || 0;
    if (a.type === "energy") agg.energyEntries.push(a);
  });

  // Compute travel emissions in user's first week
  const joined = user.createdAt || user._id?.getTimestamp?.() || new Date();
  const oneWeekAfterJoin = new Date(joined);
  oneWeekAfterJoin.setDate(oneWeekAfterJoin.getDate() + 7);

  agg.firstWeekTravel = activities
    .filter((a) => a.type === "travel" && a.date && a.date <= oneWeekAfterJoin)
    .reduce((sum, a) => sum + (a.co2 || 0), 0);

  // ✅ Evaluate each badge definition
  for (const def of BADGE_DEFS) {
    // Skip if already earned
    if (hasBadge(user, def.id)) continue;

    switch (def.type) {
      case "count":
        if (agg[def.key] >= def.threshold) {
          newlyEarned.push({
            id: def.id,
            name: def.name,
            description: def.description,
            earnedAt: new Date(),
          });
        }
        break;

      case "relative_reduction":
        const baseline = agg.firstWeekTravel;
        if (baseline > 0) {
          const reductionPercent =
            ((baseline - agg.travelEmitted) / baseline) * 100;
          if (reductionPercent >= def.thresholdPercent) {
            newlyEarned.push({
              id: def.id,
              name: def.name,
              description: def.description,
              earnedAt: new Date(),
            });
          }
        }
        break;

      case "energy_low_entries":
        const lowCount = agg.energyEntries.filter((e) => (e.kwh || 0) < 1).length;
        if (lowCount >= def.thresholdCount) {
          newlyEarned.push({
            id: def.id,
            name: def.name,
            description: def.description,
            earnedAt: new Date(),
          });
        }
        break;
    }
  }

  return newlyEarned;
}

module.exports = {
  BADGE_DEFS,
  hasBadge,
  evaluateBadges,
};
