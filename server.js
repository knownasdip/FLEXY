const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware for parsing JSON and form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Helper to read orders
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading orders file:', error);
    return [];
  }
}

// Helper to write orders
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders file:', error);
  }
}

// API: Place a new order
app.post('/api/orders', (req, res) => {
  const { customerName, customerPhone, customerAddress, deliveryLocation, paymentMethod, items, subtotal, shippingFee, total } = req.body;

  if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide all required customer and order details.' });
  }

  const orders = readOrders();
  const orderId = 'FLX-' + Math.floor(100000 + Math.random() * 900000);
  
  const newOrder = {
    id: orderId,
    customerName,
    customerPhone,
    customerAddress,
    deliveryLocation,
    paymentMethod,
    items,
    subtotal: Number(subtotal),
    shippingFee: Number(shippingFee),
    total: Number(total),
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);

  res.status(201).json({ success: true, order: newOrder });
});

// API: Get all orders (for admin/tracking view)
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json({ success: true, orders: orders.reverse() });
});

// API: Track a specific order by ID or Phone
app.get('/api/orders/track', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter required' });
  }

  const orders = readOrders();
  const matched = orders.filter(o => 
    o.id.toLowerCase() === query.trim().toLowerCase() || 
    o.customerPhone.trim() === query.trim()
  );

  res.json({ success: true, orders: matched });
});

// Fallback all other GET requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
