import { safeRedirect } from '../safeRedirect';

describe('safeRedirect', () => {
  it('returns "/" when no redirect param is present', () => {
    expect(safeRedirect('')).toBe('/');
    expect(safeRedirect('?foo=bar')).toBe('/');
  });

  it('returns the redirect value when it starts with a single "/"', () => {
    expect(safeRedirect('?redirect=/profile')).toBe('/profile');
    expect(safeRedirect('?redirect=/decks/abc%2Fxyz')).toBe('/decks/abc/xyz');
    expect(safeRedirect('?redirect=/cards%3Fpage%3D2')).toBe('/cards?page=2');
  });

  it('rejects redirect values that do not start with "/"', () => {
    expect(safeRedirect('?redirect=https://evil.com')).toBe('/');
    expect(safeRedirect('?redirect=javascript:alert(1)')).toBe('/');
    expect(safeRedirect('?redirect=profile')).toBe('/');
  });

  it('rejects protocol-relative URLs that start with "//"', () => {
    expect(safeRedirect('?redirect=//evil.com')).toBe('/');
    expect(safeRedirect('?redirect=//evil.com/profile')).toBe('/');
  });
});
