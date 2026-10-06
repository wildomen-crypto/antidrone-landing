const {test}=require('node:test');
const assert=require('node:assert/strict');
const {defaultInput,parseInput}=require('../../.local/test-build/lib/configuration/input.js');
const {generateModel,quantities,polygonArea,isStructuralMember}=require('../../.local/test-build/lib/geometry/generate.js');
const {isStructureSelected,toggleStructure,selectStructuralLayout}=require('../../.local/test-build/lib/configuration/structure.js');
const {roofRequired,selectRoof}=require('../../.local/test-build/lib/configuration/roof.js');
const {hasWallOptions,wallFillingEnabled,selectWalls}=require('../../.local/test-build/lib/configuration/walls.js');
const input=(extra={})=>({...structuredClone(defaultInput),...extra});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' != '+expected);

test('bracket opens wall canopy and every other support restores the preceding shape',()=>{
  for(const shapeId of ['C1','C2','C3','C4','C5','C6','C7','C8']) {
    const variant=shapeId==='C5'?'screen':shapeId==='C6'?'arch':shapeId==='C7'?'dome':'portal';
    const before=input({shapeId,variant,roof:shapeId==='C3',length:17,materialId:'M5'});
    const canopy=selectStructuralLayout(before,null,'wall-bracket');
    assert.equal(canopy.input.shapeId,'C5');assert.equal(canopy.input.variant,'shelter');
    assert.equal(canopy.input.roof,true);assert.equal(canopy.input.opening.enabled,false);
    assert.equal(canopy.input.structuralSystem,'wall-bracket');assert.equal(canopy.input.length,17);
    assert.doesNotThrow(()=>generateModel(canopy.input));
    const again=selectStructuralLayout(canopy.input,canopy.previous,'wall-bracket');
    assert.deepEqual(again.previous,canopy.previous);
    for(const id of ['tube-post','spatial-column','frame','spatial-truss','guyed-mast','spatial-combined']) {
      const restored=selectStructuralLayout({...again.input,length:19,materialId:'M2'},again.previous,id);
      assert.equal(restored.previous,null);assert.equal(restored.input.shapeId,shapeId);
      assert.equal(restored.input.variant,variant);assert.equal(restored.input.roof,before.roof);
      assert.equal(restored.input.length,19);assert.equal(restored.input.materialId,'M2');
      assert.equal(restored.input.structuralSystem,id==='spatial-combined'?'spatial-truss':id);
      assert.equal(restored.input.spatialSupports,id==='spatial-combined');
      assert.doesNotThrow(()=>generateModel(restored.input));
    }
  }
});

test('bracket return preserves original opening but disables it if edited dimensions no longer fit',()=>{
  const before=input({opening:{enabled:true,width:3,height:3,offset:3.5}});
  const canopy=selectStructuralLayout(before,null,'wall-bracket');
  const back=selectStructuralLayout(canopy.input,canopy.previous,'frame');
  assert.deepEqual(back.input.opening,before.opening);
  const smaller=selectStructuralLayout({...canopy.input,length:4},canopy.previous,'frame');
  assert.equal(smaller.input.opening.enabled,false);assert.doesNotThrow(()=>generateModel(smaller.input));
  const manual=selectStructuralLayout(input({shapeId:'C6',variant:'cable'}),null,'frame');
  assert.equal(manual.input.shapeId,'C6');assert.equal(manual.input.variant,'cable');
});

test('mast guy wires belong to structure, while cable-net filling remains separate',()=>{
  const graph=generateModel(input({structuralSystem:'guyed-mast',materialId:'M5',roofMaterialId:'M5'}));
  const guys=graph.members.filter(m=>m.role==='guy');
  const net=graph.members.filter(m=>m.kind==='cable'&&m.role!=='guy');
  assert(guys.length>0);assert(net.length>0);
  assert(guys.every(m=>isStructuralMember(m)&&m.b[1]===0));
  assert(net.every(m=>!isStructuralMember(m)));
  assert(generateModel(input({structuralSystem:'tube-post',materialId:'M5'})).members.every(m=>m.role!=='guy'));
});

test('PVL defaults and legacy configurations preserve their saved materials and wall state',()=>{
  assert.equal(defaultInput.materialId,'M7');assert.equal(defaultInput.roofMaterialId,'M7');
  const legacy=input({materialId:'M5',roofMaterialId:'M1'});delete legacy.walls;
  const restored=parseInput(legacy);assert.equal(restored.walls,true);assert.equal(restored.materialId,'M5');assert.equal(restored.roofMaterialId,'M1');
  assert.deepEqual(generateModel(restored),generateModel({...legacy,walls:true}));
  assert.throws(()=>parseInput(input({walls:'false'})),/Неверное поле walls/);
  const off=parseInput(input({walls:false}));assert.deepEqual(parseInput(JSON.parse(JSON.stringify(off))),off);
});
test('wall material toggles fill independently, retains sides and restores legacy empty round sides',()=>{
  const c=input({sides:[true,false,true,false],opening:{enabled:true,width:3,height:3,offset:3.5}});
  const off={...c,...selectWalls(c,'M7')};assert.equal(off.walls,false);assert.equal(off.opening.enabled,false);
  assert.deepEqual(off.sides,c.sides);close(quantities(generateModel(off)).walls,0);close(quantities(generateModel(off)).roof,60);
  const on={...off,...selectWalls(off,'M7')};assert.equal(on.walls,true);assert.deepEqual(on.sides,c.sides);
  close(quantities(generateModel(on)).walls,80);assert.equal(on.roofMaterialId,c.roofMaterialId);
  const oldRound=input({shapeId:'C7',variant:'dome',sides:[false,true,true,true]});
  assert.equal(wallFillingEnabled(oldRound),false);
  assert.equal(selectWalls(oldRound,'M7').sides[0],true);
  for(const shape of [{shapeId:'C3'},{shapeId:'C5',variant:'shelter'}])assert.equal(hasWallOptions(input(shape)),false);
});
test('all wall-capable shapes keep structure and roof quantities with filling disabled',()=>{
  for(const shapeId of ['C1','C2','C4','C5','C6','C7','C8']){
    const c=input({shapeId,variant:shapeId==='C5'?'screen':shapeId==='C7'?'dome':'portal'});
    const full=generateModel(c),bare=generateModel({...c,walls:false});
    close(quantities(bare).walls,0);close(quantities(bare).roof,quantities(full).roof);
    assert.ok(bare.members.length>0);assert.deepEqual(bare.supports,full.supports);
    assert.ok(bare.panels.every(panel=>panel.role==='roof'));
    const noFill=generateModel({...c,walls:false,roof:false});close(quantities(noFill).total,0);assert.ok(noFill.members.length>0);
  }
});
test('round roof controls dome; legacy perimeter preserves open geometry and exports canonical input',()=>{
  const legacy=input({shapeId:'C7',variant:'perimeter',roof:true});
  const ring=parseInput(legacy);
  assert.equal(ring.variant,'dome');assert.equal(ring.roof,false);
  assert.deepEqual(ring,parseInput({...legacy,roof:false}));
  assert.deepEqual(generateModel(legacy),generateModel(ring));
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(ring))),ring);
  const open=generateModel(ring),covered=generateModel({...ring,...selectRoof(ring,'M5')});
  close(quantities(open).roof,0);assert.ok(quantities(covered).roof>0);
  close(quantities(open).walls,quantities(covered).walls);
  close(open.bounds.height,ring.height);close(covered.bounds.height,ring.height+ring.rise);
  assert.equal(parseInput(input({shapeId:'C7',variant:'dome',roof:false})).roof,false);
  assert.throws(()=>parseInput({...legacy,roof:'true'}),/Неверное поле roof/);
});
test('independent box controls: 188, opening 179, two layers 376',()=>{
  let q=quantities(generateModel(input())); close(q.roof,60);close(q.walls,128);close(q.total,188);
  q=quantities(generateModel(input({opening:{enabled:true,width:3,height:3,offset:3.5}})));close(q.total,179);
  close(quantities(generateModel(input({layers:2}))).total,376);
});
test('roof material toggles optional cover without altering walls or combined material settings',()=>{
  const c=input({materialId:'M5',roofMaterialId:'M5'}),off={...c,...selectRoof(c,'M5')};
  assert.equal(off.roof,false);assert.equal(off.roofMaterialId,'M5');
  close(quantities(generateModel(off)).total,128);
  const on={...off,...selectRoof(off,'M5')};assert.equal(on.roof,true);close(quantities(generateModel(on)).total,188);
  const changed={...off,...selectRoof(off,'M8')};assert.equal(changed.roof,true);close(quantities(generateModel(changed)).total,248);
  assert.equal(changed.materialId,'M5');assert.deepEqual(changed.combinedMaterials,c.combinedMaterials);
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(off))),off);
});
test('canopy and wall shelter always retain their required cover',()=>{
  for(const shape of [{shapeId:'C3'},{shapeId:'C5',variant:'shelter'}]) {
    const c=input(shape);assert.equal(roofRequired(c),true);
    assert.equal(selectRoof(c,c.roofMaterialId).roof,true);
    assert.equal(selectRoof({...c,roof:false},'M1').roof,true);
  }
  assert.equal(roofRequired(input()),false);
  assert.equal(roofRequired(input({shapeId:'C5',variant:'screen'})),false);
  // Old shelter files rendered a cover regardless of the flag: restore that exact behavior explicitly.
  const shelter=parseInput(input({shapeId:'C5',variant:'shelter',roof:false}));assert.equal(shelter.roof,true);
  close(quantities(generateModel(shelter)).roof,30);
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
test('spatial columns and trusses combine in either selection order and deselect independently',()=>{
  const start={structuralSystem:'tube-post',spatialSupports:false};
  const combined=toggleStructure(toggleStructure(start,'spatial-column'),'spatial-truss');
  assert.deepEqual(combined,toggleStructure(toggleStructure(start,'spatial-truss'),'spatial-column'));
  assert.ok(isStructureSelected(combined,'spatial-column')&&isStructureSelected(combined,'spatial-truss'));
  assert.equal(isStructureSelected(combined,'tube-post'),false);
  const q=quantities(generateModel(input(combined)));
  assert.ok(q.memberLength>quantities(generateModel(input({structuralSystem:'spatial-column'}))).memberLength);
  assert.ok(q.memberLength>quantities(generateModel(input({structuralSystem:'spatial-truss'}))).memberLength);
  close(q.total,188);
  assert.deepEqual(toggleStructure(combined,'spatial-column'),{structuralSystem:'spatial-truss',spatialSupports:false});
  assert.deepEqual(toggleStructure(combined,'spatial-truss'),{structuralSystem:'spatial-column',spatialSupports:false});
  for(const id of ['tube-post','frame','guyed-mast','wall-bracket']) assert.deepEqual(toggleStructure(combined,id),{structuralSystem:id,spatialSupports:false});
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(input(combined)))),input(combined));
});
test('removed piles are rejected at both public configuration boundaries',()=>{
  assert.throws(()=>parseInput(input({foundation:'pile'})),/Сваи без ростверка больше недоступны/);
  assert.throws(()=>parseInput(input({contours:[{enabled:true,offset:1,height:5,foundation:'pile'}]})),/Сваи без ростверка больше недоступны/);
});
test('explicit contour system overrides the global spatial column and truss combination',()=>{
  const c=input({shapeId:'C8',structuralSystem:'spatial-truss',spatialSupports:true,contours:[
    {enabled:true,offset:1,height:5},{enabled:true,offset:2,height:6,structuralSystem:'tube-post'}]});
  const g=generateModel(c),without=generateModel({...c,spatialSupports:false});
  const geometry=graph=>graph.members.filter(m=>m.group==='contour2').map(({id,...member})=>member);
  assert.deepEqual(geometry(g),geometry(without));
  assert.ok(g.members.filter(m=>m.group==='contour1').length>without.members.filter(m=>m.group==='contour1').length);
});
test('two available foundation assemblies and three wall modules produce different solids',()=>{
  assert.deepEqual(['block','pile-cap'].map(f=>generateModel(input({shapeId:'C1',foundation:f})).solids.length),[5,25]);
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
  const c=input({shapeId:'C8',foundation:'pile-cap',services:['km','kmd','kzh'],wallModule:'W3'});
  assert.deepEqual(parseInput(JSON.parse(JSON.stringify(c))),c);
});

test('design sections stay independent; old services preserve geometry without choosing new sections',()=>{
  for(const services of [[],['km'],['kmd'],['kzh'],['km','kzh']]){
    assert.deepEqual(parseInput(input({services})).services,services);
  }
  const legacy=input({length:23,width:12,services:['design','manufacturing','supply','delivery','installation']});
  assert.deepEqual(parseInput(legacy),{...legacy,services:[]});
  assert.deepEqual(parseInput(input({services:['installation','kzh']})).services,['kzh']);
  for(const services of [['km','km'],['design','design'],['unknown'],[null],'km']){
    assert.throws(()=>parseInput(input({services})),/Проверьте перечень работ/);
  }
});

test('quote drafts restore design sections and flag old scopes of work',()=>{
  const {readQuoteDraft,saveQuoteDraft,clearQuoteDraft}=require('../../.local/test-build/lib/configuration/quote-draft.js');
  const storage=new Map();const previousWindow=global.window;
  global.window={localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
  try{
    const configuration=input({services:['kzh'],length:27});
    assert.equal(saveQuoteDraft(configuration),true);
    assert.deepEqual(readQuoteDraft(),{configuration,servicesUpdated:false});
    storage.set('topengineer:quote-configuration:v1',JSON.stringify({...configuration,services:['design','manufacturing']}));
    assert.deepEqual(readQuoteDraft(),{configuration:{...configuration,services:[]},servicesUpdated:true});
    clearQuoteDraft();assert.equal(readQuoteDraft(),null);
    storage.set('topengineer:quote-configuration:v1','broken');assert.equal(readQuoteDraft(),null);
  }finally{if(previousWindow===undefined)delete global.window;else global.window=previousWindow;}
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
  const c=input({shapeId:'C8',contours:[{enabled:true,offset:1,height:5,materialId:'M1',roofMaterialId:'M1',layers:2,foundation:'pile-cap'},{enabled:true,offset:2,height:6,materialId:'M4',roofMaterialId:'M6',layers:1,foundation:'block'}]});
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
