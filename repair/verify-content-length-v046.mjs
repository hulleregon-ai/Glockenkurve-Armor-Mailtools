// Glockenkurve Armor V0.4.6: sicherer, nur lesender Vorabcheck
import { accountConfig, withTrash, withMailbox, sourceHeaderDate, sha } from '../lib/core.js';
const folder = 'Glockenkurve-Reparatur-2026-11-06';
function parts(raw) {
  const s = Buffer.from(raw).toString('latin1').replace(/\r\n/g, '\n');
  const p = s.indexOf('\n\n');
  if (p < 0) throw Error('Ungueltiges Mailformat');
  return { headers: s.slice(0,p).replace(/^content-length:[^\n]*(?:\n[ \t][^\n]*)*\n?/gim, '').trimEnd(), body: s.slice(p+2) };
}
function signature(raw) {
  const p = parts(raw);
  return sha(Buffer.from(p.headers + '\n\n' + p.body, 'latin1'));
}
const g = await withTrash(accountConfig('gmx', {}), true, async c => {
  const a = await c.fetchAll([74361], {source:true}, {uid:true});
  if (a.length !== 1 || !a[0].source) throw Error('GMX UID 74361 fehlt');
  return Buffer.from(a[0].source);
});
const ys = await withMailbox(accountConfig('yahoo', {}), folder, true, async (c,b) => b.total ? c.fetchAll('1:*', {source:true}, {uid:true}) : []);
for (const m of ys) {
  if (!m.source) continue;
  const y = Buffer.from(m.source);
  console.log('Yahoo UID',m.uid,'Vergleich ohne Content-Length:',signature(g)===signature(y),'Datum GMX:',sourceHeaderDate(g)?.toISOString(),'Datum Yahoo:',sourceHeaderDate(y)?.toISOString());
}
console.log('Nur gelesen. Keine E-Mail kopiert oder geloescht.');
