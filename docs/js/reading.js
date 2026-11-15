// Kana spelling comparison only. Do not erase phonetic distinctions or guess alternatives.
export function normalizeReading(value){
 return value.normalize('NFKC').replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60)).replace(/\s/gu,'');
}
export function readingEligible(card){return !card.content.needs_review&&typeof card.content.reading_kana==='string'&&normalizeReading(card.content.reading_kana)!=='';}
export function readingMode(search){return new URLSearchParams(search).get('mode')==='reading';}
export function createReadingSession(now=()=>performance.now()){
 let cards=[],index=0,started=0,result=null;
 const reset=()=>{started=now();result=null;};
 return {
  setCards(rows){cards=rows.filter(readingEligible);index=0;reset();},
  get card(){return cards[index];},get index(){return index;},get total(){return cards.length;},get result(){return result;},
  submit(value){if(result||!cards[index])return null;const answer=normalizeReading(value);if(!answer)return null;result={correct:answer===normalizeReading(cards[index].content.reading_kana),seconds:Math.max(0,now()-started)/1000};return result;},
  next(){if(!result||index>=cards.length-1)return false;index++;reset();return true;},
  restart(){index=0;reset();}
 };
}
// All answer strings are absent from the rendered result until submission.
export function createReadingView(root,speak,now=()=>performance.now(),cancel=()=>{}){
 const doc=root.ownerDocument,session=createReadingSession(now),$=id=>root.querySelector('#'+id);
 let composing=false,endedAt=-Infinity,blockedEnter=false;
 function clearIME(){composing=false;endedAt=-Infinity;blockedEnter=false;}
 function paint(){
  const card=session.card,result=session.result;
  $('readingQuestion').textContent=card?.content.korean||'';
  $('readingPosition').textContent=card?`${session.index+1} / ${session.total}`:'0 / 0';
  $('readingForm').hidden=!card;$('readingResult').replaceChildren();$('readingFeedback').textContent='';
  $('readingAnswer').disabled=!!result;$('readingSubmit').disabled=!!result;
  $('readingSpeak').hidden=!result;$('readingNext').hidden=!result||session.index>=session.total-1;
  $('readingRestart').hidden=!result||session.index<session.total-1;
  if(result){
   $('readingFeedback').textContent=(result.correct?'正解':'登録の読みとは異なります')+` · 回答まで ${result.seconds.toFixed(1)}秒`;
   for(const [text,lang] of [[`正解の読み：${card.content.reading_kana}`,'ja'],[card.content.meaning_ja,'ja'],[card.content.meaning_en,'en']]){const p=doc.createElement('p');p.textContent=text;p.lang=lang;$('readingResult').append(p);}
  }
 }
 $('readingAnswer').addEventListener('compositionstart',()=>{composing=true;});
 $('readingAnswer').addEventListener('compositionend',()=>{composing=false;endedAt=now();});
 $('readingAnswer').addEventListener('keydown',e=>{if(e.key==='Enter'&&(composing||e.isComposing||e.keyCode===229||now()-endedAt<100)){blockedEnter=true;e.preventDefault();}});
 $('readingAnswer').addEventListener('keyup',e=>{if(e.key==='Enter')blockedEnter=false;});
 $('readingForm').addEventListener('submit',e=>{
  e.preventDefault();if(composing||blockedEnter||now()-endedAt<100||session.result)return;
  if(!normalizeReading($('readingAnswer').value)){$('readingFeedback').textContent='読みを入力してください。';return;}
  if(session.submit($('readingAnswer').value)){paint();($('readingNext').hidden?$('readingRestart'):$('readingNext')).focus();}
 });
 $('readingNext').onclick=()=>{if(session.next()){cancel();clearIME();$('readingAnswer').value='';paint();$('readingAnswer').focus();}};
 $('readingRestart').onclick=()=>{cancel();session.restart();clearIME();$('readingAnswer').value='';paint();$('readingAnswer').focus();};
 $('readingSpeak').onclick=()=>{if(session.result&&session.card)speak(session.card.content.korean);};
 return {setCards(rows){session.setCards(rows);clearIME();$('readingAnswer').value='';$('readingExcluded').textContent=`出題 ${session.total}枚 · 読み未登録・要確認のため除外 ${rows.length-session.total}枚`;$('readingEmpty').hidden=!!session.total;paint();}};
}
