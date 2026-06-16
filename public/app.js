/* ============================================================
   Avaliação Fisioterapêutica — App Logic
   ============================================================ */

// ---- TOGGLE HELPERS ----
function toggleRadio(el, group) {
  document.querySelectorAll('[onclick*="toggleRadio"][onclick*="\''+group+'\'"]').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function toggleConditional(el, group, id, show) {
  document.querySelectorAll('[onclick*="toggleConditional"][onclick*="\''+group+'\'"]').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(id).classList.toggle('show', show);
}

// ---- IMC AUTO-CALC ----
document.addEventListener('input', function(e) {
  if(e.target.placeholder === 'cm' || e.target.placeholder === 'kg') {
    var h = parseFloat(document.querySelector('input[placeholder="cm"]').value)/100;
    var w = parseFloat(document.querySelector('input[placeholder="kg"]').value);
    if(h > 0 && w > 0) document.getElementById('imc').value = (w/(h*h)).toFixed(1);
  }
});

// ---- EVA ----
var evaActive = false;
var evaDescs = ['Sem dor','Dor mínima','Dor leve','Dor leve-moderada','Dor moderada-leve','Dor moderada','Dor moderada-intensa','Dor intensa','Dor muito intensa','Dor quase insuportável','Dor máxima'];
function setEva(x) {
  var bar = document.getElementById('evaBar');
  var rect = bar.getBoundingClientRect();
  var pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
  var val = Math.round(pct * 10);
  document.getElementById('evaHandle').style.left = (pct*100).toFixed(1)+'%';
  document.getElementById('evaVal').textContent = val;
  document.getElementById('evaDesc').textContent = evaDescs[val];
}
document.getElementById('evaBar').addEventListener('touchstart', function(e){ e.preventDefault(); setEva(e.touches[0].clientX); }, {passive:false});
document.getElementById('evaBar').addEventListener('touchmove', function(e){ e.preventDefault(); setEva(e.touches[0].clientX); }, {passive:false});
document.getElementById('evaBar').addEventListener('mousedown', function(e){ evaActive=true; setEva(e.clientX); });
document.addEventListener('mousemove', function(e){ if(evaActive) setEva(e.clientX); });
document.addEventListener('mouseup', function(){ evaActive=false; });

// ---- LISTA DE PROBLEMAS ----
var probCount = 0;
function addProblema() {
  probCount++;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px';
  div.innerHTML = '<span style="font-family:var(--font-display);font-style:italic;font-size:14px;color:var(--accent);min-width:24px;text-align:center">'+probCount+'</span><input type="text" placeholder="Descreva o problema" class="bare"><button class="del-btn" onclick="this.parentElement.remove()" style="flex-shrink:0">✕</button>';
  document.getElementById('problemas-list').appendChild(div);
  div.querySelector('input').focus();
}
for(var i=0;i<5;i++) addProblema();

// ---- MEDICAMENTOS ----
function addMed() {
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" placeholder="Medicamento"></td><td><input type="text" placeholder="Dose"></td><td><input type="text" placeholder="Posologia"></td><td><input type="text" placeholder="Tempo"></td>';
  document.getElementById('medBody').appendChild(tr);
}

// ---- EVOLUÇÕES ----
var evoCount = 0;
function addEvolucao() {
  evoCount++;
  var id = 'evo'+evoCount;
  var today = new Date().toISOString().split('T')[0];
  var div = document.createElement('div');
  div.className = 'evolucao-card'; div.id = id;
  div.innerHTML = '<div class="evo-header"><span class="evo-date-label">Data</span><input type="date" value="'+today+'"><button class="del-btn" onclick="document.getElementById(\''+id+'\').remove()" title="Remover">✕</button></div><textarea placeholder="Evolução clínica, conduta aplicada, resultados e intercorrências..."></textarea>';
  document.getElementById('evolucoes').appendChild(div);
  div.querySelector('textarea').focus();
}

// ---- FRAIL ----
function calcFrail() {
  var s = ['fr1','fr2','fr3','fr4','fr5'].filter(function(id){ return document.getElementById(id).checked; }).length;
  document.getElementById('frailScore').value = s+'/5 — '+(s===0?'Não frágil':s<=2?'Pré-frágil':'Frágil');
}

// ---- KATZ ----
var katzData = ['Banhar-se','Vestir-se','Ir ao banheiro','Transferência','Continência','Alimentação'];
(function(){
  var c = document.getElementById('katzItems');
  katzData.forEach(function(n){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+n+'</div><div class="q-opts"><div class="q-opt" onclick="qSel(this,\'katz\')">Independente (1)</div><div class="q-opt" onclick="qSel(this,\'katz\')">Dependente (0)</div></div>';
    c.appendChild(d);
  });
})();
function qSel(el, group) {
  el.parentElement.querySelectorAll('.q-opt').forEach(function(o){ o.classList.remove('active'); });
  el.classList.add('active');
  if(group==='katz') {
    var pts = 0;
    document.querySelectorAll('#katzItems .q-item').forEach(function(item){
      var a = item.querySelector('.q-opt.active');
      if(a && a.textContent.includes('1')) pts++;
    });
    document.getElementById('katzScore').value = pts+'/6';
  } else if(group==='pfeffer') { calcPfeffer(); }
  else if(group==='lawton') { calcLawton(); }
  else if(group==='sarc') { calcSarc(); }
  else if(group==='gds') { calcGds(); }
  else if(group==='apgar') { calcApgar(); }
  else if(group==='meem') { calcMeem(); }
}

// ---- PFEFFER ----
var pfefferQs = [
  'Cuidar do próprio dinheiro?','Fazer compras sozinho(a)?','Esquentar água e apagar o fogo?',
  'Preparar comida?','Manter-se a par dos acontecimentos da vizinhança?',
  'Prestar atenção, entender e discutir TV/rádio/jornal?','Lembrar de compromissos familiares?',
  'Cuidar dos próprios medicamentos?','Andar pela vizinhança e achar o caminho de volta?',
  'Cumprimentar amigos adequadamente?','Ficar sozinho(a) em casa sem problemas?'
];
(function(){
  var c = document.getElementById('pfefferItems');
  pfefferQs.forEach(function(q,i){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+(i+1)+'. '+q+'</div><div class="q-opts"><div class="q-opt" data-val="0" onclick="qSel(this,\'pfeffer\')">Capaz (0)</div><div class="q-opt" data-val="1" onclick="qSel(this,\'pfeffer\')">Dific. (1)</div><div class="q-opt" data-val="2" onclick="qSel(this,\'pfeffer\')">Ajuda (2)</div><div class="q-opt" data-val="3" onclick="qSel(this,\'pfeffer\')">Incapaz (3)</div></div>';
    c.appendChild(d);
  });
})();
function calcPfeffer() {
  var pts = 0;
  document.querySelectorAll('#pfefferItems .q-opt.active').forEach(function(a){ pts += parseInt(a.dataset.val||0); });
  document.getElementById('pfefferScore').value = pts+'/33';
}

// ---- LAWTON ----
var lawtonQs = [
  'Usar o telefone?','Ir a locais distantes de transporte?','Fazer compras?',
  'Preparar as próprias refeições?','Arrumar a casa?','Fazer trabalhos manuais domésticos?',
  'Lavar e passar roupa?','Tomar remédios corretamente?','Cuidar das finanças?'
];
(function(){
  var c = document.getElementById('lawtonItems');
  lawtonQs.forEach(function(q,i){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+(i+1)+'. '+q+'</div><div class="q-opts"><div class="q-opt" data-val="3" onclick="qSel(this,\'lawton\')">Sem ajuda (3)</div><div class="q-opt" data-val="2" onclick="qSel(this,\'lawton\')">Parcial (2)</div><div class="q-opt" data-val="1" onclick="qSel(this,\'lawton\')">Não (1)</div></div>';
    c.appendChild(d);
  });
})();
function calcLawton() {
  var pts = 0;
  document.querySelectorAll('#lawtonItems .q-opt.active').forEach(function(a){ pts += parseInt(a.dataset.val||0); });
  document.getElementById('lawtonScore').value = pts+'/27';
}

// ---- TUG ----
function calcTug() {
  var t = parseFloat(document.getElementById('tugTime').value);
  var r = document.getElementById('tugResult');
  if(!t){ r.innerHTML=''; return; }
  var msg = t<=10?'Baixo risco de quedas':t<=20?'Independente (baixo risco)':t<=29?'Risco moderado de quedas':'Alto risco de quedas';
  r.innerHTML = '<div class="score-box"><p>'+t+'s — '+msg+'</p></div>';
}

// ---- SARC-F ----
var sarcQs = [
  {q:'Dificuldade para levantar e carregar 5 kg?', opts:['Nenhuma (0)','Alguma (1)','Muita/não consigo (2)']},
  {q:'Dificuldade para atravessar um cômodo?', opts:['Nenhuma (0)','Alguma (1)','Muita/não consigo (2)']},
  {q:'Dificuldade para levantar da cama/cadeira?', opts:['Nenhuma (0)','Alguma (1)','Muita/não consigo (2)']},
  {q:'Dificuldade para subir um lance de escadas (10 degraus)?', opts:['Nenhuma (0)','Alguma (1)','Muita/não consigo (2)']},
  {q:'Quantas vezes caiu no último ano?', opts:['Nenhuma (0)','1 a 3 (1)','4 ou mais (2)']}
];
(function(){
  var c = document.getElementById('sarcfItems');
  sarcQs.forEach(function(item,i){
    var d = document.createElement('div'); d.className = 'q-item';
    var opts = item.opts.map(function(o,j){ return '<div class="q-opt" data-val="'+j+'" onclick="qSel(this,\'sarc\')">'+o+'</div>'; }).join('');
    d.innerHTML = '<div class="q-text">'+(i+1)+'. '+item.q+'</div><div class="q-opts">'+opts+'</div>';
    c.appendChild(d);
  });
})();
function calcSarc() {
  var pts = 0;
  document.querySelectorAll('#sarcfItems .q-opt.active').forEach(function(a){ pts += parseInt(a.dataset.val||0); });
  var cc = parseFloat(document.getElementById('sarcCC').value||0);
  var isFem = document.querySelector('[onclick*="toggleRadio"][onclick*="\'sarcSexo\'"].active');
  var ccPts = 0;
  if(cc > 0) {
    var sfem = isFem && isFem.textContent.includes('Fem');
    ccPts = (sfem ? cc < 33 : cc < 34) ? 10 : 0;
  }
  var total = pts + ccPts;
  document.getElementById('sarcScore').value = total+'/20'+(total>=11?' — Sarcopenia':'');
}

// ---- MEEM ----
var meemSecs = [
  {title:'Orientação temporal e espacial', max:10, id:'meemOri'},
  {title:'Memória imediata', max:3, id:'meemMem'},
  {title:'Atenção e cálculo', max:5, id:'meemAtc'},
  {title:'Evocação', max:3, id:'meemEvo'},
  {title:'Linguagem', max:9, id:'meemLing'}
];
(function(){
  var c = document.getElementById('meemSections');
  meemSecs.forEach(function(s){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+s.title+' <span style="color:var(--text-3);font-size:12px">(0–'+s.max+')</span></div><div style="display:flex;align-items:center;gap:10px"><input type="number" min="0" max="'+s.max+'" placeholder="0" id="'+s.id+'" oninput="calcMeem()" style="width:80px;border:1px solid var(--hairline);border-radius:8px;padding:8px 12px;font:inherit;font-size:14px;color:var(--text);background:var(--surface-2);outline:none;font-variant-numeric:tabular-nums"><span style="font-size:13px;color:var(--text-3)">/ '+s.max+'</span></div>';
    c.appendChild(d);
  });
})();
function calcMeem() {
  var pts = meemSecs.reduce(function(s,sec){ return s + (parseInt(document.getElementById(sec.id).value)||0); }, 0);
  document.getElementById('meemScore').value = pts+'/30';
}

// ---- GDS ----
var gdsQs = [
  {q:'Está satisfeito(a) com sua vida?', sim:0, nao:1},
  {q:'Diminuiu a maior parte de suas atividades e interesses?', sim:1, nao:0},
  {q:'Sente que a vida está vazia?', sim:1, nao:0},
  {q:'Aborrece-se com frequência?', sim:1, nao:0},
  {q:'Sente-se de bem com a vida na maior parte do tempo?', sim:0, nao:1},
  {q:'Teme que algo ruim possa lhe acontecer?', sim:1, nao:0},
  {q:'Sente-se feliz a maior parte do tempo?', sim:0, nao:1},
  {q:'Sente-se frequentemente desamparado(a)?', sim:1, nao:0},
  {q:'Prefere ficar em casa a sair e fazer coisas novas?', sim:1, nao:0},
  {q:'Acha que tem mais problemas de memória que a maioria?', sim:1, nao:0},
  {q:'Acha que é maravilhoso estar vivo(a) agora?', sim:0, nao:1},
  {q:'Vale a pena viver como vive agora?', sim:0, nao:1},
  {q:'Sente-se cheio(a) de energia?', sim:0, nao:1},
  {q:'Acha que sua situação tem solução?', sim:0, nao:1},
  {q:'Acha que tem muita gente em situação melhor?', sim:1, nao:0}
];
(function(){
  var c = document.getElementById('gdsItems');
  gdsQs.forEach(function(item,i){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+(i+1)+'. '+item.q+'</div><div class="q-opts"><div class="q-opt" data-val="'+item.sim+'" onclick="qSel(this,\'gds\')">Sim ('+item.sim+')</div><div class="q-opt" data-val="'+item.nao+'" onclick="qSel(this,\'gds\')">Não ('+item.nao+')</div></div>';
    c.appendChild(d);
  });
})();
function calcGds() {
  var pts = 0;
  document.querySelectorAll('#gdsItems .q-opt.active').forEach(function(a){ pts += parseInt(a.dataset.val||0); });
  var cls = pts<=5?'Normal':pts<=10?'Depressão leve':'Depressão severa';
  document.getElementById('gdsScore').value = pts+'/15 — '+cls;
}

// ---- APGAR FAMÍLIA ----
var apgarQs = [
  'Posso recorrer à minha família quando algo me incomoda ou preocupa?',
  'Estou satisfeito(a) com a maneira como conversamos e compartilhamos problemas?',
  'Minha família aceita e apoia meus desejos de buscar novas atividades?',
  'Minha família demonstra afeição e reage às minhas emoções?',
  'Compartilhamos bem o tempo juntos?'
];
(function(){
  var c = document.getElementById('apgarItems');
  apgarQs.forEach(function(q,i){
    var d = document.createElement('div'); d.className = 'q-item';
    d.innerHTML = '<div class="q-text">'+(i+1)+'. '+q+'</div><div class="q-opts"><div class="q-opt" data-val="2" onclick="qSel(this,\'apgar\')">Sempre (2)</div><div class="q-opt" data-val="1" onclick="qSel(this,\'apgar\')">Às vezes (1)</div><div class="q-opt" data-val="0" onclick="qSel(this,\'apgar\')">Nunca (0)</div></div>';
    c.appendChild(d);
  });
})();
function calcApgar() {
  var pts = 0;
  document.querySelectorAll('#apgarItems .q-opt.active').forEach(function(a){ pts += parseInt(a.dataset.val||0); });
  var cls = pts<=4?'Elevada disfunção':pts<=6?'Moderada disfunção':'Boa funcionalidade';
  document.getElementById('apgarScore').value = pts+'/10 — '+cls;
}

// ---- SALVAR ----
function salvar() {
  try {
    var data = {};
    document.querySelectorAll('input,textarea,select').forEach(function(el,i){ data['f'+i] = el.value; });
    localStorage.setItem('fisioAvalGeri', JSON.stringify(data));
    showToast('✓ Avaliação salva com sucesso');
    updateSavedAt(new Date());
  } catch(e) { showToast('⚠ Não foi possível salvar'); }
}
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

// ---- AUTOSAVE (debounced) ----
var autosaveT;
document.addEventListener('input', function(){
  clearTimeout(autosaveT);
  autosaveT = setTimeout(function(){
    try {
      var data = {};
      document.querySelectorAll('input,textarea,select').forEach(function(el,i){ data['f'+i] = el.value; });
      localStorage.setItem('fisioAvalGeri', JSON.stringify(data));
      updateSavedAt(new Date());
      updateProgress();
    } catch(e) {}
  }, 800);
});

function updateSavedAt(d) {
  var s = document.getElementById('savedAt');
  if(!s) return;
  var hh = String(d.getHours()).padStart(2,'0');
  var mm = String(d.getMinutes()).padStart(2,'0');
  s.innerHTML = '<span class="dot"></span>Salvo às ' + hh + ':' + mm;
}

// ---- PROGRESS ----
function updateProgress(){
  var els = document.querySelectorAll('.card input, .card textarea, .card select');
  var filled = 0, total = 0;
  els.forEach(function(el){
    if(el.type === 'button' || el.readOnly) return;
    total++;
    if((el.type === 'checkbox' && el.checked) || (el.type !== 'checkbox' && el.value && el.value.trim() !== '')) filled++;
  });
  // also count active radio pills as groups
  var pct = total ? Math.round((filled/total)*100) : 0;
  var f = document.getElementById('progressFill');
  if(f) f.style.width = pct + '%';
}

// ---- THEME TOGGLE ----
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next;
  if(cur === 'dark') next = 'light';
  else if(cur === 'light') next = 'dark';
  else {
    // initial: flip relative to system
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    next = sysDark ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('fisioAvalTheme', next); } catch(e) {}
}
(function initTheme(){
  try {
    var t = localStorage.getItem('fisioAvalTheme');
    if(t) document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();

// ---- SCROLL SPY ----
window.addEventListener('load', function(){
  var sections = document.querySelectorAll('.card[id]');
  var links = document.querySelectorAll('.toc a');
  if(!sections.length || !links.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        links.forEach(function(l){ l.classList.toggle('active', l.getAttribute('href') === '#'+e.target.id); });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(function(s){ io.observe(s); });
});

// ---- IN-VIEW FADE ----
window.addEventListener('load', function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  document.querySelectorAll('.card').forEach(function(c){ io.observe(c); });
});

// ---- LOAD SAVED ----
window.addEventListener('load', function() {
  try {
    var saved = localStorage.getItem('fisioAvalGeri');
    if(saved) {
      var data = JSON.parse(saved);
      document.querySelectorAll('input,textarea,select').forEach(function(el,i){ if(data['f'+i]!==undefined) el.value=data['f'+i]; });
    }
  } catch(e) {}
  // default date
  var d = document.getElementById('dataAval');
  if(d && !d.value) d.value = new Date().toISOString().split('T')[0];
  updateProgress();
});
