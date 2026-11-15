import {jamoReading,appendReadingNotes} from './jamo-readings.js';
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
 container.append(el('p','guide-note',firstOnly?'先頭のハングル1文字の構成です。':'文字ごとの構成です。ハングル以外はそのまま表示します。'));
 container.append(el('p','guide-note','これは字母の位置を示す構成図です。実際の字形とは異なります。語の中では音が変わるため、字母をつなぐだけで正しい発音になるとは限りません。'));
 const legend=el('div','jamo-legend');for(const [cls,label]of [['initial','子音（はじめ）'],['vowel','母音'],['final','パッチム（最後の子音）']])legend.append(el('span','jamo-'+cls,label));container.append(legend);appendReadingNotes(container);
 const flow=el('div','hangul-flow');container.append(flow);
 for(const p of shown){
  if(!p.layout){const other=el('span','hangul-other',p.char);flow.append(other);continue;}
  const figure=el('figure','hangul-figure'),original=el('div','hangul-original',p.char);original.lang='ko';figure.append(original,el('div','guide-label','↓ 構成図'));
  const diagram=el('div','jamo-diagram '+p.layout+(p.final?' has-final':''));diagram.setAttribute('role','img');diagram.setAttribute('aria-label',`${p.char}：子音 ${p.initial}、母音 ${p.vowel}、${p.final?'パッチム '+p.final:'パッチムなし'}`);
  function cell(role,jamo,position,label){const n=el('div',`jamo-cell jamo-${role} ${position}`);n.setAttribute('aria-hidden','true');const glyph=el('span','jamo-glyph',jamo);glyph.lang='ko';n.append(glyph,el('small','',label),el('span','jamo-reading',jamoReading(role,jamo)));diagram.append(n);}
  cell('initial',p.initial,'initial-cell','子音');
  if(p.vowelParts){cell('vowel',p.vowelParts[0],'vowel-bottom','母音の一部');cell('vowel',p.vowelParts[1],'vowel-right','母音の一部');}
  else cell('vowel',p.vowel,'vowel-cell','母音');
  if(p.final)cell('final',p.final,'final-cell','パッチム');
  figure.append(diagram,el('figcaption','',`子音 ${p.initial}：${jamoReading('initial',p.initial)} ＋ 母音 ${p.vowel}：${jamoReading('vowel',p.vowel)}${p.vowelParts?'（構成：'+p.vowelParts.join('＋')+'）':''} / ${p.final?'パッチム '+p.final+'：'+jamoReading('final',p.final):'パッチムなし'}`));flow.append(figure);
 }
 if(!parts.some(p=>p.layout))container.append(el('p','guide-note','分解できる現代ハングル文字がありません。単独の字母・古い文字などは分解対象外です。'));
}
