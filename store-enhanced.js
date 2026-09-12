const getStoreViews=()=>{try{return JSON.parse(localStorage.getItem('a20-product-views')||'{}')}catch{return{}}};
let selectedQuickFilter='all';

function visitorSessionId(){
 let id=localStorage.getItem('a20-visitor-session');
 if(!id){id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem('a20-visitor-session',id)}
 return id;
}

function trackVisit(eventType,productId=''){
 const c=window.A20_CONFIG||{};
 if(!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)return;
 const body={event_type:eventType,product_id:productId||null,session_id:visitorSessionId(),path:location.pathname||'/',referrer:document.referrer||'',user_agent:navigator.userAgent||''};
 fetch(`${c.SUPABASE_URL}/rest/v1/visitor_events`,{method:'POST',headers:{apikey:c.SUPABASE_ANON_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body),keepalive:true}).catch(()=>{});
}

function refreshViewBadges(){
 const views=getStoreViews();
 document.querySelectorAll('[data-detail]').forEach(button=>{
  const card=button.closest('.card'),id=button.dataset.detail;
  if(!card)return;
  card.dataset.productId=id;
  let badge=card.querySelector('.card-viewed');
  if(views[id]){
   if(!badge){badge=document.createElement('span');badge.className='card-viewed';card.querySelector('.photo').appendChild(badge)}
   badge.textContent=`👁 ${views[id]} ${views[id]===1?'visualização':'visualizações'}`;
  }else badge?.remove();
 });
}

function applyQuickFilter(){
 refreshViewBadges();
 const cards=[...document.querySelectorAll('#products .card')],views=getStoreViews();
 cards.forEach(card=>card.hidden=false);
 if(selectedQuickFilter==='under10')cards.forEach(card=>{
  const value=Number((card.querySelector('.price')?.textContent||'').replace(/[^0-9,]/g,'').replace(',','.'));
  card.hidden=value>10;
 });
 if(selectedQuickFilter==='popular')cards.sort((a,b)=>(views[b.dataset.productId]||0)-(views[a.dataset.productId]||0)).forEach(card=>card.parentElement.appendChild(card));
 const visible=cards.filter(card=>!card.hidden).length;
 document.getElementById('count').textContent=`${visible} produtos`;
}

const baseStoreRender=window.render;
window.render=function(){baseStoreRender();applyQuickFilter()};
const observer=new MutationObserver(refreshViewBadges);
observer.observe(document.getElementById('products'),{childList:true});
refreshViewBadges();
trackVisit('page_view');

document.getElementById('products').addEventListener('click',event=>{
 const button=event.target.closest('[data-detail]');
 if(!button)return;
 const views=getStoreViews(),id=button.dataset.detail;
 views[id]=(views[id]||0)+1;
 localStorage.setItem('a20-product-views',JSON.stringify(views));
 trackVisit('product_view',id);
 setTimeout(refreshViewBadges);
});

document.querySelector('.quick-filters').addEventListener('click',event=>{
 const button=event.target.closest('[data-quick]');
 if(!button)return;
 selectedQuickFilter=button.dataset.quick;
 document.querySelectorAll('[data-quick]').forEach(item=>item.classList.toggle('active',item===button));
 if(selectedQuickFilter==='new')document.getElementById('sort').value='new';
 window.render();
});
