import {accountConfig,withTrash} from '../lib/core.js';
const uid=74361;
await withTrash(accountConfig('gmx',{}),true,async(c,b)=>{
 console.log('LESEND: GMX Papierkorb UIDVALIDITY',String(b.uidValidity),'Anzahl',b.total);
 for(const [label,range,options] of [
  ['array-uid',[uid],{uid:true}],
  ['string-uid',String(uid),{uid:true}],
  ['array-sequence',[uid],{}]
 ]){
  try{
   const rows=await c.fetchAll(range,{uid:true,source:true,internalDate:true},options);
   console.log(label,'Anzahl',rows.length,'UIDs',JSON.stringify(rows.slice(0,3).map(x=>x.uid)),'QuelleVorhanden',rows.map(x=>!!x.source));
  }catch(e){console.log(label,'FEHLER',String(e?.message||e))}
 }
});
console.log('Keine Mail geaendert.');
