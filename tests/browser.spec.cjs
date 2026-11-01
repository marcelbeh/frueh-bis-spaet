const {test,expect}=require('@playwright/test');
test('login screen loads and fits mobile viewport',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({data:{},error:null}),signOut:async()=>({error:null})}})};'}));
 const errors=[];page.on('pageerror',e=>errors.push({name:e.name,message:e.message,stack:e.stack}));page.on('console',m=>{if(m.type()==='error')errors.push({console:m.text()})});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await expect(page.locator('#cloudLoginForm')).toBeVisible();
 await expect(page.getByText('Geschützter Zugang für Leitung und Mitarbeitende',{exact:true})).toBeVisible();
 await expect(page.locator('input[name="email"]')).toBeVisible();
 await expect(page.locator('input[name="password"]')).toBeVisible();
 expect(errors).toEqual([]);
});
test('employee login shows only the signed-in employee schedule',async({page})=>{
 const stub=`
 window.__employeeQueries=[];
 window.supabase={createClient:()=>({
  auth:{
   getSession:async()=>({data:{session:null},error:null}),
   signInWithPassword:async()=>({data:{user:{id:'employee-1',email:'employee@example.test'}},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
   signOut:async()=>({error:null})
  },
  functions:{invoke:async name=>{window.__employeeFunction=name;return {data:{employeeName:'Mitarbeiter 01',shifts:[{date:'2026-10-31',start:'08:00',end:'14:00',serviceType:'Normaler Dienst'}]},error:null}}},
  from:table=>{window.__employeeQueries.push(table);return {select(){return this},eq(){return this},maybeSingle:async()=>table==='app_owner'?{data:null,error:null}:table==='employee_access'?{data:{person_name:'Mitarbeiter 01',enabled:true},error:null}:{data:null,error:{message:'Unexpected table query'}}}}
 })};
 `;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.locator('input[name="email"]').fill('employee@example.test');
 await page.locator('input[name="password"]').fill('test-password');
 await page.locator('#cloudLoginForm button[type="submit"]').click();
 await expect(page.locator('#employeePortal h1')).toHaveText('Mein Dienstplan');
 await expect(page.locator('#employeePortal')).toContainText('Mitarbeiter 01');
 await expect(page.locator('#employeePortal')).toContainText('08:00–14:00');
 await expect(page.locator('#employeePortal')).toContainText('31.10.');
 await expect(page.locator('.app-shell')).toBeHidden();
 expect(await page.evaluate(()=>window.__employeeFunction)).toBe('employee-schedule');
 expect(await page.evaluate(()=>window.__employeeQueries)).toEqual(['app_owner','employee_access','app_owner']);
 await expect(page.locator('#employeePortal')).not.toContainText('Mitarbeiter 02');
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
 await popup.waitForLoadState('load');
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
 // The grid's hourly overlay must be opaque white between its grey guide lines.
 const printSurface=await popup.evaluate(()=>{
  const selectors=['html','body','#pageContent','#pdfWeekView','.pdf-time-page','.pdf-time-grid','.pdf-time-axis','.pdf-time-column','.pdf-time-track'];
  const surfaces=selectors.map(selector=>{
   const el=document.querySelector(selector);
   if(!el)return {selector,missing:true};
   const style=getComputedStyle(el);
   return {selector,backgroundColor:style.backgroundColor,backgroundImage:style.backgroundImage};
  });
  const track=document.querySelector('.pdf-time-track');
  const overlay=track?getComputedStyle(track,'::after'):null;
  const shift=document.querySelector('.pdf-time-shift.service-normal');
  return {
   surfaces,
   overlay:overlay?{backgroundColor:overlay.backgroundColor,backgroundImage:overlay.backgroundImage,content:overlay.content}:null,
   shiftClass:shift?shift.classList.contains('service-normal'):false,
   pageSize:getComputedStyle(document.querySelector('.pdf-time-page')).height,
   pageBreak:getComputedStyle(document.querySelector('.pdf-time-page')).breakAfter
  };
 });
 expect(printSurface.surfaces.every(s=>s.missing||s.backgroundColor==='rgb(255, 255, 255)')).toBe(true);
 expect(printSurface.overlay?.content).not.toBe('none');
 expect(printSurface.overlay?.backgroundImage).toContain('255, 255, 255');
 expect(printSurface.shiftClass).toBe(true);
 expect(printSurface.pageSize).not.toBe('0px');
 expect(printSurface.pageBreak).toBe('auto');
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


test('special events are deleted only after confirmation and persisted to app state',async({page})=>{
 const stub=`
  window.__pendingState=null;window.__savedState=null;window.__saveCalls=0;window.__saveError=false;
  window.supabase={createClient:()=>({
   auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
   from:()=>({update(payload){window.__pendingState=payload.state;return this;},eq(){return this;},select(){return this;},maybeSingle:async()=>{window.__saveCalls++;if(window.__saveError)return {data:null,error:{message:'simulated write failure'}};window.__savedState=window.__pendingState;return {data:{updated_at:'2026-11-01T10:00:00.000Z'},error:null}}})
  })};
 `;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  cloudUser={id:'leader-1'};activeCloudMode='leader';cloudUpdatedAt='2026-11-01T09:00:00.000Z';
  events=[{id:'event-1',date:'2026-11-02',title:'Teamfest',type:'Meeting',time:'10:00–11:00',people:2,attendees:[]},{id:'event-2',date:'2026-11-03',title:'Fortbildung',type:'Fortbildung',time:'12:00–13:00',people:1,attendees:[]}];
  currentPage='sondertermine';render();cloudReady=true;
 });
 await expect(page.locator('[data-delete-event]')).toHaveCount(2);
 await page.locator('[data-delete-event="event-1"]').click();
 await expect(page.getByText('Möchtest du diesen Sondertermin wirklich löschen?')).toBeVisible();
 await page.getByRole('button',{name:'Abbrechen'}).click();
 expect(await page.evaluate(()=>({events:events.length,saves:window.__saveCalls}))).toEqual({events:2,saves:0});
 await page.locator('[data-delete-event="event-1"]').click();
 await page.getByRole('button',{name:'Termin löschen'}).click();
 await expect.poll(()=>page.evaluate(()=>window.__savedState?.events?.map(event=>event.id))).toEqual(['event-2']);
 await expect(page.locator('[data-delete-event]')).toHaveCount(1);
});

test('special-event deletion restores the event and reports a database error',async({page})=>{
 const stub=`
  window.__pendingState=null;window.__savedState=null;window.__saveError=true;
  window.supabase={createClient:()=>({
   auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
   from:()=>({update(payload){window.__pendingState=payload.state;return this;},eq(){return this;},select(){return this;},maybeSingle:async()=>({data:null,error:{message:'simulated write failure'}})})
  })};
 `;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  cloudUser={id:'leader-1'};activeCloudMode='leader';cloudUpdatedAt='2026-11-01T09:00:00.000Z';
  events=[{id:'event-1',date:'2026-11-02',title:'Teamfest',type:'Meeting',time:'10:00–11:00',people:2,attendees:[]},{id:'event-2',date:'2026-11-03',title:'Fortbildung',type:'Fortbildung',time:'12:00–13:00',people:1,attendees:[]}];
  currentPage='sondertermine';render();cloudReady=true;
 });
 let errorMessage='';
 page.on('dialog',async dialog=>{errorMessage=dialog.message();await dialog.accept();});
 await page.locator('[data-delete-event="event-1"]').click();
 await page.getByRole('button',{name:'Termin löschen'}).click();
 await expect.poll(()=>page.evaluate(()=>events.length)).toBe(2);
 await expect(page.locator('[data-delete-event]')).toHaveCount(2);
 expect(errorMessage).toContain('Die Änderungen konnten nicht gespeichert werden.');
 expect(await page.evaluate(()=>window.__savedState)).toBeNull();
});

test('PDF export paginates large teams into readable A4 pages',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  names=Array.from({length:23},(_,i)=>({name:'Mitarbeiter '+String(i+1).padStart(2,'0'),initials:'M'+(i+1),group:groups[i%groups.length],hours:30,vacation:30,color:'green'}));
  shifts=[
   {id:'long-shift-1',person:'Mitarbeiter 01',group:groups[0],serviceType:'Normaler Dienst',day:0,start:'07:00',end:'14:00',weekOffset:0},
   {id:'long-shift-2',person:'Mitarbeiter 02',group:groups[1],serviceType:'Normaler Dienst',day:0,start:'07:00',end:'14:00',weekOffset:0},
   {id:'long-shift-3',person:'Mitarbeiter 03',group:groups[2],serviceType:'Normaler Dienst',day:0,start:'07:00',end:'14:00',weekOffset:0}
  ];
  selectedGroup='Alle Gruppen';
  currentPage='dienstplan';
  render();
 });
 const popupPromise=page.waitForEvent('popup');
 await page.locator('[data-action="print-plan"]').click();
 const popup=await popupPromise;
 await popup.waitForLoadState('load');
 await popup.emulateMedia({media:'print'});
 await expect(popup.locator('#pdfWeekView .pdf-time-page')).toHaveCount(2);
 await expect(page.locator('[class*="pdf-group-"]')).toHaveCount(0);
 for(const groupIndex of [0,1,2]){
  await expect(popup.locator('.pdf-time-staff-head.pdf-group-'+groupIndex).first()).toBeVisible();
  await expect(popup.locator('.pdf-time-shift.service-normal.pdf-group-'+groupIndex).first()).toBeVisible();
 }
 const groupColors=await popup.evaluate(()=>[0,1,2].map(index=>getComputedStyle(document.querySelector('.pdf-time-staff-head.pdf-group-'+index)).backgroundColor));
 expect(new Set(groupColors).size).toBe(3);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(0).locator('.pdf-time-staff-head')).toHaveCount(60);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(1).locator('.pdf-time-staff-head')).toHaveCount(55);
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(1)).toContainText('Mitarbeitende 13–23 von 23');
 await expect(popup.locator('#pdfWeekView .pdf-time-page').nth(0).locator('.pdf-pause-marker').first()).toContainText('Pause 30 Min.');
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


test('closure periods are saved, visible, excluded from planning and not charged as vacation',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();window.alert=()=>{};scheduleCloudSave=()=>{};currentPage='einstellungen';render()});
 await page.locator('#closure-from').fill('2026-10-26');
 await page.locator('#closure-to').fill('2026-10-28');
 await page.locator('#closure-label').fill('Herbstschließzeit');
 await page.locator('[data-action="add-closure"]').click();
 await expect(page.getByText('Herbstschließzeit')).toBeVisible();
 const saved=await page.evaluate(()=>{
  names=[{name:'Test Person',initials:'TP',group:'Nest',hours:12,vacation:30,workdays:[0,1,2,3,4],color:'green'}];
  groups.splice(0,groups.length,'Nest');
  plannerSettings.frame={start:'07:00',end:'16:00'};
  plannerSettings.minimumByGroup={Nest:0};plannerSettings.minimumEarlyByGroup={Nest:0};plannerSettings.minimumLateByGroup={Nest:0};
  events=[];absences=[];shifts=[];weekOffset=0;selectedGroup='Alle Gruppen';
  const snapshot=cloudSnapshot();
  closures=[];
  applyCloudSnapshot(snapshot);
  const requestedVacation=vacationDaysForPerson(names[0],'2026-10-26','2026-10-30');
  window.confirm=()=>true;
  generateWeekPlan();
  const generated=weekShifts(0);
  return {snapshotClosures:snapshot.closures.length,restoredClosures:closures.length,requestedVacation,plannedDays:[...new Set(generated.map(x=>x.day))],plannedHours:generated.reduce((sum,x)=>sum+shiftWorkMinutes(x),0)/60,diagnostics:weeklyPlanningDiagnostics(0,generated).closureConflicts.length};
 });
 expect(saved.snapshotClosures).toBe(1);
 expect(saved.restoredClosures).toBe(1);
 expect(saved.requestedVacation).toBe(2);
 expect(saved.plannedDays.every(day=>day===3||day===4)).toBe(true);
 expect(saved.plannedHours).toBe(12);
 expect(saved.diagnostics).toBe(0);
 await page.evaluate(()=>{currentPage='kalender';render()});
 await expect(page.getByText('Herbstschließzeit').first()).toBeVisible();
 await page.evaluate(()=>{currentPage='dienstplan';render()});
 await expect(page.locator('.closure-event')).toHaveCount(3);
 const conflictCount=await page.evaluate(()=>{
  shifts.push({id:'closed-day-manual',person:'Test Person',group:'Nest',serviceType:'Normaler Dienst',day:0,start:'08:00',end:'10:00',weekOffset:0});
  const count=weeklyPlanningDiagnostics(0).closureConflicts.length;
  shifts=shifts.filter(x=>x.id!=='closed-day-manual');
  return count;
 });
 expect(conflictCount).toBe(1);
 await page.evaluate(()=>addShiftModal());
 await page.locator('#shiftForm select[name="day"]').selectOption('0');
 await page.locator('#shiftForm input[name="start"]').fill('08:00');
 await page.locator('#shiftForm input[name="end"]').fill('10:00');
 await page.locator('#shiftForm button[type="submit"]').click();
 expect(await page.evaluate(()=>shifts.some(x=>x.day===0))).toBe(false);
 await page.locator('#closeModal').click();
 const popupPromise=page.waitForEvent('popup');
 await page.locator('[data-action="print-plan"]').click();
 const popup=await popupPromise;
 await expect(popup.locator('.pdf-time-closure')).toHaveCount(3);
 await expect(popup.locator('.pdf-time-closure').first()).toContainText('Herbstschließzeit');
});

test('navigation icon tiles use plum while menu text and unboxed icons remain white',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();currentPage='dashboard';render();navigate('mitarbeitende')});
 const whiteNavColors=async()=>page.locator('#sidebar .nav-parent .nav-label,#sidebar .nav-parent .nav-chevron,#sidebar .nav-item:not(.nav-child) > .nav-label,#sidebar .nav-child-label,#sidebar .nav-child-icon').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).color));
 const plumTileColors=async()=>page.locator('#sidebar .nav-parent .nav-icon,#sidebar .nav-item:not(.nav-child) .nav-icon').evaluateAll(nodes=>nodes.map(node=>({color:getComputedStyle(node).color,stroke:getComputedStyle(node.querySelector('svg')).stroke,background:getComputedStyle(node).backgroundColor})));
 const expectNavColors=async()=>{expect((await whiteNavColors()).every(color=>color==='rgb(255, 255, 255)')).toBe(true);expect((await plumTileColors()).every(icon=>icon.color==='rgb(91, 42, 134)'&&icon.stroke==='rgb(91, 42, 134)'&&icon.background==='rgb(237, 230, 248)')).toBe(true)};
 for(const parent of await page.locator('.nav-parent').all()){
  if(await parent.getAttribute('aria-expanded')!=='true')await parent.click();
 }
 await expectNavColors();
 await page.locator('#sidebar [data-menu-toggle="verwaltung"]').click();
 await expectNavColors();
 await page.locator('#sidebarCollapse').click();
 await expectNavColors();
 await page.locator('#sidebarCollapse').click();
 const items=page.locator('.nav-child');
 await expect(items).toHaveCount(11);
 await expect(page.locator('.nav-child-icon svg')).toHaveCount(11);
 const desktop=await items.evaluateAll(elements=>elements.map(item=>({
  icon:item.querySelector('.nav-child-icon')?.dataset.icon,
  color:getComputedStyle(item.querySelector('.nav-child-icon')).color,
  stroke:getComputedStyle(item.querySelector('.nav-child-icon svg')).stroke,
  marker:getComputedStyle(item,'::before').content
 })));
 expect(desktop.every(item=>item.icon&&item.color==='rgb(255, 255, 255)'&&item.stroke==='rgb(255, 255, 255)'&&item.marker==='none')).toBe(true);
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobileMenu').click();
 await expect(page.locator('.sidebar')).toHaveClass(/open/);
 await expect(page.locator('.nav-child-icon svg')).toHaveCount(11);
 await expectNavColors();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('dual-role employee switches areas without a new sign-in',async({page})=>{
 const stub=`
 window.__ownerEnabled=false;window.__signedOut=0;window.__employeeScheduleCalls=0;
 const state={names:[{name:'Mitarbeiter 01',initials:'M1',group:'Nest',hours:20,vacation:0,special:0,meetings:0,supervision:0,color:'plum'}],groups:['Nest'],shifts:[],absences:[],events:[],weekOffset:0};
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:null},error:null}),signInWithPassword:async()=>({data:{user:{id:'employee-1',email:'employee@example.test'}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{window.__signedOut++;return {error:null}}},
  functions:{invoke:async name=>{if(name==='employee-schedule')window.__employeeScheduleCalls++;return {data:{employeeName:'Mitarbeiter 01',shifts:[]},error:null}}},
  from:table=>{const query={values:null,select(){return this},eq(){return this},upsert(values){this.values=values;return this},single:async()=>({data:{user_id:query.values.user_id,profile:query.values.profile,source_legacy:false},error:null}),maybeSingle:async()=>table==='app_owner'?(window.__ownerEnabled?{data:{user_id:'employee-1'},error:null}:{data:null,error:null}):table==='employee_access'?{data:{user_id:'employee-1',person_name:'Mitarbeiter 01',enabled:true},error:null}:table==='app_state'?{data:{state,updated_at:'2026-10-30T10:00:00.000Z'},error:null}:{data:null,error:{message:'Unexpected query'}},then(resolve){resolve(table==='leader_profiles'?{data:[],error:null}:{data:null,error:{message:'Unexpected query'}})}};return query}
 })};
 `;
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:stub}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.locator('input[name="email"]').fill('employee@example.test');
 await page.locator('input[name="password"]').fill('test-password');
 await page.locator('#cloudLoginForm button[type="submit"]').click();
 await expect(page.locator('#employeePortal h1')).toHaveText('Mein Dienstplan');
 await page.evaluate(()=>{window.__ownerEnabled=true;window.dispatchEvent(new Event('focus'))});
 const leaderButton=page.locator('[data-employee-to-leader]');
 await expect(leaderButton).toBeVisible();
 await leaderButton.click();
 await expect(page.locator('#pageContent')).toBeVisible();
 await expect(page.locator('#employeePortal')).toHaveCount(0);
 await page.locator('#employeeAreaSwitch').click();
 await expect(page.locator('#employeePortal h1')).toHaveText('Mein Dienstplan');
 expect(await page.evaluate(()=>window.__signedOut)).toBe(0);
 expect(await page.evaluate(()=>window.__employeeScheduleCalls)).toBe(2);
});

test('weekly plan uses three aligned WUSELO staffing cards and grouped staff columns',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  names=[
   {name:'Tina Gruppe',initials:'TG',group:'Sternengruppe',hours:30,color:'plum'},
   {name:'Zora Nest',initials:'ZN',group:'Nest',hours:30,color:'plum'},
   {name:'Anna Nest',initials:'AN',group:'Nest',hours:30,color:'plum'},
   {name:'Sarah Sonne',initials:'SS',group:'Sonnengruppe',hours:30,color:'plum'}
  ];
  shifts=[
   {id:'visual-early',person:'Anna Nest',group:'Nest',serviceType:'Normaler Dienst',day:0,start:'07:30',end:'12:00',weekOffset:0},
   {id:'visual-core',person:'Sarah Sonne',group:'Sonnengruppe',serviceType:'Normaler Dienst',day:0,start:'10:00',end:'14:00',weekOffset:0},
   {id:'visual-late',person:'Tina Gruppe',group:'Sternengruppe',serviceType:'Normaler Dienst',day:0,start:'14:30',end:'16:00',weekOffset:0}
  ];
  currentPage='dienstplan';selectedGroup='Alle Gruppen';render();
 });
 const day=page.locator('.day-calendar').first();
 await expect(day.locator('.day-coverage')).toHaveCount(3);
 await expect(day.locator('.day-coverage[data-period="early"]')).toContainText('Früh');
 await expect(day.locator('.day-coverage[data-period="core"]')).toContainText('Kern');
 await expect(day.locator('.day-coverage[data-period="late"]')).toContainText('Spät');
 await expect(day.locator('[data-edit-shift="visual-early"]')).toHaveClass(/duty-period-early/);
 await expect(day.locator('[data-edit-shift="visual-core"]')).toHaveClass(/duty-period-core/);
 await expect(day.locator('[data-edit-shift="visual-late"]')).toHaveClass(/duty-period-late/);
 const desktop=await page.evaluate(()=>{
  const day=document.querySelector('.day-calendar'),cards=[...day.querySelectorAll('.day-coverage')];
  const heads=[...day.querySelectorAll('.outlook-staff-head')],columns=[...day.querySelectorAll('.outlook-staff-column')];
  return {cardWidths:cards.map(x=>x.getBoundingClientRect().width),cardHeights:cards.map(x=>x.getBoundingClientRect().height),names:heads.map(x=>x.querySelector('strong').textContent),headLeft:heads.map(x=>x.getBoundingClientRect().left),columnLeft:columns.map(x=>x.getBoundingClientRect().left)};
 });
 expect(Math.max(...desktop.cardWidths)-Math.min(...desktop.cardWidths)).toBeLessThan(1);
 expect(Math.max(...desktop.cardHeights)-Math.min(...desktop.cardHeights)).toBeLessThan(1);
 expect(desktop.names).toEqual(['Anna Nest','Zora Nest','Sarah Sonne','Tina Gruppe']);
 expect(desktop.headLeft).toEqual(desktop.columnLeft);
 await page.setViewportSize({width:820,height:1000});
 const tablet=await page.evaluate(()=>{
  const day=document.querySelector('.day-calendar'),cards=[...day.querySelectorAll('.day-coverage')];
  return {viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth,cardWidths:cards.map(x=>x.getBoundingClientRect().width)};
 });
 expect(tablet.page).toBeLessThanOrEqual(tablet.viewport);
 expect(Math.max(...tablet.cardWidths)-Math.min(...tablet.cardWidths)).toBeLessThan(1);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  const day=document.querySelector('.day-calendar'),cards=[...day.querySelectorAll('.day-coverage')];
  return {viewport:document.documentElement.clientWidth,page:document.documentElement.scrollWidth,cardWidths:cards.map(x=>x.getBoundingClientRect().width)};
 });
 expect(mobile.page).toBeLessThanOrEqual(mobile.viewport);
 expect(Math.max(...mobile.cardWidths)-Math.min(...mobile.cardWidths)).toBeLessThan(1);
});

test('dashboard greeting follows local time and updates at the next time band',async({browser})=>{
 const context=await browser.newContext({timezoneId:'Europe/Berlin'});
 const page=await context.newPage();
 await page.clock.install({time:new Date('2026-11-01T03:59:59.000Z')});
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'load'});
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();leaderProfile.name='Marcel Beh';currentPage='dashboard';render()});
 await expect(page.locator('.dashboard-welcome h1')).toHaveText('Gute Nacht, Marcel Beh!');
 expect(await page.evaluate(()=>[4,5,10,11,17,18,21,22,23].map(dashboardGreetingForHour))).toEqual(['Gute Nacht','Guten Morgen','Guten Morgen','Guten Tag','Guten Tag','Guten Abend','Guten Abend','Gute Nacht','Gute Nacht']);
 await page.clock.fastForward(1100);
 await expect(page.locator('.dashboard-welcome h1')).toHaveText('Guten Morgen, Marcel Beh!');
 await context.close();
});

test('kitaplanio logo and app icon match the final brand specification',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const loginLogo=page.locator('#cloudLogin .auth-brand-logo');
 await expect(loginLogo).toHaveAttribute('src','./assets/wuselo-logo.svg?v=kitaplanio-transparent-light-1');
 const mobileHeaderLogo=page.locator('.mobile-brand img');
 await expect(mobileHeaderLogo).toHaveAttribute('src','./assets/wuselo-logo.svg?v=kitaplanio-transparent-light-1');
 const lightResponse=await page.request.get('http://127.0.0.1:4173/assets/wuselo-logo.svg?v=kitaplanio-transparent-light-1');
 expect(lightResponse.ok()).toBe(true);
 const lightSvg=await lightResponse.text();
 expect(lightSvg).not.toContain('<rect');
 expect(lightSvg).toContain('stroke="#5B2A86"');
 expect(lightSvg).toContain('font-weight="900" letter-spacing="-1.8" fill="#5B2A86"');
 expect(lightSvg).toContain('<circle cx="339.6" cy="20" r="5.5" fill="#FFC107"/>');
 expect(lightSvg).toContain('fill="#75608E">Dienstplanung, die mitdenkt.</text>');
 await page.evaluate(()=>{document.querySelector('#cloudLogin')?.remove();currentPage='dashboard';render()});
 const logo=page.locator('.brand-logo');
 await expect(logo).toHaveAttribute('alt','kitaplanio – Dienstplanung, die mitdenkt.');
 const desktopLogo=await logo.evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth}));
 expect(desktopLogo.width).toBeGreaterThan(0);
 expect(desktopLogo.height).toBeGreaterThan(0);
 expect(desktopLogo.naturalWidth).toBeGreaterThan(0);
 const logoResponse=await page.request.get('http://127.0.0.1:4173/assets/wuselo-logo-dark.svg');
 expect(logoResponse.ok()).toBe(true);
 const svg=await logoResponse.text();
 expect(svg).toContain('M8 45 56 12 104 45');
 expect(svg).toContain('M82 31V16H92V38');
 expect(svg).toContain('<tspan x="130" textLength="203" lengthAdjust="spacingAndGlyphs">kitaplan</tspan><tspan x="333" textLength="13.2" lengthAdjust="spacingAndGlyphs">i</tspan><tspan x="346.2" textLength="34" lengthAdjust="spacingAndGlyphs">o</tspan>');
 expect(svg).toContain('<circle cx="339.6" cy="20" r="5.5" fill="#FFC107"/>');
 expect(svg).toContain('Dienstplanung, die mitdenkt.');
 expect(svg).not.toContain('Ordnung im Kita-Trubel.');
 const iconResponse=await page.request.get('http://127.0.0.1:4173/assets/wuselo-icon.svg');
 expect(iconResponse.ok()).toBe(true);
 const iconSvg=await iconResponse.text();
 expect(iconSvg).not.toContain('<text');
 expect(iconSvg).not.toContain('Dienstplanung, die mitdenkt.');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobileMenu').click();
 await expect(page.locator('#sidebar')).toHaveClass(/open/);
 const mobileLogo=await logo.evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth}));
 expect(mobileLogo.width).toBeGreaterThan(0);
 expect(mobileLogo.height).toBeGreaterThan(0);
 expect(mobileLogo.naturalWidth).toBeGreaterThan(0);
});
