import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showSuccessAlert, showErrorAlert } from '../../lib/sweetalert';

interface Payment {
  _id: string;
  type: string;
  categorie: string;
  montant: number;
  description: string;
  date: string;
  methodePaiement: string;
  statut: string;
  enfantId?: {
    _id: string;
    nom: string;
    prenom: string;
    numeroInscription?: string;
  };
  reference?: string;
}

interface PaymentValidationProps {
  onPaymentValidated?: () => void;
}

export function PaymentValidation({ onPaymentValidated }: PaymentValidationProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      // Get pending payments from API
      const response = await apiService.getPayments({ statut: 'EN_ATTENTE' });
      setPayments(response.data || []);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      showErrorAlert(error.message || 'Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayment = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        // Use the new validation endpoint
        await apiService.validatePayment(paymentId);
        showSuccessAlert('Paiement validé avec succès');
        // Generate receipt
        generateReceipt(paymentId);
      } else {
        const newStatus = 'ANNULE';
        await apiService.updatePayment(paymentId, { statut: newStatus });
        showSuccessAlert('Paiement rejeté');
      }

      // Update local state
      setPayments(payments.map(p =>
        p._id === paymentId
          ? { ...p, statut: action === 'approve' ? 'PAYE' : 'ANNULE' }
          : p
      ));

      // Rafraîchissement automatique
      onPaymentValidated?.();
    } catch (error: any) {
      console.error('Error validating payment:', error);
      showErrorAlert(error.message || 'Erreur lors de la validation du paiement');
    }
  };

  const generateReceipt = async (paymentId: string) => {
    try {
      const receiptData = await apiService.generateReceipt(paymentId);
      const { paiement, creche, enfant, validePar } = receiptData.data;

      // Generate PDF receipt
      await generatePDFReceipt(paiement, creche, enfant, validePar);
      showSuccessAlert('Reçu généré avec succès!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      showErrorAlert('Erreur lors de la génération du reçu');
    }
  };

  const generatePDFReceipt = async (paiement: any, creche: any, enfant: any, validePar: any) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Create receipt HTML content
    const receiptHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f97316; margin: 0;">${creche.nom || 'E-Garderie'}</h1>
          <p style="margin: 5px 0; color: #666;">${creche.adresse || 'Dakar, Sénégal'}</p>
          <p style="margin: 5px 0; color: #666;">${creche.telephone || '+221 XX XXX XX XX'} | ${creche.email || 'contact@e-garderie.sn'}</p>
        </div>

        <div style="border-bottom: 2px solid #f97316; margin-bottom: 20px;"></div>

        <h2 style="text-align: center; color: #333; margin-bottom: 30px;">REÇU DE PAIEMENT</h2>

        <div style="margin-bottom: 20px;">
          <p><strong>Référence:</strong> ${paiement.reference || `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`}</p>
          <p><strong>Date de paiement:</strong> ${new Date(paiement.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Validé le:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        ${enfant ? `
        <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Informations de l'enfant</h3>
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${enfant.prenom} ${enfant.nom}</p>
          <p style="margin: 5px 0;"><strong>Numéro d'inscription:</strong> ${enfant.numeroInscription}</p>
        </div>
        ` : ''}

        <div style="background: #f0f8ff; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Détails du paiement</h3>
          <p style="margin: 5px 0;"><strong>Description:</strong> ${paiement.description}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${paiement.type === 'RECETTE' ? 'Recette' : 'Dépense'}</p>
          <p style="margin: 5px 0;"><strong>Catégorie:</strong> ${paiement.categorie?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || paiement.categorie}</p>
          <p style="margin: 5px 0;"><strong>Méthode de paiement:</strong> ${paiement.methodePaiement}</p>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #f97316;">
            <strong>Montant:</strong> ${paiement.montantPaye?.toLocaleString('fr-FR') || paiement.montant.toLocaleString('fr-FR')} XAF
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <p><strong>Statut:</strong> <span style="color: #22c55e; font-weight: bold;">PAYÉ ET VALIDÉ</span></p>
          <p><strong>Validé par:</strong> ${validePar.firstName} ${validePar.lastName}</p>
        </div>

        <div style="border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Ce reçu est généré automatiquement et fait office de justificatif officiel de paiement.</p>
          <p>Conservez-le précieusement pour vos archives comptables.</p>
          <p style="margin-top: 10px; font-style: italic;">Merci pour votre confiance - E-Garderie</p>
        </div>
      </div>
    `;

    // Create a temporary element to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = receiptHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '600px';
    document.body.appendChild(tempDiv);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 600,
        height: tempDiv.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const reference = enfant ? enfant.numeroInscription : paiement._id.substring(0, 8);
      const fileName = `recu_${reference}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'PAYE': return 'text-green-600 bg-green-100';
      case 'EN_ATTENTE': return 'text-yellow-600 bg-yellow-100';
      case 'ANNULE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'PAYE': return 'Validé';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULE': return 'Rejeté';
      default: return statut;
    }
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
          <h2 className="text-3xl font-bold text-gray-900">Validation des paiements</h2>
          <p className="text-gray-600 mt-1">Approuvez ou rejetez les transactions en attente</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun paiement en attente de validation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{payment.description}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.statut)}`}>
                        {getStatusText(payment.statut)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Montant:</span>
                        <p className="font-semibold text-gray-900">{payment.montant.toLocaleString()} XAF</p>
                      </div>
                      <div>
                        <span className="font-medium">Méthode:</span>
                        <p>{payment.methodePaiement}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>
                        <p>{new Date(payment.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {payment.enfantId && (
                        <div>
                          <span className="font-medium">Enfant:</span>
                          <p>{payment.enfantId.prenom} {payment.enfantId.nom}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {payment.statut === 'EN_ATTENTE' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleValidatePayment(payment._id, 'approve')}
                        className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approuver</span>
                      </button>
                      <button
                        onClick={() => handleValidatePayment(payment._id, 'reject')}
                        className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  )}

                  {payment.statut === 'PAYE' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir reçu</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Détails du reçu</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Receipt Preview */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-orange-600 mb-2">E-Garderie</h1>
                  <p className="text-gray-600">Dakar, Sénégal</p>
                  <p className="text-gray-600">+221 XX XXX XX XX | contact@e-garderie.sn</p>
                </div>

                <div className="border-b-2 border-orange-500 mb-4"></div>

                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">REÇU DE PAIEMENT</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p><strong>Référence:</strong> {selectedPayment.reference || `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`}</p>
                    <p><strong>Date de paiement:</strong> {new Date(selectedPayment.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p><strong>Validé le:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                    <p><strong>Statut:</strong> <span className="text-green-600 font-bold">PAYÉ ET VALIDÉ</span></p>
                  </div>
                </div>

                {selectedPayment.enfantId && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-gray-800 mb-2">Informations de l'enfant</h3>
                    <p><strong>Nom:</strong> {selectedPayment.enfantId.prenom} {selectedPayment.enfantId.nom}</p>
                    <p><strong>Numéro d'inscription:</strong> {selectedPayment.enfantId.numeroInscription}</p>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Détails du paiement</h3>
                  <p><strong>Description:</strong> {selectedPayment.description}</p>
                  <p><strong>Type:</strong> {selectedPayment.type === 'RECETTE' ? 'Recette' : 'Dépense'}</p>
                  <p><strong>Catégorie:</strong> {selectedPayment.categorie?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || selectedPayment.categorie}</p>
                  <p><strong>Méthode de paiement:</strong> {selectedPayment.methodePaiement}</p>
                  <p className="text-lg font-bold text-orange-600"><strong>Montant:</strong> {selectedPayment.montant.toLocaleString()} XAF</p>
                </div>

                <div className="text-center text-sm text-gray-600 mt-6">
                  <p>Ce reçu est généré automatiquement et fait office de justificatif officiel.</p>
                  <p>Conservez-le précieusement pour vos archives comptables.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => generateReceipt(selectedPayment._id)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}