import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportDestination} from '../shared/support.js';
const registry=JSON.parse(fs.readFileSync(new URL('../support/registry.json',import.meta.url),'utf8'));
test('all bundled support choices resolve to the exact public recipient',()=>{
 assert.equal(registry.methods.length,6);
 for(const method of registry.methods){
  assert.equal(supportDestination(method.id),method.url);
  for(const copy of Object.values(registry.texts)){
   assert(copy['method_status_'+method.status]);assert(copy['method_cadence_'+method.cadence]);
  }
 }
});
test('privileged browser opener rejects URLs, prototype names and missing IDs',()=>{
 for(const id of [undefined,null,'','__proto__','constructor','https://ko-fi.com/pavelzayats','file:///etc/passwd','javascript:alert(1)',{},['kofi']])
  assert.throws(()=>supportDestination(id),/Unknown support method/);
});
