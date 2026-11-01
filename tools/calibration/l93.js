// WGS84 -> Lambert-93 (EPSG:2154), conique conforme sécante, ellipsoïde GRS80
const a=6378137,e=0.0818191910428158,rad=Math.PI/180,lon0=3*rad,p1=44*rad,p2=49*rad,p0=46.5*rad,X0=700000,Y0=6600000;
const m=p=>Math.cos(p)/Math.sqrt(1-e*e*Math.sin(p)**2),t=p=>Math.tan(Math.PI/4-p/2)/((1-e*Math.sin(p))/(1+e*Math.sin(p)))**(e/2);
const n=(Math.log(m(p1))-Math.log(m(p2)))/(Math.log(t(p1))-Math.log(t(p2))),F=m(p1)/(n*t(p1)**n),r0=a*F*t(p0)**n;
module.exports=(lat,lon)=>{const r=a*F*t(lat*rad)**n,th=n*(lon*rad-lon0);return[X0+r*Math.sin(th),Y0+r0-r*Math.cos(th)]};
