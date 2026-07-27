"use client";

import { useState } from "react";

const CRISIS_LINES = [
  { name: "全国心理援助热线", phone: "400-161-9995", hours: "24 小时" },
  { name: "北京心理危机研究与干预中心", phone: "010-82951332", hours: "24 小时" },
  { name: "希望 24 热线", phone: "400-161-9995", hours: "24 小时" },
  { name: "青少年心理援助热线", phone: "12355", hours: "9:00-22:00" },
];

export function SOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-20 z-50 w-12 h-12 rounded-full bg-red-500/90 text-white text-lg shadow-lg hover:bg-red-500 transition-all animate-[sosPulse_2s_ease-in-out_infinite] flex items-center justify-center"
        aria-label="心理援助热线"
      >
        🆘
      </button>

      {/* Crisis modal */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-sm w-full mx-4 bg-[#0a0a14] border border-red-500/30 rounded-2xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="text-3xl mb-2">🆘</div>
              <h2 className="text-base font-bold text-white tracking-wide">你需要帮助吗？</h2>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                如果你或你身边的人正在经历困境，以下资源可以提供帮助
              </p>
            </div>

            <div className="space-y-3">
              {CRISIS_LINES.map((line) => (
                <a
                  key={line.name}
                  href={`tel:${line.phone}`}
                  className="block bg-white/5 border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{line.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">{line.hours}</p>
                    </div>
                    <span className="text-lg font-bold text-red-400">{line.phone}</span>
                  </div>
                </a>
              ))}
            </div>

            <p className="text-[11px] text-white/30 text-center mt-5 leading-relaxed">
              知几不提供心理咨询或医疗诊断。如果你正处在危机中，请立即拨打上面的电话。
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sosPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </>
  );
}
