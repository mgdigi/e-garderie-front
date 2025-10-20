import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api';
import { Users, DollarSign, TrendingUp, AlertCircle, Baby, UserCheck, Calendar, RefreshCw, BarChart3, PieChart, Activity } from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Stats {
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
  alertes: any[];
}

interface ChartData {
  presencesEvolution: any[];
  repartitionFinanciere: any[];
  presenceParSection: any[];
}

interface RecentActivities {
  inscriptions: any[];
  paiements: any[];
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    enfants: {
      total: 0,
      presents: 0,
      absents: 0
    },
    personnel: {
      total: 0,
      presents: 0,
      absents: 0
    },
    finances: {
      recettesDuJour: 0,
      depensesDuJour: 0
    },
    alertes: []
  });
  const [chartData, setChartData] = useState<ChartData>({
    presencesEvolution: [],
    repartitionFinanciere: [],
    presenceParSection: []
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivities>({
    inscriptions: [],
    paiements: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadCharts();
  }, [selectedPeriod]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentActivities({ limit: '5' })
      ]);

      setStats(statsResponse.data);
      setRecentActivities(activitiesResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values if API fails
      setStats({
        enfants: {
          total: 0,
          presents: 0,
          absents: 0
        },
        personnel: {
          total: 0,
          presents: 0,
          absents: 0
        },
        finances: {
          recettesDuJour: 0,
          depensesDuJour: 0
        },
        alertes: []
      });
      setRecentActivities({ inscriptions: [], paiements: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async () => {
    try {
      const response = await apiService.getDashboardCharts({ periode: selectedPeriod });
      setChartData(response.data);
    } catch (error) {
      console.error('Error loading charts:', error);
      setChartData({
        presencesEvolution: [],
        repartitionFinanciere: [],
        presenceParSection: []
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    await loadCharts();
    setRefreshing(false);
  };

  const cards = [
    {
      title: 'Enfants inscrits',
      value: stats.enfants.total,
      icon: Baby,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Présents aujourd\'hui',
      value: stats.enfants.presents,
      subtitle: `sur ${stats.enfants.total}`,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Recettes du jour',
      value: `${stats.finances.recettesDuJour.toLocaleString()} XAF`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Dépenses du jour',
      value: `${stats.finances.depensesDuJour.toLocaleString()} XAF`,
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Personnel actif',
      value: stats.personnel.total,
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600'
    },
    {
      title: 'Paiements en attente',
      value: stats.alertes.filter(a => a.type === 'warning').reduce((sum, a) => sum + a.count, 0),
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre crèche</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className={`${card.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
            Évolution des présences
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: chartData.presencesEvolution.map(item => item._id.date),
                datasets: [
                  {
                    label: 'Présents',
                    data: chartData.presencesEvolution.filter(item => item._id.statut === 'PRESENT').map(item => item.count),
                    borderColor: 'rgba(247, 193, 42, 0.8)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                  },
                  {
                    label: 'Absents',
                    data: chartData.presencesEvolution.filter(item => item._id.statut === 'ABSENT').map(item => item.count),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-orange-600" />
            Répartition financière
          </h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: chartData.repartitionFinanciere.map(item => `${item._id.type} - ${item._id.categorie}`),
                datasets: [{
                  data: chartData.repartitionFinanciere.map(item => item.total),
                  backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(247, 193, 42, 0.8)',
                    'rgba(247, 193, 42, 0.8)',
                    'rgba(247, 193, 42, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                  ],
                  borderWidth: 2
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' as const }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-600" />
            Activités récentes
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.inscriptions.map((inscription, index) => (
              <div key={`insc-${index}`} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Baby className="w-4 h-4 mt-1 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Nouvelle inscription: {inscription.nom} {inscription.prenom}
                  </p>
                  <p className="text-xs text-orange-600">
                    {new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.paiements.map((paiement, index) => (
              <div key={`pay-${index}`} className={`flex items-start space-x-3 p-3 rounded-lg ${
                paiement.type === 'RECETTE' ? 'bg-gray-50' : 'bg-red-50'
              }`}>
                <DollarSign className={`w-4 h-4 mt-1 ${
                  paiement.type === 'RECETTE' ? 'text-gray-600' : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    paiement.type === 'RECETTE' ? 'text-gray-900' : 'text-red-900'
                  }`}>
                    {paiement.type === 'RECETTE' ? 'Paiement reçu' : 'Paiement effectué'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {paiement.montantPaye?.toLocaleString()} XAF - {new Date(paiement.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.inscriptions.length === 0 && recentActivities.paiements.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Alertes
          </h3>
          <div className="space-y-3">
            {stats.alertes.map((alerte, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-xl ${
                alerte.type === 'warning' ? 'bg-yellow-50' :
                alerte.type === 'danger' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  alerte.type === 'warning' ? 'text-yellow-600' :
                  alerte.type === 'danger' ? 'text-red-600' : 'text-blue-600'
                }`} />
                <div>
                  <p className={`font-medium text-sm ${
                    alerte.type === 'warning' ? 'text-yellow-900' :
                    alerte.type === 'danger' ? 'text-red-900' : 'text-blue-900'
                  }`}>
                    {alerte.message}
                  </p>
                </div>
              </div>
            ))}
            {stats.alertes.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune alerte</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
            Présences par section
          </h3>
          <div className="space-y-3">
            {chartData.presenceParSection.map((section, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{section._id.section}</p>
                  <p className="text-sm text-gray-600">
                    {section.count} enfant{section.count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {section._id.statut === 'PRESENT' ? section.count : 0} présents
                  </p>
                </div>
              </div>
            ))}
            {chartData.presenceParSection.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Métriques financières détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Recettes du jour</h3>
              <p className="text-3xl font-bold mb-1">
                {stats.finances.recettesDuJour.toLocaleString()} XAF
              </p>
              <p className="text-green-100 text-sm">Aujourd'hui</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Dépenses du jour</h3>
              <p className="text-3xl font-bold mb-1">
                {stats.finances.depensesDuJour.toLocaleString()} XAF
              </p>
              <p className="text-red-100 text-sm">Aujourd'hui</p>
            </div>
            <DollarSign className="w-12 h-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Solde du jour</h3>
              <p className="text-3xl font-bold mb-1">
                {(stats.finances.recettesDuJour - stats.finances.depensesDuJour).toLocaleString()} XAF
              </p>
              <p className="text-orange-100 text-sm">
                {stats.finances.recettesDuJour - stats.finances.depensesDuJour >= 0 ? 'Bénéfice' : 'Déficit'}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
