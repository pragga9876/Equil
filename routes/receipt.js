// backend/routes/receipt.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const sharp = require('sharp');
const { parseReceiptText, calculateCarbonFootprint } = require('../utils/receiptUtils');

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024 } });

const SUPPORTED = new Set(['jpg','jpeg','png','bmp','gif','webp','tiff','tif']);

async function callOcrSpace(base64, ext) {
  try {
    const API_KEY = process.env.OCR_SPACE_API_KEY || '';
    // OCR.space expects form-data or urlencoded. Use URLSearchParams for x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('base64Image', `data:image/${ext};base64,${base64}`);
    params.append('language', 'eng');
    params.append('isOverlayRequired', 'false');

    const res = await axios.post('https://api.ocr.space/parse/image', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: API_KEY
      },
      timeout: 60000
    });

    if (!res.data || res.data.IsErroredOnProcessing) {
      console.warn('OCR.space error', res.data ? res.data.ErrorMessage : 'no response');
      return null;
    }
    const parsed = res.data.ParsedResults && res.data.ParsedResults[0];
    return parsed ? (parsed.ParsedText || '').trim() : null;
  } catch (err) {
    console.warn('callOcrSpace error', err.message || err);
    return null;
  }
}

router.post('/parse', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: 'No file uploaded' });

    const originalName = req.file.originalname || 'receipt.jpg';
    const ext = (originalName.split('.').pop() || 'jpg').toLowerCase();
    if (!SUPPORTED.has(ext)) return res.json({ success: false, error: `Unsupported format: ${ext}` });

    // Preprocess (sharp)
    const processed = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .modulate({ brightness: 1.05, saturation: 1.0 })
      .sharpen(1.2)
      .jpeg({ quality: 92 })
      .toBuffer();

    const base64 = processed.toString('base64');

    let extractedText = await callOcrSpace(base64, ext);
    if (!extractedText) {
      // fallback to original
      const origBase64 = req.file.buffer.toString('base64');
      extractedText = await callOcrSpace(origBase64, ext);
    }

    if (!extractedText) {
      return res.json({ success: false, error: 'Could not extract text from image. Try a clearer photo.' });
    }

    const receiptData = parseReceiptText(extractedText);
    const carbonData = await calculateCarbonFootprint(receiptData.items);

    return res.json({
      success: true,
      data: {
        items_found: receiptData.items,
        extracted_text_preview: receiptData.full_text.slice(0, 800),
        carbon_footprint: carbonData
      }
    });
  } catch (err) {
    console.error('parse error', err);
    return res.json({ success: false, error: err.message || 'Server error' });
  }
});
router.get("/receipt", (req, res) => {
    res.render("receipt");
});

module.exports = router;
