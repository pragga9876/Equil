// inside routes/activity.js (top imports)
const User = require("../models/user"); // ensure you already have this
// ... other imports

// Helper: update streak for a user when a new activity is recorded
async function updateUserStreak(userId, activityDate) {
  // activityDate may be Date or string
  const user = await User.findById(userId);
  if (!user) return null;

  const msPerDay = 24 * 60 * 60 * 1000;

  // normalize to date-only (UTC)
  const toDateOnly = d => {
    const dt = new Date(d);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  };

  const last = user.streak && user.streak.lastActivityAt ? toDateOnly(user.streak.lastActivityAt) : null;
  const today = toDateOnly(activityDate || new Date());

  if (!last) {
    // no previous activity -> start streak = 1
    user.streak.current = 1;
    user.streak.lastActivityAt = today;
  } else {
    const diffDays = Math.round((today - last) / msPerDay);
    if (diffDays === 0) {
      // already logged today — do nothing (don't increment)
    } else if (diffDays === 1) {
      // consecutive day -> increment streak
      user.streak.current = (user.streak.current || 0) + 1;
      user.streak.lastActivityAt = today;
    } else {
      // gap of >1 day -> reset streak to 1
      user.streak.current = 1;
      user.streak.lastActivityAt = today;
    }
  }

  // Save without strict validation issues
  await user.save({ validateBeforeSave: false });
  return user.streak;
}
module.exports = { updateUserStreak };