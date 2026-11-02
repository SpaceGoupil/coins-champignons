// Complète data/calibwx2.json avec des observations réparties sur plusieurs années (GBIF renvoie d'abord les plus récentes :
// sans cela, toutes les observations du cèpe de Bordeaux dataient de 2025). Pour chaque espèce et chaque année de YEARS,
// tire PER observations (précision ≤ 1 km, une par jour et par lieu) et leur météo ERA5 de d−200 à d+75 (une requête,
// ≈ 20 appels pondérés Open-Meteo). Écrit après chaque espèce ; relancé, il complète ce qui manque.
// Usage : node gbifyears.mjs [par an] [première année] [dernière année]
import fs from "fs";
const SP={edulis:5954958,pino:5954949,aest:5954691,aereus:8733688,girolle:5249504,pdm:2554716};
const C=["FR","ES","IT","CH","BE","DE","AT","LU","NL","GB","PT"],PER=+(process.argv[2]||5),Y0=+(process.argv[3]||2018),Y1=+(process.argv[4]||2023);
const OUT="data/calibwx2.json",data=JSON.parse(fs.readFileSync(OUT)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const iso=d=>d.toISOString().slice(0,10),shift=(s,k)=>{const d=new Date(s+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+k);return iso(d)};
const VARS="daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm,relative_humidity_2m&timezone=auto";
async function wx(o){const u=`https://archive-api.open-meteo.com/v1/archive?latitude=${o.la.toFixed(4)}&longitude=${o.lo.toFixed(4)}&start_date=${shift(o.d,-200)}&end_date=${shift(o.d,75)}&${VARS}`;
  for(let n=0;n<6;n++){const r=await fetch(u);let j=null;
    if(r.ok){try{j=await r.json()}catch(e){await sleep(5000);continue}}
    if(j){const N=j.daily.time.length,h=j.hourly,per=Math.round(h.time.length/N),
        avg=x=>Array.from({length:N},(_,d)=>{let s=0,c=0;for(let k=d*per;k<d*per+per;k++)if(x[k]!=null){s+=x[k];c++}return c?+(s/c).toFixed(3):null});
      const w={dates:j.daily.time,tmax:j.daily.temperature_2m_max,tmin:j.daily.temperature_2m_min,rain:j.daily.precipitation_sum.map(v=>v||0),
        tsol:avg(h.soil_temperature_0_to_7cm),sm:avg(h.soil_moisture_0_to_7cm),sm2:avg(h.soil_moisture_7_to_28cm),rh:avg(h.relative_humidity_2m)};
      if(w.tmax.some(v=>v==null)||w.sm.some(v=>v==null))return null;return w}
    const t=await r.text();if(r.status===429){if(/daily/i.test(t)){console.log("quota du jour atteint");fs.writeFileSync(OUT,JSON.stringify(data));process.exit(2)}
      console.log("limite par minute : pause");await sleep(65000);n--;continue}
    await sleep(3000*(n+1))}return null}
for(const [sp,key] of Object.entries(SP)){const have=data[sp]||[],seen=new Set(have.map(r=>r.d+r.la.toFixed(2)+r.lo.toFixed(2)));let added=0;
  for(let y=Y0;y<=Y1;y++){const already=have.filter(r=>+r.d.slice(0,4)===y).length;if(already>=PER)continue;
    const u=`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&${C.map(c=>"country="+c).join("&")}&hasCoordinate=true&hasGeospatialIssue=false&year=${y}&occurrenceStatus=PRESENT&coordinateUncertaintyInMeters=0,1000&limit=300`;
    const j=await (await fetch(u)).json();
    const cand=j.results.filter(o=>o.eventDate&&/^\d{4}-\d\d-\d\d/.test(o.eventDate)&&o.decimalLatitude).map(o=>({d:o.eventDate.slice(0,10),la:o.decimalLatitude,lo:o.decimalLongitude,c:o.countryCode}))
      .filter(o=>!seen.has(o.d+o.la.toFixed(2)+o.lo.toFixed(2))).sort(()=>Math.random()-.5);
    let got=already;for(const o of cand){if(got>=PER)break;seen.add(o.d+o.la.toFixed(2)+o.lo.toFixed(2));
      const w=await wx(o);await sleep(1300);if(!w||w.dates.length<270)continue;
      have.push({...o,iObs:w.dates.indexOf(o.d),wx:w});got++;added++}
    console.log(sp,y,got,"observations")}
  data[sp]=have;fs.writeFileSync(OUT,JSON.stringify(data));console.log(sp,"total",have.length,"(+"+added+")",new Date().toLocaleTimeString("fr-FR"))}
console.log("terminé");
