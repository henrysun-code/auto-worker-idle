import { test, expect, type Page } from '@playwright/test';
import { gameConfig as c } from '../../src/config/gameConfig';
import { initialState } from '../../src/game/state/initialState';
import { createTodo } from '../../src/game/work/todoManager';
import { startWork } from '../../src/game/targets/targetManager';
import { triggerEvent } from '../../src/game/events/eventManager';
import { toggleProduct } from '../../src/game/products/productManager';
import { ensureTarget } from '../../src/game/targets/targetManager';
import { createProject } from '../../src/game/projects/projectManager';
import type { State } from '../../src/game/types';
async function seed(page: Page, s: State) { await page.addInitScript(({key,value})=>{value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));},{key:c.save.key,value:s}); await page.goto('/'); }
for(const kind of ['normal','rework','large','food','lunch','problem','sleep','entertainment'] as const) {
  test(`V2 ${kind} target preserves mobile shell and shows correct activity`,async({page})=>{
    await page.clock.install({time:new Date('2026-10-05T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const s=initialState(5);s.world.nextEventAt=10000;s.needs.phase='MORNING';s.needs.satietyUntil=10000;s.needs.projectRollProcessedRoutineId=0;
    if(kind==='normal'||kind==='rework'||kind==='large'){const todo=createTodo(s,c.work.templates[1]);if(kind==='rework'){todo.sourceType='FOLLOW_UP';todo.followUpType='REWORK';todo.baseReward=0;todo.name='修正錯誤';}if(kind==='large'){const p=createProject(s)!;Object.assign(todo,s.todoQueue.shift()!);todo.projectId=p.id;}startWork(s,todo);}
    else if(kind==='lunch'){s.world.totalWorldTime=24;s.world.timeOfDay=24;s.needs.phase='LUNCH';s.currentTarget={id:'lunch',type:'LUNCH',name:'午休',windowStart:20,windowEnd:28,accumulatedRestOutput:90,createdAt:21};s.needs.lunchRest=90;}
    else if(kind==='problem'){s.player.money=1000;toggleProduct(s,'eyes');triggerEvent(s,'eyes',true);ensureTarget(s);}
    else if(kind==='sleep'||kind==='entertainment'){s.needs.phase=kind==='sleep'?'SLEEP':'ENTERTAINMENT';s.currentTarget={id:'life',type:kind==='sleep'?'SLEEP':'ENTERTAINMENT',name:kind==='sleep'?'睡眠需求怪':'娛樂需求怪',requirement:10,progress:0,createdAt:0};}
    else{s.needs.phase='BREAKFAST';ensureTarget(s);}
    await seed(page,s);const target=page.getByRole('region',{name:'中央目標'});await expect(target).toHaveAttribute('data-kind',kind);await expect(target.getByRole('progressbar')).toBeVisible();await expect(page.getByLabel('待辦數量')).toBeVisible();
    if(kind==='lunch'){await expect(target).toContainText('午休剩餘');await expect(target).toContainText('休息值 / 秒');await expect(target).toContainText('累積休息');}
    if(kind==='problem')await expect(target).toContainText('用眼休息組');
    await page.screenshot({path:`tests/artifacts/v2-${kind}.png`});const box=await target.boundingBox(),nav=await page.getByRole('navigation').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(nav!.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  });
}
test('world boundary preserves sleep until fixed workStart',async({page})=>{await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));const s=initialState(5);s.world.totalWorldTime=59;s.world.timeOfDay=59;s.world.nextEventAt=10000;s.needs.phase='SLEEP';s.currentTarget={id:'sleep-test',type:'SLEEP',name:'睡眠需求怪',requirement:4,progress:0,createdAt:59};await seed(page,s);const target=page.getByRole('region',{name:'中央目標'});await page.clock.runFor(1000);await expect(page.getByText('世界 DAY 02',{exact:true})).toBeVisible();await expect(target).toHaveAttribute('data-kind','sleep');await page.clock.runFor(3000);await expect(target).toHaveAttribute('data-kind','sleep');await expect(page.getByLabel('世界時鐘')).toContainText('3 / 60s');await page.clock.runFor(5000);await expect(target).not.toHaveAttribute('data-kind','sleep');});
