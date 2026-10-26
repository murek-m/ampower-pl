// Negative release checks use a disposable artifact and synthetic content only.
import {mkdtemp,cp,mkdir,writeFile,readFile,rm,unlink,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'ampower-release-'));const results=[];
try{
 await cp('dist',join(directory,'dist'),{recursive:true});await mkdir(join(directory,'assets'));await mkdir(join(directory,'scripts'));await cp('assets/public-assets.json',join(directory,'assets/public-assets.json'));await cp('scripts/check-release.js',join(directory,'scripts/check-release.mjs'));
 const check=()=>spawnSync(process.execPath,['scripts/check-release.mjs'],{cwd:directory,encoding:'utf8'}).status;
 assert.equal(check(),0);results.push({name:'prawidłowy artefakt',status:'passed'});
 await writeFile(join(directory,'dist','private.json'),'{"synthetic":true}');assert.notEqual(check(),0);await unlink(join(directory,'dist','private.json'));results.push({name:'dodatkowy plik prywatny blokuje wydanie',status:'passed'});
 const index=join(directory,'dist','index.html'),before=await readFile(index);await writeFile(index,Buffer.concat([before,Buffer.from('<!-- unitCostNet: SYNTHETIC -->')]));assert.notEqual(check(),0);await writeFile(index,before);results.push({name:'poufne pole w głównym HTML blokuje wydanie',status:'passed'});
 await writeFile(index,Buffer.concat([before,Buffer.from('<script>window.syntheticInjected=true;</script>')]));assert.notEqual(check(),0);await writeFile(index,before);results.push({name:'niezatwierdzony skrypt inline blokuje wydanie',status:'passed'});
 const favicon=join(directory,'dist','favicon.svg');await unlink(favicon);await symlink(index,favicon);assert.notEqual(check(),0);results.push({name:'symlink blokuje wydanie',status:'passed'});
 console.log(JSON.stringify({date:new Date().toISOString(),results},null,2));
}finally{await rm(directory,{recursive:true,force:true});}
