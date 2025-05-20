"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import styles from "../../../products/products.module.css";

function EditShiftPage({ params }) {
  // Unwrap params properly using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [shift, setShift] = useState({
    name: "",
    start_time: "",
    end_time: "",
    description: "",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const [existingShifts, setExistingShifts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = localStorage.getItem("user");
        if (!user) {
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(user);
        const token = parsedUser.token || getAuthToken();

        if (!token) {
          throw new Error("Authentication token is missing");
        }

        // Fetch the current shift
        const shiftResponse = await fetch(`${getApiBaseUrl()}/api/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!shiftResponse.ok) {
          throw new Error(`Error: ${shiftResponse.status}`);
        }

        const shiftData = await shiftResponse.json();
        setShift(shiftData);

        // Fetch all shifts for overlap validation
        const shiftsResponse = await fetch(`${getApiBaseUrl()}/api/shifts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!shiftsResponse.ok) {
          throw new Error(`Error: ${shiftsResponse.status}`);
        }

        const shiftsData = await shiftsResponse.json();
        // Filter out the current shift from the list of existing shifts
        setExistingShifts(shiftsData.filter((s) => s.id !== parseInt(id)));
      } catch (err) {
        setFetchError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShift({
      ...shift,
      [name]: value,
    });
  };

  const isTimeOverlapping = (newStart, newEnd, existingStart, existingEnd) => {
    // Convert times to minutes for easier comparison
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = timeToMinutes(newStart);
    const newEndMinutes = timeToMinutes(newEnd);
    const existingStartMinutes = timeToMinutes(existingStart);
    const existingEndMinutes = timeToMinutes(existingEnd);

    // Handle overnight shifts (e.g., 8pm to 8am)
    const isExistingOvernight = existingEndMinutes < existingStartMinutes;
    const isNewOvernight = newEndMinutes < newStartMinutes;

    if (isExistingOvernight) {
      // For overnight shifts, we check if the new shift overlaps with either part
      if (isNewOvernight) {
        // Both shifts are overnight, they'll always overlap unless one ends when another starts
        return !(newEndMinutes === existingStartMinutes || existingEndMinutes === newStartMinutes);
      } else {
        // New shift is within a day, check if it overlaps with either part of the overnight shift
        return newStartMinutes < existingEndMinutes || newEndMinutes > existingStartMinutes;
      }
    } else if (isNewOvernight) {
      // Existing shift is within a day, new shift is overnight
      return existingStartMinutes < newEndMinutes || existingEndMinutes > newStartMinutes;
    } else {
      // Both shifts are within the same day, standard overlap check
      return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!shift.name.trim()) {
      newErrors.name = "Shift name is required";
    }

    // Check if start_time is before end_time (for shifts within the same day)
    if (shift.start_time >= shift.end_time && shift.start_time !== "00:00" && shift.end_time !== "00:00") {
      // Only show this error if it's not an overnight shift
      if (!(shift.start_time > "12:00" && shift.end_time < "12:00")) {
        newErrors.time_conflict = "Start time must be before end time";
      }
    }

    // Check for time conflicts with existing shifts
    const overlappingShift = existingShifts.find((existingShift) =>
      isTimeOverlapping(shift.start_time, shift.end_time, existingShift.start_time, existingShift.end_time)
    );

    if (overlappingShift) {
      // Format times for readability
      const formatTime = (timeStr) => {
        const date = new Date(`2000-01-01T${timeStr}`);
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
      };

      newErrors.time_conflict = `Time conflict with shift "${overlappingShift.name}" (${formatTime(overlappingShift.start_time)} - ${formatTime(
        overlappingShift.end_time
      )})`;
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

      // Format time values to ensure they match the 'H:i' format expected by the backend
      const formattedShift = {
        ...shift,
        start_time: formatTimeToHi(shift.start_time),
        end_time: formatTimeToHi(shift.end_time),
      };

      const response = await fetch(`${getApiBaseUrl()}/api/shifts/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedShift),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.errors) {
          setErrors(errorData.errors);
          throw new Error("Validation failed");
        }

        throw new Error(errorData.message || "Failed to update shift");
      }

      router.push("/dashboard/shifts");
    } catch (err) {
      console.error("Error updating shift:", err);
      if (err.message !== "Validation failed") {
        alert(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format time to H:i format
  const formatTimeToHi = (timeStr) => {
    if (!timeStr) return "";

    // If the time string already contains seconds, remove them
    if (timeStr.split(":").length > 2) {
      const [hours, minutes] = timeStr.split(":");
      return `${hours}:${minutes}`;
    }

    return timeStr;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading shift...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.productsContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>!</div>
          <h2>Error Loading Shift</h2>
          <p>{fetchError}</p>
          <div className={styles.errorDetails}>
            <p>
              <strong>API URL:</strong> {getApiBaseUrl()}/api/shifts/{id}
            </p>
          </div>
          <Link href="/dashboard/shifts" className={styles.addButton}>
            Back to Shifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Edit Shift</h1>
          <p>Update the shift details</p>
        </div>
        <Link
          href="/dashboard/shifts"
          className={`${styles.addButton} ${styles.backButton}`}
          style={{ backgroundColor: "#f8f9fa", color: "#333", border: "1px solid #dee2e6" }}
        >
          <ArrowLeft size={16} />
          <span>Back to Shifts</span>
        </Link>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="name" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Shift Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={shift.name}
              onChange={handleChange}
              className={errors.name ? styles.inputError : styles.input}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: errors.name ? "1px solid #e74c3c" : "1px solid #dee2e6",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
              placeholder="Enter shift name"
            />
            {errors.name && (
              <div className={styles.errorMessage} style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: "5px" }}>
                {errors.name}
              </div>
            )}
          </div>

          <div className={styles.formRow} style={{ display: "flex", gap: "20px", marginBottom: errors.time_conflict ? "5px" : "20px" }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="start_time" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Start Time*
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={shift.start_time}
                onChange={handleChange}
                required
                className={errors.time_conflict ? styles.inputError : styles.input}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: errors.time_conflict ? "1px solid #e74c3c" : "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="end_time" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                End Time*
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={shift.end_time}
                onChange={handleChange}
                required
                className={errors.time_conflict ? styles.inputError : styles.input}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: errors.time_conflict ? "1px solid #e74c3c" : "1px solid #dee2e6",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          {errors.time_conflict && (
            <div
              className={styles.errorMessage}
              style={{
                color: "#e74c3c",
                fontSize: "0.9rem",
                marginTop: "5px",
                marginBottom: "20px",
                backgroundColor: "#feeaea",
                padding: "10px",
                borderRadius: "5px",
                borderLeft: "3px solid #e74c3c",
              }}
            >
              <strong>Time Conflict:</strong> {errors.time_conflict}
            </div>
          )}

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label htmlFor="description" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={shift.description || ""}
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
              placeholder="Enter shift description"
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
              value={shift.status}
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
              href="/dashboard/shifts"
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
                "Update Shift"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedEditShiftPage({ params }) {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <EditShiftPage params={params} />
    </RouteGuard>
  );
}
