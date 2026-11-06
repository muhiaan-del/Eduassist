import { createWorker } from 'tesseract.js'
import path from 'path'
import fs from 'fs'

let worker: any = null

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  if (!worker) {
    console.log('Initializing Tesseract worker...')

    // 1. Use /tmp for Vercel compatibility if available, otherwise local folder
    const isVercel = process.env.VERCEL === '1'
    const langCacheDir = isVercel 
      ? '/tmp/.tesseract-lang' 
      : path.join(process.cwd(), '.tesseract-lang')

    if (!fs.existsSync(langCacheDir)) {
      fs.mkdirSync(langCacheDir, { recursive: true })
    }

    // 2. Download language data once
    const langFile = path.join(langCacheDir, 'eng.traineddata.gz')
    if (!fs.existsSync(langFile)) {
      console.log('Downloading English language data (one-time)...')
      const res = await fetch('https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz')
      if (!res.ok) throw new Error(`Failed to download lang data: ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(langFile, buffer)
      console.log('Language data downloaded.')
    }

    // 3. Set paths
    const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
    const corePath = path.join(process.cwd(), 'node_modules', 'tesseract.js-core')

    worker = await createWorker('eng', 1, {
      workerPath,
      langPath: langCacheDir,
      corePath,
      cachePath: langCacheDir,
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })

    console.log('Tesseract worker ready.')
  }

  const { data: { text } } = await worker.recognize(imageBuffer)
  return text
}