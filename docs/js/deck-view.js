export function safeSourceUrl(value){
 if(typeof value!=='string')return null;
 try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}
}
export function sourceLink(doc,meta){
 const href=safeSourceUrl(meta.source_url);if(!href)return null;
 const link=doc.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';
 link.textContent='元動画・出典を開く ↗';link.setAttribute('aria-label',`${meta.source_title||meta.title}：元動画・出典を開く`);return link;
}
export function deckSources(library,cardId,deckId=''){
 const ids=new Set(library.entries.filter(e=>e.card_id===cardId&&(!deckId||e.deck_id===deckId)).map(e=>e.deck_id));
 return library.decks.filter(d=>ids.has(d.id));
}
export function resolveDeck(search,decks){
 const requested=new URLSearchParams(search).get('deck');
 return !requested?{id:'',missing:false}:decks.some(d=>d.id===requested)?{id:requested,missing:false}:{id:'',missing:true};
}
export function deckUrl(base,id){const url=new URL(base);if(id)url.searchParams.set('deck',id);else url.searchParams.delete('deck');return url.href;}
export function renderDeckLibrary(container,library,onSelect,base){
 const doc=container.ownerDocument;container.replaceChildren();
 const decks=[...library.decks].sort((a,b)=>Number(!!safeSourceUrl(b.meta.source_url))-Number(!!safeSourceUrl(a.meta.source_url)));
 for(const d of decks){
  const article=doc.createElement('article');article.className='deck-tile';
  const title=doc.createElement('h3');title.textContent=d.meta.title;
  const source=doc.createElement('p');source.className='muted';source.textContent=d.meta.source_title||'出典タイトル未設定';
  const count=doc.createElement('p');count.textContent=`${new Set(library.entries.filter(e=>e.deck_id===d.id).map(e=>e.card_id)).size}枚`;
  const open=doc.createElement('a');open.className='deck-open';open.href=deckUrl(base,d.id);open.textContent='この単語帳で学ぶ';
  open.addEventListener('click',e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();onSelect(d.id);});
  article.append(title,source,count,open);const link=sourceLink(doc,d.meta);if(link)article.append(link);container.append(article);
 }
}
