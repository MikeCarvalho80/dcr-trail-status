import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCodeIcon, XIcon, CopyIcon, Share2Icon } from 'lucide-react';

export function ShareQR() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MTB Trail Status', url });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2 rounded-lg border bg-bg-secondary text-text-secondary border-bg-elevated hover:text-text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30"
        aria-label="Share app via QR code"
      >
        <QrCodeIcon className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-elevated rounded-xl p-6 mx-4 max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[14px] font-bold text-text-primary">Share MTB Trail Status</h2>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 flex justify-center mb-4">
              <QRCodeSVG
                value={url}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="font-mono text-[11px] text-text-muted text-center mb-4 break-all">
              {url.length > 60 ? url.slice(0, 60) + '...' : url}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2 rounded-lg border border-bg-elevated text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                <CopyIcon className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2 rounded-lg bg-text-primary text-bg-primary transition-colors duration-200"
              >
                <Share2Icon className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
