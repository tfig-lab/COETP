/* Balanças (pesagem embarcada e dosagem de Big Bag): premissa de CAPEX de nov/2026.
   Bloco independente: traz os próprios estilos e entra no capítulo Estudo de viabilidade, sem depender dos demais scripts. */
(function () {
  const ITENS = [
    { id: 'C084', item: 'Pesagem embarcada para pá carregadeira', curto: 'Pá carregadeira',
      espec: 'CG Plus (BRPESA) ou equivalente: pesagem dinâmica pela pressão hidráulica, tela touch, Wi-Fi, USB, impressora, precisão de ±1%; inclui instalação na máquina e registro operacional.',
      b: 25000, v: 30000, a: 35000 },
    { id: 'C085', item: 'Dosador / balança para Big Bag (1 t)', curto: 'Dosador 1 t',
      espec: 'PA-BAL/BAG (Palini & Alves) ou equivalente (EBBP, Embrasack): 1.000 a 1.500 kg por ciclo, válvula pneumática, conectividade Modbus.',
      b: 50000, v: 70000, a: 100000 },
  ];
  const REF = [
    ['Pá carregadeira', 'CG Plus (BRPESA): pesagem embarcada dinâmica pela pressão hidráulica, tela touch, Wi-Fi, USB, impressora e precisão de até ±1%. Fonte técnica: página oficial do produto.',
      'Pesquisa de mercado de sistemas de pesagem embarcada: faixa de R$ 25 a 35 mil para solução premium instalada. A BRPESA não publica preço de tabela e cota conforme máquina e região.'],
    ['Dosador 1 t', 'PA-BAL/BAG (Palini & Alves): balança ensacadeira para grãos e Big Bag de 0 a 1.500 kg, válvula pneumática e Modbus. Referência equivalente: EBBP (Embrasack), até 1,5 t.',
      'Benchmarking de conjuntos industriais para Big Bag de 1.000 a 1.500 kg: faixa de R$ 50 a 100 mil conforme estrutura, células de carga, válvulas, painel/CLP e integração. Os fabricantes trabalham sob cotação.'],
  ];
  const FONTES = [
    ['BRPESA – CG Plus', 'https://brpesa.com.br/produtos/cg-plus'],
    ['Palini & Alves – PA-BAL/BAG', 'https://palinialves.com.br/produto.php?produto=70'],
    ['Embrasack – EBBP', 'https://www.embrasack.com.br/ensacadeira-de-big-bag-plataforma/'],
    ['Toledo do Brasil – Prix Ensak (descartada: sacos de até 60 kg)', 'https://www.toledobrasil.com/produto/balanca-prix-ensak/'],
  ];
  const r = n => 'R$ ' + n.toLocaleString('pt-BR');
  const soma = k => ITENS.reduce((t, i) => t + i[k], 0);
  const n = (x, cls) => '<td class="bl-n' + (cls ? ' ' + cls : '') + '">' + x + '</td>';
  const tab = (cab, linhas, cls) => '<div class="bl-rol"><table class="bl-tab ' + (cls || '') + '"><thead><tr>' + cab.join('') + '</tr></thead><tbody>' + linhas.join('') + '</tbody></table></div>';

  const css = `
.bl-sec{margin:32px 0 8px;box-sizing:border-box;padding:24px;border:1px solid var(--line,#D8DEE6);border-radius:14px;background:var(--surface,#fff);color:var(--fg,#0B1F33)}
.bl-sec h3{margin:0 0 6px;font-size:20px;line-height:1.3}
.bl-sec h4{margin:22px 0 8px;font-size:15px}
.bl-sec .bl-sub{margin:0 0 16px;color:var(--dim,#5B6A7B);max-width:900px;line-height:1.55}
.bl-tag{display:inline-block;margin:0 6px 12px 0;padding:3px 10px;border-radius:999px;background:var(--accent-soft,#E7EDFF);color:var(--accent,#2251FF);font-size:12px;font-weight:600}
.bl-rol{overflow-x:auto}
.bl-tab{width:100%;border-collapse:collapse;font-size:13.5px}
.bl-tab th{text-align:left;padding:10px 12px;background:var(--soft,#EDF0F4);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--dim,#5B6A7B)}
.bl-tab td{padding:10px 12px;border-top:1px solid var(--line,#D8DEE6);vertical-align:top;line-height:1.5}
.bl-tab .bl-n,.bl-tab th.bl-n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.bl-tab tr.bl-tot td{border-top:2px solid var(--line,#D8DEE6);background:var(--soft,#EDF0F4);font-weight:700}
.bl-tab small{display:block;color:var(--dim,#5B6A7B);font-size:11.5px}
.bl-livre td:nth-child(2),.bl-livre td:nth-child(3){width:40%}
.bl-alerta{margin-top:16px;padding:14px 18px;border:1px dashed var(--warn,#B26A00);border-radius:12px;background:color-mix(in srgb,var(--warn,#B26A00) 10%,transparent);line-height:1.55}
.bl-alerta b{color:var(--warn,#B26A00)}
.bl-fontes{margin:12px 0 0;font-size:12.5px;color:var(--dim,#5B6A7B);line-height:1.6}
.bl-fontes a{color:var(--accent,#2251FF)}`;

  function html() {
    const tb = soma('b'), tv = soma('v'), ta = soma('a');
    return '<section class="bl-sec" id="balancas" aria-labelledby="bl-tit">' +
      '<span class="bl-tag">Automação de campo</span><span class="bl-tag">Cenários Intermediário e Topo de linha</span><span class="bl-tag">2028 · 1º semestre</span>' +
      '<h3 id="bl-tit">Balanças: pesagem embarcada e dosagem de Big Bag · ' + r(tv) + '</h3>' +
      '<p class="bl-sub">Premissa orçamentária para pesar a carga da pá carregadeira e dosar cerca de 1 tonelada por Big Bag: um sistema de pesagem embarcada e um conjunto dosador, ' + r(tv) +
      ' por conjunto. Somam ' + r(tv) + ' aos cenários Intermediário (recomendado) e Topo de linha, em compra direta de equipamentos, ainda fora dos totais e gráficos acima.</p>' +
      tab(['<th>Equipamento</th>', '<th>Referência técnica</th>', '<th class="bl-n">CAPEX unitário</th>'],
        ITENS.map(i => '<tr><td><b>' + i.item + '</b><small>' + i.id + '</small></td><td>' + i.espec + '</td>' + n(r(i.v)) + '</tr>')
          .concat(['<tr class="bl-tot"><td>Total de referência</td><td>1 unidade de cada equipamento</td>' + n(r(tv)) + '</tr>'])) +
      '<h4>Faixas para análise de sensibilidade</h4>' +
      tab(['<th>Item</th>', '<th class="bl-n">Faixa inferior</th>', '<th class="bl-n">Base adotada</th>', '<th class="bl-n">Faixa superior</th>'],
        ITENS.map(i => '<tr><td>' + i.curto + '</td>' + n(r(i.b)) + n(r(i.v)) + n(r(i.a)) + '</tr>')
          .concat(['<tr class="bl-tot"><td>Total</td>' + n(r(tb)) + n(r(tv)) + n(r(ta)) + '</tr>'])) +
      '<h4>De onde vêm as referências e os valores</h4>' +
      tab(['<th>Item</th>', '<th>Referência do sistema</th>', '<th>Origem do valor</th>'],
        REF.map(x => '<tr><td><b>' + x[0] + '</b></td><td>' + x[1] + '</td><td>' + x[2] + '</td></tr>'), 'bl-livre') +
      '<div class="bl-alerta"><b>Valores preliminares, não são cotações.</b> Não há preço público dos modelos de referência: os valores são premissas de benchmarking para planejamento de CAPEX e devem ser trocados por cotações formais. ' +
      'Na pá carregadeira, o valor final depende do modelo da máquina, da configuração hidráulica, do deslocamento, da instalação e da calibração. No dosador, validar capacidade, estrutura, células de carga, válvulas, painel/CLP, transportadores e a integração com o COE. ' +
      'Registrar no Anexo F como premissa orçamentária sujeita a cotação e validação técnica do fornecedor.</div>' +
      '<p class="bl-fontes">Fontes consultadas (data-base nov/2026): ' + FONTES.map(f => '<a href="' + f[1] + '" target="_blank" rel="noopener">' + f[0] + '</a>').join('; ') + '.</p></section>';
  }

  let estilo = false;
  /* acha o elemento cujo texto próprio (não o dos filhos) casa com o padrão */
  function porTexto(re) {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
    const n = w.nextNode(); return n ? n.parentElement : null;
  }
  function montar() {
    if (document.getElementById('balancas')) return true;
    let alvo = null, modo = 'beforebegin';
    const cam = porTexto(/^\s*O caminho do dado\s*$/i);
    if (cam && !cam.closest('#balancas')) {
      /* sobe até o ancestor comum com os três cenários e entra logo depois do bloco "O caminho do dado" */
      alvo = cam; modo = 'afterend';
      while (alvo.parentElement && alvo.parentElement !== document.body && !/Tr[eê]s cen[aá]rios de investimento|Tr[eê]s cen[aá]rios,/i.test(alvo.parentElement.textContent)) alvo = alvo.parentElement;
    } else {
      const tit = porTexto(/^\s*Tr[eê]s cen[aá]rios/i);
      if (tit) { const raiz = tit.closest('article') || tit.closest('main') || tit.closest('section') || tit.parentElement; alvo = tit; while (alvo.parentElement && alvo.parentElement !== raiz) alvo = alvo.parentElement; modo = 'afterend'; }
    }
    if (!alvo) return false;
    if (!estilo) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); estilo = true; }
    alvo.insertAdjacentHTML(modo, html());
    console.info('[balancas] inserido', modo, alvo.className || alvo.tagName);
    return true;
  }
  let fila = 0;
  const obs = new MutationObserver(() => { if (fila) return; fila = requestAnimationFrame(() => { fila = 0; if (!document.getElementById('balancas')) montar(); }); });
  function iniciar() { console.info('[balancas] script carregado'); montar(); obs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
