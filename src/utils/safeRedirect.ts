export const safeRedirect = (search: string): string => {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (!redirect) return '/';
  if (!redirect.startsWith('/')) return '/';
  if (redirect.startsWith('//')) return '/';
  return redirect;
};
