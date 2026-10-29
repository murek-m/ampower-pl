import {cp, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Test files run in separate processes. Each build must own its source and dist.
export async function publicBuildFixture(t) {
  const root=fileURLToPath(new URL('../',import.meta.url));
  const directory=await mkdtemp(join(tmpdir(),'ampower-public-build-test-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const paths=['package.json','index.html','favicon.svg','CNAME','.nojekyll','robots.txt','sitemap.xml',
    'assets','prywatnosc','smart-home-energy','backend','docs','tests','scripts/build.js','scripts/public-security.js'];
  for(const path of paths){
    const target=join(directory,path);
    await mkdir(dirname(target),{recursive:true});
    await cp(join(root,path),target,{recursive:true});
  }
  return directory;
}
