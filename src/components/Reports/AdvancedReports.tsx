import { useEffect, useState } from 'react';
import {
  FileText, Download, Calendar, Users, DollarSign, TrendingUp,
  BarChart3, PieChart, Activity, UserCheck, AlertTriangle,
  Filter, Search, Eye, Printer
} from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface ChildReport {
  _id: string;
  nom: string;
  prenom: string;
  numeroInscription: string;
  dateNaissance: string;
  section: string;
  parent: {
    nom: string;
    telephone: string;
  };
  presenceStats: {
    totalJours: number;
    joursPresents: number;
    joursAbsents: number;
    tauxPresence: number;
  };
  paiementStats: {
    mensualitesPayees: number;
    mensualitesDuJour: number;
    totalDu: number;
    totalPaye: number;
    solde: number;
  };
}

interface AttendanceReport {
  date: string;
  totalEnfants: number;
  presents: number;
  absents: number;
  tauxPresence: number;
  personnelPresents: number;
  personnelAbsents: number;
}

interface FinancialReport {
  periode: string;
  recettes: {
    total: number;
    parCategorie: { [key: string]: number };
    evolution: Array<{ date: string; montant: number }>;
  };
  depenses: {
    total: number;
    parCategorie: { [key: string]: number };
    evolution: Array<{ date: string; montant: number }>;
  };
  solde: number;
  margeBeneficiaire: number;
}

interface StaffReport {
  _id: string;
  nom: string;
  prenom: string;
  poste: string;
  dateEmbauche: string;
  salaire: number;
  presenceStats: {
    totalJours: number;
    joursPresents: number;
    joursAbsents: number;
    tauxPresence: number;
  };
  dernierPaiementSalaire?: string;
}

export function AdvancedReports() {
  const [activeTab, setActiveTab] = useState<'children' | 'attendance' | 'financial' | 'staff' | 'general'>('general');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // États pour les différents rapports
  const [childrenReport, setChildrenReport] = useState<ChildReport[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [staffReport, setStaffReport] = useState<StaffReport[]>([]);
  const [generalStats, setGeneralStats] = useState<any>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Initialiser les dates par défaut
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(lastDayOfMonth.toISOString().split('T')[0]);

    loadGeneralStats();
  }, []);

  const loadGeneralStats = async () => {
    try {
      const response = await apiService.getGeneralStats();
      setGeneralStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats générales:', error);
    }
  };

  const generateChildrenReport = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEnfantsReport({
        startDate,
        endDate,
        section: sectionFilter || undefined
      });
      setChildrenReport(response.data || []);
    } catch (error: any) {
      showErrorAlert('Erreur lors de la génération du rapport enfants');
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReport = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPresenceReport({
        startDate,
        endDate
      });
      setAttendanceReport(response.data || []);
    } catch (error: any) {
      showErrorAlert('Erreur lors de la génération du rapport de présence');
    } finally {
      setLoading(false);
    }
  };

  const generateFinancialReport = async () => {
    setLoading(true);
    try {
      // Récupérer les données financières via l'API existante
      const response = await apiService.getPayments({
        dateDebut: startDate,
        dateFin: endDate
      });

      const transactions = response.data || [];
      const recettes = transactions.filter((t: any) => t.type === 'RECETTE');
      const depenses = transactions.filter((t: any) => t.type === 'DEPENSE');

      // Calculer les totaux par catégorie
      const recettesParCategorie: { [key: string]: number } = {};
      const depensesParCategorie: { [key: string]: number } = {};

      recettes.forEach((recette: any) => {
        recettesParCategorie[recette.categorie] = (recettesParCategorie[recette.categorie] || 0) + recette.montantPaye;
      });

      depenses.forEach((depense: any) => {
        depensesParCategorie[depense.categorie] = (depensesParCategorie[depense.categorie] || 0) + depense.montant;
      });

      const totalRecettes = recettes.reduce((sum: number, r: any) => sum + r.montantPaye, 0);
      const totalDepenses = depenses.reduce((sum: number, d: any) => sum + d.montant, 0);

      setFinancialReport({
        periode: `${startDate} - ${endDate}`,
        recettes: {
          total: totalRecettes,
          parCategorie: recettesParCategorie,
          evolution: [] // À implémenter avec des données historiques
        },
        depenses: {
          total: totalDepenses,
          parCategorie: depensesParCategorie,
          evolution: [] // À implémenter avec des données historiques
        },
        solde: totalRecettes - totalDepenses,
        margeBeneficiaire: totalRecettes > 0 ? ((totalRecettes - totalDepenses) / totalRecettes) * 100 : 0
      });
    } catch (error: any) {
      showErrorAlert('Erreur lors de la génération du rapport financier');
    } finally {
      setLoading(false);
    }
  };

  const generateStaffReport = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPersonnelReport({
        startDate,
        endDate
      });
      setStaffReport(response.data || []);
    } catch (error: any) {
      showErrorAlert('Erreur lors de la génération du rapport personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    switch (activeTab) {
      case 'children':
        generateChildrenReport();
        break;
      case 'attendance':
        generateAttendanceReport();
        break;
      case 'financial':
        generateFinancialReport();
        break;
      case 'staff':
        generateStaffReport();
        break;
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredChildrenReport = childrenReport.filter(child =>
    (searchTerm === '' || `${child.nom} ${child.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (sectionFilter === '' || child.section === sectionFilter)
  );

  const tabs = [
    { id: 'general', label: 'Général', icon: BarChart3 },
    { id: 'children', label: 'Enfants', icon: Users },
    { id: 'attendance', label: 'Présence', icon: UserCheck },
    { id: 'financial', label: 'Financier', icon: DollarSign },
    { id: 'staff', label: 'Personnel', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Rapports Avancés</h2>
          <p className="text-gray-600 mt-1">Analyses détaillées et statistiques complètes</p>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Filtres communs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Journalier</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>Générer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'general' && generalStats && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Statistiques générales</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Enfants inscrits</p>
                      <p className="text-2xl font-bold">{generalStats.enfants?.total || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Taux présence enfants</p>
                      <p className="text-2xl font-bold">
                        {generalStats.enfants ? Math.round((generalStats.enfants.presents / generalStats.enfants.total) * 100) : 0}%
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
                        {generalStats.finances ?
                          (generalStats.finances.recettesDuJour - generalStats.finances.depensesDuJour).toLocaleString() : 0} XAF
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Personnel actif</p>
                      <p className="text-2xl font-bold">{generalStats.personnel?.total || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'children' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Rapport détaillé des enfants</h3>
                {childrenReport.length > 0 && (
                  <button
                    onClick={() => exportToCSV(childrenReport, 'rapport_enfants')}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter CSV</span>
                  </button>
                )}
              </div>

              {/* Filtres spécifiques enfants */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un enfant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Toutes les sections</option>
                  <option value="Petite Section">Petite Section</option>
                  <option value="Moyenne Section">Moyenne Section</option>
                  <option value="Grande Section">Grande Section</option>
                </select>
              </div>

              {filteredChildrenReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Enfant</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Section</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Présence</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Paiements</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Parent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChildrenReport.map((child) => (
                        <tr key={child._id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3">
                            <div>
                              <p className="font-semibold text-gray-900">{child.nom} {child.prenom}</p>
                              <p className="text-sm text-gray-500">#{child.numeroInscription}</p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-700">{child.section}</td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-green-600">{child.presenceStats.joursPresents}</span>
                                <span className="text-gray-500">/{child.presenceStats.totalJours} jours</span>
                              </p>
                              <p className="text-sm font-medium text-blue-600">{child.presenceStats.tauxPresence}%</p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-green-600">{child.paiementStats.mensualitesPayees}</span>
                                <span className="text-gray-500">/{child.paiementStats.mensualitesDuJour} payées</span>
                              </p>
                              <p className={`text-sm font-medium ${child.paiementStats.solde > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Solde: {child.paiementStats.solde.toLocaleString()} XAF
                              </p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div>
                              <p className="font-medium text-gray-900">{child.parent.nom}</p>
                              <p className="text-sm text-gray-500">{child.parent.telephone}</p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rapport d'enfants généré</p>
                  <p className="text-sm text-gray-400 mt-1">Cliquez sur "Générer" pour créer le rapport</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Rapport de présence</h3>
                {attendanceReport.length > 0 && (
                  <button
                    onClick={() => exportToCSV(attendanceReport, 'rapport_presence')}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter CSV</span>
                  </button>
                )}
              </div>

              {attendanceReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Date</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Enfants présents</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Taux présence</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Personnel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReport.map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3 font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-green-600">{day.presents}</span>
                                <span className="text-gray-500">/{day.totalEnfants}</span>
                              </p>
                              <p className="text-sm text-red-600">{day.absents} absents</p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <span className={`font-medium ${day.tauxPresence >= 90 ? 'text-green-600' : day.tauxPresence >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
                              {day.tauxPresence}%
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              <p className="text-sm text-green-600">{day.personnelPresents} présents</p>
                              {day.personnelAbsents > 0 && (
                                <p className="text-sm text-red-600">{day.personnelAbsents} absents</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rapport de présence généré</p>
                  <p className="text-sm text-gray-400 mt-1">Cliquez sur "Générer" pour créer le rapport</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'financial' && financialReport && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Rapport financier - {financialReport.periode}</h3>
                <button
                  onClick={() => exportToCSV([financialReport], 'rapport_financier')}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Recettes totales</p>
                      <p className="text-2xl font-bold">{financialReport.recettes.total.toLocaleString()} XAF</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">Dépenses totales</p>
                      <p className="text-2xl font-bold">{financialReport.depenses.total.toLocaleString()} XAF</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Solde</p>
                      <p className="text-2xl font-bold">{financialReport.solde.toLocaleString()} XAF</p>
                      <p className="text-sm text-blue-200">Marge: {financialReport.margeBeneficiaire.toFixed(1)}%</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition des recettes</h4>
                  <div className="space-y-3">
                    {Object.entries(financialReport.recettes.parCategorie).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-600">{category.replace('_', ' ')}</span>
                        <span className="font-semibold text-green-600">{amount.toLocaleString()} XAF</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition des dépenses</h4>
                  <div className="space-y-3">
                    {Object.entries(financialReport.depenses.parCategorie).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-600">{category.replace('_', ' ')}</span>
                        <span className="font-semibold text-red-600">{amount.toLocaleString()} XAF</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Rapport du personnel</h3>
                {staffReport.length > 0 && (
                  <button
                    onClick={() => exportToCSV(staffReport, 'rapport_personnel')}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter CSV</span>
                  </button>
                )}
              </div>

              {staffReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Employé</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Poste</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Salaire</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Présence</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700">Dernier paiement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffReport.map((member) => (
                        <tr key={member._id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3">
                            <div>
                              <p className="font-semibold text-gray-900">{member.nom} {member.prenom}</p>
                              <p className="text-sm text-gray-500">Embauché: {new Date(member.dateEmbauche).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-700">{member.poste}</td>
                          <td className="border border-gray-200 p-3 font-medium text-gray-900">
                            {member.salaire?.toLocaleString()} XAF
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-green-600">{member.presenceStats.joursPresents}</span>
                                <span className="text-gray-500">/{member.presenceStats.totalJours}</span>
                              </p>
                              <p className="text-sm font-medium text-blue-600">{member.presenceStats.tauxPresence}%</p>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-700">
                            {member.dernierPaiementSalaire ?
                              new Date(member.dernierPaiementSalaire).toLocaleDateString('fr-FR') :
                              'Non payé'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun rapport de personnel généré</p>
                  <p className="text-sm text-gray-400 mt-1">Cliquez sur "Générer" pour créer le rapport</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}