import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface IncomeFormProps {
  onIncomeCreated: () => void;
  onClose: () => void;
}

interface Child {
  _id: string;
  nom: string;
  prenom: string;
  numeroInscription: string;
}

export function IncomeForm({ onIncomeCreated, onClose }: IncomeFormProps) {
  const [formData, setFormData] = useState({
    type: 'RECETTE',
    categorie: '',
    montant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    methodePaiement: 'ESPECES',
    reference: '',
    enfantId: '',
    periode: {
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear()
    }
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await apiService.getChildren();
      setChildren(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const incomeData = {
        ...formData,
        montant: parseFloat(formData.montant),
        montantPaye: parseFloat(formData.montant),
        statut: 'PAYE',
        enfantId: formData.enfantId || undefined,
        periode: formData.categorie === 'MENSUALITE' ? formData.periode : undefined
      };

      await apiService.createPayment(incomeData);
      showSuccessAlert('Recette enregistrée avec succès');
      onIncomeCreated();
      onClose();
    } catch (error: any) {
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement de la recette');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'categorie') {
      // Reset related fields when category changes
      setFormData(prev => ({
        ...prev,
        categorie: value,
        enfantId: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const incomeCategories = [
    'FRAIS_INSCRIPTION', 'FRAIS_RETARD', 'AUTRES_RECETTES'
  ];

  const paymentMethods = [
    { value: 'ESPECES', label: 'Espèces' },
    { value: 'VIREMENT', label: 'Virement' },
    { value: 'CHEQUE', label: 'Chèque' },
    { value: 'ORANGE_MONEY', label: 'Orange Money' },
    { value: 'WAVE', label: 'Wave' },
    { value: 'CARTE_BANCAIRE', label: 'Carte bancaire' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Nouvelle recette</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => handleInputChange('categorie', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {incomeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (XAF) *
              </label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => handleInputChange('montant', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            {/* Méthode de paiement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Méthode de paiement *
              </label>
              <select
                value={formData.methodePaiement}
                onChange={(e) => handleInputChange('methodePaiement', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="Détails de la recette..."
              required
            />
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence (optionnel)
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Numéro de chèque, référence virement..."
            />
          </div>

          {/* Champs conditionnels selon la catégorie */}
          {(formData.categorie === 'FRAIS_INSCRIPTION' || formData.categorie === 'FRAIS_RETARD') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enfant *
              </label>
              <select
                value={formData.enfantId}
                onChange={(e) => handleInputChange('enfantId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un enfant</option>
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.nom} {child.prenom} - #{child.numeroInscription}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Enregistrer la recette</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}