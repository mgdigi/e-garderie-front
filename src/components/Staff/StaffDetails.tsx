import { useEffect, useState } from 'react';
import { X, User, DollarSign, Calendar, FileText, Download } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert } from '../../lib/sweetalert';
import jsPDF from 'jspdf';

interface Staff {
  _id: string;
  nom: string;
  prenom: string;
  poste: string;
  telephone: string;
  email?: string;
  adresse?: string;
  salaire: number;
  typeContrat: string;
  dateEmbauche: string;
  statut: string;
}

interface PaymentRecord {
  _id: string;
  montant: number;
  datePaiement: string;
  type: string;
  categorie: string;
  statut: string;
  description?: string;
}

interface StaffDetailsProps {
  staffId: string;
  onClose: () => void;
}

export function StaffDetails({ staffId, onClose }: StaffDetailsProps) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffDetails();
  }, [staffId]);

  const loadStaffDetails = async () => {
    setLoading(true);

    try {
      // Get staff details from API
      const staffResponse = await apiService.getStaffById(staffId);
      setStaff(staffResponse.data);

      // Get payment records for this staff
      const paymentsResponse = await apiService.getSalaryHistory(staffId);
      setPayments(paymentsResponse.data?.slice(0, 10) || []); // Limit to 10 recent records
    } catch (error: any) {
      console.error('Error loading staff details:', error);
      showErrorAlert(error.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const generateSalarySlipPDF = (payment: PaymentRecord) => {
    if (!staff) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('BULLETIN DE PAIE', 105, 20, { align: 'center' });

    // Company info
    doc.setFontSize(12);
    doc.text('Crèche E-Garderie', 20, 40);
    doc.text('Adresse: Dakar, Sénégal', 20, 50);
    doc.text('Téléphone: +221 XX XXX XX XX', 20, 60);

    // Employee info
    doc.text(`Employé: ${staff.prenom} ${staff.nom}`, 20, 80);
    doc.text(`Poste: ${staff.poste}`, 20, 90);
    doc.text(`Période: ${new Date(payment.datePaiement).toLocaleDateString('fr-FR')}`, 20, 100);

    // Salary details
    doc.text('DÉTAIL DE LA RÉMUNÉRATION', 20, 120);
    doc.text(`Salaire brut: ${staff.salaire.toLocaleString()} FCFA`, 20, 140);
    doc.text(`Montant payé: ${payment.montant.toLocaleString()} FCFA`, 20, 150);
    doc.text(`Statut: ${payment.statut === 'PAYE' ? 'Payé' : 'En attente'}`, 20, 160);

    // Footer
    doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, 200);
    doc.text('Signature: ___________________________', 20, 220);

    // Save the PDF
    doc.save(`bulletin_paie_${staff.prenom}_${staff.nom}_${new Date(payment.datePaiement).getMonth() + 1}_${new Date(payment.datePaiement).getFullYear()}.pdf`);
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

  if (!staff) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Détails de l'employé</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {staff.nom[0]}{staff.prenom[0]}
              </div>
              <div>
                <h4 className="text-2xl font-bold">{staff.nom} {staff.prenom}</h4>
                <p className="text-blue-100">{staff.poste}</p>
                <p className="text-blue-100">
                  Embauché(e) le {new Date(staff.dateEmbauche).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-orange-600" />
                <h5 className="font-semibold text-gray-900">Informations personnelles</h5>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-medium">{staff.telephone}</span>
                </div>
                {staff.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{staff.email}</span>
                  </div>
                )}
                {staff.adresse && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adresse:</span>
                    <span className="font-medium">{staff.adresse}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type de contrat:</span>
                  <span className="font-medium">{staff.typeContrat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salaire mensuel:</span>
                  <span className="font-medium">{staff.salaire.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-green-600" />
                <h5 className="font-semibold text-gray-900">Statut et activité</h5>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    staff.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                    staff.statut === 'INACTIF' ? 'bg-gray-100 text-gray-700' :
                    staff.statut === 'CONGE' ? 'bg-yellow-100 text-yellow-700' :
                    staff.statut === 'SUSPENDU' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {staff.statut === 'ACTIF' ? 'Actif' :
                     staff.statut === 'INACTIF' ? 'Inactif' :
                     staff.statut === 'CONGE' ? 'En congé' :
                     staff.statut === 'SUSPENDU' ? 'Suspendu' :
                     staff.statut === 'PARTI' ? 'Parti' : staff.statut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date d'embauche:</span>
                  <span className="font-medium">{new Date(staff.dateEmbauche).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold text-gray-900">Historique des salaires</h5>
            </div>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun paiement de salaire enregistré</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(payment.datePaiement).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.description || `Salaire - ${payment.categorie}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {payment.montant.toLocaleString('fr-FR')} FCFA
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.statut === 'PAYE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.statut === 'PAYE' ? 'Payé' : 'En attente'}
                        </span>
                      </div>
                      {payment.statut === 'PAYE' && (
                        <button
                          onClick={() => generateSalarySlipPDF(payment)}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition text-sm"
                          title="Télécharger le bulletin de paie"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>
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