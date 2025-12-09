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

 
  useEffect(() => {
    localStorage.setItem('attendance-selectedDate', selectedDate);
  }, [selectedDate]);

  
  useEffect(() => {
    localStorage.setItem('attendance-view', view);
  }, [view]);

  useEffect(() => {
    if ((children.length > 0 && view === 'children') || (staff.length > 0 && view === 'staff')) {
      // Charger les données pour la nouvelle date
      loadAttendance();
    }
  }, [selectedDate, view, children.length, staff.length]);
  
  // Nettoyer les données de markedPersons quand on change de date
  useEffect(() => {
    const currentKey = `${selectedDate}-${view}`;
    setMarkedPersons(prev => {
      const newMarked = { ...prev };
      // Garder seulement les données pour la date actuelle
      Object.keys(newMarked).forEach(key => {
        if (key !== currentKey) {
          delete newMarked[key];
        }
      });
      return newMarked;
    });
  }, [selectedDate, view]);

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
      // Réinitialiser l'état avant de charger les nouvelles données
      setAttendance({});
      
      console.log('Loading attendance for date:', selectedDate);
      
      // Passer un objet avec la date au lieu d'une string
      const response = await apiService.getAttendance({ date: selectedDate });
      const attMap: Record<string, AttendanceRecord> = {};
      const marked: Set<string> = new Set();

      console.log('Attendance response:', response.data);

      response.data?.forEach((att: AttendanceRecord) => {
        const personId = att.enfantId || att.personnelId;
        if (personId) {
          const id = typeof personId === 'string' ? personId : (personId as any)._id;
          attMap[id] = att;
        
          if (att.statut === 'PRESENT' || att.statut === 'ABSENT') {
            marked.add(id);
          }
        }
      });

      console.log('Attendance map:', attMap);
      console.log('Marked persons:', marked);

      setAttendance(attMap);
      setMarkedPersons(prev => ({
        ...prev,
        [`${selectedDate}-${view}`]: marked
      }));
    } catch (error) {
      console.error('Error loading attendance:', error);
      // Réinitialiser l'état en cas d'erreur
      setAttendance({});
    }
  };

  const markAttendance = async (personId: string, status: string) => {
    const actionKey = `${personId}-${status}`;

    console.log('Marking attendance for person:', personId, 'status:', status, 'date:', selectedDate);

    if (processingActions[actionKey]) {
      return;
    }

    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    try {
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

      console.log('Attendance data to send:', attendanceData);

      let response;
      if (existingAttendance?._id) {
        console.log('Updating existing attendance:', existingAttendance._id);
        response = await apiService.updateAttendance(existingAttendance._id, attendanceData);
      } else {
        console.log('Creating new attendance');
        response = await apiService.markAttendance(attendanceData);
      }

      console.log('Response received:', response.data);

      const updatedAttendance = { ...attendance };
      updatedAttendance[personId] = response.data;

      setAttendance(updatedAttendance);

      const markedKey = `${selectedDate}-${view}`;
      const currentMarked = markedPersons[markedKey] || new Set();
      const newMarked = new Set(currentMarked);
      newMarked.add(personId);
      setMarkedPersons(prev => ({
        ...prev,
        [markedKey]: newMarked
      }));

      console.log('Updated attendance state:', updatedAttendance);
      console.log('Updated marked persons:', markedPersons);

      showSuccessAlert('Présence enregistrée avec succès');

      // Envoyer notification SMS aux parents pour les enfants
      // if (view === 'children') {
      //   await sendParentNotification(personId, status);
      // }

    } catch (error: any) {
      console.error('Error marking attendance:', error);
      showErrorAlert(error.message || 'Erreur lors de l\'enregistrement de la présence');

      loadAttendance();
    } finally {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };


  // const sendParentNotification = async (childId: string, statut: string) => {
  //   try {
  //     // Appeler l'API backend pour envoyer la notification
  //     const response = await apiService.sendAttendanceNotification({
  //       enfantId: childId,
  //       statut: statut
  //     });

  //     if (response.success) {
  //       showSuccessAlert(`Notification de ${statut === 'PRESENT' ? 'présence' : 'absence'} envoyée au parent`);
  //     } else {
  //       throw new Error(response.message || 'Erreur lors de l\'envoi de la notification');
  //     }

  //   } catch (error) {
  //     console.error('Erreur lors de l\'envoi de la notification:', error);
  //     showErrorAlert('Erreur lors de l\'envoi de la notification');
  //   }
  // };

  // Calculer les statistiques en temps réel basées sur les données actuelles
  const currentList = view === 'children' ? children.flatMap(group => group.children) : staff;
  const currentAttendanceRecords = view === 'children'
    ? Object.values(attendance).filter(a => a.enfantId)
    : Object.values(attendance).filter(a => a.personnelId);
  const presentCount = currentAttendanceRecords.filter(a => a.statut === 'PRESENT').length;
  const absentCount = currentAttendanceRecords.filter(a => a.statut === 'ABSENT').length;
  
  // Log pour debug
  console.log('Current attendance stats:', {
    total: currentList.length,
    present: presentCount,
    absent: absentCount,
    currentList: currentList.length,
    attendanceRecords: currentAttendanceRecords.length
  });


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
                                      onClick={() => markAttendance(child._id, 'PRESENT')}
                                      disabled={processingActions[`${child._id}-PRESENT`]}
                                      className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    >
                                      {processingActions[`${child._id}-PRESENT`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                                      <span>✓ Présent</span>
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
                        {status && attendanceRecord?.remarques && (
                          <div className="text-sm text-gray-600">
                            <p className="text-xs italic">"{attendanceRecord.remarques}"</p>
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
                              onClick={() => markAttendance(person._id, 'PRESENT')}
                              disabled={processingActions[`${person._id}-PRESENT`]}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {processingActions[`${person._id}-PRESENT`] && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
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
                {/* <p className="text-sm text-gray-400 mt-2">
                  {markedPersons[`${selectedDate}-${view}`]?.size || 0} enfant(s) marqué(s) sur {children.reduce((total, group) => total + group.children.length, 0)}
                </p> */}
              </div>
            )
          ) : (
            staff.filter(person => !markedPersons[`${selectedDate}-${view}`]?.has(person._id)).length === 0 && (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">Toutes les présences ont été marquées pour cette date !</p>
                {/* <p className="text-sm text-gray-400 mt-2">
                  {markedPersons[`${selectedDate}-${view}`]?.size || 0} personne(s) marquée(s) sur {staff.length}
                </p> */}
              </div>
            )
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
