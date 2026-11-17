const db=new Promise((resolve,reject)=>{const r=indexedDB.open('pmg-vault-library',1);r.onupgradeneeded=()=>r.result.createObjectStore('notes',{keyPath:'manifest.noteId'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function all(includeDeleted=false){const d=await db;return new Promise((ok,no)=>{const r=d.transaction('notes').objectStore('notes').getAll();r.onsuccess=()=>ok(includeDeleted?r.result:r.result.filter(x=>!x.deletedAt));r.onerror=()=>no(r.error);});}
export async function save(record){const d=await db;return new Promise((ok,no)=>{const t=d.transaction('notes','readwrite');t.objectStore('notes').put(record);t.oncomplete=()=>ok();t.onerror=()=>no(t.error);t.onabort=()=>no(t.error||Error('存储失败'));});}

async function setDeleted(id,deleted){const d=await db;return new Promise((ok,no)=>{const t=d.transaction('notes','readwrite'),store=t.objectStore('notes'),get=store.get(id);get.onsuccess=()=>{const record=get.result;if(!record){t.abort();return;}if(deleted)record.deletedAt=new Date().toISOString();else delete record.deletedAt;store.put(record);};t.oncomplete=()=>ok();t.onerror=()=>no(t.error);t.onabort=()=>no(t.error||Error('找不到藏品，操作未完成'));});}
export const remove=id=>setDeleted(id,true);
export const restore=id=>setDeleted(id,false);
