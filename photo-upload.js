api=async function(path,options={}){
 const r=await fetch(`${CFG.SUPABASE_URL}${path}`,{...options,headers:{...headers(),...options.headers}});
 const responseText=await r.text();let data=null;
 if(responseText){try{data=JSON.parse(responseText)}catch{data=responseText}}
 if(!r.ok)throw new Error(data?.message||'Não foi possível concluir.');
 return data;
};

const imageFile=$('#imageFile'),imagePreviews=$('#imagePreviews'),videoFile=$('#videoFile'),videoPreview=$('#videoPreview');
let savingProduct=false,existingImages=[],existingVideo='';

function showImages(urls=[]){imagePreviews.innerHTML=urls.map((url,i)=>`<img src="${url}" alt="Foto ${i+1} do produto">`).join('')}
imageFile.addEventListener('change',()=>{
 const files=[...imageFile.files];
 if(files.length>5){alert('Escolha no máximo 5 fotos.');imageFile.value='';showImages(existingImages);return}
 showImages(files.map(file=>URL.createObjectURL(file)));
});
videoFile.addEventListener('change',()=>{
 const file=videoFile.files[0];if(!file)return;
 if(file.size>20*1024*1024){alert('O vídeo deve ter no máximo 20 MB.');videoFile.value='';return}
 videoPreview.src=URL.createObjectURL(file);videoPreview.hidden=false;
});

async function uploadMedia(file,bucket,maxSize){
 if(file.size>maxSize)throw new Error(bucket==='product-images'?'Cada foto deve ter no máximo 5 MB.':'O vídeo deve ter no máximo 20 MB.');
 const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase(),path=`${crypto.randomUUID()}.${ext}`;
 const r=await fetch(`${CFG.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
 if(!r.ok)throw new Error(bucket==='product-images'?'Não foi possível enviar uma das fotos.':'Não foi possível enviar o vídeo.');
 return `${CFG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

const originalOpenForm=openForm;
openForm=function(x={}){
 originalOpenForm(x);$('#description').value=x.description||'';
 existingImages=Array.isArray(x.image_urls)&&x.image_urls.length?x.image_urls:(x.image_url?[x.image_url]:[]);existingVideo=x.video_url||'';
 $('#imageUrls').value=JSON.stringify(existingImages);$('#videoUrl').value=existingVideo;imageFile.value='';videoFile.value='';showImages(existingImages);
 if(existingVideo){videoPreview.src=existingVideo;videoPreview.hidden=false}else{videoPreview.removeAttribute('src');videoPreview.hidden=true}
};

$('.product-form').addEventListener('submit',async e=>{
 e.preventDefault();e.stopImmediatePropagation();if(savingProduct)return;savingProduct=true;
 const productForm=e.currentTarget,saveButton=productForm.querySelector('button[type="submit"]'),originalText=saveButton.textContent;
 saveButton.disabled=true;saveButton.textContent='Salvando produto...';
 const id=$('#productId').value,files=[...imageFile.files],newVideo=videoFile.files[0];
 try{
  let imageUrls=existingImages;
  if(files.length){toast('Enviando fotos...');imageUrls=[];for(const file of files)imageUrls.push(await uploadMedia(file,'product-images',5*1024*1024))}
  if(!imageUrls.length)throw new Error('Escolha pelo menos uma foto do produto.');
  let videoUrl=existingVideo;if(newVideo){toast('Enviando vídeo...');videoUrl=await uploadMedia(newVideo,'product-videos',20*1024*1024)}
  const body={name:$('#name').value,price:Number($('#price').value),category:$('#category').value,subcategory:$('#subcategory').value,description:$('#description').value.trim(),affiliate_url:$('#affiliateUrl').value.trim(),image_url:imageUrls[0],image_urls:imageUrls,video_url:videoUrl||null,active:$('#active').checked&&Number($('#price').value)<=20};
  await api(`/rest/v1/products${id?`?id=eq.${id}`:''}`,{method:id?'PATCH':'POST',body:JSON.stringify(body),headers:{Prefer:'return=minimal'}});
  await load();alert('✅ Produto salvo com sucesso!');$('#productDialog').close();productForm.reset();
  $('#productId').value='';$('#imageUrl').value='';$('#imageUrls').value='';$('#videoUrl').value='';$('#category').value=cats[0];$('#active').checked=true;
  existingImages=[];existingVideo='';imagePreviews.innerHTML='';videoPreview.removeAttribute('src');videoPreview.hidden=true;$('#priceWarning').hidden=true;
  toast('Produto salvo. Você já pode adicionar o próximo.');
 }catch(err){alert(`Não foi possível salvar: ${err.message}`)}finally{savingProduct=false;saveButton.disabled=false;saveButton.textContent=originalText}
},true);

// Controle diário de conferência dos anúncios na Shopee.
const reviewDay=value=>value?new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):'';
const todayInBrazil=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
const checkedToday=item=>reviewDay(item.last_checked_at)===todayInBrazil();
const reviewLabel=value=>value?new Date(value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Ainda não conferido';

render=function(){
 const q=$('#adminSearch').value.toLowerCase(),cat=$('#adminCategory').value;
 const list=items.filter(x=>x.name.toLowerCase().includes(q)&&(!cat||x.category===cat)).sort((a,b)=>Number(checkedToday(a))-Number(checkedToday(b)));
 $('#activeCount').textContent=items.filter(x=>x.active&&x.price<=20).length;
 $('#validCount').textContent=items.filter(x=>x.price<=20).length;
 $('#hiddenCount').textContent=items.filter(x=>!x.active||x.price>20).length;
 $('#productRows').innerHTML=list.map(x=>{
  const reviewed=checkedToday(x);
  return `<tr class="${reviewed?'reviewed-today':'needs-review'}"><td><div class="product-cell"><img src="${x.image_url||''}" alt=""><b>${x.name}</b></div></td><td>${x.category}<br><small>${x.subcategory}</small></td><td><b>${money(x.price)}</b><div class="review-state ${reviewed?'done':'pending'}">${reviewed?'✓ Conferido hoje':reviewLabel(x.last_checked_at)}</div></td><td><span class="status ${x.active&&x.price<=20?'on':'off'}">${x.active&&x.price<=20?'Ativo':'Oculto'}</span></td><td class="actions"><a class="shop-link" href="${x.affiliate_url}" target="_blank" rel="noopener">Abrir Shopee</a><button data-checked="${x.id}" ${reviewed?'disabled':''}>${reviewed?'✓ Conferido':'Conferido hoje'}</button><button data-edit="${x.id}">Editar</button><button data-delete="${x.id}">Excluir</button></td></tr>`;
 }).join('');
 $('#adminEmpty').hidden=list.length>0;
};

$('#productRows').addEventListener('click',async e=>{
 const id=e.target.dataset.checked;if(!id)return;
 e.preventDefault();e.stopPropagation();e.target.disabled=true;e.target.textContent='Salvando...';
 try{
  const checkedAt=new Date().toISOString();
  await api(`/rest/v1/products?id=eq.${id}`,{method:'PATCH',body:JSON.stringify({last_checked_at:checkedAt}),headers:{Prefer:'return=minimal'}});
  const item=items.find(x=>x.id===id);if(item)item.last_checked_at=checkedAt;
  render();toast('✓ Produto conferido hoje');
 }catch(err){e.target.disabled=false;e.target.textContent='Conferido hoje';alert(`Não foi possível marcar: ${err.message}`)}
},true);

// Preenchimento rápido usando o texto copiado pelo botão "Copiar Informação" da Shopee.
const quickImport=document.createElement('section');
quickImport.className='quick-import';
quickImport.innerHTML=`<strong>⚡ Preencher pela Shopee</strong><span>Na Shopee, toque em “Copiar Informação” e cole tudo aqui.</span><textarea id="shopeeInfo" rows="4" placeholder="Cole aqui as informações copiadas da Shopee"></textarea><button id="fillShopee" type="button">Preencher automaticamente</button><small id="importMessage"></small>`;
document.querySelector('.product-form').insertBefore(quickImport,document.querySelector('.product-form').querySelector('label'));

const importStyle=document.createElement('style');
importStyle.textContent=`.quick-import{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #ffd2c6;background:#fff7f3;border-radius:13px}.quick-import strong{color:#bd381b}.quick-import span,.quick-import small{font-size:12px;color:#68727c}.quick-import textarea{width:100%;border:1px solid #e7e9ec;border-radius:10px;padding:11px;font:inherit;resize:vertical}.quick-import button{border:0;border-radius:10px;padding:11px;background:#17212b;color:#fff;font-weight:800}.quick-import small.ok{color:#08763b;font-weight:800}`;
document.head.appendChild(importStyle);

const subcategoryOptions={
 'Moda feminina':['Vestidos','Blusas e camisas','Calças e shorts','Saias','Moda íntima','Moda fitness','Moda praia','Bolsas','Acessórios femininos'],
 'Moda masculina':['Camisetas e camisas','Calças e bermudas','Moda íntima','Moda fitness','Bonés','Carteiras','Acessórios masculinos'],
 'Infantil':['Roupas para meninas','Roupas para meninos','Roupas para bebê','Calçados infantis','Brinquedos','Acessórios infantis'],
 'Casa':['Organização','Limpeza','Banheiro','Quarto','Sala e decoração','Lavanderia','Utilidades domésticas'],
 'Cozinha':['Utensílios de cozinha','Eletroportáteis','Panelas e frigideiras','Potes e organização','Copos e garrafas','Talheres e facas','Formas e confeitaria'],
 'Beleza':['Maquiagem','Cuidados com a pele','Cuidados com o cabelo','Unhas','Perfumes','Higiene pessoal','Acessórios de beleza'],
 'Eletrônicos':['Áudio','Iluminação','Informática','Cabos e adaptadores','Acessórios eletrônicos','Casa inteligente'],
 'Celulares':['Capinhas','Carregadores','Fones de ouvido','Suportes','Películas','Cabos','Acessórios para celular'],
 'Pets':['Cães','Gatos','Higiene pet','Brinquedos para pets','Alimentação pet','Acessórios para pets'],
 'Ferramentas':['Ferramentas manuais','Ferramentas elétricas','Medição','Pintura','Organização de ferramentas'],
 'Automotivo':['Acessórios internos','Limpeza automotiva','Acessórios para moto','Iluminação automotiva','Organização automotiva'],
 'Papelaria':['Materiais escolares','Canetas e lápis','Cadernos','Estojos','Organização de escritório'],
 'Calçados':['Calçados femininos','Calçados masculinos','Calçados infantis','Chinelos','Tênis']
};
const subcategoryList=document.createElement('datalist');subcategoryList.id='subcategorySuggestions';document.body.appendChild(subcategoryList);$('#subcategory').setAttribute('list','subcategorySuggestions');
function updateSubcategorySuggestions(){subcategoryList.innerHTML=(subcategoryOptions[$('#category').value]||[]).map(x=>`<option value="${x}">`).join('')}
$('#category').addEventListener('change',updateSubcategorySuggestions);updateSubcategorySuggestions();

function guessProductType(text){
 const s=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const has=(...words)=>words.some(word=>s.includes(word));
 if(has('feminina','feminino','mulher','dama','vestido','saia','sutia','lingerie','cropped','bolsa feminina')){
  if(has('tenis','sandalia','chinelo','sapato','salto'))return{category:'Calçados',subcategory:'Calçados femininos'};
  if(has('bolsa','carteira'))return{category:'Moda feminina',subcategory:'Bolsas'};
  if(has('sutia','calcinha','lingerie'))return{category:'Moda feminina',subcategory:'Moda íntima'};
  if(has('fitness','academia','legging'))return{category:'Moda feminina',subcategory:'Moda fitness'};
  return{category:'Moda feminina',subcategory:has('vestido')?'Vestidos':'Blusas e camisas'};
 }
 if(has('masculina','masculino','homem','rapaz','cueca','gravata','barba')){
  if(has('tenis','sandalia','chinelo','sapato'))return{category:'Calçados',subcategory:'Calçados masculinos'};
  if(has('cueca'))return{category:'Moda masculina',subcategory:'Moda íntima'};
  if(has('carteira'))return{category:'Moda masculina',subcategory:'Carteiras'};
  return{category:'Moda masculina',subcategory:has('bermuda','calca')?'Calças e bermudas':'Camisetas e camisas'};
 }
 const rules=[
  [['bebe','recem-nascido','menina infantil','menino infantil','crianca'],'Infantil','Roupas para bebê'],
  [['boneca','carrinho infantil','brinquedo','quebra-cabeca'],'Infantil','Brinquedos'],
  [['tenis','sandalia','chinelo','sapato','sapatilha'],'Calçados','Tênis'],
  [['mixer','liquidificador','processador','batedor','cafeteira','chaleira','air fryer','eletrico','eletrica'],'Cozinha','Eletroportáteis'],
  [['panela','frigideira'],'Cozinha','Panelas e frigideiras'],
  [['peneira','coador','faca','talher','espátula','espatula','balanca culinaria','abridor','ralador','escorredor'],'Cozinha','Utensílios de cozinha'],
  [['pote','porta-tempero','organizador de cozinha'],'Cozinha','Potes e organização'],
  [['garrafa','copo','caneca','xícara','xicara'],'Cozinha','Copos e garrafas'],
  [['forma','confeitaria','bolo','bico de confeitar'],'Cozinha','Formas e confeitaria'],
  [['maquiagem','batom','rimel','mascara de cilios','base facial'],'Beleza','Maquiagem'],
  [['shampoo','condicionador','escova de cabelo','pente','touca'],'Beleza','Cuidados com o cabelo'],
  [['perfume','colonia'],'Beleza','Perfumes'],
  [['unha','esmalte','alicate de cuticula'],'Beleza','Unhas'],
  [['capinha','pelicula'],'Celulares','Capinhas'],
  [['carregador','cabo usb','cabo tipo c'],'Celulares','Carregadores'],
  [['fone','earphone','headset'],'Celulares','Fones de ouvido'],
  [['suporte celular','tripé celular','tripe celular'],'Celulares','Suportes'],
  [['lampada','led','luminaria'],'Eletrônicos','Iluminação'],
  [['teclado','mouse','pendrive','webcam'],'Eletrônicos','Informática'],
  [['cachorro','gato','pet','coleira','comedouro','areia sanitaria'],'Pets','Acessórios para pets'],
  [['furadeira','parafusadeira','alicate','chave de fenda','martelo'],'Ferramentas','Ferramentas manuais'],
  [['carro','moto','automotivo','veicular'],'Automotivo','Acessórios internos'],
  [['caderno','caneta','lapis','estojo','marca-texto'],'Papelaria','Materiais escolares'],
  [['toalha','tapete','cortina','almofada','lencol'],'Casa','Quarto'],
  [['organizador','caixa organizadora','cabide'],'Casa','Organização'],
  [['vassoura','rodo','esponja','limpeza'],'Casa','Limpeza']
 ];
 for(const [words,category,subcategory] of rules)if(words.some(word=>s.includes(word)))return{category,subcategory};
 return{category:'Casa',subcategory:'Utilidades domésticas — revisar'};
}

$('#fillShopee').addEventListener('click',()=>{
 const raw=$('#shopeeInfo').value.trim(),message=$('#importMessage');
 if(!raw){message.textContent='Cole primeiro as informações do produto.';message.className='';return}
 const url=(raw.match(/https?:\/\/[^\s]+/i)||[])[0]||'';
 const priceMatch=raw.match(/R\$\s*([0-9.]+(?:,[0-9]{1,2})?)/i);
 const price=priceMatch?Number(priceMatch[1].replace(/\./g,'').replace(',','.')):null;
 const titleMatch=raw.match(/dê\s+uma\s+olhada\s+em\s+(.+?)\s+por\s+R\$/i);
 const clean=raw.replace(/https?:\/\/[^\s]+/gi,' ').replace(/R\$\s*[0-9.,]+/gi,' ');
 const ignored=/comiss|cupom|frete|copiar|shopee|ganhe|desconto|oferta|link/i;
 const candidates=clean.split(/\n|\||•/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>5&&!ignored.test(x));
 const name=(titleMatch?.[1]||candidates.sort((a,b)=>b.length-a.length)[0]||'').replace(/\s+/g,' ').trim().slice(0,150);
 if(name)$('#name').value=name;if(price)$('#price').value=price;if(url)$('#affiliateUrl').value=url;
 const type=guessProductType(`${name} ${raw}`);$('#category').value=type.category;updateSubcategorySuggestions();$('#subcategory').value=type.subcategory;
 if(name)$('#description').value=`${name}. Produto selecionado para facilitar o dia a dia, com bom custo-benefício e preço de até R$20. Confira no anúncio da Shopee as medidas, materiais, opções disponíveis e avaliações de outros compradores antes de finalizar a compra.`;
 $('#priceWarning').hidden=!price||price<=20;
 message.textContent=`✓ Informações preenchidas${!url?' — confira o link':!price?' — confira o preço':''}.`;message.className='ok';
});
