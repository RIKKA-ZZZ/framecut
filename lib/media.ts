import type { FFmpeg } from '@ffmpeg/ffmpeg';
export type Engine = FFmpeg;
export type Media = { width:number;height:number;fps:number;duration:number;frames:number[] };
export const at=(m:Media,i:number)=>m.frames[i]??m.duration;
export const seekAt=(m:Media,i:number)=>at(m,i)+(at(m,i+1)-at(m,i))*.2;
// Static hosting supplies its project subpath in the HTML; Sites uses the root.
export function assetPath(path:string){
 const base=typeof document==='undefined'?'/':document.querySelector('meta[name="framecut-base"]')?.getAttribute('content')||'/';
 return base.replace(/\/?$/,'/')+path.replace(/^\//,'');
}
export async function createEngine(progress:(p:number)=>void):Promise<Engine>{
 const scope=window as unknown as {FramecutFFmpeg?:new()=>Engine};
 if(!scope.FramecutFFmpeg)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.type='module';script.src=assetPath('ffmpeg/bootstrap.js');script.onload=()=>resolve();script.onerror=()=>{script.remove();reject(Error('转换引擎脚本加载失败，请刷新重试。'));};document.head.appendChild(script);});
 if(!scope.FramecutFFmpeg)throw Error('转换引擎未能初始化。');const e:Engine=new scope.FramecutFFmpeg();e.on('log',({message})=>console.debug('[media]',message));
 const manifest=await fetch(assetPath('ffmpeg/core-manifest.json')).then(r=>{if(!r.ok)throw Error('引擎加载失败，请检查网络后重试。');return r.json() as Promise<{parts:string[];size:number}>;});
 let received=0;const parts:Uint8Array[]=[];
 for(const part of manifest.parts){const r=await fetch(assetPath('ffmpeg/'+part));if(!r.ok)throw Error('引擎文件加载失败。');const reader=r.body!.getReader();while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);received+=value.length;progress(received/manifest.size*95);}}
 const wasmURL=URL.createObjectURL(new Blob(parts as BlobPart[],{type:'application/wasm'}));
 try{await e.load({coreURL:new URL(assetPath('ffmpeg/ffmpeg-core.js'),location.href).href,wasmURL});progress(100);return e;}catch(err){e.terminate();throw err;}finally{URL.revokeObjectURL(wasmURL);}
}
export async function inspect(e:Engine):Promise<Media>{
 let code=await e.ffprobe(['-v','error','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,duration:format=duration:stream_side_data=rotation','-of','json','input','-o','meta.json']);
 if(code>0)throw Error('无法读取视频，请检查文件是否损坏。');const meta=JSON.parse(await e.readFile('meta.json','utf8') as string);const s=meta.streams?.[0];if(!s?.width)throw Error('文件中没有视频轨道。');
 const duration=Number(s.duration||meta.format?.duration);if(!Number.isFinite(duration)||duration<=0)throw Error('无法读取视频时长。');if(duration>600)throw Error('请选择 10 分钟以内的视频。');
 code=await e.ffprobe(['-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','csv=p=0','input','-o','frames.csv']);if(code>0)throw Error('无法建立逐帧索引。');
 const raw=await e.readFile('frames.csv','utf8') as string;const pts=raw.split(/\r?\n/).map(l=>parseFloat(l)).filter(Number.isFinite).sort((a,b)=>a-b);if(!pts.length)throw Error('无法读取视频帧。');const frames=pts.map(p=>p-pts[0]);const [n,d]=s.avg_frame_rate.split('/').map(Number);const fps=n/d||frames.length/duration;
 let width=s.width,height=s.height;const rotation=Math.abs(s.side_data_list?.find((x:{rotation?:number})=>x.rotation!==undefined)?.rotation||0)%180;if(rotation===90)[width,height]=[height,width];
 await e.deleteFile('meta.json');await e.deleteFile('frames.csv');return{width,height,fps,duration:Math.max(duration,frames.at(-1)!+1/fps),frames};
}
export async function encode(e:Engine,o:{media:Media;start:number;end:number;format:string;width:number;fps:number;quality:string;loop:boolean;speed:number},progress:(p:number,s:string)=>void){
 const {media,start,end,format,width,fps,quality,loop,speed}=o;const duration=(at(media,end+1)-at(media,start))/speed;
 const filter=`trim=start_frame=${start}:end_frame=${end+1},setpts=(PTS-STARTPTS)/${speed},fps=${fps},scale=${width}:-1:flags=lanczos,setsar=1`;
 const cb=({time}:{time:number})=>progress(Math.min(97,Math.max(3,time/1e6/duration*95)),'正在编码动图…');e.on('progress',cb);
 const output='output.'+(format==='apng'?'png':format);
 try{progress(2,'正在解码所选画面…');const args=['-i','input','-an'];
 if(format==='gif')args.push('-filter_complex',`${filter},split[a][b];[a]palettegen=max_colors=${quality==='small'?64:quality==='high'?256:128}:stats_mode=diff[p];[b][p]paletteuse=dither=${quality==='small'?'bayer:bayer_scale=3':'sierra2_4a'}`,'-loop',loop?'0':'-1');
 else if(format==='webp')args.push('-vf',filter,'-c:v','libwebp_anim','-quality',quality==='small'?'50':quality==='high'?'95':'78','-loop',loop?'0':'1');
 else args.push('-vf',filter,'-f','apng','-plays',loop?'0':'1','-compression_level',quality==='small'?'9':quality==='high'?'4':'6');
 args.push(output);if(await e.exec(args))throw Error('转换未完成，请缩短片段或降低尺寸后重试。');progress(98,'正在整理下载文件…');const data=await e.readFile(output);const blob=new Blob([new Uint8Array(data as Uint8Array)],{type:format==='gif'?'image/gif':format==='webp'?'image/webp':'image/apng'});if(!blob.size)throw Error('生成的动图为空。');return blob;
 }finally{e.off('progress',cb);try{await e.deleteFile(output);}catch{}}
}


