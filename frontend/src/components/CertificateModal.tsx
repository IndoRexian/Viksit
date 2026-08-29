import React, { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  Download,
  Printer,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";

export interface CertificateDetails {
  certificateId: string;
  officerName: string;
  officerDesignation: string;
  officerDepartment: string;
  cadreId?: string;
  courseName: string;
  badgeName?: string;
  completedAt: string | Date;
  elevatedCompetencies?: Array<{
    name: string;
    code?: string;
    newLevel: number;
  }>;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CertificateDetails | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  details,
}) => {
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRendered, setIsRendered] = useState<boolean>(isOpen);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Responsive scale calculation to fit certificate completely on mobile / smaller viewports
  const updateScale = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const paddingX = window.innerWidth < 640 ? 16 : 48;
    const paddingY = window.innerWidth < 640 ? 16 : 48;
    const availableWidth = container.clientWidth - paddingX;
    const availableHeight = container.clientHeight - paddingY;

    const scaleW = availableWidth > 0 ? availableWidth / 820 : 1;
    const scaleH = availableHeight > 0 ? availableHeight / 580 : 1;

    // Fit within both width and height, cap at 1.0 (never over-scale)
    const newScale = Math.min(1, Math.max(0.2, Math.min(scaleW, scaleH)));
    setScale(newScale);
  };

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsAnimating(false);
      // Ensure initial unmounted state is rendered in DOM first
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 25);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updateScale();
    const raf = requestAnimationFrame(updateScale);
    const timer1 = setTimeout(updateScale, 50);
    const timer2 = setTimeout(updateScale, 250);

    const handleResize = () => updateScale();
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [isOpen, isAnimating]);

  if (!isRendered || !details) return null;

  const formattedDate = new Date(details.completedAt).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  // Direct High-Resolution Download (Guaranteed A4 Landscape on Mobile & Desktop)
  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(certRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Crisp 300+ DPI Retina rendering
        quality: 1,
        backgroundColor: "#fffdf7",
        width: 820,
        height: 580,
        style: {
          transform: "none",
          transformOrigin: "top left",
          left: "0",
          top: "0",
        },
      });

      const link = document.createElement("a");
      link.download = `MoSPI_Certificate_${details.certificateId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(
        "Direct image export error, falling back to print dialog:",
        err,
      );
      handlePrint();
    } finally {
      setIsExporting(false);
    }
  };

  // Dedicated A4 Landscape Print Engine
  const handlePrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const nsstaLogoUrl = window.location.origin + "/NSSTA.png";

    const elevationsHtml =
      details.elevatedCompetencies && details.elevatedCompetencies.length > 0
        ? `
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px;">
          <span style="font-family: ui-monospace, monospace; font-size: 11px; color: #64748b; text-transform: uppercase;">FRAC Elevation:</span>
          ${details.elevatedCompetencies
            .map(
              (c) => `
            <span style="background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; font-family: ui-monospace, monospace; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px;">
              ${c.name} (Level ${c.newLevel})
            </span>
          `,
            )
            .join("")}
        </div>
      `
        : "";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MoSPI_Certificate_${details.certificateId}</title>
          <style>
            @page {
              size: 297mm 210mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 297mm;
              height: 210mm;
              background: #ffffff;
              font-family: Georgia, 'Times New Roman', serif;
              overflow: hidden;
            }
            .page-container {
              width: 297mm;
              height: 210mm;
              padding: 8mm;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .cert-card {
              width: 100%;
              height: 100%;
              background: #fffdf7;
              border: 5px double #1e3a8a;
              padding: 22px 36px;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              overflow: hidden;
            }
            .corner {
              position: absolute;
              width: 24px;
              height: 24px;
            }
            .c-tl { top: 5px; left: 5px; border-top: 2.5px solid #d97706; border-left: 2.5px solid #d97706; }
            .c-tr { top: 5px; right: 5px; border-top: 2.5px solid #d97706; border-right: 2.5px solid #d97706; }
            .c-bl { bottom: 5px; left: 5px; border-bottom: 2.5px solid #d97706; border-left: 2.5px solid #d97706; }
            .c-br { bottom: 5px; right: 5px; border-bottom: 2.5px solid #d97706; border-right: 2.5px solid #d97706; }
            
            .watermark-container {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.08;
              pointer-events: none;
              z-index: 0;
            }
            .watermark-img {
              width: 240px;
              height: auto;
              filter: grayscale(100%);
            }

            .header-block {
              text-align: center;
              border-bottom: 2px solid rgba(217, 119, 6, 0.4);
              padding-bottom: 8px;
              position: relative;
              z-index: 1;
            }
            .sub-emblem {
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.25em;
              color: #334155;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .ministry-title {
              font-size: 19px;
              font-weight: bold;
              text-transform: uppercase;
              color: #1e3a8a;
              letter-spacing: 0.02em;
              margin: 3px 0;
            }
            .sub-title {
              font-size: 12px;
              color: #475569;
              margin: 0;
            }
            .cert-pill {
              display: inline-block;
              background: #fef3c7;
              border: 1px solid #f59e0b;
              color: #78350f;
              font-size: 10.5px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              padding: 2.5px 14px;
              border-radius: 2px;
              margin-top: 6px;
            }

            .body-block {
              text-align: center;
              padding: 6px 20px;
              position: relative;
              z-index: 1;
            }
            .intro-text {
              font-style: italic;
              font-size: 13px;
              color: #64748b;
              margin: 0 0 3px 0;
            }
            .officer-name {
              font-size: 25px;
              font-weight: 800;
              color: #1e3a8a;
              margin: 3px 0;
              letter-spacing: -0.01em;
            }
            .officer-meta {
              font-size: 12.5px;
              color: #334155;
              font-weight: 500;
              margin: 0 0 8px 0;
            }
            .fulfill-text {
              font-size: 11px;
              color: #475569;
              max-width: 650px;
              margin: 0 auto 8px auto;
              line-height: 1.4;
            }
            .course-box {
              background: #fefce8;
              border: 1px solid #fef08a;
              border-radius: 4px;
              padding: 6px 16px;
              max-width: 540px;
              margin: 0 auto;
            }
            .course-title {
              font-size: 14.5px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0;
            }
            .badge-title {
              font-family: ui-monospace, monospace;
              font-size: 10.5px;
              color: #854d0e;
              font-weight: 600;
              margin-top: 2px;
            }

            .footer-block {
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: relative;
              z-index: 1;
            }
            .cert-id-block {
              text-align: left;
            }
            .verified-tag {
              color: #065f46;
              font-size: 10.5px;
              font-weight: bold;
              font-family: ui-monospace, monospace;
            }
            .cert-id-text {
              font-family: ui-monospace, monospace;
              font-size: 10px;
              color: #1e293b;
              font-weight: bold;
              margin-top: 2px;
            }
            .date-text {
              font-family: ui-monospace, monospace;
              font-size: 9.5px;
              color: #64748b;
              margin-top: 1px;
            }

            .seal-wrapper {
              text-align: center;
            }
            .seal-circle {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: radial-gradient(circle, #fef3c7, #fde68a);
              border: 2px solid #d97706;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              padding: 3px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .seal-img {
              width: 32px;
              height: 32px;
              object-fit: contain;
            }
            .seal-label {
              font-family: ui-monospace, monospace;
              font-size: 8px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #78350f;
              margin-top: 3px;
            }

            .sig-block {
              text-align: right;
              width: 220px;
            }
            .sig-title {
              font-size: 11.5px;
              font-weight: bold;
              color: #0f172a;
              border-bottom: 1px solid #94a3b8;
              padding-bottom: 2px;
            }
            .sig-dept {
              font-size: 9.5px;
              color: #475569;
              margin: 2px 0 0 0;
            }
            .sig-sub {
              font-family: ui-monospace, monospace;
              font-size: 8.5px;
              color: #64748b;
              margin: 1px 0 0 0;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="cert-card">
              <!-- Watermark -->
              <div class="watermark-container">
                <img src="${nsstaLogoUrl}" alt="NSSTA Watermark" class="watermark-img" />
              </div>

              <!-- Corners -->
              <div class="corner c-tl"></div>
              <div class="corner c-tr"></div>
              <div class="corner c-bl"></div>
              <div class="corner c-br"></div>

              <!-- Header -->
              <div class="header-block">
                <div class="sub-emblem">GOVERNMENT OF INDIA • भारत सरकार</div>
                <div class="ministry-title">MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION</div>
                <div class="sub-title">National Statistical Systems Training Academy (NSSTA) • iGOT Karmayogi Framework</div>
                <div>
                  <span class="cert-pill">CERTIFICATE OF COMPETENCY FULFILLMENT & PROFESSIONAL MASTERY</span>
                </div>
              </div>

              <!-- Body -->
              <div class="body-block">
                <div class="intro-text">This is to officially certify that</div>
                <div class="officer-name">${details.officerName}</div>
                <div class="officer-meta">
                  <strong>${details.officerDesignation}</strong> • ${details.officerDepartment}
                  ${details.cadreId ? `(@${details.cadreId})` : ""}
                </div>

                <div class="fulfill-text">
                  has successfully fulfilled all prescribed curriculum standards, applied rigorous statistical protocols, and achieved competency elevation in the accredited program:
                </div>

                <div class="course-box">
                  <div class="course-title">${details.courseName}</div>
                  ${details.badgeName ? `<div class="badge-title">Accredited Badge: ${details.badgeName}</div>` : ""}
                </div>

                ${elevationsHtml}
              </div>

              <!-- Footer -->
              <div class="footer-block">
                <div class="cert-id-block">
                  <div class="verified-tag">&#10003; Verified MoSPI Digital Credential</div>
                  <div class="cert-id-text">Certificate ID: ${details.certificateId}</div>
                  <div class="date-text">Date of Issue: ${formattedDate}</div>
                </div>

                <div class="seal-wrapper">
                  <div class="seal-circle">
                    <img src="${nsstaLogoUrl}" alt="NSSTA Logo" class="seal-img" />
                  </div>
                  <div class="seal-label">NSSTA CERTIFIED</div>
                </div>

                <div class="sig-block">
                  <div class="sig-title">Director General</div>
                  <div class="sig-dept">National Statistical Systems Training Academy (NSSTA)</div>
                  <div class="sig-sub">Ministry of Statistics & Programme Implementation</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 350);
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 transition-all duration-300 ease-out ${
        isAnimating
          ? "bg-slate-950/80 backdrop-blur-xs opacity-100"
          : "bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[95vh] transition-all duration-300 ease-out transform ${
          isAnimating
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-4"
        }`}
      >
        {/* Modal Top Control Bar */}
        <div className="bg-slate-950 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between text-white shrink-0 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <ShieldCheck size={16} className="text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-200 truncate">
              <span className="sm:hidden">MoSPI Certificate</span>
              <span className="hidden sm:inline">
                MoSPI • iGOT Karmayogi Certificate
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Primary Direct Download Button (Mobile Icon / Desktop Text) */}
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="p-2 sm:px-3 sm:py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50 shrink-0"
              title="Download High-Resolution Landscape Certificate (PNG/Image)"
              aria-label="Download Certificate"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin shrink-0" />
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={14} className="shrink-0" />
                  <span className="hidden sm:inline">Download Certificate</span>
                </>
              )}
            </button>

            {/* Print / PDF Engine Button (Mobile Icon / Desktop Text) */}
            <button
              onClick={handlePrint}
              className="p-2 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
              title="Print to Physical Printer / System PDF"
              aria-label="Print or Save as PDF"
            >
              <Printer size={14} className="shrink-0" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Close"
              aria-label="Close Certificate Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Responsive Landscape Canvas Container */}
        <div
          ref={containerRef}
          className="p-2 sm:p-6 bg-slate-200 flex-1 overflow-auto flex items-center justify-center min-h-[220px]"
        >
          {/* Scaled Bounding Box */}
          <div
            style={{
              width: `${Math.round(820 * scale)}px`,
              height: `${Math.round(580 * scale)}px`,
            }}
            className="relative shrink-0 flex items-center justify-center transition-all duration-100"
          >
            {/* THE CERTIFICATE CANVAS (Strict Fixed Landscape Aspect Ratio) */}
            <div
              id="sovereign-certificate-preview"
              ref={certRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              className="w-[820px] min-w-[820px] h-[580px] min-h-[580px] bg-[#fffdf7] text-slate-900 border-8 border-double border-blue-950 p-6 sm:p-8 rounded-sm shadow-xl absolute top-0 left-0 overflow-hidden flex flex-col justify-between shrink-0 box-border select-none"
            >
              {/* Corner Ornamental Accents */}
              <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

              {/* Sovereign NSSTA Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none">
                <img
                  src="/NSSTA.png"
                  alt="NSSTA Watermark"
                  className="w-56 h-auto grayscale opacity-80 pointer-events-none"
                />
              </div>

              {/* Header: National Emblem & Authorities */}
              <div className="text-center space-y-1 border-b-2 border-amber-600/60 pb-3 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-700 font-bold">
                    Government of India • भारत सरकार
                  </span>
                </div>

                <h1 className="font-serif text-lg font-bold tracking-tight text-blue-950 uppercase">
                  Ministry of Statistics and Programme Implementation
                </h1>
                <p className="text-[11px] font-serif text-slate-700">
                  National Statistical Systems Training Academy (NSSTA) • iGOT
                  Karmayogi Framework
                </p>

                <div className="pt-1.5">
                  <span className="inline-block px-4 py-0.5 bg-amber-100/80 border border-amber-400 text-amber-950 font-serif font-bold text-xs uppercase tracking-widest rounded-xs shadow-2xs">
                    Certificate of Competency Fulfillment & Professional Mastery
                  </span>
                </div>
              </div>

              {/* Body: Recipient & Course Details */}
              <div className="text-center py-2 space-y-2 relative z-10">
                <p className="font-serif italic text-xs text-slate-600">
                  This is to officially certify that
                </p>

                <div className="space-y-0.5">
                  <h2 className="font-serif text-2xl font-extrabold text-blue-950 tracking-tight border-b border-dashed border-slate-300 pb-1 max-w-lg mx-auto">
                    {details.officerName}
                  </h2>
                  <p className="text-xs font-medium text-slate-700">
                    <span className="font-semibold">
                      {details.officerDesignation}
                    </span>{" "}
                    • {details.officerDepartment}
                    {details.cadreId && (
                      <span className="font-mono text-slate-500 ml-1">
                        (@{details.cadreId})
                      </span>
                    )}
                  </p>
                </div>

                <p className="font-serif text-[11px] text-slate-600 max-w-xl mx-auto leading-relaxed pt-1">
                  has successfully fulfilled all prescribed curriculum
                  standards, applied rigorous statistical protocols, and
                  achieved competency elevation in the accredited program:
                </p>

                <div className="bg-amber-50/70 border border-amber-300/80 rounded py-2 px-4 max-w-lg mx-auto shadow-2xs">
                  <h3 className="font-serif text-sm font-bold text-blue-950">
                    {details.courseName}
                  </h3>
                  {details.badgeName && (
                    <span className="text-[11px] font-mono text-amber-900 font-semibold block">
                      Accredited Badge: {details.badgeName}
                    </span>
                  )}
                </div>

                {details.elevatedCompetencies &&
                  details.elevatedCompetencies.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        FRAC Elevation:
                      </span>
                      {details.elevatedCompetencies.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-[10px] font-bold rounded"
                        >
                          {c.name} (Level {c.newLevel})
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              {/* Footer: Signatures & Sovereign Verification Seal */}
              <div className="border-t border-slate-300 pt-3 flex items-center justify-between gap-4 relative z-10">
                {/* Left: Certificate ID & Date */}
                <div className="text-left space-y-0.5">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold font-mono">
                    <CheckCircle2 size={13} />
                    <span>Verified MoSPI Digital Credential</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    <span>Certificate ID: </span>
                    <span className="font-bold text-slate-900 select-all">
                      {details.certificateId}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Date of Issue: {formattedDate}
                  </div>
                </div>

                {/* Center: NSSTA Certified Seal Medal */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-radial from-amber-100 via-amber-200 to-amber-300 border-2 border-amber-500 shadow-md flex items-center justify-center p-1">
                    <img
                      src="/NSSTA.png"
                      alt="NSSTA Seal"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-amber-900 mt-0.5">
                    NSSTA Certified
                  </span>
                </div>

                {/* Right: Authorized Signatures */}
                <div className="text-right space-y-0.5 w-56">
                  <div className="font-serif text-xs font-bold text-slate-900 border-b border-slate-400 pb-0.5">
                    Director General
                  </div>
                  <p className="text-[10px] font-serif text-slate-600">
                    National Statistical Systems Training Academy (NSSTA)
                  </p>
                  <p className="text-[9px] font-mono text-slate-500">
                    Ministry of Statistics & Programme Implementation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
