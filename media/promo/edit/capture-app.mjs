import {createServer} from 'node:http';
import {existsSync, readFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {chromium} = require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(root, 'app-web');
const out = path.join(root, 'animations/remotion/public/screens');
mkdirSync(out, {recursive: true});
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf','.json':'application/json'};
const server = createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(webRoot, decodeURIComponent(url.pathname));
  if (!file.startsWith(webRoot)) {res.writeHead(403);return res.end();}
  if (!path.extname(file)) file = existsSync(file + '.html') ? file + '.html' : path.join(file, 'index.html');
  if (!existsSync(file)) file = path.join(webRoot, 'index.html');
  res.setHeader('Content-Type',types[path.extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(8087,'127.0.0.1',resolve));
const weeks=Array.from({length:18},(_,i)=>i+1);
const course=(id,name,teacher,location,weekday,startPeriod,endPeriod,color,icon,type='major')=>({id,name,teacher,location,weekday,startPeriod,endPeriod,color,icon,type,startTime:['08:00','08:55','10:10','11:05','14:00','14:55','16:10','17:05'][startPeriod-1]??'19:00',endTime:['08:45','09:40','10:55','11:50','14:45','15:40','16:55','17:50'][endPeriod-1]??'20:40',weeks});
const demo={schemaVersion:2,courses:[
 course('promo-math','高等数学','周老师','博学楼 A302',1,1,2,'#5B67F1','book'),
 course('promo-code','程序设计','陈老师','信息楼 405',1,5,6,'#23A89A','code'),
 course('promo-english','大学英语','林老师','博雅楼 B210',2,3,4,'#F28A5B','calendar','general'),
 course('promo-physics','大学物理','杨老师','致知楼 201',3,1,2,'#A35BD8','atom'),
 course('promo-data','数据结构','王老师','信息楼 310',3,5,6,'#E25574','code'),
 course('promo-lab','物理实验','杨老师','实验中心 307',4,5,7,'#E25574','flask','lab'),
 course('promo-sport','羽毛球','李老师','东区体育馆',5,3,4,'#4D8ED8','sport','elective'),
 ],tasks:[
 {id:'promo-task-1',title:'完成高数习题 2.3',dueAt:'2026-10-13T22:00:00+08:00',completed:false,source:'ai'},
 {id:'promo-task-2',title:'提交物理实验报告',dueAt:'2026-10-16T18:00:00+08:00',completed:true,source:'ai'},
 {id:'promo-task-3',title:'复习英语单词',dueAt:'2026-10-15T20:00:00+08:00',completed:true,source:'manual'},
 ],expenses:[
 {id:'promo-expense-1',amount:25,category:'餐饮',note:'食堂午饭',occurredAt:'2026-10-12T12:00:00+08:00'},
 {id:'promo-expense-2',amount:14.5,category:'餐饮',note:'早餐与咖啡',occurredAt:'2026-10-12T08:00:00+08:00'},
 {id:'promo-expense-3',amount:8,category:'学习',note:'打印讲义',occurredAt:'2026-10-12T09:00:00+08:00'},
 ],events:[],attendance:[{courseId:'promo-math',date:'2026-10-12',status:'present'}],focusSessions:[{id:'promo-focus-1',minutes:25,completedAt:'2026-10-12T09:00:00+08:00'},{id:'promo-focus-2',minutes:50,completedAt:'2026-10-12T10:00:00+08:00'}],focusMinutesThisWeek:75,
 grades:[{id:'promo-grade-1',course:'数据结构',score:91,credit:4,gpa:4,semester:'2025-2026-2',category:'required',courseNature:'必修'},{id:'promo-grade-2',course:'线性代数',score:86,credit:3,gpa:3.7,semester:'2025-2026-2',category:'required',courseNature:'必修'},{id:'promo-grade-3',course:'大学英语',score:82,credit:2,gpa:3.3,semester:'2025-2026-2',category:'required',courseNature:'必修'},{id:'promo-grade-4',course:'艺术赏析',score:96,credit:2,gpa:4,semester:'2025-2026-2',category:'elective',courseNature:'选修'}],
 settings:{displayName:'同学',schoolName:'湘潭大学',major:'计算机科学与技术',studyGoal:'提升专业基础，探索未来方向',termStart:'2026-10-05',themeMode:'light',accentPreset:'purple',visualMode:'glass',aiThinking:true,wakeHour:7,wakeMinute:0,focusMinutes:25,breakMinutes:5,studyReminders:true,backgroundOpacity:.42,jiahaoMode:false}};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'zh-CN',timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 await context.addInitScript(data=>localStorage.setItem('campusflow.data.v1',JSON.stringify(data)),demo);
 const page=await context.newPage();
 page.on('pageerror',e=>console.error('Page error:',e.message));
 const shot=async(route,name)=>{await page.goto('http://127.0.0.1:8087'+route,{waitUntil:'networkidle'});await page.waitForTimeout(1200);await page.screenshot({path:path.join(out,name+'.png')});console.log(name);};
 await shot('/','home');
 await shot('/schedule','schedule');
 await shot('/assistant','assistant');
 await page.getByPlaceholder('和 Campus AI 说说…').fill('午饭25元，明天下午3点图书馆复习两小时');
 await page.screenshot({path:path.join(out,'assistant-input.png')});
 await shot('/insights','weekly');
 await page.getByText('成绩与 GPA',{exact:true}).click();await page.waitForTimeout(800);await page.screenshot({path:path.join(out,'insights.png')});
 await shot('/profile','profile');
 await shot('/focus','focus');
 await shot('/personalize','personalize');
 await shot('/import','import');
 await context.close();
 const themed=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'zh-CN',timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
 await themed.addInitScript(data=>localStorage.setItem('campusflow.data.v1',JSON.stringify(data)),{...demo,settings:{...demo.settings,jiahaoMode:true}});
 const jp=await themed.newPage();await jp.goto('http://127.0.0.1:8087/schedule',{waitUntil:'networkidle'});await jp.waitForTimeout(1500);await jp.screenshot({path:path.join(out,'jiahao.png')});
 console.log('Captured synthetic app screenshots; no user browser state accessed.');
} finally {await browser.close();server.close();}
