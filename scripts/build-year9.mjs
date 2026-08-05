import fs from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const workRoot = path.resolve(repo, "..");
const taskRoot = path.resolve(workRoot, "..");
const plan = JSON.parse(fs.readFileSync(path.join(workRoot, "authoring-plan.json"), "utf8"));
const parentAuthored = JSON.parse(fs.readFileSync(path.join(workRoot, "authored-sections.json"), "utf8"));
const childPath = path.resolve(taskRoot, "..", "task-17d-agriculture-beef-poultry-theory", "outputs", "TASK-17D-BEEF-POULTRY-AUTHORED-SECTIONS.json");
const childAuthored = fs.existsSync(childPath) ? JSON.parse(fs.readFileSync(childPath, "utf8")) : [];
const authored = [...parentAuthored, ...childAuthored];

const normalise = (value) => String(value || "").replace(/\s+/g, " ").trim();
const authoredByTitle = new Map(authored.map((item) => [normalise(item.title), item]));
const strip = (html) => normalise(String(html || "").replace(/<\/?(?:p|strong|ul|li)>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
const theoryParts = (html) => {
  const parts = [...String(html || "").matchAll(/<(?:p|li)>([\s\S]*?)<\/(?:p|li)>/g)].map((match) => strip(match[1])).filter(Boolean);
  return parts.length >= 3 ? parts : [strip(html)];
};
const takeaways = (section) => section.facts.slice(0, 3).map(normalise);
const rotateOptions = (question, seed) => {
  const options = [...question.options];
  const shift = seed % options.length;
  const sourceAnswer = question.answer ?? question.answerIndex;
  return { ...question, question: question.question || question.prompt, options: options.slice(shift).concat(options.slice(0, shift)), answerIndex: (Number(sourceAnswer) - shift + options.length) % options.length };
};

const videoManifestPath = path.join(repo, "source-notes", "YOUTUBE-LEARNING-MANIFEST.json");
const videoManifest = fs.existsSync(videoManifestPath) ? JSON.parse(fs.readFileSync(videoManifestPath, "utf8")) : { clips: [] };
const videoSectionMap = {
  fqgrSSz7Htw: "Cultural knowledge and Australian agriculture",
  vQdcVursGG4: "Farm WHS: hazards, controls and shared responsibility",
  jtuX7H05tmQ: "Water uptake and transport in plants",
  Bn9ul9lxIdg: "Soil texture, structure and plant growth",
  eZ5kK94BEoo: "Understanding soil pH",
  SVNNJf_28KE: "How the ruminant digestive system works",
  TyTbozEH2fA: "Traceability in cattle enterprises",
  "yD-84PNMulI": "Reading cattle-yard features for safety",
  n3BW6m1HyII: "The chicken digestive system",
  PedajVADLGw: "Embryonic development and incubation evidence",
  FSuP6HcAFHA: "Biosecurity pathways in poultry systems"
};
const busyWorkMap = [
  "farm-hazard-audit", "climate-evidence", "commodity-chain", "systems-comparison", "problems-and-labels",
  "plant-function", "water-and-flowers", "soil-evidence", "soil-evidence", "drought-and-knowledge",
  "yard-diagram", "ruminant-route", "husbandry-and-welfare", "traceability", "beef-margin",
  "chicken-digestion", "poultry-nutrition-reproduction", "embryo-timeline", "poultry-evaluation"
];

const modules = plan.modules.map((module) => {
  const sections = module.sections.map((section, sectionIndex) => {
    const authoredSection = authoredByTitle.get(normalise(section.title));
    if (!authoredSection) throw new Error(`Missing browser-authored section: ${section.title}`);
    const videos = videoManifest.clips.filter((clip) => videoSectionMap[clip.videoId] === section.title);
    const planGuidance = section.title === "Reading cattle-yard features for safety" ? {
      heading: "Read handling diagrams without inventing a construction plan",
      paragraphs: [
        "The authorised source contains flight-zone and point-of-balance diagrams plus a checklist for yard, crush and loading-ramp features. Identify the source type, title, labels, arrows and represented relationships before interpreting it.",
        "These diagrams support cattle-movement and safety reasoning. They do not supply a scale, school-yard layout, dimensions, capacity or construction specification."
      ],
      takeaways: [
        "Distinguish a handling diagram from a dimensioned construction plan.",
        "Use labels and arrows as evidence; do not infer unshown measurements.",
        "Refer local access, animal movement and facility action to the teacher."
      ],
      boundary: "The original Drive document remains unchanged and authoritative. No current school-farm site plan or cattle-yard construction plan was supplied.",
      sheets: [{
        title: "Cattle Yard Safety and Infrastructure",
        open: "https://docs.google.com/document/d/1Q1mucNYKCjfft_PT4FW7UpsYj60yF5fo/edit",
        alt: "Authorised cattle-yard handling diagrams and facility checklist document",
        caption: "Handling diagrams and safety checklist; not a construction plan.",
        sourceUrl: "https://docs.google.com/document/d/1Q1mucNYKCjfft_PT4FW7UpsYj60yF5fo/edit"
      }]
    } : undefined;
    return {
      id: `${module.id}.${sectionIndex + 1}`,
      title: section.title,
      theory: theoryParts(authoredSection.theoryHtml),
      takeaways: takeaways(section),
      boundary: "Use the 2026 school programme and teacher directions for local practical work. Current figures, product requirements and external claims need a dated authoritative source; unsupported local details remain Teacher to confirm.",
      sources: [
        { label: `${module.topics[0]} and ${module.topics[1]} — 2026 authorised course materials`, url: "https://drive.google.com/drive/folders/10mHDdI_CtR1BJ5OiUB0ZM4x-bK5646Wj" }
      ],
      verificationNote: "The 2019 AG5 outcome mapping controls 2026 delivery unless early adoption of the 2024 syllabus is formally confirmed.",
      visual: {
        image: `assets/theory/term-${module.term}-learning-map.svg`,
        alt: `Term ${module.term} Agriculture learning map supporting ${section.title}`,
        caption: `Term ${module.term} source-grounded learning map. Labels show the four taught ideas only; the adjacent theory controls their meaning.`
      },
      videos,
      planGuidance
    };
  });
  const checks = module.sections.flatMap((section, theoryIndex) => {
    const authoredSection = authoredByTitle.get(normalise(section.title));
    return authoredSection.questions.map((question, questionIndex) => {
      const shuffled = rotateOptions(question, module.id + theoryIndex + questionIndex);
      return {
        theoryIndex,
        question: normalise(shuffled.question),
        options: shuffled.options.map(normalise),
        answerIndex: shuffled.answerIndex,
        correctFeedback: normalise(shuffled.feedback),
        incorrectFeedback: `${normalise(shuffled.hint)} Revisit the named theory section, then try again.`,
        hint: normalise(shuffled.hint),
        source: `${module.topics.join("; ")} — 2026 course materials`
      };
    });
  });
  const written = module.sections.map((section, theoryIndex) => {
    const authoredSection = authoredByTitle.get(normalise(section.title));
    return {
      theoryIndex,
      title: `${section.title} — written evidence`,
      prompt: normalise(authoredSection.writtenPrompt),
      clarification: normalise(authoredSection.sentenceStarter),
      model: normalise(authoredSection.appropriateResponseExample).replace(/^Appropriate response example:\s*/i, ""),
      observationPrompt: normalise(authoredSection.observationPrompt),
      source: `${module.topics.join("; ")} — 2026 course materials`
    };
  });
  return {
    project: "Year 9 Agriculture",
    projectModule: module.id,
    cadence: `Term ${module.term} · Weeks ${module.weeks}`,
    title: module.title,
    summary: `Learn ${module.topics[0]} and ${module.topics[1]}, then apply the ideas through knowledge checks and written evidence.`,
    outcomes: module.outcomes,
    busyWorkId: busyWorkMap[module.id - 1],
    sections,
    checks,
    written
  };
});

const data = {
  shortTitle: "Year 9 Agriculture",
  fileSlug: "year-9-agriculture",
  storagePrefix: "year-9-agriculture",
  syllabus: "Agricultural Technology 7–10 Syllabus (2019)",
  modules
};
fs.writeFileSync(path.join(repo, "guided", "data.js"), `window.COURSE_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");

const bank = {
  authoredVia: "Signed-in ChatGPT in the in-app browser, one named theory section at a time",
  sections: modules.flatMap((module) => module.sections.map((section, theoryIndex) => ({
    id: section.id,
    title: section.title,
    questions: module.checks.filter((check) => check.theoryIndex === theoryIndex)
  })))
};
fs.writeFileSync(path.join(repo, "source-notes", "QUESTION-BANK.json"), `${JSON.stringify(bank, null, 2)}\n`, "utf8");
console.log(`Built ${modules.length} modules, ${bank.sections.length} sections and ${modules.flatMap((module) => module.checks).length} checks.`);
