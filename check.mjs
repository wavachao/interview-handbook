import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const chapters=(await Promise.all(['cpp-ds','systems','databases'].map(async name=>JSON.parse((await readFile(`dist/content-${name}.json`,'utf8')).replace(/^\uFEFF/,''))))).flat();
assert.equal(chapters.length,7,'Seven subjects are required');
assert.deepEqual(new Set(chapters.map(c=>c.id)),new Set(['cpp','ds','os','network','architecture','mysql','redis']));
const ids=new Set();
for(const c of chapters){
  assert.equal(c.sections.length,20,`${c.title} requires 20 questions`);
  for(const q of c.sections){
    assert(!ids.has(q.id),`Duplicate id: ${q.id}`);ids.add(q.id);
    assert(q.id.startsWith(`${c.id}-`),`Wrong chapter prefix: ${q.id}`);
    for(const key of ['title','group','summary','followup','pitfall'])assert(typeof q[key]==='string'&&q[key].length>0,`${q.id}: missing ${key}`);
    assert(['基础','进阶'].includes(q.level),`${q.id}: invalid level`);
    assert(Array.isArray(q.points)&&q.points.length>=3,`${q.id}: insufficient answer detail`);
    assert(q.points.every(p=>typeof p==='string'&&p.length>20),`${q.id}: incomplete answer points`);
    assert(q.sources.length>0,`${q.id}: missing source`);
    for(const s of q.sources){assert(s.title&&new URL(s.url).protocol==='https:',`${q.id}: invalid source`);}
  }
  assert((await stat(`dist/pdf/${c.id}.pdf`)).size>10000,`${c.id}: missing PDF`);
}
assert.equal(ids.size,140);
assert((await stat('dist/pdf/all.pdf')).size>10000);
const syntax=spawnSync(process.execPath,['--check','dist/app.js'],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
const app=await readFile('dist/app.js','utf8');
assert(app.includes('escapeHTML')&&app.includes('window.print()')&&app.includes('localStorage'),'Core reading / print / persistence functions required');
console.log('Verified 7 subjects, 140 unique complete answers, HTTPS references, 8 PDFs and browser script syntax.');
const themeScript=await readFile('dist/theme.js','utf8');
function themeFixture(stored,systemDark=false,storageDenied=false){
  const root={dataset:{}},meta={},control={value:'',addEventListener:(_,fn)=>control.change=fn};
  const media={matches:systemDark,addEventListener:(_,fn)=>media.change=fn};
  const context={window:{matchMedia:()=>media},document:{documentElement:root,querySelector:()=>meta,getElementById:()=>control,addEventListener:(_,fn)=>fn()},localStorage:{getItem:()=>{if(storageDenied)throw Error('blocked');return stored;},setItem:(_,v)=>{if(storageDenied)throw Error('blocked');stored=v;}}};
  runInNewContext(themeScript,context);
  return{root,meta,control,media,saved:()=>stored};
}
const autoTheme=themeFixture(null);
assert.equal(autoTheme.root.dataset.theme,'light');
autoTheme.media.matches=true;autoTheme.media.change();assert.equal(autoTheme.root.dataset.theme,'dark');
autoTheme.control.value='light';autoTheme.control.change();autoTheme.media.change();
assert.equal(autoTheme.root.dataset.theme,'light','Explicit light mode must override system dark mode');
autoTheme.control.value='dark';autoTheme.control.change();assert.equal(autoTheme.saved(),'dark');
assert.equal(themeFixture(autoTheme.saved()).root.dataset.theme,'dark','Manual choice must survive reload');
assert.equal(themeFixture('invalid',true).control.value,'system');
assert.equal(themeFixture(null,true,true).root.dataset.theme,'dark','Blocked storage must not prevent theme initialization');
console.log('Verified system changes, manual overrides, saved theme reload, invalid preferences and unavailable storage.');
