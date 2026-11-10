export const MAX_BYTES = 5 * 1024 * 1024;
export const STORAGE_KEY = 'kohaku-korean-local-v1';
const optional = {surface_form:500, pronunciation_hangul:500, romanization:1000, ipa:1000, pronunciation_note_ja:2000, note_ja:3000, review_note_ja:2000};
function fail(path, message) { throw new Error(`${path}: ${message}`); }
export function object(value, keys, required, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path,'オブジェクトが必要です');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`,'未知の項目です');
  for (const key of required) if (!Object.hasOwn(value,key)) fail(`${path}.${key}`,'必須項目がありません');
}
export function str(value, max, path, nullable=false, nonempty=false) {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || [...value].length > max || (nonempty && !value.trim())) fail(path,`文字列の型・長さを確認してください（上限${max}文字）`);
}
export function validateCard(c, path='card') {
  object(c,['kind','korean','reading_kana','meaning_ja','meaning_en',...Object.keys(optional),'needs_review','example'],['kind','korean','reading_kana','meaning_ja','meaning_en'],path);
  if (!['word','phrase','sentence'].includes(c.kind)) fail(path+'.kind','種類が不正です');
  for (const [k,n] of Object.entries({korean:500,reading_kana:1000,meaning_ja:2000,meaning_en:2000})) str(c[k],n,path+'.'+k,k==='reading_kana',true);
  for (const [k,n] of Object.entries(optional)) if (Object.hasOwn(c,k)) str(c[k],n,path+'.'+k,true);
  if (Object.hasOwn(c,'needs_review') && typeof c.needs_review !== 'boolean') fail(path+'.needs_review','booleanが必要です');
  if (c.example !== undefined && c.example !== null) {
    object(c.example,['ko','ja','en','origin'],['ko','ja','en','origin'],path+'.example');
    for (const k of ['ko','ja','en']) str(c.example[k],2000,path+'.example.'+k,false,true);
    if (!['source','generated'].includes(c.example.origin)) fail(path+'.example.origin','sourceまたはgeneratedが必要です');
  }
  return c;
}
export function validateMeta(d) {
  object(d,['title','source_title','source_url','description_ja'],['title'],'deck');
  str(d.title,200,'deck.title',false,true);
  for (const [k,n] of Object.entries({source_title:500,source_url:2000,description_ja:2000})) if (Object.hasOwn(d,k)) str(d[k],n,'deck.'+k,true);
  if (d.source_url !== undefined && d.source_url !== null) {
    let url; try { url = new URL(d.source_url); } catch { fail('deck.source_url','有効なhttp(s) URLが必要です'); }
    if (!['http:','https:'].includes(url.protocol)) fail('deck.source_url','http(s) URLのみ使用できます');
  }
}
export function parseDeck(text) {
  if (new TextEncoder().encode(text).length > MAX_BYTES) fail('入力','5 MiBを超えています');
  let clean = text.replace(/^\uFEFF/,'').trim();
  const fenced = clean.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  if (fenced) clean=fenced[1];
  let d; try { d=JSON.parse(clean); } catch { fail('JSON','構文が不正です。元のJSONを確認してください'); }
  object(d,['format','schema_version','deck','cards','warnings'],['format','schema_version','deck','cards'],'入力');
  if (d.format !== 'kohaku-korean-deck' || d.schema_version !== 1) fail('入力','対応していない形式・バージョンです');
  validateMeta(d.deck);
  if (!Array.isArray(d.cards) || d.cards.length<1 || d.cards.length>500) fail('cards','1〜500枚が必要です');
  d.cards.forEach((c,i)=>validateCard(c,`cards[${i+1}]`));
  if (d.warnings !== undefined) {
    if (!Array.isArray(d.warnings) || d.warnings.length>100) fail('warnings','100件以下の配列が必要です');
    d.warnings.forEach((w,i)=>str(w,2000,`warnings[${i}]`));
  }
  return d;
}
export function canonical(v) {
  if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if (v && typeof v==='object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
export function emptyLibrary() { return {version:1,cards:[],decks:[],entries:[]}; }
export function matchingDeck(state, incoming) { return state.decks.find(d=>canonical(d.meta)===canonical(incoming.deck)); }
export function importDeck(state, incoming, indices, targetId=null) {
  // Validate again at the write boundary; never mutate the current library.
  parseDeck(JSON.stringify(incoming));
  if (!indices.length) throw new Error('取り込むカードを1枚以上選んでください');
  const next=structuredClone(state);
  let deck=targetId ? next.decks.find(d=>d.id===targetId) : matchingDeck(next,incoming);
  if (targetId && !deck) throw new Error('追加先デッキが見つかりません');
  if (!deck) { deck={id:crypto.randomUUID(),meta:structuredClone(incoming.deck),warnings:[]}; next.decks.push(deck); }
  deck.warnings=[...new Set([...deck.warnings,...(incoming.warnings||[])])];
  const seen=new Set(next.entries.filter(e=>e.deck_id===deck.id).map(e=>canonical(e.source_card)));
  let added=0, skipped=0;
  for (const i of indices) {
    const source=incoming.cards[i];
    if (!source) throw new Error('選択が不正です');
    const key=canonical(source);
    if (seen.has(key)) { skipped++; continue; }
    const card={id:crypto.randomUUID(),content:structuredClone(source),study:{status:'unseen'}};
    next.cards.push(card);
    next.entries.push({id:deck.id+'__'+card.id,deck_id:deck.id,card_id:card.id,source_card:structuredClone(source)});
    seen.add(key); added++;
  }
  return {state:next,deckId:deck.id,added,skipped};
}
export function validateLibrary(s) {
  if (!s || s.version!==1 || !['cards','decks','entries'].every(k=>Array.isArray(s[k]))) throw new Error('保存データの形式が不正です');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const k of ['cards','decks','entries']) if (new Set(s[k].map(x=>x.id)).size!==s[k].length) throw new Error('保存データのIDが重複しています');
  for (const c of s.cards) { if (!uuid.test(c.id) || !['unseen','review','known'].includes(c.study?.status)) throw new Error('カードIDまたは状態が不正です'); validateCard(c.content); }
  for (const d of s.decks) { if (!uuid.test(d.id)) throw new Error('デッキIDが不正です'); validateMeta(d.meta); if (!Array.isArray(d.warnings)) throw new Error('警告が不正です'); d.warnings.forEach(w=>str(w,2000,'warnings')); }
  const cards=new Set(s.cards.map(c=>c.id)), decks=new Set(s.decks.map(d=>d.id));
  for (const e of s.entries) { if (!cards.has(e.card_id)||!decks.has(e.deck_id)||e.id!==e.deck_id+'__'+e.card_id) throw new Error('所属の参照が不正です'); validateCard(e.source_card); }
  return s;
}
export function loadLibrary(storage) { const raw=storage.getItem(STORAGE_KEY); return raw===null ? emptyLibrary() : validateLibrary(JSON.parse(raw)); }
export function saveLibrary(storage,state) { validateLibrary(state); storage.setItem(STORAGE_KEY,JSON.stringify(state)); }
