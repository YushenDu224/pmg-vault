import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const seal=JSON.parse(await fs.readFile(path.join(root,'SOURCE-SEAL.json'),'utf8'));
for(const entry of seal.files){const bytes=await fs.readFile(path.join(root,entry.path));if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Source changed: '+entry.path);}
console.log('PASS: '+seal.files.length+' sealed preview files');
