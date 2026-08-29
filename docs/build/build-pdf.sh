#!/usr/bin/env bash
# Regenera descripcion-arquitectonica-canchasdeportivas.pdf a partir del .md.
# Requiere: pandoc, weasyprint, python3.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MD="$ROOT/descripcion-arquitectonica-canchasdeportivas.md"
OUT="$ROOT/descripcion-arquitectonica-canchasdeportivas.pdf"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 1. Reemplazar la carátula (título + tabla de metadata) por un bloque HTML
#    plano, formato Plantilla ANSI/IEEE Std 1471-2000: sin salto de página,
#    la Sección 1 arranca en la misma página. El .md de trabajo se escribe
#    en docs/ (mismo directorio que el original) para que las rutas
#    relativas ../DiagramasC4/... resuelvan igual al convertir a HTML.
python3 - "$MD" "$WORK" <<'PYEOF'
import re, sys
src_path, work = sys.argv[1], sys.argv[2]
src = open(src_path, encoding="utf-8").read()

cover_pattern = re.compile(
    r"# Documento de Descripción Arquitectónica\n\n## Proyecto CanchasDeportivas\n\n(\|.*?\n)+",
    re.S,
)
m = cover_pattern.search(src)
assert m, "cover block not found"
# Portada APA 7 (papel de estudiante): título, autores, afiliación/materia, fecha.
cover_html = '''<div class="cover">
<p class="cover-university">UNIVERSIDAD POLIT&Eacute;CNICA SALESIANA</p>
<p class="cover-title">Documento de Descripci&oacute;n Arquitect&oacute;nica<br>CanchasDeportivas: Sistema de Reserva de Canchas Deportivas</p>
<div class="cover-meta">
<p><strong>Integrantes:</strong> Cristian Jimenez, Wilson Cabrera y Brando Cabrera</p>
<p><strong>Profesor:</strong> Christian Merch&aacute;n Mill&aacute;n</p>
<p>Desarrollo de Aplicaciones Empresariales</p>
<p>Maestr&iacute;a en Ingenier&iacute;a de Software</p>
<p>29 de agosto de 2026</p>
</div>
</div>
'''
src = src[:m.start()] + cover_html + src[m.end():]

# Envolver cada imagen markdown en <figure class="diagram"> para que el CSS
# (max-width/max-height/object-fit) la escale al ancho de página — sin esto
# weasyprint inserta el PNG a tamaño nativo y desborda varias páginas.
def img_repl(match):
    alt, src_path = match.group(1), match.group(2)
    return f'<figure class="diagram"><img src="{src_path}" alt="{alt}"></figure>'
src = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", img_repl, src)

open(f"{work}/doc.md", "w", encoding="utf-8").write(src)
PYEOF

# 2. pandoc: markdown -> HTML, sin índice (la Plantilla ANSI/IEEE no lleva uno).
#    El .md y el .html intermedios se escriben en docs/ (no en $WORK) para
#    que las imágenes relativas (../DiagramasC4/...) resuelvan igual que en
#    el editor: weasyprint resuelve rutas relativas contra la ubicación del
#    .html, no contra el cwd.
TMP_MD="$ROOT/.doc-build-tmp.md"
TMP_HTML="$ROOT/.doc-build-tmp.html"
cp "$WORK/doc.md" "$TMP_MD"
trap 'rm -rf "$WORK" "$TMP_MD" "$TMP_HTML"' EXIT

pandoc "$TMP_MD" -f markdown+raw_html -t html5 --standalone \
  --metadata pagetitle="Documento de Descripción Arquitectónica — CanchasDeportivas" \
  --css "$ROOT/build/style.css" -o "$TMP_HTML"

weasyprint "$TMP_HTML" "$OUT"
echo "OK -> $OUT"
