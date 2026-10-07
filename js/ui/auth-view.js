/* giasuchillchill — Màn hình đăng nhập / đăng ký */
'use strict';

let authTab='login';
const SUPA_ERR = m => { m=String(m||''); if(/Invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu chưa đúng.'; if(/already registered|already been registered|User already exists/i.test(m)) return 'Email này đã có tài khoản. Chuyển sang Đăng nhập nhé.'; if(/Email not confirmed/i.test(m)) return 'Bạn chưa xác nhận email. Mở hộp thư và bấm link xác nhận trước khi đăng nhập.'; if(/rate limit|too many/i.test(m)) return 'Thao tác quá nhiều lần. Đợi vài phút rồi thử lại.'; if(/Password should be/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.'; if(/valid email|invalid format|Unable to validate email/i.test(m)) return 'Email chưa đúng định dạng.'; if(/fetch|network/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'; return m || 'Có lỗi xảy ra, thử lại sau giây lát.'; };
function renderAuthSupa(err='', info=''){
  const tab=authTab;
  $('#app').innerHTML = `
  <div class="auth">
    <div class="auth-card stack">
      <div class="stack" style="gap:6px">
        <div class="logo">giasu<span>chillchill</span></div>
        <p class="muted">Sổ tay của gia sư: học sinh, lịch dạy, tiến độ và học phí ở cùng một chỗ.</p>
      </div>
      ${tab==='newpw' ? '' : `<div class="tabs" role="tablist">
        <button type="button" data-auth="login" class="${tab==='login'||tab==='forgot'?'on':''}">Đăng nhập</button>
        <button type="button" data-auth="register" class="${tab==='register'?'on':''}">Đăng ký</button>
      </div>`}
      <form id="authForm" class="stack" style="gap:12px" autocomplete="on">
        ${tab==='newpw' ? `<h3>Đặt mật khẩu mới</h3>
          <label class="f">Mật khẩu mới<input type="password" id="a_pw" required autocomplete="new-password" minlength="6"></label>
          <label class="f">Nhập lại mật khẩu<input type="password" id="a_pw2" required autocomplete="new-password" minlength="6"></label>` : `
        ${tab==='register' ? `<label class="f">Họ tên gia sư<input type="text" id="a_name" required maxlength="60" placeholder="VD: Nguyễn Thu Hà"></label>`:''}
        ${tab==='forgot' ? `<p class="small muted">Nhập email đã đăng ký. Chúng tôi sẽ gửi link để đặt lại mật khẩu.</p>`:''}
        <label class="f">Email<input type="email" id="a_email" required autocomplete="email" placeholder="ban@gmail.com" maxlength="120" style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:.55em .75em;font-weight:500;color:var(--ink)"></label>
        ${tab!=='forgot' ? `<label class="f">Mật khẩu<input type="password" id="a_pw" required autocomplete="${tab==='register'?'new-password':'current-password'}" minlength="6" placeholder="Ít nhất 6 ký tự"></label>`:''}
        ${tab==='register' ? `<label class="f">Nhập lại mật khẩu<input type="password" id="a_pw2" required autocomplete="new-password" minlength="6"></label>`:''}`}
        ${err?`<div class="err" role="alert">${esc(err)}</div>`:''}
        ${info?`<div class="small" role="status" style="color:var(--ok);font-weight:600">${esc(info)}</div>`:''}
        <button class="btn primary" type="submit" id="a_btn">${{login:'Đăng nhập',register:'Tạo tài khoản',forgot:'Gửi link đặt lại mật khẩu',newpw:'Lưu mật khẩu mới'}[tab]}</button>
        ${tab==='login'?`<button type="button" class="btn ghost sm" data-auth="forgot" style="justify-self:start">Quên mật khẩu?</button>`:''}
        ${tab==='forgot'?`<button type="button" class="btn ghost sm" data-auth="login" style="justify-self:start">← Quay lại đăng nhập</button>`:''}
      </form>
      <p class="small muted">Dữ liệu được lưu trên máy chủ, đăng nhập ở máy nào cũng thấy. Mỗi gia sư chỉ xem được dữ liệu của mình.</p>
    </div>
  </div>`;
  $$('[data-auth]').forEach(b=>b.onclick=()=>{ authTab=b.dataset.auth; renderAuthSupa(); });
  $('#authForm').onsubmit = async e => {
    e.preventDefault();
    const btn=$('#a_btn'); btn.disabled=true;
    const sb=Store.sb; const g=id=>($(id)?.value||'');
    const email=g('#a_email').trim().toLowerCase(); const pw=g('#a_pw');
    try{
      if(tab==='login'){
        const {data,error}=await sb.auth.signInWithPassword({email, password:pw});
        if(error) throw error;
        Store.supaUid=data.user.id; Store.supaUser=data.user; await enterApp('me');
      } else if(tab==='register'){
        const name=g('#a_name').trim();
        if(!name) throw new Error('Nhập họ tên gia sư.');
        if(pw.length<6) throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
        if(pw!==g('#a_pw2')) throw new Error('Hai mật khẩu chưa khớp.');
        const {data,error}=await sb.auth.signUp({email, password:pw, options:{data:{name}, emailRedirectTo: location.origin+location.pathname}});
        if(error) throw error;
        if(data.user && Array.isArray(data.user.identities) && data.user.identities.length===0) throw new Error('Email này đã có tài khoản. Chuyển sang Đăng nhập nhé.');
        if(data.session){ Store.supaUid=data.user.id; Store.supaUser=data.user; await enterApp('me'); }
        else { authTab='login'; renderAuthSupa('', `Đã gửi email xác nhận tới ${email}. Mở hộp thư (kể cả mục Spam), bấm link xác nhận rồi quay lại đăng nhập.`); }
      } else if(tab==='forgot'){
        const {error}=await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin+location.pathname});
        if(error) throw error;
        renderAuthSupa('', `Nếu ${email} đã đăng ký, bạn sẽ nhận được email đặt lại mật khẩu trong vài phút.`);
      } else if(tab==='newpw'){
        if(pw.length<6) throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
        if(pw!==g('#a_pw2')) throw new Error('Hai mật khẩu chưa khớp.');
        const {data,error}=await sb.auth.updateUser({password:pw});
        if(error) throw error;
        try{ history.replaceState(null,'',location.pathname); }catch(_){}
        Store.supaUid=data.user.id; Store.supaUser=data.user; toast('Đã đổi mật khẩu'); await enterApp('me');
      }
    }catch(er){ renderAuthSupa(SUPA_ERR(er.message)); }
  };
}
function renderAuth(err=''){
  if(Store.mode==='supa') return renderAuthSupa(err);
  const cloud = Store.mode==='cloud';
  $('#app').innerHTML = `
  <div class="auth">
    <div class="auth-card stack">
      <div class="stack" style="gap:6px">
        <div class="logo">giasu<span>chillchill</span></div>
        <p class="muted">Sổ tay của gia sư: học sinh, lịch dạy, tiến độ và học phí ở cùng một chỗ.</p>
      </div>
      <div class="tabs" role="tablist">
        <button type="button" data-auth="login" class="${authTab==='login'?'on':''}">Đăng nhập</button>
        <button type="button" data-auth="register" class="${authTab==='register'?'on':''}">Đăng ký</button>
      </div>
      <form id="authForm" class="stack" style="gap:12px" autocomplete="on">
        ${authTab==='register' ? `<label class="f">Họ tên gia sư<input type="text" id="a_name" required maxlength="60" placeholder="VD: Nguyễn Thu Hà"></label>`:''}
        <label class="f">Tên đăng nhập<input type="text" id="a_user" required autocomplete="username" placeholder="chữ thường, số, dấu _" maxlength="24"></label>
        <label class="f">Mật khẩu<input type="password" id="a_pw" required autocomplete="${authTab==='register'?'new-password':'current-password'}" minlength="6" placeholder="Ít nhất 6 ký tự"></label>
        ${authTab==='register' ? `<label class="f">Nhập lại mật khẩu<input type="password" id="a_pw2" required autocomplete="new-password" minlength="6"></label>`:''}
        <label class="row small" style="gap:8px;font-weight:500"><input type="checkbox" id="a_rem" checked> Ghi nhớ đăng nhập trên thiết bị này</label>
        ${err?`<div class="err" role="alert">${esc(err)}</div>`:''}
        <button class="btn primary" type="submit" id="a_btn">${authTab==='register'?'Tạo tài khoản':'Đăng nhập'}</button>
      </form>
      <p class="small muted">${cloud ? 'Dữ liệu được lưu riêng trong tài khoản Claude của bạn, mở trên thiết bị nào cũng thấy.' : 'Dữ liệu được lưu trong trình duyệt này. Nhớ sao lưu định kỳ trong phần Cài đặt.'}</p>
    </div>
  </div>`;
  $$('[data-auth]').forEach(b=>b.onclick=()=>{ authTab=b.dataset.auth; renderAuth(); });
  $('#authForm').onsubmit = async e => {
    e.preventDefault();
    const btn=$('#a_btn'); btn.disabled=true;
    const u=$('#a_user').value.trim().toLowerCase(); const pw=$('#a_pw').value; const rem=$('#a_rem').checked;
    try{
      if(!/^[a-z0-9_]{3,24}$/.test(u)) throw new Error('Tên đăng nhập gồm 3–24 ký tự: chữ thường không dấu, số hoặc dấu _.');
      const acc = (await kvGet(K.accounts)) || {users:{}};
      if(!acc.users) acc.users={};
      if(authTab==='register'){
        const name=$('#a_name').value.trim(); const pw2=$('#a_pw2').value;
        if(!name) throw new Error('Nhập họ tên gia sư.');
        if(pw.length<6) throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
        if(pw!==pw2) throw new Error('Hai mật khẩu chưa khớp.');
        if(acc.users[u]) throw new Error('Tên đăng nhập này đã có. Chọn tên khác hoặc chuyển sang Đăng nhập.');
        const salt=randHex();
        acc.users[u]={salt, hash: await sha(salt+pw), name, created: Date.now()};
        await kvSet(K.accounts, acc);
        await kvSet(K.profile(u), {displayName:name, phone:'', bankName:'', bankAcc:'', bankOwner:'', qr:'', payNote:''});
        await kvSet(K.students(u), {list:[]});
        if(Store.error) throw new Error('Chưa lưu được tài khoản. Kiểm tra kết nối rồi thử lại.');
      } else {
        const rec=acc.users[u];
        if(!rec) throw new Error('Không tìm thấy tài khoản này. Bạn đã đăng ký chưa?');
        if(await sha(rec.salt+pw)!==rec.hash) throw new Error('Mật khẩu chưa đúng.');
      }
      sessSet(u, rem);
      await enterApp(u);
    }catch(err){ renderAuth(err.message || 'Không kết nối được dữ liệu. Thử lại sau giây lát.'); }
  };
}

async function enterApp(u){
  App.u=u;
  App.handle = Store.mode==='supa' ? (Store.supaUser?.email||'') : '@'+u;
  const [p, s] = await Promise.all([kvGet(K.profile(u)), kvGet(K.students(u))]);
  App.profile = p || {displayName: (Store.mode==='supa' ? (Store.supaUser?.user_metadata?.name || (Store.supaUser?.email||'').split('@')[0]) : u), phone:'', bankName:'', bankAcc:'', bankOwner:'', qr:'', payNote:''};
  if(!p) Store.cache[K.profile(u)] = App.profile;
  App.students = (s && Array.isArray(s.list)) ? s.list : [];
  if(!s) Store.cache[K.students(u)] = {list:App.students};
  else Store.cache[K.students(u)].list = App.students;
  let hash=''; try{ hash=location.hash.replace('#',''); }catch(e){}
  if(NAV.some(n=>n.k===hash)) App.view=hash;
  renderShell();
}
