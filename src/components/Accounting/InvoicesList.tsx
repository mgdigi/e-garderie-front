import { useEffect, useState } from 'react';
import { Download, Search, User, DollarSign, FileText as FileTextIcon } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';

const generatePDFFacture = async (factureData: any, enfant: any, creche: any) => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;


  const receiptHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="flex-shrink: 0; margin-right: 15px;">
          <img src="/images/logo.png" alt="Logo" style="width: 40px; height: 40px; object-fit: contain;" />
        </div>
        <div style="text-align: left;">
          <h1 style="color: #f97316; margin: 0; font-size: 16px;">${creche?.nom || 'Keur Cellé'}</h1>
          <p style="margin: 2px 0; color: #666; font-size: 10px;">${creche?.adresse || 'Dakar, Sénégal'}</p>
          <p style="margin: 2px 0; color: #666; font-size: 10px;">${creche?.telephone || '+221 XX XXX XX XX'}</p>
        </div>
      </div>

      <div style="border-bottom: 1px solid #f97316; margin-bottom: 8px;"></div>

      <h2 style="text-align: center; color: #333; margin-bottom: 10px; font-size: 14px;">FACTURE MENSUELLE</h2>

      <div style="background: #f9f9f9; padding: 8px; margin-bottom: 8px; border-radius: 3px;">
        <p style="margin: 2px 0; font-size: 10px;"><strong>Cher(e) parent,</strong></p>
        <p style="margin: 2px 0; font-size: 9px;">${factureData.messageParent}</p>
      </div>

      <div style="background: #f0f8ff; padding: 8px; margin-bottom: 8px; border-radius: 3px;">
        <p style="margin: 2px 0; font-size: 9px;"><strong>Enfant:</strong> ${enfant.prenom} ${enfant.nom}</p>
        <p style="margin: 2px 0; font-size: 9px;"><strong>N° Inscription:</strong> ${enfant.numeroInscription}</p>
      </div>

      <div style="background: #fff2e6; padding: 8px; margin-bottom: 8px; border-radius: 3px; border: 1px solid #f97316;">
        <p style="margin: 2px 0; font-size: 9px;"><strong>Période:</strong> ${factureData.facture.periode}</p>
        <p style="margin: 2px 0; font-size: 9px;"><strong>Type:</strong> ${factureData.facture.type}</p>
        <p style="margin: 4px 0; font-size: 12px; font-weight: bold; color: #f97316;">
          <strong>MONTANT: ${factureData.facture.montant.toLocaleString('fr-FR')} XAF</strong>
        </p>
      </div>

      <div style="margin-bottom: 8px; font-size: 9px;">
        <p style="margin: 2px 0;"><strong>Échéance:</strong> ${factureData.facture.dateEcheance}</p>
        <p style="margin: 2px 0;"><strong>Réf:</strong> ${factureData.facture.numero}</p>
      </div>

      <div style="font-size: 9px; margin-bottom: 8px;">
        <p style="margin: 2px 0;"><strong>Paiements:</strong> Espèces • Mobile Money • Chèque</p>
      </div>

      <div style="border-top: 1px solid #ccc; padding-top: 8px; text-align: center; color: #666; font-size: 8px;">
        <p style="margin: 2px 0;"><strong>${creche?.nom || 'E-Garderie'}</strong></p>
        <p style="margin: 2px 0;">${creche?.email || 'contact@e-garderie.sn'}</p>
        <p style="margin: 2px 0;">Généré automatiquement</p>
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

    // Create PDF - VERSION PLEINE PAGE
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Dimensions de la page A4
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 5; // Marges minimales pour maximiser l'espace
    
    // Calculer les dimensions pour remplir la page
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);
    
    // Calculer les dimensions optimales pour remplir l'espace
    const aspectRatio = canvas.height / canvas.width;
    
    // Calculer la hauteur qui utilisera toute la largeur disponible
    let imgWidth = availableWidth;
    let imgHeight = imgWidth * aspectRatio;
    
    // Si la hauteur calculée dépasse l'espace disponible, ajuster par la hauteur
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight / aspectRatio;
    }
    
    // Centrer le contenu sur la page
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    // Ajouter sur une seule page en utilisant tout l'espace disponible
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

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