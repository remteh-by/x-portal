import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../shared/profile.js';
import {libraryFromProfile,validateLibrary,activeProfile,addProfile,copyProfile,selectProfile,removeProfile,updateActiveProfile,mergeLibrary} from '../shared/profile-library.js';

test('legacy profile migrates without changing its controls',()=>{const old={...DEFAULT_PROFILE,name:'My existing profile',sensitivity:.008};const library=libraryFromProfile(old);assert.deepEqual(activeProfile(library),old);assert.deepEqual(validateLibrary(JSON.parse(JSON.stringify(library))),library);});
test('copy, edit, choose and delete keep independent profiles and a valid selection',()=>{
 let library=libraryFromProfile();const first=library.activeId;library=copyProfile(library);const copied=library.activeId;
 library=updateActiveProfile(library,{...activeProfile(library),name:'Racing',sensitivity:.01});
 assert.equal(activeProfile(selectProfile(library,first)).sensitivity,.004);assert.equal(activeProfile(selectProfile(library,copied)).sensitivity,.01);
 library=removeProfile(library,copied);assert.equal(library.activeId,first);assert.throws(()=>removeProfile(library,first));
});
test('duplicate names, identities, invalid selections and excessive libraries are refused',()=>{
 const first=libraryFromProfile();let library=addProfile(first,DEFAULT_PROFILE,'Second');
 assert.throws(()=>updateActiveProfile(library,{...activeProfile(library),name:'STANDARD'}));
 assert.throws(()=>validateLibrary({...library,activeId:'missing'}));
 assert.throws(()=>validateLibrary({...library,profiles:[library.profiles[0],library.profiles[0]]}));
 for(let i=2;i<50;i++)library=addProfile(library,DEFAULT_PROFILE,'Profile');
 assert.equal(library.profiles.length,50);assert.throws(()=>addProfile(library));assert.throws(()=>validateLibrary({...first,unexpected:true}));
});

test('library imports retain active selection and skip equivalent key order',()=>{
 const original=libraryFromProfile();const imported=libraryFromProfile({...DEFAULT_PROFILE,bindings:Object.fromEntries(Object.entries(DEFAULT_PROFILE.bindings).reverse())});
 const same=mergeLibrary(original,imported);assert.equal(same.profiles.length,1);assert.equal(same.activeId,original.activeId);
 const extra=addProfile(imported,{...DEFAULT_PROFILE,allowMicrophone:true},'Imported');const merged=mergeLibrary(original,extra);
 assert.equal(merged.profiles.length,2);assert.equal(merged.activeId,original.activeId);assert.equal(activeProfile(merged).allowMicrophone,false);
 assert.deepEqual(validateLibrary(JSON.parse(JSON.stringify(merged))),merged);
});
