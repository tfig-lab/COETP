/* Capítulo de custos: as 4 linhas de investimento, o cronograma financeiro e o roadmap com valores.
   Base: os 83 itens de js/viabilidade-dados.js (planilha do estudo, aba 04). Cada item entra inteiro numa linha;
   projeto, PMO, equipe do COE e implantação são compartilhados e rateados pelo custo direto de cada linha.
   Essencial = cenário Mínimo (Onda 1); Necessário = entra no Recomendado (Onda 2); Opcional = só no Completo (Onda 3).
   O valor de cada item é distribuído por igual entre os trimestres de início e fim, o que reproduz o desembolso da planilha. */
(function () {
  const V = window.VIAB;
  if (!V) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fmt = (v, d) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const mi = v => 'R$ ' + fmt(v / 1e6, 1) + ' mi';
  const mil = v => (Math.round(v / 1e3) ? fmt(v / 1e3) : '–');
  const reais = v => 'R$ ' + fmt(v);
  const curto = v => (v >= 1e6 ? 'R$ ' + fmt(v / 1e6, 2) + ' mi' : 'R$ ' + fmt(v / 1e3) + ' mil');
  const TRI = V.desembolso.tri;
  const triTxt = t => String(t).replace(/A(\d) Q(\d)/, (m, a, q) => q + 'º tri de ' + (2026 + +a));
  const triCurto = t => String(t).replace(/A(\d) Q(\d)/, (m, a, q) => 'T' + q + '/' + (26 + +a));

  const LINHAS = [
    { id: 'integracao', nome: 'Integração', cor: 'ln-c1',
      oque: 'Ligar ao COE o que já existe: sistemas de gestão (Império, Evolutize, formulários e clima), CLPs dos fornecedores, medidores e câmeras, e a rede OT segura que leva o dado até a sala.',
      ids: 'C037 C038 C046 C047 C048 C049 C061 C018 C063 C064 C065 C066 C067 C068 C076 C077 C016' },
    { id: 'automacao', nome: 'Automação', cor: 'ln-c2',
      oque: 'Campo e supervisão: regularização de painéis, calibração, instrumentos novos (nível, depressão, vazão, scanner 3D), ampliação do SCADA BluePlant, alarmes e o suporte de automação.',
      ids: 'C003 C019 C036 C044 C050 C051 C052 C053 C054 C055 C056 C057 C058 C059 C060 C062 C072' },
    { id: 'software', nome: 'Software', cor: 'ln-c3',
      oque: 'Plataformas e licenças (Power BI, historiador de processo), servidores e a sala onde o software é operado: videowall, postos, energia, climatização e comunicação.',
      ids: 'C041 C045 C043 C004 C005 C006 C007 C008 C009 C010 C011 C012 C013 C014 C015 C017 C020 C021 C022 C023 C024 C025 C026 C027 C028 C029 C030 C031 C032 C033 C034 C035 C079 C080 C081' },
    { id: 'desenvolvimento', nome: 'Desenvolvimento', cor: 'ln-c4',
      oque: 'Construir e evoluir o COE: banco operacional e ETL/API, as 22 telas do videowall, alertas para o campo, qualidade de dados, analista de BI, medição de benefícios e o template para outras unidades.',
      ids: 'C039 C040 C042 C078 C071 C083 C075' },
  ];
  /* frentes: agrupam os itens de cada linha no roadmap */
  const FRENTES = {
    'Sistemas de gestão': 'C037 C038', 'CLPs, gateways e medidores': 'C046 C047 C048 C049 C061', 'Câmeras (CFTV)': 'C018',
    'Rede OT e cibersegurança': 'C063 C064 C065 C066 C067 C068 C076 C077 C016',
    'Engenharia, laudos e regularização': 'C003 C019 C051', 'SCADA e alarmes': 'C044 C050 C036',
    'Instrumentação nova': 'C052 C053 C054 C055 C056 C057 C058 C059 C060 C062', 'Suporte de automação': 'C072',
    'Plataformas e licenças': 'C041 C045', 'Servidores': 'C043',
    'Sala do COE (obra, energia, clima, mobiliário)': 'C004 C011 C012 C013 C014 C015 C017 C022 C026 C027 C028 C029 C030 C031 C032 C080 C081',
    'Videowall e postos de operação': 'C005 C006 C007 C008 C009 C010 C020 C021 C033 C034 C035', 'Sala de crise e campo': 'C023 C024 C025 C079',
    'Banco operacional e ETL/API': 'C039', 'Painéis do videowall e alertas': 'C040 C078', 'Qualidade de dados e analista': 'C042 C071',
    'Benefícios e replicação': 'C075 C083',
  };
  const FRENTE = Object.fromEntries(Object.entries(FRENTES).flatMap(([f, ids]) => ids.split(' ').map(id => [id, f])));
  const COMPART = 'C001 C002 C069 C070 C073 C074 C082'.split(' ');
  const CLASSES = [
    { id: 'E', nome: 'Essencial', desc: 'cenário Mínimo, Onda 1: sem ele o COE não entra em operação' },
    { id: 'N', nome: 'Necessário', desc: 'entra no cenário Recomendado, Onda 2: completa a cobertura da automação' },
    { id: 'O', nome: 'Opcional', desc: 'só no cenário Completo, Onda 3: amplia a medição em campo' },
  ];
  const CEN = [{ id: 'Mínimo', cl: ['E'] }, { id: 'Recomendado', cl: ['E', 'N'] }, { id: 'Completo', cl: ['E', 'N', 'O'] }];

  /* ---------- dados ---------- */
  const porId = Object.fromEntries(V.custos.map(c => [c.id, c]));
  const classe = c => (c.cen[0] ? 'E' : c.cen[1] ? 'N' : 'O');
  const trimestres = c => { const a = TRI.indexOf(c.ini), b = TRI.indexOf(c.fim); return Array.from({ length: b - a + 1 }, (_, i) => a + i); };
  const serie = c => { const q = Array(12).fill(0), t = trimestres(c); t.forEach(i => { q[i] += c.total / t.length; }); return q; };
  const item = c => ({ id: c.id, nome: c.item, espec: c.espec || c.obs || '', sub: c.sub, total: c.total, opex: c.opex || 0,
    ini: c.ini, fim: c.fim, classe: classe(c), q: serie(c), frente: FRENTE[c.id] || c.sub });

  const compart = COMPART.map(id => item(porId[id]));
  const totCompart = compart.reduce((t, c) => t + c.total, 0);
  LINHAS.forEach(l => { l.itens = l.ids.split(' ').map(id => item(porId[id])); l.direto = l.itens.reduce((t, c) => t + c.total, 0); });
  const totDireto = LINHAS.reduce((t, l) => t + l.direto, 0);
  LINHAS.forEach(l => {
    l.peso = l.direto / totDireto;
    l.rateio = { id: 'R-' + l.id, nome: 'Projeto, PMO, equipe do COE e implantação (parcela de ' + fmt(l.peso * 100) + '%)',
      espec: 'Rateio, pelo custo direto da linha, de: ' + compart.map(c => c.nome).join('; ') + '.',
      sub: 'Compartilhado', total: totCompart * l.peso, opex: compart.reduce((t, c) => t + c.opex, 0) * l.peso,
      ini: 'A1 Q1', fim: 'A3 Q4', classe: 'E', q: Array.from({ length: 12 }, (_, i) => compart.reduce((t, c) => t + c.q[i], 0) * l.peso), rateio: true };
    l.todos = l.itens.concat([l.rateio]);
  });
  const soma = (lista, f) => lista.reduce((t, x) => t + f(x), 0);
  const daClasse = (l, cl) => l.todos.filter(x => cl.includes(x.classe));
  const totLinha = (l, cl) => soma(daClasse(l, cl || 'ENO'), x => x.total);
  const qLinha = (l, cl) => Array.from({ length: 12 }, (_, i) => soma(daClasse(l, cl), x => x.q[i]));
  const TOTAL = soma(LINHAS, l => totLinha(l));

  const contCen = Object.fromEntries(V.cenarios.nomes.map((n, i) => [n, { conting: V.cenarios.conting[i], total: V.cenarios.total[i], opex: V.cenarios.opex[i], ondas: V.cenarios.ondas[i] }]));
  let cenario = 'Recomendado';
  const clsCen = () => CEN.find(c => c.id === cenario).cl;

  /* ---------- peças ---------- */
  const tabela = (cab, linhas, cls) => '<div class="tbl"><table class="ln-tab ' + (cls || '') + '"><thead><tr>' + cab.map(c => '<th>' + c + '</th>').join('') +
    '</tr></thead><tbody>' + linhas.map(l => '<tr' + (l.cls ? ' class="' + l.cls + '"' : '') + '>' + (l.cel || l).map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const dir = v => '<span class="dir">' + v + '</span>';
  const pilha = (l, larg) => '<span class="ln-pilha" style="width:' + (larg || 100) + '%">' + CLASSES.map(c => {
    const v = totLinha(l, c.id);
    return v ? '<i class="ln-k' + c.id + '" style="flex:' + v + '" data-dica="' + c.nome + ': ' + reais(v) + '"></i>' : '';
  }).join('') + '</span>';
  const periodo = l => { const a = Math.min(...l.itens.map(x => TRI.indexOf(x.ini))), b = Math.max(...l.itens.map(x => TRI.indexOf(x.fim))); return [TRI[a], TRI[b]]; };
  const legClasses = '<div class="vb-leg">' + CLASSES.map(c => '<span><i class="o-ponto ln-k' + c.id + '"></i><b>' + c.nome + '</b>&nbsp;' + c.desc + '</span>').join('') + '</div>';
  const legLinhas = '<div class="vb-leg">' + LINHAS.map(l => '<span><i class="o-ponto ' + l.cor + '"></i>' + l.nome + '</span>').join('') + '</div>';
  const seletor = () => '<div class="seg-c ln-cen" role="group" aria-label="Cenário">' + CEN.map(c =>
    '<button type="button" data-cen="' + c.id + '" aria-pressed="' + (c.id === cenario) + '">' + c.id + ' <small>(' + c.cl.map(k => CLASSES.find(x => x.id === k).nome.toLowerCase()).join(' + ') + ')</small></button>').join('') + '</div>';

  /* ---------- visão geral ---------- */
  function geral() {
    const el = $('[data-ln="geral"]');
    if (!el) return;
    const maior = Math.max(...LINHAS.map(l => totLinha(l)));
    const cards = '<div class="ln-cards">' + LINHAS.map((l, i) => {
      const [a, b] = periodo(l);
      return '<a class="ln-card" href="#viabilidade/linhas-de-investimento/' + l.id + '"><span class="ln-n ' + l.cor + '">' + (i + 1) + '</span><b>' + l.nome + '</b>' +
        '<span class="ln-v">' + mi(totLinha(l)) + '</span><small>' + fmt(totLinha(l) / TOTAL * 100) + '% do total · ' + triTxt(a) + ' a ' + triTxt(b) + '</small>' +
        pilha(l, totLinha(l) / maior * 100) +
        '<span class="ln-cl">' + CLASSES.map(c => '<span><i class="o-ponto ln-k' + c.id + '"></i>' + c.nome + ' ' + (totLinha(l, c.id) ? curto(totLinha(l, c.id)) : '–') + '</span>').join('') + '</span></a>';
    }).join('') + '</div>';
    const linhasTab = LINHAS.map(l => [ '<b>' + l.nome + '</b>' ].concat(CLASSES.map(c => dir(mil(totLinha(l, c.id))))).concat([dir('<b>' + mil(totLinha(l)) + '</b>'), dir(mil(soma(l.todos, x => x.opex)))]));
    linhasTab.push({ cls: 'ln-tot', cel: ['<b>Total</b>'].concat(CLASSES.map(c => dir('<b>' + mil(soma(LINHAS, l => totLinha(l, c.id))) + '</b>'))).concat([dir('<b>' + mil(TOTAL) + '</b>'), dir('<b>' + mil(soma(LINHAS, l => soma(l.todos, x => x.opex))) + '</b>')]) });
    let acum = 0;
    const cen = CEN.map((c, i) => {
      acum += soma(LINHAS, l => totLinha(l, CLASSES[i].id));
      const k = contCen[c.id];
      return '<div class="ln-cen-card"><small>' + c.id + ' · ' + esc(k.ondas) + '</small><b>' + mi(k.total) + '</b><span>' + mi(acum) + ' de custo direto + ' + mi(k.conting) + ' de contingência</span>' +
        '<span>' + c.cl.map(x => CLASSES.find(y => y.id === x).nome).join(' + ') + '</span></div>';
    }).join('');
    el.innerHTML = cards +
      '<section class="sec"><h3>Valor por linha e classificação, em R$ mil</h3>' + legClasses +
      tabela(['Linha', dir('Essencial'), dir('Necessário'), dir('Opcional'), dir('Total 3 anos'), dir('OPEX/ano após implantação')], linhasTab, 'ln-num') + '</section>' +
      '<section class="sec"><h3>Quanto custa cada cenário, com contingência</h3><div class="ln-cens">' + cen + '</div></section>';
  }

  /* ---------- cada linha ---------- */
  function linha(l) {
    const el = $('[data-ln="' + l.id + '"]');
    if (!el) return;
    const [a, b] = periodo(l);
    const q = CLASSES.map(c => qLinha(l, c.id)), maxQ = Math.max(...Array.from({ length: 12 }, (_, i) => q[0][i] + q[1][i] + q[2][i]));
    const barras = '<div class="ln-mini" role="img" aria-label="Desembolso de ' + l.nome + ' por trimestre">' + TRI.map((t, i) =>
      '<span class="ln-mc" data-dica="' + triTxt(t) + ': ' + reais(q[0][i] + q[1][i] + q[2][i]) + '"><span class="ln-mb">' +
      CLASSES.map((c, k) => q[k][i] ? '<i class="ln-k' + c.id + '" style="height:' + (q[k][i] / maxQ * 100) + '%"></i>' : '').join('') + '</span><small>' + triCurto(t) + '</small></span>').join('') + '</div>';
    const grupo = c => {
      const its = daClasse(l, c.id).sort((x, y) => TRI.indexOf(x.ini) - TRI.indexOf(y.ini) || y.total - x.total);
      if (!its.length) return '<section class="sec"><h3>' + c.nome + '</h3><p class="vb-apoio">Nenhum item desta linha é ' + c.nome.toLowerCase() + '.</p></section>';
      return '<section class="sec"><h3><i class="o-ponto ln-k' + c.id + '"></i>' + c.nome + ' · ' + reais(soma(its, x => x.total)) + '</h3><p class="vb-apoio">' + c.nome + ': ' + c.desc + '.</p>' +
        tabela(['Item', 'O que é', 'Quando', dir('Valor (R$)'), dir('OPEX/ano')], its.map(x => [
          (x.rateio ? '<b>' + esc(x.nome) + '</b>' : '<b>' + esc(x.nome) + '</b><small class="ln-id">' + x.id + '</small>'),
          esc(x.espec), triTxt(x.ini) + (x.fim !== x.ini ? ' a ' + triTxt(x.fim) : ''), dir(fmt(x.total)), dir(x.opex ? fmt(x.opex) : '–')])) + '</section>';
    };
    el.innerHTML = '<p class="intro">' + esc(l.oque) + '</p>' +
      '<div class="vb-cont ln-kpis"><div><b>' + mi(totLinha(l)) + '</b><span>total em 3 anos</span></div>' +
      CLASSES.map(c => '<div><b>' + (totLinha(l, c.id) ? curto(totLinha(l, c.id)) : '–') + '</b><span><i class="o-ponto ln-k' + c.id + '"></i>' + c.nome.toLowerCase() + '</span></div>').join('') +
      '<div><b>' + triCurto(a) + ' a ' + triCurto(b) + '</b><span>período</span></div>' +
      '<div><b>' + curto(soma(l.todos, x => x.opex)) + '</b><span>OPEX/ano após implantação</span></div></div>' +
      '<section class="sec"><h3>Quando o dinheiro sai</h3>' + legClasses + barras + '</section>' +
      CLASSES.map(grupo).join('');
  }

  /* ---------- cronograma financeiro ---------- */
  function cronograma() {
    const el = $('[data-ln="cronograma"]');
    if (!el) return;
    const cl = clsCen();
    const q = LINHAS.map(l => qLinha(l, cl));
    const tq = TRI.map((_, i) => soma(q, s => s[i]));
    const maxQ = Math.max(...tq);
    let ac = 0; const acum = tq.map(v => (ac += v));
    const gates = t => V.gates.filter(g => g.tri === t).map(g => g.id);
    const graf = '<div class="ln-graf" role="img" aria-label="Desembolso por trimestre, cenário ' + cenario + '">' + TRI.map((t, i) =>
      '<div class="ln-col" data-dica="' + triTxt(t) + ': ' + reais(tq[i]) + ' (acumulado ' + reais(acum[i]) + ')"><span class="ln-val">' + fmt(tq[i] / 1e3) + '</span><span class="ln-b">' +
      LINHAS.map((l, k) => q[k][i] ? '<i class="' + l.cor + '" style="height:' + (q[k][i] / maxQ * 100) + '%"></i>' : '').join('') + '</span>' +
      '<small>' + triCurto(t) + '</small><span class="ln-g">' + gates(t).map(g => '<em>' + g + '</em>').join('') + '</span></div>').join('') + '</div>';
    const anos = [0, 1, 2].map(a => soma(tq.slice(a * 4, a * 4 + 4), v => v));
    const cab = ['Linha'].concat(TRI.map((t, i) => dir(triCurto(t)) + (i % 4 === 3 ? '' : ''))).concat([dir('2027'), dir('2028'), dir('2029'), dir('Total')]);
    const lin = (nome, s, cls) => ({ cls, cel: [nome].concat(s.map(v => dir(mil(v)))).concat([0, 1, 2].map(a => dir('<b>' + mil(soma(s.slice(a * 4, a * 4 + 4), v => v)) + '</b>'))).concat([dir('<b>' + mil(soma(s, v => v)) + '</b>')]) });
    const linhasTab = LINHAS.map((l, k) => lin('<i class="o-ponto ' + l.cor + '"></i><b>' + l.nome + '</b>', q[k]));
    linhasTab.push(lin('<b>Total do trimestre</b>', tq, 'ln-tot'));
    linhasTab.push({ cls: 'ln-acum', cel: ['Acumulado'].concat(acum.map(v => dir(mil(v)))).concat(['', '', '', '']) });
    const k = contCen[cenario];
    el.innerHTML = seletor() +
      '<div class="ln-cens ln-anos">' + anos.map((v, a) => '<div class="ln-cen-card"><small>' + (2027 + a) + '</small><b>' + mi(v) + '</b><span>' + fmt(v / acum[11] * 100) + '% do cenário</span></div>').join('') +
      '<div class="ln-cen-card"><small>Total ' + cenario + '</small><b>' + mi(acum[11]) + '</b><span>+ ' + mi(k.conting) + ' de contingência = ' + mi(k.total) + '</span></div></div>' +
      '<section class="sec"><h3>Desembolso por trimestre, em R$ mil</h3>' + legLinhas + graf + '<p class="vb-apoio">G0 a G7 são os gates de decisão e investimento: cada um libera a etapa seguinte. Passe o mouse nas colunas para ver o valor e o acumulado.</p></section>' +
      '<section class="sec"><h3>Cronograma por linha, em R$ mil</h3>' + tabela(cab, linhasTab, 'ln-num ln-crono') + '</section>';
  }

  /* ---------- roadmap com valores (3 anos) ---------- */
  function roadmap() {
    const el = $('[data-ln="roadmap"]');
    if (!el) return;
    const cl = clsCen();
    let ac = 0;
    const tq = TRI.map((_, i) => soma(LINHAS, l => qLinha(l, cl)[i]));
    const acum = tq.map(v => (ac += v));
    const colGate = g => TRI.indexOf(g.tri) + 1;
    const gq = TRI.map((t, i) => ({ i, ids: V.gates.filter(g => g.tri === t) })).filter(x => x.ids.length);
    const gatesLin = '<div class="g-lin ln-gates"><span class="g-n"><b>Gates</b> e investimento acumulado no fim do trimestre</span><span class="g-trilha ln-trilha">' +
      gq.map(x => '<span class="ln-gate" style="grid-column:' + (x.i + 1) + '" data-dica="' + esc(x.ids.map(g => g.id + ' · ' + g.etapa + ': ' + g.cond).join(' | ')) + '. Acumulado até ' + triTxt(TRI[x.i]) + ': ' + reais(acum[x.i]) + '">' +
        '<span>' + x.ids.map(g => '<b>' + g.id + '</b>').join('') + '</span><small>' + curto(acum[x.i]) + '</small></span>').join('') +
      '</span><span class="g-m"></span></div>';
    const corpo = LINHAS.map(l => {
      const grupos = {};
      daClasse(l, cl).filter(x => !x.rateio).forEach(x => {
        const k = x.frente + '|' + x.classe;
        (grupos[k] = grupos[k] || { sub: x.frente, classe: x.classe, itens: [] }).itens.push(x);
      });
      const lista = Object.values(grupos).map(g => Object.assign(g, {
        a: Math.min(...g.itens.map(x => TRI.indexOf(x.ini))), b: Math.max(...g.itens.map(x => TRI.indexOf(x.fim))), v: soma(g.itens, x => x.total) }))
        .sort((x, y) => x.sub.localeCompare(y.sub) || 'ENO'.indexOf(x.classe) - 'ENO'.indexOf(y.classe));
      const ordem = Object.keys(FRENTES); lista.sort((x, y) => ordem.indexOf(x.sub) - ordem.indexOf(y.sub) || 'ENO'.indexOf(x.classe) - 'ENO'.indexOf(y.classe));
      const r = l.rateio;
      return '<div class="g-fase ln-fase"><i class="o-ponto ' + l.cor + '"></i>' + l.nome + ' <small>' + reais(totLinha(l, cl)) + ' no cenário ' + cenario + '</small></div>' +
        lista.map(g => '<div class="g-lin"><span class="g-n"><b>' + esc(g.sub) + '</b> ' + CLASSES.find(c => c.id === g.classe).nome.toLowerCase() + ', ' + g.itens.length + (g.itens.length > 1 ? ' itens' : ' item') + '</span><span class="g-trilha"><i class="ln-k' + g.classe + '" style="grid-column:' + (g.a + 1) + ' / ' + (g.b + 2) + '" data-dica="' +
          esc(g.itens.map(x => x.nome + ' (' + reais(x.total) + ')').join('; ')) + '"></i></span><span class="g-m ln-gv">' + curto(g.v) + '</span></div>').join('') +
        '<div class="g-lin ln-rat"><span class="g-n"><b>Projeto, PMO, equipe e implantação</b> parcela de ' + fmt(l.peso * 100) + '%</span><span class="g-trilha"><i class="ln-kE" style="grid-column:1 / 13" data-dica="' + esc(r.espec) + '"></i></span><span class="g-m ln-gv">' + curto(r.total) + '</span></div>';
    }).join('');
    el.innerHTML = seletor() + legClasses +
      '<div class="tbl"><div class="gantt ln-gantt"><div class="g-cab"><span>Linha e frente</span><span class="g-meses">' + TRI.map(t => '<span>' + triCurto(t) + '</span>').join('') + '</span><span>Valor</span></div>' +
      gatesLin + corpo +
      '<div class="g-lin ln-tri-tot"><span class="g-n"><b>Desembolso no trimestre</b> R$ mil</span><span class="g-trilha ln-trilha">' + tq.map((v, i) => '<span style="grid-column:' + (i + 1) + '">' + fmt(v / 1e3) + '</span>').join('') + '</span><span class="g-m ln-gv"><b>' + curto(acum[11]) + '</b></span></div>' +
      '</div></div>';
  }

  /* ---------- faixa de valores no roadmap do capítulo 07 (meses do Ano 1) ---------- */
  function faixaRoadmap() {
    const g = $('[data-v="gantt"] .gantt');
    if (!g || $('.ln-faixa', g)) return;
    const cl = ['E', 'N'];
    const q = LINHAS.map(l => qLinha(l, cl).slice(0, 4));
    const tq = [0, 1, 2, 3].map(i => soma(q, s => s[i]));
    const maxQ = Math.max(...tq);
    let ac = 0;
    const div = document.createElement('div');
    div.innerHTML = '<div class="g-fase">Investimento previsto em 2027 · cenário Recomendado</div>' +
      '<div class="g-lin ln-faixa"><span class="g-n"><b>Desembolso por trimestre</b> pelas 4 linhas de investimento</span><span class="g-trilha ln-trilha">' +
      tq.map((v, i) => '<span class="ln-fq" style="grid-column:' + (i * 3 + 1) + ' / ' + (i * 3 + 4) + '" data-dica="T' + (i + 1) + '/27: ' + LINHAS.map((l, k) => l.nome + ' ' + reais(q[k][i])).join('; ') + '">' +
        '<span class="ln-fb">' + LINHAS.map((l, k) => '<i class="' + l.cor + '" style="flex:' + q[k][i] + '"></i>').join('') + '</span><b style="opacity:' + (0.55 + 0.45 * v / maxQ) + '">' + curto(v) + '</b><small>acumulado ' + curto(ac += v) + '</small></span>').join('') +
      '</span><span class="g-m"><a href="#viabilidade/cronograma-financeiro/roadmap">' + curto(ac) + ' em 2027 · ver os 3 anos</a></span></div>';
    [...div.children].forEach(n => g.append(n));
  }

  function gatesComValor() {
    const t = $('[data-v="gates"] table');
    if (!t || $('.ln-gcol', t)) return;
    const tq = TRI.map((_, i) => soma(LINHAS, l => qLinha(l, ['E', 'N'])[i]));
    let ac = 0; const acum = tq.map(v => (ac += v));
    const th = document.createElement('th'); th.className = 'ln-gcol'; th.innerHTML = '<span class="dir">Investido até o gate<br><small>cenário Recomendado</small></span>';
    $('thead tr', t).append(th);
    $$('tbody tr', t).forEach((tr, i) => {
      const g = V.gates[i], td = document.createElement('td');
      td.innerHTML = g ? '<span class="dir"><b>' + curto(acum[TRI.indexOf(g.tri)]) + '</b></span>' : '';
      tr.append(td);
    });
  }


  /* ---------- checklist de investimentos ---------- */
  const ETAPAS_CK = [{ id: 'cot', nome: 'Cotado' }, { id: 'apr', nome: 'Aprovado' }, { id: 'con', nome: 'Contratado' }];
  const CHAVE_CK = 'coe:checklist-investimentos';
  let marcas = {};
  try { marcas = JSON.parse(localStorage.getItem(CHAVE_CK) || '{}') || {}; } catch (e) { marcas = {}; }
  const gravar = () => { try { localStorage.setItem(CHAVE_CK, JSON.stringify(marcas)); } catch (e) { /* sem armazenamento: vale só nesta visita */ } };
  let ckCen = 'Recomendado', ckBusca = '';
  const GRUPOS_CK = LINHAS.map(l => ({ id: l.id, nome: l.nome, cor: l.cor, itens: l.itens }))
    .concat([{ id: 'compart', nome: 'Compartilhados: projeto, PMO, equipe e implantação', cor: 'ln-c0', itens: compart }]);
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function checklist() {
    const el = $('[data-ln="checklist"]');
    if (!el) return;
    const cl = CEN.find(c => c.id === ckCen).cl;
    const visiveis = g => g.itens.filter(x => cl.includes(x.classe) && (!ckBusca || norm(x.nome + ' ' + x.id + ' ' + x.frente).includes(norm(ckBusca))));
    const todos = GRUPOS_CK.flatMap(g => g.itens.filter(x => cl.includes(x.classe)));
    const totalCen = soma(todos, x => x.total);
    const resumo = ETAPAS_CK.map(e => {
      const v = soma(todos.filter(x => (marcas[x.id] || {})[e.id]), x => x.total), n = todos.filter(x => (marcas[x.id] || {})[e.id]).length;
      return '<div class="ln-cen-card"><small>' + e.nome + '</small><b>' + mi(v) + '</b><span>' + n + ' de ' + todos.length + ' itens · ' + fmt(totalCen ? v / totalCen * 100 : 0) + '% do valor</span>' +
        '<span class="ln-prog"><i style="width:' + (totalCen ? v / totalCen * 100 : 0) + '%"></i></span></div>';
    }).join('');
    const linha = x => {
      const m = marcas[x.id] || {};
      return '<tr class="' + (m.con ? 'ck-ok' : '') + '"><td><b>' + esc(x.nome) + '</b><small class="ln-id">' + x.id + ' · ' + esc(x.frente) + '</small></td>' +
        '<td><span class="ck-cl"><i class="o-ponto ln-k' + x.classe + '"></i>' + CLASSES.find(c => c.id === x.classe).nome + '</span></td>' +
        '<td>' + triTxt(x.ini) + (x.fim !== x.ini ? ' a ' + triTxt(x.fim) : '') + '</td><td>' + dir(fmt(x.total)) + '</td>' +
        ETAPAS_CK.map(e => '<td class="ck-c"><input type="checkbox" data-ck="' + x.id + '" data-et="' + e.id + '"' + (m[e.id] ? ' checked' : '') + ' aria-label="' + e.nome + ': ' + esc(x.nome) + '"></td>').join('') + '</tr>';
    };
    const blocos = GRUPOS_CK.map(g => {
      const its = visiveis(g).sort((a, b) => 'ENO'.indexOf(a.classe) - 'ENO'.indexOf(b.classe) || TRI.indexOf(a.ini) - TRI.indexOf(b.ini));
      if (!its.length) return '';
      const tot = soma(its, x => x.total), feito = soma(its.filter(x => (marcas[x.id] || {}).con), x => x.total);
      return '<section class="sec ck-g"><h3><i class="o-ponto ' + g.cor + '"></i>' + esc(g.nome) + ' <small>' + reais(tot) + ' · contratado ' + fmt(tot ? feito / tot * 100 : 0) + '%</small></h3>' +
        '<div class="tbl"><table class="ln-tab ck-tab"><thead><tr><th>Item</th><th>Classificação</th><th>Quando</th><th>' + dir('Valor (R$)') + '</th>' + ETAPAS_CK.map(e => '<th class="ck-c">' + e.nome + '</th>').join('') + '</tr></thead><tbody>' +
        its.map(linha).join('') + '</tbody></table></div></section>';
    }).join('');
    el.innerHTML = '<div class="ck-barra"><div class="seg-c ck-cen" role="group" aria-label="Cenário do checklist">' + CEN.map(c => '<button type="button" data-ckcen="' + c.id + '" aria-pressed="' + (c.id === ckCen) + '">' + c.id + '</button>').join('') + '</div>' +
      '<input type="search" class="ck-busca" placeholder="Buscar item, código ou frente" value="' + esc(ckBusca) + '" aria-label="Buscar no checklist">' +
      '<button type="button" class="ck-bt" data-ckacao="csv">Exportar checklist (.csv)</button><button type="button" class="ck-bt ck-sec" data-ckacao="limpar">Limpar marcações</button></div>' +
      '<div class="ln-cens ck-res">' + resumo + '</div>' + legClasses + (blocos || '<p class="vb-apoio">Nenhum item encontrado.</p>');
  }
  function exportar() {
    const cel = v => '"' + String(v).replace(/"/g, '""') + '"';
    const linhas = [['Grupo', 'Código', 'Item', 'Frente', 'Classificação', 'Início', 'Fim', 'Valor (R$)', 'OPEX/ano (R$)', 'Cotado', 'Aprovado', 'Contratado']];
    GRUPOS_CK.forEach(g => g.itens.forEach(x => {
      const m = marcas[x.id] || {};
      linhas.push([g.nome, x.id, x.nome, x.frente, CLASSES.find(c => c.id === x.classe).nome, x.ini, x.fim, Math.round(x.total), Math.round(x.opex), m.cot ? 'Sim' : 'Não', m.apr ? 'Sim' : 'Não', m.con ? 'Sim' : 'Não']);
    }));
    const csv = '﻿' + linhas.map(l => l.map(cel).join(';')).join('\r\n');
    (window.coeBaixar || (() => {}))('checklist-investimentos-coe-' + new Date().toISOString().slice(0, 10) + '.csv', new Blob([csv], { type: 'text/csv' }));
  }
  document.addEventListener('change', e => {
    const c = e.target.closest && e.target.closest('[data-ck]');
    if (!c) return;
    const m = marcas[c.dataset.ck] = marcas[c.dataset.ck] || {};
    m[c.dataset.et] = c.checked;
    /* contratado pressupõe aprovado e cotado; desmarcar cotado desfaz as etapas seguintes */
    if (c.checked && c.dataset.et === 'con') { m.apr = true; m.cot = true; }
    if (c.checked && c.dataset.et === 'apr') m.cot = true;
    if (!c.checked && c.dataset.et === 'cot') { m.apr = false; m.con = false; }
    if (!c.checked && c.dataset.et === 'apr') m.con = false;
    gravar(); checklist();
    const n = document.querySelector('[data-ck="' + c.dataset.ck + '"][data-et="' + c.dataset.et + '"]'); if (n) n.focus();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ckcen]');
    if (b) { ckCen = b.dataset.ckcen; checklist(); return; }
    const a = e.target.closest('[data-ckacao]');
    if (!a) return;
    if (a.dataset.ckacao === 'csv') exportar();
    if (a.dataset.ckacao === 'limpar' && Object.keys(marcas).length) {
      if (a.dataset.conf) { marcas = {}; gravar(); checklist(); }
      else { a.dataset.conf = '1'; a.textContent = 'Clique de novo para limpar tudo'; setTimeout(() => { a.textContent = 'Limpar marcações'; delete a.dataset.conf; }, 3000); }
    }
  });
  document.addEventListener('input', e => {
    if (!e.target.classList || !e.target.classList.contains('ck-busca')) return;
    ckBusca = e.target.value; const pos = e.target.selectionStart;
    checklist();
    const n = $('.ck-busca'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  });

  /* ---------- montagem ---------- */
  function cenarioCom() { cronograma(); roadmap(); }
  document.addEventListener('click', e => {
    const b = e.target.closest('.ln-cen [data-cen]');
    if (!b) return;
    cenario = b.dataset.cen;
    cenarioCom();
  });
  geral();
  LINHAS.forEach(linha);
  cenarioCom();
  /* O capítulo de roadmap vem antes da viabilidade e não mostra valores: faixaRoadmap() e gatesComValor() ficam desligadas. */
  checklist();
  window.COE_LINHAS = { LINHAS, TOTAL, totLinha };
})();
