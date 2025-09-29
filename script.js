const API_KEY = "011c73e412617423301a14490faab027"; // Replace with your own key
const weatherInfo = document.getElementById("weatherInfo");
const forecastContainer = document.getElementById("forecast");
const searchList = document.getElementById("searchList");
const loadingElement = document.getElementById("loading");

// Store search history in localStorage
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

// Current temperature unit (true for Celsius, false for Fahrenheit)
let isCelsius = true;

// Display search history on page load
document.addEventListener('DOMContentLoaded', function() {
  displaySearchHistory();
});

function showLoading() {
  loadingElement.classList.remove('hidden');
}

function hideLoading() {
  loadingElement.classList.add('hidden');
}

function getWeatherByCity() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  showLoading();
  
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("City not found");
      return res.json();
    })
    .then(data => {
      displayWeather(data);
      addToSearchHistory(city);
      // Get forecast after current weather
      return getForecastByCity(city);
    })
    .catch((err) => {
      showError(`Error: ${err.message}`);
    })
    .finally(() => {
      hideLoading();
    });
}

function getForecastByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Forecast not available");
      return res.json();
    })
    .then(data => {
      displayForecast(data);
    })
    .catch(err => {
      console.log("Forecast error:", err.message);
      // Don't show error for forecast as it's secondary
    });
}

function getWeatherByCoords(lat, lon) {
  showLoading();
  
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    })
    .then(data => {
      displayWeather(data);
      // Get forecast after current weather
      return getForecastByCoords(lat, lon);
    })
    .catch((err) => {
      showError(`Error: ${err.message}`);
    })
    .finally(() => {
      hideLoading();
    });
}

function getForecastByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Forecast not available");
      return res.json();
    })
    .then(data => {
      displayForecast(data);
    })
    .catch(err => {
      console.log("Forecast error:", err.message);
      // Don't show error for forecast as it's secondary
    });
}

function getWeatherByLocation() {
  if ("geolocation" in navigator) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        hideLoading();
        showError(`Geolocation failed: ${error.message}`);
      }
    );
  } else {
    showError("Your browser doesn't support geolocation.");
  }
}

function displayWeather(data) {
  const { name, sys, weather, main } = data;
  const icon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
  
  // Convert temperature based on current unit setting
  const temp = isCelsius ? Math.round(main.temp) : Math.round((main.temp * 9/5) + 32);
  const feelsLike = isCelsius ? Math.round(main.feels_like) : Math.round((main.feels_like * 9/5) + 32);
  const tempUnit = isCelsius ? "°C" : "°F";
  
  weatherInfo.innerHTML = `
    <h2>${name}, ${sys.country}</h2>
    <img src="${icon}" alt="${weather[0].description}" class="weather-icon" />
    <p><strong>${weather[0].main}</strong> - ${weather[0].description}</p>
    
    <div class="weather-details">
      <div class="detail-card">
        <i class="fas fa-thermometer-half"></i>
        <h3>Temperature</h3>
        <p>${temp}${tempUnit}</p>
      </div>
      
      <div class="detail-card">
        <i class="fas fa-temperature-low"></i>
        <h3>Feels Like</h3>
        <p>${feelsLike}${tempUnit}</p>
      </div>
      
      <div class="detail-card">
        <i class="fas fa-tint"></i>
        <h3>Humidity</h3>
        <p>${main.humidity}%</p>
      </div>
      
      <div class="detail-card">
        <i class="fas fa-wind"></i>
        <h3>Pressure</h3>
        <p>${main.pressure} hPa</p>
      </div>
    </div>
  `;
}

function displayForecast(data) {
  // Process forecast data to get daily forecasts
  const dailyForecasts = {};
  
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toDateString();
    
    // Only take one forecast per day (at around noon)
    if (!dailyForecasts[day] && date.getHours() >= 11 && date.getHours() <= 14) {
      dailyForecasts[day] = item;
    }
  });
  
  // Convert to array and limit to 5 days
  const forecastArray = Object.values(dailyForecasts).slice(0, 5);
  
  let forecastHTML = '';
  
  forecastArray.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
    
    // Convert temperature based on current unit setting
    const temp = isCelsius ? Math.round(item.main.temp) : Math.round((item.main.temp * 9/5) + 32);
    const tempUnit = isCelsius ? "°C" : "°F";
    
    forecastHTML += `
      <div class="forecast-card">
        <div class="forecast-date">${dayName}<br>${dateStr}</div>
        <img src="${icon}" alt="${item.weather[0].description}" class="forecast-icon" />
        <div class="forecast-temp">${temp}${tempUnit}</div>
        <div class="forecast-desc">${item.weather[0].main}</div>
      </div>
    `;
  });
  
  forecastContainer.innerHTML = forecastHTML;
}

function toggleUnit() {
  isCelsius = !isCelsius;
  const toggleBtn = document.getElementById("toggleUnitBtn");
  toggleBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Switch to ${isCelsius ? "°F" : "°C"}`;
  
  // Show a message to the user
  showMessage(`Temperature unit switched to ${isCelsius ? "Celsius" : "Fahrenheit"}`);
  
  // If we have displayed weather data, we need to refresh it with the new units
  // For simplicity in this implementation, we'll just show a message
  // In a more advanced implementation, we would store the current weather data and re-render it
}

function addToSearchHistory(city) {
  // Remove if already exists to avoid duplicates
  searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
  
  // Add to the beginning of the array
  searchHistory.unshift(city);
  
  // Keep only the last 10 searches
  if (searchHistory.length > 10) {
    searchHistory.pop();
  }
  
  // Save to localStorage
  localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
  
  // Update the display
  displaySearchHistory();
}

function displaySearchHistory() {
  if (searchHistory.length === 0) {
    searchList.innerHTML = '<li>No recent searches</li>';
    return;
  }
  
  searchList.innerHTML = '';
  searchHistory.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => {
      document.getElementById("city").value = city;
      getWeatherByCity();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      removeFromSearchHistory(city);
    };
    
    li.appendChild(deleteBtn);
    searchList.appendChild(li);
  });
}

function removeFromSearchHistory(city) {
  searchHistory = searchHistory.filter(item => item !== city);
  localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
  displaySearchHistory();
}

function showError(message) {
  weatherInfo.innerHTML = `<div class="error-message">${message}</div>`;
}

function showMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = message;
  
  // Insert the message after the search section
  const searchSection = document.querySelector('.search-section');
  searchSection.parentNode.insertBefore(messageElement, searchSection.nextSibling);
  
  // Remove the message after 3 seconds
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
  }, 3000);
}