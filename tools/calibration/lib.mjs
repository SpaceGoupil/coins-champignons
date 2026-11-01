// Outils communs aux bancs d'essai : extrait le modèle d'index.html et l'évalue sur des observations réelles.
import fs from "fs";import vm from "vm";

// Charge compute() et ses dépendances depuis index.html, tels qu'ils sont dans l'app.
// opts.full : renvoyer la série complète (l'app n'en rend que les 40 derniers jours pour ses graphiques)
// opts.noCepio : sauter la règle Cépio (inutile ici, et lente sur de longues séries)
export function loadModel(htmlPath,opts={}){
  const html=fs.readFileSync(htmlPath,"utf8"),grab=(re,name)=>{const m=html.match(re);if(!m)throw new Error("introuvable dans index.html : "+name);return m[0]};
  let comp=grab(/function compute\(D,cfg\)\{[\s\S]*?\n\}\n/,"compute");
  if(opts.full)comp=comp.replace("const off=Math.max(0,N-40)","const off=0");
  if(opts.noCepio)comp=comp.replace("for(let d=0;d<N;d++){let best=.03,info={stage:0};","for(let d=0;d<0;d++){let best=.03,info={stage:0};");
  const code=[grab(/function isoDay\(d\)\{[^\n]*\}/,"isoDay"),grab(/const SP=\{\n[\s\S]*?\n\};/,"SP"),grab(/const SOIL=\{[^\n]*\};/,"SOIL"),
    grab(/const EXPO=\{[^\n]*\};/,"EXPO"),grab(/const WEIGHTS=\{[\s\S]*?\n\};/,"WEIGHTS"),grab(/const MODEL=\{[^\n]*\};/,"MODEL"),comp].join("\n")+"\n;({SP,SOIL,EXPO,WEIGHTS,MODEL,compute})";
  return vm.runInNewContext(code,{Math,Date,Array,Object,Set,JSON,Number,String});
}

// Évalue une espèce sur des observations à fenêtre longue (data/calibwx2.json : de d−200 à d+75, observation à iObs).
// Score d'un jour = maximum de l'indice sur ce jour et les deux précédents (les champignons restent visibles quelques jours).
// Témoins : tous les jours de la fenêtre [iObs−100, iObs+75] hors ±10 jours autour de l'observation (« saison »),
// et ceux à ±45 jours (« proches », plus exigeant). AUC par observation = part des témoins moins bien notés (égalités : ½).
export function evalRows(M,spObj,rows){
  const per=[];
  for(const r of rows){const w=r.wx,D={...w,real:true,today:w.dates.length-1};
    const E=M.compute(D,{sp:spObj,soil:M.SOIL.limon,expo:M.EXPO.plat,dT:0}).E,sc=i=>Math.max(E[i],E[i-1],E[i-2]);
    const o=sc(r.iObs),bg=[],near=[];
    for(let i=Math.max(100,r.iObs-100);i<=Math.min(E.length-1,r.iObs+75);i++){if(Math.abs(i-r.iObs)<=10)continue;const v=sc(i);bg.push(v);if(Math.abs(i-r.iObs)<=45)near.push(v)}
    const auc=a=>a.reduce((s,v)=>s+(o>v?1:o===v?.5:0),0)/a.length;
    per.push({y:+r.d.slice(0,4),c:r.c,o,auc:auc(bg),near:auc(near),bg})}
  const mean=k=>per.reduce((s,p)=>s+p[k],0)/per.length;
  return{n:per.length,auc:mean("auc"),near:mean("near"),per};
}

// Validation croisée par année : les observations sont réparties en k groupes d'années ; renvoie les groupes.
export function yearFolds(rows,k=3){
  const years=[...new Set(rows.map(r=>+r.d.slice(0,4)))].sort(),fold={};years.forEach((y,i)=>fold[y]=i%k);
  return Array.from({length:k},(_,f)=>({train:rows.filter(r=>fold[+r.d.slice(0,4)]!==f),test:rows.filter(r=>fold[+r.d.slice(0,4)]===f)}));
}
