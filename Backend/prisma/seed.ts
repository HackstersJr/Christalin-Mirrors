import { PrismaClient, ServiceCategory, StaffRole, UserRole, Gender, AppointmentStatus, InvoiceStatus, PaymentMethod, InventoryCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORY_MAP: Record<string, ServiceCategory> = {
  hair: 'HAIR', skin: 'SKIN', korean: 'KOREAN', womens: 'WOMENS', mens: 'MENS',
};
const ROLE_MAP: Record<string, StaffRole> = {
  stylist: 'STYLIST', therapist: 'THERAPIST', manager: 'MANAGER', receptionist: 'RECEPTIONIST',
};
const GENDER_MAP: Record<string, Gender> = {
  female: 'FEMALE', male: 'MALE', other: 'OTHER',
};
const INV_CATEGORY_MAP: Record<string, InventoryCategory> = {
  'hair-care': 'HAIRCARE', 'skin-care': 'SKINCARE', color: 'COLOR', tools: 'TOOLS', consumables: 'CONSUMABLES',
};
const PAYMENT_MAP: Record<string, PaymentMethod> = {
  cash: 'CASH', card: 'CARD', upi: 'UPI', other: 'OTHER',
};

function rupeesToPaisa(r: number): number { return Math.round(r * 100); }

async function main() {
  console.log('🌱 Seeding Christalin Mirrors database...');

  // Clean tables
  await prisma.invoiceItem.deleteMany();
  await prisma.serviceVisit.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.serviceBranch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.salonSettings.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.invoiceSequence.deleteMany();

  // ─── Branches ──────────────────────────────────────
  const blr = await prisma.branch.create({
    data: {
      name: 'CM — Bengaluru',
      city: 'Bengaluru, Karnataka',
      address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
      phone: '+91 72042 36981',
      isActive: true,
    },
  });
  const klb = await prisma.branch.create({
    data: {
      name: 'CM — Kalaburagi',
      city: 'Kalaburagi, Karnataka',
      address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105',
      phone: '+91 XXXXX XXXXX',
      isActive: true,
    },
  });
  console.log('  ✅ Branches');

  // ─── Services ──────────────────────────────────────
  const mockServices = [
    { name: 'Precision Haircut', category: 'hair', duration: 45, price: 500, isKorean: false, description: 'U/V layer cut, advance creative cuts & kids styling' },
    { name: 'Wash & Styling', category: 'hair', duration: 30, price: 300, isKorean: false, description: 'Wash, blast dry, conditioning & ironing' },
    { name: 'Hair Color Studio', category: 'hair', duration: 120, price: 3000, isKorean: false, description: 'Root touch up, global color, fashion shades & highlights' },
    { name: 'Balayage', category: 'hair', duration: 180, price: 5000, isKorean: false, description: 'Hand-painted natural gradients with premium colors' },
    { name: 'Keratin & Smoothing', category: 'hair', duration: 150, price: 4000, isKorean: false, description: 'Frizz-free finish with keratin, botox & nano plastia' },
    { name: 'Korean Glass Skin Facial', category: 'korean', duration: 90, price: 3500, isKorean: true, description: 'Where Korean skin science meets restorative hydration' },
    { name: 'Ultimate K-Glow Ritual', category: 'korean', duration: 120, price: 5000, isKorean: true, description: 'The pinnacle of Korean scalp and hair therapy' },
    { name: 'Luxury Bridal Makeover', category: 'womens', duration: 180, price: 15000, isKorean: false, description: 'MAC, Laura Mercier, Huda Beauty & Fenty options' },
    { name: 'Classic & Creative Cuts', category: 'mens', duration: 30, price: 400, isKorean: false, description: 'Wash & blast dry, head shave, and creative haircuts' },
    { name: 'Beard Grooming', category: 'mens', duration: 20, price: 250, isKorean: false, description: 'Beard trim, shave, beard colour & moustache colour' },
    { name: 'Glass Skin Facials', category: 'skin', duration: 60, price: 2500, isKorean: true, description: 'Hydra aloe, K elite glow & Korean glass skin hydra facial' },
    { name: 'Wellness Massage', category: 'skin', duration: 60, price: 1500, isKorean: false, description: 'Body massage, foot/back/hand, body scrub & body polish' },
  ];

  const serviceMap: Record<string, string> = {};
  for (const s of mockServices) {
    const svc = await prisma.service.create({
      data: {
        name: s.name,
        category: CATEGORY_MAP[s.category],
        duration: s.duration,
        price: rupeesToPaisa(s.price),
        isActive: true,
        isKorean: s.isKorean,
        description: s.description,
      },
    });
    serviceMap[s.name] = svc.id;
  }
  console.log('  ✅ Services');

  // ─── Staff ─────────────────────────────────────────
  const mockStaff = [
    { name: 'Ananya Rao', role: 'stylist', branch: blr.id, phone: '+91 99887 76655', email: 'ananya@cm.com', specialties: ['Balayage', 'Korean Facials', 'Bridal Makeup'], joinedDate: '2025-03-01' },
    { name: 'Vikram Singh', role: 'stylist', branch: blr.id, phone: '+91 88776 65544', email: 'vikram@cm.com', specialties: ["Men's Cuts", 'Hair Color', 'Keratin'], joinedDate: '2025-05-15' },
    { name: 'Divya Menon', role: 'therapist', branch: klb.id, phone: '+91 77665 54433', email: 'divya@cm.com', specialties: ['Korean Head Spa', 'Facials', 'Massage'], joinedDate: '2025-11-01' },
    { name: 'Preethi S.', role: 'receptionist', branch: blr.id, phone: '+91 66554 43322', email: 'preethi@cm.com', specialties: [], joinedDate: '2025-04-01' },
    { name: 'Sushmitha Cristalin A.', role: 'manager', branch: blr.id, phone: '+91 72042 36981', email: 'info@christalinmirrors.com', specialties: ['Salon Management', 'Brand Strategy'], joinedDate: '2025-01-01' },
  ];

  const staffMap: Record<string, string> = {};
  for (const s of mockStaff) {
    const staff = await prisma.staff.create({
      data: {
        name: s.name,
        role: ROLE_MAP[s.role],
        branchId: s.branch,
        phone: s.phone,
        email: s.email,
        specialties: s.specialties,
        isActive: true,
        joinedDate: new Date(s.joinedDate),
      },
    });
    staffMap[s.name] = staff.id;
  }
  console.log('  ✅ Staff');

  // ─── Clients ───────────────────────────────────────
  const mockClients = [
    { name: 'Meera Reddy', email: 'meera@email.com', phone: '+91 98765 43210', gender: 'female', branch: blr.id, joinedDate: '2025-06-15', totalVisits: 12, lastVisit: '2026-03-10', preferredStaffId: staffMap['Ananya Rao'], notes: 'Prefers organic products', tags: ['VIP', 'Regular'] },
    { name: 'Ravi Kumar', email: 'ravi@email.com', phone: '+91 87654 32109', gender: 'male', branch: blr.id, joinedDate: '2025-09-20', totalVisits: 6, lastVisit: '2026-03-05', preferredStaffId: staffMap['Vikram Singh'], tags: ['Regular'] },
    { name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 76543 21098', gender: 'female', branch: blr.id, joinedDate: '2025-11-01', totalVisits: 4, lastVisit: '2026-02-28', tags: ['New'] },
    { name: 'Arjun Desai', email: 'arjun@email.com', phone: '+91 65432 10987', gender: 'male', branch: klb.id, joinedDate: '2026-01-10', totalVisits: 2, lastVisit: '2026-03-01', tags: ['New'] },
    { name: 'Sneha Patil', email: 'sneha@email.com', phone: '+91 54321 09876', gender: 'female', branch: blr.id, joinedDate: '2025-04-05', totalVisits: 18, lastVisit: '2026-03-14', preferredStaffId: staffMap['Ananya Rao'], notes: 'Bridal package client', tags: ['VIP', 'Bridal'] },
    { name: 'Karthik Nair', email: 'karthik@email.com', phone: '+91 43210 98765', gender: 'male', branch: blr.id, joinedDate: '2025-12-01', totalVisits: 3, lastVisit: '2026-02-20', tags: [] },
  ];

  const clientMap: Record<string, string> = {};
  for (const c of mockClients) {
    const client = await prisma.client.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        gender: GENDER_MAP[c.gender],
        branchId: c.branch,
        joinedDate: new Date(c.joinedDate),
        totalVisits: c.totalVisits,
        lastVisit: c.lastVisit ? new Date(c.lastVisit) : null,
        preferredStaffId: c.preferredStaffId || null,
        notes: c.notes || null,
        tags: c.tags,
      },
    });
    clientMap[c.name] = client.id;
  }
  console.log('  ✅ Clients');

  // ─── Inventory ─────────────────────────────────────
  const mockInventory = [
    { name: 'Olaplex No.3', brand: 'Olaplex', category: 'hair-care', sku: 'OPX-003', currentStock: 8, minStock: 3, costPrice: 2200, retailPrice: 3500, branch: blr.id, lastRestocked: '2026-03-01' },
    { name: 'Schwarzkopf IGORA Royal', brand: 'Schwarzkopf', category: 'color', sku: 'SZK-IGR-01', currentStock: 15, minStock: 5, costPrice: 650, retailPrice: 0, branch: blr.id, lastRestocked: '2026-03-05' },
    { name: 'K-Beauty Hydra Serum', brand: 'Cosrx', category: 'skin-care', sku: 'CRX-HYD-01', currentStock: 5, minStock: 3, costPrice: 1800, retailPrice: 2800, branch: blr.id, lastRestocked: '2026-02-15' },
    { name: 'Hair Keratin Treatment Kit', brand: 'GK Hair', category: 'hair-care', sku: 'GKH-KTK-01', currentStock: 3, minStock: 2, costPrice: 4500, retailPrice: 0, branch: blr.id, lastRestocked: '2026-02-20' },
    { name: 'MAC Pro Longwear Foundation', brand: 'MAC', category: 'skin-care', sku: 'MAC-PLF-01', currentStock: 6, minStock: 2, costPrice: 2800, retailPrice: 3600, branch: blr.id, lastRestocked: '2026-03-10' },
    { name: 'Disposable Capes (50 pack)', brand: 'Generic', category: 'consumables', sku: 'GEN-CAP-50', currentStock: 2, minStock: 5, costPrice: 450, retailPrice: 0, branch: blr.id, lastRestocked: '2026-01-15' },
    { name: 'Professional Hair Scissors', brand: 'Jaguar', category: 'tools', sku: 'JAG-SCR-01', currentStock: 4, minStock: 2, costPrice: 8500, retailPrice: 0, branch: blr.id, lastRestocked: '2025-11-01' },
    { name: 'K-Beauty Clay Mask', brand: 'Innisfree', category: 'skin-care', sku: 'INF-CLM-01', currentStock: 1, minStock: 3, costPrice: 900, retailPrice: 1500, branch: klb.id, lastRestocked: '2026-01-20' },
  ];

  for (const i of mockInventory) {
    await prisma.inventoryItem.create({
      data: {
        name: i.name,
        brand: i.brand,
        category: INV_CATEGORY_MAP[i.category],
        sku: i.sku,
        currentStock: i.currentStock,
        minStock: i.minStock,
        costPrice: rupeesToPaisa(i.costPrice),
        retailPrice: rupeesToPaisa(i.retailPrice),
        branchId: i.branch,
        lastRestocked: i.lastRestocked ? new Date(i.lastRestocked) : null,
        isActive: true,
      },
    });
  }
  console.log('  ✅ Inventory');

  // ─── Appointments (from mockData) ──────────────────
  const mockAppointments = [
    { clientName: 'Meera Reddy', clientEmail: 'meera@email.com', clientPhone: '+91 98765 43210', date: '2026-03-17', time: '10:00 AM', serviceName: 'Balayage', staffName: 'Ananya', status: 'CONFIRMED', branch: blr.id },
    { clientName: 'Ravi Kumar', clientEmail: 'ravi@email.com', date: '2026-03-17', time: '11:00 AM', serviceName: 'Classic & Creative Cuts', staffName: 'Vikram', status: 'CONFIRMED', branch: blr.id },
    { clientName: 'Priya Sharma', clientEmail: 'priya@email.com', clientPhone: '+91 87654 32109', date: '2026-03-17', time: '2:00 PM', serviceName: 'Korean Glass Skin Facial', staffName: 'Ananya', status: 'PENDING', branch: blr.id },
    { clientName: 'Arjun Desai', clientEmail: 'arjun@email.com', date: '2026-03-17', time: '3:00 PM', serviceName: 'Beard Grooming', status: 'PENDING', branch: klb.id },
    { clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-03-18', time: '10:00 AM', serviceName: 'Luxury Bridal Makeover', staffName: 'Ananya', status: 'CONFIRMED', branch: blr.id, notes: 'Wedding on March 20' },
    { clientName: 'Karthik Nair', clientEmail: 'karthik@email.com', date: '2026-03-18', time: '12:00 PM', serviceName: 'Keratin & Smoothing', staffName: 'Vikram', status: 'PENDING', branch: blr.id },
    { clientName: 'Anita Joshi', clientEmail: 'anita@email.com', date: '2026-03-16', time: '11:00 AM', serviceName: 'Glass Skin Facials', staffName: 'Ananya', status: 'COMPLETED', branch: klb.id },
    { clientName: 'Deepak Verma', clientEmail: 'deepak@email.com', date: '2026-03-16', time: '4:00 PM', serviceName: 'Hair Color Studio', status: 'CANCELLED', notes: 'Client rescheduled', branch: blr.id },
  ];

  for (const a of mockAppointments) {
    const clientId = clientMap[a.clientName] || null;
    const svcId = serviceMap[a.serviceName] || null;
    let stfId: string | null = null;
    if (a.staffName) {
      const fullName = Object.keys(staffMap).find(n => n.startsWith(a.staffName!));
      if (fullName) stfId = staffMap[fullName];
    }
    await prisma.appointment.create({
      data: {
        clientId,
        clientName: a.clientName,
        clientEmail: a.clientEmail,
        clientPhone: a.clientPhone || null,
        date: new Date(a.date),
        time: a.time,
        serviceId: svcId,
        serviceName: a.serviceName,
        staffId: stfId,
        staffName: a.staffName || null,
        status: a.status as AppointmentStatus,
        notes: a.notes || null,
        branchId: a.branch,
      },
    });
  }
  console.log('  ✅ Appointments');

  // ─── Invoices (from mockData) ──────────────────────
  const mockInvoices = [
    { num: 1, clientName: 'Meera Reddy', clientEmail: 'meera@email.com', clientPhone: '+91 98765 43210', date: '2026-03-10', items: [{ service: 'Balayage', qty: 1, price: 5000, total: 5000 }, { service: 'Wash & Styling', qty: 1, price: 300, total: 300 }], subtotal: 5300, discPct: 10, discAmt: 530, taxPct: 18, taxAmt: 858, total: 5628, paid: 5628, status: 'PAID', method: 'upi', branch: blr.id, stylist: 'Ananya Rao' },
    { num: 2, clientName: 'Meera Reddy', clientEmail: 'meera@email.com', date: '2026-02-22', items: [{ service: 'Korean Glass Skin Facial', qty: 1, price: 3500, total: 3500 }], subtotal: 3500, discPct: 0, discAmt: 0, taxPct: 18, taxAmt: 630, total: 4130, paid: 4130, status: 'PAID', method: 'card', branch: blr.id, stylist: 'Ananya Rao' },
    { num: 3, clientName: 'Ravi Kumar', clientEmail: 'ravi@email.com', date: '2026-03-05', items: [{ service: 'Classic & Creative Cuts', qty: 1, price: 400, total: 400 }, { service: 'Beard Grooming', qty: 1, price: 250, total: 250 }], subtotal: 650, discPct: 0, discAmt: 0, taxPct: 18, taxAmt: 117, total: 767, paid: 767, status: 'PAID', method: 'cash', branch: blr.id, stylist: 'Vikram Singh' },
    { num: 4, clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-03-14', items: [{ service: 'Precision Haircut', qty: 1, price: 500, total: 500 }, { service: 'Glass Skin Facials', qty: 1, price: 2500, total: 2500 }], subtotal: 3000, discPct: 10, discAmt: 300, taxPct: 18, taxAmt: 486, total: 3186, paid: 3186, status: 'PAID', method: 'card', branch: blr.id, stylist: 'Ananya Rao' },
    { num: 5, clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-02-28', items: [{ service: 'Luxury Bridal Makeover', qty: 1, price: 15000, total: 15000 }], subtotal: 15000, discPct: 10, discAmt: 1500, taxPct: 18, taxAmt: 2430, total: 15930, paid: 15930, status: 'PAID', method: 'card', branch: blr.id, stylist: 'Ananya Rao', notes: 'Trial session — Balance for wedding day' },
    { num: 6, clientName: 'Priya Sharma', clientEmail: 'priya@email.com', date: '2026-02-28', items: [{ service: 'Keratin & Smoothing', qty: 1, price: 4000, total: 4000 }], subtotal: 4000, discPct: 0, discAmt: 0, taxPct: 18, taxAmt: 720, total: 4720, paid: 4720, status: 'PAID', method: 'upi', branch: blr.id },
    { num: 7, clientName: 'Arjun Desai', clientEmail: 'arjun@email.com', date: '2026-03-01', items: [{ service: 'Classic & Creative Cuts', qty: 1, price: 400, total: 400 }], subtotal: 400, discPct: 0, discAmt: 0, taxPct: 18, taxAmt: 72, total: 472, paid: 472, status: 'PAID', method: 'cash', branch: klb.id },
    { num: 8, clientName: 'Karthik Nair', clientEmail: 'karthik@email.com', date: '2026-02-20', items: [{ service: 'Hair Color Studio', qty: 1, price: 3000, total: 3000 }, { service: 'Wash & Styling', qty: 1, price: 300, total: 300 }], subtotal: 3300, discPct: 0, discAmt: 0, taxPct: 18, taxAmt: 594, total: 3894, paid: 3894, status: 'PAID', method: 'card', branch: blr.id, stylist: 'Vikram Singh' },
  ];

  for (const inv of mockInvoices) {
    const cId = clientMap[inv.clientName] || null;
    const stId = inv.stylist ? staffMap[inv.stylist] || null : null;

    await prisma.invoice.create({
      data: {
        invoiceNumber: `CM-INV-${String(inv.num).padStart(4, '0')}`,
        clientId: cId,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        clientPhone: inv.clientPhone || null,
        date: new Date(inv.date),
        subtotal: rupeesToPaisa(inv.subtotal),
        discountPercent: inv.discPct,
        discountAmount: rupeesToPaisa(inv.discAmt),
        taxPercent: inv.taxPct,
        taxAmount: rupeesToPaisa(inv.taxAmt),
        total: rupeesToPaisa(inv.total),
        amountPaid: rupeesToPaisa(inv.paid),
        status: inv.status as InvoiceStatus,
        paymentMethod: PAYMENT_MAP[inv.method] || null,
        branchId: inv.branch,
        staffId: stId,
        staffName: inv.stylist || null,
        notes: inv.notes || null,
        items: {
          create: inv.items.map(it => ({
            serviceId: serviceMap[it.service] || null,
            serviceName: it.service,
            quantity: it.qty,
            unitPrice: rupeesToPaisa(it.price),
            total: rupeesToPaisa(it.total),
          })),
        },
      },
    });
  }
  console.log('  ✅ Invoices');

  // ─── Invoice Sequence ──────────────────────────────
  await prisma.invoiceSequence.create({
    data: { id: 'singleton', lastNum: 8 },
  });
  console.log('  ✅ Invoice Sequence (starting at 8)');

  // ─── Salon Settings ────────────────────────────────
  await prisma.salonSettings.create({
    data: {
      id: 'singleton',
      name: 'Christalin Mirrors',
      email: 'info@christalinmirrors.com',
      phone: '+91 72042 36981',
      hours: 'Everyday: 10:00 AM – 9:00 PM',
      instagram: 'https://instagram.com',
    },
  });
  console.log('  ✅ Salon Settings');

  // ─── Owner User ────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  await prisma.user.create({
    data: {
      email: 'owner@christalinmirrors.com',
      passwordHash,
      role: 'OWNER',
      staffId: staffMap['Sushmitha Cristalin A.'],
      isActive: true,
    },
  });
  console.log('  ✅ Owner user (owner@christalinmirrors.com / Admin@1234)');

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
