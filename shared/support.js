// A renderer may select a known ID, never an arbitrary external URL.
import {readFileSync} from 'node:fs';
const methods=JSON.parse(readFileSync(new URL('../support/registry.json',import.meta.url),'utf8')).methods;
export function supportDestination(id){
 const method=methods.find(row=>row.id===id);
 if(!method||new URL(method.url).protocol!=='https:')throw new Error('Unknown support method');
 return method.url;
}
