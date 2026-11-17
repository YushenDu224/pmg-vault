import {test} from 'node:test';import assert from 'node:assert/strict';
import {createPageNavigation} from '../ui/navigation.mjs';
import {sourceRegionCode,cardOrigin,selectNotes} from '../lib/domain.mjs';
import {parsePMG} from '../lib/pmg-adapter.mjs';
function nav(){const attributes=new Map(),classes=new Set();return {setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)},attributes,classes};}
test('library and query are exclusive pages; returning to library hides the native website and keeps query content',()=>{
 const library={},capture={query:{cert:'2566637-001',grade:66}},libraryNav=nav(),queryNav=nav(),title={};let hides=0,expands=0,scrolls=0;
 const page=createPageNavigation({library,capture,libraryNav,queryNav,title},{onCapture:()=>expands++,onLeave:()=>hides++,scrollTop:()=>scrolls++});
 page(false);assert.equal(library.hidden,false);assert.equal(capture.hidden,true);assert.equal(libraryNav.attributes.get('aria-current'),'page');
 page(true);assert.equal(library.hidden,true);assert.equal(capture.hidden,false);assert.equal(queryNav.attributes.get('aria-current'),'page');assert.equal(libraryNav.attributes.has('aria-current'),false);
 page(false);assert.equal(library.hidden,false);assert.equal(capture.hidden,true);assert.equal(queryNav.classes.has('active'),false);assert.equal(capture.query.cert,'2566637-001');assert.equal(hides,2);assert.equal(expands,1);assert.equal(scrolls,3);
});
test('source region overrides ISO normalization; card contains only region and original year',()=>{const note={countryRaw:'SWI',countryCode:'CH',currency:'CHF',noteYear:{raw:'2017'}};assert.equal(sourceRegionCode(note),'SWI');assert.equal(cardOrigin(note),'SWI / 2017');assert.equal(cardOrigin({countryCode:'US',noteYear:{raw:'1935A'}}),'US / 1935A');assert.equal(cardOrigin({}),'不适用 / 不适用');});
test('official SWI region survives parsing, card display, searching and region filtering',()=>{const fields=[['PMG评级号码','2566637-001'],['纸币说明:','Switzerland, National Bank, 1000 Franken 2017 - Printer: OFZ'],['地区:','SWI'],['等级:','66 EPQ']].map(([label,value])=>({label,value}));const parsed=parsePMG({fields},{cert:'2566637-001',grade:66});assert.equal(parsed.state,'matched');assert.equal(cardOrigin(parsed.note),'SWI / 2017');const records=[{note:parsed.note,manifest:{noteId:'swiss',resources:[]}}];assert.equal(selectNotes(records,{country:'SWI'}).length,1);assert.equal(selectNotes(records,{field:'countryCode',term:'SWI'}).length,1);});
