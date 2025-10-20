import { useEffect, useState } from 'react';
import { Save, Building, DollarSign, Users } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../../lib/sweetalert';

interface NurserySettings {
  _id: string;
  nomCreche: string;
  telephone: string;
  email: string;
  adresse: string;
  nomDirectrice: string;
  fraisInscription: number;
  mensualite: number;
}

interface Class {
  _id: string;
  nom: string;
  capacite: number;
}

export function Settings() {
  const [settings, setSettings] = useState<NurserySettings | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadClasses();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Implement settings endpoint
      // For now, mock data
      setSettings({
        _id: '1',
        nomCreche: 'E-Garderie',
        telephone: '+221 77 123 45 67',
        email: 'contact@egarderie.com',
        adresse: 'Dakar, Sénégal',
        nomDirectrice: 'Madame Directrice',
        fraisInscription: 50000,
        mensualite: 150000
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      // TODO: Implement classes endpoint
      setClasses([
        { _id: '1', nom: 'Petite Section', capacite: 20 },
        { _id: '2', nom: 'Moyenne Section', capacite: 20 },
        { _id: '3', nom: 'Grande Section', capacite: 20 }
      ]);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      // TODO: Implement save settings endpoint
      showSuccessAlert('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorAlert('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClass = async () => {
    const name = prompt('Nom de la classe:');
    if (!name) return;

    try {
      // TODO: Implement add class endpoint
      loadClasses();
    } catch (error) {
      console.error('Error adding class:', error);
    }
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
      // TODO: Implement delete class endpoint
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      showErrorAlert('Erreur lors de la suppression de la classe');
    }
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
                <p className="text-sm text-gray-600">Capacité: {cls.capacite} enfants</p>
              </div>
              <button
                onClick={() => handleDeleteClass(cls._id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Supprimer
              </button>
            </div>
          ))}
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
    </div>
  );
}
