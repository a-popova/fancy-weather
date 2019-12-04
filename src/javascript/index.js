import '../sass/styles.scss';
import {ipinfoToken, openWeatherAPIkey, darkskyAPIkey, flickrAPIkey, flickrSecret, mapboxToken, opencagedataAPIkey} from './apikeys.js';
import {countryNames} from './countrynames.js';
import markup from './markup.js';
import icons from "./icons";

var latitude;
var longitude;
var date;
var celcius = true;
var fahrenheit = false;

window.onload = () => {
  let wrapper = document.querySelector(".wrapper");
  wrapper.innerHTML += markup;

  var day1 = document.querySelector('.weatherForecast--day1');
  var day2 = document.querySelector('.weatherForecast--day2');
  var day3 = document.querySelector('.weatherForecast--day3');

  let city = document.querySelector('.header--cityInput input[name=city]');
  let searchCityButton = document.querySelector('.header--cityInput input[class=search]');
  searchCityButton.addEventListener('click', () => {getLocationByCity(city.value);})

  let showFahrButton = document.querySelector('.tempF');
  showFahrButton.addEventListener('click', () => {fahrenheit = true; celcius = false; getForecast(latitude, longitude)});
  let showCelcButton = document.querySelector('.tempC');
  showCelcButton.addEventListener('click', () => {celcius = true; fahrenheit = false; getForecast(latitude, longitude)});

  mapboxgl.accessToken = mapboxToken;
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 10
  });

  function success(pos) {
    var crd = pos.coords;
    latitude = crd.latitude.toFixed(2);
    longitude = crd.longitude.toFixed(2);
    getForecast(latitude, longitude);
    getLocation();
    map.setCenter([longitude, latitude]);
    document.querySelector('.latitude').innerHTML = `Latitude: ${Math.trunc(latitude)}°`;
    document.querySelector('.longitude').innerHTML = `Longitude: ${longitude.toString().slice(3)}'`;

    /*var unixDate = new Date(pos.timestamp);
    let arr = unixDate.toString().split(" ");
    let date = `${arr[0]} ${arr[2]} ${arr[1]}`;
    let time = arr[4].slice(0, 5);
    document.querySelector('.date').innerHTML = `${date}  ${time}`;*/
  };
  
  navigator.geolocation.getCurrentPosition(success);

  async function getLocation(){
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencagedataAPIkey}&language=en`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    renderLocation(data);
  }

  function renderLocation(APIResponse) {
    let city = APIResponse.results[0].components.city;
    let country = APIResponse.results[0].components.country;
    showLocation(city, country);

    let timeZone = APIResponse.results[0].annotations.timezone.name;
    const utcDate1 = new Date();
    let localDate = utcDate1.toLocaleString({timeZone: `${timeZone}`});
    showDate(localDate);
  }

  function showLocation(city, country) {
    document.querySelector(".location").innerHTML = `${city}, ${country}`;
  }

  function showDate(date) {
    console.log(date);
  }

  async function getForecast(lat, lon){
    var proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    if (celcius) {
      var targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${lat},${lon}?lang=en&units=si`;
    } else {
      var targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${lat},${lon}?lang=en&units=us`;
    }

    try {
      const response = await fetch(proxyUrl + targetUrl);
      var data = await response.json();
    } catch (e) {
      console.error(e);
    }

    renderCurrentForecast(data);
    render3daysForecast(data);
  }

  function renderCurrentForecast(APIResponse) {
    let forecast = {};
    forecast.temperature = `${Math.round(APIResponse.currently.temperature)}°`;
    forecast.apparentTemp = `Feels like: ${Math.round(APIResponse.currently.apparentTemperature)}`;
    forecast.wind = `Wind: ${APIResponse.currently.windSpeed} m/s`;
    forecast.humidity = `Humidity: ${Math.round(APIResponse.currently.humidity * 100)}%`;
    let iconName = APIResponse.currently.icon;
    let iconURL = icons[iconName];
    forecast.iconURL = `url(/dist/${iconURL})`;

    showCurrentForecast(forecast);
  }

  function showCurrentForecast(forecast) {
    document.querySelector(".currentWeather--temperature").innerHTML = forecast.temperature;
    document.querySelector('.overcast--apparentTemp').innerHTML = forecast[apparentTemp];
    document.querySelector('.overcast--wind').innerHTML = forecast[wind];
    document.querySelector('.overcast--humidity').innerHTML = forecast[humidity];
    document.querySelector('.currentWeather--image').style.background = forecast.iconURL;
    document.querySelector('.currentWeather--image').style.backgroundSize = "cover";
  }

  function render3daysForecast(APIResponse) {
    let days = [APIResponse.daily.data[1], APIResponse.daily.data[2], APIResponse.daily.data[3]];
    let weekdaysNumbers = [];
    days.forEach(function(day){
        var unixDate = new Date(day.time * 1000);
        var weekDay = unixDate.getDay();
        weekdaysNumbers.push(weekDay);
    })

    renderWeekday(weekdaysNumbers);
    renderTemperature(APIResponse);
    renderWeatherIcons(APIResponse);
  }

  function renderWeekday (number) {
    let weekdaysTable = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }
    if (Array.isArray(number)) {
      for (let i = 1; i <= number.length; i++){
        let weekday = weekdaysTable[number[i-1]];
        document.querySelector(`.weatherForecast--day${i}--weekday`).innerHTML = weekday;
      }
    }
  }

  function renderTemperature(temperatureData){
    let temperature = {};
    let dayOne = temperatureData.daily.data[1];
    let dayTwo = temperatureData.daily.data[2];
    let dayThree = temperatureData.daily.data[3];
    temperature.day1 = Math.round((dayOne.temperatureMax + dayOne.temperatureMin) / 2);
    temperature.day2 = Math.round((dayTwo.temperatureMax + dayTwo.temperatureMin) / 2);
    temperature.day3 = Math.round((dayThree.temperatureMax + dayThree.temperatureMin) / 2);
    show3daysTemperature(temperature);
  }

  function renderWeatherIcons (forecast) {
    for (let i = 1; i <= 3; i++){
      iconName = forecast.daily.data[i].icon;
      iconURL = icons[iconName];
      document.querySelector(`.weatherForecast--day${i}--image`).style.background = `url(/dist/${iconURL})`;
      document.querySelector(`.weatherForecast--day${i}--image`).style.backgroundSize = "cover";
    }
  }

  function show3daysTemperature(temperature) {
    document.querySelector('.weatherForecast--day1--temp').innerHTML = temperature.day1;
    document.querySelector('.weatherForecast--day2--temp').innerHTML = temperature.day2;
    document.querySelector('.weatherForecast--day3--temp').innerHTML = temperature.day3;
  }

  loadImage();

  async function loadImage (){
    const baseUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrAPIkey}`;
    const params = `&tags=rain&per_page=1&format=json&nojsoncallback=1&extras=url_h`;
    const url = baseUrl + params;

    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    data = data.photos.photo[0];
    let imageURL = `https://farm${data.farm}.staticflickr.com/${data.server}/${data.id}_${data.secret}_b.jpg`;

    let imagecontainer = document.createElement("div");
    imagecontainer.style.background = `url(${imageURL}) no-repeat`;
  }

  async function getLocationByCity(cityInput){
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${cityInput}&key=${opencagedataAPIkey}&language=en`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
  }

  function renderData(){
    let city = data.results[0].components.city || data.results[0].components.state;
    let country = data.results[0].components.country;
    document.querySelector(".location").innerHTML = `${city}, ${country}`;

    latitude = data.results[0].geometry.lat;
    longitude = data.results[0].geometry.lng;
    map.setCenter([longitude, latitude]);
    document.querySelector('.latitude').innerHTML = `Latitude: ${Math.trunc(latitude)}°`;
    document.querySelector('.longitude').innerHTML = `Longitude: ${Math.trunc(longitude)}'`;

    const utcDate1 = new Date();
    let localDate = utcDate1.toLocaleString('en-US', {timeZone: "America/Los_Angeles"});
    
    let arr = localDate.split(" ");
    console.log(arr);
    let date = `${arr[0].slice(0, -1)} ${arr[1]} ${arr[2]}`;
    let time = arr[4].slice(0, 5);
    document.querySelector('.date').innerHTML = `${date}  ${time}`;

    getForecast(latitude, longitude);
  }

  
  /*async function getLocation(){
    const url = `https://ipinfo.io/json?token=${ipinfoToken}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    let city = data.city;
    let country = countryNames[data.country];
    document.querySelector(".currentWeather").innerHTML = `${city},${country}`;
  }*/

};

window.onbeforeunload = () => {
  
};
