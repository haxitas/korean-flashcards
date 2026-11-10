export function koreanVoices(synth) { return synth ? synth.getVoices().filter(v=>/^ko(?:[-_]|$)/i.test(v.lang)) : []; }
export function createSpeech(select, status, getRate, onChoice, preferred='') {
  const synth=globalThis.speechSynthesis;
  let voices=[], chosen=preferred, generation=0;
  function refresh() {
    voices=koreanVoices(synth); select.replaceChildren();
    for (const v of voices) { const o=document.createElement('option'); o.value=v.voiceURI; o.textContent=`${v.name}（${v.localService?'端末':'オンライン'}）`; select.append(o); }
    if (voices.some(v=>v.voiceURI===chosen)) select.value=chosen;
    select.disabled=!voices.length;
    status.textContent=!synth?'このブラウザは音声合成に未対応です。':!voices.length?'韓国語音声が見つかりません。端末の音声設定を確認してください。':'韓国語音声を利用できます。オンライン音声は通信を伴う場合があります。';
  }
  select.addEventListener('change',()=>{chosen=select.value; onChoice(chosen);});
  function cancel() { generation++; synth?.cancel(); }
  refresh(); synth?.addEventListener('voiceschanged',refresh);
  return {cancel, speak(text) {
    cancel(); const current=generation;
    const voice=voices.find(v=>v.voiceURI===select.value);
    if (!synth || !voice) { refresh(); return; }
    try {
      const u=new SpeechSynthesisUtterance(text); u.voice=voice; u.lang=voice.lang; u.rate=getRate();
      status.textContent='音声を準備しています…';
      u.onstart=()=>{if(current===generation) status.textContent='再生中';};
      u.onend=()=>{if(current===generation) status.textContent='再生が終了しました';};
      u.onerror=e=>{if(current===generation) status.textContent=`音声を再生できませんでした（${e.error}）。別の韓国語音声や端末の設定を確認してください。`;};
      synth.speak(u);
    } catch { status.textContent='音声を開始できませんでした。端末の音声設定を確認してください。'; }
  }};
}
