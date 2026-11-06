import {accountConfig,withTrash,withMailbox,sourceHeaderDate} from '../lib/core.js';
const uid=74361,folder='Glockenkurve-Reparatur-2026-11-06';
const gm=await withTrash(accountConfig('gmx',{}),true,async c=>{const a=await c.fetchAll([uid],{source:true},{uid:true});if(a.length!==1||!a[0].source)throw Error('GMX Original fehlt');return Buffer.from(a[0].source)});
const ys=await withMailbox(accountConfig('yahoo',{}),folder,true,async(c,b)=>b.total?c.fetchAll('1:*',{source:true},{uid:true}):[]);
function split(raw){const s=raw.toString('latin1').replace(/\r\n/g,'\n');const p=s.indexOf('\n\n');return {headers:p<0?s:s.slice(0,p),body:p<0?'':s.slice(p+2)}}
function norm(s){return s.replace(/\r\n/g,'\n').replace(/\n+$/,'\n')}
function head(h){return h.split('\n').filter(x=>/^[^\s:][^:]*:/.test(x)).map(x=>x.split(':')[0].toLowerCase())}
const a=split(gm);
console.log('Nur lesende Analyse, GMX UID',uid,'Bytes',gm.length,'Body-Laenge',a.body.length,'Header-Namen',JSON.stringify(head(a.headers)));
for(const y of ys.filter(x=>x.source)){const raw=Buffer.from(y.source),b=split(raw);console.log('Yahoo UID',y.uid,'Bytes',raw.length,'Body-Laenge',b.body.length,'BodyIdentisch',norm(a.body)===norm(b.body),'Header-Namen',JSON.stringify(head(b.headers)),'Datum',sourceHeaderDate(raw)?.toISOString?.()||'unbekannt');}
console.log('Keine Nachricht geaendert.');
