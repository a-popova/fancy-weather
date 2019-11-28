import '../sass/styles.scss';
import {ipinfoToken, openWeatherAPIkey, flickrAPIkey, flickrSecret, mapboxToken, opencagedataAPIkey} from './apikeys.js';
import {countryNames} from './countrynames.js';
import markup from './markup.js';

var latitude;
var longitude;

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
    console.log(city, country);
  }

  getLocation();

  function success(pos) {
    var crd = pos.coords;
    latitude = crd.latitude.toFixed(2);
    longitude = crd.longitude.toFixed(2);
    map.setCenter([longitude, latitude])
  };
  
  navigator.geolocation.getCurrentPosition(success);

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
