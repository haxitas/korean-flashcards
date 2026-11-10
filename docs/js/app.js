import {STORAGE_KEY,loadLibrary} from './model.js';
import {LOCAL_KEY,BACKUP_LIMIT,emptyLocal,loadLocal,saveLocal,mergeCatalog,validateCatalog,makeBackup,parseBackup,restoreBackup,restoreCounts,migrateLegacy,setStudy,selectCards,shuffle,useLatestCatalog} from './library.js';
import {createSpeech} from './speech.js';
const $=id=>document.getElementById(id), stateButton=s=>$(s==='review'?'reviewState':s);
let local=emptyLocal(), baseline=null, rows=[], index=0, back=false, ready=false, blocked=false, pending=null, legacy=null, sequence=0, catalog=null;
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function commit(next){if(blocked)throw new Error('保存データの確認が必要です');const raw=saveLocal(localStorage,next,baseline);local=next;baseline=raw;}
let voice='';try{voice=localStorage.getItem('kohaku-korean-voice-v1')||'';}catch{}
const speech=createSpeech($('voice'),$('speechStatus'),()=>local.settings.speech_rate,v=>{try{localStorage.setItem('kohaku-korean-voice-v1',v);}catch{message('音声の選択を保存できませんでした。',true);}},voice);
function paragraph(parent,text,lang){if(!text)return;const p=document.createElement('p');p.textContent=text;if(lang)p.lang=lang;parent.append(p);}
function list(id,items){$(id).replaceChildren();for(const text of items){const li=document.createElement('li');li.textContent=text;$(id).append(li);}}
function option(select,value,text){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}
function refreshDecks(){const selected=$('deckSelect').value;$('deckSelect').replaceChildren();option($('deckSelect'),'','すべての単語');for(const d of local.library.decks)option($('deckSelect'),d.id,d.meta.title);if(local.library.decks.some(d=>d.id===selected))$('deckSelect').value=selected;refreshRows();}
function refreshRows(){speech.cancel();rows=selectCards(local.library,{deckId:$('deckSelect').value,query:$('search').value,status:$('filter').value});if($('shuffle').checked)rows=shuffle(rows);index=0;back=false;$('aids').open=false;render();}
function render(){
 const card=rows[index],c=card?.content,deckId=$('deckSelect').value;
 $('empty').hidden=!!c;$('studyContent').hidden=!c;$('count').textContent=`${rows.length}枚 / 全${local.library.cards.length}枚`;
 const d=local.library.decks.find(d=>d.id===deckId);
 list('warnings',d?d.warnings:local.library.decks.flatMap(d=>d.warnings.map(w=>d.meta.title+'：'+w)));$('warningsBox').hidden=!$('warnings').childElementCount;
 if(!c)return;
 $('source').textContent=d?.meta.source_title||'すべての単語：同じカードは1枚にまとめて表示';
 $('side').textContent=back?'MEANING · 裏':'KOREAN · 表';$('primary').textContent=back?c.meaning_ja:c.korean;$('primary').lang=back?'ja':'ko';
 $('secondary').textContent=back?c.meaning_en:(local.settings.show_kana?(c.reading_kana||'読み未確認'):'');$('secondary').lang=back?'en':'ja';
 $('flipHint').textContent=back?'タップ / Enter / Space で韓国語に戻る':'タップ / Enter / Space で意味を確認';
 $('review').textContent=c.needs_review||c.reading_kana===null?'教材の内容を要確認'+(c.review_note_ja?'：'+c.review_note_ja:''):'';
 $('aidText').replaceChildren();
 for(const [k,label]of Object.entries({pronunciation_hangul:'発音ハングル',romanization:'ローマ字（RR）',ipa:'IPA',pronunciation_note_ja:'発音メモ'})){
  if(k==='romanization'&&!local.settings.show_romanization||k==='ipa'&&!local.settings.show_ipa)continue;
  if(c[k])paragraph($('aidText'),label+'：'+c[k]);
 }
 $('aids').hidden=!$('aidText').childElementCount;$('notes').hidden=!back;$('notes').replaceChildren();paragraph($('notes'),c.note_ja);
 for(const e of local.library.entries.filter(e=>e.card_id===card.id&&(!deckId||e.deck_id===deckId))){
  const title=local.library.decks.find(d=>d.id===e.deck_id).meta.title,source=e.source_card;
  paragraph($('notes'),'出典デッキ：'+title);
  if(source.surface_form)paragraph($('notes'),'原文の形：'+source.surface_form,'ko');
  if(source.example){paragraph($('notes'),source.example.origin==='source'?'例文（原文から引用）':'例文（作成・補作）');paragraph($('notes'),source.example.ko,'ko');paragraph($('notes'),source.example.ja,'ja');paragraph($('notes'),source.example.en,'en');}
 }
 for(const s of ['unseen','review','known'])stateButton(s).setAttribute('aria-pressed',String(card.study.status===s));
 $('position').textContent=`${index+1} / ${rows.length}`;$('prev').disabled=index===0;$('next').disabled=index>=rows.length-1;
}
function settingsUI(){for(const [id,key]of [['kana','show_kana'],['romanization','show_romanization'],['ipa','show_ipa']])$(id).checked=local.settings[key];$('rate').value=local.settings.speech_rate;$('rateValue').textContent=local.settings.speech_rate;}
for(const id of ['deckSelect','filter','shuffle'])$(id).onchange=refreshRows;$('search').oninput=refreshRows;
function move(delta){speech.cancel();index+=delta;back=false;$('aids').open=false;render();}
$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('card').onclick=()=>{back=!back;render();};$('speak').onclick=()=>{if(rows[index])speech.speak(rows[index].content.korean);};
for(const status of ['unseen','review','known'])stateButton(status).onclick=()=>{const card=rows[index];if(!card)return;try{commit(setStudy(local,card.id,status));rows[index]=local.library.cards.find(c=>c.id===card.id);if($('filter').value&&$('filter').value!==status){rows.splice(index,1);index=Math.max(0,Math.min(index,rows.length-1));back=false;speech.cancel();}render();message('学習状態をこの端末に保存しました。');}catch(e){message('保存できませんでした：'+e.message,true);}};
function changeSetting(key,value){try{const next=structuredClone(local);next.settings[key]=value;commit(next);settingsUI();render();message('表示・音声設定をこの端末に保存しました。');}catch(e){settingsUI();message('設定を保存できませんでした：'+e.message,true);}}
for(const [id,key]of [['kana','show_kana'],['romanization','show_romanization'],['ipa','show_ipa']])$(id).onchange=()=>changeSetting(key,$(id).checked);
$('rate').onchange=()=>changeSetting('speech_rate',Number($('rate').value));
function invalidate(){sequence++;pending=null;$('restorePreview').hidden=true;$('restoreAck').checked=false;}
$('backupText').oninput=invalidate;
function previewRestore(text){invalidate();try{pending=parseBackup(text);const counts=restoreCounts(local,pending);$('restoreSummary').textContent=Object.entries(counts).map(([k,v])=>`${k}: ${v.total}件（同ID上書き${v.overwrite}件）`).join(' / ');$('restorePreview').hidden=false;$('restoreConfirm').disabled=blocked;message('まだ復元していません。現在の完全バックアップを保存してから、上書き内容を確認してください。');}catch(e){message(e.message,true);}}
$('previewRestore').onclick=()=>previewRestore($('backupText').value);
$('backupFile').onchange=async()=>{invalidate();const token=sequence,file=$('backupFile').files[0];if(!file)return;try{if(file.size>BACKUP_LIMIT)throw new Error('バックアップは20 MiBまでです');const text=await file.text();if(sequence!==token)return;$('backupText').value=text;previewRestore(text);}catch(e){if(sequence===token)message(e.message,true);}};
$('restoreConfirm').onclick=()=>{if(!pending||!$('restoreAck').checked){message('上書きと端末内保護の確認にチェックしてください。',true);return;}try{commit(restoreBackup(local,pending));ready=true;$('export').disabled=false;invalidate();settingsUI();refreshDecks();checkLegacy();message('完全バックアップをこの端末に復元しました。復元内容はカタログ更新より優先して保持します。');}catch(e){message('復元できませんでした：'+e.message,true);}};
$('export').onclick=()=>{try{if(!ready||blocked)throw new Error('教材の読み込み・保存データを先に確認してください');const text=JSON.stringify(makeBackup(local),null,2);const bytes=new TextEncoder().encode(text).length;if(bytes>BACKUP_LIMIT){message('完全バックアップが20 MiBを超えます。切り捨てず出力しますが、この版では復元できません。',true);}else message('完全バックアップをダウンロードします。個人データなのでGitへ入れないでください。');const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kohaku-private-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){message(e.message,true);}};
function checkLegacy(){
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw===null){$('legacy').hidden=true;return;}legacy=loadLibrary(localStorage);$('legacy').hidden=legacy.cards.every(c=>local.library.cards.some(x=>x.id===c.id));$('legacyCount').textContent=`Phase 0の保存データ ${legacy.cards.length}枚があります。元データは削除しません。移行すると旧UUIDのまま端末内に追加され、カタログの同じ語と重複する場合があります。`;}
 catch{$('legacy').hidden=false;$('legacyCount').textContent='Phase 0の保存データを読み込めません。元データはそのまま残しています。';$('migrate').disabled=true;}
}
$('migrate').onclick=()=>{if(!legacy||!$('legacyAck').checked){message('移行内容の確認にチェックしてください。',true);return;}try{commit(migrateLegacy(local,legacy,local.settings));ready=true;$('export').disabled=false;refreshDecks();checkLegacy();message('旧データをID・学習状態ごと移行しました。元のPhase 0保存領域も残しています。');}catch(e){message('移行できませんでした：'+e.message,true);}};
$('latest').onclick=()=>{if(!$('latestAck').checked){message('配信教材への切替内容を確認してください。',true);return;}try{if(!catalog)throw new Error('有効なカタログを読み込めていません');commit(useLatestCatalog(local,catalog));$('latestAck').checked=false;refreshDecks();message('カタログにあるIDの教材を配信版へ戻しました。学習状態とカタログにない教材は保持しました。');}catch(e){message('切替できませんでした：'+e.message,true);}};
addEventListener('pagehide',()=>speech.cancel());
async function start(){
 try{local=loadLocal(localStorage);baseline=localStorage.getItem(LOCAL_KEY);}catch(e){blocked=true;message('既存の保存データを読み込めません。元データを保護し書込を停止しました：'+e.message,true);$('catalogStatus').textContent='要確認：保存データ読込失敗';return;}
 try{const r=await fetch('./data/catalog.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const incoming=validateCatalog(await r.json()),next=mergeCatalog(local,incoming);commit(next);catalog=incoming;$('catalogStatus').textContent='静的教材を読み込みました · 学習状態は端末内のみ';ready=true;}
 catch(e){ready=local.library.cards.length>0;$('catalogStatus').textContent='要確認：教材を更新できません。保存済み教材があれば表示します。';message('教材読込・保存失敗：'+e.message,true);}
 settingsUI();refreshDecks();checkLegacy();$('export').disabled=!ready;$('previewRestore').disabled=false;$('latest').disabled=!catalog;
}
start();
