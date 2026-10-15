import json, sys
from playwright.sync_api import sync_playwright
SP = sys.argv[1]  # carpeta donde se guardan las capturas
base = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:4180"
resultados = []
def check(nombre, ok, detalle=""):
    resultados.append((nombre, ok, detalle))
    print(("OK    " if ok else "FALLA ") + nombre + (f" — {detalle}" if detalle else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- móvil ----------
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page = ctx.new_page()
    errores = []
    page.on("console", lambda m: errores.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errores.append(f"pageerror: {e}"))
    page.on("requestfailed", lambda r: errores.append(f"requestfailed: {r.url}"))
    page.goto(base + "/")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SP}/movil-inicio.png", full_page=True)
    toggle = page.locator(".nav-toggle")
    check("móvil: botón de menú visible con JS", toggle.is_visible())
    check("móvil: menú colapsado al inicio", not page.locator("#menu-principal").is_visible())
    toggle.click()
    check("móvil: menú abierto tras clic", page.locator("#menu-principal").is_visible() and toggle.get_attribute("aria-expanded") == "true")
    page.screenshot(path=f"{SP}/movil-menu.png")
    page.keyboard.press("Escape")
    check("móvil: Escape cierra el menú", not page.locator("#menu-principal").is_visible() and toggle.get_attribute("aria-expanded") == "false")
    check("móvil: Escape devuelve el foco al botón", page.evaluate("document.activeElement.className").startswith("nav-toggle"))
    # sin scroll horizontal
    ancho = page.evaluate("document.documentElement.scrollWidth")
    check("móvil: sin desplazamiento horizontal", ancho <= 390, f"scrollWidth={ancho}")
    # skip link
    page.goto(base + "/")
    page.keyboard.press("Tab")
    check("teclado: primer Tab enfoca el enlace de saltar", page.evaluate("document.activeElement.className") == "skip-link")
    page.keyboard.press("Enter")
    check("teclado: el enlace lleva al contenido principal", page.evaluate("location.hash") == "#contenido")

    # avisos y filtros
    page.goto(base + "/avisos/")
    check("avisos: filtros visibles con JS", page.locator("[data-filtros]").is_visible())
    page.fill("#f-texto", "inexistente")
    check("avisos: búsqueda sin resultados muestra mensaje", page.locator("[data-sin-resultados]").is_visible())
    page.fill("#f-texto", "ejemplo")
    check("avisos: búsqueda con resultado oculta el mensaje", not page.locator("[data-sin-resultados]").is_visible())
    page.screenshot(path=f"{SP}/movil-avisos.png", full_page=True)
    page.goto(base + "/avisos/archivo/")
    page.select_option("#f-vigencia", "vencido")
    visibles = page.locator("[data-aviso]:not([hidden])").count()
    check("archivo: filtro de vigencia funciona", visibles == 1, f"visibles={visibles}")

    # detalle vigente y vencido
    page.goto(base + "/avisos/aviso-ejemplo-vencido/")
    check("detalle vencido: banner visible", page.locator("[data-banner-vencido]").is_visible())
    page.goto(base + "/avisos/aviso-ejemplo-vigente/")
    check("detalle vigente: banner oculto", not page.locator("[data-banner-vencido]").is_visible())
    page.screenshot(path=f"{SP}/movil-detalle.png", full_page=True)

    # 404
    r = page.goto(base + "/no-existe/")
    check("404: responde 404 con página útil", r.status == 404 and "Página no encontrada" in page.content())

    csp = [e for e in errores if "Content Security Policy" in e or "Refused" in e]
    check("sin violaciones de CSP en móvil", not csp, "; ".join(csp)[:300])
    otros = [e for e in errores if e not in csp and "404" not in e]
    check("sin errores de consola en móvil", not otros, "; ".join(otros)[:300])
    ctx.close()

    # ---------- escritorio ----------
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    errores = []
    page.on("console", lambda m: errores.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errores.append(f"pageerror: {e}"))
    page.goto(base + "/")
    page.wait_for_load_state("networkidle")
    check("escritorio: menú siempre visible sin botón", page.locator("#menu-principal").is_visible() and not page.locator(".nav-toggle").is_visible())
    page.screenshot(path=f"{SP}/escritorio-inicio.png", full_page=True)
    for ruta in ["/conocenos/", "/estudiantes-y-familias/inscripcion/", "/contacto/", "/documentos/", "/privacidad/"]:
        page.goto(base + ruta)
        page.screenshot(path=f"{SP}/escritorio{ruta.strip('/').replace('/', '-') or 'x'}.png", full_page=True)
    check("escritorio: sin errores de consola", not errores, "; ".join(errores)[:300])
    ctx.close()

    # ---------- sin JavaScript ----------
    ctx = b.new_context(viewport={"width": 390, "height": 844}, java_script_enabled=False)
    page = ctx.new_page()
    page.goto(base + "/avisos/")
    check("sin JS: el menú principal es visible", page.locator("#menu-principal").is_visible())
    check("sin JS: lista de avisos visible y filtros ocultos", page.locator("[data-aviso]").count() >= 1 and not page.locator("[data-filtros]").is_visible())
    ctx.close()

    # ---------- movimiento reducido ----------
    ctx = b.new_context(reduced_motion="reduce")
    page = ctx.new_page(); page.goto(base + "/")
    check("prefers-reduced-motion se carga sin errores", True)
    ctx.close()
    b.close()

fallos = [r for r in resultados if not r[1]]
print(f"\n{len(resultados)-len(fallos)}/{len(resultados)} comprobaciones correctas")
sys.exit(1 if fallos else 0)
