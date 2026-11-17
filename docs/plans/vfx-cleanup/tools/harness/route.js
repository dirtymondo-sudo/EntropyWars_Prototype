// Playwright routing for the sandbox: CDN scripts -> local copies.
const fs=require('fs'),path=require('path');
const REPO=process.env.EW_REPO||(fs.existsSync(path.join(__dirname,'repo.txt'))?fs.readFileSync(path.join(__dirname,'repo.txt'),'utf8').trim():path.resolve(__dirname,'../../../../..'));   // setup.sh writes repo.txt
const S=process.env.EW_HARNESS_DIR||__dirname;   // holds pkgs/ (npm-packed import-map packages) and cdn/ (react, react-dom, MeshLine)
const CT={'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'};
function serve(route,file){const ext=path.extname(file);return route.fulfill({status:200,body:fs.readFileSync(file),headers:{'content-type':CT[ext]||'application/octet-stream','access-control-allow-origin':'*'}});}
async function install(ctx){
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({status:404,body:''}));
  await ctx.route(/cdn\.socket\.io/,r=>serve(r,REPO+'/node_modules/socket.io/client-dist/socket.io.min.js'));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\//,r=>{const u=new URL(r.request().url());const m=u.pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.*)$/);
    if(m){const f=path.join(S,'pkgs',m[1]+'-'+m[2],m[3]);if(fs.existsSync(f))return serve(r,f);}
    return r.fulfill({status:404,body:''});});
  await ctx.route(/cdn\.entropywars\.net\/[^?]*\.(js|css)(\?|$)/,r=>{const b=path.basename(new URL(r.request().url()).pathname);
    const f1=path.join(REPO,b),f2=path.join(S,'cdn',b);
    if(fs.existsSync(f1))return serve(r,f1); if(fs.existsSync(f2))return serve(r,f2); return r.continue();});
}
module.exports={install,REPO,S};
