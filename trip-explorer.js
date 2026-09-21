(function(){
  var DAYS={
    d23:{label:'9/23 수',short:'긴자',color:'#e8734a',places:[
      ['도쿄 국제공항',35.5482964,139.7779951,'공항'],['히가시긴자 역',35.6697003,139.7671399,'이동'],['도미 인 프리미엄 긴자',35.6676219,139.7657268,'숙소'],['네무로하나마루 긴자점',35.6722448,139.7624127,'식사'],['쿠냐네노 미세',35.6744744,139.7630037,'쇼핑'],['루미네 유라쿠쵸',35.6735982,139.7628443,'쇼핑'],['도쿄 규쿄도 긴자 본점',35.6710891,139.7646112,'쇼핑'],['지유 긴자점',35.670881,139.7642627,'쇼핑'],['긴자 로프트',35.6741115,139.766261,'쇼핑'],['긴자 이토야',35.6731273,139.7672138,'쇼핑'],['enherb 미쓰코시 긴자',35.6711718,139.7658598,'쇼핑'],['긴자 츠타야 서점',35.6694161,139.7642674,'쇼핑'],['DOLCE TACUBO GINZA',35.6683222,139.7634875,'디저트'],['FamilyMart',35.6673884,139.7656471,'편의점'],['세븐일레븐 긴자7초메히가시',35.6671611,139.765394,'편의점']
    ]},
    d24:{label:'9/24 목',short:'도쿄타워 · 아자부다이',color:'#5fbf8f',places:[
      ['미쓰이 가든 호텔 긴자 고초메',35.6688823,139.7667539,'숙소'],['Ochiairo Steak House Tokyo',35.6612443,139.7406186,'식사'],['도쿄 타워',35.6585805,139.7454329,'관광'],['시바 공원',35.6561695,139.7483555,'산책'],['아자부다이 힐즈',35.6615447,139.7408302,'쇼핑'],['FAMIMA FLAGSHIP STORE',35.6625453,139.7443416,'편의점'],['The Conran Shop Tokyo Store',35.6610359,139.7401614,'쇼핑'],['SABOE TOKYO',35.6620914,139.7415446,'차'],['TEAPOND Azabudai Hills',35.662173,139.7422863,'차'],['HARBS Azabudai Hills',35.6618556,139.7414525,'카페'],['스즈카케 아자부다이힐스',35.6622018,139.7425164,'디저트'],['히비야',35.6748881,139.7595952,'산책'],['츠키시마 몬자 타마토야 히비야',35.6727357,139.7604427,'식사'],['OK Ginza Store',35.6737637,139.7651281,'장보기'],['다이소 마로니에 게이트 긴자',35.6737364,139.7651894,'쇼핑'],['로손',35.6683424,139.7667389,'편의점']
    ]},
    d25:{label:'9/25 금',short:'오모테산도 · 아오야마',color:'#8fb7f5',places:[
      ['오모테산도',35.6652511,139.7120921,'산책'],['MERCER BRUNCH TERRACE HOUSE TOKYO',35.6631946,139.7099114,'브런치'],['GYRE',35.6673861,139.7069111,'쇼핑'],['Spiral Market',35.6635829,139.7117499,'쇼핑'],['call cafe 家と庭',35.6636179,139.7117335,'카페'],['아오야마 플라워마켓 티하우스',35.6622458,139.7134816,'카페'],['미쓰이 가든 호텔 긴자 고초메',35.6688823,139.7667539,'숙소'],['토리긴 솥밥 꼬치구이 본점',35.6712821,139.7636683,'저녁'],['Kyoto Ramen MORRY Ginza',35.6685238,139.7647652,'저녁']
    ]},
    d26:{label:'9/26 토',short:'하타가야 → 하네다',color:'#f2b544',places:[
      ['Paddlers Coffee',35.6746807,139.6787654,'커피'],['Equal',35.6750336,139.6786999,'베이커리'],['御菓子所 胡禾',35.6749306,139.6791317,'화과자'],['하타가야',35.677314,139.6768408,'동네'],['미쓰이 가든 호텔 긴자 고초메',35.6688823,139.7667539,'숙소'],['도쿄 국제공항',35.5482964,139.7779951,'공항']
    ]}
  };

  window.initTripExplorer=function(){
    if(!window.L) return false;
    var mapNode=document.getElementById('trip-map');
    if(!mapNode || mapNode.dataset.ready==='1') return false;
    var list=document.getElementById('trip-list');
    var switcher=document.getElementById('trip-day-switch');
    var caption=document.getElementById('trip-map-caption');
    var explorer=document.querySelector('.trip-explorer');
    if(!list || !switcher || !caption || !explorer) return false;
    mapNode.dataset.ready='1';

    var map=L.map(mapNode,{zoomControl:true,scrollWheelZoom:false,attributionControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    var markerLayer=L.layerGroup().addTo(map), routeLayer=L.layerGroup().addTo(map), markers=[];

    function markerIcon(n,color){
      return L.divIcon({className:'',html:'<div class="trip-marker" style="background:'+color+'"><span>'+n+'</span></div>',iconSize:[28,28],iconAnchor:[14,27],popupAnchor:[0,-27]});
    }
    function focusPlace(index,scroll){
      var m=markers[index],cards=list.querySelectorAll('.trip-card');
      cards.forEach(function(c){c.classList.remove('active')});
      if(cards[index]){
        cards[index].classList.add('active');
        if(scroll) cards[index].scrollIntoView({behavior:'smooth',block:'nearest'});
      }
      if(m){map.panTo(m.getLatLng(),{animate:true});m.openPopup();}
    }
    function renderDay(key){
      var day=DAYS[key];
      markerLayer.clearLayers(); routeLayer.clearLayers(); markers=[]; list.innerHTML='';
      switcher.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.dataset.day===key)});
      explorer.style.setProperty('--trip-color',day.color);
      var bounds=[];
      day.places.forEach(function(p,i){
        var latlng=[p[1],p[2]],num=i+1; bounds.push(latlng);
        var marker=L.marker(latlng,{icon:markerIcon(num,day.color)}).bindPopup('<b>'+num+'. '+p[0]+'</b><br>'+p[3]);
        marker.on('click',function(){focusPlace(i,true)}); marker.addTo(markerLayer); markers.push(marker);
        var card=document.createElement('div');
        card.className='trip-card'; card.style.setProperty('--trip-color',day.color);
        card.innerHTML='<div class="trip-num">'+num+'</div><div class="trip-copy"><b>'+p[0]+'</b><span>'+p[3]+' · KMZ 핀 '+num+'</span></div><a class="trip-go" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query='+p[1]+','+p[2]+'">지도 ↗</a>';
        card.addEventListener('click',function(e){if(e.target.closest('a'))return;focusPlace(i,false)});
        list.appendChild(card);
      });
      L.polyline(bounds,{color:day.color,weight:3,opacity:.72,dashArray:'7 7'}).addTo(routeLayer);
      map.fitBounds(bounds,{padding:[32,32],maxZoom:14});
      caption.innerHTML='<b>'+day.label+' · '+day.short+'</b>'+day.places.length+'개 핀 · 점선은 KMZ 핀 순서를 잇는 개략선';
      setTimeout(function(){map.invalidateSize()},80);
    }
    Object.keys(DAYS).forEach(function(key){
      var d=DAYS[key],b=document.createElement('button');
      b.type='button'; b.dataset.day=key; b.style.setProperty('--trip-color',d.color);
      b.innerHTML='<b>'+d.label+'</b><span>'+d.short+'</span>';
      b.addEventListener('click',function(){renderDay(key)}); switcher.appendChild(b);
    });
    renderDay('d23');
    return true;
  };

  function initPlainPage(){
    if(document.getElementById('trip-map')) window.initTripExplorer();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPlainPage,{once:true});
  else setTimeout(initPlainPage,0);
})();
