const avatar = (color) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><circle cx="32" cy="25" r="11" fill="white"/><path d="M12 58c1-12 9-19 20-19s19 7 20 19" fill="white"/></svg>`
)}`;

const DEFAULT_AVATARS = {
  customer: avatar('#047857'),
  worker: avatar('#0f766e'),
  expert: avatar('#1d4ed8'),
  admin: avatar('#6d28d9')
};

export const getSafeAvatar = (url, role = 'customer') =>
  url && typeof url === 'string' && url.trim().length > 5 && !url.includes('placeholder')
    ? url : DEFAULT_AVATARS[role] || DEFAULT_AVATARS.customer;
