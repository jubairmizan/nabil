import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./SaleOutPrint.module.css";

/**
 * Component for printing sale out reports
 */
const SaleOutPrint = ({ reportData }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef(null);

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date only
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Format time only
  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle print function
  const handlePrint = () => {
    if (!reportData) return;

    setIsPrinting(true);

    try {
      // Create a hidden iframe with proper dimensions
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.top = "-999px";
      printFrame.style.left = "-999px";
      printFrame.style.width = "100%";
      printFrame.style.height = "100%";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      // Set the iframe content
      const printDoc = printFrame.contentWindow.document;
      printDoc.open();
      printDoc.write(`
        <html>
          <head>
            <title>Sale Out Report</title>
            <meta name="color-scheme" content="light">
            <style>
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0;
                padding: 5mm;
                font-size: 12px;
                line-height: 1.3;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-weight: 600;
                background-color: white !important;
              }
              .report-header {
                text-align: center;
                margin-bottom: 12px;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
              }
              .report-header h1 {
                font-size: 22px;
                margin: 0;
                font-weight: 900;
                letter-spacing: 2px;
                color: #000000 !important;
              }
              .report-header h2 {
                font-size: 14px;
                margin: 4px 0;
                font-weight: 900;
                color: #000000 !important;
              }
              .report-header p {
                margin: 3px 0;
                font-size: 12px;
                color: #000000 !important;
                font-weight: 700;
              }
              .report-meta {
                margin: 12px 0;
                font-size: 12px;
                color: #000000 !important;
                font-weight: 600;
                border-radius: 4px;
                padding: 6px;
                background-color: #f9f9f9 !important;
              }
              .report-meta p {
                margin: 4px 0;
                display: flex;
                justify-content: space-between;
              }
              .report-meta .label {
                font-weight: 800;
                min-width: 40px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 12px 0;
              }
              .total-section {
                margin: 12px 0;
                font-weight: 900;
                color: #000000 !important;
                background-color: #f0f0f0 !important;
                border-radius: 4px;
                padding: 6px;
              }
              .total-section p {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
              }
              .total-section .grand-total {
                font-size: 14px;
                font-weight: 900;
                margin-top: 6px;
                padding-top: 6px;
                border-top: 1px solid #000;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                color: #000000 !important;
                font-weight: 600;
              }
              .items-table th {
                text-align: left;
                padding: 5px 2px;
                border-bottom: 1px solid #000;
                font-weight: 900;
                color: #000000 !important;
                background-color: #f0f0f0 !important;
              }
              .items-table th:last-child, .items-table td:last-child {
                text-align: right;
              }
              .items-table td {
                padding: 4px 2px;
                color: #000000 !important;
                border-bottom: 1px dotted #ccc;
              }
              .item-name {
                max-width: 40mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .items-table-footer {
                background-color: #f0f0f0 !important;
                font-weight: 900;
              }
              .items-table-footer td {
                padding: 6px 2px;
                border-bottom: 1px solid #000;
                border-top: 1px solid #000;
              }
              .report-footer {
                text-align: center;
                margin-top: 15px;
                border-top: 1px dashed #000;
                padding-top: 8px;
              }
              .report-footer p {
                margin: 4px 0;
                font-size: 11px;
              }
              .end-mark {
                font-weight: 900;
                margin-top: 8px;
                font-size: 12px;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                color: #000000 !important;
              }
              @media print {
                body {
                  padding: 0;
                  background-color: white !important;
                  color: #000000 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h1>NABIL</h1>
              <h2>HIGHWAY RESTAURANT</h2>
              <p>Chonka,Vobanipur,Sherpur,Bogura</p>
              <p>Mob: 01711-421002</p>
              <h2>SALE OUT REPORT</h2>
            </div>
            
            <div class="report-meta">
              <p><span class="label">Shift:</span> <span>${reportData?.shift?.name || "N/A"}</span></p>
              <p><span class="label">Time:</span> <span>${formatTime(reportData?.shift?.start_time)} - ${formatTime(
        reportData?.shift?.end_time
      )}</span></p>
              <p><span class="label">Date:</span> <span>${formatDate(new Date())}</span></p>
              <p><span class="label">Report:</span> <span>${formatDateTime(reportData?.current_time)}</span></p>
            </div>
            
            <div class="total-section">
              <p><span>Total Orders:</span> <span>${reportData?.totals?.order_count || 0}</span></p>
              <p><span>Total Items:</span> <span>${reportData?.totals?.total_items || 0}</span></p>
              <p class="grand-total"><span>Total Amount:</span> <span>TK. ${formatCurrency(reportData?.totals?.total_amount || 0)}</span></p>
            </div>
            
            <div class="divider"></div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  reportData?.items
                    ?.map(
                      (item) => `
                  <tr>
                    <td class="item-name">${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>TK. ${formatCurrency(item.total_amount)}</td>
                  </tr>
                `
                    )
                    .join("") || '<tr><td colspan="3">No items found</td></tr>'
                }
              </tbody>
              <tfoot>
                <tr class="items-table-footer">
                  <td colspan="2" style="text-align: right;">TOTAL:</td>
                  <td>TK. ${formatCurrency(reportData?.totals?.total_amount || 0)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div class="report-footer">
              <p>Thank you for your business!</p>
              <p>${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p class="end-mark">*** End of Report ***</p>
            </div>
          </body>
        </html>
      `);
      printDoc.close();

      // Add a slight delay to ensure the content is fully loaded
      const printTimeout = setTimeout(() => {
        // Directly call print on the iframe's window
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();

        // Clean up after print dialog is closed or after a timeout
        const cleanup = () => {
          if (printFrame && printFrame.parentNode) {
            document.body.removeChild(printFrame);
          }
          setIsPrinting(false);
        };

        // Listen for afterprint event if supported
        if (printFrame.contentWindow.matchMedia) {
          const mediaQueryList = printFrame.contentWindow.matchMedia("print");
          mediaQueryList.addEventListener("change", (mql) => {
            if (!mql.matches) {
              // Print dialog was closed
              cleanup();
            }
          });
        } else {
          // Fallback for browsers without afterprint support
          setTimeout(cleanup, 5000);
        }
      }, 500);

      // Fallback cleanup in case something goes wrong
      setTimeout(() => {
        setIsPrinting(false);
      }, 10000);
    } catch (error) {
      console.error("Error printing report:", error);
      setIsPrinting(false);
    }
  };

  // Render the print button
  return (
    <button className={styles.printButton} onClick={handlePrint} disabled={isPrinting}>
      <Printer size={16} />
      {isPrinting ? "Printing..." : "Print"}
    </button>
  );
};

export default SaleOutPrint;
