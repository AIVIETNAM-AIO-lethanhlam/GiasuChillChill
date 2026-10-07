/* giasuchillchill — Hàm tiện ích: DOM, ngày tháng, tiền tệ, hằng số, icon, toast */
'use strict';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const todayStr = () => ymd(new Date());
const curYM = () => todayStr().slice(0,7);
const addMonths = (ym, n) => { const [y,m] = ym.split('-').map(Number); const d = new Date(y, m-1+n, 1); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; };
const monthsBetween = (a, b) => { const out=[]; let c=a.slice(0,7); const e=b.slice(0,7); let guard=0; while(c<=e && guard++<60){ out.push(c); c=addMonths(c,1);} return out; };
const DOW = ['CN','T2','T3','T4','T5','T6','T7'];
const DOW_FULL = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
const fmtD = s => { const d=parseD(s); return `${DOW[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth()+1)}`; };
const fmtDD = s => { const d=parseD(s); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`; };
const fmtFull = s => { const d=parseD(s); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const ymLabel = ym => { const [y,m]=ym.split('-'); return `Tháng ${Number(m)}/${y}`; };
const money = n => (Math.round(n||0)).toLocaleString('vi-VN') + 'đ';
const uid = () => Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
const noAccent = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
const COLORS = ['#4B3BA6','#1C8657','#C0572B','#1F6FB2','#A8397A','#8A6A0A','#2E8B8B','#6B4FD1'];
const SUBJECTS = ['Toán','Tiếng Việt','Văn','Tiếng Anh','Vật lý','Hóa học','Sinh học','Lịch sử','Địa lý','Tin học','IELTS','Luyện chữ'];
const STATUS = {
  planned:{label:'Chưa ghi nhận', short:'Theo lịch'},
  done:{label:'Đã dạy', short:'Đã dạy'},
  off_s:{label:'HS xin nghỉ', short:'HS nghỉ'},
  off_t:{label:'GS nghỉ / hủy', short:'GS nghỉ'}
};
const HW = { full:'Làm đầy đủ', part:'Làm một phần', none:'Không làm', na:'Không giao bài' };
const ICON = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  students:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.6c2.8.1 4.7 1.8 5.5 5.4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  income:'<rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.8"/><path d="M6 9.5v6M18 9.5v6"/>',
  progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  fee:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

let toastT;
function toast(msg){ let t=$('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t);} t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{t.hidden=true},2600); }
