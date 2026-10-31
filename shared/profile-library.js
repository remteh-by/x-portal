import {DEFAULT_PROFILE,validateProfile} from './profile.js';
export const MAX_PROFILES=50;
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const nameKey=name=>name.normalize('NFKC').toLocaleLowerCase('en-US');

export function validateLibrary(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.schema!==1||Object.keys(value).some(key=>!['schema','activeId','profiles'].includes(key)))throw new Error('Unsupported profile library');
 if(!Array.isArray(value.profiles)||value.profiles.length<1||value.profiles.length>MAX_PROFILES)throw new Error('Keep between 1 and 50 profiles');
 const ids=new Set(),names=new Set();
 const profiles=value.profiles.map(row=>{
  if(!row||typeof row.id!=='string'||!idPattern.test(row.id)||Object.keys(row).some(key=>!['id','profile'].includes(key))||ids.has(row.id))throw new Error('Invalid profile identity');
  const profile=validateProfile(row.profile),name=nameKey(profile.name);
  if(names.has(name))throw new Error('A profile with this name already exists');
  ids.add(row.id);names.add(name);return {id:row.id,profile};
 });
 if(!ids.has(value.activeId))throw new Error('Select an existing active profile');
 return {schema:1,activeId:value.activeId,profiles};
}
export function libraryFromProfile(profile=DEFAULT_PROFILE){
 const id=crypto.randomUUID();return validateLibrary({schema:1,activeId:id,profiles:[{id,profile:validateProfile(profile)}]});
}
export function activeProfile(library){const checked=validateLibrary(library);return checked.profiles.find(row=>row.id===checked.activeId).profile;}
export function selectProfile(library,id){return validateLibrary({...library,activeId:id});}
export function updateActiveProfile(library,profile){return validateLibrary({...library,profiles:library.profiles.map(row=>row.id===library.activeId?{...row,profile}:row)});}
export function addProfile(library,profile=DEFAULT_PROFILE,stem='New profile'){
 const checked=validateLibrary(library);if(checked.profiles.length===MAX_PROFILES)throw new Error('The library already contains 50 profiles');
 const names=new Set(checked.profiles.map(row=>nameKey(row.profile.name)));
 let name=stem.slice(0,54),counter=2;
 while(names.has(nameKey(name)))name=stem.slice(0,54)+' '+counter++;
 const id=crypto.randomUUID();return validateLibrary({...checked,activeId:id,profiles:[...checked.profiles,{id,profile:{...validateProfile(profile),name}}]});
}
export function copyProfile(library,suffix=' copy'){
 const profile=activeProfile(library);return addProfile(library,profile,profile.name.slice(0,Math.max(1,54-suffix.length))+suffix);
}
export function removeProfile(library,id){
 const checked=validateLibrary(library);if(checked.profiles.length===1)throw new Error('Keep at least one profile');
 const profiles=checked.profiles.filter(row=>row.id!==id);if(profiles.length===checked.profiles.length)throw new Error('Profile not found');
 return validateLibrary({...checked,profiles,activeId:checked.activeId===id?profiles[0].id:checked.activeId});
}
export function mergeLibrary(library,incoming){
 let result=validateLibrary(library);const activeId=result.activeId;
 for(const row of validateLibrary(incoming).profiles){
  if(result.profiles.some(existing=>JSON.stringify(existing.profile)===JSON.stringify(row.profile)))continue;
  result=addProfile(result,row.profile,row.profile.name);
 }
 return selectProfile(result,activeId);
}
