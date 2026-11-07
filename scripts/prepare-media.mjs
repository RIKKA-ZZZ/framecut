import fs from 'node:fs/promises';
const dest=new URL('../public/ffmpeg/',import.meta.url);await fs.mkdir(dest,{recursive:true});
await fs.writeFile(new URL('bootstrap.js',dest),"import { FFmpeg } from './index.js'; window.FramecutFFmpeg = FFmpeg;\n");
for(const name of ['index.js','classes.js','const.js','errors.js','types.js','utils.js','worker.js'])await fs.copyFile(new URL('../node_modules/@ffmpeg/ffmpeg/dist/esm/'+name,import.meta.url),new URL(name,dest));
await fs.copyFile(new URL('../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',import.meta.url),new URL('ffmpeg-core.js',dest));
const wasm=await fs.readFile(new URL('../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm',import.meta.url));const parts=[];
for(let offset=0;offset<wasm.length;offset+=8*1024*1024){const name=`core-${parts.length}.bin`;parts.push(name);await fs.writeFile(new URL(name,dest),wasm.subarray(offset,offset+8*1024*1024));}
await fs.writeFile(new URL('core-manifest.json',dest),JSON.stringify({size:wasm.length,parts}));
console.log('Prepared local media engine:',wasm.length,'bytes,',parts.length,'parts.');
