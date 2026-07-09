require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// Initialize Supabase Client with robust validation
function getValidSupabaseConfig() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_KEY;

  const clean = (val) => {
    if (!val) return '';
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
    }
    if (s === 'undefined' || s === 'null' || s === 'placeholder' || !s) {
      return '';
    }
    return s;
  };

  url = clean(url);
  key = clean(key);

  const isValidUrl = (str) => {
    try {
      const parsed = new URL(str);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  if (!url || !isValidUrl(url)) {
    url = 'https://jfupywwjdgjtosubgfhl.supabase.co';
  }
  if (!key || key.length < 10) {
    key = 'sb_publishable_PclaqbaXoVijGjcYsvvk0w_shUEhwzJ';
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseConfig();
let supabase = null;
let isUsersTableAvailable = true;

function handleSupabaseTableError(err, context) {
  if (!err) return;
  const msg = err.message || String(err);
  if (
    msg.includes('Could not find the table') || 
    (msg.includes('users') && (msg.includes('relation') || msg.includes('does not exist') || msg.includes('schema cache')))
  ) {
    if (isUsersTableAvailable) {
      isUsersTableAvailable = false;
      console.log(`[INFO] Supabase 'users' table is not available yet. Falling back to local file-based database for users.`);
    }
  } else {
    console.log(`[Supabase Warning] ${context}:`, msg);
  }
}

try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully with:', supabaseUrl);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

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

const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to read users
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Helper to write users
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

// Helper to read reviews
function readReviews() {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      fs.writeFileSync(REVIEWS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading reviews file:', error);
    return [];
  }
}

// Helper to write reviews
function writeReviews(reviews) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  } catch (error) {
    console.error('Error writing reviews file:', error);
  }
}

const GALLERY_FILE = path.join(__dirname, 'gallery.json');

const DEFAULT_GALLERY = [
  {
    photo: "https://images.pexels.com/photos/2772535/pexels-photo-2772535.jpeg?auto=compress&cs=tinysrgb&w=500",
    caption: "Fit exactly like the size finder said — so happy!",
    name: "Rafi H.",
    stars: "★★★★★",
    createdAt: "2026-07-09T00:00:00.000Z"
  },
  {
    photo: "https://images.pexels.com/photos/30462424/pexels-photo-30462424.jpeg?auto=compress&cs=tinysrgb&w=500",
    caption: "Fabric quality is amazing for the price.",
    name: "Nusrat J.",
    stars: "★★★★★",
    createdAt: "2026-07-09T00:00:00.000Z"
  },
  {
    photo: "https://images.pexels.com/photos/17045118/pexels-photo-17045118.jpeg?auto=compress&cs=tinysrgb&w=500",
    caption: "Delivery was quick, shirt looks even better in person.",
    name: "Tanvir A.",
    stars: "★★★★☆",
    createdAt: "2026-07-09T00:00:00.000Z"
  }
];

let isGalleryTableAvailable = true;

function readGallery() {
  try {
    if (!fs.existsSync(GALLERY_FILE)) {
      fs.writeFileSync(GALLERY_FILE, JSON.stringify(DEFAULT_GALLERY, null, 2));
      return DEFAULT_GALLERY;
    }
    const data = fs.readFileSync(GALLERY_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading gallery file:', error);
    return DEFAULT_GALLERY;
  }
}

function writeGallery(gallery) {
  try {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(gallery, null, 2));
  } catch (error) {
    console.error('Error writing gallery file:', error);
  }
}


// ==========================================
//           ADMIN PANEL ENDPOINTS
// ==========================================
const ADMIN_FILE = path.join(__dirname, 'admin.json');
const activeAdminTokens = new Set();

function readAdmin() {
  try {
    if (!fs.existsSync(ADMIN_FILE)) {
      return null;
    }
    const data = fs.readFileSync(ADMIN_FILE, 'utf8');
    return JSON.parse(data || 'null');
  } catch (error) {
    console.error('Error reading admin file:', error);
    return null;
  }
}

function writeAdmin(adminData) {
  try {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminData, null, 2));
  } catch (error) {
    console.error('Error writing admin file:', error);
  }
}

// Middleware to protect admin endpoints
function requireAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin access only.' });
  }
  next();
}

// Check admin configuration status
app.get('/api/admin/status', (req, res) => {
  const admin = readAdmin();
  res.json({ success: true, exists: admin !== null });
});

// Setup admin for the first time
app.post('/api/admin/setup', (req, res) => {
  const admin = readAdmin();
  if (admin !== null) {
    return res.status(400).json({ success: false, message: 'Admin panel is already configured.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  writeAdmin({ email: cleanEmail, password: password });
  res.json({ success: true, message: 'Admin configuration successful.' });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const admin = readAdmin();
  if (admin === null) {
    return res.status(400).json({ success: false, message: 'Admin is not configured yet. Please configure it first.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  if (email.trim().toLowerCase() === admin.email && password === admin.password) {
    const token = 'admin_sess_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    activeAdminTokens.add(token);
    return res.json({ success: true, token, email: admin.email });
  }

  res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
});

// Admin API to get all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    let allUsers = [];
    if (supabase && isUsersTableAvailable) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data) {
          allUsers = data.map(u => ({
            name: u.name,
            emailOrPhone: u.email_or_phone,
            createdAt: u.created_at || new Date().toISOString()
          }));
        } else {
          allUsers = readUsers();
        }
      } catch (e) {
        allUsers = readUsers();
      }
    } else {
      allUsers = readUsers();
    }
    res.json({ success: true, users: allUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
});

// Admin API to get all orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    let allOrders = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          allOrders = data.map(o => ({
            id: o.id,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            customerAddress: o.customer_address,
            deliveryLocation: o.delivery_location,
            paymentMethod: o.payment_method,
            items: o.items,
            subtotal: o.subtotal,
            shippingFee: o.shipping_fee,
            total: o.total,
            status: o.status,
            createdAt: o.created_at
          }));
        } else {
          allOrders = readOrders();
        }
      } catch (e) {
        allOrders = readOrders();
      }
    } else {
      allOrders = readOrders();
    }
    res.json({ success: true, orders: allOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

// Admin API to update order status
app.post('/api/admin/orders/status', requireAdmin, async (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: 'Order ID and status are required.' });
  }

  // Update in local backup first
  const localOrders = readOrders();
  const orderIdx = localOrders.findIndex(o => o.id === orderId);
  if (orderIdx !== -1) {
    localOrders[orderIdx].status = status;
    writeOrders(localOrders);
  }

  // Update in Supabase
  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);
      if (error) {
        console.error('Supabase error updating status:', error.message);
      }
    } catch (e) {
      console.error('Exception updating order status in Supabase:', e);
    }
  }

  res.json({ success: true, message: 'Order status updated successfully.' });
});


// API: Place a new order
app.post('/api/orders', async (req, res) => {
  const { customerName, customerPhone, customerAddress, deliveryLocation, paymentMethod, items, subtotal, shippingFee, total } = req.body;

  if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide all required customer and order details.' });
  }

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

  // Try saving to Supabase
  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          id: newOrder.id,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customer_address: newOrder.customerAddress,
          delivery_location: newOrder.deliveryLocation,
          payment_method: newOrder.paymentMethod,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          shipping_fee: newOrder.shippingFee,
          total: newOrder.total,
          status: newOrder.status,
          created_at: newOrder.createdAt
        }]);

      if (error) {
        console.error('Supabase Error writing order:', error.message);
      } else {
        supabaseSuccess = true;
        console.log('Order saved to Supabase successfully:', orderId);
      }
    } catch (dbErr) {
      console.error('Exception writing order to Supabase:', dbErr);
    }
  }

  // Always save to local backup
  const orders = readOrders();
  orders.push(newOrder);
  writeOrders(orders);

  res.status(201).json({ success: true, order: newOrder, syncedWithSupabase: supabaseSuccess });
});

// API: Get all orders (for admin/tracking view)
app.get('/api/orders', async (req, res) => {
  // Try fetching from Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          deliveryLocation: o.delivery_location,
          paymentMethod: o.payment_method,
          items: o.items,
          subtotal: o.subtotal,
          shippingFee: o.shipping_fee,
          total: o.total,
          status: o.status,
          createdAt: o.created_at
        }));
        return res.json({ success: true, orders: mapped });
      } else if (error) {
        console.error('Supabase Error fetching all orders:', error.message);
      }
    } catch (dbErr) {
      console.error('Exception reading all orders from Supabase:', dbErr);
    }
  }

  const orders = readOrders();
  res.json({ success: true, orders: orders.reverse() });
});

// API: Track a specific order by ID or Phone
app.get('/api/orders/track', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter required' });
  }

  const queryClean = query.trim();

  // Try fetching from Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.ilike.${queryClean},customer_phone.eq.${queryClean}`);

      if (!error && data && data.length > 0) {
        const mapped = data.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          deliveryLocation: o.delivery_location,
          paymentMethod: o.payment_method,
          items: o.items,
          subtotal: o.subtotal,
          shippingFee: o.shipping_fee,
          total: o.total,
          status: o.status,
          createdAt: o.created_at
        }));
        return res.json({ success: true, orders: mapped });
      } else if (error) {
        console.error('Supabase Error tracking order:', error.message);
      }
    } catch (dbErr) {
      console.error('Exception reading orders from Supabase:', dbErr);
    }
  }

  const orders = readOrders();
  const matched = orders.filter(o => 
    o.id.toLowerCase() === queryClean.toLowerCase() || 
    o.customerPhone.trim() === queryClean
  );

  res.json({ success: true, orders: matched });
});

// API: Submit a new review
app.post('/api/reviews', async (req, res) => {
  const { productId, stars, ratingVal, textEn, textBn, author, verified } = req.body;

  if (!productId || !stars || !author) {
    return res.status(400).json({ success: false, message: 'Missing required review fields' });
  }

  const newReview = {
    product_id: productId,
    stars,
    rating_val: ratingVal ? Number(ratingVal) : 5,
    text_en: textEn || '',
    text_bn: textBn || '',
    author,
    verified: !!verified,
    created_at: new Date().toISOString()
  };

  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview]);

      if (error) {
        console.error('Supabase Error submitting review:', error.message);
      } else {
        supabaseSuccess = true;
        console.log('Review saved to Supabase successfully.');
      }
    } catch (dbErr) {
      console.error('Exception writing review to Supabase:', dbErr);
    }
  }

  // Always save to local backup
  const reviews = readReviews();
  reviews.push(newReview);
  writeReviews(reviews);

  res.status(201).json({ success: true, review: newReview, syncedWithSupabase: supabaseSuccess });
});

// API: Fetch reviews for a specific product
app.get('/api/reviews', async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId parameter required' });
  }

  let dbReviews = [];
  let fetchedFromSupabase = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbReviews = data.map(r => ({
          stars: r.stars,
          textEn: r.text_en,
          textBn: r.text_bn,
          author: r.author,
          verified: r.verified
        }));
        fetchedFromSupabase = true;
      } else if (error) {
        console.error('Supabase Error fetching reviews:', error.message);
      }
    } catch (dbErr) {
      console.error('Exception reading reviews from Supabase:', dbErr);
    }
  }

  // Fallback or merge with local reviews
  const localReviews = readReviews().filter(r => r.product_id === productId);
  
  // Combine unique ones
  const combined = [...dbReviews];
  localReviews.forEach(lr => {
    const exists = combined.some(cr => cr.author === lr.author && (cr.textEn === lr.text_en || cr.textBn === lr.text_bn));
    if (!exists) {
      combined.push({
        stars: lr.stars,
        textEn: lr.text_en,
        textBn: lr.text_bn,
        author: lr.author,
        verified: lr.verified
      });
    }
  });

  res.json({ success: true, reviews: combined });
});

// API: Get customer styling look reviews
app.get('/api/gallery', async (req, res) => {
  let dbGallery = [];
  let fetchedFromSupabase = false;

  if (supabase && isGalleryTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbGallery = data.map(g => ({
          photo: g.photo,
          caption: g.caption,
          name: g.name,
          stars: g.stars || '★★★★★',
          createdAt: g.created_at
        }));
        fetchedFromSupabase = true;
      } else if (error) {
        if (error.message && (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Could not find'))) {
          isGalleryTableAvailable = false;
        }
        console.error('Supabase Error fetching gallery:', error.message);
      }
    } catch (dbErr) {
      console.error('Exception reading gallery from Supabase:', dbErr);
    }
  }

  const localGallery = readGallery();
  const combined = [...dbGallery];

  localGallery.forEach(lg => {
    const exists = combined.some(cg => cg.name === lg.name && cg.caption === lg.caption);
    if (!exists) {
      combined.push(lg);
    }
  });

  // Sort by createdAt descending so newly posted ones appear first, but preserve order of defaults otherwise
  // Note: DEFAULT_GALLERY items have "2026-07-09T00:00:00.000Z" as date. New items will have later times, appearing first.
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, gallery: combined });
});

// API: Submit a new customer styling look review
app.post('/api/gallery', async (req, res) => {
  const { photo, caption, name, stars } = req.body;

  if (!photo || !caption) {
    return res.status(400).json({ success: false, message: 'Photo and caption are required.' });
  }

  const newGalleryItem = {
    photo,
    caption,
    name: name || 'Guest',
    stars: stars || '★★★★★',
    createdAt: new Date().toISOString()
  };

  let supabaseSuccess = false;
  if (supabase && isGalleryTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .insert([{
          photo: newGalleryItem.photo,
          caption: newGalleryItem.caption,
          name: newGalleryItem.name,
          stars: newGalleryItem.stars,
          created_at: newGalleryItem.createdAt
        }]);

      if (error) {
        if (error.message && (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Could not find'))) {
          isGalleryTableAvailable = false;
        }
        console.error('Supabase Error saving gallery item:', error.message);
      } else {
        supabaseSuccess = true;
      }
    } catch (dbErr) {
      console.error('Exception writing gallery to Supabase:', dbErr);
    }
  }

  const gallery = readGallery();
  gallery.push(newGalleryItem);
  writeGallery(gallery);

  res.status(201).json({ success: true, item: newGalleryItem, syncedWithSupabase: supabaseSuccess });
});

// API: Sign Up (Register a new account)
app.post('/api/signup', async (req, res) => {
  const { name, emailOrPhone, password } = req.body;

  if (!name || !emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
  }

  const normalizedEmailPhone = emailOrPhone.trim().toLowerCase();

  // Try checking if user exists in Supabase first
  if (supabase && isUsersTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email_or_phone', normalizedEmailPhone);

      if (error) {
        handleSupabaseTableError(error, 'signup check');
      } else if (data && data.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email/phone already exists.' });
      }
    } catch (dbErr) {
      handleSupabaseTableError(dbErr, 'signup check exception');
    }
  }

  // Check in local backup
  const users = readUsers();
  const existsLocal = users.some(u => u.emailOrPhone.toLowerCase() === normalizedEmailPhone);
  if (existsLocal) {
    return res.status(400).json({ success: false, message: 'An account with this email/phone already exists.' });
  }

  const newUser = {
    name,
    emailOrPhone: normalizedEmailPhone,
    password,
    createdAt: new Date().toISOString()
  };

  // Try inserting to Supabase
  let supabaseSuccess = false;
  if (supabase && isUsersTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: newUser.name,
          email_or_phone: newUser.emailOrPhone,
          password: newUser.password,
          created_at: newUser.createdAt
        }]);

      if (error) {
        handleSupabaseTableError(error, 'signup insert');
      } else {
        supabaseSuccess = true;
        console.log('User saved to Supabase successfully:', normalizedEmailPhone);
      }
    } catch (dbErr) {
      handleSupabaseTableError(dbErr, 'signup insert exception');
    }
  }

  // Always save to local backup
  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ success: true, user: { name: newUser.name, emailOrPhone: newUser.emailOrPhone }, syncedWithSupabase: supabaseSuccess });
});

// API: Log In
app.post('/api/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
  }

  const normalizedEmailPhone = emailOrPhone.trim().toLowerCase();

  // Try verifying with Supabase first
  if (supabase && isUsersTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email_or_phone', normalizedEmailPhone)
        .eq('password', password);

      if (error) {
        handleSupabaseTableError(error, 'login query');
      } else if (data && data.length > 0) {
        const u = data[0];
        return res.json({ success: true, user: { name: u.name, emailOrPhone: u.email_or_phone } });
      }
    } catch (dbErr) {
      handleSupabaseTableError(dbErr, 'login exception');
    }
  }

  // Fallback to local backup
  const users = readUsers();
  const matched = users.find(u => u.emailOrPhone.toLowerCase() === normalizedEmailPhone && u.password === password);
  if (matched) {
    return res.json({ success: true, user: { name: matched.name, emailOrPhone: matched.emailOrPhone } });
  }

  res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
});

// API: Get Google OAuth Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Google Client ID is not configured on the server. Please add GOOGLE_CLIENT_ID to your environment variables.'
    });
  }
  
  const origin = req.query.origin || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// API: Google OAuth Callback Handler
app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.send('No authorization code was provided from Google.');
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.send('Google OAuth credentials are not fully configured on the server (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).');
  }
  
  // Use state parameter to dynamically get the client origin or fallback to server origin
  const origin = state || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/auth/google/callback`;
  
  try {
    // Exchange authorize code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google token exchange error:', errorText);
      return res.send(`Failed to exchange code for token: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    
    // Fetch Google user profile using access token
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Google profile fetch error:', errorText);
      return res.send(`Failed to fetch profile: ${errorText}`);
    }
    
    const googleProfile = await profileResponse.json();
    const email = googleProfile.email;
    const name = googleProfile.name || googleProfile.given_name || 'Google User';
    
    if (!email) {
      return res.send('Unable to retrieve email from your Google account profile.');
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    let userRecord = null;
    let supabaseSuccess = false;
    
    // 1. Try checking/saving to Supabase first
    if (supabase && isUsersTableAvailable) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email_or_phone', normalizedEmail);
          
        if (error) {
          handleSupabaseTableError(error, 'Google user query');
        } else if (data && data.length > 0) {
          userRecord = {
            name: data[0].name,
            emailOrPhone: data[0].email_or_phone
          };
          supabaseSuccess = true;
          console.log('Google user matched in Supabase:', normalizedEmail);
        }
      } catch (dbErr) {
        handleSupabaseTableError(dbErr, 'Google user query exception');
      }
    }
    
    // 2. Check in local backup if not found in Supabase
    if (!userRecord) {
      const localUsers = readUsers();
      const matchedLocal = localUsers.find(u => u.emailOrPhone.toLowerCase() === normalizedEmail);
      if (matchedLocal) {
        userRecord = {
          name: matchedLocal.name,
          emailOrPhone: matchedLocal.emailOrPhone
        };
        console.log('Google user matched in local database backup:', normalizedEmail);
      }
    }
    
    // 3. Create a new account if user does not exist in either place
    if (!userRecord) {
      const newUser = {
        name,
        emailOrPhone: normalizedEmail,
        password: Math.random().toString(36).slice(-10) + 'A!', // generate random password
        createdAt: new Date().toISOString()
      };
      
      // Save to Supabase
      if (supabase && isUsersTableAvailable) {
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([{
              name: newUser.name,
              email_or_phone: newUser.emailOrPhone,
              password: newUser.password,
              created_at: newUser.createdAt
            }]);
            
          if (!error) {
            supabaseSuccess = true;
            console.log('Registered Google user saved to Supabase:', normalizedEmail);
          } else {
            handleSupabaseTableError(error, 'Google user registration');
          }
        } catch (dbErr) {
          handleSupabaseTableError(dbErr, 'Google user registration exception');
        }
      }
      
      // Save to local backup
      const localUsers = readUsers();
      localUsers.push(newUser);
      writeUsers(localUsers);
      console.log('Registered Google user saved to local database backup:', normalizedEmail);
      
      userRecord = {
        name: newUser.name,
        emailOrPhone: newUser.emailOrPhone
      };
    }
    
    // 4. Send success message to close the popup and pass user info back
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Authentication Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 60px 20px; background: #faf9f6; color: #1c1917; }
            .spinner { border: 4px solid rgba(133,57,83,0.1); width: 40px; height: 40px; border-radius: 50%; border-left-color: #853953; animation: spin 0.8s linear infinite; margin: 24px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { color: #1c1917; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
            p { color: #5f5a70; font-size: 14.5px; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Logging in with Google...</h2>
          <p>Please wait while we sync your secure session.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                user: ${JSON.stringify(userRecord)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
    
  } catch (err) {
    console.error('Unhandled exception in Google OAuth handler:', err);
    res.send(`Authentication failed: ${err.message}`);
  }
});

// Fallback all other GET requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
