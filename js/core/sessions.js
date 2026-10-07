/* giasuchillchill — Sinh buổi học từ lịch tuần, ghi nhận trạng thái, dạy bù */
'use strict';

function mkSession(key, rec, base){
  const src = rec ? Object.assign({}, base, {sid:rec.sid??base.sid, d:rec.d??base.d, t1:rec.t1??base.t1, t2:rec.t2??base.t2, sub:rec.sub??base.sub}) : base;
  const sfee = (rec && rec.sfee!=null) ? rec.sfee : base.sfee;
  return { key, sid:src.sid, d:src.d, t1:src.t1||'', t2:src.t2||'', sub:src.sub||'', sfee: (sfee!=null && sfee!=='') ? Number(sfee) : null, s: rec?.s || 'planned', mk: !!rec?.mk, p: rec?.p || null, fee: rec?.fee, note: rec?.note || '', from: rec?.from || '' };
}
function sessionsFromMonth(ym, md){
  const out=[]; const seen=new Set();
  const [y,m]=ym.split('-').map(Number); const days=new Date(y,m,0).getDate();
  for(let d=1; d<=days; d++){
    const ds=`${ym}-${pad(d)}`; const dow=new Date(y,m-1,d).getDay();
    for(const st of App.students){
      if(st.startDate && ds<st.startDate) continue;
      if(st.endDate && ds>st.endDate) continue;
      for(const sl of (st.slots||[])){
        if(Number(sl.dow)!==dow) continue;
        const key=`${st.id}_${ds}_${sl.id}`; seen.add(key);
        out.push(mkSession(key, md.ss[key], {sid:st.id, d:ds, t1:sl.t1, t2:sl.t2, sub:sl.sub, sfee: slotFee(st, sl)}));
      }
    }
  }
  for(const [key,rec] of Object.entries(md.ss)){
    if(seen.has(key) || !rec || !stuById(rec.sid)) continue;
    if(!rec.mk && (rec.s||'planned')==='planned' && !rec.p) continue; // stale unedited record
    out.push(mkSession(key, rec, rec));
  }
  out.sort((a,b)=> (a.d+a.t1).localeCompare(b.d+b.t1));
  return out;
}
async function sessionsForMonth(ym){ return sessionsFromMonth(ym, await getMonth(ym)); }
async function sessionsInRange(from, to){
  const all=[]; for(const ym of monthsBetween(from,to)){ all.push(...(await sessionsForMonth(ym))); }
  return all.filter(s=>s.d>=from && s.d<=to);
}
const feeOf = s => (s.fee!=null ? Number(s.fee) : (s.sfee!=null ? Number(s.sfee) : Number(stuById(s.sid)?.fee||0)));
async function updateSession(sess, patch){
  const ym=sess.d.slice(0,7); const md=await getMonth(ym);
  const rec = md.ss[sess.key] || {sid:sess.sid, d:sess.d, t1:sess.t1, t2:sess.t2, sub:sess.sub};
  Object.assign(rec, patch);
  if(patch.s){
    if(patch.s==='done'){ if(rec.fee==null) rec.fee = feeOf(Object.assign({}, sess, {fee:null})); }
    else delete rec.fee;
  }
  md.ss[sess.key]=rec;
  saveMonth(ym);
}
async function addMakeup(data){
  const ym=data.d.slice(0,7); const md=await getMonth(ym);
  const key='mk'+uid();
  md.ss[key]={sid:data.sid, d:data.d, t1:data.t1, t2:data.t2, sub:data.sub, sfee:Number(data.fee)||0, mk:1, s:'planned', from:data.from||'', note:data.note||''};
  saveMonth(ym);
  return key;
}
async function deleteRecord(sess){
  const ym=sess.d.slice(0,7); const md=await getMonth(ym);
  delete md.ss[sess.key]; saveMonth(ym);
}
const stuLine = s => { const st=stuById(s.sid); return st ? `${st.name} · Lớp ${st.grade}` : '—'; };
