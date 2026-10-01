import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {build as bundle} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
await build({configFile:false,root:here,publicDir:path.join(here,'../public'),plugins:[react()],resolve:{alias:{'@':path.join(here,'..')}},build:{outDir:path.join(here,'ui'),emptyOutDir:true},css:{postcss:path.join(here,'..')}});
await bundle({entryPoints:[path.join(here,'../lib/game-engine.ts')],outfile:path.join(here,'engine.cjs'),platform:'node',format:'cjs',bundle:true});
