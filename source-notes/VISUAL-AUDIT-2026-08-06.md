# Year 9 Agriculture visual-quality audit

## Result: fail corrected locally

The original release met a file-count check but failed the intended visual standard. Its course hero, four term visuals and twelve folio visuals were all accessible flat-vector SVGs. That made the course look like a generic template rather than a credible Agricultural Technology site.

## Corrective update

Four new, source-safe contextual photographs have been added:

| Coverage | Asset | Purpose | Boundary |
| --- | --- | --- | --- |
| Course landing and Term 1 | `assets/photography/year9-agriculture-hero-v2.png` | Connects the four enterprises without presenting a local farm map. | Contextual only; local practice is teacher-directed. |
| Term 2 | `assets/photography/vegetable-production-context.png` | Supports observation of beds, soil, mulch and irrigation context. | Does not establish local crop, product, rate or procedure. |
| Term 3 | `assets/photography/beef-production-context.png` | Establishes a safe, distant beef-production setting. | Does not authorise animal handling or depict the school enterprise. |
| Term 4 | `assets/photography/poultry-production-context.png` | Establishes a calm poultry-enterprise context. | Local welfare, biosecurity and handling remain teacher-controlled. |

The module renderer now applies the relevant term photograph to every named theory section, with an accurate caption and a visible larger-view route. Existing folio diagrams remain as evidence organisers, rather than trying to carry the course's visual identity.

## Full-site audit register

| Area | Original result | Decision |
| --- | --- | --- |
| Landing page | Fail — generic illustrated hero dominated first impression. | Replaced with a wide contextual photograph and clear source boundary. |
| 57 theory sections | Fail — four vector maps repeated as the sole teaching visual. | Replaced at render time with the matching term photograph; each keeps a precise caption, alt text and larger view. |
| 12 folio cards | Pass with a limitation — the vectors are useful as evidence organisers, but not strong enough to represent the course alone. | Retained for task clarity; the new landing and theory imagery now carries the site's real-world visual identity. |
| Busy Work | Pass — interactive mechanics are the primary learning visual and do not rely on generic illustrations. | No decorative image added; activity-specific images should be added only where they help the mechanic. |
| Plans and diagrams | Conditional — only authorised source material may be used as a plan. | No fabricated farm/site plan added. The separate Plans page keeps its teacher/source boundaries. |
| YouTube library | Pass — videos provide project-specific moving visual context with direct fallbacks. | Retained; not used as a substitute for teaching visuals or source documents. |

## Coverage and quality checks

- 57 named theory sections receive a term-relevant photographic teaching visual.
- Landing page has a wide photographic hero, not a vector illustration.
- Every new image is a generated contextual illustration with no text, logo, unsafe practice, unverified local claim or technical instruction.
- The existing vectors are retained only where they organise folio evidence; they are no longer the dominant visual language.

## Remaining release checks

- Inspect landing, one module from each term and the folio at desktop and 390 px.
- Confirm all four new assets resolve, enlarge correctly and create no overflow.
- Run the existing course validator and diff checks before any publication decision.
