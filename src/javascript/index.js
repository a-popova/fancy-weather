import '../sass/styles.scss';
import {
  ipinfoToken, darkskyAPIkey, flickrAPIkey, mapboxToken, opencagedataAPIkey,
} from './apikeys';
import markup from './markup';
import icons from './icons';
import Translator from './translator';

let latitude;
let longitude;
let timezone = 'Europe/Minsk';
let forecast = {};
let locationInfo;
const seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
let language = localStorage.getItem('lang') || 'en';
let temperatureType = localStorage.getItem('temp') || 'celcius';

window.onload = () => {
  const wrapper = document.querySelector('.wrapper');
  wrapper.innerHTML += markup;
  const imageWrapper = document.createElement('div');
  document.body.prepend(imageWrapper);
  imageWrapper.classList.add('image');

  const cityInput = document.querySelector('.header--cityInput input[name=city]');
  const searchCityButton = document.querySelector('.header--cityInput input[class=search]');
  const fahrButton = document.querySelector('.fahrenheit');
  const celcButton = document.querySelector('.celcius');

  mapboxgl.accessToken = mapboxToken;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 10,
  });

  function extractDate(timezoneFetched) {
    const utcDate = new Date();
    const localDate = utcDate.toLocaleString('be', { localeMatcher: 'best fit', timeZone: `${timezoneFetched}` });

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
      localDateArr,
    };
  }

  function showDate(utcDate, localDate) {
    const translator = new Translator(language);
    const weekday = translator.get(utcDate[0]);
    const date = `${weekday} ${utcDate[2]} ${utcDate[1]}`;
    const time = localDate[1].slice(0, 5);
    document.querySelector('.date').innerHTML = `${date}   ${time}`;
  }

  let updateTime = setInterval(() => {
    const dateInfo = extractDate(timezone);
    showDate(dateInfo.utcDateArr, dateInfo.localDateArr);
  }, 1000);

  function updateCoordinates(APIResponse) {
    latitude = APIResponse.results[0].geometry.lat;
    longitude = APIResponse.results[0].geometry.lng;
  }

  function updateMap(locationInfoObj) {
    map.setCenter([locationInfoObj.longitude, locationInfoObj.latitude]);
    const translator = new Translator(language);
    const latName = translator.get('lat');
    const lonName = translator.get('lon');
    document.querySelector('.latitude').innerHTML = `${latName}${Math.trunc(locationInfoObj.latitude)}°`;
    document.querySelector('.longitude').innerHTML = `${lonName}${Math.trunc(locationInfoObj.longitude)}'`;
  }

  function renderLocation(APIResponse) {
    const city = APIResponse.results[0].components.city || APIResponse.results[0].components.state;
    const { country } = APIResponse.results[0].components;

    document.querySelector('.location').innerHTML = `${city}, ${country}`;
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
    const translator = new Translator(language);
    const weekday = translator.get(weekdaysTable[weekDay]);
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

  function renderDaysForecast(days) {
    days.forEach((day, index) => {
      renderWeekday(day, index + 1);
      renderTemperature(day, index + 1);
      renderWeatherIcons(day, index + 1);
    });
  }

  function showCurrentForecast(forecastObj) {
    document.querySelector('.currentWeather--temperature').innerHTML = forecastObj.temperature;
    document.querySelector('.description--summary').innerHTML = forecastObj.summary;
    document.querySelector('.description--apparentTemp').innerHTML = forecastObj.apparentTemp;
    document.querySelector('.description--wind').innerHTML = forecastObj.wind;
    document.querySelector('.description--humidity').innerHTML = forecastObj.humidity;
    document.querySelector('.currentWeather--image').style.backgroundImage = forecastObj.iconURL;
    renderDaysForecast(forecastObj.days);
  }

  function highlightTempButton(trueButton, falseButton) {
    falseButton.classList.remove('highlighted');
    trueButton.classList.add('highlighted');
  }

  function extract3DayForecast(APIResponse) {
    return [APIResponse.daily.data[1], APIResponse.daily.data[2], APIResponse.daily.data[3]];
  }

  function extractForecastData(APIResponse) {
    const translator = new Translator(language);
    const tempFeels = translator.get('temp');
    const wind = translator.get('wind');
    const humidity = translator.get('hum');

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

  async function getForecast(locationInfoObj) {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    let targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${locationInfoObj.latitude},${locationInfoObj.longitude}?lang=${language}`;
    if (temperatureType === 'celcius') {
      targetUrl += '&units=si';
      highlightTempButton(celcButton, fahrButton);
    } else {
      targetUrl += '&units=us';
      highlightTempButton(fahrButton, celcButton);
    }

    let data;
    try {
      const response = await fetch(proxyUrl + targetUrl);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }

    return extractForecastData(data);
  }

  function extractImageUrl(APIResponse) {
    const imageNumber = Math.floor(Math.random() * APIResponse.photos.photo.length);
    const image = APIResponse.photos.photo[imageNumber];
    return image.url_o || image.url_h || `https://farm${image.farm}.staticflickr.com/${image.server}/${image.id}_${image.secret}_b.jpg`;
  }

  async function fetchFlickrImage(location, forecastObj) {
    const baseUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrAPIkey}`;
    const constantParams = '&geo_context=2&format=json&nojsoncallback=1&extras=url_o';
    const customParams = `&lat=${location.latitude}&lon=${location.longitude}&tags=${location.partOfDay},${location.season},${forecastObj.weatherState}`;
    const url = baseUrl + customParams + constantParams;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return {
        backgroundImageUrl: extractImageUrl(data),
      };
    } catch (e) {
      return console.error(e);
    }
  }

  function showImage(imageURL) {
    const image = document.querySelector('.image');
    image.style.backgroundImage = `url(${imageURL})`;
  }

  async function loadImage() {
    const imageData = await fetchFlickrImage(locationInfo, forecast);
    showImage(imageData.backgroundImageUrl);
  }

  async function processOpenCageDataResponse(APIResponse) {
    clearInterval(updateTime);
    if (APIResponse.results.length === 0) {
      window.alert("Invalid input. Please, try again!")
    } else {
      updateCoordinates(APIResponse);

    timezone = APIResponse.results[0].annotations.timezone.name;
    locationInfo = {
      ...extractDate(timezone),
      latitude,
      longitude,
    };

    forecast = await getForecast(locationInfo);
    const imageData = await fetchFlickrImage(locationInfo, forecast);
    await showImage(imageData.backgroundImageUrl);
    updateTime = setInterval(() => {
      const dateInfo = extractDate(timezone);
      showDate(dateInfo.utcDateArr, dateInfo.localDateArr);
    }, 1000);
    showCurrentForecast(forecast);
    renderLocation(APIResponse);
    updateMap(locationInfo);
    }
  }

  async function getLocationByCity(cityInputValue) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${cityInputValue}&key=${opencagedataAPIkey}&language=${language}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    processOpenCageDataResponse(data);
  }

  async function getPositionByIP() {
    const url = `https://ipinfo.io/json?token=${ipinfoToken}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    const { city } = data;

    getLocationByCity(city);
  }

  async function getLocationByCoordinates(lat, lon) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${opencagedataAPIkey}&language=${language}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    processOpenCageDataResponse(data);
  }

  async function success(pos) {
    const crd = pos.coords;
    latitude = crd.latitude.toFixed(2);
    longitude = crd.longitude.toFixed(2);
    await getLocationByCoordinates(latitude, longitude);
  }

  navigator.geolocation.getCurrentPosition(success, getPositionByIP);

  function recogniseSpeech() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.addEventListener('result', async (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join(' ');

      cityInput.value = transcript;
      await getLocationByCity(cityInput.value);
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();
  }

  cityInput.addEventListener('click', () => recogniseSpeech());
  cityInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) {
      getLocationByCity(cityInput.value);
    }
  });

  const languageButton = document.querySelector('select[class=languages]');

  async function languageHandler() {
    language = languageButton.value.toLowerCase();
    localStorage.setItem('lang', language);
    await getLocationByCoordinates(latitude, longitude);
  }

  languageButton.addEventListener('change', () => { languageHandler(); });
  languageButton.value = language.toUpperCase();

  searchCityButton.addEventListener('click', () => { getLocationByCity(cityInput.value); cityInput.value = ''; });

  fahrButton.addEventListener('click', async () => { temperatureType = 'fahrenheit'; showCurrentForecast(await getForecast({ latitude, longitude })); });
  celcButton.addEventListener('click', async () => { temperatureType = 'celcius'; showCurrentForecast(await getForecast({ latitude, longitude })); });

  const refreshButton = document.querySelector('input[name=refresh]');
  refreshButton.addEventListener('click', () => { loadImage(); });
};

window.onbeforeunload = () => {
  localStorage.setItem('temp', temperatureType);
  localStorage.setItem('lang', language);
};
