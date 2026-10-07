/* giasuchillchill — Trang Cài đặt, sao lưu dữ liệu */
'use strict';

VIEWS.settings = async () => {
  const P=App.profile;
  return `
  <div class="pagehead"><div><div class="eyebrow">Cài đặt</div><h1>Hồ sơ & thanh toán</h1></div></div>
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;align-items:start">
    <form class="card stack" id="profForm">
      <h3>Thông tin gia sư</h3>
      <label class="f">Họ tên hiển thị<input type="text" id="p_name" value="${esc(P.displayName)}" maxlength="60" required></label>
      <label class="f">Số điện thoại<input type="tel" id="p_phone" value="${esc(P.phone)}" maxlength="20"></label>
      <h3 style="margin-top:6px">Tài khoản nhận học phí</h3>
      <div class="row" style="align-items:flex-start;gap:14px">
        <div class="qr-prev">${P.qr?`<img src="${P.qr}" alt="Mã QR của bạn">`:'<span class="small muted" style="text-align:center;padding:8px">Chưa có mã QR</span>'}</div>
        <div class="stack" style="gap:8px;flex:1;min-width:160px">
          <label class="btn" for="p_qr" style="width:max-content">${P.qr?'Đổi ảnh QR':'Tải ảnh QR lên'}</label>
          <input type="file" id="p_qr" accept="image/*" hidden>
          ${P.qr?'<button type="button" class="btn sm ghost" id="p_qrdel" style="width:max-content">Xóa ảnh QR</button>':''}
          <p class="small muted">Chụp màn hình mã QR từ app ngân hàng hoặc ví rồi tải lên. Mã sẽ hiện trong thông báo học phí.</p>
        </div>
      </div>
      <div class="grid2">
        <label class="f">Ngân hàng<input type="text" id="p_bank" value="${esc(P.bankName)}" maxlength="40" placeholder="VD: Vietcombank"></label>
        <label class="f">Số tài khoản<input type="text" id="p_acc" value="${esc(P.bankAcc)}" maxlength="30"></label>
      </div>
      <label class="f">Chủ tài khoản<input type="text" id="p_owner" value="${esc(P.bankOwner)}" maxlength="60" placeholder="VD: NGUYEN THU HA"></label>
      <label class="f">Lời nhắn trên thông báo học phí<textarea id="p_pay" maxlength="300" placeholder="VD: Phụ huynh vui lòng chuyển khoản trước ngày 5 hằng tháng.">${esc(P.payNote)}</textarea></label>
      <div><button class="btn primary" type="submit">Lưu thông tin</button></div>
    </form>
    <div class="stack">
      <form class="card stack" id="pwForm">
        <h3>Đổi mật khẩu</h3>
        <label class="f">Mật khẩu hiện tại<input type="password" id="pw_old" autocomplete="current-password" required></label>
        <label class="f">Mật khẩu mới<input type="password" id="pw_new" autocomplete="new-password" minlength="6" required></label>
        <div class="err" id="pw_err" role="alert"></div>
        <div><button class="btn" type="submit">Đổi mật khẩu</button></div>
      </form>
      <div class="card stack">
        <h3>Sao lưu dữ liệu</h3>
        <p class="small muted">${Store.mode==='cloud'?'Dữ liệu đang được lưu trong tài khoản Claude của bạn. Bạn vẫn có thể xuất một bản sao để cất giữ.':Store.mode==='supa'?'Dữ liệu đang được lưu trên máy chủ, đăng nhập ở máy nào cũng thấy. Bạn vẫn có thể xuất một bản sao để cất giữ.':'Dữ liệu đang được lưu trong trình duyệt này. Xóa dữ liệu trình duyệt sẽ mất hết, hãy xuất bản sao thường xuyên.'}</p>
        <div class="row">${canSave()?'<button class="btn" id="bk_export">Xuất file sao lưu (.json)</button>':'<button class="btn" id="bk_copy">Sao chép dữ liệu sao lưu</button>'}
          <label class="btn" for="bk_file">Nhập từ file sao lưu</label><input type="file" id="bk_file" accept=".json,application/json" hidden></div>
        <div id="bk_confirm"></div>
      </div>
      <div class="card stack"><h3>Tài khoản</h3><p class="small muted">Đang đăng nhập: <b style="overflow-wrap:anywhere">${esc(App.handle)}</b></p><div><button class="btn" data-act="logout">Đăng xuất</button></div></div>
    </div>
  </div>`;
};
AFTER.settings = () => {
  const P=App.profile;
  $('#profForm').onsubmit=e=>{ e.preventDefault();
    Object.assign(P,{displayName:$('#p_name').value.trim()||App.u, phone:$('#p_phone').value.trim(), bankName:$('#p_bank').value.trim(), bankAcc:$('#p_acc').value.trim(), bankOwner:$('#p_owner').value.trim(), payNote:$('#p_pay').value.trim()});
    saveProfile(); toast('Đã lưu thông tin'); renderShell(); };
  $('#p_qr').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    try{ P.qr = await shrinkImage(f, 520); saveProfile(); toast('Đã cập nhật mã QR'); renderMain(); }
    catch(err){ toast('Không đọc được ảnh này. Thử ảnh PNG hoặc JPG khác.'); } };
  const qd=$('#p_qrdel'); if(qd) qd.onclick=()=>{ P.qr=''; saveProfile(); toast('Đã xóa mã QR'); renderMain(); };
  $('#pwForm').onsubmit=async e=>{ e.preventDefault(); const err=$('#pw_err'); err.textContent='';
    if(Store.mode==='supa'){
      const nw=$('#pw_new').value; if(nw.length<6) return err.textContent='Mật khẩu mới cần ít nhất 6 ký tự.';
      const chk=await Store.sb.auth.signInWithPassword({email:App.handle, password:$('#pw_old').value});
      if(chk.error) return err.textContent='Mật khẩu hiện tại chưa đúng.';
      const {error}=await Store.sb.auth.updateUser({password:nw}); if(error) return err.textContent=SUPA_ERR(error.message);
      toast('Đã đổi mật khẩu'); e.target.reset(); return;
    }
    const acc=await kvGet(K.accounts); const rec=acc?.users?.[App.u];
    if(!rec || await sha(rec.salt+$('#pw_old').value)!==rec.hash) return err.textContent='Mật khẩu hiện tại chưa đúng.';
    const nw=$('#pw_new').value; if(nw.length<6) return err.textContent='Mật khẩu mới cần ít nhất 6 ký tự.';
    rec.salt=randHex(); rec.hash=await sha(rec.salt+nw); kvSet(K.accounts, acc); toast('Đã đổi mật khẩu'); e.target.reset(); };
  const buildBackup = async () => {
    const months={};
    const prefix=`a.${App.u}.m.`;
    // collect months: cached ones + scan 36 months back and 12 ahead
    const now=curYM(); const list=[]; for(let i=-36;i<=12;i++) list.push(addMonths(now,i));
    for(const ym of list){ const v=await kvGet(prefix+ym); if(v && v.ss && Object.keys(v.ss).length) months[ym]=v; }
    return JSON.stringify({app:'giasuchillchill', v:1, exportedAt:new Date().toISOString(), user:App.u, profile:App.profile, students:App.students, months}, null, 1);
  };
  const ex=$('#bk_export'); if(ex) ex.onclick=async()=>{ ex.disabled=true; try{ const data=await buildBackup(); await saveFile({filename:`giasuchillchill-${noAccent(App.profile.displayName||App.u).replace(/\s+/g,'-').toLowerCase()}-${todayStr()}.json`, data}); toast('Đã xuất file sao lưu'); }catch(e){ if(e?.code!=='declined') copyText(await buildBackup(),'Đã sao chép dữ liệu sao lưu'); } ex.disabled=false; };
  const cp=$('#bk_copy'); if(cp) cp.onclick=async()=>copyText(await buildBackup(),'Đã sao chép dữ liệu sao lưu');
  $('#bk_file').onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    let data; try{ data=JSON.parse(await f.text()); if(data.app!=='giasuchillchill') throw 0; }catch(_){ toast('File này không phải bản sao lưu giasuchillchill.'); return; }
    const box=$('#bk_confirm');
    box.innerHTML=`<div class="confirm-box"><b>Khôi phục từ bản sao lưu ngày ${esc((data.exportedAt||'').slice(0,10))}?</b><span class="small">${(data.students||[]).length} học sinh, ${Object.keys(data.months||{}).length} tháng dữ liệu. Dữ liệu hiện tại của các tháng trùng sẽ bị thay thế.</span><div class="row"><button class="btn sm danger" id="bk_yes">Khôi phục</button><button class="btn sm" id="bk_no">Hủy</button></div></div>`;
    $('#bk_no').onclick=()=>{ box.innerHTML=''; };
    $('#bk_yes').onclick=async()=>{
      App.profile=Object.assign({}, data.profile||{}); App.students=Array.isArray(data.students)?data.students:[];
      Store.cache[K.students(App.u)]={list:App.students};
      kvSet(K.profile(App.u), App.profile); kvSet(K.students(App.u), {list:App.students});
      for(const [ym,v] of Object.entries(data.months||{})){ if(/^\d{4}-\d{2}$/.test(ym) && v && v.ss) kvSet(K.month(App.u,ym), {ss:v.ss}); }
      toast('Đã khôi phục dữ liệu'); renderShell();
    };
  };
};
function canSave(){ return !!Store.downloads || !window.claude; }
async function saveFile({filename, data}){
  if(Store.downloads) return Store.downloads.save({filename, data});
  const blob = data instanceof Blob ? data : new Blob([data], {type: filename.endsWith('.json')?'application/json':'application/octet-stream'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
function shrinkImage(file, max){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onerror=rej;
    fr.onload=()=>{ const img=new Image(); img.onerror=rej; img.onload=()=>{
      const sc=Math.min(1, max/Math.max(img.width,img.height)); const w=Math.round(img.width*sc), h=Math.round(img.height*sc);
      const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.imageSmoothingEnabled=sc<1; x.drawImage(img,0,0,w,h);
      let out=c.toDataURL('image/png'); if(out.length>180000) out=c.toDataURL('image/jpeg',0.9); res(out);
    }; img.src=fr.result; };
    fr.readAsDataURL(file);
  });
}
