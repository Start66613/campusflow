import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'verify', 'diy-background-candidates');
mkdirSync(out, {recursive:true});
const records=[];
for (const film of ['howl','chihiro']) {
  const page=`https://www.ghibli.jp/works/${film}/`;
  const html=spawnSync('curl.exe',['-L','--http1.1','--max-time','20','-sS',page],{encoding:'utf8'});
  if (html.status!==0) throw new Error(html.stderr);
  const links=[...new Set(html.stdout.match(/https:\/\/www\.ghibli\.jp\/gallery\/[a-z]+\d+\.jpg/g))];
  for(const i of [1,5,7,16,25,27,31,39,43,48]) {
    const url=links[i-1]; if(!url)continue;
    const file=path.join(out,path.basename(url));
    const download=spawnSync('curl.exe',['-L','--http1.1','--fail','--max-time','20','-sS',url,'-o',file],{encoding:'utf8'});
    if(download.status!==0)throw new Error(download.stderr);
    records.push({film,page,url,file,rights:'Official provided film still; test wallpaper demonstration, not commercial advertising authorization'});
    console.log(path.basename(file));
  }
}
writeFileSync(path.join(out,'sources.json'),JSON.stringify(records,null,2));
