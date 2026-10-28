// Local-only regression runner for prepared public/PV builds. No deployment/data refresh.
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep,join} from 'node:path';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const output=resolve(process.env.AMPOWER_QA_OUTPUT||'output/qa-regression');await mkdir(output,{recursive:true});
const servers=[];
async function serve(directory){
 const root=resolve(directory);
 const server=createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
   if((await stat(file)).isDirectory())file=join(file,'index.html');
   const body=await readFile(file);const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'}[extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404).end('Not found');}
 });server.listen(0,'127.0.0.1');await once(server,'listening');servers.push(server);return `http://127.0.0.1:${server.address().port}`;
}
const results=[];
try{
 const env={...process.env,AMPOWER_QA_URL:await serve('dist'),AMPOWER_PV_QA_URL:await serve('output/pv-mining-preview'),AMPOWER_CHROME_PATH:process.env.AMPOWER_CHROME_PATH||pw.chromium.executablePath()};
 const versions={node:process.version,engines:{}};
 for(const engine of ['chromium','webkit']){const b=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:env.AMPOWER_CHROME_PATH}:{})});versions.engines[engine]=b.version();await b.close();}
 await writeFile(join(output,'versions.json'),JSON.stringify(versions,null,2));
 const suites=['qa_e2e','qa_additional','qa_pv_regressions','qa_pv_forms','qa_pv_contact','qa_smart_accessibility','qa_audit_acceptance'];
 const requested=process.argv.slice(2);if(requested.some(s=>!suites.includes(s)))throw new Error('Unknown QA suite');
 for(const name of requested.length?requested:suites){
  const child=spawn(process.execPath,[`scripts/${name}.mjs`],{env:{...env,AMPOWER_QA_OUTPUT:join(output,name)},stdio:['ignore','pipe','pipe']});let log='';
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log+=chunk;process.stdout.write(chunk);});
  const code=await new Promise((ok,fail)=>{child.once('error',fail);child.once('exit',ok);});await writeFile(join(output,name+'.log'),log);results.push({name,code});
 }
 await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));if(results.some(x=>x.code!==0))process.exitCode=1;
}finally{for(const s of servers)s.close();}
