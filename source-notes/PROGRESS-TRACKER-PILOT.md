# Year 9 Agriculture progress-tracker pilot

Status: Steve-only live integration test

## Live boundary

- The sender runs only when a module or folio URL contains `progress-pilot=steve-test`.
- It also requires the existing device-local fields to match `Steve Cowell` and `yr 9 Ag` exactly after normalisation.
- There is no separate save or submit button.
- Only three existing meaningful actions can create summary events:
  - completion of all ten checked questions in one theory group;
  - a locally persisted folio-card response or ready-state change, debounced and de-duplicated by card progress;
  - the existing module-completion checkbox changing to checked.
- The payload contains only course, module, section, progress percentage, timestamp, event type and a random event ID.
- Names, class, answers, folio text, photos, screenshots, browsing activity and keystrokes are not transmitted.
- The private receiver derives the test identity server-side as `Steve Cowell / yr 9 Ag`, accepts only the exact allow-listed school Google account and stores every accepted row as test-only.
- Existing module `localStorage`, folio `localStorage` and photo `IndexedDB` behaviour remains unchanged.
- Ordinary student URLs without the deliberate query parameter do not initialise the sender.

## Reversal

Remove `guided/progress-pilot.js`, its references in `module.html` and `folio.html`, and the private receiver deployment update. Existing local course evidence remains intact.

## Before any real-student pilot

School approval is still required for identity/consent, retention/deletion, authorised teachers, support responsibilities and the final authenticated student-write design. The Steve-only receiver must not be broadened as a shortcut.
