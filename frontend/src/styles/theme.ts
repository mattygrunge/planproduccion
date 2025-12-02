/**
 * AGROFACIL - Sistema de Planificación de Producción
 * Archivo de tema centralizado
 * 
 * Este archivo contiene todos los colores y variables de diseño.
 * NO usar colores hardcodeados en la aplicación.
 * Siempre importar desde este archivo.
 */

export const theme = {
  colors: {
    // Colores principales del logo AGROFACIL
    primary: "#4FAE4E",        // Verde medio - Color principal
    secondary: "#9DDF2C",      // Verde claro - Acentos y highlights
    accent: "#1A756F",         // Verde oscuro/teal - Elementos destacados
    gray: "#C8C8C8",           // Gris del icono
    
    // Colores de fondo y texto
    background: "#F7F9F8",     // Fondo general claro
    backgroundDark: "#E8EEEA", // Fondo alternativo
    text: "#1B1B1B",           // Texto principal oscuro
    textLight: "#6B7280",      // Texto secundario
    textInverse: "#FFFFFF",    // Texto sobre fondos oscuros
    
    // Colores de estado
    danger: "#D9534F",         // Estados críticos / errores
    warning: "#F0AD4E",        // Estados de advertencia
    success: "#5CB85C",        // Estados normales / éxito
    info: "#5BC0DE",           // Información
    
    // Colores adicionales para UI
    white: "#FFFFFF",
    black: "#000000",
    border: "#E5E7EB",         // Bordes sutiles
    borderDark: "#D1D5DB",     // Bordes más marcados
    shadow: "rgba(0, 0, 0, 0.1)", // Sombras
    
    // Estados de hover (versiones más oscuras)
    primaryHover: "#3D9D3C",
    secondaryHover: "#8BC926",
    accentHover: "#145D58",
    dangerHover: "#C9433F",
    warningHover: "#E09D3E",
    successHover: "#4CA84C",
  },
  
  // Espaciados
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  
  // Tipografía
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSizeSm: "12px",
    fontSizeBase: "14px",
    fontSizeMd: "16px",
    fontSizeLg: "18px",
    fontSizeXl: "24px",
    fontSizeXxl: "32px",
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
  },
  
  // Bordes
  borders: {
    radiusSm: "4px",
    radiusMd: "8px",
    radiusLg: "12px",
    radiusXl: "16px",
    radiusFull: "9999px",
  },
  
  // Sombras
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
  },
  
  // Transiciones
  transitions: {
    fast: "150ms ease",
    normal: "250ms ease",
    slow: "350ms ease",
  },
  
  // Breakpoints para responsive
  breakpoints: {
    mobile: "480px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
    ultrawide: "1536px",
  },
  
  // Layout
  layout: {
    sidebarWidth: "260px",
    sidebarCollapsedWidth: "70px",
    headerHeight: "64px",
    maxContentWidth: "1400px",
    containerPadding: "24px",
  },
};

// Exportar colores como CSS custom properties para uso en archivos CSS
export const cssVariables = `
  :root {
    /* Colores principales */
    --color-primary: ${theme.colors.primary};
    --color-secondary: ${theme.colors.secondary};
    --color-accent: ${theme.colors.accent};
    --color-gray: ${theme.colors.gray};
    
    /* Fondos y textos */
    --color-background: ${theme.colors.background};
    --color-background-dark: ${theme.colors.backgroundDark};
    --color-text: ${theme.colors.text};
    --color-text-light: ${theme.colors.textLight};
    --color-text-inverse: ${theme.colors.textInverse};
    
    /* Estados */
    --color-danger: ${theme.colors.danger};
    --color-warning: ${theme.colors.warning};
    --color-success: ${theme.colors.success};
    --color-info: ${theme.colors.info};
    
    /* UI */
    --color-white: ${theme.colors.white};
    --color-black: ${theme.colors.black};
    --color-border: ${theme.colors.border};
    --color-border-dark: ${theme.colors.borderDark};
    --color-shadow: ${theme.colors.shadow};
    
    /* Hover states */
    --color-primary-hover: ${theme.colors.primaryHover};
    --color-secondary-hover: ${theme.colors.secondaryHover};
    --color-accent-hover: ${theme.colors.accentHover};
    --color-danger-hover: ${theme.colors.dangerHover};
    --color-warning-hover: ${theme.colors.warningHover};
    --color-success-hover: ${theme.colors.successHover};
    
    /* Spacing */
    --spacing-xs: ${theme.spacing.xs};
    --spacing-sm: ${theme.spacing.sm};
    --spacing-md: ${theme.spacing.md};
    --spacing-lg: ${theme.spacing.lg};
    --spacing-xl: ${theme.spacing.xl};
    --spacing-xxl: ${theme.spacing.xxl};
    
    /* Typography */
    --font-family: ${theme.typography.fontFamily};
    --font-size-sm: ${theme.typography.fontSizeSm};
    --font-size-base: ${theme.typography.fontSizeBase};
    --font-size-md: ${theme.typography.fontSizeMd};
    --font-size-lg: ${theme.typography.fontSizeLg};
    --font-size-xl: ${theme.typography.fontSizeXl};
    --font-size-xxl: ${theme.typography.fontSizeXxl};
    
    /* Borders */
    --border-radius-sm: ${theme.borders.radiusSm};
    --border-radius-md: ${theme.borders.radiusMd};
    --border-radius-lg: ${theme.borders.radiusLg};
    --border-radius-xl: ${theme.borders.radiusXl};
    
    /* Shadows */
    --shadow-sm: ${theme.shadows.sm};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-xl: ${theme.shadows.xl};
    
    /* Transitions */
    --transition-fast: ${theme.transitions.fast};
    --transition-normal: ${theme.transitions.normal};
    --transition-slow: ${theme.transitions.slow};
    
    /* Layout */
    --sidebar-width: ${theme.layout.sidebarWidth};
    --sidebar-collapsed-width: ${theme.layout.sidebarCollapsedWidth};
    --header-height: ${theme.layout.headerHeight};
    --max-content-width: ${theme.layout.maxContentWidth};
    --container-padding: ${theme.layout.containerPadding};
  }
`;

export default theme;
