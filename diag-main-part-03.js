+token;
  const r=await fetch(SB.url+path,{method,headers,body:body==null?undefined:JSON.stringify(body),signal:ctl.signal});
  const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch(e){data=raw}
  if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||('خطای سرور '+r.status));return data;
 }catch(e){if(e.name==='AbortError')throw new Error('پاسخی از سرور دریافت نشد');throw e}finally{clearTimeout(tm)}
}
async function custToken(){let s=custSess();if(!s)return null;if(s.exp>Date.now()/1000+60)return s.access;
 try{const r=await custFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh}});s={access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+r.expires_in,email:r.user?.email||s.email};custSave(s);return s.access}catch(e){custSave(null);return null}}
async function syncCustomerProfile(u,token){
 const data={full_name:uName(u),first:u.first||'',last:u.last||'',landline:u.landline||'',postal:u.postal||'',address:u.address||'',avatar:u.avatar&&!String(u.avatar).startsWith('data:')?u.avatar:'',profile_phone:u.phone||'',sise_profile_synced_at:new Date().toISOString()};
 return custFetch('/auth/v1/user',{method:'PUT',body:{data},token,timeout:12000});
}
async function custActivate(authUser){
 if(!authUser?.id)throw new Error('حساب ورود معتبر نیست');const token=await custToken();if(!token)throw new Error('نشست ورود منقضی شده');
 const pmUid=await custFetch('/rest/v1/rpc/pm_register_account',{method:'POST',body:{},token});
 const md=authUser.user_metadata||{},full=(md.full_name||'').trim();let u=S.users.find(x=>x.id===authUser.id);
 if(!u){const parts=full.split(/\s+/);u={id:authUser.id,first:md.first||parts.shift()||'مشتری',last:md.last||parts.join(' '),name:full||authUser.email,phone:'',email:authUser.email,created:Date.now(),pmUid};S.users.push(u)}
 else{u.email=authUser.email;u.pmUid=pmUid;if(full)u.name=full}
 for(const k of ['first','last','landline','postal','address','avatar'])if(md[k]!=null&&md[k]!=='')u[k]=md[k];
 if(!u.phone&&md.profile_phone)u.phone=md.profile_phone;
 if(u.avatar&&String(u.avatar).startsWith('data:')){try{u.avatar=await chUpload(u.avatar)}catch(e){console.warn('Profile photo sync deferred:',e.message)}}
 if(authUser.phone){let p=normNum(authUser.phone);if(p.startsWith('98')&&p.length===12)p='0'+p.slice(2);u.phone=p}
 const hasLocalProfile=!!(u.first||u.last||u.landline||u.postal||u.address||u.avatar);
 if(hasLocalProfile&&!md.sise_profile_synced_at){
  try{await syncCustomerProfile(u,token);u.siseProfileSynced=true}catch(e){console.warn('Customer profile sync deferred:',e.message)}
 }
 V.user=u.id;saveV();persist();renderHeader();return u;
}
async function custRestore(){const token=await custToken();if(!token)return false;try{const user=await custFetch('/auth/v1/user',{token});await custActivate(user);return true}catch(e){custSave(null);V.user=null;saveV();return false}}
async function custSignIn(email,password){const r=await custFetch('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});custSave({access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+r.expires_in,email:r.user?.email||email});return custActivate(r.user)}
async function custSignUp(email,password,fullName){const r=await custFetch('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+'/' ),{method:'POST',body:{email,password,data:{full_name:fullName}}});if(!r.access_token||!r.user)return false;custSave({access:r.access_token,refresh:r.refresh_token,exp:Date.now()/1000+r.expires_in,email:r.user.email||email});await custActivate(r.user);return true}
async function custSignOut(){custSave(null);V.user=null;saveV();renderHeader()}
async function custGoogleSignIn(){
 const redirectTo=location.origin+location.pathname+location.search;
 location.href=SB.url+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(redirectTo);
}
function custOAuthCallback(){
 const p=new URLSearchParams(location.hash.replace(/^#/,''));
 const access=p.get('access_token'),refresh=p.get('refresh_token');
 if(!access||!refresh)return false;
 const expiresIn=Number(p.get('expires_in'))||3600;
 custSave({access,refresh,exp:Date.now()/1000+expiresIn,email:''});
 history.replaceState(null,'',location.pathname+location.search);
 return true;
}

/* public content: visitors read, admin writes */
async function sbPull(timeout){const r=await sbFetch('/rest/v1/site?id=eq.main&select=data,updated_at',{timeout:timeout||6000});return r&&r[0]||null}
function applyRemote(row){if(!row||!row.data||!row.data.products)return false;
 const localStore=S.store||{},remoteStore=row.data.store||{};
 const assetsChanged=(remoteStore.logo&&remoteStore.logo!==localStore.logo)||(remoteStore.loadingLogo&&remoteStore.loadingLogo!==localStore.loadingLogo);
 if(row.updated_at===S._ts&&!assetsChanged)return false;
 const keep={admin:S.admin,users:S.users,orders:S.orders,mv:S.mv,v:S.v};S=Object.assign({},row.data,keep,{_ts:row.updated_at});fixup(S);persist();return true}
/* orders */
const sbOrderPost=o=>sbFetch('/rest/v1/orders',{method:'POST',headers:{Prefer:'return=minimal'},body:{code:o.code,data:o},timeout:10000});
const sbCreateOrder=payload=>sbFetch('/rest/v1/rpc/create_order',{method:'POST',body:{p_payload:payload},timeout:15000});
async function sbTrack(code){try{const d=await sbFetch('/rest/v1/rpc/track_order',{method:'POST',body:{c:code}});return d||null}catch(e){return null}}
async function retryOrders(){for(const o of S.orders.filter(x=>x.pending)){try{await sbOrderPost(o);delete o.pending;persist()}catch(e){if(/duplicate|unique|23505/i.test(e.message)){delete o.pending;persist()}}}}
async function refreshMine(){let ch=false;for(const c of V.orders.slice(-8)){const o=S.orders.find(x=>x.code===c);if(!o||o.pending)continue;const d=await sbTrack(c);if(d&&(d.status!==o.status||d.payRef!==o.payRef)){o.status=d.status;o.payRef=d.payRef;ch=true}}if(ch){persist();return true}return false}

/* viewer (per visitor) */
let V={seen:{},liked:{},wish:{},cart:[],user:null,orders:[],mode:null};
try{Object.assign(V,JSON.parse(localStorage.getItem('kifara_v')||'{}'))}catch(e){}
document.documentElement.setAttribute('data-theme',V.mode||'light');
const saveV=()=>{try{localStorage.setItem('kifara_v',JSON.stringify(V))}catch(e){}};
function toast(m){const t=h('div',{class:'toast',role:'status'},m);document.body.append(t);setTimeout(()=>t.remove(),2600)}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('کپی شد')}catch(e){const a=h('textarea',{value:t,style:{position:'fixed',opacity:0}});document.body.append(a);a.select();try{document.execCommand('copy');toast('کپی شد')}catch(_){toast('متن را به‌صورت دستی کپی کنید')}a.remove()}}
function readFile(file,{max=1400,q=.84,keepAlpha=false,video=false}={}){return new Promise((res,rej)=>{
 if(file.type.startsWith('video/')){if(file.size>14e6)return rej(new Error('حجم ویدیو باید کمتر از ۱۴ مگابایت باشد'));const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;return fr.readAsDataURL(file)}
 const fr=new FileReader();fr.onload=()=>{if(file.type==='image/svg+xml')return res(fr.result);const im=new Image();im.onload=()=>{const sc=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const png=keepAlpha&&/png|webp/.test(file.type);res(c.toDataURL(png?'image/png':(WEBP?'image/webp':'image/jpeg'),q))};im.onerror=()=>rej(new Error('تصویر خوانده نشد'));im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
const money=n=>fa(n)+' '+(S?S.store.currency:'تومان');
const prod=id=>S.products.find(p=>p.id===id);
const disc=p=>p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;
/* ---------- state & infra ---------- */
let cur='home',catFilter=null,catQ='';
const stack=[];
function openModal(node,kind='b'){const ov=h('div',{class:'ov '+kind,onclick:e=>{if(e.target===ov)close()}},node);document.body.append(ov);document.body.classList.add('lock');
 const o={ov,close};function close(){ov.remove();const k=stack.indexOf(o);if(k>-1)stack.splice(k,1);if(!stack.length&&!$('.sv,.lb,.adm'))document.body.classList.remove('lock')}stack.push(o);return close}
addEventListener('keydown',e=>{if(e.key==='Escape'&&stack.length)stack[stack.length-1].close()});
const unlock=()=>{if(!stack.length&&!$('.sv,.lb,.adm'))document.body.classList.remove('lock')};
const lum=hex=>{const n=parseInt(hex.replace('#',''),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255};
function applyTheme(){const t=S.theme,r=document.documentElement,st=r.style;st.setProperty('--accent',t.accent);st.setProperty('--accent2',t.accent2);st.setProperty('--bgd',t.bgDark);st.setProperty('--bgl',t.bgLight);
 st.setProperty('--ga',t.glass/100);st.setProperty('--blur',t.blur+'px');st.setProperty('--r',t.radius+'px');document.documentElement.dataset.lift=S.fx&&S.fx.lift?'1':'0';st.setProperty('--logo-h',(S.store.logoH||52)+'px');st.setProperty('--on-accent',lum(t.accent)>.55?'#2a1c08':'#ffffff');
 r.setAttribute('data-theme',V.mode||t.mode||'dark')}
const isDark=()=>(V.mode||S.theme.mode)!=='light';
function toggleMode(){V.mode=isDark()?'light':'dark';saveV();applyTheme();document.querySelectorAll('.tg').forEach(e=>e.classList.toggle('on',isDark()))}
const curUser=()=>S.users.find(u=>u.id===V.user)||null;
const uName=u=>[u.first,u.last].filter(Boolean).join(' ')||u.name||'';
const uInit=u=>uName(u).trim()[0]||'؟';
const avEl=(u,cls)=>h('span',{class:'av'+(cls?' '+cls:'')},u&&u.avatar?h('img',{src:u.avatar,alt:''}):(u?uInit(u):I('user',24)));
function openUrl(u){const a=h('a',{href:u,target:'_blank',rel:'noopener'});document.body.append(a);a.click();a.remove()}
function runTarget(t){if(!t)return;
 if(t==='chat-ai'){CH.tab='ai';return go('chat')}if(t==='view:chat'){CH.tab='pub';return go('chat')}
 if(t.startsWith('page:'))return openPage(t.slice(5));if(t==='call'||t==='contact')return callSupport();if(t.startsWith('view:'))return go(t.slice(5));if(t==='about'){go('home');setTimeout(()=>{const e=$('#about');e&&e.scrollIntoView({behavior:'smooth',block:'center'})},120);return}
 if(t==='contact')return openContact();if(t.startsWith('url:'))return openUrl(t.slice(4));if(t.startsWith('product:'))return openProduct(t.slice(8));if(t==='login')return openAuth()}
const ago=ts=>{const m=Math.round((Date.now()-ts)/6e4);return m<1?'همین الان':m<60?fa(m)+' دقیقه پیش':m<1440?fa(Math.round(m/60))+' ساعت پیش':fa(Math.round(m/1440))+' روز پیش'};
const normNum=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g,'');

/* ---------- header / nav ---------- */
function renderHeader(){const hd=$('#hd'),u=curUser();hd.innerHTML='';
 hd.append(h('div',{class:'hd-in glass'},
  h('div',{class:'hd-grp'},h('button',{class:'ib','aria-label':'منو',onclick:openMenu,html:ic('menu')}),
   h('button',{class:'ib','aria-label':u?'حساب کاربری':'ورود یا ثبت‌نام',onclick:openAuth,html:u?(u.avatar?`<img class="hd-av" src="${u.avatar}" alt="">`:`<b style="color:var(--accent2)">${uInit(u)}</b>`):ic('user')})),
  h('a',{class:'logo',href:'#',onclick:e=>{e.preventDefault();go('home')}},S.store.logo?lgw():[I('bag',26),S.store.name])))}
function buildNav(){const nv=$('#nv');nv.innerHTML='';const inn=h('div',{class:'nv-in'}),bar=h('div',{class:'nv-bar glass'});
 S.nav.forEach(n=>bar.append(h('button',{class:'nv-b','data-v':n.view,'aria-label':n.label,onclick:()=>{const drawer=document.querySelector('.ov.s');if(drawer){const modal=stack.find(x=>x.ov===drawer);if(modal)modal.close();else drawer.remove()}go(n.view)}},I(n.icon,22),h('span',{},n.label),n.view==='cart'?h('em',{class:'cnt',hidden:true}):null)));
 inn.append(bar,h('div',{class:'nv-bub'}));nv.append(inn);cartBadge()}
function setNav(animate){const nv=$('#nv'),inn=$('.nv-in',nv),bub=$('.nv-bub',nv);if(!inn)return;const btns=[...nv.querySelectorAll('.nv-b')],act=btns.find(b=>b.dataset.v===cur),item=S.nav.find(n=>n.view===cur);
 const apply=()=>{btns.forEach(b=>b.classList.toggle('on',b===act));if(act){const x=act.offsetLeft+act.offsetWidth/2;inn.style.setProperty('--nx',x+'px');bub.style.left=x+'px';bub.innerHTML=ic(item.icon,26);inn.style.setProperty('--nr','37px')}else inn.style.setProperty('--nr','0px')};
 if(!animate){apply();return}nv.classList.add('sw');inn.style.setProperty('--nr','0px');setTimeout(()=>{nv.classList.remove('sw');apply()},180)}
addEventListener('resize',()=>setNav(false));
function cartBadge(){toteSync();const n=V.cart.reduce((a,c)=>a+c.qty,0);document.querySelectorAll('.nv-b .cnt').forEach(e=>{e.hidden=!n;e.textContent=fa(n)})}
function go(v){const was=cur;if(was!==v){try{history.pushState({...(history.state||{}),siseView:v},'',location.href)}catch(e){}}cur=v;if(v!=='categories'){catFilter=null;catQ=''}renderMain();setNav(was!==v);window.scrollTo({top:0})}
let sisePopHandling=false;
function siseBackInit(){try{const root={...(history.state||{}),siseRoot:true,siseView:'home'};history.replaceState(root,'',location.href);history.pushState(root,'',location.href)}catch(e){}}
addEventListener('popstate',e=>{try{if(stack&&stack.length){stack[stack.length-1].close();history.pushState({...(history.state||{}),siseView:cur},'',location.href);return}const lb=document.querySelector('.lb');if(lb){const x=lb.querySelector('button[aria-label="بستن"]');if(x)x.click();history.pushState({...(history.state||{}),siseView:cur},'',location.href);return}if(ADM&&ADM.open){const st=e.state||{};if(st.siseAdminTab){sisePopHandling=true;ADM.go(st.siseAdminTab);sisePopHandling=false;return}admTab='dash';sisePopHandling=true;if(ADM.go)ADM.go('dash');sisePopHandling=false;history.pushState({siseAdminRoot:true,siseAdminTab:'dash'},'',location.href);return}
 const st=e.state||{},v=st.siseView||'home';if(cur!==v){cur=v;catFilter=null;catQ='';renderMain();setNav(false);window.scrollTo({top:0})}
 if(!st.siseRoot||v==='home')history.pushState({siseRoot:true,siseView:'home'},'',location.href)
 }catch(err){try{history.pushState({siseRoot:true,siseView:'home'},'',location.href)}catch(x){}}});


/* ---------- views ---------- */
let _ps=0;addEventListener('resize',()=>{const p=innerWidth>=900?10:8;if(_ps&&p!==_ps&&(cur==='home'||cur==='categories'))renderMain();_ps=p});_ps=innerWidth>=900?10:8;
setInterval(()=>{try{if(purgeSt(S)){refreshStories();}}catch(e){}},60000);
function renderMain(){applyFav();const app=$('#app');app.innerHTML='';const v={home:homeView,categories:catView,cart:cartView,track:trackView,pay:payView,chat:chatView}[cur]||homeView;add(app,[v()]);app.classList.toggle('home',!!$('.hero',app));syncChatLock();syncAiFab();updateHd();revealInit()}
function secHead(t,extra){return h('div',{class:'sec-h'},h('h3',{},t),extra)}
function srCut(orig){let src=orig,svg=false;if(src.startsWith('data:image/svg+xml')){try{const t=decodeURIComponent(src.slice(src.indexOf(',')+1)).replace(/<rect width="\d+" height="\d+" fill="url\(#[gr][^"]*\)"\/>/g,'').replace(/<ellipse[^>]*filter=[^>]*\/>/,'');src='data:image/svg+xml;utf8,'+encodeURIComponent(t);svg=true}catch(e){}}
 return new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.onerror=()=>res(orig);im.onload=()=>{try{
 const k=Math.min(1,640/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(2,Math.round(im.naturalWidth*k)),hh=Math.max(2,Math.round(im.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=hh;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,hh);const d=x.getImageData(0,0,w,hh),a=d.data,seen=new Uint8Array(w*hh),q=[];
const bl=new Float32Array(w*hh*3);for(let cy=0;cy<hh;cy++)for(let cx=0;cx<w;cx++){let r=0,g=0,bb=0,n=0;for(let dy=-1;dy<=1;dy++){const yy=cy+dy;if(yy<0||yy>=hh)continue;for(let dx=-1;dx<=1;dx++){const xx=cx+dx;if(xx<0||xx>=w)continue;const p=(yy*w+xx)*4;r+=a[p];g+=a[p+1];bb+=a[p+2];n++}}const o=(cy*w+cx)*3;bl[o]=r/n;bl[o+1]=g/n;bl[o+2]=bb/