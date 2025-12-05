import { useEffect, useState } from 'react';
import { X, User, Heart, DollarSign, Calendar } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert } from '../../lib/sweetalert';

interface Parent {
  nom: string;
  prenom: string;
  relation: string;
  telephone: string;
  email?: string;
  adresse?: string;
  profession?: string;
  estContactUrgence: boolean;
}

interface Sante {
  allergies: string[];
  restrictionsAlimentaires: string[];
  remarquesMedicales: string;
  medicamentsReguliers: Array<{
    nom: string;
    dosage: string;
    frequence: string;
    instructions: string;
  }>;
}

interface Child {
  _id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  section: string;
  statut: string;
  dateInscription: string;
  tarifMensuel: number;
  fraisInscription: number;
  parents: Parent[];
  sante: Sante;
  remarques?: string;
}

interface AttendanceRecord {
  _id: string;
  enfantId: string;
  date: string;
  statut: string;
  heureArrivee?: string;
  heureDepart?: string;
}

interface ChildDetailsProps {
  childId: string;
  onClose: () => void;
}

interface PaymentRecord {
  _id: string;
  enfantId: string;
  montant: number;
  date: string;
  type: string;
  categorie: string;
  statut: string;
  description?: string;
}

export function ChildDetails({ childId, onClose }: ChildDetailsProps) {
  const [child, setChild] = useState<Child | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildDetails();
  }, [childId]);

  const loadChildDetails = async () => {
    setLoading(true);

    try {
    
      const childResponse = await apiService.getChild(childId);
      setChild(childResponse.data);

      console.log('Child details:', childResponse.data);

     
      const attendanceResponse = await apiService.getAttendance({ enfantId: childId });
      const childAttendance = attendanceResponse.data || [];
      setAttendance(childAttendance.slice(0, 10)); // Limit to 10 recent records

      const paymentsResponse = await apiService.getChildPayments(childId);
      const childPayments = paymentsResponse.data || [];
      setPayments(childPayments.slice(0, 10)); // Limit to 10 recent records
    } catch (error: any) {
      console.error('Error loading child details:', error);
      showErrorAlert(error.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Détails de l'enfant</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {child.nom[0]}{child.prenom[0]}
              </div>
              <div>
                <h4 className="text-2xl font-bold">{child.nom} {child.prenom}</h4>
                <p className="text-orange-100">
                  Né(e) le {new Date(child.dateNaissance).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-orange-100">
                  Inscrit(e) le {new Date(child.dateInscription).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-orange-600" />
                <h5 className="font-semibold text-gray-900">Parents/Tuteurs</h5>
              </div>
              <div className="space-y-3">
                {child.parents && child.parents.length > 0 ? (
                  child.parents.map((parent, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {parent.nom} {parent.prenom}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {parent.relation.toLowerCase()}
                        {parent.estContactUrgence && ' (Contact d\'urgence)'}
                      </p>
                      {parent.telephone && (
                        <p className="text-sm text-gray-600">📱 {parent.telephone}</p>
                      )}
                      {parent.email && (
                        <p className="text-sm text-gray-600">✉️ {parent.email}</p>
                      )}
                      {parent.adresse && (
                        <p className="text-sm text-gray-600">🏠 {parent.adresse}</p>
                      )}
                      {parent.profession && (
                        <p className="text-sm text-gray-600">💼 {parent.profession}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucun parent enregistré</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-5 h-5 text-red-600" />
                <h5 className="font-semibold text-gray-900">Santé</h5>
              </div>
              <div className="space-y-3">
                {child.sante ? (
                  <>
                    {child.sante.allergies && child.sante.allergies.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-medium text-red-900 mb-2">Allergies</p>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {child.sante.allergies.map((allergy, index) => (
                            <li key={index}>{allergy}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {child.sante.restrictionsAlimentaires && child.sante.restrictionsAlimentaires.length > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="font-medium text-orange-900 mb-2">Restrictions alimentaires</p>
                        <ul className="list-disc list-inside text-sm text-orange-700">
                          {child.sante.restrictionsAlimentaires.map((restriction, index) => (
                            <li key={index}>{restriction}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {child.sante.remarquesMedicales && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-medium text-blue-900 mb-2">Remarques médicales</p>
                        <p className="text-sm text-blue-700">{child.sante.remarquesMedicales}</p>
                      </div>
                    )}

                    {child.sante.medicamentsReguliers && child.sante.medicamentsReguliers.length > 0 && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="font-medium text-purple-900 mb-2">Médicaments réguliers</p>
                        <div className="space-y-2">
                          {child.sante.medicamentsReguliers.map((medicament, index) => (
                            <div key={index} className="text-sm text-purple-700">
                              <p className="font-medium">{medicament.nom}</p>
                              <p>Dosage: {medicament.dosage}</p>
                              <p>Fréquence: {medicament.frequence}</p>
                              {medicament.instructions && <p>Instructions: {medicament.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!child.sante.allergies || child.sante.allergies.length === 0) &&
                     (!child.sante.restrictionsAlimentaires || child.sante.restrictionsAlimentaires.length === 0) &&
                     !child.sante.remarquesMedicales &&
                     (!child.sante.medicamentsReguliers || child.sante.medicamentsReguliers.length === 0) && (
                      <p className="text-gray-500 text-sm">Aucune information de santé disponible</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune information de santé disponible</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold text-gray-900">Historique des paiements</h5>
            </div>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(payment.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.description || `${payment.type} - ${payment.categorie}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {payment.montant.toLocaleString('fr-FR')} FCFA
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.statut === 'PAYE'
                          ? 'bg-green-100 text-green-700'
                          : payment.statut === 'EN_ATTENTE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.statut === 'PAYE' ? 'Payé' :
                         payment.statut === 'EN_ATTENTE' ? 'En attente' : payment.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h5 className="font-semibold text-gray-900">Présences récentes</h5>
            </div>
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune présence enregistrée</p>
            ) : (
              <div className="space-y-2">
                {attendance.map((att) => (
                  <div key={att._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(att.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {att.heureArrivee && (
                        <p className="text-sm text-gray-600">
                          Arrivée: {att.heureArrivee}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      att.statut === 'PRESENT'
                        ? 'bg-green-100 text-green-700'
                        : att.statut === 'ABSENT'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {att.statut === 'PRESENT' ? 'Présent' : att.statut === 'ABSENT' ? 'Absent' : att.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
