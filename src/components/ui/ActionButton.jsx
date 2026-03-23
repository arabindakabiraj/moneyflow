/**
 * ActionButton.jsx — Consistent CTA button with variants
 * Variants: primary (accent blue), success, danger, ghost
 */
export default function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-[#4F8EF7] text-white shadow-[0_4px_16px_rgba(79,142,247,0.3)]',
    success: 'bg-[#34D399] text-white shadow-[0_4px_16px_rgba(52,211,153,0.3)]',
    danger: 'bg-[#FF6B6B] text-white shadow-[0_4px_16px_rgba(255,107,107,0.3)]',
    ghost: 'bg-[#222226] text-white/70 border border-white/[0.08]',
    subtle: 'bg-white/[0.06] text-white/60 border border-white/[0.08]',
  }

  const sizes = {
    sm: 'px-3 py-2 text-xs rounded-lg',
    md: 'px-4 py-3 text-sm rounded-xl',
    lg: 'px-5 py-4 text-base rounded-2xl',
    full: 'w-full py-4 text-sm rounded-2xl',
  }

  return (
    <button
      className={`font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  )
}
