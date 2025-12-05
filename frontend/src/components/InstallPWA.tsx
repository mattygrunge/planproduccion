import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import "./InstallPWA.css";

/**
 * Componente para el botón de instalación de PWA
 * Se muestra solo cuando la instalación está disponible
 */
export function InstallButton() {
  const { canInstall, install, isInstalled } = usePWAInstall();

  // No mostrar si ya está instalada o no se puede instalar
  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <button className="pwa-install-btn" onClick={install} title="Instalar NexxaPlus">
      <Download size={18} strokeWidth={1.5} />
      <span>Instalar App</span>
    </button>
  );
}

/**
 * Botón compacto para el sidebar (solo icono cuando está colapsado)
 */
export function InstallButtonCompact({ collapsed = false }: { collapsed?: boolean }) {
  const { canInstall, install, isInstalled, isIOSDevice, showIOSInstallGuide } = usePWAInstall();

  // No mostrar si ya está instalada
  if (isInstalled) {
    return null;
  }

  // Para iOS: mostrar botón que abre instrucciones
  if (isIOSDevice && !canInstall) {
    return (
      <button 
        className="pwa-install-btn-compact" 
        onClick={showIOSInstallGuide}
        title="Instalar NexxaPlus"
      >
        <Smartphone size={18} strokeWidth={1.5} />
        {!collapsed && <span>Instalar App</span>}
      </button>
    );
  }

  // Para Chrome/Edge: botón de instalación normal
  if (!canInstall) {
    return null;
  }

  return (
    <button 
      className="pwa-install-btn-compact" 
      onClick={install}
      title="Instalar NexxaPlus"
    >
      <Download size={18} strokeWidth={1.5} />
      {!collapsed && <span>Instalar App</span>}
    </button>
  );
}

/**
 * Banner de instrucciones para iOS
 * Safari no soporta beforeinstallprompt, así que mostramos instrucciones manuales
 */
export function IOSInstallBanner() {
  const { isIOSDevice, isInstalled, showIOSInstructions, dismissIOSInstructions } = usePWAInstall();

  // Solo mostrar en iOS, cuando no está instalada y las instrucciones están activas
  if (!isIOSDevice || isInstalled || !showIOSInstructions) {
    return null;
  }

  return (
    <div className="ios-install-banner">
      <button 
        className="ios-install-close" 
        onClick={dismissIOSInstructions}
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>
      
      <div className="ios-install-content">
        <div className="ios-install-icon">
          <Smartphone size={32} strokeWidth={1.5} />
        </div>
        
        <div className="ios-install-text">
          <h3>Instalar NexxaPlus</h3>
          <p>Añade esta app a tu pantalla de inicio para acceso rápido</p>
        </div>
        
        <div className="ios-install-steps">
          <div className="ios-step">
            <div className="ios-step-icon">
              <Share size={20} strokeWidth={1.5} />
            </div>
            <span>Toca el botón <strong>Compartir</strong></span>
          </div>
          
          <div className="ios-step">
            <div className="ios-step-icon">
              <PlusSquare size={20} strokeWidth={1.5} />
            </div>
            <span>Selecciona <strong>"Añadir a inicio"</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal completo de instrucciones para iOS
 */
export function IOSInstallModal() {
  const { isIOSDevice, isInstalled, showIOSInstructions, dismissIOSInstructions } = usePWAInstall();

  if (!isIOSDevice || isInstalled || !showIOSInstructions) {
    return null;
  }

  return (
    <div className="ios-install-modal-overlay" onClick={dismissIOSInstructions}>
      <div className="ios-install-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="ios-modal-close" 
          onClick={dismissIOSInstructions}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        
        <div className="ios-modal-header">
          <div className="ios-modal-icon">
            {/* Placeholder: reemplazar con el logo de la app */}
            <img 
              src="/icons/icon-192.png" 
              alt="NexxaPlus"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Smartphone size={48} strokeWidth={1.5} className="ios-modal-fallback-icon" />
          </div>
          <h2>Instalar NexxaPlus</h2>
          <p>Accede más rápido desde tu pantalla de inicio</p>
        </div>
        
        <div className="ios-modal-steps">
          <div className="ios-modal-step">
            <div className="ios-modal-step-number">1</div>
            <div className="ios-modal-step-content">
              <div className="ios-modal-step-icon">
                <Share size={24} strokeWidth={1.5} />
              </div>
              <div className="ios-modal-step-text">
                <strong>Toca el botón Compartir</strong>
                <span>En la barra de navegación de Safari</span>
              </div>
            </div>
          </div>
          
          <div className="ios-modal-step">
            <div className="ios-modal-step-number">2</div>
            <div className="ios-modal-step-content">
              <div className="ios-modal-step-icon">
                <PlusSquare size={24} strokeWidth={1.5} />
              </div>
              <div className="ios-modal-step-text">
                <strong>Añadir a pantalla de inicio</strong>
                <span>Desplázate y selecciona esta opción</span>
              </div>
            </div>
          </div>
          
          <div className="ios-modal-step">
            <div className="ios-modal-step-number">3</div>
            <div className="ios-modal-step-content">
              <div className="ios-modal-step-icon">
                <Download size={24} strokeWidth={1.5} />
              </div>
              <div className="ios-modal-step-text">
                <strong>Confirmar</strong>
                <span>Toca "Añadir" para instalar</span>
              </div>
            </div>
          </div>
        </div>
        
        <button className="ios-modal-dismiss" onClick={dismissIOSInstructions}>
          Entendido
        </button>
      </div>
    </div>
  );
}

/**
 * Componente completo que incluye botón e instrucciones iOS
 */
export function InstallPWA() {
  return (
    <>
      <InstallButton />
      <IOSInstallModal />
    </>
  );
}

export default InstallPWA;
