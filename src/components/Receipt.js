import "@/styles/print.css"; // Import global print styles
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import styles from "./Receipt.module.css";

const Receipt = ({ sale, onPrintComplete }) => {
  const receiptRef = useRef(null);
  const wrapperRef = useRef(null);
  const hasPrintedRef = useRef(false);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    copyStyles: true,
    removeAfterPrint: false,
    onBeforeGetContent: () => {
      console.log("Preparing to print receipt...", receiptRef.current);
      if (!receiptRef.current) {
        console.error("Receipt reference is null!");
        return Promise.reject("Receipt reference is null");
      }

      if (receiptRef.current) {
        receiptRef.current.classList.add("print-receipt");
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Content ready for print");
          resolve();
        }, 500);
      });
    },
    onAfterPrint: () => {
      console.log("Print dialog completed");
      if (receiptRef.current) {
        receiptRef.current.classList.remove("print-receipt");
      }

      hasPrintedRef.current = true;

      if (onPrintComplete) {
        onPrintComplete();
      }
    },
    timeout: 5000,
    pageStyle: `
      @page {
        size: 80mm 297mm;
        margin: 0mm;
      }
      @media print {
        html, body {
          width: 80mm;
          height: auto;
        }
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const triggerPrint = () => {
    if (!receiptRef.current) {
      console.error("Receipt reference is null, cannot print");
      return;
    }

    try {
      console.log("Triggering print dialog manually");
      handlePrint();
    } catch (err) {
      console.error("Error triggering print:", err);
      if (wrapperRef.current) {
        const button = wrapperRef.current.querySelector(`.${styles.printButton}`);
        if (button) button.style.display = "block";
      }
    }
  };

  useEffect(() => {
    if (sale && !hasPrintedRef.current) {
      console.log("Receipt mounted, attempting to print...");

      const timer = setTimeout(() => {
        if (!receiptRef.current) {
          console.error("Receipt ref is null after timeout!");
          return;
        }

        triggerPrint();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [sale]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasPrintedRef.current && wrapperRef.current) {
        console.log("Auto-print may have failed, showing print button");
        const button = wrapperRef.current.querySelector(`.${styles.printButton}`);
        if (button) button.style.display = "block";
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (!sale) return null;

  return (
    <div ref={wrapperRef}>
      <div className={styles.printButton}>
        <button onClick={triggerPrint}>Print Receipt</button>
      </div>

      <div className={styles.receiptWrapper}>
        <div className={styles.receipt} ref={receiptRef}>
          <div className={styles.receiptHeader}>
            <h1>NABIL</h1>
            <h2>HIGHWAY RESTAURANT</h2>
            <p>Sonka, Vobanipur, Sherpur, Bogura</p>
            <p>BIN: 006971563-1106 Mushak:6.3</p>
            <p>Mob: 01325-060388</p>
            <p>
              DATE: {formatDate(sale.created_at)} {formatTime(sale.created_at)}
            </p>
          </div>

          <table className={styles.receiptTable}>
            <thead>
              <tr>
                <th>NAME</th>
                <th>PRICE</th>
                <th>QTY</th>
                <th>AMT</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{parseFloat(item.price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>TK.{parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.receiptDivider}>{/* Dashed line */}</div>

          <div className={styles.receiptSummary}>
            <div className={styles.summaryRow}>
              <span>TTL.SALE</span>
              <span>TK.{parseFloat(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>VAT 0.00%</span>
              <span>TK.0.00</span>
            </div>
            <div className={styles.summaryRow}>
              <span>VAT TOTAL</span>
              <span>TK.0.00</span>
            </div>
            <div className={styles.totalRow}>
              <span>TOTAL</span>
              <span>TK.{parseFloat(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{sale.payment_method.toUpperCase()}</span>
              <span>TK.{parseFloat(sale.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.receiptFooter}>
            <p>
              CLERK:{sale.user_id} {sale.id}
            </p>
            <p>VAT INCLUDED</p>
            <p>THANK YOU</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
