const API = '/api';

export async function fetchContent() {
  const res = await fetch(`${API}/content`);
  if (!res.ok) throw new Error('Failed to load content');
  return res.json();
}

export async function saveContent(content) {
  const res = await fetch(`${API}/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(content)
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

export async function checkAuth() {
  const res = await fetch(`${API}/auth/status`, { credentials: 'same-origin' });
  return res.json();
}

export async function login(password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'same-origin' });
}

export async function uploadFile(type, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API}/upload/${type}`, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function sendContact(form) {
  const res = await fetch(`${API}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send');
  return data;
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
