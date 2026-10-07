/* giasuchillchill — Khung ứng dụng: menu, điều hướng, đăng ký view */
'use strict';

const NAV = [
  {k:'home', t:'Tổng quan', i:'home'},
  {k:'calendar', t:'Lịch dạy', i:'calendar'},
  {k:'students', t:'Học sinh', i:'students'},
  {k:'progress', t:'Tiến độ', i:'progress'},
  {k:'income', t:'Thu nhập', i:'income'},
  {k:'fee', t:'Học phí', i:'fee'},
  {k:'settings', t:'Cài đặt', i:'settings'},
];
function renderShell(){
  const nav = NAV.map(n=>`<a data-nav="${n.k}" class="${App.view===n.k?'on':''}" tabindex="0">${icon(n.i)}<span>${n.t}</span></a>`).join('');
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="logo logo-sm">giasu<span>chillchill</span></div>
      <nav class="nav">${nav}</nav>
      <div class="who">
        <div><b>${esc(App.profile.displayName||App.u)}</b><div class="small muted" style="overflow-wrap:anywhere">${esc(App.handle)}</div></div>
        <div class="saveind"></div>
        <button class="btn sm" data-act="logout">Đăng xuất</button>
      </div>
    </aside>
    <header class="topbar">
      <div class="tb1"><div class="logo logo-sm">giasu<span>chillchill</span></div><span class="saveind"></span></div>
      <nav class="nav">${nav}</nav>
    </header>
    <main class="main" id="main"></main>
  </div>`;
  $$('[data-nav]').forEach(a=>{ const go=()=>{ App.view=a.dataset.nav; try{ history.replaceState(null,'','#'+App.view);}catch(e){} renderShell(); window.scrollTo(0,0); }; a.onclick=go; a.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } }; });
  setSaveInd();
  renderMain();
}
async function renderMain(){
  const main=$('#main'); if(!main) return;
  if(typeof closePop==='function') closePop();
  try{ main.innerHTML = await VIEWS[App.view](); }
  catch(e){ console.error(e); main.innerHTML = `<div class="empty">Không tải được dữ liệu. <button class="btn sm" data-act="retry">Thử lại</button></div>`; }
  AFTER[App.view]?.();
}

/* ================= views ================= */
const VIEWS={}, AFTER={};
const sessRow = (s, opts={}) => {
  const st=stuById(s.sid); const col=st?.color||COLORS[0];
  return `<div class="sess" data-sess="${esc(s.key)}" data-d="${s.d}" role="button" tabindex="0">
    <span class="dot" style="background:${col}"></span>
    <span class="t">${opts.date?fmtD(s.d)+'<br>':''}${esc(s.t1)}–${esc(s.t2)}</span>
    <span class="n"><b>${esc(st?.name||'?')}</b><span class="small muted">Lớp ${esc(st?.grade||'')} · ${esc(s.sub||'')}</span></span>
    ${s.mk?'<span class="pill mk">Dạy bù</span>':''}
    ${opts.quick && s.s==='planned' ? `<span class="acts"><button class="btn sm" data-quick="done" data-key="${esc(s.key)}" data-d="${s.d}">Đã dạy</button><button class="btn sm" data-quick="off_s" data-key="${esc(s.key)}" data-d="${s.d}">HS nghỉ</button></span>` : `<span class="pill ${s.s}">${STATUS[s.s].short}</span>`}
  </div>`;
};
