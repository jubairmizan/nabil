"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl } from "@/lib/api-config";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import styles from "../../../products/products.module.css";

function EditCategoryPage({ params }) {
  // Unwrap params properly using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [category, setCategory] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const user = localStorage.getItem("user");
        if (!user) {
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(user);
        const response = await fetch(`${getApiBaseUrl()}/api/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setCategory(data);
      } catch (err) {
        setFetchError(err.message);
        console.error("Error fetching category:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory({
      ...category,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!category.name.trim()) {
      newErrors.name = "Category name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`${getApiBaseUrl()}/api/categories/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.errors) {
          setErrors(errorData.errors);
          throw new Error("Validation failed");
        }

        throw new Error(errorData.message || "Failed to update category");
      }

      router.push("/dashboard/categories");
    } catch (err) {
      console.error("Error updating category:", err);
      if (err.message !== "Validation failed") {
        alert(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading category...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.productsContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>!</div>
          <h2>Error Loading Category</h2>
          <p>{fetchError}</p>
          <div className={styles.errorDetails}>
            <p>
              <strong>API URL:</strong> {getApiBaseUrl()}/api/categories/{id}
            </p>
          </div>
          <Link href="/dashboard/categories" className={styles.addButton}>
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Edit Category</h1>
          <p>Update the category details</p>
        </div>
        <Link
          href="/dashboard/categories"
          className={`${styles.addButton} ${styles.backButton}`}
          style={{ backgroundColor: "#f8f9fa", color: "#333", border: "1px solid #dee2e6" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Categories</span>
        </Link>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="name" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Category Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={category.name}
              onChange={handleChange}
              className={errors.name ? styles.inputError : styles.input}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.name ? "1px solid #e74c3c" : "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
              placeholder="Enter category name"
            />
            {errors.name && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.name}
              </div>
            )}
          </div>

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="description" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={category.description || ""}
              onChange={handleChange}
              className={styles.textarea}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
                minHeight: "120px",
                resize: "vertical",
              }}
              placeholder="Enter category description"
              rows="4"
            />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: "25px" }}>
            <label htmlFor="status" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={category.status}
              onChange={handleChange}
              className={styles.select}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
                backgroundColor: "white",
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className={styles.formActions} style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <Link
              href="/dashboard/categories"
              className={styles.cancelButton}
              style={{
                padding: "10px 16px",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
                backgroundColor: "#f8f9fa",
                color: "#555",
                fontSize: "0.9rem",
                fontWeight: "500",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
              style={{
                padding: "10px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--primary-color)",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <span
                    className={styles.spinnerBorder}
                    style={{
                      display: "inline-block",
                      width: "1rem",
                      height: "1rem",
                      marginRight: "8px",
                      borderRadius: "50%",
                      border: "2px solid currentColor",
                      borderRightColor: "transparent",
                      animation: "spin 0.75s linear infinite",
                    }}
                  ></span>
                  Saving...
                </>
              ) : (
                "Update Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedEditCategoryPage({ params }) {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <EditCategoryPage params={params} />
    </RouteGuard>
  );
}
