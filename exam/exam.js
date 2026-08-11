(()=>{
  "use strict";
  const config=window.EXAM_CONFIG;
  if(!config) throw new Error("EXAM_CONFIG is required.");
  const PASSWORD="8142";
  const storageKey=`wwhs-agriculture-test:${config.id}:v1`;
  const unlockKey=`wwhs-agriculture-unlocked:${config.id}`;
  const gate=document.getElementById("passwordGate");
  const page=document.getElementById("examPage");
  const gateForm=document.getElementById("gateForm");
  const gateInput=document.getElementById("gatePassword");
  const gateError=document.getElementById("gateError");
  const form=document.getElementById("examForm");
  const host=document.getElementById("examSections");
  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
  const totalQuestions=config.sections.reduce((sum,section)=>sum+section.questions.length,0);
  const totalMarks=config.sections.reduce((sum,section)=>sum+section.questions.reduce((subtotal,q)=>subtotal+Number(q.marks||0),0),0);

  document.title=`${config.course} | ${config.title}`;
  const metadata={courseName:config.course,examTitle:config.title,examSubtitle:config.subtitle,metaStage:config.stage,metaTime:config.time,metaMarks:`${totalMarks} marks`,metaStatus:config.status,metaTask:config.taskLabel,metaDate:config.scheduledDate,metaOutcomes:config.outcomes,examDirections:config.directions,pdfFilename:config.pdfFilename};
  Object.entries(metadata).forEach(([id,value])=>{document.getElementById(id).textContent=value;});
  document.getElementById("backLink").href=config.backHref||"../assessment.html";

  let number=0;
  host.innerHTML=config.sections.map(section=>{
    const sectionMarks=section.questions.reduce((sum,q)=>sum+Number(q.marks||0),0);
    const questions=section.questions.map(question=>{
      number+=1;
      const name=`q${number}`;
      const title=`<div class="question-title"><span class="question-number">${number}</span><span class="question-prompt">${escapeHtml(question.prompt)}</span><span class="question-marks">[${question.marks} mark${question.marks===1?"":"s"}]</span></div>`;
      if(question.kind==="choice"){
        const options=question.options.map((option,index)=>{const letter=String.fromCharCode(65+index);return `<label class="option"><input data-answer type="radio" name="${name}" value="${escapeHtml(`${letter} — ${option}`)}"><span><strong>${letter}.</strong> ${escapeHtml(option)}</span></label>`;}).join("");
        return `<article class="question">${title}<div class="options">${options}</div><div class="print-answer" data-print-answer="${name}">Selected answer: Not answered</div></article>`;
      }
      return `<article class="question">${title}<div class="response"><textarea data-answer name="${name}" rows="${question.kind==="long"?9:5}" aria-label="Response to question ${number}" placeholder="Type your response here"></textarea>${question.hint?`<p class="hint">${escapeHtml(question.hint)}</p>`:""}</div></article>`;
    }).join("");
    return `<section class="card"><div class="section-heading"><div><p class="kicker" style="color:var(--brand)">${escapeHtml(section.label)}</p><h2>${escapeHtml(section.title)}</h2></div><p>${sectionMarks} marks</p></div>${section.instructions?`<p>${escapeHtml(section.instructions)}</p>`:""}${questions}</section>`;
  }).join("");

  const fields=[...form.querySelectorAll("[data-answer],[data-student]")];
  const readState=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{return {};}};
  const collectState=()=>{const state={};fields.forEach(field=>{if(field.type==="radio"){if(field.checked)state[field.name]=field.value;}else state[field.name]=field.value;});return state;};
  const restoreState=()=>{const state=readState();fields.forEach(field=>{if(!(field.name in state))return;if(field.type==="radio")field.checked=field.value===state[field.name];else field.value=state[field.name];});};
  const answered=name=>{const group=form.querySelectorAll(`[name="${name}"]`);if(!group.length)return false;return group[0].type==="radio"?[...group].some(field=>field.checked):group[0].value.trim().length>0;};
  const updateProgress=()=>{let count=0;for(let i=1;i<=totalQuestions;i+=1)if(answered(`q${i}`))count+=1;document.getElementById("progressFill").style.width=`${totalQuestions?Math.round(count/totalQuestions*100):0}%`;document.getElementById("progressLabel").textContent=`${count} of ${totalQuestions} questions answered`;};
  const saveState=()=>{localStorage.setItem(storageKey,JSON.stringify(collectState()));document.getElementById("saveStatus").textContent=`Saved on this device at ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`;updateProgress();};
  let timer;
  const scheduleSave=()=>{clearTimeout(timer);timer=setTimeout(saveState,180);};
  const preparePrint=()=>{saveState();form.querySelectorAll("textarea").forEach(area=>{area.style.height="auto";area.style.height=`${Math.max(area.scrollHeight+4,90)}px`;});for(let i=1;i<=totalQuestions;i+=1){const output=form.querySelector(`[data-print-answer="q${i}"]`);if(!output)continue;const selected=form.querySelector(`input[name="q${i}"]:checked`);output.textContent=`Selected answer: ${selected?selected.value:"Not answered"}`;}};

  gateForm.addEventListener("submit",event=>{event.preventDefault();if(gateInput.value.trim()!==PASSWORD){gateError.textContent="That password is not correct. Check it with your teacher.";gateInput.select();return;}sessionStorage.setItem(unlockKey,"yes");gate.hidden=true;page.hidden=false;gateInput.value="";document.getElementById("studentName").focus();});
  document.getElementById("saveBtn").addEventListener("click",saveState);
  document.getElementById("printBtn").addEventListener("click",()=>{preparePrint();window.print();});
  document.getElementById("lockBtn").addEventListener("click",()=>{saveState();sessionStorage.removeItem(unlockKey);page.hidden=true;gate.hidden=false;gateInput.focus();});
  document.getElementById("clearBtn").addEventListener("click",()=>{if(!confirm("Clear all student details and responses saved for this test on this device?"))return;localStorage.removeItem(storageKey);form.reset();document.getElementById("saveStatus").textContent="Saved responses cleared.";updateProgress();});
  fields.forEach(field=>{field.addEventListener("input",scheduleSave);field.addEventListener("change",scheduleSave);});
  window.addEventListener("beforeprint",preparePrint);
  restoreState();updateProgress();
  if(sessionStorage.getItem(unlockKey)==="yes"){gate.hidden=true;page.hidden=false;}else{gate.hidden=false;page.hidden=true;setTimeout(()=>gateInput.focus(),50);}
})();
