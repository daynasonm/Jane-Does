'use strict';
const $ = s => document.querySelector(s);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let objects = [], imageFrames = {}, query = '', selectedYear = 'All', sector = 'Public', sort = 0, saved = [], lastFocus, toastTimer;
function objectImage(o, lazy=false) {
 const img=`<img src="${esc(o.image)}" alt="${esc(o.name)}"${lazy?' loading="lazy"':''} decoding="async">`;
 const frame=imageFrames[o.image];
 if(!frame)return img;
 const [x,y,w,h]=frame.bounds;
 const ratio=frame.size[0]*w/(frame.size[1]*h);
 const fill=Math.min(106,Math.min(92,74*Math.sqrt(Math.max(ratio,1/ratio)))*(o.imageScale||1));
 return `<span class="object-art" style="--r:${ratio};--fill:${fill};--hover:${fill>98?1:1.035};--iw:${100/w}%;--ih:${100/h}%;--ix:${-100*x/w}%;--iy:${-100*y/h}%">${img}</span>`;
}
function persist(){try{localStorage.setItem('jane-doe-object-bag',JSON.stringify(saved));}catch{} updateBag();}
function updateBag(){ $('#bag-count').textContent=saved.length; $('#bag').setAttribute('aria-label',`Open bookmarks, ${saved.length} objects`); const add=$('#add-object'); if(add)add.innerHTML=saved.includes(add.dataset.id)?'Remove bookmark −':'Bookmark +'; }
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
function toggleSaved(id){saved.includes(id)?saved=saved.filter(x=>x!==id):saved.push(id);persist();if(location.hash==='#checkout')renderCheckout();}
function render(){
 const years=['All', ...[...new Set(objects.filter(o=>o.sector===sector).map(o=>o.year))].sort((a,b)=>b-a).map(String)];
 if(!years.includes(selectedYear))selectedYear='All';
 let list=objects.filter(o=>o.sector===sector&&(selectedYear==='All'||String(o.year)===selectedYear)&&`${o.id} ${o.name} ${o.case} ${o.story} ${o.category} ${o.year}`.toLowerCase().includes(query.toLowerCase()));
 if(sort===1)list.sort((a,b)=>a.name.localeCompare(b.name));
 if(sort===2)list.sort((a,b)=>b.year-a.year);
 $('#grid').innerHTML=list.map(o=>`<a class="product" href="#object/${o.id}" aria-label="${esc(o.name)}, ${o.id}. Read the case story"><div class="object-stage">${objectImage(o,true)}</div><h2 class="product-caption"><span class="name">${esc(o.name)}</span><span class="code">${o.id} / ${o.year}</span></h2></a>`).join('');
 $('#empty').hidden=!!list.length; $('#total').textContent=list.length;
 $('#collection-label').innerHTML=`${esc(selectedYear==='All'?sector+' objects':sector+' objects · '+selectedYear)} <span class="meta-slash">/</span> <span id="total">${list.length}</span>`;
 $('#sort').innerHTML=['Sort <span aria-hidden="true">↕</span>','Name A–Z ↕','Newest ↕'][sort];
 $('#filters').innerHTML=years.map(year=>`<button class="pill" data-year="${year}" aria-pressed="${year===selectedYear}">${year}</button>`).join('');
 $('#all').innerHTML=`${selectedYear==='All'?'All':selectedYear} <span class="tiny-plus">${$('#filters').hidden?'+':'−'}</span>`;
}
function detailArtwork(o){
 const stage=`<div class="detail-image">${objectImage(o)}</div>`;
 if(!o.alternateImages?.length)return stage;
 return `<div class="detail-media">${stage}<div class="image-versions" role="group" aria-label="Radio image versions"><button type="button" data-image-index="0" aria-pressed="true">New radio</button>${o.alternateImages.map((v,i)=>`<button type="button" data-image-index="${i+1}" aria-pressed="false">${esc(v.label)}</button>`).join('')}</div></div>`;
}
function detailMarkup(o){
 const reference=safeSource(o.imageSource);
 return `<div class="detail-top"><a href="#">← ${esc(o.sector)} objects</a></div><div class="detail-layout">${detailArtwork(o)}<article class="detail-info"><h1>${esc(o.name)}</h1><p class="detail-code">${o.id} &nbsp;/&nbsp; ${o.year}</p><h2 class="detail-case">${esc(o.case)}</h2><p class="detail-story">${esc(o.story)}</p><button class="add-button" id="add-object" data-id="${o.id}">${saved.includes(o.id)?'Remove bookmark':'Bookmark'} <span aria-hidden="true">${saved.includes(o.id)?'−':'+'}</span></button><details open><summary>The object</summary><p>${esc(o.connection)}</p></details><details><summary>Case reference</summary><p>${esc(o.category)}<br>${esc(o.recordNote)}</p><p><a class="source-link" href="${esc(o.source)}" target="_blank" rel="noopener noreferrer">Read the case source ↗</a></p><p>From existing project research. A selected record, not a complete case history.</p></details><details><summary>Image & credits</summary><p>Object reference: ${reference?`<a class="source-link" href="${esc(reference)}" target="_blank" rel="noopener noreferrer">${esc(o.imageCredit)} ↗</a>`:'Source reference pending.'}</p><p>${esc(o.imageNote)} ${esc(o.rights)}.</p>${o.edited?'<p>Background isolated with AI for this presentation.</p>':''}${(o.alternateImages||[]).map(v=>`<p><a class="source-link" href="${esc(v.imageSource)}" target="_blank" rel="noopener noreferrer">${esc(v.label)} ↗</a><br>${esc(v.imageNote)}</p>`).join('')}</details></article></div>`;
}
function updateSectorTabs(){
 for(const b of document.querySelectorAll('[data-sector]'))b.setAttribute('aria-pressed',String(b.dataset.sector===sector));
 $('#grid').setAttribute('aria-label',sector+' case objects');
}
function selectedCases(){return saved.map(id=>objects.find(o=>o.id===id)).filter(Boolean);}
function safeSource(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}}
function caseSource(o,label='Read the case source ↗'){
 const url=safeSource(o.source);
 return url?`<a class="source-link small" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'<span class="small muted">Source unavailable</span>';
}
function renderCheckout(){
 const cases=selectedCases();
 $('#checkout').innerHTML=`<div class="checkout-top"><a class="source-link" href="#">← Back to objects</a><button class="text-button" id="edit-bookmarks">Edit bookmarks</button></div><div class="checkout-layout"><section aria-labelledby="checkout-title"><h1 id="checkout-title" tabindex="-1">Your selected cases</h1><p class="muted checkout-intro">${cases.length?`${cases.length} case${cases.length===1?'':'s'} selected. Download their summaries to read or print.`:'No bookmarked cases yet. Bookmark an object to select its case.'}</p>${cases.length?`<ul class="checkout-cases">${cases.map(o=>`<li><a class="checkout-image" href="#object/${esc(o.id)}">${objectImage(o)}</a><div><h2><a href="#object/${esc(o.id)}">${esc(o.name)}</a></h2><p class="small muted">${esc(o.id)} / ${esc(o.year)} · ${esc(o.category)}</p><h3>${esc(o.case)}</h3><p>${esc(o.story)}</p>${caseSource(o)}</div></li>`).join('')}</ul>`:'<a class="source-link" href="#">Explore the collection ↗</a>'}</section>${cases.length?`<section class="checkout-summary" aria-labelledby="checkout-download-title"><h2 id="checkout-download-title">Download your case summaries</h2><p class="small muted">${cases.length} selected case${cases.length===1?'':'s'}, including the existing stories and source links, in one printable HTML file.</p><button class="add-button" id="download-summaries" type="button">Download case summaries</button><p class="small muted">Open the downloaded file in a browser to read it or use Print to save a PDF.</p><p id="checkout-status" class="small" role="status" aria-live="polite"></p></section>`:''}</div>`;
}
function caseSummaryHTML(cases){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jane Doe — Selected case summaries</title><style>body{font-family:Helvetica,sans-serif;color:#171717;max-width:800px;margin:48px auto;padding:0 24px;font-size:14px;line-height:1.65}h1{font-size:28px;font-weight:400;line-height:1.2}h2{font-size:19px;font-weight:400;line-height:1.4}article{border-top:1px solid #ddd;margin-top:32px;padding-top:20px;break-inside:avoid}.meta,.note{color:#666;font-size:12px}a{color:inherit;overflow-wrap:anywhere}.object-note{font-size:12px}@page{margin:20mm}@media print{body{max-width:none;margin:0;padding:0}a{color:#171717}}</style></head><body><h1>Jane Doe — Selected case summaries</h1><p>${cases.length} selected case${cases.length===1?'':'s'}.</p><p class="note">Objects are symbolic representations, not case evidence. These stories summarize selected project research; allegations are not findings.</p>${cases.map(o=>`<article><h2>${esc(o.case)}</h2><p class="meta">${esc(o.id)} / ${esc(o.year)} · ${esc(o.sector)}<br>${esc(o.category)}</p><p>${esc(o.story)}</p><p><strong>Case reference</strong><br>${esc(o.recordNote||'')}</p><p><strong>Source</strong><br>${caseSource(o,safeSource(o.source)||'Source unavailable')}</p><p class="object-note"><strong>Symbolic object: ${esc(o.name)}</strong><br>${esc(o.connection||'')}</p></article>`).join('')}</body></html>`;
}
function downloadSummaries(){
 const cases=selectedCases();if(!cases.length){renderCheckout();return;}
 const status=$('#checkout-status');
 try{
  const url=URL.createObjectURL(new Blob([caseSummaryHTML(cases)],{type:'text/html;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='jane-doe-case-summaries.html';link.hidden=true;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Download ready. Open the HTML file in a browser to read or print.';
 }catch{status.textContent='The download could not be created. Please try again.';}
}
function route(){
 const id=location.hash.startsWith('#object/')?location.hash.slice(8):null;
 const o=objects.find(x=>x.id===id);
 const wasDetail=!$('#detail').hidden;
 const isCheckout=location.hash==='#checkout';
 if(id&&!o){history.replaceState(null,'',location.pathname);toast('Object not found. Showing the collection.');}
 $('#detail').hidden=!o; $('#checkout').hidden=!isCheckout; $('#grid').hidden=!!o||isCheckout; $('.collection-meta').hidden=!!o||isCheckout;
 if(isCheckout){
  document.title='Your selected cases — Jane Doe(s)';renderCheckout();
  $('#search-panel').hidden=true;$('#filters').hidden=true;$('#search-toggle').setAttribute('aria-expanded','false');$('#all').setAttribute('aria-expanded','false');$('#empty').hidden=true;
  window.scrollTo(0,0);$('#checkout-title').focus({preventScroll:true});return;
 }
 if(o){
  sector=o.sector;updateSectorTabs();
  $('#detail').innerHTML=detailMarkup(o);document.title=`${o.name} — Jane Doe(s)`;
  $('#search-panel').hidden=true;$('#filters').hidden=true;$('#search-toggle').setAttribute('aria-expanded','false');$('#all').setAttribute('aria-expanded','false');$('#empty').hidden=true;
 }else{document.title='Jane Doe(s)';render();}
 window.scrollTo(0,0);
 if(wasDetail&&!o){const card=document.querySelector(`[href="#object/${id||lastFocus}"]`);card?.focus({preventScroll:true});}
}
function openDialog(id){lastFocus=document.activeElement;const d=$('#'+id);if(!d.open)d.showModal();}
function showBag(){
 $('#bag-title-count').textContent=`(${saved.length})`;
 $('#bag-items').innerHTML=saved.length?saved.map(id=>{const o=objects.find(x=>x.id===id);return `<div class="bag-item"><a class="bag-image" href="#object/${o.id}" data-bag-link>${objectImage(o)}</a><div><a href="#object/${o.id}" data-bag-link><h2>${esc(o.name)}</h2></a><p>${o.id} / ${o.year}</p></div><button class="text-button" data-remove="${o.id}" aria-label="Remove ${esc(o.name)} bookmark">Remove</button></div>`;}).join(''):'<p class="muted">No bookmarks yet. Explore the objects and bookmark their stories.</p>';
 $('#bag-checkout').hidden=!saved.length;
 openDialog('bag-dialog');
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-image-index]');if(!button)return;
 const o=objects.find(x=>x.id===location.hash.slice(8));if(!o)return;
 const index=Number(button.dataset.imageIndex), variant=index===0?o:o.alternateImages?.[index-1];if(!variant)return;
 $('#detail .detail-image').innerHTML=objectImage({...o,...variant});
 for(const b of document.querySelectorAll('[data-image-index]'))b.setAttribute('aria-pressed',String(b===button));
});
for(const b of document.querySelectorAll('[data-sector]'))b.addEventListener('click',()=>{
 sector=b.dataset.sector;selectedYear='All';query='';$('#search').value='';updateSectorTabs();
 if(location.hash)location.hash='';else{route();render();}
});
$('#all').addEventListener('click',()=>{if(!$('#detail').hidden||!$('#checkout').hidden)location.hash='';$('#filters').hidden=!$('#filters').hidden;$('#all').setAttribute('aria-expanded',String(!$('#filters').hidden));render();});
$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-year]');if(b){selectedYear=b.dataset.year;render();}});
$('#search-toggle').addEventListener('click',()=>{if(!$('#detail').hidden||!$('#checkout').hidden)location.hash='';$('#search-panel').hidden=!$('#search-panel').hidden;$('#search-toggle').setAttribute('aria-expanded',String(!$('#search-panel').hidden));if(!$('#search-panel').hidden)$('#search').focus();});
$('#search-panel').addEventListener('submit',e=>e.preventDefault());
$('#search').addEventListener('input',e=>{query=e.target.value;render();});
$('#clear-search').addEventListener('click',()=>{query='';$('#search').value='';render();$('#search').focus();});
$('#close-search').addEventListener('click',()=>{$('#search-panel').hidden=true;$('#search-toggle').setAttribute('aria-expanded','false');$('#search-toggle').focus();});
$('#sort').addEventListener('click',()=>{sort=(sort+1)%3;render();});
$('#density').addEventListener('input',e=>{document.documentElement.style.setProperty('--cols',e.target.value);$('#density-value').value=e.target.value;});
$('#footer-about').addEventListener('click',()=>openDialog('info-dialog'));
$('#bag').addEventListener('click',showBag);
document.addEventListener('click',e=>{
 if(e.target.closest('#edit-bookmarks'))showBag();
 if(e.target.closest('#download-summaries'))downloadSummaries();
 const close=e.target.closest('[data-close]');if(close)$('#'+close.dataset.close).close();
 const add=e.target.closest('#add-object');if(add){toggleSaved(add.dataset.id);const has=saved.includes(add.dataset.id);add.innerHTML=has?'Remove bookmark −':'Bookmark +';toast(has?'Bookmarked':'Bookmark removed');}
 const remove=e.target.closest('[data-remove]');if(remove){toggleSaved(remove.dataset.remove);showBag();}
 if(e.target.closest('[data-bag-link]'))$('#bag-dialog').close();
});
for(const d of document.querySelectorAll('dialog')){d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{if(lastFocus instanceof HTMLElement)lastFocus.focus();});}
window.addEventListener('hashchange',route);
Promise.all(['objects.json','image-frames.json'].map(url=>fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Collection unavailable');return r.json();}))).then(([data,frames])=>{
 imageFrames=frames;objects=data;const lead=['JD-022','JD-027','JD-028','JD-099'];objects.sort((a,b)=>{const ai=lead.indexOf(a.id),bi=lead.indexOf(b.id);return (ai<0?99:ai)-(bi<0?99:bi);});
 try{const stored=JSON.parse(localStorage.getItem('jane-doe-object-bag')||'[]');if(Array.isArray(stored))saved=[...new Set(stored)].filter(id=>objects.some(o=>o.id===id));}catch{}
 updateBag();route();
}).catch(()=>{$('#empty').hidden=false;$('#empty').textContent='The collection could not load. Please refresh to try again.';});
