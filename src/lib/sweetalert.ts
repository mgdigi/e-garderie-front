import Swal from 'sweetalert2';

export const showSuccessAlert = (message: string, title: string = 'Succès') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-2'
    }
  });
};

export const showErrorAlert = (message: string, title: string = 'Erreur') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-2'
    }
  });
};

export const showWarningAlert = (message: string, title: string = 'Attention') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-2'
    }
  });
};

export const showInfoAlert = (message: string, title: string = 'Information') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-2'
    }
  });
};

export const showConfirmAlert = async (
  message: string,
  title: string = 'Confirmation',
  confirmText: string = 'Confirmer',
  cancelText: string = 'Annuler'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl px-6 py-2',
      cancelButton: 'rounded-xl px-6 py-2'
    }
  });

  return result.isConfirmed;
};

export const showLoadingAlert = (message: string = 'Chargement...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

export const hideLoadingAlert = () => {
  Swal.close();
};