'use strict';
// Monthly MOS division-head reports. All information comes from the existing Project 201 dataset.
// Saved snapshots are in the same authenticated Cloudflare D1 dataset; no additional API is needed.
function reportCurrentMonth(){
  const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function reportPreviousMonth(){
  const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function reportValidMonth(m){return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m||''));}
function reportMonthLabel(m){
  if(!reportValidMonth(m))return 'Unknown month';
  return new Date(Number(m.slice(0,4)),Number(m.slice(5,7))-1,15).toLocaleDateString('en-PH',{month:'long',year:'numeric'});
}
function reportNextMonthLabel(m){
  const d=new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),15);
  return d.toLocaleDateString('en-PH',{month:'long',year:'numeric'});
}
function reportUpdateMonth(u){
  if(u.source==='csv'&&reportValidMonth(u.sourceMonth))return u.sourceMonth;
  const m=String(u.date||'').slice(0,7);return reportValidMonth(m)?m:null;
}
function reportArchives(){
  if(!Array.isArray(data.monthlyReports))data.monthlyReports=[];
  return data.monthlyReports;
}
function reportSaved(m){return reportArchives().find(r=>r.month===m);}
function reportAvailableMonths(){
  const months=[...data.updates.map(reportUpdateMonth),...reportArchives().map(x=>x.month)].filter(reportValidMonth);
  const start=[...months,reportPreviousMonth()].sort()[0]||reportPreviousMonth();
  const last=reportCurrentMonth(),out=[];
  const d=new Date(Number(start.slice(0,4)),Number(start.slice(5))-1,1);
  const max=new Date(Number(last.slice(0,4)),Number(last.slice(5))-1,1);
  for(let i=0;d<=max&&i<180;i++,d.setMonth(d.getMonth()+1)){
    out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return [...new Set([...out,...months])].filter(reportValidMonth).sort().reverse();
}
function reportCost(v){
  if(v===null||v===undefined||String(v)==='')return '';
  const n=Number(v);if(!Number.isFinite(n))return '';
  if(n>=1000000&&Number((n/1000000).toFixed(2))*1000000===n&&n<1000000000)return Number((n/1000000).toFixed(2))+'M';
  if(n>=1000&&n<1000000&&n%1000===0)return (n/1000)+'K';
  return n.toLocaleString('en-PH',{maximumFractionDigits:2});
}
function reportBuild(m){
  if(!reportValidMonth(m))throw Error('Choose a valid reporting month.');
  const columns=data.projects.map(p=>{
    const entries=data.updates.filter(u=>u.projectId===p.id&&reportUpdateMonth(u)===m).sort((a,b)=>
      String(a.date||'').localeCompare(String(b.date||''))||
      String(a.createdAt||'').localeCompare(String(b.createdAt||''))||
      String(a.id||'').localeCompare(String(b.id||'')));
    const previous=data.updates.filter(u=>u.projectId===p.id&&reportUpdateMonth(u)&&reportUpdateMonth(u)<m)
      .sort((a,b)=>reportUpdateMonth(b).localeCompare(reportUpdateMonth(a))||String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const last=entries.length?null:previous[0];
    let note='';
    if(entries.length===1)note=String(entries[0].note||'').trim();
    else if(entries.length>1)note=entries.map(u=>`${u.source==='csv'?reportMonthLabel(reportUpdateMonth(u)):displayDate(u.date)}\n${String(u.note||'').trim()}`).join('\n\n');
    else if(last)note=String(last.note||'').trim();
    return {projectId:p.id,title:p.title||'',location:p.location||'',implementingOffice:p.implementingOffice||'',
      endUser:p.endUser||'MOS',fundingSource:p.fundingSource||'',approvedCost:reportCost(p.approvedBudget),
      contractDuration:p.durationDays?`${p.durationDays} cd`:'',note,entryCount:entries.length,
      carryFrom:last?reportUpdateMonth(last):null,entryIds:entries.map(u=>u.id)};
  });
  return {month:m,columns,preparedBy:'ENGR. RICO J. PONO',
    preparedTitle:'Agricultural and Biosystems Engineer I',notedBy:'JOSE ARNIL C. CORONG, DVM',notedTitle:'Vet IV / MOS-OIC'};
}
function reportSelected(){
  const archive=reportSaved(view.reportMonth);
  return view.reportMode==='saved'&&archive?archive.snapshot:reportBuild(view.reportMonth);
}
function reportEscape(v){return esc(v??'').replace(/\r\n|\r|\n/g,'<br>');}
function reportTable(report,cols){
  const heads=['PROJECT LOCATION','IMPLEMENTING OFFICE','END-USER','FUNDING SOURCE','APPROVED PROJECT COST','CONTRACT DURATION'];
  const fields=['location','implementingOffice','endUser','fundingSource','approvedCost','contractDuration'];
  const thead=`<thead><tr><th scope="col">PROJECT TITLE</th>${cols.map(p=>`<th scope="col">${reportEscape(p.title)}</th>`).join('')}</tr></thead>`;
  const meta=heads.map((label,i)=>`<tr><th scope="row">${label}</th>${cols.map(p=>`<td>${reportEscape(p[fields[i]])}</td>`).join('')}</tr>`).join('');
  const statuses=`<tr class="mos-status"><th scope="row">${esc(reportMonthLabel(report.month).toUpperCase())}<br>STATUS / UPDATE</th>${cols.map(p=>`<td>${reportEscape(p.note)||'<span class="mos-empty">No recorded update as of this month</span>'}${p.carryFrom?`<small class="mos-carry">Carried forward from ${esc(reportMonthLabel(p.carryFrom))}</small>`:''}${p.entryCount>1?`<small class="mos-carry">${p.entryCount} entries in this month</small>`:''}</td>`).join('')}</tr>`;
  return `<table class="mos-report-table">${thead}<tbody>${meta}${statuses}</tbody></table>`;
}
function reportSheets(report){
  const cols=report.columns||[];
  if(!cols.length)return '<p>No registered projects are available for this month.</p>';
  let output='';
  for(let i=0;i<cols.length;i+=8){
    output+=`<section class="mos-report-sheet">
      <h2>UPDATES OF ALL PROJECTS UNDER METRO ORMOC SLAUGHTERHOUSE</h2>
      ${reportTable(report,cols.slice(i,i+8))}
      <div class="mos-report-sign">
        <div><div>Prepared by:</div><div class="mos-report-name">${reportEscape(report.preparedBy)}</div><div>${reportEscape(report.preparedTitle)}</div></div>
        <div><div>Noted by:</div><div class="mos-report-name">${reportEscape(report.notedBy)}</div><div>${reportEscape(report.notedTitle)}</div></div>
      </div>
    </section>`;
  }
  return output;
}
function reportPrintStyles(){
  return `
    @page{size:13in 8.5in;margin:0.28in}
    .mos-report-sheet{background:#fff;color:#000;box-sizing:border-box;width:100%;margin:0 auto;page-break-after:always;break-after:page;font-family:Arial,Helvetica,sans-serif}
    .mos-report-sheet:last-child{page-break-after:auto;break-after:auto}
    .mos-report-sheet h2{font-size:13pt;text-align:center;margin:0 0 7pt;font-weight:800;line-height:1.08}
    .mos-report-table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:7.2pt;line-height:1.16}
    .mos-report-table th,.mos-report-table td{border:.7pt solid #444;padding:4pt 3pt;vertical-align:top;text-align:left;overflow-wrap:anywhere}
    .mos-report-table th:first-child{width:11.5%;font-weight:800}
    .mos-report-table thead th{text-align:center;font-weight:800;vertical-align:middle}
    .mos-report-table .mos-status th{font-weight:800}
    .mos-report-table .mos-status{break-inside:auto}
    .mos-carry{display:block;margin-top:5pt;font-size:6.4pt;color:#555;font-style:italic}
    .mos-empty{color:#666;font-style:italic}
    .mos-report-sign{display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin:7pt 2pt 0;font-size:8.5pt;line-height:1.25}
    .mos-report-name{font-weight:800;margin-top:40pt;margin-bottom:3pt}
    @media screen{.mos-report-sheet{width:1200px;min-width:1200px;padding:18px 22px;border:1px solid #d6dee5;box-shadow:0 8px 28px #121c2b12}.mos-report-table{font-size:11px}.mos-report-sign{font-size:11px}}
    @media print{.print-toolbar{display:none!important}.mos-report-sheet{border:0;box-shadow:none;padding:0;width:auto;min-width:0}.mos-report-table{font-size:7.2pt}.mos-report-sign{font-size:8.5pt}}`;
}
function reportsPage(){
  if(!reportValidMonth(view.reportMonth))view.reportMonth=reportPreviousMonth();
  const months=reportAvailableMonths();
  if(!months.includes(view.reportMonth))view.reportMonth=months[0]||reportPreviousMonth();
  const saved=reportSaved(view.reportMonth);
  if(view.reportMode==='saved'&&!saved)view.reportMode='live';
  const report=reportSelected();
  const count=report.columns.reduce((n,p)=>n+(p.entryCount||0),0),carried=report.columns.filter(p=>p.carryFrom).length;
  return `${heading('Monthly project reports','Division-head submission · long bond paper (8.5 × 13 in), landscape')}
    <div class="panel"><div class="mos-report-controls">
      <div><label class="caps" for="reportMonth">Status / update month</label>
      <select class="filter" id="reportMonth">${months.map(m=>`<option value="${m}" ${m===view.reportMonth?'selected':''}>${esc(reportMonthLabel(m))}${reportSaved(m)?' · saved':''}</option>`).join('')}</select></div>
      <div><label class="caps" for="reportMode">Report version</label><select class="filter" id="reportMode">
        <option value="live" ${view.reportMode==='live'?'selected':''}>Live — automatically updated</option>
        ${saved?`<option value="saved" ${view.reportMode==='saved'?'selected':''}>Saved copy — ${esc(displayDate((saved.savedAt||'').slice(0,10)))}</option>`:''}
      </select></div>
    </div>
    <p class="helper">The <b>${esc(reportMonthLabel(view.reportMonth))}</b> status report is for submission in <b>${esc(reportNextMonthLabel(view.reportMonth))}</b>. Every update entered for this month is included. When a project has no entry, the latest earlier report is carried forward. Later months are excluded.</p>
    <div class="mos-report-tags"><span class="chip">${report.columns.length} projects</span><span class="chip">${count} updates this month</span><span class="chip">${carried} carried forward</span>${saved?'<span class="chip">Saved copy available</span>':''}</div>
    <div class="actions mos-report-actions"><button class="button primary" data-action="report-print">Print / Save PDF</button>
      <button class="button ghost" data-action="report-download">Download HTML</button>
      ${canEdit()?`<button class="button ghost" data-action="report-save">${saved?'Update saved copy':'Save monthly copy'}</button><button class="button ghost" data-action="report-archive-all">Archive past months</button>`:''}
    </div>
    <p class="helper">${view.reportMode==='saved'?'<b>Saved submission:</b> This frozen monthly copy stays unchanged until an editor explicitly replaces it.':'<b>Live report:</b> The content follows Project 201 updates automatically. Saved copies preserve previously submitted versions.'}</p></div>
    <div class="mos-report-scroll" aria-label="Preview of landscape long bond project report"><div class="mos-report-preview"><style>${reportPrintStyles()}</style>${reportSheets(report)}</div></div>
    <div class="notice" style="margin-top:14px">Past months remain browsable from the journal. Save a monthly copy to preserve the exact report submitted, or use Archive past months to preserve earlier periods together. In your browser's print dialog, choose 8.5 × 13-inch Folio/Long paper and landscape orientation when necessary.</div>${footer()}`;
}
function reportDocument(report){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MOS Project Report — ${esc(reportMonthLabel(report.month))}</title>
    <style>body{margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}${reportPrintStyles()}</style></head><body>
    <div class="print-toolbar" style="text-align:center;padding:10px;font:14px Arial"><button onclick="window.print()" style="background:#006f75;border:0;color:#fff;border-radius:6px;padding:10px 15px">Print / Save PDF</button> <span>Long bond · 8.5 × 13 in · landscape</span></div>
    ${reportSheets(report)}</body></html>`;
}
function reportPrint(){
  const markup=reportDocument(reportSelected()),win=window.open('','_blank');
  if(!win){download(`MOS-Report-${view.reportMonth}.html`,markup,'text/html;charset=utf-8');alert('Pop-ups were blocked. The report was downloaded as HTML instead. Open it to print or save as PDF.');return;}
  win.document.open();win.document.write(markup);win.document.close();win.focus();
}
function reportDownload(){
  download(`MOS-Report-${view.reportMonth}${view.reportMode==='saved'?'-saved':''}.html`,reportDocument(reportSelected()),'text/html;charset=utf-8');
}
function reportSaveMonth(m,replace=false){
  if(!canEdit())throw Error('Only administrator and editor accounts may save reports.');
  if(!reportValidMonth(m)||m>=reportCurrentMonth())throw Error('The reporting month must end before the monthly copy can be archived.');
  const records=reportArchives(),at=records.findIndex(r=>r.month===m);
  if(at!==-1&&!replace)return false;
  const record={month:m,snapshot:reportBuild(m),savedAt:new Date().toISOString(),savedBy:cloud.user?.name||cloud.user?.email||''};
  if(at===-1)records.push(record);else records[at]=record;
  return true;
}
function reportSaveCurrent(){
  const saved=reportSaved(view.reportMonth);
  if(saved&&!confirm(`Replace the existing saved ${reportMonthLabel(view.reportMonth)} report? The old submitted copy will be overwritten.`))return;
  if(reportSaveMonth(view.reportMonth,!!saved)){save();view.reportMode='saved';render();}
}
function reportArchiveAll(){
  if(!canEdit())throw Error('Editor or administrator permission is required.');
  const months=reportAvailableMonths().filter(m=>m<reportCurrentMonth()&&!reportSaved(m));
  if(!months.length){alert('All completed reporting months are already archived.');return;}
  if(!confirm(`Save ${months.length} historical month(s) in the shared Cloudflare project dataset? Months without updates will carry forward the latest earlier notes.`))return;
  months.forEach(m=>reportSaveMonth(m));save();view.reportMode='saved';render();
  alert(`${months.length} monthly reports saved on this device and queued for Cloudflare synchronization. Confirm the cloud revision updates before relying on the remote archive.`);
}
