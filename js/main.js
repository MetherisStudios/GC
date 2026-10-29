/* =========================================================
   Granny Café · main.js
   ---------------------------------------------------------
   DATOS QUE SE CAMBIAN: todo está acá arriba, en CONFIG.
   ========================================================= */
const CONFIG = {
  // WhatsApp sin "+" ni espacios: 598 + el número sin el 0 inicial.
  // Ahora: número de prueba de Metheris Studios.
  // Para Granny (091 230 458) quedaría: "59891230458"
  whatsapp: "59898100017",

  instagram: "https://www.instagram.com/granny.cafe_/",

  // Perfil de Google (ver reseñas). Reemplazar por el link de "Compartir" de Google Maps.
  googleVer: "https://www.google.com/maps/search/?api=1&query=Granny+caf%C3%A9+Salinas+Canelones",
  // Link para dejar reseña. El dueño lo saca de su Perfil de Empresa ("Pedir reseñas").
  googleEscribir: "https://www.google.com/maps/search/?api=1&query=Granny+caf%C3%A9+Salinas+Canelones",

  mapaEmbed: "https://maps.google.com/maps?q=Granny%20caf%C3%A9%2C%20Av.%20Julieta%20esq.%20Guazubir%C3%A1%2C%20Salinas%2C%20Canelones%2C%20Uruguay&z=16&output=embed",
  comoLlegar: "https://www.google.com/maps/dir/?api=1&destination=Granny+caf%C3%A9+Salinas+Canelones+Uruguay",

  // Clave de Web3Forms (una por cliente, con el mail del cliente como destino).
  web3formsKey: "31bd8c3d-df41-4206-a1cd-f258cb680201",

  // Horarios: 0 = domingo, 1 = lunes ... 6 = sábado.
  horarios: {
    0: [["08:30", "13:00"], ["15:00", "20:00"]],
    1: [["15:30", "19:30"]],
    2: [["15:30", "19:30"]],
    3: [["08:30", "13:00"], ["15:00", "20:00"]],
    4: [["08:30", "13:00"], ["15:00", "20:00"]],
    5: [["08:30", "13:00"], ["15:00", "20:00"]],
    6: [["08:30", "13:00"], ["15:00", "20:00"]],
  },
  zonaHoraria: "America/Montevideo",
};

/* ---------- Utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const linkWA = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHora = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

// Fecha y hora actuales en Uruguay, aunque el visitante tenga otra zona horaria.
function ahoraUY() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
  const fecha = new Date(Date.UTC(+partes.year, +partes.month - 1, +partes.day));
  const hora = +partes.hour % 24;
  return { fecha, dia: fecha.getUTCDay(), min: hora * 60 + +partes.minute };
}
const sumarDias = (fecha, n) => new Date(fecha.getTime() + n * 86400000);

/* ---------- Links (WhatsApp, Google, Instagram, mapa) ---------- */
function armarLinks() {
  $$("[data-wa]").forEach((a) => (a.href = linkWA(a.dataset.wa)));
  $$("[data-ig]").forEach((a) => (a.href = CONFIG.instagram));
  $$("[data-dir]").forEach((a) => (a.href = CONFIG.comoLlegar));
  $$('[data-google="ver"]').forEach((a) => (a.href = CONFIG.googleVer));
  $$('[data-google="escribir"]').forEach((a) => (a.href = CONFIG.googleEscribir));
  const mapa = $("[data-mapa]");
  if (mapa) mapa.src = CONFIG.mapaEmbed;
  const anio = $("#anio");
  if (anio) anio.textContent = new Date().getFullYear();
}

/* ---------- Pantalla de entrada (2 segundos) ---------- */
function intro() {
  const el = $("#intro");
  if (!el) return;
  const dur = reducirMovimiento ? 300 : 1800;
  setTimeout(() => el.classList.add("fuera"), dur);
  setTimeout(() => el.remove(), dur + 400);
}

/* ---------- Menú del celular y sección activa ---------- */
function navegacion() {
  const burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", () => {
    const abierto = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!abierto));
    burger.setAttribute("aria-label", abierto ? "Abrir menú" : "Cerrar menú");
    nav.classList.toggle("abierto", !abierto);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    nav.classList.remove("abierto");
  }));

  const links = new Map($$("a", nav).map((a) => [a.getAttribute("href").slice(1), a]));
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("activo"));
      links.get(e.target.id)?.classList.add("activo");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) obs.observe(s); });
}

/* ---------- ¿Está abierto ahora? ---------- */
function calcularEstado() {
  const { dia, min } = ahoraUY();
  const hoy = (CONFIG.horarios[dia] || []).map(([a, c]) => [aMin(a), aMin(c)]);

  for (const [abre, cierra] of hoy) {
    if (min >= abre && min < cierra) {
      const falta = cierra - min;
      if (falta <= 30) return { clase: "pronto", txt: `Cierra pronto, a las ${aHora(cierra)}` };
      return { clase: "abierto", txt: `Abierto ahora, hasta las ${aHora(cierra)}` };
    }
  }
  const luego = hoy.find(([abre]) => abre > min);
  if (luego) return { clase: "cerrado", txt: `Cerrado ahora, abrimos hoy a las ${aHora(luego[0])}` };

  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const r = CONFIG.horarios[d];
    if (r && r.length) {
      const cuando = i === 1 ? "mañana" : `el ${DIAS[d]}`;
      return { clase: "cerrado", txt: `Cerrado ahora, abrimos ${cuando} a las ${aHora(aMin(r[0][0]))}` };
    }
  }
  return { clase: "cerrado", txt: "Cerrado ahora" };
}

function mostrarEstado() {
  const est = calcularEstado();
  $$("[data-estado]").forEach((el) => {
    el.classList.remove("abierto", "pronto", "cerrado");
    el.classList.add(est.clase);
    $(".estado-txt", el).textContent = est.txt;
  });
  const { dia } = ahoraUY();
  $$(".horarios tr[data-dias]").forEach((tr) => {
    tr.classList.toggle("hoy", tr.dataset.dias.split(",").map(Number).includes(dia));
  });
}

/* ---------- Galería ---------- */
function galeria() {
  const pista = $("#fotos");
  $$('[data-carrusel="fotos"]').forEach((b) => b.addEventListener("click", () => {
    pista.scrollBy({ left: Number(b.dataset.dir) * pista.clientWidth * 0.7, behavior: reducirMovimiento ? "auto" : "smooth" });
  }));

  const visor = $("#visor"), img = $("img", visor);
  $$(".foto", pista).forEach((f) => f.addEventListener("click", () => {
    const i = $("img", f);
    img.src = f.dataset.full; img.alt = i.alt;
    visor.showModal();
  }));
  $(".visor-cerrar", visor).addEventListener("click", () => visor.close());
  visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
}

/* ---------- Carrusel de reseñas ---------- */
function resenas() {
  const pista = $("#resenas-pista");
  const tarjetas = $$(".resena", pista);
  const puntos = $("#resenas-puntos");

  const porPagina = () => Math.max(1, Math.round(pista.clientWidth / tarjetas[0].getBoundingClientRect().width));
  const paginas = () => tarjetas.length - porPagina() + 1;
  let actual = 0;

  function armarPuntos() {
    puntos.innerHTML = "";
    for (let i = 0; i < paginas(); i++) {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Reseña ${i + 1}`);
      b.addEventListener("click", () => ir(i));
      puntos.appendChild(b);
    }
    marcar();
  }
  function marcar() {
    $$("button", puntos).forEach((b, i) => b.setAttribute("aria-selected", String(i === actual)));
  }
  function ir(i) {
    const total = paginas();
    actual = (i + total) % total;
    pista.scrollTo({ left: tarjetas[actual].offsetLeft - tarjetas[0].offsetLeft, behavior: reducirMovimiento ? "auto" : "smooth" });
    marcar();
  }
  $$("[data-resena]").forEach((b) => b.addEventListener("click", () => ir(actual + Number(b.dataset.resena))));

  let t;
  pista.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const ancho = tarjetas[1].offsetLeft - tarjetas[0].offsetLeft;
      actual = Math.min(paginas() - 1, Math.round(pista.scrollLeft / ancho));
      marcar();
    }, 80);
  }, { passive: true });

  // Avance automático, solo si la sección se ve y nadie la está tocando
  let enVista = false, quieto = false;
  new IntersectionObserver(([e]) => (enVista = e.isIntersecting), { threshold: 0.4 }).observe(pista);
  const zona = $(".resenas-carrusel");
  ["mouseenter", "focusin", "touchstart"].forEach((ev) => zona.addEventListener(ev, () => (quieto = true), { passive: true }));
  ["mouseleave", "focusout"].forEach((ev) => zona.addEventListener(ev, () => (quieto = false)));
  if (!reducirMovimiento) setInterval(() => { if (enVista && !quieto && !document.hidden) ir(actual + 1); }, 7000);

  let r;
  window.addEventListener("resize", () => { clearTimeout(r); r = setTimeout(() => { actual = 0; armarPuntos(); ir(0); }, 200); });
  armarPuntos();
}

/* ---------- Reserva por WhatsApp ---------- */
const reserva = { personas: 2 };
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;

function opcionesDias() {
  const sel = $("#r-dia");
  const { fecha, dia, min } = ahoraUY();
  sel.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const d = (dia + i) % 7;
    const rangos = CONFIG.horarios[d] || [];
    if (!rangos.length) continue;
    if (i === 0 && !horarios(0).length) continue; // hoy ya no quedan turnos
    const f = sumarDias(fecha, i);
    const nro = `${f.getUTCDate()}/${f.getUTCMonth() + 1}`;
    const etiqueta = i === 0 ? `Hoy, ${DIAS[d]} ${nro}` : i === 1 ? `Mañana, ${DIAS[d]} ${nro}` : `${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)} ${nro}`;
    const texto = i === 0 ? `hoy ${DIAS[d]} ${nro}` : `el ${DIAS[d]} ${nro}`;
    sel.add(new Option(etiqueta, String(i)));
    sel.options[sel.options.length - 1].dataset.texto = texto;
  }

  // Turnos cada 30 minutos, hasta media hora antes de cerrar
  function horarios(offset) {
    const d = (dia + offset) % 7;
    const desde = offset === 0 ? min + 30 : 0;
    const lista = [];
    (CONFIG.horarios[d] || []).forEach(([a, c]) => {
      for (let m = aMin(a); m <= aMin(c) - 30; m += 30) if (m >= desde) lista.push(m);
    });
    return lista;
  }
  opcionesDias.horarios = horarios;
}

function opcionesHoras() {
  const sel = $("#r-hora");
  const anterior = sel.value;
  const lista = opcionesDias.horarios(Number($("#r-dia").value));
  sel.innerHTML = "";
  lista.forEach((m) => sel.add(new Option(aHora(m), aHora(m))));
  if (lista.map(aHora).includes(anterior)) sel.value = anterior;
}

function actualizarReserva() {
  const dia = $("#r-dia").selectedOptions[0];
  if (!dia) return;
  const n = reserva.personas;
  const nombre = $("#r-nombre").value.trim();
  const extras = $$(".extras input:checked").map((c) => c.value);
  let msg = `Hola Granny! Quiero reservar una mesa para ${n} ${n === 1 ? "persona" : "personas"} ${dia.dataset.texto} a las ${$("#r-hora").value}.`;
  if (nombre) msg += ` A nombre de ${nombre}.`;
  if (extras.length) msg += `\n${extras.join(". ")}.`;
  $("#r-enviar").href = linkWA(msg);
}

function reservas() {
  opcionesDias();
  opcionesHoras();
  $("#r-pers").textContent = reserva.personas;

  $("#r-dia").addEventListener("change", () => { opcionesHoras(); actualizarReserva(); });
  $("#r-hora").addEventListener("change", actualizarReserva);
  $$(".extras input").forEach((c) => c.addEventListener("change", actualizarReserva));
  $$("[data-pers]").forEach((b) => b.addEventListener("click", () => {
    reserva.personas = Math.min(20, Math.max(1, reserva.personas + Number(b.dataset.pers)));
    $("#r-pers").textContent = reserva.personas;
    actualizarReserva();
  }));

  const nombre = $("#r-nombre"), err = $("#r-nombre-error");
  nombre.addEventListener("input", () => { err.textContent = ""; nombre.parentElement.classList.remove("invalido"); actualizarReserva(); });

  $("#r-enviar").addEventListener("click", (e) => {
    const v = nombre.value.trim();
    let problema = "";
    if (!v) problema = "Poné tu nombre para la reserva.";
    else if (!SOLO_LETRAS.test(v) || v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").length < 2) problema = "El nombre solo puede tener letras.";
    if (problema) {
      e.preventDefault();
      err.textContent = problema;
      nombre.parentElement.classList.add("invalido");
      nombre.focus();
      return;
    }
    actualizarReserva();
  });
  actualizarReserva();
}

/* ---------- Formulario de consultas (Web3Forms) ---------- */
const REGLAS = {
  "f-nombre": (v) => !v ? "Escribí tu nombre." : !SOLO_LETRAS.test(v) || v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").length < 2 ? "El nombre solo puede tener letras." : "",
  "f-apellido": (v) => !v ? "Escribí tu apellido." : !SOLO_LETRAS.test(v) || v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").length < 2 ? "El apellido solo puede tener letras." : "",
  "f-correo": (v) => !v ? "Escribí tu correo." : !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? "Revisá el correo, por ejemplo: nombre@gmail.com" : "",
  "f-tel": (v) => {
    if (!v) return "Escribí tu teléfono.";
    let n = v.replace(/[\s().-]/g, "");
    n = n.replace(/^(\+|00)598/, "");
    const ok = /^09\d{7}$/.test(n) || /^9\d{7}$/.test(n) || /^[24]\d{7}$/.test(n);
    return ok ? "" : "Ingresá un teléfono uruguayo: celular 09X XXX XXX o fijo de 8 dígitos.";
  },
  "f-tipo": (v) => v ? "" : "Elegí el tipo de consulta.",
  "f-mensaje": (v) => {
    if (!v) return "Escribí tu mensaje.";
    const letras = v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").length;
    const palabras = v.split(/\s+/).filter((p) => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(p)).length;
    if (v.length < 15 || palabras < 3) return "Contanos un poco más (al menos una frase).";
    if (/(.)\1{5,}/.test(v) || letras < v.replace(/\s/g, "").length * 0.6) return "El mensaje no parece un texto válido. Revisalo.";
    return "";
  },
};

function validar(id) {
  const el = document.getElementById(id);
  const msg = REGLAS[id](el.value.trim());
  const campo = el.closest(".campo");
  $(".error", campo).textContent = msg;
  campo.classList.toggle("invalido", !!msg);
  el.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

function formulario() {
  const form = $("#form"), estado = $("#form-estado"), boton = $("#f-enviar");
  Object.keys(REGLAS).forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("blur", () => { if (el.value.trim()) validar(id); });
    el.addEventListener("input", () => {
      if (el.closest(".campo").classList.contains("invalido")) validar(id);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    estado.className = "form-estado"; estado.textContent = "";
    const ids = Object.keys(REGLAS);
    const resultados = ids.map(validar);
    if (resultados.includes(false)) {
      document.getElementById(ids[resultados.indexOf(false)]).focus();
      return;
    }
    if (form.botcheck.checked) return;

    if (!CONFIG.web3formsKey || CONFIG.web3formsKey.startsWith("PEGAR")) {
      estado.className = "form-estado mal";
      estado.textContent = "El formulario no está disponible en este momento. Escribinos por WhatsApp.";
      return;
    }

    const correo = $("#f-correo").value.trim();
    const datos = {
      access_key: CONFIG.web3formsKey,
      subject: `Nueva consulta desde la web: ${$("#f-tipo").value}`,
      from_name: "Web de Granny Café",
      replyto: correo,
      "Nombre": $("#f-nombre").value.trim(),
      "Apellido": $("#f-apellido").value.trim(),
      "Correo electrónico": correo,
      "Teléfono": $("#f-tel").value.trim(),
      "Tipo de consulta": $("#f-tipo").value,
      "Mensaje": $("#f-mensaje").value.trim(),
    };

    boton.disabled = true; boton.textContent = "Enviando…";
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(datos),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      form.reset();
      estado.className = "form-estado ok";
      estado.textContent = "¡Listo! Recibimos tu consulta y te respondemos al correo.";
    } catch {
      estado.className = "form-estado mal";
      estado.textContent = "No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.";
    } finally {
      boton.disabled = false; boton.textContent = "Enviar consulta";
    }
  });
}

/* ---------- Perro y gato del footer ---------- */
// Al pasar el mouse (o tocar) aparece un corazoncito entre los dos.
function mascotas() {
  const fig = $(".mascotas-fig");
  if (!fig) return;
  const corazon = $(".corazon", fig);
  const latir = () => {
    corazon.classList.remove("late"); void corazon.offsetWidth; corazon.classList.add("late");
  };
  fig.addEventListener("mouseenter", latir);
  fig.addEventListener("click", latir);
}

/* ---------- Arranque ---------- */
document.addEventListener("DOMContentLoaded", () => {
  armarLinks();
  intro();
  navegacion();
  mostrarEstado();
  setInterval(mostrarEstado, 60000);
  reservas();
  galeria();
  resenas();
  formulario();
  mascotas();
});
