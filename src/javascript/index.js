import '../sass/styles.scss';
import { type } from 'os';
import {
  ipinfoToken, darkskyAPIkey, flickrAPIkey, mapboxToken, opencagedataAPIkey 
} from './apikeys.js';
import markup from './markup.js';
import icons from './icons';
import Translator from './translator';

let latitude;
let longitude;
let location;
let timezone = 'Europe/Minsk';
let date;
let forecast;
let locationInfo;
const seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
let language = localStorage.getItem('lang') || 'en';
let temperatureType = localStorage.getItem('temp') || 'celcius'; 

window.onload = () => {

  const wrapper = document.querySelector('.wrapper');
  wrapper.innerHTML += markup;
  const image = document.createElement('div');
  document.body.prepend(image);
  image.classList.add('image');

  const city = document.querySelector('.header--cityInput input[name=city]');
  city.addEventListener('click', recogniseSpeech);
  const searchCityButton = document.querySelector('.header--cityInput input[class=search]');
  searchCityButton.addEventListener('click', () => { getLocationByCity(city.value); city.value = ''; });

  let languageButton = document.querySelector('select[class=languages]');
  languageButton.addEventListener('change', () => { languageHandler(), false });
  languageButton.value = language.toUpperCase();

  const fahrButton = document.querySelector('.fahrenheit');
  fahrButton.addEventListener('click', async () => { temperatureType = 'fahrenheit'; showCurrentForecast(await getForecast({latitude, longitude})); });
  const celcButton = document.querySelector('.celcius');
  celcButton.addEventListener('click', async () => { temperatureType = 'celcius'; showCurrentForecast(await getForecast({latitude, longitude})); });

  const refreshButton = document.querySelector('input[name=refresh]');
  refreshButton.addEventListener('click', () => { loadImage(); });

  setInterval(() => {
    const dateInfo = extractDate(timezone);
    showDate(dateInfo.utcDateArr, dateInfo.localDateArr);
  }, 1000);

  async function languageHandler() {
    language = languageButton.value.toLowerCase();
    localStorage.setItem('lang', language);
    await getLocationByCoordinates(latitude, longitude);
  }

  mapboxgl.accessToken = mapboxToken;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 10,
  });

  async function success(pos) {
    if (pos) {
      const crd = pos.coords;
      const latitude = crd.latitude.toFixed(2);
      const longitude = crd.longitude.toFixed(2);
      await getLocationByCoordinates(latitude, longitude);
    } else {
      getPositionByIP();
    }
  }

  navigator.geolocation.getCurrentPosition(success);

  async function getLocationByCoordinates(latitude, longitude) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencagedataAPIkey}&language=${language}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    processOpenCageDataResponse(data);
  }

  async function getLocationByCity(cityInput) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${cityInput}&key=${opencagedataAPIkey}&language=${language}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    processOpenCageDataResponse(data);
  }

  async function processOpenCageDataResponse(APIResponse) {
    updateCoordinates(APIResponse);

    timezone = APIResponse.results[0].annotations.timezone.name;
    locationInfo = {
      ...extractDate(timezone),
      latitude,
      longitude,
    };
    
    forecast = await getForecast(locationInfo);
    const imageData = await fetchFlickrImage(locationInfo, forecast);
    showImage(imageData.backgroundImageUrl);  
    showCurrentForecast(forecast);
    renderLocation(APIResponse);
    updateMap(locationInfo);
  }

  function updateCoordinates(APIResponse) {
    latitude = APIResponse.results[0].geometry.lat;
    longitude = APIResponse.results[0].geometry.lng;
  }

  function updateMap(locationInfo) {
    map.setCenter([locationInfo.longitude, locationInfo.latitude]);
    let translator = new Translator(language);
    let latitude = translator.get('lat');
    let longitude = translator.get('lon');
    document.querySelector('.latitude').innerHTML = `${latitude}${Math.trunc(locationInfo.latitude)}°`;
    document.querySelector('.longitude').innerHTML = `${longitude}${Math.trunc(locationInfo.longitude)}'`;
  }

  function renderLocation(APIResponse) {
    const city = APIResponse.results[0].components.city || APIResponse.results[0].components.state;
    const { country } = APIResponse.results[0].components;

    location = `${city},${country}`;
    document.querySelector('.location').innerHTML = `${city}, ${country}`;
  }

  function extractDate(timezone) {
    const utcDate = new Date();
    const localDate = utcDate.toLocaleString('auto', { localeMatcher: 'best fit', timeZone: `${timezone}` });

    const utcDateString = utcDate.toString();
    const utcDateArr = utcDateString.split(' ');
    const localDateArr = localDate.split(' ');

    const month = localDateArr[0][3] + localDateArr[0][4];
    const season = seasons[month - 1];

    const hour = Number(localDateArr[1][0] + localDateArr[1][1]);
    let partOfDay;
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
    return {
      partOfDay, 
      season,
      utcDateArr,
      localDateArr
    };
  }

  function showDate(utcDate, localDate) {
    let translator = new Translator(language);
    let weekday = translator.get(utcDate[0]);
    const date = `${weekday} ${utcDate[2]} ${utcDate[1]}`;
    const time = localDate[1].slice(0, 5);
    document.querySelector('.date').innerHTML = `${date}   ${time}`;
  }

  async function getForecast(locationInfo) {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    let targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${locationInfo.latitude},${locationInfo.longitude}?lang=${language}`;
    if (temperatureType === 'celcius') {
      targetUrl += "&units=si";
      highlightTempButton(celcButton, fahrButton);
    } else {
      targetUrl += "&units=us";
      highlightTempButton(fahrButton, celcButton);
    }

    try {
      const response = await fetch(proxyUrl + targetUrl);
      var data = await response.json();
    } catch (e) {
      console.error(e);
    }

    return extractForecastData(data);
  }

  function highlightTempButton(trueButton, falseButton) {
    falseButton.classList.remove('highlighted');
    trueButton.classList.add('highlighted');
  }

  function extractForecastData(APIResponse) {
    let translator = new Translator(language);
    let tempFeels = translator.get('temp');
    let wind = translator.get('wind');
    let humidity = translator.get('hum');

    const forecast = {};
    forecast.temperature = `${Math.round(APIResponse.currently.temperature)}°`;
    forecast.summary = `${APIResponse.currently.summary}`;
    forecast.apparentTemp = `${tempFeels}${Math.round(APIResponse.currently.apparentTemperature)}°`;
    forecast.wind = `${wind}${APIResponse.currently.windSpeed} m/s`;
    forecast.humidity = `${humidity}${Math.round(APIResponse.currently.humidity * 100)}%`;
    forecast.weatherState = APIResponse.currently.icon;
    const iconURL = icons[forecast.weatherState];
    forecast.iconURL = `url(/dist/${iconURL})`;
    forecast.days = extract3DayForecast(APIResponse);
    return forecast;
  }

  function showCurrentForecast(forecast) {
    document.querySelector('.currentWeather--temperature').innerHTML = forecast.temperature;
    document.querySelector('.description--summary').innerHTML = forecast.summary;
    document.querySelector('.description--apparentTemp').innerHTML = forecast.apparentTemp;
    document.querySelector('.description--wind').innerHTML = forecast.wind;
    document.querySelector('.description--humidity').innerHTML = forecast.humidity;
    document.querySelector('.currentWeather--image').style.backgroundImage = forecast.iconURL;
    renderDaysForecast(forecast.days);
  }

  function extract3DayForecast(APIResponse) {
    return [APIResponse.daily.data[1], APIResponse.daily.data[2], APIResponse.daily.data[3]];
  }

  function renderDaysForecast(days) {
    days.forEach((day, index) => {
      renderWeekday(day, index + 1);
      renderTemperature(day, index + 1);
      renderWeatherIcons(day, index + 1);
    });
  }

  function renderWeekday(day, index) {
    const unixDate = new Date(day.time * 1000);
    const weekDay = unixDate.getDay();
    const weekdaysTable = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
    };
    let obj = new Translator(language);
    const weekday = obj.get(weekdaysTable[weekDay]);
    document.querySelector(`.weatherForecast--day${index}--weekday`).innerHTML = weekday;
  }

  function renderTemperature(day, index) {
    const temperature = Math.round((day.temperatureMax + day.temperatureMin) / 2);
    document.querySelector(`.weatherForecast--day${index}--temp`).innerHTML = `${temperature}°`;
  }

  function renderWeatherIcons(day, index) {
    const iconURL = icons[day.icon];
    document.querySelector(`.weatherForecast--day${index}--image`).style.backgroundImage = `url(/dist/${iconURL})`;
  }

  async function fetchFlickrImage(location, forecast) {
    const baseUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrAPIkey}`;
    const params = `&lat=${location.latitude}&lon=${location.longitude}&tags=${location.partOfDay},${location.season},${forecast.weatherState}&geo_context=2&format=json&nojsoncallback=1&extras=url_o`;
    const url = baseUrl + params;

    let data;
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        backgroundImageUrl: extractImageUrl(data)
      };
    } catch (e) {
      console.error(e);
    }
  }

  function extractImageUrl(APIResponse) {
    const imageNumber = Math.floor(Math.random() * APIResponse.photos.photo.length);
    const image = APIResponse.photos.photo[imageNumber];
    return image.url_o || image.url_h || `https://farm${image.farm}.staticflickr.com/${image.server}/${image.id}_${image.secret}_b.jpg`;
  }

  async function loadImage() {
    const imageData = await fetchFlickrImage(locationInfo, forecast);
    showImage(imageData.backgroundImageUrl);  
  }

  function showImage(imageURL) {
    const image = document.querySelector('.image');
    image.style.backgroundImage = `url(${imageURL})`;
  }

  async function getPositionByIP(){
    const url = `https://ipinfo.io/json?token=${ipinfoToken}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    let city = data.city;

    getLocationByCity(city);
  }

  function recogniseSpeech() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.addEventListener('result', async (event) => { 
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ') 

      await console.log(transcript);
      city.value = transcript;
      await getLocationByCity(city.value);
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();
  }
};

window.onbeforeunload = () => {
  localStorage.setItem('temp', temperatureType);
  localStorage.setItem('lang', language);
};
