import {accountConfig,withTrash,withMailbox,sourceHeaderDate,sha} from '../lib/core.js';
const uid=74361,folder='Glockenkurve-Reparatur-2026-11-06';
const gmx=await withTrash(accountConfig('gmx',{}),true,async c=>{
 const a=await c.fetchAll([uid],{source:true,internalDate:true},{uid:true});
 if(a.length!==1||!a[0].source)throw Error('GMX-Original nicht gefunden');
 return {raw:Buffer.from(a[0].source),internalDate:a[0].internalDate};
});
const yahoo=await withMailbox(accountConfig('yahoo',{}),folder,true,async(c,b)=>{
 if(!b.total)throw Error('Yahoo-Ordner leer');
 const a=await c.fetchAll('1:*',{source:true,internalDate:true},{uid:true});
 return a.filter(m=>m.source).map(m=>({uid:m.uid,raw:Buffer.from(m.source),internalDate:m.internalDate}));
});
function dates(m){return {header:sourceHeaderDate(m.raw)?.toISOString?.()||null,internal:m.internalDate?.toISOString?.()||String(m.internalDate||'')}}
const norm=b=>b.toString('utf8').replace(/\r\n/g,'\n').replace(/\n+$/,'\n');
const clean=b=>norm(b).replace(/^(?:Received|X-Received|Delivered-To|Return-Path|Authentication-Results|X-Yahoo-Filtered-Bulk|X-YMail-OSG|X-Yahoo-Newman-Property|X-Yahoo-Newman-Id):[^\n]*(?:\n[ \t][^\n]*)*\n/gim,'');
console.log('LESEND - GMX UID',uid,'Original-Bytes',gmx.raw.length,'Datum',JSON.stringify(dates(gmx)));
for(const y of yahoo){
 console.log('Yahoo UID',y.uid,'Bytes',y.raw.length,'Datum',JSON.stringify(dates(y)),
 'identischRaw',sha(gmx.raw)===sha(y.raw),
 'identischNormalisiert',sha(norm(gmx.raw))===sha(norm(y.raw)),
 'identischOhneTransportHeader',sha(clean(gmx.raw))===sha(clean(y.raw)));
}
console.log('Keine Aenderungen an GMX oder Yahoo.');
