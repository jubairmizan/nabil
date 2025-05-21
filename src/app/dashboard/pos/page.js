"use client";

import DirectPrintReceipt from "@/components/DirectPrintReceipt";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { Box, ChevronDown, ChevronLeft, ChevronRight, CreditCard, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import styles from "../products/products.module.css";
import posStyles from "./pos.module.css";

// Fallback product data in case the API fails
const FALLBACK_PRODUCTS = [
  { id: 1, code: "01", name: "Burger", price: 8.99, category: "Fast Food" },
  { id: 2, code: "02", name: "Pizza", price: 12.99, category: "Fast Food" },
  { id: 3, code: "03", name: "Steak", price: 24.99, category: "Main Course" },
  { id: 4, code: "04", name: "Caesar Salad", price: 7.99, category: "Salad" },
  { id: 5, code: "05", name: "French Fries", price: 3.99, category: "Side" },
  { id: 6, code: "06", name: "Cola", price: 2.49, category: "Drink" },
  { id: 7, code: "07", name: "Iced Tea", price: 2.29, category: "Drink" },
  { id: 8, code: "08", name: "Water", price: 1.49, category: "Drink" },
  { id: 9, code: "09", name: "Chicken Wings", price: 9.99, category: "Appetizer" },
  { id: 10, code: "10", name: "Pasta", price: 11.99, category: "Main Course" },
  { id: 11, code: "11", name: "Chocolate Cake", price: 6.99, category: "Dessert" },
  { id: 12, code: "12", name: "Ice Cream", price: 4.99, category: "Dessert" },
];

export default function POSPage() {
  const [orderItems, setOrderItems] = useState([{ id: 1, code: "", qty: "" }]);
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [focusField, setFocusField] = useState("code"); // 'code' or 'qty'
  const [orderTotal, setOrderTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [orderNumber, setOrderNumber] = useState("New Order");
  const [currentDate, setCurrentDate] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showDebugTools, setShowDebugTools] = useState(true);
  const [previousOrderAmount, setPreviousOrderAmount] = useState(0);
  const [previousOrderNumber, setPreviousOrderNumber] = useState(null);
  const [transactionId, setTransactionId] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);

  // Shift and User states
  const [currentUser, setCurrentUser] = useState(null);
  const [isShiftActive, setIsShiftActive] = useState(true); // Assume active until checked
  const [posInactiveMessage, setPosInactiveMessage] = useState("");

  const router = useRouter();

  const codeInputRefs = useRef([]);
  const qtyInputRefs = useRef([]);
  const categoryDropdownRef = useRef(null);

  // Set current date on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // Check authentication and fetch initial data (products, categories, user)
  useEffect(() => {
    async function fetchData() {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const API_BASE_URL = getApiBaseUrl();

        // Fetch user details first
        try {
          const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!userResponse.ok) {
            throw new Error("Failed to fetch user details");
          }
          const userData = await userResponse.json();
          setCurrentUser(userData.user);

          // Initial shift check based on fetched user data
          if (userData.user && userData.user.role === "billing_counter") {
            if (userData.user.shift) {
              // checkShiftTiming will be called by another useEffect with interval
            } else {
              setIsShiftActive(false);
              setPosInactiveMessage("You are not assigned to any shift. POS is inactive.");
            }
          } else {
            setIsShiftActive(true); // Active for non-billing counter roles or if no specific shift logic applies
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          // Handle user fetch error, maybe redirect or show error
          setIsShiftActive(false); // Default to inactive if user data fails for safety
          setPosInactiveMessage("Error fetching user data. POS is inactive.");
        }

        // Fetch products and categories
        try {
          const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/get-products`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            fetch(`${API_BASE_URL}/api/categories`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          ]);

          if (!productsResponse.ok || !categoriesResponse.ok) {
            throw new Error("Failed to fetch product/category data from API");
          }

          const productsData = await productsResponse.json();
          const categoriesData = await categoriesResponse.json();

          const formattedProducts = productsData.map((product, index) => ({
            ...product,
            code: product.code?.toString() || index.toString().padStart(2, "0"),
            category: product.category ? product.category.name : "Uncategorized",
            price: parseFloat(product.price),
          }));

          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);

          const categoryNames = ["All", ...categoriesData.map((cat) => cat.name)];
          setCategories(categoryNames);
        } catch (error) {
          console.error("API error (products/categories):", error);
          setProducts(FALLBACK_PRODUCTS);
          setFilteredProducts(FALLBACK_PRODUCTS);
          const uniqueCategories = ["All", ...new Set(FALLBACK_PRODUCTS.map((p) => p.category))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("General error fetching data:", error);
        // Fallback for all data
        setProducts(FALLBACK_PRODUCTS);
        setFilteredProducts(FALLBACK_PRODUCTS);
        const uniqueCategories = ["All", ...new Set(FALLBACK_PRODUCTS.map((p) => p.category))];
        setCategories(uniqueCategories);
        setIsShiftActive(false); // Default to inactive if any major error
        setPosInactiveMessage("Error loading POS data. System is inactive.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // Function to check shift timing
  const checkShiftTiming = () => {
    if (currentUser && currentUser.role === "billing_counter") {
      if (currentUser.shift) {
        const { start_time, end_time } = currentUser.shift;
        const now = new Date();

        const startTimeParts = start_time.split(":");
        const shiftStart = new Date();
        shiftStart.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), parseInt(startTimeParts[2] || 0), 0);

        const endTimeParts = end_time.split(":");
        const shiftEnd = new Date();
        shiftEnd.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), parseInt(endTimeParts[2] || 0), 0);

        // Handle overnight shifts (e.g., 10 PM to 6 AM)
        if (shiftEnd < shiftStart) {
          // Shift crosses midnight
          if (now >= shiftStart || now < shiftEnd) {
            setIsShiftActive(true);
            setPosInactiveMessage("");
          } else {
            setIsShiftActive(false);
            setPosInactiveMessage("Your shift is currently not active. POS is inactive.");
          }
        } else {
          // Normal same-day shift
          if (now >= shiftStart && now < shiftEnd) {
            setIsShiftActive(true);
            setPosInactiveMessage("");
          } else {
            setIsShiftActive(false);
            setPosInactiveMessage("Your shift is currently not active. POS is inactive.");
          }
        }
      } else {
        // Billing counter without a shift assigned
        setIsShiftActive(false);
        setPosInactiveMessage("No shift assigned. POS is inactive.");
      }
    } else {
      // Not a billing counter, or no user data yet
      setIsShiftActive(true); // Default to active for other roles or if user not yet loaded
      setPosInactiveMessage("");
    }
  };

  // Periodically check shift timing
  useEffect(() => {
    checkShiftTiming(); // Initial check
    const intervalId = setInterval(checkShiftTiming, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Fetch previous order amount when user or shift changes
  useEffect(() => {
    // Only fetch if we have a user and the shift is active
    if (currentUser && isShiftActive) {
      fetchPreviousOrderAmount();
    }
  }, [currentUser, isShiftActive]);

  // Initialize transaction ID on component mount
  useEffect(() => {
    setTransactionId(generateTransactionId());
  }, []);

  // Function to fetch previous order amount
  const fetchPreviousOrderAmount = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/previous-order-amount`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setPreviousOrderAmount(data.previous_amount);
      setPreviousOrderNumber(data.order_number);
    } catch (error) {
      console.error("Error fetching previous order amount:", error);
    }
  };

  // Update focus the first code input on component mount with a slightly longer delay
  useEffect(() => {
    if (isShiftActive) {
      // Only focus if POS is active
      const timer = setTimeout(() => {
        qtyInputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isShiftActive]);

  // Update order total when items change
  useEffect(() => {
    let total = 0;
    orderItems.forEach((item) => {
      const product = products.find((p) => p.code === item.code);
      if (product && item.qty) {
        total += product.price * (parseInt(item.qty) || 0);
      }
    });
    setOrderTotal(total);
  }, [orderItems, products]);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(term) || String(product.code).toLowerCase().includes(term));
    }

    // Filter by category
    if (activeCategory !== "All") {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, activeCategory, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard events with debounce for Enter key
  useEffect(() => {
    let enterKeyTimeout = null;

    const handleKeyDown = (e) => {
      if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) {
        // If shift is not active for billing counter, prevent most keyboard actions
        if (e.key !== "Escape" && e.key !== "F1") {
          // Allow Esc/F1 for potential reset/debug
          e.preventDefault();
        }
        return;
      }

      // Ctrl key - Focus on the quantity field of the current row
      if (e.key === "Control") {
        e.preventDefault();
        setFocusField("qty");
        qtyInputRefs.current[currentRowIndex]?.focus();
      }

      // Plus key (+) - Multiple functions based on current focus
      if (e.key === "+" || e.key === "=") {
        // Handle both + and = (unshifted +) keys
        e.preventDefault();

        if (focusField === "qty") {
          // If in qty field and qty is entered, move to code field
          const currentItem = orderItems[currentRowIndex];
          if (currentItem.qty && parseInt(currentItem.qty) > 0) {
            setFocusField("code");
            codeInputRefs.current[currentRowIndex]?.focus();
          }
        } else if (focusField === "code") {
          // If in code field and code is entered, add a new row
          const currentItem = orderItems[currentRowIndex];
          const product = products.find((p) => p.code === currentItem.code);

          if (product && currentItem.qty && parseInt(currentItem.qty) > 0) {
            addNewRow();
          }
        }
      }

      // Alt key - Remove the current row
      if (e.key === "Alt") {
        e.preventDefault();
        removeRow(currentRowIndex);
      }

      // Enter key - Only process payment with confirmation and debounce
      if (e.key === "Enter") {
        e.preventDefault();

        // Clear any existing timeout
        if (enterKeyTimeout) {
          clearTimeout(enterKeyTimeout);
        }

        // Set a new timeout to prevent rapid multiple submissions
        enterKeyTimeout = setTimeout(() => {
          // Only proceed if not already processing an order
          if (!processingOrder) {
            // Check if we have any valid items before showing confirmation
            const filledItems = orderItems.filter((item) => item.code && item.qty && parseInt(item.qty) > 0);

            if (filledItems.length > 0) {
              confirmAndProcessPayment();
            } else {
              Swal.fire({
                title: "Error!",
                text: "Please add at least one item to the order!",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#0284c7",
              });
            }
          }
        }, 300); // 300ms debounce
      }

      // F1 key - Reset order / New order
      if (e.key === "F1") {
        e.preventDefault();
        resetOrder();
      }

      // Escape key - Cancel order
      if (e.key === "Escape") {
        e.preventDefault();
        resetOrder();
      }

      // Minus key (-) - Decrement quantity by 1 if in quantity field (won't go below 1)
      if (e.key === "-" && focusField === "qty") {
        e.preventDefault();
        const updatedItems = [...orderItems];
        const currentQty = parseInt(updatedItems[currentRowIndex].qty) || 0;
        if (currentQty > 1) {
          updatedItems[currentRowIndex].qty = (currentQty - 1).toString();
          setOrderItems(updatedItems);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (enterKeyTimeout) {
        clearTimeout(enterKeyTimeout);
      }
    };
  }, [currentRowIndex, focusField, orderItems, products, currentUser, isShiftActive, processingOrder]);

  // Add new row to order items
  const addNewRow = () => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    // Generate a new ID that is one greater than the highest current ID
    const maxId = orderItems.reduce((max, item) => Math.max(max, item.id), 0);
    const newId = maxId + 1;
    const newRow = { id: newId, code: "", qty: "" };
    const newIndex = orderItems.length;
    setOrderItems([...orderItems, newRow]);
    setCurrentRowIndex(newIndex);
    setFocusField("qty");

    // Need to wait for the DOM to update before focusing
    setTimeout(() => {
      qtyInputRefs.current[newIndex]?.focus();
    }, 100); // Slightly longer delay to ensure DOM is updated
  };

  // Remove a row
  const removeRow = (index) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    // Don't remove if it's the only row
    if (orderItems.length <= 1) return;

    // Filter out the row and regenerate IDs for remaining rows
    const updatedItems = orderItems
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        id: i + 1, // Regenerate IDs starting from 1
      }));

    setOrderItems(updatedItems);

    // Set focus to the previous row or the first row if we're removing the first row
    const newIndex = index === 0 ? 0 : index - 1;
    setCurrentRowIndex(newIndex);

    // Focus on the appropriate field in the new current row
    setTimeout(() => {
      if (focusField === "code") {
        codeInputRefs.current[newIndex]?.focus();
      } else {
        qtyInputRefs.current[newIndex]?.focus();
      }
    }, 0);
  };

  // Handle input change for code field
  const handleCodeChange = (index, value) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;

    const updatedItems = [...orderItems];
    updatedItems[index].code = value;
    setOrderItems(updatedItems);

    // Auto-fill product details if code exists
    if (value) {
      const product = products.find((p) => p.code === value);
      if (product) {
        setSelectedProductCode(product.code);
      } else {
        setSelectedProductCode("");
      }
    } else {
      setSelectedProductCode("");
    }
  };

  // Handle input change for quantity field
  const handleQtyChange = (index, value) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    const updatedItems = [...orderItems];
    updatedItems[index].qty = value === "0" ? "" : value;
    setOrderItems(updatedItems);
  };

  // Handle focus events
  const handleFocus = (index, field) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    setCurrentRowIndex(index);
    setFocusField(field);
  };

  // Handle clicking on a product
  const handleProductClick = (product) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    // Check if the product is already added to the order
    const existingItemIndex = orderItems.findIndex((item) => item.code === product.code);

    if (existingItemIndex !== -1) {
      // If product already exists, increment quantity
      const updatedItems = [...orderItems];
      const currentQty = parseInt(updatedItems[existingItemIndex].qty) || 0;
      updatedItems[existingItemIndex].qty = (currentQty + 1).toString();
      setOrderItems(updatedItems);

      // Focus on the existing item's qty input
      setCurrentRowIndex(existingItemIndex);
      setFocusField("qty");
      setTimeout(() => {
        qtyInputRefs.current[existingItemIndex]?.focus();
      }, 0);
    } else {
      // If no empty row, add a new row
      const emptyRowIndex = orderItems.findIndex((item) => !item.code);

      if (emptyRowIndex !== -1) {
        // Use the empty row
        const updatedItems = [...orderItems];
        updatedItems[emptyRowIndex].code = product.code;
        updatedItems[emptyRowIndex].qty = "1";
        setOrderItems(updatedItems);
        setCurrentRowIndex(emptyRowIndex);

        // Focus on the qty field of the filled row
        setFocusField("qty");
        setTimeout(() => {
          qtyInputRefs.current[emptyRowIndex]?.focus();
        }, 0);
      } else {
        // Add a new row with ID that is one greater than the highest current ID
        const maxId = orderItems.reduce((max, item) => Math.max(max, item.id), 0);
        const newId = maxId + 1;
        const newItems = [...orderItems, { id: newId, code: product.code, qty: "1" }];
        setOrderItems(newItems);
        setCurrentRowIndex(newId - 1);

        // Focus on the qty field of the new row
        setFocusField("qty");
        setTimeout(() => {
          qtyInputRefs.current[newId - 1]?.focus();
        }, 0);
      }
    }

    setSelectedProductCode(product.code);
  };

  // Add new confirmation function
  const confirmAndProcessPayment = async () => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) {
      Swal.fire("Shift Inactive", posInactiveMessage, "warning");
      return;
    }

    // Prevent multiple submissions
    if (processingOrder) {
      return;
    }

    // Check for items with invalid product codes
    const invalidCodeItems = orderItems.filter(
      (item) =>
        item.code && // has a code entered
        item.qty &&
        parseInt(item.qty) > 0 && // has a valid quantity
        !products.some((p) => p.code === item.code) // code doesn't match any product
    );

    if (invalidCodeItems.length > 0) {
      // List the invalid codes
      const invalidCodes = invalidCodeItems.map((item) => item.code).join(", ");

      // Find the index of the first invalid code for focusing and clearing
      const invalidIndex = orderItems.findIndex(
        (item) => item.code && item.qty && parseInt(item.qty) > 0 && !products.some((p) => p.code === item.code)
      );

      Swal.fire({
        title: "Invalid Product Codes",
        html: `The following codes do not match any products in the system:<br><strong>${invalidCodes}</strong><br><br>Please remove or correct these codes before submitting.`,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#0284c7",
        allowEnterKey: true, // Allow Enter key to confirm (close) the modal
        preConfirm: () => {
          // This function will be called before the modal closes
          if (invalidIndex !== -1) {
            const updatedItems = [...orderItems];
            updatedItems[invalidIndex].code = ""; // Clear the invalid code
            setOrderItems(updatedItems);

            setCurrentRowIndex(invalidIndex);
            setFocusField("code");
            setTimeout(() => {
              codeInputRefs.current[invalidIndex]?.focus();
              codeInputRefs.current[invalidIndex]?.select(); // Select the text for easy replacement
            }, 100); // Delay to ensure state update and DOM re-render
          }
          return true; // Return true to allow the modal to close
        },
      }).then((result) => {
        // This block will execute after the modal is closed by "OK" or Enter
        if (result.isConfirmed) {
          // If preConfirm already handled it, we might not need much here,
          // but it's good to ensure focus is set if not already.
          if (invalidIndex !== -1) {
            setCurrentRowIndex(invalidIndex);
            setFocusField("code");
            setTimeout(() => {
              if (document.activeElement !== codeInputRefs.current[invalidIndex]) {
                codeInputRefs.current[invalidIndex]?.focus();
                codeInputRefs.current[invalidIndex]?.select();
              }
            }, 120); // Slightly longer delay to be safe
          }
        }
      });

      return;
    }

    // Check for items with empty quantity fields
    const emptyQtyItems = orderItems.filter((item) => item.code && (!item.qty || parseInt(item.qty) <= 0));

    if (emptyQtyItems.length > 0) {
      // Get product names for items with empty quantities
      const emptyQtyProducts = emptyQtyItems.map((item) => {
        const product = products.find((p) => p.code === item.code);
        return product ? product.name : `Item with code ${item.code}`;
      });

      Swal.fire({
        title: "Missing Quantities",
        html: `Please enter quantities for the following items:<br><strong>${emptyQtyProducts.join("<br>")}</strong>`,
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#0284c7",
      });

      // Focus on the first empty qty field
      const emptyQtyIndex = orderItems.findIndex((item) => item.code && (!item.qty || parseInt(item.qty) <= 0));
      if (emptyQtyIndex !== -1) {
        setCurrentRowIndex(emptyQtyIndex);
        setFocusField("qty");
        setTimeout(() => {
          qtyInputRefs.current[emptyQtyIndex]?.focus();
        }, 100);
      }

      return;
    }

    // Filter out empty rows
    const filledItems = orderItems.filter((item) => item.code && item.qty && parseInt(item.qty) > 0);

    if (filledItems.length === 0) {
      Swal.fire({
        title: "Error!",
        text: "Please add at least one item to the order!",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    // Calculate the current total to ensure it's up-to-date
    let currentTotal = 0;
    filledItems.forEach((item) => {
      const product = products.find((p) => p.code === item.code);
      if (product && item.qty) {
        currentTotal += product.price * (parseInt(item.qty) || 0);
      }
    });

    // Show confirmation dialog with the calculated total
    const result = await Swal.fire({
      title: "Confirm Order",
      html: `Total: <strong>${currentTotal.toFixed(2)}</strong><br>Press Enter to confirm or Escape to cancel`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm Order",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0284c7",
      // Setup to allow Enter key to confirm
      allowEnterKey: true,
      focusConfirm: true,
    });

    if (result.isConfirmed) {
      // Pass the calculated total to ensure it's correct
      processPayment(currentTotal);
    }
  };

  // Process payment - use our existing sales API
  const processPayment = async (calculatedTotal = orderTotal) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) {
      Swal.fire("Shift Inactive", posInactiveMessage, "warning");
      return;
    }

    // Prevent multiple simultaneous submissions
    if (processingOrder) {
      return;
    }

    // Set processing flag to prevent multiple submissions
    setProcessingOrder(true);

    // Final check for invalid product codes
    const filledItems = orderItems.filter((item) => item.code && item.qty && parseInt(item.qty) > 0);
    const invalidCodeItems = filledItems.filter((item) => !products.some((p) => p.code === item.code));

    if (invalidCodeItems.length > 0) {
      // If somehow we got here with invalid codes, stop and show error
      const invalidCodes = invalidCodeItems.map((item) => item.code).join(", ");

      Swal.fire({
        title: "Invalid Product Codes",
        html: `Cannot proceed with invalid product codes:<br><strong>${invalidCodes}</strong>`,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#0284c7",
      });
      return;
    }

    // Check for duplicate products in the order
    const productCodes = filledItems.map((item) => item.code);
    const duplicateCodes = productCodes.filter((code, index) => productCodes.indexOf(code) !== index);

    // If duplicates found, show confirmation dialog
    if (duplicateCodes.length > 0) {
      // Get product names for duplicates
      const duplicateProducts = [...new Set(duplicateCodes)].map((code) => {
        const product = products.find((p) => p.code === code);
        return product ? product.name : code;
      });

      const duplicateText = duplicateProducts.join(", ");

      const result = await Swal.fire({
        title: "Duplicate Products Found",
        html: `You have added the following product(s) multiple times:<br><strong>${duplicateText}</strong><br><br>Do you want to proceed with the order?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Proceed",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0284c7",
      });

      if (!result.isConfirmed) {
        return; // Cancel order submission
      }
    }

    // Show processing indicator
    Swal.fire({
      title: "Processing Order",
      html: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Create a clean order object for the API
    const orderData = {
      items: filledItems.map((item) => {
        const product = products.find((p) => p.code === item.code);
        return {
          product_id: product ? product.id : null,
          name: product ? product.name : item.code,
          quantity: parseInt(item.qty) || 0,
          price: product ? product.price : 0,
          subtotal: product ? product.price * (parseInt(item.qty) || 0) : 0,
        };
      }),
      total_amount: calculatedTotal,
      status: "completed",
      payment_method: "cash",
      customer_name: "Walk-in Customer",
      transaction_id: transactionId, // Include the transaction ID
    };

    try {
      // Send order to backend
      const token = getAuthToken();

      if (!token) {
        Swal.fire({
          title: "Authentication Error",
          text: "Authentication token missing. Please log in again.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#0284c7",
        });
        router.push("/login");
        return;
      }

      const API_BASE_URL = getApiBaseUrl();

      console.log("Sending order to server...");
      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Order processed:", responseData);

      // Close the processing dialog
      Swal.close();

      // Check if this was a duplicate order
      if (responseData.duplicate) {
        console.log("Duplicate order detected, using existing order data");
      }

      // Get the actual order number from the response
      const actualOrderNumber = responseData.sale?.order_number || "N/A";

      // Show a success notification with the actual order number
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: `Order #${actualOrderNumber} processed!`,
        text: "Preparing receipt for printing...",
        showConfirmButton: false,
        timer: 500,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Prepare the sale object for printing
      if (!responseData.sale || !responseData.sale.items) {
        console.error("Invalid sale data for receipt:", responseData);
        Swal.fire({
          title: "Print Error",
          text: "Unable to prepare receipt for printing. Missing sale data.",
          icon: "warning",
          confirmButtonText: "Continue",
          confirmButtonColor: "#0284c7",
        });
        resetOrder(); // Reset order if we can't print
      } else {
        console.log("Preparing to print receipt...");
        // Set the completed sale data to trigger receipt printing
        // Delay slightly to allow the success message to be seen
        setTimeout(() => {
          // Only set lastCompletedSale if it's not already set
          if (!lastCompletedSale) {
            setLastCompletedSale(responseData.sale);

            // Add an additional failsafe to clear lastCompletedSale after 20 seconds
            // This prevents the print dialog getting stuck in case onPrintComplete is never called
            setTimeout(() => {
              setLastCompletedSale(null);
            }, 20000);
          }
        }, 500);
      }

      // After successful payment, update the previous order amount
      fetchPreviousOrderAmount();

      // Generate a new transaction ID for the next order
      setTransactionId(generateTransactionId());

      // Reset the order now that printing is complete
      resetOrder();
    } catch (error) {
      console.error("Error processing order:", error);
      Swal.fire({
        title: "Processing Error",
        text: "Failed to process order! Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  // Handle after print completion
  const handlePrintComplete = () => {
    console.log("Print completed or canceled, clearing lastCompletedSale");

    // Clear the completed sale to prevent additional prints
    setLastCompletedSale(null);

    // Fetch the updated previous order amount
    fetchPreviousOrderAmount();

    // Reset the order now that printing is complete
    resetOrder();
  };

  // Reset order
  const resetOrder = () => {
    // Always start with ID 1 for a fresh order
    setOrderItems([{ id: 1, code: "", qty: "" }]);
    setCurrentRowIndex(0);
    setFocusField("qty");
    setOrderNumber("New Order");
    // Generate a new transaction ID for the new order
    setTransactionId(generateTransactionId());

    // Focus on the first qty input with a slightly longer delay
    if (isShiftActive) {
      // Only focus if POS is active
      setTimeout(() => {
        qtyInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  // Generate a unique transaction ID
  const generateTransactionId = () => {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  };

  // Handle search change
  const handleSearchChange = (e) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    setSearchTerm(e.target.value);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    setActiveCategory(category);
    setShowCategoryDropdown(false);
  };

  // Toggle category dropdown
  const toggleCategoryDropdown = () => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  // Get product by code
  const getProductByCode = (code) => {
    return products.find((p) => p.code === code);
  };

  // Pagination functions
  const paginate = (pageNumber) => {
    if (currentUser && currentUser.role === "billing_counter" && !isShiftActive) return;
    setCurrentPage(pageNumber);
  };

  // Get current products for pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const posIsDisabled = currentUser && currentUser.role === "billing_counter" && !isShiftActive;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading POS system...</p>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      {/* Receipt printing component - only renders when there's a completed sale */}
      {lastCompletedSale && (
        <div style={{ display: "none" }}>
          <DirectPrintReceipt
            key={`receipt-${lastCompletedSale.id}-${Date.now()}`}
            sale={lastCompletedSale}
            onPrintComplete={handlePrintComplete}
            autoPrint={true}
          />
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Point of Sale</h1>
          <p>Process orders and manage transactions</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            onClick={resetOrder}
            style={{ backgroundColor: "#f1f5f9", color: "#334155", marginRight: "10px" }}
            disabled={posIsDisabled}
          >
            <RefreshCw size={16} />
            <span>New Order</span>
          </button>
          <button className={styles.addButton} onClick={confirmAndProcessPayment} disabled={processingOrder || posIsDisabled}>
            <CreditCard size={16} />
            <span>{processingOrder ? "Processing..." : "Process Payment"}</span>
          </button>
        </div>
      </div>

      <div className={posStyles.posContentWrapper} style={{ position: "relative" }}>
        {posIsDisabled && (
          <div className={posStyles.inactiveOverlay}>
            <div className={posStyles.inactiveMessageContainer}>
              <ShieldAlert size={64} color="#f97316" />
              <h2>POS Inactive</h2>
              <p>{posInactiveMessage}</p>
              {currentUser && currentUser.shift && (
                <p>
                  Your shift: {currentUser.shift.name} (
                  {new Date(`1970-01-01T${currentUser.shift.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {new Date(`1970-01-01T${currentUser.shift.end_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                </p>
              )}
              <p>Current time: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
            </div>
          </div>
        )}

        {/* Left panel - Order Details */}
        <div className={`${styles.card} ${posStyles.orderPanel}`}>
          <div className={posStyles.orderHeader}>
            <div className={posStyles.orderInfo}>
              <h3>Order: {orderNumber}</h3>
              <span className={posStyles.orderDate}>{currentDate}</span>
            </div>
            <div className={posStyles.orderTotals}>
              {previousOrderAmount > 0 && (
                <div className={posStyles.previousOrderTotal}>
                  <p>Last Order #{previousOrderNumber}</p>
                  <h2>{parseFloat(previousOrderAmount).toFixed(2)}</h2>
                </div>
              )}
              <div className={posStyles.orderTotal}>
                <p>Total</p>
                <h2>{orderTotal.toFixed(2)}</h2>
              </div>
            </div>
          </div>

          <div className={posStyles.orderItems}>
            <table className={posStyles.orderTable}>
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => {
                  const product = getProductByCode(item.code);
                  const itemTotal = product && item.qty ? product.price * (parseInt(item.qty) || 0) : 0;
                  const isInvalidCode = item.code && !product; // Check if code is entered but no matching product

                  return (
                    <tr key={item.id} className={index === currentRowIndex ? posStyles.activeRow : ""}>
                      <td className={posStyles.qtyCell}>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          onFocus={() => handleFocus(index, "qty")}
                          ref={(el) => (qtyInputRefs.current[index] = el)}
                          placeholder="Qty"
                          min="1"
                          className={posStyles.qtyInput}
                          disabled={posIsDisabled}
                        />
                      </td>
                      <td className={posStyles.itemCell}>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onFocus={() => handleFocus(index, "code")}
                          ref={(el) => (codeInputRefs.current[index] = el)}
                          placeholder="Code"
                          className={`${posStyles.codeInput} ${isInvalidCode ? posStyles.invalidCode : ""}`}
                          disabled={posIsDisabled}
                        />
                        &nbsp;
                        <span className={posStyles.itemName}>
                          {product ? product.name : isInvalidCode ? <span className={posStyles.invalidCodeText}>Invalid code</span> : ""}
                        </span>
                      </td>
                      <td className={posStyles.priceCell}>{product ? product.price.toFixed(2) : "0.00"}</td>
                      <td className={posStyles.totalCell}>{itemTotal.toFixed(2)}</td>
                      <td className={posStyles.actionCell}>
                        <button
                          onClick={() => removeRow(index)}
                          className={posStyles.removeButton}
                          disabled={orderItems.length <= 1 || posIsDisabled}
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={posStyles.keyboardHints}>
            <h4>Keyboard Shortcuts</h4>
            <div className={posStyles.shortcutGrid}>
              <div className={posStyles.shortcut}>
                <kbd>Ctrl</kbd>
                <span>Focus on quantity field</span>
              </div>
              <div className={posStyles.shortcut}>
                <kbd>+</kbd>
                <span>Move between qty and code</span>
              </div>
              <div className={posStyles.shortcut}>
                <kbd>Enter</kbd>
                <span>Submit order</span>
              </div>
              <div className={posStyles.shortcut}>
                <kbd>Alt</kbd>
                <span>Remove current row</span>
              </div>
              <div className={posStyles.shortcut}>
                <kbd>F1</kbd>
                <span>New order</span>
              </div>
              <div className={posStyles.shortcut}>
                <kbd>Esc</kbd>
                <span>Cancel order</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Products */}
        <div className={`${styles.card} ${posStyles.productsPanel}`}>
          <div className={posStyles.productsHeader}>
            <div className={posStyles.searchAndFilter}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={posIsDisabled}
                />
              </div>

              <div className={posStyles.categoryDropdownContainer} ref={categoryDropdownRef}>
                <button className={posStyles.categoryDropdownButton} onClick={toggleCategoryDropdown} disabled={posIsDisabled}>
                  <span>{activeCategory}</span>
                  <ChevronDown size={16} />
                </button>

                {showCategoryDropdown && (
                  <div className={posStyles.categoryDropdownMenu}>
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`${posStyles.categoryDropdownItem} ${activeCategory === category ? posStyles.activeDropdownItem : ""}`}
                        onClick={() => handleCategoryClick(category)}
                        disabled={posIsDisabled}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={posStyles.productsGrid}>
            {currentProducts.length === 0 ? (
              <div className={posStyles.noProducts}>
                <Box size={48} strokeWidth={1} />
                <p>No products found</p>
                <span>Try a different search term or category</span>
              </div>
            ) : (
              currentProducts.map((product) => (
                <div
                  key={product.id}
                  className={`${posStyles.productCard} ${product.code === selectedProductCode ? posStyles.selectedProduct : ""} ${
                    posIsDisabled ? posStyles.disabledProductCard : ""
                  }`}
                  onClick={() => !posIsDisabled && handleProductClick(product)}
                >
                  <div className={posStyles.productHeader}>
                    <span className={posStyles.productCode}>{product.code}</span>
                  </div>
                  <div className={posStyles.productName}>{product.name}</div>
                  <div className={posStyles.productPrice}>{product.price.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          {/* Products Pagination */}
          {filteredProducts.length > 0 && (
            <div className={posStyles.productsPagination}>
              <div className={posStyles.paginationInfo}>
                Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
              </div>

              <div className={posStyles.paginationControls}>
                <button
                  onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1 || posIsDisabled}
                  className={posStyles.paginationButton}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Logic to show appropriate page numbers
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                    if (idx === 4) pageNum = totalPages;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                    if (idx === 0) pageNum = 1;
                    if (idx === 4) pageNum = totalPages;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => paginate(pageNum)}
                      className={`${posStyles.paginationButton} ${currentPage === pageNum ? posStyles.activePage : ""}`}
                      disabled={posIsDisabled}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages || posIsDisabled}
                  className={posStyles.paginationButton}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
