# Year 9 Agriculture progress-tracker pilot

Status: Action required

## Live pilot boundary

- The ordinary student course experience is unchanged.
- The test panel appears only when a module URL includes `progress-pilot=steve-test`.
- Steve must explicitly confirm that only his deliberate test name and class are present before preparing an event.
- The preview contains only name, class, course, module, section, percentage progress and timestamp.
- The preview reads the existing summary percentage. It does not read or copy answers, screenshots, folio content or browsing activity.
- There is no receiver URL and no network-send code. The event is not persisted by the pilot.
- Existing course `localStorage` and folio `IndexedDB` behaviour is unchanged.

Remove `guided/progress-pilot.js`, `guided/progress-pilot.css`, `teacher-progress-demo.html` and their two references in `module.html` to reverse the course pilot.

## Smallest genuine blocker

A real central tracker requires an authorised server-side storage and authentication path. No such configuration is available in this repository or task workspace.

Minimum authorisation/configuration:

1. nominate the school-approved service and data location;
2. nominate the school owner for the application and records;
3. approve the privacy notice, record purpose, retention and deletion schedule;
4. configure school Google OAuth through an authorised administrator;
5. configure server-side issuer/domain checks and an explicit teacher allow-list;
6. enforce student-write and teacher-read access separately;
7. expose an authenticated HTTPS event endpoint with validation, rate limiting and audit logs;
8. provide development and production origins without placing secrets in GitHub Pages;
9. complete a synthetic-data security test before any real student data is entered.

The teacher dashboard should then be reached from the Industrial Arts Main Page, use one school Google sign-in, and present subject/course cards after authentication. A static password may be used only for a zero-data demonstration and is not an acceptable control for student records.
