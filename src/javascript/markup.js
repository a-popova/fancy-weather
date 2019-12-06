let markup = `
<header class="header">
    <div class="header--options">
      <input type="submit" name="refresh" alt="refresh" class="refresh" value=" ">
      <select>
        <option value="EN">EN</option>
        <option value="RU">RU</option>
        <option value="BE">BE</option>
      </select>
      <input type="submit" name="tempF" class="fahrenheit" value="°F">
      <input type="submit" name="tempC" class="celcius" value="°C">
    </div>
    <div class="header--cityInput">
      <input type="text" name="city" placeholder="Search city">
      <input type="submit" name="search" class="search" value="search">
    </div>  </header>
    <main class="main">
      <div class="column left">
        <div class="currentLocation">
          <div class="location"></div>
          <div class="date"></div>
        </div>
        <div class="currentWeather">
          <div class="currentWeather--temperature"></div>
          <div class="currentWeather--image"></div>
          <div class="currentWeather--description">
            <div class="description--summary"></div>
            <div class="description--apparentTemp"></div>
            <div class="description--wind"></div>
            <div class="description--humidity"></div>
          </div>
        </div>
        <div class="weatherForecast">
          <div class="weatherForecast--day1">
            <div class="weatherForecast--day1--weekday"></div>
            <div class="weatherForecast--day1--image"></div>
            <div class="weatherForecast--day1--temp"></div>
          </div>
          <div class="weatherForecast--day2">
            <div class="weatherForecast--day2--weekday"></div>
            <div class="weatherForecast--day2--image"></div>
            <div class="weatherForecast--day2--temp"></div>
          </div>
          <div class="weatherForecast--day3">
            <div class="weatherForecast--day3--weekday"></div>
            <div class="weatherForecast--day3--image"></div>
            <div class="weatherForecast--day3--temp"></div>
          </div>  
        </div> </div>  
      <div class="column right">
        <div id="map"></div>
        <div class="coordinates">
          <div class="latitude"></div>
          <div class="longitude"></div>
        </div>
      </div> </main>`
export default markup;