const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 60, right: 60 },
  info: {
    Title: 'FHUSOCOM Student Portal User Manual',
    Author: 'FHUSOCOM Student Government',
    Subject: 'Student Portal Guide',
    Keywords: 'student, portal, manual, FHUSOCOM, guide',
  }
});

const outputPath = path.join(__dirname, 'Student_User_Manual.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Color constants
const BRAND_PRIMARY = '#2563eb';
const BRAND_SECONDARY = '#3b82f6';
const INK_DEFAULT = '#0f172a';
const INK_SOFT = '#334155';
const INK_MUTED = '#64748b';
const INK_FAINT = '#94a3b8';
const LINE_COLOR = '#e2e8f0';
const BG_SUBTLE = '#eff6ff';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';

// Helper functions
function drawRect(x, y, w, h, color, fill = true) {
  doc.save()
    .lineWidth(0)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .lineTo(x + w, y + h)
    .lineTo(x, y + h)
    .closePath();
  if (fill) doc.fillColor(color).fill();
  else doc.strokeColor(color).stroke();
  doc.restore();
}

function drawRoundedRect(x, y, w, h, r, color, fill = true) {
  doc.save()
    .lineWidth(0)
    .roundedRect(x, y, w, h, r);
  if (fill) doc.fillColor(color).fill();
  else doc.strokeColor(color).stroke();
  doc.restore();
}

function addText(text, x, y, options = {}) {
  const {
    size = 10,
    font = 'Helvetica',
    color = INK_DEFAULT,
    bold = false,
    italic = false,
    align = 'left',
    width = 500,
    lineGap = 2,
    opacity = 1
  } = options;
  
  doc.save()
    .fontSize(size)
    .font(bold ? 'Helvetica-Bold' : (italic ? 'Helvetica-Oblique' : font))
    .fillColor(color)
    .opacity(opacity)
    .text(text, x, y, { width, align, lineGap });
  doc.restore();
  return doc.y;
}

function addHeading(text, x, y, level = 1) {
  const sizes = { 1: 24, 2: 18, 3: 14, 4: 12 };
  const colors = { 1: INK_DEFAULT, 2: INK_SOFT, 3: BRAND_PRIMARY, 4: INK_DEFAULT };
  const fontStyles = { 1: 'Helvetica-Bold', 2: 'Helvetica-Bold', 3: 'Helvetica-Bold', 4: 'Helvetica-Bold' };
  
  doc.save()
    .fontSize(sizes[level])
    .font(fontStyles[level])
    .fillColor(colors[level])
    .text(text, x, y, { width: 480 });
  doc.restore();
  return doc.y;
}

function addBullet(text, x, y, options = {}) {
  const { size = 10, indent = 20, bulletChar = '•', color = INK_DEFAULT, bold = false } = options;
  doc.save()
    .fontSize(size)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fillColor(color)
    .text(bulletChar + '  ' + text, x + indent, y, { width: 480 - indent, lineGap: 2 });
  doc.restore();
  return doc.y;
}

function addStep(stepNum, text, x, y, options = {}) {
  const { size = 10, color = INK_DEFAULT } = options;
  doc.save()
    .fontSize(size)
    .font('Helvetica-Bold')
    .fillColor(BRAND_PRIMARY)
    .text(`${stepNum}.`, x, y, { width: 20 });
  doc.font('Helvetica')
    .fillColor(color)
    .text(text, x + 25, y, { width: 455, lineGap: 2 });
  doc.restore();
  return doc.y;
}

function drawLine(x1, y1, x2, y2, color = LINE_COLOR, width = 1) {
  doc.save()
    .strokeColor(color)
    .lineWidth(width)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
  doc.restore();
}

function checkPageBreak(minSpace = 100) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - minSpace) {
    doc.addPage();
  }
}

function drawMockupFrame(x, y, width, height, title) {
  // Window frame
  drawRoundedRect(x, y, width, height, 8, '#f1f5f9');
  // Title bar
  drawRoundedRect(x, y, width, 32, 8, '#ffffff', true);
  drawLine(x, y + 32, x + width, y + 32, LINE_COLOR);
  // Window controls
  drawRect(x + 12, y + 10, 10, 10, '#ef4444');
  drawRect(x + 28, y + 10, 10, 10, '#f59e0b');
  drawRect(x + 44, y + 10, 10, 10, '#10b981');
  addText(title, x + 70, y + 6, { size: 10, color: INK_MUTED, bold: true });
  // Content area border
  drawRoundedRect(x + 4, y + 38, width - 8, height - 42, 4, '#ffffff', true);
  drawRoundedRect(x + 4, y + 38, width - 8, height - 42, 4, LINE_COLOR, false);
}

// ===== COVER PAGE =====
checkPageBreak(400);
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

// Gradient-like header area
drawRect(0, 0, doc.page.width, 200, BRAND_PRIMARY);
addText('FHUSOCOM', 60, 70, { size: 48, font: 'Helvetica-Bold', color: '#ffffff' });
addText('Student Portal', 60, 120, { size: 28, font: 'Helvetica', color: '#ffffff', opacity: 0.9 });
addText('User Manual', 60, 160, { size: 22, font: 'Helvetica', color: '#ffffff', opacity: 0.8 });

// Decorative line
drawLine(60, 200, 540, 200, 'rgba(255,255,255,0.3)', 2);

// Main content
doc.y = 230;
addText('Complete Guide for Students', 60, 230, { size: 18, color: INK_SOFT });
addText('Version 1.0 · August 2026', 60, 255, { size: 12, color: INK_MUTED });

// Feature highlights
const features = [
  { icon: '📅', title: 'Events & Attendance', desc: 'View upcoming events, scan QR codes for attendance, track your history' },
  { icon: '💰', title: 'Fees & Payments', desc: 'View fee statements, upload proof of payment, track balance' },
  { icon: '📢', title: 'Announcements', desc: 'Stay updated with latest news from student government' },
  { icon: '📄', title: 'Transparency Docs', desc: 'Access financial reports, budgets, and official documents' },
  { icon: '🛡️', title: 'Sanctions & Records', desc: 'View your standing, sanctions history, and attendance rate' },
];

let yPos = 290;
features.forEach((f, i) => {
  checkPageBreak(80);
  drawRoundedRect(60, yPos, 480, 70, 8, BG_SUBTLE);
  addText(f.icon, 75, yPos + 15, { size: 28 });
  addText(f.title, 115, yPos + 10, { size: 14, bold: true, color: INK_DEFAULT });
  addText(f.desc, 115, yPos + 32, { size: 10, color: INK_MUTED, width: 410 });
  yPos += 80;
});

// Footer
addText('FHUSOCOM Student Government', 60, doc.page.height - 80, { size: 10, color: INK_FAINT, align: 'center', width: 480 });
addText('For internal use only', 60, doc.page.height - 65, { size: 9, color: INK_FAINT, align: 'center', width: 480 });

// ===== TABLE OF CONTENTS =====
doc.addPage();
doc.y = 60;
addHeading('TABLE OF CONTENTS', 60, 60, 1);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

const toc = [
  { num: '1', title: 'Getting Started', page: '3' },
  { num: '1.1', title: 'System Requirements', page: '3' },
  { num: '1.2', title: 'Signing In (Google SSO)', page: '3' },
  { num: '1.3', title: 'First Login & Profile Setup', page: '4' },
  { num: '2', title: 'Dashboard Overview', page: '5' },
  { num: '2.1', title: 'Home Page Layout', page: '5' },
  { num: '2.2', title: 'Key Metrics (KPI Cards)', page: '6' },
  { num: '2.3', title: 'Navigation Sidebar', page: '6' },
  { num: '2.4', title: 'Mobile Navigation', page: '7' },
  { num: '3', title: 'Core Features', page: '8' },
  { num: '3.1', title: 'Announcements', page: '8' },
  { num: '3.2', title: 'Events', page: '9' },
  { num: '3.3', title: 'Attendance Tracking', page: '10' },
  { num: '3.4', title: 'Fees & Payments', page: '11' },
  { num: '3.5', title: 'Transparency Documents', page: '12' },
  { num: '3.6', title: 'Sanctions & Standing', page: '13' },
  { num: '4', title: 'Profile & Settings', page: '14' },
  { num: '4.1', title: 'Viewing Your Profile', page: '14' },
  { num: '4.2', title: 'Updating Avatar', page: '14' },
  { num: '5', title: 'Troubleshooting & FAQ', page: '15' },
  { num: '6', title: 'Support & Contact', page: '16' },
];

toc.forEach(item => {
  checkPageBreak(30);
  const dots = '.'.repeat(Math.max(3, 60 - item.title.length - item.num.length - item.page.length));
  addText(`${item.num}  ${item.title}  ${dots}  ${item.page}`, 80, doc.y, { size: 11, color: INK_DEFAULT });
  doc.y += 18;
});

// ===== SECTION 1: GETTING STARTED =====
doc.addPage();
doc.y = 60;
addHeading('1. GETTING STARTED', 60, 60, 1);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

addHeading('1.1 System Requirements', 60, 100, 2);
const requirements = [
  'Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)',
  'Stable internet connection',
  'School-issued Google account (@school.edu.ph or similar)',
  'JavaScript enabled in browser settings',
  'Camera access (for QR code scanning at events)',
  'Minimum screen width: 320px (mobile responsive)',
];
requirements.forEach((r, i) => {
  checkPageBreak(25);
  addBullet(r, 80, doc.y);
  doc.y += 22;
});

addHeading('1.2 Signing In (Google SSO)', 60, doc.y + 10, 2);
checkPageBreak(150);

addText('The FHUSOCOM Student Portal uses Google Single Sign-On (SSO) with your school account.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 30;

const signInSteps = [
  'Open your browser and navigate to the FHUSOCOM portal URL',
  'Click "Student Sign In" on the landing page',
  'You will be redirected to the Google sign-in page',
  'Select your school Google account (must be @school.edu.ph domain)',
  'Grant permission for FHUSOCOM to access your basic profile',
  'Upon successful authentication, you will be redirected to your dashboard',
];
signInSteps.forEach((step, i) => {
  checkPageBreak(30);
  addStep(i + 1, step, 80, doc.y);
  doc.y += 28;
});

// Mockup: Sign-in page
checkPageBreak(200);
addText('Sign-In Page Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 20;
drawMockupFrame(80, doc.y, 300, 350, 'Student Sign In');
const mockY = doc.y + 48;
addText('┌─────────────────────────────────────┐', 90, mockY, { size: 9, color: INK_FAINT });
addText('│  FHUSOCOM                          │', 90, mockY + 14, { size: 9, color: INK_FAINT });
addText('│  Your campus life, one login away. │', 90, mockY + 28, { size: 9, color: INK_FAINT });
addText('│                                    │', 90, mockY + 42, { size: 9, color: INK_FAINT });
addText('│  [📅] Events with QR attendance   │', 90, mockY + 56, { size: 9, color: INK_MUTED });
addText('│  [🏛️] Fees you can view and pay  │', 90, mockY + 70, { size: 9, color: INK_MUTED });
addText('│  [🎓] Announcements & transparency│', 90, mockY + 84, { size: 9, color: INK_MUTED });
addText('│                                    │', 90, mockY + 98, { size: 9, color: INK_FAINT });
addText('│  ┌─────────────────────────────┐  │', 90, mockY + 112, { size: 9, color: INK_FAINT });
addText('│  │  G  Continue with Google   │  │', 90, mockY + 126, { size: 9, color: BRAND_PRIMARY });
addText('│  └─────────────────────────────┘  │', 90, mockY + 140, { size: 9, color: INK_FAINT });
addText('│                                    │', 90, mockY + 154, { size: 9, color: INK_FAINT });
addText('│  Students sign in with Google     │', 90, mockY + 168, { size: 8, color: INK_FAINT });
addText('│  using their school email.        │', 90, mockY + 182, { size: 8, color: INK_FAINT });
addText('└─────────────────────────────────────┘', 90, mockY + 196, { size: 9, color: INK_FAINT });
doc.y = doc.y + 400;

addHeading('1.3 First Login & Profile Setup', 60, doc.y + 10, 2);
checkPageBreak(100);

addText('After your first successful sign-in:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const firstLoginSteps = [
  'Your student record is automatically linked via your school email',
  'Complete your profile: upload a profile photo (optional but recommended)',
  'Verify your section and program information is correct',
  'Review the welcome banner showing your name, section, and current term',
  'Familiarize yourself with the sidebar navigation on the left',
];
firstLoginSteps.forEach((step, i) => {
  checkPageBreak(25);
  addBullet(step, 80, doc.y);
  doc.y += 22;
});

addText('Note: If you don\'t see your student dashboard and are redirected to the admin panel,', 80, doc.y + 10, { size: 10, color: RED, width: 420 });
addText('contact the system administrator — your account may be configured as an officer.', 80, doc.y + 25, { size: 10, color: RED, width: 420 });
doc.y += 45;

// ===== SECTION 2: DASHBOARD OVERVIEW =====
doc.addPage();
doc.y = 60;
addHeading('2. DASHBOARD OVERVIEW', 60, 60, 1);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

addHeading('2.1 Home Page Layout', 60, 100, 2);
checkPageBreak(100);

addText('The student dashboard is your central hub. It uses a responsive layout with:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const layoutItems = [
  { title: 'Header Bar (Top)', desc: 'Brand logo, breadcrumb navigation, notifications bell, user menu with avatar' },
  { title: 'Sidebar (Left, Desktop)', desc: 'Primary navigation: Home, Announcements, Events, Fees, Attendance, Transparency, Sanctions' },
  { title: 'Mobile Bottom Nav', desc: 'On screens < 1024px, a fixed bottom bar replaces the sidebar' },
  { title: 'Main Content Area', desc: 'Welcome banner, KPI overview cards, and sectioned content areas' },
  { title: 'Right Column (Desktop)', desc: 'Sanctions status, Fees summary, Quick Links' },
];

layoutItems.forEach(item => {
  checkPageBreak(40);
  addText(item.title, 80, doc.y, { size: 11, bold: true, color: INK_DEFAULT });
  doc.y += 16;
  addText(item.desc, 100, doc.y, { size: 10, color: INK_MUTED, width: 400 });
  doc.y += 28;
});

// Mockup: Dashboard layout
checkPageBreak(220);
addText('Desktop Dashboard Layout:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 280, 'Dashboard - Home');
const dashY = doc.y + 48;
addText('┌──────────────────────────────────────────────────────────────┐', 90, dashY, { size: 8, color: INK_FAINT });
addText('│ ≡  FHUSOCOM Student / Home    🔔  JD ▼                       │', 90, dashY + 14, { size: 8, color: INK_FAINT });
addText('├────────┬────────────────────────────────────────────────────┤', 90, dashY + 28, { size: 8, color: INK_FAINT });
addText('│        │  Welcome back, Juan Dela Cruz                      │', 90, dashY + 42, { size: 8, color: INK_FAINT });
addText('│  Home  │  BSCS-2-A · Term 1, 2025-2026         [Upload Fee] │', 90, dashY + 56, { size: 8, color: INK_FAINT });
addText('│  📢    │  [View Events]                                     │', 90, dashY + 70, { size: 8, color: INK_FAINT });
addText('│  📅    ├──────────┬──────────┬──────────┬──────────┐       │', 90, dashY + 84, { size: 8, color: INK_FAINT });
addText('│  💰    │Attendance│   Fees   │  Events  │ Records  │       │', 90, dashY + 98, { size: 8, color: INK_FAINT });
addText('│  📋    │  95.8%   │ Balance  │ Upcoming │Sanctions:│       │', 90, dashY + 112, { size: 8, color: INK_FAINT });
addText('│  📄    │  2 abs   │ ₱350     │    3     │   0      │       │', 90, dashY + 126, { size: 8, color: INK_FAINT });
addText('│  🛡️    └──────────┴──────────┴──────────┴──────────┘       │', 90, dashY + 140, { size: 8, color: INK_FAINT });
addText('│        │                                                    │', 90, dashY + 154, { size: 8, color: INK_FAINT });
addText('│        │  ┌───────────────┐  ┌─────────────────────────┐   │', 90, dashY + 168, { size: 8, color: INK_FAINT });
addText('│        │  │ Announcements │  │ Sanctions: Clean Record │   │', 90, dashY + 182, { size: 8, color: INK_FAINT });
addText('│        │  │   (3 new)     │  │                         │   │', 90, dashY + 196, { size: 8, color: INK_FAINT });
addText('│        │  ├───────────────┤  │ Fees: 1 Pending         │   │', 90, dashY + 210, { size: 8, color: INK_FAINT });
addText('│        │  │ Events        │  │ [Upload Proof]          │   │', 90, dashY + 224, { size: 8, color: INK_FAINT });
addText('│        │  ├───────────────┤  └─────────────────────────┘   │', 90, dashY + 238, { size: 8, color: INK_FAINT });
addText('│        │  │ Attendance    │                                 │', 90, dashY + 252, { size: 8, color: INK_FAINT });
addText('│        │  └───────────────┘                                 │', 90, dashY + 266, { size: 8, color: INK_FAINT });
addText('└────────┴────────────────────────────────────────────────────┘', 90, dashY + 280, { size: 8, color: INK_FAINT });
doc.y = dashY + 300;

addHeading('2.2 Key Metrics (KPI Cards)', 60, doc.y + 10, 2);
checkPageBreak(120);

addText('The dashboard displays 4 key metric cards at the top:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const kpis = [
  { title: 'My Attendance', metrics: ['Rate: 95.8% (above target)', 'Absences: 2 this term'], color: BRAND_PRIMARY },
  { title: 'Fees', metrics: ['Balance: ₱350 (1 pending)', 'Paid: ₱1,850 (84% of fees)'], color: EMERALD },
  { title: 'Events', metrics: ['Upcoming: 3 next week', 'Attended: 11 this term'], color: BRAND_PRIMARY },
  { title: 'My Records', metrics: ['Sanctions: 0 (clean record)', 'Transparency: 24 files available'], color: EMERALD },
];

kpis.forEach((kpi, i) => {
  checkPageBreak(60);
  const cardX = 80 + (i % 2) * 230;
  const cardY = doc.y + Math.floor(i / 2) * 70;
  
  if (i % 2 === 0 && i > 0) {
    doc.y = cardY - 5;
  }
  
  if (i % 2 === 0) {
    checkPageBreak(80);
  }
  
  // Draw card
  drawRoundedRect(cardX, doc.y, 210, 60, 8, BG_SUBTLE);
  drawLine(cardX, doc.y + 28, cardX + 210, doc.y + 28, LINE_COLOR);
  addText(kpi.title, cardX + 10, doc.y + 6, { size: 10, bold: true, color: INK_SOFT, width: 190 });
  kpi.metrics.forEach((m, mi) => {
    addText(m, cardX + 10, doc.y + 32 + mi * 14, { size: 9, color: INK_DEFAULT, width: 190 });
  });
  
  if (i % 2 === 1 || i === kpis.length - 1) {
    doc.y = doc.y + 70;
  }
});

addHeading('2.3 Navigation Sidebar', 60, doc.y + 10, 2);
checkPageBreak(150);

addText('The left sidebar (desktop) provides quick access to all sections:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const navItems = [
  { icon: '🏠', label: 'Home', desc: 'Main dashboard with all overview cards and sections' },
  { icon: '📢', label: 'Announcements', desc: 'Latest news from student government (scrolls to section)' },
  { icon: '📅', label: 'Events', desc: 'Upcoming events with QR attendance (scrolls to section)' },
  { icon: '💰', label: 'Fees', desc: 'Full fees management page (navigates to /fees)' },
  { icon: '📋', label: 'Attendance', desc: 'Your attendance log for this term (scrolls to section)' },
  { icon: '📄', label: 'Transparency', desc: 'Financial documents and reports (scrolls to section)' },
  { icon: '🛡️', label: 'Sanctions', desc: 'Your sanctions status (scrolls to section)' },
];

navItems.forEach(item => {
  checkPageBreak(30);
  addText(`${item.icon}  ${item.label}`, 80, doc.y, { size: 11, bold: true, color: INK_DEFAULT });
  addText(item.desc, 100, doc.y + 16, { size: 10, color: INK_MUTED, width: 400 });
  doc.y += 35;
});

// Sidebar mockup
checkPageBreak(200);
addText('Sidebar Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 180, 400, 'Sidebar');
const sideY = doc.y + 48;
const sidebarItems = [
  'FHUSOCOM',
  '▸ Home',
  '  📢 Announcements',
  '  📅 Events',
  '  💰 Fees',
  '  📋 Attendance',
  '  📄 Transparency',
  '  🛡️ Sanctions',
  '',
  'JD  Juan Dela Cruz',
  '    BSCS-2-A · Student',
];
sidebarItems.forEach((item, i) => {
  const isActive = item === '▸ Home';
  addText(item, 90, sideY + i * 20, { size: 9, color: isActive ? BRAND_PRIMARY : INK_MUTED, bold: isActive });
});
doc.y = sideY + 280;

addHeading('2.4 Mobile Navigation', 60, doc.y + 10, 2);
checkPageBreak(100);

addText('On mobile devices (< 1024px), the sidebar collapses into a fixed bottom navigation bar:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const mobileNav = [
  { icon: '🏠', label: 'Home', action: 'Scroll to top' },
  { icon: '📢', label: 'News', action: 'Scroll to Announcements' },
  { icon: '📅', label: 'Events', action: 'Open Events modal' },
  { icon: '📋', label: 'Attendance', action: 'Scroll to Attendance' },
  { icon: '📄', label: 'Docs', action: 'Scroll to Transparency' },
  { icon: '💰', label: 'Fees', action: 'Navigate to /dashboard/fees' },
];

// Mobile mockup
checkPageBreak(180);
addText('Mobile Bottom Navigation:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(150, doc.y, 300, 100, 'Mobile View');
const mobY = doc.y + 48;
addText('┌──────────────────────────────────────────────┐', 160, mobY, { size: 8, color: INK_FAINT });
addText('│  🏠     📢      📅      📋      📄      💰   │', 160, mobY + 20, { size: 12, color: INK_FAINT });
addText('│ Home   News   Events  Attend  Docs    Fees │', 160, mobY + 36, { size: 7, color: INK_FAINT });
addText('│  ●                      (active indicator)  │', 160, mobY + 50, { size: 8, color: BRAND_PRIMARY });
addText('└──────────────────────────────────────────────┘', 160, mobY + 64, { size: 8, color: INK_FAINT });
doc.y = mobY + 90;

addText('Active indicator shows current section. Tap Events to open the events modal.', 80, doc.y + 10, { size: 10, color: INK_MUTED, width: 420 });
doc.y += 40;

// ===== SECTION 3: CORE FEATURES =====
doc.addPage();
doc.y = 60;
addHeading('3. CORE FEATURES', 60, 60, 1);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

// 3.1 Announcements
addHeading('3.1 Announcements', 60, 100, 2);
checkPageBreak(100);

addText('Stay informed with the latest updates from your student government.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const announceFeatures = [
  'Displays up to 3 most recent announcements on the home dashboard',
  'Each announcement shows: title, preview text, category badge, and date',
  'Categories: Events (blue), Fees (amber), Policy (red), General (gray)',
  'Click "View all" to see the complete announcement history',
  'Announcements are created by officers and appear in real-time',
];

announceFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

// Mockup
checkPageBreak(150);
addText('Announcements Section Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 180, 'Announcements');
const annY = doc.y + 48;
addText('┌────────────────────────────────────────────────────────────────────┐', 90, annY, { size: 8, color: INK_FAINT });
addText('│  📢 Ann                                              3 new        │', 90, annY + 14, { size: 8, color: INK_FAINT });
addText('│  Latest news from the student government                          │', 90, annY + 28, { size: 8, color: INK_MUTED });
addText('├────────────────────────────────────────────────────────────────────┤', 90, annY + 42, { size: 8, color: INK_FAINT });
addText('│  📅  Intramurals 2026 Schedule Released                           │', 90, annY + 56, { size: 8, color: INK_DEFAULT });
addText('│       Full game schedule, venue assignments, and team rosters... │', 90, annY + 70, { size: 7, color: INK_MUTED });
addText('│       [Events]  Aug 14, 2026                                     │', 90, annY + 84, { size: 7, color: INK_FAINT });
addText('├────────────────────────────────────────────────────────────────────┤', 90, annY + 98, { size: 8, color: INK_FAINT });
addText('│  💰  Fee Reminder: Membership Fee Due Aug 30                      │', 90, annY + 112, { size: 8, color: INK_DEFAULT });
addText('│       Upload your proof of payment on the Fees page before...    │', 90, annY + 126, { size: 7, color: INK_MUTED });
addText('│       [Fees]  Aug 12, 2026                                       │', 90, annY + 140, { size: 7, color: INK_FAINT });
addText('└────────────────────────────────────────────────────────────────────┘', 90, annY + 154, { size: 8, color: INK_FAINT });
doc.y = annY + 180;

// 3.2 Events
doc.addPage();
doc.y = 60;
addHeading('3.2 Events', 60, 60, 2);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

addText('View and manage your event participation. Events are displayed in a card grid.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const eventFeatures = [
  'Upcoming events show date, time, location, and attendance requirement',
  'Live events (currently happening) are highlighted with a "Live" badge',
  'Required attendance events show a QR code scanner prompt: "Scan at door"',
  'Optional events show "Free entry" badge',
  'Events modal (mobile) or section (desktop) shows full event details',
  'Past events are listed in reverse chronological order',
];

eventFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

checkPageBreak(150);
addText('Events Section Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 180, 'Upcoming Events');
const evtY = doc.y + 48;
addText('┌────────────────────────────────────────────────────────────────────┐', 90, evtY, { size: 8, color: INK_FAINT });
addText('│  📅 Upcoming Events                                            View all │', 90, evtY + 14, { size: 8, color: INK_FAINT });
addText('│  Events you can attend this term                                  │', 90, evtY + 28, { size: 8, color: INK_MUTED });
addText('├─────────────────────────┬─────────────────────────────────────────┤', 90, evtY + 42, { size: 8, color: INK_FAINT });
addText('│  21 Aug  ██████████████  │  Intramurals Opening Ceremony         │', 90, evtY + 56, { size: 8, color: INK_FAINT });
addText('│      Intramurals        │  7:00 AM · Gymnasium · Required        │', 90, evtY + 70, { size: 7, color: INK_MUTED });
addText('│                          │  [📷 Scan at door]                    │', 90, evtY + 84, { size: 7, color: BRAND_PRIMARY });
addText('├─────────────────────────┼─────────────────────────────────────────┤', 90, evtY + 98, { size: 8, color: INK_FAINT });
addText('│  27 Aug  ██████████████  │  Founder\'s Day Celebration            │', 90, evtY + 112, { size: 8, color: INK_FAINT });
addText('│      Founder\'s Day      │  9:00 AM · Main Hall · Optional        │', 90, evtY + 126, { size: 7, color: INK_MUTED });
addText('│                          │  [✓ Free entry]                       │', 90, evtY + 140, { size: 7, color: EMERALD });
addText('└─────────────────────────┴─────────────────────────────────────────┘', 90, evtY + 154, { size: 8, color: INK_FAINT });
doc.y = evtY + 180;

// 3.3 Attendance Tracking
addHeading('3.3 Attendance Tracking', 60, doc.y + 10, 2);
checkPageBreak(100);

addText('Monitor your attendance rate and history. The system tracks:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const attendFeatures = [
  'Overall attendance rate percentage (target: typically 80%+)',
  'Number of absences this term',
  'Detailed log of each event: Present, Late, Absent, Excused, Not Scanned',
  'Real-time status for live events (shows "Not Scanned" until you check in)',
  'Check-in/check-out timestamps for completed events',
  'Missing more than 3 required events without excuse may trigger a sanction',
];

attendFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

checkPageBreak(180);
addText('Attendance Log Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 220, 'My Attendance');
const attY = doc.y + 48;
addText('┌────────────────────────────────────────────────────────────────────┐', 90, attY, { size: 8, color: INK_FAINT });
addText('│  👥 My Attendance                                    95.8% rate  │', 90, attY + 14, { size: 8, color: INK_FAINT });
addText('│  Your attendance log for this term                                │', 90, attY + 28, { size: 8, color: INK_MUTED });
addText('├────────────────────────────────────────────────────────────────────┤', 90, attY + 42, { size: 8, color: INK_FAINT });
addText('│  ✅  General Assembly          Aug 10, 2026 · 8:00 AM    Present │', 90, attY + 56, { size: 8, color: INK_FAINT });
addText('│  ✅  Leadership Summit         Aug 5, 2026 · 1:00 PM     Present │', 90, attY + 70, { size: 8, color: INK_FAINT });
addText('│  ⏰  Academic Week Kickoff     Aug 3, 2026 · 9:00 AM     Late    │', 90, attY + 84, { size: 8, color: INK_FAINT });
addText('│  ❌  Foundation Day            Jul 28, 2026 · 8:00 AM    Absent  │', 90, attY + 98, { size: 8, color: INK_FAINT });
addText('│  📷  Intramurals Opening       Aug 21, 2026 · 7:00 AM    Not     │', 90, attY + 112, { size: 8, color: INK_FAINT });
addText('│       Ceremony                                                    │', 90, attY + 126, { size: 8, color: INK_FAINT });
addText('│                                                                  │', 90, attY + 140, { size: 8, color: INK_FAINT });
addText('│  Legend: ✅ Present  ⏰ Late  ❌ Absent  📷 Scan Required       │', 90, attY + 154, { size: 7, color: INK_MUTED });
addText('└────────────────────────────────────────────────────────────────────┘', 90, attY + 168, { size: 8, color: INK_FAINT });
doc.y = attY + 190;

// 3.4 Fees & Payments
doc.addPage();
doc.y = 60;
addHeading('3.4 Fees & Payments', 60, 60, 2);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

addText('Manage your financial obligations to the student government.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const feeFeatures = [
  'View all fees issued for the current term',
  'Each fee shows: title, amount, due date, and status (Paid/Pending/Unpaid)',
  'Summary cards: Total Fees, Amount Paid, Balance Due',
  'Upload proof of payment (JPG, PNG, or PDF, max 5 MB)',
  'Proofs are verified by the Treasurer — you\'ll be notified of approval/rejection',
  'Pending fees show "Awaiting proof" until you submit documentation',
  'Paid fees show submission date and verification timestamp',
];

feeFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

// Fees page mockup
checkPageBreak(200);
addText('Fees Page Design (/dashboard/fees):', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 300, 'My Fees');
const feeY = doc.y + 48;
addText('┌────────────────────────────────────────────────────────────────────┐', 90, feeY, { size: 8, color: INK_FAINT });
addText('│  My Fees                                              [Manage]   │', 90, feeY + 14, { size: 8, color: INK_FAINT });
addText('│  View your fee obligations and upload proof of payment           │', 90, feeY + 28, { size: 8, color: INK_MUTED });
addText('├──────────┬──────────┬──────────┬────────────────────────────────┤', 90, feeY + 42, { size: 8, color: INK_FAINT });
addText('│ Total    │  Paid    │ Balance  │ Fee Statements                 │', 90, feeY + 56, { size: 8, color: INK_FAINT });
addText('│ ₱2,200   │ ₱1,850   │  ₱350    │ ┌────────────────────────────┐ │', 90, feeY + 70, { size: 8, color: INK_FAINT });
addText('│ this term│  84%     │ 1 pending│ │ ✅ Membership Fee  ₱1,850  │ │', 90, feeY + 84, { size: 8, color: INK_FAINT });
addText('└──────────┴──────────┴──────────┤ Due Jun 30 · Paid Aug 5  │ │', 90, feeY + 98, { size: 8, color: INK_FAINT });
addText('                                 │ [Paid]                       │ │', 90, feeY + 112, { size: 8, color: INK_FAINT });
addText('                                 ├────────────────────────────┤ │', 90, feeY + 126, { size: 8, color: INK_FAINT });
addText('                                 │ ⏳ Activity Fee    ₱350    │ │', 90, feeY + 140, { size: 8, color: INK_FAINT });
addText('                                 │ Due Aug 30 · Awaiting proof│ │', 90, feeY + 154, { size: 8, color: INK_FAINT });
addText('                                 │ [Pending]                    │ │', 90, feeY + 168, { size: 8, color: INK_FAINT });
addText('                                 └────────────────────────────┘ │', 90, feeY + 182, { size: 8, color: INK_FAINT });
addText('├────────────────────────────────────────────────────────────────┤', 90, feeY + 196, { size: 8, color: INK_FAINT });
addText('│  Upload Proof of Payment                                        │', 90, feeY + 210, { size: 8, color: INK_FAINT });
addText('│  Select Fee: [Activity Fee · ₱350 ▼]                           │', 90, feeY + 224, { size: 8, color: INK_FAINT });
addText('│  Proof File: [Choose File]  (JPG, PNG, PDF · Max 5 MB)        │', 90, feeY + 238, { size: 8, color: INK_FAINT });
addText('│  [📤 Submit for Verification]                                  │', 90, feeY + 252, { size: 8, color: BRAND_PRIMARY });
addText('│  Proofs are verified by the Treasurer. You will be notified... │', 90, feeY + 266, { size: 7, color: INK_MUTED });
addText('└────────────────────────────────────────────────────────────────┘', 90, feeY + 280, { size: 8, color: INK_FAINT });
doc.y = feeY + 300;

// 3.5 Transparency Documents
addHeading('3.5 Transparency Documents', 60, doc.y + 10, 2);
checkPageBreak(100);

addText('Access official financial documents and reports for full transparency.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const transFeatures = [
  'Browse all uploaded transparency files (financial reports, budgets, minutes)',
  'Categories: Financial (green), Events (violet), Minutes (amber), Reports (blue)',
  'Each file shows: title, category, upload date, uploaded by, file size',
  'Click download icon to save PDF documents locally',
  'Files are uploaded by the Treasurer and other authorized officers',
  'Home dashboard shows latest 6 files; click "Browse all" for complete list',
];

transFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

checkPageBreak(150);
addText('Transparency Section Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 440, 160, 'Transparency');
const transY = doc.y + 48;
addText('┌────────────────────────────────────────────────────────────────────┐', 90, transY, { size: 8, color: INK_FAINT });
addText('│  📄 Transparency                                        Browse all │', 90, transY + 14, { size: 8, color: INK_FAINT });
addText('│  Financial documents and reports                                  │', 90, transY + 28, { size: 8, color: INK_MUTED });
addText('├────────────────────────────────────────────────────────────────────┤', 90, transY + 42, { size: 8, color: INK_FAINT });
addText('│  📄  Financial Report - July 2026                                 │', 90, transY + 56, { size: 8, color: INK_FAINT });
addText('│       Uploaded by Treasurer · 1.2 MB PDF          [⬇ Download]   │', 90, transY + 70, { size: 7, color: INK_MUTED });
addText('├────────────────────────────────────────────────────────────────────┤', 90, transY + 84, { size: 8, color: INK_FAINT });
addText('│  📄  Fiscal Year Budget Summary 2025-2026                        │', 90, transY + 98, { size: 8, color: INK_FAINT });
addText('│       Uploaded by Treasurer · 890 KB PDF           [⬇ Download]  │', 90, transY + 112, { size: 7, color: INK_MUTED });
addText('└────────────────────────────────────────────────────────────────────┘', 90, transY + 126, { size: 8, color: INK_FAINT });
doc.y = transY + 150;

// 3.6 Sanctions & Standing
doc.addPage();
doc.y = 60;
addHeading('3.6 Sanctions & Standing', 60, 60, 2);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

addText('View your disciplinary standing and any active sanctions.', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const sanctionFeatures = [
  'Shows count of open sanctions (target: 0 for clean record)',
  'Each sanction displays: title, reason, requirement (if any), status, issue date',
  'Statuses: Open (requires action), Resolved, Appealed',
  'Clean record shows green "No sanctions on record" badge',
  'Attendance below threshold may trigger automatic sanctions',
  'Sanctions are issued by officers and reviewed by the student government',
];

sanctionFeatures.forEach(f => {
  checkPageBreak(25);
  addBullet(f, 80, doc.y);
  doc.y += 22;
});

checkPageBreak(150);
addText('Sanctions Section Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(80, doc.y, 280, 160, 'My Sanctions');
const sancY = doc.y + 48;
addText('┌────────────────────────────────────────┐', 90, sancY, { size: 8, color: INK_FAINT });
addText('│  ✅ My Sanctions              Clean    │', 90, sancY + 14, { size: 8, color: INK_FAINT });
addText('│  You have no active sanctions. Keep    │', 90, sancY + 28, { size: 8, color: INK_MUTED });
addText('│  your attendance above the threshold   │', 90, sancY + 42, { size: 8, color: INK_MUTED });
addText('│  to stay in good standing.             │', 90, sancY + 56, { size: 8, color: INK_MUTED });
addText('│                                        │', 90, sancY + 70, { size: 8, color: INK_FAINT });
addText('│  ✅ No sanctions on record            │', 90, sancY + 84, { size: 8, color: EMERALD });
addText('└────────────────────────────────────────┘', 90, sancY + 98, { size: 8, color: INK_FAINT });
doc.y = sancY + 130;

// ===== SECTION 4: PROFILE & SETTINGS =====
addHeading('4. PROFILE & SETTINGS', 60, doc.y + 10, 2);
checkPageBreak(100);

addHeading('4.1 Viewing Your Profile', 60, doc.y + 10, 3);
checkPageBreak(80);

addText('Access your profile from the user menu (top-right corner):', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const profileSteps = [
  'Click your avatar/initials in the top-right header',
  'Select "View Profile" from the dropdown menu',
  'Profile modal shows: name, email, student ID, section, program, avatar',
  'You can also see your account status (active/suspended)',
];
profileSteps.forEach((step, i) => {
  checkPageBreak(25);
  addStep(i + 1, step, 80, doc.y);
  doc.y += 28;
});

addHeading('4.2 Updating Avatar', 60, doc.y + 10, 3);
checkPageBreak(80);

addText('To update your profile picture:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const avatarSteps = [
  'Open the profile modal (see above)',
  'Click the camera icon on your current avatar',
  'Select an image file (JPG/PNG, recommended: square aspect ratio)',
  'Crop/position as needed, then save',
  'Changes sync immediately across the portal',
];
avatarSteps.forEach((step, i) => {
  checkPageBreak(25);
  addStep(i + 1, step, 80, doc.y);
  doc.y += 28;
});

// Profile modal mockup
checkPageBreak(180);
addText('Profile Modal Design:', 80, doc.y, { size: 11, bold: true, color: INK_SOFT });
doc.y += 15;
drawMockupFrame(150, doc.y, 300, 280, 'Profile');
const profY = doc.y + 48;
addText('┌──────────────────────────────────────────────┐', 160, profY, { size: 8, color: INK_FAINT });
addText('│  [JD]  📷  Juan Dela Cruz                   │', 160, profY + 20, { size: 8, color: INK_FAINT });
addText('│       juan.delacruz@school.edu.ph           │', 160, profY + 34, { size: 7, color: INK_MUTED });
addText('│       Student ID: 2023-12345                │', 160, profY + 48, { size: 7, color: INK_MUTED });
addText('│       BSCS-2-A · Computer Science           │', 160, profY + 62, { size: 7, color: INK_MUTED });
addText('│       Status: Active                        │', 160, profY + 76, { size: 7, color: EMERALD });
addText('├──────────────────────────────────────────────┤', 160, profY + 90, { size: 8, color: INK_FAINT });
addText('│  [Save Changes]          [Close]            │', 160, profY + 104, { size: 8, color: INK_FAINT });
addText('└──────────────────────────────────────────────┘', 160, profY + 118, { size: 8, color: INK_FAINT });
doc.y = profY + 140;

// ===== SECTION 5: TROUBLESHOOTING =====
doc.addPage();
doc.y = 60;
addHeading('5. TROUBLESHOOTING & FAQ', 60, 60, 1);
drawLine(60, 90, 540, 90, BRAND_PRIMARY, 2);

const faqs = [
  {
    q: 'I cannot sign in — "Access denied" or redirected to admin panel.',
    a: 'Ensure you are using your school Google account (not personal). If you\'re an officer, use /login/officers instead. Contact admin if your role is misconfigured.'
  },
  {
    q: 'My attendance rate seems wrong.',
    a: 'Rate = (Present check-ins) / (Total attendance records). Events without attendance tracking don\'t count. Late arrivals count as present. Contact officers if an event is missing.'
  },
  {
    q: 'I uploaded a fee proof but it\'s still "Pending".',
    a: 'Proofs are manually verified by the Treasurer. This typically takes 1-2 business days. You\'ll receive a notification when the status changes to "Paid" or "Rejected".'
  },
  {
    q: 'I don\'t see an event I attended.',
    a: 'Events only appear if created by officers for the current term. Past terms\' events are archived. Ask your officer to create the event if missing.'
  },
  {
    q: 'The QR scanner won\'t open at an event.',
    a: 'Grant camera permission in your browser settings. Use HTTPS (required for camera API). Ensure good lighting. If issues persist, ask the event organizer for manual check-in.'
  },
  {
    q: 'Mobile navigation doesn\'t work / bottom bar missing.',
    a: 'The bottom nav appears only on screens < 1024px wide. On tablets/desktop, use the left sidebar. Refresh the page if it doesn\'t appear after resizing.'
  },
  {
    q: 'Transparency documents won\'t download.',
    a: 'Check browser download permissions. Some browsers block auto-downloads. Right-click the download icon and "Save link as..." as an alternative.'
  },
  {
    q: 'My section/program info is incorrect.',
    a: 'This data comes from the registrar\'s office via the admin panel. Contact your student government officers to request a correction.'
  },
];

faqs.forEach((faq, i) => {
  checkPageBreak(80);
  addText(`Q${i + 1}: ${faq.q}`, 80, doc.y, { size: 11, bold: true, color: BRAND_PRIMARY, width: 420 });
  doc.y += 20;
  addText(`A: ${faq.a}`, 100, doc.y, { size: 10, color: INK_DEFAULT, width: 400 });
  doc.y += 35;
});

// ===== SECTION 6: SUPPORT =====
addHeading('6. SUPPORT & CONTACT', 60, doc.y + 10, 1);
drawLine(60, doc.y + 30, 540, doc.y + 30, BRAND_PRIMARY, 2);
doc.y += 40;

addText('For technical issues or questions about the portal:', 80, doc.y, { size: 11, color: INK_SOFT, width: 420 });
doc.y += 25;

const support = [
  'Email: support@fhusocom.edu.ph',
  'Office: Student Government Office, Room 204, Main Building',
  'Hours: Monday–Friday, 8:00 AM – 5:00 PM',
  'In-app: Use the notification bell for system announcements',
  'Emergency: Contact your section representative or batch governor',
];

support.forEach(s => {
  checkPageBreak(25);
  addBullet(s, 80, doc.y);
  doc.y += 22;
});

doc.y += 30;
addText('Document Version: 1.0', 80, doc.y, { size: 10, color: INK_FAINT });
addText('Last Updated: August 2026', 80, doc.y + 15, { size: 10, color: INK_FAINT });
addText('FHUSOCOM Student Government — All Rights Reserved', 80, doc.y + 30, { size: 10, color: INK_FAINT });

// Finalize
doc.end();

console.log(`PDF generated: ${outputPath}`);