const catalog={
 'Moda feminina':{icon:'👗',subs:['Blusas','Vestidos','Lingerie','Acessórios']},'Moda masculina':{icon:'👕',subs:['Camisetas','Cuecas','Bonés','Acessórios']},
 'Infantil':{icon:'🧸',subs:['Roupas','Brinquedos','Material escolar']},'Casa':{icon:'🏠',subs:['Organização','Limpeza','Decoração','Banheiro']},
 'Cozinha':{icon:'🍳',subs:['Utensílios','Organizadores','Acessórios']},'Beleza':{icon:'💄',subs:['Maquiagem','Cabelo','Unhas','Cuidados']},
 'Eletrônicos':{icon:'🎧',subs:['Cabos','Fones','Suportes','Iluminação']},'Celulares':{icon:'📱',subs:['Capinhas','Películas','Cabos','Suportes']},
 'Pets':{icon:'🐾',subs:['Cães','Gatos','Higiene','Brinquedos']},'Ferramentas':{icon:'🔧',subs:['Manuais','Acessórios','Organização']},
 'Automotivo':{icon:'🚗',subs:['Limpeza','Acessórios','Organização']},'Papelaria':{icon:'✏️',subs:['Canetas','Cadernos','Organização']},'Calçados':{icon:'👟',subs:['Feminino','Masculino','Infantil']}
};
const seed=[];let products=seed,active='Todos',activeSub='Todos';
const $=s=>document.querySelector(s),money=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function render(){
 const q=$('#search').value.trim().toLowerCase();
 let list=products.filter(p=>p.price<=20&&(active==='Todos'||p.category===active)&&(activeSub==='Todos'||p.subcategory===activeSub)&&`${p.name} ${p.category} ${p.subcategory||''} ${p.description||''}`.toLowerCase().includes(q));
 const sort=$('#sort').value;list.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='new'?String(b.id).localeCompare(String(a.id)):(b.popular||0)-(a.popular||0));
 $('#count').textContent=`${list.length} produtos`;
 $('#products').innerHTML=list.map(p=>`<article class="card"><div class="photo">${p.image?`<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`:'<span class="emoji">🛒️</span>'}<span class="badge">ATÉ R$20</span></div><div class="card-body"><span class="category">${escapeHtml(p.category)} · ${escapeHtml(p.subcategory||'Geral')}</span><div class="rating">★★★★★ <span>selecionado</span></div><h3>${escapeHtml(p.name)}</h3><div class="price-row"><div class="price">${money(p.price)}</div><span class="old-price">${money(Math.min(29.9,p.price*1.35))}</span></div><button class="buy" data-detail="${escapeHtml(p.id)}">Ver produto →</button></div></article>`).join('');
 $('#empty').hidden=list.length!==0;
}
function categories(){const cats=['Todos',...Object.keys(catalog)];$('#categories').innerHTML=cats.map(c=>`<button class="${c===active?'active':''}" data-cat="${c}"><i>${c==='Todos'?'🛒️':catalog[c].icon}</i>${c}</button>`).join('');const subs=active==='Todos'?[]:catalog[active].subs;$('#subcategories').innerHTML=subs.length?['Todos',...subs].map(s=>`<button class="${s===activeSub?'active':''}" data-sub="${s}">${s}</button>`).join(''):'';$('#sectionTitle').textContent=active==='Todos'?'Os queridinhos':active;$('#sectionLabel').textContent=activeSub==='Todos'?'OFERTAS DE HOJE':activeSub.toUpperCase()}
function openDetail(product){
 const images=product.images?.length?product.images:[product.image].filter(Boolean),main=$('#detailImage'),thumbs=$('#detailThumbs');
 main.src=images[0]||'';main.alt=product.name;$('#detailName').textContent=product.name;$('#detailCategory').textContent=`${product.category} · ${product.subcategory||'Geral'}`;$('#detailPrice').textContent=money(product.price);
 $('#detailDescription').textContent=product.description||'Confira as fotos e todos os detalhes desta oferta diretamente na Shopee.';$('#detailBuy').href=product.link;
 thumbs.innerHTML=images.map((url,i)=>`<button class="${i===0?'active':''}" data-image="${escapeHtml(url)}"><img src="${escapeHtml(url)}" alt="Foto ${i+1}"></button>`).join('');
 const video=$('#detailVideo');if(product.video){video.src=product.video;video.hidden=false}else{video.removeAttribute('src');video.hidden=true}
 $('#detailDialog').showModal();
}
$('#products').addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(!b)return;const product=products.find(p=>String(p.id)===b.dataset.detail);if(product)openDetail(product)});
$('#detailThumbs').addEventListener('click',e=>{const b=e.target.closest('[data-image]');if(!b)return;$('#detailImage').src=b.dataset.image;$('#detailThumbs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b))});
$('#closeDetail').onclick=()=>$('#detailDialog').close();$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()});
$('#search').addEventListener('input',()=>{$('#searchTop').value=$('#search').value;render()});$('#searchTop').addEventListener('input',()=>{$('#search').value=$('#searchTop').value;render()});$('#sort').addEventListener('change',render);
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;active=b.dataset.cat;activeSub='Todos';categories();render()});$('#subcategories').addEventListener('click',e=>{if(!e.target.dataset.sub)return;activeSub=e.target.dataset.sub;categories();render()});$('#showAll').addEventListener('click',()=>{active='Todos';activeSub='Todos';categories();render()});
document.querySelector('[data-home]').addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));document.querySelector('[data-mobile-search]').addEventListener('click',()=>{$('#search').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('#search').focus(),500)});document.querySelector('[data-mobile-cats]').addEventListener('click',()=>$('.departments').scrollIntoView({behavior:'smooth'}));
async function loadPublicProducts(){const c=window.A20_CONFIG||{};if(!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)return;try{const r=await fetch(`${c.SUPABASE_URL}/rest/v1/products?select=*&active=eq.true&price=lte.20&order=created_at.desc`,{headers:{apikey:c.SUPABASE_ANON_KEY}});if(!r.ok)throw new Error();const data=await r.json();products=data.map(x=>({id:x.id,name:x.name,price:Number(x.price),category:x.category,subcategory:x.subcategory,description:x.description||'',image:x.image_url,images:Array.isArray(x.image_urls)?x.image_urls:[],video:x.video_url||'',link:x.affiliate_url,popular:0}));categories();render()}catch{$('#empty').hidden=false;$('#empty').innerHTML='<b>Não foi possível carregar os produtos</b><span>Atualize a página em alguns instantes.</span>'}}
categories();render();loadPublicProducts();
