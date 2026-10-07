/* giasuchillchill — Trang Tổng quan */
'use strict';

VIEWS.home = async () => {
  const ym=curYM(); const today=todayStr();
  const ss = await sessionsForMonth(ym);
  const prev = await sessionsForMonth(addMonths(ym,-1));
  const todays = ss.filter(s=>s.d===today && s.s!=='off_t');
  const pending = [...prev, ...ss].filter(s=>s.d<today && s.s==='planned');
  const done = ss.filter(s=>s.s==='done');
  const planned = ss.filter(s=>s.s==='planned');
  const expected = [...done,...planned].reduce((a,s)=>a+feeOf(s),0);
  const earned = done.reduce((a,s)=>a+feeOf(s),0);
  const upcoming = ss.filter(s=>s.d>today && s.s==='planned').slice(0,6);
  const active = App.students.filter(s=>!s.endDate || s.endDate>=today).length;
  const hi = new Date().getHours(); const greet = hi<11?'Chào buổi sáng':hi<14?'Chào buổi trưa':hi<18?'Chào buổi chiều':'Chào buổi tối';
  if(!App.students.length){
    return `<div class="pagehead"><div><div class="eyebrow">${greet}</div><h1>${esc(App.profile.displayName||'')}</h1></div></div>
    <div class="card stack" style="max-width:620px">
      <h2>Bắt đầu với học sinh đầu tiên</h2>
      <p class="muted">Thêm học sinh cùng lịch học hằng tuần và học phí mỗi buổi. Lịch dạy, thu nhập dự kiến và học phí sẽ tự tính từ đó.</p>
      <div class="row"><button class="btn primary" data-act="addStudent">+ Thêm học sinh</button><button class="btn" data-go="settings">Thêm mã QR nhận tiền</button></div>
    </div>`;
  }
  return `
  <div class="pagehead"><div><div class="eyebrow">${greet} · ${fmtFull(today)}</div><h1>${esc(App.profile.displayName||'')}</h1></div>
    <button class="btn primary" data-act="addStudent">+ Thêm học sinh</button></div>
  <div class="stats" style="margin-bottom:22px">
    <div class="stat hero"><span class="eyebrow">Dự kiến ${ymLabel(ym).toLowerCase()}</span><span class="v">${money(expected)}</span><span class="small">đã dạy ${money(earned)}</span></div>
    <div class="stat"><span class="eyebrow">Buổi đã dạy</span><span class="v">${done.length}</span><span class="small muted">còn ${planned.filter(s=>s.d>=today).length} buổi theo lịch</span></div>
    <div class="stat"><span class="eyebrow">Học sinh đang dạy</span><span class="v">${active}</span><span class="small muted">tổng ${App.students.length} hồ sơ</span></div>
    <div class="stat"><span class="eyebrow">Chưa ghi nhận</span><span class="v" style="color:${pending.length?'var(--warn)':'inherit'}">${pending.length}</span><span class="small muted">buổi đã qua chưa đánh dấu</span></div>
  </div>
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px;align-items:start">
    <section>
      <div class="section-title"><h3>Hôm nay</h3><span class="small muted">${todays.length} buổi</span></div>
      <div class="list">${todays.length ? todays.map(s=>sessRow(s,{quick:true})).join('') : '<div class="empty">Hôm nay không có lịch dạy. Chill thôi.</div>'}</div>
      <div class="section-title" style="margin-top:22px"><h3>Sắp tới</h3><button class="btn sm ghost" data-go="calendar">Xem lịch tháng →</button></div>
      <div class="list">${upcoming.length ? upcoming.map(s=>sessRow(s,{date:true})).join('') : '<div class="empty">Không còn buổi nào trong tháng.</div>'}</div>
    </section>
    <section>
      <div class="section-title"><h3>Buổi cần ghi nhận</h3><span class="small muted">bấm vào buổi để ghi tiến độ</span></div>
      <div class="list">${pending.length ? pending.slice(-12).reverse().map(s=>sessRow(s,{date:true,quick:true})).join('') : '<div class="empty">Tất cả buổi đã qua đều đã được đánh dấu.</div>'}</div>
    </section>
  </div>`;
};
