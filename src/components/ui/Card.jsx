/**
 * Card.jsx — Reusable premium card component
 * Variants: default, hero, insight
 */
export default function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'p-5',
  onClick,
  ...props
}) {
  const base = {
    default: 'bg-[#1A1A1D] border border-white/[0.08] rounded-2xl',
    hero: 'bg-gradient-to-br from-[#1E1E22] to-[#16161A] border border-white/[0.06] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.6)]',
    insight: 'bg-[#1A1A1D] border border-white/[0.08] rounded-2xl',
    flat: 'bg-[#222226] border border-white/[0.08] rounded-xl',
  }

  return (
    <div
      className={`${base[variant] || base.default} ${padding} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

/* Card Header — icon + title + optional right element */
export function CardHeader({ icon: Icon, iconBg, iconColor, title, right, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 mb-3 ${className}`}>
      {Icon && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg || 'rgba(79,142,247,0.15)' }}
        >
          <Icon size={14} style={{ color: iconColor || '#4F8EF7' }} />
        </div>
      )}
      <h3 className="font-semibold text-sm text-white/90 flex-1">{title}</h3>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}
