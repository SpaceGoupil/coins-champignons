// Statistiques par espèce : température sur 5 jours (médiane, quartiles, mode lissé), pluie 30 j, saison (part des relevés par mois)
import fs from "fs";const R=JSON.parse(fs.readFileSync("data/gbif.json"));
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*p,lo=Math.floor(i);return s[lo]+(s[Math.ceil(i)]-s[lo])*(i-lo)};
// mode d'une densité gaussienne (largeur 1,5 °C) : l'optimum « réalisé »
const mode=a=>{let b=0,bx=0;for(let x=-5;x<=30;x+=.1){const d=a.reduce((s,v)=>s+Math.exp(-(((v-x)/1.5)**2)/2),0);if(d>b){b=d;bx=x}}return bx};
const out={};
for(const [sp,rows] of Object.entries(R)){if(!rows.length)continue;const t=rows.map(r=>r.t5),p=rows.map(r=>r.r30),m=Array(13).fill(0);rows.forEach(r=>m[r.mo]++);
  out[sp]={n:rows.length,t5:{q25:+q(t,.25).toFixed(1),med:+q(t,.5).toFixed(1),q75:+q(t,.75).toFixed(1),mode:+mode(t).toFixed(1),sd:+Math.sqrt(t.reduce((s,v)=>s+(v-t.reduce((a,b)=>a+b)/t.length)**2,0)/t.length).toFixed(1)},
    r30:{q25:Math.round(q(p,.25)),med:Math.round(q(p,.5)),q75:Math.round(q(p,.75))},
    mois:Object.fromEntries(m.map((c,i)=>[i,Math.round(c/rows.length*100)]).filter(([i,c])=>i&&c)),pays:[...new Set(rows.map(r=>r.c))].join(",")}}
console.log(JSON.stringify(out,null,1));fs.writeFileSync("data/gbif-stats.json",JSON.stringify(out,null,1));
