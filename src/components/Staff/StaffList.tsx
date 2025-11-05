import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, Eye } from 'lucide-react';
import { apiService } from '../../lib/api';
import { StaffForm } from './StaffForm';
import { StaffDetails } from './StaffDetails';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Staff {
  _id: string;
  nom: string;
  prenom: string;
  poste: string;
  telephone: string;
  email?: string;
  salaire: number;
  typeContrat: string;
  dateEmbauche: string;
  statut: string;
}

export function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showStaffDetails, setShowStaffDetails] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    loadStaff(1); // Reset to first page when component mounts
  }, []);

  useEffect(() => {
    // Reload staff when search term changes
    const timeoutId = setTimeout(() => {
      loadStaff(1); // Reset to first page when searching
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadStaff = async (page = 1) => {
    setLoading(true);
    try {
      console.log('Loading staff for StaffList with page:', page);
      const response = await apiService.getStaff({
        

        page,
        limit: itemsPerPage,
        search: searchTerm || undefined
      });
      console.log('StaffList response:', response);
      console.log('Staff data:', response.data);
      setStaff(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.totalItems || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmAlert(
      'Êtes-vous sûr de vouloir supprimer cet employé ?',
      'Confirmation de suppression',
      'Supprimer',
      'Annuler'
    );

    if (!confirmed) return;

    setSubmitting(true);
    try {
      await apiService.deleteStaff(id);
      showSuccessAlert('Employé supprimé avec succès');
      loadStaff(currentPage); // Reload current page
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showErrorAlert(error.message || 'Erreur lors de la suppression de l\'employé');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadStaff(page);
    }
  };

  // Remove client-side filtering since we now use server-side search
  const filteredStaff = staff || [];

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion du personnel</h2>
          <p className="text-gray-600 mt-1">{totalItems} employé(s)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Nouvel employé</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {totalItems} élément(s) au total
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employé</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Poste</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Téléphone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contrat</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Salaire</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {s.nom[0]}{s.prenom[0]}
                      </div>
                      <p className="font-medium text-gray-900">{s.nom} {s.prenom}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{s.poste}</td>
                  <td className="py-4 px-4 text-gray-700">{s.telephone || '-'}</td>
                  <td className="py-4 px-4 text-gray-700">{s.typeContrat}</td>
                  <td className="py-4 px-4 text-gray-900 font-medium">{s.salaire.toLocaleString()} FCFA</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      s.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                      s.statut === 'INACTIF' ? 'bg-gray-100 text-gray-700' :
                      s.statut === 'CONGE' ? 'bg-yellow-100 text-yellow-700' :
                      s.statut === 'SUSPENDU' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {s.statut === 'ACTIF' ? 'Actif' :
                       s.statut === 'INACTIF' ? 'Inactif' :
                       s.statut === 'CONGE' ? 'En congé' :
                       s.statut === 'SUSPENDU' ? 'Suspendu' :
                       s.statut === 'PARTI' ? 'Parti' : s.statut}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(s);
                          setShowStaffDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Voir détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingStaff(s)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        disabled={submitting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Supprimer"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun employé trouvé</p>
            </div>
          )}
        </div>
      </div>

      <StaffForm
        isOpen={showForm || !!editingStaff}
        onClose={() => {
          setShowForm(false);
          setEditingStaff(null);
        }}
        onSave={() => {
          loadStaff(); // Rafraîchissement automatique après création/modification
        }}
        staff={editingStaff}
      />

      {showStaffDetails && selectedStaff && (
        <StaffDetails
          staffId={selectedStaff._id}
          onClose={() => {
            setShowStaffDetails(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}
