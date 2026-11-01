import { useEffect, useState } from 'react';
import { weatherService } from '../services/weatherService';
import { useAuth } from '../context/AuthContext';

export default function WeatherWidget() {
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Use user's region/location if available, otherwise default to Addis Ababa (Central)
        const region = user?.region || user?.location || 'Addis Ababa';
        const data = await weatherService.getForecast(region);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to fetch weather', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [user]);

  if (loading) {
    return <div className="weather-widget loading">Loading local weather...</div>;
  }

  if (!weatherData) return null;

  const { weather, region } = weatherData;

  const getIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'clear sky': return '🌤️';
      case 'partly cloudy': return '⛅';
      case 'rain showers': return '🌧️';
      default: return '☁️';
    }
  };

  return (
    <div className="weather-widget card" style={{ padding: '1rem', background: 'linear-gradient(to right, #e0f7fa, #b2ebf2)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '3rem' }}>
        {getIcon(weather.condition)}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 0.25rem 0', color: '#006064' }}>{region} Weather</h3>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{weather.temp}°C, {weather.condition}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#00838f' }}>
          <span>💧 Humidity: {weather.humidity}%</span>
          <span>🌬️ Wind: {weather.wind}</span>
          <span>☔ Rain: {weather.rainChance}%</span>
        </div>
      </div>
      <div style={{ maxWidth: '250px', background: 'rgba(255,255,255,0.7)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', borderLeft: '4px solid #00acc1' }}>
        <strong>🌱 Agronomic Tip:</strong><br />
        {weather.agronomicTip}
      </div>
    </div>
  );
}
