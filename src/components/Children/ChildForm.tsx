import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiService } from '../../lib/api';
import { showErrorAlert, showSuccessAlert } from '../../lib/sweetalert';


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
   classeId?: string;
   section?: string; // Pour compatibilité
   statut: string;
   dateInscription: string;
   tarifMensuel: number;
   fraisInscription?: number;
   parents: Parent[];
   sante: Sante;
   remarques?: string;
}

interface Class {
  _id: string;
  nom: string;
  capacite: number;
  ageMin?: number;
  ageMax?: number;
  description?: string;
}

interface ChildFormProps {
  child: Child | null;
  classes: Class[];
  settings: any;
  onClose: () => void;
  onSave: () => void;
}

export function ChildForm({ child, classes, settings, onClose, onSave }: ChildFormProps) {
   const [formData, setFormData] = useState({
      nom: '',
      prenom: '',
      dateNaissance: '',
      sexe: 'M',
      classeId: '',
      statut: 'ACTIF',
      dateInscription: new Date().toISOString().split('T')[0],
      fraisInscription: settings?.fraisInscription || 50000
    });

   const [parentData, setParentData] = useState({
     relationship: 'parent',
     first_name: '',
     last_name: '',
     phone: '',
     email: '',
     address: '',
     profession: ''
   });

   const [healthData, setHealthData] = useState({
     allergies: '',
     dietary_restrictions: '',
     medical_notes: ''
   });

   const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (child) {
        setFormData({
           nom: child.nom,
           prenom: child.prenom,
           dateNaissance: child.dateNaissance ? child.dateNaissance.split('T')[0] : '',
           sexe: child.sexe === 'MASCULIN' ? 'M' : 'F',
           classeId: child.classeId || '',
           statut: child.statut,
           dateInscription: child.dateInscription ? child.dateInscription.split('T')[0] : new Date().toISOString().split('T')[0],
           fraisInscription: child.fraisInscription || settings?.fraisInscription || 50000
         });
        loadChildData(child._id);
      }
    }, [child]);


  const loadChildData = async (childId: string) => {
     try {
       // Get full child details from API to load parent and health data
       const childResponse = await apiService.getChild(childId);
       const fullChild = childResponse.data;

       // Load parent data - take the first parent or create empty if none
       if (fullChild.parents && fullChild.parents.length > 0) {
         const firstParent = fullChild.parents[0];
         setParentData({
           relationship: firstParent.relation.toLowerCase(),
           first_name: firstParent.nom || '',
           last_name: firstParent.prenom || '',
           phone: firstParent.telephone || '',
           email: firstParent.email || '',
           address: firstParent.adresse || '',
           profession: firstParent.profession || ''
         });
       } else {
         setParentData({
           relationship: 'pere',
           first_name: '',
           last_name: '',
           phone: '',
           email: '',
           address: '',
           profession: ''
         });
       }

       // Load health data
       if (fullChild.sante) {
         setHealthData({
           allergies: fullChild.sante.allergies ? fullChild.sante.allergies.join(', ') : '',
           dietary_restrictions: fullChild.sante.restrictionsAlimentaires ? fullChild.sante.restrictionsAlimentaires.join(', ') : '',
           medical_notes: fullChild.sante.remarquesMedicales || ''
         });
       } else {
         setHealthData({
           allergies: '',
           dietary_restrictions: '',
           medical_notes: ''
         });
       }
     } catch (error) {
       console.error('Error loading child data:', error);
       // Set default values if loading fails
       setParentData({
         relationship: 'pere',
         first_name: '',
         last_name: '',
         phone: '',
         email: '',
         address: '',
         profession: ''
       });
       setHealthData({
         allergies: '',
         dietary_restrictions: '',
         medical_notes: ''
       });
     }
   };

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);

     try {
       const childData = {
         ...formData,
         classeId: formData.classeId,
         parentNom: parentData.first_name,
         parentTelephone: parentData.phone,
         adresse: parentData.address,
         fraisInscription: formData.fraisInscription,
         allergies: healthData.allergies,
         restrictionsAlimentaires: healthData.dietary_restrictions,
         remarquesMedicales: healthData.medical_notes,
         // Add parent details for full update
         parents: [{
           nom: parentData.first_name,
           prenom: parentData.last_name,
           relation: parentData.relationship.toUpperCase(),
           telephone: parentData.phone,
           email: parentData.email,
           adresse: parentData.address,
           profession: parentData.profession,
           estContactUrgence: true
         }],
         // Add health details
         sante: {
           allergies: healthData.allergies ? healthData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
           restrictionsAlimentaires: healthData.dietary_restrictions ? healthData.dietary_restrictions.split(',').map(r => r.trim()).filter(r => r) : [],
           remarquesMedicales: healthData.medical_notes,
           medicamentsReguliers: []
         }
       };

       if (child) {
         await apiService.updateChild(child._id, childData);
         showSuccessAlert('Enfant mis à jour avec succès');
       } else {
         await apiService.createChild(childData);
         showSuccessAlert('Enfant créé avec succès et paiement d\'inscription enregistré automatiquement');
       }

       onSave();
       // Trigger accounting data refresh
       window.dispatchEvent(new CustomEvent('childCreated'));
     } catch (error: any) {
       console.error('Error saving child:', error);
       showErrorAlert(error.message || 'Erreur lors de l\'enregistrement');
     } finally {
       setLoading(false);
     }
   };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">
            {child ? 'Modifier l\'enfant' : 'Nouvel enfant'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'enfant</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  value={formData.sexe}
                  onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe
                </label>
                <select
                  value={formData.classeId}
                  onChange={(e) => setFormData({ ...formData, classeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.nom} ({cls.ageMin}-{cls.ageMax} ans - {cls.capacite} places)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'inscription
                </label>
                <input
                  type="date"
                  value={formData.dateInscription}
                  onChange={(e) => setFormData({ ...formData, dateInscription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations du parent/tuteur</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom du parent/tuteur *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jean"
                  value={parentData.first_name}
                  onChange={(e) => setParentData({ ...parentData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du parent/tuteur *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dupont"
                  value={parentData.last_name}
                  onChange={(e) => setParentData({ ...parentData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relation
                </label>
                <select
                  value={parentData.relationship}
                  onChange={(e) => setParentData({ ...parentData, relationship: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="pere">Père</option>
                  <option value="mere">Mère</option>
                  <option value="tuteur">Tuteur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone du parent *
                </label>
                <input
                  type="tel"
                  value={parentData.phone}
                  onChange={(e) => setParentData({ ...parentData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du parent
                </label>
                <input
                  type="email"
                  value={parentData.email}
                  onChange={(e) => setParentData({ ...parentData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profession du parent
                </label>
                <input
                  type="text"
                  value={parentData.profession}
                  onChange={(e) => setParentData({ ...parentData, profession: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais d'inscription (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.fraisInscription}
                  onChange={(e) => setFormData({ ...formData, fraisInscription: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={parentData.address}
                  onChange={(e) => setParentData({ ...parentData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations de santé</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies (séparées par des virgules)
                </label>
                <textarea
                  value={healthData.allergies}
                  onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
                  rows={2}
                  placeholder="Ex: arachides, lait, œufs"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restrictions alimentaires (séparées par des virgules)
                </label>
                <textarea
                  value={healthData.dietary_restrictions}
                  onChange={(e) => setHealthData({ ...healthData, dietary_restrictions: e.target.value })}
                  rows={2}
                  placeholder="Ex: végétarien, sans porc, sans gluten"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes médicales
                </label>
                <textarea
                  value={healthData.medical_notes}
                  onChange={(e) => setHealthData({ ...healthData, medical_notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
