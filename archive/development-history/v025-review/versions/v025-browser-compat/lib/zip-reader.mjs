// Random-access ZIP/ZIP64 reader. Blob/File inputs stay on disk until an entry is read.
const decoder=new TextDecoder();
const safe=name=>typeof name==='string'&&name.length<500&&!name.startsWith('/')&&!name.includes('\\')&&!name.includes(':')&&!name.split('/').some(x=>!x||x==='.'||x==='..');
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
const checksum=bytes=>{let c=0xffffffff;for(const b of bytes)c=(c>>>8)^table[(c^b)&255];return (c^0xffffffff)>>>0;};
const view=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
function integer64(v,offset){const n=v.getBigUint64(offset,true);if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('ZIP64 数值超出当前运行环境的精确范围');return Number(n);}
function source(input){
 if(input instanceof Blob)return {size:input.size,read:async(start,length)=>new Uint8Array(await input.slice(start,start+length).arrayBuffer()),stream:(start,length)=>input.slice(start,start+length).stream()};
 const b=ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):new Uint8Array(input);
 return {size:b.byteLength,read:async(start,length)=>b.subarray(start,start+length),stream:(start,length)=>new Blob([b.subarray(start,start+length)]).stream()};
}
export async function openZip(input){
 const src=source(input);
 async function read(start,length){if(!Number.isSafeInteger(start)||!Number.isSafeInteger(length)||start<0||length<0||start>src.size-length)throw Error('ZIP 资源越界');const b=await src.read(start,length);if(b.length!==length)throw Error('ZIP 文件不完整');return b;}
 if(src.size<22)throw Error('不是有效 ZIP 档案');
 const tailOffset=Math.max(0,src.size-65557),tail=await read(tailOffset,src.size-tailOffset),t=view(tail);
 let end=-1;
 for(let p=tail.length-22;p>=0;p--)if(t.getUint32(p,true)===0x06054b50&&p+22+t.getUint16(p+20,true)===tail.length){end=p;break;}
 if(end<0)throw Error('不是有效 ZIP 档案');
 const endOffset=tailOffset+end;
 if(t.getUint16(end+4,true)||t.getUint16(end+6,true))throw Error('不支持分卷档案');
 let count=t.getUint16(end+10,true),directorySize=t.getUint32(end+12,true),directory=t.getUint32(end+16,true),directoryEnd=endOffset;
 if(count===0xffff||directorySize===0xffffffff||directory===0xffffffff){
  const locator=view(await read(endOffset-20,20));
  if(locator.getUint32(0,true)!==0x07064b50||locator.getUint32(4,true)||locator.getUint32(16,true)!==1)throw Error('ZIP64 定位信息损坏或为分卷档案');
  const position=integer64(locator,8),z=view(await read(position,56));
  if(z.getUint32(0,true)!==0x06064b50||integer64(z,4)<44||position+12+integer64(z,4)!==endOffset-20||z.getUint32(16,true)||z.getUint32(20,true))throw Error('ZIP64 目录损坏');
  count=integer64(z,32);if(integer64(z,24)!==count)throw Error('不支持分卷档案');
  directorySize=integer64(z,40);directory=integer64(z,48);directoryEnd=position;
 }else if(t.getUint16(end+8,true)!==count)throw Error('不支持分卷档案');
 if(directory>directoryEnd-directorySize||count>Math.floor(directorySize/46))throw Error('ZIP 目录损坏');
 const entries=new Map(),ranges=[];let pos=directory;
 for(let i=0;i<count;i++){
  if(pos>directory+directorySize-46)throw Error('ZIP 目录损坏');
  const h=view(await read(pos,46));if(h.getUint32(0,true)!==0x02014b50)throw Error('ZIP 目录损坏');
  const flags=h.getUint16(8,true),method=h.getUint16(10,true),crc=h.getUint32(16,true),nl=h.getUint16(28,true),el=h.getUint16(30,true),cl=h.getUint16(32,true);
  if(pos+46+nl+el+cl>directory+directorySize)throw Error('ZIP 目录损坏');
  const fields=await read(pos+46,nl+el),name=decoder.decode(fields.subarray(0,nl));pos+=46+nl+el+cl;
  if(!safe(name)||entries.has(name))throw Error('档案包含非法或重复路径');
  if(flags&1||![0,8].includes(method))throw Error('不支持加密或该压缩方式');
  let packed=h.getUint32(20,true),size=h.getUint32(24,true),local=h.getUint32(42,true),disk=h.getUint16(34,true);
  if([packed,size,local].includes(0xffffffff)||disk===0xffff){
   const extra=view(fields.subarray(nl));let found=false;
   for(let p=0;p+4<=extra.byteLength;){const id=extra.getUint16(p,true),len=extra.getUint16(p+2,true);p+=4;if(p+len>extra.byteLength)throw Error('ZIP64 扩展损坏');if(id===1){const x=new DataView(extra.buffer,extra.byteOffset+p,len);let o=0;const next=()=>{if(o+8>len)throw Error('ZIP64 扩展缺失');const n=integer64(x,o);o+=8;return n;};if(size===0xffffffff)size=next();if(packed===0xffffffff)packed=next();if(local===0xffffffff)local=next();if(disk===0xffff){if(o+4>len)throw Error('ZIP64 扩展缺失');disk=x.getUint32(o,true);}found=true;break;}p+=len;}
   if(!found)throw Error('ZIP64 扩展缺失');
  }
  if(disk)throw Error('不支持分卷档案');
  if(local>directory-30)throw Error('ZIP 文件头损坏');
  const lh=view(await read(local,30));
  if(lh.getUint32(0,true)!==0x04034b50||lh.getUint16(6,true)!==flags||lh.getUint16(8,true)!==method)throw Error('ZIP 文件头与目录不一致');
  const localNameLength=lh.getUint16(26,true),start=local+30+localNameLength+lh.getUint16(28,true);
  if(start>directory-packed||decoder.decode(await read(local+30,localNameLength))!==name)throw Error('ZIP 资源越界或文件名不一致');
  if(method===0&&size!==packed)throw Error('ZIP 资源大小不一致');
  ranges.push([local,start+packed]);entries.set(name,{name,start,packed,size,method,crc});
 }
 if(pos!==directory+directorySize)throw Error('ZIP 目录长度不一致');
 ranges.sort((a,b)=>a[0]-b[0]);for(let i=1;i<ranges.length;i++)if(ranges[i][0]<ranges[i-1][1])throw Error('ZIP 资源重叠');
 async function readEntry(name){
  const entry=entries.get(name);if(!entry)throw Error('缺少 '+name);
  const {start,packed,size,method,crc}=entry;let data;
  try{
   if(method===0)data=await read(start,packed);
   else{
    const reader=src.stream(start,packed).pipeThrough(new DecompressionStream('deflate-raw')).getReader();let length=0;const parts=[];
    for(;;){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>size){await reader.cancel();throw Error('资源解压长度超过声明值');}parts.push(r.value);}
    if(length!==size)throw Error('ZIP 资源损坏');data=new Uint8Array(await new Blob(parts).arrayBuffer());
   }
  }catch(error){if(error instanceof RangeError)throw Error('当前设备内存不足，无法读取此资源；已保存的藏品不受影响');throw error;}
  if(data.length!==size||checksum(data)!==crc)throw Error('ZIP 资源损坏');
  return data;
 }
 return {entries,read:readEntry};
}
export async function unzip(input){const archive=await openZip(input),files=new Map();for(const name of archive.entries.keys())files.set(name,await archive.read(name));return files;}
