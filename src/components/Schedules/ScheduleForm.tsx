import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Class {
  _id: string;
  nom: string;
  capacite: number;
}

interface Schedule {
  _id: string;
  nom: string;
  section: string;
  sectionId?: string;
  statut: string;
  planning?: {
    lundi?: any[];
    mardi?: any[];
    mercredi?: any[];
    jeudi?: any[];
    vendredi?: any[];
  };
  activites?: {
    jour: string;
    heureDebut: string;
    heureFin: string;
    activite: string;
  }[];
}

interface ScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  classes: Class[];
  selectedClass: string;
  schedule?: Schedule | null;
}

export function ScheduleForm({ isOpen, onClose, onSave, classes, selectedClass, schedule }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    nom: schedule?.nom || '',
    sectionId: schedule?.section || selectedClass,
    statut: schedule?.statut || 'ACTIF'
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les données du planning existant
  useEffect(() => {
    if (schedule?.planning) {
      const loadedActivities: any[] = [];
      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

      days.forEach(day => {
        const dayActivities = schedule.planning?.[day as keyof typeof schedule.planning] || [];
        dayActivities.forEach((activity: any) => {
          loadedActivities.push({
            jour: day,
            heureDebut: activity.heureDebut,
            heureFin: activity.heureFin,
            activite: activity.activite
          });
        });
      });

      setActivities(loadedActivities);
    } else if (schedule?.activites) {
      setActivities(schedule.activites);
    } else {
      setActivities([]);
    }

    // Mettre à jour le formData
    setFormData({
      nom: schedule?.nom || `Emploi du temps ${classes.find(c => c._id === selectedClass)?.nom || selectedClass}`,
      sectionId: schedule?.section || selectedClass,
      statut: schedule?.statut || 'ACTIF'
    });
  }, [schedule, selectedClass, classes]);

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const timeSlots = [
    { start: '08:00', end: '09:00', label: '8h-9h' },
    { start: '09:00', end: '10:00', label: '9h-10h' },
    { start: '10:00', end: '11:00', label: '10h-11h' },
    { start: '11:00', end: '12:00', label: '11h-12h' },
    { start: '12:00', end: '14:00', label: '12h-14h' },
    { start: '14:00', end: '15:00', label: '14h-15h' },
    { start: '15:00', end: '17:00', label: '15h-17h' }
  ];

  const activityOptions = [
    { value: 'ACCUEIL', label: 'Accueil' },
    { value: 'PETIT_DEJEUNER', label: 'Petit-déjeuner' },
    { value: 'ACTIVITE_PEDAGOGIQUE', label: 'Activité pédagogique' },
    { value: 'JEU_LIBRE', label: 'Jeu libre' },
    { value: 'SIESTE', label: 'Sieste' },
    { value: 'DEJEUNER', label: 'Déjeuner' },
    { value: 'GOUTER', label: 'Goûter' },
    { value: 'ACTIVITE_MOTRICE', label: 'Activité motrice' },
    { value: 'LECTURE', label: 'Lecture' },
    { value: 'CHANT', label: 'Chant' },
    { value: 'DESSIN', label: 'Dessin' },
    { value: 'SORTIE', label: 'Sortie' },
    { value: 'HYGIENE', label: 'Hygiène' },
    { value: 'DEPART', label: 'Départ' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Transformer les activités en format attendu par le backend
      const planning: any = {};
      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

      days.forEach(day => {
        planning[day] = [];
      });

      activities.forEach(activity => {
        const day = activity.jour.toLowerCase();
        if (planning[day]) {
          planning[day].push({
            heureDebut: activity.heureDebut,
            heureFin: activity.heureFin,
            activite: activity.activite, // Maintenant directement la valeur enum
            description: activityOptions.find(opt => opt.value === activity.activite)?.label || activity.activite,
            educatriceId: null,
            lieu: ''
          });
        }
      });

      const scheduleData = {
        nom: formData.nom,
        section: formData.sectionId,
        semaine: {
          debut: new Date().toISOString().split('T')[0], // Date actuelle
          fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 jours
        },
        planning,
        statut: formData.statut
      };

      console.log('Schedule data to send:', scheduleData);

      if (schedule) {
        await apiService.updateSchedule(schedule._id, scheduleData);
        showSuccessAlert('Emploi du temps mis à jour avec succès');
      } else {
        await apiService.createSchedule(scheduleData);
        showSuccessAlert('Emploi du temps créé avec succès');
      }
      onSave();
      onClose();
      setFormData({
        nom: `Emploi du temps ${classes.find(c => c._id === selectedClass)?.nom || selectedClass}`,
        sectionId: selectedClass,
        statut: 'ACTIF'
      });
      setActivities([]);
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = (day: string, timeSlot: string, activity: string) => {
    const [heureDebut, heureFin] = timeSlot.split(' - ');
    const existingIndex = activities.findIndex(a => a.jour === day && a.heureDebut === heureDebut);

    if (existingIndex >= 0) {
      const newActivities = [...activities];
      newActivities[existingIndex] = { jour: day, heureDebut, heureFin, activite: activity };
      setActivities(newActivities);
    } else {
      setActivities([...activities, { jour: day, heureDebut, heureFin, activite: activity }]);
    }
  };

  const getActivity = (day: string, timeSlot: string) => {
    const [heureDebut] = timeSlot.split(' - ');
    const activity = activities.find(a => a.jour === day && a.heureDebut === heureDebut);
    return activity?.activite || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {schedule ? 'Modifier l\'emploi du temps' : 'Créer un emploi du temps'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'emploi du temps
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Emploi du temps Petite Section"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Sélectionner une section</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.nom} (Capacité: {cls.capacite})
                  </option>
                ))}
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
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuration des activités</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 font-semibold text-gray-700">Heure</th>
                    {daysOfWeek.map(day => (
                      <th key={day} className="border border-gray-200 p-3 font-semibold text-gray-700 min-w-[150px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, index) => (
                    <tr key={index}>
                      <td className="border border-gray-200 p-3 font-medium text-gray-700 bg-gray-50">
                        {slot.label}
                      </td>
                      {daysOfWeek.map(day => (
                        <td key={day} className="border border-gray-200 p-3">
                          <select
                            value={getActivity(day, `${slot.start} - ${slot.end}`)}
                            onChange={(e) => updateActivity(day, `${slot.start} - ${slot.end}`, e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">-- Sélectionner --</option>
                            {activityOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : (schedule ? 'Modifier' : 'Créer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}