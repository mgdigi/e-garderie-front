import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Baby } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Child {
   _id: string;
   nom: string;
   prenom: string;
   dateNaissance: string;
   sexe: string;
   classeId?: {
     _id: string;
     nom: string;
     capacite: number;
     ageMin?: number;
     ageMax?: number;
   } | string;
   section?: string; // Keep for backward compatibility
   statut: string;
   dateInscription: string;
   parents?: Array<{
     nom: string;
     prenom: string;
     telephone: string;
     adresse: string;
   }>;
   sante?: {
     allergies: string[];
     restrictionsAlimentaires: string[];
   };
   // Keep backward compatibility
   parentNom?: string;
   parentTelephone?: string;
   adresse?: string;
   classe?: {
     _id: string;
     nom: string;
     capacite: number;
     ageMin?: number;
     ageMax?: number;
   };
}

interface Class {
  _id: string;
  nom: string;
  capacite: number;
  ageMin?: number;
  ageMax?: number;
  description?: string;
}

import { ChildForm } from './ChildForm';
import { ChildDetails } from './ChildDetails';

export function ChildrenList() {
   const [children, setChildren] = useState<Child[]>([]);
   const [classes, setClasses] = useState<Class[]>([]);
   const [settings, setSettings] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [showForm, setShowForm] = useState(false);
   const [showDetails, setShowDetails] = useState(false);
   const [selectedChild, setSelectedChild] = useState<Child | null>(null);
   const [filterClass, setFilterClass] = useState<string>('all');
   const [filterStatus, setFilterStatus] = useState<string>('active');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadChildren();
    loadClasses();
    loadSettings();
  }, []);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterStatus]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const response = await apiService.getChildren();
      

      console.log('les enfants  :', response.data);
      setChildren(response.data);
    } catch (error) {
      console.error('Error loading children:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await apiService.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiService.getParametres();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmAlert(
      'Êtes-vous sûr de vouloir supprimer cet enfant ?',
      'Confirmation de suppression',
      'Supprimer',
      'Annuler'
    );

    if (!confirmed) return;

    setSubmitting(true);
    try {
      await apiService.deleteChild(id);
      showSuccessAlert('Enfant supprimé avec succès');
      loadChildren();
    } catch (error: any) {
      console.error('Error deleting child:', error);
      showErrorAlert(error.message || 'Erreur lors de la suppression de l\'enfant');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChildren = (children).filter(child => {
    const matchesSearch =
      child.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    const childClassId = typeof child.classeId === 'object' ? child.classeId?._id : child.classeId;
    const matchesClass = filterClass === 'all' || childClassId === filterClass;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && child.statut === 'ACTIF') ||
      (filterStatus === 'inactive' && child.statut === 'INACTIF');
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalPages = Math.ceil(filteredChildren.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChildren = filteredChildren.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des enfants</h2>
          <p className="text-gray-600 mt-1">{filteredChildren.length} enfant(s)</p>
        </div>
        <button
          onClick={() => {
            setSelectedChild(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Nouvel enfant</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.nom} ({cls.ageMin}-{cls.ageMax} ans)
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Enfant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date de naissance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentChildren.map((child) => (
                <tr key={child._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {child.nom[0]}{child.prenom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{child.nom} {child.prenom}</p>
                        <p className="text-sm text-gray-500">
                          {child.sexe === 'MASCULIN' ? 'Masculin' :
                           child.sexe === 'FEMININ' ? 'Féminin' :
                           child.sexe || 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {new Date(child.dateNaissance).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      {typeof child.classeId === 'object' && child.classeId?.nom ? child.classeId.nom :
                       child.classe?.nom || child.section || 'Non assigné'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      child.statut === 'ACTIF'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {child.statut === 'ACTIF' ? 'Actif' : child.statut || 'Inactif'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChild(child);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChild(child);
                          setShowForm(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(child._id)}
                        disabled={submitting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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

          {children.length === 0 && (
            <div className="text-center py-12">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun enfant trouvé</p>
            </div>
          )}

          {currentChildren.length === 0 && filteredChildren.length > 0 && (
            <div className="text-center py-12">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun enfant trouvé pour cette page</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredChildren.length)} sur {filteredChildren.length} enfants
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    page === currentPage
                      ? 'text-white bg-orange-500 border border-orange-500'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ChildForm
           child={selectedChild as any}
           classes={classes as any}
           settings={settings}
           onClose={() => {
             setShowForm(false);
             setSelectedChild(null);
           }}
           onSave={() => {
             loadChildren();
             setShowForm(false);
             setSelectedChild(null);
           }}
         />
       )}

      {showDetails && selectedChild && (
        <ChildDetails
           childId={selectedChild._id}
           onClose={() => {
             setShowDetails(false);
             setSelectedChild(null);
           }}
         />
      )}
    </div>
  );
}
