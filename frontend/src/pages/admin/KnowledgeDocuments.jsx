import React, { useState, useEffect } from 'react';
import { varietiesData } from '../../data/varieties';
import { knowledgeApi } from '../../api/knowledge/knowledgeApi';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BookOpen, Plus, Eye, Upload, FileText, CheckCircle2, Archive, Download, ExternalLink, Trash2, Pencil } from 'lucide-react';

export default function KnowledgeDocuments() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Re-upload Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVarietyId, setEditVarietyId] = useState('VAR-001');
  const [editDocType, setEditDocType] = useState('CULTIVATION_GUIDE');
  const [editVersion, setEditVersion] = useState('v1.0');
  const [editAuthor, setEditAuthor] = useState('ThS. Nguyễn Hoàng Nam');
  const [editDescription, setEditDescription] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [varietyId, setVarietyId] = useState('VAR-001');
  const [docType, setDocType] = useState('CULTIVATION_GUIDE');
  const [version, setVersion] = useState('v1.0');
  const [author, setAuthor] = useState('ThS. Nguyễn Hoàng Nam');
  const [description, setDescription] = useState('');

  const loadDocuments = () => {
    knowledgeApi.getAllDocuments()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const normalized = res.data.map((item, idx) => {
            const rawFileUrl = item.file_url || item.fileUrl || '';
            return {
              id: item.id || `DOC-00${item.document_id || idx + 1}`,
              documentId: item.document_id || item.documentId || idx + 1,
              title: item.title,
              author: item.author_name || item.authorName || item.author || 'Chưa có dữ liệu',
              fileUrl: rawFileUrl,
              fileSize: item.file_size || item.fileSize || 'Chưa có dữ liệu',
              varietyName: item.variety_name || item.varietyName || 'Chưa có dữ liệu',
              cropName: item.crop_name || item.cropName || 'Chưa có dữ liệu',
              documentType: item.document_type || item.documentType || 'Chưa có dữ liệu',
              version: item.version || 'Chưa có dữ liệu',
              status: item.status || 'PUBLISHED',
              uploadedDate: item.uploadedDate || (item.created_at ? item.created_at.split('T')[0] : 'Chưa có dữ liệu'),
              description: item.content || item.description || 'Chưa có dữ liệu',
              sectionsCount: item.sections_count || item.sectionsCount || 0,
              isIndexedForRAG: item.isIndexedForRAG ?? item.is_indexed_for_rag ?? false
            };
          });
          setDocs(normalized);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        setDocs([]);
      });
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (doc) => {
    const docId = doc.documentId || doc.document_id || parseInt(String(doc.id || '').replace(/\D/g, ''), 10);
    if (!docId) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${doc.title}" khỏi cơ sở dữ liệu?`)) {
      try {
        await knowledgeApi.deleteDocument(docId);
        setDocs((prev) => prev.filter((d) => (d.documentId || d.document_id || d.id) !== (doc.documentId || doc.document_id || doc.id)));
      } catch (err) {
        console.error('Lỗi xóa tài liệu:', err.message);
        alert(`Không thể xóa tài liệu: ${err.message}`);
      }
    }
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || '');
    setEditVarietyId(doc.varietyId || 'VAR-001');
    setEditDocType(doc.documentType || 'CULTIVATION_GUIDE');
    setEditVersion(doc.version || 'v1.0');
    setEditAuthor(doc.author || doc.authorName || 'ThS. Nguyễn Hoàng Nam');
    setEditDescription(doc.description || doc.content || '');
    setEditFile(null);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setIsUpdating(true);

    const docId = editingDoc.documentId || editingDoc.document_id || parseInt(String(editingDoc.id || '').replace(/\D/g, ''), 10);
    const varObj = varietiesData.find((v) => v.id === editVarietyId);

    let fileUrl = editingDoc.fileUrl || editingDoc.file_url;
    let fileSizeStr = editingDoc.fileSize || '3.5 MB (PDF)';

    // If new replacement file chosen, upload to docs directory
    if (editFile) {
      try {
        const uploadRes = await knowledgeApi.uploadFile(editFile);
        if (uploadRes && uploadRes.data) {
          fileUrl = uploadRes.data.fileUrl;
          fileSizeStr = uploadRes.data.size;
        }
      } catch (err) {
        setIsUpdating(false);
        return;
      }
    }

    const payload = {
      title: editTitle,
      varietyId: varObj ? parseInt(varObj.id.replace(/\D/g, '') || '1') : null,
      documentType: editDocType,
      version: editVersion,
      authorName: editAuthor,
      content: editDescription,
      fileUrl,
      fileSize: fileSizeStr
    };

    try {
      await knowledgeApi.updateDocument(docId, payload);
    } catch (err) {
      console.warn('Update document API error, updating local state:', err.message);
    }

    // Update in state
    setDocs((prev) =>
      prev.map((d) => {
        const dId = d.documentId || d.document_id || d.id;
        const targetId = editingDoc.documentId || editingDoc.document_id || editingDoc.id;
        if (dId === targetId) {
          return {
            ...d,
            title: editTitle,
            varietyId: editVarietyId,
            varietyName: varObj ? varObj.name : d.varietyName,
            cropName: varObj ? varObj.cropName : d.cropName,
            documentType: editDocType,
            version: editVersion,
            author: editAuthor,
            authorName: editAuthor,
            description: editDescription,
            content: editDescription,
            fileUrl,
            fileSize: fileSizeStr
          };
        }
        return d;
      })
    );

    setIsUpdating(false);
    setShowEditModal(false);
    setEditingDoc(null);
    setEditFile(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const varObj = varietiesData.find((v) => v.id === varietyId);

    let fileUrl = '/docs/rau_an_toan_vietgap_huyen.pdf';
    let fileSizeStr = '3.5 MB (PDF)';

    if (selectedFile) {
      try {
        const uploadRes = await knowledgeApi.uploadFile(selectedFile);
        if (uploadRes && uploadRes.data) {
          fileUrl = uploadRes.data.fileUrl;
          fileSizeStr = uploadRes.data.size;
        }
      } catch (err) {
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      title,
      varietyId: varObj ? parseInt(varObj.id.replace(/\D/g, '') || '1') : null,
      documentType: docType,
      version,
      authorName: author,
      content: description,
      fileUrl,
      fileSize: fileSizeStr,
      isIndexedForRAG: true,
      sectionsCount: 5,
      createdBy: 5
    };

    try {
      const apiRes = await knowledgeApi.createDocument(payload);
      if (apiRes && apiRes.data) {
        const item = apiRes.data;
        const normalizedItem = {
          id: item.id || `DOC-00${item.document_id || item.documentId || docs.length + 1}`,
          documentId: item.document_id || item.documentId || docs.length + 1,
          title: item.title,
          author: item.author_name || item.authorName || author,
          fileUrl: item.file_url || item.fileUrl || fileUrl,
          fileSize: item.file_size || item.fileSize || fileSizeStr,
          varietyName: varObj ? varObj.name : 'Áp dụng chung',
          cropName: varObj ? varObj.cropName : 'Nông nghiệp tổng quát',
          documentType: docType,
          version: version,
          status: 'PUBLISHED',
          uploadedDate: new Date().toISOString().split('T')[0],
          description: description,
          sectionsCount: 5,
          isIndexedForRAG: true
        };
        setDocs((prev) => [normalizedItem, ...prev]);
        setShowUploadModal(false);
        setIsSubmitting(false);
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        return;
      }
    } catch (err) {
      setIsSubmitting(false);
      return;
    }

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
      fileUrl,
      fileSize: fileSizeStr,
      description,
      sectionsCount: 5,
      isIndexedForRAG: true
    };

    setDocs((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setSelectedFile(null);
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
              Tác giả: {row.author || row.authorName || 'Hội đồng Kỹ thuật Farmely'} • {row.fileSize || '3.5 MB (PDF)'}
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
          {row.documentType || 'CULTIVATION_GUIDE'}
        </span>
      )
    },
    {
      header: 'Phiên Bản',
      key: 'version',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-green">
          {row.version || 'v1.0'}
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
      render: (row) => <Badge variant={row.status === 'PUBLISHED' ? 'ACTIVE' : 'DEFAULT'} size="sm">{row.status || 'PUBLISHED'}</Badge>
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => {
        const fileUrl = row.fileUrl || row.file_url;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDoc(row)}
              className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
              title="Xem chi tiết tài liệu"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Chỉnh sửa & tải lại tài liệu (Re-upload)"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {fileUrl && (
              <a
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                title="Tải tệp PDF về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải PDF</span>
              </a>
            )}
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Xóa tài liệu khỏi cơ sở dữ liệu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Thực thể: KnowledgeDocument (Cơ sở dữ liệu RAG AI)
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live DB: {docs.length} Tài liệu RAG</span>
              </span>
            )}
          </div>
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

          {/* Real File Upload Dropzone */}
          <label className="p-6 rounded-2xl border-2 border-dashed border-brand-border bg-brand-cream/40 text-center space-y-2 block cursor-pointer hover:bg-brand-cream/70 transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-8 h-8 text-brand-green mx-auto" />
            <p className="text-xs font-bold text-brand-dark">
              {selectedFile ? `Đã chọn: ${selectedFile.name}` : 'Kéo thả tệp PDF tại đây, hoặc bấm để chọn tệp'}
            </p>
            <p className="text-[11px] text-stone-500">
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Hỗ trợ định dạng .pdf, .docx (tối đa 50MB)'}
            </p>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowUploadModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu & Nhúng Tri Thức (Index)'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh Sửa & Tải Lại Tài Liệu (Re-upload) */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDoc(null);
          setEditFile(null);
        }}
        title="Chỉnh Sửa & Tải Lại Tài Liệu (Re-upload)"
        subtitle={editingDoc ? `Mã: ${editingDoc.id || editingDoc.documentId} • Cập nhật thông tin & thay thế tệp tài liệu trong hệ thống` : ''}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Tiêu Đề Tài Liệu"
            required
            placeholder="Nhập tiêu đề tài liệu..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gắn Liền Giống Cây"
              required
              value={editVarietyId}
              onChange={(e) => setEditVarietyId(e.target.value)}
              options={varietiesData.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.cropName})`
              }))}
            />

            <Select
              label="Phân Loại Tài Liệu"
              required
              value={editDocType}
              onChange={(e) => setEditDocType(e.target.value)}
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
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
            />

            <Input
              label="Tác Giả / Người Thẩm Định"
              required
              placeholder="ThS. Nguyễn Hoàng Nam"
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Tóm Tắt Nội Dung Chính
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Mô tả các chương mục và các tiêu chí sinh học quan trọng..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          {/* Current File Information */}
          {editingDoc && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-700">Đường dẫn tệp hiện tại trong docs: </span>
                <span className="font-mono text-brand-green font-bold">{editingDoc.fileUrl || editingDoc.file_url || 'Chưa có'}</span>
              </div>
              <span className="text-stone-400 text-[11px]">{editingDoc.fileSize || '3.5 MB'}</span>
            </div>
          )}

          {/* Re-upload File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Tải Tệp Mới Để Thay Thế (Tự Động Lưu Vào Docs)
            </label>
            <label className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 text-center space-y-1.5 block cursor-pointer hover:bg-amber-50/80 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEditFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-7 h-7 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-brand-dark">
                {editFile ? `Tệp mới đã chọn: ${editFile.name}` : 'Bấm hoặc kéo thả để tải tệp PDF mới thay thế'}
              </p>
              <p className="text-[11px] text-stone-500">
                {editFile
                  ? `${(editFile.size / (1024 * 1024)).toFixed(2)} MB - Sẽ tự động lưu vào /docs và cập nhật database`
                  : 'Nếu không chọn tệp mới, hệ thống sẽ giữ nguyên tệp hiện tại'}
              </p>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingDoc(null);
                setEditFile(null);
              }}
            >
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
              {isUpdating ? 'Đang cập nhật...' : 'Cập Nhật & Lưu Cơ Sở Dữ Liệu'}
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
                {selectedDoc.description || selectedDoc.content}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tài liệu đã được chia đoạn (chunking) và lập chỉ mục trong vector database phục vụ Chatbot AI.</span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-brand-border">
              {selectedDoc.fileUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={selectedDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem Trực Tiếp (PDF)
                  </a>
                  <a
                    href={selectedDoc.fileUrl}
                    download
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-green hover:bg-brand-dark px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải Về Máy
                  </a>
                </div>
              ) : (
                <span className="text-[11px] text-stone-400">Chưa có tệp PDF đính kèm</span>
              )}
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
