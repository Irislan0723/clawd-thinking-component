/**
 * Clawd Thinking — Whisper adaptation of Creative Components.
 * Required Notice: Copyright (c) 2026 FeiFei (@nextoneforeal)
 * https://github.com/next1foreal-dotcom/creative-components
 * Noncommercial use; see LICENSE and THIRD_PARTY_NOTICES.md.
 */
const BASE=new URL('../vendor/creative-components/',import.meta.url).href;
let library;
export function preloadClawdThinking(){
  if(!library)library=Promise.all([
    customElements.get('thinking-effort')?Promise.resolve():new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=BASE+'thinking-effort.js';
      script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('组件加载失败'))};document.head.append(script);
    }),import(BASE+'clawd-engine.js')
  ]).then(([,module])=>module.ClawdEngine).catch(error=>{library=null;throw error});
  return library;
}
const names={low:'低',medium:'中',high:'高',xhigh:'超高',max:'最大'};
const hints={low:'Clawd 正在睡觉……僵尸正悄悄靠近',medium:'翻翻资料，慢慢想一想',high:'认真琢磨，灵感正在冒出来',xhigh:'全力思考，小脑袋忙起来了',max:'金色 Clawd 上线，僵尸快跑'};
const icon=path=>'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
const resetIcon=icon('<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>');
const soundIcon=on=>icon('<path d="M11 5 6 9H3v6h3l5 4Z"/>'+(on?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 6 6m0-6-6 6"/>'));
function unlockAudio(context){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{if(!context||context.state==='closed')context=new AC();if(context.state==='suspended')void context.resume().catch(()=>{});return context}catch{return null}
}
export function createClawdThinking(mount,options={}){
  if(!(mount instanceof Element))throw TypeError('mount must be a DOM element');
  let levels=[],value=options.value??'auto',lastManual='medium',host=null,cleanup=null,saving=false,visible=false,destroyed=false,generation=0,opening=null,preparedAudio=null,audioControl=null;
  let sound=options.sound===true;
  if(options.storageKey)try{const saved=localStorage.getItem(options.storageKey);if(saved!==null)sound=saved==='true'}catch{}
  function persistSound(){if(options.storageKey)try{localStorage.setItem(options.storageKey,String(sound))}catch{}wrap.dispatchEvent(new CustomEvent('sound-change',{detail:{sound},bubbles:true}))}
  function configure(next){
    if(!Array.isArray(next))throw TypeError('levels must be an array of supported effort IDs');
    const manual=next.filter(id=>id!=='auto');
    if(manual.some(id=>!Object.hasOwn(names,id))||new Set(manual).size!==manual.length)throw TypeError('Unknown or duplicate effort ID');
    if(value!=='auto'&&!manual.includes(value))throw RangeError('value is not supported by levels');levels=[...manual];
  }
  configure(options.levels??['low','medium','high','max']);
  const wrap=document.createElement('section');wrap.className='clawd-thinking clawd-effort-v1';wrap.hidden=true;
  wrap.innerHTML='<div class="clawd-effort-toolbar"><span>自动思考</span><button type="button" class="clawd-effort-auto" role="switch" aria-label="自动思考"></button></div><div class="clawd-effort-loading" aria-hidden="true"><i></i><i></i><div><b></b></div><i></i></div><div class="clawd-effort-mount"></div><p class="clawd-effort-only-auto" hidden>这个模型由运行时自动分配思考强度</p><select class="clawd-effort-fallback" aria-label="思考强度" hidden></select><p class="clawd-effort-error" role="status" hidden></p>';
  const auto=wrap.querySelector('.clawd-effort-auto'),note=wrap.querySelector('.clawd-effort-only-auto'),select=wrap.querySelector('select'),errorNote=wrap.querySelector('.clawd-effort-error');
  mount.append(wrap);
  function paint(){
    select.replaceChildren(...['auto',...levels].map(id=>new Option(id==='auto'?'自动':names[id],id)));
    select.value=value;auto.setAttribute('aria-checked',String(value==='auto'));auto.disabled=!levels.length||saving;
    note.hidden=levels.length>0;
    if(host){host.dataset.auto=String(value==='auto');host.value=value==='auto'?host.recommended:levels.indexOf(value)}
  }
  async function save(next){
    if(destroyed||saving||!visible||!['auto',...levels].includes(next)||next===value)return;
    const previous=value;saving=true;wrap.inert=true;
    try{await options.onChange?.(next,{previousValue:previous});if(destroyed)return;value=next;if(next!=='auto')lastManual=next;errorNote.hidden=true;wrap.dispatchEvent(new CustomEvent('effort-change',{detail:{value,previousValue:previous},bubbles:true}))}
    catch(error){if(!destroyed){errorNote.textContent=error.message||'保存失败';errorNote.hidden=false;wrap.dispatchEvent(new CustomEvent('effort-error',{detail:{error},bubbles:true}));options.onError?.(error)}}
    finally{saving=false;wrap.inert=false;if(!destroyed)paint()}
  }
  auto.onclick=()=>save(value==='auto'?(levels.includes(lastManual)?lastManual:levels.includes('medium')?'medium':levels[0]):'auto');
  select.onchange=event=>{event.stopPropagation();void save(select.value)};
  function clear(){cleanup?.();cleanup=null;host?.remove();host=null;if(preparedAudio){void preparedAudio.close().catch(()=>{});preparedAudio=null}delete wrap.dataset.loading;wrap.removeAttribute('aria-busy')}
  async function open(token){
    try{
      if(!levels.length){paint();return}
      const Engine=await preloadClawdThinking();if(destroyed||!visible||token!==generation)return;
      const element=document.createElement('thinking-effort');element.setAttribute('footnote','');element.setAttribute('easter-eggs','true');element.setAttribute('title','思考强度');
      element.voiceBase=BASE+'voice/';element.sound=sound;element.levels=levels.map(id=>({name:names[id],hint:hints[id]}));element.recommended=Math.max(0,levels.indexOf(options.recommended||'medium'));
      host=element;paint();
      element.addEventListener('change',event=>{event.stopPropagation();const next=levels[event.detail?.value];if(next)void save(next)});
      element.addEventListener('pointerup',event=>{const track=element.shadowRoot?.querySelector('.eg-track');if(value!=='auto'||!event.composedPath().includes(track))return;queueMicrotask(()=>{const id=levels[Number(track.getAttribute('aria-valuenow'))];if(id)void save(id)})});
      wrap.querySelector('.clawd-effort-mount').append(element);await new Promise(resolve=>requestAnimationFrame(resolve));
      if(destroyed||!visible||token!==generation)return;cleanup=adapt(element,Engine);
    }catch(error){if(!destroyed&&visible&&token===generation){cleanup?.();cleanup=null;host?.remove();host=null;select.hidden=false;errorNote.textContent=error.message;errorNote.hidden=false;wrap.dispatchEvent(new CustomEvent('load-error',{detail:{error},bubbles:true}))}}
    finally{if(token===generation){delete wrap.dataset.loading;wrap.removeAttribute('aria-busy');paint()}}
  }
  const shadowStyle=`
    :host{font-family:var(--font-cn,sans-serif)}
    .eg-root{--ink:var(--chat-text,#252525);--ink2:var(--chat-muted,#777);--ink3:var(--chat-muted,#777);max-width:none;font-family:var(--font-cn,sans-serif)}
    .eg-card{padding:4px 2px 0;border:0;border-radius:0;background:transparent;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
    .eg-card::before{display:none}.eg-eyebrow{display:none}.eg-roll{margin-top:0;height:34px}.eg-roll-in span{font-size:23px;line-height:40px}.eg-head{align-items:center}.eg-reset{display:none}
    .clawd-effort-actions{display:flex;gap:7px;align-items:center}.clawd-effort-actions button{display:grid;place-items:center;width:29px;height:29px;padding:0;border:1px solid var(--chat-border);border-radius:50%;background:transparent;color:var(--chat-text);cursor:pointer}.clawd-effort-actions button:hover{background:color-mix(in srgb,var(--chat-text) 8%,transparent)}.clawd-effort-actions button:focus-visible,.eg-zombie-svg:focus-visible{outline:2px solid var(--chat-text);outline-offset:3px}
    .eg-hint{font-size:10px;min-height:30px;line-height:1.5;margin-top:4px;color:var(--chat-muted);font-style:normal}.eg-track{margin-top:12px}.eg-label{font-family:var(--font-cn,sans-serif);font-size:10px;color:var(--chat-muted)}.eg-label.on{color:var(--chat-text)}.eg-foot{display:none}
    .eg-brain-svg>:not(defs):not(.clawd-effort-art){display:none}.clawd-effort-art{pointer-events:none}.clawd-effort-stage{position:relative;width:512px;height:512px;overflow:hidden}.clawd-effort-stage img,.clawd-effort-stage canvas{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;image-rendering:pixelated}.clawd-effort-stage [hidden]{display:none!important}
    .eg-brain{inset:2px;transform:none!important}.eg-br0,.eg-br1,.eg-br3{animation:none!important}.clawd-effort-stage img{transform:scale(1.12)}.eg-lv-0 .eg-zombie-svg[role="button"]{pointer-events:auto;cursor:pointer}
    .clawd-effort-stage[data-pose="sleep"] img{transform:translateY(-10%) scale(.94)}.eg-zzz{display:none}
    :host([data-auto="true"]) .eg-roll-in{visibility:hidden}:host([data-auto="true"]) .eg-roll::after{content:'自动';position:absolute;inset:0;font:400 23px/34px var(--font-cn);color:var(--chat-text)}
    :host([data-auto="true"]) .eg-label.on{color:var(--chat-muted)}
    :host([data-auto="true"]) .eg-hint{font-size:0}:host([data-auto="true"]) .eg-hint::after{content:'由模型自动分配思考强度，拖动可切换为手动';font:10px/1.5 var(--font-cn);color:var(--chat-muted)}
    .eg-crumbs i{background:#D97757}
    :host-context([data-clawd-theme="dark"]) .eg-roll-in .eg-roll-0,:host-context([data-clawd-theme="dark"]) .eg-roll-in .eg-roll-0{color:#b9c4ff}
    @media(prefers-reduced-motion:reduce){.eg-card::before{opacity:.1}}
  `;
  function adapt(element,Engine){
    const shadow=element.shadowRoot,root=shadow?.querySelector('.eg-root');if(!root)throw Error('思考滑块尚未就绪');
    let context=null;const control={unlock(){context=unlockAudio(context||preparedAudio);preparedAudio=null},start(){if(!sound)return;this.unlock();root.dispatchEvent(new CustomEvent('effort-audio-activate',{detail:{context}}))}};audioControl=control;
    const style=document.createElement('style');style.textContent=shadowStyle;shadow.append(style);
    const actions=document.createElement('div');actions.className='clawd-effort-actions';for(const type of ['pointerdown','pointerup','click'])actions.addEventListener(type,event=>event.stopPropagation());
    const reset=document.createElement('button');reset.type='button';reset.innerHTML=resetIcon;reset.title='重置强度';reset.setAttribute('aria-label','重置强度');reset.onclick=()=>{shadow.querySelector('.eg-reset')?.click();if(element.dataset.auto==='true')void save(levels[element.recommended])};
    const speaker=document.createElement('button');speaker.type='button';const paintSound=()=>{speaker.innerHTML=soundIcon(sound);speaker.title=sound?'关闭音效':'打开音效';speaker.setAttribute('aria-label',speaker.title);speaker.setAttribute('aria-pressed',String(sound))};paintSound();speaker.onclick=()=>{sound=!sound;persistSound();element.sound=sound;paintSound();if(sound)control.start()};actions.append(reset,speaker);shadow.querySelector('.eg-head').append(actions);
    const zombie=shadow.querySelector('.eg-zombie-svg'),track=shadow.querySelector('[role="slider"]');
    const canBite=()=>element.dataset.auto!=='true'&&Number(track.getAttribute('aria-valuenow'))===0;
    const bite=()=>{if(canBite())track.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}))};
    const stop=event=>{event.stopPropagation();event.preventDefault()};const biteDown=event=>{if(canBite())stop(event)};const bitePointer=event=>{if(canBite()){stop(event);bite()}};const biteKey=event=>{if(canBite()&&(event.key==='Enter'||event.key===' ')){stop(event);bite()}};
    zombie.setAttribute('role','button');zombie.removeAttribute('aria-hidden');zombie.setAttribute('aria-label','低档时让僵尸咬一口');zombie.setAttribute('tabindex','0');zombie.setAttribute('focusable','true');zombie.addEventListener('pointerdown',biteDown);zombie.addEventListener('pointerup',bitePointer);zombie.addEventListener('keydown',biteKey);
    const reduced=matchMedia('(prefers-reduced-motion:reduce)'),source=document.createElement('canvas'),engine=new Engine(source,{manual:true,width:160,mute:true,fidgets:false,snoreSound:false,reducedMotion:reduced.matches});
    const originalCrab=engine.crab.bind(engine);let pose='',gold=false,stage,img,canvas,art,raf=0,last=0,disposed=false,lastStill='';
    engine.crab=(x,y,options={})=>originalCrab(x,y,gold?{...options,color:'#F2C94C'}:options);
    function artwork(){
      const svg=shadow.querySelector('.eg-brain-svg');if(!svg)return;
      if(art?.isConnected)return;
      art=document.createElementNS('http://www.w3.org/2000/svg','g');art.classList.add('clawd-effort-art');const mask=svg.querySelector('mask[id$="-bite"]');if(mask)art.setAttribute('mask','url(#'+mask.id+')');
      const foreign=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');foreign.setAttribute('x','0');foreign.setAttribute('y','0');foreign.setAttribute('width','512');foreign.setAttribute('height','512');
      stage=document.createElement('div');stage.className='clawd-effort-stage';img=document.createElement('img');img.alt='';img.draggable=false;canvas=document.createElement('canvas');canvas.width=canvas.height=256;stage.append(img,canvas);foreign.append(stage);art.append(foreign);svg.append(art);pose='';
    }
    function choose(){
      artwork();if(!stage)return;
      const look=Number([...root.classList].find(c=>/^eg-lv-\d+$/.test(c))?.slice(6)||0),bitten=root.classList.contains('is-brainless'),alert=root.dataset.nap==='startle'||root.dataset.egg==='alert';
      const next=bitten?'dizzy':alert?'startle':look===0?'sleep':look<=2?'book':look===3?'think':look===4?'ultra':'gold';
      if(next!==pose){pose=next;stage.dataset.pose=pose;gold=pose==='gold';engine.anim=null;engine.setStatus('idle');engine.x=engine.home;
        const files=options.assets||{};
        img.hidden=!files[pose];canvas.hidden=!!files[pose];if(files[pose])img.src=files[pose];
        if(pose==='sleep'){engine.sleeping=true;engine.idleT=61}else if(pose==='think'||pose==='ultra'){engine.setStatus('thinking');engine.ctx=pose==='ultra'?.9:0}else if(pose==='dizzy'){engine.stop();engine.stop();engine.stop()}else if(pose==='book')engine.tool('Read');else if(pose==='startle'){engine.typLen=0;engine.typing(210)}else if(pose==='gold')engine.fidget('dance');
      }
      if(canvas.hidden){cancelAnimationFrame(raf);raf=0}else resume();
    }
    const observer=new MutationObserver(choose);observer.observe(root,{attributes:true,attributeFilter:['class','data-egg','data-nap']});choose();
    function draw(now){
      if(disposed)return;
      raf=0;
      if(now-last>=33&&!document.hidden&&canvas&&!canvas.hidden&&(!reduced.matches||lastStill!==pose)){const dt=Math.min(.05,(now-(last||now))/1000);last=now;
        engine.reduced=reduced.matches;if(reduced.matches){engine.anim=null;engine.base='idle';lastStill=pose}else{lastStill='';if(!engine.anim&&pose==='book')engine.tool('Read');if(!engine.anim&&pose==='gold')engine.fidget('dance')}engine.tick(dt);
        const b=engine.crabBox;if(b){const context=canvas.getContext('2d');context.clearRect(0,0,256,256);context.imageSmoothingEnabled=false;const side=17*engine.S,dpr=engine.dpr;context.drawImage(source,(b.x+b.w/2-side/2)*dpr,(b.y+b.h/2-side/2)*dpr,side*dpr,side*dpr,0,0,256,256)}
      }
      if(!document.hidden&&!canvas.hidden&&(!reduced.matches||lastStill!==pose))raf=requestAnimationFrame(draw);
    }
    function resume(){if(!disposed&&!document.hidden&&canvas&&!canvas.hidden&&!raf)raf=requestAnimationFrame(draw)}
    const motion=()=>{lastStill='';resume()};document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',motion);resume();if(sound)control.start();
    return()=>{disposed=true;if(audioControl===control)audioControl=null;cancelAnimationFrame(raf);observer.disconnect();zombie.removeEventListener('pointerdown',biteDown);zombie.removeEventListener('pointerup',bitePointer);zombie.removeEventListener('keydown',biteKey);document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',motion);engine.destroy()};
  }
  const api={
    get value(){return value},get sound(){return sound},get element(){return wrap},
    show(){
      if(destroyed)throw Error('Component was destroyed');if(visible)return opening;
      visible=true;wrap.hidden=false;select.hidden=true;errorNote.hidden=true;paint();
      if(sound)preparedAudio=unlockAudio(preparedAudio);
      if(levels.length){wrap.dataset.loading='true';wrap.setAttribute('aria-busy','true')}
      opening=open(++generation);return opening;
    },
    hide(){visible=false;generation++;clear();wrap.hidden=true},
    setValue(next){if(saving)throw Error('A save is pending');if(!['auto',...levels].includes(next))throw RangeError('Unsupported effort');value=next;if(next!=='auto')lastManual=next;paint()},
    async setLevels(next,nextValue='auto'){if(saving)throw Error('A save is pending');const prior=value;value=nextValue;try{configure(next)}catch(error){value=prior;throw error}const wasVisible=visible;api.hide();paint();if(wasVisible)await api.show()},
    setTheme(theme){if(!['light','dark','auto'].includes(theme))throw RangeError('Unknown theme');wrap.dataset.clawdTheme=theme},
    destroy(){api.hide();destroyed=true;wrap.remove()}
  };
  api.setTheme(options.theme||'auto');paint();
  void preloadClawdThinking().catch(()=>{});
  if(options.initiallyOpen!==false)api.ready=api.show();else api.ready=Promise.resolve();
  return api;


}
