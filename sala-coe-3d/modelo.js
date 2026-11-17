/* Sala conceitual da Cooperativa Holambra. Geometria local; nenhuma fonte de dados ao vivo. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const areas = [
    {name:'Coordenação',icon:'ico-telescope.svg',x:-3.0,z:-5,description:'Mesa do coordenador do COE, no centro da última fileira, com visão de todo o videowall e dos postos.',items:['Mesa de coordenação com dois postos','Monitores de apoio, telefone e rádio','Vista da sala executiva pelo vidro']},
    {name:'Qualidade',icon:'ico-armazenamento.svg',x:-7.6,z:-9,description:'Posto para acompanhar umidade, classificação, termometria e qualidade do grão ao longo da cadeia.',items:['Dois postos com monitores duplos','Comunicação com a equipe da unidade']},
    {name:'Manutenção',icon:'ico-telescope.svg',x:-7.6,z:-5,description:'Posto para acompanhar o estado dos painéis, alarmes técnicos e a disponibilidade dos equipamentos.',items:['Dois postos com monitores duplos','SCADA e alarmes das unidades']},
    {name:'PCP e administrativo',icon:'ico-creditos.svg',x:-5.3,z:-9,description:'Posto para acompanhar filas, recebimento, expedição e o plano de produção.',items:['Dois postos com monitores duplos','Painéis de acompanhamento']},
    {name:'Melhoria contínua',icon:'ico-creditos.svg',x:-5.3,z:-5,description:'Posto para analisar desvios recorrentes, conduzir ações corretivas e cuidar da qualidade dos dados.',items:['Dois postos com monitores duplos','Histórico e análise de desvios']},
    {livre:true,name:'Posição de operação',icon:'ico-telescope.svg',x:-7.6,z:-1,description:'Posição para a equipe do COE.',items:['Dois postos com monitores duplos']},
    {livre:true,name:'Posição de operação',icon:'ico-telescope.svg',x:-5.3,z:-1,description:'Posição para a equipe do COE.',items:['Dois postos com monitores duplos']},
    {livre:true,name:'Posição de operação',icon:'ico-telescope.svg',x:-3.0,z:-9,description:'Posição para a equipe do COE.',items:['Dois postos com monitores duplos']},
    {livre:true,name:'Posição de operação',icon:'ico-telescope.svg',x:-3.0,z:-1,description:'Posição para a equipe do COE.',items:['Dois postos com monitores duplos']},
  ];
  function fail(message) {
    const status=$('status');status.hidden=false;status.replaceChildren();
    const p=document.createElement('p');p.textContent=message;status.append(p);
    const retry=document.createElement('button');retry.textContent='Tentar novamente';retry.onclick=()=>location.reload();status.append(retry);
    document.documentElement.dataset.modelo='erro';
  }
  if (!window.THREE || !THREE.OrbitControls) { fail('Bibliotecas 3D indisponíveis. Confira a conexão e tente novamente.');return; }
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); }
  catch(e) { fail('WebGL indisponível neste navegador. Ative a aceleração gráfica ou use outro navegador.');return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Maquete interativa da sala do COE');canvas.setAttribute('role','img');$('scene').append(canvas);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(44,1,.1,240);
  const controls=new THREE.OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=80;
  const shell=new THREE.Group(),roof=new THREE.Group(),front=new THREE.Group(),interior=new THREE.Group(),landscape=new THREE.Group();
  scene.add(shell,roof,front,interior,landscape);
  const selectable=[],labels=[],lights=[];let currentView='exterior',selected=-1,showLabels=true,animation=null,night=false,walking=false,tour=null;const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const roomObjects=new Map();let roomEditing=false,roomSelection=null,roomState={};
  const CATALOG=[
    {kind:'tv55',name:'TV 55" de parede',group:'Telas e painéis',screen:true},
    {kind:'tv75',name:'TV 75" de parede',group:'Telas e painéis',screen:true},
    {kind:'tvstand',name:'TV em pedestal móvel',group:'Telas e painéis',screen:true},
    {kind:'vw2x2',name:'Videowall 2 × 2',group:'Telas e painéis',screen:true},
    {kind:'vw3x2',name:'Videowall 3 × 2',group:'Telas e painéis',screen:true},
    {kind:'ledpanel',name:'Painel de LED',group:'Telas e painéis',screen:true},
    {kind:'screen',name:'Tela de apresentação',group:'Telas e painéis',screen:true},
    {kind:'board',name:'Quadro de gestão à vista',group:'Telas e painéis',color:'#e7edf2'},
    {kind:'desk',name:'Posto operacional duplo',group:'Postos e mobiliário'},
    {kind:'desk1',name:'Estação individual',group:'Postos e mobiliário'},
    {kind:'chair',name:'Cadeira operacional',group:'Postos e mobiliário'},
    {kind:'table',name:'Mesa de reunião (6 lugares)',group:'Postos e mobiliário'},
    {kind:'roundtable',name:'Mesa redonda (4 lugares)',group:'Postos e mobiliário'},
    {kind:'sofa',name:'Sofá',group:'Postos e mobiliário',color:'#2c4a66'},
    {kind:'armchair',name:'Poltrona',group:'Postos e mobiliário',color:'#2c4a66'},
    {kind:'cabinet',name:'Armário',group:'Postos e mobiliário',color:'#d9dee2'},
    {kind:'rack',name:'Rack técnico',group:'Infraestrutura'},
    {kind:'ac',name:'Climatização',group:'Infraestrutura'},
    {kind:'printer',name:'Impressora',group:'Infraestrutura'},
    {kind:'camera',name:'Câmera de videoconferência',group:'Infraestrutura'},
    {kind:'extinguisher',name:'Extintor',group:'Infraestrutura'},
    {kind:'wall',name:'Parede / divisória',group:'Arquitetura',color:'#dce2e5'},
    {kind:'glasswall',name:'Divisória de vidro',group:'Arquitetura'},
    {kind:'zone',name:'Demarcação de área',group:'Arquitetura',color:'#5b8fc7'},
    {kind:'plant',name:'Planta',group:'Ambientação'},
    {kind:'logo',name:'Painel institucional',group:'Ambientação',color:'#003a70'}
  ];
  const kindNames=Object.fromEntries(CATALOG.map(v=>[v.kind,v.name]));
  function registerObject(id,group,metadata,added=false){
    group.userData.roomId=id;
    const defaults={x:group.position.x,y:group.position.y,z:group.position.z,rotation:THREE.MathUtils.radToDeg(group.rotation.y),scale:group.scale.x,sx:1,sy:1,sz:1,visible:group.visible,removed:false,name:metadata.name||kindNames[metadata.kind],description:metadata.description||'',items:[...(metadata.items||[])]};
    roomObjects.set(id,{id,group,kind:metadata.kind||'desk',icon:metadata.icon||'ico-telescope.svg',added,sourceId:metadata.sourceId,defaults,data:{...defaults}});
    return group;
  }
  function captureObject(id,start,x,y,z,metadata){
    const children=interior.children.slice(start),group=new THREE.Group();group.position.set(x,y,z);interior.add(group);
    for(const child of children){child.position.sub(group.position);group.add(child);}
    return registerObject(id,group,metadata);
  }
  const mats={};
  function mat(key,color,roughness=.65,metalness=0){return mats[key]||(mats[key]=new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness}));}
  const navy=mat('navy',0x003a70,.4,.12), red=mat('red',0xef3340,.45,.1), white=mat('white',0xf1f2f0),wall=mat('wall',0xdce2e5,.86),metal=mat('metal',0x8799a9,.26,.75),dark=mat('dark',0x18212d,.45,.25),fabric=mat('fabric',0x293849,.96),wood=mat('wood',0xac8364,.67),stone=mat('stone',0xc4c4bc,.88),grass=mat('grass',0x52724b,.96),leaves=mat('leaves',0x3e6541,.94);
  const glass=new THREE.MeshPhysicalMaterial({color:0xb8d9e7,transparent:true,opacity:.25,roughness:.12,metalness:.25,depthWrite:false});
  const glow=new THREE.MeshBasicMaterial({color:0xffe2ac}),cool=new THREE.MeshBasicMaterial({color:0xc7e6ff});
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,16),sphereGeo=new THREE.SphereGeometry(1,10,8);
  function mesh(g,geometry,material,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,m){return mesh(g,boxGeo,m,x,y,z,w,h,d);}
  function cylinder(g,x,y,z,r,h,m){return mesh(g,cylGeo,m,x,y,z,r,h,r);}
  function sphere(g,x,y,z,r,m){return mesh(g,sphereGeo,m,x,y,z,r,r,r);}
  function texture(draw,w=512,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);return t;}
  function face(g,x,y,z,w,h,t,ry=0){const m=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide});const o=mesh(g,new THREE.PlaneGeometry(w,h),m,x,y,z);o.rotation.y=ry;o.castShadow=false;return o;}
  function lettering(text,sub='',bg='#003a70',fg='#ffffff'){return texture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.font='600 58px Arial';c.fillText(text,28,112);c.font='25px Arial';c.fillText(sub,30,158);},1024,256);}
  const floorTex=texture((c,w,h)=>{c.fillStyle='#b49a7d';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){for(let x=-128;x<w;x+=256){const shift=(y/32%2)*128;c.fillStyle=['#b7a089','#ad9478','#bca78e','#ab927c'][(y/32+x/256+16)%4|0];c.fillRect(x+shift,y,254,31);}c.strokeStyle='#786c5a30';for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,y+i*6+3);c.lineTo(w,y+i*6+4);c.stroke();}}},512,512);floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(6,5);
  const floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:.7});
  const asphaltTex=texture((c,w,h)=>{c.fillStyle='#626c73';c.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const x=(i*73)%w,y=(i*137+Math.floor(i/13))%h;c.fillStyle=i%2?'#ffffff12':'#00000014';c.fillRect(x,y,1,1);}},256,256);asphaltTex.wrapS=asphaltTex.wrapT=THREE.RepeatWrapping;asphaltTex.repeat.set(14,14);
  const asphalt=new THREE.MeshStandardMaterial({map:asphaltTex,roughness:1});
  function dashboard(title,index){return texture((c,w,h)=>{c.fillStyle='#081e34';c.fillRect(0,0,w,h);c.fillStyle='#153b60';c.fillRect(0,0,w,44);c.fillStyle='#eef6ff';c.font='bold 19px Arial';c.fillText(title,18,28);c.font='10px Arial';c.fillStyle='#9fb4cc';c.fillText('DEMONSTRAÇÃO · SEM DADOS AO VIVO',18,h-12);
    if(index%3===0){c.fillStyle='#174269';c.fillRect(18,60,270,154);c.strokeStyle='#7999ad';c.lineWidth=3;for(let i=0;i<6;i++){c.beginPath();c.moveTo(28+i*45,68);c.lineTo(70+i*31,205);c.stroke();}for(let i=0;i<5;i++){c.beginPath();c.moveTo(24,79+i*28);c.lineTo(280,98+i*21);c.stroke();}for(let i=0;i<7;i++){c.fillStyle=i===4?'#ef3340':'#8ac6d5';c.fillRect(60+i*29,94+(i%3)*37,8,8);}c.fillStyle='#c1dcf0';c.font='16px Arial';c.fillText('Fluxo operacional',315,84);for(let i=0;i<5;i++){c.fillStyle='#315d7f';c.fillRect(315,101+i*21,158,8);c.fillStyle='#79adc8';c.fillRect(315,101+i*21,75+i*13,8);}}
    else if(index%3===1){for(let i=0;i<6;i++){let x=18+(i%3)*164,y=60+Math.floor(i/3)*82;c.fillStyle='#295169';c.fillRect(x,y,150,72);c.fillStyle='#6c8990';c.fillRect(x,y+44,150,28);c.fillStyle='#b2bdc0';c.fillRect(x+19,y+14,83,33);c.fillStyle='#314658';c.fillRect(x+32,y+25,18,22);c.fillStyle='#e2edf3';c.font='11px Arial';c.fillText('CÂMERA DEMO '+(i+1),x+5,y+12);}}
    else {for(let i=0;i<3;i++){c.fillStyle='#193e60';c.fillRect(18+i*164,60,150,62);c.fillStyle='#d6e8f5';c.font='14px Arial';c.fillText(['Operação','Qualidade','Disponibilidade'][i],30+i*164,84);c.font='24px Arial';c.fillStyle='#9ed9e4';c.fillText('—',30+i*164,111);}c.strokeStyle='#88cada';c.lineWidth=3;c.beginPath();for(let i=0;i<21;i++){const x=20+i*23,y=198-22*Math.sin(i*.8+index)-i*1.2;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#355673';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(18,148+i*29);c.lineTo(494,148+i*29);c.stroke();}}
  });}
  // Telas do painel (js/indicadores.js, gerado pelo atualizar.py): as 8 TVs da camada tática e a visão estratégica da unidade (E0).
  const VW=window.COE&&window.COE.url&&Array.isArray(window.COE.tatica)&&window.COE.tatica.length>=8?window.COE:null;
  const tvInfo=(tv,camada)=>({n:tv.n,nome:tv.nome,ids:tv.telas.map(t=>t.id),titulos:tv.telas.map(t=>t.titulo),camada});
  const TVS=VW?VW.tatica.slice(0,8).map(tv=>tvInfo(tv,'tática')):[],E0=VW&&Array.isArray(VW.estrategica)&&VW.estrategica[0]?tvInfo(VW.estrategica[0],'estratégica'):null;
  const SCREEN_NAMES=TVS.length?TVS.map(tv=>'TV '+tv.n+' · '+tv.nome):['Visão geral','Câmeras · unidade','Indicadores','Fluxo operacional','Qualidade','Equipamentos','Planejamento','Situação operacional'];
  const wallTextures=SCREEN_NAMES.map((name,i)=>dashboard(name.toUpperCase(),i)),liveScreens=[];
  function plate(n,name){return texture((c,w,h)=>{c.fillStyle='#0b2238';c.fillRect(0,0,w,h);c.fillStyle='#ef3340';c.fillRect(0,0,8,h);c.fillStyle='#ffffff';c.font='bold 30px Arial';c.fillText(n,22,43);c.fillStyle='#d8e6f3';c.font='600 27px Arial';c.fillText(name,72,43);},512,64);}
  // Monitores das mesas: SCADA, BI e alarmes, o conteúdo previsto para os postos no estudo (item C009). Desenho ilustrativo, sem dados.
  const KPI={};if(VW&&Array.isArray(VW.campos)&&Array.isArray(VW.linhas)){const ci=VW.campos.indexOf('cod'),ni=VW.campos.indexOf('ind');for(const l of VW.linhas){const k=l[ci],n=String(l[ni]||'').trim();if(k&&n&&n.length<=30&&!(KPI[k]=KPI[k]||[]).includes(n))KPI[k].push(n);}}
  const rnd=seed=>()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
  function wrap(c,text,x,y,maxW,lh,max){let line='',n=0;for(const word of text.split(' ')){const t=line?line+' '+word:word;if(line&&c.measureText(t).width>maxW){c.fillText(line,x,y+n*lh);if(++n>=max)return;line=word;}else line=t;}if(line&&n<max)c.fillText(line,x,y+n*lh);}
  function consoleTex(title,tag,draw){return texture((c,w,h)=>{c.fillStyle='#071523';c.fillRect(0,0,w,h);c.fillStyle='#10304d';c.fillRect(0,0,w,34);c.fillStyle='#ef3340';c.fillRect(0,0,5,34);c.fillStyle='#eaf2fa';c.font='bold 15px Arial';c.fillText(title,14,22);c.fillStyle='#8fb0cc';c.font='11px Arial';c.textAlign='right';c.fillText(tag,w-12,22);c.textAlign='left';draw(c,w,h);},512,320);}
  function scada(title,alarm){return consoleTex('SCADA · '+title,'sinótico ilustrativo',(c,w,h)=>{
    const ok='#3fbf7f',bad='#ef3340',idle='#7f93a6',body='#1f4f75';
    c.strokeStyle='#3f7aa6';c.lineWidth=5;c.lineJoin='round';c.beginPath();c.moveTo(62,236);c.lineTo(96,236);c.lineTo(96,74);c.lineTo(153,74);c.lineTo(153,104);c.moveTo(182,236);c.lineTo(226,236);c.lineTo(226,62);c.lineTo(432,62);for(const x of [292,362,432]){c.moveTo(x,62);c.lineTo(x,76);}c.moveTo(270,236);c.lineTo(456,236);c.stroke();
    c.fillStyle=body;c.beginPath();c.moveTo(14,190);c.lineTo(80,190);c.lineTo(64,236);c.lineTo(30,236);c.closePath();c.fill();c.fillRect(88,66,16,178);c.fillRect(218,54,16,190);c.fillRect(124,104,58,132);
    c.fillStyle='#ffb347';c.beginPath();c.moveTo(153,226);c.quadraticCurveTo(139,211,153,194);c.quadraticCurveTo(167,211,153,226);c.fill();
    for(const x of [270,340,410]){c.fillStyle=body;c.fillRect(x,92,44,132);c.beginPath();c.moveTo(x-3,92);c.lineTo(x+22,74);c.lineTo(x+47,92);c.fill();}
    c.fillStyle='#2b6a99';c.fillRect(456,210,44,22);c.fillRect(440,216,16,16);c.fillStyle='#0b1a29';for(const x of [447,468,490]){c.beginPath();c.arc(x,236,5,0,7);c.fill();}
    c.font='bold 10px Arial';c.textAlign='center';for(const [t,x,col] of [['MOEGA',47,ok],['SECADOR',153,alarm==='secador'?bad:ok],['SILO 1',292,ok],['SILO 2',362,alarm==='silo'?bad:ok],['SILO 3',432,idle],['EXPEDIÇÃO',476,ok]]){c.fillStyle=col;c.beginPath();c.arc(x,252,4,0,7);c.fill();c.fillStyle='#cfe0ef';c.fillText(t,x,272);}c.textAlign='left';
    c.font='11px Arial';const tag=(x,y,t,col)=>{c.fillStyle='#0b1f33';c.fillRect(x,y-12,c.measureText(t).width+10,16);c.fillStyle=col;c.fillText(t,x+5,y);};
    tag(128,120,alarm==='secador'?'Ar 52 °C':'Ar 46 °C',alarm==='secador'?bad:ok);tag(128,140,'Fornalha 410 °C','#cfe0ef');tag(346,120,alarm==='silo'?'Aeração off':'T 24 °C',alarm==='silo'?bad:ok);tag(18,176,'Livre',ok);
    c.fillStyle=alarm?'#3a1218':'#0f2a1d';c.fillRect(0,288,w,32);c.fillStyle=alarm?'#ff8a94':'#8fe0b5';c.font='bold 12px Arial';c.fillText(alarm==='secador'?'P1 · Saída do ar do secador acima de 50 °C':alarm==='silo'?'P1 · Aeração desligada com necessidade':'Sem alarme P1 ativo neste trecho',14,309);});}
  const ALARMS=[['P1','Saída do ar do secador acima de 50 °C'],['P1','Depressão da fornalha fora da faixa'],['P1','Ponto quente no silo 2'],['P1','Aeração desligada com necessidade'],['P2','Sem moega livre'],['P2','Balança indisponível'],['P2','Contrato atrasando'],['P3','Meta de secagem abaixo do esperado'],['P3','Taxa de reprovação subindo']];
  function alarms(seed){return consoleTex('ALARMES ATIVOS','protocolo P1 · P2 · P3',(c,w,h)=>{const col={P1:'#ef3340',P2:'#f39c33',P3:'#e3c341'},resp={P1:'Acionamento imediato do campo',P2:'Resposta no turno',P3:'Reunião diária'};
    ALARMS.filter((a,i)=>(i+seed)%3!==0).slice(0,6).forEach((a,i)=>{const y=42+i*46,m=14*60+35-i*11-seed*4;c.fillStyle=i%2?'#0b1d30':'#0e2439';c.fillRect(8,y,w-16,42);c.fillStyle=col[a[0]];c.fillRect(8,y,5,42);c.fillRect(22,y+11,30,20);c.fillStyle='#071523';c.font='bold 12px Arial';c.fillText(a[0],29,y+26);c.fillStyle='#e6eef6';c.font='13px Arial';c.fillText(a[1],62,y+18);c.fillStyle='#8fb0cc';c.font='11px Arial';c.fillText(resp[a[0]]+' · '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),62,y+34);});});}
  function bi(title,code,seed){const names=(KPI[code]||[]).slice(0,3),r=rnd(seed*97+13);while(names.length<3)names.push('Indicador '+(names.length+1));return consoleTex('BI · '+title,'tela '+code,(c,w,h)=>{
    names.forEach((n,i)=>{const x=8+i*168,y=44;c.fillStyle='#10304d';c.fillRect(x,y,160,78);c.fillStyle='#c4d8ea';c.font='12px Arial';wrap(c,n,x+9,y+18,142,14,2);c.strokeStyle='#7fd0e0';c.lineWidth=2;c.beginPath();for(let k=0;k<12;k++){const px=x+9+k*12.5,py=y+70-r()*20;k?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();});
    c.strokeStyle='#28465f';c.lineWidth=1;for(let k=0;k<4;k++){c.beginPath();c.moveTo(14,150+k*36);c.lineTo(w-14,150+k*36);c.stroke();}
    for(let k=0;k<14;k++){const bh=30+r()*92;c.fillStyle=k===13?'#ef3340':'#3f8fc4';c.fillRect(24+k*34,258-bh,22,bh);}
    c.fillStyle='#8fb0cc';c.font='10px Arial';c.fillText('Últimas 14 horas · ilustrativo, sem dados',14,292);});}
  const MAKE={E0:()=>bi('Visão da unidade','E0',1),'07C':()=>bi('Contratos','07C',2),'01B':()=>bi('Fila de caminhões','01B',3),'02':()=>bi('Classificação','02',4),'05':()=>bi('Silos e aeração','05',5),'07A':()=>bi('Expedição','07A',6),'04B':()=>bi('Produtividade da secagem','04B',7),'06':()=>bi('Armazém','06',8),'04A':()=>bi('Secadores','04A',9),'03':()=>bi('Moegas','03',10),'01A':()=>bi('Recepção','01A',11),sec:()=>scada('SECAGEM','secador'),rec:()=>scada('RECEPÇÃO E MOEGAS',''),aer:()=>scada('AERAÇÃO DOS SILOS','silo'),a0:()=>alarms(0),a1:()=>alarms(1),a2:()=>alarms(2)};
  const consolePool={},consoleTexture=k=>consolePool[k]||(consolePool[k]=MAKE[k]());
  // quatro monitores por área (dois postos com dois monitores), na ordem de areas
  const CONSOLE=[['E0','a0','07C','sec'],['rec','a1','01B','sec'],['02','a2','05','07A'],['04B','07C','06','a0'],['aer','a1','sec','rec'],['04A','a2','aer','03'],['01A','04B','a0','E0']].map(r=>r.map(consoleTexture));
  const screenTextures=[consoleTexture('E0'),consoleTexture('sec'),consoleTexture('02'),consoleTexture('a1')];
  // Parede de CFTV: mosaico das 32 câmeras da unidade, oito por monitor (item C020 do estudo). Nomes e cenas ilustrativos.
  const CAMS=['Portaria','Balança 1','Balança 2','Pátio de espera','Classificação','Moega 1','Moega 2','Moega 3','Tombador','Elevadores','Secador 1','Secador 2','Fornalha 1','Fornalha 2','Pré-limpeza','Galeria','Silo 1','Silo 2','Silo 3','Silo 4','Túnel dos silos','Armazém 1','Armazém 2','Expedição 1','Expedição 2','Pátio de saída','Subestação','Casa de máquinas','Laboratório','Perímetro norte','Perímetro sul','Estacionamento'];
  function cftv(m){return texture((c,w,h)=>{c.fillStyle='#04090f';c.fillRect(0,0,w,h);for(let i=0;i<8;i++){const k=m*8+i,x=4+(i%4)*127,y=4+Math.floor(i/4)*134,tw=123,th=130,g=c.createLinearGradient(0,y,0,y+th);g.addColorStop(0,'#9fb4c1');g.addColorStop(.58,'#cdd6d8');g.addColorStop(.59,'#77837b');g.addColorStop(1,'#56605a');c.fillStyle=g;c.fillRect(x,y,tw,th);
    const gx=x+18+(k*37)%50,gy=y+76;c.fillStyle=['#6c7a82','#7d8a8f','#5f6d75','#87939a'][k%4];
    if(k%4===0){c.fillRect(gx,gy-46,26,46);c.beginPath();c.moveTo(gx-2,gy-46);c.lineTo(gx+13,gy-58);c.lineTo(gx+28,gy-46);c.fill();c.fillRect(gx+32,gy-38,22,38);}
    else if(k%4===1){c.fillRect(gx-8,gy-30,70,30);c.beginPath();c.moveTo(gx-12,gy-30);c.lineTo(gx+27,gy-46);c.lineTo(gx+66,gy-30);c.fill();}
    else if(k%4===2){c.fillRect(gx,gy-22,48,18);c.fillRect(gx+48,gy-16,14,12);c.fillStyle='#2b3136';for(const d of [6,26,52]){c.beginPath();c.arc(gx+d,gy-3,4,0,7);c.fill();}}
    else{c.fillRect(gx+10,gy-62,12,62);c.fillRect(gx-6,gy-20,56,20);}
    c.fillStyle='#000000a8';c.fillRect(x,y+th-19,tw,19);c.fillStyle='#f2f6f8';c.font='bold 10px Arial';c.fillText('CAM '+String(k+1).padStart(2,'0'),x+4,y+th-6);c.font='10px Arial';c.fillText(CAMS[k],x+48,y+th-6);c.fillStyle='#ef3340';c.beginPath();c.arc(x+tw-8,y+8,3.5,0,7);c.fill();}},512,272);}
  // Prédio atual da cooperativa, medido na imagem de satélite: 22,2 m (leste-oeste) × 22,5 m (norte-sul), com o acesso coberto ao sul.
  // Origem no centro do terreno do prédio; x cresce para leste, z para o sul (o norte fica no alto da vista em planta).
  // Ambientes existentes mantidos: recepção, copa e banheiros. No espaço do COE: sala de operações com o videowall na parede oeste,
  // sala executiva envidraçada, duas salas de reunião menores, duas cabines, sala técnica e circulação.
  const XO=-11.1,XE=5.4,XA=11.1,ZN=-11.25,ZS=6.75,ZC=11.25;
  // Implantação externa e acessos.
  box(landscape,0,-.28,0,80,.4,70,grass);box(landscape,-2.8,-.03,20.5,40,.12,15,asphalt);box(landscape,-2.8,.03,12.6,20,.18,2.6,stone);box(landscape,6.6,.02,3.5,2,.18,15.4,stone);
  for(let x=-18;x<=12;x+=5){box(landscape,x,.05,21,.1,.025,6.4,white);}
  function car(x,z,color){const g=new THREE.Group();landscape.add(g);g.position.set(x,.25,z);box(g,0,.6,0,1.9,.65,4.2,mat('car'+color,color,.25,.4));box(g,0,1.12,-.15,1.65,.65,2.2,mat('carGlass',0x254455,.17,.5));box(g,0,1.48,-.2,1.68,.12,1.8,mat('car'+color,color,.25,.4));for(const xx of [-.97,.97])for(const zz of [-1.25,1.25])cylinder(g,xx,.32,zz,.33,.22,dark).rotation.z=Math.PI/2;}
  car(-15.5,21,0xe1e5e6);car(-5.5,21,0x28486a);car(4.5,21,0xb5b7b9);
  function tree(x,z,r=1.5){cylinder(landscape,x,1.25,z,.16,2.6,wood);for(let i=0;i<5;i++){const a=i*1.256;sphere(landscape,x+Math.cos(a)*r*.45,3.1+(i%2)*.4,z+Math.sin(a)*r*.45,r,leaves);}cylinder(landscape,x,.15,z,1.2,.18,stone);}
  for(const p of [[9.2,1.5],[9.6,7.5],[-15.5,-6],[-15.5,4],[-4,-15],[8,-15],[15,-8],[16,6],[-18,14]])tree(...p);
  for(const z of [-8,-2,4]){cylinder(landscape,-12.6,.6,z,.09,1.2,dark);cylinder(landscape,-12.6,1.15,z,.12,.13,glow);}
  box(landscape,-13.2,1.8,12.4,1.2,3.6,.35,navy);face(landscape,-13.2,2.3,12.6,1.08,.6,lettering('COE','Cooperativa Holambra'));face(landscape,-13.2,1.4,12.6,1.08,.5,lettering('ACESSO','Centro operacional'));box(landscape,-13.2,.35,12.4,1.2,.12,.38,red);
  // Piso: prédio fechado (corpo principal e anexo da copa) e acesso coberto.
  box(shell,(XO+XE)/2,.18,(ZN+ZS)/2,XE-XO+.3,.36,ZS-ZN+.3,stone);box(shell,(XE+XA)/2,.18,-7.75,XA-XE+.3,.36,7.3,stone);box(shell,(XO+XE)/2,.12,(ZS+ZC)/2,XE-XO,.24,ZC-ZS,stone);
  box(interior,(XO+XE)/2,.39,(ZN+ZS)/2,XE-XO-.1,.12,ZS-ZN-.1,floorMat);
  const tile=mat('tile',0xd7dbdc,.38);box(interior,(-1.1+XA)/2,.4,-7.75,XA+1.1-.1,.12,6.9,tile);
  // Paredes externas (shell) e divisórias internas (interior). Aberturas de porta ficam como vãos.
  const H=4.2,h=3.5;
  function wallX(g,x1,x2,z,m=wall,t=.24,alt=H){box(g,(x1+x2)/2,.35+alt/2,z,Math.abs(x2-x1),alt,t,m);}
  function wallZ(g,z1,z2,x,m=wall,t=.24,alt=H){box(g,x,.35+alt/2,(z1+z2)/2,t,alt,Math.abs(z2-z1),m);}
  function vidroX(x1,x2,z){box(interior,(x1+x2)/2,.35+h/2,z,Math.abs(x2-x1),h,.05,glass);for(let x=Math.min(x1,x2);x<=Math.max(x1,x2)+.01;x+=Math.max(1,Math.abs(x2-x1)/Math.ceil(Math.abs(x2-x1)/1.6)))box(interior,x,.35+h/2,z,.07,h,.08,metal);}
  function vidroZ(z1,z2,x){box(interior,x,.35+h/2,(z1+z2)/2,.05,h,Math.abs(z2-z1),glass);for(let z=Math.min(z1,z2);z<=Math.max(z1,z2)+.01;z+=Math.max(1,Math.abs(z2-z1)/Math.ceil(Math.abs(z2-z1)/1.6)))box(interior,x,.35+h/2,z,.08,h,.07,metal);}
  wallZ(shell,ZN,ZS,XO);wallX(shell,XO,XA,ZN);wallZ(shell,ZN,-4.25,XA);wallX(shell,XE,XA,-4.25);wallZ(shell,-4.25,ZS,XE);
  // fachada sul envidraçada (recepção e salas de reunião), com a porta de entrada da recepção
  for(const [a,b] of [[XO,-.4],[1.6,XE]]){box(front,(a+b)/2,2.2,ZS,b-a,3.6,.05,glass);}wallX(front,-.4,1.6,ZS,glass,.05,3.6);
  for(let x=XO;x<=XE+.01;x+=2.05)box(front,x,2.2,ZS+.02,.12,3.6,.15,metal);box(front,(XO+XE)/2,.5,ZS+.04,XE-XO,.25,.25,navy);
  // acesso coberto (marquise) sobre a faixa sul
  box(front,(XO+XE)/2,3.55,(ZS+ZC)/2,XE-XO+.4,.22,ZC-ZS+.2,navy);box(front,(XO+XE)/2,3.43,(ZS+ZC)/2,XE-XO-.6,.03,ZC-ZS-.6,glow);for(const x of [XO+.3,-3,XE-.3])cylinder(front,x,1.8,ZC-.3,.12,3.4,metal);
  box(front,(XO+XE)/2,4.25,ZS+.12,XE-XO,1,.3,navy);box(front,(XO+XE)/2,3.73,ZS+.2,XE-XO,.08,.3,red);
  face(front,-6.5,4.3,ZS+.29,4.5,.6,lettering('COE','Centro Operacional de Excelência'));
  const loader=new THREE.TextureLoader();loader.load('../img/marca/holambra-escuro.svg',t=>{t.encoding=THREE.sRGBEncoding;face(front,1.6,4.2,ZS+.29,5,1.05,t);},undefined,()=>{});
  // cobertura
  const roofMat=mat('roof',0xcbd2d5,.7,.2);box(roof,(XO+XE)/2,4.7,(ZN+ZS)/2,XE-XO+.4,.35,ZS-ZN+.4,roofMat);box(roof,(XE+XA)/2,4.7,-7.75,XA-XE+.4,.35,7.4,roofMat);
  for(const [x1,x2,z] of [[XO,XE,ZN],[XO,XE,ZS],[XE,XA,ZN],[XE,XA,-4.25]])box(roof,(x1+x2)/2,4.95,z,x2-x1+.4,.25,.22,navy);
  for(const [z1,z2,x] of [[ZN,ZS,XO],[-4.25,ZS,XE],[ZN,-4.25,XA]])box(roof,x,4.95,(z1+z2)/2,.22,.25,z2-z1+.4,navy);
  for(let i=0;i<4;i++){box(roof,-9+i*3.5,5.0,-7,3.1,.08,3.5,mat('solar',0x16374c,.2,.4));for(let j=0;j<5;j++)box(roof,-10.2+i*3.5+j*.6,5.05,-7,.025,.01,3.45,metal);}box(roof,7.5,5,-8,2.4,.6,2.8,white);
  // Divisórias internas.
  let objectStart=interior.children.length;
  // A sala de operações ocupa toda a faixa oeste até a recepção (10 × 12,5 m). Banheiros reduzidos; sala técnica e cabines ao lado deles.
  wallZ(interior,ZN,-9.2,-1.1,wall,.12,h);wallZ(interior,-8.4,-5.6,-1.1,wall,.12,h);wallZ(interior,-4.6,-4.25,-1.1,wall,.12,h); // operações | sala técnica (porta), cabines e hall (porta)
  vidroZ(-4.25,-3.4,-1.1);vidroZ(-2.6,1.25,-1.1);                                                 // operações | circulação de serviço (porta em -3), com vista da sala executiva
  vidroZ(-4.25,-2.0,.3);vidroZ(-1.1,1.25,.3);                                                     // circulação de serviço | sala executiva (porta em -1,5)
  wallX(interior,-1.1,1.4,-8.25,wall,.12,h);wallZ(interior,ZN,-5.75,1.4,wall,.12,h);wallZ(interior,-8.25,-5.75,.15,wall,.08,h); // sala técnica e duas cabines
  vidroX(-1.1,-.75,-5.75);vidroX(-.15,.5,-5.75);vidroX(1.1,1.4,-5.75);                            // cabines (portas para o hall)
  wallX(interior,1.4,2.3,-5.75,wall,.12,h);wallX(interior,3.1,3.9,-5.75,wall,.12,h);              // banheiros (porta para o hall)
  wallX(interior,.3,3.9,-4.25,wall,.12,h);wallZ(interior,ZN,-5.6,3.9,wall,.12,h);wallZ(interior,-4.6,-4.25,3.9,wall,.12,h);wallX(interior,3.9,XE,-4.25,wall,.12,h); // copa (porta para o hall)
  wallX(interior,XO,-6.6,1.25,wall,.12,h);vidroX(-6.6,-5.6,1.25);vidroX(-4.6,-1.1,1.25);wallX(interior,.3,1.0,1.25,wall,.12,h);wallX(interior,2.0,XE,1.25,wall,.12,h); // recepção | operações (porta em -5,1) e sala executiva
  vidroZ(1.25,2.1,-6.6);vidroZ(2.9,4.85,-6.6);vidroZ(5.65,ZS,-6.6);wallX(interior,XO,-6.6,4.0,wall,.12,h);  // salas de reunião 1 e 2 (portas para a recepção)
  captureObject('divisorias',objectStart,0,0,0,{kind:'wall',name:'Divisórias internas',description:'Paredes e vidros que organizam o espaço do COE dentro do prédio atual.'});
  // Parede do videowall (oeste da sala de operações), revestimento acústico e monitores.
  objectStart=interior.children.length;
  const VWX=XO+.14,VWZ=-5;
  box(interior,VWX,2.2,VWZ,.08,3.6,12.3,navy);for(let i=0;i<28;i++)box(interior,VWX+.06,2.2,ZN+.4+i*.44,.08,3.5,.05,wood);
  captureObject('revestimento-videowall',objectStart,VWX,0,VWZ,{kind:'wall',name:'Parede do videowall',description:'Parede oeste da sala de operações, com revestimento institucional azul e ripado acústico de madeira.'});
  objectStart=interior.children.length;
  // Oito monitores profissionais de 55" (16:9), 4 × 2, uma por segmento da camada tática do painel.
  const TV_W=1.21,TV_H=TV_W*9/16,PASSO=TV_W+.02,R1=2.35,R2=R1-TV_H-.02;
  box(interior,VWX+.12,(R1+R2)/2,VWZ,.1,TV_H*2+.12,PASSO*4+.1,dark);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){const i=row*4+col,z=VWZ+(1.5-col)*PASSO,y=row?R2:R1;box(interior,VWX+.2,y,z,.06,TV_H+.02,TV_W+.02,dark);liveScreens.push({mesh:face(interior,VWX+.24,y,z,TV_W,TV_H,wallTextures[i],Math.PI/2),w:TV_W*2.2,tv:TVS[i]||null});}
  box(interior,VWX+.4,.62,VWZ,.55,.5,8.2,wood);box(interior,VWX+.4,.88,VWZ,.57,.03,8.22,metal);
  TVS.forEach((tv,i)=>{const z=VWZ+(1.5-i%4)*PASSO;face(interior,VWX+.25,i<4?R1+TV_H/2+.16:.98,z,1.1,.14,plate(tv.n,tv.nome),Math.PI/2);});
  captureObject('videowall',objectStart,VWX,0,VWZ,{kind:'screen',name:'Videowall principal',description:'Oito monitores de 55" (4 × 2) com as telas do painel (camada tática), na parede oeste da sala de operações.',items:['Oito monitores com as telas do painel','Console técnico inferior']});
  // Telas do painel: cada TV mostra a captura da sua tela do videowall (../img/telas/<id>-<tema>.webp),
  // com rodízio de 10 s quando a TV tem mais de uma tela; a tela ao vivo abre em outra aba ("Abrir esta tela").
  const liveTvs=[],demoMats=new Map(),hole=null;
  let liveState='off',liveGen=0,liveWanted=false;const cssRenderer=null;
  const temaTv=()=>document.documentElement.dataset.theme==='dark'?'escuro':'claro';
  const tvUrl=tv=>VW.url+'?telas='+tv.ids.map(encodeURIComponent).join(',')+'&tema='+temaTv();
  const NOTA_DEMO='Telas demonstrativas · sem conexão com sistemas ao vivo';
  const texLoader=new THREE.TextureLoader();
  function startLiveWall(){
    liveWanted=true;if(liveState!=='off'||!VW)return;liveState='on';const gen=++liveGen;
    liveScreens.filter(s=>s.tv).forEach(s=>{
      const ids=s.tv.ids;let k=0;
      const put=()=>{if(gen!==liveGen)return;texLoader.load('../img/telas/'+encodeURIComponent(ids[k%ids.length])+'-'+temaTv()+'.webp',tex=>{
        if(gen!==liveGen){tex.dispose();return;}
        tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
        if(!demoMats.has(s.mesh))demoMats.set(s.mesh,s.mesh.material);
        const old=s.mesh.material;s.mesh.material=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
        if(old!==demoMats.get(s.mesh)){if(old.map)old.map.dispose();old.dispose();}
        $('telas-nota').textContent='Videowall com as telas do painel (capturas) · dados demonstrativos';
      });};
      put();if(ids.length>1)liveTvs.push(setInterval(()=>{k++;put();},10000));
    });
  }
  // Fora de vista por meio minuto (outra página do painel ou aba escondida), as TVs voltam às telas
  // demonstrativas e liberam memória; voltam sozinhas quando a sala reaparece.
  function stopLiveWall(){liveGen++;liveTvs.forEach(clearInterval);liveTvs.length=0;for(const [mesh,m] of demoMats){const cur=mesh.material;if(cur!==m){if(cur.map)cur.map.dispose();cur.dispose();}mesh.material=m;}demoMats.clear();liveState='off';$('telas-nota').textContent=NOTA_DEMO;}
  let idleSince=0;
  setInterval(()=>{const idle=document.hidden||window.COE_MODELO_ATIVO===false;if(!idle){idleSince=0;if(liveWanted&&liveState==='off')startLiveWall();return;}if(!idleSince)idleSince=Date.now();else if(Date.now()-idleSince>30000&&liveState!=='off')stopLiveWall();},5000);
  function liveThemeToTvs(){if(liveState==='on'){stopLiveWall();startLiveWall();}}
  // Ambientes: postos de operação orientados para o videowall (oeste), salas de reunião, cabines e apoio.
  function monitor(g,x,z,t,y=.96,w=.63){box(g,x,y+.35,z,w,.42,.05,dark);face(g,x,y+.35,z+.031,w-.04,.37,t);box(g,x,y+.1,z,.045,.2,.05,metal);box(g,x,y,z+.04,.25,.025,.16,dark);}
  const keys=texture((c,w,h)=>{c.fillStyle='#26313d';c.fillRect(0,0,w,h);for(let y=0;y<5;y++)for(let x=0;x<15;x++){c.fillStyle='#66717e';c.fillRect(8+x*33,8+y*43,26,30);}},512,256);
  function phone(g,x,z){const o=box(g,x,.95,z,.18,.055,.23,dark);o.rotation.x=.15;box(g,x,1.015,z-.06,.18,.04,.05,dark);box(g,x,1.01,z,.08,.005,.07,navy);for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(g,x-.04+i*.04,.985,z+.05+j*.03,.02,.006,.015,metal);}
  function chair(g,x,z,ry=0){const c=new THREE.Group();g.add(c);c.position.set(x,0,z);c.rotation.y=ry;cylinder(c,0,.33,0,.035,.55,metal);box(c,0,.66,0,.55,.13,.52,fabric);box(c,0,1.04,.25,.55,.72,.09,fabric);box(c,0,1.49,.28,.38,.16,.1,dark);for(const xx of [-.34,.34]){box(c,xx,.76,0,.035,.35,.04,metal);box(c,xx,.94,-.03,.08,.05,.4,dark);}for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(c,Math.cos(a)*.22,.09,Math.sin(a)*.22,.07,.05,.44,metal).rotation.y=-a;}return c;}
  // Cada posto: mesa com dois postos de dois monitores, de frente para o videowall (rotação de 90°: a frente da mesa olha para oeste).
  function zone(index){const a=areas[index],g=new THREE.Group();g.position.set(a.x,0,a.z);g.rotation.y=Math.PI/2;g.userData.area=index;interior.add(g);selectable.push(g);
    box(g,0,.87,0,3.6,.12,1.1,index===0?wood:white);for(const x of [-1.5,1.5]){box(g,x,.44,0,.08,.8,.8,metal);box(g,x,.08,0,.65,.06,.85,metal);}box(g,0,.7,-.36,3.3,.3,.08,navy);
    for(const x of [-.9,.9]){const k=x<0?0:2;monitor(g,x-.34,-.1,CONSOLE[index%CONSOLE.length][k]);monitor(g,x+.34,-.1,CONSOLE[index%CONSOLE.length][k+1]);const keyboard=face(g,x,.943,.3,.6,.22,keys);keyboard.rotation.x=-Math.PI/2;box(g,x+.45,.95,.3,.09,.04,.14,dark);phone(g,x-.68,.27);chair(g,x,.95);}
    registerObject('area-'+index,g,{...a,kind:'desk'});
    if(!a.livre){const label=document.createElement('span');label.className='zone-label';label.textContent=a.name;$('labels').append(label);labels.push({el:label,position:new THREE.Vector3(a.x,1.9,a.z),group:g});}
  }
  areas.forEach((a,i)=>zone(i));
  // Parede de câmeras dos dois lados do videowall: 4 monitores de 55", dois de cada lado, com as 32 câmeras (oito por monitor).
  const cftvTex=[0,1,2,3].map(cftv);
  [[VWZ+2*PASSO+.35+TV_W/2,0],[VWZ-2*PASSO-.35-TV_W/2,1]].forEach(([cz,lado])=>{objectStart=interior.children.length;
    box(interior,VWX+.12,(R1+R2)/2,cz,.1,TV_H*2+.12,TV_W+.1,dark);
    for(let row=0;row<2;row++){const m=lado*2+row,y=row?R2:R1;box(interior,VWX+.2,y,cz,.06,TV_H+.02,TV_W+.02,dark);face(interior,VWX+.24,y,cz,TV_W,TV_H,cftvTex[m],Math.PI/2);}
    face(interior,VWX+.25,R1+TV_H/2+.16,cz,1.1,.14,plate('','Câmeras '+(lado*16+1)+' a '+(lado*16+16)),Math.PI/2);
    captureObject('cftv-'+(lado?'norte':'sul'),objectStart,VWX,0,cz,{kind:'screen',name:'Câmeras · '+(lado?'lado direito':'lado esquerdo')+' do videowall',description:'Dois monitores de 55" com o mosaico das câmeras da unidade, oito por monitor. Com o outro lado, somam os 4 monitores das 32 câmeras: a sala tem 12 monitores.'});});
  // Sala executiva: mesa para 10 pessoas, videoconferência e a visão estratégica (E0) na parede leste, com vista para o videowall pelo vidro.
  objectStart=interior.children.length;
  const EX=2.75,EZ=-1.5;box(interior,EX,.85,EZ,3.2,.1,1.3,wood);for(const x of [EX-1,EX+1])box(interior,x,.42,EZ,.5,.8,.8,metal);
  for(const x of [-1,0,1]){chair(interior,EX+x,EZ-1.0,Math.PI);chair(interior,EX+x,EZ+1.0);}chair(interior,EX-1.95,EZ,-Math.PI/2);
  captureObject('mesa-reuniao',objectStart,EX,0,EZ,{kind:'table',name:'Mesa da sala executiva',description:'Mesa para oito pessoas, com vista para o videowall pelas paredes de vidro.'});
  objectStart=interior.children.length;
  box(interior,XE-.2,2.1,EZ,.08,1.84,3.2,dark);liveScreens.push({mesh:face(interior,XE-.25,2.1,EZ,3.1,3.1*9/16,dashboard(E0?'E0 · '+E0.nome.toUpperCase():'SALA EXECUTIVA',2),-Math.PI/2),w:3.1,tv:E0});sphere(interior,XE-.25,3.12,EZ,.055,dark);face(interior,XE-.25,3.5,EZ,3,.5,lettering('SALA EXECUTIVA','Decisão e gestão de crise'),-Math.PI/2);
  captureObject('tela-reuniao',objectStart,XE-.2,0,EZ,{kind:'screen',name:'Tela da sala executiva',description:'Tela com a visão estratégica da unidade (E0), câmera de videoconferência e identificação da sala.'});
  // Salas de reunião 1 e 2 (oeste da recepção), cabines e sala técnica.
  [[2.62,'Reunião 1'],[5.38,'Reunião 2']].forEach(([z,nome],k)=>{objectStart=interior.children.length;const x=-8.85;
    box(interior,x,.85,z,1.9,.08,1.0,white);box(interior,x,.42,z,.4,.8,.4,metal);for(const dx of [-.5,.5]){chair(interior,x+dx,z-.85,Math.PI);chair(interior,x+dx,z+.85);}
    box(interior,XO+.16,1.9,z,.06,.9,1.6,dark);face(interior,XO+.2,1.9,z,1.5,.84,dashboard(nome.toUpperCase(),k+3),Math.PI/2);
    captureObject('reuniao-'+(k+1),objectStart,x,0,z,{kind:'table',name:'Sala de '+nome.toLowerCase(),description:'Sala para 4 a 6 pessoas, com tela para apresentação e acesso pela recepção.'});});
  [[-.48,'Cabine 1'],[.78,'Cabine 2']].forEach(([x,nome],k)=>{objectStart=interior.children.length;
    box(interior,x,.85,-7.85,1.0,.06,.55,wood);chair(interior,x,-7.05);monitor(interior,x,-7.95,screenTextures[k+1]);
    captureObject('cabine-'+(k+1),objectStart,x,0,-7.4,{kind:'desk',name:nome,description:'Cabine individual para chamadas e videoconferência rápida.'});});
  for(let i=0;i<2;i++){const x=-.55+i*.8;objectStart=interior.children.length;box(interior,x,1.4,-10.65,.7,2.0,.9,dark);for(let j=0;j<8;j++){box(interior,x,.55+j*.22,-10.19,.6,.15,.04,metal);for(let k=0;k<3;k++)box(interior,x-.2+k*.12,.55+j*.22,-10.16,.02,.02,.02,cool);}captureObject('rack-'+(i+1),objectStart,x,0,-10.65,{kind:'rack',name:'Rack '+(i+1),description:'Rede, controladora do videowall, gravador das câmeras e extensores KVM dos postos.'});}
  objectStart=interior.children.length;box(interior,.95,1.0,-10.75,.6,1.3,.6,dark);box(interior,.95,1.4,-10.44,.3,.2,.02,cool);captureObject('nobreak',objectStart,.95,0,-10.75,{kind:'rack',name:'Nobreak e baterias',description:'Nobreak online que mantém sala, videowall e racks ligados na falta de energia.'});
  objectStart=interior.children.length;box(interior,.15,3.4,-8.5,1.2,.4,.25,white);captureObject('apoio-tecnico',objectStart,.15,0,-8.5,{kind:'ac',name:'Climatização da sala técnica'});
  // Recepção existente: balcão e espera.
  objectStart=interior.children.length;
  box(interior,-1.5,.88,4.2,3.2,1.1,.9,wood);box(interior,-1.5,1.46,4.2,3.4,.08,1.1,white);chair(interior,-1.5,3.3,Math.PI);
  captureObject('recepcao',objectStart,-1.5,0,4.2,{kind:'desk',name:'Balcão de recepção',description:'Recepção existente, mantida na mesma posição.'});
  objectStart=interior.children.length;for(const x of [2.6,4.1]){box(interior,x,.55,5.6,1.3,.35,.75,fabric);box(interior,x,.9,5.95,1.3,.5,.12,fabric);}box(interior,3.35,.5,4.6,.9,.3,.6,wood);captureObject('espera',objectStart,3.35,0,5.3,{kind:'table',name:'Espera da recepção'});
  // Copa e banheiros existentes (representação simples).
  objectStart=interior.children.length;box(interior,7.5,.9,-10.8,6.4,.9,.6,white);box(interior,7.5,1.37,-10.8,6.5,.05,.65,stone);box(interior,10.6,1.1,-9.4,.7,1.8,.7,metal);box(interior,7.5,.85,-7.2,1.6,.06,.9,wood);for(const dx of [-.55,.55]){chair(interior,7.5+dx,-7.9,Math.PI);chair(interior,7.5+dx,-6.5);}
  captureObject('copa',objectStart,7.5,0,-8.5,{kind:'table',name:'Copa',description:'Copa existente, mantida.'});
  objectStart=interior.children.length;wallZ(interior,ZN,-8.75,2.65,wall,.06,2.2);for(const x of [2.0,3.3])box(interior,x,.6,-10.7,.45,.5,.6,white);wallX(interior,1.4,1.75,-8.75,wall,.08,2.2);wallX(interior,2.35,3.05,-8.75,wall,.08,2.2);wallX(interior,3.65,3.9,-8.75,wall,.08,2.2);box(interior,2.65,.95,-8.45,1.6,.15,.45,white);
  captureObject('banheiros',objectStart,2.65,0,-8,{kind:'wall',name:'Banheiros',description:'Dois banheiros e lavatório, em espaço reduzido no mesmo lugar.'});
  // Iluminação de teto, climatização e extintor.
  for(const x of [-9,-6,-3])for(const z of [-9,-5,-1]){box(roof,x,4.47,z,2.4,.07,.18,metal);box(roof,x,4.42,z,2.25,.02,.12,glow);}
  for(const [x,z] of [[2.75,-1.5],[-8.85,4],[-1.5,4]]){box(roof,x,4.47,z,2.4,.07,.18,metal);box(roof,x,4.42,z,2.25,.02,.12,glow);}
  for(const z of [-9.5,-4,.4]){objectStart=interior.children.length;box(interior,-1.35,3.4,z,.28,.45,1.5,white);box(interior,-1.5,3.25,z,.03,.06,1.2,dark);captureObject('climatizacao-'+(z<-6?'norte':z<0?'centro':'sul'),objectStart,-1.35,0,z,{kind:'ac',name:'Climatização da sala de operações'});}
  objectStart=interior.children.length;cylinder(interior,-10.85,.9,.9,.13,.7,red);captureObject('extintor',objectStart,-10.85,0,.9,{kind:'extinguisher',name:'Extintor'});
  // Nome de cada ambiente no piso (aparece com os rótulos ligados).
  for(const [nome,x,z] of [['Sala de operações',-6.45,-3.0],['Sala executiva',2.85,-3.6],['Circulação de serviço',1.4,-5.0],['Reunião 1',-8.85,3.1],['Reunião 2',-8.85,5.95],['Cabines',.15,-6.6],['Sala técnica',.15,-8.7],['Recepção',1.5,2.4],['Copa',7.5,-5.2],['Banheiros',2.65,-7.0],['Acesso coberto',-3,9]]){const el=document.createElement('span');el.className='zone-label room-label';el.textContent=nome;$('labels').append(el);labels.push({el,position:new THREE.Vector3(x,.6,z)});}
  const hemi=new THREE.HemisphereLight(0xdbeeff,0x687258,.8);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffedcf,1.5);sun.position.set(-18,29,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.far=90;sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;scene.add(sun);
  for(const p of [[-7,3.8,-8],[-3,3.8,-5],[2,3.8,-1.5],[-8.5,3.6,4],[0,3.6,4]]){const l=new THREE.PointLight(0xffeacb,.5,11,2);l.position.set(...p);scene.add(l);lights.push(l);}
  const views={exterior:{pos:[24,19,30],target:[-2.5,1.4,-1]},interior:{pos:[-1.6,2.8,.6],target:[-10.5,1.8,-5]},planta:{pos:[-2.8,40,.01],target:[-2.8,0,0]},videowall:{pos:[-4.6,3.1,-5],target:[-11,1.75,-5]},reuniao:{pos:[.7,3.2,1.05],target:[3.6,1.2,-2.4]},tecnica:{pos:[-1.5,13,6.5],target:[-4.5,.4,1.5]}};
  function describe(title,text,items=[],link=null){$('cap-t').textContent=title;$('cap-x').textContent=text;const capLink=$('cap-link');if(capLink){capLink.hidden=!link;if(link){capLink.href=link.href;capLink.textContent=link.text+' ↗';}}$('details').replaceChildren();const h=document.createElement('h3');h.textContent=title;$('details').append(h);const p=document.createElement('p');p.textContent=text;$('details').append(p);if(items.length){const ul=document.createElement('ul');items.forEach(v=>{const li=document.createElement('li');li.textContent=v;ul.append(li);});$('details').append(ul);}if(link){const a=document.createElement('a');a.className='det-link';a.href=link.href;a.target='_blank';a.rel='noopener';a.textContent=link.text+' ↗';$('details').append(a);}}
  function move(pos,target){const to=new THREE.Vector3(...pos),tt=new THREE.Vector3(...target);if(reduceMotion.matches){camera.position.copy(to);controls.target.copy(tt);controls.update();animation=null;return;}const d=camera.position.distanceTo(to)+controls.target.distanceTo(tt);animation={from:camera.position.clone(),targetFrom:controls.target.clone(),to,target:tt,start:performance.now(),dur:Math.min(1600,Math.max(650,d*38))};}
  function view(name,keepTour){if(name!=='exterior')startLiveWall();if(walking)walk(false,true);if(tour&&!keepTour)stopTour();currentView=name;selected=-1;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));document.querySelectorAll('[data-zone],[data-tv]').forEach(b=>b.setAttribute('aria-pressed','false'));roof.visible=name!=='planta'&&name!=='tecnica';front.visible=name==='exterior';$('roof-toggle').setAttribute('aria-pressed',roof.visible);move(views[name].pos,views[name].target);const info=VIEW_INFO;describe(...info[name]);}
  const VIEW_INFO={exterior:['Prédio atual','Prédio existente da cooperativa, com cerca de 22 × 22 m e acesso coberto ao sul. Recepção, copa e banheiros continuam onde estão; o COE ocupa o restante do espaço.'],interior:['Sala de operações','Nove mesas, com 18 lugares, em três fileiras voltadas para a parede oeste, onde ficam o videowall e as câmeras. Qualidade, Manutenção, PCP e administrativo e Melhoria contínua têm posição fixa; a Coordenação fica na mesa central da última fileira; as demais posições são da equipe do COE.'],planta:['Planta do prédio','Sala de operações, sala executiva, duas salas de reunião, duas cabines e sala técnica no espaço do COE; recepção, copa e banheiros mantidos, com acesso pela circulação de serviço.'],videowall:['Videowall e câmeras','Oito monitores de 55" (4 × 2) com as telas do painel e, dos dois lados, os 4 monitores das 32 câmeras. Clique numa tela para vê-la de perto. Dados demonstrativos.'],reuniao:['Sala executiva','Mesa para oito pessoas, videoconferência e a visão estratégica da unidade (E0). O vidro dá vista para o videowall. Dados demonstrativos.'],tecnica:['Apoio e reuniões','Duas salas de reunião menores, com acesso pela recepção. A sala técnica e as duas cabines ficam junto aos banheiros, pelo hall de serviço.']};
  function select(index){if(roomEditing){selectRoomObject('area-'+index);return;}const a=roomObjects.get('area-'+index).data;view('interior');selected=index;document.querySelectorAll('[data-zone]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.zone)===index));move([a.x+1.8,a.y+3.3,a.z+3.8],[a.x,a.y+1.0,a.z]);describe(a.name,a.description,a.items);}
  areas.forEach((a,i)=>{if(a.livre)return;const b=document.createElement('button');b.type='button';b.dataset.zone=i;b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src='../img/icones/'+a.icon;img.alt='';b.append(img,document.createTextNode(a.name));b.onclick=()=>select(i);$('zones').append(b);});
  // TVs: o clique na maquete ou na lista do painel de áreas aproxima a tela e oferece abri-la inteira.
  const visibleChain=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true;};
  function selectScreen(s){
    if(!s||!s.tv||!visibleChain(s.mesh))return;if(walking)walk(false,true);const base=s.tv.camada==='tática'?'videowall':'reuniao';if(currentView!==base)view(base);
    document.querySelectorAll('[data-tv]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tv)===liveScreens.indexOf(s))));
    scene.updateMatrixWorld(true);const p=s.mesh.getWorldPosition(new THREE.Vector3()),n=new THREE.Vector3(0,0,1).applyQuaternion(s.mesh.getWorldQuaternion(new THREE.Quaternion()));move(p.clone().addScaledVector(n,s.w*1.05).toArray(),p.toArray());
    const t=s.tv,lista=t.titulos.map(x=>x.charAt(0).toLowerCase()+x.slice(1)),telas=lista.length>1?lista.slice(0,-1).join(', ')+' e '+lista[lista.length-1]+', em rodízio a cada 10 segundos':lista[0];
    describe((t.camada==='tática'?'TV ':'')+t.n+' · '+t.nome,(t.camada==='tática'?'Camada tática do videowall: ':'Visão estratégica, na sala de coordenação: ')+telas+'. Dados demonstrativos.',[],{href:tvUrl(t),text:'Abrir esta tela'});
  }
  function screenAt(){const shown=liveScreens.filter(s=>s.tv&&visibleChain(s.mesh));if(!shown.length)return null;const first=raycaster.intersectObjects([interior],true).find(h=>h.object.material!==glass&&visibleChain(h.object));return first?shown.find(s=>s.mesh===first.object)||null:null;}
  if(liveScreens.some(s=>s.tv)){const list=document.createElement('div');list.className='tv-list';const h=document.createElement('h2');h.textContent='Telas do painel';list.append(h);
    liveScreens.forEach((s,i)=>{if(!s.tv)return;const b=document.createElement('button');b.type='button';b.dataset.tv=i;b.setAttribute('aria-pressed','false');const code=document.createElement('b');code.textContent=s.tv.n;b.append(code,document.createTextNode(s.tv.nome));b.onclick=()=>{startLiveWall();selectScreen(s);};list.append(b);});
    $('zones').after(list);}
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  $('roof-toggle').onclick=()=>{roof.visible=!roof.visible;front.visible=roof.visible&&currentView==='exterior'&&!walking;$('roof-toggle').setAttribute('aria-pressed',roof.visible);};
  $('labels-toggle').onclick=()=>{showLabels=!showLabels;$('labels-toggle').setAttribute('aria-pressed',showLabels);};
  function zoom(f){animation=null;camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();}
  $('zoom-in').onclick=()=>{if(!walking)zoom(.83);};$('zoom-out').onclick=()=>{if(!walking)zoom(1.2);};$('reset').onclick=()=>{if(walking)walk(false);else view(currentView);};
  function setAreas(open){$('areas').classList.toggle('closed',!open);$('areas-toggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('areas-open',open);if(open)$('areas-close').focus({preventScroll:true});else if(document.activeElement===$('areas-close'))$('areas-toggle').focus({preventScroll:true});}
  $('areas-toggle').onclick=()=>setAreas(true);$('areas-close').onclick=()=>setAreas(false);
  $('areas').addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();setAreas(false);}});
  // Apresentação guiada: percorre as seis vistas com a legenda de cada uma.
  const TOUR=['exterior','interior','videowall','planta'];
  function renderTour(){const on=!!tour;$('cap-tour').hidden=!on;$('caption').classList.toggle('touring',on);$('tour-toggle').setAttribute('aria-pressed',String(on));if(!on)return;$('cap-step').textContent='Apresentação · '+(tour.i+1)+' de '+TOUR.length;$('tour-play').textContent=tour.play?'❚❚':'▶';$('tour-play').setAttribute('aria-label',tour.play?'Pausar apresentação':'Continuar apresentação');$('tour-prev').disabled=tour.i===0;$('tour-next').disabled=tour.i===TOUR.length-1;}
  function stepTour(){clearTimeout(tour.timer);view(TOUR[tour.i],true);renderTour();if(tour.play&&tour.i<TOUR.length-1)tour.timer=setTimeout(()=>{if(!tour)return;tour.i++;stepTour();},7000);else if(tour.play){tour.play=false;renderTour();}}
  function startTour(){setAreas(false);tour={i:0,play:true,timer:0};stepTour();}
  function stopTour(){if(!tour)return;clearTimeout(tour.timer);tour=null;renderTour();}
  function pauseTour(){if(tour&&tour.play){clearTimeout(tour.timer);tour.play=false;renderTour();}}
  $('tour-toggle').onclick=()=>tour?stopTour():startTour();
  $('tour-stop').onclick=stopTour;$('tour-play').onclick=()=>{if(!tour)return;tour.play=!tour.play;if(tour.play&&tour.i===TOUR.length-1)tour.i=0;stepTour();};
  $('tour-prev').onclick=()=>{if(tour&&tour.i>0){tour.i--;tour.play=false;stepTour();}};$('tour-next').onclick=()=>{if(tour&&tour.i<TOUR.length-1){tour.i++;tour.play=false;stepTour();}};
  // Caminhar: primeira pessoa na altura dos olhos, teclado ou botões na tela.
  const EYE=1.8,walkKeys=new Set();let walkSaved=null,lastFrame=0;
  const KEYMAP={w:'f',arrowup:'f',s:'b',arrowdown:'b',a:'l',arrowleft:'l',d:'r',arrowright:'r'};
  function walk(on,silent){
    if(on===walking)return;walking=on;document.body.classList.toggle('walking',on);$('walk-toggle').setAttribute('aria-pressed',String(on));$('walk-hint').hidden=!on;walkKeys.clear();
    if(on){stopTour();setAreas(false);animation=null;walkSaved={min:controls.minDistance,max:controls.maxDistance,minP:controls.minPolarAngle,maxP:controls.maxPolarAngle,pan:controls.enablePan,zoom:controls.enableZoom,rs:controls.rotateSpeed};
      roof.visible=true;front.visible=false;$('roof-toggle').setAttribute('aria-pressed','true');currentView='interior';selected=-1;document.querySelectorAll('[data-view],[data-zone],[data-tv]').forEach(b=>b.setAttribute('aria-pressed','false'));
      const start=new THREE.Vector3(-1.8,EYE,-3.2),look=new THREE.Vector3(-11,EYE-.25,-5).sub(start).normalize();camera.position.copy(start);controls.target.copy(start).addScaledVector(look,.05);
      Object.assign(controls,{minDistance:.01,maxDistance:.06,enablePan:false,enableZoom:false,minPolarAngle:Math.PI*.2,maxPolarAngle:Math.PI*.82,rotateSpeed:.42});camera.fov=60;camera.updateProjectionMatrix();controls.update();
      describe('Caminhar pela sala','Ande com W, A, S, D ou as setas e arraste para olhar ao redor.');}
    else{Object.assign(controls,{minDistance:walkSaved.min,maxDistance:walkSaved.max,minPolarAngle:walkSaved.minP,maxPolarAngle:walkSaved.maxP,enablePan:walkSaved.pan,enableZoom:walkSaved.zoom,rotateSpeed:walkSaved.rs});camera.fov=44;camera.updateProjectionMatrix();if(!silent)view('interior');}
  }
  const fwd=new THREE.Vector3(),side=new THREE.Vector3(),step=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
  function walkStep(time){if(!walkKeys.size)return;const dt=Math.min(.05,Math.max(0,(time-lastFrame)/1000));camera.getWorldDirection(fwd);fwd.y=0;if(fwd.lengthSq()<1e-6)return;fwd.normalize();side.crossVectors(fwd,UP);step.set(0,0,0);
    if(walkKeys.has('f'))step.add(fwd);if(walkKeys.has('b'))step.sub(fwd);if(walkKeys.has('r'))step.add(side);if(walkKeys.has('l'))step.sub(side);if(!step.lengthSq())return;
    step.normalize().multiplyScalar((walkKeys.has('fast')?4.2:2.1)*dt);const nx=Math.min(5.1,Math.max(-10.8,camera.position.x+step.x)),nz=Math.min(10.8,Math.max(-10.9,camera.position.z+step.z));step.set(nx-camera.position.x,0,nz-camera.position.z);camera.position.add(step);controls.target.add(step);}
  $('walk-toggle').onclick=()=>walk(!walking);$('walk-exit').onclick=()=>walk(false);
  document.querySelectorAll('.walk-pad button').forEach(b=>{const k=b.dataset.k,off=()=>walkKeys.delete(k);b.addEventListener('pointerdown',e=>{e.preventDefault();walkKeys.add(k);});['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,off));});
  addEventListener('keydown',e=>{
    if(roomEditing||e.ctrlKey||e.metaKey||e.altKey||(e.target.closest&&e.target.closest('input,textarea,select')))return;const k=e.key.toLowerCase();
    if(walking){if(k==='escape'){walk(false);e.preventDefault();return;}if(KEYMAP[k]){walkKeys.add(KEYMAP[k]);e.preventDefault();}if(e.key==='Shift')walkKeys.add('fast');return;}
    if(k==='escape'&&tour){stopTour();return;}
    if(/^[1-4]$/.test(e.key)){view(['exterior','interior','planta','videowall'][Number(e.key)-1]);return;}
    if(k==='l')$('labels-toggle').click();else if(k==='p')$('tour-toggle').click();else if(k==='c')walk(true);
  });
  addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(KEYMAP[k])walkKeys.delete(KEYMAP[k]);if(e.key==='Shift')walkKeys.delete('fast');});
  addEventListener('blur',()=>walkKeys.clear());
  // a dica some na primeira interação ou depois de alguns segundos
  const hideHelp=()=>$('help').classList.add('gone');setTimeout(hideHelp,9000);canvas.addEventListener('pointerdown',hideHelp,{once:true});
  $('theme').onclick=()=>{document.documentElement.dataset.theme=night?'light':'dark';};
  function applyTheme(){night=document.documentElement.dataset.theme==='dark';document.querySelector('header img').src='../img/marca/holambra'+(night?'-escuro':'')+'.svg';scene.background=new THREE.Color(night?0x081522:0xc9dae4);scene.fog=new THREE.Fog(night?0x081522:0xc9dae4,70,140);sun.intensity=night?.18:1.5;hemi.intensity=night?.35:.8;lights.forEach(l=>l.intensity=night?1.7:1.2);renderer.toneMappingExposure=night?1.3:1.05;liveThemeToTvs();}
  new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});applyTheme();
  // Configurador da sala: overrides serializáveis sobre a maquete aprovada (a geometria original é a referência).
  const originalColors={wallColor:wall.color.clone(),floorColor:floorMat.color.clone(),accentColor:navy.color.clone()};
  const selectionBox=new THREE.BoxHelper(new THREE.Object3D(),0xef3340);selectionBox.visible=false;selectionBox.material.depthTest=false;selectionBox.material.transparent=true;selectionBox.material.opacity=.9;selectionBox.renderOrder=1000;scene.add(selectionBox);
  const hoverBox=new THREE.BoxHelper(new THREE.Object3D(),0x5aa9e6);hoverBox.visible=false;hoverBox.material.depthTest=false;hoverBox.material.transparent=true;hoverBox.material.opacity=.55;hoverBox.renderOrder=999;scene.add(hoverBox);
  // Grade de 0,5 m sobre o piso interno, visível apenas na configuração.
  const FLOOR_Y=.46,grid=new THREE.Group();grid.visible=false;scene.add(grid);
  (function(){const minor=[],major=[];for(let x=-12;x<=12.001;x+=.5){(Math.abs(x%1)<.01?major:minor).push(x,FLOOR_Y,-8.3,x,FLOOR_Y,8.3);}for(let z=-8;z<=8.001;z+=.5){(Math.abs(z%1)<.01?major:minor).push(-12,FLOOR_Y,z,12,FLOOR_Y,z);}
    for(const [points,color,opacity] of [[minor,0x7d97ad,.28],[major,0x2f5f8a,.5]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));l.renderOrder=2;grid.add(l);}})();
  let snapStep=.25,dragState=null,follow=null,hoverId=null;
  const NUM=[['x',-50,50],['y',-20,20],['z',-50,50],['rotation',-360,360],['scale',.2,3],['sx',.2,5],['sy',.2,5],['sz',.2,5],['screen',0,7]];
  function selectRoomObject(id){roomSelection=roomObjects.has(id)?id:null;updateSelectionBox();dispatchEvent(new CustomEvent('coe:room-selection',{detail:roomSelection}));}
  const shown=item=>!!(item&&item.data.visible&&!item.data.removed);
  function updateSelectionBox(){const item=roomObjects.get(roomSelection);selectionBox.visible=!!(roomEditing&&shown(item));if(selectionBox.visible)selectionBox.setFromObject(item.group);const hover=roomObjects.get(hoverId);hoverBox.visible=!!(roomEditing&&hoverId!==roomSelection&&shown(hover));if(hoverBox.visible)hoverBox.setFromObject(hover.group);}
  function cleanRecord(value){
    const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const [key,min,max] of NUM)if(typeof value[key]==='number'&&Number.isFinite(value[key]))out[key]=key==='screen'?Math.round(Math.min(max,Math.max(min,value[key]))):Math.min(max,Math.max(min,value[key]));
    for(const key of ['visible','removed'])if(typeof value[key]==='boolean')out[key]=value[key];
    if(typeof value.name==='string')out.name=value.name.slice(0,200);
    if(typeof value.description==='string')out.description=value.description.slice(0,5000);
    if(Array.isArray(value.items))out.items=value.items.filter(v=>typeof v==='string').slice(0,50).map(v=>v.slice(0,1000));
    if(typeof value.color==='string'&&/^#[a-f\d]{6}$/i.test(value.color))out.color=value.color.toLowerCase();
    return out;
  }
  function cleanRoom(value){
    const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
    const objects={};if(value.objects&&typeof value.objects==='object')for(const [id,record] of Object.entries(value.objects)){const item=roomObjects.get(id);if(item&&!item.added){const clean=cleanRecord(record);if(Object.keys(clean).length)objects[id]=clean;}}if(Object.keys(objects).length)result.objects=objects;
    const ids=new Set([...roomObjects.values()].filter(v=>!v.added).map(v=>v.id));
    if(Array.isArray(value.added)){
      const added=[];for(const item of value.added.slice(0,300-Object.keys(objects).length)){
        if(!item||typeof item.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(item.id)||['__proto__','constructor','prototype'].includes(item.id)||ids.has(item.id)||!Object.hasOwn(kindNames,item.kind))continue;
        ids.add(item.id);const record={id:item.id,kind:item.kind,...cleanRecord(item)};delete record.removed;const source=roomObjects.get(item.sourceId);if(source&&!source.added)record.sourceId=source.id;added.push(record);
      }if(added.length)result.added=added;
    }
    if(value.appearance&&typeof value.appearance==='object'){const appearance={};for(const key of Object.keys(originalColors))if(/^#[a-f\d]{6}$/i.test(value.appearance[key]))appearance[key]=value.appearance[key].toLowerCase();if(Object.keys(appearance).length)result.appearance=appearance;}
    return result;
  }
  // Catálogo: cada tipo constrói sua geometria a partir do piso (y = 0), olhando para +Z.
  const boardTex=texture((c,w,h)=>{c.fillStyle='#f7f9fb';c.fillRect(0,0,w,h);c.fillStyle='#003a70';c.font='bold 22px Arial';c.fillText('GESTÃO À VISTA',20,34);const cols=['A FAZER','EM ANDAMENTO','CONCLUÍDO'];cols.forEach((t,i)=>{const x=20+i*162;c.fillStyle='#dfe7ee';c.fillRect(x,50,150,h-66);c.fillStyle='#17364e';c.font='bold 13px Arial';c.fillText(t,x+8,70);for(let k=0;k<3-(i===2?1:0);k++){c.fillStyle=['#ffd66b','#9ed9e4','#f6a6ad','#b9e3a8'][(i+k)%4];c.fillRect(x+10+(k%2)*8,84+k*44,120,34);c.fillStyle='#00000030';c.fillRect(x+18+(k%2)*8,96+k*44,80,4);c.fillRect(x+18+(k%2)*8,106+k*44,56,4);}});},512,256);
  const ledTex=dashboard('PAINEL DE SITUAÇÃO',0);
  function screenFace(g,ctx,x,y,z,w,h,offset=0){const o=face(g,x,y,z,w,h,wallTextures[offset%8]);ctx.screens.push({mesh:o,offset});return o;}
  function wallScreen(g,ctx,w,h,y=2.2){box(g,0,y,-.02,w+.06,h+.06,.06,dark);screenFace(g,ctx,0,y,.015,w,h);box(g,0,y,-.07,w*.4,h*.3,.04,metal);}
  const BUILD={
    tv55:(g,c)=>wallScreen(g,c,1.21,.68),
    tv75:(g,c)=>wallScreen(g,c,1.66,.93,2.3),
    tvstand:(g,c)=>{box(g,0,.48,0,.9,.06,.62,dark);for(const x of [-.3,.3])cylinder(g,x,.52,.22,.05,.04,dark);cylinder(g,0,1.12,0,.045,1.3,metal);box(g,0,1.78,-.02,1.27,.74,.06,dark);screenFace(g,c,0,1.78,.015,1.21,.68);},
    vw2x2:(g,c)=>{box(g,0,2.35,-.05,2.52,1.46,.1,dark);for(let r=0;r<2;r++)for(let k=0;k<2;k++)screenFace(g,c,-.61+k*1.23,2.0+r*.7,.01,1.2,.67,r*2+k);},
    vw3x2:(g,c)=>{box(g,0,2.35,-.05,3.76,1.46,.1,dark);for(let r=0;r<2;r++)for(let k=0;k<3;k++)screenFace(g,c,-1.23+k*1.23,2.0+r*.7,.01,1.2,.67,r*3+k);},
    ledpanel:(g,c)=>{box(g,0,2.45,-.06,3.7,2.1,.12,dark);screenFace(g,c,0,2.45,.005,3.6,2.0);box(g,0,1.36,-.06,3.7,.08,.14,metal);},
    screen:(g,c)=>{box(g,0,1.8,0,3.2,1.8,.1,dark);screenFace(g,c,0,1.8,.06,3.1,1.7);cylinder(g,0,.65,0,.06,1.2,metal);box(g,0,.12,0,1,.1,.7,dark);},
    board:(g,c)=>{box(g,0,1.9,-.03,1.86,1.16,.05,c.accent);face(g,0,1.9,.0,1.78,1.08,boardTex);box(g,0,1.3,.06,1.6,.04,.1,metal);},
    desk:g=>{box(g,0,.87,0,3.9,.12,1.4,white);for(const x of [-1.4,1.4])box(g,x,.44,0,.09,.8,.9,metal);for(const x of [-1,1]){monitor(g,x-.34,-.1,screenTextures[1]);monitor(g,x+.34,-.1,screenTextures[3]);phone(g,x-.68,.27);chair(g,x,1);}},
    desk1:g=>{box(g,0,.87,0,1.7,.1,.85,white);for(const x of [-.75,.75])box(g,x,.44,0,.07,.8,.75,metal);box(g,0,.65,-.38,1.6,.3,.05,navy);monitor(g,-.33,-.15,screenTextures[2]);monitor(g,.33,-.15,screenTextures[3]);const k=face(g,0,.935,.18,.5,.18,keys);k.rotation.x=-Math.PI/2;chair(g,0,.85);},
    chair:g=>chair(g,0,0),
    table:g=>{box(g,0,.85,0,3.5,.12,1.5,wood);box(g,0,.42,0,.5,.8,.7,metal);for(const x of [-1.2,0,1.2]){chair(g,x,1.15);chair(g,x,-1.15,Math.PI);}},
    roundtable:g=>{cylinder(g,0,.86,0,.75,.06,white);cylinder(g,0,.48,0,.07,.8,metal);cylinder(g,0,.09,0,.4,.05,metal);for(let i=0;i<4;i++){const a=i*Math.PI/2;chair(g,Math.sin(a)*1.15,Math.cos(a)*1.15,a);}},
    sofa:(g,c)=>{box(g,0,.62,0,2.1,.32,.9,c.accent);box(g,0,1.02,-.36,2.1,.55,.2,c.accent);for(const x of [-1.0,1.0])box(g,x,.8,0,.14,.45,.9,c.accent);for(const x of [-.5,.5])box(g,x,.82,.02,.94,.1,.78,fabric);},
    armchair:(g,c)=>{box(g,0,.62,0,.9,.32,.85,c.accent);box(g,0,1.02,-.34,.9,.55,.18,c.accent);for(const x of [-.4,.4])box(g,x,.8,0,.12,.42,.85,c.accent);},
    cabinet:(g,c)=>{box(g,0,1.4,0,1.2,1.9,.5,c.accent);box(g,0,1.4,.255,.012,1.82,.01,metal);for(const x of [-.06,.06])box(g,x,1.45,.27,.02,.24,.03,metal);},
    rack:g=>{box(g,0,1.6,0,1.25,2.4,1.2,dark);for(let j=0;j<9;j++){box(g,0,.65+j*.22,.65,1.1,.15,.07,metal);box(g,-.4,.65+j*.22,.7,.03,.03,.02,cool);}},
    ac:g=>{box(g,0,3.8,0,1.5,.45,.28,white);box(g,0,3.65,.17,1.2,.06,.03,dark);},
    printer:g=>{box(g,0,.62,0,.7,.4,.55,metal);box(g,0,1.0,0,.62,.36,.5,white);box(g,0,1.2,.05,.5,.03,.32,dark);box(g,0,1.02,.26,.4,.06,.02,dark);},
    camera:g=>{for(let i=0;i<3;i++){const a=i*2.094;const leg=box(g,Math.sin(a)*.18,.75,Math.cos(a)*.18,.03,.7,.03,dark);leg.rotation.set(Math.cos(a)*.25,0,-Math.sin(a)*.25);}cylinder(g,0,1.15,0,.03,.4,metal);box(g,0,1.42,0,.5,.1,.1,dark);box(g,0,1.42,.055,.1,.06,.01,cool);},
    extinguisher:g=>{cylinder(g,0,.9,0,.13,.7,red);cylinder(g,0,1.3,0,.04,.12,dark);box(g,0,1.85,-.05,.3,.3,.02,red);},
    wall:(g,c)=>{box(g,0,2.1,0,3,3.5,.12,c.accent);},
    glasswall:g=>{box(g,0,2.05,0,3,3.1,.05,glass);box(g,0,.5,0,3.02,.08,.09,metal);box(g,0,3.62,0,3.02,.08,.09,metal);for(const x of [-1.5,1.5])box(g,x,2.05,0,.08,3.2,.09,metal);},
    zone:(g,c)=>{const m=box(g,0,FLOOR_Y,0,3,.012,3,c.accent);m.castShadow=false;const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3,.012,3)),new THREE.LineBasicMaterial({color:0x17364e}));e.position.set(0,FLOOR_Y+.008,0);g.add(e);},
    plant:g=>{cylinder(g,0,.65,0,.38,.7,stone);cylinder(g,0,1.25,0,.06,.8,wood);for(let i=0;i<5;i++)sphere(g,Math.sin(i*1.25)*.25,1.65+(i%2)*.2,Math.cos(i*1.25)*.25,.4,leaves);},
    logo:(g,c)=>{box(g,0,2.6,-.04,2.5,.85,.06,c.accent);face(g,0,2.6,.0,2.4,.6,lettering('COE','Centro Operacional de Excelência'));}
  };
  function accentFor(kind){const info=CATALOG.find(v=>v.kind===kind);if(!info||!info.color)return null;const m=new THREE.MeshStandardMaterial({color:new THREE.Color(info.color).convertSRGBToLinear(),roughness:kind==='zone'?.9:.7,metalness:0});if(kind==='zone'){m.transparent=true;m.opacity=.42;m.depthWrite=false;}return m;}
  function createEquipment(data){
    const source=roomObjects.get(data.sourceId);let g;const ctx={screens:[],accent:accentFor(data.kind)};
    if(source&&!source.added){g=source.group.clone(true);const tvs=[];g.traverse(o=>{delete o.userData.roomId;delete o.userData.area;if(o.isCSS3DObject)tvs.push(o);});tvs.forEach(o=>{const m=o.parent;m.remove(o);if(demoMats.has(m))m.material=new THREE.MeshBasicMaterial({map:wallTextures[0],transparent:true,side:THREE.DoubleSide});});g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.setScalar(1);g.visible=true;}
    else{g=new THREE.Group();(BUILD[data.kind]||BUILD.desk)(g,ctx);}
    interior.add(g);registerObject(data.id,g,{...data,name:kindNames[data.kind]},true);const item=roomObjects.get(data.id);item.screens=ctx.screens;item.accent=ctx.accent;
    if(data.kind==='zone'){const el=document.createElement('span');el.className='zone-label room-zone-label';$('labels').append(el);item.label={el,position:new THREE.Vector3(),group:g,item};labels.push(item.label);}
    return item;
  }
  function disposeItem(item){interior.remove(item.group);if(item.label){item.label.el.remove();const i=labels.indexOf(item.label);if(i>=0)labels.splice(i,1);}}
  function applyRoomState(value){
    const next=cleanRoom(value),added=new Map((next.added||[]).map(v=>[v.id,v]));
    for(const [id,item] of roomObjects)if(item.added&&(!added.has(id)||added.get(id).kind!==item.kind||added.get(id).sourceId!==item.sourceId)){disposeItem(item);roomObjects.delete(id);}
    for(const data of added.values())if(!roomObjects.has(data.id))createEquipment(data);
    for(const item of roomObjects.values()){
      const data=item.added?added.get(item.id):(next.objects||{})[item.id];item.data={...item.defaults,...data};const d=item.data;
      item.group.position.set(d.x,d.y,d.z);item.group.rotation.y=THREE.MathUtils.degToRad(d.rotation);item.group.scale.set(d.scale*d.sx,d.scale*d.sy,d.scale*d.sz);item.group.visible=d.visible&&!d.removed;
      if(item.screens&&item.screens.length){const base=Number.isInteger(d.screen)?d.screen:0;for(const s of item.screens){const t=wallTextures[(base+s.offset)%8];if(s.mesh.material.map!==t){s.mesh.material.map=t;s.mesh.material.needsUpdate=true;}}}
      if(item.accent){const info=CATALOG.find(v=>v.kind===item.kind);item.accent.color.set(d.color||info.color).convertSRGBToLinear();}
      if(item.label&&item.added)item.label.el.textContent=d.name;
      if(!item.added&&item.id.startsWith('area-')){const index=Number(item.id.slice(5)),label=labels[index],button=document.querySelector('[data-zone="'+index+'"]');label.el.textContent=d.name;button.lastChild.nodeValue=d.name;button.hidden=!(d.visible&&!d.removed);}
    }
    for(const [key,material] of [['wallColor',wall],['floorColor',floorMat],['accentColor',navy]]){if(next.appearance&&next.appearance[key])material.color.set(next.appearance[key]).convertSRGBToLinear();else material.color.copy(originalColors[key]);}
    roomState=next;if(!roomObjects.has(roomSelection))roomSelection=null;if(!roomObjects.has(hoverId))hoverId=null;scene.updateMatrixWorld(true);updateSelectionBox();
    if(selected>=0){const data=roomObjects.get('area-'+selected).data;describe(data.name,data.description,data.items);}
    return JSON.parse(JSON.stringify(roomState));
  }
  function objectSize(id){const item=roomObjects.get(id);if(!shown(item))return null;const b=new THREE.Box3().setFromObject(item.group),s=b.getSize(new THREE.Vector3());return {w:+s.x.toFixed(2),d:+s.z.toFixed(2),h:+Math.max(0,b.max.y-FLOOR_Y).toFixed(2)};}
  function viewCenter(){const dir=new THREE.Vector3();camera.getWorldDirection(dir);let p;if(Math.abs(dir.y)>.05){const t=(FLOOR_Y-camera.position.y)/dir.y;p=t>0?camera.position.clone().addScaledVector(dir,Math.min(t,25)):controls.target.clone();}else p=controls.target.clone();return {x:+Math.min(11,Math.max(-11.5,p.x)).toFixed(2),z:+Math.min(7.5,Math.max(-7.5,p.z)).toFixed(2)};}
  const snap=v=>snapStep>0?Math.round(v/snapStep)*snapStep:Math.round(v*100)/100;
  function capture(){renderer.render(scene,camera);canvas.toBlob(blob=>{if(blob)window.coeBaixar(blob,'sala-coe-'+(roomEditing?'layout':currentView)+'.png');});}
  $('capture').onclick=capture;
  window.COE_ROOM_MODEL={
    getState:()=>JSON.parse(JSON.stringify(roomState)),applyState:applyRoomState,
    getObjects:()=>[...roomObjects.values()].map(v=>({id:v.id,kind:v.kind,icon:v.icon,added:v.added,sourceId:v.sourceId,...JSON.parse(JSON.stringify(v.data)),hasScreen:!!(v.screens&&v.screens.length),colorable:!!v.accent})),
    getSelection:()=>roomSelection,select:selectRoomObject,catalog:CATALOG.map(v=>({...v})),kindNames:{...kindNames},screenNames:SCREEN_NAMES.slice(),
    setMode(editing){roomEditing=editing===true;if(roomEditing){walk(false,true);stopTour();setAreas(false);}grid.visible=roomEditing;if(!roomEditing){follow=null;dragState=null;hoverId=null;controls.enabled=true;canvas.style.cursor='';}document.body.classList.toggle('room-editing-3d',roomEditing);updateSelectionBox();canvas.setAttribute('aria-label',roomEditing?'Maquete da sala em configuração: clique em um item para selecionar e arraste para mover.':'Maquete interativa da sala do COE');},
    focus(id){const item=roomObjects.get(id);if(!shown(item))return;if(currentView==='exterior')view('interior');/* enquadra pela frente do elemento, a uma distância proporcional ao tamanho */const b=new THREE.Box3().setFromObject(item.group),c=b.getCenter(new THREE.Vector3()),sz=b.getSize(new THREE.Vector3()),r=Math.max(3,Math.max(sz.x,sz.y,sz.z)*1.25),a=item.group.rotation.y,dir=new THREE.Vector3(Math.sin(a)*.85+Math.cos(a)*.25,0,Math.cos(a)*.85-Math.sin(a)*.25).normalize(),pos=c.clone().addScaledVector(dir,r);pos.y=c.y+r*.45;if(roof.visible){/* com cobertura, a câmera fica dentro da sala */pos.y=Math.min(4.1,Math.max(1.6,pos.y));pos.x=Math.min(11.5,Math.max(-11.5,pos.x));pos.z=Math.min(8.1,Math.max(-7.7,pos.z));}move(pos.toArray(),c.toArray());},
    view:name=>{if(views[name])view(name);},currentView:()=>currentView,busy:()=>!!animation,zoom,capture,
    size:objectSize,center:viewCenter,setSnap(step){snapStep=step>0?step:0;},
    project(id){const item=roomObjects.get(id);if(!shown(item))return null;const b=new THREE.Box3().setFromObject(item.group),c=b.getCenter(new THREE.Vector3()).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(c.x*.5+.5)*r.width,y:r.top+(-c.y*.5+.5)*r.height};},
    setWallSnap(on){wallSnap=on!==false;},
    follow(id){follow=roomObjects.has(id)?id:null;},cancelFollow(){const id=follow;follow=null;return id;},
    colors:{wallColor:'#dce2e5',floorColor:'#ffffff',accentColor:'#003a70'}
  };
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let down=null;
  function setPointer(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function hitRoom(e){setPointer(e);const groups=[...roomObjects.values()].filter(shown).map(v=>v.group);for(const hit of raycaster.intersectObjects(groups,true)){let o=hit.object;while(o&&o.userData.roomId===undefined)o=o.parent;if(o)return o.userData.roomId;}return null;}
  function floorPoint(e,y){setPointer(e);floorPlane.constant=-y;const p=new THREE.Vector3();return raycaster.ray.intersectPlane(floorPlane,p)?p:null;}
  // Ímã de parede: TVs, painéis, quadros e climatização encostam na face mais próxima e ficam voltados para o ambiente.
  const WALL_KINDS=new Set(['tv55','tv75','vw2x2','vw3x2','ledpanel','board','logo','ac']);let wallSnap=true;
  const SHELL_FACES=[{a:'x',c:-11.88,n:1,lo:-8.28,hi:8.28},{a:'x',c:11.88,n:-1,lo:-8.28,hi:8.28},{a:'z',c:-8.28,n:1,lo:-11.88,hi:11.88},{a:'z',c:8.37,n:-1,lo:-11.88,hi:11.88}];
  function wallFaces(except){const faces=SHELL_FACES.slice();for(const item of roomObjects.values()){if(item.id===except||!shown(item)||(item.kind!=='wall'&&item.kind!=='glasswall'))continue;const b=new THREE.Box3().setFromObject(item.group);if(b.isEmpty())continue;
    if(b.max.x-b.min.x>=b.max.z-b.min.z)faces.push({a:'z',c:b.max.z,n:1,lo:b.min.x,hi:b.max.x},{a:'z',c:b.min.z,n:-1,lo:b.min.x,hi:b.max.x});else faces.push({a:'x',c:b.max.x,n:1,lo:b.min.z,hi:b.max.z},{a:'x',c:b.min.x,n:-1,lo:b.min.z,hi:b.max.z});}return faces;}
  function snapToWall(item,p){let best=null;for(const f of wallFaces(item.id)){const along=f.a==='z'?p.x:p.z,across=f.a==='z'?p.z:p.x;if(along<f.lo-.4||along>f.hi+.4||(across-f.c)*f.n<-.25)continue;const d=Math.abs(across-f.c);if(d<1.3&&(!best||d<best.d))best={f,d,along};}
    if(!best)return null;const f=best.f,along=f.hi-f.lo>.6?Math.min(f.hi-.3,Math.max(f.lo+.3,snap(best.along))):(f.lo+f.hi)/2,rotation=f.a==='z'?(f.n>0?0:180):(f.n>0?90:-90);
    return f.a==='z'?{x:along,z:f.c+f.n*.1,rotation}:{x:f.c+f.n*.1,z:along,rotation};}
  function moveTo(item,p,offset,free){
    if(!free&&wallSnap&&WALL_KINDS.has(item.kind)){const w=snapToWall(item,p);if(w){item.group.position.x=w.x;item.group.position.z=w.z;item.group.rotation.y=THREE.MathUtils.degToRad(w.rotation);scene.updateMatrixWorld(true);updateSelectionBox();return {x:+w.x.toFixed(2),z:+w.z.toFixed(2),rotation:w.rotation,wall:true};}}
    item.group.rotation.y=THREE.MathUtils.degToRad(item.data.rotation);
    const x=Math.min(50,Math.max(-50,snap(p.x+offset.x))),z=Math.min(50,Math.max(-50,snap(p.z+offset.z)));item.group.position.x=x;item.group.position.z=z;scene.updateMatrixWorld(true);updateSelectionBox();return {x:+x.toFixed(2),z:+z.toFixed(2)};}
  canvas.addEventListener('pointerdown',e=>{
    down={x:e.clientX,y:e.clientY};animation=null;if(tour)pauseTour();if(!roomEditing||e.button!==0)return;
    if(follow){const item=roomObjects.get(follow);follow=null;if(item){const p=floorPoint(e,item.group.position.y);const pos=p?moveTo(item,p,new THREE.Vector3(),e.altKey):{x:item.group.position.x,z:item.group.position.z};dispatchEvent(new CustomEvent('coe:room-move',{detail:{id:item.id,...pos,placed:true,again:e.shiftKey}}));}controls.enabled=false;dragState={id:null};return;}
    const id=hitRoom(e);if(!id)return;if(id!==roomSelection)selectRoomObject(id);
    const item=roomObjects.get(id),p=floorPoint(e,item.group.position.y);if(!p)return;
    dragState={id,offset:item.group.position.clone().sub(p),moved:false,start:{x:item.group.position.x,z:item.group.position.z}};controls.enabled=false;try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!roomEditing){if(e.buttons||walking||currentView==='exterior'){if(canvas.style.cursor)canvas.style.cursor='';return;}setPointer(e);canvas.style.cursor=raycaster.intersectObjects(liveScreens.filter(s=>s.tv&&visibleChain(s.mesh)).map(s=>s.mesh),false).length?'pointer':'';return;}
    if(follow&&!e.buttons){const item=roomObjects.get(follow);if(!item){follow=null;return;}const p=floorPoint(e,item.group.position.y);if(p){const pos=moveTo(item,p,new THREE.Vector3(),e.altKey);dispatchEvent(new CustomEvent('coe:room-dragging',{detail:{id:item.id,...pos}}));}canvas.style.cursor='copy';return;}
    if(dragState&&dragState.id){const item=roomObjects.get(dragState.id);const p=item&&floorPoint(e,item.group.position.y);if(!p)return;const pos=moveTo(item,p,dragState.offset,e.altKey);dragState.last=pos;if(Math.hypot(pos.x-dragState.start.x,pos.z-dragState.start.z)>.001||pos.wall)dragState.moved=true;canvas.style.cursor='grabbing';dispatchEvent(new CustomEvent('coe:room-dragging',{detail:{id:item.id,...pos}}));return;}
    if(e.buttons)return;const id=hitRoom(e);if(id!==hoverId){hoverId=id;updateSelectionBox();}canvas.style.cursor=id?'grab':'';
  });
  function endDrag(e){if(!dragState)return;const state=dragState;dragState=null;controls.enabled=true;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}canvas.style.cursor=hoverId?'grab':'';if(state.id&&state.moved){const item=roomObjects.get(state.id),last=state.last||{};dispatchEvent(new CustomEvent('coe:room-move',{detail:{id:state.id,x:+item.group.position.x.toFixed(2),z:+item.group.position.z.toFixed(2),...(last.rotation!==undefined?{rotation:last.rotation}:{})}}));}}
  canvas.addEventListener('pointerup',e=>{
    const wasDrag=dragState;endDrag(e);
    if(!down||e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;
    if(roomEditing){if(!wasDrag&&!hitRoom(e))selectRoomObject(null);return;}
    if(currentView==='exterior')return;setPointer(e);const tv=screenAt();if(tv){selectScreen(tv);return;}const hit=raycaster.intersectObjects(selectable.filter(g=>g.visible),true)[0];if(hit){let object=hit.object;while(object&&object.userData.area===undefined)object=object.parent;if(object)select(object.userData.area);}
  });
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('dblclick',e=>{if(walking)return;setPointer(e);if(roomEditing){const id=hitRoom(e);if(id)window.COE_ROOM_MODEL.focus(id);return;}const hit=raycaster.intersectObjects([interior,shell,landscape,roof,front].filter(o=>o.visible),true).find(h=>h.object.visible);if(!hit)return;const p=hit.point,off=camera.position.clone().sub(controls.target);off.setLength(Math.min(9,Math.max(3.5,off.length()*.6)));move(p.clone().add(off).toArray(),p.toArray());});
  canvas.addEventListener('pointerleave',()=>{if(hoverId&&!dragState){hoverId=null;updateSelectionBox();}});
  canvas.addEventListener('keydown',e=>{if(walking)return;if(roomEditing&&roomSelection&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)){e.preventDefault();e.stopPropagation();animation=null;if(e.key==='Home')view(currentView);else if(e.key==='+'||e.key==='-')zoom(e.key==='+'?.83:1.2);else{const delta=e.key==='ArrowLeft'?-.06:e.key==='ArrowRight'?.06:0;const offset=camera.position.clone().sub(controls.target);if(delta)offset.applyAxisAngle(new THREE.Vector3(0,1,0),delta);else offset.y=Math.max(.5,offset.y+(e.key==='ArrowUp'?.5:-.5));camera.position.copy(controls.target).add(offset);controls.update();}}});
  // Com muitos WebGL abertos (cada TV ao vivo cria os seus), o navegador derruba o mais antigo e
  // costuma devolvê-lo em seguida; o Three.js refaz o contexto sozinho. Só vira erro se não voltar.
  let lostTimer=0;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearTimeout(lostTimer);lostTimer=setTimeout(()=>fail('A sessão gráfica foi interrompida. Recarregue o modelo para continuar.'),10000);});
  canvas.addEventListener('webglcontextrestored',()=>clearTimeout(lostTimer));
  function resize(){const r=$('scene').getBoundingClientRect();renderer.setSize(r.width,r.height);if(cssRenderer)cssRenderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe($('scene'));canvas.addEventListener('pointerdown',startLiveWall,{once:true});resize();camera.position.fromArray(views.exterior.pos);controls.target.fromArray(views.exterior.target);controls.update();
  function frame(time){requestAnimationFrame(frame);if(document.hidden||window.COE_MODELO_ATIVO===false)return;if(walking)walkStep(time);lastFrame=time;if(animation){const t=Math.min(1,(time-animation.start)/(animation.dur||850)),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;camera.position.lerpVectors(animation.from,animation.to,ease);controls.target.lerpVectors(animation.targetFrom,animation.target,ease);if(t===1)animation=null;}controls.update();for(const label of labels){const point=label.group?label.group.localToWorld(new THREE.Vector3(0,label.item?FLOOR_Y+.05:1.9,0)):label.position;const p=point.clone().project(camera),visible=showLabels&&(!label.group||label.group.visible)&&currentView!=='exterior'&&!(currentView!=='interior'&&label.group&&!label.item)&&(currentView!=='videowall'||!!label.item)&&p.z<1&&p.z>0&&Math.abs(p.x)<.95&&Math.abs(p.y)<.95;label.el.hidden=!visible||(label.item&&!roomEditing&&!showLabels);if(visible){label.el.style.left=(p.x*.5+.5)*innerWidth+'px';label.el.style.top=(-p.y*.5+.5)*innerHeight+'px';}}const tag=$('room-tag');if(tag){const item=roomObjects.get(roomSelection);let ok=roomEditing&&shown(item)&&!follow&&!(dragState&&dragState.id);if(ok){/* fica acima da projeção inteira do elemento, para nunca cobrir o ponto clicado */const b=new THREE.Box3().setFromObject(item.group),c=new THREE.Vector3();let top=Infinity,sx=0,n=0;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){c.set(x,y,z).project(camera);if(c.z>0&&c.z<1){top=Math.min(top,c.y*-1);sx+=c.x;n++;}}const p={x:n?sx/n:0,y:-top,z:n?.5:2};p.y=Math.min(.8,p.y);ok=n>0&&Math.abs(p.x)<.98&&p.y>-.98;if(ok){/* a barra fica entre o catálogo e o painel do item, sem ficar escondida */let x=(p.x*.5+.5)*innerWidth;const half=(tag.offsetWidth||200)/2,cat=$('room-catalog'),ed=$('room-editor'),lo=(cat&&!cat.hidden&&innerWidth>760?cat.getBoundingClientRect().right:0)+8+half,hi=(ed&&!ed.hidden&&innerWidth>760?ed.getBoundingClientRect().left:innerWidth)-8-half;if(hi>lo)x=Math.min(hi,Math.max(lo,x));tag.style.left=x+'px';tag.style.top=Math.max(130,(-p.y*.5+.5)*innerHeight-4)+'px';}}tag.hidden=!ok;}renderer.render(scene,camera);if(cssRenderer)cssRenderer.render(scene,camera);}
  requestAnimationFrame(frame);$('status').hidden=true;document.documentElement.dataset.modelo='pronto';
})();
