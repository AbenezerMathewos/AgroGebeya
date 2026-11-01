// Weather data for Ethiopian agricultural regions
const WEATHER_DATA = {
  'Addis Ababa': {
    temp: 18,
    condition: 'Sunny',
    humidity: 45,
    wind: '15 km/h',
    rainChance: 5,
    agronomicTip: 'Ideal conditions for crop transportation, terminal trading, and drying grains.',
  },
  'Adama': {
    temp: 25,
    condition: 'Clear Sky',
    humidity: 50,
    wind: '14 km/h',
    rainChance: 10,
    agronomicTip: 'Favorable conditions for grain transit through the central rift corridor.',
  },
  'Bahir Dar': {
    temp: 23,
    condition: 'Partly Cloudy',
    humidity: 58,
    wind: '11 km/h',
    rainChance: 25,
    agronomicTip: 'Good weeding weather in the Tana basin; monitor Teff fields for rust.',
  },
  'Jimma': {
    temp: 22,
    condition: 'Rain Showers',
    humidity: 85,
    wind: '8 km/h',
    rainChance: 80,
    agronomicTip: 'High moisture. Delay coffee pruning and check for Coffee Berry Disease.',
  },
  'Hawassa': {
    temp: 26,
    condition: 'Clear Sky',
    humidity: 55,
    wind: '10 km/h',
    rainChance: 10,
    agronomicTip: 'Optimal temperature for maize growth. Ensure adequate irrigation.',
  },
  'Wolaita Sodo': {
    temp: 24,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: '12 km/h',
    rainChance: 20,
    agronomicTip: 'Good weather for weeding. Monitor ginger beds and enset plantations.',
  },
  'Mekelle': {
    temp: 21,
    condition: 'Sunny',
    humidity: 40,
    wind: '16 km/h',
    rainChance: 5,
    agronomicTip: 'Dry and sunny. Conserve soil moisture in pulse and cereal plots.',
  },
  'Default': {
    temp: 23,
    condition: 'Partly Cloudy',
    humidity: 60,
    wind: '10 km/h',
    rainChance: 15,
    agronomicTip: 'Stable conditions across the corridor. Continue regular field scouting.',
  }
};

// @route   GET /api/weather
// @desc    Get weather forecast for a region
// @access  Public
exports.getWeatherForecast = (req, res) => {
  try {
    const region = req.query.region || 'Addis Ababa';
    
    // Find matching region or fallback to Default
    let forecast = WEATHER_DATA['Default'];
    for (const key of Object.keys(WEATHER_DATA)) {
      if (region.toLowerCase().includes(key.toLowerCase())) {
        forecast = WEATHER_DATA[key];
        break;
      }
    }

    res.json({
      success: true,
      region: region,
      weather: forecast
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch weather data', error: error.message });
  }
};
