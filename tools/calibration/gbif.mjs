// Pour chaque espèce : observations GBIF (Europe tempérée, 2018-2025, précision ≤ 1 km), puis météo ERA5 (Open-Meteo archive)
// des 35 jours précédant l'observation → température moyenne sur 5 jours, pluie sur 30 jours, mois.
import fs from "fs";
const SP={edulis:5954958,pino:5954949,aest:5954691,aereus:8733688,girolle:5249504,pdm:2554716};
const C=["FR","ES","IT","CH","BE","DE","AT","LU","NL","GB","PT"],PER=Number(process.argv[2]||160);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function occ(key){const out=[];
  for(let off=0;off<1500&&out.length<PER*4;off+=300){
    const u=`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&${C.map(c=>"country="+c).join("&")}&hasCoordinate=true&hasGeospatialIssue=false&year=2018,2025&occurrenceStatus=PRESENT&coordinateUncertaintyInMeters=0,1000&limit=300&offset=${off}`;
    const j=await (await fetch(u)).json();for(const o of j.results)if(o.eventDate&&/^\d{4}-\d\d-\d\d/.test(o.eventDate)&&o.decimalLatitude)out.push({d:o.eventDate.slice(0,10),la:o.decimalLatitude,lo:o.decimalLongitude,c:o.countryCode});
    if(j.endOfRecords)break}
  // un seul relevé par jour et par lieu (~1 km), puis tirage
  const seen=new Set(),u=out.filter(o=>{const k=o.d+o.la.toFixed(2)+o.lo.toFixed(2);if(seen.has(k))return false;seen.add(k);return true});
  return u.sort(()=>Math.random()-.5).slice(0,PER)}
async function wx(o){const e=new Date(o.d),s=new Date(e);s.setDate(s.getDate()-34);const iso=d=>d.toISOString().slice(0,10);
  const u=`https://archive-api.open-meteo.com/v1/archive?latitude=${o.la.toFixed(4)}&longitude=${o.lo.toFixed(4)}&start_date=${iso(s)}&end_date=${o.d}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  for(let n=0;n<4;n++){const r=await fetch(u);if(r.ok){const j=await r.json();const t=j.daily.temperature_2m_mean,p=j.daily.precipitation_sum;
      if(t.some(v=>v==null))return null;const L=t.length;return{t5:t.slice(L-5).reduce((a,b)=>a+b)/5,r30:p.slice(L-30).reduce((a,b)=>a+(b||0),0),r7:p.slice(L-7).reduce((a,b)=>a+(b||0),0),elev:j.elevation}}
    await sleep(1500*(n+1))}return null}
const res={};
for(const [sp,key] of Object.entries(SP)){const os=await occ(key);const rows=[];let i=0;
  async function w(){while(i<os.length){const o=os[i++];const m=await wx(o);if(m)rows.push({...o,...m,mo:+o.d.slice(5,7)});await sleep(120)}}
  await Promise.all([w(),w(),w()]);res[sp]=rows;console.log(sp,"observations",os.length,"avec météo",rows.length)}
fs.writeFileSync("data/gbif.json",JSON.stringify(res));
