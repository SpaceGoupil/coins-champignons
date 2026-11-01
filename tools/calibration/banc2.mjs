// Banc v2 : pour chaque observation, le jour de la trouvaille est comparé à tous les autres jours de la saison au même endroit
// (témoins de d−100 à d+75 hors ±10 jours ; « proches » : ±45 jours). Mesure aussi, par niveau d'indice, combien de fois
// plus souvent on y trouve un jour d'observation qu'un jour quelconque de la saison (« multiplicateur »).
// Usage : node banc2.mjs ../../index.html [fichier de sortie]
import fs from "fs";import {loadModel,evalRows,yearFolds} from "./lib.mjs";
const M=loadModel(process.argv[2]||"../../index.html",{full:true,noCepio:true}),data=JSON.parse(fs.readFileSync("data/calibwx2.json"));
const LV=[[0,.18,"Rare"],[.18,.4,"Limité"],[.4,.65,"Modéré"],[.65,1.01,"Abondant"]],out={};
for(const [sp,rows] of Object.entries(data)){const r=evalRows(M,M.SP[sp],rows);
  // multiplicateur par niveau : part des jours d'observation dans le niveau / part des jours témoins dans le niveau
  const obs=r.per.map(p=>p.o),bg=r.per.flatMap(p=>p.bg),lift=LV.map(([a,b,n])=>{const po=obs.filter(v=>v>=a&&v<b).length/obs.length,pb=bg.filter(v=>v>=a&&v<b).length/bg.length;
    return{niveau:n,obs:+(po*100).toFixed(0),temoins:+(pb*100).toFixed(0),multiplicateur:pb?+(po/pb).toFixed(2):null}});
  const cv=yearFolds(rows,3).map(f=>evalRows(M,M.SP[sp],f.test)).filter(x=>x.n);
  out[sp]={n:r.n,aucSaison:+r.auc.toFixed(3),aucProche:+r.near.toFixed(3),aucParGroupeAnnees:cv.map(x=>+x.auc.toFixed(3)),medObs:+[...obs].sort((a,b)=>a-b)[obs.length>>1].toFixed(3),
    medTemoin:+[...bg].sort((a,b)=>a-b)[bg.length>>1].toFixed(3),niveaux:lift}}
console.log(JSON.stringify(out,null,1));if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
