import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const run = promisify(execFile);
export async function pdfRuntime() {
  const pythonCandidates = [process.env.AMPOWER_PYTHON,join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),'python3'].filter(Boolean);
  let python;
  for (const path of pythonCandidates) {try {await run(path,['-c','import reportlab'],{timeout:10000});python=path;break;} catch {}}
  const fonts = [process.env.AMPOWER_PDF_FONT,'/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].filter(Boolean);
  let font; for (const path of fonts) {try {await access(path);font=path;break;} catch {}}
  if (!python || !font) throw Object.assign(new Error('PDF wymaga Python z ReportLab i fontu polskiego. Ustaw AMPOWER_PYTHON i AMPOWER_PDF_FONT zgodnie z instrukcją.'),{status:503});
  return {python,font};
}
export async function generateOfferPdf(customerExport, runtime) {
  const {python,font} = runtime || await pdfRuntime();
  const directory = await mkdtemp(join(tmpdir(),'ampower-pdf-'));
  try {
    const source = join(directory,'customer.json');const target=join(directory,'offer.pdf');
    await writeFile(source,JSON.stringify(customerExport),{mode:0o600});
    await run(python,[fileURLToPath(new URL('./pdf_offer.py',import.meta.url)),source,target,'--font',font,...(customerExport.state === 'draft' ? ['--draft'] : [])],{timeout:30000,maxBuffer:1024*1024});
    const pdf = await readFile(target);if (!pdf.subarray(0,5).equals(Buffer.from('%PDF-'))) throw new Error('Generator nie zwrócił PDF');return pdf;
  } catch (error) {if (error.status) throw error;throw Object.assign(new Error('Nie udało się wygenerować PDF. Sprawdź kompletność dokumentu i konfigurację generatora.'),{status:503});}
  finally {await rm(directory,{recursive:true,force:true});}
}
