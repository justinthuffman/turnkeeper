/* ---------- Notes boxes that show their formatting as you type ----------
   Used by the sheet's Notes (js/char-sheet.js) and the DM Screen's Session Notes. The box is like a
   word processor: the toolbar (data-mark buttons), Ctrl+B / I / U, and "- ", "1. ", "# ", "> " at the
   start of a line format it; Enter on an empty list or quote line leaves it; pasted text comes in
   plain. Notes are saved as plain text with Reddit-style marks: **bold**, *italic*, __underline__,
   ~~strikethrough~~, `code`, ``` code blocks ```, > quotes, - lists, 1. lists, # headings.
   renderMarkdown escapes the text before any formatting, so nothing typed can run as HTML.

   const ed = tkNotesEditor({box, tools, onChange});   // box: a contenteditable element; tools: the toolbar
   ed.set(text) fills it (not while it's being typed in, unless forced); ed.get() reads it back as text;
   onChange() runs as it's edited (save after a pause). */
const tkNoteEsc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function renderMarkdown(src, editing){   // editing: blank lines kept as empty paragraphs (a notes box)
  const blocks = [], esc = tkNoteEsc(String(src || '').replace(/\r\n/g, '\n'));
  // Code blocks first, kept out of the other formatting
  let text = esc.replace(/```\n?([\s\S]*?)```/g, (m, code)=>{ blocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`); return `\u0000${blocks.length - 1}\u0000`; });
  const inline = s=>s
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<u>$1</u>')
    .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  const out = []; let list = null, quote = [];
  const endList = ()=>{ if(list){ out.push(`<${list.tag}>${list.items.map(i=>`<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const endQuote = ()=>{ if(quote.length){ out.push(`<blockquote>${quote.map(inline).join('<br>')}</blockquote>`); quote = []; } };
  text.split('\n').forEach(line=>{
    const block = line.match(/^\u0000(\d+)\u0000$/);
    if(block){ endList(); endQuote(); out.push(blocks[+block[1]]); return; }
    const q = line.match(/^&gt;\s?(.*)$/); if(q){ endList(); quote.push(q[1]); return; } else endQuote();
    const ul = line.match(/^\s*[-*]\s+(.*)$/), ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if(ul || ol){ const tag = ul ? 'ul' : 'ol'; if(!list || list.tag !== tag){ endList(); list = {tag, items:[]}; } list.items.push((ul || ol)[1]); return; }
    endList();
    const h = line.match(/^(#{1,3})\s+(.*)$/); if(h){ out.push(`<h${h[1].length + 3}>${inline(h[2])}</h${h[1].length + 3}>`); return; }
    out.push(line.trim() ? `<p>${inline(line)}</p>` : editing ? '<p><br></p>' : '');
  });
  endList(); endQuote();
  return out.join('').replace(/\u0000(\d+)\u0000/g, (m, i)=>blocks[+i]);
}
const NOTE_BLOCK = /^(P|DIV|H[1-6]|BLOCKQUOTE|UL|OL|LI|PRE)$/;
const NOTE_INLINE = {B:'**', STRONG:'**', I:'*', EM:'*', U:'__', S:'~~', STRIKE:'~~', DEL:'~~', CODE:'`'};
// A piece of a box as text with marks; <br> is a new line
function marksInline(n){
  return [...n.childNodes].map(c=>{
    if(c.nodeType === 3) return c.nodeValue.replace(/\u00a0/g, ' ');
    if(c.nodeType !== 1) return '';
    if(c.tagName === 'BR') return '\n';
    const x = marksInline(c);
    if(NOTE_BLOCK.test(c.tagName)) return '\n' + x + '\n';
    const m = NOTE_INLINE[c.tagName];
    if(!m) return x;
    // Marks hug the words on each line ("**bold** text", not "** bold **")
    return x.split('\n').map(l=>{ const [, s1, mid, s2] = l.match(/^(\s*)([\s\S]*?)(\s*)$/); return mid ? s1 + m + mid + m + s2 : l; }).join('\n');
  }).join('');
}
// A whole box → the saved text (one line per paragraph, "- " lists, "> " quotes, "## " headings)
function notesToMarks(root){
  const out = []; let line = '';
  const flush = ()=>{ if(line !== ''){ out.push(...line.replace(/\n$/, '').split('\n')); line = ''; } };
  const one = s=>s.replace(/\s*\n\s*/g, ' ').trim();
  const block = c=>{
    const t = c.tagName;
    if(t === 'UL' || t === 'OL'){ let i = 1; [...c.children].forEach(li=>out.push((t === 'UL' ? '- ' : (i++) + '. ') + one(marksInline(li)))); return; }
    if(t === 'PRE'){ out.push('```', ...c.textContent.replace(/\n$/, '').split('\n'), '```'); return; }
    if(t === 'BLOCKQUOTE'){ marksInline(c).replace(/^\n+|\n+$/g, '').split('\n').forEach(l=>out.push('> ' + l)); return; }
    const h = t.match(/^H([1-6])$/);
    if(h){ out.push('#'.repeat(Math.min(3, Math.max(1, +h[1] - 3))) + ' ' + one(marksInline(c))); return; }
    if([...c.children].some(x=>NOTE_BLOCK.test(x.tagName))){ walk(c); return; }   // a paragraph holding others
    const txt = marksInline(c);
    out.push(...(txt === '' || txt === '\n' ? [''] : txt.replace(/\n$/, '').split('\n')));
  };
  const walk = n=>{
    for(const c of n.childNodes){
      if(c.nodeType === 1 && NOTE_BLOCK.test(c.tagName)){ flush(); block(c); }
      else if(c.nodeType === 1) line += c.tagName === 'BR' ? '\n' : marksInline({childNodes:[c]});
      else if(c.nodeType === 3) line += c.nodeValue.replace(/\u00a0/g, ' ');
    }
    flush();
  };
  walk(root);
  while(out.length && !out[out.length - 1].trim()) out.pop();
  return out.join('\n');
}
// "- ", "* ", "1. ", "# ", "## ", "### ", "> " at the start of a line start that kind of line
const NOTE_STARTS = [['- ', 'insertUnorderedList'], ['* ', 'insertUnorderedList'], ['1. ', 'insertOrderedList'], ['### ', 'formatBlock', 'h6'], ['## ', 'formatBlock', 'h5'], ['# ', 'formatBlock', 'h4'], ['> ', 'formatBlock', 'blockquote']];
try{ document.execCommand('defaultParagraphSeparator', false, 'p'); document.execCommand('styleWithCSS', false, false); }catch(e){}

function tkNotesEditor({box, tools, onChange}){
  const changed = ()=>{ box.classList.toggle('blank', !box.textContent.trim() && !box.querySelector('li, h4, h5, h6, blockquote, pre')); if(onChange) onChange(); };
  // The paragraph (or list item, heading…) the cursor is in, inside the box
  const blockAt = node=>{
    while(node && node !== box){ if(node.nodeType === 1 && NOTE_BLOCK.test(node.tagName)) return node; node = node.parentNode; }
    return box;
  };
  const blockIs = tag=>String(document.queryCommandValue('formatBlock') || '').toLowerCase() === tag;
  function mark(kind){
    if(box.contentEditable !== 'true') return;
    box.focus();
    const sel = getSelection();
    if(!sel.rangeCount || !box.contains(sel.anchorNode)){ const r = document.createRange(); r.selectNodeContents(box); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    const cmd = {bold:'bold', italic:'italic', underline:'underline', strike:'strikeThrough', list:'insertUnorderedList'}[kind];
    if(cmd) document.execCommand(cmd);
    else if(kind === 'heading' || kind === 'quote' || kind === 'block'){
      const tag = {heading:'h5', quote:'blockquote', block:'pre'}[kind];
      document.execCommand('formatBlock', false, blockIs(tag) ? 'p' : tag);
    }
    else if(kind === 'code'){
      let n = sel.anchorNode; while(n && n !== box && n.tagName !== 'CODE') n = n.parentNode;
      if(n && n !== box && n.tagName === 'CODE') n.replaceWith(...n.childNodes);   // already code: back to plain text
      else if(!sel.isCollapsed){ const r = sel.getRangeAt(0), code = document.createElement('code'); code.textContent = r.toString(); r.deleteContents(); r.insertNode(code); }
    }
    changed();
  }
  function lineStart(){
    const sel = getSelection(); if(!sel.isCollapsed || !sel.rangeCount || !box.contains(sel.anchorNode)) return;
    const blk = blockAt(sel.anchorNode);
    if(blk !== box && !/^(P|DIV)$/.test(blk.tagName)) return;   // a plain line only (not already a list, heading…)
    // The line's first bit of text must be the mark and a space, with the cursor still in it
    const first = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT).nextNode();
    if(!first || sel.anchorNode !== first) return;
    if(blk === box && first.previousSibling) return;   // a bare line: only the box's first one
    const hit = NOTE_STARTS.find(([m])=>first.data.replace(/\u00a0/g, ' ').startsWith(m));
    if(!hit) return;
    // Format the line first (with the mark still in it, so the line can't collapse), then take the mark out
    document.execCommand(hit[1], false, hit[2]);
    const now = getSelection(), line = blockAt(now.anchorNode);
    const t = document.createTreeWalker(line, NodeFilter.SHOW_TEXT).nextNode();
    if(t && t.data.replace(/\u00a0/g, ' ').startsWith(hit[0])){
      t.deleteData(0, hit[0].length);
      if(!line.textContent){   // nothing typed after the mark yet: keep the empty line open for the cursor
        t.remove(); line.appendChild(document.createElement('br'));
        const r = document.createRange(); r.setStart(line, 0); r.collapse(true); now.removeAllRanges(); now.addRange(r);
      }
    }
    changed();
  }
  if(tools){
    tools.addEventListener('mousedown', e=>{ if(e.target.closest('[data-mark]')) e.preventDefault(); });   // keep the selection
    tools.addEventListener('click', e=>{ const m = e.target.closest('[data-mark]'); if(m) mark(m.dataset.mark); });
  }
  box.addEventListener('input', e=>{
    // Line starts run just after the typing (the browser won't format from inside its own typing event);
    // whole words at a time too, so it works with phone keyboards
    if(e.inputType === 'insertText' && / /.test(e.data || '')) setTimeout(lineStart, 0);
    changed();
  });
  // Enter on an empty quote line leaves the quote (as it does a list)
  box.addEventListener('keydown', e=>{
    if(e.key !== 'Enter' || e.shiftKey) return;
    const sel = getSelection(); if(!sel.rangeCount) return;
    const blk = blockAt(sel.anchorNode);
    if(blk.tagName !== 'BLOCKQUOTE' || blk.textContent.trim()) return;
    e.preventDefault(); document.execCommand('formatBlock', false, 'p'); changed();
  });
  // Pasted or dropped text comes in as plain text (formatting from other sites stays out)
  ['paste', 'drop'].forEach(t=>box.addEventListener(t, e=>{
    const text = (e.clipboardData || e.dataTransfer).getData('text/plain'); e.preventDefault();
    if(box.contentEditable !== 'true') return;
    if(t === 'drop' && document.caretRangeFromPoint){ const r = document.caretRangeFromPoint(e.clientX, e.clientY); if(r){ getSelection().removeAllRanges(); getSelection().addRange(r); } }
    document.execCommand('insertText', false, text);
  }));
  return {
    set(md, force){
      if(!force && document.activeElement === box) return;   // not under someone typing
      md = String(md || '');
      box.innerHTML = md ? renderMarkdown(md, true) : '';
      box.classList.toggle('blank', !md.trim());
    },
    get: ()=>notesToMarks(box),
    readOnly(on){ box.contentEditable = on ? 'false' : 'true'; if(tools) tools.hidden = !!on; },
  };
}
