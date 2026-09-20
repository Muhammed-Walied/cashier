import React, { useState, useEffect } from 'react';
import { Shield, Key, Copy, CheckCircle, AlertCircle, Loader2, Phone, XCircle } from 'lucide-react';

interface ActivationScreenProps {
  onActivated: () => void;
  status: 'not_found' | 'invalid' | 'expired' | 'machine_mismatch';
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated, status }) => {
  const [machineId, setMachineId] = useState('');
  const [machineIdFull, setMachineIdFull] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [machineIdLoading, setMachineIdLoading] = useState(true);

  useEffect(() => {
    loadMachineId();
  }, []);

  const loadMachineId = async () => {
    setMachineIdLoading(true);
    try {
      if (window.electronAPI?.getMachineId) {
        const id = await window.electronAPI.getMachineId();
        setMachineId(id);
      } else {
        setMachineId('غير متاح');
      }
      if (window.electronAPI?.getMachineIdFull) {
        const fullId = await window.electronAPI.getMachineIdFull();
        setMachineIdFull(fullId);
      }
    } catch {
      setMachineId('خطأ في القراءة');
    }
    setMachineIdLoading(false);
  };

  const handleCopyMachineId = async () => {
    try {
      // Copy the full hash — this is what the license generator needs
      await navigator.clipboard.writeText(machineIdFull || machineId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback: select text manually
      const el = document.getElementById('machine-id-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = licenseKey.trim();
    if (!trimmedKey) {
      setErrorMsg('برجاء إدخال مفتاح التفعيل');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (window.electronAPI?.activateLicense) {
        const result = await window.electronAPI.activateLicense(trimmedKey);
        if (result.success) {
          setSuccessMsg(result.message);
          setTimeout(() => {
            onActivated();
          }, 1500);
        } else {
          setErrorMsg(result.message);
        }
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع. حاول مرة أخرى.');
    }

    setIsLoading(false);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'expired':
        return {
          icon: <XCircle className="w-4 h-4 flex-shrink-0 text-[#ff9f43]" />,
          text: 'انتهت صلاحية الترخيص. تواصل مع الدعم الفني للتجديد.',
          bgClass: 'bg-[rgba(255,159,67,0.1)] border-[rgba(255,159,67,0.25)] text-[#ffb06b]',
        };
      case 'machine_mismatch':
        return {
          icon: <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b6b]" />,
          text: 'الترخيص مسجّل لجهاز آخر. تواصل مع الدعم الفني.',
          bgClass: 'bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.25)] text-[#ff8a8a]',
        };
      case 'invalid':
        return {
          icon: <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b6b]" />,
          text: 'ملف الترخيص تالف أو غير صالح. أعد التفعيل.',
          bgClass: 'bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.25)] text-[#ff8a8a]',
        };
      default:
        return null;
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4 relative overflow-hidden select-none font-cairo" dir="rtl">
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[160px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -left-24 w-[450px] h-[450px] rounded-full bg-blue-600/12 blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-500/8 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Card with glass effect and gradient border */}
        <div className="bg-[rgba(26,26,46,0.85)] backdrop-blur-2xl p-8 rounded-3xl border border-[rgba(124,58,237,0.2)] shadow-2xl shadow-purple-900/20 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-purple-500/30" />

          {/* Header Icon & Brand */}
          <div className="text-center mb-6">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4 border border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <Shield className="w-9 h-9 text-white stroke-[2.2] relative z-10" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-l from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
              تفعيل البرنامج
            </h1>
            <p className="text-xs text-[#a8a8c8] mt-1.5 font-medium">
              البرنامج يحتاج تفعيل للعمل على هذا الجهاز
            </p>
          </div>

          {/* Status Alert (if expired/mismatch/invalid) */}
          {statusMsg && (
            <div className={`mb-5 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${statusMsg.bgClass}`}>
              {statusMsg.icon}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-[rgba(6,214,160,0.1)] border border-[rgba(6,214,160,0.25)] text-[#34d399] text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#06d6a0]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] text-[#ff8a8a] text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b6b]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Machine ID Section */}
          <div className="mb-5">
            <label className="text-xs font-bold text-[#a8a8c8] block mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              كود الجهاز (أرسله للدعم الفني)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#12101f] border border-[rgba(124,58,237,0.15)] rounded-xl px-4 py-3 text-center font-mono tracking-[0.25em] text-sm text-amber-400 font-bold select-all" dir="ltr">
                {machineIdLoading ? (
                  <span className="text-[#7878a0] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري القراءة...
                  </span>
                ) : (
                  <span id="machine-id-text">{machineId}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyMachineId}
                disabled={machineIdLoading}
                className="p-3 rounded-xl bg-[rgba(34,34,68,0.6)] hover:bg-[rgba(42,42,74,0.8)] border border-[rgba(124,58,237,0.15)] text-[#a8a8c8] hover:text-white transition-all hover:border-purple-500/40 disabled:opacity-40"
                title="نسخ الكود"
              >
                {isCopied ? (
                  <CheckCircle className="w-4 h-4 text-[#06d6a0]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            {isCopied && (
              <p className="text-[10px] text-[#06d6a0] mt-1.5 font-bold text-center">
                ✓ تم نسخ الكود
              </p>
            )}
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                مفتاح التفعيل
              </label>
              <textarea
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="الصق مفتاح التفعيل هنا..."
                rows={3}
                className="w-full bg-[#12101f] border border-[rgba(124,58,237,0.15)] rounded-xl px-4 py-3 text-xs text-[#f0f0ff] font-mono placeholder:text-[#5a5a80] focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all resize-none"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  تم التفعيل بنجاح!
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  تفعيل البرنامج
                </>
              )}
            </button>
          </form>

          {/* Contact Support */}
          <div className="mt-6 pt-5 border-t border-[rgba(124,58,237,0.12)]">
            <div className="text-center">
              <p className="text-[11px] text-[#7878a0] font-semibold flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#06d6a0]" />
                للحصول على مفتاح التفعيل، تواصل مع الدعم الفني
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
