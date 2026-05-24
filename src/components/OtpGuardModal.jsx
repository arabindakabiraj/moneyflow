import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Mail, Key, X, CheckCircle, Shield, AlertCircle, Loader2 } from 'lucide-react'

const API_BASE = "http://localhost:8001/api/v1"
const TENANT_ID = "moneyflow-app"

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT_ID
  }
})

// Auto-register user in FastAPI backend
async function registerUser(email) {
  try {
    console.log("[OTP Service] Transparently registering user in FastAPI database...")
    await apiClient.post("/auth/register", {
      email: email,
      password: "MF_Secure_Password_2026",
      full_name: "MoneyFlow User"
    })
  } catch (error) {
    console.error("[OTP Service] Auto-registration failed:", error)
    throw new Error(error.response?.data?.detail || "Failed to initialize MFA identity.")
  }
}

// Send OTP to user
async function sendOtpCode(email, channel = "email", purpose = "action_verification") {
  try {
    const res = await apiClient.post("/otp/send", {
      identifier: email,
      channel: channel,
      purpose: purpose,
      length: 6,
      expiry_seconds: 300
    })
    return res.data
  } catch (error) {
    if (error.response?.status === 404) {
      await registerUser(email)
      const res = await apiClient.post("/otp/send", {
        identifier: email,
        channel: channel,
        purpose: purpose,
        length: 6,
        expiry_seconds: 300
      })
      return res.data
    }
    console.error("[OTP Service] Error sending OTP:", error)
    throw new Error(error.response?.data?.detail || "Failed to dispatch verification code.")
  }
}

// Verify OTP code
async function verifyOtpCode(email, otp, purpose = "action_verification") {
  try {
    const res = await apiClient.post("/otp/verify", {
      identifier: email,
      otp: otp,
      purpose: purpose
    })
    return res.data
  } catch (error) {
    console.error("[OTP Service] Error verifying OTP:", error)
    throw new Error(error.response?.data?.detail || "Invalid or expired verification code.")
  }
}

// Fetch dev-only latest OTP
async function fetchDevLatestOtp(email) {
  try {
    const res = await axios.get(`${API_BASE}/otp/dev-latest?identifier=${encodeURIComponent(email)}`)
    return res.data?.otp
  } catch (error) {
    console.warn("[OTP Service] Could not fetch dev OTP:", error.response?.data?.detail || error.message)
    return null
  }
}

// Custom 6-digit OTP input component with auto-focus and visual slots
function OtpInput({ value, onChange, length = 6, error, focused }) {
  const inputRef = useRef(null)
  const digits = []
  for (let i = 0; i < length; i++) {
    digits.push(value[i] || "")
  }

  useEffect(() => {
    if (focused) {
      inputRef.current?.focus()
    }
  }, [focused])

  return (
    <div className="relative flex flex-col items-center justify-center my-6">
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        maxLength={length}
        value={value}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(0, length)
          onChange(val)
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        style={{ zIndex: 10 }}
      />
      <div className="flex gap-2.5 justify-center">
        {digits.map((digit, idx) => {
          const isCurrent = idx === value.length
          const isFocused = focused && isCurrent
          return (
            <div
              key={idx}
              onClick={() => inputRef.current?.focus()}
              className="w-11 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-mono transition-all duration-300 select-none cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: isFocused
                  ? "2px solid #14B8A6"
                  : error
                  ? "2px solid #FF6B6B"
                  : "1.5px solid rgba(255, 255, 255, 0.08)",
                boxShadow: isFocused ? "0 0 16px rgba(20,184,166,0.25)" : "none",
                color: "white"
              }}
            >
              {digit}
              {isFocused && (
                <span className="w-[2px] h-5 bg-[#14B8A6] animate-pulse" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OtpGuardModal({ isOpen, onClose, userEmail, purpose = "action_verification", onVerified }) {
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [hasSent, setHasSent] = useState(false)
  const [devOtpInfo, setDevOtpInfo] = useState(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(c => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (isOpen && !hasSent && userEmail) {
      sendOtp()
    }
  }, [isOpen, hasSent, userEmail])

  useEffect(() => {
    if (!isOpen) {
      setOtp("")
      setError("")
      setSuccess(false)
      setHasSent(false)
      setCooldown(0)
      setDevOtpInfo(null)
    }
  }, [isOpen])

  const fetchDevOtp = (email) => {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return
    setTimeout(async () => {
      try {
        const code = await fetchDevLatestOtp(email)
        if (code) {
          setDevOtpInfo({ code, destination: email })
        }
      } catch (err) {
        console.warn("Dev OTP fetch failed:", err)
      }
    }, 1500)
  }

  const sendOtp = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await sendOtpCode(userEmail, "email", purpose)
      setCooldown(data.cooldown_seconds || 60)
      setHasSent(true)
      fetchDevOtp(userEmail)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (code) => {
    const val = code || otp
    if (val.length < 6) return
    setLoading(true)
    setError("")
    try {
      const data = await verifyOtpCode(userEmail, val, purpose)
      if (data.verified) {
        setSuccess(true)
        setTimeout(() => {
          onVerified()
          onClose()
        }, 1200)
      }
    } catch (err) {
      setError(err.message)
      setOtp("")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (otp.length === 6) {
      handleVerify(otp)
    }
  }, [otp])

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes modalToastSlideIn {
          from { transform: translateY(-50px) translateX(120%); opacity: 0; }
          to { transform: translateY(0) translateX(0); opacity: 1; }
        }
        .animate-modal-toast-slide-in {
          animation: modalToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {devOtpInfo && (
        <div className="fixed top-5 right-5 z-[2000] max-w-sm w-full bg-[#0b1b17]/95 border border-[#14b8a6]/30 rounded-2xl shadow-[0_20px_50px_rgba(20,184,166,0.15)] p-4 flex gap-3.5 animate-modal-toast-slide-in backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/20 flex items-center justify-center shrink-0 text-[#14B8A6]">
            <Mail size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Simulated Dev Email OTP</span>
              <button
                type="button"
                onClick={() => setDevOtpInfo(null)}
                className="text-white/40 hover:text-white/70 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-white/90 leading-tight mb-2">
              Your action verification OTP is: {devOtpInfo.code}
            </p>
            <button
              type="button"
              onClick={() => {
                setOtp(devOtpInfo.code)
                setDevOtpInfo(null)
              }}
              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.98] text-white text-[11px] font-bold py-2 px-3 rounded-xl transition-all duration-150 border-none cursor-pointer flex items-center justify-center gap-1.5"
              style={{ boxShadow: "0 4px 12px rgba(20,184,166,0.25)" }}
            >
              <Key size={12} /> Autofill Code
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in px-4">
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative border border-white/[0.08]"
          style={{
            background: "linear-gradient(145deg, #121E1B 0%, #080F0E 100%)",
            animation: "successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both"
          }}
        >
          <button
            onClick={onClose}
            disabled={loading || success}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 active:scale-95 transition-all"
          >
            <X size={15} />
          </button>

          {success ? (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[340px] animate-fade-in">
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#34D399]/25 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-[#34D399]/40" />
                <div className="w-16 h-16 rounded-full bg-[#34D399]/15 flex items-center justify-center border border-[#34D399]/30">
                  <CheckCircle size={28} className="text-[#34D399]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5">Verification Successful</h3>
              <p className="text-xs text-white/40">Your action has been securely authorized</p>
            </div>
          ) : (
            <div className="p-6 pt-8 flex flex-col">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-[#14B8A6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#14B8A6]/20 shadow-lg shadow-[#14B8A6]/5">
                  <Shield className="text-[#14B8A6]" size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">MFA Security Shield</h3>
                <p className="text-xs text-white/50 px-2 leading-relaxed">
                  We've sent a 6-digit OTP code to:
                  <span className="block font-semibold text-white/90 mt-0.5">{userEmail || "your email"}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} error={error} focused={isOpen && !loading} />

              {error && (
                <div className="flex items-center gap-1.5 justify-center text-xs font-semibold py-1.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[#FF6B6B] mb-4 animate-fade-in">
                  <AlertCircle size={13} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 text-center mt-2">
                <button
                  onClick={() => handleVerify()}
                  disabled={loading || otp.length < 6}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)",
                    boxShadow: "0 8px 24px rgba(20,184,166,0.2)"
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Verification"}
                </button>
                <div className="pt-2">
                  {cooldown > 0 ? (
                    <span className="text-[11px] text-white/30 font-medium">
                      Resend code in <strong className="font-mono text-white/40">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-xs font-semibold text-[#14B8A6] hover:underline active:scale-95 transition-all bg-transparent border-none cursor-pointer"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
