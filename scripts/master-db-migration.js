const https = require('https');

const API_KEY = 'AIzaSyAHP6NXbXJbYq6kwMUzROjepw4zH2I0Qzc';
const PROJECT_ID = 'dimsglowweb';
const adminEmail = 'dimsglow_admin@dimsglow.com';
const adminPassword = 'DimsglowAdmin2026!';

function request(method, hostname, path, body, headers) {
  headers = headers || {};
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr || '') }, headers)
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: {} });
        }
      });
    });
    r.on('error', reject);
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function toFsValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function objToFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFsValue(v);
  }
  return fields;
}

async function writeDoc(token, collection, docId, data) {
  const res = await request(
    'PATCH',
    'firestore.googleapis.com',
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`,
    { fields: objToFields(data) },
    { Authorization: `Bearer ${token}` }
  );
  return res.status === 200;
}

(async () => {
  console.log('--- DIMSGLOW MASTER DATABASE POPULATION ---');
  // 1. Authenticate
  const auth = await request('POST', 'identitytoolkit.googleapis.com', `/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: adminEmail, password: adminPassword, returnSecureToken: true });
  const token = auth.body.idToken;
  if (!token) {
    console.error('Auth failed:', auth.body);
    process.exit(1);
  }
  console.log('✓ Authenticated as Administrator\n');

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // ─────────────────────────────────────────────────────────────
  // 1. SEED ORDERS (Across all statuses: placed, confirmed, packing, shipped, delivered, cancelled)
  // ─────────────────────────────────────────────────────────────
  const orders = [
    {
      id: 'ord_1001_del',
      orderNumber: 'DG-2026-891021',
      customerUid: 'cust_priya_01',
      customerEmail: 'priya.sharma@gmail.com',
      shippingAddress: {
        fullName: 'Priya Sharma',
        phone: '9876543210',
        addressLine1: 'Flat 402, Royal Palms, Christian Basti',
        city: 'Guwahati',
        state: 'Assam',
        postalCode: '781005',
        country: 'India',
      },
      items: [
        {
          productId: 'skin-tint-5-in-1',
          productName: 'Skin Tint 5-in-1 Foundation SPF 30',
          variantTitle: 'Fair Glow 01',
          sku: 'ST-01',
          unitPricePaise: 89900,
          quantity: 1,
          totalPaise: 89900,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773099951/IMG-20260309-WA0019_l7zcfc.jpg',
        },
        {
          productId: '24hrs-non-transfer-matte-lipstick',
          productName: '24Hrs Non-Transfer Matte Lipstick',
          variantTitle: 'Ruby Elegance 04',
          sku: 'LS-04',
          unitPricePaise: 49900,
          quantity: 2,
          totalPaise: 99800,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773100346/IMG-20260309-WA0023_ev8n85.jpg',
        },
      ],
      subtotalPaise: 160763,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 28937,
      totalPaise: 189700,
      currency: 'INR',
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'upi_doorstep',
      invoiceId: 'inv_ord_1001_del',
      courier: {
        courierName: 'Delhivery Express',
        trackingNumber: 'DEL-9920194819',
        trackingUrl: 'https://www.delhivery.com/track/package/DEL-9920194819',
        shippedAt: now - 3 * day,
      },
      idempotencyKey: 'idemp_1001',
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'ord_1002_ship',
      orderNumber: 'DG-2026-891022',
      customerUid: 'cust_ananya_02',
      customerEmail: 'ananya.barua@outlook.com',
      shippingAddress: {
        fullName: 'Ananya Barua',
        phone: '9864012345',
        addressLine1: 'House 14, Zoo Road Tiniali',
        city: 'Guwahati',
        state: 'Assam',
        postalCode: '781024',
        country: 'India',
      },
      items: [
        {
          productId: 'hydro-glow-lip-oil',
          productName: 'Hydro-Glow Vitamin E Lip Oil',
          variantTitle: 'Clear Crystal',
          sku: 'LO-01',
          unitPricePaise: 44900,
          quantity: 2,
          totalPaise: 89800,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773099951/IMG-20260309-WA0019_l7zcfc.jpg',
        },
      ],
      subtotalPaise: 76102,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 13698,
      totalPaise: 89800,
      currency: 'INR',
      status: 'shipped',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      invoiceId: 'inv_ord_1002_ship',
      courier: {
        courierName: 'Blue Dart Surface',
        trackingNumber: 'BLU-3091823901',
        trackingUrl: 'https://www.bluedart.com/tracking?awb=BLU-3091823901',
        shippedAt: now - 1 * day,
      },
      idempotencyKey: 'idemp_1002',
      createdAt: now - 2 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'ord_1003_pack',
      orderNumber: 'DG-2026-891023',
      customerUid: 'cust_rohit_03',
      customerEmail: 'rohit.kalita@gmail.com',
      shippingAddress: {
        fullName: 'Rohit Kalita',
        phone: '9706054321',
        addressLine1: 'Bora Service, G.S. Road',
        city: 'Guwahati',
        state: 'Assam',
        postalCode: '781007',
        country: 'India',
      },
      items: [
        {
          productId: 'hd-flawless-compact-powder',
          productName: 'HD Matte Finish Setting Powder',
          variantTitle: 'Translucent 01',
          sku: 'CP-01',
          unitPricePaise: 59900,
          quantity: 1,
          totalPaise: 59900,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773100346/IMG-20260309-WA0023_ev8n85.jpg',
        },
      ],
      subtotalPaise: 50763,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 9137,
      totalPaise: 59900,
      currency: 'INR',
      status: 'packing',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      invoiceId: 'inv_ord_1003_pack',
      idempotencyKey: 'idemp_1003',
      createdAt: now - 18 * 60 * 60 * 1000,
      updatedAt: now - 4 * 60 * 60 * 1000,
    },
    {
      id: 'ord_1004_conf',
      orderNumber: 'DG-2026-891024',
      customerUid: 'cust_sneha_04',
      customerEmail: 'sneha.das@yahoo.com',
      shippingAddress: {
        fullName: 'Sneha Das',
        phone: '9435012398',
        addressLine1: 'Lachit Nagar, Bylane 3',
        city: 'Guwahati',
        state: 'Assam',
        postalCode: '781007',
        country: 'India',
      },
      items: [
        {
          productId: 'skin-tint-5-in-1',
          productName: 'Skin Tint 5-in-1 Foundation SPF 30',
          variantTitle: 'Warm Beige 02',
          sku: 'ST-02',
          unitPricePaise: 89900,
          quantity: 1,
          totalPaise: 89900,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773099951/IMG-20260309-WA0019_l7zcfc.jpg',
        },
      ],
      subtotalPaise: 76186,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 13714,
      totalPaise: 89900,
      currency: 'INR',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'online_upi',
      invoiceId: 'inv_ord_1004_conf',
      idempotencyKey: 'idemp_1004',
      createdAt: now - 6 * 60 * 60 * 1000,
      updatedAt: now - 2 * 60 * 60 * 1000,
    },
    {
      id: 'ord_1005_placed',
      orderNumber: 'DG-2026-891025',
      customerUid: 'cust_megha_05',
      customerEmail: 'megha.choudhury@gmail.com',
      shippingAddress: {
        fullName: 'Megha Choudhury',
        phone: '9854098765',
        addressLine1: 'Ulubari, Near Nehru Stadium',
        city: 'Guwahati',
        state: 'Assam',
        postalCode: '781007',
        country: 'India',
      },
      items: [
        {
          productId: '24hrs-non-transfer-matte-lipstick',
          productName: '24Hrs Non-Transfer Matte Lipstick',
          variantTitle: 'Plum Passion 06',
          sku: 'LS-06',
          unitPricePaise: 49900,
          quantity: 1,
          totalPaise: 49900,
          imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1773100346/IMG-20260309-WA0023_ev8n85.jpg',
        },
      ],
      subtotalPaise: 42288,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 7612,
      totalPaise: 49900,
      currency: 'INR',
      status: 'placed',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      idempotencyKey: 'idemp_1005',
      createdAt: now - 30 * 60 * 1000,
      updatedAt: now - 30 * 60 * 1000,
    },
  ];

  console.log('Writing orders to Firestore...');
  for (const o of orders) {
    const ok = await writeDoc(token, 'orders', o.id, o);
    console.log(`  Order ${o.orderNumber} (${o.status}): ${ok ? '✓' : 'FAILED'}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SEED INVOICES (Formal GST-Compliant Invoices)
  // ─────────────────────────────────────────────────────────────
  const invoices = [
    {
      id: 'inv_ord_1001_del',
      invoiceNumber: 'INV-2026-891021',
      orderId: 'ord_1001_del',
      orderNumber: 'DG-2026-891021',
      customerUid: 'cust_priya_01',
      status: 'active',
      issueDate: now - 5 * day,
      seller: {
        legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
        address: 'G.S. Road, Christian Basti, Guwahati, Assam - 781005',
        state: 'Assam',
        stateCode: '18',
        contactPhone: '+913614556830',
        contactEmail: 'support@dimsglow.com',
      },
      buyer: orders[0].shippingAddress,
      lineItems: orders[0].items,
      subtotalPaise: orders[0].subtotalPaise,
      discountPaise: 0,
      taxPaise: orders[0].taxPaise,
      shippingFeePaise: 0,
      totalPaise: orders[0].totalPaise,
      currency: 'INR',
      createdAt: now - 5 * day,
      updatedAt: now - 5 * day,
    },
    {
      id: 'inv_ord_1002_ship',
      invoiceNumber: 'INV-2026-891022',
      orderId: 'ord_1002_ship',
      orderNumber: 'DG-2026-891022',
      customerUid: 'cust_ananya_02',
      status: 'active',
      issueDate: now - 2 * day,
      seller: {
        legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
        address: 'G.S. Road, Christian Basti, Guwahati, Assam - 781005',
        state: 'Assam',
        stateCode: '18',
        contactPhone: '+913614556830',
        contactEmail: 'support@dimsglow.com',
      },
      buyer: orders[1].shippingAddress,
      lineItems: orders[1].items,
      subtotalPaise: orders[1].subtotalPaise,
      discountPaise: 0,
      taxPaise: orders[1].taxPaise,
      shippingFeePaise: 0,
      totalPaise: orders[1].totalPaise,
      currency: 'INR',
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    },
    {
      id: 'inv_ord_1004_conf',
      invoiceNumber: 'INV-2026-891024',
      orderId: 'ord_1004_conf',
      orderNumber: 'DG-2026-891024',
      customerUid: 'cust_sneha_04',
      status: 'active',
      issueDate: now - 6 * 60 * 60 * 1000,
      seller: {
        legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
        address: 'G.S. Road, Christian Basti, Guwahati, Assam - 781005',
        state: 'Assam',
        stateCode: '18',
        contactPhone: '+913614556830',
        contactEmail: 'support@dimsglow.com',
      },
      buyer: orders[3].shippingAddress,
      lineItems: orders[3].items,
      subtotalPaise: orders[3].subtotalPaise,
      discountPaise: 0,
      taxPaise: orders[3].taxPaise,
      shippingFeePaise: 0,
      totalPaise: orders[3].totalPaise,
      currency: 'INR',
      createdAt: now - 6 * 60 * 60 * 1000,
      updatedAt: now - 6 * 60 * 60 * 1000,
    },
  ];

  console.log('\nWriting invoices to Firestore...');
  for (const inv of invoices) {
    const ok = await writeDoc(token, 'invoices', inv.id, inv);
    console.log(`  Invoice ${inv.invoiceNumber}: ${ok ? '✓' : 'FAILED'}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SEED EXPENSES (Real cosmetic manufacturing & operational expenses)
  // ─────────────────────────────────────────────────────────────
  const expenses = [
    {
      id: 'exp_2026_01',
      expenseNumber: 'EXP-2026-001',
      title: 'Luxury Matte Glass Dropper Bottles (Batch of 5,000 units)',
      category: 'packaging',
      amountPaise: 4500000, // ₹45,000
      paymentMode: 'bank_transfer',
      vendorName: 'Apex Cosmetics Packaging Pvt Ltd',
      referenceNumber: 'NEFT-889102910',
      date: now - 7 * day,
      notes: 'Custom rose-gold electroplated droppers for Hydro-Glow Lip Oil line',
      createdByUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      createdAt: now - 7 * day,
      updatedAt: now - 7 * day,
    },
    {
      id: 'exp_2026_02',
      expenseNumber: 'EXP-2026-002',
      title: 'Cosmetic Grade Vitamin E & Jojoba Oil Active Ingredients',
      category: 'inventory',
      amountPaise: 6850000, // ₹68,500
      paymentMode: 'bank_transfer',
      vendorName: 'Northeast Botanicals & Lab Essentials',
      referenceNumber: 'RTGS-309182390',
      date: now - 5 * day,
      notes: 'Certified organic cold-pressed jojoba oil and natural tocopherol',
      createdByUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      createdAt: now - 5 * day,
      updatedAt: now - 5 * day,
    },
    {
      id: 'exp_2026_03',
      expenseNumber: 'EXP-2026-003',
      title: 'Delhivery Surface Logistics & COD Remittance Fees',
      category: 'operational',
      amountPaise: 1240000, // ₹12,400
      paymentMode: 'upi_manual',
      vendorName: 'Delhivery Logistics Ltd',
      referenceNumber: 'UPI-7788992211',
      date: now - 3 * day,
      notes: 'Bi-weekly prepaid shipping settlement for Guwahati fulfillment hub',
      createdByUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      createdAt: now - 3 * day,
      updatedAt: now - 3 * day,
    },
    {
      id: 'exp_2026_04',
      expenseNumber: 'EXP-2026-004',
      title: 'Instagram & Meta Growth Ads (Festive Beauty Launch)',
      category: 'marketing',
      amountPaise: 3500000, // ₹35,000
      paymentMode: 'card',
      vendorName: 'Meta Platforms Ireland Ltd',
      referenceNumber: 'CARD-INV-99201',
      date: now - 2 * day,
      notes: 'High-conversion campaign targeting beauty enthusiasts across Northeast & Metro hubs',
      createdByUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    },
    {
      id: 'exp_2026_05',
      expenseNumber: 'EXP-2026-005',
      title: 'Eco-Friendly Rigid Corrugated Mailing Boxes & Golden Foil Seals',
      category: 'packaging',
      amountPaise: 1850000, // ₹18,500
      paymentMode: 'upi_manual',
      vendorName: 'GreenPack Eco Solutions',
      referenceNumber: 'UPI-9920188231',
      date: now - 1 * day,
      notes: 'Biodegradable branded unboxing boxes with embossed gold emblem',
      createdByUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    },
  ];

  console.log('\nWriting expenses to Firestore...');
  for (const exp of expenses) {
    const ok = await writeDoc(token, 'expenses', exp.id, exp);
    console.log(`  Expense ${exp.expenseNumber} (₹${exp.amountPaise / 100}): ${ok ? '✓' : 'FAILED'}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SEED CUSTOMER REVIEWS (with ratings, feedback & verified purchaser)
  // ─────────────────────────────────────────────────────────────
  const reviews = [
    {
      id: 'rev_2026_01',
      productId: 'skin-tint-5-in-1',
      productTitle: 'Skin Tint 5-in-1 Foundation SPF 30',
      rating: 5,
      title: 'Absolute holy grail skin tint!',
      reviewText: 'Feels like silk on the skin! The coverage is feather-light yet evens out my redness seamlessly. Does not feel cakey in humid Assam weather.',
      customerName: 'Priya Sharma',
      customerUid: 'cust_priya_01',
      verifiedPurchase: true,
      status: 'approved',
      helpfulCount: 24,
      createdAt: now - 4 * day,
      updatedAt: now - 4 * day,
    },
    {
      id: 'rev_2026_02',
      productId: '24hrs-non-transfer-matte-lipstick',
      productTitle: '24Hrs Non-Transfer Matte Lipstick',
      rating: 5,
      title: 'Zero transfer and survives hot tea perfectly',
      reviewText: 'Ruby Elegance is the exact red I have been searching for months. Lasted through a 10-hour wedding ceremony without drying out my lips.',
      customerName: 'Ananya Barua',
      customerUid: 'cust_ananya_02',
      verifiedPurchase: true,
      status: 'approved',
      helpfulCount: 18,
      createdAt: now - 3 * day,
      updatedAt: now - 3 * day,
    },
    {
      id: 'rev_2026_03',
      productId: 'hydro-glow-lip-oil',
      productTitle: 'Hydro-Glow Vitamin E Lip Oil',
      rating: 5,
      title: 'Plump glassy shine without sticky residue',
      reviewText: 'My lips look naturally juicy and plump. Love the mild vanilla aroma and high-shine glass reflection.',
      customerName: 'Sneha Das',
      customerUid: 'cust_sneha_04',
      verifiedPurchase: true,
      status: 'pending',
      helpfulCount: 2,
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'rev_2026_04',
      productId: 'hd-flawless-compact-powder',
      productTitle: 'HD Matte Finish Setting Powder',
      rating: 4,
      title: 'Very fine blur powder',
      reviewText: 'Pores disappear instantly upon puff application. Keeps oil at bay for a solid 6-7 hours.',
      customerName: 'Rohit Kalita',
      customerUid: 'cust_rohit_03',
      verifiedPurchase: true,
      status: 'approved',
      helpfulCount: 9,
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    },
  ];

  console.log('\nWriting customer reviews to Firestore...');
  for (const rev of reviews) {
    const ok = await writeDoc(token, 'reviews', rev.id, rev);
    console.log(`  Review for ${rev.productTitle} (${rev.status}): ${ok ? '✓' : 'FAILED'}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. SEED LOW STOCK ALERTS (Real-time operational alerts)
  // ─────────────────────────────────────────────────────────────
  const alerts = [
    {
      id: 'alert_st_01',
      productId: 'skin-tint-5-in-1',
      productTitle: 'Skin Tint 5-in-1 Foundation SPF 30',
      variantTitle: 'Fair Glow 01',
      sku: 'ST-01',
      currentStock: 4,
      threshold: 10,
      severity: 'critical',
      status: 'active',
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'alert_lo_02',
      productId: 'hydro-glow-lip-oil',
      productTitle: 'Hydro-Glow Vitamin E Lip Oil',
      variantTitle: 'Berry Bliss 02',
      sku: 'LO-02',
      currentStock: 0,
      threshold: 15,
      severity: 'out_of_stock',
      status: 'active',
      createdAt: now - 12 * 60 * 60 * 1000,
      updatedAt: now - 12 * 60 * 60 * 1000,
    },
    {
      id: 'alert_ls_04',
      productId: '24hrs-non-transfer-matte-lipstick',
      productTitle: '24Hrs Non-Transfer Matte Lipstick',
      variantTitle: 'Ruby Elegance 04',
      sku: 'LS-04',
      currentStock: 8,
      threshold: 20,
      severity: 'low',
      status: 'active',
      createdAt: now - 6 * 60 * 60 * 1000,
      updatedAt: now - 6 * 60 * 60 * 1000,
    },
  ];

  console.log('\nWriting low-stock alerts to Firestore...');
  for (const al of alerts) {
    const ok = await writeDoc(token, 'alerts', al.id, al);
    console.log(`  Alert ${al.sku} (${al.severity}): ${ok ? '✓' : 'FAILED'}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. SEED CRM & CLIENT DIRECTORY
  // ─────────────────────────────────────────────────────────────
  const crmProfiles = [
    {
      uid: 'cust_priya_01',
      email: 'priya.sharma@gmail.com',
      displayName: 'Priya Sharma',
      phone: '9876543210',
      tags: ['vip_client', 'repeat_buyer'],
      totalOrders: 3,
      lifetimeValuePaise: 549100,
      lastOrderAt: now - 5 * day,
      createdAt: now - 60 * day,
      updatedAt: now - 1 * day,
    },
    {
      uid: 'cust_ananya_02',
      email: 'ananya.barua@outlook.com',
      displayName: 'Ananya Barua',
      phone: '9864012345',
      tags: ['repeat_buyer'],
      totalOrders: 2,
      lifetimeValuePaise: 219700,
      lastOrderAt: now - 2 * day,
      createdAt: now - 45 * day,
      updatedAt: now - 1 * day,
    },
    {
      uid: 'cust_sneha_04',
      email: 'sneha.das@yahoo.com',
      displayName: 'Sneha Das',
      phone: '9435012398',
      tags: ['new_shopper'],
      totalOrders: 1,
      lifetimeValuePaise: 89900,
      lastOrderAt: now - 6 * 60 * 60 * 1000,
      createdAt: now - 5 * day,
      updatedAt: now - 6 * 60 * 60 * 1000,
    },
  ];

  console.log('\nWriting CRM profiles & Customers to Firestore...');
  for (const crm of crmProfiles) {
    await writeDoc(token, 'crmProfiles', crm.uid, crm);
    await writeDoc(token, 'customers', crm.uid, crm);
    console.log(`  Client ${crm.displayName} (${crm.email}): ✓`);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. SEED AUDIT TRAIL LOGS
  // ─────────────────────────────────────────────────────────────
  const auditLogs = [
    {
      id: 'audit_01',
      actorUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      actorRole: 'owner',
      action: 'order_dispatched',
      targetType: 'orders',
      targetId: 'ord_1001_del',
      reason: 'Package dispatched via Delhivery Express (AWB: DEL-9920194819)',
      timestamp: now - 3 * day,
    },
    {
      id: 'audit_02',
      actorUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      actorRole: 'owner',
      action: 'invoice_generated',
      targetType: 'invoices',
      targetId: 'inv_ord_1001_del',
      reason: 'GST Tax invoice INV-2026-891021 generated for Priya Sharma',
      timestamp: now - 5 * day,
    },
    {
      id: 'audit_03',
      actorUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      actorRole: 'owner',
      action: 'expense_created',
      targetType: 'expenses',
      targetId: 'exp_2026_01',
      reason: 'Recorded raw material expense for glass dropper bottles',
      timestamp: now - 7 * day,
    },
    {
      id: 'audit_04',
      actorUid: 'kZ6Tg0satsZmU91CFfKLP79Snxp2',
      actorRole: 'owner',
      action: 'review_approved',
      targetType: 'reviews',
      targetId: 'rev_2026_01',
      reason: 'Customer verified review approved for storefront',
      timestamp: now - 4 * day,
    },
  ];

  console.log('\nWriting audit events to Firestore...');
  for (const aud of auditLogs) {
    const ok = await writeDoc(token, 'auditEvents', aud.id, aud);
    console.log(`  Audit ${aud.action} (${aud.targetType}): ${ok ? '✓' : 'FAILED'}`);
  }

  console.log('\n=========================================');
  console.log('✓ ALL COLLECTIONS SUCCESSFULLY POPULATED IN CLOUD FIRESTORE!');
  console.log('=========================================');
})();
