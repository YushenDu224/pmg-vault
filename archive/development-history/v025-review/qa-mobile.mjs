import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const profile=await fs.mkdtemp(path.resolve('qa-profile-'));
const executable='C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe';
const child=spawn(executable,[path.resolve('mobile-host.cjs'),'--remote-debugging-port=0','--data-dir='+profile],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let log='';child.stderr.setEncoding('utf8').on('data',chunk=>{log+=chunk;});
async function waitFor(check,message){for(let i=0;i<100;i++){const result=await check();if(result)return result;await delay(150);}throw Error(message+'\n'+log.slice(-1000));}
let socket;
try{
 const port=await waitFor(()=>log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/)?.[1],'Debug endpoint missing');
 const target=await waitFor(async()=>{const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());return pages.find(page=>page.url.startsWith('pmg-preview://app/'));},'Page missing');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;
 async function call(method,params={}){const current=++id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(method+' timed out')),15000);const listener=({data})=>{const message=JSON.parse(data);if(message.id!==current)return;clearTimeout(timer);socket.removeEventListener('message',listener);message.error?reject(Error(message.error.message)):resolve(message.result);};socket.addEventListener('message',listener);socket.send(JSON.stringify({id:current,method,params}));});}
 async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 const wait=(expr,msg)=>waitFor(()=>evaluate(expr).catch(()=>false),msg);
 const fits=()=>evaluate('document.documentElement.scrollWidth<=innerWidth');
 async function contrast(selectors){
  const rows=await evaluate(`(()=>{
   const parse=c=>{const a=c.match(/[\\d.]+/g)?.map(Number)||[255,255,255];return a.length<4?[...a,1]:a;};
   const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   const results=[];
   for(const selector of ${JSON.stringify(selectors)})for(const e of document.querySelectorAll(selector)){
    if(!e.getClientRects().length)continue;
    let bg=[255,255,255,1];
    for(let p=e;p;p=p.parentElement){const c=parse(getComputedStyle(p).backgroundColor);if(c[3]>=.95){bg=c;break;}}
    const fg=parse(getComputedStyle(e).color);const a=luminance(fg),b=luminance(bg);
    results.push({selector,text:e.textContent.trim().slice(0,40),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
   }
   return results;
  })()`);
  for(const row of rows)assert(row.ratio>=4.5,'Low text contrast '+JSON.stringify(row));
  return rows;
 }
 await call('Emulation.setDeviceMetricsOverride',{width:400,height:890,deviceScaleFactor:3,mobile:true});
 await wait("document.querySelector('#open-note img')?.naturalWidth>0 && typeof pmgPreviewTheme==='function'",'Library missing');
 await fs.mkdir('previews',{recursive:true});
 async function shot(name){await delay(250);const r=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile('previews/'+name+'.png',Buffer.from(r.data,'base64'));}
 await evaluate("pmgPreviewTheme('light')");
 assert.equal(await evaluate("document.querySelectorAll('.note-card').length"),4);
 assert(await evaluate("document.querySelector('#library-page .page-title')===null"),'Library title row must be removed');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.header-brand img')).backgroundColor"),'rgba(0, 0, 0, 0)','Logo background must be transparent');
 const geometry=await evaluate(`(()=>{const cards=[...document.querySelectorAll('.note-card')].map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}});const photos=[...document.querySelectorAll('.note-photo img')].map(e=>{const b=e.getBoundingClientRect();return {w:b.width,h:b.height,nw:e.naturalWidth,nh:e.naturalHeight,fit:getComputedStyle(e).objectFit,filter:getComputedStyle(e).filter}});const nav=document.querySelector('.bottom-nav');return {cards,photos,navHeight:nav.getBoundingClientRect().height,navFont:getComputedStyle(nav.querySelector('span')).fontSize,navButtonHeight:nav.querySelector('button').getBoundingClientRect().height}})()`);
 assert.equal(new Set(geometry.cards.map(e=>Math.round(e.x))).size,2,'Two columns expected');
 assert(new Set(geometry.cards.map(e=>Math.round(e.h))).size>1,'Cards should have independent heights');
 assert(Math.abs(geometry.navHeight-65.45)<.1,'Navigation height must shrink by 15%');
 assert.equal(geometry.navFont,'15px');assert(geometry.navButtonHeight>=48);
 for(const p of geometry.photos){assert(p.w>p.h,'Landscape photo expected');assert(Math.abs(p.w/p.h-p.nw/p.nh)<.01,'Original image aspect ratio changed');assert.equal(p.fit,'contain');assert(!/invert/.test(p.filter));}
 assert(await fits());await shot('android-library-light');
 await evaluate("pmgPreviewTheme('dark')");
 const contrastLibrary=await contrast(['.note-info h2','.note-country','.layout-label','.toolbar>span','#search']);
 await shot('android-library-dark');
 assert.equal(await evaluate("document.documentElement.dataset.theme"),'dark');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 await evaluate("pmgPreviewTheme('system')");await wait("document.documentElement.dataset.theme==='dark'",'System dark not followed');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});
 await wait("document.documentElement.dataset.theme==='light'",'System light not followed');
 await evaluate("document.querySelector('[data-page=query]').click()");
 assert.equal(await evaluate("getComputedStyle(document.querySelector('#query-form')).backgroundColor"),'rgb(5, 61, 34)');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.query-submit')).backgroundColor"),'rgb(208, 208, 205)');
 assert(await evaluate("getComputedStyle(document.querySelector('.verify-title h2')).fontFamily.includes('Georgia')"));
 const frameRatio=()=>evaluate("(()=>{const b=document.querySelector('.official-window').getBoundingClientRect();return b.width/b.height})()");
 assert(Math.abs(await frameRatio()-400/890)<.002,'Official view should match screen aspect ratio');
 await evaluate("document.querySelector('#score-picker-toggle').click()");
 await wait("!document.querySelector('#score-picker').hidden",'Score picker did not open');
 const expected=JSON.parse(await fs.readFile('assets-evidence/official-grade-options.json','utf8')).entries[0].options.map(o=>o.value).filter(Boolean).sort();
 assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-score]')].map(e=>e.dataset.score).sort()"),expected,'Official grade list incomplete');
 await evaluate("document.querySelector('[data-score=\\\"68\\\"]').click()");
 assert.equal(await evaluate("document.querySelector('#query-grade').value"),'68');
 assert(await evaluate("document.querySelector('#score-picker').hidden && document.activeElement!==document.querySelector('#query-grade')"));
 await evaluate("document.querySelector('#score-picker-toggle').click();document.querySelector('#query-grade').focus()");
 assert(await evaluate("document.querySelector('#score-picker').hidden"),'Keyboard focus must hide grade choices');
 await call('Emulation.setDeviceMetricsOverride',{width:400,height:500,deviceScaleFactor:3,mobile:true});await delay(100);
 assert(await evaluate("document.querySelector('#score-picker').hidden"));
 assert(Math.abs(await frameRatio()-400/890)<.002,'Keyboard should not distort the official view');
 await evaluate("document.querySelector('#score-picker-toggle').click()");
 assert(await evaluate("document.querySelector('#score-picker').hidden"),'Choices should wait for keyboard closure');
 await call('Emulation.setDeviceMetricsOverride',{width:400,height:890,deviceScaleFactor:3,mobile:true});
 await wait("!document.querySelector('#score-picker').hidden",'Choices did not open after keyboard closure');
 await shot('android-grade-picker');
 await evaluate("document.querySelector('[data-score=NonNumeric]').click()");
 assert.equal(await evaluate("document.querySelector('#query-grade').value"),'非数值');
 await evaluate("const input=document.querySelector('#query-grade');input.value='59';input.dispatchEvent(new Event('input'));");
 assert.equal(await evaluate("document.querySelector('#query-grade').checkValidity()"),false);
 await evaluate("document.querySelector('#query-grade').value='67';document.querySelector('#query-grade').dispatchEvent(new Event('input'));document.querySelector('#query-grade').blur();window.scrollTo(0,0)");
 await call('Emulation.setDeviceMetricsOverride',{width:890,height:400,deviceScaleFactor:1,mobile:true});await delay(150);
 assert(Math.abs(await frameRatio()-890/400)<.003,'Landscape aspect ratio did not follow orientation');
 await call('Emulation.setDeviceMetricsOverride',{width:400,height:890,deviceScaleFactor:3,mobile:true});await delay(150);
 assert(await fits());await shot('android-query-light');
 await evaluate("pmgPreviewTheme('dark')");await shot('android-query-dark');
 await evaluate("document.querySelector('#query-site').value='global';document.querySelector('#query-site').dispatchEvent(new Event('change'));");
 assert.equal(await evaluate("document.querySelector('#site-address').textContent"),'www.pmgnotes.com');
 await evaluate("document.querySelector('#query-site').value='cn';document.querySelector('#query-site').dispatchEvent(new Event('change'));document.querySelector('#query-form').requestSubmit();");
 await wait("!document.querySelector('#capture-result').hidden",'Demo result missing');
 assert.equal(await evaluate("document.querySelectorAll('.capture-progress li').length"),3);
 const contrastCapture=await contrast(['.official-fields b','.official-fields span','.official-content small','.capture-result h2','.capture-progress strong','.capture-progress span']);
 await evaluate("document.querySelector('#capture-result').scrollIntoView({block:'end'})");await shot('android-capture-dark');
 await evaluate("document.querySelector('#open-query-note').click()");await wait("document.querySelector('#detail').open",'Details missing');
 assert(await evaluate("document.querySelector('#detail').scrollWidth<=innerWidth"));await shot('android-detail-dark');
 await evaluate("document.querySelector('#new-group').click();const f=document.querySelector('#group-form');f.elements.name.value='My photos';f.elements.source.value='My camera';f.elements.url.value='https://example.com/photo';");
 const {root}=await call('DOM.getDocument');const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector:'#group-form [name=front]'});
 await call('DOM.setFileInputFiles',{nodeId,files:[path.resolve('android-preview/assets/front.jpg')]});
 await wait("document.querySelector('[data-preview=front] img')?.naturalWidth>0",'Local file failed to decode');await shot('android-upload-dark');
 await evaluate("document.querySelector('#group-form').requestSubmit()");await wait("document.querySelector('#detail-panel').textContent.includes('My photos')",'Image group not saved');
 await evaluate("document.querySelector('#set-display').click()");assert(await evaluate("document.querySelector('#set-display').disabled"));
 await evaluate("document.querySelector('[data-tab=info]').click()");assert(await evaluate("document.querySelector('#detail-panel').textContent.includes('2020-10-13')"));
 await evaluate("document.querySelector('#close-detail').click();document.querySelector('[data-page=library]').click();document.querySelector('#search').value='no match';document.querySelector('#search').dispatchEvent(new Event('input'));");
 assert.equal(await evaluate("document.querySelectorAll('.note-card').length"),0);
 await evaluate("document.querySelector('#search').value='8077301';document.querySelector('#search').dispatchEvent(new Event('input'));document.querySelector('#open-note').click();document.querySelector('#delete-note').click();document.querySelector('[data-page=more]').click();document.querySelector('#trash-open').click();document.querySelector('#message-actions button').click();");
 assert(await evaluate("document.querySelector('#trash-summary').textContent.includes('暂无')"));
 for(const width of [360,400,480]){await call('Emulation.setDeviceMetricsOverride',{width,height:890,deviceScaleFactor:1,mobile:true});for(const page of ['library','query','more']){await evaluate("document.querySelector('[data-page="+page+"]').click()");assert(await fits(),page+' overflows at '+width);}}
 const report={viewport:{width:400,height:890,dpr:3},publicSampleCount:1,layoutExamples:4,geometry,libraryTitleRowRemoved:true,transparentOfficialLogo:true,officialGradeOptions:expected,keyboardAndPickerExclusiveSimulation:true,viewportAspectPortraitAndLandscape:true,originalImageAspectRatio:true,contrastLibrary,contrastCapture,systemThemeSimulation:true,officialFormRebuilt:true,siteSelection:true,cleanCaptureRows:3,localImagePicker:true,imageGroupSave:true,displayChoice:true,search:true,trashRestore:true,noHorizontalOverflow:[360,400,480],nativeAndroidApp:false,xiaomiDeviceTested:false};
 await fs.writeFile('previews/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{socket?.close();child.kill();}

