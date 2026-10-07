import { test, expect } from '@playwright/test';
import { initialState } from '../../src/game/state/initialState';
import { gameConfig as c } from '../../src/config/gameConfig';
import { createTodo } from '../../src/game/work/todoManager';
import { startWork } from '../../src/game/targets/targetManager';
test('deadline counts and live work labels fit mobile, history shows original and discounted reward',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);s.world.totalWorldTime=20;s.world.timeOfDay=20;s.world.nextEventAt=1e8;s.needs.phase='MORNING';s.needs.projectRollProcessedRoutineId=0;s.needs.satietyUntil=1e8;
 const task=(due:number)=>{const t=createTodo(s,c.work.templates[0]);t.createdAtWorldTime=0;t.assignmentWorkdayIndex=due;t.deadlineWorkdays=0;t.dueWorkdayIndex=due;t.baseReward=100;return t;};
 s.todoQueue=[...Array.from({length:8},()=>task(2)),...Array.from({length:4},()=>task(0)),...Array.from({length:2},()=>task(-1))];startWork(s,task(-1));
 await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');
 const counts=page.getByLabel('待辦數量');await expect(counts).toContainText('14');await expect(counts).toContainText('今日到期 4');await expect(counts).toContainText('已逾期 2');await expect(page.getByRole('region',{name:'中央目標'})).toContainText('已逾期');
 const card=await page.getByRole('region',{name:'中央目標'}).boundingBox(),nav=await page.getByRole('navigation').boundingBox();expect(card!.y+card!.height).toBeLessThanOrEqual(nav!.y);
 const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);expect(fits).toBeTruthy();await page.screenshot({path:'tests/artifacts/deadline-mobile.png'});
 await page.getByRole('navigation').getByRole('button',{name:'紀錄'}).click();await page.locator('.history-details summary').click();await expect(page.locator('.history-details')).toContainText('原 $100 → 實收 $70');await expect(page.locator('.history-details')).toContainText('已逾期');
});
test('deadline debug tools create all three deadline states',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Debug',exact:true}).click();for(const label of ['Add Boss Urgent Todo','Add Rework Todo','Add Normal Todo','Add Project Todo','Add No Deadline Todo','Add Due Today Todo','Add Overdue Todo'])await page.getByRole('button',{name:label,exact:true}).click();await expect(page.getByLabel('待辦數量')).toContainText(/已逾期 [1-9]/);});

test('profile override shows no deadline on current work and game days on queued project',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);s.world.nextEventAt=1e8;s.needs.phase='MORNING';s.needs.satietyUntil=1e8;s.needs.projectRollProcessedRoutineId=0;
 startWork(s,createTodo(s,{...c.work.templates[0],deadlineProfileId:'NO_DEADLINE'}));s.todoQueue=[createTodo(s,{...c.work.templates[0],name:'多日專案期限',deadlineProfileId:'PROJECT'},'PROJECT'),createTodo(s,{...c.work.templates[0],name:'長期行政',deadlineProfileId:'NO_DEADLINE'})];
 await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');await expect(page.getByRole('region',{name:'中央目標'})).toContainText('無期限');await expect(page.getByLabel('待辦數量')).toContainText('今日到期 0');await expect(page.getByLabel('待辦數量')).toContainText('已逾期 0');await page.reload();await expect(page.getByRole('region',{name:'中央目標'})).toContainText('無期限');await page.getByRole('navigation').getByRole('button',{name:'紀錄'}).click();await page.locator('.history-details summary').click();await expect(page.locator('.history-details')).toContainText('工作天後到期');await expect(page.locator('.history-details')).toContainText('無期限');
});

test('sleep midnight preserves due today then work-start wakes and selects overdue work',async({page})=>{
 await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const s=initialState(42);s.world.totalWorldTime=59;s.world.timeOfDay=59;s.world.nextEventAt=1e8;s.needs.satietyUntil=1e8;s.needs.phase='SLEEP';s.currentTarget={id:'sleep',type:'SLEEP',name:'睡眠需求怪',requirement:20,progress:0,createdAt:59};const t=createTodo(s,{...c.work.templates[0],deadlineWorkdays:0});t.assignmentWorkdayIndex=0;t.dueWorkdayIndex=0;s.todoQueue=[t];
 await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s});await page.goto('/');await page.clock.runFor(1000);await expect(page.getByLabel('待辦數量')).toContainText('今日到期 1');await expect(page.getByLabel('待辦數量')).toContainText('已逾期 0');await page.clock.runFor(9000);await expect(page.getByLabel('待辦數量')).toContainText('今日到期 0');await expect(page.getByRole('region',{name:'中央目標'})).not.toHaveAttribute('data-kind','sleep');await expect(page.getByRole('region',{name:'中央目標'})).toHaveAttribute('data-kind','food');await page.clock.runFor(5000);await expect(page.getByRole('region',{name:'中央目標'})).toContainText('已逾期');
});
