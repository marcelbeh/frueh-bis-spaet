const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
const context = {Date, Math, Set, Number, String, Array, Object, console, weekOffset:0, shifts:[], events:[], iso:d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"), minutes:t=>{const [h,m]=t.split(':').map(Number);return h*60+m;}, dateForDay:(day,offset=0)=>{const d=new Date(2026,0,5+offset*7+day,12);return d;}};
function loadFunction(name){const start=source.indexOf('function '+name+'(');assert.notEqual(start,-1,'function '+name+' exists');const end=source.indexOf(String.fromCharCode(10)+'function ',start+10);assert.notEqual(end,-1,'next function after '+name+' exists');vm.runInContext(source.slice(start,end),ctx);}
const ctx=vm.createContext(context);
for(const name of ['escapeHTML','easterSunday','nrwPublicHolidays','isWorkingDay','calendarDaysBetween','personWorkingDays','personWorksOnDay','vacationDaysForPerson','vacationDaysForPersonInYear','shiftPause','shiftWorkMinutes','weeklyManualShiftMinutes','regularHoursNeeded','dailyPlanningTarget','shiftCoversTime','eventOccursOnDate','eventDurationMinutes','eventMinutesForPersonWeek','shiftRuleConflicts'])loadFunction(name);
test('app.js parses as JavaScript',()=>assert.doesNotThrow(()=>new Function(source)));
test('HTML user input is escaped',()=>assert.equal(ctx.escapeHTML('<img src=x onerror="x"> &'), '&lt;img src=x onerror=&quot;x&quot;&gt; &amp;'));
test('NRW 2026 public holidays are excluded from leave days',()=>{for(const d of ['2026-01-01','2026-04-03','2026-04-06','2026-05-01','2026-05-14','2026-05-25','2026-06-04','2026-10-03','2026-11-01','2026-12-25','2026-12-26'])assert.equal(ctx.isWorkingDay(d),false,d);assert.equal(ctx.isWorkingDay('2026-04-07'),true);});
test('leave day counting excludes weekends and NRW holidays',()=>assert.equal(ctx.calendarDaysBetween('2026-04-03','2026-04-07'),1));
test('part-time vacation days count only the employee regular working days',()=>{const person={workdays:[0,2,4]};assert.equal(ctx.vacationDaysForPerson(person,'2026-11-02','2026-11-06'),3);assert.equal(ctx.vacationDaysForPerson(person,'2026-11-03','2026-11-05'),1);});
test('legacy employees default to Monday through Friday and configured workdays drive planning',()=>{assert.deepEqual(Array.from(ctx.personWorkingDays({})),[0,1,2,3,4]);assert.equal(ctx.personWorksOnDay({workdays:[0,2,4]},2),true);assert.equal(ctx.personWorksOnDay({workdays:[0,2,4]},1),false);});
test('vacation day calculation excludes NRW holidays on configured workdays',()=>assert.equal(ctx.vacationDaysForPerson({workdays:[0,1,2,3,4]},'2026-06-01','2026-06-05'),4));
test('pause is visible and excluded from staffing coverage',()=>{const s={start:'07:00',end:'14:00'};const p=ctx.shiftPause(s);assert.deepEqual({...p},{start:660,end:690});assert.equal(ctx.shiftWorkMinutes(s),390);assert.equal(ctx.shiftCoversTime(s,675),false);assert.equal(ctx.shiftCoversTime(s,660),false);assert.equal(ctx.shiftCoversTime(s,690),true);});
test('break is applied once gross shift time exceeds six hours',()=>{const s={start:'07:00',end:'13:15'};assert.deepEqual({...ctx.shiftPause(s)},{start:660,end:690});assert.equal(ctx.shiftWorkMinutes(s),345);});
test('45-minute break is applied to shifts exceeding nine net working hours',()=>{const s={start:'07:00',end:'17:00'};assert.deepEqual({...ctx.shiftPause(s)},{start:660,end:705});assert.equal(ctx.shiftWorkMinutes(s),555);});
test('daily planning target redistributes unplaced hours across remaining available days',()=>{assert.equal(ctx.dailyPlanningTarget(30,5,4),6.25);assert.equal(ctx.dailyPlanningTarget(30,12,3),6);assert.equal(ctx.dailyPlanningTarget(20,19.75,2),0.25);assert.equal(ctx.dailyPlanningTarget(20,10,0),0);});
test('weekly events recur on their configured weekday but never before their start date',()=>{const e={date:'2026-01-06',repeatWeekly:true,repeatDay:2};assert.equal(ctx.eventOccursOnDate(e,'2026-01-13'),true);assert.equal(ctx.eventOccursOnDate(e,'2026-01-14'),false);assert.equal(ctx.eventOccursOnDate(e,'2025-12-30'),false);});

test('weekly special appointments count as working time for selected attendees',()=>{ctx.events=[{date:'2026-01-06',time:'16:00–18:00',attendees:['A'],repeatWeekly:true,repeatDay:2}];assert.equal(ctx.eventMinutesForPersonWeek({name:'A'},0),120);assert.equal(ctx.eventMinutesForPersonWeek({name:'B'},0),0);});
test('optimistic locking and all event navigation entries are wired',()=>{assert.match(source,/\.eq\("updated_at",cloudUpdatedAt\)/);assert.match(source,/Speicherkonflikt/);const html=fs.readFileSync('index.html','utf8');for(const p of ['teammeetings','supervision','fortbildungen'])assert.match(html,new RegExp('data-page="'+p+'"'));});
test('coverage strip uses pause-aware shift coverage',()=>assert.match(source,/const countAt=\(t,g\)=>coverageShifts\.filter\(s=>shiftCoversTime\(s,t\)/));

test('11-hour rest time is enforced between adjacent days',()=>{const person={name:'A'},assigned=[{person:'A',day:0,weekOffset:0,start:'12:00',end:'22:00'}];const issues=ctx.shiftRuleConflicts(person,1,'06:00','10:00',0,assigned);assert.ok(issues.includes('Ruhezeit unter elf Stunden'));});
test('daily maximum is based on net working time after break',()=>{const person={name:'A'};const issues=ctx.shiftRuleConflicts(person,0,'06:00','17:00',0,[]);assert.ok(issues.includes('Tägliche Arbeitszeit über zehn Stunden'));});

test('daily maximum sums split shifts for one employee',()=>{const person={name:'A'},assigned=[{id:'old',person:'A',day:0,weekOffset:0,start:'06:00',end:'13:00'}];const issues=ctx.shiftRuleConflicts(person,0,'14:00','18:00',0,assigned);assert.ok(issues.includes('Tägliche Arbeitszeit über zehn Stunden'));});

test('special events are rendered in the weekly duty plan for their date and recurring weekday',()=>{assert.match(source,/const dayEvents=events\.filter\(event=>eventOccursOnDate\(event,iso\(date\)\)\)/);assert.match(source,/day-special-event/);});

test('duty plan supports drag-resizing a shift end with rule checks and cloud saving',()=>{
 assert.match(source,/data-resize-shift/);
 assert.match(source,/pointermove/);
 assert.match(source,/shiftRuleConflicts\(person,shift\.day,start,end,offset,shifts,shift\.id\)/);
 assert.match(source,/shift\.end=end;scheduleCloudSave\(\);render\(\)/);
});

test('manual normal and special services count toward weekly contract hours while generated shifts are replaced',()=>{
 ctx.events=[{date:'2026-01-06',time:'16:00–18:00',attendees:['A'],repeatWeekly:false,repeatDay:2}];
 const assigned=[
  {person:'A',start:'08:00',end:'10:00',serviceType:'Normaler Dienst'},
  {person:'A',start:'10:00',end:'12:00',serviceType:'Meeting'},
  {person:'A',start:'08:00',end:'10:00',serviceType:'Normaler Dienst',generated:true}
 ];
 assert.equal(ctx.weeklyManualShiftMinutes({name:'A'},assigned),240);
 assert.equal(ctx.regularHoursNeeded({name:'A',hours:30},0,assigned),24);
});
test('automatic planner keeps manually entered services and replaces only generated shifts',()=>{
 assert.match(source,/const existing=weekShifts\(\),retained=existing\.filter\(s=>!s\.generated\)/);
 assert.match(source,/shifts=shifts\.filter\(s=>\(s\.weekOffset\?\?0\)!==weekOffset\|\|!s\.generated\)/);
 assert.match(source,/regularHoursNeeded\(p,weekOffset,retained\)/);
});
test('full-day absences render in weekly columns and in printable PDF output',()=>{
 assert.match(source,/class="outlook-absence"/);
 assert.match(source,/class="pdf-time-absence"/);
 assert.match(source,/dayAbsenceCount/);
});
test('printable PDF includes attendee-specific special events',()=>{
 assert.match(source,/class="pdf-time-event"/);
 assert.match(source,/eventOccursOnDate\(ev,date\)/);
});

test('PDF export places all five weekdays in one A4 landscape time grid',()=>{
 assert.match(source,/class="pdf-time-grid"/);
 assert.match(source,/class="pdf-time-staff-head"/);
 assert.match(source,/class="pdf-time-track"/);
 assert.match(source,/const dayIndexes=\[0,1,2,3,4\]/);
 assert.match(source,/Montag bis Freitag/);
});

test('shift resizing supports both start and end edges',()=>{
 assert.match(source,/data-resize-edge="start"/);
 assert.match(source,/data-resize-edge="end"/);
 assert.match(source,/state\.edge==="start"/);
 assert.match(source,/shift\.start=start;shift\.end=end/);
});
test('special services use the same editable shift form and delete action',()=>{
 assert.match(source,/data-edit-shift=/);
 assert.match(source,/function addShiftModal\(id=null\)/);
 assert.match(source,/data-delete-shift=/);
});
