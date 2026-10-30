const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let names = [
 {name:"Anna Schmidt",initials:"AS",group:"Nest",hours:25,vacation:32,special:0,meetings:0,supervision:0,color:"green",employment:"Teilzeit"},
 {name:"Lisa Hoffmann",initials:"LH",group:"Nest",hours:30,vacation:32,special:0,meetings:0,supervision:0,color:"yellow",employment:"Teilzeit"},
 {name:"Julia Weber",initials:"JW",group:"Nest",hours:39,vacation:32,special:0,meetings:0,supervision:0,color:"blue",employment:"Vollzeit"},
 {name:"Sarah Jansen",initials:"SJ",group:"Sonnengruppe",hours:20,vacation:32,special:0,meetings:0,supervision:0,color:"green",employment:"Teilzeit"},
 {name:"Tina Reinhardt",initials:"TR",group:"Sonnengruppe",hours:30,vacation:32,special:0,meetings:0,supervision:0,color:"purple",employment:"Teilzeit"},
 {name:"Markus Klein",initials:"MK",group:"Sonnengruppe",hours:39,vacation:32,special:0,meetings:0,supervision:0,color:"blue",employment:"Vollzeit"},
 {name:"Katharina Wolf",initials:"KW",group:"Sonnengruppe",hours:30,vacation:32,special:0,meetings:0,supervision:0,color:"yellow",employment:"Teilzeit"},
 {name:"Barbara Fischer",initials:"BF",group:"Sternengruppe",hours:25,vacation:32,special:0,meetings:0,supervision:0,color:"yellow",employment:"Teilzeit"},
 {name:"Nina Schulte",initials:"NS",group:"Sternengruppe",hours:30,vacation:32,special:0,meetings:0,supervision:0,color:"green",employment:"Teilzeit"},
 {name:"Tobias Neumann",initials:"TN",group:"Sternengruppe",hours:39,vacation:32,special:0,meetings:0,supervision:0,color:"blue",employment:"Vollzeit"},
 {name:"Michael Berger",initials:"MB",group:"Sternengruppe",hours:39,vacation:32,special:0,meetings:0,supervision:0,color:"purple",employment:"Vollzeit"}
];
const groups = ["Nest","Sonnengruppe","Sternengruppe"];
let leaderProfile={name:"",phone:"",group:"Nest",weeklyHours:39,officeHours:30,groupHours:9,blocks:[]};
function planningPeople(){const pool=names.slice();if(leaderProfile.name&&leaderProfile.groupHours>0)pool.push({name:leaderProfile.name,initials:leaderProfile.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(),group:leaderProfile.group,hours:Number(leaderProfile.groupHours),vacation:0,color:"purple",employment:"Leitung",blocks:leaderProfile.blocks||[],isLeader:true});return pool;}
const weekdays = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const plannerSettings = {frame:{start:"07:00",end:"16:00"},minimumByGroup:{"Nest":2,"Sonnengruppe":2,"Sternengruppe":2},minimumEarlyByGroup:{"Nest":1,"Sonnengruppe":1,"Sternengruppe":1},minimumLateByGroup:{"Nest":1,"Sonnengruppe":1,"Sternengruppe":1},mergeEarlyGroups:false,mergeLateGroups:false,minimumEarlyCombined:2,minimumLateCombined:2};

const SUPABASE_URL = "https://pcwcghbzksopfyrgzyht.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OznU91iPtKK2nsjTJA2q6Q_LuxXyzUB";
const cloud = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
let cloudReady = false, cloudUser = null, saveTimer = null, cloudUpdatedAt = null, cloudSaveInFlight = false;
function cloudSnapshot(){return {version:1,baseMonday:iso(baseMonday),names,groups,plannerSettings,leaderProfile,events,absences,shifts,weekOffset,selectedGroup};}
function applyCloudSnapshot(s){
 if(!s||typeof s!=="object")return;
 if(Array.isArray(s.names))names=s.names;
 if(s.leaderProfile&&typeof s.leaderProfile==="object")leaderProfile={...leaderProfile,...s.leaderProfile};
 if(Array.isArray(s.groups))groups.splice(0,groups.length,...s.groups);
 if(s.plannerSettings&&typeof s.plannerSettings==="object"){plannerSettings.frame={...plannerSettings.frame,...(s.plannerSettings.frame||{})};plannerSettings.minimumByGroup={...plannerSettings.minimumByGroup,...(s.plannerSettings.minimumByGroup||{})};plannerSettings.minimumEarlyByGroup={...plannerSettings.minimumEarlyByGroup,...(s.plannerSettings.minimumEarlyByGroup||{})};plannerSettings.minimumLateByGroup={...plannerSettings.minimumLateByGroup,...(s.plannerSettings.minimumLateByGroup||{})};plannerSettings.mergeEarlyGroups=!!s.plannerSettings.mergeEarlyGroups;plannerSettings.mergeLateGroups=!!s.plannerSettings.mergeLateGroups;plannerSettings.minimumEarlyCombined=Number(s.plannerSettings.minimumEarlyCombined??plannerSettings.minimumEarlyCombined);plannerSettings.minimumLateCombined=Number(s.plannerSettings.minimumLateCombined??plannerSettings.minimumLateCombined);}
 if(Array.isArray(s.events))events=s.events;
 if(Array.isArray(s.absences))absences=s.absences;
 if(Array.isArray(s.shifts))shifts=s.shifts;
 if(Number.isInteger(s.weekOffset))weekOffset=s.weekOffset;
 if(s.baseMonday){const saved=new Date(s.baseMonday+"T12:00:00");if(!Number.isNaN(saved.getTime())){const elapsed=Math.round((baseMonday-saved)/604800000);if(elapsed){shifts=shifts.map(x=>({...x,weekOffset:(x.weekOffset??0)-elapsed}));weekOffset-=elapsed;}}}
 if(typeof s.selectedGroup==="string")selectedGroup=s.selectedGroup;
}
function showCloudLogin(message="Bitte mit deinem Leitungszugang anmelden."){
 let layer=document.getElementById("cloudLogin");
 if(!layer){layer=document.createElement("div");layer.id="cloudLogin";layer.style.cssText="position:fixed;inset:0;z-index:99999;background:#f4f7fb;display:grid;place-items:center;padding:22px;font-family:inherit";
 layer.innerHTML='<form id="cloudLoginForm" style="background:white;width:min(100%,420px);padding:28px;border-radius:18px;box-shadow:0 12px 40px #1c35501c"><div style="font-size:28px;font-weight:750;color:#19304b;margin-bottom:8px">Früh bis spät</div><p style="color:#66758a;margin:0 0 22px">Geschützter Leitungszugang</p><label style="display:block;font-weight:600;margin:12px 0 6px">E-Mail-Adresse</label><input name="email" type="email" autocomplete="username" required style="box-sizing:border-box;width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit"><label style="display:block;font-weight:600;margin:14px 0 6px">Passwort</label><input name="password" type="password" autocomplete="current-password" required style="box-sizing:border-box;width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit"><p id="cloudLoginMessage" style="color:#64748b;font-size:14px;min-height:20px"></p><button type="submit" style="width:100%;padding:14px;border:0;border-radius:10px;background:#1d6b54;color:white;font:inherit;font-weight:700">Anmelden</button></form>';
 document.body.appendChild(layer);
 layer.querySelector("#cloudLoginForm").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector("button"),msg=form.querySelector("#cloudLoginMessage");button.disabled=true;button.textContent="Anmeldung läuft …";msg.textContent="";const fd=new FormData(form);const {data,error}=await cloud.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});button.disabled=false;button.textContent="Anmelden";if(error){msg.textContent="Anmeldung fehlgeschlagen: "+error.message;return}await loadCloudData(data.user);});
 }
 layer.querySelector("#cloudLoginMessage").textContent=message;
}
function initials(value){const parts=String(value||"").trim().split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:(parts[0]||"?").slice(0,2)).toUpperCase()}
function leaderInitials(){const full=(leaderProfile.name||cloudUser?.user_metadata?.full_name||"").trim();if(full){const parts=full.split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:parts[0].slice(0,2)).toUpperCase()}const local=(cloudUser?.email||"").split("@")[0]||"L";return local.slice(0,2).toUpperCase()}
function updateProfileHeader(){const avatar=document.getElementById("profileAvatar"),label=document.querySelector(".profile-name"),sideAvatar=document.getElementById("sidebarAvatar"),sideName=document.getElementById("sidebarUserName"),full=leaderProfile.name||cloudUser?.user_metadata?.full_name||"Leitung";if(avatar)avatar.textContent=leaderInitials();if(label)label.textContent=full;if(sideAvatar)sideAvatar.textContent=leaderInitials();if(sideName)sideName.textContent=full}
function addCloudLogout(){const right=document.querySelector(".topbar-right");if(!right)return;updateProfileHeader();const avatar=document.getElementById("profileAvatar"),sideProfile=document.getElementById("sidebarProfile"),sideLogout=document.getElementById("sidebarLogout");if(sideProfile&&!sideProfile.dataset.bound){sideProfile.dataset.bound="true";sideProfile.addEventListener("click",()=>navigate("leitungsprofil"))}if(sideLogout&&!sideLogout.dataset.bound){sideLogout.dataset.bound="true";sideLogout.addEventListener("click",async()=>{await cloud.auth.signOut();cloudReady=false;cloudUser=null;showCloudLogin("Du wurdest abgemeldet.")})}if(avatar&&!avatar.dataset.bound){avatar.dataset.bound="true";avatar.addEventListener("click",()=>navigate("leitungsprofil"));avatar.title="Leitungsprofil öffnen";avatar.setAttribute("aria-label","Leitungsprofil öffnen");}if(document.getElementById("cloudLogout"))return;const b=document.createElement("button");b.id="cloudLogout";b.type="button";b.textContent="Abmelden";b.className="btn small";b.style.marginLeft="10px";b.addEventListener("click",async()=>{await cloud.auth.signOut();cloudReady=false;cloudUser=null;showCloudLogin("Du wurdest abgemeldet.")});right.appendChild(b);}
async function loadCloudData(user){
 cloudReady=false;cloudUser=user;
 const owner=await cloud.from("app_owner").select("user_id").limit(1);
 if(owner.error||!owner.data?.length){showCloudError("Dieser Zugang ist nicht als Leitung freigeschaltet. Bitte die Supabase-Berechtigungen prüfen.");await cloud.auth.signOut();return;}
 const result=await cloud.from("app_state").select("state,updated_at").eq("id",1).maybeSingle();
 if(result.error){showCloudError("Die gespeicherten Daten konnten nicht geladen werden. "+result.error.message);return;}
 if(result.data?.state)applyCloudSnapshot(result.data.state);cloudUpdatedAt=result.data?.updated_at||null;
 cloudReady=true;document.getElementById("cloudLogin")?.remove();addCloudLogout();render();const status=document.getElementById("cloudSaveStatus");if(status)status.textContent="Gespeichert";
 if(!result.data)await saveCloudState();
}
function showCloudError(message){console.error("Cloud-Fehler:",message);window.alert("Es ist ein Fehler aufgetreten:\n\n"+message);}
async function saveCloudState(){
 if(!cloudReady||!cloudUser)return false;
 if(cloudSaveInFlight){clearTimeout(saveTimer);saveTimer=setTimeout(saveCloudState,800);return false;}
 cloudSaveInFlight=true;
 try{
  const nextTimestamp=new Date().toISOString(),payload={state:cloudSnapshot(),updated_at:nextTimestamp};
  let result;
  if(cloudUpdatedAt){
   result=await cloud.from("app_state").update(payload).eq("id",1).eq("updated_at",cloudUpdatedAt).select("updated_at").maybeSingle();
   if(!result.error&&!result.data){showCloudError("Speicherkonflikt: Der Datenbestand wurde zwischenzeitlich von einer anderen Sitzung geändert. Bitte Seite neu laden und Änderungen vergleichen. Deine lokalen Änderungen wurden nicht überschrieben.");return false;}
  }else{
   result=await cloud.from("app_state").insert({id:1,...payload}).select("updated_at").maybeSingle();
   if(result.error&&String(result.error.code)==="23505"){showCloudError("Speicherkonflikt beim erstmaligen Speichern. Bitte Seite neu laden.");return false;}
  }
  if(result.error){showCloudError("Die Änderungen konnten nicht gespeichert werden. "+result.error.message);return false;}
  cloudUpdatedAt=result.data?.updated_at||nextTimestamp;
  const status=document.getElementById("cloudSaveStatus");if(status)status.textContent="Gespeichert";
  return true;
 }finally{cloudSaveInFlight=false;}
}
function scheduleCloudSave(){if(!cloudReady)return;const status=document.getElementById("cloudSaveStatus");if(status)status.textContent="Ungespeicherte Änderungen";clearTimeout(saveTimer);saveTimer=setTimeout(saveCloudState,500);}
async function startCloudApp(){
 if(!window.supabase){showCloudError("Die Datenbankbibliothek konnte nicht geladen werden. Bitte Seite neu laden.");showCloudLogin();return;}
 showCloudLogin();const {data,error}=await cloud.auth.getSession();
 if(error){showCloudError("Die Verbindung zur Datenbank ist fehlgeschlagen. "+error.message);return;}
 if(data.session)await loadCloudData(data.session.user);
 cloud.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){cloudReady=false;cloudUser=null;showCloudLogin("Du wurdest abgemeldet.");}});
}

const pageTitles = {dashboard:"Dashboard",dienstplan:"Dienstplan",kalender:"Kalender",mitarbeitende:"Mitarbeitende",abwesenheiten:"Urlaub & Abwesenheit",sondertermine:"Sondertermine",teammeetings:"Teammeetings",supervision:"Supervision",fortbildungen:"Fortbildungen",auswertungen:"Auswertungen",einstellungen:"Einstellungen",leitungsprofil:"Leitungsprofil"};
let currentPage = "dashboard";
let weekOffset = 0;
let selectedGroup = "Alle Gruppen";
let events = [];
let absences = [];
let shifts = [];
const baseMonday = (()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d})();
function dateForDay(day, offset=weekOffset){const d=new Date(baseMonday);d.setDate(d.getDate()+offset*7+day);return d}
function fmt(d,opts={day:"2-digit",month:"2-digit"}){return new Intl.DateTimeFormat("de-DE",opts).format(d)}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function weekLabel(){return "Mo. "+fmt(dateForDay(0))+" – So. "+fmt(dateForDay(6))+" "+dateForDay(6).getFullYear()}
function initShifts(){ /* Neue Dienstpläne starten leer. */ }
function weekShifts(offset=weekOffset){return shifts.filter(s=>(s.weekOffset??0)===offset)}
function weekLabelForOffset(offset){return "Mo. "+fmt(dateForDay(0,offset))+" – So. "+fmt(dateForDay(6,offset))+" "+dateForDay(6,offset).getFullYear()}
function coverageRequirement(day,time,group){
 const early=time>=420&&time<480,late=time>=900&&time<960,core=time>=480&&time<900;
 if(early&&plannerSettings.mergeEarlyGroups)return {scope:"combined",required:Number(plannerSettings.minimumEarlyCombined)||0,weight:2.5,label:"Frühdienst gemeinsam"};
 if(late&&plannerSettings.mergeLateGroups)return {scope:"combined",required:Number(plannerSettings.minimumLateCombined)||0,weight:2.5,label:"Spätdienst gemeinsam"};
 if(early)return {scope:"group",required:Number(plannerSettings.minimumEarlyByGroup[group])||0,weight:2.5,label:"Frühdienst"};
 if(late)return {scope:"group",required:Number(plannerSettings.minimumLateByGroup[group])||0,weight:2.5,label:"Spätdienst"};
 if(core)return {scope:"group",required:Number(plannerSettings.minimumByGroup[group])||0,weight:2,label:"Kernzeit"};
 return {scope:"none",required:0,weight:0,label:""};
}
function shiftPause(s){
 const span=minutes(s.end)-minutes(s.start);
 if(span<=390)return null;
 const start=minutes(s.start)+240;
 return {start,end:Math.min(start+30,minutes(s.end))};
}
function shiftWorkMinutes(s){
 const span=minutes(s.end)-minutes(s.start),pause=shiftPause(s);
 return Math.max(0,span-(pause?30:0));
}
function shiftCoversTime(s,time){
 const pause=shiftPause(s);
 return minutes(s.start)<=time&&minutes(s.end)>time&&!(pause&&time>=pause.start&&time<pause.end);
}
function countCoverage(assigned,day,time,group,scope){
 return assigned.filter(x=>x.day===day&&shiftCoversTime(x,time)&&(scope==="combined"||x.group===group)).length;
}
function scoreShiftCoverage(assigned,person,day,start,end){
 let score=0;
 for(let time=420;time<960;time+=15){
  if(time<start||time>=end)continue;
  const pause=(end-start)>390?{start:start+240,end:start+270}:null;if(pause&&time>=pause.start&&time<pause.end)continue;
  const demand=coverageRequirement(day,time,person.group);
  if(!demand.required)continue;
  const count=countCoverage(assigned,day,time,person.group,demand.scope);
  if(count<demand.required)score+=demand.weight*(1+(demand.required-count)*0.25);
  else score-=0.08;
 }
 return score;
}
function inspectCoverage(assigned){
 const gaps=[];
 for(let day=0;day<5;day++)for(let time=420;time<960;time+=15){
  const checked=new Set();
  for(const group of groups){
   const demand=coverageRequirement(day,time,group);
   if(!demand.required)continue;
   const key=demand.scope==="combined"?"combined:"+demand.label:"group:"+group+":"+demand.label;
   if(checked.has(key))continue;checked.add(key);
   const count=countCoverage(assigned,day,time,group,demand.scope);
   if(count<demand.required)gaps.push({day,time,group:demand.scope==="combined"?"Gruppen gemeinsam":group,label:demand.label,count,required:demand.required});
  }
 }
 return gaps;
}
function generateWeekPlan(){
 if(!names.length){alert("Lege zuerst Mitarbeitende mit Stammgruppe und Wochenstunden an.");navigate("mitarbeitende");return}
 const existing=weekShifts();if(existing.length&&!confirm("Diese Woche enthält bereits "+existing.length+" Dienste. Diese werden ersetzt. Fortfahren?"))return;
 const people=planningPeople(),frameStart=minutes(plannerSettings.frame.start),frameEnd=minutes(plannerSettings.frame.end);
 if(frameEnd<=frameStart){alert("Die allgemeine Rahmenzeit ist ungültig.");return}
 const created=[],unavailable=[],totals=[];
 const ordered=people.map((person,index)=>({person,index})).sort((a,b)=>{
  const aGroup=people.filter(p=>p.group===a.person.group).length,bGroup=people.filter(p=>p.group===b.person.group).length;
  return aGroup-bGroup||Number(b.person.hours||0)-Number(a.person.hours||0);
 });
 const tm=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
 for(const {person:p,index} of ordered){
  const target=Math.round((Math.max(0,Number(p.hours)||0))*4)/4;
  if(!target)continue;
  let assigned=0;
  const availableDays=Array.from({length:5},(_,day)=>day).filter(day=>!blockingAbsence(p,day,weekOffset)).length;
  const dailyTarget=availableDays?Math.round(target/availableDays*4)/4:0;
  for(let day=0;day<5;day++){
   const absence=blockingAbsence(p,day,weekOffset);
   if(absence){unavailable.push(p.name+" · "+weekdays[day]+" (Abwesenheit: "+absence.type+")");continue}
   let remaining=Math.min(dailyTarget,target-assigned),guard=0;
   while(remaining>=0.25&&guard++<40){
    const candidates=[];
    for(let duration=Math.min(Math.floor(remaining*4)*15,frameEnd-frameStart);duration>=15;duration-=15){
     const breakMinutes=duration>360?30:0,span=duration+breakMinutes;
     for(let start=frameStart;start+span<=frameEnd;start+=15){
      const from=tm(start),to=tm(start+span);
      if(isBlocked(p,day,from,to,weekOffset)||personHasEventConflict(p,day,from,to,weekOffset))continue;
      if(created.some(x=>x.person===p.name&&x.day===day&&minutes(from)<minutes(x.end)&&minutes(to)>minutes(x.start)))continue;
      const coverage=scoreShiftCoverage(created,p,day,start,start+span);
      const fairness=assigned/Math.max(1,target);
      candidates.push({start:from,end:to,duration:span,workDuration:duration,score:coverage-duration/60*0.03-fairness*0.01});
     }
     if(candidates.length)break;
    }
    if(!candidates.length)break;
    candidates.sort((x,y)=>y.score-x.score||minutes(x.start)-minutes(y.start));
    const slot=candidates[0];
    created.push({id:"s"+Date.now()+"-"+index+"-"+day+"-"+created.length+"-"+Math.random().toString(36).slice(2,6),person:p.name,group:p.group,serviceType:"Normaler Dienst",day,start:slot.start,end:slot.end,color:p.group==="Nest"?"green":p.group==="Sonnengruppe"?"blue":p.group==="Sternengruppe"?"purple":"yellow",weekOffset,generated:true});
    const hours=slot.workDuration/60;assigned+=hours;remaining-=hours;
   }
   if(remaining>=0.25)unavailable.push(p.name+" · "+weekdays[day]+" ("+remaining.toFixed(2).replace(".",",")+" Std. wegen Rahmenzeit oder Dienstsperren nicht unterzubringen)");
  }
  totals.push({name:p.name,target,assigned});
 }
 const validation=weeklyPlanningDiagnostics(weekOffset,created),gaps=validation.gaps,groupedGaps=new Map();
 gaps.forEach(g=>{const key=g.group+" · "+weekdays[g.day]+" "+g.label;const old=groupedGaps.get(key);if(!old||g.count<old.count)groupedGaps.set(key,g)});
 const summary=[...groupedGaps.entries()].map(([label,g])=>label+" ("+g.count+"/"+g.required+")");
 const hourSummary=validation.hourRows.filter(x=>x.diff<-.01).map(x=>x.name+": "+Math.max(0,-x.diff).toFixed(2).replace(".",",")+" Std. offen");
 const hardIssues=validation.absenceConflicts.length+validation.blockConflicts.length+validation.overlaps.length;
 if(hardIssues){alert("Plan wurde nicht übernommen: Die Vorprüfung hat "+hardIssues+" harte Regelkonflikte gefunden. Bitte prüfe Abwesenheiten, Dienstsperren und Überschneidungen.");return}
 const totalTarget=validation.hourRows.reduce((n,x)=>n+x.target,0),totalAssigned=validation.hourRows.reduce((n,x)=>n+x.actual,0);
 const preview="Vorprüfung des neuen Dienstplans:\\n• "+created.length+" Dienste\\n• "+totalAssigned.toFixed(2).replace(".",",")+" von "+totalTarget.toFixed(2).replace(".",",")+" Sollstunden verteilt\\n• "+gaps.length+" Unterbesetzungsintervalle\\n• "+hourSummary.length+" Personen mit nicht verteilten Stunden"+(summary.length?"\\n\\nBeispiele Unterbesetzung: "+summary.slice(0,5).join("; "):"")+(hourSummary.length?"\\n\\nNicht verteilte Stunden: "+hourSummary.slice(0,5).join("; "):"")+".\\n\\nPlan trotz dieser Hinweise übernehmen?";
 if((gaps.length||hourSummary.length)&&!confirm(preview))return;
 shifts=shifts.filter(s=>(s.weekOffset??0)!==weekOffset);shifts.push(...created);
 scheduleCloudSave();render();
 alert("Bedarfsorientierte Wochenplanung für "+weekLabel()+" erstellt: "+created.length+" Dienste. Geplante Wochenstunden: "+totals.reduce((n,x)=>n+x.assigned,0).toFixed(2).replace(".",",")+" von "+totals.reduce((n,x)=>n+x.target,0).toFixed(2).replace(".",",")+" Sollstunden. "+(hourSummary.length?"Nicht vollständig verteilte Stunden: "+hourSummary.join("; ")+". ":"Alle verfügbaren Sollstunden wurden verplant. ")+(unavailable.length?"Einschränkungen: "+unavailable.slice(0,15).join("; ")+(unavailable.length>15?" …":"")+". ":"")+(summary.length?"Mindestbesetzung noch nicht erreicht: "+summary.slice(0,12).join("; ")+(summary.length>12?" …":"")+". ":"Alle hinterlegten Mindestbesetzungen sind erreicht. ")+"Nicht unterzubringende Stunden werden ausdrücklich ausgewiesen und nicht stillschweigend verworfen.");
}
function copyWeekForward(){const source=weekShifts();if(!source.length){alert("In dieser Woche gibt es keine Dienste zum Kopieren.");return}const targetOffset=weekOffset+1,target=weekShifts(targetOffset);if(target.length&&!confirm("Die Folgewoche enthält bereits "+target.length+" Dienste. Diese werden ersetzt. Fortfahren?"))return;const copied=[],skipped=[];source.forEach((x,i)=>{const person=planningPeople().find(p=>p.name===x.person),absence=person?blockingAbsence(person,x.day,targetOffset):null,blocked=person&&isBlocked(person,x.day,x.start,x.end,targetOffset),overlap=person&&target.some(y=>y.person===x.person&&y.day===x.day&&minutes(x.start)<minutes(y.end)&&minutes(x.end)>minutes(y.start));const eventConflict=person&&personHasEventConflict(person,x.day,x.start,x.end,targetOffset);if(absence||blocked||overlap||eventConflict){skipped.push(x.person+" · "+weekdays[x.day]+" ("+(absence?"Abwesenheit: "+absence.type:blocked?"feste Dienstsperre":eventConflict?"Terminüberschneidung":"Zeitüberschneidung")+")");return}copied.push({...x,id:"s"+Date.now()+"-copy-"+i+"-"+Math.random().toString(36).slice(2,6),weekOffset:targetOffset,generated:false})});shifts=shifts.filter(s=>(s.weekOffset??0)!==targetOffset);shifts.push(...copied);scheduleCloudSave();render();alert(copied.length+" Dienste nach "+weekLabelForOffset(targetOffset)+" kopiert."+ (skipped.length?" Nicht kopiert wegen Abwesenheiten: "+skipped.join("; ")+".":"")+" Öffne mit „Nächste“ die Folgewoche.");}
function minutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function sanitizeHTML(markup){const template=document.createElement("template");template.innerHTML=String(markup??"");template.content.querySelectorAll("script,iframe,object,embed,base,meta").forEach(node=>node.remove());template.content.querySelectorAll("*").forEach(node=>[...node.attributes].forEach(attr=>{const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase();if(name.startsWith("on")||((name==="href"||name==="src"||name==="xlink:href")&&(value.startsWith("javascript:")||value.startsWith("data:text/html")))||(name==="style"&&(value.includes("expression(")||value.includes("javascript:"))))node.removeAttribute(attr.name);}));return template.innerHTML;}
function easterSunday(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(year,month-1,day,12);}
function nrwPublicHolidays(year){const e=easterSunday(year),add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return iso(x);};return new Set([year+"-01-01",year+"-05-01",year+"-10-03",year+"-11-01",year+"-12-25",year+"-12-26",add(e,-2),add(e,1),add(e,39),add(e,50),add(e,60)]);}
function isWorkingDay(date){const d=new Date(date+"T12:00:00");return d.getDay()!==0&&d.getDay()!==6&&!nrwPublicHolidays(d.getFullYear()).has(date);}
function shiftRuleConflicts(person,day,start,end,offset=weekOffset){const issues=[],span=minutes(end)-minutes(start);if(span>600)issues.push("Dienst länger als zehn Stunden");if(span>360&&!shiftPause({start,end}))issues.push("Pause fehlt");const date=dateForDay(day,offset),prev=shifts.filter(x=>x.person===person.name&&x.id!==person.editingShift).map(x=>({...x,date:dateForDay(x.day,x.weekOffset??offset)}));for(const x of prev){const diff=Math.round((date-x.date)/86400000);if(diff===1&&minutes(start)+1440-minutes(x.end)<660)issues.push("Ruhezeit unter elf Stunden");if(diff===-1&&minutes(x.start)+1440-minutes(end)<660)issues.push("Ruhezeit unter elf Stunden");}return issues;}
function personBlocks(person){if(!Array.isArray(person.blocks))person.blocks=[];if(person.isLeader)leaderProfile.blocks=person.blocks;return person.blocks}
function calendarDaysBetween(from,to){if(!from||!to||to<from)return 0;const start=new Date(from+"T12:00:00"),end=new Date(to+"T12:00:00");let count=0;for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const day=iso(d);if(isWorkingDay(day))count++}return count}
function blockingAbsence(person,day,offset=weekOffset){const date=iso(dateForDay(day,offset));return absences.find(a=>a.name===person.name&&a.status!=="Offen"&&date>=a.from&&date<=a.to)||null}
function absenceDays(absence){return absence.type==="Urlaub"?calendarDaysBetween(absence.from,absence.to):(absence.days??calendarDaysBetween(absence.from,absence.to))}
function usedVacation(person){return absences.filter(a=>a.name===person.name&&a.type==="Urlaub"&&a.status!=="Offen").reduce((sum,a)=>sum+absenceDays(a),0)}
function remainingVacation(person){return Math.max(0,Number(person.vacation||0)-usedVacation(person))}

function blockLabel(b){return b.kind==="recurring"?"Wöchentlich · "+weekdays[b.day]+" · "+(b.fullDay?"ganztägig":b.start+"–"+b.end):"Einmalig · "+b.from+(b.to!==b.from?" bis "+b.to:"")+" · "+(b.fullDay?"ganztägig":b.start+"–"+b.end)}
function isBlocked(person,day,start,end,offset=weekOffset){const date=iso(dateForDay(day,offset));return personBlocks(person).some(b=>(b.kind==="recurring"?Number(b.day)===day:date>=b.from&&date<=b.to)&&(b.fullDay||(minutes(start)<minutes(b.end)&&minutes(end)>minutes(b.start))))}
function findAvailableShift(person,day,duration,preferredStart,model,offset=weekOffset){const windowStart=Math.max(minutes(model.start),minutes(plannerSettings.frame.start)),windowEnd=Math.min(minutes(model.end),minutes(plannerSettings.frame.end));if(windowEnd<=windowStart||duration>windowEnd-windowStart)return null;const candidates=[];for(let start=windowStart;start+duration<=windowEnd;start+=15)candidates.push(start);candidates.sort((a,b)=>Math.abs(a-preferredStart)-Math.abs(b-preferredStart));const tm=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.round(n%60)).padStart(2,"0");for(const start of candidates){const end=start+duration;if(!isBlocked(person,day,tm(start),tm(end),offset))return {start:tm(start),end:tm(end)}}return null}
function manageBlocksModal(personName){const person=planningPeople().find(p=>p.name===personName);if(!person)return;openModal("Feste Dienstsperren · "+person.name,`<p class="muted">Diese Zeiten gelten als harte Einschränkung für automatische und manuelle Dienste.</p><div class="block-list">${personBlocks(person).map((b,i)=>`<div class="block-item"><span>${blockLabel(b)}</span><button type="button" class="btn small danger" data-remove-block="${i}" data-block-person="${person.name}">Entfernen</button></div>`).join("")||'<p class="muted">Noch keine Dienstsperren hinterlegt.</p>'}</div><form id="blockForm"><div class="form-grid"><div class="field"><label>Art der Sperre</label><select name="kind"><option value="recurring">Wöchentlich wiederkehrend</option><option value="once">Einmaliger Zeitraum</option></select></div><div class="field"><label>Wochentag</label><select name="day">${weekdays.map((d,i)=>`<option value="${i}">${d}</option>`).join("")}</select></div><div class="field"><label>Von (einmalig)</label><input name="from" type="date" value="${iso(dateForDay(0))}"></div><div class="field"><label>Bis (einmalig)</label><input name="to" type="date" value="${iso(dateForDay(0))}"></div><div class="field"><label>Beginn</label><input name="start" type="time" value="14:00"></div><div class="field"><label>Ende</label><input name="end" type="time" value="16:00"></div><label class="check-option full"><input type="checkbox" name="fullDay"> Ganztägig gesperrt</label></div><div class="modal-actions"><button type="button" class="btn" data-close>Schließen</button><button type="submit" class="btn primary">Sperre hinzufügen</button></div></form>`);$("#blockForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),kind=fd.get("kind"),fullDay=fd.has("fullDay"),start=fd.get("start"),end=fd.get("end");if(!fullDay&&(!start||!end||minutes(end)<=minutes(start))){alert("Bitte eine gültige Sperrzeit eingeben.");return}const b={kind,fullDay,start:fullDay?"00:00":start,end:fullDay?"23:59":end};if(kind==="recurring")b.day=Number(fd.get("day"));else{b.from=fd.get("from");b.to=fd.get("to");if(!b.from||!b.to||b.to<b.from){alert("Bitte den einmaligen Zeitraum prüfen.");return}}personBlocks(person).push(b);if(person.isLeader)leaderProfile.blocks=person.blocks;scheduleCloudSave();manageBlocksModal(person.name)})}
function topPercent(t){return Math.max(0,Math.min(100,(minutes(t)-360)/960*100))}
function heightPercent(a,b){return Math.max(4,(minutes(b)-minutes(a))/960*100)}
function shiftPosition(s){return `top:${topPercent(s.start)}%;height:${heightPercent(s.start,s.end)}%;`}
function groupColor(group){return group==="Nest"?"shift-green":group==="Sonnengruppe"?"shift-blue":group==="Sternengruppe"?"shift-purple":"shift-yellow"}
function shiftClass(s){const type=s.serviceType||"Normaler Dienst";return type==="Meeting"?"service-meeting":type==="Kirchlicher Termin"?"service-church":type==="Supervision"?"service-supervision":type==="Fortbildung"?"service-fortbildung":type==="Sonstiger Termin"?"service-other":"service-normal"}
function uiIcon(name){const icons={"home":"<path d=\"m3 10 9-7 9 7\"/><path d=\"M5 9v11h14V9\"/><path d=\"M9 20v-6h6v6\"/>","calendar":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M16 3v4M8 3v4M3 11h18\"/>","users":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"10\" cy=\"7\" r=\"4\"/><path d=\"M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>","chart":"<path d=\"M3 3v18h18\"/><rect x=\"7\" y=\"11\" width=\"3\" height=\"6\" rx=\"1\"/><rect x=\"13\" y=\"7\" width=\"3\" height=\"10\" rx=\"1\"/><rect x=\"19\" y=\"4\" width=\"2\" height=\"13\" rx=\"1\"/>","settings":"<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z\"/>","lock":"<rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"/>","user":"<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M5 21a7 7 0 0 1 14 0\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>","briefcase":"<rect x=\"3\" y=\"7\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M8 7V4h8v3M3 12h18M10 12v2h4v-2\"/>"};return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(icons[name]||icons.calendar)+'</svg>'}

function weeklyPlanningDiagnostics(offset=weekOffset,plannedOverride=null){
 const people=planningPeople(),planned=plannedOverride||weekShifts(offset),coverageShifts=planned.filter(x=>!x.serviceType||x.serviceType==="Normaler Dienst");
 const gaps=inspectCoverage(coverageShifts),hourRows=people.map(p=>{const target=Math.max(0,Number(p.hours)||0),actual=planned.filter(x=>x.person===p.name).reduce((n,x)=>n+shiftWorkMinutes(x)/60,0);return {name:p.name,target,actual,diff:actual-target}});
 const absenceConflicts=[],blockConflicts=[],overlaps=[],workRuleConflicts=[];
 planned.forEach(x=>{const p=people.find(y=>y.name===x.person);if(!p)return;const absence=blockingAbsence(p,x.day,offset);if(absence)absenceConflicts.push(x.person+" · "+weekdays[x.day]+" · "+absence.type);if(isBlocked(p,x.day,x.start,x.end,offset))blockConflicts.push(x.person+" · "+weekdays[x.day]+" "+x.start+"–"+x.end);const rules=shiftRuleConflicts(p,x.day,x.start,x.end,offset);rules.forEach(rule=>workRuleConflicts.push(x.person+" · "+weekdays[x.day]+" · "+rule));});
 for(let i=0;i<planned.length;i++)for(let j=i+1;j<planned.length;j++){const a=planned[i],b=planned[j];if(a.person===b.person&&a.day===b.day&&minutes(a.start)<minutes(b.end)&&minutes(a.end)>minutes(b.start))overlaps.push(a.person+" · "+weekdays[a.day]+" "+a.start+"–"+a.end+" / "+b.start+"–"+b.end);}
 return {gaps,hourRows,absenceConflicts,blockConflicts,overlaps,workRuleConflicts};
}
function renderPlanningDiagnostics(offset=weekOffset){
 const d=weeklyPlanningDiagnostics(offset),totalGaps=d.gaps.length,under=d.hourRows.filter(x=>x.diff<-.01),over=d.hourRows.filter(x=>x.diff>.01),issues=d.absenceConflicts.length+d.blockConflicts.length+d.overlaps.length+d.workRuleConflicts.length;
 const lines=[];
 if(totalGaps)lines.push('<li><strong>'+totalGaps+' Unterbesetzungsintervalle</strong> in der Mindestbesetzung; Beispiele: '+d.gaps.slice(0,5).map(x=>weekdays[x.day]+' '+String(Math.floor(x.time/60)).padStart(2,"0")+':'+String(x.time%60).padStart(2,"0")+' · '+x.group+' · '+x.label+' '+x.count+'/'+x.required).join('; ')+'</li>');
 else lines.push('<li>Alle eingetragenen Mindestbesetzungen sind in den geprüften Zeitintervallen erreicht.</li>');
 if(under.length)lines.push('<li><strong>Nicht verteilte Sollstunden:</strong> '+under.map(x=>x.name+' '+Math.max(0,-x.diff).toFixed(2).replace(".",",")+' Std.').join('; ')+'</li>');
 if(over.length)lines.push('<li><strong>Über Soll:</strong> '+over.map(x=>x.name+' '+x.diff.toFixed(2).replace(".",",")+' Std.').join('; ')+'</li>');
 if(issues)lines.push('<li><strong>Regelkonflikte:</strong> '+d.absenceConflicts.length+' Abwesenheit, '+d.blockConflicts.length+' feste Sperre(n), '+d.overlaps.length+' Überschneidung(en), '+d.workRuleConflicts.length+' Arbeitszeitregel(n).</li>');
 else lines.push('<li>Keine Konflikte mit Abwesenheiten, festen Sperren oder Doppelbelegungen gefunden.</li>');
 return '<section class="card planning-diagnostics"><div class="card-header"><div><h2>Planprüfung</h2><p>Automatische Kontrolle der Mindestbesetzung, Sollstunden und harten Verfügbarkeitsregeln.</p></div><span class="status-pill '+(totalGaps||under.length||over.length||issues?'status-warning':'status-ok')+'">'+(totalGaps||under.length||over.length||issues?'Prüfung erforderlich':'Keine Auffälligkeiten')+'</span></div><div class="card-body"><ul class="diagnostic-list">'+lines.join("")+'</ul><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Soll</th><th>Geplant</th><th>Abweichung</th></tr></thead><tbody>'+d.hourRows.map(x=>'<tr><td>'+x.name+'</td><td>'+x.target.toFixed(2).replace(".",",")+' h</td><td>'+x.actual.toFixed(2).replace(".",",")+' h</td><td class="'+(Math.abs(x.diff)<.01?'':'status-warning')+'">'+(x.diff>0?'+':'')+x.diff.toFixed(2).replace(".",",")+' h</td></tr>').join("")+'</tbody></table></div></div></section>';
}
function renderCoverageStrip(coverageShifts){
 const periods=[{key:"early",label:"Früh",start:420,end:480,time:"07–08"},{key:"core",label:"Kernzeit",start:480,end:900,time:"08–15"},{key:"late",label:"Spät",start:900,end:960,time:"15–16"}];
 return periods.map(period=>{
  const times=[];for(let t=period.start;t<period.end;t+=15)times.push(t);
  const merged=(period.key==="early"&&plannerSettings.mergeEarlyGroups)||(period.key==="late"&&plannerSettings.mergeLateGroups);
  const minimum=period.key==="core"?plannerSettings.minimumByGroup:period.key==="early"?plannerSettings.minimumEarlyByGroup:plannerSettings.minimumLateByGroup;
  const countAt=(t,g)=>coverageShifts.filter(s=>shiftCoversTime(s,t)&&(merged||s.group===g)).length;
  const entries=merged?[{label:"Gemeinsam",required:Number(period.key==="early"?plannerSettings.minimumEarlyCombined:plannerSettings.minimumLateCombined)||0,count:Math.min(...times.map(t=>countAt(t,groups[0])))}]:groups.map(g=>({label:g,required:Number(minimum[g])||0,count:Math.min(...times.map(t=>countAt(t,g)))}));
  const relevant=entries.filter(x=>x.required>0),deficient=relevant.some(x=>x.count<x.required),exact=relevant.some(x=>x.count===x.required);
  const detail=entries.map(x=>x.label+" "+x.count+"/"+x.required).join(" · ");
  return '<span class="day-coverage '+(deficient?'coverage-low':exact?'coverage-watch':'coverage-ok')+'" title="'+detail+'"><small>'+period.label+'<br>'+period.time+'</small><strong>'+detail+'</strong></span>';
 }).join("");
}
function pageIcon(){return ({dashboard:"home",dienstplan:"calendar",kalender:"calendar",mitarbeitende:"users",abwesenheiten:"calendar",sondertermine:"calendar",teammeetings:"users",supervision:"users",fortbildungen:"briefcase",auswertungen:"chart",einstellungen:"settings",leitungsprofil:"user"})[currentPage]||"home"}
function heading(title,sub,action='<button class="btn primary" data-action="add-event">＋ Eintrag hinzufügen</button>'){return `<div class="page-heading"><div><div class="eyebrow">Früh bis spät · Kita-Planung</div><div class="page-title-line"><span class="page-title-icon">${uiIcon(pageIcon())}</span><div><h1>${title}</h1><p>${sub}</p></div></div></div><div class="actions">${action}</div></div>`}
function card(title,body,extra=""){const key=/Arbeitszeit|Büro|Wochenstunden/.test(title)?"clock":/Zugang|Passwort/.test(title)?"lock":/Personal|Mitarbeitende|Team/.test(title)?"users":/Auswertung|Kennzahl/.test(title)?"chart":/Einstellung|Verwaltung/.test(title)?"settings":/Termin|Kalender/.test(title)?"calendar":"briefcase";return `<section class="card ${extra}"><div class="card-header"><h2><span class="card-title-icon">${uiIcon(key)}</span>${title}</h2></div><div class="card-body">${body}</div></section>`}
function personTable(compact=false){return `<div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Stammgruppe</th><th>Wochenstunden</th><th>Resturlaub</th><th>Sonderdienste</th><th>Teammeetings</th><th>Supervision</th><th>Aktion</th></tr></thead><tbody>${names.length?names.map(p=>`<tr><td><div class="person-cell"><span class="person-avatar">${p.initials}</span><strong>${p.name}</strong></div></td><td>${p.group}</td><td>${p.hours} Std.</td><td><span class="pill green">${remainingVacation(p)} Tage</span></td><td><span class="pill ${p.special>2?'yellow':'blue'}">${p.special}</span></td><td><span class="pill purple">${p.meetings}</span></td><td><span class="pill blue">${p.supervision}</span></td><td><div class="inline-actions"><button class="btn small" data-edit-person="${p.name}">Bearbeiten</button><button class="btn small danger" data-remove-person="${p.name}">Entfernen</button></div></td></tr>`).join(""):'<tr><td colspan="8"><div class="empty-state"><strong>Noch keine Mitarbeitenden angelegt</strong>Über „Mitarbeitende hinzufügen“ kannst du dein Team selbst einrichten.</div></td></tr>'}</tbody></table></div>`}
function dashboard(){
 const currentShifts=weekShifts(),upcomingEvents=events.filter(e=>e.date>=iso(dateForDay(0))).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
 const shiftSummary=currentShifts.length?`<div class="table-wrap"><table><thead><tr><th>Tag</th><th>Mitarbeitende</th><th>Zeit</th><th>Gruppe</th></tr></thead><tbody>${currentShifts.slice().sort((a,b)=>a.day-b.day||minutes(a.start)-minutes(b.start)).slice(0,8).map(s=>`<tr><td>${weekdays[s.day]} · ${fmt(dateForDay(s.day))}</td><td>${s.person}</td><td>${s.start}–${s.end}</td><td>${s.group}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty-state"><strong>Noch keine Dienste geplant</strong>Erstelle deinen Wochenplan oder trage einzelne Dienste ein.</div>';
 const eventSummary=upcomingEvents.length?`<div class="list-stack">${upcomingEvents.map(e=>`<div class="setting-row"><div><strong>${e.title}</strong><small>${fmt(new Date(e.date+"T12:00:00"))} · ${e.type}</small></div><span>${e.time}</span></div>`).join("")}</div>`:'<div class="empty-state"><strong>Keine anstehenden Termine</strong>Termine kannst du gesammelt unter „Sondertermine“ verwalten.</div>';
 return heading("Übersicht","Die wichtigsten Informationen zur aktuellen Planungswoche.",names.length?'<button class="btn primary" data-page="dienstplan">Wochenplan öffnen</button>':'<button class="btn primary" data-page="mitarbeitende">＋ Mitarbeitende anlegen</button>')+
 `<div class="stats"><div class="stat"><div class="stat-label">Mitarbeitende</div><div class="stat-value">${names.length}</div><div class="stat-note">Im Team angelegt</div></div><div class="stat"><div class="stat-label">Dienste diese Woche</div><div class="stat-value">${currentShifts.length}</div><div class="stat-note">${weekLabel()}</div></div><div class="stat"><div class="stat-label">Anstehende Termine</div><div class="stat-value">${upcomingEvents.length}</div><div class="stat-note">In der Übersicht</div></div><div class="stat"><div class="stat-label">Offene Abwesenheiten</div><div class="stat-value">${absences.filter(a=>a.status==="Offen").length}</div><div class="stat-note">Noch zu prüfen</div></div></div>
 <div class="grid dashboard-grid">
 <section class="card"><div class="card-header"><div><h2>Wochenplan</h2><p>${weekLabel()}</p></div><button class="btn small" data-page="dienstplan">Zum Dienstplan →</button></div><div class="card-body">${shiftSummary}</div></section>
 <section class="card"><div class="card-header"><div><h2>Anstehende Termine</h2></div><button class="btn small" data-page="sondertermine">Alle Termine →</button></div><div class="card-body">${eventSummary}</div></section>
 <section class="card full-span"><div class="card-header"><div><h2>Team</h2><p>Kurzübersicht der Mitarbeitenden und ihrer aktuellen Stammdaten.</p></div><button class="btn small" data-page="mitarbeitende">Team verwalten →</button></div><div class="card-body">${personTable(true)}</div></section>
 </div>`;
}
function dutyPage(){
 const people=planningPeople().filter(p=>selectedGroup==="Alle Gruppen"||p.group===selectedGroup), visibleNames=new Set(people.map(p=>p.name)), visibleShifts=weekShifts().filter(s=>visibleNames.has(s.person));
 const days=weekdays.map((day,i)=>{
  const date=dateForDay(i),dayShifts=visibleShifts.filter(s=>s.day===i);
  const staffHeaders=people.map(p=>`<div class="outlook-staff-head ${groupColor(p.group)}"><span class="person-avatar">${p.initials}</span><strong>${p.name}</strong><small>${p.group}</small></div>`).join("");
  const timeAxis=Array.from({length:9},(_,n)=>{const h=6+n*2;return `<span style="top:${n/8*100}%">${String(h).padStart(2,"0")}:00</span>`}).join("");
  const columns=people.map(p=>{
   const personShifts=dayShifts.filter(s=>s.person===p.name);
   const blocks=personShifts.map(s=>{const pause=shiftPause(s),span=minutes(s.end)-minutes(s.start);const pauseMarkup=pause?'<span class="pause-marker" style="top:'+((pause.start-minutes(s.start))/span*100)+'%;height:'+(30/span*100)+'%">Pause · 30 Min.</span>':'';return '<button class="outlook-shift '+shiftClass(s)+'" style="'+shiftPosition(s)+'" data-edit-shift="'+s.id+'" title="'+s.person+': '+s.start+'–'+s.end+(pause?' · Pause 30 Min.':'')+'"><strong>'+s.start+'–'+s.end+'</strong><span>'+(s.serviceType&&s.serviceType!=="Normaler Dienst"?s.serviceType:s.group)+'</span>'+pauseMarkup+'</button>'}).join("");
   return `<div class="outlook-staff-column"><div class="outlook-time-grid"></div>${blocks}</div>`;
  }).join("");
  const coverageShifts=dayShifts.filter(s=>!s.serviceType||s.serviceType==="Normaler Dienst");const cover=renderCoverageStrip(coverageShifts);
  return `<section class="day-calendar"><header class="day-calendar-head"><div><strong>${["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"][i]}, ${fmt(date)}</strong><span>${dayShifts.length} Dienste geplant</span></div><div class="day-coverage-strip" aria-label="Mindestbesetzung im Zeitfenster">${cover}</div></header><div class="outlook-calendar-scroll"><div class="outlook-calendar" style="--staff-count:${Math.max(1,people.length)}"><div class="outlook-corner">Zeit</div>${staffHeaders}<div class="outlook-time-axis">${timeAxis}</div>${columns}</div></div></section>`;
 }).join("");
 return heading("Dienstplan","Wochenkalender wie in Outlook · Mitarbeitende oben, Uhrzeiten links und alle Dienste pro Tag auf einer gemeinsamen Zeitachse.",'<button class="btn" data-action="prev-week">← Vorherige</button><button class="btn" data-action="next-week">Nächste →</button><button class="btn" data-action="copy-week">Woche kopieren →</button><button class="btn" data-action="print-plan">PDF exportieren</button><button class="btn primary" data-action="generate-plan">Diese Woche automatisch planen</button><button class="btn primary" data-action="add-shift">＋ Dienst eintragen</button>')+
 `<section class="card"><div class="card-header"><div><h2>${weekLabel()}</h2><p>Jeder Tag hat eine gemeinsame vertikale Zeitachse von 06:00 bis 22:00 Uhr. Schichten überlappen zeitlich nebeneinander in den Mitarbeiterspalten. Zum Bearbeiten einen Dienst anklicken.</p></div><button class="btn primary save-plan-button" type="button" data-action="save-plan">Jetzt speichern</button></div><div class="schedule-toolbar"><select id="groupFilter" class="select-control" aria-label="Gruppe filtern"><option>Alle Gruppen</option>${groups.map(g=>`<option ${selectedGroup===g?'selected':''}>${g}</option>`).join("")}</select><div class="legend"><span style="--legend:#9adbb9">Normaler Dienst</span><span style="--legend:#b69af7">Meeting</span><span style="--legend:#83b8f7">Supervision</span><span style="--legend:#7cc9c7">Kirche</span><span style="--legend:#f0aa42">Fortbildung</span><span style="--legend:#f19aa5">Sonstiges</span></div></div><div class="day-calendar-list">${days}</div><div class="coverage-legend"><span class="coverage-low-key">0–1 Person</span><span class="coverage-watch-key">2 Personen</span><span class="coverage-ok-key">3+ Personen</span><span class="muted">Besetzungsstreifen je 2 Stunden; Schwellenwerte vorläufig.</span></div></section>${renderPlanningDiagnostics()}
 <div class="grid panel-two section-gap"><section class="card"><div class="card-header"><h2>Wochenstunden im Überblick</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Sollstunden</th><th>Geplante Stunden*</th><th>Status</th></tr></thead><tbody>${people.map(p=>{const total=weekShifts().filter(s=>s.person===p.name).reduce((n,s)=>n+shiftWorkMinutes(s)/60,0);return `<tr><td>${p.name}</td><td>${p.hours} Std.</td><td>${total.toFixed(1)} Std.</td><td><span class="pill ${total>p.hours?'red':total<p.hours?'yellow':'green'}">${total>p.hours?'Über Soll':total<p.hours?'Prüfen':'Passt'}</span></td></tr>`}).join("")}</tbody></table></div><p class="muted" style="font-size:10px">*Pausen ab mehr als 6 Stunden tatsächlicher Arbeitszeit werden automatisch mit 30 Minuten berücksichtigt.</p></div></section><section class="card"><div class="card-header"><h2>Planungsregeln</h2></div><div class="card-body"><div class="setting-row"><div><strong>Zeitraum</strong><small>Montag bis Sonntag</small></div><span class="pill blue">7 Tage</span></div><div class="setting-row"><div><strong>Tagesansicht</strong><small>06:00 bis 22:00 Uhr</small></div><span class="pill green">16 Stunden</span></div><div class="setting-row"><div><strong>Überschneidungen</strong><small>Gemeinsame Zeitachse je Tag</small></div><span class="pill blue">Sichtbar</span></div><div class="setting-row"><div><strong>Gruppenbedarf</strong><small>Über Einstellungen konfigurierbar</small></div><button class="btn small" data-page="einstellungen">Einstellen</button></div></div></section></div>`;
}
function eventOccursOnDate(event,date){if(event.date===date)return true;if(!event.repeatWeekly)return false;const d=new Date(date+"T12:00:00");return d.getDay()===Number(event.repeatDay);}
function personHasEventConflict(person,day,start,end,offset=weekOffset){const date=iso(dateForDay(day,offset));return events.some(ev=>eventOccursOnDate(ev,date)&&(ev.attendees||[]).includes(person.name)&&minutes(start)<minutes(ev.time.split("–")[1])&&minutes(end)>minutes(ev.time.split("–")[0]));}
function calendarPage(){
 const first=new Date(dateForDay(0).getFullYear(),dateForDay(0).getMonth(),1);
 const year=first.getFullYear(),month=first.getMonth(),startDay=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate();
 const cells=Array.from({length:startDay},()=>'<div class="calendar-day blank"></div>');
 for(let day=1;day<=days;day++){const date=iso(new Date(year,month,day));const found=events.filter(e=>eventOccursOnDate(e,date)),dayShifts=shifts.filter(s=>iso(dateForDay(s.day,s.weekOffset??0))===date),dayAbsences=absences.filter(a=>date>=a.from&&date<=a.to);cells.push(`<div class="calendar-day"><strong>${day}</strong>${dayShifts.map(s=>`<div class="calendar-event event-blue">${s.start} ${s.person}</div>`).join("")}${dayAbsences.map(a=>`<div class="calendar-event event-red">${a.name} · ${a.type}</div>`).join("")}${found.map(e=>`<button class="calendar-event ${e.type==='Sonstiger Termin'?'event-red':e.type==='Meeting'?'event-purple':e.type==='Supervision'?'event-blue':e.type==='Kirchlicher Termin'?'event-green':e.type==='Fortbildung'?'event-orange':'event-green'}" data-page="${'sondertermine'}">${e.time.split('–')[0]} ${e.title}</button>`).join("")}</div>`)}
 return heading("Kalender","Alle Dienste, Abwesenheiten, Besprechungen und Sondertermine an einem Ort.",'<button class="btn primary" data-action="add-event">＋ Termin hinzufügen</button>')+`<section class="card"><div class="card-header"><div><h2>${new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"}).format(first)}</h2><p>Termine farblich nach Kategorie sortiert</p></div><div class="actions"><button class="btn small" data-action="prev-week">←</button><button class="btn small" data-action="next-week">→</button></div></div><div class="card-body"><div class="calendar-grid">${["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="calendar-weekday">${d}</div>`).join("")}${cells.join("")}</div><div class="legend" style="margin-top:15px"><span style="--legend:#8bc2ff">Dienst</span><span style="--legend:#a98bf2">Meeting</span><span style="--legend:#6ba9f5">Supervision</span><span style="--legend:#7bc9a0">Kirchlicher Termin</span><span style="--legend:#f38b96">Sonstiger Termin</span><span style="--legend:#f6b7bf">Urlaub</span></div></div></section>`;
}
function employeesPage(){return heading("Mitarbeitende","Stammdaten, Wochenstunden, Stammgruppen und Planungsübersicht.",'<button class="btn primary" data-action="add-person">＋ Mitarbeitende hinzufügen</button>')+`<section class="card"><div class="card-header"><h2>Teamübersicht</h2><span class="pill blue">${names.length} Personen · Beispieldaten</span></div><div class="card-body">${personTable()}</div></section><div class="grid settings-grid section-gap">${groups.map(g=>card(g,`<p class="muted">Stammgruppe und Besetzungsregeln werden in den Einstellungen gepflegt.</p><p><strong>${names.filter(p=>p.group===g).length}</strong> zugeordnete Mitarbeitende</p><button class="btn small" data-page="einstellungen">Gruppenregeln öffnen</button>`)).join("")}</div>`}
function absencesPage(){return heading("Urlaub & Abwesenheit","Urlaubskonten sowie Krankheit, Fortbildungen und sonstige Abwesenheiten zentral verwalten.",'<button class="btn primary" data-action="add-absence">＋ Abwesenheit eintragen</button>')+`<div class="stats"><div class="stat"><div class="stat-label">Jahresanspruch</div><div class="stat-value">32 Tage</div><div class="stat-note">30 Urlaub + 2 Zusatztage</div></div><div class="stat"><div class="stat-label">Resturlaub im Team</div><div class="stat-value">${names.reduce((n,p)=>n+remainingVacation(p),0)} Tage</div><div class="stat-note">Beispielwert</div></div><div class="stat"><div class="stat-label">Offene Einträge</div><div class="stat-value">${absences.filter(a=>a.status==="Offen").length}</div><div class="stat-note warn">Prüfung erforderlich</div></div><div class="stat"><div class="stat-label">Abwesenheiten</div><div class="stat-value">${absences.length}</div><div class="stat-note">In der Liste</div></div></div><section class="card"><div class="card-header"><h2>Abwesenheitsliste</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Art</th><th>Von</th><th>Bis</th><th>Tage</th><th>Status</th></tr></thead><tbody>${absences.map(a=>`<tr><td>${a.name}</td><td>${a.type}</td><td>${fmt(new Date(a.from+"T12:00:00"))}</td><td>${fmt(new Date(a.to+"T12:00:00"))}</td><td>${absenceDays(a)}</td><td><span class="pill ${a.status==='Offen'?'yellow':'green'}">${a.status}</span></td></tr>`).join("")}</tbody></table></div></div></section><section class="card section-gap"><div class="card-header"><h2>Urlaubskonto pro Person</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Regulärer Urlaub</th><th>Zusatztage</th><th>Resturlaub (Beispiel)</th></tr></thead><tbody>${names.map(p=>`<tr><td>${p.name}</td><td>30 Tage</td><td>2 Tage</td><td><span class="pill green">${remainingVacation(p)} Tage</span></td></tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:11px">Konten sind Demo-Werte; Feiertags-, Teilzeit- und Übertragsregeln müssen fachlich bestätigt werden.</p></div></section>`}
function eventsPage(type){const category=type==="Teammeetings"?"Meeting":type==="Supervision"?"Supervision":type==="Fortbildungen"?"Fortbildung":null;const list=events.filter(e=>!category||e.type===category);return heading(type,"Alle Termine zentral verwalten und beim Anlegen nach Art unterscheiden.",'<button class="btn primary" data-action="add-event">＋ Termin anlegen</button>')+`<section class="card"><div class="card-header"><h2>Sondertermine · Terminübersicht</h2><span class="pill blue">${list.length} Einträge</span></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Datum</th><th>Titel</th><th>Kategorie</th><th>Uhrzeit</th><th>Teilnehmende</th></tr></thead><tbody>${list.map(e=>`<tr><td>${fmt(new Date(e.date+"T12:00:00"))}</td><td><strong>${e.title}</strong></td><td>${e.type}</td><td>${e.time}${e.repeatWeekly?" · wöchentlich":""}</td><td>${e.people} Personen</td></tr>`).join("")||'<tr><td colspan="5">Noch keine Termine angelegt.</td></tr>'}</tbody></table></div></div></section><section class="card section-gap"><div class="card-header"><h2>Terminkategorien</h2></div><div class="card-body"><div class="tag-row"><span class="pill purple">Meeting</span><span class="pill blue">Supervision</span><span class="pill green">Kirchlicher Termin</span><span class="pill red">Sonstiger Termin</span></div></div></section>`}function analyticsPage(){
 const staff=planningPeople();
 const personMetrics=staff.map(p=>({person:p,special:shifts.filter(s=>s.person===p.name&&s.serviceType&&s.serviceType!=="Normaler Dienst").length,weekend:shifts.filter(s=>s.person===p.name&&Number(s.day)>=5).length,meetings:shifts.filter(s=>s.person===p.name&&s.serviceType==="Meeting").length}));
 const maxSpecial=Math.max(1,...personMetrics.map(p=>p.special));
 const maxWeekend=Math.max(1,...personMetrics.map(p=>p.weekend));
 const maxMeetings=Math.max(1,...personMetrics.map(p=>p.meetings));
 const metric=(label,value,max,kind)=>`<div class="analytics-metric"><div class="analytics-metric-head"><span>${label}</span><strong>${value}</strong></div><div class="analytics-track"><span class="analytics-fill ${kind}" style="width:${Math.max(0,Math.min(100,value/max*100))}%"></span></div></div>`;
 return heading("Auswertungen","Zusatzbelastungen sichtbar machen und Dienste möglichst fair verteilen.",'<button class="btn" data-action="export-csv">↓ CSV exportieren</button>')+`
 <div class="analytics-layout">
  <section class="card analytics-chart-card">
   <div class="card-header"><div><h2>Sonderdienste je Person</h2><p>Vergleich der erfassten Zusatzdienste im Team</p></div></div>
   <div class="card-body">
    <div class="analytics-legend"><span class="legend-blue">Sonderdienste</span><span class="legend-orange">Wochenenden</span><span class="legend-purple">Meetings</span></div>
    <div class="analytics-people">${personMetrics.map(({person:p,special,weekend,meetings})=>`<div class="analytics-person"><div class="analytics-person-name"><span class="person-avatar">${initials(p.name)}</span><strong>${p.name}</strong></div><div class="analytics-person-metrics">${metric("Sonderdienste",special,maxSpecial,"blue")}${metric("Wochenenddienste",weekend,maxWeekend,"orange")}${metric("Meetings",meetings,maxMeetings,"purple")}</div></div>`).join("")}</div>
   </div>
  </section>
  <section class="card analytics-fairness-card">
   <div class="card-header"><h2>Fairness-Hinweise</h2></div>
   <div class="card-body"><div class="notice-list">
    <div class="notice"><div class="notice-icon">↔</div><div><strong>Zusatzdienste vergleichen</strong><p>Vor der nächsten Zuweisung Anzahl und Dauer der Dienste prüfen.</p></div></div>
    <div class="notice"><div class="notice-icon blue">◷</div><div><strong>Wochenendstunden einbeziehen</strong><p>Nicht nur die Anzahl, sondern auch die Dauer berücksichtigen.</p></div></div>
   </div></div>
  </section>
 </div>
 <section class="card section-gap analytics-table-card"><div class="card-header"><div><h2>Mitarbeitenden-Kennzahlen</h2><p>Vertragliche und geplante Arbeitszeit im Überblick</p></div></div><div class="card-body"><div class="table-wrap">${personTable()}</div></div></section>`
}function settingsPage(){return heading("Einstellungen","Rahmenzeiten und Mindestbesetzung für die automatische Dienstplanung festlegen.",'<button class="btn primary" data-action="save-settings">Änderungen übernehmen</button>')+`<div class="grid settings-grid"><section class="card"><div class="card-header"><h2>Rahmenzeiten</h2></div><div class="card-body"><p>Hier legst du fest, innerhalb welcher Uhrzeiten Dienste stattfinden dürfen.</p><div class="setting-row"><div><strong>Frühester Dienstbeginn</strong><small>Vor dieser Uhrzeit darf kein Dienst starten.</small></div><input class="select-control" id="frame-start" type="time" value="${plannerSettings.frame.start}"></div><div class="setting-row"><div><strong>Spätestes Dienstende</strong><small>Nach dieser Uhrzeit darf kein Dienst enden.</small></div><input class="select-control" id="frame-end" type="time" value="${plannerSettings.frame.end}"></div></div></section><section class="card"><div class="card-header"><h2>Mindestbesetzung Kernzeit · 08–15 Uhr</h2></div><div class="card-body">${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong><small>Gleichzeitig im Dienst</small></div><select class="select-control" data-min-group="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}</div></section><section class="card"><div class="card-header"><h2>Frühschicht · 07–08 Uhr</h2></div><div class="card-body"><p>Benötigte gleichzeitige Besetzung je Gruppe.</p>${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong></div><select class="select-control" data-min-early="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumEarlyByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}<label class="check-option"><input type="checkbox" id="merge-early" ${plannerSettings.mergeEarlyGroups?"checked":""}> Gruppen in der Frühschicht zusammenlegen</label><div class="setting-row"><div><strong>Mindestbesetzung bei Zusammenlegung</strong></div><select class="select-control" id="min-early-combined">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumEarlyCombined)===n?"selected":""}>${n} Person(en) insgesamt</option>`).join("")}</select></div><p class="muted">Bei Aktivierung wird die Frühbesetzung gruppenübergreifend als gemeinsamer Personalpool geprüft.</p></div></section><section class="card"><div class="card-header"><h2>Spätschicht · 15–16 Uhr</h2></div><div class="card-body"><p>Benötigte gleichzeitige Besetzung je Gruppe.</p>${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong></div><select class="select-control" data-min-late="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumLateByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}<label class="check-option"><input type="checkbox" id="merge-late" ${plannerSettings.mergeLateGroups?"checked":""}> Gruppen in der Spätschicht zusammenlegen</label><div class="setting-row"><div><strong>Mindestbesetzung bei Zusammenlegung</strong></div><select class="select-control" id="min-late-combined">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumLateCombined)===n?"selected":""}>${n} Person(en) insgesamt</option>`).join("")}</select></div><p class="muted">Bei Aktivierung wird die Spätbesetzung gruppenübergreifend als gemeinsamer Personalpool geprüft.</p></div></section><section class="card"><div class="card-header"><h2>Automatische Vorbelegung</h2></div><div class="card-body"><p>Die Vorbelegung verteilt die vertraglichen Wochenstunden auf fünf Werktage und prüft die Besetzung in Früh-, Kern- und Spätzeit.</p><p class="muted">Individuelle Verfügbarkeiten, Pausen und gesetzliche Ruhezeiten müssen weiterhin geprüft werden.</p><button class="btn primary" data-action="generate-plan">Dienstplan für diese Woche erstellen</button></div></section></div>`}
function leaderProfilePage(){return heading("Leitungsprofil","Persönliche Angaben, Zugangsdaten und Arbeitszeit der Leitung.",'<button class="btn primary" data-action="save-leader-profile">Profil speichern</button>')+`<div class="grid settings-grid"><section class="card"><div class="card-header"><h2>Persönliche Angaben</h2></div><div class="card-body"><div class="field"><label>Name</label><input id="leader-name" class="select-control" value="${leaderProfile.name||cloudUser?.user_metadata?.full_name||""}" placeholder="Vorname Nachname"></div><div class="field"><label>E-Mail-Adresse</label><input id="leader-email" class="select-control" type="email" value="${cloudUser?.email||""}"></div><div class="field"><label>Telefon (optional)</label><input id="leader-phone" class="select-control" type="tel" value="${leaderProfile.phone||""}"></div><p class="muted">Bei einer geänderten E-Mail-Adresse kann eine Bestätigungsmail erforderlich sein. Die Bürozeit wird nicht als Gruppenzeit verplant; für Gruppendienste zählt ausschließlich die unten angegebene Gruppenzeit.</p></div></section><section class="card"><div class="card-header"><h2>Passwort ändern</h2></div><div class="card-body"><div class="field"><label>Neues Passwort</label><input id="leader-password" class="select-control" type="password" autocomplete="new-password" placeholder="Mindestens 8 Zeichen"></div><div class="field"><label>Passwort wiederholen</label><input id="leader-password-confirm" class="select-control" type="password" autocomplete="new-password"></div><p class="muted">Leer lassen, wenn das Passwort unverändert bleiben soll.</p></div></section><section class="card"><div class="card-header"><h2>Arbeitszeit der Leitung</h2></div><div class="card-body"><div class="field"><label>Stammgruppe</label><select id="leader-group" class="select-control">${groups.map(g=>`<option ${leaderProfile.group===g?"selected":""}>${g}</option>`).join("")}</select></div><div class="field"><label>Vertragliche Wochenstunden gesamt</label><input id="leader-weekly" class="select-control" type="number" min="1" max="50" step="0.5" value="${leaderProfile.weeklyHours}"></div><div class="field"><label>Davon Bürozeit pro Woche</label><input id="leader-office" class="select-control" type="number" min="0" max="50" step="0.5" value="${leaderProfile.officeHours}"></div><div class="field"><label>Davon Zeit in der Gruppe pro Woche</label><input id="leader-group-hours" class="select-control" type="number" min="0" max="50" step="0.5" value="${leaderProfile.groupHours}"></div><p class="muted">Nur die Gruppenzeit wird als pädagogische Besetzung eingeplant. Bürozeit zählt nicht zur Gruppenbesetzung.</p></div></section><section class="card"><div class="card-header"><h2>Weitere Angaben</h2></div><div class="card-body"><p>Wenn Gruppenstunden hinterlegt sind, erscheint die Leitung als eigene Person im Wochenplan. Feste Büro-Wochentage und Bürozeiten können wir anschließend ergänzen.</p></div></section></div>`}
function exportPlanPdf(){
  const existing=$("#pdfWeekView"); if(existing)existing.remove();
  const view=document.createElement("section"); view.id="pdfWeekView";
  const staff=planningPeople().filter(p=>selectedGroup==="Alle Gruppen"||p.group===selectedGroup);
  const days=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
  const dayHeader='<div class="pdf-time-head">Uhrzeit</div>'+days.map((day,i)=>'<div class="pdf-day-group" style="grid-column:span '+Math.max(1,staff.length)+'">'+day+'<small>'+fmt(dateForDay(i),{day:"2-digit",month:"2-digit"})+'</small></div>').join("");
  const staffHeader='<div class="pdf-time-subhead"></div>'+days.map(()=>staff.map(p=>'<div class="pdf-staff-subhead" title="'+p.name+'">'+p.name+'</div>').join("")).join("");
  const timeLabels='<div class="pdf-time-axis">'+Array.from({length:9},(_,i)=>'<span style="top:'+(i/8*100)+'%">'+String(6+i*2).padStart(2,"0")+':00</span>').join("")+'</div>';
  let columns="";
  days.forEach((day,dayIndex)=>{
    staff.forEach((p,staffIndex)=>{
      const personShifts=weekShifts().filter(s=>s.day===dayIndex&&s.person===p.name);
      const blocks=personShifts.map(s=>{
        const top=(minutes(s.start)-360)/960*100;
        const span=minutes(s.end)-minutes(s.start),height=span/960*100,pause=shiftPause(s);
        const pauseMarkup=pause?'<i class="pdf-pause-marker" style="top:'+((pause.start-minutes(s.start))/span*100)+'%;height:'+(30/span*100)+'%">Pause · 30 Min.</i>':'';
        return '<div class="pdf-time-shift '+shiftClass(s)+'" style="top:'+top+'%;height:'+height+'%"><strong>'+s.start+'–'+s.end+'</strong><span>'+p.name+'</span>'+pauseMarkup+'</div>';
      }).join("");
      columns+='<div class="pdf-time-column" style="grid-column:'+(2+dayIndex*staff.length+staffIndex)+';grid-row:3 / span 1"><div class="pdf-time-track">'+Array.from({length:8},()=>'<i></i>').join("")+blocks+'</div></div>';
    });
  });
  view.innerHTML=sanitizeHTML('<h1>Dienstplan · '+weekLabel()+'</h1><div class="pdf-time-grid" style="--pdf-staff-count:'+Math.max(1,staff.length)+';--pdf-total-cols:'+Math.max(1,staff.length*7)+'">'+dayHeader+staffHeader+timeLabels+columns+'</div>');
  $("#pageContent").prepend(view);
  const originalTitle=document.title;
  document.title="Dienstplan-"+iso(dateForDay(0))+"-bis-"+iso(dateForDay(6));
  window.addEventListener("afterprint",()=>{document.title=originalTitle;view.remove()},{once:true});
  window.print();
}

function render(){initShifts();const content=$("#pageContent");let out="";switch(currentPage){case"dashboard":out=dashboard();break;case"dienstplan":out=dutyPage();break;case"kalender":out=calendarPage();break;case"mitarbeitende":out=employeesPage();break;case"abwesenheiten":out=absencesPage();break;case"sondertermine":out=eventsPage("Sondertermine");break;case"teammeetings":out=eventsPage("Teammeetings");break;case"supervision":out=eventsPage("Supervision");break;case"fortbildungen":out=eventsPage("Fortbildungen");break;case"auswertungen":out=analyticsPage();break;case"einstellungen":out=settingsPage();break;case"leitungsprofil":out=leaderProfilePage();break;default:out=dashboard()}content.innerHTML=sanitizeHTML(out);$("#pageContent .card-header h2").forEach(h=>{if(h.querySelector(".card-title-icon"))return;const t=h.textContent;const key=/Arbeitszeit|Büro|Wochenstunden/.test(t)?"clock":/Zugang|Passwort/.test(t)?"lock":/Personal|Mitarbeitende|Team/.test(t)?"users":/Auswertung|Kennzahl/.test(t)?"chart":/Einstellung|Verwaltung/.test(t)?"settings":/Termin|Kalender|Abwesenheit/.test(t)?"calendar":"briefcase";h.insertAdjacentHTML("afterbegin",`<span class="card-title-icon">${uiIcon(key)}</span>`)});scheduleCloudSave();const gf=$("#groupFilter");if(gf)gf.addEventListener("change",e=>{selectedGroup=e.target.value;render()});}
function syncNavigation(){
  $$(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));
  const groups={dienstplan:"planung",kalender:"planung",mitarbeitende:"personal",abwesenheiten:"personal",sondertermine:"termine",teammeetings:"termine",supervision:"termine",fortbildungen:"termine",auswertungen:"auswertung",einstellungen:"verwaltung",leitungsprofil:"verwaltung"};
  const activeGroup=groups[currentPage];
  $$("[data-nav-group]").forEach(g=>{
    const key=g.dataset.navGroup,button=$("[data-menu-toggle]",g),children=$("[data-nav-children]",g);
    if(key===activeGroup){button.setAttribute("aria-expanded","true");children.hidden=false;}
    else if(button.getAttribute("aria-expanded")!=="true"){button.setAttribute("aria-expanded","false");children.hidden=true;}
  });
}
function navigate(page){
  if(!pageTitles[page])return;
  currentPage=page;
  const groups={dienstplan:"planung",kalender:"planung",mitarbeitende:"personal",abwesenheiten:"personal",sondertermine:"termine",teammeetings:"termine",supervision:"termine",fortbildungen:"termine",auswertungen:"auswertung",einstellungen:"verwaltung"};
  const activeGroup=groups[page];
  if(activeGroup){
    $$("[data-nav-group]").forEach(g=>{
      const b=$("[data-menu-toggle]",g),c=$("[data-nav-children]",g),open=g.dataset.navGroup===activeGroup;
      b.setAttribute("aria-expanded",String(open));c.hidden=!open;
    });
  }
  syncNavigation();
  $("#sidebar").classList.remove("open");
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}
function openModal(title,body){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=sanitizeHTML(body);$("#modalBackdrop").classList.remove("hidden")}
function closeModal(){$("#modalBackdrop").classList.add("hidden")}
function personOptions(){return names.map(p=>`<option>${escapeHTML(p.name)}</option>`).join("")}
function addShiftModal(id=null){if(!names.length){alert("Lege zuerst mindestens eine mitarbeitende Person an.");navigate("mitarbeitende");return}const s=id?shifts.find(x=>x.id===id):null;const people=planningPeople();const person=s?.person||people[0].name;openModal(s?"Dienst bearbeiten":"Dienst eintragen",`<form id="shiftForm"><div class="form-grid"><div class="field full"><label for="shiftPerson">Mitarbeitende</label><select id="shiftPerson" name="person">${people.map(p=>`<option ${p.name===person?'selected':''}>${escapeHTML(p.name)}</option>`).join("")}</select></div><div class="field"><label>Wochentag</label><select name="day">${weekdays.map((d,i)=>`<option value="${i}" ${(s?s.day:0)===i?'selected':''}>${d} · ${fmt(dateForDay(i))}</option>`).join("")}</select></div><div class="field"><label>Gruppe</label><select name="group">${groups.map(g=>`<option ${(s?s.group:names[0].group)===g?'selected':''}>${escapeHTML(g)}</option>`).join("")}</select></div><div class="field"><label>Dienstart</label><select name="serviceType"><option ${(!s?.serviceType||s.serviceType==="Normaler Dienst")?"selected":""}>Normaler Dienst</option><option ${s?.serviceType==="Meeting"?"selected":""}>Meeting</option><option ${s?.serviceType==="Kirchlicher Termin"?"selected":""}>Kirchlicher Termin</option><option ${s?.serviceType==="Supervision"?"selected":""}>Supervision</option><option ${s?.serviceType==="Fortbildung"?"selected":""}>Fortbildung</option><option ${s?.serviceType==="Sonstiger Termin"?"selected":""}>Sonstiger Termin</option></select></div><div class="field"><label>Beginn</label><input name="start" type="time" min="06:00" max="22:00" value="${s?.start||"07:30"}" required></div><div class="field"><label>Ende</label><input name="end" type="time" min="06:00" max="22:00" value="${s?.end||"12:00"}" required></div></div><div class="modal-actions">${s?`<button type="button" class="btn danger" data-delete-shift="${s.id}">Dienst löschen</button>`:""}<button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Dienst speichern</button></div></form>`);$("#shiftForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);const start=fd.get("start"),end=fd.get("end");if(minutes(end)<=minutes(start)){alert("Die Endzeit muss nach der Startzeit liegen.");return}const withinFrame=minutes(start)>=minutes(plannerSettings.frame.start)&&minutes(end)<=minutes(plannerSettings.frame.end);if(!withinFrame){alert("Der Dienst liegt außerhalb der allgemeinen Rahmenzeit "+plannerSettings.frame.start+"–"+plannerSettings.frame.end+" Uhr.");return}const person=planningPeople().find(p=>p.name===fd.get("person"));if(!person){alert("Die Person wurde nicht gefunden.");return}const day=Number(fd.get("day"));if(isBlocked(person,day,start,end,s?.weekOffset??weekOffset)){alert("Dieser Dienst überschneidet sich mit einer festen Dienstsperre der Person. Bitte wähle eine andere Zeit.");return}if(personHasEventConflict(person,day,start,end,s?.weekOffset??weekOffset)){alert("Dieser Dienst überschneidet sich mit einem Termin der Person.");return}const ruleIssues=shiftRuleConflicts(person,day,start,end,s?.weekOffset??weekOffset);if(ruleIssues.length){alert("Arbeitszeitprüfung: "+ruleIssues.join("; ")+". Bitte Dienst anpassen.");return}const absence=blockingAbsence(person,day,s?.weekOffset??weekOffset);if(absence){alert("Für diese Person ist an diesem Tag "+absence.type+" erfasst. Der Dienst kann nicht eingetragen werden.");return}const overlap=shifts.some(x=>x.id!==s?.id&&x.person===person.name&&x.day===day&&(x.weekOffset??0)===(s?.weekOffset??weekOffset)&&minutes(start)<minutes(x.end)&&minutes(end)>minutes(x.start));if(overlap){alert("Dieser Dienst überschneidet sich zeitlich mit einem anderen Dienst derselben Person.");return}if(s){Object.assign(s,{person:person.name,group:fd.get("group"),serviceType:fd.get("serviceType")||"Normaler Dienst",day:Number(fd.get("day")),start,end,color:person.color,weekOffset:s.weekOffset??weekOffset})}else{shifts.push({id:"s"+Date.now(),person:person.name,group:fd.get("group"),serviceType:fd.get("serviceType")||"Normaler Dienst",day:Number(fd.get("day")),start,end,color:person.color,weekOffset})}closeModal();render()});}
function addEventModal(){openModal("Termin erstellen",`<form id="eventForm"><div class="form-grid"><div class="field full"><label>Titel</label><input name="title" placeholder="z. B. Sankt Martin" required></div><div class="field"><label>Kategorie</label><select name="type"><option>Meeting</option><option>Supervision</option><option>Kirchlicher Termin</option><option>Fortbildung</option><option>Sonstiger Termin</option></select></div><div class="field"><label>Datum</label><input name="date" type="date" value="${iso(dateForDay(2))}" required></div><div class="field"><label>Wiederholung</label><select name="repeat"><option value="once">Einmalig</option><option value="weekly">Wöchentlich</option></select></div><div class="field"><label>Beginn</label><input name="start" type="time" value="16:00" required></div><div class="field"><label>Ende</label><input name="end" type="time" value="18:00" required></div><div class="field full"><label>Teilnehmende (standardmäßig alle ausgewählt)</label><div class="check-list">${names.map(p=>`<label class="check-option"><input type="checkbox" name="people" value="${p.name}" checked> ${p.name}</label>`).join("")}</div></div></div><div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Termin speichern</button></div></form>`);$("#eventForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),start=fd.get("start"),end=fd.get("end");if(minutes(end)<=minutes(start)){alert("Die Endzeit muss nach der Startzeit liegen.");return}const eventDate=fd.get("date"),attendees=fd.getAll("people"),repeatWeekly=fd.get("repeat")==="weekly",eventDay=new Date(eventDate+"T12:00:00").getDay(),conflicts=shifts.filter(sh=>attendees.includes(sh.person)&&eventOccursOnDate({date:eventDate,repeatWeekly,repeatDay:eventDay},iso(dateForDay(sh.day,sh.weekOffset??weekOffset)))&&minutes(start)<minutes(sh.end)&&minutes(end)>minutes(sh.start));if(conflicts.length){alert("Termin kann nicht gespeichert werden: Er überschneidet sich mit "+conflicts.length+" bestehenden Diensten der ausgewählten Teilnehmenden.");return}events.push({id:"e"+Date.now(),date:eventDate,title:fd.get("title"),type:fd.get("type"),time:start+"–"+end,attendees,people:attendees.length,repeatWeekly,repeatDay:eventDay});closeModal();render()})}
function addAbsenceModal(){if(!names.length){alert("Lege zuerst mindestens eine mitarbeitende Person an.");navigate("mitarbeitende");return}openModal("Abwesenheit eintragen",`<form id="absenceForm"><div class="form-grid"><div class="field full"><label>Mitarbeitende</label><select name="name">${personOptions()}</select></div><div class="field"><label>Art</label><select name="type"><option>Urlaub</option><option>Krankheit</option><option>Fortbildung</option><option>Sonstige Abwesenheit</option></select></div><div class="field"><label>Status</label><select name="status"><option>Offen</option><option>Genehmigt</option><option>Erfasst</option></select></div><div class="field"><label>Von</label><input name="from" type="date" value="${iso(dateForDay(0))}" required></div><div class="field"><label>Bis</label><input name="to" type="date" value="${iso(dateForDay(0))}" required></div><div class="field full"><label>Notiz (optional)</label><input name="note" placeholder="Keine Diagnosen eintragen"></div></div><div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Eintragen</button></div></form>`);$("#absenceForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);if(fd.get("to")<fd.get("from")){alert("Das Enddatum muss nach dem Startdatum liegen.");return}const type=fd.get("type"),from=fd.get("from"),to=fd.get("to");if(type==="Urlaub"){const person=names.find(p=>p.name===fd.get("name")),requested=calendarDaysBetween(from,to);if(requested<1){alert("Der ausgewählte Zeitraum enthält keine Urlaubstage von Montag bis Freitag.");return}if(requested>remainingVacation(person)){alert("Der Urlaub umfasst "+requested+" Arbeitstage, verfügbar sind noch "+remainingVacation(person)+" Tage.");return}}const personName=fd.get("name"),conflicts=shifts.filter(s=>s.person===personName&&iso(dateForDay(s.day,s.weekOffset??weekOffset))>=from&&iso(dateForDay(s.day,s.weekOffset??weekOffset))<=to);if(conflicts.length){alert("Abwesenheit kann nicht gespeichert werden: "+conflicts.length+" bestehende Dienste liegen im Zeitraum. Bitte zuerst die Dienste entfernen oder verschieben.");return}absences.push({id:"a"+Date.now(),name:personName,type,from,to,days:calendarDaysBetween(from,to),status:fd.get("status"),note:fd.get("note")});closeModal();render()})}
function addPersonModal(personName=null){
 const person=personName?names.find(p=>p.name===personName):null;
 if(personName&&!person){alert("Die Person wurde nicht gefunden.");return}
 const editing=Boolean(person);
 openModal(editing?"Mitarbeitende bearbeiten":"Mitarbeitende hinzufügen",`<form id="personForm"><div class="form-grid"><div class="field"><label>Vorname Nachname</label><input name="name" value="${escapeHTML(person?.name||"")}" maxlength="120" required></div><div class="field"><label>Wochenstunden</label><input name="hours" type="number" min="1" max="50" value="${person?.hours??30}" required></div><div class="field"><label>Stammgruppe</label><select name="group">${groups.map(g=>`<option ${(person?.group||groups[0])===g?'selected':''}>${g}</option>`).join("")}</select></div><div class="field"><label>Resturlaub (Tage)</label><input name="vacation" type="number" min="0" max="100" value="${person?.vacation??32}" required></div></div>${editing?`<div class="setting-row" style="margin-top:14px"><div><strong>Sperrzeiten</strong><small>Feste Zeiten, in denen diese Person nicht eingeplant werden darf.</small></div><button type="button" class="btn" data-manage-blocks="${person.name}">Sperrzeiten bearbeiten</button></div>`:""}<div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">${editing?"Änderungen speichern":"Person hinzufügen"}</button></div></form>`);
 $("#personForm").addEventListener("submit",e=>{
  e.preventDefault();const fd=new FormData(e.target),name=String(fd.get("name")).trim(),hours=Number(fd.get("hours")),vacation=Number(fd.get("vacation"));
  if(!name||hours<1||hours>50||vacation<0){alert("Bitte prüfe Name, Wochenstunden und Resturlaub.");return}
  if(names.some(p=>p!==person&&p.name.toLocaleLowerCase("de")===name.toLocaleLowerCase("de"))){alert("Dieser Name ist bereits vorhanden.");return}
  if(editing){
   const oldName=person.name;Object.assign(person,{name,initials:name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase(),group:fd.get("group"),hours,vacation});
   if(oldName!==name){shifts.forEach(s=>{if(s.person===oldName)s.person=name});absences.forEach(a=>{if(a.name===oldName)a.name=name})}
   shifts.forEach(s=>{if(s.person===name)s.group=person.group});
  }else{
   names.push({name,initials:name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase(),group:fd.get("group"),hours,vacation,special:0,meetings:0,supervision:0,color:"blue",employment:"Teilzeit"});
  }
  closeModal();render();
 });
}
document.addEventListener("click",e=>{
 const menuToggle=e.target.closest("[data-menu-toggle]");if(menuToggle){const shell=document.querySelector(".app-shell");if(shell?.classList.contains("sidebar-collapsed")){const target=menuToggle.dataset.defaultPage;if(target)navigate(target);return}const key=menuToggle.dataset.menuToggle,children=$("[data-nav-children='"+key+"']"),open=menuToggle.getAttribute("aria-expanded")!=="true";menuToggle.setAttribute("aria-expanded",String(open));children.hidden=!open;return}
 const nav=e.target.closest("[data-page]");if(nav){navigate(nav.dataset.page);return}
 const removePerson=e.target.closest("[data-remove-person]");if(removePerson){const personName=removePerson.dataset.removePerson;if(confirm("Mitarbeitende Person „"+personName+"“ wirklich entfernen? Zugehörige Dienste und Abwesenheiten werden ebenfalls gelöscht.")){names=names.filter(p=>p.name!==personName);shifts=shifts.filter(x=>x.person!==personName);absences=absences.filter(x=>x.name!==personName);render()}return}
 const deleteShift=e.target.closest("[data-delete-shift]");if(deleteShift){const id=deleteShift.dataset.deleteShift,shift=shifts.find(x=>x.id===id);if(shift&&confirm("Diesen Dienst wirklich löschen?")){shifts=shifts.filter(x=>x.id!==id);closeModal();render()}return}
 const manageBlocks=e.target.closest("[data-manage-blocks]");if(manageBlocks){manageBlocksModal(manageBlocks.dataset.manageBlocks);return}
  const removeBlock=e.target.closest("[data-remove-block]");if(removeBlock){const p=planningPeople().find(x=>x.name===removeBlock.dataset.blockPerson);if(p){personBlocks(p).splice(Number(removeBlock.dataset.removeBlock),1);if(p.isLeader)leaderProfile.blocks=p.blocks;scheduleCloudSave();manageBlocksModal(p.name)}return}
  const editPerson=e.target.closest("[data-edit-person]");if(editPerson){addPersonModal(editPerson.dataset.editPerson);return}
 const edit=e.target.closest("[data-edit-shift]");if(edit){addShiftModal(edit.dataset.editShift);return}
 const close=e.target.closest("[data-close]");if(close){closeModal();return}
 const deleteEvent=e.target.closest("[data-delete-event]");if(deleteEvent){const id=deleteEvent.dataset.deleteEvent;if(confirm("Diesen Termin wirklich löschen?")){events=events.filter(x=>x.id!==id);render()}return}const deleteAbsence=e.target.closest("[data-delete-absence]");if(deleteAbsence){const id=deleteAbsence.dataset.deleteAbsence;if(confirm("Diese Abwesenheit wirklich löschen?")){absences=absences.filter(x=>x.id!==id);render()}return}const action=e.target.closest("[data-action]")?.dataset.action;if(!action)return;
 if(action==="add-shift")addShiftModal();
 if(action==="generate-plan")generateWeekPlan();
 if(action==="copy-week")copyWeekForward();
 if(action==="add-event")addEventModal();
 if(action==="add-absence")addAbsenceModal();
 if(action==="add-person")addPersonModal();
 if(action==="save-leader-profile"){(async()=>{const name=$("#leader-name").value.trim(),email=$("#leader-email").value.trim(),phone=$("#leader-phone").value.trim(),weeklyHours=Number($("#leader-weekly").value),officeHours=Number($("#leader-office").value),groupHours=Number($("#leader-group-hours").value),password=$("#leader-password").value,confirmPassword=$("#leader-password-confirm").value;if(!name||!email||weeklyHours<=0||officeHours<0||groupHours<0||officeHours+groupHours>weeklyHours){alert("Bitte Name, E-Mail und Arbeitszeiten prüfen. Bürozeit plus Gruppenzeit darf die Wochenstunden nicht überschreiten.");return}if(password&&(password.length<8||password!==confirmPassword)){alert("Das neue Passwort muss mindestens 8 Zeichen haben und beide Eingaben müssen übereinstimmen.");return}const emailChanged=email!==cloudUser.email,updates={data:{full_name:name}};if(emailChanged)updates.email=email;if(password)updates.password=password;const {data,error}=await cloud.auth.updateUser(updates);if(error){alert("Profil konnte nicht aktualisiert werden: "+error.message);return}leaderProfile={name,phone,group:$("#leader-group").value,weeklyHours,officeHours,groupHours};if(data.user)cloudUser=data.user;updateProfileHeader();$("#leader-password").value="";$("#leader-password-confirm").value="";scheduleCloudSave();render();alert(emailChanged?"Profil gespeichert. Bitte die Bestätigungsmail für die neue E-Mail-Adresse beachten.":"Leitungsprofil gespeichert.");})()}
 if(action==="save-plan"){const button=e.target.closest("[data-action=\"save-plan\"]");if(button){button.disabled=true;button.textContent="Speichert …";saveCloudState().then(ok=>{button.disabled=false;button.textContent=ok?"Gespeichert ✓":"Erneut versuchen";if(ok)setTimeout(()=>{if(button.isConnected)button.textContent="Jetzt speichern"},2200)})}}
 if(action==="prev-week"){weekOffset--;render()}
 if(action==="next-week"){weekOffset++;render()}
 if(action==="save-settings"){const frameStart=$("#frame-start"),frameEnd=$("#frame-end");if(!frameStart||!frameEnd||!frameStart.value||!frameEnd.value||minutes(frameEnd.value)<=minutes(frameStart.value)){alert("Die Rahmenzeit muss ein gültiges Zeitfenster sein.");return}$$("[data-min-group]").forEach(el=>{plannerSettings.minimumByGroup[el.dataset.minGroup]=Number(el.value)||0});$$("[data-min-early]").forEach(el=>{plannerSettings.minimumEarlyByGroup[el.dataset.minEarly]=Number(el.value)||0});$$("[data-min-late]").forEach(el=>{plannerSettings.minimumLateByGroup[el.dataset.minLate]=Number(el.value)||0});plannerSettings.mergeEarlyGroups=$("#merge-early").checked;plannerSettings.mergeLateGroups=$("#merge-late").checked;plannerSettings.minimumEarlyCombined=Number($("#min-early-combined").value);plannerSettings.minimumLateCombined=Number($("#min-late-combined").value);plannerSettings.frame.start=frameStart.value;plannerSettings.frame.end=frameEnd.value;alert("Rahmenzeiten und Mindestbesetzung wurden übernommen und werden gespeichert.");render()} if(action==="print-plan"){exportPlanPdf()} if(action==="export-csv"){const csv=["Name;Gruppe;Wochenstunden;Resturlaub;Sonderdienste",...names.map(p=>[p.name,p.group,p.hours,p.vacation,p.special].join(";"))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="frueh-bis-spaet-auswertung.csv";a.click();URL.revokeObjectURL(a.href)}
});
$("#closeModal").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",event=>{const button=event.target.closest("#sidebarCollapse");if(!button)return;event.preventDefault();event.stopPropagation();const shell=document.querySelector(".app-shell");if(!shell)return;const collapsed=shell.classList.toggle("sidebar-collapsed");button.setAttribute("aria-label",collapsed?"Menü ausklappen":"Menü einklappen");button.title=collapsed?"Menü ausklappen":"Menü einklappen";button.textContent=collapsed?"›":"‹";button.setAttribute("aria-expanded",String(!collapsed));});
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){const q=e.target.value.trim().toLocaleLowerCase("de");if(!q){alert("Bitte einen Namen oder Termin eingeben.");return}if(names.some(p=>p.name.toLocaleLowerCase("de").includes(q)))navigate("mitarbeitende");else if(events.some(ev=>ev.title.toLocaleLowerCase("de").includes(q)))navigate("kalender");else alert("Keine passenden Beispieldaten gefunden.")}});
startCloudApp();