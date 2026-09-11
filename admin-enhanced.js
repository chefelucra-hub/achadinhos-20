const normalizeAdmin=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escapeAdmin=value=>String(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

render=function(){
 const query=normalizeAdmin($('#adminSearch').value),category=$('#adminCategory').value,status=$('#adminStatus').value,review=$('#adminReview').value,sort=$('#adminSort').value;
 let list=items.filter(item=>{
  const text=normalizeAdmin(`${item.name} ${item.category} ${item.subcategory||''} ${item.description||''}`),isActive=item.active&&Number(item.price)<=20,isReviewed=checkedToday(item);
  return text.includes(query)&&(!category||item.category===category)&&(!status||(status==='active'&&isActive)||(status==='hidden'&&!isActive)||(status==='overprice'&&Number(item.price)>20))&&(!review||(review==='today'&&isReviewed)||(review==='pending'&&!isReviewed));
 });
 list.sort((a,b)=>sort==='az'?String(a.name).localeCompare(String(b.name),'pt-BR'):sort==='price-low'?Number(a.price)-Number(b.price):sort==='price-high'?Number(b.price)-Number(a.price):String(b.created_at||b.id).localeCompare(String(a.created_at||a.id)));
 $('#activeCount').textContent=items.filter(x=>x.active&&x.price<=20).length;$('#validCount').textContent=items.filter(x=>x.price<=20).length;$('#hiddenCount').textContent=items.filter(x=>!x.active||x.price>20).length;
 $('#filteredCount').textContent=`${list.length} ${list.length===1?'produto':'produtos'}`;const hasFilters=query||category||status||review;$('#filterHint').textContent=hasFilters?'Resultado dos filtros escolhidos':'Mostrando todo o catálogo';
 $('#productRows').innerHTML=list.map(x=>{const reviewed=checkedToday(x),isActive=x.active&&x.price<=20;return `<tr class="${reviewed?'reviewed-today':'needs-review'}"><td><div class="product-cell"><img src="${escapeAdmin(x.image_url)}" alt=""><b>${escapeAdmin(x.name)}</b></div></td><td>${escapeAdmin(x.category)}<br><small>${escapeAdmin(x.subcategory)}</small></td><td><b>${money(x.price)}</b><div class="review-state ${reviewed?'done':'pending'}">${reviewed?'✓ Conferido hoje':escapeAdmin(reviewLabel(x.last_checked_at))}</div></td><td><span class="status ${isActive?'on':'off'}">${isActive?'Ativo':'Oculto'}</span></td><td class="actions"><a class="shop-link" href="${escapeAdmin(x.affiliate_url)}" target="_blank" rel="noopener">Abrir Shopee</a><button data-checked="${escapeAdmin(x.id)}" ${reviewed?'disabled':''}>${reviewed?'✓ Conferido':'Conferido hoje'}</button><button data-edit="${escapeAdmin(x.id)}">Editar</button><button data-delete="${escapeAdmin(x.id)}">Excluir</button></td></tr>`}).join('');
 $('#adminEmpty').hidden=list.length>0;
};

['adminSearch','adminCategory','adminStatus','adminReview','adminSort'].forEach(id=>document.getElementById(id).addEventListener(id==='adminSearch'?'input':'change',render));
$('#clearAdminFilters').addEventListener('click',()=>{['adminSearch','adminCategory','adminStatus','adminReview'].forEach(id=>document.getElementById(id).value='');$('#adminSort').value='newest';render();$('#adminSearch').focus()});

