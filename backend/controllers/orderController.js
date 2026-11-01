const https = require('https');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Review  = require('../models/Review');
const notifyUser = require('../utils/notify');

// ── Helper: make an HTTPS request and return parsed JSON ────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from Chapa: ${data}`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Helper: generate unique Chapa tx_ref ────────────────────────────────────
function generateTxRef(orderId) {
  return `AGRO-${orderId}-${Date.now()}`;
}

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/orders
// @desc    Create a buy/order request with commission auto-calculation
// @access  Private (buyer)
// ────────────────────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity, fulfillment, deliveryAddress, contactPhone, paymentMethod, note } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ message: 'This product is no longer available' });
    }
    if (product.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request your own product' });
    }
    if (!quantity || Number(quantity) <= 0 || !contactPhone) {
      return res.status(400).json({ message: 'Quantity and contact phone are required' });
    }

    const qty        = Number(quantity);
    const unitPrice  = product.price;
    const itemsPrice = Math.round(qty * unitPrice * 100) / 100;

    const chosenPayment = paymentMethod || 'chapa';
    const isEscrow      = ['telebirr', 'cbe_birr', 'chapa'].includes(chosenPayment);

    // Legacy escrow simulation for non-Chapa methods
    const escrowTxId        = isEscrow && chosenPayment !== 'chapa' ? `ET-ESCROW-${Date.now().toString().slice(-8)}` : '';
    const initialPayStatus  = isEscrow && chosenPayment !== 'chapa' ? 'escrow_held' : 'pending_payment';

    const order = await Order.create({
      product:    product._id,
      buyer:      req.user._id,
      farmer:     product.owner,
      quantity:   qty,
      unit:       product.unit || 'Kg',
      unitPrice,
      itemsPrice,
      // commissionAmount / sellerPayoutAmount / totalAmount computed by pre-save hook
      fulfillment:         fulfillment || 'pickup',
      deliveryAddress:     deliveryAddress || {},
      contactPhone,
      paymentMethod:       chosenPayment,
      paymentStatus:       initialPayStatus,
      escrowStatus:        'held_in_escrow',
      escrowTransactionId: escrowTxId,
      note: note || '',
      status: 'pending',
    });

    await notifyUser(product.owner, {
      type: 'order_new',
      message: `${req.user.name} requested ${qty} ${product.unit || 'Kg'} of "${product.title}" `
             + `(${itemsPrice.toLocaleString()} ETB via ${chosenPayment.toUpperCase()})`,
      link: '/orders',
    });

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Could not create order request', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/my
// @desc    Get logged-in user's orders (buyer or farmer/cooperative)
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const filter =
      req.user.role === 'farmer' || req.user.role === 'cooperative'
        ? { farmer: req.user._id }
        : { buyer: req.user._id };

    const orders = await Order.find(filter)
      .populate('product', 'title price location images region zone grade')
      .populate('buyer',   'name phone email')
      .populate('farmer',  'name phone email cooperativeName')
      .sort({ createdAt: -1 });

    if (req.user.role === 'buyer') {
      const reviewedIds = await Review.find({
        buyer: req.user._id,
        order: { $in: orders.map((o) => o._id) },
      }).distinct('order');
      const reviewedSet = new Set(reviewedIds.map(String));
      const withFlag = orders.map((o) => ({ ...o.toObject(), reviewed: reviewedSet.has(String(o._id)) }));
      return res.json({ orders: withFlag });
    }

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Could not load orders', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/orders/:id/status
// @desc    Update order status (farmer accepts/ships/completes, buyer confirms)
// @access  Private (farmer, buyer, admin)
// ────────────────────────────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product', 'title price')
      .populate('buyer',   'name')
      .populate('farmer',  'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isFarmer = order.farmer._id.toString() === req.user._id.toString();
    const isBuyer  = order.buyer._id.toString()  === req.user._id.toString();

    if (!isFarmer && !isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const { status, paymentStatus } = req.body;

    if (status) {
      const validStatuses = ['pending', 'accepted', 'in_transit', 'declined', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }
      order.status = status;
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Auto-release escrow when order is completed
    if (status === 'completed' && order.paymentStatus === 'escrow_held') {
      order.paymentStatus  = 'released_to_farmer';
      order.escrowStatus   = 'released_to_seller';
    }

    await order.save();

    const recipient = isFarmer ? order.buyer._id : order.farmer._id;
    await notifyUser(recipient, {
      type: 'order_status',
      message: `Order for "${order.product?.title || 'product'}" is now ${order.status.toUpperCase()} (Payment: ${order.paymentStatus})`,
      link: '/orders',
    });

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Could not update order', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/orders/:id/pay  (legacy simulation endpoint, kept for
//          backward-compat with existing frontend Telebirr / CBE flow)
// @access  Private (buyer)
// ────────────────────────────────────────────────────────────────────────────
exports.payOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product', 'title price location')
      .populate('buyer',   'name phone email')
      .populate('farmer',  'name phone email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const buyerId = (order.buyer?._id || order.buyer)?.toString();
    const isBuyer = buyerId === req.user._id.toString();
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the order creator can complete payment' });
    }

    const { paymentMethod, transactionRef } = req.body;
    const chosenMethod = paymentMethod || order.paymentMethod || 'chapa';
    const txId = transactionRef || `ET-ESCROW-${Date.now().toString().slice(-8)}`;

    const totalAmt = Number(order.totalAmount || order.totalPrice || order.itemsPrice || (order.quantity * (order.unitPrice || 0)) || 0);
    const rate = Number(order.platformCommissionRate) || 0.05;
    const commissionAmt = Math.round(totalAmt * rate * 100) / 100;
    const sellerPayout = Math.round((totalAmt - commissionAmt) * 100) / 100;

    order.itemsPrice          = totalAmt;
    order.totalAmount         = totalAmt;
    order.totalPrice          = totalAmt;
    order.platformCommissionRate = rate;
    order.commissionAmount    = commissionAmt;
    order.sellerPayoutAmount  = sellerPayout;

    order.paymentMethod       = chosenMethod;
    order.paymentStatus       = 'escrow_held';
    order.escrowStatus        = 'held_in_escrow';
    order.escrowTransactionId = txId;
    order.isPaid              = true;
    order.paidAt              = new Date();

    await order.save();

    const buyerName = order.buyer?.name || req.user.name || 'Buyer';
    const farmerId = order.farmer?._id || order.farmer;

    if (farmerId) {
      await notifyUser(farmerId, {
        type: 'order_payment',
        message: `🔒 Escrow Secured: ${buyerName} deposited ${totalAmt.toLocaleString()} ETB via `
               + `${chosenMethod.toUpperCase()} (${txId}). Seller payout: ${sellerPayout.toLocaleString()} ETB.`,
        link: '/orders',
      });
    }

    res.json({
      success: true,
      message: `Escrow payment of ${totalAmt.toLocaleString()} ETB locked. Platform commission: ${commissionAmt.toLocaleString()} ETB (5%).`,
      order,
    });
  } catch (error) {
    console.error('payOrder error:', error);
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   POST /api/orders/pay/chapa/initialize
// @desc    Initialize a real Chapa payment and return the checkout_url
// @access  Private (buyer)
// ────────────────────────────────────────────────────────────────────────────
exports.initializeChapaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId)
      .populate('buyer',   'name email phone')
      .populate('product', 'title');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the order buyer can initiate payment' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'This order has already been paid' });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ message: 'Payment gateway not configured (CHAPA_SECRET_KEY missing)' });
    }

    const tx_ref      = generateTxRef(order._id.toString());
    const backendUrl  = process.env.BACKEND_URL  || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const payload = JSON.stringify({
      amount:       order.totalAmount.toFixed(2),
      currency:     'ETB',
      email:        order.buyer.email,
      first_name:   order.buyer.name.split(' ')[0],
      last_name:    order.buyer.name.split(' ').slice(1).join(' ') || 'User',
      phone_number: order.buyer.phone || '',
      tx_ref,
      callback_url: `${backendUrl}/api/orders/pay/chapa/verify/${tx_ref}`,
      return_url:   `${frontendUrl}/orders?chapa_status=success&tx_ref=${tx_ref}`,
      customization: {
        title:       'AgroGebeya Ethiopia Escrow',
        description: `Payment for order: ${order.product?.title || 'Produce'}`,
      },
    });

    const options = {
      hostname: 'api.chapa.co',
      path:     '/v1/transaction/initialize',
      method:   'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const chapaResponse = await httpsRequest(options, payload);

    if (chapaResponse.status !== 'success') {
      return res.status(502).json({
        message: 'Chapa initialization failed',
        chapaMessage: chapaResponse.message || 'Unknown error',
      });
    }

    // Persist the tx_ref so the verify endpoint can look it up
    order.paymentReference = tx_ref;
    order.chapaCheckoutUrl = chapaResponse.data?.checkout_url || '';
    await order.save();

    res.json({
      success:      true,
      checkout_url: chapaResponse.data?.checkout_url,
      tx_ref,
      commissionAmount:   order.commissionAmount,
      sellerPayoutAmount: order.sellerPayoutAmount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not initialize Chapa payment', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/pay/chapa/verify/:tx_ref
// @desc    Verify Chapa payment and update escrow status
// @access  Private (buyer) / used as Chapa webhook callback_url
// ────────────────────────────────────────────────────────────────────────────
exports.verifyChapaPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    if (!tx_ref) return res.status(400).json({ message: 'tx_ref is required' });

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    const options = {
      hostname: 'api.chapa.co',
      path:     `/v1/transaction/verify/${tx_ref}`,
      method:   'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    };

    const chapaResponse = await httpsRequest(options, null);

    if (chapaResponse.status !== 'success') {
      return res.status(402).json({
        message:      'Payment verification failed or payment not yet completed',
        chapaStatus:  chapaResponse.status,
        chapaMessage: chapaResponse.message,
      });
    }

    // Find the order by tx_ref
    const order = await Order.findOne({ paymentReference: tx_ref })
      .populate('farmer', 'name');

    if (!order) {
      return res.status(404).json({ message: `No order found with tx_ref: ${tx_ref}` });
    }

    if (!order.isPaid) {
      order.isPaid        = true;
      order.paidAt        = new Date();
      order.paymentStatus = 'escrow_held';
      order.escrowStatus  = 'held_in_escrow';
      await order.save();

      const farmerId = order.farmer?._id || order.farmer;
      const payout = Number(order.sellerPayoutAmount) || 0;
      if (farmerId) {
        await notifyUser(farmerId, {
          type:    'order_payment',
          message: `💳 Chapa payment verified for order (${tx_ref}). `
                 + `Seller payout when delivered: ${payout.toLocaleString()} ETB.`,
          link: '/orders',
        });
      }
    }

    res.json({
      success:          true,
      message:          'Payment verified. Funds held in escrow.',
      isPaid:           order.isPaid,
      escrowStatus:     order.escrowStatus,
      sellerPayoutAmount: order.sellerPayoutAmount,
      commissionAmount:   order.commissionAmount,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: 'Chapa verification error', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/orders/:id/release-escrow
// @desc    Admin or buyer confirms delivery; releases escrow to seller
// @access  Private (admin, buyer)
// ────────────────────────────────────────────────────────────────────────────
exports.releaseEscrow = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('farmer', 'name')
      .populate('buyer',  'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const buyerId = (order.buyer?._id || order.buyer)?.toString();
    const isBuyer = buyerId === req.user._id.toString();
    if (!isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the buyer or admin can release escrow' });
    }

    if (order.escrowStatus === 'released_to_seller') {
      return res.status(400).json({ message: 'Escrow has already been released' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'Order has not been paid; nothing to release' });
    }

    order.escrowStatus  = 'released_to_seller';
    order.paymentStatus = 'released_to_farmer';
    order.status        = 'completed';
    await order.save();

    const farmerId = order.farmer?._id || order.farmer;
    const payout = Number(order.sellerPayoutAmount) || 0;
    const farmerName = order.farmer?.name || 'Seller';

    if (farmerId) {
      await notifyUser(farmerId, {
        type:    'order_payment',
        message: `✅ Escrow released! ${payout.toLocaleString()} ETB `
               + `has been disbursed to your account (5% platform commission retained).`,
        link: '/orders',
      });
    }

    res.json({
      success:            true,
      message:            `Escrow released. ${payout.toLocaleString()} ETB disbursed to ${farmerName}.`,
      sellerPayoutAmount: payout,
      commissionAmount:   order.commissionAmount || 0,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not release escrow', error: error.message });
  }
};
