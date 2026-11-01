// Icône : fond vert plein (masquable), cèpe centré dans la zone sûre (80 %)
const {PNG}=require("pngjs"),fs=require("fs");
const BG=[31,107,42],CAP=[122,74,34],STEM=[241,228,200],SH=[200,184,150];
function shade(u,v){ // u,v dans [0,1], renvoie une couleur ou null
  const x=u-.5,y=v-.5;
  // chapeau : demi-ellipse
  if(y<=.02&&(x*x)/(.27*.27)+((y-.02)*(y-.02))/(.24*.24)<=1)return CAP;
  // pied : tronc renflé
  if(y>.02&&y<.3){const w=.09+.05*Math.sin(Math.PI*(y-.02)/.28);if(Math.abs(x)<w)return x>w*.45?SH:STEM}
  return null;
}
for(const N of [192,512]){
  const p=new PNG({width:N,height:N}),S=4;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let r=0,g=0,b=0;
    for(let a=0;a<S;a++)for(let c=0;c<S;c++){const col=shade((i+(a+.5)/S)/N,(j+(c+.5)/S)/N)||BG;r+=col[0];g+=col[1];b+=col[2]}
    const o=(j*N+i)*4;p.data[o]=r/S/S;p.data[o+1]=g/S/S;p.data[o+2]=b/S/S;p.data[o+3]=255}
  fs.writeFileSync(process.argv[2]+`/icon-${N}.png`,PNG.sync.write(p));
}
