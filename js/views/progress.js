/* giasuchillchill — Trang Tiến độ học tập (bảng theo dõi) */
'use strict';

const HWP = [['25','25%'],['33','1/3'],['50','50%'],['67','2/3'],['100','100%']];
const HWP_L = Object.fromEntries(HWP);
const SUBJ_COLORS = {'Toán':'#4B3BA6','Tiếng Việt':'#C0572B','Văn':'#A8397A','Tiếng Anh':'#1F6FB2','Vật lý':'#2E8B8B','Hóa học':'#1C8657','Sinh học':'#5E8A1C','Lịch sử':'#8A6A0A','Địa lý':'#B4541A','Tin học':'#3B5BDB','IELTS':'#0E7C9B','Luyện chữ':'#7A4FD1'};
const EXTRA_COLORS = ['#D6336C','#0B7285','#5F3DC4','#E67700','#2B8A3E','#C2255C','#1864AB'];
const subjColor = n => SUBJ_COLORS[n] || EXTRA_COLORS[[...String(n)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%EXTRA_COLORS.length];
const subjTag = n => `<span class="stag" style="--c:${subjColor(n)}">${esc(n)}</span>`;
const oldHw = h => ({full:'100', part:'50'})[h] || '';
function rowFromSession(s){ return {id:uid(), key:s.key, d:s.d, subs:[s.sub].filter(Boolean), hwPrev: oldHw(s.p?.hw), lesson: s.p?.lesson||'', hw: s.p?.hwNew||'', note: s.p?.note||''}; }
const sortRows = rows => rows.sort((a,b)=>(a.d||'9999').localeCompare(b.d||'9999'));
async function getTable(ym, sid){
  const md=await getMonth(ym); if(!md.pt || typeof md.pt!=='object') md.pt={};
  if(!Array.isArray(md.pt[sid]) || !md.pt[sid].length){
    const ss=(await sessionsForMonth(ym)).filter(s=>s.sid===sid && s.s!=='off_s' && s.s!=='off_t');
    md.pt[sid]=ss.map(rowFromSession);
  }
  return md.pt[sid];
}
let ptTimer=null;
function saveTable(ym, now){ clearTimeout(ptTimer); if(now) return saveMonth(ym); ptTimer=setTimeout(()=>saveMonth(ym),700); }
function autosize(el){ el.style.height='auto'; el.style.height=(el.scrollHeight+2)+'px'; }
function closePop(){ const p=$('#mspop'); if(p) p.remove(); document.removeEventListener('mousedown', popOutside); }
function popOutside(e){ const p=$('#mspop'); if(p && !p.contains(e.target) && !e.target.closest('[data-ms]')) closePop(); }

VIEWS.progress = async () => {
  closePop();
  if(!App.students.length) return `<div class="pagehead"><div><div class="eyebrow">Tiến độ học tập</div><h1>Chưa có học sinh</h1></div></div><div class="empty">Thêm học sinh để bắt đầu theo dõi tiến độ.</div>`;
  if(!stuById(App.prog.sid)) App.prog.sid = App.students[0].id;
  const st=stuById(App.prog.sid); const ym=App.prog.ym;
  const ss=(await sessionsForMonth(ym)).filter(s=>s.sid===st.id);
  const rows=sortRows(await getTable(ym, st.id));
  const done=ss.filter(s=>s.s==='done'), offS=ss.filter(s=>s.s==='off_s'), offT=ss.filter(s=>s.s==='off_t');
  const hwGiven=rows.filter(r=>(r.hw||'').trim()).length;
  const checked=rows.filter(r=>r.hwPrev);
  const avg = checked.length ? checked.reduce((a,r)=>a+Number(r.hwPrev),0)/checked.length : null;
  const full = checked.filter(r=>r.hwPrev==='100').length;
  const latest=[...rows].reverse().find(r=>(r.lesson||'').trim() && r.d);
  const [y,m]=ym.split('-').map(Number); const minD=`${ym}-01`, maxD=`${ym}-${pad(new Date(y,m,0).getDate())}`;
  const offDates=new Set(ss.filter(s=>s.s==='off_s'||s.s==='off_t').map(s=>s.d));
  const doneDates=new Set(done.map(s=>s.d));
  const rowHtml=(r,i)=>`<tr data-row="${r.id}">
      <td class="stt">${i+1}</td>
      <td><input type="date" data-f="d" value="${esc(r.d||'')}" min="${minD}" max="${maxD}" aria-label="Ngày học dòng ${i+1}"><span class="wd">${r.d?DOW_FULL[parseD(r.d).getDay()]:'Chọn ngày'}${r.d&&doneDates.has(r.d)?' · <span style="color:var(--ok)">đã dạy</span>':''}${r.d&&offDates.has(r.d)&&!doneDates.has(r.d)?' · <span style="color:var(--warn)">nghỉ</span>':''}</span></td>
      <td><button type="button" class="ms" data-ms="${r.id}" aria-label="Chọn môn học dòng ${i+1}">${(r.subs||[]).length?(r.subs||[]).map(subjTag).join(''):'<span class="muted small">Chọn môn</span>'}<span class="caret">▾</span></button></td>
      <td><select data-f="hwPrev" class="hwsel lv${r.hwPrev||0}" aria-label="BTVN buổi trước dòng ${i+1}"><option value="">—</option>${HWP.map(([v,l])=>`<option value="${v}" ${r.hwPrev===v?'selected':''}>${l}</option>`).join('')}</select></td>
      <td><textarea data-f="lesson" rows="2" maxlength="1000" placeholder="Nội dung đã học…" aria-label="Nội dung buổi học dòng ${i+1}">${esc(r.lesson||'')}</textarea></td>
      <td><textarea data-f="hw" rows="2" maxlength="600" placeholder="Bài tập về nhà…" aria-label="Bài tập về nhà dòng ${i+1}">${esc(r.hw||'')}</textarea></td>
      <td><textarea data-f="note" class="note" rows="2" maxlength="600" placeholder="Lưu ý…" aria-label="Lưu ý dòng ${i+1}">${esc(r.note||'')}</textarea></td>
      <td class="cx"><button type="button" class="rowdel" data-delrow="${r.id}" aria-label="Xóa dòng ${i+1}">×</button></td>
    </tr>`;
  return `
  <div class="pagehead"><div><div class="eyebrow">Tiến độ học tập</div><h1>${esc(st.name)}</h1><div class="small muted">Lớp ${esc(st.grade)} · ${(st.subjects||[]).map(subjTag).join(' ')}</div></div>
    <button class="btn" id="copyReport">Sao chép báo cáo gửi phụ huynh</button></div>
  <div class="row" style="margin-bottom:16px">
    <select id="progStu" style="width:auto;min-width:200px" aria-label="Học sinh">${App.students.map(s=>`<option value="${s.id}" ${s.id===st.id?'selected':''}>${esc(s.name)} · L${esc(s.grade)}</option>`).join('')}</select>
    <div class="calhead"><button class="btn sm" data-pm="-1" aria-label="Tháng trước">‹</button><input type="month" id="progMonth" value="${ym}" style="width:auto" aria-label="Tháng"><button class="btn sm" data-pm="1" aria-label="Tháng sau">›</button></div>
  </div>
  <div class="stats" style="margin-bottom:16px">
    <div class="stat"><span class="eyebrow">Buổi đã học</span><span class="v">${done.length}</span><span class="small muted">${done.filter(s=>s.mk).length?`gồm ${done.filter(s=>s.mk).length} buổi bù · `:''}${ss.filter(s=>s.s==='planned').length} buổi chưa đánh dấu</span></div>
    <div class="stat"><span class="eyebrow">Buổi nghỉ</span><span class="v" style="color:${offS.length+offT.length?'var(--warn)':'inherit'}">${offS.length+offT.length}</span><span class="small muted">HS xin nghỉ ${offS.length} · GS nghỉ ${offT.length}</span></div>
    <div class="stat"><span class="eyebrow">Bài tập về nhà</span><span class="v">${hwGiven}</span><span class="small muted">buổi có giao BTVN · đã kiểm tra ${checked.length}</span></div>
    <div class="stat"><span class="eyebrow">Mức hoàn thành BTVN</span><span class="v">${avg==null?'—':Math.round(avg)+'%'}</span>
      ${avg==null?'<span class="small muted">chưa kiểm tra buổi nào</span>':`<div class="bar" style="margin:4px 0 2px"><i style="width:${avg}%;background:${avg>=80?'var(--ok)':avg>=50?'var(--warn)':'var(--bad)'}"></i></div><span class="small muted">làm đủ 100%: ${full}/${checked.length} buổi</span>`}</div>
  </div>
  ${latest?`<p class="small" style="margin-bottom:10px"><span class="muted">Đang học tới:</span> <b>${esc(latest.lesson.split('\n')[0])}</b> <span class="muted">(${fmtFull(latest.d)})</span></p>`:''}
  <div class="section-title"><h3>Bảng theo dõi ${ymLabel(ym).toLowerCase()}</h3><span class="small muted saveind"></span></div>
  <div class="pt-wrap" id="ptWrap"><table class="pt">
    <colgroup><col style="width:52px"><col style="width:142px"><col style="width:170px"><col style="width:112px"><col><col><col style="width:170px"><col style="width:44px"></colgroup>
    <thead><tr><th class="c">STT</th><th>Ngày</th><th>Môn học</th><th>BTVN buổi trước</th><th>Nội dung buổi học</th><th>Bài tập về nhà</th><th>Lưu ý</th><th></th></tr></thead>
    <tbody>${rows.length?rows.map(rowHtml).join(''):`<tr><td colspan="8" class="muted" style="text-align:center;padding:22px">Tháng này chưa có buổi học theo lịch. Bấm “+ Thêm dòng” để tự ghi.</td></tr>`}</tbody>
  </table></div>
  <div class="row" style="margin-top:10px">
    <button class="btn sm" id="ptAdd">+ Thêm dòng</button>
    <button class="btn sm" id="ptSync">Thêm các buổi còn thiếu theo lịch</button>
    <span class="small muted">Các dòng được tạo sẵn theo lịch học. Gõ vào ô là tự lưu.</span>
  </div>`;
};
AFTER.progress = () => {
  setSaveInd();
  const ps=$('#progStu'); if(ps) ps.onchange=()=>{ App.prog.sid=ps.value; renderMain(); };
  $$('[data-pm]').forEach(b=>b.onclick=()=>{ App.prog.ym=addMonths(App.prog.ym, Number(b.dataset.pm)); renderMain(); });
  const pm=$('#progMonth'); if(pm) pm.onchange=()=>{ if(pm.value){ App.prog.ym=pm.value; renderMain(); } };
  const wrap=$('#ptWrap'); if(!wrap) return;
  const ym=App.prog.ym, sid=App.prog.sid, st=stuById(sid);
  const md=Store.cache[K.month(App.u, ym)]; const rows=md.pt[sid];
  const rowOf = el => { const tr=el.closest('tr[data-row]'); return tr ? rows.find(r=>r.id===tr.dataset.row) : null; };
  $$('textarea', wrap).forEach(autosize);
  wrap.addEventListener('input', e=>{ const el=e.target; if(el.tagName!=='TEXTAREA') return; const r=rowOf(el); if(!r) return; r[el.dataset.f]=el.value; autosize(el); saveTable(ym); });
  wrap.addEventListener('change', e=>{ const el=e.target; const f=el.dataset.f; const r=rowOf(el); if(!r||!f) return;
    if(f==='d'){ r.d=el.value; delete r.key; sortRows(rows); saveTable(ym,true); renderMain(); }
    else if(f==='hwPrev'){ r.hwPrev=el.value; saveTable(ym,true); renderMain(); } });
  wrap.addEventListener('click', e=>{
    const del=e.target.closest('[data-delrow]');
    if(del){ if(!del.classList.contains('confirm')){ del.classList.add('confirm'); del.textContent='Xóa?'; setTimeout(()=>{ if(del.isConnected){ del.classList.remove('confirm'); del.textContent='×'; } },3000); return; }
      const i=rows.findIndex(r=>r.id===del.dataset.delrow); if(i>=0){ rows.splice(i,1); if(!rows.length) rows.push({id:uid(), d:'', subs:[], hwPrev:'', lesson:'', hw:'', note:''}); saveTable(ym,true); toast('Đã xóa dòng'); renderMain(); } return; }
    const b=e.target.closest('[data-ms]'); if(!b) return;
    const r=rows.find(x=>x.id===b.dataset.ms); if(!r) return;
    const cur=$('#mspop'); if(cur && cur.dataset.row===r.id){ closePop(); return; }
    closePop();
    const opts=()=>[...new Set([...(st.subjects||[]), ...(r.subs||[])])];
    const pop=document.createElement('div'); pop.className='mspop'; pop.id='mspop'; pop.dataset.row=r.id;
    const drawPop=()=>{ pop.innerHTML = opts().map(n=>`<label><input type="checkbox" value="${esc(n)}" ${(r.subs||[]).includes(n)?'checked':''}><span class="sw" style="--c:${subjColor(n)}"></span>${esc(n)}</label>`).join('') + `<div class="row" style="gap:4px;padding:4px;flex-wrap:nowrap"><input type="text" placeholder="Môn khác…" id="msNew" style="flex:1;padding:.35em .5em"><button type="button" class="btn sm" id="msAdd">Thêm</button></div>`;
      $('#msAdd',pop).onclick=()=>{ const v=$('#msNew',pop).value.trim(); if(v && !(r.subs||[]).includes(v)){ r.subs=[...(r.subs||[]), v]; changed(); drawPop(); } }; };
    const changed=()=>{ const o=opts(); r.subs=o.filter(x=>(r.subs||[]).includes(x)); b.innerHTML=(r.subs.length?r.subs.map(subjTag).join(''):'<span class="muted small">Chọn môn</span>')+'<span class="caret">▾</span>'; saveTable(ym,true); };
    pop.addEventListener('change', ev=>{ if(ev.target.type!=='checkbox') return; const v=ev.target.value; r.subs = ev.target.checked ? [...(r.subs||[]), v] : (r.subs||[]).filter(x=>x!==v); changed(); });
    drawPop(); document.body.appendChild(pop);
    const rc=b.getBoundingClientRect(); const vw=document.documentElement.clientWidth;
    pop.style.top=(rc.bottom+window.scrollY+4)+'px'; pop.style.left=Math.max(8, Math.min(rc.left+window.scrollX, window.scrollX+vw-pop.offsetWidth-8))+'px';
    setTimeout(()=>document.addEventListener('mousedown', popOutside),0);
  });
  wrap.addEventListener('scroll', closePop, {passive:true});
  $('#ptAdd').onclick=()=>{ const t=todayStr(); const last=rows.filter(r=>r.d).slice(-1)[0];
    rows.push({id:uid(), d: ymOfToday(ym)?t:'', subs: last?.subs?.length?[...last.subs]:(st.subjects||[]).slice(0,1), hwPrev:'', lesson:'', hw:'', note:''});
    sortRows(rows); saveTable(ym,true); renderMain(); };
  $('#ptSync').onclick=async()=>{ const ss=(await sessionsForMonth(ym)).filter(s=>s.sid===sid && s.s!=='off_s' && s.s!=='off_t');
    let n=0; for(const s of ss){ if(rows.some(r=>r.key===s.key || r.d===s.d)) continue; rows.push(rowFromSession(s)); n++; }
    const empties=rows.filter(r=>!r.d && !r.lesson && !r.hw && !r.hwPrev && !r.note); if(n && empties.length) empties.forEach(e=>rows.splice(rows.indexOf(e),1));
    if(n){ sortRows(rows); saveTable(ym,true); toast(`Đã thêm ${n} dòng theo lịch`); renderMain(); } else toast('Bảng đã có đủ các buổi theo lịch'); };
  const cr=$('#copyReport'); if(cr) cr.onclick=async()=>{
    const ss=(await sessionsForMonth(ym)).filter(s=>s.sid===sid);
    const lines=[`BÁO CÁO HỌC TẬP ${ymLabel(ym).toUpperCase()}`, `Học sinh: ${st.name} – Lớp ${st.grade}`,
      `Số buổi đã học: ${ss.filter(s=>s.s==='done').length} · Xin nghỉ: ${ss.filter(s=>s.s==='off_s').length}`];
    const ck=rows.filter(r=>r.hwPrev); if(ck.length) lines.push(`Mức hoàn thành BTVN trung bình: ${Math.round(ck.reduce((a,r)=>a+Number(r.hwPrev),0)/ck.length)}%`);
    lines.push('');
    rows.filter(r=>r.d && (r.lesson||r.hw||r.hwPrev||r.note)).forEach((r,i)=>{ lines.push(`${i+1}. ${fmtD(r.d)}${(r.subs||[]).length?` [${r.subs.join(', ')}]`:''}${r.lesson?`: ${r.lesson.replace(/\n+/g,'; ')}`:''}`); if(r.hwPrev) lines.push(`   BTVN buổi trước: ${HWP_L[r.hwPrev]}`); if(r.hw) lines.push(`   BTVN: ${r.hw.replace(/\n+/g,'; ')}`); if(r.note) lines.push(`   Lưu ý: ${r.note.replace(/\n+/g,'; ')}`); });
    lines.push('', `Gia sư: ${App.profile.displayName||''}`);
    copyText(lines.join('\n'), 'Đã sao chép báo cáo');
  };
};
const ymOfToday = ym => todayStr().slice(0,7)===ym;
async function copyText(t, ok){
  try{ await navigator.clipboard.writeText(t); toast(ok); }
  catch(e){ openModal(`<div class="mh"><h3>Sao chép thủ công</h3><button class="xbtn" data-close aria-label="Đóng">×</button></div><div class="mb"><p class="small muted">Trình duyệt chặn sao chép tự động. Chọn toàn bộ nội dung bên dưới và sao chép.</p><textarea id="cpy" style="min-height:260px">${esc(t)}</textarea></div>`); const ta=$('#cpy'); ta.focus(); ta.select(); }
}
