import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const zlib = require('zlib');

function createPNG(size, color) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  function crc32(buf) {
    let c=0xFFFFFFFF,table=[];
    for(let i=0;i<256;i++){let n=i;for(let j=0;j<8;j++)n=n&1?0xEDB88320^(n>>>1):n>>>1;table[i]=n;}
    for(let i=0;i<buf.length;i++)c=table[(c^buf[i])&0xFF]^(c>>>8);
    return(c^0xFFFFFFFF)>>>0;
  }
  function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const t=Buffer.from(type);const crcBuf=Buffer.concat([t,data]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(crcBuf));return Buffer.concat([len,t,data,c]);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=2;
  const [r,g,b]=color;const rows=[];
  for(let y=0;y<size;y++){const row=Buffer.alloc(1+size*3);row[0]=0;for(let x=0;x<size;x++){const cx=size/2,cy=size/2,dx=x-cx,dy=y-cy;let pr=r,pg=g,pb=b;const mw=size*0.15,mh=size*0.28;if(Math.abs(dx)<mw&&dy>-mh*1.2&&dy<mh*0.3){pr=255;pg=255;pb=255;if(dy<-mh*0.7){const td=dy+mh*1.2,td2=Math.abs(dx);if(td2*td2+td*td>mw*mw){pr=r;pg=g;pb=b;}}}if(Math.abs(dx)<size*0.03&&dy>mh*0.3&&dy<mh*0.8){pr=255;pg=255;pb=255;}if(Math.abs(dx)<size*0.15&&dy>mh*0.7&&dy<mh*0.85){pr=255;pg=255;pb=255;}const ar=mw*1.6,ar2=mw*2.1,dist=Math.sqrt(dx*dx+dy*dy);if(dist>ar&&dist<ar2&&dy<mh*0.35&&dy>-mh*0.3){pr=255;pg=255;pb=255;}row[1+x*3]=pr;row[2+x*3]=pg;row[3+x*3]=pb;}rows.push(row);}
  const raw=Buffer.concat(rows);const compressed=zlib.deflateSync(raw,{level:6});
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',compressed),chunk('IEND',Buffer.alloc(0))]);
}

fs.mkdirSync('assets/images',{recursive:true});
for(const size of [192,512]){const png=createPNG(size,[13,15,20]);fs.writeFileSync(`assets/images/icon-${size}.png`,png);console.log(`✓ icon-${size}.png`);}
