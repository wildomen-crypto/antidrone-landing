const {test}=require('node:test');
const assert=require('node:assert/strict');
const {computeBudget}=require('../../.local/test-build/lib/pricing/budget.js');
const {projectLaborPrice}=require('../../.local/test-build/lib/pricing/project-labor.js');
const {projectPricing}=require('../../.local/test-build/config/project-pricing.js');
const {estimate}=require('../../.local/test-build/lib/pricing/estimate.js');
const {defaultInput}=require('../../.local/test-build/lib/configuration/input.js');
const {generateModel}=require('../../.local/test-build/lib/geometry/generate.js');
const lines=[{id:'frame',label:'Frame',quantity:10.5,unit:'m',required:true},{id:'manufacturing',label:'Manufacturing',quantity:1,unit:'order',required:true}];
const fixture={version:'unit-test-only',approved:true,currency:'RUB',vat:'included',rates:{frame:{unit:'m',value:3.333,includes:['manufacturing']}}};
test('missing approval/version/VAT or required rates keeps amount null',()=>{
  assert.equal(computeBudget(lines,{...fixture,approved:false}).amount,null);
  assert.equal(computeBudget(lines,{...fixture,vat:null}).amount,null);
  assert.equal(computeBudget(lines,{...fixture,rates:{}}).amount,null);
  assert.equal(computeBudget(lines,{...fixture,rates:{frame:{unit:'m2',value:1}}}).amount,null);
});
test('included work is not charged twice; round money once per line',()=>{
  const result=computeBudget(lines,fixture);assert.equal(result.amount,35);assert.equal(result.items.length,1);
});
test('duplicates and invalid amounts are rejected',()=>{
  assert.throws(()=>computeBudget([...lines,lines[0]],fixture));
  assert.throws(()=>computeBudget([{...lines[0],quantity:NaN}],fixture));
  assert.throws(()=>computeBudget(lines,{...fixture,rates:{frame:{unit:'m',value:-1}}}));
});
test('cyclic included work cannot silently produce a zero quote',()=>{
  assert.throws(()=>computeBudget(lines,{...fixture,rates:{frame:{unit:'m',value:10,includes:['manufacturing']},manufacturing:{unit:'order',value:5,includes:['frame']}}}),/CYCLIC_RATE_INCLUSIONS/);
});

const workload={frameMembers:20,frameLength:100,weightedArea:80,supports:4,height:4,opening:true,piledFoundation:false,shapeId:'C1'};
test('draft design hours match independent KM/KMD/KZh examples and selected scopes',()=>{
  // KM: 8 + .7 + .9 + 2 + .4 + .5 = 12.5 h; KMD: 15.87 h; KZh: 8.6 h.
  const km=projectLaborPrice(workload,['km'],projectPricing);
  assert.equal(km.hours,12.5);assert.equal(km.amount,15625);assert.equal(km.low,10438);assert.equal(km.high,20875);assert.equal(km.currency,'RUB');
  assert.equal(projectLaborPrice(workload,['kmd'],projectPricing).amount,19838);
  assert.equal(projectLaborPrice(workload,['kzh'],projectPricing).amount,10750);
  const all=projectLaborPrice(workload,['km','kmd','kzh'],projectPricing);
  assert.ok(Math.abs(all.hours-36.97)<1e-9);assert.equal(all.amount,46213);
  assert.equal(all.low,30870);assert.equal(all.high,61740);assert.equal(all.items.length,3);
});
test('height, foundation and editable hourly rate affect workload quote',()=>{
  // C6 factor 1.25; at height 8 m: 1.25*(1+.035*4) = 1.425.
  assert.equal(projectLaborPrice({...workload,shapeId:'C6',height:8},['km'],projectPricing).amount,22266);
  assert.equal(projectLaborPrice({...workload,piledFoundation:true},['kzh'],projectPricing).amount,15050);
  assert.equal(projectLaborPrice(workload,['km'],{...projectPricing,hourlyRate:1670}).amount,20875);
});
test('empty scopes show no price; invalid workloads and duplicate sections are rejected',()=>{
  const empty=projectLaborPrice(workload,[],projectPricing);assert.equal(empty.amount,null);assert.equal(empty.mode,'not-selected');assert.equal(empty.hours,0);
  assert.throws(()=>projectLaborPrice({...workload,frameLength:NaN},['km'],projectPricing));
  assert.throws(()=>projectLaborPrice(workload,['km','km'],projectPricing));
  assert.throws(()=>projectLaborPrice(workload,['unknown'],projectPricing));
  assert.throws(()=>projectLaborPrice(workload,['km'],{...projectPricing,hourlyRate:-1}));
});
test('geometry and selected design sections drive the same estimate used by client and server',()=>{
  const input={...structuredClone(defaultInput),shapeId:'C3',length:10,width:6,height:4,opening:{...defaultInput.opening,enabled:false},services:['km','kmd']};
  const price=value=>estimate(generateModel(value),value).projectPrice;
  const initial=price(input);assert.ok(initial.amount>0);
  assert.ok(price({...input,length:20}).amount>initial.amount);
  assert.ok(price({...input,height:8}).amount>initial.amount);
  assert.ok(price({...input,services:['km']}).amount<initial.amount);
  assert.ok(price({...input,services:['km','kmd','kzh']}).amount>initial.amount);
  assert.equal(price({...input,services:[]}).amount,null);
  const server=estimate(generateModel(input),JSON.parse(JSON.stringify(input)));
  assert.deepEqual(server.projectPrice,initial);
  assert.equal(server.amount,initial.amount);assert.equal(server.priceVersion,projectPricing.version);
  assert.equal(estimate(generateModel(input)).amount,null);
});
