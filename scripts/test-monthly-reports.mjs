import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const updates=[
  {id:'a1',projectId:'a',date:'2026-09-10',note:'Flooring paused',source:'manual',createdAt:'2026-09-10T00:00:00Z'},
  {id:'a2',projectId:'a',date:'2026-10-09',note:'Construction resumed',source:'manual',createdAt:'2026-10-09T00:00:00Z'},
  {id:'a3',projectId:'a',date:'2026-10-19',note:'Additional floor works',source:'manual',createdAt:'2026-10-19T00:00:00Z'},
  {id:'b1',projectId:'b',date:'2026-08-01',source:'csv',sourceMonth:'2026-08',note:'Foundation work continuing',createdAt:'2026-08-01T00:00:00Z'}
];
const data={
  projects:[
    {id:'a',title:'Hygienic Flooring',location:'Macabug',implementingOffice:'CEO',endUser:'MOS',fundingSource:'',approvedBudget:3314302.46,durationDays:58},
    {id:'b',title:'Wastewater Treatment Valencia',location:'Valencia',implementingOffice:'CEO / DPWH',endUser:'MOS',fundingSource:'',approvedBudget:21000000,durationDays:365}
  ],
  updates,activities:[],monthlyReports:[]
};
const context=vm.createContext({
  data,view:{reportMonth:'2026-10',reportMode:'live'},cloud:{user:{name:'MOS Administrator'},revision:2},
  canEdit:()=>true, displayDate:v=>v, esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  heading:()=>'',footer:()=>'',download:()=>{},alert:()=>{},confirm:()=>true,save:()=>{},render:()=>{},
  navigator:{onLine:true},window:{open:()=>null},Date,Intl
});
vm.runInContext(readFileSync('reports.js','utf8'),context,{filename:'reports.js'});
const run=code=>vm.runInContext(code,context);
const oct=run("reportBuild('2026-10')");
assert.equal(oct.columns.length,2);
assert.equal(oct.columns[0].entryCount,2);
assert.match(oct.columns[0].note,/Construction resumed/);
assert.match(oct.columns[0].note,/Additional floor works/);
assert.ok(oct.columns[0].note.indexOf('Construction resumed')<oct.columns[0].note.indexOf('Additional floor works'),'Monthly entries appear in chronological order');
assert.equal(oct.columns[0].approvedCost,'3,314,302.46');
assert.equal(oct.columns[1].approvedCost,'21M');
assert.equal(oct.columns[1].carryFrom,'2026-08');
assert.equal(oct.columns[1].note,'Foundation work continuing');

const september=run("reportBuild('2026-09')");
assert.equal(september.columns[0].entryCount,1);
assert.equal(september.columns[0].note,'Flooring paused');
assert.equal(september.columns[1].carryFrom,'2026-08');

assert.equal(run("reportSaveMonth('2026-10')"),true);
assert.equal(data.monthlyReports.length,1);
assert.equal(run("reportSaveMonth('2026-10')"),false,'Saves cannot silently overwrite archived submissions');
updates.find(u=>u.id==='a3').note='Revised actual construction status';
assert.match(run("reportBuild('2026-10')").columns[0].note,/Revised actual construction status/);
assert.match(data.monthlyReports[0].snapshot.columns[0].note,/Additional floor works/,'Saved submission must stay frozen after an update');
run("view.reportMode='saved'");
assert.match(run("reportSelected()").columns[0].note,/Additional floor works/);
run("view.reportMode='live'");
assert.match(run("reportSelected()").columns[0].note,/Revised actual construction status/);

updates.push({id:'a4',projectId:'a',date:'2026-11-01',note:'Future month note',source:'manual'});
assert.doesNotMatch(run("reportBuild('2026-10')").columns[0].note,/Future month note/);
assert.ok(run('reportAvailableMonths()').includes('2026-09'),'Past reporting periods remain selectable');
assert.match(run("reportSheets(reportBuild('2026-10'))"),/Prepared by:/);
assert.match(run("reportSheets(reportBuild('2026-10'))"),/Noted by:/);
assert.match(run('reportPrintStyles()'),/size:13in 8.5in/);
assert.equal(run("reportNextMonthLabel('2026-10')"),'November 2026');
updates.find(u=>u.id==='a3').note='<script>alert("bad")</script>';
assert.doesNotMatch(run("reportSheets(reportBuild('2026-10'))"),/<script>alert/,'Status entries must be HTML escaped');
assert.throws(()=>run("reportBuild('2026-13')"),/valid reporting month/);
console.log('PASS: report month mapping, full monthly history, carry-forward, cloud snapshot freeze, HTML escaping and long-bond print dimensions');
