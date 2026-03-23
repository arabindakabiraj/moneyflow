/**
 * SkeletonLoader.jsx — Reusable skeleton loading states
 * Variants: card, row, hero, inline
 */
export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton h-36 rounded-2xl ${className}`} />
}

export function SkeletonRow({ className = '' }) {
  return <div className={`skeleton h-14 rounded-xl ${className}`} />
}

export function SkeletonHero({ className = '' }) {
  return <div className={`skeleton h-44 rounded-[20px] ${className}`} />
}

export function SkeletonInline({ width = 'w-20', className = '' }) {
  return <div className={`skeleton h-4 rounded-lg ${width} ${className}`} />
}

/* Full dashboard skeleton */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <SkeletonHero />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <SkeletonRow key={i} className="h-[72px]" />)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <SkeletonRow key={i} className="h-[72px]" />)}
      </div>
      <SkeletonCard />
      <SkeletonCard className="h-52" />
    </div>
  )
}
