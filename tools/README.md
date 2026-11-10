# Codexによるローカル教材管理

学習画面へ教材追加UIは置かない。教材生成はCARD_GENERATION_PROMPT.txtを使い、生成物を.private/などGit対象外へ保存する。追加候補は1回5 MiB/500枚まで。Node v24で確認済み、追加パッケージ不要。

1. `node tools/catalog.mjs validate --catalog docs/data/catalog.json` で現在の教材を確認。
2. `node tools/catalog.mjs plan --catalog docs/data/catalog.json --input .private/incoming.json` で0始まりの行番号、既存UUID候補、先行入力候補、元入力一致を確認。
3. 対応表 `.private/choices.json` を作成。候補のない行は新規、候補ありは明示必須。例：`{"0":{"reuse":"実際の候補UUID"},"1":"new","2":"exclude","3":{"reuse_index":0}}`。reuse_indexはこの入力内の先行行に解決済みのカードを参照する。単語の綴りだけで語義を判断しない。
4. `node tools/catalog.mjs apply --catalog docs/data/catalog.json --input .private/incoming.json --decisions .private/choices.json --out .private/catalog.next.json`。出力は未使用パスのみ（既存ファイルを上書きしない）。既存デッキへの分割入力なら `--target デッキUUID` を指定。省略時はdeckメタ情報完全一致で既存デッキを選ぶ。
5. 次のカタログをvalidateし、差分でID・語義・出典・内容を確認。公開可能な教材だけであることを確認後、docs/data/catalog.jsonへ反映。入力JSONや個人状態は追加しない。
6. `node tools/run-tests.mjs` とブラウザテスト、カード表示・状態保持を確認。教材の追加で架空サンプル固定テストを変える必要がある場合、検証用fixtureを分けて既存期待値を捨てない。
7. 専用リポジトリと外部操作の承認後にのみPRへ進む。PRで変更理由・再利用対応・追加件数・検証を示す。作成だけではサイトに反映されず、マージと配信更新が必要。

最初のdocs/data/catalog.jsonはdocs/sample.deck.jsonの배行2/3を明示new、docs/sample.additional.deck.jsonの공부・梨を明示reuseで作成済み。tools/sample-b.decisions.jsonはその固定UUIDに対応する架空サンプルの判断記録。教材修正は同じUUIDのcontentを必要箇所だけ更新する。通常のapplyは既存Cardを修正しない。

同じデッキ・同じCardのEntryは1件で、最初のsource_cardを保持する。同じ見出し・訳が別の表記で再度現れた場合、対応表で同じカードを選べば増殖しないが、その追加出現例を蓄積する機能はない。任意値の省略対nullは元入力の完全一致とみなさないため、候補から明示再利用する。

UUIDやsource_cardの編集は慎重に行う。検証スキーマはデータの言語的な正しさを保証しない。個人のstudy、設定、復元内容をカタログへ混ぜない。
