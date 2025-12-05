import { useEffect, useState } from 'react';
import { Download, Search, User, DollarSign, FileText as FileTextIcon } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

const generatePDFFacture = async (factureData: any, enfant: any, creche: any) => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;


  const receiptHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <div style="display: flex; align-items: center; margin-bottom: 30px;">
        <div style="flex-shrink: 0; margin-right: 20px;">
          <img src="/images/logo.png" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" />
        </div>
        <div style="text-align: left;">
          <h1 style="color: #f97316; margin: 0; font-size: 24px;">${creche?.nom || 'Keur Cellé'}</h1>
          <p style="margin: 5px 0; color: #666;">${creche?.adresse || 'Dakar, Sénégal'}</p>
          <p style="margin: 5px 0; color: #666;">${creche?.telephone || '+221 XX XXX XX XX'}</p>
          <p style="margin: 5px 0; color: #666;">${creche?.email || 'contact@e-garderie.sn'}</p>
        </div>
      </div>

      <div style="border-bottom: 2px solid #f97316; margin-bottom: 20px;"></div>

      <h2 style="text-align: center; color: #333; margin-bottom: 30px;">FACTURE MENSUELLE</h2>

      <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Cher(e) parent,</h3>
        <p style="margin: 5px 0;">${factureData.messageParent}</p>
      </div>

      <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Informations de l'enfant</h3>
        <p style="margin: 5px 0;"><strong>Nom:</strong> ${enfant.prenom} ${enfant.nom}</p>
        <p style="margin: 5px 0;"><strong>Numéro d'inscription:</strong> ${enfant.numeroInscription}</p>
      </div>

      <div style="background: #f0f8ff; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Détails de la facture</h3>
        <p style="margin: 5px 0;"><strong>Période:</strong> ${factureData.facture.periode}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${factureData.facture.type}</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #f97316;">
          <strong>Montant à payer:</strong> ${factureData.facture.montant.toLocaleString('fr-FR')} XAF
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <p><strong>Date d'échéance:</strong> ${factureData.facture.dateEcheance}</p>
        <p><strong>Référence:</strong> ${factureData.facture.numero}</p>
        <p><strong>Date de création:</strong> ${factureData.facture.dateCreation}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <p><strong>Modes de paiement acceptés:</strong></p>
        <p style="margin-left: 20px;">• Espèces</p>
        <p style="margin-left: 20px;">• Paiement Mobile</p>
        <p style="margin-left: 20px;">• Chèque</p>
      </div>

      <div style="border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p style="margin-bottom: 10px;"><strong>${creche?.nom || 'E-Garderie'}</strong></p>
        <p style="margin-bottom: 5px;">${creche?.email || 'contact@e-garderie.sn'}</p>
        <p>Ce document est généré automatiquement par le système E-Garderie</p>
        <p>Conservez-le précieusement pour vos archives comptables.</p>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = receiptHTML;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '600px';
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas without waiting for images to load
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
    const reference = enfant.numeroInscription || factureData.facture._id.substring(0, 8);
    const fileName = `facture_${reference}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

export function InvoicesList() {
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    setLoading(true);
    try {
      const response = await apiService.getFactures();
      setFactures(response.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des factures:', error);
      showErrorAlert('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des factures
  const filteredFactures = factures.filter(facture => {
    const enfant = facture.enfantId;
    const matchesSearch = !searchTerm || 
      enfant?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enfant?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enfant?.numeroInscription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || facture.statut === statusFilter;
    
    const matchesMonth = !monthFilter || 
      facture.mois?.toString() === monthFilter ||
      `${facture.mois}/${facture.annee}` === monthFilter;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });


  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  const paginatedFactures = filteredFactures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadPDF = async (factureId: string) => {
    try {
      const response = await apiService.generateFacturePDF(factureId);
      
      if (response.success && response.data) {
        console.log('Données de la facture pour le PDF:', response.data);
        await generatePDFFacture(response.data, response.data.enfant, response.data.creche);
        showSuccessAlert('Facture téléchargée avec succès');
      } else {
        showErrorAlert('Erreur lors de la récupération des données de la facture');
      }
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      showErrorAlert('Erreur lors du téléchargement de la facture');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Liste des factures</h2>
        <div className="text-sm text-gray-600">
          {filteredFactures.length} facture(s) trouvée(s)
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un enfant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Tous les mois</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>
                {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setMonthFilter('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Enfant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Période</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFactures.map((facture) => (
                <tr key={facture._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {facture.enfantId?.prenom} {facture.enfantId?.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{facture.enfantId?.numeroInscription}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {facture.mois}/{facture.annee}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <span className="px-2 py-1 bg-gray-200 text-orange-600 rounded text-xs">
                      {facture.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-orange-600">
                        {facture.montant?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      facture.statut === 'PAID' ? 'bg-gray-100 text-gray-700' :
                      facture.statut === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {facture.statut === 'PAID' ? 'Payé' :
                       facture.statut === 'PENDING' ? 'En attente' : 'Annulé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadPDF(facture._id)}
                        className="flex items-center space-x-2 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        title="Télécharger le PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {factures.length === 0 ? 'Aucune facture trouvée' : 'Aucun résultat pour les filtres appliqués'}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredFactures.length)} à {Math.min(currentPage * itemsPerPage, filteredFactures.length)} sur {filteredFactures.length} factures
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}