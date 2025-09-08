export const getStatusBadgeColor = (status: string = 'DRAFT'): string => {
  switch (status) {
    case 'PAID':
      return 'badge-success';
    case 'PENDING':
      return 'badge-info';
    case 'OVERDUE':
      return 'badge-error';
    case 'DRAFT':
      return 'badge-warning';
    default:
      return 'badge-ghost';
  }
};

export const translateStatus = (status: string = 'DRAFT'): string => {
  switch (status) {
    case 'PAID':
      return 'Payée';
    case 'PENDING':
      return 'En attente de paiement';
    case 'OVERDUE':
      return 'En retard';
    case 'DRAFT':
      return 'Brouillon';
    default:
      return status;
  }
};
