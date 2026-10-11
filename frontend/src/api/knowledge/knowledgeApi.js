/**
 * Knowledge Service API Client
 * Tích hợp Thư viện Tri thức Nông nghiệp (Screen 45: SCR-CGNN-06) và RAG AI Chatbot (UC18: SCR-KH-13)
 */

const BASE_URL = '/api/v1/knowledge-documents';

export const knowledgeApi = {
  // 1. Quản lý Tài liệu Tri thức
  async getAllDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.documentType) query.append('documentType', params.documentType);
    if (params.varietyId) query.append('varietyId', params.varietyId);

    const queryString = query.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lỗi tải danh sách tài liệu: ${res.statusText}`);
    return res.json();
  },

  async getDocumentById(id) {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error(`Lỗi tải chi tiết tài liệu #${id}`);
    return res.json();
  },

  async createDocument(data) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Lỗi tạo mới tài liệu: ${res.statusText}`);
    return res.json();
  },

  async updateDocument(id, data) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Lỗi cập nhật tài liệu #${id}`);
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Lỗi xóa tài liệu #${id}`);
    return res.json();
  },

  async toggleRagStatus(id) {
    const res = await fetch(`${BASE_URL}/${id}/toggle-rag`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Lỗi cập nhật trạng thái RAG cho tài liệu #${id}`);
    return res.json();
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`Lỗi tải lên tệp: ${res.statusText}`);
    return res.json();
  },

  // 2. Ngữ cảnh RAG cho AI Chatbot
  async getRagContext() {
    const res = await fetch(`${BASE_URL}/rag-context`);
    if (!res.ok) throw new Error(`Lỗi truy xuất dữ liệu RAG`);
    return res.json();
  },

  // 3. Danh mục Cây trồng & Giống cây
  async getCrops() {
    const res = await fetch('/api/crops');
    if (!res.ok) throw new Error(`Lỗi tải danh mục cây trồng`);
    return res.json();
  },

  async getVarieties(cropId) {
    const url = cropId ? `/api/varieties?cropId=${cropId}` : '/api/varieties';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lỗi tải danh mục giống cây`);
    return res.json();
  },

  // 4. Quy trình canh tác chuẩn
  async getProcessTemplates(varietyId) {
    const url = varietyId ? `/api/templates?varietyId=${varietyId}` : '/api/templates';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lỗi tải quy trình canh tác chuẩn`);
    return res.json();
  }
};
