/* Downloads dentro do artifact: o navegador do artifact não baixa por <a download>, então os arquivos
   passam pelo recurso de downloads do Claude (o visitante confirma cada arquivo). Os modelos 3D, que rodam
   em iframes, pedem o download por postMessage ({tipo:'coe:baixar', nome, dados}). */
(function () {
  let rec = null;
  async function salvar(nome, dados) {
    /* dentro de um modelo 3D (iframe da mesma origem), quem salva é a página principal */
    try { if (window.parent !== window && window.parent.coeBaixar) return window.parent.coeBaixar(nome, dados); } catch (e) { /* outra origem */ }
    try {
      if (!rec && window.claude && claude.use) rec = await claude.use('downloads');
      if (rec) { await rec.save({ filename: nome, data: dados }); return true; }
    } catch (e) {
      if (e && e.code === 'declined') return false;
      console.warn('download', e);
    }
    /* fora do artifact (site publicado normalmente): download comum */
    try {
      const url = URL.createObjectURL(dados instanceof Blob ? dados : new Blob([dados]));
      const a = document.createElement('a');
      a.href = url; a.download = nome; a.dataset.coeNativo = '1';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (e) { return false; }
  }
  window.coeBaixar = salvar;
  /* arquivos que o artifact não serve (.xlsx) vêm em base64 num .js ao lado: <arquivo>.js */
  /* pacotes grandes (.zip) vêm em partes base64: <arquivo>.1.js, <arquivo>.2.js ... (a parte 1 informa o total) */
  function carrega(src) { return new Promise((ok, falha) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = falha; document.head.append(sc); }); }
  async function emPartes(href) {
    const chave = href.replace(/^\.\//, ''); window.COE_ARQUIVOS = window.COE_ARQUIVOS || {}; window.COE_PARTES = window.COE_PARTES || {};
    const bin = [];
    for (let i = 1; ; i++) {
      const k = chave + '.' + i;
      if (!window.COE_ARQUIVOS[k]) await carrega(k + '.js' + (window.COE_PACOTE_V ? '?v=' + window.COE_PACOTE_V : ''));
      const b = atob(window.COE_ARQUIVOS[k]), u = new Uint8Array(b.length);
      for (let j = 0; j < b.length; j++) u[j] = b.charCodeAt(j);
      bin.push(u); delete window.COE_ARQUIVOS[k];
      if (i >= (window.COE_PARTES[chave] || 1)) break;
    }
    return new Blob(bin, { type: 'application/zip' });
  }
  function embutido(href) {
    const chave = href.replace(/^\.\//, '');
    const pronto = () => {
      const b = atob(window.COE_ARQUIVOS[chave]), u = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      return new Blob([u], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };
    if (window.COE_ARQUIVOS && window.COE_ARQUIVOS[chave]) return Promise.resolve(pronto());
    return new Promise((ok, falha) => {
      const sc = document.createElement('script');
      sc.src = chave + '.js';
      sc.onload = () => (window.COE_ARQUIVOS && window.COE_ARQUIVOS[chave] ? ok(pronto()) : falha(new Error('vazio')));
      sc.onerror = falha;
      document.head.append(sc);
    });
  }
  document.addEventListener('click', async e => {
    const a = e.target.closest && e.target.closest('a[download]');
    if (!a || a.dataset.coeNativo) return;
    const href = a.getAttribute('href');
    if (!href || /^(https?:)?\/\//.test(href) || href.startsWith('data:')) return;
    e.preventDefault();
    try {
      const nome = a.getAttribute('download') || href.split('/').pop().split('?')[0];
      if (/\.xlsx$/i.test(href)) { await window.coeBaixar(nome, await embutido(href)); return; }
      if (/\.zip$/i.test(href)) { const t = a.textContent; a.classList.add('baixando'); a.querySelector('span') ? null : 0; a.dataset.txt = t; a.textContent = 'Preparando o arquivo…'; try { await window.coeBaixar(nome, await emPartes(href)); } finally { a.textContent = a.dataset.txt; a.classList.remove('baixando'); } return; }
      const r = await fetch(href);
      if (!r.ok) throw new Error(r.status);
      await window.coeBaixar(nome, await r.blob());
    } catch (err) { console.warn('download', href, err); }
  });
  window.addEventListener('message', e => {
    const m = e.data;
    if (!m || m.tipo !== 'coe:baixar' || e.origin !== location.origin) return;
    salvar(m.nome, m.dados);
  });
})();
