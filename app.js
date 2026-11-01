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
function planningPeople(){const pool=names.slice();if(leaderProfile.name)pool.push({name:leaderProfile.name,initials:leaderProfile.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(),group:leaderProfile.group,hours:Number(leaderProfile.groupHours)||0,vacation:0,color:"purple",employment:"Leitung",blocks:leaderProfile.blocks||[],isLeader:true});return pool;}
const weekdays = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const plannerSettings = {frame:{start:"07:00",end:"16:00"},minimumByGroup:{"Nest":2,"Sonnengruppe":2,"Sternengruppe":2},minimumEarlyByGroup:{"Nest":1,"Sonnengruppe":1,"Sternengruppe":1},minimumLateByGroup:{"Nest":1,"Sonnengruppe":1,"Sternengruppe":1},mergeEarlyGroups:false,mergeLateGroups:false,minimumEarlyCombined:2,minimumLateCombined:2};
const factoryNames = JSON.parse(JSON.stringify(names));
const factoryGroups = groups.slice();
const factoryPlannerSettings = JSON.parse(JSON.stringify(plannerSettings));
const factoryLeaderProfile = JSON.parse(JSON.stringify(leaderProfile));

const SUPABASE_URL = "https://pcwcghbzksopfyrgzyht.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OznU91iPtKK2nsjTJA2q6Q_LuxXyzUB";
const cloud = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
let cloudReady = false, cloudUser = null, saveTimer = null, cloudUpdatedAt = null, cloudSaveInFlight = false;
function cloudSnapshot(){return {version:1,baseMonday:iso(baseMonday),names,groups,plannerSettings,leaderProfile,events,absences,closures,shifts,weekOffset,selectedGroup};}
function applyCloudSnapshot(s){
 if(!s||typeof s!=="object")return;
 if(Array.isArray(s.names))names=s.names;
 if(s.leaderProfile&&typeof s.leaderProfile==="object")leaderProfile={...leaderProfile,...s.leaderProfile};
 if(Array.isArray(s.groups))groups.splice(0,groups.length,...s.groups);
 if(s.plannerSettings&&typeof s.plannerSettings==="object"){plannerSettings.frame={...plannerSettings.frame,...(s.plannerSettings.frame||{})};plannerSettings.minimumByGroup={...plannerSettings.minimumByGroup,...(s.plannerSettings.minimumByGroup||{})};plannerSettings.minimumEarlyByGroup={...plannerSettings.minimumEarlyByGroup,...(s.plannerSettings.minimumEarlyByGroup||{})};plannerSettings.minimumLateByGroup={...plannerSettings.minimumLateByGroup,...(s.plannerSettings.minimumLateByGroup||{})};plannerSettings.mergeEarlyGroups=!!s.plannerSettings.mergeEarlyGroups;plannerSettings.mergeLateGroups=!!s.plannerSettings.mergeLateGroups;plannerSettings.minimumEarlyCombined=Number(s.plannerSettings.minimumEarlyCombined??plannerSettings.minimumEarlyCombined);plannerSettings.minimumLateCombined=Number(s.plannerSettings.minimumLateCombined??plannerSettings.minimumLateCombined);}
 if(Array.isArray(s.events))events=s.events;
 if(Array.isArray(s.absences))absences=s.absences;
 closures=Array.isArray(s.closures)?s.closures:[];
 if(Array.isArray(s.shifts))shifts=s.shifts;
 if(Number.isInteger(s.weekOffset))weekOffset=s.weekOffset;
 if(s.baseMonday){const saved=new Date(s.baseMonday+"T12:00:00");if(!Number.isNaN(saved.getTime())){const elapsed=Math.round((baseMonday-saved)/604800000);if(elapsed){shifts=shifts.map(x=>({...x,weekOffset:(x.weekOffset??0)-elapsed}));weekOffset-=elapsed;}}}
 if(typeof s.selectedGroup==="string")selectedGroup=s.selectedGroup;
}
function showCloudLogin(message="Bitte mit deinem Zugang anmelden."){
 removeEmployeePortal();
 let layer=document.getElementById("cloudLogin");
 if(!layer){layer=document.createElement("div");layer.id="cloudLogin";layer.style.cssText="position:fixed;inset:0;z-index:99999;background:#f4f7fb;display:grid;place-items:center;padding:22px;font-family:inherit";
 layer.innerHTML='<form id="cloudLoginForm" style="background:white;width:min(100%,420px);padding:28px;border-radius:18px;box-shadow:0 12px 40px #1c35501c"><div style="font-size:28px;font-weight:750;color:#19304b;margin-bottom:8px">Früh bis spät</div><p style="color:#66758a;margin:0 0 22px">Geschützter Zugang für Leitung und Mitarbeitende</p><label style="display:block;font-weight:600;margin:12px 0 6px">E-Mail-Adresse</label><input name="email" type="email" autocomplete="username" required style="box-sizing:border-box;width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit"><label style="display:block;font-weight:600;margin:14px 0 6px">Passwort</label><input name="password" type="password" autocomplete="current-password" required style="box-sizing:border-box;width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit"><p id="cloudLoginMessage" style="color:#64748b;font-size:14px;min-height:20px"></p><button type="submit" style="width:100%;padding:14px;border:0;border-radius:10px;background:#1d6b54;color:white;font:inherit;font-weight:700">Anmelden</button></form>';
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
 const owner=await cloud.from("app_owner").select("user_id").eq("user_id",user.id).maybeSingle();
 if(owner.error){showCloudError("Die Berechtigungen konnten nicht geprüft werden. "+owner.error.message);return;}
 if(!owner.data){
  const employee=await cloud.from("employee_access").select("person_name").eq("user_id",user.id).maybeSingle();
  if(employee.error||!employee.data){showCloudLogin("Dieser Zugang ist nicht als Leitung oder Mitarbeitende freigeschaltet.");await cloud.auth.signOut();return;}
  const {data:portal,error:portalError}=await cloud.functions.invoke("employee-schedule");
  if(portalError||!portal){showCloudLogin("Deine Dienste konnten nicht geladen werden. Bitte wende dich an die Leitung.");await cloud.auth.signOut();return;}
  document.getElementById("cloudLogin")?.remove();
  showEmployeePortal(portal);return;
 }
 const result=await cloud.from("app_state").select("state,updated_at").eq("id",1).maybeSingle();
 if(result.error){showCloudError("Die gespeicherten Daten konnten nicht geladen werden. "+result.error.message);return;}
 if(result.data?.state)applyCloudSnapshot(result.data.state);cloudUpdatedAt=result.data?.updated_at||null;
 cloudReady=true;document.getElementById("cloudLogin")?.remove();addCloudLogout();render();const status=document.getElementById("cloudSaveStatus");if(status)status.textContent="Gespeichert";
 if(!result.data)await saveCloudState();
}
function removeEmployeePortal(){
 document.getElementById("employeePortal")?.remove();
 const shell=document.querySelector(".app-shell");if(shell){shell.hidden=false;shell.style.removeProperty("display");}
}
function showEmployeePortal(payload){
 removeEmployeePortal();
 const shell=document.querySelector(".app-shell");if(shell){shell.hidden=true;shell.style.display="none";}
 let weekOffset=Number.isInteger(payload?.weekOffset)?payload.weekOffset:0;
 let loading=false;
 const portal=document.createElement("main");portal.id="employeePortal";portal.className="employee-portal";
 portal.innerHTML='<header class="employee-portal-header"><div><span class="employee-portal-brand">🌈 Früh bis spät</span><h1>Gesamtdienstplan</h1><p>Angemeldet als '+escapeHTML(payload?.employeeName||"Mitarbeitende")+' · Nur Ansicht</p></div><button class="btn small" type="button" data-employee-logout>Abmelden</button></header><section class="employee-schedule-card employee-overview-card"><div class="employee-overview-heading"><div><h2>Wochenübersicht</h2><p>Alle Dienste im Team für die ausgewählte Kalenderwoche</p></div><span id="employeePlanStatus" class="employee-plan-status" aria-live="polite"></span></div><nav class="employee-week-nav" aria-label="Kalenderwoche"><button class="employee-week-button" type="button" data-employee-week-step="-1" aria-label="Vorherige Kalenderwoche">‹</button><strong id="employeeWeekLabel"></strong><button class="employee-week-button" type="button" data-employee-week-step="1" aria-label="Nächste Kalenderwoche">›</button></nav><div id="employeeWeekContent" aria-live="polite"></div></section><section class="employee-schedule-card employee-personal-card"><h2>Meine Dienste</h2><div id="employeePersonalContent"></div></section>';
 document.body.appendChild(portal);
 function weekMonday(offset){
  const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-((date.getDay()+6)%7)+offset*7);return date;
 }
 function isoDate(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
 function weekLabel(offset){
  const monday=weekMonday(offset),thursday=new Date(monday);thursday.setDate(thursday.getDate()+3);
  const sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
  const range=new Intl.DateTimeFormat("de-DE",{day:"numeric",month:"short"}).format(monday)+" – "+new Intl.DateTimeFormat("de-DE",{day:"numeric",month:"short"}).format(sunday);
  return "KW "+isoCalendarWeek(monday)+"/"+thursday.getFullYear()+" · "+range;
 }
 function validShifts(){
  return (Array.isArray(payload?.shifts)?payload.shifts:[]).filter(s=>s&&/^\d{4}-\d{2}-\d{2}$/.test(s.date||"")&&/^\d{2}:\d{2}$/.test(s.start||"")&&/^\d{2}:\d{2}$/.test(s.end||"")).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
 }
 function renderWeek(){
  const label=portal.querySelector("#employeeWeekLabel"),content=portal.querySelector("#employeeWeekContent"),personal=portal.querySelector("#employeePersonalContent"),status=portal.querySelector("#employeePlanStatus");
  if(label)label.textContent=weekLabel(weekOffset);
  portal.querySelectorAll("[data-employee-week-step]").forEach(button=>button.disabled=loading);
  if(loading){
   if(status){status.textContent="Wird geladen …";status.classList.remove("is-empty");}
   if(content)content.innerHTML='<p class="employee-week-loading">Kalenderwoche wird geladen …</p>';
   if(personal)personal.innerHTML='<p class="employee-empty">Deine Dienste werden geladen …</p>';
   return;
  }
  const shifts=validShifts();
  const planExists=payload?.planExists===true;
  if(status){status.textContent=planExists?"Dienstplan angelegt":"Noch kein Dienstplan angelegt";status.classList.toggle("is-empty",!planExists);}
  if(!planExists){
   if(content)content.innerHTML='<div class="employee-plan-empty"><span class="employee-plan-empty-icon" aria-hidden="true">▦</span><strong>Für diese Kalenderwoche ist noch kein Dienstplan angelegt.</strong><p>Sobald die Leitung den Plan erstellt, erscheint hier die Teamübersicht.</p></div>';
   if(personal)personal.innerHTML='<p class="employee-empty">Deine Dienste erscheinen hier, sobald der Wochenplan angelegt ist.</p>';
   return;
  }
  const groups=[...new Set(shifts.map(s=>String(s.group||"Team")))];
  if(content){
   const days=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
   const monday=weekMonday(weekOffset);
   const cards=days.map((day,index)=>{
    const date=new Date(monday);date.setDate(monday.getDate()+index);
    const dateText=new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit"}).format(date);
    const dayKey=isoDate(date);
    const dayShifts=shifts.filter(s=>s.date===dayKey).sort((a,b)=>a.start.localeCompare(b.start)||String(a.group||"").localeCompare(String(b.group||"")));
    const rows=dayShifts.length?dayShifts.map(s=>{
     const own=s.person===payload?.employeeName;
     return '<article class="employee-overview-shift'+(own?' is-own':'')+'"><div class="employee-overview-shift-top"><strong>'+escapeHTML(s.person||"Team")+'</strong><span class="employee-shift-group">'+escapeHTML(s.group||"Team")+'</span></div><time>'+escapeHTML(s.start)+'–'+escapeHTML(s.end)+'</time><small>'+escapeHTML(s.serviceType||"Dienst")+'</small></article>';
    }).join(""):'<p class="employee-day-empty">Keine Dienste</p>';
    return '<section class="employee-day-card"><header><h3>'+day+'</h3><time>'+dateText+'</time></header><div class="employee-day-shifts">'+rows+'</div></section>';
   }).join("");
   content.innerHTML='<div class="employee-week-summary"><strong>'+shifts.length+' '+(shifts.length===1?'Dienst':'Dienste')+'</strong><span>'+groups.length+' '+(groups.length===1?'Gruppe':'Gruppen')+'</span></div><div class="employee-week-board">'+cards+'</div>';
  }
  if(personal){
   const own=shifts.filter(s=>s.person===payload?.employeeName);
   personal.innerHTML=own.length?'<ol class="employee-shift-list">'+own.map(s=>{
    const date=new Date(s.date+"T12:00:00");
    const label=new Intl.DateTimeFormat("de-DE",{weekday:"long",day:"numeric",month:"long"}).format(date);
    return '<li class="employee-shift"><div><strong>'+escapeHTML(label)+'</strong><span>'+escapeHTML(s.group||"Team")+' · '+escapeHTML(s.serviceType||"Dienst")+'</span></div><time>'+escapeHTML(s.start)+'–'+escapeHTML(s.end)+'</time></li>';
   }).join("")+'</ol>':'<p class="employee-empty">Für dich sind in dieser Kalenderwoche keine Dienste eingetragen.</p>';
  }
 }
 async function loadWeek(offset){
  if(loading)return;
  weekOffset=offset;loading=true;renderWeek();
  const result=await cloud.functions.invoke("employee-schedule",{body:{weekOffset}});
  loading=false;
  if(result.error||!result.data){
   const content=portal.querySelector("#employeeWeekContent"),personal=portal.querySelector("#employeePersonalContent"),status=portal.querySelector("#employeePlanStatus");
   if(status){status.textContent="Laden fehlgeschlagen";status.classList.add("is-empty");}
   if(content)content.innerHTML='<div class="employee-plan-empty employee-load-error"><strong>Diese Kalenderwoche konnte nicht geladen werden.</strong><p>Bitte versuche es erneut.</p><button class="btn small" type="button" data-employee-week-retry>Erneut laden</button></div>';
   if(personal)personal.replaceChildren();
   portal.querySelectorAll("[data-employee-week-step]").forEach(button=>button.disabled=false);
   return;
  }
  payload=result.data;
  weekOffset=Number.isInteger(payload.weekOffset)?payload.weekOffset:offset;
  renderWeek();
 }
 portal.addEventListener("click",event=>{
  const step=event.target.closest("[data-employee-week-step]");
  if(step){loadWeek(weekOffset+Number(step.dataset.employeeWeekStep));return;}
  if(event.target.closest("[data-employee-week-retry]"))loadWeek(weekOffset);
 });
 portal.querySelector("[data-employee-logout]")?.addEventListener("click",async event=>{const button=event.currentTarget;button.disabled=true;await cloud.auth.signOut();cloudReady=false;cloudUser=null;removeEmployeePortal();showCloudLogin("Du wurdest abgemeldet.")});
 renderWeek();
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
let calendarMonthOffset = 0;
let selectedGroup = "Alle Gruppen";
let events = [];
let absences = [];
let closures = [];
let shifts = [];
const baseMonday = (()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d})();
function dateForDay(day, offset=weekOffset){const d=new Date(baseMonday);d.setDate(d.getDate()+offset*7+day);return d}
function fmt(d,opts={day:"2-digit",month:"2-digit"}){return new Intl.DateTimeFormat("de-DE",opts).format(d)}
function isoCalendarWeek(date){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-yearStart)/86400000)+1)/7)}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function weekLabel(){return "KW "+isoCalendarWeek(dateForDay(0))+" · Mo. "+fmt(dateForDay(0))+" – So. "+fmt(dateForDay(6))+" "+dateForDay(6).getFullYear()}
function initShifts(){ /* Neue Dienstpläne starten leer. */ }
function weekShifts(offset=weekOffset){return shifts.filter(s=>(s.weekOffset??0)===offset)}
function weekLabelForOffset(offset){return "KW "+isoCalendarWeek(dateForDay(0,offset))+" · Mo. "+fmt(dateForDay(0,offset))+" – So. "+fmt(dateForDay(6,offset))+" "+dateForDay(6,offset).getFullYear()}
function coverageRequirement(day,time,group){
 const early=time>=435&&time<480,late=time>=900&&time<975,core=time>=480&&time<900;
 if(early&&plannerSettings.mergeEarlyGroups)return {scope:"combined",required:Number(plannerSettings.minimumEarlyCombined)||0,weight:2.5,label:"Frühdienst gemeinsam"};
 if(late&&plannerSettings.mergeLateGroups)return {scope:"combined",required:Number(plannerSettings.minimumLateCombined)||0,weight:2.5,label:"Spätdienst gemeinsam"};
 if(early)return {scope:"group",required:Number(plannerSettings.minimumEarlyByGroup[group])||0,weight:2.5,label:"Frühdienst"};
 if(late)return {scope:"group",required:Number(plannerSettings.minimumLateByGroup[group])||0,weight:2.5,label:"Spätdienst"};
 if(core)return {scope:"group",required:Number(plannerSettings.minimumByGroup[group])||0,weight:2,label:"Kernzeit"};
 return {scope:"none",required:0,weight:0,label:""};
}
function shiftPause(s){
 const span=minutes(s.end)-minutes(s.start);
 if(span<=360)return null;
 const start=minutes(s.start)+240;
 const duration=span>570?45:30;
 return {start,end:Math.min(start+duration,minutes(s.end))};
}
function shiftWorkMinutes(s){
 const span=minutes(s.end)-minutes(s.start),pause=shiftPause(s);
 return Math.max(0,span-(pause?pause.end-pause.start:0));
}
function weeklyManualShiftMinutes(person,assigned=weekShifts(weekOffset)){
 return assigned.filter(s=>s.person===person.name&&!s.generated).reduce((sum,s)=>sum+shiftWorkMinutes(s),0);
}
function regularHoursNeeded(person,offset=weekOffset,assigned=weekShifts(offset)){
 const contract=Math.max(0,Number(person.hours)||0),eventsHours=eventMinutesForPersonWeek(person,offset)/60,manualHours=weeklyManualShiftMinutes(person,assigned)/60;
 return Math.max(0,Math.round((contract-eventsHours-manualHours)*4)/4);
}
function dailyPlanningTarget(target,assigned,remainingDays){
 if(remainingDays<=0)return 0;
 const remaining=Math.max(0,target-assigned);
 return Math.min(remaining,Math.ceil((remaining/remainingDays)*4)/4);
}
function shiftCoversTime(s,time){
 const pause=shiftPause(s);
 return minutes(s.start)<=time&&minutes(s.end)>time&&!(pause&&time>=pause.start&&time<pause.end);
}
function countCoverage(assigned,day,time,group,scope){
 return assigned.filter(x=>(!x.serviceType||x.serviceType==="Normaler Dienst")&&x.day===day&&shiftCoversTime(x,time)&&(scope==="combined"||x.group===group)).length;
}
function scoreShiftCoverage(assigned,person,day,start,end){
 let score=0;
 for(let time=435;time<975;time+=15){
  if(time<start||time>=end)continue;
  const span=end-start,pauseMinutes=span>570?45:span>360?30:0,pause=pauseMinutes?{start:start+240,end:Math.min(start+240+pauseMinutes,end)}:null;if(pause&&time>=pause.start&&time<pause.end)continue;
  const demand=coverageRequirement(day,time,person.group);
  if(!demand.required)continue;
  const count=countCoverage(assigned,day,time,person.group,demand.scope);
  if(count<demand.required)score+=demand.weight*(1+(demand.required-count)*0.25);
  else score-=0.08;
 }
 return score;
}
function inspectCoverage(assigned,offset=weekOffset){
 const gaps=[];
 for(let day=0;day<5;day++)for(let time=435;time<975;time+=15){
  if(isClosureDay(day,offset))continue;
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
 const existing=weekShifts(),retained=existing.filter(s=>!s.generated);
 const generatedCount=existing.length-retained.length;
 if(generatedCount&&!confirm("Vorhandene automatische Dienste dieser Woche werden neu erstellt. Manuell eingetragene Dienste und Sonderdienste bleiben erhalten. Fortfahren?"))return;
 const people=planningPeople(),frameStart=minutes(plannerSettings.frame.start),frameEnd=minutes(plannerSettings.frame.end);
 if(frameEnd<=frameStart){alert("Die allgemeine Rahmenzeit ist ungültig.");return}
 const created=[],unavailable=[];
 const planned=[...retained];
 const ordered=people.map((person,index)=>({person,index})).sort((a,b)=>{
  const aGroup=people.filter(p=>p.group===a.person.group).length,bGroup=people.filter(p=>p.group===b.person.group).length;
  return aGroup-bGroup||Number(b.person.hours||0)-Number(a.person.hours||0);
 });
 const tm=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
 for(const {person:p,index} of ordered){
  const target=regularHoursNeeded(p,weekOffset,retained);
  if(target<0.25)continue;
  let assigned=0;
  for(let day=0;day<5;day++){
   if(!personWorksOnDay(p,day))continue;
   const absence=blockingAbsence(p,day,weekOffset);
   if(absence){unavailable.push(p.name+" · "+weekdays[day]+" (Abwesenheit: "+absence.type+")");continue}
   const remainingDays=Array.from({length:5-day},(_,i)=>day+i).filter(nextDay=>personWorksOnDay(p,nextDay)&&!blockingAbsence(p,nextDay,weekOffset)).length;
   let remaining=dailyPlanningTarget(target,assigned,remainingDays),guard=0;
   while(remaining>=0.25&&guard++<40){
    const candidates=[];
    for(let duration=Math.min(Math.floor(remaining*4)*15,frameEnd-frameStart);duration>=15;duration-=15){
     const breakMinutes=duration>540?45:duration>360?30:0,span=duration+breakMinutes;
     for(let start=frameStart;start+span<=frameEnd;start+=15){
      const from=tm(start),to=tm(start+span);
      if(isBlocked(p,day,from,to,weekOffset)||personHasEventConflict(p,day,from,to,weekOffset)||shiftRuleConflicts(p,day,from,to,weekOffset,planned).length)continue;
      if(planned.some(x=>x.person===p.name&&x.day===day&&(x.weekOffset??weekOffset)===weekOffset&&minutes(from)<minutes(x.end)&&minutes(to)>minutes(x.start)))continue;
      const coverage=scoreShiftCoverage(planned,p,day,start,start+span);
      const fairness=assigned/Math.max(1,target);
      candidates.push({start:from,end:to,duration:span,workDuration:duration,score:coverage-duration/60*0.03-fairness*0.01});
     }
     if(candidates.length)break;
    }
    if(!candidates.length)break;
    candidates.sort((x,y)=>y.score-x.score||minutes(x.start)-minutes(y.start));
    const slot=candidates[0];
    const createdShift={id:"s"+Date.now()+"-"+index+"-"+day+"-"+created.length+"-"+Math.random().toString(36).slice(2,6),person:p.name,group:p.group,serviceType:"Normaler Dienst",day,start:slot.start,end:slot.end,color:p.group==="Nest"?"green":p.group==="Sonnengruppe"?"blue":p.group==="Sternengruppe"?"purple":"yellow",weekOffset,generated:true};
    created.push(createdShift);planned.push(createdShift);
    const hours=slot.workDuration/60;assigned+=hours;remaining-=hours;
   }
  }
  const personRemaining=Math.max(0,target-assigned);
  if(personRemaining>=0.25)unavailable.push(p.name+" · "+personRemaining.toFixed(2).replace(".",",")+" Std. konnten in dieser Woche wegen Rahmenzeit, Terminen oder Dienstsperren nicht untergebracht werden");
 }
 const validation=weeklyPlanningDiagnostics(weekOffset,planned),gaps=validation.gaps,groupedGaps=new Map();
 gaps.forEach(g=>{const key=g.group+" · "+weekdays[g.day]+" "+g.label;const old=groupedGaps.get(key);if(!old||g.count<old.count)groupedGaps.set(key,g)});
 const summary=[...groupedGaps.entries()].map(([label,g])=>label+" ("+g.count+"/"+g.required+")");
 const hourSummary=validation.hourRows.filter(x=>x.diff<-.01).map(x=>x.name+": "+Math.max(0,-x.diff).toFixed(2).replace(".",",")+" Std. offen");
 const overHourSummary=validation.hourRows.filter(x=>x.diff>.01).map(x=>x.name+": "+x.diff.toFixed(2).replace(".",",")+" Std. über Soll");
 const hardIssues=validation.absenceConflicts.length+validation.blockConflicts.length+validation.overlaps.length+validation.workRuleConflicts.length+validation.eventConflicts.length+validation.closureConflicts.length;
 if(hardIssues){alert("Plan wurde nicht übernommen: Die Vorprüfung hat "+hardIssues+" harte Regelkonflikte gefunden. Bitte prüfe Abwesenheiten, Dienstsperren und Überschneidungen.");return}
 const totalTarget=validation.hourRows.reduce((n,x)=>n+x.target,0),totalAssigned=validation.hourRows.reduce((n,x)=>n+x.actual,0);
 const preview="Vorprüfung des neuen Dienstplans:\n• "+created.length+" neue Dienste\n• "+retained.length+" manuelle Dienste bleiben erhalten\n• "+totalAssigned.toFixed(2).replace(".",",")+" von "+totalTarget.toFixed(2).replace(".",",")+" Sollstunden verteilt\n• "+gaps.length+" Unterbesetzungsintervalle\n• "+hourSummary.length+" Personen mit nicht verteilten Stunden\n• "+overHourSummary.length+" Personen über Sollstunden"+(summary.length?"\n\nBeispiele Unterbesetzung: "+summary.slice(0,5).join("; "):"")+(hourSummary.length?"\n\nNicht verteilte Stunden: "+hourSummary.slice(0,5).join("; "):"")+(overHourSummary.length?"\n\nStunden über Soll: "+overHourSummary.slice(0,5).join("; "):"")+".\n\nPlan trotz dieser Hinweise übernehmen?";
 if((gaps.length||hourSummary.length||overHourSummary.length)&&!confirm(preview))return;
 shifts=shifts.filter(s=>(s.weekOffset??0)!==weekOffset||!s.generated);shifts.push(...created);
 scheduleCloudSave();render();
 alert("Bedarfsorientierte Wochenplanung für "+weekLabel()+" erstellt: "+created.length+" neue Dienste. Manuelle Dienste und Sonderdienste wurden erhalten. Geplante Wochenstunden inklusive Sondertermine: "+totalAssigned.toFixed(2).replace(".",",")+" von "+totalTarget.toFixed(2).replace(".",",")+" Sollstunden. "+(hourSummary.length?"Nicht vollständig verteilte Stunden: "+hourSummary.join("; ")+". ":"Alle verfügbaren Sollstunden wurden verplant. ")+(overHourSummary.length?"Über Sollstunden: "+overHourSummary.join("; ")+". ":"")+(unavailable.length?"Einschränkungen: "+unavailable.slice(0,15).join("; ")+(unavailable.length>15?" …":"")+". ":"")+(summary.length?"Mindestbesetzung noch nicht erreicht: "+summary.slice(0,12).join("; ")+(summary.length>12?" …":"")+". ":"Alle hinterlegten Mindestbesetzungen sind erreicht. ")+"Nicht unterzubringende Stunden werden ausdrücklich ausgewiesen und nicht stillschweigend verworfen.");
}
function copyWeekForward(){const source=weekShifts();if(!source.length){alert("In dieser Woche gibt es keine Dienste zum Kopieren.");return}const targetOffset=weekOffset+1,target=weekShifts(targetOffset);if(target.length&&!confirm("Die Folgewoche enthält bereits "+target.length+" Dienste. Diese werden ersetzt. Fortfahren?"))return;const copied=[],skipped=[];source.forEach((x,i)=>{const person=planningPeople().find(p=>p.name===x.person),absence=person?blockingAbsence(person,x.day,targetOffset):null,closure=isClosureDay(x.day,targetOffset),blocked=person&&isBlocked(person,x.day,x.start,x.end,targetOffset),overlap=person&&target.some(y=>y.person===x.person&&y.day===x.day&&minutes(x.start)<minutes(y.end)&&minutes(x.end)>minutes(y.start));const eventConflict=person&&personHasEventConflict(person,x.day,x.start,x.end,targetOffset);if(absence||closure||blocked||overlap||eventConflict){skipped.push(x.person+" · "+weekdays[x.day]+" ("+(absence?"Abwesenheit: "+absence.type:closure?"Einrichtung geschlossen":blocked?"feste Dienstsperre":eventConflict?"Terminüberschneidung":"Zeitüberschneidung")+")");return}copied.push({...x,id:"s"+Date.now()+"-copy-"+i+"-"+Math.random().toString(36).slice(2,6),weekOffset:targetOffset,generated:false})});shifts=shifts.filter(s=>(s.weekOffset??0)!==targetOffset);shifts.push(...copied);scheduleCloudSave();render();alert(copied.length+" Dienste nach "+weekLabelForOffset(targetOffset)+" kopiert."+ (skipped.length?" Nicht kopiert wegen Abwesenheiten, Schließzeiten, Dienstsperren oder Terminkonflikten: "+skipped.join("; ")+".":"")+" Öffne mit „Nächste“ die Folgewoche.");}
function minutes(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function sanitizeHTML(markup){const template=document.createElement("template");template.innerHTML=String(markup??"");template.content.querySelectorAll("script,style,iframe,object,embed,base,meta").forEach(node=>node.remove());template.content.querySelectorAll("*").forEach(node=>[...node.attributes].forEach(attr=>{const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase();if(name.startsWith("on")||name==="srcdoc"||((name==="href"||name==="src"||name==="xlink:href"||name==="action"||name==="formaction"||name==="poster")&&(value.startsWith("javascript:")||value.startsWith("vbscript:")||value.startsWith("data:text/html")))||(name==="style"&&(value.includes("expression(")||value.includes("javascript:"))))node.removeAttribute(attr.name);}));return template.innerHTML;}
function easterSunday(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(year,month-1,day,12);}
function nrwPublicHolidays(year){const e=easterSunday(year),add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return iso(x);};return new Set([year+"-01-01",year+"-05-01",year+"-10-03",year+"-11-01",year+"-12-25",year+"-12-26",add(e,-2),add(e,1),add(e,39),add(e,50),add(e,60)]);}
function isClosureDate(date){return closures.some(c=>date>=c.from&&date<=c.to)}
function isClosureDay(day,offset=weekOffset){return isClosureDate(iso(dateForDay(day,offset)))}
function isWorkingDay(date){const d=new Date(date+"T12:00:00");return d.getDay()!==0&&d.getDay()!==6&&!nrwPublicHolidays(d.getFullYear()).has(date)&&!isClosureDate(date);}
function shiftRuleConflicts(person,day,start,end,offset=weekOffset,assigned=shifts,excludeId=null){const issues=[],span=minutes(end)-minutes(start),sameDay=assigned.filter(x=>x.person===person.name&&x.day===day&&(x.weekOffset??offset)===offset&&x.id!==excludeId),dailyWork=sameDay.reduce((sum,x)=>sum+shiftWorkMinutes(x),0)+shiftWorkMinutes({start,end});if(dailyWork>600)issues.push("Tägliche Arbeitszeit über zehn Stunden");if(shiftWorkMinutes({start,end})>360&&!shiftPause({start,end}))issues.push("Pause fehlt");const date=dateForDay(day,offset),prev=assigned.filter(x=>x.person===person.name&&x.id!==excludeId).map(x=>({...x,date:dateForDay(x.day,x.weekOffset??offset)}));for(const x of prev){const diff=Math.round((date-x.date)/86400000);if(diff===1&&minutes(start)+1440-minutes(x.end)<660)issues.push("Ruhezeit unter elf Stunden");if(diff===-1&&minutes(x.start)+1440-minutes(end)<660)issues.push("Ruhezeit unter elf Stunden");}return issues;}
function personBlocks(person){if(!Array.isArray(person.blocks))person.blocks=[];if(person.isLeader)leaderProfile.blocks=person.blocks;return person.blocks}
function calendarDaysBetween(from,to){if(!from||!to||to<from)return 0;const start=new Date(from+"T12:00:00"),end=new Date(to+"T12:00:00");let count=0;for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const day=iso(d);if(isWorkingDay(day))count++}return count}
function personWorkingDays(person){return Array.isArray(person?.workdays)?person.workdays.map(Number):[0,1,2,3,4]}
function personWorksOnDay(person,day,offset=weekOffset){return personWorkingDays(person).includes(Number(day))&&!isClosureDay(day,offset)}
function vacationDaysForPerson(person,from,to){if(!from||!to||to<from)return 0;const workingDays=new Set(personWorkingDays(person)),start=new Date(from+"T12:00:00"),end=new Date(to+"T12:00:00");let count=0;for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const date=iso(d),weekday=(d.getDay()+6)%7;if(workingDays.has(weekday)&&isWorkingDay(date))count++}return count}
function vacationDaysForPersonInYear(person,absence,year){const from=absence.from>year+"-01-01"?absence.from:year+"-01-01",to=absence.to<year+"-12-31"?absence.to:year+"-12-31";return to<from?0:vacationDaysForPerson(person,from,to)}
function blockingAbsence(person,day,offset=weekOffset){const date=iso(dateForDay(day,offset));return absences.find(a=>a.name===person.name&&a.status!=="Offen"&&date>=a.from&&date<=a.to)||null}
function absenceDays(absence){const person=names.find(p=>p.name===absence.name);return absence.type==="Urlaub"?(person?vacationDaysForPerson(person,absence.from,absence.to):calendarDaysBetween(absence.from,absence.to)):(absence.days??calendarDaysBetween(absence.from,absence.to))}
function vacationDaysInYear(absence,year){const from=absence.from>year+"-01-01"?absence.from:year+"-01-01",to=absence.to<year+"-12-31"?absence.to:year+"-12-31";return to<from?0:calendarDaysBetween(from,to);}
function usedVacation(person,year=new Date().getFullYear()){return absences.filter(a=>a.name===person.name&&a.type==="Urlaub"&&a.status!=="Offen").reduce((sum,a)=>sum+vacationDaysForPersonInYear(person,a,year),0)}
function remainingVacation(person,year=new Date().getFullYear()){return Math.max(0,Number(person.vacation||0)-usedVacation(person,year))}

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
 const gaps=inspectCoverage(coverageShifts,offset),hourRows=people.map(p=>{const target=Math.max(0,Number(p.hours)||0),shiftHours=planned.filter(x=>x.person===p.name).reduce((n,x)=>n+shiftWorkMinutes(x)/60,0),eventHours=eventMinutesForPersonWeek(p,offset)/60,actual=shiftHours+eventHours;return {name:p.name,target,actual,shiftHours,eventHours,diff:actual-target}});
 const absenceConflicts=[],blockConflicts=[],overlaps=[],workRuleConflicts=[],eventConflicts=[],closureConflicts=[];
 planned.forEach(x=>{const p=people.find(y=>y.name===x.person);if(!p)return;if(isClosureDay(x.day,offset))closureConflicts.push(x.person+" · "+weekdays[x.day]+" · Einrichtung geschlossen");const absence=blockingAbsence(p,x.day,offset);if(absence)absenceConflicts.push(x.person+" · "+weekdays[x.day]+" · "+absence.type);if(isBlocked(p,x.day,x.start,x.end,offset))blockConflicts.push(x.person+" · "+weekdays[x.day]+" "+x.start+"–"+x.end);const rules=shiftRuleConflicts(p,x.day,x.start,x.end,offset,planned,x.id);rules.forEach(rule=>workRuleConflicts.push(x.person+" · "+weekdays[x.day]+" · "+rule));if(personHasEventConflict(p,x.day,x.start,x.end,offset))eventConflicts.push(x.person+" · "+weekdays[x.day]+" · Terminüberschneidung");});
 for(let i=0;i<planned.length;i++)for(let j=i+1;j<planned.length;j++){const a=planned[i],b=planned[j];if(a.person===b.person&&a.day===b.day&&minutes(a.start)<minutes(b.end)&&minutes(a.end)>minutes(b.start))overlaps.push(a.person+" · "+weekdays[a.day]+" "+a.start+"–"+a.end+" / "+b.start+"–"+b.end);}
 return {gaps,hourRows,absenceConflicts,blockConflicts,overlaps,workRuleConflicts,eventConflicts,closureConflicts};
}
function renderPlanningDiagnostics(offset=weekOffset){
 const d=weeklyPlanningDiagnostics(offset),totalGaps=d.gaps.length,under=d.hourRows.filter(x=>x.diff<-.01),over=d.hourRows.filter(x=>x.diff>.01),issues=d.absenceConflicts.length+d.blockConflicts.length+d.overlaps.length+d.workRuleConflicts.length+d.eventConflicts.length+d.closureConflicts.length;
 const lines=[];
 if(totalGaps)lines.push('<li><strong>'+totalGaps+' Unterbesetzungsintervalle</strong> in der Mindestbesetzung; Beispiele: '+d.gaps.slice(0,5).map(x=>weekdays[x.day]+' '+String(Math.floor(x.time/60)).padStart(2,"0")+':'+String(x.time%60).padStart(2,"0")+' · '+x.group+' · '+x.label+' '+x.count+'/'+x.required).join('; ')+'</li>');
 else lines.push('<li>Alle eingetragenen Mindestbesetzungen sind in den geprüften Zeitintervallen erreicht.</li>');
 if(under.length)lines.push('<li><strong>Nicht verteilte Sollstunden:</strong> '+under.map(x=>x.name+' '+Math.max(0,-x.diff).toFixed(2).replace(".",",")+' Std.').join('; ')+'</li>');
 if(over.length)lines.push('<li><strong>Über Soll:</strong> '+over.map(x=>x.name+' '+x.diff.toFixed(2).replace(".",",")+' Std.').join('; ')+'</li>');
 if(issues)lines.push('<li><strong>Regelkonflikte:</strong> '+d.absenceConflicts.length+' Abwesenheit, '+d.blockConflicts.length+' feste Sperre(n), '+d.overlaps.length+' Überschneidung(en), '+d.workRuleConflicts.length+' Arbeitszeitregel(n), '+d.eventConflicts.length+' Terminüberschneidung(en), '+d.closureConflicts.length+' Schließtag-Konflikt(e).</li>');
 else lines.push('<li>Keine Konflikte mit Abwesenheiten, festen Sperren oder Doppelbelegungen gefunden.</li>');
 return '<section class="card planning-diagnostics"><div class="card-header"><div><h2>Planprüfung</h2><p>Automatische Kontrolle der Mindestbesetzung, Sollstunden und harten Verfügbarkeitsregeln.</p></div><span class="status-pill '+(totalGaps||under.length||over.length||issues?'status-warning':'status-ok')+'">'+(totalGaps||under.length||over.length||issues?'Prüfung erforderlich':'Keine Auffälligkeiten')+'</span></div><div class="card-body"><ul class="diagnostic-list">'+lines.join("")+'</ul><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Soll</th><th>Geplant</th><th>Abweichung</th></tr></thead><tbody>'+d.hourRows.map(x=>'<tr><td>'+x.name+'</td><td>'+x.target.toFixed(2).replace(".",",")+' h</td><td>'+x.actual.toFixed(2).replace(".",",")+' h</td><td class="'+(Math.abs(x.diff)<.01?'':'status-warning')+'">'+(x.diff>0?'+':'')+x.diff.toFixed(2).replace(".",",")+' h</td></tr>').join("")+'</tbody></table></div></div></section>';
}
function renderCoverageStrip(coverageShifts){
 const periods=[{key:"early",label:"Früh",start:435,end:480,time:"07:15–08:00"},{key:"core",label:"Kerndienst",start:480,end:900,time:"08:00–15:00"},{key:"late",label:"Spät",start:900,end:975,time:"15:00–16:15"}];
 return periods.map(period=>{
  const times=[];for(let t=period.start;t<period.end;t+=15)times.push(t);
  const merged=(period.key==="early"&&plannerSettings.mergeEarlyGroups)||(period.key==="late"&&plannerSettings.mergeLateGroups);
  const minimum=period.key==="core"?plannerSettings.minimumByGroup:period.key==="early"?plannerSettings.minimumEarlyByGroup:plannerSettings.minimumLateByGroup;
  const countAt=(t,g)=>coverageShifts.filter(s=>shiftCoversTime(s,t)&&(merged||s.group===g)).length;
  const entries=merged?[{label:"Gemeinsam",required:Number(period.key==="early"?plannerSettings.minimumEarlyCombined:plannerSettings.minimumLateCombined)||0,count:Math.min(...times.map(t=>countAt(t,groups[0])))}]:groups.map(g=>({label:g,required:Number(minimum[g])||0,count:Math.min(...times.map(t=>countAt(t,g)))}));
  const relevant=entries.filter(x=>x.required>0),deficient=relevant.some(x=>x.count<x.required),exact=relevant.some(x=>x.count===x.required);
  const status=deficient?"coverage-low":exact?"coverage-watch":"coverage-ok";
  const detail=entries.map(x=>x.label+" "+x.count+"/"+x.required).join(" · ");
  const rows=entries.map(x=>'<span class="day-coverage-entry"><span class="day-coverage-group">'+x.label+'</span><strong>'+x.count+'/'+x.required+'</strong></span>').join("");
  return '<div class="day-coverage '+status+'" title="'+detail+'"><div class="day-coverage-title"><strong>'+period.label+'</strong><small>'+period.time+'</small></div><div class="day-coverage-entries">'+rows+'</div></div>';
 }).join("");
}
function pageIcon(){return ({dashboard:"home",dienstplan:"calendar",kalender:"calendar",mitarbeitende:"users",abwesenheiten:"calendar",sondertermine:"calendar",teammeetings:"users",supervision:"users",fortbildungen:"briefcase",auswertungen:"chart",einstellungen:"settings",leitungsprofil:"user"})[currentPage]||"home"}
function heading(title,sub,action='<button class="btn primary" data-action="add-event">＋ Eintrag hinzufügen</button>'){return `<div class="page-heading"><div><div class="eyebrow">Früh bis spät · Kita-Planung</div><div class="page-title-line"><span class="page-title-icon">${uiIcon(pageIcon())}</span><div><h1>${title}</h1><p>${sub}</p></div></div></div><div class="actions">${action}</div></div>`}
function card(title,body,extra=""){const key=/Arbeitszeit|Büro|Wochenstunden/.test(title)?"clock":/Zugang|Passwort/.test(title)?"lock":/Personal|Mitarbeitende|Team/.test(title)?"users":/Auswertung|Kennzahl/.test(title)?"chart":/Einstellung|Verwaltung/.test(title)?"settings":/Termin|Kalender/.test(title)?"calendar":"briefcase";return `<section class="card ${extra}"><div class="card-header"><h2><span class="card-title-icon">${uiIcon(key)}</span>${title}</h2></div><div class="card-body">${body}</div></section>`}
function personTable(compact=false){return `<div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Stammgruppe</th><th>Wochenstunden</th><th>Arbeitstage</th><th>Resturlaub</th><th>Sonderdienste</th><th>Teammeetings</th><th>Supervision</th><th>Aktion</th></tr></thead><tbody>${names.length?names.map(p=>`<tr><td><div class="person-cell"><span class="person-avatar">${p.initials}</span><strong>${p.name}</strong></div></td><td>${p.group}</td><td>${p.hours} Std.</td><td>${personWorkingDays(p).map(i=>weekdays[i]).join(", ")}</td><td><span class="pill green">${remainingVacation(p)} Tage</span></td><td><span class="pill ${p.special>2?'yellow':'blue'}">${p.special}</span></td><td><span class="pill purple">${p.meetings}</span></td><td><span class="pill blue">${p.supervision}</span></td><td><div class="inline-actions"><button class="btn small" data-edit-person="${p.name}">Bearbeiten</button><button class="btn small danger" data-remove-person="${p.name}">Entfernen</button></div></td></tr>`).join(""):'<tr><td colspan="9"><div class="empty-state"><strong>Noch keine Mitarbeitenden angelegt</strong>Über „Mitarbeitende hinzufügen“ kannst du dein Team selbst einrichten.</div></td></tr>'}</tbody></table></div>`}
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
  const date=dateForDay(i),dayShifts=visibleShifts.filter(s=>s.day===i),dayClosures=closures.filter(c=>iso(date)>=c.from&&iso(date)<=c.to);
  const staffHeaders=people.map(p=>`<div class="outlook-staff-head ${groupColor(p.group)}"><span class="person-avatar">${p.initials}</span><strong>${p.name}</strong><small>${p.group}</small></div>`).join("");
  const timeAxis=Array.from({length:9},(_,n)=>{const h=6+n*2;return `<span style="top:${n/8*100}%">${String(h).padStart(2,"0")}:00</span>`}).join("");
  const columns=people.map(p=>{
   const personShifts=dayShifts.filter(s=>s.person===p.name);
   const dayDate=iso(date),dayAbsences=absences.filter(a=>a.name===p.name&&dayDate>=a.from&&dayDate<=a.to);
   const absenceBlocks=dayAbsences.map(a=>'<div class="outlook-absence" title="'+escapeHTML(a.type)+' · '+escapeHTML(a.status||"Erfasst")+'"><strong>'+escapeHTML(a.type)+'</strong><span>Ganztägig'+(a.status==="Offen"?" · Offen":"")+'</span></div>').join("");
   const eventBlocks=events.filter(ev=>eventOccursOnDate(ev,dayDate)&&(ev.attendees||[]).includes(p.name)).map(ev=>{const [from,to]=ev.time.split("–");const cls=ev.type==="Meeting"?"event-meeting":ev.type==="Supervision"?"event-supervision":ev.type==="Fortbildung"?"event-training":"event-special";return '<div class="outlook-event '+cls+'" style="top:'+topPercent(from)+'%;height:'+heightPercent(from,to)+'%" title="'+escapeHTML(ev.title)+' · '+ev.time+'"><strong>'+ev.time+'</strong><span>'+escapeHTML(ev.title)+'</span></div>';}).join("");
   const blocks=personShifts.map(s=>{const pause=shiftPause(s),span=minutes(s.end)-minutes(s.start);const pauseDuration=pause?pause.end-pause.start:0,pauseMarkup=pause?'<span class="pause-marker" style="top:'+((pause.start-minutes(s.start))/span*100)+'%;height:'+(pauseDuration/span*100)+'%">Pause · '+pauseDuration+' Min.</span>':'';return '<button class="outlook-shift '+shiftClass(s)+'" style="'+shiftPosition(s)+'" data-edit-shift="'+s.id+'" title="'+s.person+': '+s.start+'–'+s.end+(pause?' · Pause '+pauseDuration+' Min.':'')+'"><i class="shift-resize-handle shift-resize-start" data-resize-shift="'+s.id+'" data-resize-edge="start" title="Ziehen, um den Dienstbeginn zu ändern" aria-label="Dienstbeginn ziehen"></i><strong>'+s.start+'–'+s.end+'</strong><span>'+(s.serviceType&&s.serviceType!=="Normaler Dienst"?s.serviceType:s.group)+'</span>'+pauseMarkup+'<i class="shift-resize-handle shift-resize-end" data-resize-shift="'+s.id+'" data-resize-edge="end" title="Ziehen, um das Dienstende zu ändern" aria-label="Dienstende ziehen"></i></button>'}).join("");
   return `<div class="outlook-staff-column"><div class="outlook-time-grid"></div>${absenceBlocks}${eventBlocks}${blocks}</div>`;
  }).join("");
  const coverageShifts=dayShifts.filter(s=>!s.serviceType||s.serviceType==="Normaler Dienst");const cover=renderCoverageStrip(coverageShifts);
  const dayEvents=events.filter(event=>eventOccursOnDate(event,iso(date))),dayAbsenceCount=absences.filter(a=>iso(date)>=a.from&&iso(date)<=a.to).length;
  const closureStrip=dayClosures.length?`<div class="day-special-events closure-events" aria-label="Schließzeiten">${dayClosures.map(c=>`<div class="day-special-event closure-event"><strong>Einrichtung geschlossen</strong><span>${escapeHTML(c.label||"Kita geschlossen")}</span></div>`).join("")}</div>`:"";
  const eventStrip=(dayEvents.length?`<div class="day-special-events" aria-label="Sondertermine">${dayEvents.map(event=>`<div class="day-special-event"><strong>${event.time}</strong><span>${event.title}</span><small>${event.type}${event.repeatWeekly?" · wöchentlich":""}</small></div>`).join("")}</div>`:"")+closureStrip;
  return `<section class="day-calendar"><header class="day-calendar-head"><div><strong>${["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"][i]}, ${fmt(date)}</strong><span>${dayShifts.length} Dienste geplant · ${dayEvents.length} Termine · ${dayAbsenceCount} Abwesenheiten${dayClosures.length?" · Einrichtung geschlossen":""}</span></div><div class="day-coverage-strip" aria-label="Mindestbesetzung im Zeitfenster">${cover}</div></header>${eventStrip}<div class="outlook-calendar-scroll"><div class="outlook-calendar" style="--staff-count:${Math.max(1,people.length)}"><div class="outlook-corner">Zeit</div>${staffHeaders}<div class="outlook-time-axis">${timeAxis}</div>${columns}</div></div></section>`;
 }).join("");
 return heading("Dienstplan","Wochenkalender wie in Outlook · Mitarbeitende oben, Uhrzeiten links und alle Dienste pro Tag auf einer gemeinsamen Zeitachse.",'<button class="btn" data-action="prev-week">← Vorherige</button><button class="btn" data-action="next-week">Nächste →</button><button class="btn" data-action="copy-week">Woche kopieren →</button><button class="btn" data-action="print-plan">PDF exportieren</button><button class="btn primary" data-action="generate-plan">Diese Woche automatisch planen</button><button class="btn primary" data-action="add-shift">＋ Dienst eintragen</button>')+
 `<section class="card"><div class="card-header"><div><h2>${weekLabel()}</h2><p>Jeder Tag hat eine gemeinsame vertikale Zeitachse von 06:00 bis 22:00 Uhr. Schichten überlappen zeitlich nebeneinander in den Mitarbeiterspalten. Zum Bearbeiten einen Dienst anklicken.</p></div><button class="btn primary save-plan-button" type="button" data-action="save-plan">Jetzt speichern</button></div><div class="schedule-toolbar"><select id="groupFilter" class="select-control" aria-label="Gruppe filtern"><option>Alle Gruppen</option>${groups.map(g=>`<option ${selectedGroup===g?'selected':''}>${g}</option>`).join("")}</select><div class="legend"><span style="--legend:#9adbb9">Normaler Dienst</span><span style="--legend:#b69af7">Meeting</span><span style="--legend:#83b8f7">Supervision</span><span style="--legend:#7cc9c7">Kirche</span><span style="--legend:#f0aa42">Fortbildung</span><span style="--legend:#f19aa5">Sonstiges</span></div></div><div class="day-calendar-list">${days}</div><div class="coverage-legend"><span class="coverage-low-key">0–1 Person</span><span class="coverage-watch-key">2 Personen</span><span class="coverage-ok-key">3+ Personen</span><span class="muted">Besetzungsstreifen je 2 Stunden; Schwellenwerte vorläufig.</span></div></section>${renderPlanningDiagnostics()}
 <div class="grid panel-two section-gap"><section class="card"><div class="card-header"><h2>Wochenstunden im Überblick</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Sollstunden</th><th>Geplant gesamt</th><th>Aufteilung</th><th>Status</th></tr></thead><tbody>${people.map(p=>{const personShifts=weekShifts().filter(s=>s.person===p.name),regularTotal=personShifts.filter(s=>!s.serviceType||s.serviceType==="Normaler Dienst").reduce((n,s)=>n+shiftWorkMinutes(s)/60,0),specialTotal=personShifts.filter(s=>s.serviceType&&s.serviceType!=="Normaler Dienst").reduce((n,s)=>n+shiftWorkMinutes(s)/60,0),eventTotal=eventMinutesForPersonWeek(p)/60,total=regularTotal+specialTotal+eventTotal;return `<tr><td>${p.name}</td><td>${p.hours} Std.</td><td>${total.toFixed(1)} Std.</td><td><small class="muted">${regularTotal.toFixed(1)} regulär · ${specialTotal.toFixed(1)} Sonderdienst · ${eventTotal.toFixed(1)} Termin</small></td><td><span class="pill ${total>p.hours?'red':total<p.hours?'yellow':'green'}">${total>p.hours?'Über Soll':total<p.hours?'Prüfen':'Passt'}</span></td></tr>`}).join("")}</tbody></table></div><p class="muted" style="font-size:10px">Reguläre Dienste, Sonderdienste und Termine zählen gemeinsam zur vertraglichen Wochenarbeitszeit. Automatische Planung berücksichtigt bereits eingetragene Zeiten.</p></div></section><section class="card"><div class="card-header"><h2>Planungsregeln</h2></div><div class="card-body"><div class="setting-row"><div><strong>Zeitraum</strong><small>Montag bis Sonntag</small></div><span class="pill blue">7 Tage</span></div><div class="setting-row"><div><strong>Tagesansicht</strong><small>06:00 bis 22:00 Uhr</small></div><span class="pill green">16 Stunden</span></div><div class="setting-row"><div><strong>Überschneidungen</strong><small>Gemeinsame Zeitachse je Tag</small></div><span class="pill blue">Sichtbar</span></div><div class="setting-row"><div><strong>Gruppenbedarf</strong><small>Über Einstellungen konfigurierbar</small></div><button class="btn small" data-page="einstellungen">Einstellen</button></div></div></section></div>`;
}
function eventOccursOnDate(event,date){if(event.date===date)return true;if(!event.repeatWeekly||date<event.date)return false;const d=new Date(date+"T12:00:00");return d.getDay()===Number(event.repeatDay);}
function eventDurationMinutes(event){const [start,end]=String(event.time||"").split("–");return start&&end?Math.max(0,minutes(end)-minutes(start)):0;}
function eventMinutesForPersonWeek(person,offset=weekOffset){let total=0;for(let day=0;day<7;day++){const date=iso(dateForDay(day,offset));for(const event of events){if(eventOccursOnDate(event,date)&&(event.attendees||[]).includes(person.name))total+=eventDurationMinutes(event);}}return total;}
function personHasEventConflict(person,day,start,end,offset=weekOffset){const date=iso(dateForDay(day,offset));return events.some(ev=>eventOccursOnDate(ev,date)&&(ev.attendees||[]).includes(person.name)&&minutes(start)<minutes(ev.time.split("–")[1])&&minutes(end)>minutes(ev.time.split("–")[0]));}
function calendarPage(){
 const anchor=dateForDay(0),first=new Date(anchor.getFullYear(),anchor.getMonth()+calendarMonthOffset,1);
 const year=first.getFullYear(),month=first.getMonth(),startDay=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate();
 const cells=Array.from({length:startDay},()=>'<div class="calendar-day blank"></div>');
 for(let day=1;day<=days;day++){const date=iso(new Date(year,month,day));const found=events.filter(e=>eventOccursOnDate(e,date)),dayShifts=shifts.filter(s=>iso(dateForDay(s.day,s.weekOffset??0))===date),dayAbsences=absences.filter(a=>date>=a.from&&date<=a.to),dayClosures=closures.filter(c=>date>=c.from&&date<=c.to);cells.push(`<div class="calendar-day"><strong>${day}${new Date(date+"T12:00:00").getDay()===1?` <small class="calendar-week-number">KW ${isoCalendarWeek(new Date(date+"T12:00:00"))}</small>`:""}</strong>${dayClosures.map(c=>`<div class="calendar-event event-red">${escapeHTML(c.label||"Kita geschlossen")}</div>`).join("")}${dayShifts.map(s=>`<div class="calendar-event event-blue">${s.start} ${s.person}</div>`).join("")}${dayAbsences.map(a=>`<div class="calendar-event event-red">${a.name} · ${a.type}</div>`).join("")}${found.map(e=>`<button class="calendar-event ${e.type==='Sonstiger Termin'?'event-red':e.type==='Meeting'?'event-purple':e.type==='Supervision'?'event-blue':e.type==='Kirchlicher Termin'?'event-green':e.type==='Fortbildung'?'event-orange':'event-green'}" data-page="${'sondertermine'}">${e.time.split('–')[0]} ${e.title}</button>`).join("")}</div>`)}
 return heading("Kalender","Alle Dienste, Abwesenheiten, Besprechungen und Sondertermine an einem Ort.",'<button class="btn primary" data-action="add-event">＋ Termin hinzufügen</button>')+`<section class="card"><div class="card-header"><div><h2>${new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"}).format(first)}</h2><p>Termine farblich nach Kategorie sortiert</p></div><div class="actions"><button class="btn small" data-action="prev-month" aria-label="Vorheriger Monat">←</button><button class="btn small" data-action="next-month" aria-label="Nächster Monat">→</button></div></div><div class="card-body"><div class="calendar-grid">${["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="calendar-weekday">${d}</div>`).join("")}${cells.join("")}</div><div class="legend" style="margin-top:15px"><span style="--legend:#8bc2ff">Dienst</span><span style="--legend:#a98bf2">Meeting</span><span style="--legend:#6ba9f5">Supervision</span><span style="--legend:#7bc9a0">Kirchlicher Termin</span><span style="--legend:#f38b96">Sonstiger Termin</span><span style="--legend:#f6b7bf">Urlaub</span><span style="--legend:#c65a6a">Schließzeit</span></div></div></section>`;
}
function employeesPage(){return heading("Mitarbeitende","Stammdaten, Wochenstunden, Stammgruppen und Planungsübersicht.",'<button class="btn primary" data-action="add-person">＋ Mitarbeitende hinzufügen</button>')+`<section class="card"><div class="card-header"><h2>Teamübersicht</h2><span class="pill blue">${names.length} Personen · Beispieldaten</span></div><div class="card-body">${personTable()}</div></section><div class="grid settings-grid section-gap">${groups.map(g=>card(g,`<p class="muted">Stammgruppe und Besetzungsregeln werden in den Einstellungen gepflegt.</p><p><strong>${names.filter(p=>p.group===g).length}</strong> zugeordnete Mitarbeitende</p><button class="btn small" data-page="einstellungen">Gruppenregeln öffnen</button>`)).join("")}</div>`}
function absencesPage(){return heading("Urlaub & Abwesenheit","Urlaubskonten sowie Krankheit, Fortbildungen und sonstige Abwesenheiten zentral verwalten.",'<button class="btn primary" data-action="add-absence">＋ Abwesenheit eintragen</button>')+`<div class="stats"><div class="stat"><div class="stat-label">Jahresanspruch</div><div class="stat-value">32 Tage</div><div class="stat-note">30 Urlaub + 2 Zusatztage</div></div><div class="stat"><div class="stat-label">Resturlaub im Team</div><div class="stat-value">${names.reduce((n,p)=>n+remainingVacation(p),0)} Tage</div><div class="stat-note">Jahreskonto nach erfassten Urlaubstagen</div></div><div class="stat"><div class="stat-label">Offene Einträge</div><div class="stat-value">${absences.filter(a=>a.status==="Offen").length}</div><div class="stat-note warn">Prüfung erforderlich</div></div><div class="stat"><div class="stat-label">Abwesenheiten</div><div class="stat-value">${absences.length}</div><div class="stat-note">In der Liste</div></div></div><section class="card"><div class="card-header"><h2>Abwesenheitsliste</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Art</th><th>Von</th><th>Bis</th><th>Tage</th><th>Status</th></tr></thead><tbody>${absences.map(a=>`<tr><td>${a.name}</td><td>${a.type}</td><td>${fmt(new Date(a.from+"T12:00:00"))}</td><td>${fmt(new Date(a.to+"T12:00:00"))}</td><td>${absenceDays(a)}</td><td><span class="pill ${a.status==='Offen'?'yellow':'green'}">${a.status}</span></td></tr>`).join("")}</tbody></table></div></div></section><section class="card section-gap"><div class="card-header"><h2>Urlaubskonto pro Person</h2></div><div class="card-body"><div class="table-wrap"><table><thead><tr><th>Mitarbeitende</th><th>Regulärer Urlaub</th><th>Zusatztage</th><th>Resturlaub ${new Date().getFullYear()}</th></tr></thead><tbody>${names.map(p=>`<tr><td>${p.name}</td><td>30 Tage</td><td>2 Tage</td><td><span class="pill green">${remainingVacation(p)} Tage</span></td></tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:11px">Konten sind Demo-Werte; Feiertags-, Teilzeit- und Übertragsregeln müssen fachlich bestätigt werden.</p></div></section>`}
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
}function settingsPage(){return heading("Einstellungen","Rahmenzeiten und Mindestbesetzung für die automatische Dienstplanung festlegen.",'<button class="btn primary" data-action="save-settings">Änderungen übernehmen</button>')+`<div class="grid settings-grid"><section class="card"><div class="card-header"><h2>Rahmenzeiten</h2></div><div class="card-body"><p>Hier legst du fest, innerhalb welcher Uhrzeiten Dienste stattfinden dürfen.</p><div class="setting-row"><div><strong>Frühester Dienstbeginn</strong><small>Vor dieser Uhrzeit darf kein Dienst starten.</small></div><input class="select-control" id="frame-start" type="time" value="${plannerSettings.frame.start}"></div><div class="setting-row"><div><strong>Spätestes Dienstende</strong><small>Nach dieser Uhrzeit darf kein Dienst enden.</small></div><input class="select-control" id="frame-end" type="time" value="${plannerSettings.frame.end}"></div></div></section><section class="card"><div class="card-header"><h2>Mindestbesetzung Kernzeit · 08–15 Uhr</h2></div><div class="card-body">${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong><small>Gleichzeitig im Dienst</small></div><select class="select-control" data-min-group="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}</div></section><section class="card"><div class="card-header"><h2>Frühschicht · 07–08 Uhr</h2></div><div class="card-body"><p>Benötigte gleichzeitige Besetzung je Gruppe.</p>${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong></div><select class="select-control" data-min-early="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumEarlyByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}<label class="check-option"><input type="checkbox" id="merge-early" ${plannerSettings.mergeEarlyGroups?"checked":""}> Gruppen in der Frühschicht zusammenlegen</label><div class="setting-row"><div><strong>Mindestbesetzung bei Zusammenlegung</strong></div><select class="select-control" id="min-early-combined">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumEarlyCombined)===n?"selected":""}>${n} Person(en) insgesamt</option>`).join("")}</select></div><p class="muted">Bei Aktivierung wird die Frühbesetzung gruppenübergreifend als gemeinsamer Personalpool geprüft.</p></div></section><section class="card"><div class="card-header"><h2>Spätschicht · 15–16 Uhr</h2></div><div class="card-body"><p>Benötigte gleichzeitige Besetzung je Gruppe.</p>${groups.map(g=>`<div class="setting-row"><div><strong>${g}</strong></div><select class="select-control" data-min-late="${g}">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumLateByGroup[g])===n?"selected":""}>${n} Person(en)</option>`).join("")}</select></div>`).join("")}<label class="check-option"><input type="checkbox" id="merge-late" ${plannerSettings.mergeLateGroups?"checked":""}> Gruppen in der Spätschicht zusammenlegen</label><div class="setting-row"><div><strong>Mindestbesetzung bei Zusammenlegung</strong></div><select class="select-control" id="min-late-combined">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(plannerSettings.minimumLateCombined)===n?"selected":""}>${n} Person(en) insgesamt</option>`).join("")}</select></div><p class="muted">Bei Aktivierung wird die Spätbesetzung gruppenübergreifend als gemeinsamer Personalpool geprüft.</p></div></section><section class="card"><div class="card-header"><h2>Automatische Vorbelegung</h2></div><div class="card-body"><p>Die Vorbelegung verteilt die vertraglichen Wochenstunden auf fünf Werktage und prüft die Besetzung in Früh-, Kern- und Spätzeit.</p><p class="muted">Individuelle Verfügbarkeiten, Pausen und gesetzliche Ruhezeiten müssen weiterhin geprüft werden.</p><button class="btn primary" data-action="generate-plan">Dienstplan für diese Woche erstellen</button></div></section><section class="card"><div class="card-header"><h2>Schließzeiten</h2></div><div class="card-body"><p>Lege einzelne Schließtage oder mehrtägige Schließzeiten fest. Sie werden bei der automatischen Planung, Mindestbesetzung und Urlaubsberechnung berücksichtigt.</p><div class="form-grid"><div class="field"><label>Von</label><input class="select-control" id="closure-from" type="date" value="${iso(dateForDay(0))}"></div><div class="field"><label>Bis</label><input class="select-control" id="closure-to" type="date" value="${iso(dateForDay(0))}"></div><div class="field full"><label>Bezeichnung</label><input class="select-control" id="closure-label" maxlength="80" value="Kita geschlossen" placeholder="z. B. Weihnachtsferien"></div></div><button type="button" class="btn primary" data-action="add-closure">Schließzeit hinzufügen</button><div class="section-gap"><strong>Hinterlegte Schließzeiten</strong>${closures.slice().sort((a,b)=>a.from.localeCompare(b.from)).map(c=>`<div class="setting-row"><div><strong>${escapeHTML(c.label||"Kita geschlossen")}</strong><small>${fmt(new Date(c.from+"T12:00:00"))} – ${fmt(new Date(c.to+"T12:00:00"))}</small></div><button type="button" class="btn small danger" data-remove-closure="${c.id}">Entfernen</button></div>`).join("")||'<p class="muted">Noch keine Schließzeiten hinterlegt.</p>'}</div></div></section><section class="card reset-settings-card"><div class="card-header"><h2>Werkseinstellungen</h2></div><div class="card-body"><p>Setzt die Anwendung auf den Ausgangszustand zurück. Alle gespeicherten Dienstpläne, Sondertermine, Abwesenheiten, Mitarbeitenden-Anpassungen, Gruppen und Einstellungen werden gelöscht bzw. auf die ursprünglichen Werte zurückgesetzt.</p><p class="muted">Dieser Schritt betrifft den gemeinsamen Datenbestand und ist nicht rückgängig zu machen.</p><button type="button" class="btn danger" data-action="reset-system">Auf Werkseinstellungen zurücksetzen</button></div></section></div>`}
function leaderProfilePage(){return heading("Leitungsprofil","Persönliche Angaben, Zugangsdaten und Arbeitszeit der Leitung.",'<button class="btn primary" data-action="save-leader-profile">Profil speichern</button>')+`<div class="grid settings-grid"><section class="card"><div class="card-header"><h2>Persönliche Angaben</h2></div><div class="card-body"><div class="field"><label>Name</label><input id="leader-name" class="select-control" value="${leaderProfile.name||cloudUser?.user_metadata?.full_name||""}" placeholder="Vorname Nachname"></div><div class="field"><label>E-Mail-Adresse</label><input id="leader-email" class="select-control" type="email" value="${cloudUser?.email||""}"></div><div class="field"><label>Telefon (optional)</label><input id="leader-phone" class="select-control" type="tel" value="${leaderProfile.phone||""}"></div><p class="muted">Bei einer geänderten E-Mail-Adresse kann eine Bestätigungsmail erforderlich sein. Die Bürozeit wird nicht als Gruppenzeit verplant; für Gruppendienste zählt ausschließlich die unten angegebene Gruppenzeit.</p></div></section><section class="card"><div class="card-header"><h2>Passwort ändern</h2></div><div class="card-body"><div class="field"><label>Neues Passwort</label><input id="leader-password" class="select-control" type="password" autocomplete="new-password" placeholder="Mindestens 8 Zeichen"></div><div class="field"><label>Passwort wiederholen</label><input id="leader-password-confirm" class="select-control" type="password" autocomplete="new-password"></div><p class="muted">Leer lassen, wenn das Passwort unverändert bleiben soll.</p></div></section><section class="card"><div class="card-header"><h2>Arbeitszeit der Leitung</h2></div><div class="card-body"><div class="field"><label>Stammgruppe</label><select id="leader-group" class="select-control">${groups.map(g=>`<option ${leaderProfile.group===g?"selected":""}>${g}</option>`).join("")}</select></div><div class="field"><label>Vertragliche Wochenstunden gesamt</label><input id="leader-weekly" class="select-control" type="number" min="1" max="50" step="0.5" value="${leaderProfile.weeklyHours}"></div><div class="field"><label>Davon Bürozeit pro Woche</label><input id="leader-office" class="select-control" type="number" min="0" max="50" step="0.5" value="${leaderProfile.officeHours}"></div><div class="field"><label>Davon Zeit in der Gruppe pro Woche</label><input id="leader-group-hours" class="select-control" type="number" min="0" max="50" step="0.5" value="${leaderProfile.groupHours}"></div><p class="muted">Nur die Gruppenzeit wird als pädagogische Besetzung eingeplant. Bürozeit zählt nicht zur Gruppenbesetzung.</p></div></section><section class="card"><div class="card-header"><h2>Bürozeiten und feste Sperren</h2></div><div class="card-body"><p>Lege hier wiederkehrende Bürozeiten als feste Sperren an. Während dieser Zeiten kann die Leitung nicht zusätzlich als Gruppenbesetzung eingeplant werden.</p><button type="button" class="btn" data-manage-blocks="${leaderProfile.name}">Bürozeiten / Sperrzeiten verwalten</button></div></section></div>`}
function exportPlanPdf(){
  const existing=$("#pdfWeekView");if(existing)existing.remove();
  const view=document.createElement("section");view.id="pdfWeekView";
  const staff=planningPeople().filter(p=>selectedGroup==="Alle Gruppen"||p.group===selectedGroup);
  const dayNames=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
  const dayIndexes=[0,1,2,3,4],pageSize=12,pages=[];
  const pdfGroups=[...new Set(staff.map(p=>p.group).filter(Boolean))];
  const pdfGroupPalette=[
    {background:"#e5f3eb",border:"#b8d9c5",accent:"#438b60",text:"#205c3b"},
    {background:"#e6effb",border:"#bfd2ed",accent:"#4b79b5",text:"#28527d"},
    {background:"#fff1dd",border:"#eed5a8",accent:"#c58a31",text:"#805315"},
    {background:"#f0eafb",border:"#d6c9ec",accent:"#8065b2",text:"#59447f"},
    {background:"#e0f2f1",border:"#b8dcda",accent:"#398b87",text:"#216563"},
    {background:"#fbeaec",border:"#edc5cc",accent:"#bf6372",text:"#843c4a"}
  ];
  const pdfGroupClass=group=>{const index=pdfGroups.indexOf(group);return index>=0?" pdf-group-"+(index%pdfGroupPalette.length):""};
  const pdfGroupStyles=pdfGroups.map((group,index)=>{
    const color=pdfGroupPalette[index%pdfGroupPalette.length],className=".pdf-group-"+(index%pdfGroupPalette.length);
    return "#pdfWeekView .pdf-time-staff-head"+className+"{background:"+color.background+"!important;color:"+color.text+"!important}#pdfWeekView .pdf-time-shift.service-normal"+className+"{background:"+color.background+"!important;border-color:"+color.border+"!important;border-left-color:"+color.accent+"!important;color:"+color.text+"!important}";
  }).join("");
  for(let offset=0;offset<Math.max(1,staff.length);offset+=pageSize){
    const pageStaff=staff.slice(offset,offset+pageSize);
    const allShifts=weekShifts().filter(s=>pageStaff.some(p=>p.name===s.person));
    const totalCols=dayIndexes.length*Math.max(1,pageStaff.length);
    const heads=dayIndexes.map(day=>'<div class="pdf-time-day-group" style="grid-column:span '+Math.max(1,pageStaff.length)+'">'+dayNames[day]+' · '+fmt(dateForDay(day),{day:"2-digit",month:"2-digit"})+'</div>').join("");
    const staffHeads=dayIndexes.map(()=>pageStaff.map(p=>'<div class="pdf-time-staff-head'+pdfGroupClass(p.group)+'" title="'+escapeHTML(p.name)+'">'+escapeHTML(p.name)+'<small>'+escapeHTML(p.group||"")+'</small></div>').join("")).join("");
    const columns=dayIndexes.map(day=>{
      const date=iso(dateForDay(day));
      return pageStaff.map(p=>{
        const personShifts=allShifts.filter(s=>s.day===day&&s.person===p.name);
        const closure=closures.find(c=>date>=c.from&&date<=c.to),closureMarkup=closure?'<div class="pdf-time-event pdf-time-closure" style="top:0%;height:100%"><strong>Einrichtung geschlossen</strong><span>'+escapeHTML(closure.label||"Kita geschlossen")+'</span></div>':'';
        const absence=absences.filter(a=>a.name===p.name&&date>=a.from&&date<=a.to).map(a=>'<div class="pdf-time-absence"><strong>'+escapeHTML(a.type)+'</strong><span>Ganztägig'+(a.status==="Offen"?' · Offen':'')+'</span></div>').join("");
        const attendeeEvents=events.filter(ev=>eventOccursOnDate(ev,date)&&(ev.attendees||[]).includes(p.name)).map(ev=>{
          const parts=String(ev.time||"").split(/[–-]/),from=parts[0]||"06:00",to=parts[1]||from;
          return '<div class="pdf-time-event" style="top:'+topPercent(from)+'%;height:'+heightPercent(from,to)+'%"><strong>'+escapeHTML(ev.title)+'</strong><span>'+escapeHTML(ev.time)+'</span></div>';
        }).join("");
        const blocks=personShifts.map(x=>{
          const label=x.serviceType&&x.serviceType!=="Normaler Dienst"?x.serviceType:(x.group||p.group||"Dienst");
          const pause=shiftPause(x),span=minutes(x.end)-minutes(x.start),pauseMinutes=pause?pause.end-pause.start:0;
          const pauseMarkup=pause?'<i class="pdf-pause-marker" style="top:'+((pause.start-minutes(x.start))/span*100)+'%;height:'+(pauseMinutes/span*100)+'%">Pause '+pauseMinutes+' Min.</i>':'';
          return '<div class="pdf-time-shift '+shiftClass(x)+pdfGroupClass(x.group||p.group)+'" style="top:'+topPercent(x.start)+'%;height:'+heightPercent(x.start,x.end)+'%"><strong>'+escapeHTML(x.start)+'–'+escapeHTML(x.end)+'</strong><span>'+escapeHTML(label)+'</span>'+pauseMarkup+'</div>';
        }).join("");
        return '<div class="pdf-time-column"><div class="pdf-time-track">'+closureMarkup+absence+attendeeEvents+blocks+'</div></div>';
      }).join("");
    }).join("");
    const timeLabels=Array.from({length:12},(_,i)=>'<span style="top:'+(i/11*100)+'%">'+String(7+i).padStart(2,"0")+':00</span>').join("");
    const range=pageStaff.length?('Mitarbeitende '+(offset+1)+'–'+(offset+pageStaff.length)+' von '+staff.length):"Keine Mitarbeitenden";
    pages.push('<article class="pdf-time-page"><header class="pdf-time-title"><h1>Dienstplan · '+escapeHTML(weekLabel())+'</h1><span>Montag bis Freitag · '+range+'</span></header><div class="pdf-time-grid" style="--pdf-total-cols:'+totalCols+';--pdf-staff-font:'+(pageStaff.length>8?'4.8pt':'5.2pt')+'"><div class="pdf-time-head">Zeit</div>'+heads+'<div class="pdf-time-subhead"></div>'+staffHeads+'<div class="pdf-time-axis">'+timeLabels+'</div>'+columns+'</div><footer class="pdf-time-legend"><span class="normal">Normaler Dienst</span><span class="meeting">Meeting</span><span class="supervision">Supervision</span><span class="church">Kirchlicher Termin</span><span class="training">Fortbildung</span><span class="other">Sonstiges</span><span class="absence">Abwesenheit</span></footer></article>');
    if(!staff.length)break;
  }
  view.innerHTML=sanitizeHTML(pages.join(""));
  const printWindow=window.open("","_blank");
  if(!printWindow){alert("Der PDF-Export wurde vom Browser blockiert. Bitte Pop-ups für diese App erlauben und erneut versuchen.");return}
  const stylesheet=document.querySelector('link[rel="stylesheet"]')?.href||new URL("./styles.css",location.href).href;
  const printTitle="Dienstplan-"+iso(dateForDay(0))+"-bis-"+iso(dateForDay(4));
  printWindow.document.open();
  printWindow.document.write('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHTML(printTitle)+'</title><link rel="stylesheet" href="'+escapeHTML(stylesheet)+'"><style data-pdf-print>@page{size:A4 landscape;margin:3mm}html,body,#pageContent,#pdfWeekView,#pdfWeekView .pdf-time-page,#pdfWeekView .pdf-time-grid,#pdfWeekView .pdf-time-axis,#pdfWeekView .pdf-time-column,#pdfWeekView .pdf-time-track{background:#fff!important;background-color:#fff!important;color-scheme:light!important;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}#pdfWeekView .pdf-time-track{background:#fff!important;background-image:repeating-linear-gradient(to bottom,#fff 0,#fff calc(1.5625% - .12mm),#e0e6eb calc(1.5625% - .12mm),#e0e6eb 1.5625%)!important}#pdfWeekView .pdf-time-track:after{content:""!important;position:absolute!important;inset:0!important;pointer-events:none!important;z-index:0!important;background:#fff!important;background-image:repeating-linear-gradient(to bottom,#fff 0,#fff calc(6.25% - .25mm),#9eacba calc(6.25% - .25mm),#9eacba 6.25%)!important}#pdfWeekView .pdf-time-shift,#pdfWeekView .pdf-time-event,#pdfWeekView .pdf-time-absence{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important}#pdfWeekView .pdf-time-shift strong,#pdfWeekView .pdf-time-shift span,#pdfWeekView .pdf-time-event strong,#pdfWeekView .pdf-time-event span,#pdfWeekView .pdf-time-absence strong,#pdfWeekView .pdf-time-absence span{writing-mode:vertical-rl!important;text-orientation:mixed!important;transform:rotate(180deg)!important;white-space:nowrap!important;overflow:visible!important;max-width:100%!important;font-size:4.1pt!important;line-height:1!important;margin:0!important}#pdfWeekView .pdf-pause-marker{writing-mode:vertical-rl!important;text-orientation:mixed!important;transform:rotate(180deg)!important;font-size:3.8pt!important;white-space:nowrap!important}</style><style data-pdf-groups>'+pdfGroupStyles+'</style></head><body><main id="pageContent">'+view.outerHTML+'</main></body></html>');
  printWindow.document.close();
  const startPrint=()=>{
    printWindow.focus();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      printWindow.print();
      printWindow.addEventListener("afterprint",()=>printWindow.close(),{once:true});
    }));
  };
  if(printWindow.document.readyState==="complete")startPrint();
  else printWindow.addEventListener("load",startPrint,{once:true});
}
function render(){initShifts();const content=$("#pageContent");let out="";switch(currentPage){case"dashboard":out=dashboard();break;case"dienstplan":out=dutyPage();break;case"kalender":out=calendarPage();break;case"mitarbeitende":out=employeesPage();break;case"abwesenheiten":out=absencesPage();break;case"sondertermine":out=eventsPage("Sondertermine");break;case"teammeetings":out=eventsPage("Teammeetings");break;case"supervision":out=eventsPage("Supervision");break;case"fortbildungen":out=eventsPage("Fortbildungen");break;case"auswertungen":out=analyticsPage();break;case"einstellungen":out=settingsPage();break;case"leitungsprofil":out=leaderProfilePage();break;default:out=dashboard()}content.innerHTML=sanitizeHTML(out);$$("#pageContent .card-header h2").forEach(h=>{if(h.querySelector(".card-title-icon"))return;const t=h.textContent;const key=/Arbeitszeit|Büro|Wochenstunden/.test(t)?"clock":/Zugang|Passwort/.test(t)?"lock":/Personal|Mitarbeitende|Team/.test(t)?"users":/Auswertung|Kennzahl/.test(t)?"chart":/Einstellung|Verwaltung/.test(t)?"settings":/Termin|Kalender|Abwesenheit/.test(t)?"calendar":"briefcase";h.insertAdjacentHTML("afterbegin",`<span class="card-title-icon">${uiIcon(key)}</span>`)});scheduleCloudSave();const gf=$("#groupFilter");if(gf)gf.addEventListener("change",e=>{selectedGroup=e.target.value;render()});}
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
function addShiftModal(id=null){if(!names.length){alert("Lege zuerst mindestens eine mitarbeitende Person an.");navigate("mitarbeitende");return}const s=id?shifts.find(x=>x.id===id):null;const people=planningPeople();const person=s?.person||people[0].name;openModal(s?"Dienst bearbeiten":"Dienst eintragen",`<form id="shiftForm"><div class="form-grid"><div class="field full"><label for="shiftPerson">Mitarbeitende</label><select id="shiftPerson" name="person">${people.map(p=>`<option ${p.name===person?'selected':''}>${escapeHTML(p.name)}</option>`).join("")}</select></div><div class="field"><label>Wochentag</label><select name="day">${weekdays.map((d,i)=>`<option value="${i}" ${(s?s.day:0)===i?'selected':''}>${d} · ${fmt(dateForDay(i))}</option>`).join("")}</select></div><div class="field"><label>Gruppe</label><select name="group">${groups.map(g=>`<option ${(s?s.group:names[0].group)===g?'selected':''}>${escapeHTML(g)}</option>`).join("")}</select></div><div class="field"><label>Dienstart</label><select name="serviceType"><option ${(!s?.serviceType||s.serviceType==="Normaler Dienst")?"selected":""}>Normaler Dienst</option><option ${s?.serviceType==="Meeting"?"selected":""}>Meeting</option><option ${s?.serviceType==="Kirchlicher Termin"?"selected":""}>Kirchlicher Termin</option><option ${s?.serviceType==="Supervision"?"selected":""}>Supervision</option><option ${s?.serviceType==="Fortbildung"?"selected":""}>Fortbildung</option><option ${s?.serviceType==="Sonstiger Termin"?"selected":""}>Sonstiger Termin</option></select></div><div class="field"><label>Beginn</label><input name="start" type="time" min="06:00" max="22:00" value="${s?.start||"07:30"}" required></div><div class="field"><label>Ende</label><input name="end" type="time" min="06:00" max="22:00" value="${s?.end||"12:00"}" required></div></div><div class="modal-actions">${s?`<button type="button" class="btn danger" data-delete-shift="${s.id}">Dienst löschen</button>`:""}<button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Dienst speichern</button></div></form>`);$("#shiftForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);const start=fd.get("start"),end=fd.get("end");if(minutes(end)<=minutes(start)){alert("Die Endzeit muss nach der Startzeit liegen.");return}const withinFrame=minutes(start)>=minutes(plannerSettings.frame.start)&&minutes(end)<=minutes(plannerSettings.frame.end);if(!withinFrame){alert("Der Dienst liegt außerhalb der allgemeinen Rahmenzeit "+plannerSettings.frame.start+"–"+plannerSettings.frame.end+" Uhr.");return}const person=planningPeople().find(p=>p.name===fd.get("person"));if(!person){alert("Die Person wurde nicht gefunden.");return}const day=Number(fd.get("day"));if(isClosureDay(day,s?.weekOffset??weekOffset)){alert("An diesem Tag ist die Einrichtung geschlossen. Ein Dienst kann hier nicht eingetragen werden.");return}if(isBlocked(person,day,start,end,s?.weekOffset??weekOffset)){alert("Dieser Dienst überschneidet sich mit einer festen Dienstsperre der Person. Bitte wähle eine andere Zeit.");return}if(personHasEventConflict(person,day,start,end,s?.weekOffset??weekOffset)){alert("Dieser Dienst überschneidet sich mit einem Termin der Person.");return}const ruleIssues=shiftRuleConflicts(person,day,start,end,s?.weekOffset??weekOffset,shifts,s?.id);if(ruleIssues.length){alert("Arbeitszeitprüfung: "+ruleIssues.join("; ")+". Bitte Dienst anpassen.");return}const absence=blockingAbsence(person,day,s?.weekOffset??weekOffset);if(absence){alert("Für diese Person ist an diesem Tag "+absence.type+" erfasst. Der Dienst kann nicht eingetragen werden.");return}const overlap=shifts.some(x=>x.id!==s?.id&&x.person===person.name&&x.day===day&&(x.weekOffset??0)===(s?.weekOffset??weekOffset)&&minutes(start)<minutes(x.end)&&minutes(end)>minutes(x.start));if(overlap){alert("Dieser Dienst überschneidet sich zeitlich mit einem anderen Dienst derselben Person.");return}if(s){Object.assign(s,{person:person.name,group:fd.get("group"),serviceType:fd.get("serviceType")||"Normaler Dienst",day:Number(fd.get("day")),start,end,color:person.color,weekOffset:s.weekOffset??weekOffset})}else{shifts.push({id:"s"+Date.now(),person:person.name,group:fd.get("group"),serviceType:fd.get("serviceType")||"Normaler Dienst",day:Number(fd.get("day")),start,end,color:person.color,weekOffset})}closeModal();render()});}
function addEventModal(){openModal("Termin erstellen",`<form id="eventForm"><div class="form-grid"><div class="field full"><label>Titel</label><input name="title" placeholder="z. B. Sankt Martin" required></div><div class="field"><label>Kategorie</label><select name="type"><option>Meeting</option><option>Supervision</option><option>Kirchlicher Termin</option><option>Fortbildung</option><option>Sonstiger Termin</option></select></div><div class="field"><label>Datum</label><input name="date" type="date" value="${iso(dateForDay(2))}" required></div><div class="field"><label>Wiederholung</label><select name="repeat"><option value="once">Einmalig</option><option value="weekly">Wöchentlich</option></select></div><div class="field"><label>Beginn</label><input name="start" type="time" value="16:00" required></div><div class="field"><label>Ende</label><input name="end" type="time" value="18:00" required></div><div class="field full"><label>Teilnehmende (standardmäßig alle ausgewählt)</label><div class="check-list">${names.map(p=>`<label class="check-option"><input type="checkbox" name="people" value="${p.name}" checked> ${p.name}</label>`).join("")}</div></div></div><div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Termin speichern</button></div></form>`);$("#eventForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target),start=fd.get("start"),end=fd.get("end");if(minutes(end)<=minutes(start)){alert("Die Endzeit muss nach der Startzeit liegen.");return}const eventDate=fd.get("date"),attendees=fd.getAll("people"),repeatWeekly=fd.get("repeat")==="weekly",eventDay=new Date(eventDate+"T12:00:00").getDay(),conflicts=shifts.filter(sh=>attendees.includes(sh.person)&&eventOccursOnDate({date:eventDate,repeatWeekly,repeatDay:eventDay},iso(dateForDay(sh.day,sh.weekOffset??weekOffset)))&&minutes(start)<minutes(sh.end)&&minutes(end)>minutes(sh.start));if(conflicts.length){alert("Termin kann nicht gespeichert werden: Er überschneidet sich mit "+conflicts.length+" bestehenden Diensten der ausgewählten Teilnehmenden.");return}events.push({id:"e"+Date.now(),date:eventDate,title:fd.get("title"),type:fd.get("type"),time:start+"–"+end,attendees,people:attendees.length,repeatWeekly,repeatDay:eventDay});closeModal();render()})}
function addAbsenceModal(){if(!names.length){alert("Lege zuerst mindestens eine mitarbeitende Person an.");navigate("mitarbeitende");return}openModal("Abwesenheit eintragen",`<form id="absenceForm"><div class="form-grid"><div class="field full"><label>Mitarbeitende</label><select name="name">${personOptions()}</select></div><div class="field"><label>Art</label><select name="type"><option>Urlaub</option><option>Krankheit</option><option>Fortbildung</option><option>Sonstige Abwesenheit</option></select></div><div class="field"><label>Status</label><select name="status"><option>Offen</option><option>Genehmigt</option><option>Erfasst</option></select></div><div class="field"><label>Von</label><input name="from" type="date" value="${iso(dateForDay(0))}" required></div><div class="field"><label>Bis</label><input name="to" type="date" value="${iso(dateForDay(0))}" required></div><div class="field full"><label>Notiz (optional)</label><input name="note" placeholder="Keine Diagnosen eintragen"></div></div><div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">Eintragen</button></div></form>`);$("#absenceForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.target);if(fd.get("to")<fd.get("from")){alert("Das Enddatum muss nach dem Startdatum liegen.");return}const type=fd.get("type"),from=fd.get("from"),to=fd.get("to");if(type==="Urlaub"){const person=names.find(p=>p.name===fd.get("name")),requested=vacationDaysForPerson(person,from,to);if(requested<1){alert("Der ausgewählte Zeitraum enthält keine Urlaubstage außerhalb von Wochenenden, NRW-Feiertagen und Schließzeiten.");return}for(let year=Number(from.slice(0,4));year<=Number(to.slice(0,4));year++){const days=vacationDaysForPersonInYear(person,{from,to},year),available=remainingVacation(person,year);if(days>available){alert("Der Urlaub umfasst "+days+" Arbeitstage im Jahr "+year+", verfügbar sind noch "+available+" Tage.");return}}}const personName=fd.get("name"),conflicts=shifts.filter(s=>s.person===personName&&iso(dateForDay(s.day,s.weekOffset??weekOffset))>=from&&iso(dateForDay(s.day,s.weekOffset??weekOffset))<=to);if(conflicts.length){alert("Abwesenheit kann nicht gespeichert werden: "+conflicts.length+" bestehende Dienste liegen im Zeitraum. Bitte zuerst die Dienste entfernen oder verschieben.");return}absences.push({id:"a"+Date.now(),name:personName,type,from,to,days:calendarDaysBetween(from,to),status:fd.get("status"),note:fd.get("note")});closeModal();render()})}
function addPersonModal(personName=null){
 const person=personName?names.find(p=>p.name===personName):null;
 if(personName&&!person){alert("Die Person wurde nicht gefunden.");return}
 const editing=Boolean(person),selectedDays=personWorkingDays(person||{});
 openModal(editing?"Mitarbeitende bearbeiten":"Mitarbeitende hinzufügen",`<form id="personForm"><div class="form-grid"><div class="field"><label>Vorname Nachname</label><input name="name" value="${escapeHTML(person?.name||"")}" maxlength="120" required></div><div class="field"><label>Wochenstunden</label><input name="hours" type="number" min="1" max="50" value="${person?.hours??30}" required></div><div class="field"><label>Stammgruppe</label><select name="group">${groups.map(g=>`<option ${(person?.group||groups[0])===g?'selected':''}>${g}</option>`).join("")}</select></div><div class="field"><label>Jahresurlaubsanspruch (Tage)</label><input name="vacation" type="number" min="0" max="100" value="${person?.vacation??32}" required></div><div class="field full"><label>Reguläre Arbeitstage</label><div class="check-list">${weekdays.slice(0,5).map((day,i)=>'<label class="check-option"><input type="checkbox" name="workdays" value="'+i+'" '+(selectedDays.includes(i)?"checked":"")+'> '+day+'</label>').join("")}</div><small class="muted">Diese Tage steuern die automatische Planung und die Urlaubsberechnung.</small></div></div>${editing?`<div class="setting-row" style="margin-top:14px"><div><strong>Sperrzeiten</strong><small>Feste Zeiten, in denen diese Person nicht eingeplant werden darf.</small></div><button type="button" class="btn" data-manage-blocks="${person.name}">Sperrzeiten bearbeiten</button></div>`:""}<div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button class="btn primary" type="submit">${editing?"Änderungen speichern":"Person hinzufügen"}</button></div></form>`);
 $("#personForm").addEventListener("submit",e=>{
  e.preventDefault();const fd=new FormData(e.target),name=String(fd.get("name")).trim(),hours=Number(fd.get("hours")),vacation=Number(fd.get("vacation")),workdays=fd.getAll("workdays").map(Number);
  if(!name||hours<1||hours>50||vacation<0||!workdays.length){alert("Bitte prüfe Name, Wochenstunden, Resturlaub und mindestens einen regulären Arbeitstag.");return}
  if(names.some(p=>p!==person&&p.name.toLocaleLowerCase("de")===name.toLocaleLowerCase("de"))){alert("Dieser Name ist bereits vorhanden.");return}
  if(editing){
   const oldName=person.name;Object.assign(person,{name,initials:name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase(),group:fd.get("group"),hours,vacation,workdays});
   if(oldName!==name){shifts.forEach(s=>{if(s.person===oldName)s.person=name});absences.forEach(a=>{if(a.name===oldName)a.name=name})}
   shifts.forEach(s=>{if(s.person===name)s.group=person.group});
  }else{
   names.push({name,initials:name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase(),group:fd.get("group"),hours,vacation,workdays,special:0,meetings:0,supervision:0,color:"blue",employment:"Teilzeit"});
  }
  closeModal();render();
 });
}
let activeShiftResize=null;
function resizeTime(value){return String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0")}
document.addEventListener("pointerdown",e=>{
 const handle=e.target.closest("[data-resize-shift]"),block=e.target.closest(".outlook-shift");
 if(!handle&&!block)return;
 const shift=shifts.find(x=>x.id===(handle?.dataset.resizeShift||block?.dataset.editShift));if(!shift)return;
 const shiftBlock=handle?.closest(".outlook-shift")||block,rect=shiftBlock.getBoundingClientRect();
 const edge=handle?.dataset.resizeEdge||(e.clientY<=rect.top+12?"start":e.clientY>=rect.bottom-12?"end":null);
 if(!edge)return;
 e.preventDefault();e.stopPropagation();
 const column=shiftBlock.closest(".outlook-staff-column");if(!column)return;
 activeShiftResize={id:shift.id,edge,pointerId:e.pointerId,startY:e.clientY,initialStart:minutes(shift.start),initialEnd:minutes(shift.end),column,block:shiftBlock,previewStart:minutes(shift.start),previewEnd:minutes(shift.end)};
 document.body.classList.add("resizing-shift");
});
document.addEventListener("pointermove",e=>{
 if(!activeShiftResize||e.pointerId!==activeShiftResize.pointerId)return;
 const state=activeShiftResize,rect=state.column.getBoundingClientRect(),shift=shifts.find(x=>x.id===state.id);if(!shift)return;
 const delta=Math.round((e.clientY-state.startY)/Math.max(1,rect.height)*960/15)*15;
 if(state.edge==="start")state.previewStart=Math.max(360,Math.min(state.initialEnd-15,state.initialStart+delta));
 else state.previewEnd=Math.max(state.initialStart+15,Math.min(1320,state.initialEnd+delta));
 if(state.block){
  const start=resizeTime(state.previewStart),end=resizeTime(state.previewEnd);
  state.block.style.top=topPercent(start)+"%";state.block.style.height=heightPercent(start,end)+"%";
  const label=state.block.querySelector("strong");if(label)label.textContent=start+"–"+end;
 }
});
function finishShiftResize(){
 if(!activeShiftResize)return;
 const state=activeShiftResize;activeShiftResize=null;document.body.classList.remove("resizing-shift");
 const shift=shifts.find(x=>x.id===state.id);if(!shift){render();return}
 const start=resizeTime(state.previewStart),end=resizeTime(state.previewEnd),person=planningPeople().find(p=>p.name===shift.person),offset=shift.weekOffset??weekOffset;
 let issue="";
 if(minutes(end)<=minutes(start))issue="Der Dienst muss mindestens 15 Minuten dauern.";
 else if(minutes(start)<minutes(plannerSettings.frame.start)||minutes(end)>minutes(plannerSettings.frame.end))issue="Der Dienst liegt außerhalb der Rahmenzeit.";
 else if(!person)issue="Die mitarbeitende Person wurde nicht gefunden.";
 else if(blockingAbsence(person,shift.day,offset))issue="Für diese Person ist an diesem Tag eine Abwesenheit erfasst.";
 else if(isBlocked(person,shift.day,start,end,offset))issue="Der Dienst überschneidet sich mit einer festen Dienstsperre.";
 else if(personHasEventConflict(person,shift.day,start,end,offset))issue="Der Dienst überschneidet sich mit einem Termin.";
 else {const rules=shiftRuleConflicts(person,shift.day,start,end,offset,shifts,shift.id);if(rules.length)issue=rules.join("; ");}
 if(!issue&&shifts.some(x=>x.id!==shift.id&&x.person===shift.person&&x.day===shift.day&&(x.weekOffset??0)===offset&&minutes(start)<minutes(x.end)&&minutes(end)>minutes(x.start)))issue="Der Dienst überschneidet sich mit einem anderen Dienst derselben Person.";
 if(issue){alert(issue+" Die ursprüngliche Zeit bleibt erhalten.");render();return}
 shift.start=start;shift.end=end;scheduleCloudSave();render();
}
document.addEventListener("pointerup",e=>{if(activeShiftResize&&e.pointerId===activeShiftResize.pointerId)finishShiftResize()});
document.addEventListener("pointercancel",e=>{if(!activeShiftResize||e.pointerId!==activeShiftResize.pointerId)return;if(e.pointerType==="mouse"){finishShiftResize();return}activeShiftResize=null;document.body.classList.remove("resizing-shift");render()});
document.addEventListener("click",e=>{
 if(e.target.closest("[data-resize-shift]")){e.preventDefault();e.stopPropagation();return;}
 const menuToggle=e.target.closest("[data-menu-toggle]");if(menuToggle){const shell=document.querySelector(".app-shell");if(shell?.classList.contains("sidebar-collapsed")){const target=menuToggle.dataset.defaultPage;if(target)navigate(target);return}const key=menuToggle.dataset.menuToggle,children=$("[data-nav-children='"+key+"']"),open=menuToggle.getAttribute("aria-expanded")!=="true";menuToggle.setAttribute("aria-expanded",String(open));children.hidden=!open;return}
 const nav=e.target.closest("[data-page]");if(nav){navigate(nav.dataset.page);return}
 const removePerson=e.target.closest("[data-remove-person]");if(removePerson){const personName=removePerson.dataset.removePerson;if(confirm("Mitarbeitende Person „"+personName+"“ wirklich entfernen? Zugehörige Dienste und Abwesenheiten werden ebenfalls gelöscht.")){names=names.filter(p=>p.name!==personName);shifts=shifts.filter(x=>x.person!==personName);absences=absences.filter(x=>x.name!==personName);render()}return}
 const removeClosure=e.target.closest("[data-remove-closure]");if(removeClosure){const closure=closures.find(x=>x.id===removeClosure.dataset.removeClosure);if(closure&&confirm("Diese Schließzeit wirklich entfernen?")){closures=closures.filter(x=>x.id!==closure.id);scheduleCloudSave();render()}return}
 const deleteShift=e.target.closest("[data-delete-shift]");if(deleteShift){const id=deleteShift.dataset.deleteShift,shift=shifts.find(x=>x.id===id);if(shift&&confirm("Diesen Dienst wirklich löschen?")){shifts=shifts.filter(x=>x.id!==id);closeModal();render()}return}
 const manageBlocks=e.target.closest("[data-manage-blocks]");if(manageBlocks){manageBlocksModal(manageBlocks.dataset.manageBlocks);return}
  const removeBlock=e.target.closest("[data-remove-block]");if(removeBlock){const p=planningPeople().find(x=>x.name===removeBlock.dataset.blockPerson);if(p){personBlocks(p).splice(Number(removeBlock.dataset.removeBlock),1);if(p.isLeader)leaderProfile.blocks=p.blocks;scheduleCloudSave();manageBlocksModal(p.name)}return}
  const editPerson=e.target.closest("[data-edit-person]");if(editPerson){addPersonModal(editPerson.dataset.editPerson);return}
 const edit=e.target.closest("[data-edit-shift]");if(edit){addShiftModal(edit.dataset.editShift);return}
 const close=e.target.closest("[data-close]");if(close){closeModal();return}
 const deleteEvent=e.target.closest("[data-delete-event]");if(deleteEvent){const id=deleteEvent.dataset.deleteEvent;if(confirm("Diesen Termin wirklich löschen?")){events=events.filter(x=>x.id!==id);render()}return}const deleteAbsence=e.target.closest("[data-delete-absence]");if(deleteAbsence){const id=deleteAbsence.dataset.deleteAbsence;if(confirm("Diese Abwesenheit wirklich löschen?")){absences=absences.filter(x=>x.id!==id);render()}return}const action=e.target.closest("[data-action]")?.dataset.action;if(!action)return;
 if(action==="add-closure"){const from=$("#closure-from")?.value,to=$("#closure-to")?.value,label=$("#closure-label")?.value.trim()||"Kita geschlossen";if(!from||!to||to<from){alert("Bitte einen gültigen Schließzeitraum auswählen.");return}if(closures.some(c=>from<=c.to&&to>=c.from)){alert("Der Zeitraum überschneidet sich mit einer bereits hinterlegten Schließzeit. Bitte passe den Zeitraum an oder entferne den bestehenden Eintrag.");return}closures.push({id:"c"+Date.now(),from,to,label});closures.sort((a,b)=>a.from.localeCompare(b.from));scheduleCloudSave();render();alert("Schließzeit wurde gespeichert und wird bei Planung und Urlaub berücksichtigt.");}
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
 if(action==="prev-month"){calendarMonthOffset--;render()}
 if(action==="next-month"){calendarMonthOffset++;render()}
 if(action==="reset-system"){(async()=>{
  if(!confirm("ACHTUNG: Wirklich alle gespeicherten Daten der Anwendung zurücksetzen? Dienstpläne, Sondertermine, Abwesenheiten, Schließzeiten und individuelle Anpassungen werden unwiderruflich gelöscht."))return;
  const confirmation=prompt("Zum endgültigen Bestätigen bitte RESET eingeben:");
  if(confirmation!=="RESET"){if(confirmation!==null)alert("Zurücksetzen abgebrochen. Die Eingabe war nicht RESET.");return;}
  if(cloudSaveInFlight){alert("Es werden gerade Daten gespeichert. Bitte kurz warten und erneut versuchen.");return;}
  clearTimeout(saveTimer);
  const previous=JSON.parse(JSON.stringify(cloudSnapshot()));
  names=JSON.parse(JSON.stringify(factoryNames));
  groups.splice(0,groups.length,...factoryGroups);
  Object.assign(plannerSettings,JSON.parse(JSON.stringify(factoryPlannerSettings)));
  leaderProfile=JSON.parse(JSON.stringify(factoryLeaderProfile));
  events=[];absences=[];closures=[];shifts=[];weekOffset=0;selectedGroup="Alle Gruppen";
  const saved=await saveCloudState();
  if(!saved){applyCloudSnapshot(previous);render();alert("Das Zurücksetzen konnte nicht in der Datenbank gespeichert werden. Der bisherige Datenbestand wurde in dieser Sitzung wiederhergestellt.");return;}
  render();
  alert("Die Anwendung wurde auf Werkseinstellungen zurückgesetzt.");
 })();return;}
 if(action==="save-settings"){const frameStart=$("#frame-start"),frameEnd=$("#frame-end");if(!frameStart||!frameEnd||!frameStart.value||!frameEnd.value||minutes(frameEnd.value)<=minutes(frameStart.value)){alert("Die Rahmenzeit muss ein gültiges Zeitfenster sein.");return}$$("[data-min-group]").forEach(el=>{plannerSettings.minimumByGroup[el.dataset.minGroup]=Number(el.value)||0});$$("[data-min-early]").forEach(el=>{plannerSettings.minimumEarlyByGroup[el.dataset.minEarly]=Number(el.value)||0});$$("[data-min-late]").forEach(el=>{plannerSettings.minimumLateByGroup[el.dataset.minLate]=Number(el.value)||0});plannerSettings.mergeEarlyGroups=$("#merge-early").checked;plannerSettings.mergeLateGroups=$("#merge-late").checked;plannerSettings.minimumEarlyCombined=Number($("#min-early-combined").value);plannerSettings.minimumLateCombined=Number($("#min-late-combined").value);plannerSettings.frame.start=frameStart.value;plannerSettings.frame.end=frameEnd.value;alert("Rahmenzeiten und Mindestbesetzung wurden übernommen und werden gespeichert.");render()} if(action==="print-plan"){exportPlanPdf()} if(action==="export-csv"){const csv=["Name;Gruppe;Wochenstunden;Resturlaub;Sonderdienste",...names.map(p=>[p.name,p.group,p.hours,p.vacation,p.special].join(";"))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="frueh-bis-spaet-auswertung.csv";a.click();URL.revokeObjectURL(a.href)}
});
$("#closeModal").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",event=>{const button=event.target.closest("#sidebarCollapse");if(!button)return;event.preventDefault();event.stopPropagation();const shell=document.querySelector(".app-shell");if(!shell)return;const collapsed=shell.classList.toggle("sidebar-collapsed");button.setAttribute("aria-label",collapsed?"Menü ausklappen":"Menü einklappen");button.title=collapsed?"Menü ausklappen":"Menü einklappen";button.textContent=collapsed?"›":"‹";button.setAttribute("aria-expanded",String(!collapsed));});
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){const q=e.target.value.trim().toLocaleLowerCase("de");if(!q){alert("Bitte einen Namen oder Termin eingeben.");return}if(names.some(p=>p.name.toLocaleLowerCase("de").includes(q)))navigate("mitarbeitende");else if(events.some(ev=>ev.title.toLocaleLowerCase("de").includes(q)))navigate("kalender");else alert("Keine passenden Beispieldaten gefunden.")}});
startCloudApp();