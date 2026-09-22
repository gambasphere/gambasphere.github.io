
(function(){
'use strict';
function escapeText(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
window.initTripExplorer=function(){
 var root=document.querySelector('.trip-explorer'),node=document.getElementById('trip-map'),dataNode=document.getElementById('trip-data');
 if(!root||!node||!dataNode||root.dataset.ready==='1')return false;
 var soloRecord=document.getElementById('open-solo-record');
 if(soloRecord)soloRecord.addEventListener('click',function(){var archive=document.querySelector('.travel-archive');archive.open=true;var tab=document.querySelector('nav.tabs [data-t="d25"]');if(tab)tab.click();var section=document.getElementById('d25');if(section)section.scrollIntoView({behavior:'smooth',block:'start'});});
 var data;try{data=JSON.parse(dataNode.textContent)}catch(e){return false}
 root.dataset.ready='1';
 var days=data.days,photos=data.photos,notes=data.notes||{},keys=Object.keys(days),current=keys[0],filter='전체',selected=-1;
 var list=document.getElementById('trip-list'),switcher=document.getElementById('trip-day-switch'),caption=document.getElementById('trip-map-caption');
 var map=null,layer=null,line=null,markers=[],visibleIndices=[],reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var nearby=document.createElement('section');nearby.className='trip-nearby';root.querySelector('.trip-shell').after(nearby);
 function renderNearby(key){nearby.innerHTML='<h3>시간 남으면, 이 근처</h3><p>이전에 저장한 후보 중 현재 동선과 가까운 곳입니다. 방문 확정 일정이 아니며, 영업·대기 상황은 지도에서 확인해 주세요.</p>';
 (data.nearby&&data.nearby[key]||[]).forEach(function(g){var d=document.createElement('details');d.className='nearby-group';d.innerHTML='<summary>'+escapeText(g.title)+'<small>'+(g.items.length?g.items.length+'곳 · 펼치기':'돌아갈 시간 확인')+'</small></summary><div class="nearby-content">'+(g.image?'<img class="nearby-banner" loading="lazy" src="'+escapeText(g.image)+'" alt="'+escapeText(g.caption)+'"><small class="nearby-caption">'+escapeText(g.caption)+' · 지역 참고 사진</small>':'')+'<p class="nearby-intro">'+escapeText(g.note)+'</p><div class="nearby-items">'+g.items.map(function(p){return '<article class="nearby-place"><h4>'+escapeText(p.name)+'</h4><p>'+escapeText(p.note)+'</p><a target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query)+'">위치·영업 확인 ↗</a></article>'}).join('')+'</div></div>';nearby.appendChild(d)})}
 var filters=document.createElement('div');filters.className='trip-filter';filters.setAttribute('aria-label','장소 종류');switcher.after(filters);
 var tools=document.createElement('div');tools.className='trip-map-tools';
 tools.innerHTML='<button type="button">전체 위치 보기</button>';node.parentElement.appendChild(tools);
 var toggle=document.createElement('div');toggle.className='trip-view-toggle';
 toggle.innerHTML='<button type="button" aria-controls="trip-map trip-list" aria-pressed="false">지도 보기 ↗</button>';root.appendChild(toggle);
 var button=toggle.querySelector('button');
 function changeView(view){root.dataset.view=view;button.textContent=view==='map'?'일정 보기 ☷':'지도 보기 ↗';button.setAttribute('aria-pressed',String(view==='map'));if(map)setTimeout(function(){map.invalidateSize()},60)}
 button.addEventListener('click',function(){changeView(root.dataset.view==='map'?'list':'map')});
 function icon(n,on){return L.divIcon({className:'',html:'<div class="trip-marker'+(on?' selected':'')+'"><span>'+n+'</span></div>',iconSize:[28,28],iconAnchor:[14,27],popupAnchor:[0,-27]})}
 function focus(index,scroll){
  selected=index;list.querySelectorAll('.trip-card').forEach(function(c){var active=Number(c.dataset.index)===index;c.classList.toggle('active',active);c.querySelector('.trip-select').setAttribute('aria-pressed',String(active));if(active&&scroll)c.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'})});
  markers.forEach(function(m,i){if(m)m.setIcon(icon(i+1,i===index))});
  var p=days[current].places[index];
  if(map&&markers[index]){map.panTo([p[1],p[2]],{animate:!reduce});markers[index].openPopup()}
  caption.innerHTML='<b>'+escapeText(p[0])+'</b><p>'+escapeText(p[3])+' · '+escapeText(days[current].label)+'</p>';
 }
 function group(p){return /식사|저녁|브런치|디저트|커피|카페|차|베이커리|화과자/.test(p[3])?'먹고 마시기':/쇼핑|장보기/.test(p[3])?'쇼핑':/산책|관광|동네/.test(p[3])?'산책·관광':'이동·숙소'}
 function showPhoto(name,photo){
  var dialog=document.getElementById('travel-photo-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='travel-photo-dialog';dialog.className='photo-dialog';document.body.appendChild(dialog);dialog.addEventListener('click',function(e){if(e.target===dialog)dialog.close()})}
  dialog.innerHTML='<form method="dialog"><strong>'+escapeText(name)+'</strong><button aria-label="사진 닫기">닫기 ×</button></form><img src="'+escapeText(photo.src)+'" alt="'+escapeText(photo.alt||name)+'"><p>'+escapeText(photo.label||'장소 사진')+' · <a href="'+escapeText(photo.source)+'" target="_blank" rel="noreferrer">사진 출처 ↗</a></p>';
  if(dialog.showModal)dialog.showModal();
 }
 function fit(all){
  if(!map)return;var places=days[current].places.filter(function(p,i){return visibleIndices.includes(i)}),city=places.filter(function(p){return p[1]>35.6});if(!all&&city.length>1)places=city;
  if(places.length)map.fitBounds(places.map(function(p){return[p[1],p[2]]}),{padding:[40,40],maxZoom:15,animate:!reduce});
 }
 tools.querySelector('button').addEventListener('click',function(){fit(true)});
 function renderMap(){
  if(!map)return;layer.clearLayers();line.clearLayers();markers=[];var bounds=[];
  days[current].places.forEach(function(p,i){if(!visibleIndices.includes(i))return;var marker=L.marker([p[1],p[2]],{icon:icon(i+1,i===selected)}).bindPopup('<strong>'+escapeText(p[0])+'</strong><br>'+escapeText(p[3]));
   marker.on('click',function(){focus(i,true)});marker.addTo(layer);markers[i]=marker;bounds.push([p[1],p[2]])});
  if(filter==='전체')L.polyline(bounds,{color:'#59775f',weight:2,opacity:.6,dashArray:'5 8'}).addTo(line);
  setTimeout(function(){map.invalidateSize();fit(false)},70);
 }
 function renderDay(key){
  current=key;selected=-1;list.innerHTML='';visibleIndices=[];renderNearby(key);
  switcher.querySelectorAll('button').forEach(function(b){var active=b.dataset.day===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  var day=days[key];root.style.setProperty('--trip-color',day.color);
  day.places.forEach(function(p,i){
   if(filter!=='전체'&&group(p)!==filter)return;visibleIndices.push(i);
   var photo=photos[p[0]],note=notes[p[0]]||'',number=String(i+1).padStart(2,'0'),card=document.createElement('article');card.className='trip-card';card.dataset.index=i;
   var media=photo?'<button type="button" class="trip-photo" aria-label="'+escapeText(p[0])+' 사진 확대"><img loading="lazy" width="220" height="220" src="'+escapeText(photo.src)+'" alt="'+escapeText(photo.alt||p[0])+'"><small>'+escapeText(photo.label||'사진 보기')+'</small></button>':'<div class="trip-photo trip-no-photo" aria-label="등록된 장소 사진 없음"><span>'+number+'</span><em>'+escapeText(p[3])+'</em></div>';
   card.innerHTML='<div class="trip-card-main">'+media+'<button class="trip-select" type="button" aria-pressed="false"><div class="trip-kicker">'+number+' / '+escapeText(p[3])+'</div><h3>'+escapeText(p[0])+'</h3><p>'+escapeText(note||'지도에서 위치를 확인해 보세요.')+'</p></button></div><div class="trip-card-actions"><button class="trip-locate" type="button">위치 보기 ↗</button><a class="trip-go" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query='+p[1]+','+p[2]+'">Google 지도 열기 ↗</a></div>';
   card.querySelector('.trip-select').addEventListener('click',function(){focus(i,false)});
   card.querySelector('.trip-locate').addEventListener('click',function(){changeView('map');focus(i,false);if(window.innerWidth<=760)node.parentElement.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})});
   if(photo){card.querySelector('.trip-photo').addEventListener('click',function(){showPhoto(p[0],photo)});card.querySelector('img').addEventListener('error',function(){var box=this.parentElement;this.remove();box.classList.add('trip-no-photo');box.innerHTML='<span>'+number+'</span><em>사진 연결 확인 중</em>';box.disabled=true},{once:true})}
   list.appendChild(card);
  });
  if(!visibleIndices.length)list.innerHTML='<p class="trip-empty">이 날짜에 저장한 해당 분류의 장소가 없습니다.</p>';
  caption.innerHTML='<b>'+escapeText(day.label)+' · '+escapeText(day.short)+'</b><p>'+visibleIndices.length+'곳 · 점선은 저장 순서를 이은 참고선입니다.<br>실제 이동 경로는 Google 지도에서 확인하세요.</p>';
  renderMap();list.scrollTop=0;
 }
 ['전체','먹고 마시기','쇼핑','산책·관광','이동·숙소'].forEach(function(name){var b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(name===filter));b.addEventListener('click',function(){filter=name;filters.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});renderDay(current)});filters.appendChild(b)});
 keys.forEach(function(key){var d=days[key],b=document.createElement('button');b.type='button';b.dataset.day=key;b.innerHTML='<b>'+escapeText(d.label)+'</b><span>'+escapeText(d.short)+'</span>';b.addEventListener('click',function(){renderDay(key)});switcher.appendChild(b)});
 document.querySelectorAll('[data-trip-day]').forEach(function(b){b.addEventListener('click',function(){filter='전체';filters.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x.textContent===filter))});renderDay(b.dataset.tripDay);changeView('list');root.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})})});
 function tryMap(){if(map||!window.L)return;map=L.map(node,{scrollWheelZoom:false,attributionControl:true});var tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'origin',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
var warning=document.createElement('div');warning.className='trip-map-failure';warning.hidden=true;warning.innerHTML='<b>배경 지도를 불러오지 못했어요.</b><p>아래 링크에서 저장한 전체 지도를 확인해 주세요.</p><a href="'+escapeText(data.mapUrl)+'" target="_blank" rel="noreferrer">Google 지도 열기 ↗</a>';node.parentElement.appendChild(warning);var tileErrors=0;if(tiles.on)tiles.on('tileerror',function(){if(++tileErrors>=2)warning.hidden=false});
layer=L.layerGroup().addTo(map);line=L.layerGroup().addTo(map);renderMap()}
 renderDay(keys[0]);tryMap();
 if(!map){node.innerHTML='<p class="trip-empty">지도를 불러오는 중입니다. 연결이 어려우면 장소 카드의 Google 지도를 이용하세요.</p>';var tries=0,timer=setInterval(function(){if(window.L){node.innerHTML='';tryMap();clearInterval(timer)}else if(++tries>=20)clearInterval(timer)},500)}
 return true;
};
function init(){window.initTripExplorer()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();