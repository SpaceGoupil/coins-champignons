// Optimisation des paramètres du modèle, espèce par espèce, sur le banc v2.
// Objectif : moyenne de l'AUC « saison » et de l'AUC « proche » (le jour de la trouvaille doit sortir du lot, y compris
// face aux jours voisins). Descente de coordonnées sur une grille de valeurs plausibles, 3 tours au plus.
// Validation croisée par année (3 groupes) : on optimise sur deux groupes, on mesure sur le troisième, et on ne retient
// les nouveaux réglages que s'ils battent le modèle actuel sur les années mises de côté.
// Usage : node optim.mjs ../../index.html [espèce] → data/optim.json
import fs from "fs";import {loadModel,evalRows,yearFolds} from "./lib.mjs";
const M=loadModel(process.argv[2]||"../../index.html",{full:true,noCepio:true}),data=JSON.parse(fs.readFileSync("data/calibwx2.json"));
const only=process.argv[3],OUT="data/optim.json",res=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT)):{};
// espace de recherche : chemin du paramètre → valeurs candidates (fonction de la valeur courante pour topt)
const SPACE=[
  ["topt",x=>[x-3,x-1.5,x-.5,x,x+.5,x+1.5,x+3].map(v=>+v.toFixed(1))],["tsd",[2.5,3.5,4.5,6]],
  ["lag",[6,8,10,12,14,17]],["need",[10,15,20,30,45]],["win",[4,6,9,12,16]],["w",[0,.3,.6,.9]],["humMin",[.05,.12,.2,.3]],
  ["wt.trig",[0,.3,.6,1]],["wt.waterWithSoil",[0,.2,.4,.8]],["wt.hum",[0,.5,1]],["wt.summer",[0,.5,1]],["wt.temp",[.3,.6,.8,1.2]],
  ["wt.dry",[0,.5,1]],["wt.season",[0,.15,.3,.6,1]],["mp.rw",[3,5,7,10,14]],["mp.choc",[2,4,6]],["mp.lagT",[0,.25,.5,1]]];
const get=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
const set=(o,p,v)=>{const ks=p.split("."),c=JSON.parse(JSON.stringify(o));let a=c;ks.slice(0,-1).forEach(k=>{a[k]=a[k]||{};a=a[k]});a[ks[ks.length-1]]=v;return c};
const base=sp=>{const s=JSON.parse(JSON.stringify(M.SP[sp]));s.wt=Object.assign({},M.WEIGHTS,s.wt||{});s.mp=Object.assign({},M.MODEL,s.mp||{});return s};
const score=(s,rows)=>{const r=evalRows(M,s,rows);return(r.auc+r.near)/2};
function optimise(sp,rows,log){let cur=base(sp),best=score(cur,rows);
  for(let round=1;round<=3;round++){let gain=0;
    for(const [p,vals] of SPACE){const cands=(typeof vals==="function"?vals(get(cur,p)):vals).filter(v=>v!==get(cur,p));
      for(const v of cands){const s=set(cur,p,v),f=score(s,rows);if(f>best+.002){gain+=f-best;best=f;cur=s}}}
    if(log)log(`  tour ${round} : ${best.toFixed(3)}`);if(gain<.002)break}
  return{s:cur,f:best}}
for(const sp of Object.keys(data)){if(only&&sp!==only)continue;const rows=data[sp],t0=Date.now();console.log(sp,rows.length,"observations");
  // validation croisée par année
  const folds=yearFolds(rows,3).filter(f=>f.test.length&&f.train.length),cv=[];
  for(const [i,f] of folds.entries()){const o=optimise(sp,f.train);cv.push({base:score(base(sp),f.test),opt:score(o.s,f.test),n:f.test.length});
    console.log(`  groupe ${i+1} : actuel ${cv[i].base.toFixed(3)} → optimisé ${cv[i].opt.toFixed(3)} (${f.test.length} obs. mises de côté)`)}
  const w=k=>cv.reduce((s,c)=>s+c[k]*c.n,0)/cv.reduce((s,c)=>s+c.n,0),cvBase=w("base"),cvOpt=w("opt");
  // réglages finaux : optimisés sur toutes les observations, adoptés seulement si la validation croisée progresse
  const fin=optimise(sp,rows,console.log),adopt=cvOpt>cvBase+.005;
  const diff={};for(const [p] of SPACE){const a=get(base(sp),p),b=get(fin.s,p);if(a!==b)diff[p]=[a,b]}
  res[sp]={n:rows.length,cvActuel:+cvBase.toFixed(3),cvOptimise:+cvOpt.toFixed(3),adopte:adopt,toutesActuel:+score(base(sp),rows).toFixed(3),toutesOptimise:+fin.f.toFixed(3),changements:diff,
    reglages:{topt:fin.s.topt,tsd:fin.s.tsd,lag:fin.s.lag,need:fin.s.need,win:fin.s.win,w:fin.s.w,humMin:fin.s.humMin,wt:fin.s.wt,mp:fin.s.mp},minutes:+((Date.now()-t0)/6e4).toFixed(1)};
  console.log(`  validation croisée : actuel ${cvBase.toFixed(3)} → optimisé ${cvOpt.toFixed(3)} ${adopt?"(adopté)":"(non adopté)"}`);
  fs.writeFileSync(OUT,JSON.stringify(res,null,1))}
