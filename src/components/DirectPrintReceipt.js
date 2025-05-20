import { Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import styles from "./DirectPrintReceipt.module.css";

const DirectPrintReceipt = ({ sale, onPrintComplete, autoPrint = false }) => {
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const printAttempted = useRef(false);
  const printProcessRef = useRef(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getReceiptHTML = (withPrintScript = false) => {
    const scriptBlock = withPrintScript
      ? `<script>
          let printHandled = false;
          function handlePrint() {
            if (printHandled) return;
            printHandled = true;
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          }
          window.onload = handlePrint;
        </script>`
      : "";

    const orderNumber = sale.order_number || "N/A";
    const currentTime = formatTime(sale.created_at);

    return `<!DOCTYPE html><html><head><meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: http: https://nabil-backend-dev.projectsample.info http://localhost:8000 https://nabil-dev.old19.com ws://localhost:8181 ws://localhost:8182 ws://localhost:8282; img-src 'self' data:; style-src 'self' 'unsafe-inline';" /><title>Receipt #${orderNumber}</title><style>@page { size: 80mm 297mm; margin: 0; } body { width: 80mm; margin: 0; padding: 5px; font-family: 'Courier New', monospace; font-size: 12px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: 600; } .receipt-header h1 { font-size: 16px; font-weight: 900; margin: 0; } .receipt-header h2 { font-size: 14px; font-weight: 900; margin: 0; } .receipt-header p, .receipt-footer p, .summary-row, .payment-row, .total-row, .clerk-info { font-weight: 700; margin: 1px 0; } .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; } .receipt-table th, .receipt-table td { font-weight: 600; padding: 1px 0; } .receipt-table .price-col { text-align: right; padding-right: 5px; } .receipt-table .qty-col { text-align: center; } .receipt-table .amt-col { text-align: right; } .receipt-divider { border-top: 1.5px dashed black; margin: 8px 0; } .summary-row, .total-row, .payment-row { display: flex; justify-content: space-between; } .total-row { font-size: 16px; font-weight: 900; border-top: 1px solid #000; padding-top: 3px; } .thank-you { font-size: 14px; font-weight: 900; margin-top: 2px; }</style>${scriptBlock}</head><body><div class="receipt-header"><h1>NABIL</h1><h2>HIGHWAY RESTAURANT</h2><p>Sonka,Vobanipur,Sherpur,Bogura</p><p>BIN: 006971563-1106 Mushak:6.3</p><p>Mob: 01325-060388</p><p>DATE:${formatDate(sale.created_at)}</p><p>Biller: ${sale.user ? sale.user.name : "N/A"}</p></div><table class="receipt-table"><thead><tr><th>NAME</th><th class="price-col">PRICE</th><th class="qty-col">QTY</th><th class="amt-col">AMT</th></tr></thead><tbody>${sale.items.map((item) => `<tr><td>${item.name}</td><td class="price-col">${parseFloat(item.price).toFixed(2)}</td><td class="qty-col">${item.quantity}</td><td class="amt-col">TK.${parseFloat(item.subtotal).toFixed(2)}</td></tr>`).join("")}</tbody></table><div class="receipt-divider"></div><div class="receipt-summary"><div class="summary-row"><span>TTL.SALE.A</span><span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span></div><div class="summary-row"><span>VAT A 0.00%</span><span>TK.0.00</span></div><div class="summary-row"><span>VAT TOTAL</span><span>TK.0.00</span></div><div class="total-row"><span>TOTAL</span><span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span></div><div class="payment-row"><span>${sale.payment_method.toUpperCase()}</span><span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span></div></div><div class="receipt-footer"><div class="clerk-info"><span>${sale.order_number || "N/A"}</span><span>${currentTime}</span></div><p class="thank-you">THANK YOU</p></div></body></html>`;
  };

  const printReceiptWithQZTray = async () => {
    const htmlContent = getReceiptHTML(false);
  
    if (!window.qz) {
      alert("QZ Tray is not available.");
      finishPrint();
      return;
    }
  
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
  
      qz.security.setCertificatePromise(() =>
        Promise.resolve("-----BEGIN CERTIFICATE-----\nTEST CERT\n-----END CERTIFICATE-----")
      );
      qz.security.setSignaturePromise(() => Promise.resolve());
  
      const config = qz.configs.create("RONGTA RP330", {
        encoding: "UTF-8",
        rasterize: true,
        scaleContent: true,
        density: 203,
        copies: 1,
      });
  
      await qz.print(config, [{ type: "html", format: "plain", data: htmlContent }]);
      await qz.websocket.disconnect();
      finishPrint();
    } catch (error) {
      console.error("QZ Tray printing failed", error);
      alert("Failed to connect or print via QZ Tray.");
      finishPrint();
    }
  };
  

  const finishPrint = () => {
    if (!hasPrinted) {
      setIsGeneratingPrint(false);
      setHasPrinted(true);
      printProcessRef.current = false;
      if (onPrintComplete) onPrintComplete();
    }
  };

  const printReceipt = () => {
    if (hasPrinted || printAttempted.current || printProcessRef.current) return;
    printAttempted.current = true;
    printProcessRef.current = true;
    setIsGeneratingPrint(true);
    printReceiptWithQZTray();
  };

  useEffect(() => {
    if (autoPrint && sale && !hasPrinted && !printAttempted.current && !printProcessRef.current) {
      const timeoutId = setTimeout(() => printReceipt(), 300);
      const failsafeId = setTimeout(() => {
        if (!hasPrinted && onPrintComplete) {
          console.log("Failsafe triggered");
          setHasPrinted(true);
          printProcessRef.current = false;
          onPrintComplete();
        }
      }, 8000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(failsafeId);
      };
    }
  }, [sale, autoPrint, hasPrinted]);

  useEffect(() => {
    return () => {
      if ((isGeneratingPrint || printAttempted.current) && !hasPrinted && onPrintComplete) {
        console.log("Component unmounted during print");
        onPrintComplete();
      }
    };
  }, [isGeneratingPrint, hasPrinted, onPrintComplete]);


  useEffect(() => {
    const loadScripts = async () => {
      const loadScript = (src) =>
        new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
  
      try {
        await loadScript("/rsvp.min.js");
        console.log("✅ RSVP loaded");
  
        await loadScript("/qz-tray.js");
        console.log("✅ QZ Tray script loaded");
  
        if (window.qz) {
          console.log("🎉 QZ is ready to use", window.qz.version);
        }
      } catch (err) {
        console.error("❌ Failed to load scripts:", err);
      }
    };
  
    loadScripts();
  }, []);
  
  const handlePrintClick = () => {
    if (!hasPrinted && !printAttempted.current && !printProcessRef.current) {
      printReceipt();
    }
  };

  const getReceiptPreview = () => {
    if (!sale) return "";
    const formattedDate = formatDate(sale.created_at);
    const orderNumber = sale.order_number || "N/A";
    const currentTime = formatTime(sale.created_at);
    const billerName = sale.user ? sale.user.name : "N/A";
    return `<div><h1>NABIL</h1><h2>HIGHWAY RESTAURANT</h2><p>${formattedDate}</p><p>Biller: ${billerName}</p><p>Order: ${orderNumber}</p><p>Time: ${currentTime}</p></div>`;
  };

  return (
    <>
      {/* <Script
  src="/qz-tray.js"
  onLoad={() => console.log("✅ Local QZ Tray script loaded")}
  onError={(e) => console.error("❌ Failed to load local QZ Tray", e)}
/> */}

      <div className={styles.directPrintContainer}>
        {!autoPrint && (
          <div className={styles.receiptPreviewWrapper}>
            <div
              className={styles.receiptPreview}
              dangerouslySetInnerHTML={{ __html: getReceiptPreview() }}
            />
          </div>
        )}
        <button
          onClick={handlePrintClick}
          className={styles.printButton}
          disabled={isGeneratingPrint || hasPrinted || printAttempted.current}
        >
          <Printer size={16} />
          {isGeneratingPrint ? "Printing..." : hasPrinted ? "Receipt Printed" : "Print Receipt"}
        </button>
      </div>
    </>
  );
};

export default DirectPrintReceipt;
