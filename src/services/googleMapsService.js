const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

const geocodeAddress = async (address) => {
  try {
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    console.log("✅ Google Geocoding Success:", response.data);

    const { lat, lng } = response.data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    console.error("❌ Google Geocoding Error:", error.response?.data || error.message);
    throw new Error("Geocoding failed");
  }
};

module.exports = { geocodeAddress };
