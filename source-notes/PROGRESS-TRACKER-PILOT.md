# Year 9 Agriculture progress-tracker pilot

Status: Steve-only normal-URL live integration

## Live boundary

- The sender is available on normal module and folio URLs but requires the existing device-local fields to match `Steve Cowell` and `yr 9 Ag` exactly after normalisation before it attempts a write.
- The static Pages site does not claim to authenticate Google identity. The private Apps Script receiver is authoritative: it verifies the active account is exactly `steven.cowell@education.nsw.gov.au` before accepting or parsing a progress event.
- There is no separate save or submit button.
- Only four meaningful course states/actions can create summary events:
  - a persisted knowledge-check response restored on the page, or the first answered item checked in a theory section, recorded as `theory-section-in-progress`;
  - completion of all ten checked questions in one theory group;
  - a locally persisted folio-card response or ready-state change, debounced and de-duplicated by card progress;
  - the existing module-completion checkbox changing to checked.
- The payload contains only course, module, section, progress percentage, timestamp, event type and a random event ID.
- The percentage is the existing module `evidence entered` calculation. It measures completion of required local fields, not answer correctness or mastery.
- Names, class, answers, folio text, photos, screenshots, browsing activity and keystrokes are not transmitted.
- The private receiver derives the test identity server-side as `Steve Cowell / yr 9 Ag`, accepts only the exact allow-listed school Google account and stores every accepted row as test-only.
- Existing module `localStorage`, folio `localStorage` and photo `IndexedDB` behaviour remains unchanged.
- Other device-local names/classes do not attempt a write. A spoofed local Steve label is still rejected server-side unless the browser is authenticated as Steve's exact allow-listed school account.

## Reversal

Remove `guided/progress-pilot.js`, its references in `module.html` and `folio.html`, and the private receiver deployment update. Existing local course evidence remains intact.

## Before any real-student pilot

School approval is still required for identity/consent, retention/deletion, authorised teachers, support responsibilities and the final authenticated student-write design. The Steve-only receiver must not be broadened as a shortcut.
