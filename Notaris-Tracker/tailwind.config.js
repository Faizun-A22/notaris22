/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Spec design tokens
        primary: '#10B981',
        'primary-dark': '#059669',
        'primary-soft': '#ECFDF5',
        background: '#F8F9FA',
        surface: '#FFFFFF',
        text: '#0F172A',
        muted: '#64748B',
        alert: '#DC2626',
        success: '#10B981',
        warning: '#F59E0B',
        purple: '#7C3AED',

        // Legacy mapping for compatibility
        "surface-container-high": "#f3f4f6",
        "tertiary-container": "#f3f4f6",
        "primary-container": "#ecfdf5",
        "on-primary": "#ffffff",
        "outline": "#64748b",
        "on-secondary-fixed": "#0f172a",
        "on-surface": "#0f172a",
        "on-surface-variant": "#64748b",
        "inverse-on-surface": "#f8f9fa",
        "on-primary-fixed": "#0f172a",
        "on-background": "#0f172a",
        "surface-dim": "#f3f4f6",
        "tertiary": "#7c3aed",
        "error": "#dc2626",
        "surface-container-low": "#f8f9fa",
        "tertiary-fixed": "#f3f4f6",
        "primary-fixed": "#10b981",
        "surface-tint": "#10b981",
        "on-tertiary-fixed": "#0f172a",
        "surface-bright": "#ffffff",
        "secondary": "#059669",
        "on-tertiary-container": "#0f172a",
        "on-primary-container": "#059669",
        "on-primary-fixed-variant": "#059669",
        "secondary-fixed-dim": "#10b981",
        "on-tertiary-fixed-variant": "#64748b",
        "outline-variant": "#e5e7eb",
        "on-secondary-container": "#059669",
        "error-container": "#fef2f2",
        "surface-container": "#ffffff",
        "surface-container-highest": "#e5e7eb",
        "on-error": "#ffffff",
        "on-error-container": "#dc2626",
        "tertiary-fixed-dim": "#e5e7eb",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#0f172a",
        "surface-variant": "#f3f4f6",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#ecfdf5",
        "secondary-container": "#ecfdf5",
        "on-secondary-fixed-variant": "#059669",
        "primary-fixed-dim": "#10b981",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#ecfdf5"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter-grid": "24px",
        "stack-lg": "24px",
        "stack-md": "16px",
        "margin-page": "32px",
        "card-padding": "24px",
        "base": "4px",
        "stack-sm": "8px"
      },
      fontFamily: {
        "headline-md": ["Plus Jakarta Sans"],
        "body-md": ["Inter"],
        "headline-lg": ["Plus Jakarta Sans"],
        "body-lg": ["Inter"],
        "headline-sm": ["Plus Jakarta Sans"],
        "label-bold": ["Inter"],
        "label-sm": ["Inter"]
      },
      fontSize: {
        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-lg": ["30px", {"lineHeight": "38px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-sm": ["18px", {"lineHeight": "26px", "fontWeight": "600"}],
        "label-bold": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "400"}]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}


