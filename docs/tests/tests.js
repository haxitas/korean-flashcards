import {parseDeck,importDeck,emptyLibrary,canonical,saveLibrary,loadLibrary,MAX_BYTES,STORAGE_KEY} from '../js/model.js';
import {koreanVoices} from '../js/speech.js';
export function runTests(sampleText){
 const out=[];let passed=0,failed=0;
 const assert=(v,m='assertion failed')=>{if(!v)throw new Error(m);};
 const test=(name,fn)=>{try{fn();passed++;out.push('PASS '+name);}catch(e){failed++;out.push('FAIL '+name+': '+e.message);}};
 const rejects=fn=>{let threw=false;try{fn();}catch{threw=true;}assert(threw,'拒否されませんでした');};
 const sample=parseDeck(sampleText), clone=()=>structuredClone(sample);
 const parse=d=>parseDeck(JSON.stringify(d));
 const all=d=>d.cards.map((_,i)=>i);
 test('テスト検出器は偽の条件を失敗させる',()=>rejects(()=>assert(false)));
 test('サンプル5枚、배の3語義、UUID、Entry参照',()=>{const s=importDeck(emptyLibrary(),sample,all(sample)).state;assert(s.cards.length===5&&s.decks.length===1&&s.entries.length===5);assert(new Set(s.cards.filter(c=>c.content.korean==='배').map(c=>c.id)).size===3);assert(s.cards.every(c=>/^[0-9a-f-]{36}$/.test(c.id)));assert(s.entries.every(e=>e.id===e.deck_id+'__'+e.card_id));});
 test('同じ入力の再取込は5件スキップ',()=>{const s=importDeck(emptyLibrary(),sample,all(sample)).state;const r=importDeck(s,sample,all(sample));assert(r.added===0&&r.skipped===5&&canonical(s)===canonical(r.state));});
 test('キー順変更・既存訳と学習状態の保護',()=>{const s=importDeck(emptyLibrary(),sample,all(sample)).state;s.cards[0].content.meaning_ja='編集済み';s.cards[0].study.status='known';const d=clone();d.cards=d.cards.map(c=>Object.fromEntries(Object.entries(c).reverse()));const r=importDeck(s,d,all(d));assert(r.added===0&&r.state.cards[0].content.meaning_ja==='編集済み'&&r.state.cards[0].study.status==='known');});
 test('除外・同一バッチの重複・全除外拒否',()=>{const d=clone();d.cards=[d.cards[0],d.cards[0]];const r=importDeck(emptyLibrary(),d,[0,1]);assert(r.added===1&&r.skipped===1);assert(importDeck(emptyLibrary(),sample,[0]).state.cards.length===1);rejects(()=>importDeck(emptyLibrary(),sample,[]));});
 test('localStorage形式の往復でID・読み補助を保持',()=>{const s=importDeck(emptyLibrary(),sample,all(sample)).state;const mem=new Map();const storage={setItem:(k,v)=>mem.set(k,v),getItem:k=>mem.get(k)??null};saveLibrary(storage,s);assert(canonical(loadLibrary(storage))===canonical(s));assert(loadLibrary(storage).cards[0].content.romanization==='gongbu');mem.set(STORAGE_KEY,'{');rejects(()=>loadLibrary(storage));});
 test('保存失敗を送出、入力状態は不変',()=>{const s=emptyLibrary();const before=canonical(s);const r=importDeck(s,sample,all(sample));rejects(()=>saveLibrary({setItem(){throw new Error('quota');}},r.state));assert(canonical(s)===before);});
 test('50・500枚受理、501・0枚拒否',()=>{for(const n of [50,500,501,0]){const d=clone();d.cards=Array.from({length:n},()=>d.cards[0]);if(n===50||n===500)assert(parse(d).cards.length===n);else rejects(()=>parse(d));}});
 test('UTF-8 5 MiBちょうど受理、1 byte超過拒否',()=>{const text=JSON.stringify(sample);const boundary=text+' '.repeat(MAX_BYTES-new TextEncoder().encode(text).length);assert(parseDeck(boundary).cards.length===5);rejects(()=>parseDeck(boundary+' '));});
 test('不正JSON・空入力・BOM・単一フェンス',()=>{rejects(()=>parseDeck('{'));rejects(()=>parseDeck(''));assert(parseDeck('\uFEFF'+sampleText).cards.length===5);assert(parseDeck('```json\n'+sampleText+'\n```').cards.length===5);});
 test('バージョン・未知キー・型・必須・空白を拒否',()=>{for(const change of [d=>d.schema_version=2,d=>d.extra=true,d=>d.cards[0].id='bad',d=>delete d.cards[0].meaning_en,d=>d.cards[0].meaning_ja='  ',d=>d.cards[0].needs_review='false',d=>d.cards[0].reading_kana=3,d=>d.warnings=[null]]){const d=clone();change(d);rejects(()=>parse(d));}});
 test('長さ・例文・危険URLを拒否、null読みを受理',()=>{for(const change of [d=>d.cards[0].korean='가'.repeat(501),d=>d.cards[0].example.origin='invented',d=>d.deck.source_url='javascript:alert(1)']){const d=clone();change(d);rejects(()=>parse(d));}const d=clone();d.cards[0].reading_kana=null;delete d.cards[0].romanization;assert(parse(d).cards[0].reading_kana===null);});
 test('HTML教材は文字列として保持',()=>{const d=clone();d.cards[0].meaning_ja='<img src=x onerror=alert(1)>';assert(parse(d).cards[0].meaning_ja===d.cards[0].meaning_ja);});
 test('韓国語音声のみ・オンラインも候補・初期空',()=>{assert(koreanVoices(null).length===0);assert(koreanVoices({getVoices:()=>[]}).length===0);const voices=[{lang:'ko-KR',localService:false},{lang:'ko',localService:true},{lang:'en-US'}];assert(koreanVoices({getVoices:()=>voices}).length===2);});
 out.push(`${passed} passed / ${failed} failed`);return out;
}
