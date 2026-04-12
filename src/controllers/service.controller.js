const ServiceItem = require('../models/ServiceItem');
const Product = require('../models/Product');

exports.getAllServices = async (req, res) => {
  try {
    const services = await Product.find({ 
      category: { $in: ['laundry', 'dry-cleaning', 'steam-pressing', 'shoe-cleaning', 'carpet-cleaning', 'curtain-cleaning', 'commercial'] },
      isActive: true 
    }).sort('sortOrder');
    
    res.status(200).json({ success: true, services });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    const { category } = req.query;
    
    const query = { serviceId, isActive: true };
    if (category) query.category = category;
    
    const items = await ServiceItem.find(query).sort('sortOrder');
    
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const service = await Product.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.status(200).json({ success: true, service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Product.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    // Also delete associated service items
    await ServiceItem.deleteMany({ serviceId: req.params.id });
    
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};