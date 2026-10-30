const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outDir = path.resolve(__dirname, '../docs/diagrams');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive });
}

// ==========================================
// 1. DATA DEFINITION FOR TIMELINE 1 & 2
// ==========================================

const timelinePlotPrep = {
  id: 'timeline-plot-prep',
  title: 'Timeline: Plot Preparation for Rent',
  subtitle: 'FLOW 1 — NÔNG TRẠI & THỬA ĐẤT TỪ KHỞI TẠO ĐẾN NIÊM YẾT SÀN MARKETPLACE',
  footerLeft: '10/2026',
  footerCenter: 'FARMELY — SMART AGRIRENT PLATFORM',
  footerRight: '20',
  nodes: [
    {
      role: 'Administrator',
      roleSub: '(Quản trị viên)',
      rolePos: 'bottom', // 'top' or 'bottom'
      actionTitle: 'Create land & plot',
      actionTitleVi: 'Khởi tạo thửa đất',
      bullets: [
        'Vẽ ranh giới nông trại & lô đất (GIS Map)',
        'Định giá thuê theo mét vuông & chu kỳ',
        'Cấu hình các gói dịch vụ chăm sóc đi kèm',
        'Lưu trạng thái: Chưa kích hoạt (Inactive / Draft)'
      ],
      iconType: 'admin'
    },
    {
      role: 'Agri Expert',
      roleSub: '(Chuyên gia nông nghiệp)',
      rolePos: 'top',
      actionTitle: 'Agronomy setup',
      actionTitleVi: 'Thiết lập thổ nhưỡng & quy trình',
      bullets: [
        'Thẩm định mẫu đất & trạm thời tiết khu vực',
        'Gán danh mục giống cây tương thích (BR03)',
        'Soạn thảo quy trình chuẩn VietGAP 90 ngày (BR12)',
        'Xác nhận điều kiện nông học hoàn tất'
      ],
      iconType: 'expert'
    },
    {
      role: 'Administrator',
      roleSub: '(Phê duyệt & Niêm yết)',
      rolePos: 'bottom',
      actionTitle: 'Approve & Publish',
      actionTitleVi: 'Kiểm duyệt & Xuất bản',
      bullets: [
        'Kiểm tra checklist điều kiện sẵn sàng thửa đất',
        'Duyệt quy trình canh tác và cơ cấu giống',
        '1-Click chuyển trạng thái: Inactive ➔ Available',
        'Bật cờ Niêm yết công khai (Publish = True)'
      ],
      iconType: 'publish'
    },
    {
      role: 'Marketplace',
      roleSub: '(Sàn thương mại điện tử)',
      rolePos: 'top',
      actionTitle: 'Live Marketplace',
      actionTitleVi: 'Hiển thị cho khách thuê',
      bullets: [
        'Thửa đất hiển thị trực quan trên bản đồ số 2D/3D',
        'Công khai bảng giá, dịch vụ và giống được trồng',
        'Sẵn sàng cho Khách hàng lựa chọn và đặt cọc',
        'Chặn niêm yết nếu đất chưa qua chuyên gia duyệt'
      ],
      iconType: 'marketplace'
    }
  ]
};

const timelineRentalOps = {
  id: 'timeline-rental-ops',
  title: 'Timeline: Plot Rental & Cultivation',
  subtitle: 'FLOW 2 — HÀNH TRÌNH KHÁCH THUÊ ĐẤT, CANH TÁC VIETGAP VÀ THU HOẠCH GIAO TẬN NHÀ',
  footerLeft: '10/2026',
  footerCenter: 'FARMELY — SMART AGRIRENT PLATFORM',
  footerRight: '21',
  nodes: [
    {
      role: 'Customer',
      roleSub: '(Khách thuê)',
      rolePos: 'bottom',
      actionTitle: 'Create rental order',
      actionTitleVi: 'Tạo đơn thuê đất',
      bullets: [
        'Chọn mảnh đất phù hợp trên bản đồ số',
        'Chọn giống rau củ & gói chăm sóc VietGAP',
        'Ký hợp đồng thuê số (Digital Agreement)',
        'Thanh toán đặt cọc tiện lợi qua VNPAY'
      ],
      iconType: 'customer'
    },
    {
      role: 'Agri Expert',
      roleSub: '(Chuyên gia nông nghiệp)',
      rolePos: 'top',
      actionTitle: 'Approve & Schedule',
      actionTitleVi: 'Phê duyệt & Phân công',
      bullets: [
        'Xác nhận tính khả thi mùa vụ & hợp đồng',
        'Phân bổ nông dân phụ trách (Assign Worker)',
        'Kích hoạt lịch trình chăm sóc tự động 90 ngày'
      ],
      iconType: 'manager'
    },
    {
      role: 'Field Worker',
      roleSub: '(Nông dân tại vườn)',
      rolePos: 'bottom',
      actionTitle: 'Cultivation & Care',
      actionTitleVi: 'Chăm sóc & Nhật ký thực địa',
      bullets: [
        'Thực hiện các công việc theo đúng quy trình VietGAP',
        'Chụp ảnh minh chứng hiện trường bắt buộc',
        'Ghi nhận chỉ số thời tiết & nhật ký sinh trưởng',
        'Thu hoạch, cân sản lượng & chụp ảnh cân'
      ],
      iconType: 'worker'
    },
    {
      role: 'Delivery',
      roleSub: '(Giao hàng / Trải nghiệm)',
      rolePos: 'top',
      actionTitle: 'Harvest Delivery',
      actionTitleVi: 'Bàn giao nông sản sạch',
      bullets: [
        'Đóng thùng nông sản đạt chuẩn an toàn',
        'Giao hàng tận nhà qua đơn vị vận chuyển đối tác',
        'Hoặc đón khách hàng đến trải nghiệm thu hoạch'
      ],
      iconType: 'delivery'
    }
  ]
};

// ==========================================
// 2. SVG GENERATOR (Matches slide 100%)
// ==========================================

function getSvgIcon(type, cx, cy) {
  // Returns SVG paths for icon inside circle
  switch (type) {
    case 'admin':
      return `
        <!-- Admin / User settings icon -->
        <circle cx="${cx}" cy="${cy - 8}" r="11" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 18} ${cy + 18} C ${cx - 18} ${cy + 6}, ${cx + 18} ${cy + 6}, ${cx + 18} ${cy + 18}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
        <circle cx="${cx + 12}" cy="${cy - 10}" r="5" fill="#FFFFFF" />
      `;
    case 'expert':
      return `
        <!-- Agri Expert / Leaf & Microscope/Flask icon -->
        <path d="M ${cx - 14} ${cy + 12} C ${cx - 14} ${cy - 8}, ${cx} ${cy - 16}, ${cx + 14} ${cy - 16} C ${cx + 14} ${cy + 4}, ${cx} ${cy + 12}, ${cx - 14} ${cy + 12} Z" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 14} ${cy + 12} L ${cx + 8} ${cy - 8}" fill="none" stroke="#FFFFFF" stroke-width="2.5" />
      `;
    case 'publish':
      return `
        <!-- Checkmark & Badge / Publish icon -->
        <circle cx="${cx}" cy="${cy}" r="18" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 8} ${cy} L ${cx - 2} ${cy + 6} L ${cx + 9} ${cy - 6}" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      `;
    case 'marketplace':
      return `
        <!-- Storefront / Marketplace icon -->
        <path d="M ${cx - 16} ${cy - 6} L ${cx + 16} ${cy - 6} L ${cx + 12} ${cy + 14} L ${cx - 12} ${cy + 14} Z" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 18} ${cy - 6} L ${cx - 14} ${cy - 14} L ${cx + 14} ${cy - 14} L ${cx + 18} ${cy - 6}" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <line x1="${cx}" y1="${cy - 6}" x2="${cx}" y2="${cy + 14}" stroke="#FFFFFF" stroke-width="2" />
      `;
    case 'customer':
      return `
        <!-- Customer icon (user silhouette) -->
        <circle cx="${cx}" cy="${cy - 8}" r="11" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 18} ${cy + 18} C ${cx - 18} ${cy + 6}, ${cx + 18} ${cy + 6}, ${cx + 18} ${cy + 18}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
      `;
    case 'manager':
      return `
        <!-- Manager in suit icon -->
        <circle cx="${cx}" cy="${cy - 8}" r="10" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx - 16} ${cy + 18} L ${cx - 10} ${cy + 8} L ${cx - 4} ${cy + 12} L ${cx} ${cy + 7} L ${cx + 4} ${cy + 12} L ${cx + 10} ${cy + 8} L ${cx + 16} ${cy + 18}" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <rect x="${cx - 12}" y="${cy + 7}" width="6" height="3" fill="#FFFFFF" rx="1" />
      `;
    case 'worker':
      return `
        <!-- Package / Box icon (like staff in reference) -->
        <path d="M ${cx} ${cy - 16} L ${cx + 16} ${cy - 6} L ${cx + 16} ${cy + 12} L ${cx} ${cy + 18} L ${cx - 16} ${cy + 12} L ${cx - 16} ${cy - 6} Z" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M ${cx} ${cy - 16} L ${cx} ${cy + 18}" stroke="#FFFFFF" stroke-width="2.5" />
        <path d="M ${cx - 16} ${cy - 6} L ${cx} ${cy + 3} L ${cx + 16} ${cy - 6}" stroke="#FFFFFF" stroke-width="2.5" />
      `;
    case 'delivery':
      return `
        <!-- Delivery truck icon -->
        <rect x="${cx - 18}" y="${cy - 10}" width="22" height="18" fill="none" stroke="#FFFFFF" stroke-width="3" rx="2" />
        <path d="M ${cx + 4} ${cy - 4} L ${cx + 12} ${cy - 4} L ${cx + 18} ${cy + 2} L ${cx + 18} ${cy + 8} L ${cx + 4} ${cy + 8} Z" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <circle cx="${cx - 9}" cy="${cy + 11}" r="4" fill="#FFFFFF" />
        <circle cx="${cx + 11}" cy="${cy + 11}" r="4" fill="#FFFFFF" />
      `;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="10" fill="#FFFFFF" />`;
  }
}

function generateSvgTimeline(data) {
  const width = 1280;
  const height = 720;
  
  // Theme palette matching student presentation aesthetic:
  // Slide background: pure clean off-white / light cream
  // Bar: soft elegant dusty rose #EAD6D6
  // Circle: warm rose-terracotta #BA8481
  // Headings: dark slate / charcoal #2B2625
  // Bullets: #4A403E
  const bgColor = '#FFFFFF';
  const barColor = '#EAD6D6';
  const circleColor = '#BA8481';
  const stemColor = '#3D3432';
  const textDark = '#2B2625';
  const bulletDark = '#4A403E';
  
  const barY = 360;
  const barHeight = 44;
  const circleRadius = 40;
  
  // Coordinates for 4 nodes
  const xs = [190, 480, 770, 1060];
  
  let nodesSvg = '';
  
  data.nodes.forEach((node, idx) => {
    const cx = xs[idx];
    const isTopAction = (idx % 2 === 0); // 0 & 2 have actions ABOVE, 1 & 3 have actions BELOW (alternating!)
    
    // Circle Node & Icon
    const circleSvg = `
      <circle cx="${cx}" cy="${barY}" r="${circleRadius}" fill="${circleColor}" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.12))" />
      ${getSvgIcon(node.iconType, cx, barY)}
    `;
    
    if (isTopAction) {
      // Role label BELOW circle
      const roleSvg = `
        <text x="${cx}" y="${barY + 65}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="19" font-weight="800" fill="${textDark}" text-anchor="middle">
          ${node.role}
        </text>
        <text x="${cx}" y="${barY + 86}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="500" fill="#786B69" text-anchor="middle">
          ${node.roleSub}
        </text>
      `;
      
      // Stem line UP to top text
      const stemTopY = 245;
      const stemSvg = `
        <line x1="${cx}" y1="${barY - circleRadius - 4}" x2="${cx}" y2="${stemTopY}" stroke="${stemColor}" stroke-width="2" />
        <circle cx="${cx}" cy="${stemTopY}" r="4.5" fill="${stemColor}" />
      `;
      
      // Action group ABOVE
      const textX = cx - 110;
      let bulletsHtml = '';
      node.bullets.forEach((b, bIdx) => {
        bulletsHtml += `
          <g transform="translate(${textX}, ${stemTopY - 45 + bIdx * 24})">
            <circle cx="5" cy="-5" r="3.5" fill="${stemColor}" />
            <text x="16" y="0" font-family="'Inter', 'Segoe UI', sans-serif" font-size="13" font-weight="400" fill="${bulletDark}">
              ${b}
            </text>
          </g>
        `;
      });
      
      const actionHeaderSvg = `
        <text x="${textX}" y="${stemTopY - 60}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="17" font-weight="800" fill="${textDark}">
          ${node.actionTitle}
        </text>
        ${bulletsHtml}
      `;
      
      nodesSvg += `
        <g id="node-${idx + 1}">
          ${stemSvg}
          ${actionHeaderSvg}
          ${circleSvg}
          ${roleSvg}
        </g>
      `;
    } else {
      // Role label ABOVE circle
      const roleSvg = `
        <text x="${cx}" y="${barY - 60}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="19" font-weight="800" fill="${textDark}" text-anchor="middle">
          ${node.role}
        </text>
        <text x="${cx}" y="${barY - 78}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="500" fill="#786B69" text-anchor="middle">
          ${node.roleSub}
        </text>
      `;
      
      // Stem line DOWN to bottom text
      const stemBottomY = 475;
      const stemSvg = `
        <line x1="${cx}" y1="${barY + circleRadius + 4}" x2="${cx}" y2="${stemBottomY}" stroke="${stemColor}" stroke-width="2" />
        <circle cx="${cx}" cy="${stemBottomY}" r="4.5" fill="${stemColor}" />
      `;
      
      // Action group BELOW
      const textX = cx - 110;
      let bulletsHtml = '';
      node.bullets.forEach((b, bIdx) => {
        bulletsHtml += `
          <g transform="translate(${textX}, ${stemBottomY + 36 + bIdx * 24})">
            <circle cx="5" cy="-5" r="3.5" fill="${stemColor}" />
            <text x="16" y="0" font-family="'Inter', 'Segoe UI', sans-serif" font-size="13" font-weight="400" fill="${bulletDark}">
              ${b}
            </text>
          </g>
        `;
      });
      
      const actionHeaderSvg = `
        <text x="${textX}" y="${stemBottomY + 20}" font-family="'Inter', 'Segoe UI', sans-serif" font-size="17" font-weight="800" fill="${textDark}">
          ${node.actionTitle}
        </text>
        ${bulletsHtml}
      `;
      
      nodesSvg += `
        <g id="node-${idx + 1}">
          ${roleSvg}
          ${stemSvg}
          ${circleSvg}
          ${actionHeaderSvg}
        </g>
      `;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&amp;family=Inter:wght@400;500;600;700;800&amp;display=swap');
      text { text-rendering: geometricPrecision; }
    </style>
  </defs>

  <!-- Slide Background -->
  <rect width="${width}" height="${height}" fill="${bgColor}" />

  <!-- Slide Header -->
  <g id="slide-header">
    <text x="${width / 2}" y="76" font-family="'Playfair Display', Georgia, serif" font-size="38" font-weight="600" fill="#241E1C" text-anchor="middle" letter-spacing="0.5">
      ${data.title}
    </text>
    <text x="${width / 2}" y="104" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="#8C7976" text-anchor="middle" letter-spacing="1.2">
      ${data.subtitle}
    </text>
  </g>

  <!-- Horizontal Timeline Ribbon Bar -->
  <rect x="50" y="${barY - barHeight / 2}" width="${width - 100}" height="${barHeight}" rx="${barHeight / 2}" fill="${barColor}" />

  <!-- 4 Timeline Nodes & Actions -->
  ${nodesSvg}

  <!-- Slide Footer (Matching Presentation slide footer) -->
  <g id="slide-footer">
    <line x1="50" y1="${height - 45}" x2="${width - 50}" y2="${height - 45}" stroke="#E8E1DE" stroke-width="1" />
    <text x="60" y="${height - 25}" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#8F8380">
      ${data.footerLeft}
    </text>
    <text x="${width / 2}" y="${height - 25}" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#8F8380" text-anchor="middle" letter-spacing="1">
      ${data.footerCenter}
    </text>
    <text x="${width - 60}" y="${height - 25}" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#8F8380" text-anchor="end">
      ${data.footerRight}
    </text>
  </g>
</svg>`;
}

// ==========================================
// 3. DRAW.IO XML GENERATOR (Fully Editable)
// ==========================================

function generateDrawioTimeline(data) {
  const xs = [190, 480, 770, 1060];
  const barY = 360;
  
  let cells = '';
  let idCounter = 100;
  
  // Background slide page
  cells += `
    <mxCell id="slide-bg" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="0" y="0" width="1280" height="720" as="geometry" />
    </mxCell>
    <mxCell id="slide-title" value="&lt;font face=&quot;Georgia&quot; style=&quot;font-size: 34px;&quot;&gt;&lt;b&gt;${data.title}&lt;/b&gt;&lt;/font&gt;&lt;br&gt;&lt;font face=&quot;Helvetica&quot; style=&quot;font-size: 11px; letter-spacing: 1px; color: #8C7976;&quot;&gt;&lt;b&gt;${data.subtitle}&lt;/b&gt;&lt;/font&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
      <mxGeometry x="190" y="40" width="900" height="70" as="geometry" />
    </mxCell>
    <mxCell id="timeline-bar" value="" style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#EAD6D6;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="50" y="338" width="1180" height="44" as="geometry" />
    </mxCell>
  `;
  
  data.nodes.forEach((node, idx) => {
    const cx = xs[idx];
    const isTopAction = (idx % 2 === 0);
    const circleId = `circle-${idx}`;
    const roleId = `role-${idx}`;
    const stemId = `stem-${idx}`;
    const actionId = `action-${idx}`;
    
    // Circle Node
    cells += `
      <mxCell id="${circleId}" value="&lt;b style=&quot;color: #ffffff; font-size: 13px;&quot;&gt;${idx + 1}&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#BA8481;strokeColor=none;shadow=1;" vertex="1" parent="1">
        <mxGeometry x="${cx - 40}" y="${barY - 40}" width="80" height="80" as="geometry" />
      </mxCell>
    `;
    
    // Bullets html
    const bulletsHtml = node.bullets.map(b => `&amp;#9679; ${b}`).join('&lt;br&gt;');
    
    if (isTopAction) {
      // Role below
      cells += `
        <mxCell id="${roleId}" value="&lt;font style=&quot;font-size: 17px; font-weight: bold; color: #2B2625;&quot;&gt;${node.role}&lt;/font&gt;&lt;br&gt;&lt;font style=&quot;font-size: 12px; color: #786B69;&quot;&gt;${node.roleSub}&lt;/font&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=top;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="${cx - 100}" y="${barY + 52}" width="200" height="50" as="geometry" />
        </mxCell>
      `;
      // Stem line up
      cells += `
        <mxCell id="${stemId}" value="" style="endArrow=oval;endFill=1;html=1;rounded=0;strokeColor=#3D3432;strokeWidth=2;endSize=6;" edge="1" parent="1">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="${cx}" y="${barY - 42}" as="sourcePoint" />
            <mxPoint x="${cx}" y="245" as="targetPoint" />
          </mxGeometry>
        </mxCell>
      `;
      // Action box above
      cells += `
        <mxCell id="${actionId}" value="&lt;div align=&quot;left&quot;&gt;&lt;b style=&quot;font-size: 16px; color: #2B2625;&quot;&gt;${node.actionTitle}&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 11px; color: #786B69;&quot;&gt;(${node.actionTitleVi})&lt;/font&gt;&lt;br&gt;&lt;br&gt;&lt;font style=&quot;font-size: 12px; color: #4A403E; line-height: 160%;&quot;&gt;${bulletsHtml}&lt;/font&gt;&lt;/div&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=bottom;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="${cx - 110}" y="115" width="250" height="120" as="geometry" />
        </mxCell>
      `;
    } else {
      // Role above
      cells += `
        <mxCell id="${roleId}" value="&lt;font style=&quot;font-size: 17px; font-weight: bold; color: #2B2625;&quot;&gt;${node.role}&lt;/font&gt;&lt;br&gt;&lt;font style=&quot;font-size: 12px; color: #786B69;&quot;&gt;${node.roleSub}&lt;/font&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=bottom;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="${cx - 100}" y="${barY - 95}" width="200" height="45" as="geometry" />
        </mxCell>
      `;
      // Stem line down
      cells += `
        <mxCell id="${stemId}" value="" style="endArrow=oval;endFill=1;html=1;rounded=0;strokeColor=#3D3432;strokeWidth=2;endSize=6;" edge="1" parent="1">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="${cx}" y="${barY + 42}" as="sourcePoint" />
            <mxPoint x="${cx}" y="475" as="targetPoint" />
          </mxGeometry>
        </mxCell>
      `;
      // Action box below
      cells += `
        <mxCell id="${actionId}" value="&lt;div align=&quot;left&quot;&gt;&lt;b style=&quot;font-size: 16px; color: #2B2625;&quot;&gt;${node.actionTitle}&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 11px; color: #786B69;&quot;&gt;(${node.actionTitleVi})&lt;/font&gt;&lt;br&gt;&lt;br&gt;&lt;font style=&quot;font-size: 12px; color: #4A403E; line-height: 160%;&quot;&gt;${bulletsHtml}&lt;/font&gt;&lt;/div&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="${cx - 110}" y="485" width="250" height="130" as="geometry" />
        </mxCell>
      `;
    }
  });

  return `<mxfile host="app.diagrams.net" agent="Antigravity">
  <diagram id="${data.id}" name="${data.title}">
    <mxGraphModel dx="1280" dy="720" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1280" pageHeight="720" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

// ==========================================
// 4. WRITE ALL FILES
// ==========================================

// Timeline 1: Plot Preparation for Rent
const svg1 = generateSvgTimeline(timelinePlotPrep);
fs.writeFileSync(path.join(outDir, '08_Timeline_Plot_Preparation.svg'), svg1, 'utf8');

const drawio1 = generateDrawioTimeline(timelinePlotPrep);
fs.writeFileSync(path.join(outDir, '08_Timeline_Plot_Preparation.drawio'), drawio1, 'utf8');

// Timeline 2: Plot Rental & Cultivation (Customer E-Commerce Lifecycle)
const svg2 = generateSvgTimeline(timelineRentalOps);
fs.writeFileSync(path.join(outDir, '09_Timeline_Rental_Operations.svg'), svg2, 'utf8');

const drawio2 = generateDrawioTimeline(timelineRentalOps);
fs.writeFileSync(path.join(outDir, '09_Timeline_Rental_Operations.drawio'), drawio2, 'utf8');

console.log('Successfully generated:');
console.log(' - 08_Timeline_Plot_Preparation.svg & .drawio');
console.log(' - 09_Timeline_Rental_Operations.svg & .drawio');

