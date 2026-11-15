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
// Learning cues deliberately differ from RR spelling; grading never imports this module.
export const INITIAL_GROUPS=[['基本の子音10字','ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅎ'],['息を強く出す子音（激音）4字','ㅋㅌㅍㅊ'],['息を抑えて出す子音（濃音）5字','ㄲㄸㅃㅆㅉ']];
export const VOWEL_GROUPS=[['基本の母音10字','ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'],['追加の母音11字','ㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ']];
export const FINAL_MOUTH={k:'舌の奥で止める。母音を足さない。',n:'舌先を上の歯ぐきに当て、鼻に響かせる。',t:'舌先で止める。母音を足さない。',l:'舌先を上の歯ぐきに付ける。',m:'唇を閉じ、鼻に響かせる。',p:'唇を閉じて止める。母音を足さない。',ng:'舌の奥でせき止め、鼻に響かせる。唇は閉じない。'};
export function soundCue(role,jamo){return role==='initial'?({'ㄱ':'k / g','ㄷ':'t / d','ㅂ':'p / b','ㅈ':'ch / j'}[jamo]??jamoReading(role,jamo)):jamoReading(role,jamo);}
function text(container,tag,value,cls='guide-note'){const n=container.ownerDocument.createElement(tag);n.className=cls;n.textContent=value;container.append(n);return n;}
export function readingDetails(container,label,cls='reading-details'){
 const details=container.ownerDocument.createElement('details');details.className=cls;text(details,'summary',label,'');container.append(details);return details;
}
export function appendReadingIntro(container){
 text(container,'p','ローマ字は音を思い出すヒント。英語の単語のようには読みません。k / gなどは聞こえ方の幅で、どちらかを自由に選ぶ意味ではありません。※は単語や後続音で変わります。');
}
export function appendReadingNotes(container){
 const details=readingDetails(container,'ローマ字の使い方・参考動画・出典');
 text(details,'p','ここでの「発音の目安」と、名前などを書く標準表記（RR）は目的が違います。ㄱ・ㄷ・ㅂ・ㅈは目安をk/g・t/d・p/b・ch/j、母音の前のRRをg・d・b・jとしています。語中では濁った音に近づくことがありますが、「2文字目以降は必ず濁る」という規則ではありません。');
 text(details,'p','最初のㅇは無音、下のㅇはng。ㄹは母音の前でr、語末でl、ㄹㄹはllです。濃音は息を強く吹かず、口や喉に力を入れて出す目安です。ㅉはこの表ではRRのjjを使用します（参考動画のcchとは表記が異なります）。');
 text(details,'p','パッチムは語末の基本音です。連音・同化など、語の中で変わる音をこの図から自動判定してはいません。図は字母の部屋を示すもので、実際の字形とは異なります。回答後の登録カナ・音声も確認してください。採点は従来どおり登録カナとの照合です。');
 text(details,'p','参考：アンニョン韓国語教室「【300万再生】ハングル完全攻略【永久保存版】」。部屋の図と基本から学ぶ順序を参考に、文章・図は独自に作成しました。');
 const links=text(details,'p','','guide-links');
 for(const [label,url] of [['動画 5:24：字母の組合せ','https://www.youtube.com/watch?v=8c76RtymHtA&t=324s'],['動画 23:02：パッチムの部屋','https://www.youtube.com/watch?v=8c76RtymHtA&t=1382s'],['動画 51:08：追加の母音','https://www.youtube.com/watch?v=8c76RtymHtA&t=3068s'],['国立国語院：RR','https://www.korean.go.kr/front_eng/roman/roman_01.do'],['国立国語院：標準発音法','https://www.korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0002']]){const a=details.ownerDocument.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
}
export function appendReadingTable(container,caption,headers,rows,role=''){
 const doc=container.ownerDocument,table=doc.createElement('table');table.className='jamo-table '+(role?'jamo-'+role:'');
 const cap=doc.createElement('caption');cap.textContent=caption;table.append(cap);
 const head=doc.createElement('thead'),tr=doc.createElement('tr');for(const label of headers){const th=doc.createElement('th');th.scope='col';th.textContent=label;tr.append(th);}head.append(tr);table.append(head);
 const body=doc.createElement('tbody');for(const row of rows){const tr=doc.createElement('tr');row.forEach((value,i)=>{const td=doc.createElement(i===0?'th':'td');if(i===0)td.scope='row';td.textContent=value;tr.append(td);});body.append(tr);}table.append(body);container.append(table);return table;
}
export function renderReadingReference(container,parts){
 container.replaceChildren();text(container,'h3','字母の読み方ノート','guide-heading');appendReadingIntro(container);
 const word=text(container,'div','','word-reading-tables');
 for(const [index,p] of parts.filter(p=>p.layout).entries()){
  const rows=[['最初の子音',p.initial,soundCue('initial',p.initial)],['母音',p.vowel,soundCue('vowel',p.vowel)],['下のパッチム',p.final||'なし',p.final?soundCue('final',p.final):'—']];
  appendReadingTable(word,`${index+1}文字目「${p.char}」`,['部屋','字母','発音の目安'],rows).classList.add('word-reading-table');
 }
 text(container,'h3','まずは基本から','guide-heading');
 appendReadingTable(container,INITIAL_GROUPS[0][0],['字母','発音の目安'],[...INITIAL_GROUPS[0][1]].map(c=>[c,soundCue('initial',c)]),'initial').dataset.group='initial-basic';
 text(container,'p','最初のㅇは音を出さず、母音だけを読みます。下のパッチムにあるㅇ（ng）とは別です。');
 appendReadingTable(container,VOWEL_GROUPS[0][0],['字母','発音の目安'],[...VOWEL_GROUPS[0][1]].map(c=>[c,soundCue('vowel',c)]),'vowel').dataset.group='vowel-basic';
 text(container,'p','eo・euは文字を1つずつ「エ・オ」「エ・ウ」と読む記号ではなく、それぞれ1つの母音の目安です。基本10＋追加11は覚える順番のグループです。音声学の単母音・二重母音の分類とは異なります。');
 const extra=readingDetails(container,'次に覚える：激音4・濃音5・追加の母音11','reading-details extra-jamo');
 text(extra,'p','激音は息を強く出します。濃音は息を強く吹かず、口や喉に力を入れて出す目安です。');
 for(const [i,[label,letters]]of INITIAL_GROUPS.slice(1).entries())appendReadingTable(extra,label,['字母','発音の目安'],[...letters].map(c=>[c,soundCue('initial',c)]),'initial').dataset.group=i===0?'initial-aspirated':'initial-tense';
 appendReadingTable(extra,VOWEL_GROUPS[1][0],['字母','発音の目安'],[...VOWEL_GROUPS[1][1]].map(c=>[c,soundCue('vowel',c)]),'vowel').dataset.group='vowel-extra';
 text(extra,'p','ㅘはwa、ㅙはwae。図の部品の音を1つずつ読むのではなく、母音全体で読みます。ㅢは発音が変わる場合もRR表記はuiです。');
 text(container,'h3','下の部屋：パッチム','guide-heading');
 text(container,'p','まずは7つの基本音。k・t・pは息を破裂させず止め、後ろに「ウ」などの母音を足しません。');
 appendReadingTable(container,'パッチム7音（語末の基本）',['字母','音の目安','口の動き'],FINAL_GROUPS.map(([letters,read])=>[letters,read,FINAL_MOUTH[read]]),'final').classList.add('final-reading-table');
 const liaison=readingDetails(container,'つながって読む例：옷 ＋ 이 → 오시','reading-details liaison-example');
 text(liaison,'p','「服」を表す옷に助詞이を付けた例です。次の母音へㅅがつながります。');
 const flow=text(liaison,'div','','liaison-flow');text(flow,'span','옷 ＋ 이','liaison-written');text(flow,'span','ㅅ → 次の母音へ','liaison-arrow');text(flow,'span','発音：오시（osi）','liaison-spoken');
 text(liaison,'p','母音で始まる助詞・語尾などにつながるときの例です。ㅇの前でいつでも同じ変化をするわけではありません。');
 const special=readingDetails(container,'慣れてきたら：ㅎ・二重パッチムの注意','reading-details double-finals');
 text(special,'p','ㅎは一律にhと読まず、後続音を変えたり母音の前で消えたりします。二重パッチムは「字母順で早い方」と決めず、単語や後続音を確認します。※の詳しい目安は次の表です。');
 appendReadingTable(special,'二重パッチム11字',['字母','基本音の目安','注意'],DOUBLE_FINALS,'final');
 const rr=readingDetails(container,'標準表記（RR）と比べる','reading-details rr-reference');
 text(rr,'p','RRは名前などをローマ字で書くための方式です。以下は母音の前の対応で、学習用の発音目安とは区別します。単語全体のRR変換や採点には使っていません。');
 appendReadingTable(rr,'子音：発音の目安とRR',['字母','発音の目安','RR（母音前）'],Object.entries(INITIAL_READINGS).map(([c,read])=>[c,soundCue('initial',c),read]),'initial');
 appendReadingNotes(container);
}
