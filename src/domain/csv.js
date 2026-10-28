/** Exportación a CSV (separador ;, con BOM para Excel en español). */
export function csvOf(cols, rows) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  return '﻿' + [cols.map(c => c[1]).join(';'), ...rows.map(r => cols.map(([k, , f]) => cell(f ? f(r) : r[k])).join(';'))].join('\r\n');
}
/** Descarga un archivo de texto en el navegador. */
export function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
