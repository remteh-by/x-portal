import {build} from 'esbuild';
for(const [input,output] of [['app-preload','app'],['game-preload','game']]) await build({entryPoints:['electron/'+input+'.js'],outfile:'build-preloads/'+output+'.cjs',bundle:true,platform:'node',format:'cjs',external:['electron'],target:'node22'});
