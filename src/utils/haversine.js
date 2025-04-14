const haversine = require('haversine-distance');

const isNearby = (point1, point2, range = 7000) => {
    const distance = haversine(point1, point2);
    return distance <= range;
  };
  
module.exports = { isNearby };
