import {createServer} from 'node:http';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const webRoot=path.join(root,'app-web');
const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  let file=path.join(webRoot,decodeURIComponent(url.pathname));
  if(!file.startsWith(webRoot)){res.writeHead(403);return res.end();}
  if(!path.extname(file))file=existsSync(file+'.html')?file+'.html':path.join(file,'index.html');
  if(!existsSync(file))file=path.join(webRoot,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(8087,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'zh-CN',timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8087/ai-settings',{waitUntil:'networkidle'});
  await page.waitForTimeout(800);
  await page.screenshot({path:path.join(root,'animations/remotion/public/screens/ai-settings.png')});
  console.log('Captured AI settings from isolated empty browser context; no user credentials or keys read.');
}finally{await browser.close();server.close();}
