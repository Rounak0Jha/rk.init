(() => {
  const $ = (s) => document.querySelector(s);
  const scenes = [...document.querySelectorAll('.scene')];
  const status = $('#status');
  let current = 0;
  let audio = null;
  let musicOn = false;
  let heartDone = false;
  let dragging = null;
  let dragStart = null;
  const state = { left: {x:0,y:0}, right:{x:0,y:0} };

  function announce(t){ status.textContent=t; }
  function showScene(id){
    const next = document.getElementById(id);
    if(!next || next.classList.contains('active')) return;
    const old = scenes[current];
    old.classList.add('leaving');
    setTimeout(()=>old.classList.remove('active','leaving'),700);
    next.classList.add('active','entering');
    setTimeout(()=>next.classList.remove('entering'),1100);
    current = scenes.indexOf(next);
    if(id==='story') revealStory();
    if(id==='blocks') spawnBlocks();
    if(id==='afterHeart') revealAfterHeart();
    if(id==='poem') window.scrollTo({top:0,behavior:'instant'});
    announce(`Now viewing ${id}`);
  }

  function startAudio(){
    audio = audio || new Audio('assets/audio/song.mp3');
    audio.loop = true; audio.volume = 0.5;
    audio.play().then(()=>{musicOn=true;$('#musicBtn').textContent='♫';$('#musicBtn').setAttribute('aria-label','Pause music')}).catch(()=>{
      musicOn=false; announce('Music could not start. Check assets/audio/song.mp3.');
    });
  }
  $('#musicBtn').addEventListener('click',()=>{
    if(!audio) { startAudio(); return; }
    if(audio.paused){audio.play();musicOn=true;$('#musicBtn').textContent='♫';$('#musicBtn').setAttribute('aria-label','Pause music')}
    else {audio.pause();musicOn=false;$('#musicBtn').textContent='♪';$('#musicBtn').setAttribute('aria-label','Play music')}
  });

  $('#enterBtn').addEventListener('click',(e)=>{
    e.preventDefault(); e.stopPropagation();
    startAudio();
    try { if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{}); } catch(_){ }
    showScene('story');
  });

  function revealStory(){
    const a=$('.line-a'),b=$('.line-b'),c=$('.line-c');
    [a,b,c].forEach(x=>x.classList.remove('show'));
    setTimeout(()=>a.classList.add('show'),250);
    setTimeout(()=>{a.classList.remove('show');b.classList.add('show')},4500);
    setTimeout(()=>{b.classList.remove('show');c.classList.add('show')},9000);
  }
  $('#storyNext').addEventListener('click',()=>showScene('blocks'));
  $('#blocksNext').addEventListener('click',()=>showScene('heartScene'));

  function spawnBlocks(){
    const f=$('#blockField'); f.innerHTML='';
    const n=matchMedia('(max-width:700px)').matches?18:34;
    for(let i=0;i<n;i++){
      const el=document.createElement('i'); el.className='thought-block';
      el.style.left=(5+Math.random()*90)+'%'; el.style.top=(8+Math.random()*82)+'%';
      el.style.setProperty('--x',(Math.random()*100-50)+'px'); el.style.setProperty('--y',(Math.random()*120-60)+'px'); el.style.setProperty('--d',(5+Math.random()*8)+'s'); el.style.animationDelay=(-Math.random()*8)+'s';
      f.appendChild(el);
    }
  }

  // Robust pointer-based heart: both halves are draggable; they snap when centers enter a generous radius.
  const area=$('#heartArea'), svg=$('.heart-svg'), left=$('#heartLeft'), right=$('#heartRight');
  const home={left:{x:-68,y:0},right:{x:68,y:0}};
  function setPiece(el,x,y){el.style.transform=`translate(${x}px,${y}px)`;}
  function resetHeart(){state.left={...home.left};state.right={...home.right};setPiece(left,state.left.x,state.left.y);setPiece(right,state.right.x,state.right.y)}
  resetHeart();
  function point(ev){const r=area.getBoundingClientRect(); return {x:ev.clientX-r.left,y:ev.clientY-r.top};}
  function centerFor(which){const p=which==='left'?state.left:state.right; return {x:area.clientWidth/2+p.x,y:area.clientHeight/2+p.y};}
  function pointerDown(ev){
    if(heartDone) return;
    const p=point(ev), lc=centerFor('left'), rc=centerFor('right');
    const dl=Math.hypot(p.x-lc.x,p.y-lc.y), dr=Math.hypot(p.x-rc.x,p.y-rc.y);
    dragging=dl<dr?'left':'right';
    if(Math.min(dl,dr)>Math.min(120,area.clientWidth*.25)) dragging=null;
    if(!dragging) return;
    area.classList.add('dragging'); dragStart={...p,base:{...state[dragging]}}; area.setPointerCapture?.(ev.pointerId); ev.preventDefault();
  }
  function pointerMove(ev){
    if(!dragging) return;
    const p=point(ev), dx=p.x-dragStart.x, dy=p.y-dragStart.y;
    const s=state[dragging]; s.x=dragStart.base.x+dx; s.y=dragStart.base.y+dy;
    setPiece(dragging==='left'?left:right,s.x,s.y);
    const lc=centerFor('left'),rc=centerFor('right'),d=Math.hypot(lc.x-rc.x,lc.y-rc.y);
    const glow=Math.max(0,1-d/170); svg.style.filter=`drop-shadow(0 20px 50px rgba(110,0,20,.3)) drop-shadow(0 0 ${12+glow*30}px rgba(255,45,75,${.15+glow*.5}))`;
    if(d<62) completeHeart();
    ev.preventDefault();
  }
  function pointerUp(){dragging=null;area.classList.remove('dragging');dragStart=null}
  area.addEventListener('pointerdown',pointerDown,{passive:false}); area.addEventListener('pointermove',pointerMove,{passive:false}); area.addEventListener('pointerup',pointerUp); area.addEventListener('pointercancel',pointerUp); area.addEventListener('lostpointercapture',pointerUp);
  $('#heartHint').addEventListener('click',()=>{
    if(heartDone)return;
    const target=state.left.x+state.right.x;
    if(target<0){state.left.x+=18;setPiece(left,state.left.x,state.left.y)}else{state.right.x-=18;setPiece(right,state.right.x,state.right.y)}
    const d=Math.hypot(centerFor('left').x-centerFor('right').x,centerFor('left').y-centerFor('right').y);
    if(d<80) completeHeart();
  });

  function completeHeart(){
    if(heartDone)return; heartDone=true; dragging=null; area.classList.remove('dragging');
    const cx=area.clientWidth/2, cy=area.clientHeight/2;
    state.left={x:0,y:0};state.right={x:0,y:0};setPiece(left,0,0);setPiece(right,0,0);
    $('#heartInstruction').textContent=''; $('#heartHint').style.opacity='0';
    svg.classList.add('heart-complete');
    burst(cx,cy);
    localStorage.setItem('heartCompletedAt',new Date().toISOString());
    announce('Heart completed.');
    setTimeout(()=>showScene('afterHeart'),1900);
  }
  function burst(cx,cy){
    for(let i=0;i<65;i++){
      const p=document.createElement('i');p.className='burst';p.textContent=Math.random()>.75?'♥':'✦';
      p.style.position='absolute';p.style.left=cx+'px';p.style.top=cy+'px';p.style.color=i%3?'#ff5d70':'#ffdce1';p.style.zIndex=25;p.style.pointerEvents='none';
      const a=Math.random()*Math.PI*2,d=50+Math.random()*230,s=.5+Math.random()*1.1;
      p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');p.style.setProperty('--s',s);
      p.style.animation='burstOut 1.5s cubic-bezier(.15,.8,.2,1) forwards';area.appendChild(p);setTimeout(()=>p.remove(),1600);
    }
  }

  function revealAfterHeart(){
    $('#lightRing').classList.remove('bloom'); void $('#lightRing').offsetWidth; $('#lightRing').classList.add('bloom');
    setTimeout(()=>$('#afterHeartText').classList.add('reveal'),450);
  }
  $('#poemNext').addEventListener('click',()=>showScene('poem'));

  // Moon touch/click ripple as a second gentle interaction.
  document.querySelectorAll('.moon').forEach(m=>m.addEventListener('pointerdown',()=>{
    const r=m.getBoundingClientRect(); const ring=document.createElement('i');ring.className='moon-ripple';ring.style.left=(r.left+r.width/2)+'px';ring.style.top=(r.top+r.height/2)+'px';document.body.appendChild(ring);setTimeout(()=>ring.remove(),1400);
  }));

  // Infinite petals: canvas loop, never a finite DOM batch.
  const pc=$('#petals'),px=pc.getContext('2d');let petals=[];
  function resize(){pc.width=innerWidth*devicePixelRatio;pc.height=innerHeight*devicePixelRatio;px.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);}
  addEventListener('resize',resize);resize();
  function newPetal(initial=false){return{x:Math.random()*innerWidth,y:initial?Math.random()*innerHeight:-30,s:3+Math.random()*5,vy:.45+Math.random()*1.25,vx:-.25+Math.random()*.5,r:Math.random()*Math.PI,vr:-.015+Math.random()*.03,phase:Math.random()*Math.PI*2}}
  const petalCount=()=>matchMedia('(max-width:700px)').matches?22:42;for(let i=0;i<petalCount();i++)petals.push(newPetal(true));
  function petalLoop(t){
    px.clearRect(0,0,innerWidth,innerHeight); const count=petalCount(); while(petals.length<count)petals.push(newPetal(true));
    petals.forEach(p=>{p.y+=p.vy;p.x+=p.vx+Math.sin(t*.0007+p.phase)*.28;p.r+=p.vr;if(p.y>innerHeight+30||p.x<-40||p.x>innerWidth+40)Object.assign(p,newPetal(false));px.save();px.translate(p.x,p.y);px.rotate(p.r);px.fillStyle='rgba(235,55,82,.55)';px.beginPath();px.ellipse(0,0,p.s,p.s*1.65,0,0,Math.PI*2);px.fill();px.restore()});requestAnimationFrame(petalLoop)}requestAnimationFrame(petalLoop);

  // Starfield with depth and slight motion.
  const sc=$('#stars'),sx=sc.getContext('2d');let stars=[];
  function resizeStars(){sc.width=innerWidth*devicePixelRatio;sc.height=innerHeight*devicePixelRatio;sx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);stars=[];const n=matchMedia('(max-width:700px)').matches?110:230;for(let i=0;i<n;i++)stars.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.3+Math.random()*1.5,a:.2+Math.random()*.8,s:.1+Math.random()*.45,p:Math.random()*6.28})}
  addEventListener('resize',resizeStars);resizeStars();
  function starsLoop(t){sx.clearRect(0,0,innerWidth,innerHeight);stars.forEach(s=>{s.x+=s.s*.08;if(s.x>innerWidth+5)s.x=-5;const a=s.a*(.65+.35*Math.sin(t*.001+s.p));sx.fillStyle=`rgba(255,245,248,${a})`;sx.beginPath();sx.arc(s.x,s.y,s.r,0,Math.PI*2);sx.fill()});requestAnimationFrame(starsLoop)}requestAnimationFrame(starsLoop);

  addEventListener('pointermove',e=>{const cl=$('#cursorLight');cl.style.opacity='1';cl.style.left=e.clientX+'px';cl.style.top=e.clientY+'px'});
  addEventListener('pointerdown',e=>{if(e.target===document.body||e.target.tagName==='CANVAS')return});
  // Keyboard access for all scene controls.
  addEventListener('keydown',e=>{if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});});
})();
