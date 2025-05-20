"use client";

import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ChevronLeft, ChevronRight, FileDown, Image as ImageIcon, Pencil, Plus, Search, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./products.module.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortConfig, setSortConfig] = useState({ field: "name", direction: "asc" });
  const [userRole, setUserRole] = useState(null);
  const [userAssignedSection, setUserAssignedSection] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if user is authenticated
        const user = localStorage.getItem("user");
        if (!user) {
          router.push("/login");
          return;
        }

        // Parse user data and get token using our helper
        const parsedUser = JSON.parse(user);
        const token = parsedUser.token || getAuthToken();

        // Set user role and assigned section
        setUserRole(parsedUser.role || null);
        setUserAssignedSection(parsedUser.assigned_section || "ALL");

        if (!token) {
          console.error("No auth token found - redirecting to login");
          router.push("/login");
          return;
        }

        setAuthInfo({
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 10) + "..." : "None",
        });

        const API_BASE_URL = getApiBaseUrl();
        console.log("Making API request to:", `${API_BASE_URL}/api/products`);
        console.log("With auth token:", token ? "Bearer " + token.substring(0, 10) + "..." : "None");

        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(`Error: ${response.status}${errorData.message ? " - " + errorData.message : ""}`);
        }

        const data = await response.json();
        console.log("Products data received:", data);

        // Filter products based on user's assigned section if they are billing_counter
        let filteredData = data;
        if (parsedUser.role === "billing_counter" && parsedUser.assigned_section && parsedUser.assigned_section !== "ALL") {
          filteredData = data.filter((product) => product.section_type === parsedUser.assigned_section || product.section_type === "COMMON");
          console.log(`Filtered products for ${parsedUser.assigned_section} section:`, filteredData.length);
        }

        setProducts(filteredData);
        setFilteredProducts(filteredData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  // Update filtered products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(
        (product) =>
          String(product.name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (product.code && String(product.code).toLowerCase().includes(searchLower)) ||
          (product.category &&
            String(product.category.name || "")
              .toLowerCase()
              .includes(searchLower)) ||
          (product.description && String(product.description).toLowerCase().includes(searchLower))
      );
      setFilteredProducts(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, products]);

  // Check if user has permission to perform CRUD operations
  const canPerformCRUD = () => {
    return userRole !== "billing_counter";
  };

  // Sort functionality
  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });

    // Apply sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (field === "category") {
        const categoryA = a.category ? a.category.name.toLowerCase() : "";
        const categoryB = b.category ? b.category.name.toLowerCase() : "";

        if (direction === "asc") {
          return categoryA.localeCompare(categoryB);
        } else {
          return categoryB.localeCompare(categoryA);
        }
      } else {
        if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
        if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
        return 0;
      }
    });

    setFilteredProducts(sortedProducts);
  };

  // CSV Download functionality
  const downloadCSV = () => {
    // Define the columns for CSV
    const headers = ["Name", "Code", "Category", "Price", "Status", "Stock"];

    // Map products data to CSV rows
    const csvRows = filteredProducts.map((product) => [
      product.name,
      product.code || "",
      product.category ? product.category.name : "Uncategorized",
      parseFloat(product.price).toFixed(2),
      product.status,
      product.stock,
    ]);

    // Add headers as the first row
    const csvData = [headers, ...csvRows];

    // Convert each row to comma-separated values
    const csvContent = csvData
      .map((row) =>
        row
          .map((cell) =>
            // Escape quotes and wrap content with quotes if it contains comma, quote or newline
            typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n")) ? `"${cell.replace(/"/g, '""')}"` : cell
          )
          .join(",")
      )
      .join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (id) => {
    if (!canPerformCRUD()) {
      alert("You don't have permission to delete products.");
      return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token || getAuthToken();

      if (!token) {
        alert("Authentication token missing. Please log in again.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Remove deleted product from state
      const updatedProducts = products.filter((product) => product.id !== id);
      setProducts(updatedProducts);
      setFilteredProducts(
        updatedProducts.filter(
          (product) =>
            searchTerm.trim() === "" ||
            String(product.name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (product.code && String(product.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.category &&
              String(product.category.name || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
        )
      );
    } catch (err) {
      alert(err.message);
      console.error("Error deleting product:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>!</div>
          <h2>Error Loading Products</h2>
          <p>{error}</p>
          <div className={styles.errorDetails}>
            <p>
              <strong>API URL:</strong> {getApiBaseUrl()}/api/products
            </p>
            {authInfo && (
              <>
                <p>
                  <strong>Token Status:</strong> {authInfo.hasToken ? "Present" : "Missing"}
                </p>
                <p>
                  <strong>Token Preview:</strong> {authInfo.tokenStart}
                </p>
              </>
            )}
          </div>
          <button onClick={() => router.push("/login")} className={styles.errorButton}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Products</h1>
          <p>
            {userRole === "billing_counter" && userAssignedSection !== "ALL"
              ? `Viewing ${userAssignedSection} section and common products`
              : "Manage your restaurant menu items"}
          </p>
        </div>
        {canPerformCRUD() && (
          <Link href="/dashboard/products/add" className={styles.addButton}>
            <Plus size={16} />
            <span>New Product</span>
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ImageIcon size={48} strokeWidth={1} />
            </div>
            <h2 className={styles.emptyTitle}>No products found</h2>
            <p className={styles.emptyText}>
              {userRole === "billing_counter" ? "No products are available for your assigned section" : "You haven't created any products yet"}
            </p>
            {canPerformCRUD() && (
              <Link href="/dashboard/products/add" className={styles.addButton}>
                <Plus size={16} />
                <span>Create your first product</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableTools}>
            <div className={styles.leftActions}>
              <div className={styles.tableLength}>
                <label>Show</label>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={400}>400</option>
                  <option value={500}>500</option>
                </select>
                <span>entries</span>
              </div>

              <div className={styles.totalCount}>
                Total: <span>{filteredProducts.length}</span> products
              </div>
            </div>

            <div className={styles.rightActions}>
              {canPerformCRUD() && (
                <button onClick={downloadCSV} className={styles.downloadButton}>
                  <FileDown size={16} />
                  <span>Export CSV</span>
                </button>
              )}

              <div className={styles.searchInputWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }} data-sort="true">
                    Product
                    {sortConfig.field === "name" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("category")} style={{ cursor: "pointer" }} className={styles.hiddenMobile} data-sort="true">
                    Category
                    {sortConfig.field === "category" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("price")} style={{ cursor: "pointer" }} data-sort="true">
                    Price
                    {sortConfig.field === "price" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("status")} style={{ cursor: "pointer" }} className={styles.hiddenMobile} data-sort="true">
                    Status
                    {sortConfig.field === "status" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Section</th>
                  {canPerformCRUD() && <th>Actions</th>}
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {currentItems.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className={styles.productImage}>
                          {product.image ? (
                            <Image
                              src={`${getApiBaseUrl()}/storage/${product.image}`}
                              alt={product.name}
                              width={50}
                              height={50}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <ImageIcon size={24} strokeWidth={1} color="#ccc" />
                          )}
                        </div>
                        <div>
                          <span className={styles.productName}>{product.name}</span>
                          <span className={styles.productCode}>Code: {product.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.hiddenMobile}>
                      <span className={styles.categoryBadge}>{product.category ? product.category.name : "Uncategorized"}</span>
                    </td>
                    <td>
                      <span className={styles.price}>{parseFloat(product.price).toFixed(2)}</span>
                    </td>
                    <td className={styles.hiddenMobile}>
                      <span className={`${styles.statusBadge} ${product.status === "active" ? styles.statusActive : styles.statusInactive}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.sectionBadge} ${
                          product.section_type === "AC"
                            ? styles.sectionAc
                            : product.section_type === "NON_AC"
                            ? styles.sectionNonAc
                            : styles.sectionCommon
                        }`}
                      >
                        {/* if there is any _ in the section_type, remove it */}
                        {product.section_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    {canPerformCRUD() && (
                      <td>
                        <div className={styles.actions}>
                          <Link href={`/dashboard/products/edit/${product.id}`} className={styles.editButton} aria-label={`Edit ${product.name}`}>
                            <Pencil size={16} />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className={styles.deleteButton} aria-label={`Delete ${product.name}`}>
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1} className={styles.pageNavButton}>
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, index) => {
                // Show limited page numbers with ellipsis
                const pageNum = index + 1;
                const showPageNumber = pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                if (showPageNumber) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`${styles.pageButton} ${pageNum === currentPage ? styles.pageButtonActive : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
                  return <span key={pageNum}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                disabled={currentPage === totalPages}
                className={styles.pageNavButton}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
