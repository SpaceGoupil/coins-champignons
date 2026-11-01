// Météo complète (ERA5, archive Open-Meteo) des 140 jours précédant chaque observation : de quoi faire tourner le modèle
// le jour de l'observation et un jour témoin 45 jours plus tôt, au même endroit.
import fs from "fs";const R=JSON.parse(fs.readFileSync("data/gbif.json")),PER=+(process.argv[2]||50),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out={};
async function get(o){const e=new Date(o.d),s=new Date(e);s.setDate(s.getDate()-140);const iso=d=>d.toISOString().slice(0,10);
  const u=`https://archive-api.open-meteo.com/v1/archive?latitude=${o.la.toFixed(4)}&longitude=${o.lo.toFixed(4)}&start_date=${iso(s)}&end_date=${o.d}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm,relative_humidity_2m&timezone=auto`;
  for(let n=0;n<4;n++){const r=await fetch(u);if(r.ok){const j=await r.json(),N=j.daily.time.length,h=j.hourly,per=Math.round(h.time.length/N),
      avg=a=>Array.from({length:N},(_,d)=>{let s=0,c=0;for(let k=d*per;k<d*per+per;k++)if(a[k]!=null){s+=a[k];c++}return c?+(s/c).toFixed(3):null});
      if(j.daily.temperature_2m_max.some(v=>v==null))return null;
      return{dates:j.daily.time,tmax:j.daily.temperature_2m_max,tmin:j.daily.temperature_2m_min,rain:j.daily.precipitation_sum.map(v=>v||0),
        tsol:avg(h.soil_temperature_0_to_7cm),sm:avg(h.soil_moisture_0_to_7cm),sm2:avg(h.soil_moisture_7_to_28cm),rh:avg(h.relative_humidity_2m)}}
    if(r.status===429){const t=await r.text();if(/Daily/i.test(t)){console.log("quota du jour atteint");process.exit(2)}console.log("pause d'une minute");await sleep(65000);n--;continue}await sleep(2000*(n+1))}return null}
for(const [sp,rows] of Object.entries(R)){const pick=rows.slice(0,PER),res=[];let i=0;
  async function w(){while(i<pick.length){const o=pick[i++];const m=await get(o);if(m)res.push({...o,wx:m});await sleep(1300)}}
  await w();out[sp]=res;console.log(sp,res.length)}
fs.writeFileSync("data/calibwx.json",JSON.stringify(out));
