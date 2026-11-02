// Contribution de chaque changement proposé par optim.mjs : on part des réglages optimisés et on remet un seul paramètre
// à sa valeur actuelle ; la baisse du score (moyenne AUC saison / proche, toutes observations) mesure ce qu'il apporte.
// Un changement qui n'apporte presque rien n'est pas repris (modèle plus proche de la littérature, moins de surajustement).
// Usage : node ablation.mjs ../../index.html → data/ablation.json
import fs from "fs";import {loadModel,evalRows} from "./lib.mjs";
const M=loadModel(process.argv[2]||"../../index.html",{full:true,noCepio:true}),data=JSON.parse(fs.readFileSync(process.env.DATA||"data/calibwx2.json"));
const get=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
const set=(o,p,v)=>{const ks=p.split("."),c=JSON.parse(JSON.stringify(o));let a=c;ks.slice(0,-1).forEach(k=>{a[k]=a[k]||{};a=a[k]});a[ks[ks.length-1]]=v;return c};
const base=sp=>{const s=JSON.parse(JSON.stringify(M.SP[sp]));s.wt=Object.assign({},M.WEIGHTS,s.wt||{});s.mp=Object.assign({},M.MODEL,s.mp||{});return s};
const score=(s,rows)=>{const r=evalRows(M,s,rows);return(r.auc+r.near)/2};
const out={};
for(const sp of Object.keys(data)){const f=`data/optim-${sp}.json`;if(!fs.existsSync(f))continue;const o=JSON.parse(fs.readFileSync(f))[sp],rows=data[sp];
  let opt=base(sp);for(const [p,[,b]] of Object.entries(o.changements))opt=set(opt,p,b);
  const fb=score(base(sp),rows),fo=score(opt,rows),contrib={};
  for(const [p,[a]] of Object.entries(o.changements))contrib[p]=+(fo-score(set(opt,p,a),rows)).toFixed(3);
  out[sp]={actuel:+fb.toFixed(3),optimise:+fo.toFixed(3),cv:[o.cvActuel,o.cvOptimise],adopte:o.adopte,contrib};
  console.log(sp,`actuel ${fb.toFixed(3)} → optimisé ${fo.toFixed(3)}`,o.adopte?"":"(non adopté)");
  for(const [p,c] of Object.entries(contrib).sort((x,y)=>y[1]-x[1]))console.log(`   ${p.padEnd(18)} ${String(o.changements[p][0]).padStart(5)} → ${String(o.changements[p][1]).padEnd(5)} apporte ${c>=0?"+":""}${c.toFixed(3)}`)}
fs.writeFileSync("data/ablation.json",JSON.stringify(out,null,1));
