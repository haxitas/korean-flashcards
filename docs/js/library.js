import {object, str, validateCard, validateMeta, validateLibrary, emptyLibrary} from './model.js';
export const BACKUP_LIMIT=20*1024*1024;
export const LOCAL_KEY='kohaku-korean-library-v2';
export const defaultSettings=()=>({show_kana:true,show_romanization:false,show_ipa:false,speech_rate:.9});
export function validateSettings(s){
 object(s,['show_kana','show_romanization','show_ipa','speech_rate'],['show_kana','show_romanization','show_ipa','speech_rate'],'settings');
 for(const k of ['show_kana','show_romanization','show_ipa'])if(typeof s[k]!=='boolean')throw new Error('表示設定が不正です');
 if(typeof s.speech_rate!=='number'||!Number.isFinite(s.speech_rate)||s.speech_rate<.5||s.speech_rate>1.5)throw new Error('速度設定が不正です');
}
export function validateRecords(value,withStudy=true){
 for(const key of ['cards','decks','entries'])if(!Array.isArray(value[key]))throw new Error(key+'は配列が必要です');
 for(const c of value.cards){
  const keys=withStudy?['id','content','study']:['id','content'];object(c,keys,keys,'Card');validateCard(c.content);
  if(withStudy)object(c.study,['status'],['status'],'study');
 }
 for(const d of value.decks){object(d,['id','meta','warnings'],['id','meta','warnings'],'Deck');validateMeta(d.meta);if(!Array.isArray(d.warnings))throw new Error('warningsが不正です');d.warnings.forEach(w=>str(w,2000,'warnings'));}
 for(const e of value.entries)object(e,['id','deck_id','card_id','source_card'],['id','deck_id','card_id','source_card'],'Entry');
 // UUID types are explicit: RegExp alone would coerce an object to string.
 for(const c of [...value.cards,...value.decks])if(typeof c.id!=='string')throw new Error('IDは文字列が必要です');
 for(const e of value.entries)if(!['id','deck_id','card_id'].every(k=>typeof e[k]==='string'))throw new Error('所属IDは文字列が必要です');
 validateLibrary({version:1,cards:withStudy?value.cards:value.cards.map(c=>({...c,study:{status:'unseen'}})),decks:value.decks,entries:value.entries});
 return value;
}
export function validateCatalog(c){
 object(c,['format','schema_version','cards','decks','entries'],['format','schema_version','cards','decks','entries'],'catalog');
 if(c.format!=='kohaku-korean-catalog'||c.schema_version!==1)throw new Error('カタログ形式が不正です');
 return validateRecords(c,false);
}
export function parseBackup(text){
 if(new TextEncoder().encode(text).length>BACKUP_LIMIT)throw new Error('バックアップは20 MiBまでです');
 let b;try{b=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw new Error('バックアップJSONの構文が不正です');}
 object(b,['format','schema_version','exported_at','cards','decks','entries','settings'],['format','schema_version','exported_at','cards','decks','entries','settings'],'backup');
 if(b.format!=='kohaku-korean-backup'||b.schema_version!==1)throw new Error('バックアップ形式が不正です');
 if(!validDateTime(b.exported_at))throw new Error('exported_atが不正です');
 validateSettings(b.settings);validateRecords(b);return b;
}
function validDateTime(value){
 if(typeof value!=='string')return false;
 const m=value.match(/^(\d{4})-(\d\d)-(\d\d)[Tt](\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:[Zz]|([+-])(\d\d):(\d\d))$/);
 if(!m)return false;
 const [,y,mo,d,h,mi,s,,oh='00',om='00']=m,year=Number(y),month=Number(mo);
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return month>=1&&month<=12&&Number(d)>=1&&Number(d)<=days[month-1]&&Number(h)<24&&Number(mi)<60&&Number(s)<60&&Number(oh)<24&&Number(om)<60&&Number.isFinite(Date.parse(value));
}
export function emptyLocal(){return {version:2,library:emptyLibrary(),settings:defaultSettings(),pinned:{cards:[],decks:[],entries:[]}};}
export function validateLocal(s){
 object(s,['version','library','settings','pinned'],['version','library','settings','pinned'],'local');
 if(s.version!==2)throw new Error('保存バージョンが不正です');
 object(s.library,['version','cards','decks','entries'],['version','cards','decks','entries'],'library');
 if(s.library.version!==1)throw new Error('ライブラリの版が不正です');
 validateRecords(s.library);validateSettings(s.settings);
 object(s.pinned,['cards','decks','entries'],['cards','decks','entries'],'pinned');
 for(const k of ['cards','decks','entries']){const ids=new Set(s.library[k].map(x=>x.id));if(!Array.isArray(s.pinned[k])||new Set(s.pinned[k]).size!==s.pinned[k].length||s.pinned[k].some(id=>!ids.has(id)))throw new Error('復元保護IDが不正です');}
 return s;
}
export function loadLocal(storage){const raw=storage.getItem(LOCAL_KEY);return raw===null?emptyLocal():validateLocal(JSON.parse(raw));}
export function saveLocal(storage,s,expected){
 validateLocal(s);
 if(expected!==undefined&&storage.getItem(LOCAL_KEY)!==expected)throw new Error('別タブで保存内容が変わりました。バックアップを控えて再読込してください');
 const raw=JSON.stringify(s);storage.setItem(LOCAL_KEY,raw);return raw;
}
export function mergeCatalog(local,catalog){
 validateLocal(local);validateCatalog(catalog);const next=structuredClone(local);
 for(const key of ['cards','decks','entries']){
  const map=new Map(next.library[key].map(x=>[x.id,x])), pinned=new Set(next.pinned[key]);
  for(const item of catalog[key]){
   if(pinned.has(item.id))continue;
   const value=structuredClone(item);
   if(key==='cards')value.study=map.get(item.id)?.study||{status:'unseen'};
   map.set(item.id,value);
  }
  next.library[key]=[...map.values()];
 }
 // Removed catalogue records remain locally, avoiding silent data loss.
 return validateLocal(next);
}
export function makeBackup(local){
 validateLocal(local);const {cards,decks,entries}=structuredClone(local.library);
 return {format:'kohaku-korean-backup',schema_version:1,exported_at:new Date().toISOString(),cards,decks,entries,settings:structuredClone(local.settings)};
}
export function restoreBackup(local,backup){
 validateLocal(local);parseBackup(JSON.stringify(backup));const next=structuredClone(local);
 for(const key of ['cards','decks','entries']){
  const map=new Map(next.library[key].map(x=>[x.id,x]));for(const item of backup[key])map.set(item.id,structuredClone(item));
  next.library[key]=[...map.values()];next.pinned[key]=[...new Set([...next.pinned[key],...backup[key].map(x=>x.id)])];
 }
 next.settings=structuredClone(backup.settings);return validateLocal(next);
}
export function restoreCounts(local,b){return Object.fromEntries(['cards','decks','entries'].map(k=>{const ids=new Set(local.library[k].map(x=>x.id));return [k,{total:b[k].length,overwrite:b[k].filter(x=>ids.has(x.id)).length}];}));}
export function useLatestCatalog(local,catalog){
 validateLocal(local);validateCatalog(catalog);const next=structuredClone(local);
 for(const k of ['cards','decks','entries']){const ids=new Set(catalog[k].map(x=>x.id));next.pinned[k]=next.pinned[k].filter(id=>!ids.has(id));}
 return mergeCatalog(next,catalog);
}
export function migrateLegacy(local,legacy,settings=defaultSettings()){
 validateLibrary(legacy);return restoreBackup(local,{format:'kohaku-korean-backup',schema_version:1,exported_at:new Date().toISOString(),cards:legacy.cards,decks:legacy.decks,entries:legacy.entries,settings});
}
export function setStudy(local,id,status){
 if(!['unseen','review','known'].includes(status))throw new Error('学習状態が不正です');
 const next=structuredClone(local), c=next.library.cards.find(c=>c.id===id);if(!c)throw new Error('カードがありません');c.study.status=status;return next;
}
export function selectCards(library,{deckId='',query='',status=''}={}){
 const ids=deckId?new Set(library.entries.filter(e=>e.deck_id===deckId).map(e=>e.card_id)):null;
 const q=query.normalize('NFC').trim().toLocaleLowerCase();
 return library.cards.filter(c=>(!ids||ids.has(c.id))&&(!status||c.study.status===status)&&(!q||[c.content.korean,c.content.meaning_ja,c.content.meaning_en].some(t=>t.normalize('NFC').toLocaleLowerCase().includes(q))));
}
export function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
