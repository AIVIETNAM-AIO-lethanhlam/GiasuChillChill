/* giasuchillchill — Lưu trữ: Supabase / Claude / localStorage, hàng đợi ghi */
'use strict';

const Store = { mode:'local', db:null, uid:null, mem:{}, cache:{}, q:{}, saving:0, error:false, downloads:null };
function lsGet(k){ if(k in Store.mem) return Store.mem[k]; try{ const v=localStorage.getItem('gscc:'+k); return v?JSON.parse(v):null; }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem('gscc:'+k, JSON.stringify(v)); delete Store.mem[k]; }catch(e){ Store.mem[k]=JSON.parse(JSON.stringify(v)); } }
function lsDel(k){ try{ localStorage.removeItem('gscc:'+k);}catch(e){} delete Store.mem[k]; }
const docRef = k => Store.db.doc(`data/users/${Store.uid}/${k}`);
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function initStore(){
  if(!window.claude || typeof window.claude.use!=='function'){
    if(window.supabase && typeof window.supabase.createClient==='function' && SUPA_URL && SUPA_KEY){
      try{ Store.sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}}); Store.mode='supa'; }
      catch(e){ console.warn('supabase init', e); }
    }
    return;
  }
  try{
    const [db, user, dl] = await Promise.all([claude.use('db'), claude.use('user'), claude.use('downloads')]);
    Store.downloads = dl || null;
    if(db && user){ const id = await user.id(); if(id){ Store.db=db; Store.uid=id; Store.mode='cloud'; } }
  }catch(e){ console.warn('store init', e); }
}
async function kvGet(k){
  if(k in Store.cache) return Store.cache[k];
  let v=null;
  if(Store.mode==='supa'){
    let lastErr;
    for(let i=0;i<3;i++){
      const {data, error} = await Store.sb.from('kv').select('value').eq('key', k).maybeSingle();
      if(!error){ v = data ? data.value : null; lastErr=null; break; }
      lastErr=error; await sleep(300+Math.random()*500);
    }
    if(lastErr) throw lastErr;
  } else if(Store.mode==='cloud'){
    let lastErr;
    for(let i=0;i<3;i++){
      try{ const s=await docRef(k).get(); v = s.exists ? JSON.parse(JSON.stringify(s.data())) : null; lastErr=null; break; }
      catch(e){ lastErr=e; if(e && (e.code==='invalid_argument'||e.code==='revoked'||e.code==='not_granted')) break; await sleep(300+Math.random()*500); }
    }
    if(lastErr) throw lastErr;
  } else v = lsGet(k);
  Store.cache[k]=v;
  return v;
}
function setSaveInd(){ $$('.saveind').forEach(el=>{ el.classList.toggle('err', Store.error); el.textContent = Store.error ? 'Lỗi lưu dữ liệu' : (Store.saving ? 'Đang lưu…' : (Store.mode==='cloud' ? 'Đã lưu lên tài khoản' : Store.mode==='supa' ? 'Đã lưu lên máy chủ' : 'Đã lưu trên trình duyệt này')); }); }
async function backendSet(k,v){
  if(Store.mode==='supa'){
    const row={user_id:Store.supaUid, key:k, value:JSON.parse(JSON.stringify(v))};
    let {error} = await Store.sb.from('kv').upsert(row, {onConflict:'user_id,key'});
    if(error){ await sleep(400+Math.random()*600); ({error} = await Store.sb.from('kv').upsert(row, {onConflict:'user_id,key'})); }
    if(error) throw error;
    return;
  }
  if(Store.mode==='cloud'){
    const body = JSON.parse(JSON.stringify(v));
    try{ await docRef(k).set(body); }
    catch(e){ if(e && e.code==='unavailable'){ await sleep(400+Math.random()*600); await docRef(k).set(body); } else throw e; }
  } else lsSet(k,v);
}
function kvSet(k,v){
  Store.cache[k]=v;
  const q = Store.q[k] || (Store.q[k]={busy:false,pending:undefined});
  q.pending = v;
  if(q.busy) return q.done;
  q.busy=true; Store.saving++; setSaveInd();
  q.done = (async()=>{
    while(q.pending!==undefined){
      const val=q.pending; q.pending=undefined;
      try{ await backendSet(k,val); Store.error=false; }
      catch(e){ console.warn('save',k,e); Store.error=true;
        if(e && e.code==='quota_exceeded') toast('Bộ nhớ đã đầy — hãy xóa bớt dữ liệu cũ.');
        else if(e && e.code==='invalid_argument') toast('Không lưu được: bạn chỉ có quyền xem trang này.');
        else toast('Không lưu được dữ liệu. Kiểm tra kết nối rồi thử lại.'); }
    }
    q.busy=false; Store.saving--; setSaveInd();
  })();
  return q.done;
}
async function kvDel(k){ delete Store.cache[k]; if(Store.mode==='supa'){ await Store.sb.from('kv').delete().eq('key',k); return; } if(Store.mode==='cloud'){ try{ await docRef(k).delete(); }catch(e){} } else lsDel(k); }
