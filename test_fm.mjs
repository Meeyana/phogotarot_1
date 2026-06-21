const fmMatch = ['', 'category: lifePath\nnumber: \'7\'\ntitle: S? ch? d?o c?a b?n là 7 - Nhà Tri Th?c & K? Ði Tìm Chân Lý1', ''];
let frontmatter = {};
try {
  const lines = fmMatch[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const k = line.substring(0, colonIdx).trim();
      let v = line.substring(colonIdx + 1).trim();
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else if (!isNaN(v) && v !== '') v = Number(v);
      else if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      frontmatter[k] = v;
    }
  }
} catch(e) {
  console.error('Error', e);
}
console.log(frontmatter);
