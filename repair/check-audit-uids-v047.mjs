import {readFile} from 'node:fs/promises';
import {accountConfig,withTrash} from '../lib/core.js';
const audit=JSON.parse(await readFile('mail-audit.json','utf8'));
const wanted=[...new Set((audit.audit?.issues||[]).map(x=>Number(x.uid)))];
if(!wanted.length)throw Error('Keine UIDs im Audit');
await withTrash(accountConfig('gmx',{}),true,async(c,b)=>{
 const found=new Set(),first=[],last=[];
 for await(const m of c.fetch('1:*',{uid:true},{uid:false})){
  if(!Number.isSafeInteger(m.uid))continue;
  if(first.length<5)first.push(m.uid);
  last.push(m.uid);if(last.length>5)last.shift();
  if(wanted.includes(m.uid))found.add(m.uid);
 }
 console.log('UIDVALIDITY',String(b.uidValidity),'Papierkorb-Anzahl',b.total);
 console.log('UID-Beispiele Anfang:',first.join(','),'Ende:',last.join(','));
 console.log('Audit-UIDs vorhanden:',wanted.filter(x=>found.has(x)).join(',')||'keine');
 console.log('Audit-UIDs fehlend:',wanted.filter(x=>!found.has(x)).join(',')||'keine');
 console.log('Vorhanden',found.size,'von',wanted.length);
});
console.log('NUR GELESEN: keine Nachricht kopiert oder geloescht.');
