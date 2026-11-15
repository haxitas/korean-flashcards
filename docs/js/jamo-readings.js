// RR symbol inventory: National Institute of Korean Language, Romanization §2.
// Coda reductions: Standard Pronunciation §§8–14. These are teaching cues,
// not a context-sensitive word romanizer (liaison/assimilation are not computed).
export const INITIAL_READINGS=Object.fromEntries([... 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'].map((c,i)=>[c,['g','kk','n','d','tt','r','m','b','pp','s','ss','—（無音）','j','jj','ch','k','t','p','h'][i]]));
export const VOWEL_READINGS=Object.fromEntries([... 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'].map((c,i)=>[c,['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'][i]]));
export const FINAL_GROUPS=[['ㄱ ㄲ ㅋ','k'],['ㄴ','n'],['ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ','t'],['ㄹ','l'],['ㅁ','m'],['ㅂ ㅍ','p'],['ㅇ','ng']];
export const DOUBLE_FINALS=[
 ['ㄳ','k','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㄵ','n','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㄶ','n','ㅎは後続音を変えたり、母音の前で消えたりします。'],
 ['ㄺ','k / l','基本はk。用言でㄱが続くとl（읽고など）。'],
 ['ㄻ','m','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㄼ','l / p','基本はl。밟다などはp。単語と後続音で変わります。'],
 ['ㄽ','l','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㄾ','l','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㄿ','p','語末の基本形。母音が続くと分かれることがあります。'],
 ['ㅀ','l','ㅎは後続音を変えたり、母音の前で消えたりします。'],
 ['ㅄ','p','語末の基本形。母音が続くと分かれることがあります。']
];
const FINALS=Object.fromEntries(FINAL_GROUPS.flatMap(([letters,read])=>letters.split(' ').map(c=>[c,read])));
export function jamoReading(role,jamo){
 if(role==='initial')return INITIAL_READINGS[jamo]??'';
 if(role==='vowel')return VOWEL_READINGS[jamo]??'';
 if(role!=='final'||!jamo)return '';
 if(jamo==='ㅎ')return '文脈依存※';
 const double=DOUBLE_FINALS.find(row=>row[0]===jamo);
 return double?double[1]+'※':FINALS[jamo]??'';
}
export function appendReadingNotes(container){
 const doc=container.ownerDocument,p=doc.createElement('p');p.className='guide-note';
 p.textContent='ローマ字は国立国語院の改訂ローマ字表記（RR）を基準にした音の目安で、字母の名前ではありません。英語読みとは異なります。子音は母音の前、パッチムは語末の基本音を示します。連音・同化など、単語全体の発音変化は計算していません。※は後続音や単語で変化します。回答後に登録カナ・音声も確認してください。';container.append(p);
 const links=doc.createElement('p');links.className='guide-note';
 for(const [label,url] of [['ローマ字の出典','https://www.korean.go.kr/front_eng/roman/roman_01.do'],['標準発音法（第8〜14項）','https://www.korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0002']]){const a=doc.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a,doc.createTextNode(' '));}container.append(links);
}
export function appendReadingTable(container,caption,headers,rows,role=''){
 const doc=container.ownerDocument,table=doc.createElement('table');table.className='jamo-table '+(role?'jamo-'+role:'');
 const cap=doc.createElement('caption');cap.textContent=caption;table.append(cap);
 const head=doc.createElement('thead'),tr=doc.createElement('tr');for(const label of headers){const th=doc.createElement('th');th.scope='col';th.textContent=label;tr.append(th);}head.append(tr);table.append(head);
 const body=doc.createElement('tbody');for(const row of rows){const tr=doc.createElement('tr');row.forEach((value,i)=>{const td=doc.createElement(i===0?'th':'td');if(i===0)td.scope='row';td.textContent=value;tr.append(td);});body.append(tr);}table.append(body);container.append(table);return table;
}
export function renderReadingReference(container,parts){
 container.replaceChildren();appendReadingNotes(container);
 const rows=[];for(const p of parts.filter(p=>p.layout)){for(const [role,label,jamo] of [['initial','子音',p.initial],['vowel','母音',p.vowel],['final','パッチム',p.final]])rows.push([p.char,label,jamo?`${jamo}：${jamoReading(role,jamo)}`:'なし']);}
 if(rows.length)appendReadingTable(container,'この問題の字母と読み（出現順）',['文字','役割','字母：読み'],rows);
 appendReadingTable(container,'子音19字（母音の前）',['字母','ローマ字'],Object.entries(INITIAL_READINGS),'initial');
 const p=container.ownerDocument.createElement('p');p.className='guide-note';p.textContent='ㄱ・ㄷ・ㅂは母音の前でg・d・b、語末の基本音ではk・t・p。語頭と語中では聞こえ方も変わります。ㄹは母音の前でr、語末でl、ㄹㄹはll。初声ㅇは無音です。';container.append(p);
 appendReadingTable(container,'母音21字',['字母','ローマ字'],Object.entries(VOWEL_READINGS),'vowel');
 const v=container.ownerDocument.createElement('p');v.className='guide-note';v.textContent='ㅢは発音が変わる場合も表記はui。複合母音の読みは全体の表記（例：ㅘ＝wa）を使います。図中の部品の読みを単純につなげるものではありません。';container.append(v);
 appendReadingTable(container,'パッチム：7つの基本終声音（語末）',['対応する字母','ローマ字'],FINAL_GROUPS,'final');
 const f=container.ownerDocument.createElement('p');f.className='guide-note';f.textContent='k・t・pの後に母音を足さず、息を破裂させずに止めます。母音が続くと次の音節へつながり、子音の前でも同化などで変わります。ㅎは一律にhと読まず、後続音を強い息の音に変えたり、母音の前で消えたりします。';container.append(f);
 appendReadingTable(container,'二重パッチム11字：基本音と注意',['字母','目安','変わる場合'],DOUBLE_FINALS,'final');
}
