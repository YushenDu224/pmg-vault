import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {captureFullPage,configureOfficialContents,networkFact,createBrowserDiagnostics}=require('../desktop/browser-compat.cjs');
const {officialPage}=require('../desktop/view-policy.cjs');
const {createCaptureEngine}=require('../desktop/capture-engine.cjs');

test('temporary screenshot debugger is detached on success and failure without taking another owner',async()=>{
 for(const fail of [false,true]){
  let attached=false,detaches=0;
  const contents={debugger:{isAttached:()=>attached,attach:()=>{attached=true;},detach:()=>{attached=false;detaches++;},sendCommand:async command=>{if(command==='Page.getLayoutMetrics')return {cssContentSize:{width:1000,height:2000}};if(fail)throw Error('capture failed');return {data:Buffer.from('PNG').toString('base64')};}}};
  if(fail)await assert.rejects(()=>captureFullPage(contents),/capture failed/);else assert.equal((await captureFullPage(contents)).toString(),'PNG');
  assert.equal(attached,false);assert.equal(detaches,1);
 }
 let detaches=0;const preattached={debugger:{isAttached:()=>true,detach:()=>detaches++,sendCommand:async command=>command==='Page.getLayoutMetrics'?{cssContentSize:{width:10,height:20}}:{data:''}}};
 await captureFullPage(preattached);assert.equal(detaches,0);
});

test('official popup keeps its own browsing context while main frame stays on approved PMG origins',()=>{
 const contents=new EventEmitter();contents.setWindowOpenHandler=handler=>{contents.open=handler;};
 configureOfficialContents(contents,{partition:'persist:pmg-collector'});
 const options=contents.open({url:'https://www.pmgnotes.com/certlookup/8077301-001/67/'});
 assert.equal(options.action,'allow');assert.equal(options.overrideBrowserWindowOptions.webPreferences.partition,'persist:pmg-collector');assert.equal(options.overrideBrowserWindowOptions.webPreferences.nodeIntegration,false);
 assert.equal(contents.open({url:'about:blank'}).action,'allow');
 assert.equal(contents.open({url:'https://evil.example/'}).action,'deny');
 let prevented=false;contents.emit('will-navigate',{preventDefault(){prevented=true;}},'https://challenges.cloudflare.com/');assert(prevented);
 assert(!officialPage('https://user:password@www.pmgnotes.com/'));assert(!officialPage('https://www.pmgnotes.com:8443/'));
});

test('diagnostics exclude URLs, credentials, token-bearing headers, HTML and local paths',()=>{
 const handlers={};const contents={getUserAgent:()=> 'Chrome/154.0.0.0 Electron/45.2.2',getLastWebPreferences:()=>({javascript:true}),session:{isPersistent:()=>true,webRequest:{onCompleted:(_,fn)=>handlers.completed=fn,onErrorOccurred:(_,fn)=>handlers.failed=fn}}};
 const diagnostics=createBrowserDiagnostics(contents,{electron:'45.2.2',chrome:'154.0.0.0'});
 handlers.completed({url:'https://www.pmgnotes.com/certlookup/private-path/?token=SECRET',resourceType:'mainFrame',statusCode:403,responseHeaders:{'cf-ray':['abcde01234567890-ABC'],'set-cookie':['SESSION=SECRET'],'cf-mitigated':['challenge']}});
 const report=diagnostics.report(),json=JSON.stringify(report);
 assert(!/SECRET|private-path|SESSION|token=|set-cookie/.test(json));assert.equal(report.events[0].rayId,'abcde01234567890-ABC');assert.equal(report.events[0].challengeResponse,true);assert.equal(report.environment.persistentSession,true);
 for(let i=0;i<100;i++)handlers.completed({url:'https://www.pmgnotes.com/',statusCode:200});assert.equal(diagnostics.report().events.length,80);
 assert.equal(networkFact({url:'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/pat/abc',statusCode:401}).classification,'optional-pat-401');
 const dns=networkFact({url:'https://test.dnstest.dev/private',error:'net::ERR_NAME_NOT_RESOLVED'});assert.equal(dns.classification,'optional-dns-probe');assert.equal(dns.fatal,false);
 assert.equal(networkFact({url:'https://unrelated.example/',statusCode:500}),null);
});

test('challenge waits do not repeatedly reload the query or collect challenge HTML',async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'pmg-challenge-test-'));
 let loads=0,probes=0;
 const contents={isLoading:()=>false,getURL:()=> 'https://www.pmgnotes.com/certlookup/8077301-001/67/',loadURL:async()=>{loads++;},executeJavaScript:async code=>{probes++;assert(!code.includes('outerHTML'));return {challenge:true};}};
 try{
  const engine=await createCaptureEngine({view:{webContents:contents},data,root:path.resolve(import.meta.dirname,'..'),onState:()=>{}});
  const query={site:'global',cert:'8077301-001',grade:67};
  await engine.start(query);await engine.inspect();assert.equal(engine.getState().state,'needs-user');
  await engine.start(query);await engine.inspect();await engine.inspect();assert.equal(loads,1);assert.equal(probes,1);
  await engine.retry();assert.equal(loads,1);assert.equal(probes,2);
  await engine.reload();assert.equal(loads,2);
 }finally{await fs.rm(data,{recursive:true,force:true});}
});

test('slow inspection cannot reenter from the timer and duplicate a capture',async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'pmg-inspection-test-'));
 let release,probes=0;
 const contents={isLoading:()=>false,getURL:()=> 'https://www.pmgnotes.com/',loadURL:async()=>{},executeJavaScript:()=>{probes++;return new Promise(resolve=>{release=resolve;});}};
 try{
  const engine=await createCaptureEngine({view:{webContents:contents},data,root:path.resolve(import.meta.dirname,'..'),onState:()=>{}});
  await engine.start({site:'global',cert:'8077301-001',grade:67});const first=engine.inspect();await Promise.resolve();await engine.inspect();assert.equal(probes,1);release({challenge:true});await first;
 }finally{await fs.rm(data,{recursive:true,force:true});}
});
