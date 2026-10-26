import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.md':'text/plain; charset=utf-8'};
export function createDemoServer(){return createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=resolve(root,'.'+(pathname==='/'?'/demo/index.html':pathname));
    if(!target.startsWith(root.endsWith(sep)?root:root+sep)||pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return}
    const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found')}
})}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createDemoServer();server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Clawd demo: http://127.0.0.1:'+server.address().port));
}
