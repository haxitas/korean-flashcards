import {soundCue,appendReadingIntro,appendReadingNotes} from './jamo-readings.js';
// Unicode 16, section 3.12: modern Hangul syllables U+AC00..U+D7A3.
// https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G24646
const INITIAL=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const VOWEL=[...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const FINAL=['',...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const HORIZONTAL=new Set([8,12,13,17,18]);
const MIXED={9:['ㅗ','ㅏ'],10:['ㅗ','ㅐ'],11:['ㅗ','ㅣ'],14:['ㅜ','ㅓ'],15:['ㅜ','ㅔ'],16:['ㅜ','ㅣ'],19:['ㅡ','ㅣ']};
export function decomposeSyllable(char){
 const chars=[...char.normalize('NFC')];if(chars.length!==1)return null;
 const s=chars[0].codePointAt(0)-0xAC00;if(s<0||s>=11172)return null;
 const l=Math.floor(s/588),v=Math.floor(s%588/28),t=s%28;
 return {char:chars[0],initial:INITIAL[l],vowel:VOWEL[v],final:FINAL[t],layout:MIXED[v]?'mixed':HORIZONTAL.has(v)?'horizontal':'vertical',vowelParts:MIXED[v]||null};
}
export function hangulParts(text){
 const parts=[];for(const char of text.normalize('NFC')){const p=decomposeSyllable(char);if(p)parts.push(p);else if(parts.length&&!parts.at(-1).layout)parts.at(-1).char+=char;else parts.push({char,layout:null});}return parts;
}
export function renderHangulGuide(container,text,firstOnly=false){
 const doc=container.ownerDocument,parts=hangulParts(text),shown=firstOnly?parts.filter(p=>p.layout).slice(0,1):parts;
 const el=(tag,cls,value)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
 container.replaceChildren();
 container.append(el('h3','guide-heading',firstOnly?'先頭の1文字を見てみよう':'文字を3つの部屋に分けよう'));container.append(el('p','guide-note','①部屋の位置を見る → ②音の目安を読む → ③字母を組み合わせる。下のパッチムがない文字もあります。'));appendReadingIntro(container);
 const legend=el('div','jamo-legend');for(const [cls,label]of [['initial','最初の子音'],['vowel','母音'],['final','下のパッチム']])legend.append(el('span','jamo-'+cls,label));container.append(legend);
 const flow=el('div','hangul-flow');container.append(flow);
 for(const p of shown){
  if(!p.layout){const other=el('span','hangul-other',p.char);flow.append(other);continue;}
  const figure=el('figure','hangul-figure'),original=el('div','hangul-original',p.char);original.lang='ko';figure.append(original,el('div','guide-label','① 部屋と ② 音の目安'));
  const diagram=el('div','jamo-diagram '+p.layout+(p.final?' has-final':''));diagram.setAttribute('role','img');diagram.setAttribute('aria-label',`${p.char}：最初の子音 ${p.initial} ${soundCue('initial',p.initial)}、母音 ${p.vowel} ${soundCue('vowel',p.vowel)}、${p.final?'パッチム '+p.final:'パッチムなし'}`);
  function cell(role,jamo,position,label){const n=el('div',`jamo-cell jamo-${role} ${position}`);n.setAttribute('aria-hidden','true');const glyph=el('span','jamo-glyph',jamo);glyph.lang='ko';n.append(glyph,el('small','',label),el('span','jamo-reading',soundCue(role,jamo)));diagram.append(n);}
  cell('initial',p.initial,'initial-cell','最初の子音');
  if(p.vowelParts){cell('vowel',p.vowelParts[0],'vowel-bottom','母音の一部');cell('vowel',p.vowelParts[1],'vowel-right','母音の一部');}
  else cell('vowel',p.vowel,'vowel-cell','母音');
  if(p.final)cell('final',p.final,'final-cell','下のパッチム');
  const caption=el('figcaption','');caption.append(el('p','assembly-line',`③ ${p.initial} ＋ ${p.vowel}${p.final?' ＋ '+p.final:''} → ${p.char}`));
  caption.append(el('p','',`母音 ${p.vowel}：${soundCue('vowel',p.vowel)}${p.vowelParts?'（全体の音。図の部品は'+p.vowelParts.join('＋')+'）':''} / ${p.final?'下のパッチム '+p.final+'：'+soundCue('final',p.final):'パッチムなし'}`));
  figure.append(diagram,caption);flow.append(figure);
 }
 appendReadingNotes(container);
 if(!parts.some(p=>p.layout))container.append(el('p','guide-note','分解できる現代ハングル文字がありません。単独の字母・古い文字などは分解対象外です。'));
}
