import { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert } from '../../lib/sweetalert';

interface ReportData {
  period: string;
  recettes: {
    total: number;
    categories: { [key: string]: number };
  };
  depenses: {
    total: number;
    categories: { [key: string]: number };
  };
  solde: number;
}

interface MonthlyReport {
  mois: number;
  annee: number;
  recettes: number;
  depenses: number;
  solde: number;
}

export function AccountingReports() {
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'category'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportType === 'monthly') {
      loadMonthlyReport();
    } else if (reportType === 'yearly') {
      loadYearlyReport();
    }
  }, [reportType, selectedMonth, selectedYear]);

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const dateDebut = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const dateFin = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const response = await apiService.getPayments({ dateDebut, dateFin });
      const transactions = response.data || [];

      const recettes = transactions.filter((t: any) => t.type === 'RECETTE');
      const depenses = transactions.filter((t: any) => t.type === 'DEPENSE');

      // Calculer les totaux par catégorie
      const recettesCategories: { [key: string]: number } = {};
      const depensesCategories: { [key: string]: number } = {};

      recettes.forEach((recette: any) => {
        recettesCategories[recette.categorie] = (recettesCategories[recette.categorie] || 0) + recette.montantPaye;
      });

      depenses.forEach((depense: any) => {
        depensesCategories[depense.categorie] = (depensesCategories[depense.categorie] || 0) + depense.montant;
      });

      const totalRecettes = recettes.reduce((sum: number, r: any) => sum + r.montantPaye, 0);
      const totalDepenses = depenses.reduce((sum: number, d: any) => sum + d.montant, 0);

      setReportData({
        period: `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        recettes: {
          total: totalRecettes,
          categories: recettesCategories
        },
        depenses: {
          total: totalDepenses,
          categories: depensesCategories
        },
        solde: totalRecettes - totalDepenses
      });
    } catch (error: any) {
      showErrorAlert(error.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyReport = async () => {
    setLoading(true);
    try {
      const reports: MonthlyReport[] = [];

      for (let month = 1; month <= 12; month++) {
        const dateDebut = `${selectedYear}-${String(month).padStart(2, '0')}-01`;
        const dateFin = new Date(selectedYear, month, 0).toISOString().split('T')[0];

        const response = await apiService.getPayments({ dateDebut, dateFin });
        const transactions = response.data || [];

        const recettes = transactions.filter((t: any) => t.type === 'RECETTE');
        const depenses = transactions.filter((t: any) => t.type === 'DEPENSE');

        const totalRecettes = recettes.reduce((sum: number, r: any) => sum + r.montantPaye, 0);
        const totalDepenses = depenses.reduce((sum: number, d: any) => sum + d.montant, 0);

        reports.push({
          mois: month,
          annee: selectedYear,
          recettes: totalRecettes,
          depenses: totalDepenses,
          solde: totalRecettes - totalDepenses
        });
      }

      setMonthlyReports(reports);
    } catch (error: any) {
      showErrorAlert(error.message || 'Erreur lors du chargement du rapport annuel');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData && monthlyReports.length === 0) return;

    let csvContent = '';

    if (reportType === 'monthly' && reportData) {
      csvContent = `Rapport Comptable - ${reportData.period}\n\n`;
      csvContent += 'Catégorie,Recettes,Dépenses,Solde\n';
      csvContent += `Total,${reportData.recettes.total},${reportData.depenses.total},${reportData.solde}\n\n`;

      csvContent += 'Détail des recettes:\n';
      Object.entries(reportData.recettes.categories).forEach(([cat, amount]) => {
        csvContent += `${cat},${amount},,\n`;
      });

      csvContent += '\nDétail des dépenses:\n';
      Object.entries(reportData.depenses.categories).forEach(([cat, amount]) => {
        csvContent += `${cat},,${amount},\n`;
      });
    } else if (reportType === 'yearly') {
      csvContent = `Rapport Annuel ${selectedYear}\n\n`;
      csvContent += 'Mois,Recettes,Dépenses,Solde\n';
      monthlyReports.forEach(report => {
        const monthName = new Date(selectedYear, report.mois - 1).toLocaleDateString('fr-FR', { month: 'long' });
        csvContent += `${monthName},${report.recettes},${report.depenses},${report.solde}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_comptable_${reportType}_${selectedYear}${reportType === 'monthly' ? `_${selectedMonth}` : ''}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Rapports comptables</h3>
        <div className="flex items-center space-x-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
          >
            <option value="monthly">Rapport mensuel</option>
            <option value="yearly">Rapport annuel</option>
          </select>

          {reportType === 'monthly' && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {reportType === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}

          <button
            onClick={exportReport}
            disabled={!reportData && monthlyReports.length === 0}
            className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {reportType === 'monthly' && reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Résumé */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Résumé - {reportData.period}</span>
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-gray-800" />
                  <span className="font-medium text-gray-900">Recettes</span>
                </div>
                <span className="text-xl font-bold text-gray-800">{reportData.recettes.total.toLocaleString()} XAF</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-900">Dépenses</span>
                </div>
                <span className="text-xl font-bold text-red-600">{reportData.depenses.total.toLocaleString()} XAF</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Solde</span>
                </div>
                <span className={`text-xl font-bold ${reportData.solde >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  {reportData.solde.toLocaleString()} XAF
                </span>
              </div>
            </div>
          </div>

          {/* Graphique des catégories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégorie</h4>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Recettes</h5>
                {Object.entries(reportData.recettes.categories).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">
                      {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="font-medium text-gray-600">{amount.toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-2">Dépenses</h5>
                {Object.entries(reportData.depenses.categories).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">
                      {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="font-medium text-red-600">{amount.toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'yearly' && monthlyReports.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900">Évolution annuelle {selectedYear}</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mois</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Recettes</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Dépenses</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Solde</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReports.map((report) => (
                  <tr key={report.mois} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {new Date(selectedYear, report.mois - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {report.recettes.toLocaleString()} XAF
                    </td>
                    <td className="py-3 px-4 text-red-600 font-medium">
                      {report.depenses.toLocaleString()} XAF
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <span className={report.solde >= 0 ? 'text-gray-600' : 'text-red-600'}>
                        {report.solde.toLocaleString()} XAF
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">Total annuel</td>
                  <td className="py-3 px-4 font-bold text-gray-600">
                    {monthlyReports.reduce((sum, r) => sum + r.recettes, 0).toLocaleString()} XAF
                  </td>
                  <td className="py-3 px-4 font-bold text-red-600">
                    {monthlyReports.reduce((sum, r) => sum + r.depenses, 0).toLocaleString()} XAF
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span className={monthlyReports.reduce((sum, r) => sum + r.solde, 0) >= 0 ? 'text-gray-600' : 'text-red-600'}>
                      {monthlyReports.reduce((sum, r) => sum + r.solde, 0).toLocaleString()} XAF
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}