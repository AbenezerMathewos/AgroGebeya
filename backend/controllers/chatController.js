const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');
const notifyUser = require('../utils/notify');
const { getIO } = require('../socket');

// Buyer taps "Message seller" on a product -> finds or creates the thread for that pair.
exports.startOrGetConversation = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot message yourself about your own product' });
    }

    let conversation = await Conversation.findOne({
      product: product._id,
      buyer: req.user._id,
      farmer: product.owner,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        product: product._id,
        buyer: req.user._id,
        farmer: product.owner,
      });
    }

    conversation = await conversation.populate([
      { path: 'product', select: 'title images' },
      { path: 'buyer', select: 'name' },
      { path: 'farmer', select: 'name' },
    ]);

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Could not start conversation', error: error.message });
  }
};

// All threads the logged-in user (buyer or farmer) is part of, newest first,
// each with the other participant's name and how many unread messages are waiting.
exports.getMyConversations = async (req, res) => {
  try {
    const filter = { $or: [{ buyer: req.user._id }, { farmer: req.user._id }] };
    const conversations = await Conversation.find(filter)
      .populate('product', 'title images')
      .populate('buyer', 'name role cooperativeName phone')
      .populate('farmer', 'name role cooperativeName phone')
      .sort({ lastMessageAt: -1 });

    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversation: c._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        });
        return { ...c.toObject(), unreadCount };
      })
    );

    res.json({ conversations: withUnread });
  } catch (error) {
    res.status(500).json({ message: 'Could not load conversations', error: error.message });
  }
};

async function assertParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { error: 'Conversation not found', status: 404 };
  const isParticipant =
    conversation.buyer.toString() === userId.toString() || conversation.farmer.toString() === userId.toString();
  if (!isParticipant) return { error: 'Not part of this conversation', status: 403 };
  return { conversation };
}

// Loads the thread and marks every message not sent by this user as read.
exports.getMessages = async (req, res) => {
  try {
    const { conversation, error, status } = await assertParticipant(req.params.id, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ message: 'Could not load messages', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

    const { conversation, error, status } = await assertParticipant(req.params.id, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
      readBy: [req.user._id],
    });

    conversation.lastMessage = message.text;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const io = getIO();
    if (io) io.to(`conversation:${conversation._id}`).emit('message:new', message);

    const recipientId =
      conversation.buyer.toString() === req.user._id.toString() ? conversation.farmer : conversation.buyer;

    await notifyUser(recipientId, {
      type: 'new_message',
      message: `${req.user.name}: ${message.text.slice(0, 60)}`,
      link: `/messages/${conversation._id}`,
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Could not send message', error: error.message });
  }
};

// Starts or gets a direct conversation between logged-in user and any user (recipientId)
exports.startDirectConversation = async (req, res) => {
  try {
    const { recipientId, initialMessage, productId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'Recipient ID is required' });

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    let conversation = await Conversation.findOne({
      $or: [
        { buyer: req.user._id, farmer: recipient._id },
        { buyer: recipient._id, farmer: req.user._id },
      ],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        buyer: req.user._id,
        farmer: recipient._id,
        product: productId || null,
        lastMessage: initialMessage ? initialMessage.trim() : '',
        lastMessageAt: new Date(),
      });

      if (initialMessage && initialMessage.trim()) {
        await Message.create({
          conversation: conversation._id,
          sender: req.user._id,
          text: initialMessage.trim(),
          readBy: [req.user._id],
        });
      }
    } else if (initialMessage && initialMessage.trim()) {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        text: initialMessage.trim(),
        readBy: [req.user._id],
      });
      conversation.lastMessage = msg.text;
      conversation.lastMessageAt = msg.createdAt;
      await conversation.save();
    }

    conversation = await conversation.populate([
      { path: 'product', select: 'title images' },
      { path: 'buyer', select: 'name role cooperativeName phone' },
      { path: 'farmer', select: 'name role cooperativeName phone' },
    ]);

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Could not start direct conversation', error: error.message });
  }
};

// Returns available verified actors (farmers, cooperatives, buyers, transporters) to start chats with
exports.getChatContacts = async (req, res) => {
  try {
    let users = await User.find({
      _id: { $ne: req.user._id },
      role: { $in: ['farmer', 'cooperative', 'buyer', 'transporter'] },
    })
      .select('name role cooperativeName phone region zone woreda email')
      .sort({ role: 1, name: 1 })
      .limit(30);

    // Auto-seed key Ethiopian actors if the database is newly initialized
    if (users.length < 3) {
      const bcrypt = require('bcryptjs');
      const SEED_PROFILES = [
        {
          name: 'Alemu Wolde',
          email: 'farmer@agrogebeya.et',
          role: 'farmer',
          phone: '+251912345678',
          region: 'South Ethiopia',
          zone: 'Wolaita',
          woreda: 'Sodo Zuria',
          cooperativeName: 'Wolaita Smallholders Union',
          preferredLanguage: 'wot',
        },
        {
          name: 'Tadesse Mengesha (Coop Manager)',
          email: 'cooperative@agrogebeya.et',
          role: 'cooperative',
          phone: '+251933445566',
          region: 'Amhara',
          zone: 'West Gojjam',
          woreda: 'Bahir Dar Zuria',
          cooperativeName: 'Gojjam Union Grain Pool',
          preferredLanguage: 'am',
        },
        {
          name: 'Marta Bekele (Wholesale Grain Merchant)',
          email: 'buyer@agrogebeya.et',
          role: 'buyer',
          phone: '+251911223344',
          region: 'Addis Ababa',
          zone: 'Addis Ababa',
          cooperativeName: 'Addis Grain Commercial Depot',
          preferredLanguage: 'am',
        },
        {
          name: 'Girma Desta (Transporter)',
          email: 'transporter@agrogebeya.et',
          role: 'transporter',
          phone: '+251944556677',
          region: 'South Ethiopia',
          zone: 'Wolaita',
          cooperativeName: 'Ethio-Freight Logistics Union',
          preferredLanguage: 'am',
        },
        {
          name: 'Dawit Kebede (Food Processing Enterprise)',
          email: 'dawit@agrogebeya.et',
          role: 'buyer',
          phone: '+251955667788',
          region: 'Oromia',
          zone: 'East Shewa',
          woreda: 'Adama',
          cooperativeName: 'East Shewa Grain Aggregation',
          preferredLanguage: 'om',
        },
      ];

      for (const p of SEED_PROFILES) {
        const exists = await User.findOne({ email: p.email });
        if (!exists) {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash('Farmer123456', salt);
          await User.create({ ...p, password: hash });
        }
      }

      users = await User.find({
        _id: { $ne: req.user._id },
        role: { $in: ['farmer', 'cooperative', 'buyer', 'transporter'] },
      })
        .select('name role cooperativeName phone region zone woreda email')
        .sort({ role: 1, name: 1 })
        .limit(30);
    }

    res.json({ contacts: users });
  } catch (error) {
    res.status(500).json({ message: 'Could not load contacts', error: error.message });
  }
};
