import jsPDF from 'jspdf';

// ═══════════════════════════════════════════════════════════════════
// FayaPoint Certificate Generator
// Inspired by Harvard, Oxford, MIT certificate design traditions
// ═══════════════════════════════════════════════════════════════════

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  courseDescription: string;
  courseLevel: string;
  courseDuration: string;
  courseCategory: string;
  completionDate: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  quizScore: number;
  totalStudyHours: number;
  chaptersCompleted: number;
  totalChapters: number;
  issuedAt: string;
}

// ─── Color Palette (Deep academic tones) ───
const COLORS = {
  parchment: '#FEFCF3',
  parchmentDark: '#F5EFD8',
  parchmentMid: '#FAF6E8',
  gold: '#B8860B',
  goldLight: '#D4A843',
  goldDark: '#8B6914',
  navy: '#1B2A4A',
  navyLight: '#2C4066',
  ink: '#1a1a2e',
  inkLight: '#333355',
  burgundy: '#722F37',
  burgundyLight: '#8B3A3A',
  seal: '#B8860B',
  borderOuter: '#B8860B',
  borderInner: '#D4A843',
  watermark: 'rgba(184, 134, 11, 0.04)',
  textPrimary: '#1B2A4A',
  textSecondary: '#4A4A6A',
  textTertiary: '#6B6B8A',
};

function drawTexturedBackground(doc: jsPDF, w: number, h: number) {
  // Base parchment
  doc.setFillColor(COLORS.parchment);
  doc.rect(0, 0, w, h, 'F');

  // Subtle parchment texture via overlapping semi-transparent shapes
  doc.setGState(doc.GState({ opacity: 0.015 }));
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = Math.random() * 8 + 2;
    doc.setFillColor(Math.random() > 0.5 ? '#D4C8A0' : '#E8DFC0');
    doc.circle(x, y, size, 'F');
  }

  // Aged vignette effect — darker corners
  doc.setGState(doc.GState({ opacity: 0.03 }));
  doc.setFillColor('#C0B090');
  // Top-left
  doc.circle(0, 0, 120, 'F');
  // Top-right
  doc.circle(w, 0, 120, 'F');
  // Bottom-left
  doc.circle(0, h, 120, 'F');
  // Bottom-right
  doc.circle(w, h, 120, 'F');

  // Reset opacity
  doc.setGState(doc.GState({ opacity: 1 }));
}

function drawOrnamentalBorder(doc: jsPDF, w: number, h: number) {
  const margin = 12;
  const innerMargin = 16;
  const cornerSize = 6;

  // Outer gold border
  doc.setDrawColor(COLORS.borderOuter);
  doc.setLineWidth(2.5);
  doc.rect(margin, margin, w - margin * 2, h - margin * 2);

  // Inner thin gold border
  doc.setDrawColor(COLORS.borderInner);
  doc.setLineWidth(0.5);
  doc.rect(innerMargin, innerMargin, w - innerMargin * 2, h - innerMargin * 2);

  // Double-line accent border
  doc.setLineWidth(0.3);
  doc.rect(innerMargin + 2, innerMargin + 2, w - (innerMargin + 2) * 2, h - (innerMargin + 2) * 2);

  // ─── Corner ornaments (filigree-style) ───
  doc.setDrawColor(COLORS.gold);
  doc.setLineWidth(1.2);

  const corners = [
    { x: margin + 2, y: margin + 2, dx: 1, dy: 1 },
    { x: w - margin - 2, y: margin + 2, dx: -1, dy: 1 },
    { x: margin + 2, y: h - margin - 2, dx: 1, dy: -1 },
    { x: w - margin - 2, y: h - margin - 2, dx: -1, dy: -1 },
  ];

  corners.forEach(({ x, y, dx, dy }) => {
    // L-shaped corner flourish
    doc.line(x, y, x + cornerSize * dx * 3, y);
    doc.line(x, y, x, y + cornerSize * dy * 3);

    // Small diamond at corner
    const cx = x + cornerSize * dx * 0.8;
    const cy = y + cornerSize * dy * 0.8;
    const ds = 1.5;
    doc.setFillColor(COLORS.gold);
    doc.triangle(cx, cy - ds, cx + ds, cy, cx, cy + ds, 'F');
    doc.triangle(cx, cy - ds, cx - ds, cy, cx, cy + ds, 'F');
  });

  // ─── Top center decorative divider ───
  const centerX = w / 2;
  doc.setDrawColor(COLORS.gold);
  doc.setLineWidth(0.8);

  // Horizontal line with diamond center
  const dividerY = margin + 8;
  const dividerW = 60;
  doc.line(centerX - dividerW, dividerY, centerX - 4, dividerY);
  doc.line(centerX + 4, dividerY, centerX + dividerW, dividerY);

  // Center diamond
  doc.setFillColor(COLORS.gold);
  doc.triangle(centerX, dividerY - 3, centerX + 3, dividerY, centerX, dividerY + 3, 'F');
  doc.triangle(centerX, dividerY - 3, centerX - 3, dividerY, centerX, dividerY + 3, 'F');

  // ─── Bottom center decorative divider ───
  const bottomDivY = h - margin - 8;
  doc.line(centerX - dividerW, bottomDivY, centerX - 4, bottomDivY);
  doc.line(centerX + 4, bottomDivY, centerX + dividerW, bottomDivY);

  doc.setFillColor(COLORS.gold);
  doc.triangle(centerX, bottomDivY - 3, centerX + 3, bottomDivY, centerX, bottomDivY + 3, 'F');
  doc.triangle(centerX, bottomDivY - 3, centerX - 3, bottomDivY, centerX, bottomDivY + 3, 'F');
}

function drawWatermark(doc: jsPDF, w: number, h: number) {
  doc.setGState(doc.GState({ opacity: 0.035 }));
  doc.setFontSize(72);
  doc.setTextColor(COLORS.gold);
  doc.setFont('helvetica', 'bold');

  // Diagonal watermark
  doc.text('FAYAPOINT', w / 2, h / 2, {
    align: 'center',
    angle: 35,
  });

  doc.setGState(doc.GState({ opacity: 1 }));
}

function drawSeal(doc: jsPDF, x: number, y: number, radius: number) {
  // Outer ring
  doc.setDrawColor(COLORS.gold);
  doc.setLineWidth(2);
  doc.setFillColor(COLORS.parchment);
  doc.circle(x, y, radius, 'FD');

  // Inner ring
  doc.setLineWidth(1);
  doc.circle(x, y, radius - 3, 'D');

  // Decorative dots around the seal
  doc.setFillColor(COLORS.gold);
  const numDots = 24;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * Math.PI * 2;
    const dotX = x + Math.cos(angle) * (radius - 5.5);
    const dotY = y + Math.sin(angle) * (radius - 5.5);
    doc.circle(dotX, dotY, 0.5, 'F');
  }

  // Inner circle
  doc.setLineWidth(0.5);
  doc.circle(x, y, radius - 8, 'D');

  // Star in center
  doc.setFillColor(COLORS.gold);
  const starRadius = 5;
  const innerStarRadius = 2;
  const points = 5;
  const starPoints: [number, number][] = [];

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? starRadius : innerStarRadius;
    starPoints.push([x + Math.cos(angle) * r, y + Math.sin(angle) * r]);
  }

  // Draw star as filled polygon
  if (starPoints.length > 0) {
    doc.setFillColor(COLORS.gold);
    doc.setDrawColor(COLORS.goldDark);
    doc.setLineWidth(0.3);

    // Build path manually with triangles from center
    for (let i = 0; i < starPoints.length; i++) {
      const next = starPoints[(i + 1) % starPoints.length];
      doc.triangle(x, y, starPoints[i][0], starPoints[i][1], next[0], next[1], 'F');
    }
  }

  // Circular text: "FAYAPOINT" top, "CERTIFICADO" bottom
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.goldDark);

  const textRadius = radius - 11;
  const topText = 'FAYAPOINT ACADEMY';
  const bottomText = 'CERTIFICADO OFICIAL';

  // Top arc text
  const topStartAngle = -Math.PI / 2 - (topText.length * 0.07);
  for (let i = 0; i < topText.length; i++) {
    const angle = topStartAngle + i * 0.14;
    const tx = x + Math.cos(angle) * textRadius;
    const ty = y + Math.sin(angle) * textRadius;
    doc.text(topText[i], tx, ty, { angle: -(angle * 180 / Math.PI + 90) });
  }

  // Bottom arc text
  const bottomStartAngle = Math.PI / 2 + (bottomText.length * 0.07);
  for (let i = 0; i < bottomText.length; i++) {
    const angle = bottomStartAngle - i * 0.14;
    const tx = x + Math.cos(angle) * textRadius;
    const ty = y + Math.sin(angle) * textRadius;
    doc.text(bottomText[i], tx, ty, { angle: -(angle * 180 / Math.PI - 90) });
  }
}

function drawRibbon(doc: jsPDF, x: number, y: number) {
  // Small decorative ribbon below the seal
  doc.setFillColor(COLORS.burgundy);
  const rw = 20;
  const rh = 8;

  // Left ribbon tail
  doc.triangle(x - rw / 2, y, x - rw / 2 - 4, y + rh + 3, x - rw / 2 + 5, y + rh, 'F');
  // Right ribbon tail
  doc.triangle(x + rw / 2, y, x + rw / 2 + 4, y + rh + 3, x + rw / 2 - 5, y + rh, 'F');
  // Center ribbon
  doc.roundedRect(x - rw / 2, y - 2, rw, rh, 1, 1, 'F');

  // Ribbon text
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text('APROVADO', x, y + 3, { align: 'center' });
}

function drawHorizontalRule(doc: jsPDF, y: number, w: number) {
  const centerX = w / 2;
  const lineW = 80;

  doc.setDrawColor(COLORS.goldLight);
  doc.setLineWidth(0.4);
  doc.line(centerX - lineW, y, centerX - 6, y);
  doc.line(centerX + 6, y, centerX + lineW, y);

  // Small ornament in center
  doc.setFillColor(COLORS.goldLight);
  doc.circle(centerX, y, 1.2, 'F');
  doc.circle(centerX - 3.5, y, 0.6, 'F');
  doc.circle(centerX + 3.5, y, 0.6, 'F');
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  // Landscape A4
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const w = 297;
  const h = 210;

  // ═══════════════════════════════════════
  // 1. TEXTURED BACKGROUND
  // ═══════════════════════════════════════
  drawTexturedBackground(doc, w, h);

  // ═══════════════════════════════════════
  // 2. WATERMARK
  // ═══════════════════════════════════════
  drawWatermark(doc, w, h);

  // ═══════════════════════════════════════
  // 3. ORNAMENTAL BORDER
  // ═══════════════════════════════════════
  drawOrnamentalBorder(doc, w, h);

  // ═══════════════════════════════════════
  // 4. INSTITUTION HEADER
  // ═══════════════════════════════════════
  const centerX = w / 2;
  let curY = 30;

  // Institution name
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.goldDark);
  doc.text('F A Y A P O I N T', centerX, curY, { align: 'center' });

  curY += 5;
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textTertiary);
  doc.text('ACADEMIA DE TECNOLOGIA & INTELIG\u00CANCIA ARTIFICIAL', centerX, curY, { align: 'center' });

  // Decorative line under header
  curY += 5;
  drawHorizontalRule(doc, curY, w);

  // ═══════════════════════════════════════
  // 5. CERTIFICATE TITLE
  // ═══════════════════════════════════════
  curY += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(28);
  doc.setTextColor(COLORS.navy);
  doc.text('Certificado de Conclus\u00E3o', centerX, curY, { align: 'center' });

  curY += 6;
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textTertiary);
  doc.text('Certificate of Completion', centerX, curY, { align: 'center' });

  // ═══════════════════════════════════════
  // 6. CONFERRAL TEXT
  // ═══════════════════════════════════════
  curY += 11;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textSecondary);
  doc.text('Este certificado \u00E9 conferido a', centerX, curY, { align: 'center' });

  // ═══════════════════════════════════════
  // 7. STUDENT NAME (prominent)
  // ═══════════════════════════════════════
  curY += 12;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(26);
  doc.setTextColor(COLORS.navy);

  // Measure name to ensure it fits
  const nameWidth = doc.getTextWidth(data.studentName);
  const maxNameWidth = w - 80;
  if (nameWidth > maxNameWidth) {
    doc.setFontSize(20);
  }
  doc.text(data.studentName, centerX, curY, { align: 'center' });

  // Name underline
  curY += 3;
  const nameLineW = Math.min(nameWidth + 20, maxNameWidth);
  doc.setDrawColor(COLORS.goldLight);
  doc.setLineWidth(0.5);
  doc.line(centerX - nameLineW / 2, curY, centerX + nameLineW / 2, curY);

  // ═══════════════════════════════════════
  // 8. COMPLETION TEXT
  // ═══════════════════════════════════════
  curY += 9;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textSecondary);
  doc.text('por concluir com \u00EAxito e m\u00E9rito acadêmico o curso', centerX, curY, { align: 'center' });

  // ═══════════════════════════════════════
  // 9. COURSE TITLE
  // ═══════════════════════════════════════
  curY += 10;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLORS.burgundy);

  // Wrap course title if needed
  const courseLines = doc.splitTextToSize(data.courseTitle, maxNameWidth);
  doc.text(courseLines, centerX, curY, { align: 'center' });
  curY += courseLines.length * 7;

  // ═══════════════════════════════════════
  // 10. COURSE DESCRIPTION (italic, elegant)
  // ═══════════════════════════════════════
  if (data.courseDescription) {
    curY += 2;
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.textTertiary);
    const descLines = doc.splitTextToSize(data.courseDescription, w - 100);
    doc.text(descLines, centerX, curY, { align: 'center' });
    curY += descLines.length * 4;
  }

  // ═══════════════════════════════════════
  // 11. COURSE DETAILS LINE
  // ═══════════════════════════════════════
  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textTertiary);

  const detailParts = [];
  if (data.courseLevel) detailParts.push(`N\u00EDvel: ${data.courseLevel}`);
  if (data.courseDuration) detailParts.push(`Dura\u00E7\u00E3o: ${data.courseDuration}`);
  if (data.chaptersCompleted) detailParts.push(`Cap\u00EDtulos: ${data.chaptersCompleted}/${data.totalChapters}`);
  if (data.quizScore) detailParts.push(`Avalia\u00E7\u00E3o: ${data.quizScore}%`);

  doc.text(detailParts.join('   \u2022   '), centerX, curY, { align: 'center' });

  // Decorative separator
  curY += 6;
  drawHorizontalRule(doc, curY, w);

  // ═══════════════════════════════════════
  // 12. SEAL & SIGNATURES
  // ═══════════════════════════════════════
  curY += 6;

  // Left signature area
  const sigY = curY + 12;
  const sigLineW = 50;

  // Director signature
  doc.setDrawColor(COLORS.textTertiary);
  doc.setLineWidth(0.3);
  doc.line(55, sigY, 55 + sigLineW, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textSecondary);
  doc.text('Ricardo Faya', 55 + sigLineW / 2, sigY + 4, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textTertiary);
  doc.text('Diretor Acad\u00EAmico & Fundador', 55 + sigLineW / 2, sigY + 8, { align: 'center' });

  // Center seal
  drawSeal(doc, centerX, curY + 8, 15);
  drawRibbon(doc, centerX, curY + 24);

  // Right signature area (verification)
  doc.setDrawColor(COLORS.textTertiary);
  doc.setLineWidth(0.3);
  doc.line(w - 55 - sigLineW, sigY, w - 55, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textSecondary);
  doc.text('FayaPoint Academy', w - 55 - sigLineW / 2, sigY + 4, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textTertiary);
  doc.text('Certificado Digital Verificado', w - 55 - sigLineW / 2, sigY + 8, { align: 'center' });

  // ═══════════════════════════════════════
  // 13. FOOTER - Date, Certificate Number, Verification
  // ═══════════════════════════════════════
  const footerY = h - 26;

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.textTertiary);
  doc.text(`Emitido em ${data.completionDate}`, 30, footerY, { align: 'left' });

  // Certificate number
  doc.text(`Certificado N\u00BA ${data.certificateNumber}`, centerX, footerY, { align: 'center' });

  // Verification code
  doc.text(`C\u00F3digo de Verifica\u00E7\u00E3o: ${data.verificationCode}`, w - 30, footerY, { align: 'right' });

  // Verification URL
  doc.setFontSize(5.5);
  doc.setTextColor(COLORS.goldDark);
  doc.text(`Verifique em: ${data.verificationUrl}`, centerX, footerY + 5, { align: 'center' });

  // Small legal text
  doc.setFontSize(4.5);
  doc.setTextColor(COLORS.textTertiary);
  doc.text(
    'Este documento \u00E9 emitido digitalmente pela FayaPoint Academy e pode ser verificado no endere\u00E7o acima.',
    centerX,
    footerY + 9,
    { align: 'center' }
  );

  return doc;
}

export function generateCertificateBase64(data: CertificateData): string {
  const doc = generateCertificatePDF(data);
  return doc.output('datauristring');
}

export function generateCertificateBlob(data: CertificateData): Blob {
  const doc = generateCertificatePDF(data);
  return doc.output('blob');
}

export function generateCertificateArrayBuffer(data: CertificateData): ArrayBuffer {
  const doc = generateCertificatePDF(data);
  return doc.output('arraybuffer');
}
