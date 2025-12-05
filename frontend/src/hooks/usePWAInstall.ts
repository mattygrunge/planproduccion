import { useEffect, useState, useCallback } from "react";

/**
 * Tipo extendido para el evento beforeinstallprompt
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Detecta si el dispositivo es iOS
 */
const isIOS = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * Detecta si el dispositivo es Android
 */
const isAndroid = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

/**
 * Detecta si la app ya está instalada (modo standalone)
 */
const isStandalone = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
};

/**
 * Detecta si es Safari en iOS
 */
const isIOSSafari = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios|mercury/.test(userAgent);
  return isIos && isSafari;
};

export interface PWAInstallState {
  /** Si la PWA puede ser instalada (Chrome/Edge en desktop/Android) */
  canInstall: boolean;
  /** Si es iOS y necesita instrucciones manuales */
  isIOSDevice: boolean;
  /** Si es Android */
  isAndroidDevice: boolean;
  /** Si la app ya está en modo standalone */
  isInstalled: boolean;
  /** Si se mostró el banner de iOS */
  showIOSInstructions: boolean;
  /** Función para disparar el prompt de instalación nativo */
  install: () => Promise<void>;
  /** Función para cerrar las instrucciones de iOS */
  dismissIOSInstructions: () => void;
  /** Función para mostrar las instrucciones de iOS */
  showIOSInstallGuide: () => void;
}

const IOS_DISMISSED_KEY = "pwa-ios-instructions-dismissed";

/**
 * Hook para manejar la instalación de PWA
 * 
 * Soporta:
 * - Chrome/Edge en PC y Android (evento beforeinstallprompt)
 * - Safari en iOS (instrucciones manuales)
 * 
 * @example
 * ```tsx
 * const { canInstall, install, isIOSDevice, showIOSInstructions } = usePWAInstall();
 * 
 * if (canInstall) {
 *   return <button onClick={install}>Instalar App</button>;
 * }
 * 
 * if (isIOSDevice && showIOSInstructions) {
 *   return <IOSInstallInstructions />;
 * }
 * ```
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  // Inicializar con el valor actual para evitar setState en useEffect
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isIOSDevice = isIOS();
  const isAndroidDevice = isAndroid();

  // Escuchar cambios en display-mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Escuchar el evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que Chrome muestre el mini-infobar automáticamente
      e.preventDefault();
      // Guardar el evento para usarlo después
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      console.log("[PWA] Evento beforeinstallprompt capturado");
    };

    const handleAppInstalled = () => {
      console.log("[PWA] App instalada exitosamente");
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Para iOS: verificar si debemos mostrar instrucciones
  useEffect(() => {
    if (isIOSDevice && isIOSSafari() && !isStandalone()) {
      // Verificar si el usuario ya cerró las instrucciones
      const dismissed = localStorage.getItem(IOS_DISMISSED_KEY);
      if (!dismissed) {
        // Mostrar después de 3 segundos para no interrumpir
        const timer = setTimeout(() => {
          setShowIOSInstructions(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isIOSDevice]);

  /**
   * Disparar el prompt de instalación nativo (Chrome/Edge)
   */
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn("[PWA] No hay prompt de instalación disponible");
      return;
    }

    try {
      // Mostrar el prompt
      await deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log("[PWA] Resultado de instalación:", choiceResult.outcome);
      
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] Usuario aceptó instalar");
      } else {
        console.log("[PWA] Usuario rechazó instalar");
      }
      
      // Limpiar el prompt (solo se puede usar una vez)
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error("[PWA] Error al mostrar prompt de instalación:", error);
    }
  }, [deferredPrompt]);

  /**
   * Cerrar las instrucciones de iOS y guardar preferencia
   */
  const dismissIOSInstructions = useCallback(() => {
    setShowIOSInstructions(false);
    localStorage.setItem(IOS_DISMISSED_KEY, "true");
  }, []);

  /**
   * Mostrar las instrucciones de iOS manualmente
   */
  const showIOSInstallGuide = useCallback(() => {
    setShowIOSInstructions(true);
    // Limpiar la preferencia de dismiss
    localStorage.removeItem(IOS_DISMISSED_KEY);
  }, []);

  return {
    canInstall,
    isIOSDevice,
    isAndroidDevice,
    isInstalled,
    showIOSInstructions,
    install,
    dismissIOSInstructions,
    showIOSInstallGuide,
  };
}

export default usePWAInstall;
