import {readFileSync} from 'node:fs';
import {runTests} from '../docs/tests/tests.js';
import {runPhase1} from '../docs/tests/phase1-tests.js';
const read=p=>readFileSync(new URL('../docs/'+p,import.meta.url),'utf8'),json=p=>JSON.parse(read(p));
const lines=[...runTests(read('sample.deck.json')),...runPhase1(json('sample.deck.json'),json('sample.additional.deck.json'),json('tests/catalog.fixture.json'),json('sample.backup.json'))];
console.log(lines.join('\n'));if(lines.some(s=>s.startsWith('FAIL')))process.exitCode=1;
