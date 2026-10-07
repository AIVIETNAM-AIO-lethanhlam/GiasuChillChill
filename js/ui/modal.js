/* giasuchillchill — Hộp thoại (modal) */
'use strict';

let lastFocus=null;
function openModal(html){
  const root=$('#modal-root');
  const existing=$('.modal-bg', root);
  const scroll = existing ? $('.modal',existing).scrollTop : 0;
  if(!existing) lastFocus=document.activeElement;
  root.innerHTML=`<div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.style.overflow='hidden';
  $('.modal',root).scrollTop=scroll;
  $('#mbg').onmousedown=e=>{ if(e.target.id==='mbg') closeModal(); };
  $$('[data-close]',root).forEach(b=>b.onclick=closeModal);
  if(!existing){ const f=$('input,select,textarea',root); if(f && window.innerWidth>700) f.focus(); }
}
function closeModal(){ $('#modal-root').innerHTML=''; document.body.style.overflow=''; try{ lastFocus?.focus(); }catch(e){} }
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && $('#modal-root').innerHTML){ $('#modal-root').innerHTML=''; document.body.style.overflow=''; } });
