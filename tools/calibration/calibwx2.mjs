// Complète la météo ERA5 des observations de data/calibwx.json (fenêtre d−140 → d) pour obtenir la fenêtre d−200 → d+75 :
// de quoi comparer le jour de l'observation à tous les jours de la saison au même endroit (banc v2).
// Deux requêtes par observation (d−200 → d−141 et d+1 → d+75), environ 10 appels pondérés Open-Meteo au total.
// Écrit data/calibwx2.json après chaque espèce (une coupure ne perd pas le travail déjà fait) ; relancé, il reprend.
import fs from "fs";
const IN="data/calibwx.json",OUT="data/calibwx2.json",sleep=ms=>new Promise(r=>setTimeout(r,ms));
const R=JSON.parse(fs.readFileSync(IN)),out=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT)):{};
const iso=d=>d.toISOString().slice(0,10),shift=(s,k)=>{const d=new Date(s+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+k);return iso(d)};
const VARS="daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm,relative_humidity_2m&timezone=auto";
async function get(o,a,b){const u=`https://archive-api.open-meteo.com/v1/archive?latitude=${o.la.toFixed(4)}&longitude=${o.lo.toFixed(4)}&start_date=${a}&end_date=${b}&${VARS}`;
  for(let n=0;n<6;n++){const r=await fetch(u);
    // réponse parfois tronquée par le serveur (« timeoutReached » au lieu du JSON) : on réessaie
    let j=null;if(r.ok){try{j=await r.json()}catch(e){console.log("réponse illisible, nouvel essai");await sleep(5000);continue}}
    if(j){const N=j.daily.time.length,h=j.hourly,per=Math.round(h.time.length/N),
        avg=x=>Array.from({length:N},(_,d)=>{let s=0,c=0;for(let k=d*per;k<d*per+per;k++)if(x[k]!=null){s+=x[k];c++}return c?+(s/c).toFixed(3):null});
      return{dates:j.daily.time,tmax:j.daily.temperature_2m_max,tmin:j.daily.temperature_2m_min,rain:j.daily.precipitation_sum.map(v=>v||0),
        tsol:avg(h.soil_temperature_0_to_7cm),sm:avg(h.soil_moisture_0_to_7cm),sm2:avg(h.soil_moisture_7_to_28cm),rh:avg(h.relative_humidity_2m)}}
    const t=await r.text();if(r.status===429){if(/daily/i.test(t)){console.log("quota du jour atteint");fs.writeFileSync(OUT,JSON.stringify(out));process.exit(2)}
      console.log("limite par minute : pause d'une minute");await sleep(65000);n--;continue}
    await sleep(3000*(n+1))}return null}
const KEYS=["dates","tmax","tmin","rain","tsol","sm","sm2","rh"];
for(const [sp,rows] of Object.entries(R)){if(out[sp]&&out[sp].length>=rows.length){console.log(sp,"déjà fait");continue}const res=[];
  for(const r of rows){const w=r.wx,d0=w.dates[0],d1=w.dates[w.dates.length-1];
    const pre=await get(r,shift(d0,-60),shift(d0,-1));await sleep(1300);const post=await get(r,shift(d1,1),shift(d1,75));await sleep(1300);
    if(!pre||!post||pre.tmax.some(v=>v==null)||post.tmax.some(v=>v==null)){console.log(sp,"observation ignorée (météo incomplète)",r.d);continue}
    const full={};KEYS.forEach(k=>full[k]=[...pre[k],...w[k],...post[k]]);
    res.push({d:r.d,la:r.la,lo:r.lo,c:r.c,iObs:pre.dates.length+w.dates.length-1,wx:full})}
  out[sp]=res;fs.writeFileSync(OUT,JSON.stringify(out));console.log(sp,res.length,"observations complètes",new Date().toLocaleTimeString("fr-FR"))}
console.log("terminé");
