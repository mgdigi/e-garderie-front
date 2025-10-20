import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Edit, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../lib/api';
import { MenuForm } from './MenuForm';
import { WeeklyMenuForm } from './WeeklyMenuForm';

interface Menu {
  _id: string;
  nom: string;
  dateDebut?: string;
  dateFin?: string;
  periode?: {
    debut: string;
    fin: string;
  };
  statut: string;
  menuHebdomadaire?: any;
}

export function Menus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const response = await apiService.getMenus();
      setMenus(response.data || []);
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const mealTypes = ['Déjeuner'];

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

  const getCurrentWeekMenu = () => {
    const weekStart = getWeekStart(currentWeek);
    const weekEnd = getWeekEnd(currentWeek);

    return menus.find(menu => {
      const menuStart = new Date(menu.periode?.debut || menu.dateDebut || '');
      const menuEnd = new Date(menu.periode?.fin || menu.dateFin || '');
      return menuStart <= weekEnd && menuEnd >= weekStart;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des menus</h2>
          <p className="text-gray-600 mt-1">Planifier les repas de la semaine</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Navigation par semaine */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">
                {getWeekStart(currentWeek).toLocaleDateString('fr-FR')} - {getWeekEnd(currentWeek).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              const currentMenu = getCurrentWeekMenu();
              if (currentMenu) {
                setEditingMenu(currentMenu);
              } else {
                setShowWeeklyForm(true);
              }
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            {getCurrentWeekMenu() ? (
              <>
                <Edit className="w-5 h-5" />
                <span className="font-semibold">Modifier le menu</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Créer le menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {(() => {
          const currentMenu = getCurrentWeekMenu();
          return currentMenu ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentMenu.nom}</h3>
                  <p className="text-gray-600">
                    Semaine du {getWeekStart(currentWeek).toLocaleDateString('fr-FR')} au {getWeekEnd(currentWeek).toLocaleDateString('fr-FR')}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    currentMenu.statut === 'ACTIF' ? 'bg-green-100 text-green-800' :
                    currentMenu.statut === 'BROUILLON' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentMenu.statut}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700 w-32">
                        Repas
                      </th>
                      {daysOfWeek.map(day => (
                        <th key={day} className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mealTypes.map((mealType, mealIndex) => (
                      <tr key={mealType}>
                        <td className="border border-gray-200 p-3 font-medium text-gray-700 bg-gray-50">
                          {mealType}
                        </td>
                        {daysOfWeek.map((day) => {
                          const dayKey = day.toLowerCase() as keyof typeof currentMenu.menuHebdomadaire;
                          const dayMenu = currentMenu.menuHebdomadaire?.[dayKey];
                          const mealData = dayMenu?.dejeuner;

                          return (
                            <td key={day} className="border border-gray-200 p-3">
                              <div className="p-3 rounded-lg min-h-[60px] bg-green-50">
                                {mealData?.platPrincipal ? (
                                  <div className="space-y-2">
                                    <p className="text-lg font-bold text-green-900">{mealData.platPrincipal}</p>
                                    {mealData.allergenes && mealData.allergenes.length > 0 && (
                                      <div className="pt-2 border-t border-green-200">
                                        <p className="text-xs text-red-600 font-medium">⚠️ Allergènes:</p>
                                        <p className="text-xs text-red-600">
                                          {mealData.allergenes.map((allergen: string) =>
                                            allergen.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                                          ).join(', ')}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Plat non défini</p>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Aucun menu défini pour la semaine du {getWeekStart(currentWeek).toLocaleDateString('fr-FR')} au {getWeekEnd(currentWeek).toLocaleDateString('fr-FR')}
              </p>
              <button
                onClick={() => setShowWeeklyForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl mx-auto hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Créer le menu de cette semaine</span>
              </button>
            </div>
          );
        })()}
      </div>

      <WeeklyMenuForm
        isOpen={showWeeklyForm || !!editingMenu}
        onClose={() => {
          setShowWeeklyForm(false);
          setEditingMenu(null);
        }}
        onSave={() => {
          loadMenus(); // Rafraîchissement automatique après création/modification
          setShowWeeklyForm(false);
          setEditingMenu(null);
        }}
        menu={editingMenu}
      />
    </div>
  );
}
