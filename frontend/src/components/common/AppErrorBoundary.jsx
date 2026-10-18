import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Farmely UI runtime error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream p-6 font-sans">
        <section className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Farmely</p>
          <h1 className="mt-3 font-heading text-2xl font-black text-brand-dark">Trang vừa gặp lỗi hiển thị</h1>
          <p className="mt-2 text-sm text-stone-600">Dữ liệu của bạn vẫn an toàn. Hãy tải lại trang để khôi phục phiên làm việc.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-brand-yellow px-6 py-3 text-sm font-black text-brand-dark hover:brightness-95">
            Tải lại trang
          </button>
        </section>
      </main>
    );
  }
}
