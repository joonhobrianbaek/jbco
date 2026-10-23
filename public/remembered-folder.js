/** Store a directory handle in this browser only. Never uploads file contents. */
export function createFolderStore(factory=globalThis.indexedDB){
 async function transact(mode,operation){
  if(!factory)throw Error('이 브라우저에서는 폴더를 기억할 수 없습니다.');
  const db=await new Promise((resolve,reject)=>{
   const request=factory.open('bb-office-local-folder',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('settings');
   request.onerror=()=>reject(request.error);
   request.onblocked=()=>reject(Error('다른 BB Office 탭을 닫고 다시 연결해주세요.'));
   request.onsuccess=()=>resolve(request.result);
  });
  try{return await new Promise((resolve,reject)=>{
   const transaction=db.transaction('settings',mode),request=operation(transaction.objectStore('settings'));
   transaction.oncomplete=()=>resolve(request.result??null);
   transaction.onerror=()=>reject(transaction.error||Error('폴더 설정 저장 실패'));
   transaction.onabort=()=>reject(transaction.error||Error('폴더 설정 저장 취소'));
  });}finally{db.close();}
 }
 return {get:()=>transact('readonly',s=>s.get('jobs')),set:handle=>transact('readwrite',s=>s.put(handle,'jobs')),clear:()=>transact('readwrite',s=>s.delete('jobs'))};
}
/** Check saved access without triggering a browser permission prompt. */
export async function restoreFolder(store){
 const handle=await store.get();
 if(!handle)return {handle:null,granted:false};
 if(handle.kind!=='directory'||typeof handle.queryPermission!=='function')throw Error('저장된 폴더가 유효하지 않습니다. 폴더를 다시 선택해주세요.');
 return {handle,granted:await handle.queryPermission({mode:'read'})==='granted'};
}
