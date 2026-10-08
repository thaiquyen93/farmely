import React, { useState } from 'react';
import { knowledgeDocumentsData as initialDocs } from '../../data/knowledgeDocuments';
import { varietiesData } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BookOpen, Plus, Eye, Upload, FileText, CheckCircle2, Archive } from 'lucide-react';

export default function KnowledgeDocuments() {
  const [docs, setDocs] = useState(initialDocs);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [varietyId, setVarietyId] = useState('VAR-001');
  const [docType, setDocType] = useState('CULTIVATION_GUIDE');
  const [version, setVersion] = useState('v1.0');
  const [author, setAuthor] = useState('ThS. Nguyễn Hoàng Nam');
  const [description, setDescription] = useState('');

  const handleUpload = (e) => {
    e.preventDefault();
    const varObj = varietiesData.find((v) => v.id === varietyId);

    const newDoc = {
      id: `DOC-00${docs.length + 1}`,
      title,
      varietyId,
      varietyName: varObj ? varObj.name : 'Áp dụng chung',
      cropName: varObj ? varObj.cropName : 'Nông nghiệp tổng quát',
      documentType: docType,
      version,
      status: 'PUBLISHED',
      uploadedDate: new Date().toISOString().split('T')[0],
      author,
      fileSize: '3.2 MB (PDF)',
      description,
      sectionsCount: 5,
      isIndexedForRAG: true
    };

    setDocs((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
  };

  const columns = [
    {
      header: 'Tên Tài Liệu & Tác Giả',
      key: 'title',
      sortable: true,
      render: (row) => (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center text-brand-green border border-brand-border shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <button
              onClick={() => setSelectedDoc(row)}
              className="font-bold text-brand-dark hover:text-brand-green text-xs text-left block"
            >
              {row.title}
            </button>
            <span className="text-[11px] text-brand-muted">
              Tác giả: {row.author} • {row.fileSize}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Áp Dụng Cho Giống',
      key: 'varietyName',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-brand-dark">
          {row.varietyName || "Áp dụng chung"}
        </span>
      )
    },
    {
      header: 'Loại Tài Liệu',
      key: 'documentType',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
          {row.documentType}
        </span>
      )
    },
    {
      header: 'Phiên Bản',
      key: 'version',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-green">
          {row.version}
        </span>
      )
    },
    {
      header: 'RAG AI Indexing',
      key: 'isIndexedForRAG',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Đã index cho AI (RAG)
        </span>
      )
    },
    {
      header: 'Trạng Thái',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant="ACTIVE" size="sm">{row.status}</Badge>
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDoc(row)}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert(`Lưu trữ tài liệu: ${row.id}`)}
            className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Lưu trữ tài liệu"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Thực thể: KnowledgeDocument (Cơ sở dữ liệu RAG AI)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Kho Tài Liệu Kỹ Thuật Nông Học
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Quản lý các tài liệu kỹ thuật chuyên môn làm cơ sở dữ liệu tri thức sinh học cho trợ lý AI Chatbot và sổ tay khách hàng.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Upload} onClick={() => setShowUploadModal(true)}>
          Tải Lên Tài Liệu Mới
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={docs}
        searchPlaceholder="Tìm kiếm theo tiêu đề tài liệu, tác giả..."
        searchField="title"
      />

      {/* Modal Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Tải Lên Tài Liệu Kỹ Thuật Mới"
        subtitle="Hệ thống tự động phân tách và nhúng vector vào kho tri thức RAG"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Tiêu Đề Tài Liệu"
            required
            placeholder="Ví dụ: Sổ Tay Kỹ Thuật Canh Tác Cà Chua Bi Cherry Chuẩn VietGAP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gắn Liền Giống Cây"
              required
              value={varietyId}
              onChange={(e) => setVarietyId(e.target.value)}
              options={varietiesData.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.cropName})`
              }))}
            />

            <Select
              label="Phân Loại Tài Liệu"
              required
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={[
                { value: 'CULTIVATION_GUIDE', label: 'CULTIVATION_GUIDE (Sổ tay canh tác)' },
                { value: 'TECHNICAL_MANUAL', label: 'TECHNICAL_MANUAL (Hướng dẫn kỹ thuật)' },
                { value: 'SAFETY_GUIDE', label: 'SAFETY_GUIDE (An toàn & Phòng trừ sâu bệnh)' },
                { value: 'OTHER', label: 'OTHER (Khác)' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phiên Bản Tài Liệu"
              required
              placeholder="v1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />

            <Input
              label="Tác Giả / Người Thẩm Định"
              required
              placeholder="ThS. Nguyễn Hoàng Nam"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Tóm Tắt Nội Dung Chính
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả các chương mục và các tiêu chí sinh học quan trọng..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          {/* Dummy File Upload Dropzone */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-brand-border bg-brand-cream/40 text-center space-y-2">
            <Upload className="w-8 h-8 text-brand-green mx-auto" />
            <p className="text-xs font-bold text-brand-dark">Kéo thả tệp PDF tại đây, hoặc bấm để chọn tệp</p>
            <p className="text-[11px] text-stone-500">Giới hạn tệp tối đa 15MB (.pdf, .docx, .md)</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowUploadModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu & Nhúng Tri Thức (Index)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal View Detail */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          subtitle={`Mã: ${selectedDoc.id} • Phiên bản: ${selectedDoc.version}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-border text-xs space-y-2">
              <div className="flex justify-between">
                <span>Áp dụng giống:</span>
                <strong>{selectedDoc.varietyName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tác giả:</span>
                <strong>{selectedDoc.author}</strong>
              </div>
              <div className="flex justify-between">
                <span>Ngày đăng tải:</span>
                <span>{selectedDoc.uploadedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kích thước tệp:</span>
                <span>{selectedDoc.fileSize}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                Mô tả chi tiết:
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed bg-white p-3.5 rounded-xl border border-brand-border">
                {selectedDoc.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tài liệu đã được chia đoạn (chunking) và lập chỉ mục trong vector database phục vụ Chatbot AI.</span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
