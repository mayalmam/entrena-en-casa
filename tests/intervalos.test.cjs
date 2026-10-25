const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validConfig,phaseAtTime,totalMilliseconds,IntervalTimer}=require('../intervalos.js');
const c={work:40,rest:20,rounds:3};
test('fases exactas y sin descanso final',()=>{
 assert.equal(totalMilliseconds(c),160000);
 for(const [elapsed,kind,round,left] of [[0,'work',1,40],[39999,'work',1,1],[40000,'rest',1,20],[60000,'work',2,40],[100000,'rest',2,20],[120000,'work',3,40],[159999,'work',3,1],[160000,'done',3,0]]){
  const p=phaseAtTime(elapsed,c);assert.deepEqual([p.kind,p.round,p.left],[kind,round,left]);
 }
});
test('sin descanso y una sola ronda',()=>{
 assert.equal(phaseAtTime(40000,{work:40,rest:0,rounds:2}).kind,'work');
 assert.equal(phaseAtTime(40000,{work:40,rest:0,rounds:2}).round,2);
 assert.equal(phaseAtTime(80000,{work:40,rest:0,rounds:2}).kind,'done');
 assert.equal(totalMilliseconds({work:40,rest:300,rounds:1}),40000);
});
test('pausa, continuación, reinicio y pestaña inactiva',()=>{
 let now=1000;const t=new IntervalTimer(c,()=>now);t.start();now+=45000;
 assert.equal(t.state().kind,'rest');assert.equal(t.state().left,15);
 t.pause();now+=900000;assert.equal(t.state().left,15);
 t.start();now+=15000;assert.equal(t.state().round,2);assert.equal(t.state().left,40);
 now+=200000;assert.equal(t.state().kind,'done');t.pause();assert.equal(t.running,false);
 t.reset({work:30,rest:0,rounds:2});assert.equal(t.state().left,30);assert.equal(t.state().round,1);
});
test('valida límites y conserva la configuración',()=>{
 for(const bad of [{work:0,rest:20,rounds:2},{work:40,rest:-1,rounds:2},{work:40.5,rest:0,rounds:2},{work:40,rest:0,rounds:0},{work:40,rest:0,rounds:100},null])assert.ok(!validConfig(bad));
 assert.ok(validConfig({work:3600,rest:3600,rounds:99}));
 assert.throws(()=>new IntervalTimer({work:0,rest:0,rounds:1}));
 const original={...c},t=new IntervalTimer(original);original.work=99;assert.equal(t.config.work,40);
});
test('triple pitido y final prolongado con tonos distintos',()=>{
 const {soundPattern}=require('../intervalos.js');
 const work=soundPattern('triple',false,'work'),rest=soundPattern('triple',false,'rest');
 assert.equal(work.length,3);assert.equal(rest.length,3);
 assert.deepEqual(work.map(p=>p.at),[0,0.3,0.6]);
 assert.notEqual(work[0].frequency,rest[0].frequency);
 assert.equal(soundPattern('marked',false).length,1);
 for(const style of ['triple','marked']){
  const pulses=soundPattern(style,false),final=soundPattern(style,true);
  assert.equal(final.length,1);
  assert.ok(final[0].duration>pulses[pulses.length-1].at+pulses[pulses.length-1].duration);
 }
});
