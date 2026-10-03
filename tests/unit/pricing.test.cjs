const {test}=require('node:test');
const assert=require('node:assert/strict');
const {computeBudget}=require('../../.local/test-build/lib/pricing/budget.js');
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
