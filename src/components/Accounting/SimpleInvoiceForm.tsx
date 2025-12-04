import { useState, useEffect } from 'react';
import { X, Save, Search, User } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface SimpleInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SimpleInvoiceForm({ isOpen, onClose, onSuccess }: SimpleInvoiceFormProps) {
  const [formData, setFormData] = useState({
    enfantId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    montant: '',
    type: 'MENSUALITE',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<any[]>([]);
  const [showChildrenList, setShowChildrenList] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  // Charger la liste des enfants
  useEffect(() => {
    if (isOpen) {
      loadChildren();
    }
  }, [isOpen]);

  // Filtrer les enfants selon le terme de recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChildren(children);
    } else {
      const filtered = children.filter(child =>
        child.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.numeroInscription.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChildren(filtered);
    }
  }, [searchTerm, children]);

  const loadChildren = async () => {
    setLoadingChildren(true);
    try {
      const response = await apiService.getAllChildren();
      setChildren(response.data || []);
      setFilteredChildren(response.data || []);
      console.log('Enfants chargés:', response.data?.length);
    } catch (error: any) {
      console.error('Erreur lors du chargement des enfants:', error);
      showErrorAlert('Erreur lors du chargement des enfants');
    } finally {
      setLoadingChildren(false);
    }
  };

  const selectChild = (child: any) => {
    setSelectedChild(child);
    setFormData({ ...formData, enfantId: child._id });
    setSearchTerm(`${child.prenom} ${child.nom} - #${child.numeroInscription}`);
    setShowChildrenList(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Créer une facture simple</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enfant
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowChildrenList(true);
                      if (e.target.value === '') {
                        setSelectedChild(null);
                        setFormData({ ...formData, enfantId: '' });
                      }
                    }}
                    onFocus={() => setShowChildrenList(true)}
                    placeholder="Rechercher un enfant par nom, prénom ou numéro..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={loadingChildren}
                  />
                </div>
                
                {showChildrenList && filteredChildren.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredChildren.map((child) => (
                      <div
                        key={child._id}
                        onClick={() => selectChild(child)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {child.prenom} {child.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{child.numeroInscription}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {loadingChildren && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <div className="text-center text-gray-500">
                      Chargement des enfants...
                    </div>
                  </div>
                )}
                
                {searchTerm && filteredChildren.length === 0 && !loadingChildren && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <div className="text-center text-gray-500">
                      Aucun enfant trouvé
                    </div>
                  </div>
                )}
              </div>
              
              {selectedChild && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">
                        {selectedChild.prenom} {selectedChild.nom}
                      </div>
                      <div className="text-sm text-green-600">
                        #{selectedChild.numeroInscription}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Clic en dehors pour fermer la liste */}
              {showChildrenList && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowChildrenList(false)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois
                </label>
                <select
                  value={formData.mois}
                  onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <input
                  type="number"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (FCFA)
              </label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Entrer le montant"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de facture
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="MENSUALITE">Mensualité</option>
                <option value="FRAIS_INSCRIPTION">Frais d'inscription</option>
                <option value="FRAIS_RETARD">Frais de retard</option>
                <option value="AUTRES">Autres</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
                placeholder="Description de la facture (optionnel)"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await apiService.createFacture(formData);
                  showSuccessAlert('Facture créée avec succès');
                  onSuccess();
                  onClose();
                } catch (error: any) {
                  console.error('Erreur lors de la création de la facture:', error);
                  showErrorAlert(error.response?.data?.message || 'Erreur lors de la création de la facture');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !formData.enfantId || !formData.montant}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Création...' : 'Créer la facture'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}