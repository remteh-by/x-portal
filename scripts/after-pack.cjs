const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
// Finder metadata is not code-signable. Only remove these two metadata keys
// from this build's output. Quarantine and all security attributes are retained.
module.exports=async context=>{
 if(context.electronPlatformName!=='darwin')return;
 for(const name of ['com.apple.FinderInfo','com.apple.ResourceFork']){
  try{await run('/usr/bin/xattr',['-dr',name,context.appOutDir]);}
  catch(error){if(!/No such xattr/.test(error.stderr||''))throw error;}
 }
};
