import React from 'react';
import { Sprout } from 'lucide-react';

export default function EmptyState({
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào được ghi nhận trong hệ thống.",
  action,
  icon: Icon = Sprout
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl">
      <div className="w-14 h-14 rounded-2xl bg-brand-cream flex items-center justify-center text-brand-green mb-4 border border-brand-border/40">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="font-heading text-lg font-bold text-brand-dark mb-1">
        {title}
      </h4>
      <p className="text-sm text-brand-muted max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
