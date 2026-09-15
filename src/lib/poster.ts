import QRCode from 'qrcode';
import type {ResultCard} from '../data/types';
import { characterImage } from '../data/images';
import { resultLink } from './links';
const font='-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const palette={A1:{bg:'#ecf2f4',ink:'#294956',soft:'#dce7eb'},A2:{bg:'#f9f4e3',ink:'#5a502f',soft:'#efe3be'},A3:{bg:'#eef5e8',ink:'#325640',soft:'#dcebd0'}};
function loadImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>reject(new Error('图片加载超时，请重试')),15000);img.onload=()=>{clearTimeout(timer);resolve(img)};img.onerror=()=>{clearTimeout(timer);reject(new Error('角色图片加载失败，请重试'))};img.src=src})}
export async function generatePoster(card:ResultCard):Promise<{url:string;width:number;height:number;link:string}> {
 const link=resultLink(card.key);
 const [character]=await Promise.all([loadImage(characterImage(card.key)),document.fonts?.ready]);
 const qr=await QRCode.toDataURL(link,{width:300,margin:4,errorCorrectionLevel:'M',color:{dark:'#17382a',light:'#ffffff'}});
 const qrImage=await loadImage(qr);
 const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器不支持生成海报');
 const theme=palette[card.key.slice(0,2) as keyof typeof palette];
 const setFont=(size:number,bold=false)=>{ctx.font=`${bold?600:400} ${size}px ${font}`};
 const lines=(text:string,width:number,size:number,bold=false)=>{setFont(size,bold);const out:string[]=[];let line='';for(const ch of Array.from(text)){if(ch==='\n'){out.push(line);line='';continue}if(line&&ctx.measureText(line+ch).width>width){out.push(line);line=ch}else line+=ch}if(line)out.push(line);return out};
 // Layout uses a 360-unit design surface; output is 1080px wide at 3x.
 let osLines=lines(card.os,300,13,true);
 // Balance multi-line quotes so a final word is not stranded on its own line.
 const quoteLineCount=osLines.length;
 if(quoteLineCount>1)for(let width=299;width>=140;width--){const candidate=lines(card.os,width,13,true);if(candidate.length>quoteLineCount)break;osLines=candidate;}
 const description=lines(card.description.replace(/\n/g,''),320,11);
 const tipLines=card.tips.map(t=>lines(t,281,11));
 const osHeight=osLines.length*23+16;
 const tipsHeight=33+tipLines.reduce((n,a)=>n+a.length*20+10,0);
 const total=Math.max(480,24+22+18+30+12+osHeight+14+168+18+description.length*20+16+tipsHeight+18+100+24);
 canvas.width=1080;canvas.height=Math.ceil(total*3);ctx.scale(3,3);ctx.fillStyle=theme.bg;ctx.fillRect(0,0,360,total);ctx.fillStyle=theme.ink;ctx.textBaseline='top';
 const text=(value:string,x:number,y:number,size:number,bold=false)=>{setFont(size,bold);ctx.fillStyle=theme.ink;ctx.fillText(value,x,y)};
 const block=(items:string[],x:number,y:number,leading:number,size:number,bold=false,center=false)=>{items.forEach((line,i)=>{setFont(size,bold);text(line,center?(360-ctx.measureText(line).width)/2:x,y+i*leading,size,bold)})};
 // Booklet icon drawn locally, matching the UI's outline style.
 ctx.strokeStyle=theme.ink;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(20,26);ctx.quadraticCurveTo(25,24,30,27);ctx.quadraticCurveTo(35,24,40,26);ctx.lineTo(40,41);ctx.quadraticCurveTo(35,39,30,42);ctx.quadraticCurveTo(25,39,20,41);ctx.closePath();ctx.moveTo(30,27);ctx.lineTo(30,42);ctx.stroke();text('本人使用说明书',47,28,10);text(card.code,282,28,9);
 let y=64;setFont(22,true);const nameWidth=ctx.measureText(card.name).width;setFont(17.96);const codeText=` · ${card.code}`;const codeWidth=ctx.measureText(codeText).width;const x=(360-nameWidth-codeWidth)/2;text(card.name,x,y,22,true);text(codeText,x+nameWidth,y+4,17.96);y+=42;
 ctx.fillStyle='#ffffff99';ctx.fillRect(15,y,330,osHeight);
 // Center the visible glyph bounds, including multi-line leading, within the stripe.
 setFont(13,true);ctx.textBaseline='alphabetic';
 const quoteMetrics=osLines.map(line=>ctx.measureText(line));
 const ascent=Math.max(...quoteMetrics.map(m=>m.actualBoundingBoxAscent));
 const descent=Math.max(...quoteMetrics.map(m=>m.actualBoundingBoxDescent));
 const quoteHeight=ascent+descent+(osLines.length-1)*23;
 block(osLines,0,y+(osHeight-quoteHeight)/2+ascent,23,13,true,true);
 ctx.textBaseline='top';y+=osHeight+14;
 const scale=Math.min(126/character.naturalWidth,168/character.naturalHeight);const w=character.naturalWidth*scale,h=character.naturalHeight*scale;ctx.drawImage(character,(360-w)/2,y+(168-h)/2,w,h);y+=168+18;
 block(description,20,y,20,11);y+=description.length*20+16;
 ctx.fillStyle='#ffffff99';ctx.fillRect(20,y,320,tipsHeight);text('好友使用说明',32,y+11,12,true);let tipY=y+35;
 tipLines.forEach((items,i)=>{text(`0${i+1}`,32,tipY+2,9);block(items,51,tipY,20,11);tipY+=items.length*20+10});y+=tipsHeight+18;
 ctx.strokeStyle=theme.soft;ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(340,y);ctx.stroke();y+=10;
 text('扫一下，生成你的说明书',20,y+24,12,true);text('约我之前，建议先读一下。',20,y+48,9);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(qrImage,240,y,100,100);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('海报生成失败，请重试')),'image/png'));
 return {url:URL.createObjectURL(blob),width:canvas.width,height:canvas.height,link};
}
