/* giasuchillchill — Trang Học phí và thông báo học phí */
'use strict';

async function computeFee(){
  const F=App.fee; const st=stuById(F.sid);
  let from, to, label;
  if(F.mode==='month'){ const [y,m]=F.ym.split('-').map(Number); from=`${F.ym}-01`; to=`${F.ym}-${pad(new Date(y,m,0).getDate())}`; label=ymLabel(F.ym); }
  else { from=F.from; to=F.to; if(from>to) [from,to]=[to,from]; label=`${fmtFull(from)} – ${fmtFull(to)}`; }
  const ss=(await sessionsInRange(from,to)).filter(s=>s.sid===st.id);
  const done=ss.filter(s=>s.s==='done'); const planned=ss.filter(s=>s.s==='planned'); const off=ss.filter(s=>s.s==='off_s'||s.s==='off_t');
  const charged = F.incPlanned ? [...done,...planned].sort((a,b)=>(a.d+a.t1).localeCompare(b.d+b.t1)) : done;
  const base = charged.reduce((a,s)=>a+feeOf(s),0);
  const adj = Number(F.adj)||0;
  const fees=[...new Set(charged.map(feeOf))];
  return {st, from, to, label, ss, done, planned, off, charged, base, adj, total: base+adj, fees};
}
VIEWS.fee = async () => {
  if(!App.students.length) return `<div class="pagehead"><div><div class="eyebrow">Học phí</div><h1>Chưa có học sinh</h1></div></div><div class="empty">Thêm học sinh để tính học phí.</div>`;
  if(!stuById(App.fee.sid)) App.fee.sid=App.students[0].id;
  const F=App.fee; const r=await computeFee();
  return `
  <div class="pagehead"><div><div class="eyebrow">Tính học phí</div><h1>${esc(r.st.name)}</h1><div class="small muted">Lớp ${esc(r.st.grade)} · ${feeRange(r.st)}</div></div></div>
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;align-items:start">
    <div class="card stack">
      <label class="f">Học sinh<select id="f_sid">${App.students.map(s=>`<option value="${s.id}" ${s.id===F.sid?'selected':''}>${esc(s.name)} · L${esc(s.grade)}</option>`).join('')}</select></label>
      <div class="tabs"><button type="button" data-fm="month" class="${F.mode==='month'?'on':''}">Theo tháng</button><button type="button" data-fm="range" class="${F.mode==='range'?'on':''}">Từ ngày – đến ngày</button></div>
      ${F.mode==='month' ? `<label class="f">Tháng<input type="month" id="f_ym" value="${F.ym}"></label>` :
        `<div class="grid2" style="grid-template-columns:1fr 1fr"><label class="f">Từ ngày<input type="date" id="f_from" value="${F.from}"></label><label class="f">Đến ngày<input type="date" id="f_to" value="${F.to}"></label></div>`}
      ${r.planned.length ? `<label class="row small" style="gap:8px;font-weight:500;align-items:flex-start"><input type="checkbox" id="f_inc" ${F.incPlanned?'checked':''} style="margin-top:4px"> <span>Tính cả ${r.planned.length} buổi chưa đánh dấu (thu trước theo lịch)</span></label>` : ''}
      <div class="grid2" style="grid-template-columns:1fr 1.4fr">
        <label class="f">Điều chỉnh (±đ)<input type="number" id="f_adj" value="${esc(F.adj||'')}" step="10000" placeholder="0"></label>
        <label class="f">Lý do điều chỉnh<input type="text" id="f_adjn" value="${esc(F.adjNote)}" maxlength="80" placeholder="VD: tài liệu, giảm trừ…"></label>
      </div>
    </div>
    <div class="card stack">
      <div class="eyebrow">${esc(r.label)}</div>
      <div class="row" style="gap:6px">
        <span class="pill done">${r.done.length} đã dạy</span>
        ${r.planned.length?`<span class="pill planned">${r.planned.length} chưa đánh dấu</span>`:''}
        <span class="pill off_s">${r.off.length} buổi nghỉ (không tính)</span>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Ngày</th><th>Môn</th><th>Tình trạng</th><th class="r">Tiền</th></tr></thead>
        <tbody>${r.ss.length ? r.ss.map(s=>{ const inc=r.charged.includes(s); return `<tr style="${inc?'':'opacity:.55'}"><td>${fmtD(s.d)}${s.mk?' <span class="pill mk">bù</span>':''}</td><td>${esc(s.sub)}</td><td><span class="pill ${s.s}">${STATUS[s.s].short}</span></td><td class="r">${inc?money(feeOf(s)):'—'}</td></tr>`; }).join('') : '<tr><td colspan="4" class="muted">Không có buổi nào trong khoảng này.</td></tr>'}</tbody>
        <tfoot>${r.adj?`<tr><td colspan="3">Điều chỉnh${F.adjNote?` (${esc(F.adjNote)})`:''}</td><td class="r">${r.adj>0?'+':''}${money(r.adj)}</td></tr>`:''}<tr><td colspan="3">Tổng học phí · ${r.charged.length} buổi</td><td class="r">${money(r.total)}</td></tr></tfoot>
      </table></div>
      ${r.planned.length && !F.incPlanned ? `<p class="small" style="color:var(--warn)">Còn ${r.planned.length} buổi chưa đánh dấu nên chưa tính. Đánh dấu ở Lịch dạy, hoặc tích ô “Tính cả buổi chưa đánh dấu”.</p>`:''}
      <button class="btn primary" id="f_make" ${r.charged.length||r.adj?'':'disabled'}>Tạo thông báo học phí</button>
      ${!App.profile.qr?`<p class="small muted">Chưa có mã QR nhận tiền. <a href="#settings" data-go="settings" style="color:var(--accent);font-weight:600">Thêm trong Cài đặt</a> để thông báo có QR.</p>`:''}
    </div>
  </div>`;
};
AFTER.fee = () => {
  const F=App.fee;
  const on=(id,ev,fn)=>{ const el=$(id); if(el) el[ev]=fn; };
  on('#f_sid','onchange',e=>{ F.sid=e.target.value; F.adj=0; F.adjNote=''; renderMain(); });
  $$('[data-fm]').forEach(b=>b.onclick=()=>{ F.mode=b.dataset.fm; renderMain(); });
  on('#f_ym','onchange',e=>{ if(e.target.value){ F.ym=e.target.value; renderMain(); } });
  on('#f_from','onchange',e=>{ if(e.target.value){ F.from=e.target.value; renderMain(); } });
  on('#f_to','onchange',e=>{ if(e.target.value){ F.to=e.target.value; renderMain(); } });
  on('#f_inc','onchange',e=>{ F.incPlanned=e.target.checked; renderMain(); });
  on('#f_adj','onchange',e=>{ F.adj=Number(e.target.value)||0; renderMain(); });
  on('#f_adjn','onchange',e=>{ F.adjNote=e.target.value; renderMain(); });
  on('#f_make','onclick',async()=>{ showInvoice(await computeFee()); });
};
function showInvoice(r){
  const P=App.profile; const st=r.st;
  const ck = `HP ${noAccent(st.name)} ${App.fee.mode==='month'?'T'+Number(App.fee.ym.slice(5))+'/'+App.fee.ym.slice(0,4):fmtDD(r.from)+'-'+fmtDD(r.to)}`.toUpperCase();
  const groups = feeGroups(r.charged);
  const root=$('#modal-root');
  root.innerHTML = `<div class="inv-bg" id="invBg">
    <div class="inv-wrap">
      <div class="invoice" id="invoice">
        <div class="ih"><h3>THÔNG BÁO HỌC PHÍ</h3><div style="font-size:.85rem;color:#66647E;font-weight:600">${esc(r.label)}</div></div>
        <div class="ib">
          <dl class="ikv">
            <dt>Học sinh</dt><dd>${esc(st.name)}</dd>
            <dt>Lớp</dt><dd>${esc(st.grade)}</dd>
            <dt>Môn</dt><dd>${esc([...new Set(r.charged.map(s=>s.sub))].join(', ') || (st.subjects||[]).join(', '))}</dd>
            ${st.parent?`<dt>Phụ huynh</dt><dd>${esc(st.parent)}</dd>`:''}
          </dl>
          <div>
            <div style="font-size:.75rem;font-weight:700;letter-spacing:.06em;color:#66647E;margin-bottom:5px">CÁC BUỔI ĐÃ HỌC</div>
            <div class="dates">${r.charged.map(s=>`<span>${fmtDD(s.d)}</span>`).join('')}${r.off.map(s=>`<span class="x" title="Nghỉ, không tính">${fmtDD(s.d)}</span>`).join('')}</div>
            ${r.off.length?`<div style="font-size:.75rem;color:#9A98AE;margin-top:4px">Ngày gạch ngang: buổi nghỉ, không tính phí</div>`:''}
          </div>
          <dl class="ikv">
            ${groups.map(([f,n])=>`<dt>${n} buổi × ${money(f)}</dt><dd>${money(f*n)}</dd>`).join('')}
            ${r.adj?`<dt>${esc(App.fee.adjNote||'Điều chỉnh')}</dt><dd>${r.adj>0?'+':''}${money(r.adj)}</dd>`:''}
          </dl>
          <div class="total"><span style="font-weight:700">Tổng cộng</span><b>${money(r.total)}</b></div>
          ${P.qr?`<div class="qr"><img src="${P.qr}" alt="Mã QR chuyển khoản">
            ${P.bankName||P.bankAcc?`<div style="text-align:center;font-size:.85rem"><b>${esc(P.bankName||'')}</b>${P.bankAcc?` · <b class="num">${esc(P.bankAcc)}</b>`:''}${P.bankOwner?`<br>${esc(P.bankOwner)}`:''}</div>`:''}
            </div>`
          : (P.bankAcc?`<div class="qr"><div style="text-align:center;font-size:.9rem"><b>${esc(P.bankName||'')}</b><br><b class="num" style="font-size:1.1rem">${esc(P.bankAcc)}</b><br>${esc(P.bankOwner||'')}</div></div>`:'')}
          ${P.payNote?`<div class="foot" style="white-space:pre-wrap">${esc(P.payNote)}</div>`:''}
          <div class="foot">Gia sư <b>${esc(P.displayName||'')}</b>${P.phone?` · ${esc(P.phone)}`:''}<br>Cảm ơn phụ huynh đã đồng hành cùng con!</div>
        </div>
      </div>
      <div class="row" style="justify-content:center">
        ${canSave() && window.html2canvas ? '<button class="btn" id="invSave">Lưu ảnh</button>':''}
        <button class="btn" id="invCopy">Sao chép tin nhắn</button>
        <button class="btn primary" id="invClose">Đóng</button>
      </div>
      <p class="small" style="color:#fff;opacity:.85;text-align:center">Chụp màn hình thẻ này để gửi phụ huynh.</p>
    </div></div>`;
  document.body.style.overflow='hidden';
  const close=()=>{ root.innerHTML=''; document.body.style.overflow=''; };
  $('#invClose').onclick=close;
  $('#invBg').onclick=e=>{ if(e.target.id==='invBg') close(); };
  $('#invCopy').onclick=()=>{
    const t=[`THÔNG BÁO HỌC PHÍ – ${r.label}`, `Học sinh: ${st.name} – Lớp ${st.grade}`, `Các buổi đã học (${r.charged.length}): ${r.charged.map(s=>fmtDD(s.d)).join(', ')}`, r.off.length?`Buổi nghỉ không tính: ${r.off.map(s=>fmtDD(s.d)).join(', ')}`:'', ...groups.map(([f,n])=>`${n} buổi × ${money(f)} = ${money(f*n)}`), r.adj?`${App.fee.adjNote||'Điều chỉnh'}: ${money(r.adj)}`:'', `TỔNG: ${money(r.total)}`, P.bankAcc?`Chuyển khoản: ${P.bankName||''} ${P.bankAcc} ${P.bankOwner||''}`.trim():'', `Nội dung CK: ${ck}`, `Gia sư ${P.displayName||''}${P.phone?' – '+P.phone:''}`].filter(Boolean).join('\n');
    copyText(t,'Đã sao chép tin nhắn học phí');
  };
  const sv=$('#invSave'); if(sv) sv.onclick=async()=>{
    sv.disabled=true;
    try{
      const canvas = await html2canvas($('#invoice'), {scale:2, backgroundColor:null, useCORS:true});
      const blob = await new Promise(res=>canvas.toBlob(res,'image/png'));
      await saveFile({filename:`hoc-phi-${noAccent(st.name).replace(/\s+/g,'-').toLowerCase()}.png`, data:blob});
      toast('Đã lưu ảnh');
    }catch(e){ if(e && e.code==='declined') toast('Đã hủy lưu ảnh'); else if(e && e.code==='unavailable'){ sv.hidden=true; toast('Không lưu ảnh được ở đây. Hãy chụp màn hình.'); } else toast('Không lưu được ảnh. Hãy chụp màn hình.'); }
    sv.disabled=false;
  };
}
