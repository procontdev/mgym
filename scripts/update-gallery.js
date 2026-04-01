#!/usr/bin/env node
// scripts/update-gallery.js
// Después de generar .webp y -lqip.jpg, actualiza las etiquetas <img class="gallery__thumb"> en public/index.html

const fs = require('fs').promises;
const path = require('path');

const INDEX = path.join(__dirname, '..', 'public', 'index.html');
const ASSETS_DIR = 'assets';

function escapeAttr(s){ return s.replace(/"/g, '&quot;'); }

async function main(){
  let html = await fs.readFile(INDEX, 'utf8');

  // Regex para encontrar las imgs de la galería
  const re = /<img([^>]*class="[^"]*gallery__thumb[^"]*"[^>]*)>/g;
  html = html.replace(re, (match, attrs) => {
    // extraer src, alt, srcset, sizes, decoding, loading, data-full
    const get = (name) => {
      const r = new RegExp(name + '\\s*=\\s*"([^"]+)"');
      const m = attrs.match(r);
      return m ? m[1] : null;
    };

    const src = get('src') || '';
    const alt = get('alt') || '';
    const sizes = get('sizes');
    const decoding = get('decoding');
    const loading = get('loading') || 'lazy';
    const dataFull = get('data-full') || src;

    const parsed = path.parse(src);
    const base = parsed.name;
    const webp = path.posix.join(ASSETS_DIR, base + '.webp');
    const lqip = path.posix.join(ASSETS_DIR, base + '-lqip.jpg');
    const thumb = src;

    // construir nuevo atributo srcset preferente webp
    const srcsetParts = [];
    // LQIP tiny for fallback in src, but include thumb and webp in srcset
    if(lqip) srcsetParts.push(`${lqip} 40w`);
    srcsetParts.push(`${webp} 600w`);
    srcsetParts.push(`${webp} 1200w`);

    const srcset = srcsetParts.join(', ');

    const newTag = `<img class="gallery__thumb enhance" src="${escapeAttr(lqip)}" data-thumb="${escapeAttr(thumb)}" data-full="${escapeAttr(webp)}" alt="${escapeAttr(alt)}" loading="${escapeAttr(loading)}" decoding="${escapeAttr(decoding||'async')}" srcset="${escapeAttr(srcset)}" ${sizes ? `sizes="${escapeAttr(sizes)}"` : ''}>`;

    return newTag;
  });

  await fs.writeFile(INDEX, html, 'utf8');
  console.log('Updated', INDEX);
}

main().catch(err=>{ console.error(err); process.exit(1); });
