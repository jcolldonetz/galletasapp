// ===================== DATA LAYER =====================
var STORAGE_KEY = 'galletasapp_v1';

var VARS = [
  { id:'chips', label:'Chips', dotClass:'dot-chips', tagClass:'vtag-chips', color:'#c97d2e' },
  { id:'oreo',  label:'Oreo',  dotClass:'dot-oreo',  tagClass:'vtag-oreo',  color:'#3a3835' },
  { id:'limon', label:'Limón', dotClass:'dot-limon', tagClass:'vtag-limon', color:'#639922' }
];

var PRES = [
  { qty:1,  label:'Unidad', precio:1600 },
  { qty:6,  label:'Cajita', precio:8000 },
  { qty:12, label:'Docena', precio:15000 }
];

var DEFAULT_INGS = [
  { nombre:'Harina leudante',   cant15:200, unidad:'g',  costoPaq:1190, cantPaq:1000, variedad:'todas' },
  { nombre:'Azúcar',            cant15:140, unidad:'g',  costoPaq:1370, cantPaq:1000, variedad:'todas' },
  { nombre:'Huevos',            cant15:2,   unidad:'u',  costoPaq:2450, cantPaq:12,   variedad:'todas' },
  { nombre:'Manteca',           cant15:125, unidad:'g',  costoPaq:3650, cantPaq:200,  variedad:'todas' },
  { nombre:'Esencia vainilla',  cant15:5,   unidad:'ml', costoPaq:1770, cantPaq:100,  variedad:'todas' },
  { nombre:'Chips de choc.',    cant15:1,   unidad:'u',  costoPaq:2500, cantPaq:1,    variedad:'chips' },
  { nombre:'Galletitas Oreo',   cant15:2,   unidad:'u',  costoPaq:1800, cantPaq:14,   variedad:'oreo'  },
  { nombre:'Ralladura limón',   cant15:3,   unidad:'g',  costoPaq:500,  cantPaq:50,   variedad:'limon' },
  { nombre:'Mano de obra',      cant15:1,   unidad:'u',  costoPaq:3500, cantPaq:1,    variedad:'todas' }
];

var state = { ingredientes: [], pedidos: [], historial: [], precios: [1600, 8000, 15000], pedidoIdx: 1, histIdx: 1 };
var filtroHist = 'todos';
var mixValues = { chips: 0, oreo: 0, limon: 0 };

// ===================== PERSISTENCE =====================
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      state = Object.assign({ ingredientes:[], pedidos:[], historial:[], precios:[1600,8000,15000], pedidoIdx:1, histIdx:1 }, parsed);
      PRES.forEach(function(p,i){ p.precio = state.precios[i] || p.precio; });
    } else {
      state.ingredientes = DEFAULT_INGS.map(function(i){ return Object.assign({},i); });
      saveState();
    }
  } catch(e) {
    state.ingredientes = DEFAULT_INGS.map(function(i){ return Object.assign({},i); });
  }
}

// ===================== UTILS =====================
function fmt(n) { return '$' + Math.round(n).toLocaleString('es-AR'); }
function today() { var d = new Date(); return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
function todayISO() { var d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function costoXGalleta(ing) { return (ing.costoPaq / ing.cantPaq) * (ing.cant15 / 15); }
function costoVariedad(vid) {
  return state.ingredientes
    .filter(function(i){ return i.variedad === 'todas' || i.variedad === vid; })
    .reduce(function(s,i){ return s + costoXGalleta(i); }, 0);
}
function toggleForm(id) { var el = document.getElementById(id); el.style.display = el.style.display === 'none' ? 'block' : 'none'; }
function showToast(msg) {
  var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2500);
}

// ===================== SCREEN =====================
function toggleMenu() {
  document.getElementById('side-menu').classList.toggle('active');
  document.getElementById('menu-overlay').classList.toggle('active');
}

function showScreen(name, btn) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.nav button, .side-menu button').forEach(function(b){ b.classList.remove('active'); });
  
  document.getElementById('screen-' + name).classList.add('active');
  
  // Activa el botón tanto en el nav como en el menú lateral
  if (btn) {
    btn.classList.add('active');
    var navBtn = document.getElementById('nav-' + name);
    if (navBtn) navBtn.classList.add('active');
  }
  
  if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
  renderAll();
}

// ===================== COSTOS =====================
function addIngrediente() {
  var n = document.getElementById('ing-nombre').value.trim();
  var v = document.getElementById('ing-var').value;
  var c15 = parseFloat(document.getElementById('ing-cant15').value);
  var u = document.getElementById('ing-unidad').value;
  var cp = parseFloat(document.getElementById('ing-cpaq').value);
  var pp = parseFloat(document.getElementById('ing-ppaq').value);
  if (!n || isNaN(c15) || isNaN(cp) || isNaN(pp)) { showToast('Completá todos los campos'); return; }
  state.ingredientes.push({ nombre:n, cant15:c15, unidad:u, costoPaq:cp, cantPaq:pp, variedad:v });
  saveState();
  ['ing-nombre','ing-cant15','ing-cpaq','ing-ppaq'].forEach(function(id){ document.getElementById(id).value=''; });
  toggleForm('form-ing');
  renderAll();
  showToast('Ingrediente agregado');
}

function delIngrediente(idx) {
  if (!confirm('¿Eliminar "' + state.ingredientes[idx].nombre + '"?')) return;
  state.ingredientes.splice(idx, 1);
  saveState(); renderAll();
}

function renderCostos() {
  var html = '';
  VARS.forEach(function(v) {
    var ings = state.ingredientes.filter(function(i){ return i.variedad === 'todas' || i.variedad === v.id; });
    var total = costoVariedad(v.id);
    html += '<div class="card">';
    html += '<div class="card-title" style="display:flex;align-items:center;gap:7px"><div class="dot ' + v.dotClass + '"></div>' + v.label + ' — costo x galleta: <span style="color:var(--amber);font-weight:700">' + fmt(total) + '</span></div>';
    html += '<table><thead><tr><th style="width:40%">Ingrediente</th><th style="width:20%">x15</th><th style="width:28%">x galleta</th><th style="width:12%"></th></tr></thead><tbody>';
    ings.forEach(function(ing) {
      var ri = state.ingredientes.indexOf(ing);
      html += '<tr><td>' + ing.nombre + '</td><td>' + ing.cant15 + ' ' + ing.unidad + '</td><td>' + fmt(costoXGalleta(ing)) + '</td>';
      html += '<td><button onclick="delIngrediente(' + ri + ')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px">✕</button></td></tr>';
    });
    html += '<tr class="tr-total"><td colspan="2">Total ' + v.label + '</td><td>' + fmt(total) + '</td><td></td></tr>';
    html += '</tbody></table></div>';
  });
  document.getElementById('costos-variedades').innerHTML = html;
}

// ===================== PRECIOS =====================
function renderPreciosForm() {
  document.getElementById('precios-form').innerHTML = PRES.map(function(p, i) {
    return '<div class="form-row" style="margin-bottom:8px;align-items:center">' +
      '<div style="font-size:14px;font-weight:600">' + p.label + ' (' + p.qty + ')</div>' +
      '<div><input type="number" id="pr-' + i + '" value="' + p.precio + '" min="0"></div></div>';
  }).join('');

  var html = '';
  PRES.forEach(function(p) {
    html += '<div style="margin-bottom:12px"><div style="font-size:14px;font-weight:700;margin-bottom:6px">' + p.label + ' (' + p.qty + ') — ' + fmt(p.precio) + '</div>';
    VARS.forEach(function(v) {
      var costo = costoVariedad(v.id) * p.qty;
      var gan = p.precio - costo;
      var mar = Math.round(gan / p.precio * 100);
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;border-bottom:0.5px solid var(--border)">';
      html += '<span style="display:flex;align-items:center;gap:6px"><div class="dot ' + v.dotClass + '" style="width:8px;height:8px"></div>' + v.label + '</span>';
      html += '<span style="color:var(--green);font-weight:600">+' + fmt(gan) + ' <span class="badge badge-green">' + mar + '%</span></span></div>';
    });
    html += '</div><div class="sep"></div>';
  });
  document.getElementById('rentabilidad').innerHTML = html;
}

function guardarPrecios() {
  var ok = true;
  PRES.forEach(function(p, i) {
    var v = parseFloat(document.getElementById('pr-' + i).value);
    if (!isNaN(v) && v > 0) { p.precio = v; state.precios[i] = v; } else { ok = false; }
  });
  if (!ok) { showToast('Ingresá precios válidos'); return; }
  saveState(); renderAll(); showToast('Precios guardados ✓');
}

// ===================== PEDIDOS =====================
function onPresChange() {
  var cant = parseInt(document.getElementById('ped-cant').value) || 1;
  var pres = parseInt(document.getElementById('ped-pres').value);
  var target = cant * pres;
  var wrap = document.getElementById('mix-wrap');
  wrap.style.display = 'block';
  if (target === 1) {
    mixValues = { chips: 1, oreo: 0, limon: 0 };
  } else {
    var t = Math.floor(target / 3), r = target - t - t;
    mixValues = { chips: t, oreo: t, limon: r };
  }
  updateMixUI();
}

function adjMix(v, delta) {
  var cant = parseInt(document.getElementById('ped-cant').value) || 1;
  var pres = parseInt(document.getElementById('ped-pres').value);
  var target = cant * pres;
  mixValues[v] = Math.max(0, mixValues[v] + delta);
  var current = mixValues.chips + mixValues.oreo + mixValues.limon;
  if (current > target) { mixValues[v] -= delta; }
  updateMixUI();
}

function updateMixUI() {
  var cant = parseInt(document.getElementById('ped-cant').value) || 1;
  var pres = parseInt(document.getElementById('ped-pres').value);
  var target = cant * pres;
  document.getElementById('mx-chips').textContent = mixValues.chips;
  document.getElementById('mx-oreo').textContent = mixValues.oreo;
  document.getElementById('mx-limon').textContent = mixValues.limon;
  var current = mixValues.chips + mixValues.oreo + mixValues.limon;
  var st = document.getElementById('mix-status');
  if (current === target) {
    st.innerHTML = '<span class="mix-ok">✓ ' + current + '/' + target + ' — listo</span>';
  } else {
    st.innerHTML = '<span class="mix-err">Faltan ' + (target - current) + ' galleta' + ((target-current)>1?'s':'') + '</span>';
  }
}

function addPedido() {
  var cl = document.getElementById('ped-cliente').value.trim();
  var cant = parseInt(document.getElementById('ped-cant').value) || 1;
  var pres = parseInt(document.getElementById('ped-pres').value);
  var fecha = document.getElementById('ped-fecha').value.trim() || today();
  var notas = document.getElementById('ped-notas').value.trim();
  if (!cl) { showToast('Ingresá el nombre del cliente'); return; }
  var mix = Object.assign({}, mixValues);
  var total = mix.chips + mix.oreo + mix.limon;
  if (total !== (cant * pres)) { showToast('Las variedades deben sumar ' + (cant * pres)); return; }

  state.pedidos.unshift({ id: state.pedidoIdx++, cliente: cl, cantidad: cant, pres: pres, mix: mix, fecha: fecha, notas: notas, estado: 'pendiente' });
  saveState();
  ['ped-cliente','ped-notas'].forEach(function(id){ document.getElementById(id).value = ''; });
  document.getElementById('ped-cant').value = '1';
  document.getElementById('ped-pres').value = '1';
  document.getElementById('ped-fecha').value = today();
  onPresChange();
  toggleForm('form-ped');
  renderAll(); showToast('Pedido registrado ✓');
}

function cambiarEstado(id, estado) {
  var p = state.pedidos.find(function(x){ return x.id === id; });
  if (p) { p.estado = estado; saveState(); renderAll(); }
}

function entregarPedido(id) {
  var p = state.pedidos.find(function(x){ return x.id === id; });
  if (!p) return;
  var pr = PRES.find(function(x){ return x.qty === p.pres; }) || PRES[0];
  var tg = p.cantidad * p.pres;
  var tp = p.cantidad * pr.precio;
  var costo = calcCostoMix(p.mix, p.cantidad);
  state.historial.push({ id: state.histIdx++, cliente: p.cliente, cantidad: p.cantidad, pres: p.pres, mix: p.mix, totalGalletas: tg, totalPrecio: tp, totalCosto: costo, notas: p.notas, fecha: today(), fechaISO: todayISO() });
  state.pedidos = state.pedidos.filter(function(x){ return x.id !== id; });
  saveState(); renderAll(); showToast('¡Pedido entregado! Guardado en historial ✓');
}

function eliminarPedido(id) {
  var p = state.pedidos.find(function(x){ return x.id === id; });
  if (!p) return;
  if (!confirm('¿Eliminar pedido de ' + p.cliente + '?')) return;
  state.pedidos = state.pedidos.filter(function(x){ return x.id !== id; });
  saveState(); renderAll();
}

function calcCostoMix(mix, cantidad) {
  var c = 0;
  VARS.forEach(function(v) { c += costoVariedad(v.id) * (mix[v.id] || 0); });
  return c;
}

function mixTags(mix) {
  var t = '';
  if (mix.chips > 0) t += '<span class="vtag vtag-chips">' + mix.chips + ' Chips</span>';
  if (mix.oreo  > 0) t += '<span class="vtag vtag-oreo">'  + mix.oreo  + ' Oreo</span>';
  if (mix.limon > 0) t += '<span class="vtag vtag-limon">' + mix.limon + ' Limón</span>';
  return t;
}

function renderPedidos() {
  var cont = document.getElementById('lista-pedidos');
  if (!state.pedidos.length) { cont.innerHTML = '<div class="empty"><div class="empty-icon">📋</div>No hay pedidos todavía</div>'; return; }
  cont.innerHTML = state.pedidos.map(function(p) {
    var pr = PRES.find(function(x){ return x.qty === p.pres; }) || PRES[0];
    var tg = p.cantidad * p.pres;
    var tp = p.cantidad * pr.precio;
    var eb = p.estado === 'pendiente' ? 'badge-amber' : (p.estado === 'listo' ? 'badge-green' : 'badge-blue');
    var acciones = '';
    if (p.estado === 'pendiente') acciones += '<button class="btn btn-sm" onclick="cambiarEstado(' + p.id + ',\'listo\')">Listo para entregar</button>';
    if (p.estado === 'listo') acciones += '<button class="btn btn-sm btn-primary" onclick="entregarPedido(' + p.id + ')">Marcar entregado ✓</button>';
    acciones += '<button class="btn btn-sm btn-danger" onclick="eliminarPedido(' + p.id + ')">Eliminar</button>';
    return '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">' +
        '<div class="item-name">' + p.cliente + '</div>' +
        '<span class="badge ' + eb + '">' + p.estado + '</span>' +
      '</div>' +
      '<div class="item-detail">' + p.cantidad + ' × ' + pr.label + ' · ' + tg + ' galletas · ' + fmt(tp) + '</div>' +
      '<div style="margin:5px 0">' + mixTags(p.mix) + '</div>' +
      '<div class="item-detail">Entrega: ' + p.fecha + (p.notas ? ' · ' + p.notas : '') + '</div>' +
      '<div class="btn-row">' + acciones + '</div>' +
    '</div>';
  }).join('');
}

// ===================== COMPRAS =====================
function renderCompras() {
  var pends = state.pedidos.filter(function(p){ return p.estado !== 'entregado'; });
  var vc = { chips:0, oreo:0, limon:0 };
  pends.forEach(function(p) { VARS.forEach(function(v){ vc[v.id] += (p.mix[v.id] || 0); }); });
  var tg = vc.chips + vc.oreo + vc.limon;

  document.getElementById('comp-resumen').innerHTML =
    '<div class="mg">' +
    '<div class="metric"><div class="metric-label">Pedidos activos</div><div class="metric-value">' + pends.length + '</div></div>' +
    '<div class="metric"><div class="metric-label">Galletas totales</div><div class="metric-value amber">' + tg + '</div></div>' +
    '</div>';

  document.getElementById('comp-variedades').innerHTML = VARS.map(function(v) {
    return '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="display:flex;align-items:center;gap:7px"><div class="dot ' + v.dotClass + '"></div>' + v.label + '</div>' +
      '<div style="font-weight:700">' + vc[v.id] + ' galletas</div></div>';
  }).join('');

  if (tg === 0) { document.getElementById('comp-ings').innerHTML = '<div class="empty">Sin pedidos pendientes</div>'; return; }

  var bv = { chips: vc.chips / 15, oreo: vc.oreo / 15, limon: vc.limon / 15 };
  var costoTotal = 0;
  var html = state.ingredientes.filter(function(i){ return i.nombre !== 'Mano de obra'; }).map(function(ing) {
    var batches = ing.variedad === 'todas' ? tg / 15 : (bv[ing.variedad] || 0);
    if (batches === 0) return '';
    var cant = ing.cant15 * batches;
    var paq = Math.ceil(cant / ing.cantPaq);
    var costo = paq * ing.costoPaq;
    costoTotal += costo;
    return '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center">' +
      '<div><div style="font-size:13px;font-weight:500">' + ing.nombre + '</div>' +
      '<div class="item-detail">' + Math.ceil(cant) + ' ' + ing.unidad + ' · ' + paq + ' paquete' + (paq>1?'s':'') + '</div></div>' +
      '<div style="font-weight:700">' + fmt(costo) + '</div></div>';
  }).join('');
  html += '<div style="display:flex;justify-content:space-between;padding:10px 8px;background:var(--amber-bg);border-radius:var(--r-sm);margin-top:8px;font-weight:700;font-size:15px">' +
    '<span>Total inversión</span><span style="color:var(--amber)">' + fmt(costoTotal) + '</span></div>';
  document.getElementById('comp-ings').innerHTML = html;
}

// ===================== HISTORIAL =====================
function filtrarVentas() {
  if (filtroHist === 'todos') return state.historial;
  var now = new Date();
  return state.historial.filter(function(v) {
    var p = v.fechaISO ? v.fechaISO.split('-') : [];
    if (p.length < 3) return true;
    var d = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
    if (filtroHist === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filtroHist === 'semana') return (now - d) / 864e5 < 7;
    return true;
  });
}

function filtrarHist(tipo, btn) {
  filtroHist = tipo;
  document.querySelectorAll('#hist-filtros button').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  renderHistorial();
}

function renderHistorial() {
  var ventas = filtrarVentas();
  var ti = ventas.reduce(function(s,v){ return s+v.totalPrecio; }, 0);
  var tc = ventas.reduce(function(s,v){ return s+v.totalCosto; }, 0);
  var tg = ventas.reduce(function(s,v){ return s+v.totalGalletas; }, 0);

  document.getElementById('hist-metrics').innerHTML =
    '<div class="metric"><div class="metric-label">Ingresos</div><div class="metric-value green">' + fmt(ti) + '</div></div>' +
    '<div class="metric"><div class="metric-label">Ganancia</div><div class="metric-value green">' + fmt(ti-tc) + '</div></div>' +
    '<div class="metric"><div class="metric-label">Galletas vendidas</div><div class="metric-value">' + tg + '</div></div>' +
    '<div class="metric"><div class="metric-label">Ventas</div><div class="metric-value">' + ventas.length + '</div></div>';

  var vc = { chips:0, oreo:0, limon:0 };
  state.historial.forEach(function(v){ VARS.forEach(function(vr){ vc[vr.id] += (v.mix[vr.id]||0); }); });
  var maxV = Math.max.apply(null, Object.values(vc)) || 1;
  document.getElementById('hist-chart').innerHTML = VARS.map(function(v) {
    var pct = Math.round(vc[v.id] / maxV * 100);
    return '<div class="chart-row"><div class="chart-label">' + v.label + '</div>' +
      '<div class="chart-track"><div class="chart-fill" style="width:' + pct + '%;background:' + v.color + '">' +
      '<span class="chart-val">' + (vc[v.id] > 0 ? vc[v.id] : '') + '</span></div></div></div>';
  }).join('');

  if (!ventas.length) { document.getElementById('lista-historial').innerHTML = '<div class="empty">Sin ventas en este período</div>'; return; }

  document.getElementById('lista-historial').innerHTML = ventas.slice().reverse().map(function(v) {
    var pr = PRES.find(function(x){ return x.qty === v.pres; }) || PRES[0];
    var gan = v.totalPrecio - v.totalCosto;
    return '<div class="list-item">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div class="item-name">' + v.cliente + '</div>' +
        '<span class="badge badge-green">entregado</span>' +
      '</div>' +
      '<div class="item-detail">' + v.cantidad + ' × ' + pr.label + ' · ' + v.fecha + '</div>' +
      '<div style="margin:4px 0">' + mixTags(v.mix) + '</div>' +
      '<div style="font-size:12px;color:var(--green);font-weight:600">' + fmt(v.totalPrecio) + ' · ganancia ' + fmt(gan) + '</div>' +
    '</div>';
  }).join('');
}

// ===================== EXPORTAR =====================
function renderExportar() {
  var ti = state.historial.reduce(function(s,v){ return s+v.totalPrecio; }, 0);
  var tc = state.historial.reduce(function(s,v){ return s+v.totalCosto; }, 0);
  var tg = state.historial.reduce(function(s,v){ return s+v.totalGalletas; }, 0);
  document.getElementById('exp-resumen').innerHTML =
    '<div class="metric"><div class="metric-label">Total ingresos</div><div class="metric-value green">' + fmt(ti) + '</div></div>' +
    '<div class="metric"><div class="metric-label">Total ganancia</div><div class="metric-value green">' + fmt(ti-tc) + '</div></div>' +
    '<div class="metric"><div class="metric-label">Galletas vendidas</div><div class="metric-value">' + tg + '</div></div>' +
    '<div class="metric"><div class="metric-label">Total costos</div><div class="metric-value amber">' + fmt(tc) + '</div></div>';
}

function exportCSV(tipo) {
  var csv = '\uFEFF', fn = '';
  if (tipo === 'costos' || tipo === 'todo') {
    csv += 'INGREDIENTES Y COSTOS\n';
    csv += 'Ingrediente,Variedad,Cant x 15,Unidad,Costo paquete,Cant paquete,Costo x galleta\n';
    state.ingredientes.forEach(function(i) {
      csv += i.nombre+','+i.variedad+','+i.cant15+','+i.unidad+','+i.costoPaq+','+i.cantPaq+','+Math.round(costoXGalleta(i)*100)/100+'\n';
    });
    csv += '\nCosto x galleta por variedad\n';
    VARS.forEach(function(v){ csv += v.label+','+Math.round(costoVariedad(v.id)*100)/100+'\n'; });
    csv += '\n'; if (tipo==='costos') fn='costos_ingredientes.csv';
  }
  if (tipo === 'pedidos' || tipo === 'todo') {
    if (tipo==='pedidos') csv = '\uFEFF';
    csv += 'PEDIDOS ACTIVOS\n';
    csv += 'ID,Cliente,Cantidad,Presentación,Total galletas,Chips,Oreo,Limón,Precio total,Fecha entrega,Notas,Estado\n';
    state.pedidos.forEach(function(p) {
      var pr = PRES.find(function(x){ return x.qty===p.pres; })||PRES[0];
      csv += p.id+','+p.cliente+','+p.cantidad+','+pr.label+','+(p.cantidad*p.pres)+','+p.mix.chips+','+p.mix.oreo+','+p.mix.limon+','+(p.cantidad*pr.precio)+','+p.fecha+','+(p.notas||'')+','+p.estado+'\n';
    });
    csv += '\n'; if (tipo==='pedidos') fn='pedidos.csv';
  }
  if (tipo === 'historial' || tipo === 'todo') {
    if (tipo==='historial') csv = '\uFEFF';
    csv += 'HISTORIAL DE VENTAS\n';
    csv += 'ID,Cliente,Cantidad,Presentación,Total galletas,Chips,Oreo,Limón,Ingresos,Costo,Ganancia,Notas,Fecha\n';
    state.historial.forEach(function(v) {
      var pr = PRES.find(function(x){ return x.qty===v.pres; })||PRES[0];
      var gan = Math.round(v.totalPrecio - v.totalCosto);
      csv += v.id+','+v.cliente+','+v.cantidad+','+pr.label+','+v.totalGalletas+','+v.mix.chips+','+v.mix.oreo+','+v.mix.limon+','+v.totalPrecio+','+Math.round(v.totalCosto)+','+gan+','+(v.notas||'')+','+v.fecha+'\n';
    });
    csv += '\n'; if (tipo==='historial') fn='historial_ventas.csv';
  }
  if (tipo === 'todo') {
    var ti=state.historial.reduce(function(s,v){return s+v.totalPrecio;},0);
    var tc=state.historial.reduce(function(s,v){return s+v.totalCosto;},0);
    csv += 'RESUMEN FINANCIERO\n';
    csv += 'Ingresos totales,'+ti+'\nGanancia total,'+(ti-Math.round(tc))+'\nGalletas vendidas,'+state.historial.reduce(function(s,v){return s+v.totalGalletas;},0)+'\n';
    fn = 'galletasapp_completo.csv';
  }
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = fn;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('Descargando ' + fn + ' ✓');
}

function generarTexto() {
  var txt = '=== GALLETAS APP ===\n' + today() + '\n\n';
  txt += '--- COSTOS ---\n';
  VARS.forEach(function(v){ txt += v.label + ': ' + fmt(costoVariedad(v.id)) + ' x galleta\n'; });
  txt += '\n--- PRECIOS ---\n';
  PRES.forEach(function(p){ txt += p.label + ' (' + p.qty + '): ' + fmt(p.precio) + '\n'; });
  var pends = state.pedidos.filter(function(p){ return p.estado !== 'entregado'; });
  txt += '\n--- PEDIDOS ACTIVOS (' + pends.length + ') ---\n';
  pends.forEach(function(p) {
    var pr = PRES.find(function(x){ return x.qty===p.pres; })||PRES[0];
    var tags = [];
    if(p.mix.chips>0) tags.push(p.mix.chips+' Chips');
    if(p.mix.oreo>0)  tags.push(p.mix.oreo+' Oreo');
    if(p.mix.limon>0) tags.push(p.mix.limon+' Limón');
    txt += p.cliente + ': ' + p.cantidad + ' ' + pr.label + ' [' + tags.join('/') + '] · ' + p.fecha + '\n';
  });
  txt += '\n--- HISTORIAL (' + state.historial.length + ' ventas) ---\n';
  var ti = state.historial.reduce(function(s,v){return s+v.totalPrecio;},0);
  var tc = state.historial.reduce(function(s,v){return s+v.totalCosto;},0);
  txt += 'Ingresos: ' + fmt(ti) + '\nGanancia: ' + fmt(ti-tc) + '\n';
  document.getElementById('texto-wrap').style.display = 'block';
  document.getElementById('texto-content').value = txt;
}

function copiarTexto() {
  var ta = document.getElementById('texto-content');
  ta.select(); try { document.execCommand('copy'); showToast('¡Copiado al portapapeles!'); } catch(e){}
}

// ===================== RENDER ALL =====================
function renderAll() {
  renderCostos();
  renderPreciosForm();
  renderPedidos();
  renderCompras();
  renderHistorial();
  renderExportar();
}

// ===================== SERVICE WORKER =====================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function(){});
}

// ===================== INIT =====================
loadState();
// Set default delivery date
document.getElementById('ped-fecha').value = today();
// Start at Pedidos screen
showScreen('pedidos', document.getElementById('nav-pedidos'));
onPresChange();
renderAll();