/* giasuchillchill — Trạng thái ứng dụng và truy cập dữ liệu theo tháng */
'use strict';

const App = {
  u:null, profile:{}, students:[], view:'home',
  calYM: curYM(), calFilter:'',
  incYM: curYM(),
  prog: { sid:'', ym: curYM() },
  fee: { sid:'', mode:'month', ym: curYM(), from: curYM()+'-01', to: todayStr(), incPlanned:false, adj:0, adjNote:'' },
  stuFilter:'active'
};
const stuById = id => App.students.find(s=>s.id===id);
const slotFee = (st, sl) => (sl && sl.fee!=null && sl.fee!=='' ? Number(sl.fee) : Number(st?.fee||0));
const feeRange = st => { const fs=[...new Set([Number(st.fee||0), ...(st.slots||[]).map(sl=>slotFee(st,sl))])]; const used=(st.slots||[]).length?[...new Set((st.slots||[]).map(sl=>slotFee(st,sl)))]:fs; const mn=Math.min(...used), mx=Math.max(...used); return mn===mx?`${money(mn)}/buổi`:`${money(mn)} – ${money(mx)}/buổi`; };
const feeGroups = list => { const m=new Map(); list.forEach(s=>{ const f=feeOf(s); m.set(f,(m.get(f)||0)+1); }); return [...m.entries()].sort((a,b)=>b[0]-a[0]); };
const saveStudents = () => kvSet(K.students(App.u), {list: App.students});
const saveProfile = () => kvSet(K.profile(App.u), App.profile);
async function getMonth(ym){
  const k=K.month(App.u, ym);
  let v = await kvGet(k);
  if(!v || typeof v!=='object'){ v={ss:{}}; Store.cache[k]=v; }
  if(!v.ss) v.ss={};
  return v;
}
const saveMonth = ym => kvSet(K.month(App.u, ym), Store.cache[K.month(App.u, ym)]);
