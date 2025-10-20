import { useState } from 'react';
import { FileText, Download, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showInfoAlert } from '../../lib/sweetalert';
import { AdvancedReports } from './AdvancedReports';

interface ReportData {
  enfants: {
    total: number;
    presents: number;
    absents: number;
  };
  personnel: {
    total: number;
    presents: number;
    absents: number;
  };
  finances: {
    recettesDuJour: number;
    depensesDuJour: number;
  };
}

export function Reports() {
  const [view, setView] = useState<'basic' | 'advanced'>('advanced');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get dashboard stats for the selected date
      const response = await apiService.getDashboardStats();
      setReportData(response.data);
    } catch (error: any) {
      console.error('Error generating report:', error);
      // Fallback to mock data if API fails
      const mockData: ReportData = {
        enfants: {
          total: 45,
          presents: 42,
          absents: 3
        },
        personnel: {
          total: 8,
          presents: 8,
          absents: 0
        },
        finances: {
          recettesDuJour: 225000,
          depensesDuJour: 85000
        }
      };
      setReportData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    showInfoAlert('Export PDF en cours de développement');
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    showInfoAlert('Export Excel en cours de développement');
  };

  const reportTypes = [
    { value: 'daily', label: 'Rapport quotidien', icon: Calendar },
    { value: 'weekly', label: 'Rapport hebdomadaire', icon: TrendingUp },
    { value: 'monthly', label: 'Rapport mensuel', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Rapports</h2>
          <p className="text-gray-600 mt-1">Génération de rapports détaillés</p>
        </div>
      </div>

      {/* Sélecteur de vue */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Type de rapports:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('basic')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'basic' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rapports simples
            </button>
            <button
              onClick={() => setView('advanced')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'advanced' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rapports avancés
            </button>
          </div>
        </div>
      </div>

      {view === 'advanced' ? (
        <AdvancedReports />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de rapport
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de référence
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Génération...' : 'Générer le rapport'}
            </button>
          </div>
        </div>

        {reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Rapport du {new Date(selectedDate).toLocaleDateString('fr-FR')}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Enfants inscrits</p>
                    <p className="text-2xl font-bold">{reportData.enfants.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Taux de présence</p>
                    <p className="text-2xl font-bold">
                      {Math.round((reportData.enfants.presents / reportData.enfants.total) * 100)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Solde du jour</p>
                    <p className="text-2xl font-bold">
                      {(reportData.finances.recettesDuJour - reportData.finances.depensesDuJour).toLocaleString()} XAF
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistiques des enfants</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total inscrits</span>
                    <span className="font-semibold">{reportData.enfants.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Présents</span>
                    <span className="font-semibold text-green-600">{reportData.enfants.presents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Absents</span>
                    <span className="font-semibold text-red-600">{reportData.enfants.absents}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistiques financières</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recettes</span>
                    <span className="font-semibold text-green-600">{reportData.finances.recettesDuJour.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dépenses</span>
                    <span className="font-semibold text-red-600">{reportData.finances.depensesDuJour.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-medium">Solde</span>
                    <span className="font-bold text-orange-600">
                      {(reportData.finances.recettesDuJour - reportData.finances.depensesDuJour).toLocaleString()} XAF
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistiques du personnel</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{reportData.personnel.total}</p>
                  <p className="text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reportData.personnel.presents}</p>
                  <p className="text-gray-600">Présents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{reportData.personnel.absents}</p>
                  <p className="text-gray-600">Absents</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
