#!/usr/bin/env node
// scripts/convert-images.js
// Genera versiones WebP y LQIP (miniaturas borrosas) para las imágenes en /public/assets

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

async function exists(p){
  try{ await fs.access(p); return true; } catch { return false; }
}

async function processFile(file){
  const ext = path.extname(file).toLowerCase();
  if(!['.jpg','.jpeg','.png'].includes(ext)) return;
  const dir = path.dirname(file);
  const base = path.basename(file, ext);
  const webp = path.join(dir, base + '.webp');
  const lqip = path.join(dir, base + '-lqip.jpg');

  try{
    if(!(await exists(webp))){
      await sharp(file).webp({quality:80}).toFile(webp);
      console.log('Created:', path.relative(process.cwd(), webp));
    }

    if(!(await exists(lqip))){
      await sharp(file).resize({width:40}).blur(1).jpeg({quality:40}).toFile(lqip);
      console.log('Created:', path.relative(process.cwd(), lqip));
    }
  }catch(err){
    console.error('Error processing', file, err.message || err);
  }
}

async function walk(dir){
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for(const ent of entries){
    const full = path.join(dir, ent.name);
    if(ent.isDirectory()) await walk(full);
    else await processFile(full);
  }
}

async function main(){
  if(!await exists(assetsDir)){
    console.error('Assets folder not found at', assetsDir);
    process.exit(1);
  }
  console.log('Scanning assets in', assetsDir);
  await walk(assetsDir);
  console.log('Done.');
}

main().catch(err=>{ console.error(err); process.exit(1); });
