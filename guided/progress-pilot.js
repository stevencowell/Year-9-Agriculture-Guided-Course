(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const course = window.COURSE_DATA;
  if (!course || course.shortTitle !== "Year 9 Agriculture") return;

  const endpoint = "https://script.google.com/a/macros/education.nsw.gov.au/s/AKfycbwaQfMWd0kxB8dDXcG4JlUxphKSpQ-1qWurLqIAB6okVu_qZ_5zEyFGIDo9truAEHZqiQ/exec";
  const pilot = "steve-only-year9ag-v1";
  const sentKey = `${course.storagePrefix}:progress-pilot:sent:v1`;
  const normalise = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  const loadSent = () => {
    try { return JSON.parse(localStorage.getItem(sentKey) || "{}"); } catch (_) { return {}; }
  };
  const saveSent = (value) => localStorage.setItem(sentKey, JSON.stringify(value));
  const eventId = () => `Y9AG-STEVE-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  function steveIdentityPresent(root) {
    const name = normalise(root.querySelector('[name="student-name"]')?.value);
    const studentClass = normalise(root.querySelector('[name="student-class"]')?.value);
    return name === "steve cowell" && studentClass === "yr 9 ag";
  }

  function progressPercent(root) {
    const required = [...new Set([...root.querySelectorAll("[data-required]")].map((field) => field.name))];
    if (!required.length) return 0;
    const complete = required.filter((name) => {
      const fields = [...root.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      return fields.some((field) => field.type === "radio" ? field.checked : String(field.value || "").trim());
    }).length;
    return Math.round((complete / required.length) * 100);
  }

  async function sendSummary(root, eventType, moduleNumber, section, progress) {
    // This device-local match prevents ordinary students from attempting a write.
    // The private receiver remains authoritative and verifies Steve's exact school Google account.
    if (!steveIdentityPresent(root)) return;
    const signature = [eventType, moduleNumber, section, eventType === "folio-response-persisted" ? progress : "once"].join(":");
    const sent = loadSent();
    if (sent[signature]) return;
    const id = eventId();
    const payload = {
      course: course.shortTitle,
      eventId: id,
      eventType,
      module: moduleNumber,
      pilot,
      progress,
      section,
      timestamp: new Date().toISOString()
    };
    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload)
      });
      sent[signature] = id;
      saveSent(sent);
    } catch (_) {
      // Keep the existing local course experience intact; a failed private receiver write is retried on a later action.
    }
  }

  function bindModule() {
    const root = document.querySelector("[data-module-host]");
    if (!root) return;
    const moduleNumber = Math.max(1, Math.min(19, Number(params.get("module")) || 1));

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-check-button]");
      if (!button) return;
      const group = button.closest(".check-group");
      if (!group) return;
      const currentCheck = button.closest(".check");
      const hasCheckedResponse = Boolean(currentCheck?.querySelector('input[type="radio"]:checked'))
        && Boolean(currentCheck?.querySelector(".feedback")?.textContent.trim());
      if (!hasCheckedResponse) return;
      const checks = [...group.querySelectorAll(".check")];
      const completed = checks.length === 10 && checks.every((check) =>
        Boolean(check.querySelector('input[type="radio"]:checked')) && Boolean(check.querySelector(".feedback")?.textContent.trim())
      );
      const theoryIndex = Number(group.id.split("-").pop()) + 1;
      const section = `knowledge-check-${theoryIndex}`;
      if (completed) void sendSummary(root, "knowledge-check-completed", moduleNumber, section, progressPercent(root));
      else void sendSummary(root, "theory-section-in-progress", moduleNumber, section, progressPercent(root));
    });

    root.querySelector('[name="module-complete"]')?.addEventListener("change", (event) => {
      if (event.target.checked) void sendSummary(root, "module-completed", moduleNumber, "module-completed", 100);
    });

    const restoredGroup = [...root.querySelectorAll(".check-group")].find((group) =>
      Boolean(group.querySelector('input[type="radio"]:checked'))
    );
    if (restoredGroup) {
      const theoryIndex = Number(restoredGroup.id.split("-").pop()) + 1;
      void sendSummary(root, "theory-section-in-progress", moduleNumber, `knowledge-check-${theoryIndex}`, progressPercent(root));
    }
  }

  function bindFolio() {
    const root = document.querySelector("[data-folio]");
    if (!root) return;
    const timers = new WeakMap();
    const schedule = (field) => {
      const card = field.closest(".folio-card");
      if (!card) return;
      clearTimeout(timers.get(card));
      timers.set(card, setTimeout(() => {
        const hasPersistedResponse = [...card.querySelectorAll('textarea[data-save]')].some((item) => String(item.value || "").trim())
          || Boolean(card.querySelector('input[type="checkbox"][data-save]:checked'));
        if (!hasPersistedResponse) return;
        const cardNumber = Number(card.id.replace("folio-card-", ""));
        const moduleNumber = Math.max(1, Math.min(19, Number(card.dataset.module) || 1));
        void sendSummary(root, "folio-response-persisted", moduleNumber, `folio-card-${cardNumber}`, progressPercent(card));
      }, 1200));
    };
    root.addEventListener("input", (event) => { if (event.target.matches("[data-save]")) schedule(event.target); });
    root.addEventListener("change", (event) => { if (event.target.matches("[data-save]")) schedule(event.target); });
  }

  bindModule();
  bindFolio();
})();
