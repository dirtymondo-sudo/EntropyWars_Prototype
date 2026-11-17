// Spell VFX audit: interactive control server. One headful llvmpipe page with art + 3D models ON, Playwright fake clock.
// node sv-ctl.js [--gpu webgl2|webgl|webgpu] [--port 4700]
const fs=require('fs'),path=require('path'),http=require('http');const {spawn}=require('child_process');
const {install,REPO}=require('/tmp/ew-harness/route.js');
const A=process.argv.slice(2),F=(n,d)=>{const i=A.indexOf('--'+n);return i<0?d:A[i+1];};
const GPU=F('gpu','webgl2'),CPORT=+F('port',4700),PORT=3000,W=+F('w',1280),H=+F('h',720);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function up(){return new Promise(res=>{const q=http.get({host:'localhost',port:PORT,path:'/',timeout:2000},r=>{r.resume();res(r.statusCode<500)});q.on('error',()=>res(false));q.on('timeout',()=>{q.destroy();res(false)});});}
(async()=>{
 if(!await up()){spawn(process.execPath,['server.js'],{cwd:REPO,env:{...process.env,PORT:String(PORT)},stdio:'ignore',detached:true}).unref();for(let i=0;i<40&&!await up();i++)await sleep(500);}
 const {chromium}=require(REPO+'/node_modules/playwright');
 let args=['--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage','--mute-audio','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
 let headless=true,env={...process.env};
 if(GPU==='webgpu'){args.push('--enable-unsafe-webgpu','--enable-features=Vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--use-angle=swiftshader');}
 else{ if(!env.DISPLAY){const d=':'+(70+Math.floor(Math.random()*19));spawn('Xvfb',[d,'-screen','0',(W+100)+'x'+(H+200)+'x24','-nolisten','tcp'],{stdio:'ignore',detached:true}).unref();await sleep(1500);env.DISPLAY=d;}
   headless=false;args.push('--use-gl=angle','--use-angle=gl'); }
 process.env.EW_PROBE_NO_HOLD='1';const browser=await require(REPO+'/probe-fast.js').launch(chromium,{headless,env,executablePath:'/opt/pw-browsers/chromium',args:args.filter(a=>!/use-gl|use-angle/.test(a)),proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined});
 const ctx=await browser.newContext({viewport:{width:W,height:H},ignoreHTTPSErrors:true});
 await install(ctx);
 await ctx.route(/\.(mp3|ogg|wav|m4a|mp4|webm)(\?|$)/i,r=>r.abort());
 await ctx.addInitScript(()=>{ if(window.GPUTexture){const o=GPUTexture.prototype.createView;GPUTexture.prototype.createView=function(d){if(d&&d.swizzle){d=Object.assign({},d);delete d.swizzle;}return o.call(this,d);};}
   window.EW_DISABLE_INTRO_CINE=true;window._tutWeatherOff=true; });
 await ctx.addInitScript(()=>{const st=window.setTimeout,ct=window.clearTimeout;window.requestAnimationFrame=function(cb){return st(function(){cb(performance.now());},50);};window.cancelAnimationFrame=function(id){ct(id);};});
 await ctx.addInitScript(fs.readFileSync('/tmp/sv/page.js','utf8').replace('__DRAW__','demand'));
 await ctx.clock.install();
 const page=await ctx.newPage();const logs=[];
 page.on('pageerror',e=>logs.push('ERR '+e.message.split('\n')[0]));
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')logs.push(m.type()[0]+' '+m.text().slice(0,300));});
 const q=GPU==='webgl'?'?ew_gpu=webgl':'?ew_gpu='+GPU;
 page.goto('http://localhost:'+PORT+'/'+q,{waitUntil:'load',timeout:300000}).catch(e=>logs.push('goto '+e.message));
 http.createServer(async(req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',async()=>{
   try{const u=new URL(req.url,'http://x');const p=u.searchParams;
    if(u.pathname==='/eval'){const r=await page.evaluate(new Function('return (async()=>{'+body+'})()'));res.end(JSON.stringify(r===undefined?null:r));}
    else if(u.pathname==='/pause'){const n=await page.evaluate(()=>Date.now());await ctx.clock.pauseAt(n+(+p.get('ahead')||500));res.end('paused at '+n);}
    else if(u.pathname==='/resume'){await ctx.clock.resume();res.end('resumed');}
    else if(u.pathname==='/run'){const t0=Date.now();await ctx.clock.runFor(+p.get('ms')||16);res.end('ran '+(Date.now()-t0)+'ms');}
    else if(u.pathname==='/shot'){const f=p.get('f')||'/tmp/sv/shots/s.jpg';fs.mkdirSync(path.dirname(f),{recursive:true});
      await page.evaluate(()=>{__ph.draw.frames=3;});
      if(p.get('paused')){await ctx.clock.runFor(150);} else {for(let i=0;i<40;i++){const d=await page.evaluate(()=>__ph.draw.frames);if(d<=0)break;await sleep(100);}}
      await page.screenshot({path:f,type:'jpeg',quality:82,timeout:120000});await page.evaluate(()=>{__ph.draw.frames=0;});res.end(f);}
    else if(u.pathname==='/click'){await page.mouse.click(+p.get('x'),+p.get('y'),{button:p.get('b')||'left'});res.end('ok');}
    else if(u.pathname==='/move'){await page.mouse.move(+p.get('x'),+p.get('y'));res.end('ok');}
    else if(u.pathname==='/key'){await page.keyboard.press(p.get('k'));res.end('ok');}
    else if(u.pathname==='/logs'){res.end(JSON.stringify(logs.splice(0)));}
    else if(u.pathname==='/quit'){res.end('bye');await browser.close();process.exit(0);}
    else res.end('?');
   }catch(e){res.statusCode=500;res.end('ERR '+e.message);}
 });}).listen(CPORT,()=>console.log('sv ctl on',CPORT));
})().catch(e=>{console.error(e);process.exit(1)});
