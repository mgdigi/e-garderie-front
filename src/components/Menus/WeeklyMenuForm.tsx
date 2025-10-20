import { useState, useEffect } from 'react';
import { X, Save, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface WeeklyMenuFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  menu?: any;
}

interface DayMenu {
  petitDejeuner: {
    plats: string[];
    allergenes: string[];
    remarques: string;
  };
  dejeuner: {
    entree: string;
    platPrincipal: string;
    accompagnement: string;
    dessert: string;
    allergenes: string[];
    remarques: string;
  };
  gouter: {
    plats: string[];
    allergenes: string[];
    remarques: string;
  };
}

interface WeeklyMenu {
  lundi: DayMenu;
  mardi: DayMenu;
  mercredi: DayMenu;
  jeudi: DayMenu;
  vendredi: DayMenu;
}

const defaultDayMenu: DayMenu = {
  petitDejeuner: {
    plats: [],
    allergenes: [],
    remarques: ''
  },
  dejeuner: {
    entree: '',
    platPrincipal: '',
    accompagnement: '',
    dessert: '',
    allergenes: [],
    remarques: ''
  },
  gouter: {
    plats: [],
    allergenes: [],
    remarques: ''
  }
};

const defaultWeeklyMenu: WeeklyMenu = {
  lundi: { ...defaultDayMenu },
  mardi: { ...defaultDayMenu },
  mercredi: { ...defaultDayMenu },
  jeudi: { ...defaultDayMenu },
  vendredi: { ...defaultDayMenu }
};

export function WeeklyMenuForm({ isOpen, onClose, onSave, menu }: WeeklyMenuFormProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [menuData, setMenuData] = useState<WeeklyMenu>(defaultWeeklyMenu);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'HEBDOMADAIRE',
    statut: 'BROUILLON'
  });
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
  const mealTypes = ['dejeuner'];

  

  useEffect(() => {
    if (menu) {
      setFormData({
        nom: menu.nom || '',
        type: menu.type || 'HEBDOMADAIRE',
        statut: menu.statut || 'BROUILLON'
      });
      setMenuData(menu.menuHebdomadaire || defaultWeeklyMenu);
    } else {
      // Générer le nom automatiquement
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);
      setFormData({
        nom: `Menu du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}`,
        type: 'HEBDOMADAIRE',
        statut: 'BROUILLON'
      });
      setMenuData(defaultWeeklyMenu);
    }
  }, [menu, currentWeek]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const d = new Date(getWeekStart(date));
    d.setDate(d.getDate() + 4); // Vendredi
    return d;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const updateMeal = (day: string, mealType: string, field: string, value: any) => {
    setMenuData(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof WeeklyMenu],
        [mealType]: {
          ...prev[day as keyof WeeklyMenu][mealType as keyof DayMenu],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);

      // Vérifier si un menu existe déjà pour cette période
      if (!menu) {
        const existingMenu = await apiService.getMenus();
        const hasExistingMenu = existingMenu.data?.some((m: any) => {
          const menuStart = new Date(m.periode?.debut || m.dateDebut || '');
          const menuEnd = new Date(m.periode?.fin || m.dateFin || '');
          return menuStart <= weekEnd && menuEnd >= weekStart;
        });

        if (hasExistingMenu) {
          showErrorAlert('Un menu existe déjà pour cette semaine. Veuillez modifier le menu existant.');
          setLoading(false);
          return;
        }
      }

      const menuPayload = {
        nom: formData.nom,
        type: formData.type,
        periode: {
          debut: weekStart.toISOString(),
          fin: weekEnd.toISOString()
        },
        menuHebdomadaire: menuData,
        statut: formData.statut
      };

      if (menu) {
        await apiService.updateMenu(menu._id, menuPayload);
        showSuccessAlert('Menu mis à jour avec succès');
      } else {
        await apiService.createMenu(menuPayload);
        showSuccessAlert('Menu créé avec succès');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving menu:', error);
      showErrorAlert(error.message || 'Erreur lors de la sauvegarde du menu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gestion du menu hebdomadaire</h3>
            <div className="flex items-center space-x-4 mt-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {getWeekStart(currentWeek).toLocaleDateString('fr-FR')} - {getWeekEnd(currentWeek).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du menu
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
                <option value="MENSUEL">Mensuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ACTIF">Actif</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </div>
          </div>

          {/* Menu hebdomadaire - Déjeuner uniquement */}
          <div className="space-y-6">
            {daysOfWeek.map(day => (
              <div key={day} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {day.charAt(0).toUpperCase() + day.slice(1)} - Plat du jour
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Plat du jour</label>
                    <input
                      type="text"
                      value={menuData[day as keyof WeeklyMenu].dejeuner.platPrincipal}
                      onChange={(e) => updateMeal(day, 'dejeuner', 'platPrincipal', e.target.value)}
                      placeholder="Ex: Poulet yassa, Thieboudienne, Mafé..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                 
                </div>
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
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
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder le menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}