const Product = require('../models/Product');

// @route   GET /api/products
// @desc    Browse/search/filter products across all Ethiopian regions
// @query   search=teff&category=grain&region=Oromia&zone=Jimma&grade=Grade 1&minPrice=100&maxPrice=5000&page=1&limit=12
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { search, category, location, region, zone, grade, isCooperativePooled, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }
    if (region) {
      filter.region = { $regex: region, $options: 'i' };
    }
    if (zone) {
      filter.zone = { $regex: zone, $options: 'i' };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (grade) {
      filter.grade = grade;
    }
    if (isCooperativePooled !== undefined) {
      filter.isCooperativePooled = isCooperativePooled === 'true';
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('owner', 'name email phone region zone cooperativeName')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

// @route   GET /api/products/my
// @desc    Get the logged-in farmer/cooperative's own products
// @access  Private (farmer, cooperative)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your products', error: error.message });
  }
};

// @route   GET /api/products/:id
// @desc    View a single product's details
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name email phone region zone cooperativeName');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ product });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error fetching product', error: error.message });
  }
};

// @route   POST /api/products
// @desc    Create a product listing
// @access  Private (farmer, cooperative)
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      price,
      quantity,
      unit,
      minOrderQuantity,
      grade,
      region,
      zone,
      woreda,
      location,
      description,
      images,
      harvestDate,
      availableUntil,
      isAvailable,
      isCooperativePooled,
      cooperativeName,
    } = req.body;

    if (!title || !category || price === undefined || quantity === undefined || !location) {
      return res.status(400).json({
        message: 'title, category, price, quantity, and location are required',
      });
    }

    const product = await Product.create({
      title,
      category,
      price,
      quantity,
      unit: unit || 'Kg',
      minOrderQuantity: minOrderQuantity || 1,
      grade: grade || 'Grade 2 (Standard Market)',
      region: region || req.user.region || 'Oromia',
      zone: zone || req.user.zone || 'Central',
      woreda: woreda || req.user.woreda || '',
      location,
      description,
      images: Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [],
      harvestDate: harvestDate || Date.now(),
      availableUntil: availableUntil || undefined,
      isAvailable: isAvailable !== false,
      isCooperativePooled: isCooperativePooled || Boolean(req.user.cooperativeName),
      cooperativeName: cooperativeName || req.user.cooperativeName || '',
      owner: req.user._id,
    });

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

// @route   PUT /api/products/:id
// @desc    Update a product (owner only)
// @access  Private (farmer, cooperative, owner)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own products' });
    }

    const allowedFields = [
      'title',
      'category',
      'price',
      'quantity',
      'unit',
      'minOrderQuantity',
      'grade',
      'region',
      'zone',
      'woreda',
      'location',
      'description',
      'images',
      'harvestDate',
      'availableUntil',
      'isAvailable',
      'isCooperativePooled',
      'cooperativeName',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.status(200).json({ product });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

// @route   DELETE /api/products/:id
// @desc    Delete a product (owner or admin)
// @access  Private (farmer who owns it, or admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = product.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

