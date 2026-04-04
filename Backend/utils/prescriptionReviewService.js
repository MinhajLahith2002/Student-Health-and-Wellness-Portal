import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { UPLOAD_ROOT } from '../middleware/uploadMiddleware.js';
import crypto from 'crypto';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory cache for prescription reviews (24-hour TTL)
const reviewCache = new Map();

function getReviewMode() {
  return (process.env.PRESCRIPTION_REVIEW_MODE || 'auto').trim().toLowerCase();
}
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(imageUrl, studentName, doctorName) {
  return crypto.createHash('md5').update(`${imageUrl}-${studentName}-${doctorName}`).digest('hex');
}

function getCachedReview(cacheKey) {
  const cached = reviewCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) reviewCache.delete(cacheKey); // Clean up expired cache
  return null;
}

function setCacheReview(cacheKey, data) {
  reviewCache.set(cacheKey, { data, timestamp: Date.now() });
}

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

function getOpenAIVisionModel() {
  return process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
}

function getGoogleApiKey() {
  return process.env.GOOGLE_API_KEY || '';
}

function getGoogleGeminiModel() {
  return process.env.GOOGLE_GEMINI_MODEL || process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';
}

function getGeminiFallbackModel(currentModel = '') {
  if (currentModel === 'gemini-2.0-flash') {
    return null;
  }

  return 'gemini-2.0-flash';
}

function getMimeTypeFromUrl(imageUrl = '') {
  const normalizedUrl = imageUrl.toLowerCase().split('?')[0];

  if (normalizedUrl.endsWith('.pdf')) return 'application/pdf';
  if (normalizedUrl.endsWith('.png')) return 'image/png';
  if (normalizedUrl.endsWith('.webp')) return 'image/webp';
  if (normalizedUrl.endsWith('.gif')) return 'image/gif';
  if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) return 'image/jpeg';

  return null;
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = [];

  output.forEach((item) => {
    const contents = Array.isArray(item?.content) ? item.content : [];
    contents.forEach((content) => {
      if (content?.type === 'output_text' && typeof content?.text === 'string') {
        textParts.push(content.text);
      }
    });
  });

  return textParts.join('\n').trim();
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const textParts = [];

  candidates.forEach((candidate) => {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    parts.forEach((part) => {
      if (typeof part?.text === 'string') {
        textParts.push(part.text);
      }
    });
  });

  return textParts.join('\n').trim();
}

function parseJsonResponse(outputText) {
  const normalized = outputText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(normalized);
}

function getFallbackReview(prescription, duplicateCount = 0, options = {}) {
  const { configured = false, reason = '' } = options;
  const checks = [
    {
      label: 'Document uploaded',
      status: prescription.imageUrl ? 'pass' : 'fail',
      detail: prescription.imageUrl ? 'Prescription image is attached.' : 'No prescription image is attached.'
    },
    {
      label: 'Student identified',
      status: prescription.studentName ? 'pass' : 'warning',
      detail: prescription.studentName ? `Student name recorded as ${prescription.studentName}.` : 'Student name is missing.'
    },
    {
      label: 'Doctor details present',
      status: prescription.doctorName ? 'pass' : 'warning',
      detail: prescription.doctorName ? `Doctor field currently shows ${prescription.doctorName}.` : 'Doctor name is missing from metadata.'
    },
    {
      label: 'Prescription age',
      status: prescription.expiresAt && new Date(prescription.expiresAt) < new Date() ? 'fail' : 'pass',
      detail:
        prescription.expiresAt && new Date(prescription.expiresAt) < new Date()
          ? 'Prescription appears to be expired.'
          : 'Prescription is still within the stored validity window.'
    },
    {
      label: 'Duplicate submission risk',
      status: duplicateCount > 1 ? 'warning' : 'pass',
      detail:
        duplicateCount > 1
          ? `There are ${duplicateCount} recent submissions for this student with similar timing.`
          : 'No obvious duplicate pattern was found in recent submissions.'
    }
  ];

  const warnings = [];

  if (!prescription.imageUrl) warnings.push('No image is attached, so the pharmacist should request a re-upload.');
  if (!prescription.notes) warnings.push('No student notes were provided.');
  if (duplicateCount > 1) warnings.push('Review for possible duplicate upload before approval.');
  if (prescription.doctorId?.toString() === prescription.studentId?.toString()) {
    warnings.push('Uploaded prescriptions currently store the student as the doctor metadata, so verify the prescriber manually from the image.');
  }

  return {
    mode: 'rule-based',
    providerConfigured: configured,
    summary: configured
      ? 'AI vision was unavailable for this prescription, so this assistant generated a metadata-based review. Use it as a checklist and verify the prescription image manually.'
      : 'AI vision is not configured, so this assistant generated a metadata-based review. Use it as a checklist and verify the prescription image manually.',
    extracted: {
      studentName: prescription.studentName || null,
      doctorName: prescription.doctorName || null,
      uploadedAt: prescription.createdAt || null,
      notes: prescription.notes || null
    },
    warnings,
    checks,
    recommendation:
      warnings.length === 0
        ? 'Metadata looks reviewable. Confirm the prescriber name, date, and medicines from the image before approving.'
        : 'Manual inspection is strongly recommended before approving this prescription.',
    ...(reason ? { error: reason } : {})
  };
}

async function buildImageInput(imageUrl) {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('data:')) {
    const mimeMatch = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!mimeMatch) return null;

    return {
      dataUrl: imageUrl,
      mimeType: mimeMatch[1],
      base64Data: mimeMatch[2]
    };
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || getMimeTypeFromUrl(imageUrl) || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      dataUrl: `data:${contentType};base64,${base64Data}`,
      mimeType: contentType,
      base64Data
    };
  }

  if (!imageUrl.startsWith('/uploads/')) {
    return null;
  }

  const absolutePath = path.join(UPLOAD_ROOT, imageUrl.replace(/^\/uploads\/+/, ''));
  const mimeType = getMimeTypeFromUrl(imageUrl);
  if (!mimeType) return null;

  const fileBuffer = await readFile(absolutePath);
  const base64Data = fileBuffer.toString('base64');

  return {
    dataUrl: `data:${mimeType};base64,${base64Data}`,
    mimeType,
    base64Data
  };
}
async function localOcrText(imageUrl) {
  const imageInput = await buildImageInput(imageUrl);
  if (!imageInput) return null;

  const buffer = Buffer.from(imageInput.base64Data, 'base64');

  const { data } = await Tesseract.recognize(buffer, 'eng', {
    logger: () => {}
  });

  return typeof data?.text === 'string' ? data.text.trim() : null;
}

async function getLocalOcrReview(prescription, duplicateCount = 0) {
  const text = await localOcrText(prescription.imageUrl);

  const extracted = {
    studentName: prescription.studentName || null,
    doctorName: prescription.doctorName || null,
    uploadedAt: prescription.createdAt || null,
    notes: prescription.notes || null,
    rawText: text || null
  };

  const warnings = [];
  if (!text) warnings.push('OCR did not return readable text.');

  const checks = [
    {
      label: 'Document uploaded',
      status: prescription.imageUrl ? 'pass' : 'fail',
      detail: prescription.imageUrl ? 'Prescription image is attached.' : 'No prescription image is attached.'
    },
    {
      label: 'OCR extracted text',
      status: text ? 'pass' : 'warning',
      detail: text ? 'Text was extracted from prescription image.' : 'No OCR text extracted.'
    }
  ];

  return {
    mode: 'local-ocr',
    providerConfigured: true,
    provider: 'local',
    summary: text ? 'Local OCR extracted text from prescription image.' : 'Local OCR did not extract text.',
    extracted,
    warnings,
    checks,
    recommendation: text
      ? 'Verify extracted data and confirm prescription details.'
      : 'Manual inspection is needed because OCR could not extract text.',
    fromCache: false
  };
}
async function getOpenAIReview(prescription, duplicateCount = 0) {
  const openAIApiKey = getOpenAIApiKey();
  const openAIVisionModel = getOpenAIVisionModel();

  if (!openAIApiKey) {
    return getFallbackReview(prescription, duplicateCount);
  }

  const imageInput = await buildImageInput(prescription.imageUrl);
  if (!imageInput) {
    return getFallbackReview(prescription, duplicateCount, {
      configured: true,
      reason: 'Prescription image could not be prepared for AI review.'
    });
  }

  const prompt = [
    'You are assisting a campus pharmacist with prescription verification.',
    'Read the prescription image and return strict JSON only.',
    'Never claim certainty when text is unclear.',
    'Return an object with keys: summary, extracted, warnings, checks, recommendation.',
    'The extracted object must include patientName, doctorName, prescriptionDate, medicines, legibility.',
    'The medicines field must be an array of objects with name, dosage, frequency, and notes.',
    'The checks field must be an array of objects with label, status, detail, where status is one of pass, warning, fail.',
    `Student metadata: ${JSON.stringify({
      studentName: prescription.studentName,
      doctorName: prescription.doctorName,
      notes: prescription.notes || '',
      duplicateCount
    })}`
  ].join(' ');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify({
      model: openAIVisionModel,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageInput.dataUrl }
          ]
        }
      ]
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || 'OpenAI review failed';
    throw new Error(message);
  }

  const outputText = extractOutputText(payload);
  const parsed = parseJsonResponse(outputText);

  return {
    mode: 'openai',
    providerConfigured: true,
    model: openAIVisionModel,
    summary: parsed.summary,
    extracted: parsed.extracted,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    checks: Array.isArray(parsed.checks) ? parsed.checks : [],
    recommendation: parsed.recommendation
  };
}

async function requestGeminiReview(modelName, imageInput, prompt) {
  const googleApiKey = getGoogleApiKey();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(googleApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: imageInput.mimeType,
                  data: imageInput.base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || 'Gemini review failed';
    throw new Error(message);
  }

  const outputText = extractGeminiText(payload);
  return parseJsonResponse(outputText);
}

async function getGeminiReview(prescription, duplicateCount = 0) {
  const googleApiKey = getGoogleApiKey();
  const googleGeminiModel = getGoogleGeminiModel();

  if (!googleApiKey) {
    return getFallbackReview(prescription, duplicateCount);
  }

  // Check cache first
  const cacheKey = getCacheKey(prescription.imageUrl, prescription.studentName, prescription.doctorName);
  const cachedResult = getCachedReview(cacheKey);
  if (cachedResult) {
    return { ...cachedResult, fromCache: true };
  }

  const imageInput = await buildImageInput(prescription.imageUrl);
  if (!imageInput) {
    return getFallbackReview(prescription, duplicateCount, {
      configured: true,
      reason: 'Prescription image could not be prepared for Gemini review.'
    });
  }

  const prompt = [
    'You are assisting a campus pharmacist with prescription verification.',
    'Read the prescription image and return strict JSON only.',
    'Never claim certainty when text is unclear.',
    'Return an object with keys: summary, extracted, warnings, checks, recommendation.',
    'The extracted object must include patientName, doctorName, prescriptionDate, medicines, legibility.',
    'The medicines field must be an array of objects with name, dosage, frequency, and notes.',
    'The checks field must be an array of objects with label, status, detail, where status is one of pass, warning, fail.',
    `Student metadata: ${JSON.stringify({
      studentName: prescription.studentName,
      doctorName: prescription.doctorName,
      notes: prescription.notes || '',
      duplicateCount
    })}`
  ].join(' ');

  let parsed;
  let resolvedModel = googleGeminiModel;

  try {
    parsed = await requestGeminiReview(resolvedModel, imageInput, prompt);
  } catch (error) {
    const fallbackModel = getGeminiFallbackModel(resolvedModel);
    const canRetryWithFallbackModel =
      fallbackModel &&
      /not found|not supported/i.test(error.message || '');

    if (!canRetryWithFallbackModel) {
      throw error;
    }

    resolvedModel = fallbackModel;
    parsed = await requestGeminiReview(resolvedModel, imageInput, prompt);
  }

  const result = {
    mode: 'gemini',
    providerConfigured: true,
    provider: 'google',
    model: resolvedModel,
    summary: parsed.summary,
    extracted: parsed.extracted,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    checks: Array.isArray(parsed.checks) ? parsed.checks : [],
    recommendation: parsed.recommendation
  };

  // Cache the result
  setCacheReview(cacheKey, result);

  return result;
}

export async function generatePrescriptionReview(prescription, duplicateCount = 0) {
  const mode = getReviewMode();

  try {
    if (mode === 'local-ocr') {
      return await getLocalOcrReview(prescription, duplicateCount);
    }

    if (mode === 'google' && getGoogleApiKey()) {
      return await getGeminiReview(prescription, duplicateCount);
    }

    if (mode === 'openai' && getOpenAIApiKey()) {
      return await getOpenAIReview(prescription, duplicateCount);
    }

    // Auto resolution order: Google -> OpenAI -> local OCR -> fallback
    if (mode === 'auto') {
      if (getGoogleApiKey()) {
        return await getGeminiReview(prescription, duplicateCount);
      }
      if (getOpenAIApiKey()) {
        return await getOpenAIReview(prescription, duplicateCount);
      }
      return await getLocalOcrReview(prescription, duplicateCount);
    }

    // Fallback for invalid mode or missing keys
    if (mode === 'google' && !getGoogleApiKey()) {
      return await getLocalOcrReview(prescription, duplicateCount);
    }

    if (mode === 'openai' && !getOpenAIApiKey()) {
      return await getLocalOcrReview(prescription, duplicateCount);
    }

    return getFallbackReview(prescription, duplicateCount, {
      configured: Boolean(getGoogleApiKey() || getOpenAIApiKey()),
      reason: `Unsupported review mode: ${mode}`
    });
  } catch (error) {
    if (mode !== 'local-ocr') {
      // fallback to local OCR if AI request fails
      try {
        return await getLocalOcrReview(prescription, duplicateCount);
      } catch (localError) {
        // fall through to fallback review
      }
    }

    return getFallbackReview(prescription, duplicateCount, {
      configured: Boolean(getGoogleApiKey() || getOpenAIApiKey()),
      reason: error.message
    });
  }
}

export function isOpenAIConfigured() {
  return Boolean(getOpenAIApiKey() || getGoogleApiKey());
}
