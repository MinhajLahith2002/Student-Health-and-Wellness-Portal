// controllers/faqController.js

import FAQ from '../models/FAQ.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all FAQs
// @route   GET /api/faq
// @access  Public
const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') query.category = category;

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create FAQ
// @route   POST /api/faq
// @access  Private/Admin
const createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create({
      ...req.body,
      createdBy: req.user?.id
    });

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'FAQ Created',
      module: 'FAQ',
      details: `Created FAQ: ${faq.question}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update FAQ
// @route   PUT /api/faq/:id
// @access  Private/Admin
const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'FAQ Updated',
      module: 'FAQ',
      details: `Updated FAQ: ${faq.question}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/faq/:id
// @access  Private/Admin
const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'FAQ Deleted',
      module: 'FAQ',
      details: `Deleted FAQ: ${faq.question}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warn',
      timestamp: Date.now()
    });

    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
};
