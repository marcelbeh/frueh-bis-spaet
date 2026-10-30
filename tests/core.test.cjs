const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
const context = {Date, Math, Set, Number, String, Array, Object, console, weekOffset:0, shifts:[], iso:d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"), minutes:t=>{const [h,m]=t.split(':').map(Number);return h*60+m;}, dateForDay:(day,offset=0)=>{const d=new Date(2026,0,5+offset*7+day,12);return d;}};
function loadFunction(name){const start=source.indexOf('function '+name+'(');assert.notEqual(start,-1,'function '+name+' exists');let brace=source.indexOf('{',start),depth=0,quote=null,escape=false;for(let i=brace;i<source.length;i++){const c=source[i];if(quote){if(escape)escape=false;else if(c==='\\\\')escape=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;if(c==='}'&&--depth===0){vm.runInContext(source.slice(start,i+1),ctx);return;}}throw new Error('unclosed function '+name);}
const ctx=vm.createContext(context);
for(const name of ['escapeHTML','easterSunday','nrwPublicHolidays','isWorkingDay','calendarDaysBetween','shiftPause','shiftWorkMinutes','shiftCoversTime','eventOccursOnDate'])loadFunction(name);
test('app.js parses as JavaScript',()=>assert.doesNotThrow(()=>new Function(source)));
test('HTML user input is escaped',()=>assert.equal(ctx.escapeHTML('<img src=x onerror="x"> &'), '&lt;img src=x onerror=&quot;x&quot;&gt; &amp;'));
test('NRW 2026 public holidays are excluded from leave days',()=>{for(const d of ['2026-01-01','2026-04-03','2026-04-06','2026-05-01','2026-05-14','2026-05-25','2026-06-04','2026-10-03','2026-11-01','2026-12-25','2026-12-26'])assert.equal(ctx.isWorkingDay(d),false,d);assert.equal(ctx.isWorkingDay('2026-04-07'),true);});
test('leave day counting excludes weekends and NRW holidays',()=>assert.equal(ctx.calendarDaysBetween('2026-04-03','2026-04-07'),1));
test('pause is visible and excluded from staffing coverage',()=>{const s={start:'07:00',end:'14:00'};const p=ctx.shiftPause(s);assert.deepEqual({...p},{start:660,end:690});assert.equal(ctx.shiftWorkMinutes(s),390);assert.equal(ctx.shiftCoversTime(s,675),false);assert.equal(ctx.shiftCoversTime(s,660),false);assert.equal(ctx.shiftCoversTime(s,690),true);});
test('weekly events recur on their configured weekday',()=>{const e={date:'2026-01-06',repeatWeekly:true,repeatDay:2};assert.equal(ctx.eventOccursOnDate(e,'2026-01-13'),true);assert.equal(ctx.eventOccursOnDate(e,'2026-01-14'),false);});
test('optimistic locking and all event navigation entries are wired',()=>{assert.match(source,/\.eq\("updated_at",cloudUpdatedAt\)/);assert.match(source,/Speicherkonflikt/);const html=fs.readFileSync('index.html','utf8');for(const p of ['teammeetings','supervision','fortbildungen'])assert.match(html,new RegExp('data-page="'+p+'"'));});
test('coverage strip uses pause-aware shift coverage',()=>assert.match(source,/const countAt=\(t,g\)=>coverageShifts\.filter\(s=>shiftCoversTime\(s,t\)/));
