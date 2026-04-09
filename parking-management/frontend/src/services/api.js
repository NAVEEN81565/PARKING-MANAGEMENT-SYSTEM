const BASE_URL = 'http://127.0.0.1:8000/api/v1';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('pms_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const apiFetch = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;
  
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers,
    },
  };

  if (options.body && !isFormData && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (response.status === 204) {
    return { success: true };
  }
  
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  
  if (!response.ok) {
    // Extract human-readable message from various backend error formats
    let message = data.detail || data.error || data.message;
    if (!message && data.errors) {
      // DRF validation errors: { errors: { field: ["msg", ...] } }
      const firstField = Object.keys(data.errors)[0];
      const firstMsg = data.errors[firstField];
      message = Array.isArray(firstMsg) ? firstMsg[0] : String(firstMsg);
      // Capitalize field name prefix for readability
      if (firstField !== 'non_field_errors') {
        message = `${firstField.charAt(0).toUpperCase() + firstField.slice(1).replace(/_/g, ' ')}: ${message}`;
      }
    }
    message = message || 'An error occurred';
    throw { status: response.status, data, message };
  }
  
  return data;
};
