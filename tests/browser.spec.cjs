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
 await popup.emulateMedia({media:'print'});
 await expect.poll(()=>popup.locator('#pdfWeekView').evaluate(el=>getComputedStyle(el).display)).toBe('block');
 await expect.poll(()=>popup.locator('#pdfWeekView .pdf-time-track').evaluate(el=>{
  const style=getComputedStyle(el);
  return style.backgroundColor==='rgb(255, 255, 255)' && style.backgroundImage.includes('255, 255, 255');
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
  cloudReady=true;cloudUser={id:'user-1'};cloudUpdatedAt='2026-10-31T08:00:00.000Z';
  shifts=[{id:'old',person:names[0].name,day:0,start:'08:00',end:'12:00',weekOffset:0}];
  events=[{id:'event-old',title:'Meeting'}];absences=[{id:'absence-old',name:names[0].name}];
  currentPage='einstellungen';render();
 });
 await expect(page.locator('[data-action="reset-system"]')).toBeVisible();
 page.on('dialog',async dialog=>{if(dialog.type()==='prompt')await dialog.accept('RESET');else await dialog.accept();});
 await page.locator('[data-action="reset-system"]').click();
 await expect.poll(()=>page.evaluate(()=>window.__savedState?.shifts?.length)).toBe(0);
 expect(await page.evaluate(()=>({events:events.length,absences:absences.length,shifts:shifts.length,names:names.length,groups:groups.length,weekOffset,selectedGroup}))).toEqual({events:0,absences:0,shifts:0,names:11,groups:3,weekOffset:0,selectedGroup:'Alle Gruppen'});
});
