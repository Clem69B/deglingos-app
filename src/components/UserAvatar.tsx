interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Displays a circular avatar with user initials and a color based on hash
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param size - Size variant: 'sm' (8), 'md' (12), 'lg' (16)
 * @param className - Additional CSS classes
 */
export default function UserAvatar({ 
  firstName, 
  lastName, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  // Extract initials
  const first = (firstName?.[0] ?? '').toUpperCase();
  const last = (lastName?.[0] ?? '').toUpperCase();
  const initials = `${first}${last}` || '?';

  // Color palette for avatars (30 colors)
  const colors = [
    'bg-indigo-500',
    'bg-indigo-700',
    'bg-red-500',
    'bg-red-700',
    'bg-green-500',
    'bg-green-700',
    'bg-yellow-500',
    'bg-yellow-700',
    'bg-pink-500',
    'bg-pink-700',
    'bg-purple-500',
    'bg-purple-700',
    'bg-blue-500',
    'bg-blue-700',
    'bg-emerald-500',
    'bg-emerald-700',
    'bg-orange-500',
    'bg-orange-700',
    'bg-sky-500',
    'bg-sky-700',
    'bg-stone-500',
    'bg-stone-700',
    'bg-teal-500',
    'bg-teal-700',
    'bg-cyan-500',
    'bg-cyan-700',
    'bg-lime-500',
    'bg-lime-700',
    'bg-fuchsia-500',
    'bg-fuchsia-700',
  ];

  // Generate hash from full name to consistently assign colors
  // This ensures that two people with same initials get different colors
  const fullName = `${firstName || ''}${lastName || ''}`;
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = (hash << 5) - hash + fullName.charCodeAt(i);
    hash |= 0;
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-lg',
    lg: 'h-16 w-16 text-2xl',
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${colorClass} flex items-center justify-center ${className}`}
    >
      <span className="font-medium text-white">{initials}</span>
    </div>
  );
}
