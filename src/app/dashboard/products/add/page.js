"use client";

import { getApiBaseUrl } from "@/lib/api-config";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../products.module.css";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    section_type: "COMMON",
    price: "",
    cost_price: "",
    sku: "",
    barcode: "",
    stock: "0",
    category_id: "",
    is_featured: false,
    status: "active",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const user = localStorage.getItem("user");
        if (!user) {
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(user);
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      setImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});
    setSubmitSuccess(false);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const API_BASE_URL = getApiBaseUrl();

      // Create FormData for file upload
      const productFormData = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        // Special handling for boolean values
        if (key === "is_featured") {
          productFormData.append(key, formData[key] ? "1" : "0");
        } else {
          productFormData.append(key, formData[key]);
        }
      });

      // Add image if exists
      if (image) {
        productFormData.append("image", image);
      }

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          // Don't set Content-Type when using FormData, browser will set it automatically with boundary
        },
        body: productFormData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 422 && responseData.errors) {
          setValidationErrors(responseData.errors);
          throw new Error("Please correct the highlighted fields to continue");
        } else {
          throw new Error(responseData.message || `Error: ${response.status}`);
        }
      }

      setSubmitSuccess(true);

      // Clear form after successful submission
      setFormData({
        name: "",
        code: "",
        description: "",
        section_type: "COMMON",
        price: "",
        cost_price: "",
        sku: "",
        barcode: "",
        stock: "0",
        category_id: "",
        is_featured: false,
        status: "active",
      });
      setImage(null);
      setImagePreview(null);

      // Redirect to products list after successful submission
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error("Error creating product:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show field validation status
  const getInputClassName = (fieldName) => {
    return validationErrors[fieldName] ? `${styles.input} ${styles.inputError}` : styles.input;
  };

  const getSelectClassName = (fieldName) => {
    return validationErrors[fieldName] ? `${styles.select} ${styles.inputError}` : styles.select;
  };

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Add New Product</h1>
          <p>Create a new item for your restaurant menu</p>
        </div>
        <Link
          href="/dashboard/products"
          className={`${styles.addButton} ${styles.backButton}`}
          style={{ backgroundColor: "#f8f9fa", color: "#333", border: "1px solid #dee2e6" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className={styles.card}>
        {submitSuccess && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <i className="bi bi-check-circle-fill"></i>
            <div>Product created successfully! Redirecting to products list...</div>
          </div>
        )}

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>
              {error}
              {Object.keys(validationErrors).length > 0 && (
                <ul style={{ marginTop: "0.75rem", marginBottom: "0", paddingLeft: "1.5rem" }}>
                  {Object.entries(validationErrors).map(([field, errors]) => (
                    <li key={field}>{Array.isArray(errors) ? errors[0] : errors}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="name" className={styles.label}>
                Product Name <span className={styles.requiredMark}>*</span>
              </label>
              <input type="text" className={getInputClassName("name")} id="name" name="name" value={formData.name} onChange={handleChange} required />
              {validationErrors.name && <div className={styles.errorText}>{validationErrors.name[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="code" className={styles.label}>
                Product Code <span className={styles.requiredMark}>*</span>
              </label>
              <input
                type="number"
                className={getInputClassName("code")}
                id="code"
                name="code"
                placeholder="Unique numeric code"
                value={formData.code}
                onChange={handleChange}
                required
              />
              {validationErrors.code && <div className={styles.errorText}>{validationErrors.code[0]}</div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="category_id" className={styles.label}>
                Category <span className={styles.requiredMark}>*</span>
              </label>
              <select
                className={getSelectClassName("category_id")}
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {validationErrors.category_id && <div className={styles.errorText}>{validationErrors.category_id[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="section_type" className={styles.label}>
                Section Type <span className={styles.requiredMark}>*</span>
              </label>
              <select
                className={getSelectClassName("section_type")}
                id="section_type"
                name="section_type"
                value={formData.section_type}
                onChange={handleChange}
                required
              >
                <option value="COMMON">Common</option>
                <option value="AC">AC</option>
                <option value="NON_AC">NON-AC</option>
              </select>
              {validationErrors.section_type && <div className={styles.errorText}>{validationErrors.section_type[0]}</div>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              className={getInputClassName("description")}
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
            {validationErrors.description && <div className={styles.errorText}>{validationErrors.description[0]}</div>}
          </div>

          <div className={styles.inputGroup}>
            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="price" className={styles.label}>
                Selling Price ($) <span className={styles.requiredMark}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={getInputClassName("price")}
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
              {validationErrors.price && <div className={styles.errorText}>{validationErrors.price[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="cost_price" className={styles.label}>
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={getInputClassName("cost_price")}
                id="cost_price"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
              />
              {validationErrors.cost_price && <div className={styles.errorText}>{validationErrors.cost_price[0]}</div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="sku" className={styles.label}>
                SKU
              </label>
              <input type="text" className={getInputClassName("sku")} id="sku" name="sku" value={formData.sku} onChange={handleChange} />
              {validationErrors.sku && <div className={styles.errorText}>{validationErrors.sku[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="barcode" className={styles.label}>
                Barcode
              </label>
              <input
                type="text"
                className={getInputClassName("barcode")}
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
              {validationErrors.barcode && <div className={styles.errorText}>{validationErrors.barcode[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label htmlFor="stock" className={styles.label}>
                Stock Level
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className={getInputClassName("stock")}
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
              />
              {validationErrors.stock && <div className={styles.errorText}>{validationErrors.stock[0]}</div>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image" className={styles.label}>
              Product Image (Max 2MB)
            </label>
            <input type="file" className={styles.fileInput} id="image" name="image" accept="image/*" onChange={handleImageChange} />
            {validationErrors.image && <div className={styles.errorText}>{validationErrors.image[0]}</div>}

            {imagePreview && (
              <div className={styles.imagePreview}>
                <p className={styles.imagePreviewTitle}>Image Preview:</p>
                <img src={imagePreview} alt="Preview" style={{ maxHeight: "200px", borderRadius: "4px" }} />
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <div className={styles.checkboxContainer}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                />
                <label htmlFor="is_featured" className={styles.label} style={{ margin: 0 }}>
                  Featured Product
                </label>
              </div>
              {validationErrors.is_featured && <div className={styles.errorText}>{validationErrors.is_featured[0]}</div>}
            </div>

            <div className={`${styles.formGroup} ${styles.inputGroupItem}`}>
              <label className={styles.label}>
                Status <span className={styles.requiredMark}>*</span>
              </label>
              <div className={styles.radioGroup}>
                <div className={styles.radioContainer}>
                  <input
                    className={styles.radio}
                    type="radio"
                    id="status-active"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleChange}
                  />
                  <label htmlFor="status-active">Active</label>
                </div>
                <div className={styles.radioContainer}>
                  <input
                    className={styles.radio}
                    type="radio"
                    id="status-inactive"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={handleChange}
                  />
                  <label htmlFor="status-inactive">Inactive</label>
                </div>
              </div>
              {validationErrors.status && <div className={styles.errorText}>{validationErrors.status[0]}</div>}
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/dashboard/products" className={styles.cancelButton}>
              Cancel
            </Link>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span>Saving...</span>
                </>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
