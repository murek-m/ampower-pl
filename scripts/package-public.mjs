import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
execFileSync(process.execPath,['scripts/check-release.js'],{stdio:'inherit'});
const directory=resolve('output/public-release');await mkdir(directory,{recursive:true});
const zip=resolve(directory,'ampower-public.zip');
execFileSync('python3',['-c',`from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import sys
root=Path('dist')
with ZipFile(sys.argv[1],'w',compression=ZIP_DEFLATED,compresslevel=9) as target:
 for path in sorted(root.rglob('*')):
  if path.is_symlink(): raise ValueError('Symlink in artifact')
  if path.is_file(): target.write(path,path.relative_to(root).as_posix())
`,zip]);
const files=[];async function visit(directory='dist'){for(const name of await readdir(directory)){const path=directory+'/'+name;const {lstat}=await import('node:fs/promises');const stat=await lstat(path);if(stat.isDirectory())await visit(path);else{const bytes=await readFile(path);files.push({file:path.slice(5),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}await visit();
const bytes=await readFile(zip);await writeFile(resolve(directory,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),zipSha256:createHash('sha256').update(bytes).digest('hex'),files},null,2));
console.log(`Public ZIP: ${zip}; files=${files.length}; bytes=${bytes.length}. Bez publikacji.`);
