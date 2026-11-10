// Node is optional for learning; used only by Codex for local catalogue maintenance.
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {parseDeck,MAX_BYTES} from '../docs/js/model.js';
import {validateCatalog} from '../docs/js/library.js';
import {emptyCatalog,planImport,applyImport} from '../docs/js/catalog-tools.js';
try{
 const [mode,...args]=process.argv.slice(2), opts={};
 for(let i=0;i<args.length;i+=2){if(!['--catalog','--input','--decisions','--target','--out'].includes(args[i])||!args[i+1])throw new Error('引数が不正です');opts[args[i]]=args[i+1];}
 const catalog=opts['--catalog']?validateCatalog(JSON.parse(readFileSync(opts['--catalog'],'utf8'))):emptyCatalog();
 if(mode==='validate'){if(!opts['--catalog'])throw new Error('--catalogが必要です');console.log(`VALID ${catalog.cards.length} Cards / ${catalog.decks.length} Decks / ${catalog.entries.length} Entries`);}
 else if(['plan','apply'].includes(mode)){
  if(!opts['--input'])throw new Error('--inputが必要です');if(statSync(opts['--input']).size>MAX_BYTES)throw new Error('入力が5 MiBを超えています');
  const input=parseDeck(readFileSync(opts['--input'],'utf8'));
  if(mode==='plan')console.log(JSON.stringify(planImport(catalog,input,opts['--target']),null,2));
  else{
   if(!opts['--out'])throw new Error('既存カタログを保護するため、新しい--outパスが必要です');
   const decisions=opts['--decisions']?JSON.parse(readFileSync(opts['--decisions'],'utf8')):{};
   if(!decisions||typeof decisions!=='object'||Array.isArray(decisions))throw new Error('対応表はオブジェクトが必要です');
   const result=applyImport(catalog,input,decisions,opts['--target']);
   writeFileSync(opts['--out'],JSON.stringify(result.catalog,null,2)+'\n',{encoding:'utf8',flag:'wx'});
   console.log(`WROTE ${opts['--out']} : added=${result.added}, reused=${result.reused}, skipped=${result.skipped}`);
  }
 }else throw new Error('Usage: node tools/catalog.mjs validate|plan|apply --catalog docs/data/catalog.json [--input deck.json --decisions choices.json --out NEW.json --target UUID]');
}catch(e){console.error(e.message);process.exitCode=1;}
