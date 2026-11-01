const FreightTrip = require('../models/FreightTrip');

// @route   GET /api/freight
// @desc    Get scheduled freight trips with filters (origin, destination, date)
// @access  Public
exports.getFreightTrips = async (req, res) => {
  try {
    const { originCity, destinationCity, vehicleType } = req.query;
    const filter = { status: { $in: ['scheduled', 'in_transit'] } };

    if (originCity) filter.originCity = { $regex: originCity, $options: 'i' };
    if (destinationCity) filter.destinationCity = { $regex: destinationCity, $options: 'i' };
    if (vehicleType) filter.vehicleType = vehicleType;

    const trips = await FreightTrip.find(filter)
      .populate('transporter', 'name email phone')
      .sort({ departureDate: 1 });

    res.json({ trips });
  } catch (error) {
    res.status(500).json({ message: 'Could not load freight trips', error: error.message });
  }
};

// @route   POST /api/freight
// @desc    Create a freight trip (transporter, farmer, cooperative)
// @access  Private
exports.createFreightTrip = async (req, res) => {
  try {
    const {
      driverName,
      driverPhone,
      vehicleType,
      plateNumber,
      originRegion,
      originCity,
      destinationRegion,
      destinationCity,
      departureDate,
      totalCapacityQuintals,
      pricePerQuintal,
      isReturnTripDiscount,
      notes,
    } = req.body;

    if (!driverName || !driverPhone || !originCity || !destinationCity || !departureDate || !totalCapacityQuintals || !pricePerQuintal) {
      return res.status(400).json({ message: 'Please provide all required trip details' });
    }

    const trip = await FreightTrip.create({
      transporter: req.user._id,
      driverName,
      driverPhone,
      vehicleType: vehicleType || 'Isuzu NPR (35-50 Quintals)',
      plateNumber: plateNumber || '',
      originRegion: originRegion || 'South Ethiopia',
      originCity,
      destinationRegion: destinationRegion || 'Addis Ababa',
      destinationCity,
      departureDate,
      totalCapacityQuintals: Number(totalCapacityQuintals),
      availableCapacityQuintals: Number(totalCapacityQuintals),
      pricePerQuintal: Number(pricePerQuintal),
      isReturnTripDiscount: isReturnTripDiscount !== false,
      notes: notes || '',
      status: 'scheduled',
    });

    res.status(201).json({ trip });
  } catch (error) {
    res.status(500).json({ message: 'Could not create freight trip', error: error.message });
  }
};

// @route   PATCH /api/freight/:id/book
// @desc    Book cargo capacity on a freight trip
// @access  Private (buyer, farmer)
exports.bookFreightSpace = async (req, res) => {
  try {
    const { quintals } = req.body;
    const requestedQty = Number(quintals);
    if (!requestedQty || requestedQty <= 0) {
      return res.status(400).json({ message: 'Enter a valid number of quintals to book' });
    }

    const trip = await FreightTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Freight trip not found' });

    if (trip.availableCapacityQuintals < requestedQty) {
      return res.status(400).json({
        message: `Only ${trip.availableCapacityQuintals} Quintals available on this truck`,
      });
    }

    trip.availableCapacityQuintals -= requestedQty;
    if (trip.availableCapacityQuintals <= 0) {
      trip.status = 'full';
    }
    await trip.save();

    res.json({ trip, bookedQuintals: requestedQty, totalCost: requestedQty * trip.pricePerQuintal });
  } catch (error) {
    res.status(500).json({ message: 'Could not book freight space', error: error.message });
  }
};

// @route   GET /api/freight/my
// @desc    Get trips created by the logged in transporter/user
// @access  Private
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await FreightTrip.find({ transporter: req.user._id })
      .sort({ departureDate: -1, createdAt: -1 });
    res.json({ trips });
  } catch (error) {
    res.status(500).json({ message: 'Could not load your freight trips', error: error.message });
  }
};

// @route   PATCH /api/freight/:id/status
// @desc    Update trip status (scheduled, in_transit, completed, cancelled)
// @access  Private (transporter or admin)
exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['scheduled', 'full', 'in_transit', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid trip status' });
    }
    const trip = await FreightTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Freight trip not found' });
    if (trip.transporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this trip' });
    }
    trip.status = status;
    await trip.save();
    res.json({ message: `Trip status updated to ${status}`, trip });
  } catch (error) {
    res.status(500).json({ message: 'Could not update trip status', error: error.message });
  }
};

// @route   DELETE /api/freight/:id
// @desc    Delete or cancel a freight trip
// @access  Private (transporter owner or admin)
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await FreightTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Freight trip not found' });
    if (trip.transporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this trip' });
    }
    await trip.deleteOne();
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete trip', error: error.message });
  }
};
