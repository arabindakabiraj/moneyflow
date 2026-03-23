/**
 * InsightCard.jsx — Smart insight display for spending predictions
 * Shows icon, message, severity styling
 */
export default function InsightCard({ text, type = 'info', className = '' }) {
  const styles = {
    warning: {
      bg: 'rgba(251,191,36,0.10)',
      border: 'rgba(251,191,36,0.20)',
      color: '#FBBF24',
    },
    success: {
      bg: 'rgba(52,211,153,0.10)',
      border: 'rgba(52,211,153,0.20)',
      color: '#34D399',
    },
    error: {
      bg: 'rgba(255,107,107,0.10)',
      border: 'rgba(255,107,107,0.20)',
      color: '#FF6B6B',
    },
    info: {
      bg: 'rgba(79,142,247,0.10)',
      border: 'rgba(79,142,247,0.20)',
      color: '#4F8EF7',
    },
  }

  const s = styles[type] || styles.info

  return (
    <div
      className={`flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-xl ${className}`}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
      }}
    >
      {text}
    </div>
  )
}
