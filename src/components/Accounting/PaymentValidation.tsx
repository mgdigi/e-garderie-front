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
  const [creche, setCreche] = useState<any>(null);

  useEffect(() => {
    loadPayments();
    loadCrecheInfo();
  }, []);

  const loadCrecheInfo = async () => {
    try {
      const response = await apiService.getParametres();
      setCreche(response.data.creche);
    } catch (error) {
      console.error('Error loading creche info:', error);
    }
  };

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
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Define PDF dimensions - VERSION ULTRA-COMPACTE
    const pageWidth = 210; // A4 width in mm
    const margin = 10; // Marges minimales à 10mm
    
    // Start drawing - VERSION ULTRA-COMPACTE
    let y = margin;
    
    // EN-TÊTE ULTRA-COMPACT
    pdf.setFillColor(255, 165, 0); // Logo orange
    pdf.rect(margin, y, 8, 8, 'F');
    
    pdf.setTextColor(249, 115, 22);
    pdf.setFontSize(10); // ULTRA PETIT
    pdf.setFont('helvetica', 'bold');
    pdf.text(creche.nom || 'E-Garderie', margin + 12, y + 5);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(6); // ULTRA PETIT
    pdf.setFont('helvetica', 'normal');
    pdf.text(creche.adresse || 'Dakar, Sénégal', margin + 12, y + 8);
    
    y += 12; // ESPACEMENT MINIMAL
    
    // TITRE COMPACT
    pdf.setDrawColor(249, 115, 22);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 3;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9); // PETIT
    pdf.setFont('helvetica', 'bold');
    pdf.text('REÇU DE PAIEMENT', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // SECTION ENFANT (si disponible) - ULTRA COMPACTE
    if (enfant) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(7); // TRÈS PETIT
      pdf.setFont('helvetica', 'bold');
      pdf.text('ENFANT', margin + 2, y + 4);
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${enfant.prenom} ${enfant.nom}`, margin + 2, y + 7);
      pdf.text(`N°: ${enfant.numeroInscription}`, margin + 2, y + 10);
      
      y += 14; // ESPACEMENT MINIMAL
    }
    
    // SECTION PAIEMENT - ULTRA COMPACTE
    pdf.setFillColor(230, 240, 255);
    pdf.rect(margin, y, pageWidth - 2 * margin, 16, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAIEMENT', margin + 2, y + 4);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${paiement.description}`, margin + 2, y + 7);
    pdf.text(`Méthode: ${paiement.methodePaiement}`, margin + 2, y + 10);
    
    // Montant en orange - plus petit
    pdf.setTextColor(249, 115, 22);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const montant = paiement.montantPaye?.toLocaleString('fr-FR') || paiement.montant.toLocaleString('fr-FR');
    pdf.text(`MONTANT: ${montant} XAF`, margin + 2, y + 13);
    
    y += 18; // ESPACEMENT MINIMAL
    
    // INFORMATIONS - ULTRA COMPACTES
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    const reference = paiement.reference || `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    pdf.text(`Date: ${new Date(paiement.date).toLocaleDateString('fr-FR')}`, margin, y);
    pdf.text(`Réf: ${reference}`, margin, y + 3);
    
    y += 8;
    
    // PIED DE PAGE MINIMAL
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 3;
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(5); // MINIMAL
    pdf.setFont('helvetica', 'bold');
    pdf.text(creche.nom || 'E-Garderie', pageWidth / 2, y, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('Reçu automatique', pageWidth / 2, y + 2, { align: 'center' });

    // Download the PDF
    const fileReference = enfant ? enfant.numeroInscription : paiement._id.substring(0, 8);
    const fileName = `recu_${fileReference}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
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
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 mr-4">
                    <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl font-bold text-orange-600 mb-1">{creche?.nom || 'E-Garderie'}</h1>
                    <p className="text-gray-600 text-sm">{creche?.adresse || 'Dakar, Sénégal'}</p>
                    <p className="text-gray-600 text-sm">{creche?.telephone || '+221 XX XXX XX XX'}</p>
                    <p className="text-gray-600 text-sm">{creche?.email || 'contact@e-garderie.sn'}</p>
                  </div>
                </div>

                <div className="border-b-2 border-orange-500 mb-4"></div>

                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">REÇU DE PAIEMENT</h2>

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
                  <p><strong>Méthode de paiement:</strong> {selectedPayment.methodePaiement}</p>
                  <p className="text-lg font-bold text-orange-600"><strong>Montant:</strong> {selectedPayment.montant.toLocaleString()} XAF</p>
                </div>

                <div className="mb-6">
                  <p><strong>Date de paiement:</strong> {new Date(selectedPayment.date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Référence:</strong> {selectedPayment.reference || `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`}</p>
                </div>

                <div className="border-t border-gray-300 pt-4 text-center text-sm text-gray-600">
                  <p className="font-bold mb-2">{creche?.nom || 'E-Garderie'}</p>
                  <p className="mb-1">{creche?.email || 'contact@e-garderie.sn'}</p>
                  <p>Ce reçu est généré automatiquement et fait office de justificatif officiel de paiement.</p>
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