import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface MonthlyPaymentFormProps {
  onPaymentCreated: () => void;
  onClose: () => void;
}

interface Child {
  _id: string;
  nom: string;
  prenom: string;
  numeroInscription: string;
  tarifMensuel: number;
}

export function MonthlyPaymentForm({ onPaymentCreated, onClose }: MonthlyPaymentFormProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    enfantId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    montant: 0,
    methodePaiement: 'ESPECES'
  });

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

  const handleChildChange = (enfantId: string) => {
    const selectedChild = children.find(c => c._id === enfantId);
    setFormData(prev => ({
      ...prev,
      enfantId,
      montant: selectedChild?.tarifMensuel || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.createMonthlyPayment({
        enfantId: formData.enfantId,
        mois: formData.mois,
        annee: formData.annee,
        montant: formData.montant,
        methodePaiement: formData.methodePaiement
      });

      showSuccessAlert('Paiement mensuel enregistré avec succès');
      onPaymentCreated();
      onClose();
    } catch (error: any) {
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement du paiement mensuel');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Paiement mensuel</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection de l'enfant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enfant *
            </label>
            <select
              value={formData.enfantId}
              onChange={(e) => handleChildChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un enfant</option>
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.prenom} {child.nom} - #{child.numeroInscription} ({child.tarifMensuel?.toLocaleString()} XAF/mois)
                </option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois *
              </label>
              <select
                value={formData.mois}
                onChange={(e) => setFormData(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année *
              </label>
              <select
                value={formData.annee}
                onChange={(e) => setFormData(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (XAF) *
            </label>
            <div className="relative">
              <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: parseInt(e.target.value) || 0 }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          {/* Méthode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode de paiement *
            </label>
            <select
              value={formData.methodePaiement}
              onChange={(e) => setFormData(prev => ({ ...prev, methodePaiement: e.target.value }))}
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
              disabled={loading || !formData.enfantId}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              <span>Enregistrer le paiement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}