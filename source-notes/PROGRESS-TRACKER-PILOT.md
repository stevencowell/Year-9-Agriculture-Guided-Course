# Year 9 Agriculture progress-tracker pilot

Status: authorised controlled pilot release

## Controlled student proof

- The only student event is completion of Module 11 knowledge check 1, **The beef enterprise as a production system**.
- The event contains only course ID, activity ID, module, event type, score out of 10, timestamp, source version and an idempotent random event ID.
- The shared source version is the immutable pilot release ID `Y9AG-SPT-PILOT-20260811-V1`; the deployed Git commit is recorded separately in the release evidence.
- The event does not contain a typed name, class, Student Code, answers, folio text, photos or summative marks.
- The student opens the Department-only Apps Script identity check. Google Workspace controls sign-in.
- The backend derives the active Department email with `Session.getActiveUser()` and matches it against a private roster held only in the restricted tracker.
- A local “identity check opened” flag is only a usability prompt. It is never trusted as identity proof.
- The receiver accepts only the immutable pilot release ID and exact pilot activity.
- A pending event stays in device-local storage and is retried with the same event ID. The page does not claim receipt because the cross-origin request cannot safely read the Apps Script response; the teacher dashboard is authoritative.

## DRS and reporting boundary

- Pilot destination: Semester 2 DRS 1 — **Describes agriculture as an array of interactive systems.**
- Exact Sentral field: `OVERALL GRADE FOR DRS 1(1)`.
- A–E thresholds remain `Teacher to confirm`. The dashboard must not invent a grade rule.
- Teacher review/override is mandatory before the one-row CSV can be generated.
- Summative project and folio work remains separate and is submitted through Google Classroom.

## Deployment boundary

- Apps Script deployment version 8 is limited to `Anyone within NSW Dept of Education` and continues to execute as Steve's Department account.
- Steve explicitly approved this Department-only receiver deployment and publication of the matching website candidate on 11 August 2026.
- The private roster remains empty until Steve selects and authorises the one pilot student.
- Live Sentral import remains a separate later approval gate.
