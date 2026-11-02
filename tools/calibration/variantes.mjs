// Compare des variantes de réglages (partant des réglages optimisés) sur toutes les observations d'une espèce.
// Usage : node variantes.mjs ../../index.html → affiche le score (moyenne AUC saison / proche) de chaque variante
import fs from "fs";import {loadModel,evalRows} from "./lib.mjs";
const M=loadModel(process.argv[2]||"../../index.html",{full:true,noCepio:true}),data=JSON.parse(fs.readFileSync("data/calibwx2.json"));
const set=(o,p,v)=>{const ks=p.split("."),c=JSON.parse(JSON.stringify(o));let a=c;ks.slice(0,-1).forEach(k=>{a[k]=a[k]||{};a=a[k]});a[ks[ks.length-1]]=v;return c};
const base=sp=>{const s=JSON.parse(JSON.stringify(M.SP[sp]));s.wt=Object.assign({},M.WEIGHTS,s.wt||{});s.mp=Object.assign({},M.MODEL,s.mp||{});return s};
const opt=sp=>{let s=base(sp);for(const [p,[,b]] of Object.entries(JSON.parse(fs.readFileSync(`data/optim-${sp}.json`))[sp].changements))s=set(s,p,b);return s};
const apply=(s,ch)=>Object.entries(ch).reduce((a,[p,v])=>set(a,p,v),s);
const score=(s,rows)=>{const r=evalRows(M,s,rows);return[(r.auc+r.near)/2,r.auc,r.near]};
const V=JSON.parse(process.env.V);
for(const [sp,vs] of Object.entries(V)){const rows=data[sp];console.log(sp);
  for(const [name,ch] of Object.entries(vs)){const s=ch==="actuel"?base(sp):apply(opt(sp),ch),[f,a,n]=score(s,rows);console.log(`   ${name.padEnd(34)} ${f.toFixed(3)}  (saison ${a.toFixed(3)}, proche ${n.toFixed(3)})`)}}
