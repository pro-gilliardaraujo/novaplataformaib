import { useReportStore } from '@/store/useReportStore';

export default function Report() {
  const { visibilityConfig } = useReportStore();

  return (
    <div className="space-y-8">
      {/* Seção Colheita */}
      {visibilityConfig.colheita.disponibilidadeMecanica && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Disponibilidade Mecânica</h2>
          {/* ... existing disponibilidade mecanica content ... */}
        </div>
      )}

      {visibilityConfig.colheita.eficienciaEnergetica && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Eficiência Energética</h2>
          {/* ... existing eficiencia energetica content ... */}
        </div>
      )}

      {visibilityConfig.colheita.motorOcioso && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Motor Ocioso</h2>
          {/* ... existing motor ocioso content ... */}
        </div>
      )}

      {visibilityConfig.colheita.horaElevador && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Hora Elevador</h2>
          {/* ... existing hora elevador content ... */}
        </div>
      )}

      {visibilityConfig.colheita.usoGPS && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Uso GPS</h2>
          {/* ... existing uso GPS content ... */}
        </div>
      )}

      {/* Seção Transbordo */}
      {visibilityConfig.transbordo.disponibilidadeMecanica && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Disponibilidade Mecânica</h2>
          {/* ... existing disponibilidade mecanica content ... */}
        </div>
      )}

      {visibilityConfig.transbordo.eficienciaEnergetica && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Eficiência Energética</h2>
          {/* ... existing eficiencia energetica content ... */}
        </div>
      )}

      {visibilityConfig.transbordo.motorOcioso && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Motor Ocioso</h2>
          {/* ... existing motor ocioso content ... */}
        </div>
      )}

      {visibilityConfig.transbordo.faltaApontamento && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Falta de Apontamento</h2>
          {/* ... existing falta apontamento content ... */}
        </div>
      )}

      {visibilityConfig.transbordo.usoGPS && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Uso GPS</h2>
          {/* ... existing uso GPS content ... */}
        </div>
      )}
    </div>
  );
} 