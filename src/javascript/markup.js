let markup = `<header class="header">
    <div class="header--options">
      <input type="submit" name="refresh" alt="refresh" class="refresh" value=" ">
      <select>
        <option value="EN">EN</option>
        <option value="RU">RU</option>
        <option value="BE">BE</option>
      </select>
      <input type="submit" name="tempF" class="tempF" value="°F">
      <input type="submit" name="tempC" class="tempC" value="°C">
    </div>
    <div class="header--cityInput">
      <input type="text" name="city" placeholder="Search city">
      <input type="submit" name="search" class="search" value="search">
    </div>  </header>
    <main class="main">
      <div class="column left">
        <div class="location"></div>
        <div class="date"></div>
        <div class="currentWeather">
          <div class="currentWeather--temperature"></div>
          <div class="currentWeather--image"></div>
          <div class="currentWeather--overcast"></div>
        </div>
        <div class="weatherForecast">
          <div class="weatherForecast--days"></div>
          <div class="weatherForecast--images"></div>
          <div class="weatherForecast--temp"></div>
        </div>
        <div class="weatherForecast"></div>  
      </div>  
      <div class="column right">
        <div id="map"></div>
        <div class="coordinates"></div>
      </div> </main>`
export default markup;