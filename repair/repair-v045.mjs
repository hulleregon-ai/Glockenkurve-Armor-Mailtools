import {accountConfig,withTrash,withMailbox,stableMessageId,sourceHeaderDate,sha} from '../lib/core.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const audit=JSON.parse(await readFile(process.argv[2]||'mail-audit.json','utf8'));
if(!audit.uidValidity||!Array.isArray(audit.audit?.issues)) throw Error('Audit fehlt');
const ids=[...new Set(audit.audit.issues.map(x=>x.uid))];
if(!ids.length||ids.length>50||ids.some(x=>!Number.isSafeInteger(x))) throw Error('UID-Liste ungueltig');
const source=await withTrash(accountConfig('gmx',{}),true,async(c,b)=>{
 if(String(b.uidValidity)!==String(audit.uidValidity)) throw Error('UIDVALIDITY geaendert');
 const out=[];
 for(const uid of ids){
  const rows=await c.fetchAll([uid],{source:true,internalDate:true},{uid:true});
  if(rows.length!==1||!rows[0].source) throw Error('Original fehlt: '+uid);
  const raw=Buffer.from(rows[0].source);
  const headerDate=sourceHeaderDate(raw);
  const date=headerDate||rows[0].internalDate;
  if(!date||!Number.isFinite(new Date(date).getTime())) throw Error('Datum fehlt: '+uid);
  out.push({uid,raw,date:new Date(date),fingerprint:sha(raw)});
 }
 return out;
});
const folder='Glockenkurve-Reparatur-2026-11-06';
await mkdir('reports',{recursive:true,mode:0o700});
const report={folder,started:new Date().toISOString(),expected:source.length,items:[],complete:false,gmxUnchanged:true};
const file='reports/repair-'+Date.now()+'.json';
const save=()=>writeFile(file,JSON.stringify(report,null,2),{mode:0o600});
await save();
const yahoo=accountConfig('yahoo',{});
const scan=()=>withMailbox(yahoo,folder,true,async(c,b)=>{
 const set=new Set();
 if(b.total) for await(const m of c.fetch('1:*',{source:true})) if(m.source)set.add(sha(Buffer.from(m.source)));
 return set;
});
try{
 await withMailbox(yahoo,'INBOX',false,async c=>{
  const folders=await c.list();
  if(!folders.some(x=>x.path===folder)) await c.mailboxCreate(folder);
 });
 for(let i=0;i<source.length;i++){
  const m=source[i]; let seen=await scan();
  if(!seen.has(m.fingerprint)){
   await withMailbox(yahoo,'INBOX',false,c=>c.append(folder,m.raw,[],m.date));
   seen=await scan();
   if(!seen.has(m.fingerprint)) throw Error('Yahoo-Verifikation fehlgeschlagen fuer UID '+m.uid);
  }
  report.items.push({uid:m.uid,verified:true,date:m.date.toISOString()});
  await save();console.log((i+1)+'/'+source.length+' bestaetigt');
 }
 report.complete=true;
}catch(e){report.error=String(e?.message||e);process.exitCode=1;console.error('STOPP:',report.error)}
report.finished=new Date().toISOString();await save();
console.log('Bericht:',file,'Erfolg:',report.complete,'GMX unveraendert');
