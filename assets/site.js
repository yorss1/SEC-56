// Mejoras progresivas: el sitio funciona completo sin JavaScript.
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // ---- Menú móvil ----
  var boton = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu-principal');
  if (boton && menu) {
    var consulta = window.matchMedia('(min-width: 62rem)');
    var abrir = function (abierto, devolverFoco) {
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      menu.setAttribute('data-collapsed', abierto ? 'false' : 'true');
      if (!abierto && devolverFoco) boton.focus();
    };
    boton.hidden = false;
    abrir(false, false);
    boton.addEventListener('click', function () {
      abrir(boton.getAttribute('aria-expanded') !== 'true', false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true' && !consulta.matches) {
        abrir(false, true);
      }
    });
    menu.addEventListener('focusout', function (e) {
      if (consulta.matches || boton.getAttribute('aria-expanded') !== 'true') return;
      if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== boton) abrir(false, false);
    });
  }

  // ---- Fecha local (AAAA-MM-DD) ----
  function hoy() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  // ---- Avisos vencidos: se recomprueba en el navegador ----
  var fechaHoy = hoy();
  document.querySelectorAll('[data-aviso]').forEach(function (el) {
    var vence = el.getAttribute('data-vence');
    if (vence && vence < fechaHoy && el.getAttribute('data-vigencia') === 'vigente') {
      el.setAttribute('data-vigencia', 'vencido');
      var tags = el.querySelector('.notice-tags');
      if (tags) {
        var span = document.createElement('span');
        span.className = 'tag tag-vencido';
        span.textContent = 'Vencido';
        tags.appendChild(span);
      }
    }
  });
  var detalle = document.querySelector('[data-aviso-detalle]');
  if (detalle) {
    var venceDetalle = detalle.getAttribute('data-vence');
    if (venceDetalle && venceDetalle < fechaHoy) {
      var banner = detalle.querySelector('[data-banner-vencido]');
      if (banner) banner.hidden = false;
    }
  }

  // ---- Búsqueda y filtros de avisos ----
  var form = document.querySelector('[data-filtros]');
  var lista = document.querySelector('[data-lista-avisos]');
  if (form && lista) {
    form.hidden = false;
    var items = Array.prototype.slice.call(lista.querySelectorAll('[data-aviso]'));
    var sinResultados = document.querySelector('[data-sin-resultados]');
    var estado = form.querySelector('[data-estado-filtros]');
    var normalizar = function (t) {
      return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    };
    var aplicar = function () {
      var texto = normalizar(form.elements.texto.value.trim());
      var categoria = form.elements.categoria.value;
      var ciclo = form.elements.ciclo.value;
      var vigencia = form.elements.vigencia ? form.elements.vigencia.value : '';
      var visibles = 0;
      items.forEach(function (el) {
        var ok = (!texto || normalizar(el.getAttribute('data-texto')).indexOf(texto) !== -1) &&
          (!categoria || el.getAttribute('data-categoria') === categoria) &&
          (!ciclo || el.getAttribute('data-ciclo') === ciclo) &&
          (!vigencia || el.getAttribute('data-vigencia') === vigencia);
        el.hidden = !ok;
        if (ok) visibles += 1;
      });
      if (sinResultados) sinResultados.hidden = visibles !== 0;
      if (estado) {
        estado.textContent = visibles === 1 ? '1 aviso encontrado.' : visibles + ' avisos encontrados.';
      }
    };
    form.addEventListener('input', aplicar);
    form.addEventListener('change', aplicar);
    form.addEventListener('submit', function (e) { e.preventDefault(); aplicar(); });
  }
})();
