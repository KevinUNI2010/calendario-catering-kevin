import React from 'react';
import toast, { Toast } from 'react-hot-toast';
import { Check, ShieldAlert, TriangleAlert, Info } from 'lucide-react';

// Inject keyframes globally once
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes toastr-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
    .toastr-enter {
      animation: toastr-enter 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
    }
    .toastr-leave {
      animation: toastr-leave 0.4s forwards cubic-bezier(0.06, 0.71, 0.55, 1);
    }
    @keyframes toastr-enter {
      0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastr-leave {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-20px) scale(0.9); }
    }
  `;
  document.head.appendChild(style);
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

const ToastrCustom = ({ t, title, message, type, duration }: { t: Toast, title: string, message: string, type: ToastType, duration: number }) => {
  let bgColor = '';
  let Icon = Info;

  switch (type) {
    case 'success':
      bgColor = 'bg-[#51A351]'; // Classic Toastr Green
      Icon = Check;
      break;
    case 'error':
      bgColor = 'bg-[#BD362F]'; // Classic Toastr Red
      Icon = ShieldAlert;
      break;
    case 'warning':
      bgColor = 'bg-[#F89406]'; // Classic Toastr Orange
      Icon = TriangleAlert;
      break;
    case 'info':
      bgColor = 'bg-[#2F96B4]'; // Classic Toastr Blue
      Icon = Info;
      break;
  }

  return (
    <div
      onClick={() => toast.dismiss(t.id)}
      className={`${
        t.visible ? 'toastr-enter' : 'toastr-leave'
      } relative overflow-hidden flex items-start gap-3 p-4 pr-6 ${bgColor} text-white shadow-[0_0_12px_#999999] rounded-[3px] opacity-95 w-[320px] max-w-full cursor-pointer hover:opacity-100 transition-opacity`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 pb-1">
        <span className="font-bold text-[16px] leading-tight mb-0.5 tracking-wide">{title}</span>
        <span className="text-[14px] leading-snug">{message}</span>
      </div>

      {/* Progress Bar (Bottom Line) */}
      <div 
        className="absolute bottom-0 left-0 h-[4px] bg-black/20"
        style={{
          animation: `toastr-progress ${duration}ms linear forwards`,
          animationPlayState: t.visible ? 'running' : 'paused'
        }}
      />
    </div>
  );
};

const createToast = (type: ToastType, title: string, message: string, options?: any) => {
  const duration = options?.duration || 4000;
  toast.custom((t) => (
    <ToastrCustom t={t} title={title} message={message} type={type} duration={duration} />
  ), {
    duration,
    ...options
  });
};

export const notify = {
  success: (title: string, message: string, options?: any) => createToast('success', title, message, options),
  error: (title: string, message: string, options?: any) => createToast('error', title, message, options),
  warning: (title: string, message: string, options?: any) => createToast('warning', title, message, options),
  info: (title: string, message: string, options?: any) => createToast('info', title, message, options),
};
