import { X } from "lucide-react";
import { useEffect, useState } from "react";
import DirectPrintReceipt from "./DirectPrintReceipt";
import styles from "./ReceiptModal.module.css";

const ReceiptModal = ({ sale, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className={`${styles.modalOverlay} ${isOpen ? styles.open : ""}`} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Order Receipt #{sale?.id}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>{sale && <DirectPrintReceipt sale={sale} onPrintComplete={null} autoPrint={false} />}</div>
      </div>
    </div>
  );
};

export default ReceiptModal;
