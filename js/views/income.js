/* giasuchillchill — Trang Thu nhập */
'use strict';

VIEWS.income = async () => {
  const ym=App.incYM; const today=todayStr();
  const ss = await sessionsForMonth(ym);
  const rows = App.students.map(st=>{
    const mine=ss.filter(s=>s.sid===st.id);
    const done=mine.filter(s=>s.s==='done'), plan=mine.filter(s=>s.s==='planned'), off=mine.filter(s=>s.s==='off_s'||s.s==='off_t');
    const sum=a=>a.reduce((x,s)=>x+feeOf(s),0);
    return {st, done:done.length, plan:plan.length, off:off.length, mk:mine.filter(s=>s.mk).length, earned:sum(done), planned:sum(plan), lost:sum(off), total:sum(done)+sum(plan)};
  }).filter(r=>r.done+r.plan+r.off>0);
  const T = rows.reduce((a,r)=>({done:a.done+r.done, plan:a.plan+r.plan, off:a.off+r.off, earned:a.earned+r.earned, planned:a.planned+r.planned, lost:a.lost+r.lost, total:a.total+r.total}), {done:0,plan:0,off:0,earned:0,planned:0,lost:0,total:0});
  const max = Math.max(1, ...rows.map(r=>r.total+r.lost));
  const pastPlanned = ss.filter(s=>s.s==='planned' && s.d<today).length;
  return `
  <div class="pagehead"><div><div class="eyebrow">Thu nhập dự kiến</div><h1>${ymLabel(ym)}</h1></div>
    <div class="calhead"><button class="btn sm" data-inc="-1" aria-label="Tháng trước">‹</button><input type="month" id="incMonth" value="${ym}" style="width:auto"><button class="btn sm" data-inc="1" aria-label="Tháng sau">›</button></div></div>
  <div class="stats" style="margin-bottom:18px">
    <div class="stat hero"><span class="eyebrow">Tổng dự kiến</span><span class="v">${money(T.total)}</span><span class="small">${T.done+T.plan} buổi</span></div>
    <div class="stat"><span class="eyebrow">Đã dạy</span><span class="v" style="color:var(--ok)">${money(T.earned)}</span><span class="small muted">${T.done} buổi</span></div>
    <div class="stat"><span class="eyebrow">Còn theo lịch</span><span class="v">${money(T.planned)}</span><span class="small muted">${T.plan} buổi${pastPlanned?` · ${pastPlanned} buổi đã qua chưa đánh dấu`:''}</span></div>
    <div class="stat"><span class="eyebrow">Mất do nghỉ</span><span class="v" style="color:var(--warn)">${money(T.lost)}</span><span class="small muted">${T.off} buổi không tính tiền</span></div>
  </div>
  ${rows.length ? `<div class="tbl-wrap"><table>
    <thead><tr><th>Học sinh</th><th class="r">Học phí/buổi</th><th class="r">Đã dạy</th><th class="r">Theo lịch</th><th class="r">Nghỉ</th><th>Tỷ trọng</th><th class="r">Dự kiến</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><span class="row" style="gap:8px;flex-wrap:nowrap"><span class="dot" style="background:${r.st.color}"></span><b>${esc(r.st.name)}</b><span class="muted small">L${esc(r.st.grade)}</span></span></td>
      <td class="r">${feeRange(r.st).replace('/buổi','')}</td><td class="r">${r.done}</td><td class="r">${r.plan}</td><td class="r">${r.off}</td>
      <td><div class="bar" title="Xanh: đã dạy · Tím: theo lịch · Vàng: nghỉ"><i style="width:${r.earned/max*100}%;background:var(--ok)"></i><i style="width:${r.planned/max*100}%;background:var(--accent);opacity:.55"></i><i style="width:${r.lost/max*100}%;background:var(--warn);opacity:.6"></i></div></td>
      <td class="r"><b>${money(r.total)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Tổng</td><td></td><td class="r">${T.done}</td><td class="r">${T.plan}</td><td class="r">${T.off}</td><td></td><td class="r">${money(T.total)}</td></tr></tfoot>
  </table></div>
  <p class="small muted" style="margin-top:10px">Dự kiến = (buổi đã dạy + buổi còn theo lịch) × học phí mỗi buổi. Buổi học sinh nghỉ hoặc gia sư nghỉ không được tính.</p>`
  : '<div class="empty">Tháng này chưa có buổi dạy nào.</div>'}`;
};
AFTER.income = () => {
  $$('[data-inc]').forEach(b=>b.onclick=()=>{ App.incYM=addMonths(App.incYM, Number(b.dataset.inc)); renderMain(); });
  const mi=$('#incMonth'); if(mi) mi.onchange=()=>{ if(mi.value){ App.incYM=mi.value; renderMain(); } };
};
