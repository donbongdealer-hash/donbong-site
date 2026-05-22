#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const UPLOADS = path.resolve(__dirname, '..', 'public', 'uploads')

function findImages(dir){
  const exts = ['.png','.jpg','.jpeg','.webp']
  let out = []
  if(!fs.existsSync(dir)) return out
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for(const it of items){
    const full = path.join(dir, it.name)
    if(it.isDirectory()) out = out.concat(findImages(full))
    else if(exts.includes(path.extname(it.name).toLowerCase())) out.push(full)
  }
  return out
}

async function main(){
  let sharp
  try{
    sharp = require('sharp')
  }catch(e){
    console.warn('[optimize-assets] `sharp` not installed — skipping optimization.')
    console.warn('Run `npm i -D sharp` to enable image optimization in CI/local builds.')
    return
  }

  const images = findImages(UPLOADS)
  if(images.length===0){
    console.info('[optimize-assets] no images found in', UPLOADS)
    return
  }

  console.info('[optimize-assets] optimizing', images.length, 'images')
  for(const img of images){
    try{
      const ext = path.extname(img).toLowerCase()
      const base = img.slice(0, -ext.length)

      // Determine resizing rules
      const rel = path.relative(UPLOADS, img).replace(/\\/g, '/')
      const name = path.basename(img).toLowerCase()
      const isHero = /(^|\/)hero|hero-/i.test(rel) || /hero/i.test(name)
      const isProduct = /product|products|catalog|shop|item/i.test(rel) || /product|prod|item/i.test(name)

      const meta = await sharp(img).metadata()
      let pipeline = sharp(img)

      if(isHero){
        if(meta.width && meta.width > 1920){
          pipeline = pipeline.resize({ width: 1920 })
        }
      }else if(isProduct){
        if(meta.width && meta.width > 800){
          pipeline = pipeline.resize({ width: 800 })
        }
      }

      const webpDest = base + '.webp'
      await pipeline.webp({ quality: 80 }).toFile(webpDest)

      if(typeof sharp().avif === 'function'){
        const avifDest = base + '.avif'
        // recreate pipeline for AVIF to avoid reusing transformed stream
        let avifPipeline = sharp(img)
        if(isHero && meta.width && meta.width > 1920){
          avifPipeline = avifPipeline.resize({ width: 1920 })
        }else if(isProduct && meta.width && meta.width > 800){
          avifPipeline = avifPipeline.resize({ width: 800 })
        }
        await avifPipeline.avif({ quality: 50 }).toFile(avifDest)
      }

      console.info('Optimized:', rel)
    }catch(err){
      console.warn('Failed to optimize', img, err.message || err)
    }
  }
}

main().catch(err=>{
  console.error(err)
  process.exitCode = 1
})
