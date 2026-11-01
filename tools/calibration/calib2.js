// même échantillonnage, mais interrogation « point dans le polygone » (CQL INTERSECTS), sur les couleurs demandées
const {PNG}=require("pngjs"),l93=require("./l93");const Z=13,WANT=process.argv.slice(2);
const REG={landes:[-0.90,44.20],provence:[5.50,43.50],garonne:[0.62,44.20],charente:[0.20,45.70],picardie:[2.90,49.70],couserans:[1.10,42.93],vosges:[6.90,48.10],alpes:[6.60,45.00],morvan:[4.05,47.20],limousin:[1.90,45.70],sologne:[1.90,47.50]};
const tx=(lon,z)=>Math.floor((lon+180)/360*2**z),ty=(lat,z)=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
const px2ll=(z,x,y,px,py)=>{const n=2**z,lon=(x+px/256)/n*360-180,m=Math.PI*(1-2*(y+py/256)/n);return[Math.atan(Math.sinh(m))*180/Math.PI,lon]};
const url=(z,x,y)=>`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=LANDCOVER.FORESTINVENTORY.V2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}`;
async function tfvAt(la,lo){const f=encodeURIComponent(`INTERSECTS(geom,POINT(${l93(la,lo).join(" ")}))`),u=`https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=LANDCOVER.FORESTINVENTORY.V2:formation_vegetale&COUNT=3&OUTPUTFORMAT=application/json&CQL_FILTER=${f}`;
  const t=await (await fetch(u)).text();try{return JSON.parse(t).features.map(f=>f.properties.code_tfv+" "+f.properties.tfv).join(" / ")||"(rien)"}catch(e){return t.slice(0,150)}}
(async()=>{const S={};for(const [name,[lo,la]] of Object.entries(REG)){const x0=tx(lo,Z),y0=ty(la,Z);
  for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){const r=await fetch(url(Z,x0+dx,y0+dy));if(!r.ok)continue;const p=PNG.sync.read(Buffer.from(await r.arrayBuffer()));
    for(let i=0;i<3000;i++){const px=3+Math.floor(Math.random()*250),py=3+Math.floor(Math.random()*250),o=(py*256+px)*4;if(p.data[o+3]<255)continue;const k=`${p.data[o]},${p.data[o+1]},${p.data[o+2]}`;if(!WANT.includes(k))continue;
      let same=true;for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const q=((py+b)*256+px+a)*4;if(p.data[q]!==p.data[o]||p.data[q+1]!==p.data[o+1]||p.data[q+2]!==p.data[o+2])same=false}
      if(same&&(S[k]=S[k]||[]).length<4)S[k].push([...px2ll(Z,x0+dx,y0+dy,px+.5,py+.5),name])}}}
  for(const k of WANT){console.log(k);for(const [la,lo,n] of S[k]||[])console.log("   "+n+": "+await tfvAt(la,lo))}})();
