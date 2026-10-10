const form=document.getElementById("search-form");
const input=document.getElementById("city-input");
const button=document.getElementById("search-button");
const statusEl=document.getElementById("status");
const $=id=>document.getElementById(id);
const codes={
0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Dense drizzle","🌧️"],
56:["Freezing drizzle","🌧️"],57:["Heavy freezing drizzle","🌧️"],61:["Slight rain","🌦️"],63:["Moderate rain","🌧️"],65:["Heavy rain","🌧️"],
66:["Freezing rain","🌧️"],67:["Heavy freezing rain","🌧️"],71:["Slight snow","🌨️"],73:["Moderate snow","🌨️"],75:["Heavy snow","❄️"],
77:["Snow grains","🌨️"],80:["Rain showers","🌦️"],81:["Moderate showers","🌧️"],82:["Violent showers","⛈️"],85:["Snow showers","🌨️"],
86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Severe thunderstorm","⛈️"]};
const info=code=>codes[code]||["Weather unavailable","🌡️"];
const show=(message,error=false)=>{statusEl.textContent=message;statusEl.classList.toggle("error",error)};
const getJSON=async url=>{const res=await fetch(url);if(!res.ok)throw new Error(`API request failed (${res.status}). Try again.`);return res.json()};
const timeOf=value=>new Date(value).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const dayOf=value=>new Date(value+"T12:00:00").toLocaleDateString([],{weekday:"short"});

async function searchCity(raw){
 const city=raw.trim();
 if(city.length<2){show("Enter a city name with at least 2 characters.",true);input.focus();return}
 if(!/^[\p{L}\p{M}\s.'’-]+$/u.test(city)){show("Please use a valid city name.",true);input.focus();return}
 button.disabled=true;button.textContent="Loading…";show(`Searching weather for ${city}…`);
 try{
  const geo=await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if(!geo.results?.length)throw new Error(`No city found for “${city}”. Check the spelling and try again.`);
  const place=geo.results[0];
  const params=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max",timezone:"auto",forecast_days:"5"});
  const data=await getJSON(`https://api.open-meteo.com/v1/forecast?${params}`);
  render(place,data);show(`Weather updated for ${place.name}${place.country?`, ${place.country}`:""}.`);
 }catch(err){console.error(err);show(err.message||"Could not load weather. Check your internet connection.",true)}
 finally{button.disabled=false;button.textContent="Search →"}
}
function render(place,data){
 const c=data.current,d=data.daily,[desc,icon]=info(c.weather_code);
 $("city").textContent=[place.name,place.admin1,place.country].filter(Boolean).join(", ");
 $("date").textContent=new Date().toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"});
 $("zone").textContent=data.timezone_abbreviation||data.timezone||"Local forecast";
 $("temp").textContent=Math.round(c.temperature_2m);$("condition").textContent=desc;
 $("feels").textContent=Math.round(c.apparent_temperature)+"°";$("art").textContent=c.is_day?icon:(c.weather_code===0?"🌙":icon);
 $("humidity").textContent=Math.round(c.relative_humidity_2m);$("wind").textContent=Math.round(c.wind_speed_10m);
 $("rain").textContent=Number(d.precipitation_sum?.[0]??c.precipitation??0).toFixed(1);
 const uv=Number(d.uv_index_max?.[0]??0);$("uv").textContent=uv.toFixed(1);
 $("uv-note").textContent=uv<3?"Low UV":uv<6?"Moderate UV":uv<8?"High UV":uv<11?"Very high UV":"Extreme UV";
 $("high").textContent=Math.round(d.temperature_2m_max[0])+"°";$("low").textContent=Math.round(d.temperature_2m_min[0])+"°";$("updated").textContent=timeOf(c.time);
 const list=$("forecast");list.replaceChildren();
 d.time.forEach((date,i)=>{
  const [label,emoji]=info(d.weather_code[i]),card=document.createElement("article");card.className="day";
  const day=document.createElement("div");day.className="day-name";day.textContent=i===0?"Today":dayOf(date);
  const art=document.createElement("span");art.className="day-icon";art.textContent=emoji;art.setAttribute("aria-label",label);
  const cond=document.createElement("div");cond.className="day-condition";cond.textContent=label;
  const temps=document.createElement("div");temps.className="temps";
  const high=document.createElement("span");high.textContent=Math.round(d.temperature_2m_max[i])+"°";
  const low=document.createElement("span");low.className="low";low.textContent=Math.round(d.temperature_2m_min[i])+"°";
  temps.append(high,low);card.append(day,art,cond,temps);list.append(card);
 });
}
form.addEventListener("submit",e=>{e.preventDefault();searchCity(input.value)});
searchCity("Nagpur");
