// src/models/Bus.js
const mongoose = require('mongoose');

const routePointSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number
});

const busSchema = new mongoose.Schema({
  ownerName: String,
  destinationUniversity: String,
  route: [routePointSchema]
});

module.exports = mongoose.model('Bus', busSchema);
