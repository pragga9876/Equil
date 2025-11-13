const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const badgeSchema = new mongoose.Schema({
  id: String,           // short id e.g. 'green_beginner'
  name: String,         // display name
  description: String,
  earnedAt: Date
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
       default: function () {
      if (this.email) return this.email.split("@")[0];
      return "User_" + Math.floor(Math.random() * 10000);
    }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    badgesEarned: {
      type: Number,
      default: 0,
    },
    badges: { type: [badgeSchema], default: [] },
    points: { type: Number, default: 0 }, // <-- new field
     streak: {
    current: { type: Number, default: 0 },      // current active streak count (days)
    lastActivityAt: { type: Date, default: null } // last day when user logged an activity
  },
  weeklyCO2Cache: { type: Number, default: 0 },
  lastQuizAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
  },
  
  { timestamps: true } // ✅ adds createdAt and updatedAt automatically
);
// ✅ Ensure username always exists before saving
userSchema.pre("save", function (next) {
  if (!this.username && this.email) {
    this.username = this.email.split("@")[0];
  } else if (!this.username) {
    this.username = "User_" + Math.floor(Math.random() * 10000);
  }
  next();
});

// Passport plugin to handle hashing & authentication
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);
