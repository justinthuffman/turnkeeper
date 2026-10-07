/* ---------- Reading a character's Google Sheet (the v2.1 template) ----------
   Shared by the tracker (importing a sheet, copying it into the database) and the DM Screen (a
   party member who isn't in the database yet). The sheet must be shared as "Anyone with the link
   can view". Cells are read as a table: table[row][column], both from 0. */
// The cells Turnkeeper reads from the sheet's main tab
const RANGES = {
  insp:'H6:H6',   // the Inspiration box: 1 (shown as ✧) when you have it
  name:'BZ61:BZ61', level:'AL2:AL2', race:'T3:T3', class:'T1:T1',
  ac:'R7:R7', init:'V7:V7', speed:'Z7:Z7', hpmax:'U11:U11', hpcur:'R12:R12',
  str:'C10:C10', dex:'C15:C15', con:'C20:C20', int:'C25:C25', wis:'C30:C30', cha:'C35:C35'
};
// Column letters ↔ index: "A" = 0, "AC" = 28
function colToIdx(letters){
  let idx = 0;
  for(let i = 0; i < letters.length; i++){ idx = idx*26 + (letters.charCodeAt(i)-64); }
  return idx-1;
}
function idxToCol(idx){
  let s = ''; idx = idx+1;
  while(idx > 0){ const rem = (idx-1)%26; s = String.fromCharCode(65+rem)+s; idx = Math.floor((idx-1)/26); }
  return s;
}
// "AL2:AL2" → {c1, r1, c2, r2} (indexes from 0)
function parseRange(r){
  const m = r.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  return {c1:colToIdx(m[1]), r1:parseInt(m[2],10)-1, c2:colToIdx(m[3]), r2:parseInt(m[4],10)-1};
}
// The first non-empty value in a range, trimmed, or ''
function getFirstValue(table, range){
  const {c1,r1,c2,r2} = parseRange(range);
  for(let r=r1;r<=r2;r++){
    const row = table[r]; if(!row) continue;
    for(let c=c1;c<=c2;c++){
      const v = row[c];
      if(v!==null && v!==undefined && String(v).trim()!==''){ return String(v).trim(); }
    }
  }
  return '';
}
// One cell ("AL2", or a range's first cell), trimmed, or ''
function cellAt(table, ref){
  const m = ref.match(/^([A-Z]+)(\d+)/); const row = table[+m[2]-1]; const v = row ? row[colToIdx(m[1])] : null;
  return v === null || v === undefined ? '' : String(v).trim();
}
// Fetch a range of a sheet (Google's gviz JSONP, so it works from any page with no server)
function loadSheetJSONP(sheetId, gid, range){
  return new Promise((resolve, reject)=>{
    const cbName = 'gvizCb_' + Math.random().toString(36).slice(2);
    const timeoutId = setTimeout(()=>{ cleanup(); reject(new Error('Timed out loading the sheet — check the link and that it’s shared as "Anyone with the link can view."')); }, 12000);
    function cleanup(){
      delete window[cbName];
      if(script.parentNode) script.parentNode.removeChild(script);
      clearTimeout(timeoutId);
    }
    window[cbName] = (data)=>{ cleanup(); resolve(data); };
    const script = document.createElement('script');
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${cbName}&gid=${gid}&range=${range}`;
    script.onerror = ()=>{ cleanup(); reject(new Error('Could not load that sheet — check the link and sharing settings.')); };
    document.body.appendChild(script);
  });
}
// The fetched data as a plain table of values (each cell's value, else its formatted text)
const sheetTable = data=>data.table.rows.map(row=>(row.c||[]).map(cell=>cell ? (cell.v!==null && cell.v!==undefined ? cell.v : cell.f) : null));
