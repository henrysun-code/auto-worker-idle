import {test,expect} from '@playwright/test';
import {initialState} from '../../src/game/state/initialState';
import {gameConfig as c} from '../../src/config/gameConfig';
import {resolveBoss} from '../../src/game/career/bossEvents';
import type {State} from '../../src/game/types';
async function seed(page: import('@playwright/test').Page,s:State){
 await page.clock.install({time:new Date('2026-10-06T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-06T00:00:01Z'));
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key)){value.offline.lastSeenAt=Date.now();localStorage.setItem(key,JSON.stringify(value));}},{key:c.save.key,value:s});await page.goto('/');await page.clock.runFor(50);
}
test('high level UI shows severity branches escape value and raw life management',async({page})=>{
 const s=initialState(42);s.player.upgrades.flattery=115;s.player.upgrades.slacking=100;s.player.upgrades.lifeManagement=500;s.player.upgrades.efficiency=1000;s.player.upgrades.quality=1000;s.career.rank=4;
 await seed(page,s);await page.getByRole('navigation').getByRole('button',{name:'升級'}).click();
 await expect(page.getByRole('region',{name:'拍馬屁',exact:true})).toContainText('240%');await expect(page.getByRole('region',{name:'拍馬屁',exact:true})).toContainText('急件至少 ×2');await expect(page.getByRole('region',{name:'拍馬屁',exact:true})).toContainText('40%');
 await expect(page.getByRole('region',{name:'摸魚技巧',exact:true})).toContainText('成功值 115');await expect(page.getByRole('region',{name:'生活管理',exact:true})).toContainText('生活管理值 500');
 await page.getByRole('button',{name:'Debug',exact:true}).click();await expect(page.getByText(/Boss Attention 240.0%/)).toBeVisible();await expect(page.getByText(/Rank Escape Resistance 20/)).toBeVisible();await expect(page.getByLabel('設定工作效率')).toHaveValue('1000');
});
test('boss dinner precedes single mandatory overtime and survives workStart with zero sleep',async({page})=>{
 const s=initialState(42);s.world.totalWorldTime=40;s.world.timeOfDay=40;s.world.nextEventAt=1e9;s.needs.phase='AFTERNOON';s.player.upgrades.flattery=115;resolveBoss(s,true,false);s.todoQueue[0].workload=10000;
 await seed(page,s);const target=page.getByRole('region',{name:'中央目標'});await expect(target).toContainText('晚餐食物怪');await page.clock.runFor(4000);await expect(target).toContainText('老闆急件 ×');await page.clock.runFor(25000);await expect(target).toContainText('老闆急件 ×');
 await expect(page.getByLabel('目前狀態')).toContainText('效率 -30.0%');const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),c.save.key);expect(saved.needs.sleep.lastRatio).toBe(0);expect(saved.currentTarget.todo.id).toBe(s.todoQueue[0].id);
});
test('permanent formula level10 can buy and reload level11',async({page})=>{
 const s=initialState(42);s.prestige.levels.workEfficiency=10;s.prestige.clarity=1e8;await seed(page,s);await page.getByRole('navigation').getByRole('button',{name:'升級'}).click();await page.getByRole('button',{name:/永久升級/}).click();const region=page.getByRole('region',{name:'永久工作效率',exact:true});await region.getByRole('button',{name:/升級/}).click();await expect(region).toContainText('Lv.11');await page.clock.runFor(3100);await page.reload();await page.getByRole('navigation').getByRole('button',{name:'升級'}).click();await page.getByRole('button',{name:/永久升級/}).click();await expect(page.getByRole('region',{name:'永久工作效率',exact:true})).toContainText('Lv.11');
});

// Node-side legacy Boss Work fixture; browser retains production Meeting Config.
c.meeting.bossMeetingChanceOnEscapeFail=0;

