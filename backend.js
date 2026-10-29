// Firebase (Firestore) backend. Datuak: g/<taldearen-kodea>/<bilduma>/<dokumentua>
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,setDoc,deleteDoc,onSnapshot,getDocs,writeBatch}
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLS=["concerts","lines","stock","items","outs"];
let fs=null;
function init(){
  if(fs)return fs;
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.projectId||!cfg.apiKey||/PASTE|ZURE/i.test(cfg.apiKey+cfg.projectId))throw new Error("config falta");
  const app=initializeApp(cfg);
  try{fs=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}
  catch(e){fs=initializeFirestore(app,{})}
  return fs;
}
window.__connect=async function(code){
  const f=init(),path=c=>"g/"+code+"/"+c;
  return {
    collection:name=>({
      doc:id=>({
        set:d=>setDoc(doc(f,path(name),id),d),
        delete:()=>deleteDoc(doc(f,path(name),id))
      }),
      onSnapshot:cb=>onSnapshot(collection(f,path(name)),
        s=>cb({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))}),
        err=>{window.__dberr&&window.__dberr(err)})
    }),
    __export:async()=>{const o={};for(const c of COLS){o[c]={};(await getDocs(collection(f,path(c)))).forEach(d=>{o[c][d.id]=d.data()})}return o},
    __import:async(obj)=>{const items=[];COLS.forEach(c=>Object.entries(obj[c]||{}).forEach(([id,d])=>items.push([c,id,d])));
      for(let i=0;i<items.length;i+=400){const b=writeBatch(f);items.slice(i,i+400).forEach(([c,id,d])=>b.set(doc(f,path(c),id),d));await b.commit()}}
  };
};
