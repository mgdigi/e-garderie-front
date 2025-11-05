import { useEffect, useState } from 'react';
import { Calendar, UserCheck, X, Check, Clock, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

interface Child {
  _id: string;
  nom: string;
  prenom: string;
  classeId?: any;
}

interface ClassGroup {
  className: string;
  classId: string;
  children: Child[];
}

interface Staff {
  _id: string;
  nom: string;
  prenom: string;
}

interface AttendanceRecord {
  _id: string;
  enfantId?: string;
  personnelId?: string;
  date: string;
  statut: string;
  heureArrivee?: string;
  heureDepart?: string;
  remarques?: string;
}

export function Attendance() {
  const [children, setChildren] = useState<ClassGroup[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('attendance-selectedDate');
    return saved || new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'children' | 'staff'>(() => {
    const saved = localStorage.getItem('attendance-view');
    return (saved as 'children' | 'staff') || 'children';
  });
  const [markedPersons, setMarkedPersons] = useState<Record<string, Set<string>>>({});
  const [processingActions, setProcessingActions] = useState<Record<string, boolean>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadChildren();
    loadStaff();
  }, []);

  // Sauvegarder selectedDate dans localStorage
  useEffect(() => {
    localStorage.setItem('attendance-selectedDate', selectedDate);
  }, [selectedDate]);

  // Sauvegarder view dans localStorage
  useEffect(() => {
    localStorage.setItem('attendance-view', view);
  }, [view]);

  useEffect(() => {
    if ((children.length > 0 && view === 'children') || (staff.length > 0 && view === 'staff')) {
      loadAttendance();
    }
  }, [selectedDate, children, staff, view]);

  const loadChildren = async () => {
    try {
      const response = await apiService.getChildren();
      const activeChildren = (response.data || []).filter((child: any) => child.statut === 'ACTIF');

      // Grouper les enfants par classe
      const groupedByClass = activeChildren.reduce((acc: any, child: any) => {
        const classId = typeof child.classeId === 'object' ? child.classeId?._id : child.classeId;
        const className = typeof child.classeId === 'object' ? child.classeId?.nom : 'Non assigné';

        if (!acc[classId || 'unassigned']) {
          acc[classId || 'unassigned'] = {
            className: className || 'Non assigné',
            classId: classId || 'unassigned',
            children: []
          };
        }

        acc[classId || 'unassigned'].children.push(child);
        return acc;
      }, {});

      // Convertir en tableau et trier par nom de classe
      const groupedChildren = Object.values(groupedByClass).sort((a: any, b: any) =>
        a.className.localeCompare(b.className)
      );

      setChildren(groupedChildren as any);
    } catch (error) {
      console.error('Error loading children:', error);
      setChildren([]);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await apiService.getAllStaff();
      // Filter only active staff
      const activeStaff = (response.data || []).filter((person: any) => person.statut === 'ACTIF');
      setStaff(activeStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await apiService.getAttendance(selectedDate);
      const attMap: Record<string, AttendanceRecord> = {};
      const marked: Set<string> = new Set();

      response.data?.forEach((att: AttendanceRecord) => {
        const personId = att.enfantId || att.personnelId;
        if (personId) {
          attMap[personId] = att;
          marked.add(personId); // Mark as already processed for this date
        }
      });

      setAttendance(attMap);
      setMarkedPersons(prev => ({
        ...prev,
        [`${selectedDate}-${view}`]: marked
      }));
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const markAttendance = async (personId: string, status: string, actionType?: 'arrival' | 'departure') => {
    const actionKey = `${personId}-${actionType || status}`;

    // Prévention des double-clics
    if (processingActions[actionKey]) {
      return;
    }

    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    try {
      const currentTime = new Date().toTimeString().split(' ')[0];
      const existingAttendance = attendance[personId];

      let attendanceData: any = {
        date: selectedDate,
        statut: status
      };

      if (view === 'children') {
        attendanceData.enfantId = personId;
      } else {
        attendanceData.personnelId = personId;
      }

      // Gestion des heures d'arrivée/départ
      if (status === 'PRESENT') {
        if (actionType === 'arrival' || !existingAttendance?.heureArrivee) {
          // Enregistrement de l'arrivée
          attendanceData.heureArrivee = currentTime;
          attendanceData.heureDepart = existingAttendance?.heureDepart || undefined;
        } else if (actionType === 'departure' || (existingAttendance?.heureArrivee && !existingAttendance?.heureDepart)) {
          // Enregistrement du départ
          attendanceData.heureDepart = currentTime;
          attendanceData.heureArrivee = existingAttendance?.heureArrivee || undefined;
        } else {
          // Nouvelle arrivée si pas d'heure d'arrivée
          attendanceData.heureArrivee = currentTime;
          attendanceData.heureDepart = undefined;
        }
      } else {
        // Pour absent, pas d'heures
        attendanceData.heureArrivee = undefined;
        attendanceData.heureDepart = undefined;
      }

      let response;
      if (existingAttendance?._id) {
        response = await apiService.updateAttendance(existingAttendance._id, attendanceData);
      } else {
        response = await apiService.markAttendance(attendanceData);
      }

      // Mise à jour optimiste de l'état local
      const updatedAttendance = { ...attendance };
      updatedAttendance[personId] = response.data;

      // Si départ marqué, changer automatiquement le statut à ABSENT
      if (actionType === 'departure' && view === 'children') {
        updatedAttendance[personId] = {
          ...updatedAttendance[personId],
          statut: 'ABSENT'
        };
      }

      setAttendance(updatedAttendance);

      // Mise à jour des statistiques
      const markedKey = `${selectedDate}-${view}`;
      const currentMarked = markedPersons[markedKey] || new Set();
      const newMarked = new Set(currentMarked);
      newMarked.add(personId);
      setMarkedPersons(prev => ({
        ...prev,
        [markedKey]: newMarked
      }));

      showSuccessAlert('Présence enregistrée avec succès');

      // Envoyer notification SMS aux parents pour les enfants
      if (view === 'children' && status === 'PRESENT' && actionType) {
        await sendParentNotification(personId, actionType, currentTime);
      }

    } catch (error: any) {
      console.error('Error marking attendance:', error);
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement de la présence');
      // Recharger les données en cas d'erreur pour synchroniser l'état
      loadAttendance();
    } finally {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };


  const sendParentNotification = async (childId: string, type: 'arrival' | 'departure', time: string) => {
    try {
      // Appeler l'API backend pour envoyer la notification
      const response = await apiService.sendAttendanceNotification({
        enfantId: childId,
        type: type,
        time: time
      });

      if (response.success) {
        showSuccessAlert(`Notification ${type === 'arrival' ? 'd\'arrivée' : 'de départ'} envoyée au parent`);
      } else {
        throw new Error(response.message || 'Erreur lors de l\'envoi de la notification');
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      showErrorAlert('Erreur lors de l\'envoi de la notification');
    }
  };

  const currentList = view === 'children' ? children.flatMap(group => group.children) : staff;
  const presentCount = Object.values(attendance).filter(a => a.statut === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(a => a.statut === 'ABSENT').length;


  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des présences</h2>
          <p className="text-gray-600 mt-1">Suivre les présences quotidiennes</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setView('children')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'children' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Enfants ({children.reduce((total, group) => total + group.children.length, 0)})
          </button>
          <button
            onClick={() => setView('staff')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'staff' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Personnel ({staff.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total {view === 'children' ? 'enfants' : 'personnel'}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{currentList.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Présents</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absents</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentCount}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de présence</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {currentList.length > 0 ? Math.round((presentCount / currentList.length) * 100) : 0}%
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gerer les presences  des {view === 'children' ? 'enfants' : 'personnels'}
        </h3>
        <div className="space-y-6">
          <div className="max-h-96 overflow-y-auto">
            {view === 'children' ? (
            // Affichage groupé par classe pour les enfants avec accordéon
            children.map((classGroup) => {
              const isExpanded = expandedClasses[classGroup.classId] ?? true; // Par défaut ouvert
              const allMarked = classGroup.children.every(child => markedPersons[`${selectedDate}-${view}`]?.has(child._id));
              const someMarked = classGroup.children.some(child => markedPersons[`${selectedDate}-${view}`]?.has(child._id));

              return (
                <div key={classGroup.classId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedClasses(prev => ({ ...prev, [classGroup.classId]: !isExpanded }))}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {classGroup.className[0]}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">{classGroup.className}</h4>
                        <p className="text-sm text-gray-500">{classGroup.children.length} enfants</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {allMarked && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          ✓ Terminé
                        </span>
                      )}
                      {someMarked && !allMarked && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          En cours
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {classGroup.children.map((child) => {
                        const isMarked = markedPersons[`${selectedDate}-${view}`]?.has(child._id);
                        const attendanceRecord = attendance[child._id];
                        const status = attendanceRecord?.statut;

                        return (
                          <div key={child._id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {child.nom[0]}{child.prenom[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{child.nom} {child.prenom}</p>
                                {status && (
                                  <div className="text-sm text-gray-600">
                                    {attendanceRecord?.heureArrivee && <p>Arrivée: {attendanceRecord.heureArrivee}</p>}
                                    {attendanceRecord?.heureDepart && <p>Départ: {attendanceRecord.heureDepart}</p>}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {status ? (
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    status === 'PRESENT'
                                      ? 'bg-green-100 text-green-700'
                                      : status === 'ABSENT'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {status === 'PRESENT' ? '✓ Présent' : status === 'ABSENT' ? '✗ Absent' : status}
                                  </span>
                                  {status === 'PRESENT' && (
                                    <div className="flex space-x-1">
                                      {!attendanceRecord?.heureArrivee && (
                                        <button
                                          onClick={() => markAttendance(child._id, 'PRESENT', 'arrival')}
                                          disabled={processingActions[`${child._id}-arrival`] || processingActions[`${child._id}-PRESENT`]}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                          title="Enregistrer l'arrivée"
                                        >
                                          {processingActions[`${child._id}-arrival`] && <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>}
                                          <Clock className="w-3 h-3" />
                                          <span>Arrivée</span>
                                        </button>
                                      )}
                                      {attendanceRecord?.heureArrivee && !attendanceRecord?.heureDepart && (
                                        <button
                                          onClick={() => markAttendance(child._id, 'PRESENT', 'departure')}
                                          disabled={processingActions[`${child._id}-departure`] || processingActions[`${child._id}-PRESENT`]}
                                          className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                          title="Enregistrer le départ"
                                        >
                                          {processingActions[`${child._id}-departure`] && <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>}
                                          <LogOut className="w-3 h-3" />
                                          <span>Départ</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => markAttendance(child._id, status === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                                    disabled={processingActions[`${child._id}-${status === 'PRESENT' ? 'ABSENT' : 'PRESENT'}`]}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Modifier le statut"
                                  >
                                    Modifier
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => markAttendance(child._id, 'PRESENT', 'arrival')}
                                      disabled={processingActions[`${child._id}-arrival`] || processingActions[`${child._id}-PRESENT`]}
                                      className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    >
                                      {processingActions[`${child._id}-arrival`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                                      <Clock className="w-4 h-4" />
                                      <span>✓ Arrivée</span>
                                    </button>
                                    <button
                                      onClick={() => markAttendance(child._id, 'PRESENT', 'departure')}
                                      disabled={processingActions[`${child._id}-departure`] || processingActions[`${child._id}-PRESENT`]}
                                      className="px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    >
                                      {processingActions[`${child._id}-departure`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                                      <LogOut className="w-4 h-4" />
                                      <span>🚪 Départ</span>
                                    </button>
                                    <button
                                      onClick={() => markAttendance(child._id, 'ABSENT')}
                                      disabled={processingActions[`${child._id}-ABSENT`]}
                                      className="px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    >
                                      {processingActions[`${child._id}-ABSENT`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                                      <span>✗ Absent</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Affichage normal pour le personnel
            <div className="space-y-3">
              {staff.map((person) => {
                const isMarked = markedPersons[`${selectedDate}-${view}`]?.has(person._id);
                const attendanceRecord = attendance[person._id];
                const status = attendanceRecord?.statut;

                return (
                  <div key={person._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {person.nom[0]}{person.prenom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{person.nom} {person.prenom}</p>
                        {status && (
                          <div className="text-sm text-gray-600">
                            {attendanceRecord?.heureArrivee && <p>Arrivée: {attendanceRecord.heureArrivee}</p>}
                            {attendanceRecord?.heureDepart && <p>Départ: {attendanceRecord.heureDepart}</p>}
                            {attendanceRecord?.remarques && <p className="text-xs italic">"{attendanceRecord.remarques}"</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === 'PRESENT'
                              ? 'bg-green-100 text-green-700'
                              : status === 'ABSENT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {status === 'PRESENT' ? '✓ Présent' : status === 'ABSENT' ? '✗ Absent' : status}
                          </span>
                          <button
                            onClick={() => markAttendance(person._id, status === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                            disabled={processingActions[`${person._id}-${status === 'PRESENT' ? 'ABSENT' : 'PRESENT'}`]}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Modifier le statut"
                          >
                            Modifier
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => markAttendance(person._id, 'PRESENT', 'arrival')}
                              disabled={processingActions[`${person._id}-arrival`] || processingActions[`${person._id}-PRESENT`]}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {processingActions[`${person._id}-arrival`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                              <span>✓ Présent</span>
                            </button>
                            <button
                              onClick={() => markAttendance(person._id, 'ABSENT')}
                              disabled={processingActions[`${person._id}-ABSENT`]}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {processingActions[`${person._id}-ABSENT`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                              <span>✗ Absent</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {view === 'children' ? (
            children.every(classGroup => classGroup.children.every(child => markedPersons[`${selectedDate}-${view}`]?.has(child._id))) && (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">Toutes les présences ont été marquées pour cette date !</p>
                <p className="text-sm text-gray-400 mt-2">
                  {markedPersons[`${selectedDate}-${view}`]?.size || 0} enfant(s) marqué(s) sur {children.reduce((total, group) => total + group.children.length, 0)}
                </p>
              </div>
            )
          ) : (
            staff.filter(person => !markedPersons[`${selectedDate}-${view}`]?.has(person._id)).length === 0 && (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">Toutes les présences ont été marquées pour cette date !</p>
                <p className="text-sm text-gray-400 mt-2">
                  {markedPersons[`${selectedDate}-${view}`]?.size || 0} personne(s) marquée(s) sur {staff.length}
                </p>
              </div>
            )
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
