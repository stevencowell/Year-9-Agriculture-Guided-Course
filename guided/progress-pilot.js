(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const course = window.COURSE_DATA;
  if (!course || course.shortTitle !== "Year 9 Agriculture") return;

  const endpoint = "https://script.google.com/a/macros/education.nsw.gov.au/s/AKfycbwaQfMWd0kxB8dDXcG4JlUxphKSpQ-1qWurLqIAB6okVu_qZ_5zEyFGIDo9truAEHZqiQ/exec";
  const courseId = "Y9AG-2026";
  const sourceVersion = "Y9AG-SPT-PILOT-20260811-V1";
  const activityId = "module-11-knowledge-check-1";
  const connectedKey = `${course.storagePrefix}:progress-pilot:school-check:v2`;
  const pendingKey = `${course.storagePrefix}:progress-pilot:pending:v2`;
  const eventId = () => `Y9AG-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  function loadPending() {
    try { return JSON.parse(localStorage.getItem(pendingKey) || "null"); } catch (_) { return null; }
  }

  function savePending(value) {
    localStorage.setItem(pendingKey, JSON.stringify(value));
  }

  function setStatus(message, state = "") {
    const status = document.querySelector("[data-school-progress-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function addIdentityPanel(root) {
    const progressPanel = root.querySelector(".progress-panel");
    if (!progressPanel || root.querySelector("[data-school-progress]")) return;
    const panel = document.createElement("section");
    panel.className = "card progress-pilot";
    panel.dataset.schoolProgress = "";
    panel.innerHTML = `
      <p class="eyebrow">Controlled school progress pilot</p>
      <h2>Connect your Department school account</h2>
      <p>This one-activity pilot records only your verified school identity, the Module 11 knowledge-check score, the time and the course version. It does not send your answers, typed name, folio work, photos or Student Code.</p>
      <div class="progress-pilot__actions">
        <a class="btn" data-school-progress-connect target="_blank" rel="noopener" href="${endpoint}?mode=student-check">Open school identity check</a>
      </div>
      <p class="progress-pilot__status" data-school-progress-status aria-live="polite">Open the school identity check before completing Module 11 knowledge check 1.</p>`;
    progressPanel.insertAdjacentElement("afterend", panel);
    panel.querySelector("[data-school-progress-connect]").addEventListener("click", () => {
      localStorage.setItem(connectedKey, new Date().toISOString());
      setStatus("School identity check opened. The private tracker will still verify the signed-in Department account and roster when evidence is received.", "ready");
    });
    if (localStorage.getItem(connectedKey)) {
      setStatus("School identity check has been opened on this device. Complete Module 11 knowledge check 1; the tracker will verify the account and roster server-side.", "ready");
    }
    const pending = loadPending();
    if (pending) setStatus("Evidence is queued or awaiting teacher-side receipt confirmation. It will retry safely with the same event ID.", "pending");
  }

  async function transmit(payload) {
    const pending = { payload, attemptedAt: new Date().toISOString() };
    savePending(pending);
    setStatus("Sending minimal evidence to the private school tracker…", "pending");
    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload)
      });
      savePending({ payload, attemptedAt: new Date().toISOString() });
      setStatus("Evidence sent for school-side verification. Your teacher dashboard confirms whether it was received; this page does not claim success without that check.", "pending");
    } catch (_) {
      setStatus("Evidence remains queued on this device and will retry. Tell your teacher if the dashboard does not show a fresh receipt.", "error");
    }
  }

  function retryPending() {
    const pending = loadPending();
    if (!pending?.payload || !localStorage.getItem(connectedKey)) return;
    const lastAttempt = new Date(pending.attemptedAt || 0).getTime();
    if (Date.now() - lastAttempt >= 5 * 60 * 1000) void transmit(pending.payload);
  }

  function bindModule() {
    const root = document.querySelector("[data-module-host]");
    if (!root) return;
    const moduleNumber = Math.max(1, Math.min(19, Number(params.get("module")) || 1));
    if (moduleNumber !== 11) return;
    addIdentityPanel(root);
    retryPending();

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-check-button]");
      if (!button || !localStorage.getItem(connectedKey)) return;
      const group = button.closest(".check-group");
      if (!group) return;
      const theoryIndex = Number(group.id.split("-").pop()) + 1;
      if (theoryIndex !== 1) return;
      const checks = [...group.querySelectorAll(".check")];
      const completed = checks.length === 10 && checks.every((check) =>
        Boolean(check.querySelector('input[type="radio"]:checked')) && Boolean(check.querySelector(".feedback")?.textContent.trim())
      );
      if (!completed || loadPending()) return;
      const score = checks.filter((check) => check.querySelector(".feedback.good")).length;
      void transmit({
        activityId,
        courseId,
        eventId: eventId(),
        eventType: "knowledge-check-completed",
        module: 11,
        possible: 10,
        score,
        sourceVersion,
        timestamp: new Date().toISOString()
      });
    });
  }

  bindModule();
})();
