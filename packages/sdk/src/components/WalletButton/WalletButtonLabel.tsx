import { RecentBadge } from '@src/ui';
import { ChevronRight } from 'lucide-react';

export const WalletButtonLabel = ({ type }: { type?: 'Recent' }) => {
  if (!type) return <ChevronRight size={18} color="var(--color-foreground-subtle)" />;
  return <RecentBadge />;
};
