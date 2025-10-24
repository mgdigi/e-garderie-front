import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  classToEdit?: {
    _id: string;
    nom: string;
    capacite: number;
    ageMin?: number;
    ageMax?: number;
    description?: string;
  } | null;
}

export function ClassForm({ isOpen, onClose, onSave, classToEdit }: ClassFormProps) {
  const [formData, setFormData] = useState({
    nom: classToEdit?.nom || '',
    capacite: classToEdit?.capacite || 20,
    ageMin: classToEdit?.ageMin || 0,
    ageMax: classToEdit?.ageMax || 6,
    description: classToEdit?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nom.trim()) {
      showErrorAlert('Le nom de la classe est requis');
      return;
    }

    if (formData.capacite <= 0) {
      showErrorAlert('La capacité doit être supérieure à 0');
      return;
    }

    if (formData.ageMin >= formData.ageMax) {
      showErrorAlert('L\'âge maximum doit être supérieur à l\'âge minimum');
      return;
    }

    setLoading(true);

    try {
      if (classToEdit) {
        // Mise à jour
        await apiService.updateClasse(classToEdit._id, formData);
        showSuccessAlert('Classe mise à jour avec succès');
      } else {
        // Création
        await apiService.createClasse(formData);
        showSuccessAlert('Classe créée avec succès');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving class:', error);
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement de la classe');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">
            {classToEdit ? 'Modifier la classe' : 'Nouvelle classe'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la classe *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: Petite Section, Moyenne Section..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Âge minimum *
              </label>
              <input
                type="number"
                required
                min="0"
                max="18"
                value={formData.ageMin}
                onChange={(e) => setFormData({ ...formData, ageMin: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Âge maximum *
              </label>
              <input
                type="number"
                required
                min="0"
                max="18"
                value={formData.ageMax}
                onChange={(e) => setFormData({ ...formData, ageMax: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacité maximale *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacite}
              onChange={(e) => setFormData({ ...formData, capacite: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Description de la classe..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{classToEdit ? 'Modifier' : 'Créer'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}