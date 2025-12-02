import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  Folder,
} from "lucide-react";
import {
  estadosLineaApi,
  sectoresApi,
  lineasApi,
} from "../api/api";
import type {
  TimelineResponse,
  TimelineEstado,
  TimelineSector,
  Sector,
  Linea,
} from "../api/api";
import "./Timeline.css";

// Colores para los tipos de estado
const ESTADO_COLORS: Record<string, string> = {
  produccion: "#48bb78",
  parada_programada: "#ed8936",
  parada_no_programada: "#e53e3e",
  mantenimiento: "#667eea",
  limpieza: "#38b2ac",
  cambio_formato: "#9f7aea",
  sin_demanda: "#a0aec0",
  otro: "#4a5568",
};

// Horas del día para el header
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Pixels por hora
const PIXELS_PER_HOUR = 60;

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  estado: TimelineEstado | null;
}

function Timeline() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<number | "">("");
  const [selectedLineaId, setSelectedLineaId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    estado: null,
  });

  // Cargar sectores y líneas para filtros
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [sectoresRes, lineasRes] = await Promise.all([
          sectoresApi.list({ size: 100, activo: true }),
          lineasApi.list({ size: 100, activo: true }),
        ]);
        setSectores(sectoresRes.items);
        setLineas(lineasRes.items);
      } catch (err) {
        console.error("Error cargando filtros:", err);
      }
    };
    loadFilters();
  }, []);

  // Cargar datos del timeline
  const loadTimelineData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { sector_id?: number; linea_id?: number } = {};
      if (selectedSectorId) params.sector_id = selectedSectorId as number;
      if (selectedLineaId) params.linea_id = selectedLineaId as number;

      const data = await estadosLineaApi.getTimeline(selectedDate, params);
      setTimelineData(data);
    } catch (err) {
      console.error("Error cargando timeline:", err);
      setError("Error al cargar el timeline. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedSectorId, selectedLineaId]);

  useEffect(() => {
    loadTimelineData();
  }, [loadTimelineData]);

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar líneas según sector seleccionado
  const filteredLineas = useMemo(() => {
    if (!selectedSectorId) return lineas;
    return lineas.filter((l) => l.sector_id === selectedSectorId);
  }, [lineas, selectedSectorId]);

  // Calcular posición de la línea de hora actual
  const currentTimePosition = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate !== today) return null;

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours + minutes / 60) * PIXELS_PER_HOUR;
  }, [currentTime, selectedDate]);

  // Navegación de fechas
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Calcular posición y ancho de un estado
  const calculateEstadoPosition = (estado: TimelineEstado) => {
    const inicio = new Date(estado.fecha_hora_inicio);
    const fin = estado.fecha_hora_fin
      ? new Date(estado.fecha_hora_fin)
      : new Date(); // Si no tiene fin, usar hora actual

    // Calcular hora de inicio y fin del día seleccionado
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Ajustar inicio y fin al día seleccionado
    const effectiveStart = inicio < dayStart ? dayStart : inicio;
    const effectiveFin = fin > dayEnd ? dayEnd : fin;

    // Calcular posición en pixels
    const startHours =
      effectiveStart.getHours() + effectiveStart.getMinutes() / 60;
    const endHours = effectiveFin.getHours() + effectiveFin.getMinutes() / 60;

    const left = startHours * PIXELS_PER_HOUR;
    const width = Math.max((endHours - startHours) * PIXELS_PER_HOUR, 20); // Mínimo 20px

    return { left, width };
  };

  // Formatear hora
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatear fecha para mostrar
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Manejar hover en estado
  const handleEstadoMouseEnter = (
    e: React.MouseEvent,
    estado: TimelineEstado
  ) => {
    setTooltip({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY + 10,
      estado,
    });
  };

  const handleEstadoMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  const handleEstadoMouseMove = (e: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip({
        ...tooltip,
        x: e.clientX + 10,
        y: e.clientY + 10,
      });
    }
  };

  // Reset línea al cambiar sector
  useEffect(() => {
    setSelectedLineaId("");
  }, [selectedSectorId]);

  return (
    <div className="timeline-page">
      {/* Header */}
      <div className="timeline-header">
        <h1><Calendar className="title-icon" size={24} strokeWidth={1.5} /> Timeline de Producción</h1>
        <div className="timeline-controls">
          {/* Navegación de fechas */}
          <div className="date-navigation">
            <button onClick={goToPreviousDay}><ChevronLeft size={16} /> Anterior</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button onClick={goToNextDay}>Siguiente <ChevronRight size={16} /></button>
            <button className="btn-today" onClick={goToToday}>
              Hoy
            </button>
          </div>

          {/* Filtros */}
          <div className="timeline-filters">
            <select
              value={selectedSectorId}
              onChange={(e) =>
                setSelectedSectorId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Todos los sectores</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>

            <select
              value={selectedLineaId}
              onChange={(e) =>
                setSelectedLineaId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Todas las líneas</option>
              {filteredLineas.map((linea) => (
                <option key={linea.id} value={linea.id}>
                  {linea.nombre}
                </option>
              ))}
            </select>

            <button className="btn-refresh" onClick={loadTimelineData}>
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Fecha display */}
      <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "14px" }}>
        {formatDateDisplay(selectedDate)}
      </p>

      {/* Timeline Container */}
      <div className="timeline-container">
        {loading ? (
          <div className="timeline-loading">
            <div className="spinner"></div>
            <p>Cargando timeline...</p>
          </div>
        ) : error ? (
          <div className="timeline-empty">
            <AlertTriangle className="timeline-empty-icon-svg" size={48} strokeWidth={1.5} />
            <p>{error}</p>
            <button className="btn-refresh" onClick={loadTimelineData}>
              Reintentar
            </button>
          </div>
        ) : !timelineData ||
          timelineData.sectores.length === 0 ||
          timelineData.sectores.every((s) => s.lineas.length === 0) ? (
          <div className="timeline-empty">
            <ClipboardList className="timeline-empty-icon-svg" size={48} strokeWidth={1.5} />
            <p>No hay líneas configuradas para mostrar</p>
          </div>
        ) : (
          <div className="timeline-wrapper">
            {/* Hours Header */}
            <div className="timeline-hours-header">
              {HOURS.map((hour) => (
                <div key={hour} className="hour-column">
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Timeline Body */}
            <div className="timeline-body">
              {timelineData.sectores.map((sector: TimelineSector) => (
                <div key={sector.id} className="sector-group">
                  {/* Sector Header */}
                  <div className="sector-header">
                    <span className="sector-name">
                      <Folder size={16} strokeWidth={1.5} className="sector-icon" />
                      {sector.nombre}
                    </span>
                  </div>

                  {/* Lines */}
                  {sector.lineas.map((linea) => (
                    <div key={linea.id} className="linea-row">
                      <div className="linea-label">{linea.nombre}</div>
                      <div className="linea-timeline">
                        {/* Hour grid lines */}
                        <div className="hour-grid-lines">
                          {HOURS.map((hour) => (
                            <div key={hour} className="hour-grid-line"></div>
                          ))}
                        </div>

                        {/* Current time line */}
                        {currentTimePosition !== null && (
                          <div
                            className="current-time-line"
                            style={{ left: `${currentTimePosition}px` }}
                          >
                            <span className="current-time-label">
                              {currentTime.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}

                        {/* Estado blocks */}
                        {linea.estados.map((estado) => {
                          const { left, width } =
                            calculateEstadoPosition(estado);
                          return (
                            <div
                              key={estado.id}
                              className={`estado-block estado-${estado.tipo_estado}`}
                              style={{ left: `${left}px`, width: `${width}px` }}
                              onMouseEnter={(e) =>
                                handleEstadoMouseEnter(e, estado)
                              }
                              onMouseLeave={handleEstadoMouseLeave}
                              onMouseMove={handleEstadoMouseMove}
                            >
                              <div className="estado-content">
                                <span className="estado-tipo">
                                  {width > 60
                                    ? estado.tipo_estado_label
                                    : estado.tipo_estado_label?.substring(0, 3)}
                                </span>
                                {width > 100 && (
                                  <span className="estado-hora">
                                    {formatTime(estado.fecha_hora_inicio)}
                                    {estado.duracion_minutos && ` · ${Math.floor(estado.duracion_minutos / 60)}h ${estado.duracion_minutos % 60}m`}
                                  </span>
                                )}
                                {width > 150 && estado.observaciones && (
                                  <span className="estado-obs">
                                    {estado.observaciones.length > 25 
                                      ? estado.observaciones.substring(0, 25) + "..." 
                                      : estado.observaciones}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        {timelineData && timelineData.tipos_estado && (
          <div className="timeline-legend">
            {timelineData.tipos_estado.map((tipo) => (
              <div key={tipo.value} className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: ESTADO_COLORS[tipo.value] || "#666" }}
                ></div>
                <span>{tipo.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.estado && (
        <div
          className="estado-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <h4>{tooltip.estado.tipo_estado_label}</h4>
          <p>
            <span className="label">Línea:</span>
            <span>{tooltip.estado.linea?.nombre}</span>
          </p>
          <p>
            <span className="label">Inicio:</span>
            <span>{formatTime(tooltip.estado.fecha_hora_inicio)}</span>
          </p>
          {tooltip.estado.fecha_hora_fin && (
            <p>
              <span className="label">Fin:</span>
              <span>{formatTime(tooltip.estado.fecha_hora_fin)}</span>
            </p>
          )}
          {tooltip.estado.duracion_minutos && (
            <p>
              <span className="label">Duración:</span>
              <span>{tooltip.estado.duracion_minutos} min</span>
            </p>
          )}
          {tooltip.estado.observaciones && (
            <p>
              <span className="label">Obs:</span>
              <span>{tooltip.estado.observaciones}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Timeline;
