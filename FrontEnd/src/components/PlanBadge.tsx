import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  plan: 'free' | 'pro';
  className?: string;
}

export const PlanBadge = ({ plan, className }: PlanBadgeProps) => {
  if (plan === 'pro') {
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-primary to-warning text-background',
        className
      )}>
        PRO
      </span>
    );
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-muted text-muted-foreground',
      className
    )}>
      GRATUITO
    </span>
  );
};
