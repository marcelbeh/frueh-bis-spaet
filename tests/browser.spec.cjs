const {test,expect}=require('@playwright/test');
test('login screen loads and fits mobile viewport',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({data:{},error:null}),signOut:async()=>({error:null})}})};'}));
 const errors=[];page.on('pageerror',e=>errors.push({name:e.name,message:e.message,stack:e.stack}));page.on('console',m=>{if(m.type()==='error')errors.push({console:m.text()})});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await expect(page.locator('#cloudLoginForm')).toBeVisible();
 await expect(page.getByText('Geschützter Leitungszugang',{exact:true})).toBeVisible();
 await expect(page.locator('input[name="email"]')).toBeVisible();
 await expect(page.locator('input[name="password"]')).toBeVisible();
 expect(errors).toEqual([]);
});
test('desktop shell renders without overflow at initial screen',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:900});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await expect(page.locator('#cloudLoginForm')).toBeVisible();
 await expect(page.locator('#pageContent')).toBeVisible();
});

test('render sanitizer strips executable HTML',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const cleaned=await page.evaluate(()=>sanitizeHTML('<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a><form action="javascript:alert(4)"><input srcdoc="bad"></form>'));
 expect(cleaned).not.toContain('onerror');
 expect(cleaned).not.toContain('<script');
 expect(cleaned).not.toContain('javascript:');
 expect(cleaned).not.toContain('srcdoc');
});

test('dragging both shift edges changes the displayed time in 15-minute increments',async({page})=>{
 const stub=`
 window.__savedState=null;
 window.supabase={
  createClient:()=>({
   auth:{
    getSession:async()=>({data:{session:null},error:null}),
    signInWithPassword:async()=>({data:{user:{id:'user-1',email:'leitung@example.test'}},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signOut:async()=>({error:null})
   },
   from:(table)=>{
    const builder={
     select(){return this;},
     eq(){return this;},
     maybeSingle:async function(){
      if(table==='app_owner')return {data:{user_id:'user-1'},error:null};
      return {data:{state:{names:[{name:'Test Person',initials:'TP',group:'Nest',hours:20,vacation:0,special:0,meetings:0,supervision:0,color:'green'}],groups:['Nest'],shifts:[{id:'s1',person:'Test Person',group:'Nest',serviceType:'Normaler Dienst',day:0,start:'08:00',end:'10:00',weekOffset:0}],absences:[],events:[],weekOffset:0},updated_at:'2026-10-30T10:00:00.000Z'},error:null};
     },
     update(payload){window.__savedState=payload.state;return this;},
     insert(payload){window.__savedState=payload.state;return this;}
    };
    return builder;
   }
  })
 };
`;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 const errors=[];page.on('pageerror',e=>errors.push({name:e.name,message:e.message,stack:e.stack}));page.on('console',m=>{if(m.type()==='error')errors.push({console:m.text()})});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  const person=names[0];
  shifts=shifts.filter(s=>s.id!=='s1');
  shifts.push({id:'s1',person:person.name,group:person.group,serviceType:'Normaler Dienst',day:0,start:'08:00',end:'10:00',weekOffset:0});
  window.__savedState=null;
  scheduleCloudSave=()=>{window.__savedState=cloudSnapshot()};
  currentPage='dienstplan';render();
 });
 const handle=page.locator('[data-resize-shift="s1"][data-resize-edge="end"]');
 await expect(handle).toBeVisible();
 const bounds=await handle.boundingBox();
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
 await page.mouse.down();
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2+8,{steps:4});
 await page.mouse.up();
 await expect(page.locator('[data-edit-shift="s1"] strong')).toHaveText('08:00–10:15');
 await expect.poll(()=>page.evaluate(()=>window.__savedState?.shifts?.[0]?.end),{timeout:2500}).toBe('10:15');
 const shiftBlock=page.locator('[data-edit-shift="s1"]');
 const shiftBounds=await shiftBlock.boundingBox();
 await page.mouse.move(shiftBounds.x+shiftBounds.width/2,shiftBounds.y+2);
 await page.mouse.down();
 await expect.poll(()=>page.evaluate(()=>activeShiftResize?.edge)).toBe('start');
 await page.mouse.move(shiftBounds.x+shiftBounds.width/2,shiftBounds.y-6,{steps:4});
 await expect.poll(()=>page.evaluate(()=>activeShiftResize?.previewStart)).toBe(465);
 await page.mouse.up();
 await expect(page.locator('[data-edit-shift="s1"] strong')).toHaveText('07:45–10:15');
 await expect.poll(()=>page.evaluate(()=>window.__savedState?.shifts?.[0]?.start),{timeout:2500}).toBe('07:45');
 const popupPromise=page.waitForEvent('popup');
 await page.locator('[data-action="print-plan"]').click();
 const popup=await popupPromise;
 await expect(popup.locator('#pdfWeekView')).toContainText('Montag');
 await expect(popup.locator('#pdfWeekView')).toContainText('Anna Schmidt');
 await expect(popup.locator('style[data-pdf-print]')).toHaveCount(1);
 await popup.emulateMedia({media:'print'});
 await expect.poll(()=>popup.locator('#pdfWeekView').evaluate(el=>getComputedStyle(el).display)).toBe('block');
 const verticalMode=await popup.evaluate(()=>{
  const label=document.createElement('div');
  label.className='pdf-time-shift';
  label.innerHTML='<strong>08:00–16:00</strong><span>Nest</span>';
  document.querySelector('.pdf-time-track')?.appendChild(label);
  return getComputedStyle(label.querySelector('strong')).writingMode;
 });
 expect(verticalMode).toBe('vertical-rl');
 await expect.poll(()=>popup.locator('#pdfWeekView .pdf-time-track').first().evaluate(el=>{
  const style=getComputedStyle(el);
  return style.backgroundColor==='rgb(255, 255, 255)';
 })).toBe(true);
 expect(errors).toEqual([]);
});

test('factory reset clears saved operational data after explicit confirmation',async({page})=>{
 const stub=`
 window.__savedState=null;
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  from:()=>({update(payload){window.__savedState=payload.state;return this;},eq(){return this;},select(){return this;},maybeSingle:async()=>({data:{updated_at:'2026-10-31T09:00:00.000Z'},error:null})})
 })};
 `;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  cloudReady=false;cloudUser={id:'user-1'};cloudUpdatedAt='2026-10-31T08:00:00.000Z';
  shifts=[{id:'old',person:names[0].name,day:0,start:'08:00',end:'12:00',weekOffset:0}];
  events=[{id:'event-old',title:'Meeting'}];absences=[{id:'absence-old',name:names[0].name}];
  currentPage='einstellungen';render();cloudReady=true;
 });
 await expect(page.locator('[data-action="reset-system"]')).toBeVisible();
 page.on('dialog',async dialog=>{if(dialog.type()==='prompt')await dialog.accept('RESET');else await dialog.accept();});
 await page.locator('[data-action="reset-system"]').click();
 await expect.poll(()=>page.evaluate(()=>window.__savedState?.shifts?.length)).toBe(0);
 expect(await page.evaluate(()=>({events:events.length,absences:absences.length,shifts:shifts.length,names:names.length,groups:groups.length,weekOffset,selectedGroup}))).toEqual({events:0,absences:0,shifts:0,names:11,groups:3,weekOffset:0,selectedGroup:'Alle Gruppen'});
});


test('PDF export paginates large teams into readable A4 pages',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  names=Array.from({length:23},(_,i)=>({name:'Mitarbeiter '+String(i+1).padStart(2,'0'),initials:'M'+(i+1),group:groups[i%groups.length],hours:30,vacation:30,color:'green'}));
  shifts=[{id:'long-shift',person:'Mitarbeiter 01',group:groups[0],serviceType:'Normaler Dienst',day:0,start:'07:00',end:'14:00',weekOffset:0}];
  selectedGroup='Alle Gruppen';
  currentPage='dienstplan';
  render();
 });
 const popupPromise=page.waitForEvent('popup');
 await page.locator('[data-action="print-plan"]').click();
 const popup=await popupPromise;
 await expect(popup.locator('#pdfWeekView .pdf-time-page')).toHaveCount(3);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(0).locator('.pdf-time-staff-head')).toHaveCount(50);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(1).locator('.pdf-time-staff-head')).toHaveCount(50);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(2).locator('.pdf-time-staff-head')).toHaveCount(15);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(2)).toContainText('Mitarbeitende 21–23 von 23');
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(0).locator('.pdf-pause-marker')).toContainText('Pause 30 Min.');
});


test('calendar arrows navigate by full months, not by weeks',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();currentPage='kalender';render()});
 const heading=page.locator('.card-header h2');
 const before=await heading.textContent();
 await page.locator('[data-action="next-month"]').click();
 const after=await heading.textContent();
 expect(after).not.toBe(before);
 await page.locator('[data-action="prev-month"]').click();
 await expect(heading).toHaveText(before);
});


test('employee form saves individual regular workdays',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();currentPage='mitarbeitende';render()});
 await page.locator('[data-action="add-person"]').click();
 await expect(page.locator('#personForm input[name="workdays"]:checked')).toHaveCount(5);
 await page.locator('#personForm input[name="workdays"][value="1"]').uncheck();
 await page.locator('#personForm input[name="workdays"][value="3"]').uncheck();
 await page.locator('#personForm input[name="name"]').fill('Teilzeit Test');
 await page.locator('#personForm input[name="hours"]').fill('24');
 await page.locator('#personForm input[name="vacation"]').fill('30');
 await page.locator('#personForm button[type="submit"]').click();
 const saved=await page.evaluate(()=>names.find(p=>p.name==='Teilzeit Test')?.workdays);
 expect(saved).toEqual([0,2,4]);
});


test('large weekly team stays within the mobile viewport with an internally scrollable staff grid',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  names=Array.from({length:23},(_,i)=>({name:'Mitarbeiter '+String(i+1).padStart(2,'0'),initials:'M'+(i+1),group:groups[i%groups.length],hours:30,vacation:30,color:'green'}));
  currentPage='dienstplan';
  render();
 });
 const sizes=await page.evaluate(()=>{
  const scroll=document.querySelector('.outlook-calendar-scroll');
  return {viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,scrollWidth:scroll.scrollWidth,clientWidth:scroll.clientWidth};
 });
 expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
 expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth);
});


test('automatic planning handles multiple groups, part-time days, meetings, absences and blocked times',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const result=await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  const make=(name,group,hours=20,workdays=[0,1,2,3,4],blocks=[])=>({name,initials:name.slice(0,2),group,hours,vacation:30,workdays,blocks,color:'green'});
  names=[
   make('N1','Nest',20),make('N2','Nest',16),make('N3','Nest',20,[0,2,4]),
   make('S1','Sonnengruppe',15,[0,2,4],[{kind:'recurring',day:2,start:'09:00',end:'11:00'}]),
   make('S2','Sonnengruppe',20),make('S3','Sonnengruppe',20),
   make('T1','Sternengruppe',20),make('T2','Sternengruppe',20),make('T3','Sternengruppe',20)
  ];
  plannerSettings.frame={start:'07:00',end:'16:00'};
  plannerSettings.minimumByGroup={Nest:1,Sonnengruppe:1,Sternengruppe:1};
  plannerSettings.minimumEarlyByGroup={Nest:1,Sonnengruppe:1,Sternengruppe:1};
  plannerSettings.minimumLateByGroup={Nest:1,Sonnengruppe:1,Sternengruppe:1};
  plannerSettings.mergeEarlyGroups=false;plannerSettings.mergeLateGroups=false;
  const monday=iso(dateForDay(0)),tuesday=iso(dateForDay(1)),wednesday=iso(dateForDay(2)),friday=iso(dateForDay(4));
  events=[
   {id:'all-day-event',date:tuesday,time:'07:00–16:00',title:'Ganztägiger Termin',attendees:['N1']},
   {id:'meeting-event',date:wednesday,time:'13:00–15:00',title:'Teammeeting',attendees:['S3'],repeatWeekly:true,repeatDay:3}
  ];
  absences=[{id:'absence-n2',name:'N2',type:'Urlaub',from:monday,to:wednesday,status:'Genehmigt'}];
  shifts=[{id:'manual-meeting',person:'N3',group:'Nest',serviceType:'Meeting',day:0,start:'08:00',end:'10:00',weekOffset:0}];
  weekOffset=0;selectedGroup='Alle Gruppen';
  window.__plannerAlerts=[];
  window.confirm=()=>true;window.alert=message=>window.__plannerAlerts.push(String(message));
  scheduleCloudSave=()=>{};render=()=>{};
  generateWeekPlan();
  const planned=weekShifts(0),generated=planned.filter(x=>x.generated);
  const diagnostics=weeklyPlanningDiagnostics(0,planned);
  const byPerson={};
  for(const person of names){
   const rows=planned.filter(x=>x.person===person.name);
   byPerson[person.name]={shiftHours:rows.reduce((sum,x)=>sum+shiftWorkMinutes(x),0)/60,eventHours:eventMinutesForPersonWeek(person,0)/60,total:rows.reduce((sum,x)=>sum+shiftWorkMinutes(x),0)/60+eventMinutesForPersonWeek(person,0)/60,contract:person.hours,workdays:personWorkingDays(person)};
  }
  return {
   generatedCount:generated.length,retainedMeeting:planned.some(x=>x.id==='manual-meeting'),
   generatedOnlyNormal:generated.every(x=>x.serviceType==='Normaler Dienst'),
   outsideWorkdays:generated.filter(x=>!personWorksOnDay(names.find(p=>p.name===x.person),x.day)).length,
   diagnostics:{absence:diagnostics.absenceConflicts.length,blocks:diagnostics.blockConflicts.length,overlaps:diagnostics.overlaps.length,workRules:diagnostics.workRuleConflicts.length,events:diagnostics.eventConflicts.length},
   rows:byPerson,alerts:window.__plannerAlerts,
   generated,events,absences,names
  };
 });
 expect(result.generatedCount).toBeGreaterThan(0);
 expect(result.retainedMeeting).toBe(true);
 expect(result.generatedOnlyNormal).toBe(true);
 expect(result.outsideWorkdays).toBe(0);
 expect(result.diagnostics).toEqual({absence:0,blocks:0,overlaps:0,workRules:0,events:0});
 expect(result.rows.N2.total).toBeCloseTo(16,2);
 expect(result.rows.N1.total).toBeCloseTo(20,2);
 expect(result.rows.N3.total).toBeCloseTo(20,2);
 expect(result.rows.S1.total).toBeCloseTo(15,2);
 expect(result.rows.S3.total).toBeCloseTo(20,2);
 expect(result.generated.some(x=>x.person==='N1'&&x.day===1)).toBe(false);
 expect(result.generated.some(x=>x.person==='N2'&&x.day<=2)).toBe(false);
 expect(result.generated.some(x=>x.person==='S1'&&x.day===2&&
  Number(x.start.slice(0,2))*60+Number(x.start.slice(3))<660&&
  Number(x.end.slice(0,2))*60+Number(x.end.slice(3))>540)).toBe(false);
 const finalAlert=result.alerts.at(-1)||'';
 expect(finalAlert).not.toContain('Std. konnten in dieser Woche');
});

test('special-service meetings do not falsely satisfy the automatic staffing score',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const result=await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  plannerSettings.minimumByGroup={Nest:1};
  const meeting={person:'A',group:'Nest',day:0,start:'08:00',end:'12:00',serviceType:'Meeting'};
  const normal={person:'B',group:'Nest',day:0,start:'08:00',end:'12:00',serviceType:'Normaler Dienst'};
  return {meetingOnly:countCoverage([meeting],0,480,'Nest','group'),normalOnly:countCoverage([normal],0,480,'Nest','group'),combined:countCoverage([meeting,normal],0,480,'Nest','group')};
 });
 expect(result).toEqual({meetingOnly:0,normalOnly:1,combined:1});
});
