const Product = require('../models/Product');
const ServiceItem = require('../models/ServiceItem');

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort('sortOrder');

    console.log(`Found ${services.length} services`); // Debug log

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
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getServiceItems = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const items = await ServiceItem.find({ serviceId: serviceId });

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