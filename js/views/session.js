/* giasuchillchill — Hộp thoại buổi học, đánh dấu nhanh, thêm buổi dạy bù */
'use strict';

async function openSession(key, d){
  const ym=d.slice(0,7);
  const ss = await sessionsForMonth(ym);
  const s = ss.find(x=>x.key===key); if(!s) return toast('Không tìm thấy buổi học này.');
  const st = stuById(s.sid);
  const rows = await getTable(ym, s.sid);
  let row = rows.find(r=>r.key===s.key) || rows.find(r=>r.d===s.d && !r.key);
  const pr = row ? Object.assign({}, row, {subs:[...(row.subs||[])]}) : rowFromSession(s);
  const p = {reason: s.p?.reason||'', note: s.p?.note||''};
  if(!pr.note && p.note) pr.note=p.note;
  let status = s.s; let confirmDel=false;
  const draw = () => {
    const opts=[...new Set([...(st?.subjects||[]), ...pr.subs])];
    openModal(`
      <div class="mh"><div><div class="eyebrow">${DOW_FULL[parseD(s.d).getDay()]}, ${fmtFull(s.d)} · ${esc(s.t1)}–${esc(s.t2)}${s.mk?' · Dạy bù':''}</div>
        <h2>${esc(st?.name||'?')}</h2><div class="small muted">Lớp ${esc(st?.grade||'')} · ${esc(s.sub)} · ${money(feeOf(s))}/buổi</div></div>
        <button class="xbtn" data-close aria-label="Đóng">×</button></div>
      <form id="sessForm"><div class="mb">
        <div class="stack" style="gap:6px"><span class="eyebrow">Tình trạng buổi học</span>
          <div class="seg">${Object.keys(STATUS).map(k=>`<button type="button" class="${k} ${status===k?'on':''}" data-st="${k}">${STATUS[k].label}</button>`).join('')}</div></div>
        ${status==='off_s'||status==='off_t' ? `
          <label class="f">Lý do nghỉ<input type="text" id="p_reason" value="${esc(p.reason)}" maxlength="120" placeholder="VD: ốm, đi thi, về quê…"></label>
          <div class="row"><button type="button" class="btn sm" id="p_makeup">+ Xếp buổi dạy bù</button><span class="small muted">Buổi nghỉ không tính học phí.</span></div>` : `
        <div class="stack" style="gap:12px">
          <span class="eyebrow">Tiến độ buổi học <span style="text-transform:none;letter-spacing:0;font-weight:500">· lưu vào bảng Tiến độ</span></span>
          <div class="stack" style="gap:6px"><span class="f" style="font-size:.85rem;font-weight:600;color:var(--muted)">Môn học</span>
            <div class="row" style="gap:6px">${opts.map(n=>`<button type="button" class="chip subjchip ${pr.subs.includes(n)?'on':''}" data-psub="${esc(n)}" style="--c:${subjColor(n)}">${esc(n)}</button>`).join('')}</div></div>
          <div class="stack" style="gap:6px"><span class="f" style="font-size:.85rem;font-weight:600;color:var(--muted)">BTVN buổi trước làm được</span>
            <div class="seg">${HWP.map(([v,l])=>`<button type="button" class="gen ${pr.hwPrev===v?'on':''}" data-hwp="${v}">${l}</button>`).join('')}</div></div>
          <label class="f">Nội dung buổi học<textarea id="p_lesson" maxlength="1000" placeholder="VD: Bài 5 — Phương trình bậc nhất một ẩn, làm bài 1–6 SGK">${esc(pr.lesson)}</textarea></label>
          <label class="f">Bài tập về nhà<textarea id="p_hw" maxlength="600" placeholder="VD: Bài 7–10 trang 42">${esc(pr.hw)}</textarea></label>
          <label class="f">Lưu ý<textarea id="p_note" maxlength="600" placeholder="VD: cần ôn lại phân số, sắp kiểm tra giữa kỳ…">${esc(pr.note||'')}</textarea></label>
        </div>`}
        ${s.mk ? `<div class="row"><button type="button" class="btn sm danger" id="p_del">Xóa buổi dạy bù này</button></div>
          ${confirmDel?`<div class="confirm-box"><b>Xóa buổi dạy bù ngày ${fmtFull(s.d)}?</b><div class="row"><button type="button" class="btn sm danger" id="p_delyes">Xóa</button><button type="button" class="btn sm" id="p_delno">Giữ lại</button></div></div>`:''}`:''}
      </div>
      <div class="mf"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn primary">Lưu buổi học</button></div></form>`);
    const read = () => { const g=id=>$(id)?.value; if($('#p_reason')) p.reason=g('#p_reason'); if($('#p_lesson')){ pr.lesson=g('#p_lesson'); pr.hw=g('#p_hw'); pr.note=g('#p_note'); } };
    $$('[data-st]').forEach(b=>b.onclick=()=>{ read(); status=b.dataset.st; draw(); });
    $$('[data-psub]').forEach(b=>b.onclick=()=>{ read(); const n=b.dataset.psub; pr.subs = pr.subs.includes(n)? pr.subs.filter(x=>x!==n) : [...pr.subs,n]; draw(); });
    $$('[data-hwp]').forEach(b=>b.onclick=()=>{ read(); pr.hwPrev = pr.hwPrev===b.dataset.hwp?'':b.dataset.hwp; draw(); });
    const mkb=$('#p_makeup'); if(mkb) mkb.onclick=async()=>{ read(); await commit(); openMakeup({sid:s.sid, sub:s.sub, t1:s.t1, t2:s.t2, fee:feeOf(s), from:s.key, fromD:s.d}); };
    const del=$('#p_del'); if(del) del.onclick=()=>{ read(); confirmDel=true; draw(); };
    const dy=$('#p_delyes'); if(dy) dy.onclick=async()=>{ const i=rows.findIndex(r=>r.key===s.key); if(i>=0) rows.splice(i,1); await deleteRecord(s); closeModal(); toast('Đã xóa buổi dạy bù'); renderMain(); };
    const dn=$('#p_delno'); if(dn) dn.onclick=()=>{ confirmDel=false; draw(); };
    $('#sessForm').onsubmit = async e => { e.preventDefault(); read(); await commit(); closeModal(); toast(`Đã lưu: ${STATUS[status].label}`); renderMain(); };
  };
  const commit = async () => {
    const off = status==='off_s'||status==='off_t';
    if(off){
      if(row && !row.lesson?.trim() && !row.hw?.trim() && !row.hwPrev && !row.note?.trim()){ const i=rows.indexOf(row); if(i>=0) rows.splice(i,1); row=null; }
    } else {
      pr.lesson=(pr.lesson||'').trim(); pr.hw=(pr.hw||'').trim(); pr.note=(pr.note||'').trim(); pr.key=s.key; if(!pr.d) pr.d=s.d;
      if(row) Object.assign(row, pr); else { row=pr; rows.push(pr); sortRows(rows); }
    }
    const clean={}; if(off && p.reason.trim()) clean.reason=p.reason.trim(); 
    await updateSession(s, {s:status, p: Object.keys(clean).length?clean:null});
  };
  draw();
}
async function quickMark(key, d, status){
  const ss = await sessionsForMonth(d.slice(0,7)); const s=ss.find(x=>x.key===key); if(!s) return;
  await updateSession(s, {s:status});
  toast(`${stuById(s.sid)?.name||''}: ${STATUS[status].label}`);
  renderMain();
}
function openMakeup(pre={}){
  const active = App.students.filter(s=>!s.endDate || s.endDate>=todayStr());
  const list = active.length?active:App.students;
  if(!list.length){ toast('Thêm học sinh trước đã.'); return; }
  let sid = pre.sid || list[0].id;
  const draw = () => {
    const st=stuById(sid);
    openModal(`
      <div class="mh"><div><div class="eyebrow">Thêm buổi dạy bù</div><h2>${pre.fromD?`Bù cho buổi ${fmtFull(pre.fromD)}`:'Buổi dạy bù / học thêm'}</h2></div><button class="xbtn" data-close aria-label="Đóng">×</button></div>
      <form id="mkForm"><div class="mb">
        <label class="f">Học sinh<select id="m_sid">${list.map(s=>`<option value="${s.id}" ${s.id===sid?'selected':''}>${esc(s.name)} · Lớp ${esc(s.grade)}</option>`).join('')}</select></label>
        <div class="grid2">
          <label class="f">Ngày dạy<input type="date" id="m_d" value="${esc(pre.d||todayStr())}" required></label>
          <label class="f">Môn<select id="m_sub">${(st?.subjects||[]).map(x=>`<option ${x===(pre.sub)?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
          <label class="f">Từ<input type="time" id="m_t1" value="${esc(pre.t1||'18:00')}" required></label>
          <label class="f">Đến<input type="time" id="m_t2" value="${esc(pre.t2||'19:30')}" required></label>
          <label class="f">Giá buổi này (đ)<input type="number" id="m_fee" min="0" step="10000" value="${esc(pre.fee!=null&&pre.fee!==''?pre.fee:(st?.fee||0))}" required></label>
        </div>
        <label class="f">Ghi chú<input type="text" id="m_note" maxlength="200" value="${esc(pre.note||'')}" placeholder="VD: bù buổi nghỉ lễ"></label>
        <div class="err" id="m_err" role="alert"></div>
      </div>
      <div class="mf"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn primary">Thêm vào lịch</button></div></form>`);
    $('#m_sid').onchange=()=>{ pre.d=$('#m_d').value; pre.t1=$('#m_t1').value; pre.t2=$('#m_t2').value; pre.note=$('#m_note').value; sid=$('#m_sid').value; pre.sub=''; pre.fee=''; draw(); };
    $('#mkForm').onsubmit = async e => {
      e.preventDefault();
      const d=$('#m_d').value, t1=$('#m_t1').value, t2=$('#m_t2').value;
      if(!d||!t1||!t2) return $('#m_err').textContent='Điền đủ ngày và giờ.';
      if(t2<=t1) return $('#m_err').textContent='Giờ kết thúc phải sau giờ bắt đầu.';
      await addMakeup({sid, d, t1, t2, sub:$('#m_sub').value, fee:$('#m_fee').value, note:$('#m_note').value, from:pre.from||''});
      closeModal(); toast(`Đã thêm buổi bù ${fmtFull(d)}`);
      if(App.view==='calendar') App.calYM=d.slice(0,7);
      renderMain();
    };
  };
  draw();
}
