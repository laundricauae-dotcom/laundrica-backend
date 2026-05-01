const Product = require('../models/Product');
const ServiceItem = require('../models/ServiceItem');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 50 } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .sort('sortOrder')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(8)
      .sort('sortOrder');
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getServiceCategories = async (req, res) => {
  try {
    const serviceCategories = ['laundry', 'dry-cleaning', 'steam-pressing', 'shoe-cleaning', 'carpet-cleaning', 'curtain-cleaning'];
    const services = await Product.find({ category: { $in: serviceCategories }, isActive: true })
      .select('name slug category icon images description');
    res.status(200).json({ success: true, services });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getServiceItemsForProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await ServiceItem.find({ serviceId: id, isActive: true }).sort('sortOrder');
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};