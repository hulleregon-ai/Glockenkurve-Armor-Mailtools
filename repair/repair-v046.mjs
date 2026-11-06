import {accountConfig,withTrash,withMailbox,sourceHeaderDate,sha} from '../lib/core.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const folder='Glockenkurve-Reparatur-2026-11-06';
const audit=JSON.parse(await readFile(process.argv[2]||'mail-audit.json','utf8'));
if(!audit.uidValidity||!Array.isArray(audit.audit?.issues))throw Error('Audit fehlt');
const uids=[...new Set(audit.audit.issues.map(x=>x.uid))];
if(!uids.length||uids.length>50||uids.some(x=>!Number.isSafeInteger(x)))throw Error('UID-Liste ungueltig');
function normalized(raw){
 const s=Buffer.from(raw).toString('latin1').replace(/\r\n/g,'\n');
 const p=s.indexOf('\n\n');if(p<0)throw Error('Headertrenner fehlt');
 const headers=s.slice(0,p).replace(/^content-length:[^\n]*(?:\n[ \t][^\n]*)*\n?/gim,'');
 return headers.trimEnd()+'\n\n'+s.slice(p+2);
}
function day(raw){const d=sourceHeaderDate(raw);if(!d||!Number.isFinite(d.getTime()))throw Error('Datum fehlt');return d.toISOString().slice(0,10)}
function key(raw){return sha(Buffer.from(normalized(raw),'latin1'))+'|'+day(raw)}
const original=await withTrash(accountConfig('gmx',{}),true,async(c,b)=>{
 if(String(b.uidValidity)!==String(audit.uidValidity))throw Error('UIDVALIDITY geaendert');
 const out=[];for(const uid of uids){
  const a=await c.fetchAll([uid],{source:true},{uid:true});
  if(a.length!==1||!a[0].source)throw Error('GMX UID fehlt '+uid);
  const raw=Buffer.from(a[0].source);
  out.push({uid,raw,key:key(raw),date:sourceHeaderDate(raw)});
 }return out;
});
await mkdir('reports',{recursive:true,mode:0o700});
const report={version:'0.4.6',expected:original.length,items:[],complete:false,gmxUnchanged:true};
const file='reports/repair-v046-'+Date.now()+'.json';
const save=()=>writeFile(file,JSON.stringify(report,null,2),{mode:0o600});
await save();
const yahoo=accountConfig('yahoo',{});
async function scan(){return withMailbox(yahoo,folder,true,async(c,b)=>{
 const found=new Map();if(!b.total)return found;
 for await(const m of c.fetch('1:*',{source:true})){
  if(!m.source)continue;const k=key(m.source);found.set(k,(found.get(k)||0)+1);
 }return found;
});}
try{
 await withMailbox(yahoo,'INBOX',false,async c=>{
  if(!(await c.list()).some(x=>x.path===folder))await c.mailboxCreate(folder);
 });
 for(let i=0;i<original.length;i++){
  const m=original[i];let found=await scan();let n=found.get(m.key)||0;
  if(n>1)throw Error('Mehrfachkopie UID '+m.uid);
  if(n===0){
   console.log((i+1)+'/'+original.length+' kopiere UID '+m.uid);
   await withMailbox(yahoo,'INBOX',false,c=>c.append(folder,m.raw,[],m.date));
   found=await scan();n=found.get(m.key)||0;
   if(n!==1)throw Error('Yahoo-Verifikation fehlgeschlagen UID '+m.uid);
  }
  report.items.push({uid:m.uid,result:'verified',existing:n===1});
  await save();console.log((i+1)+'/'+original.length+' bestaetigt');
 }
 report.complete=true;
}catch(e){report.error=String(e?.message||e);process.exitCode=1;console.error('STOPP:',report.error)}
await save();console.log('BERICHT:',file,'ERFOLG:',report.complete,'GMX unveraendert');
