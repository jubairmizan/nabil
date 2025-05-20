"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoryDebugPage() {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [testUser, setTestUser] = useState(null);
  const [manualToken, setManualToken] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Get stored user info
    const userJson = localStorage.getItem("user");
    let user = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
      setTestUser(user);
    } catch (e) {
      console.error("Error parsing user JSON:", e);
    }

    // Run authentication test
    const runTests = async () => {
      const results = {
        hasLocalStorage: !!window.localStorage,
        userInStorage: !!userJson,
        validUserJson: !!user,
        hasToken: user && !!user.token,
        tokenLength: user && user.token ? user.token.length : 0,
        tokenStart: user && user.token ? `${user.token.substring(0, 15)}...` : "N/A",
      };

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, []);

  const generateTestUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password",
        }),
      });

      const data = await response.json();
      console.log("Generated test token:", data);

      // Store in localStorage
      if (data.token) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          token: data.token,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setTestUser(userData);

        // Re-run tests
        const results = {
          ...testResults,
          userInStorage: true,
          validUserJson: true,
          hasToken: true,
          tokenLength: data.token.length,
          tokenStart: `${data.token.substring(0, 15)}...`,
          lastAction: "Generated and stored new test token",
        };

        setTestResults(results);
      }
    } catch (e) {
      console.error("Error generating test token:", e);
      setTestResults({
        ...testResults,
        lastAction: "Error: " + e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearUserData = () => {
    localStorage.removeItem("user");
    setTestUser(null);
    setTestResults({
      ...testResults,
      userInStorage: false,
      validUserJson: false,
      hasToken: false,
      tokenLength: 0,
      tokenStart: "N/A",
      lastAction: "Cleared user data from localStorage",
    });
  };

  const testApiWithToken = async () => {
    try {
      setLoading(true);

      // Use token from localStorage or manual input
      const token = testUser?.token || manualToken;

      if (!token) {
        setApiResponse({
          error: "No token available for testing",
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        data: data,
      };

      setApiResponse(responseInfo);
      console.log("API test response:", responseInfo);
    } catch (e) {
      console.error("Error testing API:", e);
      setApiResponse({
        error: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h1 className="h4 mb-0">
            <i className="bi bi-gear-fill me-2"></i>
            Authentication Debug Page
          </h1>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4">Use this tool to test authentication and API connectivity</p>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-hdd-network me-2"></i>
                API Configuration
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-0">
                <strong>
                  <i className="bi bi-link-45deg me-1"></i>API Base URL:
                </strong>{" "}
                {API_BASE_URL}
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-shield-lock me-2"></i>
                Authentication Tests
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary me-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mb-0 h5">Running tests...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th scope="row" style={{ width: "250px" }}>
                          LocalStorage Available
                        </th>
                        <td>
                          {testResults.hasLocalStorage ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle-fill me-1"></i>Yes
                            </span>
                          ) : (
                            <span className="text-danger">
                              <i className="bi bi-x-circle-fill me-1"></i>No
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">User Data in Storage</th>
                        <td>
                          {testResults.userInStorage ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle-fill me-1"></i>Yes
                            </span>
                          ) : (
                            <span className="text-danger">
                              <i className="bi bi-x-circle-fill me-1"></i>No
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Valid User JSON</th>
                        <td>
                          {testResults.validUserJson ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle-fill me-1"></i>Yes
                            </span>
                          ) : (
                            <span className="text-danger">
                              <i className="bi bi-x-circle-fill me-1"></i>No
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Has Auth Token</th>
                        <td>
                          {testResults.hasToken ? (
                            <span className="text-success">
                              <i className="bi bi-check-circle-fill me-1"></i>Yes
                            </span>
                          ) : (
                            <span className="text-danger">
                              <i className="bi bi-x-circle-fill me-1"></i>No
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Token Length</th>
                        <td>{testResults.tokenLength}</td>
                      </tr>
                      <tr>
                        <th scope="row">Token Start</th>
                        <td>
                          <code>{testResults.tokenStart}</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {testResults.lastAction && (
                    <div className="alert alert-info mt-3">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      <strong>Last Action:</strong> {testResults.lastAction}
                    </div>
                  )}
                </div>
              )}

              <div className="d-flex gap-2 mt-3">
                <button onClick={generateTestUser} className="btn btn-success" disabled={loading}>
                  <i className="bi bi-person-plus-fill me-1"></i> Generate Test Token
                </button>

                <button onClick={clearUserData} className="btn btn-danger" disabled={loading}>
                  <i className="bi bi-trash3-fill me-1"></i> Clear User Data
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-send-check me-2"></i>
                Manual API Test
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="manualToken" className="form-label">
                  Manual Token (optional, uses stored token by default)
                </label>
                <input
                  type="text"
                  id="manualToken"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="form-control"
                  placeholder="Enter token manually for testing"
                />
              </div>

              <button onClick={testApiWithToken} className="btn btn-primary" disabled={loading}>
                <i className="bi bi-send me-1"></i> Test Categories API
              </button>

              {apiResponse && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-2">
                    <i className="bi bi-arrow-return-right me-1"></i>
                    API Response:
                  </h6>
                  {apiResponse.error ? (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {apiResponse.error}
                    </div>
                  ) : (
                    <div className="card bg-light">
                      <div className="card-body">
                        <p className="mb-1">
                          <strong>Status:</strong> {apiResponse.status} {apiResponse.statusText}
                        </p>
                        <div className="mt-2">
                          <p className="mb-1">
                            <strong>Data:</strong>
                          </p>
                          <pre className="bg-dark text-light p-3 rounded mt-1 overflow-auto" style={{ maxHeight: "300px" }}>
                            {JSON.stringify(apiResponse.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Link href="/dashboard/categories" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i> Back to Categories
        </Link>
      </div>
    </div>
  );
}
