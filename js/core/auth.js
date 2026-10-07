/* giasuchillchill — Mã hóa mật khẩu (chế độ local), khóa dữ liệu, phiên đăng nhập */
'use strict';

async function sha(s){
  try{ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
  catch(e){ let h1=0x811c9dc5,h2=0x1234567; for(let i=0;i<s.length;i++){ h1=Math.imul(h1^s.charCodeAt(i),16777619); h2=Math.imul(h2^s.charCodeAt(i),2246822507);} return 'f'+(h1>>>0).toString(16)+(h2>>>0).toString(16); }
}
const randHex = () => { try{ return [...crypto.getRandomValues(new Uint8Array(12))].map(x=>x.toString(16).padStart(2,'0')).join(''); }catch(e){ return uid()+uid(); } };
const K = {
  accounts: 'accounts',
  profile: u => `a.${u}.profile`,
  students: u => `a.${u}.students`,
  month: (u,ym) => `a.${u}.m.${ym}`,
};
function sessGet(){ try{ return localStorage.getItem('gscc:session:'+Store.mode) || sessionStorage.getItem('gscc:session:'+Store.mode); }catch(e){ return Store.mem.session||null; } }
function sessSet(u, remember){ try{ if(remember) localStorage.setItem('gscc:session:'+Store.mode,u); else sessionStorage.setItem('gscc:session:'+Store.mode,u); }catch(e){ Store.mem.session=u; } }
function sessClear(){ try{ localStorage.removeItem('gscc:session:'+Store.mode); sessionStorage.removeItem('gscc:session:'+Store.mode);}catch(e){} delete Store.mem.session; }
