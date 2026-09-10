import { useMemo } from 'react';
import { Clock, UserCheck, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAppUsers } from '@/modules/auth/hooks/useAuth';

interface AuditInfoProps {
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  className?: string;
}

export function AuditInfo({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  className = '',
}: AuditInfoProps) {
  const { data: users = [] } = useAppUsers();

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => {
      map.set(u.id, u.fullName || u.email);
    });
    return map;
  }, [users]);

  const resolveUserName = (userId?: string | null) => {
    if (!userId) return null;
    return userMap.get(userId) || (userId.length > 8 ? `${userId.substring(0, 8)}...` : userId);
  };

  const formatDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const createdByName = resolveUserName(createdBy);
  const updatedByName = resolveUserName(updatedBy);
  const createdDate = formatDateSafe(createdAt);
  const updatedDate = formatDateSafe(updatedAt);

  if (!createdByName && !createdDate && !updatedByName && !updatedDate) {
    return null;
  }

  return (
    <div className={`p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/60 flex flex-wrap items-center justify-between gap-4 text-xs text-secondary ${className}`}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary/70 shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-semibold text-on-background/80">Informasi Audit:</span>
          {createdByName && (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-secondary" />
              <span>Dibuat oleh: <strong className="text-on-background font-semibold">{createdByName}</strong></span>
              {createdDate && <span>({createdDate})</span>}
            </span>
          )}
        </div>
      </div>

      {(updatedByName || updatedDate) && (
        <div className="flex items-center gap-1.5 text-secondary pl-6 sm:pl-0">
          <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span>
            Terakhir diupdate: {updatedByName ? <strong className="text-on-background font-semibold">{updatedByName}</strong> : ''}
            {updatedDate ? <span> ({updatedDate})</span> : ''}
          </span>
        </div>
      )}
    </div>
  );
}
