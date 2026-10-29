const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 750" width="1180" height="750" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Arrowhead Markers -->
    <marker id="arrow-solid" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b"/>
    </marker>
    <marker id="arrow-dashed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b"/>
    </marker>

    <!-- Drop Shadows for Cards -->
    <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- ==================== TITLE ==================== -->
  <text x="810" y="65" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="normal" fill="#1e293b" letter-spacing="0.5">System design</text>

  <!-- ==================== ARROWS / CONNECTORS LAYER ==================== -->
  <g fill="none" stroke="#1e293b" stroke-width="1.3">
    
    <!-- 1. NOTIFICATION LONG BROADCAST TO CLIENTS (Left Boundary Route) -->
    <!-- Solid Call from Notification to Mobile App & Web App via left rail -->
    <path d="M 400 95 L 400 45 L 35 45 L 35 430 L 60 430" marker-end="url(#arrow-solid)" />
    <!-- Branch to Web App -->
    <path d="M 35 430 L 35 600 L 200 600" marker-end="url(#arrow-solid)" />

    <!-- 2. NOTIFICATION <-> MOBILE APP DIRECT -->
    <path d="M 430 170 L 430 360 L 320 360 L 320 390" marker-end="url(#arrow-solid)" />
    <path d="M 335 390 L 335 375 L 445 375 L 445 170" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 3. MOBILE APP <-> OTP (TWILIO) -->
    <path d="M 235 420 L 195 420" marker-end="url(#arrow-solid)" />
    <path d="M 195 440 L 235 440" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 4. MOBILE APP <-> ZALOPAY -->
    <path d="M 290 390 L 290 280 L 390 280" marker-end="url(#arrow-solid)" />
    <path d="M 390 260 L 275 260 L 275 390" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 5. MOBILE APP <-> BACKEND SERVER -->
    <path d="M 365 420 L 590 420" marker-end="url(#arrow-solid)" />
    <path d="M 590 440 L 365 440" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 6. MOBILE APP <-> STORE (FIREBASE CLOUD STORAGE) -->
    <path d="M 365 460 L 450 565" marker-end="url(#arrow-solid)" />
    <path d="M 465 565 L 365 445" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 7. WEB APP <-> STORE (FIREBASE CLOUD STORAGE) -->
    <path d="M 330 585 L 450 585" marker-end="url(#arrow-solid)" />
    <path d="M 450 605 L 330 605" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 8. WEB APP <-> BACKEND SERVER -->
    <path d="M 270 560 L 270 520 L 640 520 L 640 470" marker-end="url(#arrow-solid)" />
    <path d="M 660 470 L 660 535 L 290 535 L 290 560" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 9. BACKEND SERVER <-> STORE (FIREBASE CLOUD STORAGE) -->
    <path d="M 610 470 L 610 565" marker-end="url(#arrow-solid)" />
    <path d="M 625 565 L 625 470" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 10. BACKEND SERVER <-> DATABASE -->
    <path d="M 720 420 L 805 420" marker-end="url(#arrow-solid)" />
    <path d="M 805 440 L 720 440" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 11. BACKEND SERVER <-> ZALOPAY / PAYMENT -->
    <path d="M 610 390 L 610 280 L 535 280" marker-end="url(#arrow-solid)" />
    <path d="M 535 260 L 625 260 L 625 390" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 12. BACKEND SERVER <-> NOTIFICATION (FCM) -->
    <path d="M 590 405 L 565 405 L 565 140 L 535 140" marker-end="url(#arrow-solid)" />
    <path d="M 535 120 L 580 120 L 580 390" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 13. BACKEND SERVER <-> THIRD PARTY DELIVERY -->
    <path d="M 645 390 L 645 105" marker-end="url(#arrow-solid)" />
    <path d="M 665 105 L 665 390" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

    <!-- 14. BACKEND SERVER <-> GOOGLE DISTANCE MATRIX API -->
    <path d="M 700 390 L 700 320 L 785 320" marker-end="url(#arrow-solid)" />
    <path d="M 785 300 L 715 300 L 715 390" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)" />

  </g>

  <!-- ==================== NODES / CARDS LAYER ==================== -->

  <!-- 1. NOTIFICATION (FIREBASE CLOUD MESSAGE) -->
  <g transform="translate(390, 95)" filter="url(#card-shadow)">
    <rect width="145" height="75" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Firebase Logo in Dark Container -->
    <rect x="58" y="10" width="28" height="28" rx="6" fill="#1e293b"/>
    <path d="M 66 31 L 69 17 L 73 23 L 78 14 L 79 31 Z" fill="#f59e0b"/>
    <path d="M 66 31 L 73 23 L 78 14 L 79 31 Z" fill="#f97316"/>
    <text x="72.5" y="49" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Notification</text>
    <text x="72.5" y="62" font-size="9" fill="#475569" text-anchor="middle">(Firebase cloud message)</text>
  </g>

  <!-- 2. THIRD PARTY DELIVERY -->
  <g transform="translate(600, 35)" filter="url(#card-shadow)">
    <rect width="115" height="70" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Delivery / C# Hexagon Logo -->
    <rect x="42.5" y="10" width="30" height="26" rx="6" fill="#7c3aed"/>
    <circle cx="57.5" cy="23" r="7" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <path d="M 59 19.5 L 59 26.5 M 63 21 L 63 25 M 65 21 L 65 25" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    <text x="57.5" y="52" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Third party delivery</text>
  </g>

  <!-- 3. ZALOPAY / PAYMENT -->
  <g transform="translate(390, 235)" filter="url(#card-shadow)">
    <rect width="145" height="75" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- ZaloPay Dual-Color Logo -->
    <text x="72.5" y="38" font-size="20" font-weight="900" text-anchor="middle">
      <tspan fill="#0068ff">Zalo</tspan><tspan fill="#00be00">Pay</tspan>
    </text>
    <text x="72.5" y="58" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">ZaloPay</text>
  </g>

  <!-- 4. OTP (TWILIO) -->
  <g transform="translate(60, 390)" filter="url(#card-shadow)">
    <rect width="135" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Twilio Red Logo -->
    <circle cx="34" cy="30" r="12" fill="#f22f46"/>
    <circle cx="30" cy="26" r="2.2" fill="#ffffff"/>
    <circle cx="38" cy="26" r="2.2" fill="#ffffff"/>
    <circle cx="30" cy="34" r="2.2" fill="#ffffff"/>
    <circle cx="38" cy="34" r="2.2" fill="#ffffff"/>
    <text x="54" y="34" font-size="15" font-weight="bold" fill="#f22f46">twilio</text>
    <text x="67.5" y="56" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">OTP</text>
    <text x="67.5" y="68" font-size="10" fill="#475569" text-anchor="middle">(Twilio)</text>
  </g>

  <!-- 5. MOBILE APPLICATION (FLUTTER) -->
  <g transform="translate(235, 390)" filter="url(#card-shadow)">
    <rect width="130" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Flutter Bird Wings Logo -->
    <g transform="translate(52, 10) scale(0.9)">
      <path d="M 17 0 L 0 17 L 5 22 L 27 0 Z" fill="#02569B"/>
      <path d="M 12 17 L 7 22 L 15 30 L 20 25 Z" fill="#0175C2"/>
      <path d="M 15 30 L 7 22 L 12 17 L 27 32 L 20 32 Z" fill="#29B6F6"/>
      <path d="M 27 32 L 17 22 L 20 19 L 30 29 Z" fill="#02569B"/>
    </g>
    <text x="65" y="62" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Mobile Application</text>
  </g>

  <!-- 6. WEB APPLICATION (REACT) -->
  <g transform="translate(200, 560)" filter="url(#card-shadow)">
    <rect width="130" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- React Atom Logo -->
    <g transform="translate(65, 26)">
      <ellipse rx="15" ry="5.5" fill="none" stroke="#00d8ff" stroke-width="1.6" transform="rotate(0)"/>
      <ellipse rx="15" ry="5.5" fill="none" stroke="#00d8ff" stroke-width="1.6" transform="rotate(60)"/>
      <ellipse rx="15" ry="5.5" fill="none" stroke="#00d8ff" stroke-width="1.6" transform="rotate(120)"/>
      <circle r="3" fill="#00d8ff"/>
    </g>
    <text x="65" y="62" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Web Application</text>
  </g>

  <!-- 7. STORE (FIREBASE CLOUD STORAGE) -->
  <g transform="translate(450, 565)" filter="url(#card-shadow)">
    <rect width="155" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Firebase Cloud Storage Logo -->
    <g transform="translate(77.5, 23)">
      <path d="M -10 10 L -4 -6 L 0 1 L 6 -10 L 8 10 Z" fill="#f59e0b"/>
      <path d="M -10 10 L 0 1 L 6 -10 L 8 10 Z" fill="#f97316"/>
      <circle cx="0" cy="5" r="4" fill="#ffffff" opacity="0.9"/>
    </g>
    <text x="77.5" y="52" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Store</text>
    <text x="77.5" y="66" font-size="9.5" fill="#475569" text-anchor="middle">(Firebase cloud storage)</text>
  </g>

  <!-- 8. BACKEND SERVER (C# / SPRING BOOT) -->
  <g transform="translate(590, 390)" filter="url(#card-shadow)">
    <rect width="130" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Backend Server Hexagon / C# / Spring Logo -->
    <rect x="49" y="11" width="32" height="28" rx="7" fill="#7c3aed"/>
    <circle cx="65" cy="25" r="7.5" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <path d="M 67 21 L 67 29 M 71 22.5 L 71 27.5 M 73 22.5 L 73 27.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
    <text x="65" y="62" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Backend Server</text>
  </g>

  <!-- 9. GOOGLE DISTANCE MATRIX API -->
  <g transform="translate(785, 260)" filter="url(#card-shadow)">
    <rect width="175" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Google Maps Pin Logo -->
    <g transform="translate(42, 25)">
      <path d="M 0 -12 C -6 -12 -10 -7 -10 0 C -10 6 -4 11 0 16 C 4 11 10 6 10 0 C 10 -7 6 -12 0 -12 Z" fill="#ea4335"/>
      <circle cx="0" cy="-2" r="4.5" fill="#ffffff"/>
    </g>
    <text x="62" y="22" font-size="11" font-weight="bold" fill="#0f172a">Google</text>
    <text x="62" y="34" font-size="9" font-weight="bold" fill="#0f172a">Distance Matrix API</text>
    <text x="87.5" y="64" font-size="10" fill="#475569" text-anchor="middle">(Distance matrix API)</text>
  </g>

  <!-- 10. DATABASE (SQL SERVER / POSTGRESQL) -->
  <g transform="translate(805, 390)" filter="url(#card-shadow)">
    <rect width="115" height="80" rx="14" fill="#ffffff" stroke="#475569" stroke-width="1.3"/>
    <!-- Database Cylinder / SQL Server Logo -->
    <g transform="translate(57.5, 24)">
      <path d="M -12 -8 C -12 -12 12 -12 12 -8 C 12 -4 -12 -4 -12 -8 Z" fill="#ea580c"/>
      <path d="M -12 -8 L -12 6 C -12 10 12 10 12 6 L 12 -8 Z" fill="#c2410c"/>
      <ellipse cx="0" cy="-8" rx="12" ry="4" fill="#fb923c"/>
      <ellipse cx="0" cy="-1" rx="12" ry="4" fill="none" stroke="#fed7aa" stroke-width="1.2"/>
      <ellipse cx="0" cy="6" rx="12" ry="4" fill="none" stroke="#fed7aa" stroke-width="1.2"/>
    </g>
    <text x="57.5" y="52" font-size="8" font-weight="bold" fill="#64748b" text-anchor="middle">SQL Server / PG</text>
    <text x="57.5" y="65" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Database</text>
  </g>

  <!-- 11. ANNOTATION LEGEND BOX -->
  <g transform="translate(785, 555)">
    <rect width="145" height="75" rx="12" fill="#ffffff" stroke="#475569" stroke-width="1.2" stroke-dasharray="3 3"/>
    <text x="72.5" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Annotation</text>
    <!-- Solid Call/Send Entry -->
    <line x1="18" y1="38" x2="62" y2="38" stroke="#1e293b" stroke-width="1.4" marker-end="url(#arrow-solid)"/>
    <text x="72" y="42" font-size="10.5" fill="#0f172a">Call/Send</text>
    <!-- Dashed Return Entry -->
    <line x1="18" y1="58" x2="62" y2="58" stroke="#1e293b" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#arrow-dashed)"/>
    <text x="72" y="62" font-size="10.5" fill="#0f172a">Return</text>
  </g>

</svg>`;

// Generate Draw.io XML format
const drawioContent = `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="isp392-system-design" name="System design">
    <mxGraphModel dx="1200" dy="750" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1180" pageHeight="750" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- TITLE -->
        <mxCell id="title" value="System design" style="text;html=1;align=left;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;fontSize=32;fontFamily=Georgia;fontColor=#1e293b;" vertex="1" parent="1">
          <mxGeometry x="810" y="30" width="240" height="50" as="geometry" />
        </mxCell>

        <!-- 1. NOTIFICATION (FIREBASE CLOUD MESSAGE) -->
        <mxCell id="node-fcm" value="&lt;b&gt;Notification&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 10px; color: #475569;&quot;&gt;(Firebase cloud message)&lt;/font&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=10;" vertex="1" parent="1">
          <mxGeometry x="390" y="95" width="145" height="75" as="geometry" />
        </mxCell>
        <mxCell id="icon-fcm" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg;" vertex="1" parent="node-fcm">
          <mxGeometry x="60" y="10" width="25" height="25" as="geometry" />
        </mxCell>

        <!-- 2. THIRD PARTY DELIVERY -->
        <mxCell id="node-delivery" value="&lt;b&gt;Third party delivery&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=11;verticalAlign=bottom;spacingBottom=12;" vertex="1" parent="1">
          <mxGeometry x="600" y="35" width="115" height="70" as="geometry" />
        </mxCell>

        <!-- 3. ZALOPAY -->
        <mxCell id="node-zalopay" value="&lt;font color=&quot;#0068ff&quot; style=&quot;font-size: 18px; font-weight: 900;&quot;&gt;Zalo&lt;/font&gt;&lt;font color=&quot;#00be00&quot; style=&quot;font-size: 18px; font-weight: 900;&quot;&gt;Pay&lt;/font&gt;&lt;br&gt;&lt;b style=&quot;font-size: 12px; color: #0f172a;&quot;&gt;ZaloPay&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;align=center;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="390" y="235" width="145" height="75" as="geometry" />
        </mxCell>

        <!-- 4. OTP (TWILIO) -->
        <mxCell id="node-twilio" value="&lt;font color=&quot;#f22f46&quot; style=&quot;font-size: 14px; font-weight: bold;&quot;&gt;twilio&lt;/font&gt;&lt;br&gt;&lt;b&gt;OTP&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 10px; color: #475569;&quot;&gt;(Twilio)&lt;/font&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=11;align=center;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="60" y="390" width="135" height="80" as="geometry" />
        </mxCell>

        <!-- 5. MOBILE APPLICATION (FLUTTER) -->
        <mxCell id="node-mobile" value="&lt;b&gt;Mobile Application&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=12;" vertex="1" parent="1">
          <mxGeometry x="235" y="390" width="130" height="80" as="geometry" />
        </mxCell>
        <mxCell id="icon-flutter" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg;" vertex="1" parent="node-mobile">
          <mxGeometry x="50" y="10" width="30" height="30" as="geometry" />
        </mxCell>

        <!-- 6. WEB APPLICATION (REACT) -->
        <mxCell id="node-web" value="&lt;b&gt;Web Application&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=12;" vertex="1" parent="1">
          <mxGeometry x="200" y="560" width="130" height="80" as="geometry" />
        </mxCell>
        <mxCell id="icon-react" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg;" vertex="1" parent="node-web">
          <mxGeometry x="50" y="10" width="30" height="30" as="geometry" />
        </mxCell>

        <!-- 7. STORE (FIREBASE CLOUD STORAGE) -->
        <mxCell id="node-store" value="&lt;b&gt;Store&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 10px; color: #475569;&quot;&gt;(Firebase cloud storage)&lt;/font&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=10;" vertex="1" parent="1">
          <mxGeometry x="450" y="565" width="155" height="80" as="geometry" />
        </mxCell>
        <mxCell id="icon-store" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg;" vertex="1" parent="node-store">
          <mxGeometry x="65" y="10" width="25" height="25" as="geometry" />
        </mxCell>

        <!-- 8. BACKEND SERVER -->
        <mxCell id="node-backend" value="&lt;b&gt;Backend Server&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=12;" vertex="1" parent="1">
          <mxGeometry x="590" y="390" width="130" height="80" as="geometry" />
        </mxCell>
        <mxCell id="icon-csharp" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg;" vertex="1" parent="node-backend">
          <mxGeometry x="50" y="10" width="30" height="30" as="geometry" />
        </mxCell>

        <!-- 9. GOOGLE DISTANCE MATRIX API -->
        <mxCell id="node-maps" value="&lt;b&gt;Google&lt;/b&gt;&lt;br&gt;&lt;b&gt;Distance Matrix API&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 10px; color: #475569;&quot;&gt;(Distance matrix API)&lt;/font&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=11;align=center;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="785" y="260" width="175" height="80" as="geometry" />
        </mxCell>

        <!-- 10. DATABASE -->
        <mxCell id="node-db" value="&lt;font style=&quot;font-size: 9px; color: #64748b;&quot;&gt;SQL Server&lt;/font&gt;&lt;br&gt;&lt;b&gt;Database&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.4;fontSize=12;verticalAlign=bottom;spacingBottom=12;" vertex="1" parent="1">
          <mxGeometry x="805" y="390" width="115" height="80" as="geometry" />
        </mxCell>
        <mxCell id="icon-sqlserver" value="" style="shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image=https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg;" vertex="1" parent="node-db">
          <mxGeometry x="42.5" y="10" width="30" height="30" as="geometry" />
        </mxCell>

        <!-- 11. ANNOTATION LEGEND -->
        <mxCell id="legend-box" value="&lt;b&gt;Annotation&lt;/b&gt;" style="rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#475569;strokeWidth=1.2;dashed=1;dashPattern=3 3;align=center;verticalAlign=top;spacingTop=6;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="785" y="555" width="145" height="75" as="geometry" />
        </mxCell>
        <mxCell id="legend-solid" value="Call/Send" style="endArrow=classic;html=1;strokeColor=#1e293b;strokeWidth=1.4;fontSize=10.5;align=left;labelPosition=right;verticalLabelPosition=middle;verticalAlign=middle;" edge="1" parent="legend-box">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="18" y="38" as="sourcePoint" />
            <mxPoint x="62" y="38" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="legend-dashed" value="Return" style="endArrow=classic;html=1;strokeColor=#1e293b;strokeWidth=1.4;dashed=1;dashPattern=4 3;fontSize=10.5;align=left;labelPosition=right;verticalLabelPosition=middle;verticalAlign=middle;" edge="1" parent="legend-box">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="18" y="58" as="sourcePoint" />
            <mxPoint x="62" y="58" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- ==================== ORTHOGONAL EDGES ==================== -->

        <!-- Notification to Mobile via left border rail -->
        <mxCell id="e-fcm-rail" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="400" y="95" as="sourcePoint" />
            <mxPoint x="60" y="430" as="targetPoint" />
            <Array as="points">
              <mxPoint x="400" y="45" />
              <mxPoint x="35" y="45" />
              <mxPoint x="35" y="430" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-fcm-rail-web" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="35" y="430" as="sourcePoint" />
            <mxPoint x="200" y="600" as="targetPoint" />
            <Array as="points">
              <mxPoint x="35" y="600" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Notification <-> Mobile App direct -->
        <mxCell id="e-fcm-mob-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="430" y="170" as="sourcePoint" />
            <mxPoint x="320" y="390" as="targetPoint" />
            <Array as="points">
              <mxPoint x="430" y="360" />
              <mxPoint x="320" y="360" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-fcm-mob-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="335" y="390" as="sourcePoint" />
            <mxPoint x="445" y="170" as="targetPoint" />
            <Array as="points">
              <mxPoint x="335" y="375" />
              <mxPoint x="445" y="375" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Mobile <-> OTP (Twilio) -->
        <mxCell id="e-mob-otp-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="235" y="420" as="sourcePoint" />
            <mxPoint x="195" y="420" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-mob-otp-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="195" y="440" as="sourcePoint" />
            <mxPoint x="235" y="440" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Mobile <-> ZaloPay -->
        <mxCell id="e-mob-zalo-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="290" y="390" as="sourcePoint" />
            <mxPoint x="390" y="280" as="targetPoint" />
            <Array as="points">
              <mxPoint x="290" y="280" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-mob-zalo-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="390" y="260" as="sourcePoint" />
            <mxPoint x="275" y="390" as="targetPoint" />
            <Array as="points">
              <mxPoint x="275" y="260" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Mobile <-> Backend Server -->
        <mxCell id="e-mob-be-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="365" y="420" as="sourcePoint" />
            <mxPoint x="590" y="420" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-mob-be-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="590" y="440" as="sourcePoint" />
            <mxPoint x="365" y="440" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Mobile <-> Store (Firebase Storage) -->
        <mxCell id="e-mob-store-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="365" y="460" as="sourcePoint" />
            <mxPoint x="450" y="565" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-mob-store-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="465" y="565" as="sourcePoint" />
            <mxPoint x="365" y="445" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Web <-> Store (Firebase Storage) -->
        <mxCell id="e-web-store-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="330" y="585" as="sourcePoint" />
            <mxPoint x="450" y="585" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-web-store-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="450" y="605" as="sourcePoint" />
            <mxPoint x="330" y="605" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Web <-> Backend Server -->
        <mxCell id="e-web-be-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="270" y="560" as="sourcePoint" />
            <mxPoint x="640" y="470" as="targetPoint" />
            <Array as="points">
              <mxPoint x="270" y="520" />
              <mxPoint x="640" y="520" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-web-be-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="660" y="470" as="sourcePoint" />
            <mxPoint x="290" y="560" as="targetPoint" />
            <Array as="points">
              <mxPoint x="660" y="535" />
              <mxPoint x="290" y="535" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> Store (Firebase Storage) -->
        <mxCell id="e-be-store-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="610" y="470" as="sourcePoint" />
            <mxPoint x="610" y="565" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-store-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="625" y="565" as="sourcePoint" />
            <mxPoint x="625" y="470" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> Database -->
        <mxCell id="e-be-db-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="720" y="420" as="sourcePoint" />
            <mxPoint x="805" y="420" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-db-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="805" y="440" as="sourcePoint" />
            <mxPoint x="720" y="440" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> ZaloPay -->
        <mxCell id="e-be-zalo-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="610" y="390" as="sourcePoint" />
            <mxPoint x="535" y="280" as="targetPoint" />
            <Array as="points">
              <mxPoint x="610" y="280" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-zalo-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="535" y="260" as="sourcePoint" />
            <mxPoint x="625" y="390" as="targetPoint" />
            <Array as="points">
              <mxPoint x="625" y="260" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> Notification (FCM) -->
        <mxCell id="e-be-fcm-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="590" y="405" as="sourcePoint" />
            <mxPoint x="535" y="140" as="targetPoint" />
            <Array as="points">
              <mxPoint x="565" y="405" />
              <mxPoint x="565" y="140" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-fcm-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="535" y="120" as="sourcePoint" />
            <mxPoint x="580" y="390" as="targetPoint" />
            <Array as="points">
              <mxPoint x="580" y="120" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> Third party delivery -->
        <mxCell id="e-be-del-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="645" y="390" as="sourcePoint" />
            <mxPoint x="645" y="105" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-del-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="665" y="105" as="sourcePoint" />
            <mxPoint x="665" y="390" as="targetPoint" />
          </mxGeometry>
        </mxCell>

        <!-- Backend <-> Google Distance Matrix API -->
        <mxCell id="e-be-maps-call" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="700" y="390" as="sourcePoint" />
            <mxPoint x="785" y="320" as="targetPoint" />
            <Array as="points">
              <mxPoint x="700" y="320" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e-be-maps-ret" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1e293b;strokeWidth=1.3;dashed=1;dashPattern=4 3;endArrow=classic;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="785" y="300" as="sourcePoint" />
            <mxPoint x="715" y="390" as="targetPoint" />
            <Array as="points">
              <mxPoint x="715" y="300" />
            </Array>
          </mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

const targetSvgPath = path.resolve(__dirname, '../docs/diagrams/06_Farmely_System_Architecture.svg');
const targetDrawioPath = path.resolve(__dirname, '../docs/diagrams/06_Farmely_System_Architecture.drawio');

fs.writeFileSync(targetSvgPath, svgContent, 'utf8');
fs.writeFileSync(targetDrawioPath, drawioContent, 'utf8');
console.log('Successfully generated:');
console.log(' - ' + targetSvgPath);
console.log(' - ' + targetDrawioPath);
