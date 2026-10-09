export const initialTasks = [
  { id: 'TASK-01', plot: 'P-102', title: 'Kiểm tra độ ẩm đất', sector: 'Củ Chi · Khu A', priority: 'Ưu tiên', status: 'PENDING', instruction: 'Kiểm tra đất và cây, xử lý nếu độ ẩm thấp. Chụp ảnh hiện trường sau khi làm.' },
  { id: 'TASK-02', plot: 'P-102', title: 'Tỉa lá và dọn cỏ', sector: 'Củ Chi · Khu A', priority: 'Thường', status: 'PENDING', instruction: 'Tỉa lá già, dọn cỏ quanh gốc và chụp ảnh sau khi hoàn tất.' },
  { id: 'TASK-03', plot: 'P-101', title: 'Kiểm tra nguồn nước', sector: 'Củ Chi · Khu A', priority: 'Thường', status: 'PENDING', instruction: 'Kiểm tra đường cấp nước, báo vấn đề nếu phát hiện rò rỉ.' },
];

export function readDemo(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
}

export function saveDemo(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readImage(file) {
  if (!file || !file.type.startsWith('image/')) return Promise.reject(new Error('Vui lòng chọn một ảnh.'));
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Ảnh tối đa 5 MB.'));
  return createImageBitmap(file).then(bitmap => {
    const scale = Math.min(1, 1200 / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.7);
  }).catch(() => { throw new Error('Không đọc được ảnh này. Vui lòng chọn JPG hoặc PNG.'); });
}
