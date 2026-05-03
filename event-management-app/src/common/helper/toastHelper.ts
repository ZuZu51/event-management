import { Toast } from 'primereact/toast';

export interface ToastConfig {
  severity: 'success' | 'error' | 'warn' | 'info';
  summary?: string;
  detail: string;
  life?: number;
}

/**
 * Unified Toast notification helper
 * Ensures consistent styling and messaging across the app
 */
export const showToast = (toastRef: React.RefObject<Toast | null>, config: ToastConfig) => {
  const defaultLife = 3000;
  
  toastRef.current?.show({
    severity: config.severity,
    summary: config.summary || getSummaryByType(config.severity),
    detail: config.detail,
    life: config.life || defaultLife,
  });
};

/**
 * Show success toast - "Thực hiện thao tác thành công"
 */
export const showSuccessToast = (toastRef: React.RefObject<Toast | null>, detail: string) => {
  showToast(toastRef, {
    severity: 'success',
    summary: 'Thành công',
    detail: detail || 'Thực hiện thao tác thành công',
    life: 3000,
  });
};

/**
 * Show error toast - "Thực hiện thao tác thất bại"
 */
export const showErrorToast = (toastRef: React.RefObject<Toast | null>, detail: string) => {
  showToast(toastRef, {
    severity: 'error',
    summary: 'Lỗi',
    detail: detail || 'Thực hiện thao tác thất bại',
    life: 4000,
  });
};

/**
 * Show warning toast
 */
export const showWarningToast = (toastRef: React.RefObject<Toast | null>, detail: string) => {
  showToast(toastRef, {
    severity: 'warn',
    summary: 'Cảnh báo',
    detail: detail,
    life: 3500,
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (toastRef: React.RefObject<Toast | null>, detail: string) => {
  showToast(toastRef, {
    severity: 'info',
    summary: 'Thông tin',
    detail: detail,
    life: 3000,
  });
};

const getSummaryByType = (severity: string): string => {
  const summaries: Record<string, string> = {
    success: 'Thành công',
    error: 'Lỗi',
    warn: 'Cảnh báo',
    info: 'Thông tin',
  };
  return summaries[severity] || 'Thông báo';
};
