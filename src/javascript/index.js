import '../sass/styles.scss';
import {ipinfoToken, openWeatherAPIkey, darkskyAPIkey, flickrAPIkey, flickrSecret, mapboxToken, opencagedataAPIkey} from './apikeys.js';
import {countryNames} from './countrynames.js';
import markup from './markup.js';
import icons from "./icons";
import { type } from 'os';

var latitude;
var longitude;
var location;
var timezone = 'Europe/Minsk';
var date;
var isCelcius = true;
var isFahrenheit = false;
var season;
var seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
var partOfDay;
var weatherState;

window.onload = () => {
  let wrapper = document.querySelector(".wrapper");
  wrapper.innerHTML += markup;
  let image = document.createElement("div");
  document.body.prepend(image);
  image.classList.add("image");

  var day1 = document.querySelector('.weatherForecast--day1');
  var day2 = document.querySelector('.weatherForecast--day2');
  var day3 = document.querySelector('.weatherForecast--day3');

  let city = document.querySelector('.header--cityInput input[name=city]');
  let searchCityButton = document.querySelector('.header--cityInput input[class=search]');
  searchCityButton.addEventListener('click', () => {getLocationByCity(city.value); city.value = ""; })

  let fahrButton = document.querySelector('.fahrenheit');
  fahrButton.addEventListener('click', () => {isFahrenheit = true; isCelcius = false; getForecast(latitude, longitude)});
  let celcButton = document.querySelector('.celcius');
  celcButton.addEventListener('click', () => {isCelcius = true; isFahrenheit = false; getForecast(latitude, longitude)});

  let refreshButton = document.querySelector('input[name=refresh]');
  refreshButton.addEventListener('click', () => {loadImage(weatherState);});

  setInterval(function() {
    renderDate(timezone);
  }, 1000);

  mapboxgl.accessToken = mapboxToken;
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 10
  });

  async function success(pos) {
    var crd = pos.coords;
    latitude = crd.latitude.toFixed(2);
    longitude = crd.longitude.toFixed(2);
    map.setCenter([longitude, latitude]);
    await getLocation();
    await getForecast(latitude, longitude);
    document.querySelector('.latitude').innerHTML = `Latitude: ${Math.trunc(latitude)}°`;
    document.querySelector('.longitude').innerHTML = `Longitude: ${longitude.toString().slice(3)}'`;
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
    timezone = data.results[0].annotations.timezone.name;
    renderLocation(data);
    renderDate(timezone);

    // data = {
    //   city: 'Los Angeles',
    //   country: 'United States',
    //   timezone: 'Europe/Minsk'
    // }

    // renderLocation(data);
    // renderDate(data.timezone);
  }

  function renderLocation(APIResponse) {
    let city = APIResponse.results[0].components.city || APIResponse.results[0].components.state;
    let country = APIResponse.results[0].components.country;

    // let city = APIResponse.city;
    // let country = APIResponse.country;

    location = `${city},${country}`;
    showLocation(city, country);
  }

  function showLocation(city, country) {
    document.querySelector(".location").innerHTML = `${city}, ${country}`;
  } 

  function renderDate(timezone) {
    const utcDate = new Date(); 
    let localDate = utcDate.toLocaleString('auto', {localeMatcher: "best fit", timeZone: `${timezone}`});

    let utcDateString = utcDate.toString();
    let utcDateArr = utcDateString.split(" ");
    let localDateArr = localDate.split(" ");
    showDate(utcDateArr, localDateArr);

    let month = localDateArr[0][3] + localDateArr[0][4];
    season = seasons[month - 1];

    let hour = Number(localDateArr[1][0] + localDateArr[1][1]);
    switch (true) {
      case hour >= 5 && hour < 12:
        partOfDay = 'morning';
        break;
      case hour >= 12 && hour < 17:
        partOfDay = 'afternoon';
        break;
      case hour >= 17 && hour < 21:
        partOfDay = 'evening';
        break;
      case hour >= 21 || hour < 5:
        partOfDay = 'night';
        break;
      default:
        partOfDay = 'afternoon'; 
    }
  }

  function showDate(utcDate, localDate) {
    let date = `${utcDate[0]} ${utcDate[2]} ${utcDate[1]}`;
    let time = localDate[1].slice(0, 5);
    document.querySelector('.date').innerHTML = `${date}   ${time}`;
  }

  async function getForecast(lat, lon){
    var proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    if (isCelcius) {
      var targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${lat},${lon}?lang=en&units=si`;
      highlightTempButton(celcButton, fahrButton);
    } else {
      var targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${latitude},${longitude}?lang=en&units=us`;
      highlightTempButton(fahrButton, celcButton);
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

  function highlightTempButton(trueButton, falseButton) {
    falseButton.classList.remove("highlighted");
    trueButton.classList.add("highlighted");
  }

  function renderCurrentForecast(APIResponse) {
    let forecast = {};
    forecast.temperature = `${Math.round(APIResponse.currently.temperature)}°`;
    forecast.summary = `${APIResponse.currently.summary}`;
    forecast.apparentTemp = `Feels like: ${Math.round(APIResponse.currently.apparentTemperature)}°`;
    forecast.wind = `Wind: ${APIResponse.currently.windSpeed} m/s`;
    forecast.humidity = `Humidity: ${Math.round(APIResponse.currently.humidity * 100)}%`;
    weatherState = APIResponse.currently.icon;
    let iconURL = icons[weatherState];
    forecast.iconURL = `url(/dist/${iconURL})`;

    loadImage(weatherState);
    showCurrentForecast(forecast);
  }

  function showCurrentForecast(forecast) {
    document.querySelector(".currentWeather--temperature").innerHTML = forecast.temperature;
    document.querySelector('.description--summary').innerHTML = forecast.summary;
    document.querySelector('.description--apparentTemp').innerHTML = forecast.apparentTemp;
    document.querySelector('.description--wind').innerHTML = forecast.wind;
    document.querySelector('.description--humidity').innerHTML = forecast.humidity;
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
    let iconName;
    let iconURL;
    for (let i = 1; i <= 3; i++){
      iconName = forecast.daily.data[i].icon;
      iconURL = icons[iconName];
      document.querySelector(`.weatherForecast--day${i}--image`).style.background = `url(/dist/${iconURL})`;
      document.querySelector(`.weatherForecast--day${i}--image`).style.backgroundSize = "cover";
    }
  }

  function show3daysTemperature(temperature) {
    document.querySelector('.weatherForecast--day1--temp').innerHTML = `${temperature.day1}°`;
    document.querySelector('.weatherForecast--day2--temp').innerHTML = `${temperature.day2}°`;
    document.querySelector('.weatherForecast--day3--temp').innerHTML = `${temperature.day3}°`;
  }

  async function loadImage(tag) {
    const baseUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrAPIkey}`;
    const params = `&lat=${latitude}&lon=${longitude}&tags=${partOfDay},${season},${tag}&geo_context=2&format=json&nojsoncallback=1&extras=url_o`;
    const url = baseUrl + params;

    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    
    renderImage(data);
  }

  function renderImage(APIResponse) {
    let imageNumber = Math.floor(Math.random() * APIResponse.photos.photo.length);
    let image = APIResponse.photos.photo[imageNumber];
    let url = image.url_o || image.url_h || `https://farm${image.farm}.staticflickr.com/${image.server}/${image.id}_${image.secret}_b.jpg`;

    showImage(url);
  }

  function showImage(imageURL) {
    let image = document.querySelector('.image');
    image.style.backgroundImage = `url(${imageURL})`;
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
    timezone = data.results[0].annotations.timezone.name;

    renderLocation(data);
    renderCoordinates(data);
    renderDate(timezone);
  }

  function renderCoordinates(APIResponse) {
    latitude = APIResponse.results[0].geometry.lat;
    longitude = APIResponse.results[0].geometry.lng;
    map.setCenter([longitude, latitude]);

    document.querySelector('.latitude').innerHTML = `Latitude: ${Math.trunc(latitude)}°`;
    document.querySelector('.longitude').innerHTML = `Longitude: ${Math.trunc(longitude)}'`;

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
