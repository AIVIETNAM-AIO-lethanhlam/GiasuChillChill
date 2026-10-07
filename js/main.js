/* giasuchillchill — Xử lý sự kiện chung và khởi động ứng dụng */
'use strict';

document.addEventListener('click', async e=>{
  const q=e.target.closest('[data-quick]'); if(q){ e.stopPropagation(); return quickMark(q.dataset.key, q.dataset.d, q.dataset.quick); }
  const ss=e.target.closest('[data-sess]'); if(ss && !e.target.closest('.modal')) return openSession(ss.dataset.sess, ss.dataset.d);
  const am=e.target.closest('[data-addmk]'); if(am) return openMakeup({d:am.dataset.addmk});
  const ed=e.target.closest('[data-edit]'); if(ed) return studentForm(stuById(ed.dataset.edit));
  const gp=e.target.closest('[data-goprog]'); if(gp){ App.prog.sid=gp.dataset.goprog; return goView('progress'); }
  const gf=e.target.closest('[data-gofee]'); if(gf){ App.fee.sid=gf.dataset.gofee; return goView('fee'); }
  const go=e.target.closest('[data-go]'); if(go){ e.preventDefault(); return goView(go.dataset.go); }
  const a=e.target.closest('[data-act]'); if(!a) return;
  const act=a.dataset.act;
  if(act==='addStudent') studentForm(null);
  else if(act==='logout'){ if(Store.mode==='supa'){ try{ await Store.sb.auth.signOut(); }catch(_){} Store.supaUid=null; Store.supaUser=null; Store.cache={}; } sessClear(); App.u=null; authTab='login'; renderAuth(); }
  else if(act==='retry'){ Store.cache={}; renderMain(); }
});
document.addEventListener('keydown', e=>{ if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.sess[data-sess]')){ e.preventDefault(); openSession(e.target.dataset.sess, e.target.dataset.d); } });
function goView(v){ App.view=v; try{ history.replaceState(null,'','#'+v);}catch(e){} renderShell(); window.scrollTo(0,0); }

/* ================= boot ================= */
(async()=>{
  await initStore();
  if(Store.mode==='supa'){
    let recovery = /type=recovery/.test(location.hash||'');
    Store.sb.auth.onAuthStateChange((event, session)=>{
      if(event==='PASSWORD_RECOVERY'){ recovery=true; authTab='newpw'; renderAuthSupa(); }
      if(event==='SIGNED_OUT' && App.u){ App.u=null; Store.cache={}; authTab='login'; renderAuthSupa('Phiên đăng nhập đã hết hạn. Đăng nhập lại nhé.'); }
    });
    try{
      const {data}=await Store.sb.auth.getSession();
      const session=data?.session;
      if(recovery){ authTab='newpw'; renderAuthSupa(); return; }
      if(session){ Store.supaUid=session.user.id; Store.supaUser=session.user; try{ if(/access_token|type=signup/.test(location.hash)) history.replaceState(null,'',location.pathname); }catch(_){} await enterApp('me'); return; }
    }catch(e){ console.warn(e); }
    renderAuth(); return;
  }
  const u=sessGet();
  if(u){
    try{ const acc=await kvGet(K.accounts); if(acc?.users?.[u]){ await enterApp(u); return; } }catch(e){ console.warn(e); }
    sessClear();
  }
  renderAuth();
})();
