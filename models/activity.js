const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "User" ,
      required: true
    },
  type: { 
    type: String,
     enum: ["travel", "energy", "diet"], 
     required: true 
    },
    description: String,
  co2: { type: Number, default: 0 },
  mode: String,       // For travel
  distance: Number,   // For travel
  kwh: Number,        // For energy
  dietType: String,   // For diet
  co2: Number,
  date: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
