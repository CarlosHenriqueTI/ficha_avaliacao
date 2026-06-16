// ---- N/A toggle ----
function toggleNA(btn, targetId) {
  var target = document.getElementById(targetId);
  if(!target) return;
  var field = btn.closest('.field');
  var isNA = btn.classList.toggle('active');
  if(isNA) {
    btn.textContent = '↩ Desfazer';
    target.classList.add('scale-na');
    if(field) field.classList.add('na-active');
  } else {
    btn.textContent = '○ Não aplicável';
    target.classList.remove('scale-na');
    if(field) field.classList.remove('na-active');
  }
}

// ---- Helpers ----
function toggleRadio(el, group) {
  document.querySelectorAll('[onclick*="toggleRadio"][onclick*="\''+group+'\'"]').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
}
function toggleConditional(el, group, id, show) {
  document.querySelectorAll('[onclick*="toggleConditional"][onclick*="\''+group+'\'"]').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
  document.getElementById(id).classList.toggle('show', show);
}
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2800);
}
function scrollTo(id) {
  var el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// ===== PERSISTÊNCIA DE DADOS (loadFormData DEVE estar aqui, antes do load event) =====
function loadFormData() {
  var saved = localStorage.getItem('fisio-form-data');
  if(!saved) {
    console.log('[RESTORE] Nenhum dado salvo encontrado');
    return false;
  }
  
  console.log('[RESTORE] Iniciando restauração...');
  try {
    var formData = JSON.parse(saved);
    var horasSalvo = Math.round((Date.now() - formData.timestamp) / (1000 * 60));
    
    // Limpar elementos dinâmicos antes de restaurar
    document.getElementById('problemList').innerHTML = '';
    document.getElementById('medBody').innerHTML = '';
    document.getElementById('evolucoes').innerHTML = '';
    probCount = 0;
    evoCount = 0;
    
    // Restaurar inputs
    Object.keys(formData.inputs).forEach(function(key){
      var el = document.getElementById(key);
      if(!el) el = document.querySelector('[name="' + key + '"]');
      if(el && !el.readOnly) el.value = formData.inputs[key];
    });
    
    // Restaurar checkboxes
    Object.keys(formData.checkboxes).forEach(function(key){
      var el = document.getElementById(key);
      if(!el) el = document.querySelector('[name="' + key + '"]');
      if(el && el.type === 'checkbox') el.checked = formData.checkboxes[key];
    });
    
    // Restaurar scores
    scoreData = formData.scores || {};
    gdsResps = formData.gds || {};
    
    // Restaurar EVA
    if(formData.evaValue) {
      document.getElementById('evaVal').textContent = formData.evaValue;
      var val = parseInt(formData.evaValue);
      document.getElementById('evaDesc').textContent = evaDescs[val];
      document.getElementById('evaHandle').style.left = (val * 10) + '%';
    }
    
    // Restaurar TUG
    if(formData.tugElapsed) {
      tugElapsed = formData.tugElapsed;
      document.getElementById('tugDisplay').textContent = (tugElapsed / 1000).toFixed(1);
    }
    
    // Restaurar contadores
    probCount = formData.probCount || 0;
    evoCount = formData.evoCount || 0;
    
    // Restaurar problemas
    if(formData.problems && formData.problems.length) {
      formData.problems.forEach(function(prob){
        addProblema();
        var inputs = document.querySelectorAll('#problemList .dyn-input');
        if(inputs.length) inputs[inputs.length - 1].value = prob;
      });
    }
    
    // Restaurar medicamentos
    if(formData.meds && formData.meds.length) {
      formData.meds.forEach(function(med){
        addMed();
        var tr = document.getElementById('medBody').lastChild;
        if(tr) {
          var cells = tr.querySelectorAll('input[type="text"]');
          if(cells[0]) cells[0].value = med.med || '';
          if(cells[1]) cells[1].value = med.conc || '';
          if(cells[2]) cells[2].value = med.posol || '';
          if(cells[3]) cells[3].value = med.dur || '';
        }
      });
    }
    
    // Restaurar evoluções
    if(formData.evos && formData.evos.length) {
      formData.evos.forEach(function(evo){
        addEvolucao();
        var card = document.getElementById('evolucoes').lastChild;
        if(card) {
          var dateInput = card.querySelector('input[type="date"]');
          var textarea = card.querySelector('textarea');
          if(dateInput) dateInput.value = evo.date || '';
          if(textarea) textarea.value = evo.text || '';
          if(evo.created) card.setAttribute('data-created', evo.created);
          lockIfOld(card);
        }
      });
    }
    
    // Restaurar classes ativas
    Object.keys(formData.activeClasses).forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.add('active');
    });
    
    // Recalcular todos os scores
    setTimeout(function(){
      if(typeof calcKatz === 'function') calcKatz();
      if(typeof calcLaw === 'function') calcLaw();
      if(typeof calcSarc === 'function') calcSarc();
      if(typeof calcApgar === 'function') calcApgar();
      if(typeof calcMAN === 'function') calcMAN();
      if(typeof calcFrail === 'function') calcFrail();
      if(typeof calcMEEM === 'function') calcMEEM();
      if(typeof calcGDS === 'function') calcGDS();
      if(typeof calcVM === 'function') calcVM();
      if(typeof rebuildGDSUI === 'function') rebuildGDSUI();
      if(typeof updateProgress === 'function') updateProgress();
      console.log('[RESTORE] Restauração concluída!');
    }, 100);
    
    showToast('✓ Dados restaurados (' + horasSalvo + ' min atrás)');
    
    // Mostrar botão de restaurar
    var restoreBtn = document.getElementById('restoreBtn');
    if(restoreBtn) restoreBtn.style.display = 'inline-block';
    
    return true;
  } catch(e) {
    console.error('[RESTORE] Erro ao restaurar dados:', e.message);
    return false;
  }
}

// ---- IMC ----
function calcIMC() {
  var h = parseFloat(document.getElementById('altura').value) / 100;
  var p = parseFloat(document.getElementById('peso').value);
  if(h > 0 && p > 0) document.getElementById('imcVal').value = (p/(h*h)).toFixed(1) + ' kg/m²';
  else document.getElementById('imcVal').value = '';
}

// ---- Problemas ----
var probCount = 0;
function addProblema() {
  probCount++;
  var id = 'prob' + probCount;
  var div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px';
  div.innerHTML = '<span style="font-size:12px;font-weight:600;color:var(--text3);min-width:20px">' + probCount + '</span>' +
    '<input type="text" class="dyn-input" style="flex:1;border:0.5px solid var(--border);border-radius:var(--radius);padding:9px 11px;font-size:14px;color:var(--text);background:var(--bg2);font-family:inherit;outline:none" placeholder="Problema ' + probCount + '">' +
    '<button class="del-btn" onclick="document.getElementById(\'' + id + '\').remove()">&#x2715;</button>';
  document.getElementById('problemList').appendChild(div);
}

// ---- Medicamentos ----
function addMed() {
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" class="dyn-input" placeholder="Medicamento"></td>' +
    '<td><input type="text" class="dyn-input" placeholder="mg/ml"></td>' +
    '<td><input type="text" class="dyn-input" placeholder="Ex: 1x/dia"></td>' +
    '<td><input type="text" class="dyn-input" placeholder="Ex: 2a"></td>' +
    '<td class="del-cell"><button onclick="this.closest(\'tr\').remove()">&#x2715;</button></td>';
  document.getElementById('medBody').appendChild(tr);
}

// ---- EVA ----
var evaActive = false;
var evaDescs = ['Sem dor','Dor minima','Dor leve','Dor leve-moderada','Dor moderada-leve','Dor moderada','Dor moderada-intensa','Dor intensa','Dor muito intensa','Dor quase insuportavel','Dor maxima'];
function setEva(x) {
  var bar = document.getElementById('evaBar');
  var rect = bar.getBoundingClientRect();
  var pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
  var val = Math.round(pct * 10);
  document.getElementById('evaHandle').style.left = (pct * 100).toFixed(1) + '%';
  document.getElementById('evaVal').textContent = val;
  document.getElementById('evaDesc').textContent = evaDescs[val];
}
document.getElementById('evaBar').addEventListener('touchstart', function(e){ e.preventDefault(); setEva(e.touches[0].clientX); }, {passive:false});
document.getElementById('evaBar').addEventListener('touchmove',  function(e){ e.preventDefault(); setEva(e.touches[0].clientX); }, {passive:false});
document.getElementById('evaBar').addEventListener('mousedown',  function(e){ evaActive=true; setEva(e.clientX); });
document.addEventListener('mousemove', function(e){ if(evaActive){ e.preventDefault(); setEva(e.clientX); } });
document.addEventListener('mouseup',   function(){ evaActive=false; });

// ---- Evolucoes ----
var evoCount = 0;
function addEvolucao() {
  evoCount++;
  var id = 'evo' + evoCount;
  var today = new Date().toISOString().split('T')[0];
  var div = document.createElement('div');
  div.className = 'evolucao-card';
  div.id = id;
  div.style.marginBottom = '8px';
  div.setAttribute('data-created', Date.now());
  div.innerHTML = '<div class="evo-header"><span class="evo-date-label">📅 Data da evolução</span>' +
    '<input type="date" class="dyn-input" value="' + today + '">' +
    '<button class="del-btn" onclick="document.getElementById(\'' + id + '\').remove()">&#x2715;</button></div>' +
    '<textarea class="dyn-ta" placeholder="Escreva a evolução aqui..."></textarea>';
  document.getElementById('evolucoes').appendChild(div);
  lockIfOld(div);
}

// ---- Bloqueio 7 dias ----
function lockIfOld(card) {
  var created = parseInt(card.getAttribute('data-created'));
  if(!created) return;
  if((Date.now() - created) / (1000*60*60*24) < 7) return;
  card.classList.add('locked');
  var ta = card.querySelector('textarea');
  if(ta) { ta.readOnly = true; }
  var di = card.querySelector('input[type=date]');
  if(di) di.disabled = true;
  var db = card.querySelector('.del-btn');
  if(db) db.style.display = 'none';
  var hdr = card.querySelector('.evo-header');
  if(hdr && !hdr.querySelector('.evo-lock-badge')) {
    var b = document.createElement('span');
    b.className = 'evo-lock-badge';
    b.textContent = 'Bloqueado';
    hdr.appendChild(b);
  }
}

// ---- TUG ----
var tugRunning=false, tugStart=0, tugElapsed=0, tugInterval;
function tugToggle() {
  if(!tugRunning) {
    tugStart = Date.now() - tugElapsed;
    tugInterval = setInterval(function(){
      tugElapsed = Date.now()-tugStart;
      document.getElementById('tugDisplay').textContent = (tugElapsed/1000).toFixed(1);
    },100);
    tugRunning=true;
    document.getElementById('tugBtn').textContent='Parar';
    document.getElementById('tugBtn').style.background='#E24B4A';
  } else {
    clearInterval(tugInterval); tugRunning=false;
    document.getElementById('tugBtn').textContent='Iniciar';
    document.getElementById('tugBtn').style.background='';
    document.getElementById('tugManual').value=(tugElapsed/1000).toFixed(1);
    tugManualUpdate();
  }
}
function tugReset() {
  clearInterval(tugInterval); tugRunning=false; tugElapsed=0;
  document.getElementById('tugDisplay').textContent='0.0';
  document.getElementById('tugBtn').textContent='Iniciar';
  document.getElementById('tugBtn').style.background='';
  document.getElementById('tugManual').value='';
  document.getElementById('tugScore').textContent='---';
}
function tugManualUpdate() {
  var v=parseFloat(document.getElementById('tugManual').value);
  document.getElementById('tugDisplay').textContent=isNaN(v)?'0.0':v.toFixed(1);
  if(!isNaN(v)){
    document.getElementById('tugScore').textContent=v.toFixed(1)+'s';
    document.getElementById('tugInterp').textContent=
      v<=10?'Desempenho normal - baixo risco':v<=20?'Normal para idoso fragil':v<=29?'Risco moderado de quedas':'Alto risco de quedas';
  }
}

// ---- Velocidade da Marcha ----
function calcVM() {
  var t1=parseFloat(document.getElementById('vm1').value);
  var t2=parseFloat(document.getElementById('vm2').value);
  var t=Math.min(isNaN(t1)?Infinity:t1, isNaN(t2)?Infinity:t2);
  if(t===Infinity){document.getElementById('vmScore').textContent='--- m/s';return;}
  var v=(4/t).toFixed(2);
  document.getElementById('vmScore').textContent=v+' m/s';
  document.getElementById('vmInterp').textContent=parseFloat(v)<0.8?'Baixo desempenho (< 0,8 m/s)':'Dentro do esperado (>= 0,8 m/s)';
}

// ---- Scores genericos ----
var scoreData={};
function setScore(key,val,el,calcFn){
  scoreData[key]=val;
  el.closest('.scale-opts').querySelectorAll('.s-btn').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
  if(calcFn) calcFn();
}
function setKatz(el,val,key){setScore(key,val,el,calcKatz);}
function setLaw(el,val,key){setScore(key,val,el,calcLaw);}
function setSarc(el,val,key){setScore(key,val,el,calcSarc);}
function setApgar(el,val,key){setScore(key,val,el,calcApgar);}
function setMAN(el,val,key){setScore(key,val,el,calcMAN);}

function calcKatz(){
  var keys=['katz-banho','katz-vest','katz-banh','katz-trans','katz-cont','katz-alim'];
  var t=0,f=0; keys.forEach(function(k){if(scoreData[k]!==undefined){t+=scoreData[k];f++;}});
  if(!f){document.getElementById('katzScore').textContent='--- / 6';return;}
  document.getElementById('katzScore').textContent=t+' / 6';
  document.getElementById('katzInterp').textContent=t>=6?'Independente':t>=4?'Dependencia moderada':'Muito dependente';
}
function calcLaw(){
  var keys=['l1','l2','l3','l4','l5','l6','l7','l8','l9'];
  var t=0,f=0; keys.forEach(function(k){if(scoreData[k]!==undefined){t+=scoreData[k];f++;}});
  if(!f){document.getElementById('lawScore').textContent='--- / 27';return;}
  document.getElementById('lawScore').textContent=t+' / 27';
  document.getElementById('lawInterp').textContent=t<=9?'Total dependente':t<=15?'Dependencia grave':t<=20?'Dependencia moderada':t<=25?'Dependencia leve':'Independente';
}
function calcSarc(){
  var keys=['sf1','sf2','sf3','sf4','sf5'];
  var t=0; keys.forEach(function(k){t+=(scoreData[k]||0);});
  var cc=parseFloat(document.getElementById('sarcCC').value);
  var sexBtn=document.querySelector('[onclick*="sarcSexo"].active');
  var isMasc=sexBtn&&sexBtn.textContent.trim()==='Masc.';
  var ccPts=0; if(!isNaN(cc)){ccPts=cc<(isMasc?34:33)?10:0;}
  var tot=t+ccPts;
  document.getElementById('sarcScore').textContent=tot+' / 20';
  document.getElementById('sarcInterp').textContent=tot>=11?'Sugestivo de sarcopenia':'Sem indicativo de sarcopenia';
}
function calcApgar(){
  var keys=['ap1','ap2','ap3','ap4','ap5'];
  var t=0,f=0; keys.forEach(function(k){if(scoreData[k]!==undefined){t+=scoreData[k];f++;}});
  if(!f){document.getElementById('apgarScore').textContent='--- / 10';return;}
  document.getElementById('apgarScore').textContent=t+' / 10';
  document.getElementById('apgarInterp').textContent=t<=4?'Elevada disfuncao familiar':t<=6?'Moderada disfuncao familiar':'Boa funcionalidade familiar';
}
function calcMAN(){
  var triag=['ma1','ma2','ma3','ma4','ma5','ma6'];
  var glob=['mg1','mg2','mg3','mg4','mg5','mg6','mg7','mg8','mg9','mg10','mg11','mg12'];
  var t=0; triag.forEach(function(k){t+=(scoreData[k]||0);});
  var g=0; glob.forEach(function(k){g+=(scoreData[k]||0);});
  var hasT=triag.some(function(k){return scoreData[k]!==undefined;});
  var hasG=glob.some(function(k){return scoreData[k]!==undefined;});
  document.getElementById('manTriagemScore').textContent=(hasT?t:'---')+' / 14';
  var total=t+g;
  document.getElementById('manTotalScore').textContent=((hasT||hasG)?total.toFixed(1):'---')+' / 30';
  if(hasT||hasG) document.getElementById('manInterp').textContent=total>=24?'Estado nutricional normal':total>=17?'Sob risco de desnutricao':'Desnutrido';
}
function calcFrail(){
  var n=0; for(var i=1;i<=5;i++) if(document.getElementById('fr'+i).checked) n++;
  document.getElementById('frailScore').textContent=n+' / 5';
  document.getElementById('frailInterp').textContent=n===0?'Nao fragil':n<=2?'Pre-fragil':'Fragil';
}

// ---- MEEM ----
function setNomear(item,val){
  var hv=document.getElementById('m_'+item+'_val'); if(hv) hv.value=val;
  var b0=document.getElementById('btn_'+item+'_0');
  var b1=document.getElementById('btn_'+item+'_1');
  if(b0){b0.style.background=val===0?'var(--accent)':'var(--bg3)';b0.style.color=val===0?'#fff':'';}
  if(b1){b1.style.background=val===1?'var(--accent)':'var(--bg3)';b1.style.color=val===1?'#fff':'';}
  calcMEEM();
}
function calcMEEM(){
  var ori=0; for(var i=1;i<=10;i++){var cb=document.getElementById('m'+i);if(cb&&cb.checked)ori++;}
  var mem=parseInt(document.getElementById('meem_mem').value)||0;
  var atenc=parseInt(document.getElementById('meem_atenc').value)||0;
  var evoc=parseInt(document.getElementById('meem_evoc').value)||0;
  var ling=parseInt(document.getElementById('meem_ling').value)||0;
  var rel=parseInt((document.getElementById('m_relogio_val')||{value:'0'}).value)||0;
  var can=parseInt((document.getElementById('m_caneta_val')||{value:'0'}).value)||0;
  var rep=parseInt(document.getElementById('meem_repeticao').value)||0;
  var cmd=parseInt(document.getElementById('meem_comando3').value)||0;
  var fec=parseInt(document.getElementById('meem_fechaolhos').value)||0;
  var fra=parseInt(document.getElementById('meem_frase').value)||0;
  var des=parseInt(document.getElementById('meem_desenho').value)||0;
  var total=ori+Math.min(3,mem)+Math.min(5,atenc)+Math.min(3,evoc)+Math.min(9,ling)+rel+can+Math.min(1,rep)+Math.min(3,cmd)+Math.min(1,fec)+Math.min(1,fra)+Math.min(1,des);
  document.getElementById('meemScore').textContent=total+' / 39';
}

// ---- GDS ----
var gdsPerguntas=[
  {q:'Esta satisfeito(a) com sua vida?',simPts:0},
  {q:'Diminuiu a maior parte de suas atividades e interesses?',simPts:1},
  {q:'Sente que a vida esta vazia?',simPts:1},
  {q:'Aborrece-se com frequencia?',simPts:1},
  {q:'Sente-se de bem com a vida na maior parte do tempo?',simPts:0},
  {q:'Teme que algo ruim possa lhe acontecer?',simPts:1},
  {q:'Sente-se feliz a maior parte do tempo?',simPts:0},
  {q:'Sente-se frequentemente desamparado(a)?',simPts:1},
  {q:'Prefere ficar em casa a sair e fazer coisas novas?',simPts:1},
  {q:'Acha que tem mais problemas de memoria que a maioria?',simPts:1},
  {q:'Acha que e maravilhoso estar vivo agora?',simPts:0},
  {q:'Vale a pena viver como vive agora?',simPts:0},
  {q:'Sente-se cheio(a) de energia?',simPts:0},
  {q:'Acha que sua situacao tem solucao?',simPts:0},
  {q:'Acha que tem muita gente em situacao melhor?',simPts:1}
];
var gdsResps={};
(function buildGDS(){
  var list=document.getElementById('gdsList');
  if(!list) return;
  gdsPerguntas.forEach(function(item,idx){
    var div=document.createElement('div');
    div.className='scale-item';
    div.innerHTML='<span class="s-label" style="font-size:12px">'+(idx+1)+'. '+item.q+'</span>'+
      '<div class="scale-opts">'+
        '<div class="s-btn" style="font-size:11px" onclick="setGDS(this,'+idx+','+item.simPts+')">'+(item.simPts===1?'Sim (1)':'Sim (0)')+'</div>'+
        '<div class="s-btn" style="font-size:11px" onclick="setGDS(this,'+idx+','+(item.simPts===1?0:1)+')">'+(item.simPts===1?'Nao (0)':'Nao (1)')+'</div>'+
      '</div>';
    list.appendChild(div);
  });
})();
function setGDS(el,idx,val){
  gdsResps[idx]=val;
  el.closest('.scale-opts').querySelectorAll('.s-btn').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
  calcGDS();
}
function calcGDS(){
  var total=0; Object.values(gdsResps).forEach(function(v){total+=v;});
  document.getElementById('gdsScore').textContent=total+' / 15';
  document.getElementById('gdsInterp').textContent=total<=5?'Normal':total<=10?'Indicativo de depressao leve':'Indicativo de depressao severa';
}
function rebuildGDSUI(){
  Object.keys(gdsResps).forEach(function(idx){
    var val=gdsResps[idx];
    var items=document.querySelectorAll('#gdsList .scale-item');
    var item=items[parseInt(idx)]; if(!item) return;
    item.querySelectorAll('.s-btn').forEach(function(b){
      var m=b.textContent.match(/\(([01])\)/);
      if(m&&parseInt(m[1])===val) b.classList.add('active');
    });
  });
}

// ---- Imagem ----
function loadImage(input){
  if(input.files&&input.files[0]){
    var reader=new FileReader();
    reader.onload=function(e){
      document.getElementById('imgPreview').src=e.target.result;
      document.getElementById('imgPreviewWrap').style.display='block';
      document.getElementById('imgDropArea').style.display='none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}
function removeImage(){
  document.getElementById('imgPreview').src='';
  document.getElementById('imgPreviewWrap').style.display='none';
  document.getElementById('imgDropArea').style.display='block';
  document.getElementById('imgInput').value='';
}

// ===== PATIENT MANAGER =====
var _pmTimer=null;
























// ---- Imprimir evoluções ----
function printEvo(){
  document.body.classList.add('print-evo-only');
  window.print();
  setTimeout(function(){ document.body.classList.remove('print-evo-only'); }, 1000);
}

// ---- Nav scroll ----
window.addEventListener('scroll',function(){
  var pills=document.querySelectorAll('.sec-pill');
  var ids=[];
  pills.forEach(function(p){var m=p.getAttribute('onclick').match(/'([^']+)'/);if(m)ids.push(m[1]);});
  var cur=0;
  ids.forEach(function(id,i){var el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<120)cur=i;});
  pills.forEach(function(p,i){p.classList.toggle('active',i===cur);});
});

window.addEventListener('load',function(){
  var dv=document.getElementById('dataAval'); if(dv) dv.valueAsDate=new Date();
  
  // Tentar restaurar dados salvos, se não houver, criar padrão
  var hasSaved = localStorage.getItem('fisio-form-data');
  if(hasSaved) {
    loadFormData();
  } else {
    addMed();addMed();addMed();
    addProblema();addProblema();addProblema();
  }
});


/* ===== Enhancements: Progress · Dark mode · Autosave ===== */
(function(){
  // Theme toggle (persisted)
  var saved = localStorage.getItem('fisio-theme');
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  document.documentElement.classList.toggle('dark', (saved||'')==='dark');
  var tBtn = document.getElementById('themeToggle');
  if(tBtn){
    tBtn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      document.documentElement.classList.toggle('dark', cur==='dark');
      localStorage.setItem('fisio-theme', cur);
    });
  }

  // Progress bar
  function updateProgress(){
    var inputs = document.querySelectorAll('.card input, .card textarea, .card select');
    var filled = 0, total = 0;
    inputs.forEach(function(i){
      if(i.type==='hidden' || i.readOnly) return;
      total++;
      if(i.type==='checkbox' || i.type==='radio'){
        if(i.checked) filled++;
      } else if((i.value||'').toString().trim().length){
        filled++;
      }
    });
    var actives = document.querySelectorAll('.card .radio-btn.active, .card .tag-check.active, .card .s-btn.active, .card .r-btn.active').length;
    total += 8;
    filled += Math.min(actives, 20);
    var pct = total>0 ? Math.min(100, Math.round((filled/total)*100)) : 0;
    var el = document.getElementById('progressFill');
    if(el) el.style.width = pct + '%';
  }
  document.addEventListener('input', updateProgress);
  document.addEventListener('click', function(e){
    if(e.target.closest('.radio-btn,.tag-check,.s-btn,.r-btn,.checkbox-item')) setTimeout(updateProgress,50);
  });
  window.addEventListener('load', function(){ setTimeout(updateProgress, 300); });

  // ---- RESET / LIMPAR FICHA ----
  document.getElementById('resetBtn').addEventListener('click', function(){
    if(!confirm('Tem certeza que deseja ZERAR todas as informações da ficha? Esta ação não pode ser desfeita!')) return;
    
    // Limpar todos os inputs, textareas e selects
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="tel"], textarea, select').forEach(function(el){
      if(!el.readOnly) el.value = '';
    });
    
    // Limpar checkboxes e radio buttons
    document.querySelectorAll('input[type="checkbox"]').forEach(function(el){ el.checked = false; });
    
    // Limpar elementos dinâmicos
    document.getElementById('problemList').innerHTML = '';
    document.getElementById('medBody').innerHTML = '';
    document.getElementById('evolucoes').innerHTML = '';
    probCount = 0;
    evoCount = 0;
    
    // Remover classes ativas
    document.querySelectorAll('.radio-btn, .tag-check, .s-btn, .r-btn, .active').forEach(function(el){
      el.classList.remove('active');
    });
    
    // Limpar scores
    scoreData = {};
    document.getElementById('evaVal').textContent = '5';
    document.getElementById('evaDesc').textContent = 'Dor moderada';
    document.getElementById('evaHandle').style.left = '50%';
    document.getElementById('tugDisplay').textContent = '0.0';
    document.getElementById('tugScore').textContent = '---';
    document.getElementById('vmScore').textContent = '--- m/s';
    document.getElementById('katzScore').textContent = '--- / 6';
    document.getElementById('lawScore').textContent = '--- / 27';
    document.getElementById('sarcScore').textContent = '--- / 20';
    document.getElementById('meemScore').textContent = '--- / 39';
    document.getElementById('gdsScore').textContent = '0 / 15';
    document.getElementById('manTriagemScore').textContent = '--- / 14';
    document.getElementById('manTotalScore').textContent = '--- / 30';
    
    // Remover imagem se houver
    if(document.getElementById('imgPreviewWrap')) document.getElementById('imgPreviewWrap').style.display = 'none';
    
    // Resetar TUG
    tugElapsed = 0;
    tugRunning = false;
    
    // Resetar GDS responses
    gdsResps = {};
    var gdsList = document.getElementById('gdsList');
    if(gdsList) gdsList.innerHTML = '';
    buildGDS();
    
    // Atualizar progresso
    updateProgress();
    
    showToast('✓ Ficha zerada com sucesso!');
  });

  // ===== PERSISTÊNCIA DE DADOS =====
  function saveFormData() {
    var formData = {
      timestamp: Date.now(),
      inputs: {},
      checkboxes: {},
      selects: {},
      radios: {},
      scores: scoreData,
      gds: gdsResps,
      evaValue: document.getElementById('evaVal').textContent,
      tugElapsed: tugElapsed,
      probCount: probCount,
      evoCount: evoCount,
      problems: [],
      meds: [],
      evos: []
    };
    
    // Salvar inputs, textareas, selects
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="tel"], textarea, select').forEach(function(el){
      if(!el.readOnly) {
        if(el.id) formData.inputs[el.id] = el.value;
        else if(el.name) formData.inputs[el.name] = el.value;
      }
    });
    
    // Salvar checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(function(el){
      if(el.id) formData.checkboxes[el.id] = el.checked;
      else if(el.name) formData.checkboxes[el.name] = el.checked;
    });
    
    // Salvar elementos dinâmicos (Problemas)
    document.querySelectorAll('#problemList > div').forEach(function(div){
      var input = div.querySelector('.dyn-input');
      if(input) formData.problems.push(input.value);
    });
    
    // Salvar medicamentos
    document.querySelectorAll('#medBody tr').forEach(function(tr){
      var cells = tr.querySelectorAll('input[type="text"]');
      if(cells.length >= 4) {
        formData.meds.push({
          med: cells[0].value,
          conc: cells[1].value,
          posol: cells[2].value,
          dur: cells[3].value
        });
      }
    });
    
    // Salvar evoluções
    document.querySelectorAll('#evolucoes > .evolucao-card').forEach(function(card){
      var dateInput = card.querySelector('input[type="date"]');
      var textarea = card.querySelector('textarea');
      if(dateInput && textarea) {
        formData.evos.push({
          date: dateInput.value,
          text: textarea.value,
          created: card.getAttribute('data-created')
        });
      }
    });
    
    // Salvar classes ativas
    formData.activeClasses = {};
    document.querySelectorAll('.radio-btn.active, .tag-check.active, .s-btn.active, .r-btn.active').forEach(function(el){
      var parent = el.closest('[onclick]');
      if(el.id) formData.activeClasses[el.id] = true;
    });
    
    localStorage.setItem('fisio-form-data', JSON.stringify(formData));
    return formData;
  }
  
  function loadFormData() {
    var saved = localStorage.getItem('fisio-form-data');
    if(!saved) {
      console.log('[RESTORE] Nenhum dado salvo encontrado');
      return false;
    }
    
    console.log('[RESTORE] Iniciando restauração...');
    try {
      var formData = JSON.parse(saved);
      var horasSalvo = Math.round((Date.now() - formData.timestamp) / (1000 * 60));
      
      // Limpar elementos dinâmicos antes de restaurar
      document.getElementById('problemList').innerHTML = '';
      document.getElementById('medBody').innerHTML = '';
      document.getElementById('evolucoes').innerHTML = '';
      probCount = 0;
      evoCount = 0;
      
      // Restaurar inputs
      Object.keys(formData.inputs).forEach(function(key){
        var el = document.getElementById(key);
        if(!el) el = document.querySelector('[name="' + key + '"]');
        if(el && !el.readOnly) el.value = formData.inputs[key];
      });
      
      // Restaurar checkboxes
      Object.keys(formData.checkboxes).forEach(function(key){
        var el = document.getElementById(key);
        if(!el) el = document.querySelector('[name="' + key + '"]');
        if(el && el.type === 'checkbox') el.checked = formData.checkboxes[key];
      });
      
      // Restaurar scores
      scoreData = formData.scores || {};
      gdsResps = formData.gds || {};
      
      // Restaurar EVA
      if(formData.evaValue) {
        document.getElementById('evaVal').textContent = formData.evaValue;
        var val = parseInt(formData.evaValue);
        document.getElementById('evaDesc').textContent = evaDescs[val];
        document.getElementById('evaHandle').style.left = (val * 10) + '%';
      }
      
      // Restaurar TUG
      if(formData.tugElapsed) {
        tugElapsed = formData.tugElapsed;
        document.getElementById('tugDisplay').textContent = (tugElapsed / 1000).toFixed(1);
      }
      
      // Restaurar contadores
      probCount = formData.probCount || 0;
      evoCount = formData.evoCount || 0;
      
      // Restaurar problemas
      if(formData.problems && formData.problems.length) {
        formData.problems.forEach(function(prob){
          addProblema();
          var inputs = document.querySelectorAll('#problemList .dyn-input');
          if(inputs.length) inputs[inputs.length - 1].value = prob;
        });
      }
      
      // Restaurar medicamentos
      if(formData.meds && formData.meds.length) {
        formData.meds.forEach(function(med){
          addMed();
          var tr = document.getElementById('medBody').lastChild;
          if(tr) {
            var cells = tr.querySelectorAll('input[type="text"]');
            if(cells[0]) cells[0].value = med.med || '';
            if(cells[1]) cells[1].value = med.conc || '';
            if(cells[2]) cells[2].value = med.posol || '';
            if(cells[3]) cells[3].value = med.dur || '';
          }
        });
      }
      
      // Restaurar evoluções
      if(formData.evos && formData.evos.length) {
        formData.evos.forEach(function(evo){
          addEvolucao();
          var card = document.getElementById('evolucoes').lastChild;
          if(card) {
            var dateInput = card.querySelector('input[type="date"]');
            var textarea = card.querySelector('textarea');
            if(dateInput) dateInput.value = evo.date || '';
            if(textarea) textarea.value = evo.text || '';
            if(evo.created) card.setAttribute('data-created', evo.created);
            lockIfOld(card);
          }
        });
      }
      
      // Restaurar classes ativas
      Object.keys(formData.activeClasses).forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.classList.add('active');
      });
      
      // Recalcular todos os scores
      setTimeout(function(){
        if(typeof calcKatz === 'function') calcKatz();
        if(typeof calcLaw === 'function') calcLaw();
        if(typeof calcSarc === 'function') calcSarc();
        if(typeof calcApgar === 'function') calcApgar();
        if(typeof calcMAN === 'function') calcMAN();
        if(typeof calcFrail === 'function') calcFrail();
        if(typeof calcMEEM === 'function') calcMEEM();
        if(typeof calcGDS === 'function') calcGDS();
        if(typeof calcVM === 'function') calcVM();
        if(typeof rebuildGDSUI === 'function') rebuildGDSUI();
        if(typeof updateProgress === 'function') updateProgress();
        console.log('[RESTORE] Restauração concluída!');
      }, 100);
      
      showToast('✓ Dados restaurados (' + horasSalvo + ' min atrás)');
      
      // Mostrar botão de restaurar
      var restoreBtn = document.getElementById('restoreBtn');
      if(restoreBtn && restoreBtn.style.display === 'none') {
        restoreBtn.style.display = 'inline-block';
      }
      
      return true;
    } catch(e) {
      console.error('[RESTORE] Erro ao restaurar dados:', e.message, e.stack);
      return false;
    }
  }
  
  function clearSavedData() {
    localStorage.removeItem('fisio-form-data');
    var restoreBtn = document.getElementById('restoreBtn');
    if(restoreBtn) restoreBtn.style.display = 'none';
    showToast('✓ Dados salvos limpos');
  }
  
  // Botão de salvar
  var saveBtn = document.getElementById('saveBtn');
  if(saveBtn) {
    saveBtn.addEventListener('click', function(){
      saveFormData();
      showToast('💾 Dados salvos com sucesso!');
      
      // Mostrar botão de restaurar
      var restoreBtn = document.getElementById('restoreBtn');
      if(restoreBtn) restoreBtn.style.display = 'inline-block';
    });
  }
  
  // Botão de restaurar
  var restoreBtn = document.getElementById('restoreBtn');
  if(restoreBtn) {
    restoreBtn.addEventListener('click', function(){
      if(confirm('Deseja RESTAURAR os dados salvos? Os dados atuais serão sobrescritos.')) {
        loadFormData();
      }
    });
  }
  
  
  // Mostrar botão de restaurar se houver dados salvos
  if(localStorage.getItem('fisio-form-data')) {
    var restoreBtn = document.getElementById('restoreBtn');
    if(restoreBtn) restoreBtn.style.display = 'inline-block';
  }
  
  // Autosave indicator (simple)
  var badge = document.getElementById('saveBadge');
  var badgeText = document.getElementById('saveBadgeText');
  var saveT;
  function flashSaved(){
    if(!badge) return;
    var now = new Date();
    var hh = String(now.getHours()).padStart(2,'0');
    var mm = String(now.getMinutes()).padStart(2,'0');
    if(badgeText) badgeText.textContent = 'Salvo às ' + hh + ':' + mm;
    badge.classList.add('show');
    clearTimeout(saveT);
    saveT = setTimeout(function(){ badge.classList.remove('show'); }, 2200);
  }
  var debT;
  document.addEventListener('input', function(){
    clearTimeout(debT);
    debT = setTimeout(flashSaved, 800);
  });
})();
