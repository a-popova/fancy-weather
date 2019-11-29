import '../sass/styles.scss';
import {ipinfoToken, openWeatherAPIkey, darkskyAPIkey, flickrAPIkey, flickrSecret, mapboxToken, opencagedataAPIkey} from './apikeys.js';
import {countryNames} from './countrynames.js';
import markup from './markup.js';

var latitude;
var longitude;
var date;

window.onload = () => {

  let wrapper = document.querySelector(".wrapper");
  wrapper.innerHTML += markup;

  async function getLocation(){
    const url = `https://ipinfo.io/json?token=${ipinfoToken}`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
      console.log(data);
    } catch (e) {
      console.error(e);
    }
    let city = data.city;
    let country = countryNames[data.country];
    document.querySelector(".currentWeather").innerHTML = `${city},${country}`;
  }

  //getLocation();

  function success(pos) {
    var crd = pos.coords;
    latitude = crd.latitude.toFixed(2);
    longitude = crd.longitude.toFixed(2);
    getForecast(latitude, longitude);
    getLocationCity();
    map.setCenter([longitude, latitude]);
    document.querySelector(".coordinates").insertAdjacentHTML('afterbegin', `<div>Latitude: ${Math.trunc(latitude)}°</div><div>Longitude: ${longitude.toString().slice(3)}'</div>`);

    var unixDate = new Date(pos.timestamp);
    let arr = unixDate.toString().split(" ");
    let date = `${arr[0]} ${arr[2]} ${arr[1]}`;
    let time = arr[4].slice(0, 5);
  };
  
  navigator.geolocation.getCurrentPosition(success);

  async function getLocationCity(){
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencagedataAPIkey}&language=en`;
    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }

    let city = data.results[0].components.city;
    let country = data.results[0].components.country;
    document.querySelector(".location").innerHTML += `${city}, ${country}`;
  }

  async function getForecast(lat, lon){
    var proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    var targetUrl = `https://api.darksky.net/forecast/${darkskyAPIkey}/${lat},${lon}?lang=en&units=si`;
    try {
      const response = await fetch(proxyUrl + targetUrl);
      var data = await response.json();
    } catch (e) {
      console.error(e);
    }
    
    let temperature = Math.round(data.currently.temperature);
    let apparentTemp = Math.round(data.currently.apparentTemperature);
    let wind = `${data.currently.windSpeed} m/s`;
    let humidity = `${data.currently.humidity}%`;
    document.querySelector(".currentWeather--temperature").innerHTML += temperature;
    document.querySelector(".currentWeather--overcast").insertAdjacentHTML('afterbegin', `<div>Overcast</div><div>Feels like: ${apparentTemp}</div><div>Wind: ${wind}</div><div>Humidity: ${humidity}</div>`);
  }

  mapboxgl.accessToken = mapboxToken;
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 10
  });


  // const ACCESS_KEY = 'a24d7baec6101d6a79aa8a053926d35f9817c6c6e818ddf40f80982eb11b2ee2';

  // async function searchImageByQuery(query) {
  //   const baseUrl = 'https://api.unsplash.com/photos/random';
  //   const queryString = `?query=town,${query}&client_id=${ACCESS_KEY}`;

  //   const url = baseUrl + queryString;

  //   let data;
  //   try {
  //     const response = await fetch(url);
  //     data = await response.json();
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   imageWidth = data.width;
  //   imageHeight = data.height;

  //   const image = new Image();
  //   image.crossOrigin = 'Anonymous';
  //   image.src = data.urls.small;
  //   image.onload = () => {
  //     reflectImage(image, imageWidth, imageHeight);
  //     savedImage = image;
  //   };
  // }

};

window.onbeforeunload = () => {
  
};
