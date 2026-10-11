import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const root = new URL('../',import.meta.url);
function setup(storage = new Map()) {
  const handlers = {}, emitted = [];
  const window = { localStorage: { getItem:k=>storage.get(k), setItem:(k,v)=>storage.set(k,v) }, crypto:webcrypto, setInterval:()=>0, OSLab: {
    events: { subscribe(t,fn) { (handlers[t] ||= []).push(fn); }, emit(type,detail) { emitted.push({type,detail}); (handlers[type] || []).forEach(fn=>fn({type,detail})); } },
    shell: { openApp() {} },
  }};
  const context = vm.createContext({window,TextEncoder,Uint8Array,Uint32Array,URL,console});
  for(const file of ['js/core/activity-coordinator.js','js/browser/browser-state.js','js/digital/digital-content.js','js/digital/digital-life.js','js/digital/digital-life-trail.js']) vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
  return { O:window.OSLab,storage,emitted,context };
}
const credentials = (email='ana.aluna@gmail.com',password='Aula2026!') => ({email,password,confirmation:password,name:'Ana',surname:'Aluna',day:12,month:3,year:2007,use:'personal',phoneConfirmed:true});
const search = (O,q) => O.events.emit('browser:action',{action:'search',query:q,url:'search:'+encodeURIComponent(q)});
const done = (O,n) => Boolean(O.digitalLifeTrail.getProgress().completed['digital-'+n]);
async function firstThree(O) {
 const D=O.digitalLife,T=O.digitalLifeTrail;
 T.start('digital-1');search(O,'Criar Gmail');await D.register('google',credentials());D.readMessage('gmail','google-welcome');assert.ok(done(O,1));
 T.start('digital-2');search(O,'Outlook');await D.register('outlook',credentials('ana.aluna@outlook.com','Outlook2026'));T.observe('inbox-view','outlook');assert.ok(done(O,2));
 T.start('digital-3');await D.register('yahoo',credentials('ana.aluna@yahoo.com','Yahoo2026'));T.observe('inbox-view','yahoo');assert.ok(done(O,3));
}
test('12 missões sequenciais: contas, verificação, serviços e quatro retornos',async()=>{
 const {O,storage,emitted}=setup(),D=O.digitalLife,T=O.digitalLifeTrail;
 assert.equal(T.catalog.length,12);
 assert.equal(T.start('digital-4').ok,false);
 await firstThree(O);
 T.start('digital-4');
 O.events.emit('browser:action',{action:'new-tab'});search(O,'Netflix');
 O.events.emit('browser:action',{action:'first-result',url:'netflix.oslab.local'});
 D.requestNetflixCode('ana.aluna@gmail.com');
 const message=D.inbox('gmail').find(m=>m.kind==='verification');
 assert.match(message.body,/^\d{6}$/);assert.equal(message.to,'ana.aluna@gmail.com');
 D.readMessage('gmail',message.id);D.verifyNetflixCode(message.to,message.body);
 await D.register('netflix',credentials(message.to,'Netflix2026'));
 assert.equal(done(O,4),false);
 D.action('netflix','plan','Premium');D.action('netflix','payment');assert.equal(done(O,4),false);
 D.action('netflix','profile','Ana');assert.ok(done(O,4));
 T.start('digital-5');await D.register('spotify',credentials(message.to,'Spotify2026'));D.action('spotify','favorite','song-1');assert.equal(done(O,5),false);T.observe('song-open','spotify');assert.ok(done(O,5));
 T.start('digital-6');await D.register('discord',credentials(message.to,'Discord2026'));D.action('discord','display-name','Ana exploradora');D.action('discord','community');assert.ok(done(O,6));
 T.start('digital-7');assert.ok(D.session('youtube'));assert.equal(done(O,7),false);D.action('youtube','profile-view');assert.ok(done(O,7));
 T.start('digital-8');D.action('drive','folder','Outra pasta');assert.equal(done(O,8),false);D.action('drive','folder','Meus Documentos');assert.ok(done(O,8));
 T.start('digital-9');D.readMessage('outlook','outlook-welcome');assert.equal(done(O,9),false);
 D.logout('outlook');search(O,'Outlook Entrar');await D.login('outlook','ana.aluna@outlook.com','Outlook2026');D.readMessage('outlook','outlook-welcome');assert.ok(done(O,9));
 T.start('digital-10');T.observe('inbox-view','yahoo');assert.equal(done(O,10),false);D.logout('yahoo');await D.login('yahoo','ana.aluna@yahoo.com','Yahoo2026');T.observe('inbox-view','yahoo');assert.ok(done(O,10));
 T.start('digital-11');D.action('netflix','profile','Ana');assert.equal(done(O,11),false);D.logout('netflix');await D.login('netflix',message.to,'Netflix2026');D.action('netflix','profile','Ana');assert.ok(done(O,11));
 T.start('digital-12');D.logout('spotify');await D.login('spotify',message.to,'Spotify2026');D.action('spotify','open-favorite','song-1');assert.ok(done(O,12));
 assert.equal(Object.keys(T.getProgress().completed).length,12);
 assert.equal(D.inbox('gmail').length,2);
 const fresh=setup(storage).O;
 assert.equal(fresh.digitalLife.account('netflix').data.profile,'Ana');
 assert.deepEqual(Array.from(fresh.digitalLife.account('drive').data.folders),['Outra pasta','Meus Documentos']);
 assert.deepEqual(Array.from(fresh.digitalLife.account('spotify').data.favorites),['song-1']);
 const serialized=storage.get(D.key);
 for(const secret of ['Aula2026!','Netflix2026','Spotify2026','Outlook2026','Yahoo2026','Discord2026']) { assert.ok(!serialized.includes(secret));assert.ok(!JSON.stringify(emitted).includes(secret)); }
 assert.match(serialized,/PBKDF2-SHA256/);
});
test('campos inválidos, endereço reservado, confirmação e isolamento de senhas',async()=>{
 const {O}=setup(),D=O.digitalLife;
 await assert.rejects(D.register('google',credentials('admin@gmail.com')),/indisponível/);
 await assert.rejects(D.register('google',{...credentials(),day:31,month:2}),/data/);
 await assert.rejects(D.register('google',{...credentials(),confirmation:'diferente'}),/coincidem/);
 await assert.rejects(D.register('google',{...credentials(),password:'abc',confirmation:'abc'}),/8 a 128/);
 await assert.rejects(D.register('google',{...credentials(),use:'company'}),/pessoal/);
 await D.register('google',credentials());
 await assert.rejects(D.register('google',credentials()),/indisponível/);
 await assert.rejects(D.login('google','outra@gmail.com','Aula2026!'),/encontramos/);
 await assert.rejects(D.login('google','ana.aluna@gmail.com','Incorreta8'),/incorreta/);
 await D.register('spotify',credentials('ana.aluna@gmail.com','Spotify2026'));
 D.logout('spotify');
 await assert.rejects(D.login('spotify','ana.aluna@gmail.com','Aula2026!'),/incorreta/);
 await D.login('spotify','ana.aluna@gmail.com','Spotify2026');
 D.logout('youtube');assert.equal(D.session('gmail'),null);assert.equal(D.session('drive'),null);assert.ok(D.session('spotify'));
});
test('Netflix: leitura obrigatória, código incorreto, idempotência, consumo e exclusividade',async()=>{
 const {O,storage}=setup(),D=O.digitalLife,T=O.digitalLifeTrail;
 await firstThree(O);
 assert.throws(()=>D.requestNetflixCode('ana.aluna@gmail.com'),/missão 04/);
 T.start('digital-4');
 assert.throws(()=>D.requestNetflixCode('outra@gmail.com'),/missão 01/);
 D.requestNetflixCode('ana.aluna@gmail.com');
 const code=D.inbox('gmail')[1].body;
 assert.throws(()=>D.verifyNetflixCode('ana.aluna@gmail.com',code),/leia/);
 D.requestNetflixCode('ana.aluna@gmail.com');D.requestNetflixCode('ana.aluna@gmail.com');
 assert.equal(D.inbox('gmail').length,2);assert.equal(D.inbox('gmail')[1].body,code);
 const fresh=setup(storage).O;
 fresh.digitalLife.requestNetflixCode('ana.aluna@gmail.com');
 assert.equal(fresh.digitalLife.inbox('gmail').length,2);
 fresh.digitalLife.readMessage('gmail','netflix-verification');
 assert.throws(()=>fresh.digitalLife.verifyNetflixCode('ana.aluna@gmail.com','wrong'),/incorreto/);
 fresh.digitalLife.verifyNetflixCode('ana.aluna@gmail.com',code);
 assert.throws(()=>fresh.digitalLife.verifyNetflixCode('ana.aluna@gmail.com',code),/utilizado/);
 assert.ok(fresh.digitalLife.requestNetflixCode('ana.aluna@gmail.com').verified);
 assert.equal(fresh.digitalLife.inbox('gmail')[0].kind,'welcome');
});
test('atividade suspensa preserva a tentativa sem aceitar ações até retomar',async()=>{
 const {O}=setup(),D=O.digitalLife,T=O.digitalLifeTrail;
 T.start('digital-1');search(O,'Criar Gmail');
 O.activityCoordinator.register('other',{isActive:()=>false});O.activityCoordinator.claim('other');
 await D.register('google',credentials());D.readMessage('gmail','google-welcome');assert.equal(done(O,1),false);
 assert.equal(T.getProgress().active.suspended,true);
 T.start('digital-1');assert.equal(T.getProgress().active.checklist.search,true);
});
test('abas preservam caminhos, parâmetros e histórico ao reabrir; rascunhos excluem segredos',()=>{
 const {O,storage}=setup(),B=O.browserState,D=O.digitalLife;
 const state=B.create('netflix.oslab.local/signup/verify'),first=state.activeTab;
 B.open(state,'gmail.oslab.local/inbox');B.navigate(state,'gmail.oslab.local/message/netflix-verification');
 B.activate(state,first);assert.equal(state.currentUrl,'netflix.oslab.local/signup/verify');
 B.navigate(state,'netflix.oslab.local/watch?id=movie-4&source=home');B.back(state);B.forward(state);
 D.browser('google',B.snapshot(state));
 const restored=B.hydrate(setup(storage).O.digitalLife.browser('google'));
 assert.equal(restored.currentUrl,'netflix.oslab.local/watch?id=movie-4&source=home');
 assert.ok(!restored.tabs.some(t=>t.id===B.open(restored,'newtab').id && t.id===first));
 D.setDraft('tab-1',{email:'ana@gmail.com',name:'Ana',password:'secret',confirmation:'secret',code:'654321',demoCard:'0000'});
 assert.equal(D.getDraft('tab-1').email,'ana@gmail.com');
 for(const field of ['password','confirmation','code','demoCard']) assert.equal(D.getDraft('tab-1')[field],undefined);
});
test('Novo aluno limpa somente esta trilha, inclusive operações criptográficas em andamento',async()=>{
 const {O,storage}=setup(),D=O.digitalLife,T=O.digitalLifeTrail;
 storage.set('oslab.other','preservar');T.start('digital-1');
 const pending=D.register('google',credentials());
 D.reset();await assert.rejects(pending,/reiniciada/);
 assert.equal(D.account('google'),null);assert.equal(T.getProgress().active,null);
 assert.equal(storage.get('oslab.other'),'preservar');
 assert.deepEqual(Object.keys(JSON.parse(storage.get(D.key)).accounts),[]);
});
test('catálogos usam 20 títulos, 12 vídeos e imagens locais presentes no precache',()=>{
 const {O}=setup(),C=O.digitalContent;
 const precache=JSON.parse(fs.readFileSync(new URL('precache-manifest.json',root),'utf8'));
 assert.equal(C.movies.length,20);assert.equal(C.videos.length,12);
 for(const item of [...C.movies,...C.videos,...C.songs]) { assert.ok(fs.existsSync(new URL(item.image,root)));assert.ok(precache.includes('./'+item.image)); }
});
