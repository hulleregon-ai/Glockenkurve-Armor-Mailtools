import {accountConfig,withMailbox,sourceHeaderDate,sha} from '../lib/core.js';
const folder='Glockenkurve-Reparatur-2026-11-06';
const yahoo=accountConfig('yahoo',{});
console.log('LESEND: pruefe Yahoo-Reparaturordner, keine Kopien oder Loeschungen');
try {
 await withMailbox(yahoo,folder,true,async(c,b)=>{
  console.log('Ordner:',folder,'Nachrichten:',b.total);
  if(!b.total)return;
  let n=0;
  for await(const m of c.fetch('1:*',{uid:true,source:true,envelope:true,internalDate:true})){
   const raw=m.source?Buffer.from(m.source):null;
   const date=raw?sourceHeaderDate(raw):null;
   console.log(JSON.stringify({uid:m.uid,bytes:raw?.length,rawSha256:raw?sha(raw):null,headerDate:date?.toISOString?.()||null,internalDate:m.internalDate?.toISOString?.()||String(m.internalDate||''),messageId:m.envelope?.messageId||null}));
   if(++n>=30){console.log('Ausgabe auf 30 Nachrichten begrenzt');break;}
  }
 });
}catch(e){console.error('DIAGNOSEFEHLER:',e?.stack||String(e));process.exitCode=1;}
