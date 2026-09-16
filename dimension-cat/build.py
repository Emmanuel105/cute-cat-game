#!/usr/bin/env python3
"""Concatenate src/ into a single playable HTML file (and an artifact body variant)."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)

head = (SRC / '00-head.html').read_text()
js_files = sorted(p for p in SRC.glob('*.js'))
js = '\n\n'.join(p.read_text() for p in js_files)

body = head + '\n<script type="module">\n' + js + '\n</script>\n'

standalone = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
              + body.replace('<title>Dimension Cat</title>\n', '<title>Dimension Cat</title>\n</head>\n<body>\n', 1)
              + '</body>\n</html>\n')
# the head/style block must sit in <head>: move <style>…</style> up
m = re.search(r'<link rel="stylesheet"[^\n]*\n(?:<link rel="icon"[^\n]*\n)?<style>.*?</style>\n', standalone, re.S)
style = m.group(0)
standalone = standalone.replace(style, '', 1).replace('</head>', style + '</head>', 1)

(OUT / 'dimension_cat.html').write_text(standalone)
(OUT / 'artifact.html').write_text(body)

# optional local-engine test build: python3 build.py --local path/to/three.module.js
if len(sys.argv) > 2 and sys.argv[1] == '--local':
    local = standalone.replace("'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'", "'./three.module.js'")
    (OUT / 'test_local.html').write_text(local)

print(f"built {len(standalone)//1024} KB standalone, {len(js.splitlines())} lines of JS from {len(js_files)} modules")
