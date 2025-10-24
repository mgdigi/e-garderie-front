import { useEffect, useState } from 'react';
import { Save, Building, DollarSign, Users, Edit, Trash2, Image } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../../lib/sweetalert';
import { ClassForm } from './ClassForm';

interface NurserySettings {
  _id: string;
  nomCreche: string;
  telephone: string;
  email: string;
  adresse: string;
  nomDirectrice: string;
  fraisInscription: number;
  mensualite: number;
  logo?: string;
}

interface Class {
  _id: string;
  nom: string;
  capacite: number;
  ageMin?: number;
  ageMax?: number;
  description?: string;
}

export function Settings() {
  const [settings, setSettings] = useState<NurserySettings | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);

  useEffect(() => {
    loadSettings();
    loadClasses();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiService.getParametres();
      const data = response.data;

      setSettings({
        _id: data.creche._id,
        nomCreche: data.creche.nom,
        telephone: data.creche.telephone,
        email: data.creche.email,
        adresse: data.creche.adresse,
        nomDirectrice: 'Madame Directrice', // TODO: Add to creche model
        fraisInscription: data.creche.fraisInscription,
        mensualite: data.creche.mensualite,
        logo: data.creche.logo
      });

      setClasses(data.classes);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to default values
      setSettings({
        _id: '1',
        nomCreche: 'E-Garderie',
        telephone: '+221 77 123 45 67',
        email: 'contact@egarderie.com',
        adresse: 'Dakar, Sénégal',
        nomDirectrice: 'Madame Directrice',
        fraisInscription: 50000,
        mensualite: 150000,
        logo: '/images/logo.png'
      });
      setClasses([]);
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


  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      // Always save settings
      await apiService.updateParametresCreche({
        nom: settings.nomCreche,
        adresse: settings.adresse,
        telephone: settings.telephone,
        email: settings.email,
        capaciteMaximale: 100, // TODO: Add to form
        fraisInscription: settings.fraisInscription,
        mensualite: settings.mensualite,
        logo: settings.logo
      });

      showSuccessAlert('Paramètres enregistrés avec succès');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      if (error.message?.includes('Session expirée') || error.message?.includes('Utilisateur non authentifié')) {
        // Don't show error alert for session expiry, user is already redirected
        return;
      }
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClass = () => {
    setClassToEdit(null);
    setIsClassFormOpen(true);
  };

  const handleEditClass = (classItem: Class) => {
    setClassToEdit(classItem);
    setIsClassFormOpen(true);
  };

  const handleDeleteClass = async (id: string) => {
    const confirmed = await showConfirmAlert(
      'Supprimer cette classe ?',
      'Confirmation de suppression',
      'Supprimer',
      'Annuler'
    );

    if (!confirmed) return;

    try {
      await apiService.deleteClasse(id);
      showSuccessAlert('Classe supprimée avec succès');
      loadClasses();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      showErrorAlert(error.message || 'Erreur lors de la suppression de la classe');
    }
  };

  const handleClassFormClose = () => {
    setIsClassFormOpen(false);
    setClassToEdit(null);
  };

  const handleClassFormSave = () => {
    loadClasses();
    setIsClassFormOpen(false);
    setClassToEdit(null);
  };

  if (loading || !settings) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-600 mt-1">Configuration de la crèche</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-100 p-3 rounded-xl">
            <Building className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Informations générales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la crèche
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Logo affiché sur les reçus</p>
                <p className="text-xs text-gray-500 mt-1">Le logo est géré automatiquement</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la crèche
            </label>
            <input
              type="text"
              value={settings.nomCreche}
              onChange={(e) => setSettings({ ...settings, nomCreche: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la directrice
            </label>
            <input
              type="text"
              value={settings.nomDirectrice || ''}
              onChange={(e) => setSettings({ ...settings, nomDirectrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.telephone || ''}
              onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={settings.adresse || ''}
              onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-3 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Tarification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frais d'inscription (XAF)
            </label>
            <input
              type="number"
              value={settings.fraisInscription}
              onChange={(e) => setSettings({ ...settings, fraisInscription: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensualité (XAF)
            </label>
            <input
              type="number"
              value={settings.mensualite}
              onChange={(e) => setSettings({ ...settings, mensualite: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Classes / Sections</h3>
          </div>
          <button
            onClick={handleAddClass}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition"
          >
            Ajouter une classe
          </button>
        </div>

        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{cls.nom}</p>
                <p className="text-sm text-gray-600">
                  Capacité: {cls.capacite} enfants • Âge: {cls.ageMin}-{cls.ageMax} ans
                </p>
                {cls.description && (
                  <p className="text-sm text-gray-500 mt-1">{cls.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditClass(cls)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClass(cls._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune classe configurée</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter une classe" pour commencer</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span className="font-semibold">{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
        </button>
      </div>

      {/* Modal du formulaire de classe */}
      <ClassForm
        isOpen={isClassFormOpen}
        onClose={handleClassFormClose}
        onSave={handleClassFormSave}
        classToEdit={classToEdit}
      />
    </div>
  );
}
