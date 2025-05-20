"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import styles from "../../products/products.module.css";

function AddUserPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", // Default role is user
    assigned_section: "ALL", // Default assigned section
    shift_id: "", // Default shift id is empty
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const router = useRouter();

  // Fetch shifts when component mounts
  useEffect(() => {
    const fetchShifts = async () => {
      if (formData.role === "billing_counter") {
        try {
          setIsLoadingShifts(true);
          const user = localStorage.getItem("user");
          if (!user) {
            router.push("/login");
            return;
          }

          const userData = JSON.parse(user);
          const token = userData.token || getAuthToken();

          if (!token) {
            throw new Error("Authentication token missing");
          }

          const response = await fetch(`${getApiBaseUrl()}/api/active-shifts`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }

          const shiftsData = await response.json();
          setShifts(shiftsData);
        } catch (error) {
          console.error("Error fetching shifts:", error);
          Swal.fire({
            icon: "error",
            title: "Failed to Load Shifts",
            text: "There was a problem loading the shifts. Please try again.",
            confirmButtonColor: "#EF4444",
          });
        } finally {
          setIsLoadingShifts(false);
        }
      }
    };

    fetchShifts();
  }, [formData.role, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // If role changes to billing_counter, clear shift_id errors
    if (name === "role" && value !== "billing_counter") {
      setFormData((prev) => ({
        ...prev,
        shift_id: "",
      }));

      if (errors.shift_id) {
        setErrors((prev) => ({
          ...prev,
          shift_id: null,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Validate shift_id if role is billing_counter
    if (formData.role === "billing_counter" && !formData.shift_id) {
      newErrors.shift_id = "Shift is required for billing counter users";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = localStorage.getItem("user");
      if (!user) {
        router.push("/login");
        return;
      }

      const userData = JSON.parse(user);
      const token = userData.token || getAuthToken();

      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await fetch(`${getApiBaseUrl()}/api/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors from server
        if (response.status === 422 && errorData.errors) {
          setErrors(errorData.errors);
          throw new Error("Validation failed");
        }

        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "User added successfully",
        confirmButtonColor: "#10B981",
      });

      router.push("/dashboard/users");
    } catch (error) {
      console.error("Error creating user:", error);

      if (error.message !== "Validation failed") {
        Swal.fire({
          icon: "error",
          title: "Failed to Create User",
          text: error.message || "There was a problem creating the user",
          confirmButtonColor: "#EF4444",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
  };

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Add New User</h1>
          <p>Create a new user account with access to the system</p>
        </div>
        <Link
          href="/dashboard/users"
          className={`${styles.addButton} ${styles.backButton}`}
          style={{ backgroundColor: "#f8f9fa", color: "#333", border: "1px solid #dee2e6" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Users</span>
        </Link>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="name" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Full Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? styles.inputError : styles.input}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.name ? "1px solid #e74c3c" : "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
              placeholder="Enter full name"
            />
            {errors.name && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.name}
              </div>
            )}
          </div>

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Email Address*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? styles.inputError : styles.input}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.email ? "1px solid #e74c3c" : "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
              placeholder="Enter email address"
            />
            {errors.email && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.email}
              </div>
            )}
          </div>

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="role" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              User Role*
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
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
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="billing_counter">Billing Counter</option>
              <option value="kitchen">Kitchen</option>
              <option value="waiter">Waiter</option>
              <option value="manager">Manager</option>
              <option value="store">Store</option>
            </select>
          </div>

          {/* Show shift selection only if role is billing_counter */}
          {formData.role === "billing_counter" && (
            <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
              <label htmlFor="shift_id" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Assigned Shift*
              </label>
              <select
                id="shift_id"
                name="shift_id"
                value={formData.shift_id}
                onChange={handleChange}
                className={errors.shift_id ? styles.inputError : styles.select}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: errors.shift_id ? "1px solid #e74c3c" : "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  backgroundColor: "white",
                }}
                disabled={isLoadingShifts}
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                  </option>
                ))}
              </select>
              {isLoadingShifts && <div style={{ fontSize: "0.8rem", marginTop: "5px", color: "#666" }}>Loading shifts...</div>}
              {errors.shift_id && (
                <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                  {errors.shift_id}
                </div>
              )}
            </div>
          )}

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="assigned_section" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Assigned Section*
            </label>
            <select
              id="assigned_section"
              name="assigned_section"
              value={formData.assigned_section}
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
              <option value="ALL">All Sections</option>
              <option value="AC">AC Section</option>
              <option value="NON_AC">Non-AC Section</option>
            </select>
            {errors.assigned_section && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.assigned_section}
              </div>
            )}
          </div>

          <div className={styles.formGroup} style={{ marginBottom: "25px" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Password*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? styles.inputError : styles.input}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.password ? "1px solid #e74c3c" : "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
              placeholder="Enter password (min. 8 characters)"
            />
            {errors.password && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.password}
              </div>
            )}
          </div>

          <div className={styles.formActions} style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <Link
              href="/dashboard/users"
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
              disabled={isSubmitting}
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
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
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
                "Save User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedAddUserPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AddUserPage />
    </RouteGuard>
  );
}
