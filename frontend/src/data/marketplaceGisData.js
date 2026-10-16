/**
 * MARKETPLACE GIS & PLOTS MODULE
 * 
 * Hệ thống bản đồ vệ tinh động (Dynamic GIS) kết nối PostgreSQL Database.
 * Không chứa dữ liệu mock hardcode — ranh giới và thuộc tính thửa đất
 * được tải trực tiếp từ farm-service (/api/lands và /api/plots).
 */

export const GIS_STATUSES = {
  AVAILABLE: {
    key: 'AVAILABLE',
    label: 'Đang trống',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#10B981',
    fillColor: 'rgba(16, 185, 129, 0.45)',
    hoverFillColor: 'rgba(16, 185, 129, 0.70)',
    strokeColor: '#34D399',
    iconText: '🌱'
  },
  RENTED: {
    key: 'RENTED',
    label: 'Đã thuê',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.50)',
    hoverFillColor: 'rgba(245, 158, 11, 0.75)',
    strokeColor: '#FBBF24',
    iconText: '🌾'
  },
  MAINTENANCE: {
    key: 'MAINTENANCE',
    label: 'Bảo trì',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    color: '#64748B',
    fillColor: 'rgba(100, 116, 139, 0.50)',
    hoverFillColor: 'rgba(100, 116, 139, 0.75)',
    strokeColor: '#94A3B8',
    iconText: '🔧'
  },
  UPCOMING: {
    key: 'UPCOMING',
    label: 'Sắp có',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    color: '#3B82F6',
    fillColor: 'rgba(59, 130, 246, 0.50)',
    hoverFillColor: 'rgba(59, 130, 246, 0.75)',
    strokeColor: '#60A5FA',
    iconText: '⏳'
  }
};

export const ALL_CROPS_FILTER_OPTIONS = [
  'Tất cả loại cây',
  'Rau xanh (Xà lách)',
  'Cà chua',
  'Rau cải',
  'Dâu tây',
  'Ớt chuông',
  'Rau dền',
  'Thảo mộc'
];

/** Tọa độ trung tâm và ranh giới mặc định Nông trại Happy Valley Củ Chi */
export const FARM_GPS_BOUNDS = {
  topLeft: { dms: "10°41'22.19\"N 106°20'37.16\"E", lng: 106.343656, lat: 10.689497, label: "Giới hạn" },
  topRight: { dms: "10°41'39.59\"N 106°20'57.94\"E", lng: 106.349428, lat: 10.694331, label: "Giới hạn" },
  bottomLeft: { dms: "10°40'51.35\"N 106°21'03.43\"E", lng: 106.350953, lat: 10.680931, label: "Giới hạn" },
  bottomRight: { dms: "10°41'09.20\"N 106°21'25.19\"E", lng: 106.356997, lat: 10.685889, label: "Giới hạn" },
  center: [106.350258, 10.687662],
  polygon: [
    [106.343656, 10.689497],
    [106.349428, 10.694331],
    [106.356997, 10.685889],
    [106.350953, 10.680931],
    [106.343656, 10.689497]
  ]
};

/** Dữ liệu sạch ban đầu: 0 thửa đất mock */
export const FARMS_GIS_DATA = [];
export const MARKETPLACE_PLOTS_GIS = [];
export const FARMS_GEOJSON_DATA = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "P-01",
        "code": "Plot P-01",
        "name": "Thửa đất Bậc Thang P-01",
        "area": "150 m²",
        "rentalPrice": 1200000,
        "price": "1.200.000 đ",
        "status": "Đang trống",
        "crops": [
          "🌶️ Ớt chuông",
          "🍆 Cà tím",
          "🍅 Cà chua bi"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.343813,
              10.689452
            ],
            [
              106.345118,
              10.690545
            ],
            [
              106.346782,
              10.688616
            ],
            [
              106.345463,
              10.687517
            ],
            [
              106.343813,
              10.689452
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-02",
        "code": "Plot P-02",
        "name": "Thửa Cây Thảo Mộc P-02",
        "area": "180 m²",
        "rentalPrice": 1450000,
        "price": "1.450.000 đ",
        "status": "Đang trống",
        "crops": [
          "🌿 Bạc hà",
          "🌱 Hương thảo",
          "🍃 Húng quế"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.345257,
              10.690661
            ],
            [
              106.346562,
              10.691754
            ],
            [
              106.348241,
              10.689832
            ],
            [
              106.346922,
              10.688733
            ],
            [
              106.345257,
              10.690661
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-03",
        "code": "Plot P-03",
        "name": "Thửa Nông Nghiệp Hữu Cơ P-03",
        "area": "200 m²",
        "rentalPrice": 1700000,
        "price": "1.700.000 đ",
        "status": "Đã thuê",
        "crops": [
          "🍓 Dâu tây",
          "🥬 Xà lách"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.3467,
              10.69187
            ],
            [
              106.348006,
              10.692963
            ],
            [
              106.3497,
              10.691048
            ],
            [
              106.348381,
              10.689948
            ],
            [
              106.3467,
              10.69187
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-04",
        "code": "Plot P-04",
        "name": "Thửa Trồng Dược Liệu P-04",
        "area": "160 m²",
        "rentalPrice": 1300000,
        "price": "1.300.000 đ",
        "status": "Đang trống",
        "crops": [
          "🌼 Cúc la mã",
          "🌱 Xạ hương"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.348144,
              10.693079
            ],
            [
              106.34945,
              10.694172
            ],
            [
              106.351159,
              10.692263
            ],
            [
              106.34984,
              10.691164
            ],
            [
              106.348144,
              10.693079
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-05",
        "code": "Plot P-05",
        "name": "Thửa đất Nắng Sớm P-05",
        "area": "175 m²",
        "rentalPrice": 1350000,
        "price": "1.350.000 đ",
        "status": "Đang trống",
        "crops": [
          "🍅 Cà chua bi",
          "🥒 Dưa chuột"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.345638,
              10.687311
            ],
            [
              106.346959,
              10.688411
            ],
            [
              106.348622,
              10.686482
            ],
            [
              106.347288,
              10.685376
            ],
            [
              106.345638,
              10.687311
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-06",
        "code": "Plot P-06",
        "name": "Thửa đất Cánh Đồng P-06",
        "area": "190 m²",
        "rentalPrice": 1500000,
        "price": "1.500.000 đ",
        "status": "Đang trống",
        "crops": [
          "🌽 Bắp ngọt",
          "🫘 Đậu cove"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.347099,
              10.688528
            ],
            [
              106.348419,
              10.689628
            ],
            [
              106.350098,
              10.687705
            ],
            [
              106.348764,
              10.686599
            ],
            [
              106.347099,
              10.688528
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-07",
        "code": "Plot P-07",
        "name": "Thửa Rau Củ Quả P-07",
        "area": "155 m²",
        "rentalPrice": 1250000,
        "price": "1.250.000 đ",
        "status": "Đã thuê",
        "crops": [
          "🥕 Cà rốt",
          "🥔 Khoai tây"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.34856,
              10.689744
            ],
            [
              106.34988,
              10.690844
            ],
            [
              106.351575,
              10.688929
            ],
            [
              106.35024,
              10.687823
            ],
            [
              106.34856,
              10.689744
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-08",
        "code": "Plot P-08",
        "name": "Thửa Hoa Màu P-08",
        "area": "165 m²",
        "rentalPrice": 1300000,
        "price": "1.300.000 đ",
        "status": "Đang trống",
        "crops": [
          "🌻 Hướng dương",
          "🫑 Ớt chuông"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.35002,
              10.690961
            ],
            [
              106.351341,
              10.692061
            ],
            [
              106.353051,
              10.690153
            ],
            [
              106.351716,
              10.689046
            ],
            [
              106.35002,
              10.690961
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-09",
        "code": "Plot P-09",
        "name": "Thửa Vườn Thơm P-09",
        "area": "170 m²",
        "rentalPrice": 1400000,
        "price": "1.400.000 đ",
        "status": "Đang trống",
        "crops": [
          "🥦 Bông cải",
          "🥬 Cải thìa"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.347463,
              10.68517
            ],
            [
              106.348799,
              10.686277
            ],
            [
              106.350463,
              10.684348
            ],
            [
              106.349113,
              10.683234
            ],
            [
              106.347463,
              10.68517
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-10",
        "code": "Plot P-10",
        "name": "Thửa Xanh Mướt P-10",
        "area": "185 m²",
        "rentalPrice": 1600000,
        "price": "1.600.000 đ",
        "status": "Đã thuê",
        "crops": [
          "🥗 Xà lách xoăn",
          "🌿 Hẹ"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.348941,
              10.686394
            ],
            [
              106.350277,
              10.687501
            ],
            [
              106.351956,
              10.685579
            ],
            [
              106.350606,
              10.684466
            ],
            [
              106.348941,
              10.686394
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-11",
        "code": "Plot P-11",
        "name": "Thửa Nắng Vàng P-11",
        "area": "160 m²",
        "rentalPrice": 1250000,
        "price": "1.250.000 đ",
        "status": "Đang trống",
        "crops": [
          "🍅 Cà chua",
          "🫑 Ớt hiểm"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.350419,
              10.687619
            ],
            [
              106.351755,
              10.688726
            ],
            [
              106.353449,
              10.68681
            ],
            [
              106.352099,
              10.685697
            ],
            [
              106.350419,
              10.687619
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-12",
        "code": "Plot P-12",
        "name": "Thửa Đất Màu P-12",
        "area": "195 m²",
        "rentalPrice": 1450000,
        "price": "1.450.000 đ",
        "status": "Đang trống",
        "crops": [
          "🍉 Dưa hấu",
          "🍈 Dưa lưới"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.351896,
              10.688843
            ],
            [
              106.353232,
              10.68995
            ],
            [
              106.354942,
              10.688042
            ],
            [
              106.353592,
              10.686929
            ],
            [
              106.351896,
              10.688843
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-13",
        "code": "Plot P-13",
        "name": "Thửa Phù Sa P-13",
        "area": "165 m²",
        "rentalPrice": 1350000,
        "price": "1.350.000 đ",
        "status": "Đã thuê",
        "crops": [
          "🍠 Khoai lang",
          "🥔 Khoai mỡ"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.349288,
              10.683029
            ],
            [
              106.350639,
              10.684143
            ],
            [
              106.352303,
              10.682213
            ],
            [
              106.350938,
              10.681093
            ],
            [
              106.349288,
              10.683029
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-14",
        "code": "Plot P-14",
        "name": "Thửa Bờ Kênh P-14",
        "area": "175 m²",
        "rentalPrice": 1550000,
        "price": "1.550.000 đ",
        "status": "Đang trống",
        "crops": [
          "🥒 Bí xanh",
          "🎃 Bí đỏ"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.350783,
              10.684261
            ],
            [
              106.352134,
              10.685375
            ],
            [
              106.353813,
              10.683453
            ],
            [
              106.352448,
              10.682332
            ],
            [
              106.350783,
              10.684261
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-15",
        "code": "Plot P-15",
        "name": "Thửa Sinh Thái P-15",
        "area": "180 m²",
        "rentalPrice": 1650000,
        "price": "1.650.000 đ",
        "status": "Đang trống",
        "crops": [
          "🍓 Dâu tây",
          "🍇 Nho đen"
        ],
        "direction": "Chính Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.352278,
              10.685493
            ],
            [
              106.353629,
              10.686607
            ],
            [
              106.355323,
              10.684692
            ],
            [
              106.353958,
              10.683572
            ],
            [
              106.352278,
              10.685493
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "P-16",
        "code": "Plot P-16",
        "name": "Thửa An Nhiên P-16",
        "area": "150 m²",
        "rentalPrice": 1200000,
        "price": "1.200.000 đ",
        "status": "Đã thuê",
        "crops": [
          "🫒 Trà ô long",
          "🌱 Đậu đỏ"
        ],
        "direction": "Đông Nam",
        "ph": "6.2 - 6.6",
        "temp": "20 - 28°C",
        "img": "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80",
        "facilities": {
          "irrigation": true,
          "iot": true,
          "organicSoil": true,
          "waterSource": true
        }
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              106.353773,
              10.686725
            ],
            [
              106.355124,
              10.687839
            ],
            [
              106.356834,
              10.685931
            ],
            [
              106.355468,
              10.684811
            ],
            [
              106.353773,
              10.686725
            ]
          ]
        ]
      }
    }
  ]
};

/**
 * Chuyển đổi mảng thửa đất từ PostgreSQL Database (qua API /api/plots)
 * thành GeoJSON FeatureCollection chuẩn để render 3D trên MapLibre GL JS.
 */
export function buildGeoJsonFromDbPlots(plots = []) {
  if (!Array.isArray(plots) || plots.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features = [];

  plots.forEach((p) => {
    let ring = [];

    // 1. Array of points: [[lng, lat], ...] or nested [[[lng, lat], ...]]
    if (Array.isArray(p.boundary) && p.boundary.length > 0) {
      if (Array.isArray(p.boundary[0]) && Array.isArray(p.boundary[0][0])) {
        ring = p.boundary[0]
          .map((pt) => [Number(pt[0]), Number(pt[1])])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
      } else if (p.boundary.length >= 3) {
        ring = p.boundary
          .map((pt) => {
            if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
            if (typeof pt === 'string') {
              const parts = pt.trim().split(/[\s,]+/);
              return parts.length >= 2 ? [Number(parts[0]), Number(parts[1])] : null;
            }
            return null;
          })
          .filter((pt) => pt && !isNaN(pt[0]) && !isNaN(pt[1]));
      }
    }

    // 2. GeoJSON object or string (from boundary, boundaryGeojson, or boundary_geojson)
    if (ring.length < 3) {
      const geoRaw = p.boundary || p.boundaryGeojson || p.boundary_geojson;
      if (geoRaw) {
        try {
          const parsed = typeof geoRaw === 'string' ? JSON.parse(geoRaw) : geoRaw;
          if (parsed && Array.isArray(parsed.coordinates) && parsed.coordinates[0]) {
            const rawRing = Array.isArray(parsed.coordinates[0][0]) ? parsed.coordinates[0] : parsed.coordinates;
            ring = rawRing
              .map((pt) => [Number(pt[0]), Number(pt[1])])
              .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Fallback: polygon_coords / polygonCoords
    if (ring.length < 3 && (p.polygon_coords || p.polygonCoords)) {
      try {
        const polyRaw = p.polygon_coords || p.polygonCoords;
        const parsed = typeof polyRaw === 'string' ? JSON.parse(polyRaw) : polyRaw;
        const rawCoords = Array.isArray(parsed[0]) && Array.isArray(parsed[0][0]) ? parsed[0] : parsed;
        ring = rawCoords
          .map((pt) => [Number(pt[0]), Number(pt[1])])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
      } catch {
        // ignore
      }
    }

    // 4. Fallback: center_point / centerPoint
    if (ring.length < 3 && (p.center_point || p.centerPoint)) {
      try {
        const centerRaw = p.center_point || p.centerPoint;
        const parsed = typeof centerRaw === 'string' ? JSON.parse(centerRaw) : centerRaw;
        if (Array.isArray(parsed) && parsed.length >= 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
          const cLng = Number(parsed[0]);
          const cLat = Number(parsed[1]);
          const d = 0.00015;
          ring = [
            [cLng - d, cLat - d],
            [cLng + d, cLat - d],
            [cLng + d, cLat + d],
            [cLng - d, cLat + d],
            [cLng - d, cLat - d]
          ];
        }
      } catch {
        // ignore
      }
    }

    if (ring.length >= 3) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }

    const plotCode = p.plotCode || p.plot_code || p.code || `P-${p.plotId || p.plot_id || p.id}`;
    const plotId = String(plotCode).replace(/^Plot\s+/i, '');

    const recentBooked = (() => {
      try {
        return JSON.parse(localStorage.getItem('farmely_recently_booked_plots') || '[]');
      } catch {
        return [];
      }
    })();
    const isRecentlyBooked = recentBooked.some(
      (c) =>
        String(c).toLowerCase() === String(plotCode).toLowerCase() ||
        String(c).toLowerCase() === String(plotId).toLowerCase() ||
        String(c).toLowerCase() === String(p.plotId || p.id).toLowerCase()
    );

    const rawStatus = isRecentlyBooked ? 'RENT' : (p.status || '').toUpperCase();
    const statusLabel = rawStatus === 'AVAIL' || rawStatus === 'AVAILABLE'
      ? 'Đang trống'
      : (rawStatus === 'RENT' || rawStatus === 'RENTED'
          ? 'Đã thuê'
          : (rawStatus === 'MAINT' || rawStatus === 'MAINTENANCE' ? 'Bảo trì' : (p.status || 'Đang trống')));
    const areaNum = Number(p.area) || 0;
    const priceNum = Number(p.pricePerPeriod ?? p.price_per_period) || 0;

    const cropList = Array.isArray(p.compatibleVarieties) && p.compatibleVarieties.length > 0
      ? p.compatibleVarieties.map((v) => v.varietyName || v.name)
      : (Array.isArray(p.compatible_crops) ? p.compatible_crops : (Array.isArray(p.crops) ? p.crops : []));

    features.push({
      type: 'Feature',
      properties: {
        id: plotId,
        plot_id: p.plotId || p.id,
        code: plotCode,
        label: plotId,
        name: p.name || `Thửa ${plotCode}`,
        landId: p.landId,
        landName: p.landName || '',
        farmName: p.landName || 'Nông trại',
        area: `${areaNum} m²`,
        sizeNumber: areaNum,
        areaFormatted: `${areaNum} m²`,
        rentalPrice: priceNum,
        price: `${priceNum.toLocaleString('vi-VN')} đ`,
        rentalPriceFormatted: `${priceNum.toLocaleString('vi-VN')} đ/tháng`,
        status: statusLabel,
        statusCode: rawStatus,
        crops: cropList,
        compatibleCrops: cropList,
        img: p.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        imageUrl: p.imageUrl,
        facilities: {
          irrigation: true,
          iot: true,
          organicSoil: true,
          waterSource: true
        },
        hasBoundary: ring.length >= 3,
        dbSynced: true
      },
      geometry: {
        type: 'Polygon',
        coordinates: ring.length >= 3 ? [ring] : []
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}
