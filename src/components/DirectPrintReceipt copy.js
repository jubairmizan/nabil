import { Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./DirectPrintReceipt.module.css";

/**
 * A receipt printing component that can either display a preview or auto-print
 * @param {Object} props
 * @param {Object} props.sale - The sale data
 * @param {Function} props.onPrintComplete - Callback after printing completes
 * @param {boolean} props.autoPrint - Whether to automatically print the receipt without showing preview
 */
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

  // Generate HTML receipt content
  const getReceiptHTML = (withPrintScript = false) => {
    // Windows-friendly print script that properly closes window
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

    // Use the order number from the sale object
    const orderNumber = sale.order_number || "N/A";
    const currentTime = formatTime(sale.created_at);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${orderNumber}</title>
        <style>
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          body {
            width: 80mm;
            margin: 0;
            padding: 5px;
            font-family: "Courier New", monospace;
            text-align: center;
            font-size: 12px;
            line-height: 1.2;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 600;
          }
          .receipt-header {
            margin-bottom: 5px;
            text-align: center;
          }
          .receipt-header h1 {
            font-size: 16px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 2px;
            color: #000000 !important;
          }
          .receipt-header h2 {
            font-size: 14px;
            font-weight: 900;
            margin: 0;
            color: #000000 !important;
          }
          .receipt-header p {
            margin: 1px 0;
            font-size: 12px;
            color: #000000 !important;
            font-weight: 700;
          }
          .non-fiscal {
            margin: 2px 0;
            font-weight: 900;
            color: #000000 !important;
          }
          .receipt-table {
            width: 100%;
            font-size: 12px;
            text-align: left;
            margin-bottom: 5px;
            border-collapse: collapse;
            color: #000000 !important;
            font-weight: 600;
          }
          .receipt-table th {
            text-align: left;
            font-weight: 900;
            padding: 2px 0;
            color: #000000 !important;
            border-bottom: 1px solid #000000;
          }
          .receipt-table .price-col {
            text-align: right;
            padding-right: 5px;
            font-weight: 700;
          }
          .receipt-table .qty-col {
            text-align: center;
            padding: 0 5px;
            font-weight: 700;
          }
          .receipt-table .amt-col {
            text-align: right;
            font-weight: 700;
          }
          .receipt-table td {
            padding: 1px 0;
            color: #000000 !important;
            font-weight: 600;
          }
          .receipt-divider {
            border-top: 1.5px dashed black;
            margin: 8px 0;
          }
          .receipt-summary {
            text-align: left;
            margin-bottom: 10px;
            color: #000000 !important;
            font-weight: 600;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            color: #000000 !important;
            font-weight: 700;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 900;
            margin: 5px 0;
            color: #000000 !important;
            border-top: 1px solid #000000;
            padding-top: 3px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            color: #000000 !important;
            font-weight: 700;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 5px;
            color: #000000 !important;
            font-weight: 600;
          }
          .receipt-footer .non-fiscal {
            font-weight: 900;
            color: #000000 !important;
          }
          .receipt-footer p {
            margin: 1px 0;
            color: #000000 !important;
            font-weight: 700;
          }
          .clerk-info {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            color: #000000 !important;
            font-weight: 700;
          }
          .vat-included {
            font-weight: 900;
            color: #000000 !important;
          }
          .thank-you {
            text-align: center;
            margin-top: 2px;
            color: #000000 !important;
            font-weight: 900;
            font-size: 14px;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color: #000000 !important;
          }
          @media print {
            body {
              color: #000000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: 700;
            }
            .receipt-table th,
            .receipt-table td,
            .receipt-header h1,
            .receipt-header h2,
            .receipt-header p,
            .non-fiscal,
            .summary-row,
            .total-row,
            .payment-row,
            .clerk-info,
            .thank-you,
            .vat-included {
              color: #000000 !important;
            }
          }
        </style>
        <meta name="color-scheme" content="light">
      </head>
      <body style="color: #000000 !important; background-color: white !important;">
        <div class="receipt-header">
          <h1>NABIL</h1>
          <h2>HIGHWAY RESTAURANT</h2>
          <p>Sonka,Vobanipur,Sherpur,Bogura</p>
          <p>BIN: 006971563-1106    Mushak:6.3</p>
          <p>Mob: 01325-060388</p>
          <p>DATE:${formatDate(sale.created_at)}</p>
          <p>Biller: ${sale.user ? sale.user.name : "N/A"}</p>
          
        </div>
        
        <table class="receipt-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th class="price-col">PRICE</th>
              <th class="qty-col">QTY</th>
              <th class="amt-col">AMT</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td class="price-col">${parseFloat(item.price).toFixed(2)}</td>
                <td class="qty-col">${item.quantity}</td>
                <td class="amt-col">TK.${parseFloat(item.subtotal).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="receipt-divider"></div>
        
        <div class="receipt-summary">
          <div class="summary-row">
            <span>TTL.SALE.A</span>
            <span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>VAT A 0.00%</span>
            <span>TK.0.00</span>
          </div>
          <div class="summary-row">
            <span>VAT TOTAL</span>
            <span>TK.0.00</span>
          </div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span>
          </div>
          <div class="payment-row">
            <span>${sale.payment_method.toUpperCase()}</span>
            <span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="receipt-footer">
          <div class="clerk-info">
            <span>${sale.order_number || "N/A"}</span>
            <span>${currentTime}</span>
          </div>
          <p class="vat-included">VAT INCLUDED</p>
          <p class="thank-you">THANK YOU</p>
        </div>
        
        ${scriptBlock}
      </body>
      </html>
    `;
  };

  // Simplified print method that works on both Mac and Windows
  const printReceipt = () => {
    if (hasPrinted || printAttempted.current || printProcessRef.current) {
      return;
    }

    printAttempted.current = true;
    printProcessRef.current = true;
    setIsGeneratingPrint(true);

    try {
      const receiptHTML = getReceiptHTML(true);
      const printWindow = window.open("", "_blank", "width=400,height=600");

      if (!printWindow) {
        alert("Please allow pop-ups to print receipts.");
        finishPrint();
        return;
      }

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Finish print process after either timeout or window close
      const timeoutId = setTimeout(finishPrint, 5000);

      printWindow.onafterprint = () => {
        clearTimeout(timeoutId);
        finishPrint();
      };

      printWindow.onunload = () => {
        clearTimeout(timeoutId);
        finishPrint();
      };
    } catch (error) {
      console.error("Error printing receipt:", error);
      finishPrint();
    }
  };

  // Helper function to clean up after printing
  const finishPrint = () => {
    if (!hasPrinted) {
      setIsGeneratingPrint(false);
      setHasPrinted(true);
      printProcessRef.current = false;
      if (onPrintComplete) {
        onPrintComplete();
      }
    }
  };

  // Auto-print when component mounts if autoPrint is true
  useEffect(() => {
    let timeoutId = null;

    if (autoPrint && sale && !hasPrinted && !printAttempted.current && !printProcessRef.current) {
      // Small delay to ensure component is fully mounted
      timeoutId = setTimeout(() => {
        printReceipt();
      }, 300);

      // Ultimate failsafe - if nothing happens in 8 seconds, call onPrintComplete
      const failsafeId = setTimeout(() => {
        if (!hasPrinted && onPrintComplete) {
          console.log("Print failsafe triggered");
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

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sale, autoPrint, hasPrinted]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      // If component is unmounted during printing, call onPrintComplete
      if ((isGeneratingPrint || printAttempted.current) && !hasPrinted && onPrintComplete) {
        console.log("Component unmounted during print process");
        onPrintComplete();
      }
    };
  }, [isGeneratingPrint, hasPrinted, onPrintComplete]);

  // Handle manual print button click
  const handlePrintClick = () => {
    if (!hasPrinted && !printAttempted.current && !printProcessRef.current) {
      printReceipt();
    }
  };

  // Generate a simplified receipt preview for the modal
  const getReceiptPreview = () => {
    if (!sale) return "";

    // Format date in DD/MM/YYYY format
    const formattedDate = formatDate(sale.created_at);
    const orderNumber = sale.order_number || "N/A";
    const currentTime = formatTime(sale.created_at);
    const billerName = sale.user ? sale.user.name : "N/A";
    const billerSection = sale.user && sale.user.assigned_section ? `(${sale.user.assigned_section})` : "";

    return `
      <div class="receipt-header">
        <h1>NABIL</h1>
        <h2>HIGHWAY RESTAURANT</h2>
        <p>Sonka,Vobanipur,Sherpur,Bogura</p>
        <p>BIN: 006971563-1106    Mushak:6.3</p>
        <p>Mob: 01325-060388</p>
        <p>DATE: ${formattedDate}</p>
        <p>Biller: ${billerName}</p>
      </div>
      
      <div class="receipt-items">
        ${sale.items
          .map(
            (item) => `
          <div class="item-row">
            <span class="item-name">${item.name}</span>
            <div class="item-details">
              <span class="item-price">${parseFloat(item.price).toFixed(2)} × ${item.quantity}</span>
              <span class="item-total">TK.${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div class="receipt-total">
        <div class="total-row">
          <span>TOTAL</span>
          <span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span>
        </div>
        <div class="payment-row">
          <span>${sale.payment_method.toUpperCase()}</span>
          <span>TK.${parseFloat(sale.total_amount).toFixed(2)}</span>
        </div>
        <div class="clerk-info">
          <span>ORDER #${sale.order_number || "N/A"}</span>
          <span>${currentTime}</span>
        </div>
      </div>
    `;
  };

  return (
    <div className={styles.directPrintContainer}>
      {!autoPrint && (
        <div className={styles.receiptPreviewWrapper}>
          <div
            className={styles.receiptPreview}
            dangerouslySetInnerHTML={{
              __html: getReceiptPreview(),
            }}
          />
        </div>
      )}

      <button onClick={handlePrintClick} className={styles.printButton} disabled={isGeneratingPrint || hasPrinted || printAttempted.current}>
        <Printer size={16} />
        {isGeneratingPrint ? "Printing..." : hasPrinted ? "Receipt Printed" : "Print Receipt"}
      </button>
    </div>
  );
};

export default DirectPrintReceipt;
