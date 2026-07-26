import React from 'react';

export type OrderStatus = 'placed' | 'assigned' | 'picked_up' | 'delivered' | string;

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || 'placed').toLowerCase();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = 'Placed';

  switch (normalized) {
    case 'placed':
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      label = 'Order Placed';
      break;
    case 'assigned':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Rider Assigned';
      break;
    case 'picked_up':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Picked Up';
      break;
    case 'delivered':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Delivered';
      break;
    default:
      label = status;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all ${badgeStyle}`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      {label}
    </span>
  );
};
