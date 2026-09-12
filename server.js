require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

// ==========================================
//          SUPABASE CLIENT SETUP
// ==========================================
function getValidSupabaseConfig() {
  let url = process.env.SUPABASE_URL || '';
  let key = process.env.SUPABASE_KEY || '';

  url = url.trim();
  key = key.trim();

  if (!url) {
    url = 'https://jfupywwjdgjtosubgfhl.supabase.co';
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.supabase.co')) {
      url = 'https://' + url;
    } else {
      url = `https://${url}.supabase.co`;
    }
  }

  if (!key) {
    key = 'sb_publishable_PclaqbaXoVijGjcYsvvk0w_shUEhwzJ';
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseConfig();
let supabase = null;

function logSupabaseWarning(err, context) {
  const msg = err && (err.message || err.details || JSON.stringify(err));
  console.warn(`[Supabase Warning] ${context}:`, msg);
}

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully with:', supabaseUrl);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Middleware for parsing JSON and form submissions
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// ==========================================
//          LOCAL FILE BACKUPS
// ==========================================
const ORDERS_FILE = path.join(__dirname, 'orders.json');

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

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders file:', error);
  }
}

const USERS_FILE = path.join(__dirname, 'users.json');

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

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

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

function requireAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin access only.' });
  }
  next();
}

app.get('/api/admin/status', (req, res) => {
  const admin = readAdmin();
  res.json({ success: true, exists: admin !== null });
});

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

// Admin API to get all registered users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    let allUsers = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, email_or_phone, created_at')
          .order('created_at', { ascending: true });

        if (!error && data) {
          allUsers = data.map(u => ({
            name: u.name,
            emailOrPhone: u.email_or_phone,
            createdAt: u.created_at
          }));
        } else if (error) {
          logSupabaseWarning(error, 'fetching admin users');
          allUsers = readUsers();
        }
      } catch (e) {
        logSupabaseWarning(e, 'Exception fetching admin users');
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
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            subtotal: o.subtotal,
            shippingFee: o.shipping_fee,
            total: o.total,
            status: o.status,
            createdAt: o.created_at
          }));
        } else if (error) {
          logSupabaseWarning(error, 'fetching admin orders');
          allOrders = readOrders();
        }
      } catch (e) {
        logSupabaseWarning(e, 'Exception fetching admin orders');
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

  // Update in local file
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
        logSupabaseWarning(error, 'updating status in Supabase');
      }
    } catch (e) {
      logSupabaseWarning(e, 'Exception updating order status in Supabase');
    }
  }

  res.json({ success: true, message: 'Order status updated successfully.' });
});

// ==========================================
//              ORDERS APIS
// ==========================================
app.post('/api/orders', async (req, res) => {
  const { customerName, customerPhone, customerAddress, deliveryLocation, paymentMethod, items, subtotal, shippingFee, total } = req.body;

  if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide all required customer and order details.' });
  }

  const orderId = 'FLX-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date();

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
    createdAt: now.toISOString()
  };

  // Try saving to Supabase
  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
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
          }
        ]);

      if (error) {
        logSupabaseWarning(error, 'writing order to Supabase');
      } else {
        supabaseSuccess = true;
        console.log('[Supabase] Order saved successfully:', orderId);
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception writing order to Supabase');
    }
  }

  // Always save to local backup
  const orders = readOrders();
  orders.push(newOrder);
  writeOrders(orders);

  res.status(201).json({ success: true, order: newOrder, syncedWithSupabase: supabaseSuccess });
});

app.get('/api/orders', async (req, res) => {
  // Try fetching from Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedOrders = data.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          deliveryLocation: o.delivery_location,
          paymentMethod: o.payment_method,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          subtotal: o.subtotal,
          shippingFee: o.shipping_fee,
          total: o.total,
          status: o.status,
          createdAt: o.created_at
        }));
        return res.json({ success: true, orders: mappedOrders });
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception reading all orders from Supabase');
    }
  }

  const orders = readOrders();
  res.json({ success: true, orders: orders.reverse() });
});

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
        .or(`id.ilike.%${queryClean}%,customer_phone.eq.${queryClean}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedOrders = data.map(o => ({
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          deliveryLocation: o.delivery_location,
          paymentMethod: o.payment_method,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          subtotal: o.subtotal,
          shippingFee: o.shipping_fee,
          total: o.total,
          status: o.status,
          createdAt: o.created_at
        }));
        return res.json({ success: true, orders: mappedOrders });
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception tracking order from Supabase');
    }
  }

  const orders = readOrders();
  const matched = orders.filter(o => 
    o.id.toLowerCase() === queryClean.toLowerCase() || 
    o.customerPhone.trim() === queryClean
  );

  res.json({ success: true, orders: matched });
});

// ==========================================
//             REVIEWS APIS
// ==========================================
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
    verified: verified !== undefined ? (verified ? 1 : 0) : 1,
    created_at: new Date().toISOString()
  };

  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([newReview]);

      if (error) {
        logSupabaseWarning(error, 'writing review');
      } else {
        supabaseSuccess = true;
        console.log('[Supabase] Review saved successfully.');
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception writing review to Supabase');
    }
  }

  const reviews = readReviews();
  reviews.push(newReview);
  writeReviews(reviews);

  res.status(201).json({ success: true, review: newReview, syncedWithSupabase: supabaseSuccess });
});

app.get('/api/reviews', async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId parameter required' });
  }

  let dbReviews = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('stars, text_en, text_bn, author, verified')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbReviews = data.map(r => ({
          stars: r.stars,
          textEn: r.text_en,
          textBn: r.text_bn,
          author: r.author,
          verified: !!r.verified
        }));
      } else if (error) {
        logSupabaseWarning(error, 'reading reviews');
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception reading reviews from Supabase');
    }
  }

  const localReviews = readReviews().filter(r => r.product_id === productId);
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

// ==========================================
//             GALLERY APIS
// ==========================================
app.get('/api/gallery', async (req, res) => {
  let dbGallery = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('photo, caption, name, stars, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbGallery = data.map(g => ({
          photo: g.photo,
          caption: g.caption,
          name: g.name,
          stars: g.stars || '★★★★★',
          createdAt: g.created_at
        }));
      } else if (error) {
        logSupabaseWarning(error, 'reading gallery');
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception reading gallery from Supabase');
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

  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, gallery: combined });
});

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
  if (supabase) {
    try {
      const { error } = await supabase
        .from('gallery')
        .insert([
          {
            photo: newGalleryItem.photo,
            caption: newGalleryItem.caption,
            name: newGalleryItem.name,
            stars: newGalleryItem.stars,
            created_at: newGalleryItem.createdAt
          }
        ]);

      if (error) {
        logSupabaseWarning(error, 'writing gallery');
      } else {
        supabaseSuccess = true;
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception writing gallery to Supabase');
    }
  }

  const gallery = readGallery();
  gallery.push(newGalleryItem);
  writeGallery(gallery);

  res.status(201).json({ success: true, item: newGalleryItem, syncedWithSupabase: supabaseSuccess });
});

// ==========================================
//             AUTH & USER APIS
// ==========================================
app.post('/api/signup', async (req, res) => {
  const { name, emailOrPhone, password } = req.body;

  if (!name || !emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
  }

  const normalizedEmailPhone = emailOrPhone.trim().toLowerCase();

  // Try checking if user exists in Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email_or_phone', normalizedEmailPhone);

      if (!error && data && data.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email/phone already exists.' });
      } else if (error) {
        logSupabaseWarning(error, 'checking user existence');
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception checking user in Supabase');
    }
  }

  // Check in local file backup
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

  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .insert([
          {
            name: newUser.name,
            email_or_phone: newUser.emailOrPhone,
            password: newUser.password,
            created_at: newUser.createdAt
          }
        ]);

      if (error) {
        logSupabaseWarning(error, 'creating user in Supabase');
      } else {
        supabaseSuccess = true;
        console.log('[Supabase] User saved successfully:', normalizedEmailPhone);
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception writing user to Supabase');
    }
  }

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ success: true, user: { name: newUser.name, emailOrPhone: newUser.emailOrPhone }, syncedWithSupabase: supabaseSuccess });
});

app.post('/api/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
  }

  const normalizedEmailPhone = emailOrPhone.trim().toLowerCase();

  // Try verifying with Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email_or_phone', normalizedEmailPhone)
        .eq('password', password);

      if (!error && data && data.length > 0) {
        const u = data[0];
        return res.json({ success: true, user: { name: u.name, emailOrPhone: u.email_or_phone } });
      } else if (error) {
        logSupabaseWarning(error, 'logging in user');
      }
    } catch (dbErr) {
      logSupabaseWarning(dbErr, 'Exception logging in user via Supabase');
    }
  }

  // Fallback to local file backup
  const users = readUsers();
  const matched = users.find(u => u.emailOrPhone.toLowerCase() === normalizedEmailPhone && u.password === password);
  if (matched) {
    return res.json({ success: true, user: { name: matched.name, emailOrPhone: matched.emailOrPhone } });
  }

  res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
});

// ==========================================
//          GOOGLE OAUTH ENDPOINTS
// ==========================================
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
  
  const origin = state || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/auth/google/callback`;
  
  try {
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, email_or_phone')
          .eq('email_or_phone', normalizedEmail);
          
        if (!error && data && data.length > 0) {
          userRecord = {
            name: data[0].name,
            emailOrPhone: data[0].email_or_phone
          };
          supabaseSuccess = true;
          console.log('[Supabase] Google user matched:', normalizedEmail);
        } else if (error) {
          logSupabaseWarning(error, 'fetching user in Google callback');
        }
      } catch (dbErr) {
        logSupabaseWarning(dbErr, 'Exception fetching Google user from Supabase');
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
        password: Math.random().toString(36).slice(-10) + 'A!',
        createdAt: new Date().toISOString()
      };
      
      // Save to Supabase
      if (supabase) {
        try {
          const { error } = await supabase
            .from('users')
            .insert([
              {
                name: newUser.name,
                email_or_phone: newUser.emailOrPhone,
                password: newUser.password,
                created_at: newUser.createdAt
              }
            ]);
            
          if (!error) {
            supabaseSuccess = true;
            console.log('[Supabase] Registered Google user saved:', normalizedEmail);
          } else {
            logSupabaseWarning(error, 'inserting Google user in Supabase');
          }
        } catch (dbErr) {
          logSupabaseWarning(dbErr, 'Exception inserting Google user to Supabase');
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
