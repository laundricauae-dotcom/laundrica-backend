const Product = require('../models/Product');  // This is your Service model
const ServiceItem = require('../models/ServiceItem');

exports.getAllServices = async (req, res) => {
  try {
    // Use Product.find() since Product is your Service model
    const services = await Product.find({ isActive: true }).sort('sortOrder');

    console.log(`Found ${services.length} services`);

    res.status(200).json({
      success: true,
      services: services,
      count: services.length
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Product.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const items = await ServiceItem.find({ serviceId: service._id, isActive: true })
      .sort('sortOrder');

    res.status(200).json({ success: true, service, items });
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Product.find({
      category: category,
      isActive: true
    }).sort('sortOrder');

    res.status(200).json({ success: true, services });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getServiceItems = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const items = await ServiceItem.find({ serviceId: serviceId, isActive: true })
      .sort('sortOrder');

    res.status(200).json({
      success: true,
      items: items,
      count: items.length
    });
  } catch (error) {
    console.error('Get service items error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};