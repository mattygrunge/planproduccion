import { useState } from "react";
import "./App.css";

function App() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    setHealthStatus(null);

    try {
      const response = await fetch("http://localhost:8000/health");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Plan Producción</h1>
      <h2>FASE 0 - Prueba de Conexión</h2>

      <div className="card">
        <button onClick={checkHealth} disabled={loading}>
          {loading ? "Verificando..." : "Probar conexión con Backend"}
        </button>

        {healthStatus && (
          <div className="status success">
            ✅ Backend respondió: <strong>{healthStatus}</strong>
          </div>
        )}

        {error && (
          <div className="status error">
            ❌ Error: <strong>{error}</strong>
          </div>
        )}
      </div>

      <p className="instructions">
        Asegurate de tener el backend corriendo en{" "}
        <code>http://localhost:8000</code>
      </p>
    </div>
  );
}

export default App;
