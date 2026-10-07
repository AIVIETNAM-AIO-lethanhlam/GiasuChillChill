/* giasuchillchill — Trang Học sinh và form hồ sơ học sinh */
'use strict';

VIEWS.students = async () => {
  const today=todayStr();
  const isActive = s => !s.endDate || s.endDate>=today;
  const list = App.students.filter(s => App.stuFilter==='all' ? true : App.stuFilter==='active' ? isActive(s) : !isActive(s));
  const nA=App.students.filter(isActive).length, nI=App.students.length-nA;
  return `
  <div class="pagehead"><div><div class="eyebrow">Học sinh</div><h1>${App.students.length} học sinh</h1></div><button class="btn primary" data-act="addStudent">+ Thêm học sinh</button></div>
  <div class="row" style="margin-bottom:14px">
    <button class="chip ${App.stuFilter==='active'?'on':''}" data-sf="active">Đang dạy (${nA})</button>
    <button class="chip ${App.stuFilter==='inactive'?'on':''}" data-sf="inactive">Đã ngừng (${nI})</button>
    <button class="chip ${App.stuFilter==='all'?'on':''}" data-sf="all">Tất cả</button>
  </div>
  ${list.length ? `<div class="stu-grid">${list.map(s=>`
    <article class="stu ${isActive(s)?'':'inactive'}">
      <div class="hd"><div class="avatar" style="background:${s.color||COLORS[0]}">${esc((s.name||'?').trim().split(' ').pop().charAt(0).toUpperCase())}</div>
        <div style="flex:1;min-width:0"><h3>${esc(s.name)}</h3><div class="small muted">Lớp ${esc(s.grade)}${s.endDate?` · ngừng từ ${fmtFull(s.endDate)}`:''}</div></div>
        <button class="btn sm" data-edit="${s.id}">Sửa</button></div>
      <div class="tags">${(s.subjects||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>
      <dl class="kv">
        <dt>Học phí</dt><dd class="num">${feeRange(s)}</dd>
        <dt>Lịch học</dt><dd>${(s.slots||[]).length? (s.slots||[]).slice().sort((a,b)=>((a.dow+6)%7)-((b.dow+6)%7)).map(sl=>`${DOW[sl.dow]} ${esc(sl.t1)}–${esc(sl.t2)}${(s.subjects||[]).length>1?` <span class="muted">(${esc(sl.sub)})</span>`:''} <span class="muted num">· ${money(slotFee(s,sl))}</span>`).join('<br>') : '<span class="muted">Chưa có lịch</span>'}</dd>
        ${s.parent||s.phone?`<dt>Phụ huynh</dt><dd>${esc(s.parent||'')}${s.phone?` · ${esc(s.phone)}`:''}</dd>`:''}
        ${s.note?`<dt>Ghi chú</dt><dd style="font-weight:500;white-space:pre-wrap">${esc(s.note)}</dd>`:''}
      </dl>
      <div class="row"><button class="btn sm" data-goprog="${s.id}">Tiến độ</button><button class="btn sm" data-gofee="${s.id}">Tính học phí</button></div>
    </article>`).join('')}</div>` : `<div class="empty">${App.students.length?'Không có học sinh trong nhóm này.':'Chưa có học sinh nào. Bấm “Thêm học sinh” để bắt đầu.'}</div>`}`;
};
AFTER.students = () => { $$('[data-sf]').forEach(b=>b.onclick=()=>{ App.stuFilter=b.dataset.sf; renderMain(); }); };

function studentForm(s){
  const isNew=!s;
  s = s ? JSON.parse(JSON.stringify(s)) : {id:uid(), name:'', grade:'', subjects:[], fee:200000, slots:[], startDate:todayStr(), endDate:'', parent:'', phone:'', note:'', color:COLORS[App.students.length%COLORS.length]};
  if(!s.slots) s.slots=[];
  let confirmDel=false;
  const draw = () => {
    const subjOpts = (s.subjects.length?s.subjects:['']).map(x=>`<option ${x?'':'value=""'}>${esc(x)}</option>`);
    openModal(`
      <div class="mh"><div><div class="eyebrow">${isNew?'Học sinh mới':'Sửa hồ sơ'}</div><h2>${esc(s.name||'Thêm học sinh')}</h2></div><button class="xbtn" data-close aria-label="Đóng">×</button></div>
      <form id="stuForm">
      <div class="mb">
        <div class="grid2">
          <label class="f">Tên học sinh<input type="text" id="s_name" value="${esc(s.name)}" required maxlength="60" placeholder="VD: Trần Minh Khang"></label>
          <label class="f">Lớp<input type="text" id="s_grade" value="${esc(s.grade)}" required maxlength="20" list="gradeList" placeholder="VD: 8"></label>
        </div>
        <datalist id="gradeList">${Array.from({length:12},(_,i)=>`<option value="${i+1}">`).join('')}<option value="Mầm non"><option value="Đại học"><option value="Người đi làm"></datalist>
        <div class="stack" style="gap:6px">
          <span class="f" style="font-size:.85rem;font-weight:600;color:var(--muted)">Môn dạy (chọn một hoặc nhiều)</span>
          <div class="row" style="gap:6px">${[...new Set([...SUBJECTS, ...s.subjects])].map(x=>`<button type="button" class="chip ${s.subjects.includes(x)?'on':''}" data-subj="${esc(x)}">${esc(x)}</button>`).join('')}</div>
          <div class="row"><input type="text" id="s_newsub" placeholder="Môn khác…" style="flex:1;min-width:140px"><button type="button" class="btn sm" id="s_addsub">Thêm môn</button></div>
        </div>
        <div class="grid2">
          <label class="f">Học phí mặc định mỗi buổi (đ)<input type="number" id="s_fee" value="${esc(s.fee)}" min="0" step="10000" required></label>
          <label class="f">Bắt đầu dạy từ<input type="date" id="s_start" value="${esc(s.startDate)}"></label>
        </div>
        <div class="stack" style="gap:8px">
          <span style="font-size:.85rem;font-weight:600;color:var(--muted)">Lịch học hằng tuần</span>
          <span class="small muted">Mỗi buổi có thể đặt giá riêng (VD: thứ 3 học 2 tiếng giá cao hơn). Để trống ô giá thì dùng học phí mặc định.</span>
          ${s.slots.length?'<div class="slot-h"><span>Thứ</span><span>Từ</span><span>Đến</span><span>Môn</span><span>Giá buổi này</span><span></span></div>':''}
          ${s.slots.map((sl,i)=>`<div class="slot">
            <select data-sl="${i}" data-k="dow" aria-label="Thứ">${[1,2,3,4,5,6,0].map(d=>`<option value="${d}" ${Number(sl.dow)===d?'selected':''}>${DOW_FULL[d]}</option>`).join('')}</select>
            <input type="time" data-sl="${i}" data-k="t1" value="${esc(sl.t1)}" aria-label="Giờ bắt đầu" required>
            <input type="time" data-sl="${i}" data-k="t2" value="${esc(sl.t2)}" aria-label="Giờ kết thúc" required>
            <select data-sl="${i}" data-k="sub" aria-label="Môn">${(s.subjects.length?s.subjects:['']).map(x=>`<option value="${esc(x)}" ${sl.sub===x?'selected':''}>${esc(x||'Chọn môn trước')}</option>`).join('')}</select>
            <input type="number" data-sl="${i}" data-k="fee" value="${sl.fee!=null&&sl.fee!==''?esc(sl.fee):''}" min="0" step="10000" placeholder="${esc(Number(s.fee||0).toLocaleString('vi-VN'))}" aria-label="Giá buổi này (đ)">
            <button type="button" class="btn sm ghost del" data-delslot="${i}" aria-label="Xóa buổi">Xóa</button>
          </div>`).join('') || '<div class="small muted">Chưa có buổi nào trong tuần.</div>'}
          <div><button type="button" class="btn sm" id="s_addslot">+ Thêm buổi trong tuần</button></div>
        </div>
        <div class="grid2">
          <label class="f">Tên phụ huynh<input type="text" id="s_parent" value="${esc(s.parent)}" maxlength="60" placeholder="VD: Chị Lan"></label>
          <label class="f">SĐT phụ huynh<input type="tel" id="s_phone" value="${esc(s.phone)}" maxlength="20"></label>
        </div>
        <label class="f">Ghi chú<textarea id="s_note" maxlength="600" placeholder="Mục tiêu, tính cách, lưu ý…">${esc(s.note)}</textarea></label>
        <div class="stack" style="gap:6px"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">Màu trên lịch</span>
          <div class="row" style="gap:6px">${COLORS.map(c=>`<button type="button" data-color="${c}" aria-label="Màu ${c}" style="width:28px;height:28px;border-radius:8px;border:2px solid ${s.color===c?'var(--ink)':'transparent'};background:${c};cursor:pointer"></button>`).join('')}</div></div>
        ${!isNew ? `<div class="row">
            ${s.endDate ? `<button type="button" class="btn sm" id="s_resume">Dạy lại học sinh này</button>` : `<button type="button" class="btn sm" id="s_stop">Ngừng dạy từ hôm nay</button>`}
            <button type="button" class="btn sm danger" id="s_del">Xóa học sinh</button></div>
          ${confirmDel?`<div class="confirm-box"><b>Xóa ${esc(s.name)}?</b><span class="small">Lịch, tiến độ và học phí của học sinh này sẽ không còn hiện nữa. Nếu chỉ tạm ngừng, hãy chọn “Ngừng dạy”.</span><div class="row"><button type="button" class="btn sm danger" id="s_delyes">Xóa hẳn</button><button type="button" class="btn sm" id="s_delno">Giữ lại</button></div></div>`:''}`:''}
        <div class="err" id="s_err" role="alert"></div>
      </div>
      <div class="mf"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn primary">${isNew?'Thêm học sinh':'Lưu thay đổi'}</button></div>
      </form>`);
    const read = () => {
      s.name=$('#s_name').value; s.grade=$('#s_grade').value; s.fee=Number($('#s_fee').value||0); s.startDate=$('#s_start').value;
      s.parent=$('#s_parent').value; s.phone=$('#s_phone').value; s.note=$('#s_note').value;
      $$('[data-sl]').forEach(el=>{ const sl=s.slots[Number(el.dataset.sl)]; if(!sl) return; const k=el.dataset.k; if(k==='dow') sl.dow=Number(el.value); else if(k==='fee') sl.fee = el.value===''?'':Number(el.value); else sl[k]=el.value; });
    };
    $$('[data-subj]').forEach(b=>b.onclick=()=>{ read(); const x=b.dataset.subj; s.subjects = s.subjects.includes(x)? s.subjects.filter(y=>y!==x) : [...s.subjects,x]; s.slots.forEach(sl=>{ if(!s.subjects.includes(sl.sub)) sl.sub=s.subjects[0]||''; }); draw(); });
    $('#s_addsub').onclick=()=>{ read(); const v=$('#s_newsub').value.trim(); if(v && !s.subjects.includes(v)){ s.subjects.push(v); s.slots.forEach(sl=>{ if(!sl.sub) sl.sub=v; }); } draw(); };
    $('#s_addslot').onclick=()=>{ read(); const last=s.slots[s.slots.length-1]; s.slots.push({id:uid(), dow: last? (Number(last.dow)+2)%7 : 1, t1: last?.t1||'18:00', t2: last?.t2||'19:30', sub: s.subjects[0]||'', fee:''}); draw(); };
    $$('[data-delslot]').forEach(b=>b.onclick=()=>{ read(); s.slots.splice(Number(b.dataset.delslot),1); draw(); });
    $$('[data-color]').forEach(b=>b.onclick=()=>{ read(); s.color=b.dataset.color; draw(); });
    if(!isNew){
      const stop=$('#s_stop'); if(stop) stop.onclick=()=>{ read(); s.endDate=todayStr(); draw(); };
      const res=$('#s_resume'); if(res) res.onclick=()=>{ read(); s.endDate=''; draw(); };
      $('#s_del').onclick=()=>{ read(); confirmDel=true; draw(); };
      const y=$('#s_delyes'); if(y) y.onclick=()=>{ App.students=App.students.filter(x=>x.id!==s.id); Store.cache[K.students(App.u)].list=App.students; saveStudents(); closeModal(); toast(`Đã xóa ${s.name}`); renderMain(); };
      const n=$('#s_delno'); if(n) n.onclick=()=>{ read(); confirmDel=false; draw(); };
    }
    $('#stuForm').onsubmit = e => {
      e.preventDefault(); read();
      const err=$('#s_err');
      if(!s.name.trim()) return err.textContent='Nhập tên học sinh.';
      if(!s.subjects.length) return err.textContent='Chọn ít nhất một môn dạy.';
      for(const sl of s.slots){ if(!sl.t1||!sl.t2) return err.textContent='Điền đủ giờ bắt đầu và kết thúc cho từng buổi.'; if(sl.t2<=sl.t1) return err.textContent='Giờ kết thúc phải sau giờ bắt đầu.'; if(!sl.sub) sl.sub=s.subjects[0]; if(sl.fee!=='' && sl.fee!=null && (isNaN(sl.fee)||sl.fee<0)) return err.textContent='Giá buổi phải là số không âm.'; }
      s.name=s.name.trim(); s.grade=s.grade.trim();
      const i=App.students.findIndex(x=>x.id===s.id);
      if(i>=0) App.students[i]=s; else App.students.push(s);
      Store.cache[K.students(App.u)].list=App.students;
      saveStudents(); closeModal(); toast(isNew?`Đã thêm ${s.name}`:'Đã lưu thay đổi'); renderMain();
    };
  };
  draw();
}
