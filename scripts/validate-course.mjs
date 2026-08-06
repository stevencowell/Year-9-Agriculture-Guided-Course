import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repo = path.resolve(import.meta.dirname, '..');
const failures = [];
const pass = [];
const requireCheck = (condition, message) => condition ? pass.push(message) : failures.push(message);
const read = (relative) => fs.readFileSync(path.join(repo, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(repo, relative));
const evalWindowData = (relative, key) => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read(relative), context);
  return context.window[key];
};

const requiredFiles = [
  'index.html','module.html','folio.html','assessment.html','plans.html','.nojekyll',
  'teacher-progress-demo.html','guided/course.css','guided/course.js','guided/data.js','guided/progress-pilot.css','guided/progress-pilot.js',
  'busy-work/index.html','busy-work/activity.html','busy-work/data.js','busy-work/busy.js','busy-work/style.css',
  'youtube-library/index.html','youtube-library/library.js','youtube-library/library.css',
  'source-notes/COURSE-CONTRACT.md','source-notes/SOURCE-MAP.md','source-notes/ASSESSMENT-RECONCILIATION.md',
  'source-notes/BUSY-WORK-ACTIVITY-PLAN.md','source-notes/YOUTUBE-LEARNING-MANIFEST.json','source-notes/VISUAL-MANIFEST.json',
  'source-notes/VISUAL-SEMANTIC-AUDIT.md','source-notes/QUESTION-BANK.json','source-notes/RELEASE-LEDGER.md',
  'assets/agriculture-hero.svg',...Array.from({length:4},(_,i)=>`assets/theory/term-${i+1}-learning-map.svg`),
  ...Array.from({length:12},(_,i)=>`assets/visuals/folio-card-${String(i+1).padStart(2,'0')}.svg`)
];
requiredFiles.forEach((file) => requireCheck(exists(file), `Required file exists: ${file}`));

if (exists('guided/data.js')) {
  const course = evalWindowData('guided/data.js','COURSE_DATA');
  requireCheck(course?.shortTitle === 'Year 9 Agriculture','Course identity is Year 9 Agriculture');
  requireCheck(course?.modules?.length === 19,'Course has 19 modules');
  const sections = course?.modules?.flatMap((module)=>module.sections) || [];
  const checks = course?.modules?.flatMap((module)=>module.checks) || [];
  requireCheck(sections.length === 57,'Course has 57 named theory sections');
  requireCheck(checks.length === 570,'Course has 570 student-learning MCQs');
  course?.modules?.forEach((module,moduleIndex) => {
    requireCheck(module.sections.length === 3,`Module ${moduleIndex+1} has three named theory sections`);
    requireCheck(module.written.length === 3,`Module ${moduleIndex+1} has three written-evidence tasks`);
    module.sections.forEach((section,sectionIndex) => {
      const sectionChecks = module.checks.filter((check)=>check.theoryIndex===sectionIndex);
      requireCheck(sectionChecks.length === 10,`Module ${moduleIndex+1}, section ${sectionIndex+1} has exactly 10 MCQs`);
      requireCheck(section.theory.join(' ').split(/\s+/).length >= 180,`Module ${moduleIndex+1}, section ${sectionIndex+1} has substantial theory`);
      requireCheck(section.visual?.image?.endsWith(`term-${Math.ceil((moduleIndex+1)/5)}-learning-map.svg`) || Boolean(section.visual?.image),`Module ${moduleIndex+1}, section ${sectionIndex+1} has a visual`);
    });
    module.checks.forEach((check,checkIndex) => {
      requireCheck(check.options.length === 4,`Module ${moduleIndex+1}, question ${checkIndex+1} has four options`);
      requireCheck(Number.isInteger(check.answerIndex) && check.answerIndex >= 0 && check.answerIndex < 4,`Module ${moduleIndex+1}, question ${checkIndex+1} answer index is valid`);
      requireCheck(Boolean(check.hint && check.correctFeedback && check.incorrectFeedback),`Module ${moduleIndex+1}, question ${checkIndex+1} has hint and feedback`);
      requireCheck(!/(?:AG5-\d+|outcome code|assessment schedule|teacher name|folder|file name|programme label|weighting|due week)/i.test([check.question,...check.options].join(' ')),`Module ${moduleIndex+1}, question ${checkIndex+1} tests student learning only`);
    });
  });
}

if (exists('busy-work/data.js')) {
  const activities = evalWindowData('busy-work/data.js','BUSY_WORK_DATA');
  requireCheck(activities.length === 21,'Busy Work has 21 authentic activities');
  requireCheck(new Set(activities.map((activity)=>activity.mechanic)).size >= 8,'Busy Work uses at least eight mechanic families');
  requireCheck(activities.every((activity)=>activity.tasks.length === 3),'Every Busy Work activity has three answerable tasks');
  requireCheck([1,2,3,4].every((term)=>activities.filter((activity)=>activity.term===term).length>=5),'Busy Work has at least five activities per term');
  requireCheck(activities.every((activity)=>!/(?:AG5-\d+|outcome code|assessment weighting|due week|teacher name|folder name|file name)/i.test(JSON.stringify(activity.tasks))),'Busy Work tests taught content rather than curriculum or administration metadata');
}

if (exists('source-notes/YOUTUBE-LEARNING-MANIFEST.json')) {
  const manifest = JSON.parse(read('source-notes/YOUTUBE-LEARNING-MANIFEST.json'));
  requireCheck(manifest.clips.length === 11,'YouTube library has 11 validated clips');
  requireCheck(new Set(manifest.clips.map((clip)=>clip.videoId)).size === 11,'YouTube video IDs are unique');
  requireCheck(manifest.clips.every((clip)=>clip.watchFor && clip.rationale && clip.fallback && clip.disclaimer && clip.sourceCheck),'Every YouTube clip has purpose, fallback and boundary metadata');
}

const folio = read('folio.html');
requireCheck((folio.match(/class="card folio-card"/g)||[]).length === 12,'Folio has 12 evidence cards');
requireCheck((folio.match(/data-visual="assets\/visuals\/folio-card-/g)||[]).length === 12,'Folio has 12 visual routes');
requireCheck(/Download backup/.test(folio) && /Restore backup/.test(folio) && /Print \/ Save PDF/.test(folio),'Folio exposes backup, restore and print');
requireCheck(/Teacher to confirm/.test(folio),'Folio exposes teacher-confirmation boundaries');

const allTextFiles = [];
const walk = (directory) => fs.readdirSync(directory,{withFileTypes:true}).forEach((entry)=>{
  if (entry.name === '.git' || entry.name === 'node_modules') return;
  const full = path.join(directory,entry.name);
  if (entry.isDirectory()) walk(full);
  else if (/\.(?:html|css|js|mjs|json|md|csv)$/i.test(entry.name)) allTextFiles.push(full);
});
walk(repo);
const joined = allTextFiles.map((file)=>fs.readFileSync(file,'utf8')).join('\n');
const staleMarkers = ['Year ' + '8 Agriculture','year-' + '8-agriculture','Stage ' + '4 Technology guided course'];
requireCheck(!staleMarkers.some((marker)=>joined.toLowerCase().includes(marker.toLowerCase())),'No stale Year 8 course content remains in text files');
const mojibakeLeads = [String.fromCharCode(0xe2), String.fromCharCode(0xc2)];
requireCheck(!mojibakeLeads.some((lead)=>joined.includes(lead)),'No mojibake markers remain');
requireCheck(/youtube-nocookie\.com/.test(read('youtube-library/library.js')),'YouTube playback uses privacy-enhanced embeds');
requireCheck(/localStorage/.test(read('guided/course.js')) && /indexedDB/.test(read('guided/course.js')),'Course evidence uses device-local text and durable image storage');
requireCheck(/localStorage/.test(read('busy-work/busy.js')),'Busy Work autosaves on device');
const progressPilot = read('guided/progress-pilot.js');
requireCheck(!/progress-pilot=steve-test/.test(progressPilot) && /steveIdentityPresent/.test(progressPilot),'Normal course URLs use the Steve-only local convenience gate');
requireCheck(/mode:\s*"no-cors"/.test(progressPilot) && /credentials:\s*"include"/.test(progressPilot),'Progress pilot uses the private credentialed background receiver path');
requireCheck(/knowledge-check-completed/.test(progressPilot) && /folio-response-persisted/.test(progressPilot) && /module-completed/.test(progressPilot),'Progress pilot permits only the three approved meaningful event types');
requireCheck(!/(?:studentName|studentClass|answer|responseText|screenshot|browsing)\s*:/.test(progressPilot),'Progress pilot payload code excludes identity, answers, screenshots and browsing fields');
requireCheck(/progress-pilot\.js\?v=20260806c/.test(read('folio.html')),'Folio loads the Steve-only automatic summary sender');
requireCheck(/Static password deliberately not implemented/.test(read('teacher-progress-demo.html')),'Teacher dashboard shell states the static-password security boundary');
requireCheck(!/teacher-progress-demo\.html/.test(read('module.html')),'Teacher dashboard is absent from student module navigation');

const report = {passed:failures.length===0,checks:pass.length+failures.length,passedChecks:pass.length,failures};
const output = path.resolve(repo,'..','..','outputs');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'validation-report.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Validation passed: ${report.passedChecks} checks, 19 modules, 57 sections, 570 MCQs, 12 folio cards, 21 Busy Work activities and 11 videos.`);
