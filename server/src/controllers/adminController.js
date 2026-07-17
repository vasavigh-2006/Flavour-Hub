import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Report from '../models/Report.js';
import { validationResult } from 'express-validator';

export const getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await User.find({
      'subscription.status': { $in: ['active', 'trialing'] },
    })
      .select('username email firstName lastName subscription createdAt')
      .sort({ 'subscription.currentPeriodEnd': -1 });

    res.json({ subscribers });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const reports = await Report.find(query)
      .populate('recipeId', 'title')
      .populate('reporterId', 'username email')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) report.status = status;
    if (notes) report.notes = notes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecipes = await Recipe.countDocuments();
    const totalSubscribers = await User.countDocuments({
      'subscription.status': { $in: ['active', 'trialing'] },
    });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.json({
      stats: {
        totalUsers,
        totalRecipes,
        totalSubscribers,
        pendingReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

