import {parseDeck,canonical,matchingDeck} from './model.js';
import {validateCatalog} from './library.js';
export const emptyCatalog=()=>({format:'kohaku-korean-catalog',schema_version:1,cards:[],decks:[],entries:[]});
export function searchKey(c){return c.kind+'|'+c.korean.normalize('NFC').trim().replace(/\s+/g,' ');}
export function planImport(catalog,incoming,targetId=null){
 validateCatalog(catalog);parseDeck(JSON.stringify(incoming));
 const deck=targetId?catalog.decks.find(d=>d.id===targetId):matchingDeck(catalog,incoming);
 if(targetId&&!deck)throw new Error('追加先デッキがありません');
 return {deckId:deck?.id||null,rows:incoming.cards.map((c,i)=>({index:i,source:c,duplicate:catalog.entries.some(e=>e.deck_id===deck?.id&&canonical(e.source_card)===canonical(c)),candidates:catalog.cards.filter(x=>searchKey(x.content)===searchKey(c)).map(x=>({id:x.id,content:x.content})),earlier:incoming.cards.slice(0,i).map((x,j)=>({x,j})).filter(({x})=>searchKey(x)===searchKey(c)).map(({j})=>j)}))};
}
export function applyImport(catalog,incoming,decisions={},targetId=null){
 const plan=planImport(catalog,incoming,targetId), next=structuredClone(catalog);
 for(const key of Object.keys(decisions))if(!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=incoming.cards.length)throw new Error('対応表の行番号が不正です');
 let deck=next.decks.find(d=>d.id===plan.deckId);
 if(!deck){deck={id:crypto.randomUUID(),meta:structuredClone(incoming.deck),warnings:[]};next.decks.push(deck);}
 let added=0,reused=0,skipped=0;const resolved=new Map();
 for(const row of plan.rows){
  const source=row.source, duplicate=next.entries.find(e=>e.deck_id===deck.id&&canonical(e.source_card)===canonical(source));
  if(duplicate){resolved.set(row.index,duplicate.card_id);skipped++;continue;}
  const candidates=next.cards.filter(c=>searchKey(c.content)===searchKey(source));
  let decision=decisions[row.index];
  if(decision===undefined&&candidates.length===0)decision='new';
  if(decision===undefined)throw new Error(`cards[${row.index}]：同じ見出しの候補があります。new / exclude / {reuse:UUID} / {reuse_index:先行行番号}を明示してください`);
  if(decision==='exclude'){skipped++;continue;}
  let card;
  if(decision==='new'){
   card={id:crypto.randomUUID(),content:structuredClone(source)};next.cards.push(card);added++;
  }else{
   if(!decision||typeof decision!=='object'||Array.isArray(decision)||Object.keys(decision).length!==1)throw new Error('対応表の選択が不正です');
   let id=decision.reuse;
   if(Object.hasOwn(decision,'reuse_index')){if(!Number.isInteger(decision.reuse_index)||decision.reuse_index>=row.index)throw new Error('先行行番号が不正です');id=resolved.get(decision.reuse_index);}
   card=candidates.find(c=>c.id===id);if(!card)throw new Error(`cards[${row.index}]：再利用先が候補内にありません`);reused++;
  }
  resolved.set(row.index,card.id);
  const id=deck.id+'__'+card.id;
  if(!next.entries.some(e=>e.id===id))next.entries.push({id,deck_id:deck.id,card_id:card.id,source_card:structuredClone(source)});
 }
 if(added+reused===0&&!plan.deckId){next.decks=next.decks.filter(d=>d.id!==deck.id);}
 else deck.warnings=[...new Set([...deck.warnings,...(incoming.warnings||[])])];
 validateCatalog(next);return {catalog:next,added,reused,skipped};
}
