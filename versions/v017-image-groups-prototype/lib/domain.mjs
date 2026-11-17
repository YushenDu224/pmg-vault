export const fields = [
 ['certificationNumber','PMG 编号'],['name','名称'],['catalogNumber','目录号'],['serialNumber','冠字号'],['countryCode','国家 / 地区'],['grade.numeric','分数'],['gradingDate','评级日期'],['noteYear.start','钞票年份'],['seal','印章类型'],['signatures','签名'],['comments','评论']
];
export const isMissing=v=>v==null||typeof v==='string'&&!v.trim();
export function value(note,key){const result=key.split('.').reduce((v,k)=>v?.[k],note);return key==='countryCode'&&isMissing(result)?note.countryRaw??null:result;}
export function fieldText(note,key){const result=value(note,key);if(isMissing(result))return '不适用';return key==='grade.numeric'&&!isMissing(note.grade?.display)?note.grade.display:String(result);}
export const matchesField=(actual,term)=>term.trim()==='不适用'?isMissing(actual):String(actual??'').toLowerCase().includes(term.toLowerCase());
export function normalizeCertificate(input){const s=input.trim();if(/^\d{10}$/.test(s))return s.slice(0,7)+'-'+s.slice(7);if(!/^\d{7}-\d{3}$/.test(s))throw Error('请输入 10 位数字或 1234567-001 格式的编号');return s;}
export function queryUrl(site,cert,grade){if(!['cn','global'].includes(site))throw Error('未知站点');if(!/^\d+$/.test(String(grade))||grade<1||grade>70)throw Error('请输入 1–70 的评分');return `https://www.pmgnotes.${site==='cn'?'cn':'com'}/certlookup/${normalizeCertificate(cert)}/${grade}/`;}
export function selectNotes(records,{search='',field='',term='',sort='certificationNumber',direction='asc',country='',min='',max='',images=false}={}){
 const collator=new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
 return records.filter(r=>{const n=r.note;return (!search||fields.some(([k])=>String(value(n,k)??'').toLowerCase().includes(search.toLowerCase())))&&(!term||matchesField(value(n,field),term))&&(!country||value(n,'countryCode')===country)&&(min===''||(n.grade?.numeric!=null&&n.grade.numeric>=Number(min)))&&(max===''||(n.grade?.numeric!=null&&n.grade.numeric<=Number(max)))&&(!images||r.manifest.resources.some(x=>x.role==='original'));}).sort((a,b)=>{const x=value(a.note,sort),y=value(b.note,sort);if(x==null||x==='')return y==null||y===''?collator.compare(a.manifest.noteId,b.manifest.noteId):1;if(y==null||y==='')return -1;const c=typeof x==='number'&&typeof y==='number'?x-y:collator.compare(String(x),String(y));return c*(direction==='desc'?-1:1)||collator.compare(a.manifest.noteId,b.manifest.noteId);});
}

export function originalResources(record){const seen=new Set();return record.manifest.resources.filter(resource=>{if(resource.role!=='original')return false;const id=resource.sha256||resource.path;if(seen.has(id))return false;seen.add(id);return true;});}

// Preserve the official region notation (e.g. SWI), without ISO conversion.
export function sourceRegionCode(note){return !isMissing(note.countryRaw)?String(note.countryRaw).trim():!isMissing(note.countryCode)?String(note.countryCode).trim():null;}
export function cardOrigin(note){return [sourceRegionCode(note),note.noteYear?.raw].map(v=>isMissing(v)?'不适用':String(v)).join(' / ');}
