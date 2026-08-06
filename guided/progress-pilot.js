(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  if (params.get("progress-pilot") !== "steve-test") return;

  const course = window.COURSE_DATA;
  const moduleHost = document.querySelector("[data-module-host]");
  const progressPanel = moduleHost?.querySelector(".progress-panel");
  if (!course || !moduleHost || !progressPanel) return;

  const moduleNumber = Math.max(1, Math.min(course.modules.length, Number(params.get("module")) || 1));
  const pilot = document.createElement("section");
  pilot.className = "card progress-pilot";
  pilot.setAttribute("aria-labelledby", "progress-pilot-title");
  pilot.innerHTML = `
    <p class="eyebrow">Reversible live pilot</p>
    <h2 id="progress-pilot-title">Steve's summary progress event preview</h2>
    <p>This test tool prepares one summary event from the progress already shown on this page. It does not collect answers, screenshots or browsing activity.</p>
    <p class="progress-pilot__status"><strong>Central receiver disabled.</strong> No data leaves this browser and nothing is submitted.</p>
    <label class="progress-pilot__confirm"><input type="checkbox" data-pilot-confirm> <span>I am Steve and I am using only my deliberately entered test name and class. I am not entering real student data.</span></label>
    <div class="progress-pilot__actions">
      <button class="btn" type="button" data-pilot-prepare disabled>Prepare test event</button>
      <button class="btn ghost" type="button" data-pilot-copy disabled>Copy event</button>
      <button class="btn ghost" type="button" data-pilot-clear>Clear preview</button>
    </div>
    <textarea class="progress-pilot__output" data-pilot-output readonly aria-label="Prepared local test event" placeholder="No event prepared."></textarea>
    <p class="progress-pilot__message" data-pilot-message aria-live="polite"></p>`;
  progressPanel.insertAdjacentElement("afterend", pilot);

  const confirmBox = pilot.querySelector("[data-pilot-confirm]");
  const prepareButton = pilot.querySelector("[data-pilot-prepare]");
  const copyButton = pilot.querySelector("[data-pilot-copy]");
  const clearButton = pilot.querySelector("[data-pilot-clear]");
  const output = pilot.querySelector("[data-pilot-output]");
  const message = pilot.querySelector("[data-pilot-message]");

  const summaryProgress = () => {
    const requiredNames = [...new Set([...moduleHost.querySelectorAll("[data-required]")].map((field) => field.name))];
    if (!requiredNames.length) return 0;
    const completed = requiredNames.filter((name) => {
      const fields = [...moduleHost.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      return fields.some((field) => field.type === "radio" ? field.checked : String(field.value || "").trim());
    }).length;
    return Math.round((completed / requiredNames.length) * 100);
  };

  confirmBox.addEventListener("change", () => {
    prepareButton.disabled = !confirmBox.checked;
    message.textContent = confirmBox.checked ? "Ready to prepare a local-only summary." : "";
  });

  prepareButton.addEventListener("click", () => {
    const studentName = moduleHost.querySelector('[name="student-name"]')?.value.trim() || "";
    const studentClass = moduleHost.querySelector('[name="student-class"]')?.value.trim() || "";
    if (!studentName || !studentClass) {
      message.textContent = "Enter Steve's test name and class in the existing fields first.";
      return;
    }
    const event = {
      studentName,
      studentClass,
      course: course.shortTitle,
      module: moduleNumber,
      section: "module-summary",
      progress: summaryProgress(),
      timestamp: new Date().toISOString()
    };
    output.value = JSON.stringify(event, null, 2);
    copyButton.disabled = false;
    message.textContent = "Local preview prepared. Central sending remains disabled.";
  });

  copyButton.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "Test event copied. It has not been submitted anywhere.";
    } catch (_) {
      output.focus();
      output.select();
      message.textContent = "Copy was blocked by the browser. The preview is selected for manual copying.";
    }
  });

  clearButton.addEventListener("click", () => {
    output.value = "";
    copyButton.disabled = true;
    message.textContent = "Preview cleared. Existing course autosave has not been changed.";
  });
})();
