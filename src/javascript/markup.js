let markup = `<div class="column left">
  <div class="options">
    <input type="submit" name="refresh" alt="refresh" class="refresh" value=" ">
    <select>
      <option value="EN">EN</option>
      <option value="RU">RU</option>
      <option value="BE">BE</option>
    </select>
    <input type="submit" name="tempF" class="tempF" value="°F">
    <input type="submit" name="tempC" class="tempC" value="°C">
  </div>
  <div class="location"></div>
  <div class="currentWeather">
    <div class="currentWeather--temperature"></div>
    <div class="currentWeather--image"></div>
    <div class="currentWeather--overcast"></div>
  </div>
  <div class="weatherForecast"></div>  </div>  
  <div class="column right">
    <div class="cityInput">
      <input type="text" name="city" placeholder="Search city">
      <input type="submit" name="search" class="search" value="search">
    </div>
    <div id="map"></div>
    <div class="coordinates"></div>
  </div>`
export default markup;