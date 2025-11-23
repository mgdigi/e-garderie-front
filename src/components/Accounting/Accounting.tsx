import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, CheckCircle, Filter, Search, Calendar } from 'lucide-react';
import { apiService } from '../../lib/api';
import { ExpenseForm } from './ExpenseForm';
import { IncomeForm } from './IncomeForm';
import { SalaryManagement } from './SalaryManagement';
import { AccountingReports } from './AccountingReports';
import { MonthlyPaymentForm } from './MonthlyPaymentForm';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Payment {
  _id: string;
  montantPaye: number;
  date: string;
  methodePaiement: string;
  statut: string;
  categorie?: string;
  description?: string;
  enfantId?: {
    _id: string;
    nom: string;
    prenom: string;
    numeroInscription: string;
  };
  personnelId?: {
    _id: string;
    nom: string;
    prenom: string;
    poste: string;
  };
  enregistrePar?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Expense {
  _id: string;
  montant: number;
  date: string;
  description?: string;
  categorie?: string;
}

export function Accounting() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'income' | 'expenses' | 'salaries' | 'reports'>('income');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showMonthlyPaymentForm, setShowMonthlyPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    loadData();
  }, [period, view]);

  // Listen for child creation events
  useEffect(() => {
    const handleChildCreated = () => {
      loadData();
    };

    window.addEventListener('childCreated', handleChildCreated);

    return () => {
      window.removeEventListener('childCreated', handleChildCreated);
    };
  }, []);

  const loadData = async () => {
     setLoading(true);
     try {
       // Calculate date range based on period
       const now = new Date();
       let dateDebut: string | undefined;
       let dateFin: string | undefined;

       if (period === 'today') {
         dateDebut = now.toISOString().split('T')[0];
         dateFin = now.toISOString().split('T')[0];
       } else if (period === 'week') {
         const weekAgo = new Date(now);
         weekAgo.setDate(now.getDate() - 7);
         dateDebut = weekAgo.toISOString().split('T')[0];
         dateFin = now.toISOString().split('T')[0];
       } else if (period === 'month') {
         const monthAgo = new Date(now);
         monthAgo.setMonth(now.getMonth() - 1);
         dateDebut = monthAgo.toISOString().split('T')[0];
         dateFin = now.toISOString().split('T')[0];
       }

       console.log('Calculated date range:', { dateDebut, dateFin, period });

       // Remove date filters temporarily to get all transactions
       // Remove date filters temporarily to get all transactions
       const response = await apiService.getPayments({});
       const allTransactions = response.data || [];
       console.log('All transactions from API (no date filter):', allTransactions);

       const paymentsData = allTransactions.filter((t: any) => t.type === 'RECETTE');
       const expensesData = allTransactions.filter((t: any) => t.type === 'DEPENSE');
       console.log('Filtered payments (RECETTE):', paymentsData);
       console.log('Filtered expenses (DEPENSE):', expensesData);

       setPayments(paymentsData);
       setExpenses(expensesData);
     } catch (error: any) {
       console.error('Error loading accounting data:', error);
       showErrorAlert(error.message || 'Erreur lors du chargement des données comptables');
     } finally {
       setLoading(false);
     }
   };

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.montantPaye), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.montant), 0);
  const balance = totalIncome - totalExpenses;

  const generateReceipt = async (paymentId: string) => {
    try {
      const receiptData = await apiService.generateReceipt(paymentId);
      const { paiement, creche, enfant, validePar } = receiptData.data;

      // Generate PDF receipt
      await generatePDFReceipt(paiement, creche, enfant, validePar);
      showSuccessAlert('Reçu généré avec succès!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      showErrorAlert('Erreur lors de la génération du reçu');
    }
  };

  const generatePDFReceipt = async (paiement: any, creche: any, enfant: any, validePar: any) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Create receipt HTML content
    const receiptHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
        <div style="display: flex; align-items: center; margin-bottom: 30px;">
          <div style="flex-shrink: 0; margin-right: 20px;">
            <img src="${creche?.logo ? `http://localhost:4000${creche.logo}` : '/images/logo.png'}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" />
          </div>
          <div style="text-align: left;">
            <h1 style="color: #f97316; margin: 0; font-size: 24px;">${creche?.nom || 'E-Garderie'}</h1>
            <p style="margin: 5px 0; color: #666;">${creche?.adresse || 'Dakar, Sénégal'}</p>
            <p style="margin: 5px 0; color: #666;">${creche?.telephone || '+221 XX XXX XX XX'}</p>
            <p style="margin: 5px 0; color: #666;">${creche?.email || 'contact@e-garderie.sn'}</p>
          </div>
        </div>

        <div style="border-bottom: 2px solid #f97316; margin-bottom: 20px;"></div>

        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">REÇU DE PAIEMENT</h2>

        ${enfant ? `
        <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Informations de l'enfant</h3>
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${enfant.prenom} ${enfant.nom}</p>
          <p style="margin: 5px 0;"><strong>Numéro d'inscription:</strong> ${enfant.numeroInscription}</p>
        </div>
        ` : ''}

        <div style="background: #f0f8ff; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Détails du paiement</h3>
          <p style="margin: 5px 0;"><strong>Description:</strong> ${paiement.description}</p>
          <p style="margin: 5px 0;"><strong>Méthode de paiement:</strong> ${paiement.methodePaiement}</p>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #f97316;">
            <strong>Montant:</strong> ${paiement.montantPaye?.toLocaleString('fr-FR') || paiement.montant.toLocaleString('fr-FR')} XAF
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <p><strong>Date de paiement:</strong> ${new Date(paiement.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Référence:</strong> ${paiement.reference || `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`}</p>
        </div>

        <div style="border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin-bottom: 10px;"><strong>${creche?.nom || 'E-Garderie'}</strong></p>
          <p style="margin-bottom: 5px;">${creche?.email || 'contact@e-garderie.sn'}</p>
          <p>Ce reçu est généré automatiquement et fait office de justificatif officiel de paiement.</p>
          <p>Conservez-le précieusement pour vos archives comptables.</p>
        </div>
      </div>
    `;

    // Create a temporary element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = receiptHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '600px';
    document.body.appendChild(tempDiv);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 600,
        height: tempDiv.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const reference = enfant ? enfant.numeroInscription : paiement._id.substring(0, 8);
      const fileName = `recu_${reference}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  };

  // Filtrage des données
  const filteredPayments = payments.filter(p =>
    (searchTerm === '' || p.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === '' || p.categorie === categoryFilter) &&
    (dateFilter === '' || p.date.startsWith(dateFilter)) &&
    (methodFilter === '' || p.methodePaiement === methodFilter)
  );

  const filteredExpenses = expenses.filter(e =>
    (searchTerm === '' || e.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === '' || e.categorie === categoryFilter) &&
    (dateFilter === '' || e.date.startsWith(dateFilter)) &&
    (methodFilter === '' || (e as any).methodePaiement === methodFilter)
  );

  // Pagination
  const totalPaymentPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const totalExpensePages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Comptabilité</h2>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMonthlyPaymentForm(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Paiement mensuel</span>
            </button>
            <button
              onClick={() => setShowIncomeForm(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle recette</span>
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle dépense</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recettes</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{totalIncome.toLocaleString()} XAF</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dépenses</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{totalExpenses.toLocaleString()} XAF</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-orange-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Solde</p>
              <p className="text-2xl font-bold mt-2">{balance.toLocaleString()} XAF</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-4">
              <button
                onClick={() => setView('income')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === 'income' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Recettes ({filteredPayments.length})
              </button>
              <button
                onClick={() => setView('expenses')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === 'expenses' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dépenses ({filteredExpenses.length})
              </button>
              <button
                onClick={() => setView('salaries')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === 'salaries' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Salaires
              </button>
              <button
                onClick={() => setView('reports')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  view === 'reports' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Rapports
              </button>
            </div>

            {(view === 'income' || view === 'expenses') && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Toutes catégories</option>
                      {view === 'income' ? (
                        <>
                          <option value="FRAIS_INSCRIPTION">Frais d'inscription</option>
                          <option value="MENSUALITE">Mensualités</option>
                          <option value="FRAIS_RETARD">Frais de retard</option>
                          <option value="AUTRES_RECETTES">Autres recettes</option>
                        </>
                      ) : (
                        <>
                          <option value="SALAIRES">Salaires</option>
                          <option value="FOURNITURES">Fournitures</option>
                          <option value="ALIMENTATION">Alimentation</option>
                          <option value="ENTRETIEN">Entretien</option>
                          <option value="ELECTRICITE">Électricité</option>
                          <option value="EAU">Eau</option>
                          <option value="TELEPHONE">Téléphone</option>
                          <option value="INTERNET">Internet</option>
                          <option value="ASSURANCE">Assurance</option>
                          <option value="LOYER">Loyer</option>
                          <option value="TRANSPORT">Transport</option>
                          <option value="AUTRES_DEPENSES">Autres dépenses</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="month"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Filtrer par mois"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Toutes méthodes</option>
                      <option value="ESPECES">Espèces</option>
                      <option value="VIREMENT">Virement</option>
                      <option value="CHEQUE">Chèque</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="CARTE_BANCAIRE">Carte bancaire</option>
                    </select>
                  </div>
                </div>
                {(searchTerm || categoryFilter || dateFilter || methodFilter) && (
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('');
                        setDateFilter('');
                        setMethodFilter('');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 underline text-sm"
                    >
                      Effacer tous les filtres
                    </button>
                    <div className="text-sm text-gray-600">
                      {view === 'income' ? filteredPayments.length : filteredExpenses.length} résultat(s)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {view === 'reports' ? (
            <AccountingReports />
          ) : view === 'salaries' ? (
            <SalaryManagement />
          ) : view === 'income' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Enfant/Personnel</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Méthode</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Enregistré par</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p) => (
                    <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(p.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {p.enfantId ? (
                          <div>
                            <div className="font-medium">{p.enfantId.prenom} {p.enfantId.nom}</div>
                            <div className="text-xs text-gray-500">#{p.enfantId.numeroInscription}</div>
                          </div>
                        ) : p.personnelId ? (
                          <div>
                            <div className="font-medium">{p.personnelId.prenom} {p.personnelId.nom}</div>
                            <div className="text-xs text-gray-500">{p.personnelId.poste}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {p.categorie?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={p.description}>
                        {p.description || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-orange-600">{p.montantPaye.toLocaleString()} XAF</td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {p.methodePaiement}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {p.enregistrePar ? (
                          <span className="text-sm">{p.enregistrePar.firstName} {p.enregistrePar.lastName}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            p.statut === 'PAYE' ? 'bg-orange-100 text-orange-700' :
                            p.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.statut === 'PAYE' ? 'Payé' : p.statut === 'EN_ATTENTE' ? 'En attente' : p.statut}
                          </span>
                          {p.statut === 'PAYE' && (
                            <button
                              onClick={() => generateReceipt(p._id)}
                              className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                              title="Télécharger le reçu"
                            >
                              Reçu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPayments.length === 0 && (
                <p className="text-center py-8 text-gray-500">
                  {payments.length === 0 ? 'Aucune recette pour cette période' : 'Aucun résultat pour les filtres appliqués'}
                </p>
              )}

              {/* Pagination pour les recettes */}
              {totalPaymentPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPayments.length)} à {Math.min(currentPage * itemsPerPage, filteredPayments.length)} sur {filteredPayments.length} recettes
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} sur {totalPaymentPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPaymentPages))}
                      disabled={currentPage === totalPaymentPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Personnel</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Méthode</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Enregistré par</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((e) => (
                    <tr key={e._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(e.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {(e as any).personnelId ? (
                          <div>
                            <div className="font-medium">{(e as any).personnelId.prenom} {(e as any).personnelId.nom}</div>
                            <div className="text-xs text-gray-500">{(e as any).personnelId.poste}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {e.categorie?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={e.description}>
                        {e.description || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-red-600">{e.montant.toLocaleString()} XAF</td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {(e as any).methodePaiement || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {(e as any).enregistrePar ? (
                          <span className="text-sm">{(e as any).enregistrePar.firstName} {(e as any).enregistrePar.lastName}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            (e as any).statut === 'PAYE' ? 'bg-orange-100 text-orange-700' :
                            (e as any).statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {(e as any).statut === 'PAYE' ? 'Payé' : (e as any).statut === 'EN_ATTENTE' ? 'En attente' : (e as any).statut || 'Payé'}
                          </span>
                          {(e as any).statut === 'PAYE' && (
                            <button
                              onClick={() => generateReceipt(e._id)}
                              className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                              title="Télécharger le reçu"
                            >
                              Reçu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length === 0 && (
                <p className="text-center py-8 text-gray-500">
                  {expenses.length === 0 ? 'Aucune dépense pour cette période' : 'Aucun résultat pour les filtres appliqués'}
                </p>
              )}

              {/* Pagination pour les dépenses */}
              {totalExpensePages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredExpenses.length)} à {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} sur {filteredExpenses.length} dépenses
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} sur {totalExpensePages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalExpensePages))}
                      disabled={currentPage === totalExpensePages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal formulaire paiement mensuel */}
      {showMonthlyPaymentForm && (
        <MonthlyPaymentForm
          onPaymentCreated={() => {
            loadData();
            setShowMonthlyPaymentForm(false);
          }}
          onClose={() => setShowMonthlyPaymentForm(false)}
        />
      )}

      {/* Modal formulaire recette */}
      {showIncomeForm && (
        <IncomeForm
          onIncomeCreated={() => {
            loadData();
            setShowIncomeForm(false);
          }}
          onClose={() => setShowIncomeForm(false)}
        />
      )}

      {/* Modal formulaire dépense */}
      {showExpenseForm && (
        <ExpenseForm
          onExpenseCreated={() => {
            loadData();
            setShowExpenseForm(false);
          }}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
    </div>
  );
}
  

