import { useEffect, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { apiService } from '../../lib/api';
import { ScheduleForm } from './ScheduleForm';

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

export function Schedules() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSchedules();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      // Use static sections that match the backend
      setClasses([
        { _id: 'BEBES', nom: 'Bébés (0-2 ans)', capacite: 20 },
        { _id: 'MOYENS', nom: 'Moyens (2-4 ans)', capacite: 25 },
        { _id: 'GRANDS', nom: 'Grands (4-6 ans)', capacite: 30 }
      ]);
      if (classes.length > 0) setSelectedClass(classes[0]._id);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await apiService.getSchedules({ section: selectedClass });
      console.log('Schedules loaded for section:', selectedClass, response.data);
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Emplois du temps</h2>
          <p className="text-gray-600 mt-1">Planifier les activités hebdomadaires</p>
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
        >
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.nom}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun emploi du temps pour cette classe</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl mx-auto hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Créer un emploi du temps</span>
            </button>
          </div>
        ) : schedules.length === 1 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{schedule.nom}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      schedule.statut === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.statut}
                    </span>
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700">Heure</th>
                        {daysOfWeek.map(day => (
                          <th key={day} className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.planning ? (
                       
                        [
                          { time: '08:00 - 08:30', start: '08:00', end: '08:30' },
                          { time: '08:30 - 09:00', start: '08:30', end: '09:00' },
                          { time: '09:00 - 09:30', start: '09:00', end: '09:30' },
                          { time: '09:30 - 10:00', start: '09:30', end: '10:00' },
                          { time: '10:00 - 10:30', start: '10:00', end: '10:30' },
                          { time: '10:30 - 11:00', start: '10:30', end: '11:00' },
                          { time: '11:00 - 11:30', start: '11:00', end: '11:30' },
                          { time: '11:30 - 12:00', start: '11:30', end: '12:00' },
                          { time: '12:00 - 12:30', start: '12:00', end: '12:30' },
                          { time: '12:30 - 13:00', start: '12:30', end: '13:00' },
                          { time: '13:00 - 13:30', start: '13:00', end: '13:30' },
                          { time: '13:30 - 14:00', start: '13:30', end: '14:00' },
                          { time: '14:00 - 14:30', start: '14:00', end: '14:30' },
                          { time: '14:30 - 15:00', start: '14:30', end: '15:00' },
                          { time: '15:00 - 15:30', start: '15:00', end: '15:30' },
                          { time: '15:30 - 16:00', start: '15:30', end: '16:00' },
                          { time: '16:00 - 16:30', start: '16:00', end: '16:30' },
                        
                          
                          
                        ].map((slot, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map(day => {
                              const dayKey = day.toLowerCase() as keyof typeof schedule.planning;
                              const dayActivities = schedule.planning?.[dayKey] || [];
                              const activityForSlot = dayActivities.find((act: any) =>
                                act.heureDebut === slot.start && act.heureFin === slot.end
                              );

                              return (
                                <td key={day} className="border border-gray-200 p-3">
                                  <div className="bg-blue-50 p-2 rounded-lg">
                                    <p className="font-medium text-blue-900 text-sm">
                                      {activityForSlot ? activityForSlot.description || activityForSlot.activite : 'Libre'}
                                    </p>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : schedule.activites ? (
                        // Grouper par créneau horaire
                        schedule.activites.reduce((acc: any[], activite) => {
                          const timeSlot = `${activite.heureDebut} - ${activite.heureFin}`;
                          const existingSlot = acc.find(slot => slot.time === timeSlot);
                          if (existingSlot) {
                            existingSlot.activities[activite.jour] = activite.activite;
                          } else {
                            acc.push({
                              time: timeSlot,
                              activities: { [activite.jour]: activite.activite }
                            });
                          }
                          return acc;
                        }, []).map((slot: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map(day => (
                              <td key={day} className="border border-gray-200 p-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <p className="font-medium text-blue-900 text-sm">
                                    {slot.activities[day] || 'Libre'}
                                  </p>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        // Données par défaut si pas d'activités définies
                        [
                          { time: '8:00 - 8:30', activity: 'Accueil', color: 'blue' },
                          { time: '8:30 - 9:00', activity: 'Activités éducatives', color: 'green' },
                          { time: '9:00 - 9:30', activity: 'Jeux libres', color: 'yellow' },
                          { time: '9:30 - 10:00', activity: 'Déjeuner', color: 'orange' },
                          { time: '10:00 - 10:30', activity: 'Sieste', color: 'purple' },
                          { time: '10:30 - 11:00', activity: 'Goûter', color: 'pink' },
                          { time: '11:00 - 11:30', activity: 'Activités & Départ', color: 'cyan' },
                          { time: '11:30 - 12:00', activity: 'Activités & Départ', color: 'cyan' }

                        ].map((slot, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map((_, dayIndex) => (
                              <td key={dayIndex} className="border border-gray-200 p-3">
                                <div className={`bg-${slot.color}-50 p-2 rounded-lg`}>
                                  <p className={`font-medium text-${slot.color}-900 text-sm`}>{slot.activity}</p>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{schedule.nom}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      schedule.statut === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.statut}
                    </span>
                    <button
                      onClick={() => setEditingSchedule(schedule)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700">Heure</th>
                        {daysOfWeek.map(day => (
                          <th key={day} className="border border-gray-200 p-3 bg-gray-50 font-semibold text-gray-700">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.activites && schedule.activites.length > 0 ? (
                        // Grouper par créneau horaire
                        schedule.activites.reduce((acc: any[], activite) => {
                          const timeSlot = `${activite.heureDebut} - ${activite.heureFin}`;
                          const existingSlot = acc.find(slot => slot.time === timeSlot);
                          if (existingSlot) {
                            existingSlot.activities[activite.jour] = activite.activite;
                          } else {
                            acc.push({
                              time: timeSlot,
                              activities: { [activite.jour]: activite.activite }
                            });
                          }
                          return acc;
                        }, []).map((slot: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map(day => (
                              <td key={day} className="border border-gray-200 p-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <p className="font-medium text-blue-900 text-sm">
                                    {slot.activities[day] || 'Libre'}
                                  </p>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : schedule.planning ? (
                        // Afficher les données du planning depuis la base de données
                        [
                          { time: '08:00 - 09:00', start: '08:00', end: '09:00' },
                          { time: '09:00 - 10:00', start: '09:00', end: '10:00' },
                          { time: '10:00 - 11:00', start: '10:00', end: '11:00' },
                          { time: '11:00 - 12:00', start: '11:00', end: '12:00' },
                          { time: '12:00 - 14:00', start: '12:00', end: '14:00' },
                          { time: '14:00 - 15:00', start: '14:00', end: '15:00' },
                          { time: '15:00 - 17:00', start: '15:00', end: '17:00' }
                        ].map((slot, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map(day => {
                              const dayKey = day.toLowerCase() as keyof typeof schedule.planning;
                              const dayActivities = schedule.planning?.[dayKey] || [];
                              const activityForSlot = dayActivities.find((act: any) =>
                                act.heureDebut === slot.start && act.heureFin === slot.end
                              );

                              return (
                                <td key={day} className="border border-gray-200 p-3">
                                  <div className="bg-blue-50 p-2 rounded-lg">
                                    <p className="font-medium text-blue-900 text-sm">
                                      {activityForSlot ? activityForSlot.description || activityForSlot.activite : 'Libre'}
                                    </p>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ) : (
                        // Données par défaut si pas d'activités définies
                        [
                          { time: '8:00 - 9:00', activity: 'Accueil', color: 'blue' },
                          { time: '9:00 - 10:00', activity: 'Activités éducatives', color: 'green' },
                          { time: '10:00 - 11:00', activity: 'Jeux libres', color: 'yellow' },
                          { time: '11:00 - 12:00', activity: 'Déjeuner', color: 'orange' },
                          { time: '12:00 - 14:00', activity: 'Sieste', color: 'purple' },
                          { time: '14:00 - 15:00', activity: 'Goûter', color: 'pink' },
                          { time: '15:00 - 17:00', activity: 'Activités & Départ', color: 'cyan' }
                        ].map((slot, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3 font-medium text-gray-700">{slot.time}</td>
                            {daysOfWeek.map((_, dayIndex) => (
                              <td key={dayIndex} className="border border-gray-200 p-3">
                                <div className={`bg-${slot.color}-50 p-2 rounded-lg`}>
                                  <p className={`font-medium text-${slot.color}-900 text-sm`}>{slot.activity}</p>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScheduleForm
        isOpen={showForm || !!editingSchedule}
        onClose={() => {
          setShowForm(false);
          setEditingSchedule(null);
        }}
        onSave={() => {
          loadSchedules(); // Rafraîchissement automatique après création/modification
          setShowForm(false);
          setEditingSchedule(null);
        }}
        classes={classes}
        selectedClass={selectedClass}
        schedule={editingSchedule as any}
      />
    </div>
  );
}
