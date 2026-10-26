import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDemoServer} from '../scripts/serve.mjs';

const server=createDemoServer();server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'clawd-thinking-test-'));
const browserPath=process.env.CHROME_PATH||(process.platform==='win32'?'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe':'google-chrome');
const chrome=spawn(browserPath,['--headless=new','--no-sandbox','--disable-gpu','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws;const exceptions=[];
try{
  let target;for(let i=0;i<100;i++){try{const port=Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0]);target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break}catch{}await pause(100)}
  assert(target,'Chrome started; set CHROME_PATH if needed');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  let id=0;const pending=new Map();ws.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){const p=pending.get(data.id);pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result)}else if(data.method==='Runtime.exceptionThrown')exceptions.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text)};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const serial=++id;pending.set(serial,{resolve,reject});ws.send(JSON.stringify({id:serial,method,params}))});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'Browser evaluation failed');return r.result.value};
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await pause(100)}throw Error('Timed out: '+expression+'\n'+exceptions.join('\n'))};
  const tap=async expression=>{const p=await evaluate(`(()=>{const b=${expression};b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})};
  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1024,height:760,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.probe={contexts:[],started:0};const AC=AudioContext;window.AudioContext=new Proxy(AC,{construct(C,args){const c=new C(...args);probe.contexts.push(c);return c}});const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){probe.started++;probe.state=this.context.state;return start.apply(this,args)};window.E=()=>demo.control.element.querySelector('thinking-effort');window.S=()=>E()?.shadowRoot`});
  await send('Page.navigate',{url:base});await wait('!!window.demo&&!!S()?.querySelector(".clawd-effort-stage")');
  assert.equal(await evaluate('demo.control.value'),'auto');assert.equal(await evaluate('probe.contexts.length'),0,'muted startup creates no AudioContext');
  await pause(600);const shot=await send('Page.captureScreenshot',{format:'png'});const docs=fileURLToPath(new URL('../docs/',import.meta.url));mkdirSync(docs,{recursive:true});writeFileSync(join(docs,'preview.png'),Buffer.from(shot.data,'base64'));
  for(const [index,value,pose] of [[0,'low','sleep'],[1,'medium','book'],[2,'high','think'],[3,'xhigh','ultra'],[4,'max','gold']]){
    await evaluate(`S().querySelectorAll('.eg-label')[${index}].click()`);await wait(`demo.control.value===${JSON.stringify(value)}&&!demo.control.element.inert`);await wait(`S().querySelector('.clawd-effort-stage').dataset.pose===${JSON.stringify(pose)}`);
    assert.equal(await evaluate('S().querySelector(".clawd-effort-stage img").hidden'),true,'public default uses canvas without desktop SVG files');
  }
  await evaluate('demo.failure=true;S().querySelector(".eg-label").click()');await wait('!demo.control.element.inert');assert.equal(await evaluate('demo.control.value'),'max','failed save rolls back');
  await tap('demo.control.element.querySelector(".clawd-effort-auto")');await wait('demo.control.value==="auto"&&!demo.control.element.inert');
  const speaker='S().querySelector(".clawd-effort-actions button:last-child")';await tap(speaker);await wait('demo.control.sound===true&&probe.started>0&&probe.state==="running"');assert.equal(await evaluate('demo.control.value'),'auto','sound tap cannot exit auto');
  await tap(speaker);await pause(120);assert.equal(await evaluate('demo.control.sound'),false);assert.equal(await evaluate('demo.control.value'),'auto');
  await evaluate('S().querySelector(".eg-label").click()');await wait('demo.control.value==="low"&&!demo.control.element.inert');await pause(900);
  await tap('S().querySelector(".eg-zombie-svg")');await wait('S().querySelector(".eg-root").classList.contains("is-brainless")');assert.equal(await evaluate('demo.control.value'),'low');
  await evaluate('S().querySelectorAll(".eg-label")[2].click()');await wait('demo.control.value==="high"&&!demo.control.element.inert');await wait('!S().querySelector(".eg-root").classList.contains("is-brainless")');
  await evaluate('demo.control.setValue("medium")');assert.equal(await evaluate('demo.control.value'),'medium');
  await evaluate('demo.control.setLevels(["low","medium","high"])');await wait('S()?.querySelectorAll(".eg-label").length===3');
  assert.equal(await evaluate('(()=>{try{demo.control.setValue("max");return false}catch{return true}})()'),true,'unsupported effort rejected');
  await evaluate('demo.control.setValue("high")');assert.equal(await evaluate('demo.control.setLevels(["low"],"max").then(()=>false,()=>true)'),true);assert.equal(await evaluate('demo.control.value'),'high','invalid capability update leaves old state intact');assert.equal(await evaluate('S().querySelectorAll(".eg-label").length'),3);
  await evaluate('demo.control.setLevels([])');assert.equal(await evaluate('!!E()'),false);assert.equal(await evaluate('demo.control.element.querySelector(".clawd-effort-only-auto").hidden'),false);
  await evaluate('demo.control.setLevels(["low","medium","high","max"],"high")');await wait('!!S()?.querySelector(".clawd-effort-stage")');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate('demo.control.setValue("low")');await wait('S().querySelector(".clawd-effort-stage").dataset.pose==="sleep"');
  await evaluate('demo.control.setTheme("dark")');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(180);
  assert(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'),'mobile page has no horizontal overflow');
  await evaluate('demo.control.hide()');assert.equal(await evaluate('!!E()'),false);assert(await evaluate('probe.contexts.every(c=>c.state==="closed")'),'hide closes audio');
  await evaluate('demo.control.show()');await wait('!!S()?.querySelector(".clawd-effort-stage")');assert.equal(await evaluate('document.querySelectorAll("thinking-effort").length'),1);
  await evaluate('demo.control.destroy()');assert.equal(await evaluate('document.querySelectorAll("thinking-effort").length'),0);
  assert.deepEqual(exceptions,[],'standalone demo has no browser exceptions');
  console.log('PASS: standalone demo, all poses, save rollback, auto/sound isolation, audible playback, bite/regrowth, capability changes, mobile layout, reduced motion and disposal');
}finally{
  ws?.close();chrome.kill();server.closeAllConnections();await new Promise(r=>server.close(r));
  // Only this test-created temporary profile is eligible for cleanup.
  const resolvedProfile=resolve(profile),resolvedTemp=resolve(tmpdir());
  if(resolvedProfile.startsWith(resolvedTemp+sep)&&basename(resolvedProfile).startsWith('clawd-thinking-test-'))try{rmSync(resolvedProfile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}catch{}
}
