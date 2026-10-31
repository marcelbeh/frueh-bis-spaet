const {test,expect}=require('@playwright/test');

test('WebKit mobile and tablet layouts stay within the viewport',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  document.querySelector('#cloudLogin')?.remove();
  names=Array.from({length:23},(_,i)=>({name:'Mitarbeiter '+String(i+1).padStart(2,'0'),initials:'M'+(i+1),group:groups[i%groups.length],hours:30,vacation:30,workdays:[0,1,2,3,4],color:'green'}));
  currentPage='dienstplan';render();
 });
 const viewports=[{width:390,height:844},{width:430,height:932},{width:768,height:1024}];
 for(const viewport of viewports){
  await page.setViewportSize(viewport);
  for(const route of ['dienstplan','mitarbeitende','kalender','einstellungen']){
   await page.evaluate(route=>{currentPage=route;render()},route);
   const metrics=await page.evaluate(()=>{
    const scroller=document.querySelector('.outlook-calendar-scroll');
    const viewportWidth=document.documentElement.clientWidth;const offenders=[...document.querySelectorAll('body *')].map(el=>{const rect=el.getBoundingClientRect(),style=getComputedStyle(el);return {tag:el.tagName,cls:String(el.className||''),right:Math.round(rect.right),width:Math.round(rect.width),overflow:style.overflowX,text:(el.innerText||'').trim().slice(0,55)}}).filter(x=>x.right>viewportWidth+1&&x.width>0).sort((a,b)=>b.right-a.right).slice(0,12);const chain=[];for(let el=scroller;el;el=el.parentElement){const rect=el.getBoundingClientRect(),style=getComputedStyle(el);chain.push({tag:el.tagName,cls:String(el.className||''),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflow:style.overflowX});}return {viewport:viewportWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,scrollerWidth:scroller?.scrollWidth??0,scrollerClient:scroller?.clientWidth??0,offenders,chain};
   });
   expect(metrics.document,route+' document width at '+viewport.width+' offenders='+JSON.stringify(metrics.offenders)+' chain='+JSON.stringify(metrics.chain)).toBeLessThanOrEqual(metrics.viewport);
   expect(metrics.body,route+' body width at '+viewport.width).toBeLessThanOrEqual(metrics.viewport);
   if(route==='dienstplan')expect(metrics.scrollerWidth).toBeGreaterThan(metrics.scrollerClient);
  }
 }
 expect(errors).toEqual([]);
 await context.close();
});
