/**
 * Danh sách nông trại (Lands) fallback khi chưa có kết nối API.
 * Mọi dữ liệu nông trại ưu tiên nạp động từ PostgreSQL Database qua Farm Service API (/api/lands).
 */
export const landsData = [
  {
    id: "LND-001",
    landId: 1,
    name: "Trang trại Happy Valley Củ Chi",
    location: "Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh",
    description: "Khu trang trại hữu cơ công nghệ cao ven sông Sài Gòn, đất phù sa màu mỡ đã được cải tạo theo tiêu chuẩn VietGAP và lắp đặt hệ thống trạm quan trắc IoT vi khí hậu tự động.",
    totalArea: "25,000 m² (2.5 ha)",
    totalPlots: 16,
    activePlots: 13,
    status: "ACTIVE",
    createdDate: "2026-01-15",
    geographicalBoundary: "11.0842° N, 106.5298° E (Vùng quy hoạch nông nghiệp công nghệ cao Củ Chi)",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    soilType: "Đất phù sa bồi lắng giàu mùn hữu cơ",
    waterSource: "Hệ thống lọc nước ngầm tầng sâu kết hợp lắng lọc vi sinh",
  }
];

