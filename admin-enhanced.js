const normalizeAdmin=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escapeAdmin=value=>String(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
let visitorEvents=[];

const productNameById=id=>{
 const product=items.find(item=>String(item.id)===String(id));
 return product?.name||'Produto não encontrado';
};
const shortDate=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
const deviceLabel=event=>{
 const info=String(event.user_agent||'').toLowerCase();
 if(/android|iphone|mobile/.test(info))return 'Celular';
 if(/ipad|tablet/.test(info))return 'Tablet';
 if(/windows|macintosh|linux/.test(info))return 'Computador';
 return 'Dispositivo';
};
const todayEvents=()=>visitorEvents.filter(event=>reviewDay(event.created_at)===todayInBrazil());
const weekEvents=()=>{
 const min=Date.now()-7*24*60*60*1000;
 return visitorEvents.filter(event=>new Date(event.created_at).getTime()>=min);
};
const uniqueSessions=events=>new Set(events.map(event=>event.session_id).filter(Boolean)).size;
const WHATSAPP_GROUP_URL='https://chat.whatsapp.com/IfJcfvUb3qGGsMD5A3uDuQ';

function productShareMessage(item){
 const price=money(item.price);
 const link=String(item.affiliate_url||'').trim();
 return `Achadinho até R$20\n\n${item.name}\nPor ${price}\n\nCompre aqui:\n${link}\n\nEntre no grupo para receber mais ofertas:\n${WHATSAPP_GROUP_URL}`;
}

async function copyAdminText(value){
 if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return}
 const area=document.createElement('textarea');
 area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.left='-9999px';
 document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();
}

async function shareProductToWhatsApp(item){
 const text=productShareMessage(item);
 if(navigator.share){
  try{await navigator.share({title:item.name,text});toast('Escolha o WhatsApp e envie no grupo.');return}catch(err){if(err.name==='AbortError')return}
 }
 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');
}

function renderVisits(){
 const today=todayEvents(),week=weekEvents(),views=visitorEvents.filter(event=>event.event_type==='product_view');
 const viewCounts=views.reduce((acc,event)=>{const id=event.product_id||'unknown';acc[id]=(acc[id]||0)+1;return acc},{});
 const topId=Object.keys(viewCounts).sort((a,b)=>viewCounts[b]-viewCounts[a])[0];
 $('#todayVisitCount').textContent=uniqueSessions(today);
 $('#weekVisitCount').textContent=uniqueSessions(week);
 $('#productViewCount').textContent=views.length;
 $('#topViewedProduct').textContent=topId?productNameById(topId):'Nenhum ainda';
 const pageEvents=visitorEvents.filter(event=>event.event_type==='page_view').slice(0,8);
 $('#visitorRows').innerHTML=pageEvents.length?pageEvents.map(event=>`<li><b>${deviceLabel(event)}</b><small>${shortDate(event.created_at)} · sessão ${escapeAdmin(String(event.session_id||'').slice(-6)||'anon')}</small></li>`).join(''):'<li>Nenhuma visita registrada ainda.</li>';
 $('#viewedRows').innerHTML=views.slice(0,8).map(event=>`<li><b>${escapeAdmin(productNameById(event.product_id))}</b><small>${shortDate(event.created_at)} · ${deviceLabel(event)}</small></li>`).join('')||'<li>Nenhum produto aberto ainda.</li>';
}

async function loadVisits(){
 try{
  visitorEvents=await api('/rest/v1/visitor_events?select=*&order=created_at.desc&limit=200');
  $('#visitorNotice').textContent='Mostra visitantes anônimos. Para saber nome da pessoa, ela precisaria fazer login ou preencher um formulário.';
  renderVisits();
 }catch(err){
  visitorEvents=[];
  renderVisits();
  $('#visitorNotice').textContent='Para ativar as visitas, rode o arquivo ATUALIZAR-CONFERENCIA-VISITAS.sql no Supabase.';
 }
}

render=function(){
 const query=normalizeAdmin($('#adminSearch').value),category=$('#adminCategory').value,status=$('#adminStatus').value,review=$('#adminReview').value,sort=$('#adminSort').value;
 let list=items.filter(item=>{
  const text=normalizeAdmin(`${item.name} ${item.category} ${item.subcategory||''} ${item.description||''}`),isActive=item.active&&Number(item.price)<=20,isReviewed=checkedToday(item);
  return text.includes(query)&&(!category||item.category===category)&&(!status||(status==='active'&&isActive)||(status==='hidden'&&!isActive)||(status==='overprice'&&Number(item.price)>20))&&(!review||(review==='today'&&isReviewed)||(review==='pending'&&!isReviewed));
 });
 list.sort((a,b)=>sort==='az'?String(a.name).localeCompare(String(b.name),'pt-BR'):sort==='price-low'?Number(a.price)-Number(b.price):sort==='price-high'?Number(b.price)-Number(a.price):String(b.created_at||b.id).localeCompare(String(a.created_at||a.id)));
 $('#activeCount').textContent=items.filter(x=>x.active&&x.price<=20).length;
 $('#validCount').textContent=items.filter(x=>x.price<=20).length;
 $('#hiddenCount').textContent=items.filter(x=>!x.active||x.price>20).length;
 $('#pendingReviewCount').textContent=items.filter(x=>!checkedToday(x)).length;
 $('#filteredCount').textContent=`${list.length} ${list.length===1?'produto':'produtos'}`;
 const hasFilters=query||category||status||review;
 $('#filterHint').textContent=hasFilters?'Resultado dos filtros escolhidos':'Mostrando todo o catálogo';
 $('#productRows').innerHTML=list.map(x=>{
  const reviewed=checkedToday(x),isActive=x.active&&x.price<=20;
  return `<tr class="${reviewed?'reviewed-today':'needs-review'}"><td><div class="product-cell"><img src="${escapeAdmin(x.image_url)}" alt=""><b>${escapeAdmin(x.name)}</b></div></td><td>${escapeAdmin(x.category)}<br><small>${escapeAdmin(x.subcategory)}</small></td><td><b>${money(x.price)}</b><div class="review-state ${reviewed?'done':'pending'}">${reviewed?'✓ Conferido hoje':escapeAdmin(reviewLabel(x.last_checked_at))}</div></td><td><span class="status ${isActive?'on':'off'}">${isActive?'Ativo':'Oculto'}</span></td><td class="actions"><a class="shop-link" href="${escapeAdmin(x.affiliate_url)}" target="_blank" rel="noopener">Abrir Shopee</a><button class="share-whatsapp" data-share-whatsapp="${escapeAdmin(x.id)}">Compartilhar ZAP</button><button class="copy-share" data-copy-share="${escapeAdmin(x.id)}">Copiar mensagem</button><div class="review-actions"><button class="price-ok" data-checked="${escapeAdmin(x.id)}" ${reviewed?'disabled':''}>${reviewed?'✓ OK':'Preço OK'}</button><button class="price-change" data-change-price="${escapeAdmin(x.id)}">Mudou preço</button></div><button data-edit="${escapeAdmin(x.id)}">Editar</button><button data-delete="${escapeAdmin(x.id)}">Excluir</button></td></tr>`;
 }).join('');
 $('#adminEmpty').hidden=list.length>0;
 renderVisits();
};

$('#copyGroupLink')?.addEventListener('click',async()=>{
 try{await copyAdminText(WHATSAPP_GROUP_URL);toast('Link do grupo copiado.')}catch(err){alert(`Não foi possível copiar: ${err.message}`)}
});

$('#productRows').addEventListener('click',async event=>{
 const share=event.target.closest('[data-share-whatsapp]'),copy=event.target.closest('[data-copy-share]');
 if(!share&&!copy)return;
 event.preventDefault();event.stopPropagation();
 const id=(share||copy).dataset.shareWhatsapp||(share||copy).dataset.copyShare;
 const item=items.find(product=>String(product.id)===String(id));
 if(!item)return;
 try{
  if(share)await shareProductToWhatsApp(item);
  if(copy){await copyAdminText(productShareMessage(item));toast('Mensagem copiada. Agora cole no WhatsApp.')}
 }catch(err){alert(`Não foi possível compartilhar: ${err.message}`)}
},true);

const originalLoad=load;
load=async function(){
 await originalLoad();
 await loadVisits();
};

['adminSearch','adminCategory','adminStatus','adminReview','adminSort'].forEach(id=>document.getElementById(id).addEventListener(id==='adminSearch'?'input':'change',render));
$('#clearAdminFilters').addEventListener('click',()=>{['adminSearch','adminCategory','adminStatus','adminReview'].forEach(id=>document.getElementById(id).value='');$('#adminSort').value='newest';render();$('#adminSearch').focus()});
$('#reloadVisits').addEventListener('click',loadVisits);
