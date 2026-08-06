(() => {
  "use strict";

  // Keep teacher audit, provenance and unresolved-source notes out of student routes.
  // The verified source record remains available in Teacher Resources.
  document.querySelectorAll("[data-outcomes]").forEach((element) => element.removeAttribute("data-outcomes"));
  const studentOnlyPatterns = [
    /^(confirmed outcomes|authority and unresolved details|source boundary|drawing boundary|direct-observation boundary)/i,
    /teacher to confirm/i,
    /google classroom.*(code|placeholder|submission)/i,
    /known inconsistencies are preserved/i,
    /sources do not confirm/i
  ];
  document.querySelectorAll(".callout, .evidence-note, p, li, h2, h3, strong").forEach((element) => {
    const text = element.textContent.replace(/\s+/g, " ").trim();
    if (studentOnlyPatterns.some((pattern) => pattern.test(text))) element.remove();
  });
})();
