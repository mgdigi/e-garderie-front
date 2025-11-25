import { useEffect, useState } from 'react';
import { DollarSign, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Staff {
  _id: string;
  nom: string;
  prenom: string;
  poste: string;
  salaire?: number;
  dernierPaiementSalaire?: string;
}

interface SalaryRecord {
  _id: string;
  personnelId: Staff;
  montant: number;
  periode: {
    mois: number;
    annee: number;
  };
  datePaiement: string;
  statut: string;
  methodePaiement: string;
}

export function SalaryManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, currentPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, paymentsRes] = await Promise.all([
        apiService.getStaff({ page: currentPage, limit: itemsPerPage }),
        apiService.getPayments({
          type: 'DEPENSE',
          categorie: 'SALAIRES',
          dateDebut: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
          dateFin: new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
        })
      ]);

      setStaff(staffRes.data || []);
      setSalaryRecords(paymentsRes.data || []);
      setTotalPages(staffRes.pagination?.totalPages || 1);
      setTotalItems(staffRes.pagination?.totalItems || 0);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données salaires:', error);
      showErrorAlert(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySalary = async (staffMember: Staff) => {
    if (!staffMember.salaire) {
      showErrorAlert('Aucun salaire défini pour cet employé');
      return;
    }

    try {
      const salaryData = {
        type: 'DEPENSE',
        categorie: 'SALAIRES',
        montant: staffMember.salaire,
        description: `Salaire ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - ${staffMember.nom} ${staffMember.prenom}`,
        date: new Date().toISOString().split('T')[0],
        methodePaiement: 'VIREMENT',
        personnelId: staffMember._id,
        periode: {
          mois: selectedMonth,
          annee: selectedYear
        }
      };

      await apiService.createPayment(salaryData);
      showSuccessAlert('Salaire versé avec succès');
      loadData();
    } catch (error: any) {
      showErrorAlert(error.message || 'Erreur lors du versement du salaire');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStaffSalaryStatus = (staffMember: Staff) => {
    const currentMonthRecords = salaryRecords.filter(record =>
      record.personnelId._id === staffMember._id &&
      record.periode.mois === selectedMonth &&
      record.periode.annee === selectedYear
    );

    if (currentMonthRecords.length > 0) {
      return { status: 'paid', record: currentMonthRecords[0] };
    }

    return { status: 'unpaid' };
  };

  const totalSalaries = staff.reduce((sum, member) => sum + (member.salaire || 0), 0);
  const paidSalaries = salaryRecords
    .filter(record => record.periode.mois === selectedMonth && record.periode.annee === selectedYear)
    .reduce((sum, record) => sum + record.montant, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Gestion des salaires</h3>
        <div className="flex items-center space-x-4">
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
        </div>
      </div>

      {/* Résumé des salaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salaires totaux</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{totalSalaries.toLocaleString()} XAF</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salaires versés</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{paidSalaries.toLocaleString()} XAF</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Restant à verser</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{(totalSalaries - paidSalaries).toLocaleString()} XAF</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste du personnel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-900">État des salaires - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employé</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Poste</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Salaire mensuel</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const salaryStatus = getStaffSalaryStatus(member);
                return (
                  <tr key={member._id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.nom} {member.prenom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{member.poste}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {member.salaire ? `${member.salaire.toLocaleString()} XAF` : 'Non défini'}
                    </td>
                    <td className="py-3 px-4">
                      {salaryStatus.status === 'paid' ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium">Versé</span>
                          {/* <span className="text-sm text-gray-500">
                            ({salaryStatus.record!.datePaiement && !isNaN(new Date(salaryStatus.record!.datePaiement).getTime())
                              ? new Date(salaryStatus.record!.datePaiement).toLocaleDateString('fr-FR')
                              : ''})
                          </span> */}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700 font-medium">Non versé</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {member.salaire && salaryStatus.status === 'unpaid' && (
                        <button
                          onClick={() => handlePaySalary(member)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Verser salaire</span>
                        </button>
                      )}
                      {salaryStatus.status === 'paid' && (
                        <span className="text-green-600 font-medium">Déjà versé</span>
                      )}
                      {!member.salaire && (
                        <span className="text-gray-500">Salaire non défini</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {staff.length === 0 && (
            <p className="text-center py-8 text-gray-500">Aucun personnel enregistré</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} résultats
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              {/* Numéros de page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'text-orange-600 bg-orange-50 border border-orange-300'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historique des paiements de salaire */}
      {salaryRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900">Historique des paiements de salaire</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Employé</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Période</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date paiement</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Méthode</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((record) => (
                  <tr key={record._id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {record.personnelId.nom} {record.personnelId.prenom}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(record.periode.annee, record.periode.mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {record.montant.toLocaleString()} XAF
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {record.datePaiement && !isNaN(new Date(record.datePaiement).getTime())
                        ? new Date(record.datePaiement).toLocaleDateString('fr-FR')
                        : new Date().toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{record.methodePaiement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}