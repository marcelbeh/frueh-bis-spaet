const {test,expect}=require('@playwright/test');
test('login screen loads and fits mobile viewport',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({data:{},error:null}),signOut:async()=>({error:null})}})};'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
