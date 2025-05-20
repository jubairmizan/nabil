import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./ShiftSummaryReport.module.css";

/**
 * Component to display and print a shift summary report for billing_counter users
 */
const ShiftSummaryReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
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

  // Fetch the shift summary report from the API
  useEffect(() => {
    const fetchShiftSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("User not authenticated");
        }

        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/api/shift-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Error fetching shift summary:", error);
        setError(error.message || "Failed to load shift summary");
      } finally {
        setLoading(false);
      }
    };

    fetchShiftSummary();
  }, []);

  // Handle print function
  const handlePrint = () => {
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
            <title>Shift Summary Report</title>
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
                line-height: 1.2;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-weight: 600;
                background-color: white !important;
              }
              .report-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .report-header h1 {
                font-size: 18px;
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
                margin: 10px 0;
                font-size: 12px;
                color: #000000 !important;
                font-weight: 600;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .total-section {
                margin: 10px 0;
                font-weight: 900;
                text-align: right;
                color: #000000 !important;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                color: #000000 !important;
                font-weight: 600;
              }
              .items-table th {
                text-align: left;
                padding: 3px 0;
                border-bottom: 1px solid #000;
                font-weight: 900;
                color: #000000 !important;
              }
              .items-table th:last-child, .items-table td:last-child {
                text-align: right;
              }
              .items-table td {
                padding: 3px 0;
                color: #000000 !important;
              }
              .item-name {
                max-width: 40mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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
              <h2>SHIFT SUMMARY</h2>
            </div>
            
            <div class="report-meta">
              <p>Shift: ${report?.shift?.name || "N/A"}</p>
              <p>Time: ${formatTime(report?.shift?.start_time)} - ${formatTime(report?.shift?.end_time)}</p>
              <p>Date: ${formatDate(report?.date_range?.start_date)}</p>
              <p>Report Time: ${formatDateTime(report?.current_time)}</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="total-section">
              <p>Total Sales: ${report?.totals?.sale_count || 0}</p>
              <p>Total Amount: TK. ${formatCurrency(report?.totals?.total_amount || 0)}</p>
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
                  report?.items
                    ?.map(
                      (item) => `
                  <tr>
                    <td class="item-name">${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>TK. ${formatCurrency(item.amount)}</td>
                  </tr>
                `
                    )
                    .join("") || '<tr><td colspan="3">No items found</td></tr>'
                }
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div style="text-align: center; margin-top: 15px;">
              <p>*** End of Report ***</p>
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

  // Render loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading shift summary...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading shift summary: {error}</p>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // Render the report
  return (
    <div className={styles.reportContainer} ref={reportRef}>
      <div className={styles.reportHeader}>
        <h2>Shift Summary Report</h2>
        <div className={styles.reportActions}>
          <button className={styles.printButton} onClick={handlePrint} disabled={isPrinting}>
            <Printer size={16} />
            {isPrinting ? "Printing..." : "Print"}
          </button>
        </div>
      </div>

      <div className={styles.reportCard}>
        <div className={styles.reportMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Shift Name:</span>
            <span className={styles.metaValue}>{report?.shift?.name || "N/A"}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Shift Time:</span>
            <span className={styles.metaValue}>
              {formatTime(report?.shift?.start_time)} - {formatTime(report?.shift?.end_time)}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Date Range:</span>
            <span className={styles.metaValue}>
              {formatDate(report?.date_range?.start_date)}
              {report?.date_range?.start_date !== report?.date_range?.end_date && ` - ${formatDate(report?.date_range?.end_date)}`}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Report Time:</span>
            <span className={styles.metaValue}>{formatDateTime(report?.current_time)}</span>
          </div>
        </div>

        <div className={styles.summaryTotals}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total Sales</span>
            <span className={styles.totalValue}>{report?.totals?.sale_count || 0}</span>
          </div>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total Amount</span>
            <span className={styles.totalValue}>TK. {formatCurrency(report?.totals?.total_amount || 0)}</span>
          </div>
        </div>

        <div className={styles.itemsSection}>
          <h3>Item Breakdown</h3>

          {report?.items?.length === 0 ? (
            <div className={styles.noItems}>
              <p>No items found for this shift</p>
            </div>
          ) : (
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report?.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>TK. {formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>TK. {formatCurrency(report?.totals?.total_amount || 0)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftSummaryReport;
