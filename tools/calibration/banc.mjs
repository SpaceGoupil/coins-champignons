// Fait tourner compute() de l'app (extrait tel quel d'index.html) le jour de chaque observation et 45 jours plus tôt.
import fs from "fs";import {loadModel} from "./lib.mjs";
const {SP,SOIL,EXPO,compute}=loadModel(process.argv[2]);
const R=JSON.parse(fs.readFileSync("data/calibwx.json"));
// série tronquée au jour t (inclus), modèle calculé « comme si on était ce jour-là »
const at=(w,t)=>{const D={};for(const k of ["dates","tmax","tmin","rain","tsol","sm","sm2","rh"])D[k]=w[k].slice(0,t+1);D.real=true;D.today=t;return D};
const E=(sp,w,t)=>{const m=compute(at(w,t),{sp:SP[sp],soil:SOIL.limon,expo:EXPO.plat,dT:0});return Math.max(...m.E.slice(Math.max(0,m.today-2),m.today+1))};
const res={};
for(const [sp,rows] of Object.entries(R)){const o=[],c=[];for(const r of rows){const L=r.wx.dates.length-1;o.push(E(sp,r.wx,L));c.push(E(sp,r.wx,L-45))}
  let win=0,tie=0;for(const a of o)for(const b of c){if(a>b)win++;else if(a===b)tie++}
  const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor((s.length-1)*p)]};
  res[sp]={n:o.length,obs:{q25:+q(o,.25).toFixed(3),med:+q(o,.5).toFixed(3),q75:+q(o,.75).toFixed(3)},temoin:{med:+q(c,.5).toFixed(3),q75:+q(c,.75).toFixed(3)},
    auc:+((win+tie/2)/(o.length*c.length)).toFixed(2),obs0:o.filter(v=>v<.01).length}}
console.log(JSON.stringify(res,null,1));fs.writeFileSync("data/banc.json",JSON.stringify(res));
