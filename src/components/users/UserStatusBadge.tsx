'use client';

interface UserStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  CONFIRMED: {
    label: 'Confirmé',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-400',
  },
  UNCONFIRMED: {
    label: 'Non confirmé',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    dotColor: 'bg-yellow-400',
  },
  ARCHIVED: {
    label: 'Archivé',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    dotColor: 'bg-gray-400',
  },
  COMPROMISED: {
    label: 'Compromis',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-400',
  },
  UNKNOWN: {
    label: 'Inconnu',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-400',
  },
  RESET_REQUIRED: {
    label: 'Reset requis',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    dotColor: 'bg-orange-400',
  },
  FORCE_CHANGE_PASSWORD: {
    label: 'Changer mot de passe',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    dotColor: 'bg-orange-400',
  },
} as const;

export default function UserStatusBadge({ status, className = '' }: UserStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <svg className={`mr-1.5 h-2 w-2 ${config.dotColor}`} fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      {config.label}
    </span>
  );
}
