const {test}=require('node:test');
const assert=require('node:assert/strict');
const {defaultInput,parseInput}=require('../../.local/test-build/lib/configuration/input.js');
const {generateModel,quantities,polygonArea}=require('../../.local/test-build/lib/geometry/generate.js');
const input=(extra={})=>({...structuredClone(defaultInput),...extra});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' != '+expected);
test('independent box controls: 188, opening 179, two layers 376',()=>{
  let q=quantities(generateModel(input())); close(q.roof,60);close(q.walls,128);close(q.total,188);
  q=quantities(generateModel(input({opening:{enabled:true,width:3,height:3,offset:3.5}})));close(q.total,179);
  close(quantities(generateModel(input({layers:2}))).total,376);
});
test('perimeter 10x6 with maximum bay 3 has 12 sections and 12 unique supports',()=>{
  const g=generateModel(input({shapeId:'C2'}));assert.equal(g.sections,12);assert.equal(g.supports.length,12);
  assert.equal(new Set(g.supports.map(s=>s.point.join(','))).size,12);
  close(quantities(g).total,128);
});
test('opening is clear of ground-to-roof posts, including added roof frames',()=>{
  const g=generateModel(input({opening:{enabled:true,width:3,height:3,offset:3.5},materialId:'M4',roofMaterialId:'M4'}));
  assert.ok(!g.members.some(m=>m.a[2]===-3&&m.b[2]===-3&&m.a[0]===m.b[0]&&Math.abs(m.a[0])<1.5&&Math.min(m.a[1],m.b[1])<3));
});
test('section boundary rebuilds support count, no stretched fixed model',()=>{
  const a=generateModel(input({shapeId:'C1',length:6})),b=generateModel(input({shapeId:'C1',length:6.1}));
  assert.equal(a.supports.length,3);assert.equal(b.supports.length,4);
});
test('screen, canopy and wall variants have independently calculated areas',()=>{
  close(quantities(generateModel(input({shapeId:'C1'}))).total,40);
  close(quantities(generateModel(input({shapeId:'C3'}))).total,60);
  close(quantities(generateModel(input({shapeId:'C5',variant:'screen'}))).total,40);
  close(quantities(generateModel(input({shapeId:'C5',variant:'shelter',projection:3}))).total,30);
});
test('nested contours use offsets from object, and exclusion changes actual order',()=>{
  const c=input({shapeId:'C8'}),g=generateModel(c),q=quantities(g);
  close(g.bounds.length,17);close(g.bounds.width,13);close(g.bounds.height,7);
  close(q.total, c.contours.reduce((s,t)=>s+(10+2*t.offset)*(6+2*t.offset)+2*((10+2*t.offset)+(6+2*t.offset))*t.height,0));
  const changed=input({shapeId:'C8',contours:c.contours.map((t,i)=>({...t,enabled:i!==1}))});
  assert.ok(quantities(generateModel(changed)).total<q.total);
  // Viewer visibility is deliberately absent from the saved layout schema.
  assert.throws(()=>parseInput({...c,hiddenGroups:['contour1']}));
});
test('faceted ring and roof area use actual faces, not an assumed smooth sphere',()=>{
  const c=input({shapeId:'C7',variant:'dome',diameter:8,rise:2}),g=generateModel(c),n=g.sections,r=4;
  const perimeter=2*n*r*Math.sin(Math.PI/n),apothem=r*Math.cos(Math.PI/n);
  close(quantities(g).walls,perimeter*4);
  close(quantities(g).roof,perimeter*Math.hypot(apothem,2)/2);
});
test('gallery arch/cable roofs are longer than plan, passage height remains clear',()=>{
  for(const variant of ['portal','arch','cable']){
    const g=generateModel(input({shapeId:'C6',variant}));const q=quantities(g);
    if(variant==='portal')close(q.roof,60);else assert.ok(q.roof>60);
    assert.ok(g.panels.filter(p=>p.role==='roof').every(p=>p.points.every(pt=>pt[1]>=4)));
  }
});
test('spatial chords and lattice are separate elements on four faces',()=>{
  const g=generateModel(input({shapeId:'C3',spatialSupports:true,structuralSystem:'spatial-truss'}));
  const a=g.members.filter(m=>m.kind==='frame'&&m.a[1]===0&&m.b[1]===2);
  assert.ok(a.length>=4);assert.ok(g.members.filter(m=>m.kind==='brace').length>20);
});
test('three foundation assemblies and three wall modules produce different solids',()=>{
  assert.deepEqual(['block','pile','pile-cap'].map(f=>generateModel(input({shapeId:'C1',foundation:f})).solids.length),[5,20,25]);
  for(const wallModule of ['W1','W2','W3']){
    const q=quantities(generateModel(input({shapeId:'C8',wallModule})));assert.ok(q.wallModules>0);assert.ok(q.wallVolume>0);
  }
});
test('all eight forms, variants, materials and three sizes have finite bounded geometry',()=>{
  for(const shapeId of ['C1','C2','C3','C4','C5','C6','C7','C8'])for(const size of [2,10,20])for(const materialId of ['M1','M2','M3','M4','M5','M6','M7','M8']){
    const c=input({shapeId,length:size,width:size,height:2,diameter:size,materialId,roofMaterialId:materialId,variant:shapeId==='C5'?'screen':shapeId==='C7'?'dome':'portal'});
    const g=generateModel(c);assert.ok(g.members.length>0&&g.members.length<=12000);
    assert.ok(g.members.every(m=>[...m.a,...m.b].every(Number.isFinite)));
    assert.ok(g.panels.every(p=>polygonArea(p.points)>0));
    assert.ok(Number.isFinite(quantities(g).total));
  }
});
test('invalid external JSON never reaches scene',()=>{
  for(const extra of [{length:-1},{length:NaN},{version:2},{step:0},{sides:[false]},{layers:1.5},{price:1},{opening:{enabled:true,width:20,height:3,offset:0}},{shapeId:'C8',contours:[{enabled:true,offset:1,height:1}]},{shapeId:'C3',roof:false}]){
    assert.throws(()=>parseInput(input(extra)));
  }
});
test('JSON roundtrip is exact, including services and foundations',()=>{
  const c=input({shapeId:'C8',foundation:'pile-cap',services:['installation'],wallModule:'W3'});
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(c))),c);
});
test('combined layers have independent quantities, footprint is not doubled',()=>{
  const q=quantities(generateModel(input({materialId:'M8',roofMaterialId:'M8'})));
  close(q.total,376);close(q.roof,60);close(q.walls,128);close(q.byMaterial.M1,188);close(q.byMaterial.M4,188);
});
test('repeated tubular layers increase actual infill geometry',()=>{
  const one=quantities(generateModel(input({shapeId:'C3',roofMaterialId:'M6'})));
  const two=quantities(generateModel(input({shapeId:'C3',roofMaterialId:'M6',layers:2})));
  close(two.infillLength,one.infillLength*2);
});
test('each contour can independently override material, layers and foundation',()=>{
  const c=input({shapeId:'C8',contours:[{enabled:true,offset:1,height:5,materialId:'M1',roofMaterialId:'M1',layers:2,foundation:'pile'},{enabled:true,offset:2,height:6,materialId:'M4',roofMaterialId:'M6',layers:1,foundation:'block'}]});
  const g=generateModel(c),q=quantities(g);
  close(q.byMaterial.M1,2*(12*8+2*(12+8)*5));close(q.byMaterial.M4,2*(14+10)*6);close(q.byMaterial.M6,14*10);
  assert.ok(g.solids.filter(s=>s.group==='contour1').every(s=>s.material==='steel'));
  assert.ok(g.solids.filter(s=>s.group==='contour2').every(s=>s.material==='concrete'));
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(c))),c);
});
test('truss passage still preserves stated clear height in the graph',()=>{
  const g=generateModel(input({shapeId:'C6',variant:'portal',structuralSystem:'spatial-truss'}));
  assert.ok(g.members.filter(m=>m.kind==='brace').every(m=>Math.min(m.a[1],m.b[1])>=4));
});
