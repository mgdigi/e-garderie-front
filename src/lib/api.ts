const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(data.message || 'Données invalides. Veuillez vérifier vos informations.');
        }
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        if (response.status === 403) {
          throw new Error('Accès refusé. Permissions insuffisantes.');
        }
        if (response.status === 404) {
          throw new Error('Ressource non trouvée.');
        }
        if (response.status === 409) {
          throw new Error('Conflit de données. Cette ressource existe déjà.');
        }
        if (response.status === 422) {
          throw new Error('Données invalides. Veuillez vérifier le format.');
        }
        if (response.status === 500) {
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
        }
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erreur de connexion. Vérifiez votre connexion internet.');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Children methods
  async getChildren() {
    return this.request('/enfants');
  }

  async createChild(childData: any) {
    return this.request('/enfants', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async updateChild(id: string, childData: any) {
    return this.request(`/enfants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  }

  async getChild(id: string) {
    return this.request(`/enfants/${id}`);
  }

  async deleteChild(id: string) {
    return this.request(`/enfants/${id}`, {
      method: 'DELETE',
    });
  }

  // Parents methods
  async getParents() {
    return this.request('/parents');
  }

  // Classes/Sections methods (deprecated - use settings methods instead)
  async getClassesLegacy() {
    return this.request('/classes');
  }

  // Staff methods
  async getStaff(params?: { page?: number; limit?: number; statut?: string; poste?: string; search?: string }) {
    // Remove undefined values from params
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) => value !== undefined && value !== '')
    );
    const query = Object.keys(cleanParams).length > 0 ? new URLSearchParams(cleanParams as any).toString() : '';
    const url = `/personnel${query ? `?${query}` : ''}`;
    console.log('API call to:', url, 'with params:', cleanParams);
    return this.request(url);
  }

  async getAllStaff() {
    return this.request('/personnel?limit=1000'); // Récupérer beaucoup pour couvrir tous les cas
  }

  async getStaffById(id: string) {
    return this.request(`/personnel/${id}`);
  }

  async createStaff(staffData: any) {
    return this.request('/personnel', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaff(id: string, staffData: any) {
    return this.request(`/personnel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async deleteStaff(id: string) {
    return this.request(`/personnel/${id}`, {
      method: 'DELETE',
    });
  }

  async paySalary(staffId: string, salaryData: any) {
    return this.request(`/personnel/${staffId}/payer-salaire`, {
      method: 'POST',
      body: JSON.stringify(salaryData),
    });
  }

  // Attendance methods
  async getAttendance(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/presences${query}`);
  }

  async markAttendance(attendanceData: any) {
    return this.request('/presences', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async updateAttendance(id: string, attendanceData: any) {
    return this.request(`/presences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  }

  // Accounting methods
  async getPayments(params?: { type?: string; categorie?: string; dateDebut?: string; dateFin?: string; statut?: string; enfantId?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/paiements${query ? `?${query}` : ''}`);
  }

  async createPayment(paymentData: any) {
    return this.request('/paiements', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async updatePayment(id: string, paymentData: any) {
    return this.request(`/paiements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async deletePayment(id: string) {
    return this.request(`/paiements/${id}`, {
      method: 'DELETE',
    });
  }

  async validatePayment(id: string) {
    return this.request(`/paiements/${id}/valider`, {
      method: 'PUT',
    });
  }

  async generateReceipt(id: string) {
    return this.request(`/paiements/${id}/recu`);
  }

  async createMonthlyPayment(paymentData: any) {
    return this.request('/paiements/mensualite-auto', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getChildPayments(childId: string) {
    return this.request(`/paiements/enfant/${childId}`);
  }

  async getSalaryHistory(staffId: string) {
    return this.request(`/personnel/${staffId}/salaires`);
  }

  // Schedules methods
  async getSchedules(params?: { section?: string; statut?: string; search?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/emplois-du-temps${query ? `?${query}` : ''}`);
  }

  async createSchedule(scheduleData: any) {
    return this.request('/emplois-du-temps', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(id: string, scheduleData: any) {
    return this.request(`/emplois-du-temps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  // Menus methods
  async getMenus(params?: { statut?: string; search?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/menus${query ? `?${query}` : ''}`);
  }

  async createMenu(menuData: any) {
    return this.request('/menus', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  async updateMenu(id: string, menuData: any) {
    return this.request(`/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    });
  }

  // Reports methods
  async getReports() {
    return this.request('/reports');
  }

  // Advanced Reports methods
  async getEnfantsReport(params?: { startDate?: string; endDate?: string; section?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/rapports/enfants${query ? `?${query}` : ''}`);
  }

  async getPresenceReport(params?: { startDate?: string; endDate?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/rapports/presence${query ? `?${query}` : ''}`);
  }

  async getFinancialReport(params?: { startDate?: string; endDate?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/rapports/financier${query ? `?${query}` : ''}`);
  }

  async getPersonnelReport(params?: { startDate?: string; endDate?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/rapports/personnel${query ? `?${query}` : ''}`);
  }

  async getGeneralStats() {
    return this.request('/rapports/statistiques-generales');
  }

  // Settings methods
  async getParametres() {
    return this.request('/parametres');
  }

  async updateParametresCreche(data: any) {
    return this.request('/parametres/creche', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getClasses() {
    return this.request('/parametres/classes');
  }

  async createClasse(data: any) {
    return this.request('/parametres/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClasse(id: string, data: any) {
    return this.request(`/parametres/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClasse(id: string) {
    return this.request(`/parametres/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard methods
  async getDashboardCharts(params?: { periode?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/dashboard/charts${query ? `?${query}` : ''}`);
  }

  async getRecentActivities(params?: { limit?: string }) {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/dashboard/recent-activities${query ? `?${query}` : ''}`);
  }

  // Attendance notification methods
  async sendAttendanceNotification(notificationData: { enfantId: string; statut: string }) {
    return this.request('/presences/send-notification', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

}

export const apiService = new ApiService(API_BASE_URL);