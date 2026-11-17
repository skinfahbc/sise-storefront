
window.__siseMainScriptEntered = true;
window.__siseBootSetPhase('main-script-entered');
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,9);
const fa=n=>(+n||0).toLocaleString('fa-IR');
const PROPS=new Set(['value','checked','disabled','selected','hidden','multiple']);
function add(el,kids){for(const c of (Array.isArray(kids)?kids:[kids]).flat(9)){if(c==null||c===false)continue;el.append(c.nodeType?c:document.createTextNode(c))}}
function h(tag,props,...kids){const el=document.createElement(tag);for(const k in(props||{})){const v=props[k];if(v==null||v===false)continue;
  if(k==='class')el.className=v;else if(k==='style'&&typeof v==='object')Object.assign(el.style,v);else if(k==='html')el.innerHTML=v;
  else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else if(PROPS.has(k))el[k]=v;else el.setAttribute(k,v===true?'':v)}
  add(el,kids);return el}
const ICONS={sparkles:'M12 3l1.9 5.4L19.3 10l-5.4 1.9L12 17.3l-1.9-5.4L4.7 10l5.4-1.6zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 14l.6 1.6L7.2 16l-1.6.6L5 18.2l-.6-1.6L2.8 16l1.6-.4z',
 home:'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',grid:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
 bag:'M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2',truck:'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.2a1.4 1.4 0 100-.01M17 19.2a1.4 1.4 0 100-.01',
 card:'M3 6h18v12H3zM3 10h18M6 15h4',user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
 menu:'M4 7h16M4 12h16M4 17h16',heart:'M12 20s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z',
 share:'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
 comment:'M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.2A8 8 0 1121 12z',star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
 shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',clock:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',moon:'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
 sun:'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7l1-8z',phone:'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
 instagram:'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zM12 16a4 4 0 100-8 4 4 0 000 8zM17.5 6.6v.01',
 telegram:'M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l8-6',whatsapp:'M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3zM8.8 8.6c0 3 2.8 5.8 5.8 5.8l1.4-1.4-2-1-1 .8a4 4 0 01-1.9-1.9l.8-1-1-2-2.1.7z',
 link:'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1',
 close:'M6 6l12 12M18 6L6 18',plus:'M12 5v14M5 12h14',check:'M5 12.5l4.5 4.5L19 7.5',chl:'M15 6l-6 6 6 6',chr:'M9 6l6 6-6 6',down:'M6 9l6 6 6-6',up:'M6 15l6-6 6 6',
 play:'M7 4l13 8-13 8V4z',bell:'M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4',gift:'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C9 9 7 5 10 4.5S13 8 12 9zm0 0c3 0 5-4 2-4.5S11 8 12 9z',
 tag:'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5v.01',mail:'M3 6h18v12H3zM3 7l9 7 9-7',pin:'M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
 gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
 search:'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',box:'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
 image:'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5v.01',palette:'M12 3a9 9 0 000 18c1.5 0 2-1 1.5-2s.5-2 1.5-2h2a3 3 0 003-3c0-5-4.5-11-8-11zM7.5 11v.01M10 7.5v.01M14.5 7.5v.01',
 list:'M8 6h13M8 12h13M8 18h13M3 6v.01M3 12v.01M3 18v.01',info:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.01',crown:'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z',
 sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
 edit:'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',users:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 010 7M19 15c2 .8 3 2.6 3 6',
 undo:'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',lock:'M6 11h12v10H6zM8 11V7a4 4 0 118 0v4',logout:'M10 4H5v16h5M16 8l4 4-4 4M20 12H9',wallet:'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 7l12-3v3M17 14v.01',
 youtube:'M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8zM10 9l5 3-5 3V9z',x:'M4 4l16 16M20 4L4 20',globe:'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'
};
const ic=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n]||ICONS.star}"/></svg>`;
const I=(n,s)=>h('span',{html:ic(n,s),style:{display:'inline-flex'}});

/* ---------- generated product art ---------- */
function shade(hex,amt){let n=parseInt(hex.replace('#',''),16),r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(amt>0?v+(255-v)*amt:v*(1+amt))));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
const BGS=[['#f3e8d4','#cdb892'],['#c7d3de','#8ea3b8'],['#2b2520','#0f0d0b'],['#f1d9d2','#d4a99f'],['#e7dcc8','#a98f68'],['#34404d','#161a20']];
function bagBody(type,c,id){const b=`url(#b${id})`,d=shade(c,-.38),gold='#dcb572',l=shade(c,.25);
 const stitch=(p)=>`<path d="${p}" stroke="rgba(255,255,255,.38)" stroke-width="2" stroke-dasharray="7 6" fill="none"/>`;
 if(type==='tote')return `<path d="M205 258C198 108 402 108 395 258" fill="none" stroke="${d}" stroke-width="17" stroke-linecap="round"/><path d="M140 250H460L488 505Q491 526 468 526H132Q109 526 112 505Z" fill="${b}"/><path d="M140 250H460L463 292H137Z" fill="rgba(255,255,255,.12)"/><path d="M440 250H460L488 505Q491 526 468 526H452Z" fill="rgba(0,0,0,.2)"/>${stitch('M150 304H450')}<rect x="268" y="326" width="64" height="38" rx="8" fill="${gold}"/><circle cx="300" cy="345" r="7" fill="${shade(gold,-.3)}"/>`;
 if(type==='satchel')return `<path d="M214 262C208 150 392 150 386 262" fill="none" stroke="${d}" stroke-width="15" stroke-linecap="round"/><rect x="118" y="250" width="364" height="262" rx="36" fill="${b}"/><path d="M118 286Q118 250 154 250H446Q482 250 482 286V334Q300 428 118 334Z" fill="rgba(0,0,0,.16)" stroke="rgba(255,255,255,.28)" stroke-width="2"/>${stitch('M140 470H460')}<circle cx="300" cy="376" r="22" fill="${gold}"/><circle cx="300" cy="376" r="9" fill="${shade(gold,-.3)}"/>`;
 if(type==='clutch')return `<path d="M128 336C140 170 460 170 472 336" fill="none" stroke="${gold}" stroke-width="7" stroke-dasharray="1 9" stroke-linecap="round"/><rect x="92" y="322" width="416" height="192" rx="42" fill="${b}"/><path d="M92 364Q92 322 134 322H466Q508 322 508 364V382Q300 456 92 382Z" fill="rgba(0,0,0,.14)" stroke="rgba(255,255,255,.28)" stroke-width="2"/><rect x="270" y="404" width="60" height="30" rx="15" fill="${gold}"/><circle cx="300" cy="419" r="6" fill="${shade(gold,-.3)}"/>${stitch('M120 486H480')}`;
 return `<path d="M178 276C146 90 454 90 422 276" fill="none" stroke="${d}" stroke-width="19" stroke-linecap="round"/><path d="M150 254H450L482 484Q484 524 442 526H158Q116 524 118 484Z" fill="${b}"/><ellipse cx="300" cy="254" rx="150" ry="24" fill="${l}"/><ellipse cx="300" cy="256" rx="136" ry="14" fill="${d}"/><path d="M190 300Q300 330 410 300" stroke="${gold}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="300" cy="322" r="10" fill="${gold}"/>${stitch('M140 470H460')}`}
function bagArt(type,color,variant=0,o={}){const w=o.w||600,hh=o.h||600,id=uid(),bg=BGS[o.bg!=null?o.bg:variant%BGS.length];
 let tf=o.tf||'';if(!o.tf){if(variant===1)tf='translate(-270 -384) scale(1.9)';else if(variant===2)tf='translate(600 0) scale(-1 1) rotate(-7 300 400)';else if(variant===3)tf='translate(30 20) scale(.9)'}
 const dark=bg[1]==='#0f0d0b'||bg[1]==='#161a20';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color,.2)}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${shade(color,-.3)}"/></linearGradient><radialGradient id="r${id}" cx=".35" cy=".25" r=".7"><stop offset="0" stop-color="#fff" stop-opacity="${dark?.18:.55}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="f${id}"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="${w}" height="${hh}" fill="url(#g${id})"/><rect width="${w}" height="${hh}" fill="url(#r${id})"/><g transform="${o.outer||''}"><g transform="${tf}"><ellipse cx="300" cy="534" rx="190" ry="17" fill="#000" opacity=".3" filter="url(#f${id})"/>${bagBody(type,color,id)}</g></g></svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)}
const heroArt=(type,color,i)=>{const id=uid(),pal=[['#6f8aa3','#e0b374','#1a1410'],['#3a4756','#d6a56a','#120f0c'],['#8c7a66','#f0d7a8','#241a12']][i%3];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200"><defs><linearGradient id="a${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset=".5" stop-color="${pal[1]}" stop-opacity=".85"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color,.2)}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${shade(color,-.3)}"/></linearGradient><filter id="f${id}"><feGaussianBlur stdDeviation="18"/></filter><filter id="k${id}"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="800" height="1200" fill="url(#a${id})"/><g fill="#fff3d6" opacity=".35" filter="url(#k${id})"><circle cx="130" cy="220" r="44"/><circle cx="300" cy="140" r="24"/><circle cx="690" cy="200" r="52"/><circle cx="560" cy="110" r="20"/><circle cx="90" cy="520" r="30"/><circle cx="720" cy="620" r="36"/></g><rect y="760" width="800" height="440" fill="#0d0a08" opacity=".35"/><g transform="translate(30 250) scale(.85)"><ellipse cx="300" cy="534" rx="200" ry="20" fill="#000" opacity=".45" filter="url(#f${id})"/>${bagBody(type,color,id)}</g></svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)};
const bannerArt=()=>{const id=uid(),c='#b87a3d';const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 360"><defs><linearGradient id="a${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1511"/><stop offset=".6" stop-color="#3b2d1f"/><stop offset="1" stop-color="#6f8aa3"/></linearGradient><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c,.2)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-.3)}"/></linearGradient><radialGradient id="r${id}" cx=".78" cy=".4" r=".5"><stop offset="0" stop-color="#f4dcae" stop-opacity=".7"/><stop offset="1" stop-color="#f4dcae" stop-opacity="0"/></radialGradient></defs><rect width="700" height="360" fill="url(#a${id})"/><rect width="700" height="360" fill="url(#r${id})"/><g transform="translate(300 -20) scale(.62)">${bagBody('satchel',c,id)}</g></svg>`;return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)};

/* ---------- seed data ---------- */
const STATUSES=[['new','در انتظار پرداخت'],['pending_review','رسید ثبت شد · در انتظار بررسی'],['paid','پرداخت تأیید شد'],['processing','در حال آماده‌سازی'],['shipped','ارسال شد'],['delivered','تحویل داده شد'],['canceled','لغو شد']];
function seed(){
 const cats=[{id:'c1',name:'کیف دوشی',img:''},{id:'c2',name:'دستی و مجلسی',img:''},{id:'c3',name:'کراس‌بادی',img:''},{id:'c4',name:'اداری',img:''},{id:'c5',name:'سطلی',img:''},{id:'c6',name:'مینی‌بگ',img:''}];
 const P=(title,type,cat,price,old,badge,colors,desc,vi)=>({id:uid(),title,desc,price,oldPrice:old,badge,cat,stock:12,
  images:[0,1,2,3].map(v=>bagArt(type,colors[0][1],v,{bg:(vi+v)%6})),
  colors:colors.map(([name,hex],i)=>({id:uid(),name,hex,img:i?bagArt(type,hex,0,{bg:(vi+i)%6}):''}))});
 const products=[
  P('کیف دوشی چرم طبیعی «آوین»','tote','c1',4850000,5400000,'پرفروش هفته',[['کاراملی','#b87a3d'],['مشکی','#26221f'],['کرم','#e4d5b7'],['زیتونی','#5d6b46']],'✨ چرم طبیعی گاوی با دوخت دست و آستر مخمل\nفضای کافی برای لپ‌تاپ ۱۳ اینچ، کیف پول و وسایل روزانه.\n• دو جیب داخلی و یک جیب زیپ‌دار\n• یراق‌آلات آبکاری طلایی ضدزنگ\n• ابعاد: ۳۵×۲۸×۱۲ سانتی‌متر',0),
  P('کیف دستی مجلسی «ماهرخ»','clutch','c2',2950000,3300000,'ترند روز',[['شرابی','#7a2236'],['مشکی','#1d1b1a'],['طلایی','#c79a4b']],'کیف دستی کلاچ با زنجیر طلایی قابل‌جداشدن؛ مناسب مهمانی و عروسی.\n• بسته‌شدن با گیره مغناطیسی\n• جای موبایل و کارت',1),
  P('کیف کراس‌بادی «نگار»','satchel','c3',3600000,0,'جدید',[['عسلی','#c08a4a'],['سرمه‌ای','#27364f'],['سبز جنگلی','#2f4a3a'],['صورتی','#c98b8f']],'کیف کراس‌بادی سبک با بند قابل تنظیم. روزمره، سفر و شهرگردی.\n• چرم مصنوعی درجه‌یک ضدخش\n• قفل طلایی',2),
  P('کیف اداری «پرنیا»','tote','c4',5200000,5900000,'',[['مشکی','#1f1d1c'],['قهوه‌ای','#5b3a26'],['خاکستری','#7b7f86']],'کیف اداری ساختاریافته با جای لپ‌تاپ و پوشه A4.\nدوخت دقیق و کف تقویت‌شده.',3),
  P('کیف سطلی «بهار»','bucket','c5',3150000,3500000,'پرفروش',[['شکلاتی','#6a4129'],['کرم','#d9c6a2'],['سبز','#55705a']],'کیف سطلی با بند کشی و حلقه‌های طلایی؛ سبک و فضادار.',4),
  P('کیف دوشی «سیمین»','satchel','c1',4100000,0,'',[['زرشکی','#6e1f2c'],['مشکی','#222'],['آبی یخی','#8da4bd']],'کیف دوشی کلاسیک با فلپ و قفل گرد.\nمناسب استایل رسمی و روزمره.',5),
  P('مینی‌بگ «لیلا»','clutch','c6',1890000,2150000,'محدود',[['صورتی پودری','#d9a5a6'],['مشکی','#1f1d1c'],['سفید شیری','#efe6d4']],'مینی‌بگ سبک با زنجیر، فقط به اندازه‌ی لازم‌ها.',0),
  P('کیف سطلی چرم «گلاره»','bucket','c5',3890000,4400000,'تخفیف ویژه',[['کاراملی','#a86a35'],['مشکی','#1c1a19']],'سطلی با چرم نرم دست‌دوز و زیپ داخلی.',2)
 ];
 cats.forEach((c,i)=>{const p=products.find(x=>x.cat===c.id)||products[i];c.img=bagArt(['tote','clutch','satchel','tote','bucket','clutch'][i],p.colors[0].hex,i%2?2:0,{bg:(i+1)%6})});
 const st=(title,cap,pi,v)=>{const p=products[pi];return{id:uid(),type:'image',src:bagArt(['tote','clutch','satchel','tote','bucket','satchel','clutch','bucket'][pi],p.colors[0].hex,v,{w:600,h:1000,tf:'translate(0 230) scale(1)',bg:(pi+v)%6}),title,caption:cap,productId:p.id,likes:12+pi*7,comments:[]}};
 const stories=[st('جدید','کلکسیون پاییزی رسید ✨',0,0),st('تخفیف','تا پایان هفته ۱۰٪ تخفیف روی کیف‌های مجلسی',1,3),st('پرفروش','پرفروش‌ترین کیف ماه',4,0),st('مجلسی','برای شب‌های خاص',1,2),st('روزمره','هر روز، یک استایل',2,1),st('اداری','حرفه‌ای و شیک',3,0)];
 stories[0].comments=[{id:uid(),name:'سارا',text:'خیلی قشنگه! رنگ کاراملی موجوده؟',time:Date.now()-3.6e6}];
 return{v:1,
  store:{logoH:52,name:'SISE',tagline:'کیف‌های دست‌دوز، اصیل و شیک',logo:'',loadingLogo:'',loadingTitle:'SISE',loadingText:'DISCOVER YOUR STYLE',loadingBg:'#efe2d2',loadingAccent:'#68442e',loadingDuration:1500,loadingEnabled:true,phone:'۰۲۱-۱۲۳۴۵۶۷۸',address:'تهران، خیابان ولیعصر',currency:'تومان',productsTitle:'جدیدترین محصولات',storiesHintDone:'همه دیده شد — بکش تا بقیه رو ببینی',copy:'© SISE · همه حقوق محفوظ است'},
  theme:{accent:'#e0b374',accent2:'#f4dcae',bgDark:'#0e0c0a',bgLight:'#efe7d9',glass:12,blur:22,radius:24,mode:'light'},
  show:{hero:true,stories:true,intro:true,products:true,features:true,night:true,about:true,social:true},
  hero:[{