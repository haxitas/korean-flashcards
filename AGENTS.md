# Project rules
Buildless HTML/CSS/JavaScript ES modules. The app lives in docs/ and GitHub Pages serves main:/docs. Management scripts live in tools/. No Firebase, cloud sync, paid APIs or new external dependencies.

Keep Card/Deck UUIDs fixed across updates; Entry IDs are deck_id__card_id. Keep distinct senses separate. Use tools/catalog.mjs for validated imports and explicit candidate choices. Never place personal study state, backups, private transcripts, credentials, local machine paths or conversation logs in the repository.

User-authorized extracted vocabulary, translations and short labelled examples from a supplied video transcript may be published with its source title/URL. The complete transcript remains excluded. Do not claim to have heard audio that was not checked; record ambiguous transcription in warnings and mark corrected/reconstructed examples as generated. Use safe HTTP(S) source links and preserve video-specific Entry.source_card.

Learning state is browser-local. Preserve it by UUID. Backup restore requires full validation and explicit confirmation; restored content remains protected until the user explicitly chooses the current catalogue. Do not silently delete old local data.

Run node tools/run-tests.mjs and node tools/catalog.mjs validate --catalog docs/data/catalog.json. Browser tests: /tests/run-tests.html. Report untested device/audio checks honestly. Future content changes should be reviewable PRs; merging and Pages deployment are separate from PR creation.
