/* giasuchillchill — Trang Lịch dạy */
'use strict';

VIEWS.calendar = async () => {
  const ym=App.calYM; const today=todayStr();
  let ss = await sessionsForMonth(ym);
  if(App.calFilter) ss = ss.filter(s=>s.sid===App.calFilter);
  const byDay={}; ss.forEach(s=>(byDay[s.d]=byDay[s.d]||[]).push(s));
  const [y,m]=ym.split('-').map(Number);
  const first=new Date(y,m-1,1); const startOffset=(first.getDay()+6)%7; // Monday first
  const start=new Date(y,m-1,1-startOffset);
  const days=new Date(y,m,0).getDate();
  const cells=Math.ceil((startOffset+days)/7)*7;
  let grid=['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class="dh">${d}</div>`).join('');
  for(let i=0;i<cells;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const ds=ymd(d); const inM=d.getMonth()===m-1;
    const evs=(inM?byDay[ds]:null)||[];
    grid+=`<div class="day ${inM?'':'out'} ${ds===today?'today':''}">
      <div class="dn"><span>${d.getDate()}</span>${inM?`<button class="add" data-addmk="${ds}" title="Thêm buổi dạy bù ngày ${fmtDD(ds)}" aria-label="Thêm buổi dạy bù ngày ${fmtDD(ds)}">+</button>`:''}</div>
      ${evs.map(s=>{const st=stuById(s.sid); return `<button class="ev ${s.s} ${s.mk?'mkb':''}" data-sess="${esc(s.key)}" data-d="${s.d}" style="${s.s==='planned'&&st?.color?`border-left-color:${st.color}`:''}"><b>${esc(s.t1)} ${esc(st?.name||'?')}</b><span class="l2">L${esc(st?.grade||'')} · ${esc(s.sub)}${s.mk?' · bù':''}</span></button>`;}).join('')}
    </div>`;
  }
  const days2=Object.keys(byDay).sort();
  const agenda = days2.length ? days2.map(ds=>`<div><div class="dayh ${ds===today?'today':''}"><span>${DOW_FULL[parseD(ds).getDay()]}, ${fmtFull(ds)}</span><button class="btn sm ghost" data-addmk="${ds}">+ Bù</button></div><div class="list">${byDay[ds].map(s=>sessRow(s)).join('')}</div></div>`).join('') : '<div class="empty">Tháng này chưa có buổi dạy nào.</div>';
  const cnt = k => ss.filter(s=>s.s===k).length;
  return `
  <div class="pagehead"><div><div class="eyebrow">Lịch dạy</div><h1>${ymLabel(ym)}</h1></div>
    <div class="row"><button class="btn" data-addmk="${ym===curYM()?today:ym+'-01'}">+ Thêm buổi dạy bù</button></div></div>
  <div class="row" style="justify-content:space-between;margin-bottom:12px">
    <div class="calhead">
      <button class="btn sm" data-cal="-1" aria-label="Tháng trước">‹</button>
      <input type="month" id="calMonth" value="${ym}" style="width:auto">
      <button class="btn sm" data-cal="1" aria-label="Tháng sau">›</button>
      <button class="btn sm ghost" data-cal="0">Hôm nay</button>
    </div>
    <select id="calFilter" style="width:auto;min-width:180px"><option value="">Tất cả học sinh</option>${App.students.map(s=>`<option value="${s.id}" ${App.calFilter===s.id?'selected':''}>${esc(s.name)} · L${esc(s.grade)}</option>`).join('')}</select>
  </div>
  <div class="legend" style="margin-bottom:10px">
    <span><i style="background:var(--plan)"></i>Theo lịch (${cnt('planned')})</span>
    <span><i style="background:var(--ok)"></i>Đã dạy (${cnt('done')})</span>
    <span><i style="background:var(--warn)"></i>HS nghỉ (${cnt('off_s')})</span>
    <span><i style="background:var(--bad)"></i>GS nghỉ (${cnt('off_t')})</span>
    <span><i style="background:transparent;box-shadow:inset 0 0 0 1.5px var(--mk)"></i>Dạy bù (${ss.filter(s=>s.mk).length})</span>
  </div>
  <div class="cal-wrap"><div class="cal">${grid}</div></div>
  <div class="agenda mobile-only">${agenda}</div>
  <p class="small muted" style="margin-top:10px">Bấm vào một buổi để đánh dấu đã dạy hay nghỉ và ghi tiến độ. Bấm “+” trên một ngày để thêm buổi dạy bù.</p>`;
};
AFTER.calendar = () => {
  $$('[data-cal]').forEach(b=>b.onclick=()=>{ const n=Number(b.dataset.cal); App.calYM = n===0?curYM():addMonths(App.calYM,n); renderMain(); });
  const mi=$('#calMonth'); if(mi) mi.onchange=()=>{ if(mi.value){ App.calYM=mi.value; renderMain(); } };
  const f=$('#calFilter'); if(f) f.onchange=()=>{ App.calFilter=f.value; renderMain(); };
};
