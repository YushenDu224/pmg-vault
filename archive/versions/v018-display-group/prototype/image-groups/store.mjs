// Separate database: never opens or migrates the production library database.
let database;
function open(){return database??=new Promise((resolve,reject)=>{const request=indexedDB.open('pmg-image-groups-prototype-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('groups',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readGroups(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('groups','readonly'),request=tx.objectStore('groups').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function saveGroup(group){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('groups','readwrite');tx.objectStore('groups').put(group);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('本地空间不足，未保存'));tx.onerror=()=>reject(tx.error);});}

const displayKey=noteId=>'pmg-image-groups-display:'+noteId;
export function readDisplayGroup(noteId){return localStorage.getItem(displayKey(noteId));}
export function saveDisplayGroup(noteId,groupId){localStorage.setItem(displayKey(noteId),groupId);}
