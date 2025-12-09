
import { Meeting, User, Company, UserRole, SmtpSettings } from '../types';

const TOKEN_KEY = 'aiscriba_jwt';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = getAuthToken();
    const headers: any = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 401 || response.status === 403) {
        if (!endpoint.includes('login')) {
            clearAuthToken();
            window.location.href = '/'; 
        }
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        try {
            const errorData = await response.json();
            if (errorData.error) throw new Error(errorData.error);
        } catch (e) { }
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    if (data.token) setAuthToken(data.token);
    return data.user;
};

export const changeUserPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    return apiCall('/auth/change-password', 'POST', { oldPassword, newPassword });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    return apiCall('/auth/forgot-password', 'POST', { email });
};

export const completePasswordReset = async (token: string, newPassword: string): Promise<void> => {
    return apiCall('/auth/reset-password-token', 'POST', { token, newPassword });
};

export const fetchAppData = async (): Promise<{ meetings: Meeting[], users: User[], company: Company | null, companies?: Company[] }> => {
    return apiCall('/app-data');
};

export const saveMeetingToBackend = async (meeting: Meeting): Promise<Meeting> => {
    return apiCall('/meetings', 'POST', meeting);
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
    return apiCall(`/meetings/${meetingId}`, 'DELETE');
};

export const shareMeeting = async (meetingId: string, email: string): Promise<void> => {
    return apiCall(`/meetings/${meetingId}/share`, 'POST', { email });
};

export const createUserInBackend = async (email: string, password: string, role: UserRole, companyId: string, googleApiKey?: string): Promise<User> => {
    return apiCall('/users', 'POST', { email, password, role, companyId, googleApiKey });
};

export const updateUserApiKey = async (userId: string, googleApiKey: string): Promise<User> => {
    return apiCall(`/users/${userId}`, 'PUT', { googleApiKey });
};

export const deleteUser = async (userId: string): Promise<void> => {
    return apiCall(`/users/${userId}`, 'DELETE');
};

export const resetUserPassword = async (userId: string, newPassword?: string): Promise<void> => {
    return apiCall(`/users/${userId}/reset-password`, 'POST', { newPassword });
};

export const createCompanyInBackend = async (companyName: string, adminEmail: string, adminPass: string, logoUrl: string | null): Promise<Company> => {
    return apiCall('/companies', 'POST', { companyName, adminEmail, adminPassword: adminPass, logoUrl });
};

export const deleteCompany = async (companyId: string): Promise<void> => {
    return apiCall(`/companies/${companyId}`, 'DELETE');
};

export const cleanupAudioFiles = async (days: number): Promise<{ message: string }> => {
    return apiCall('/maintenance/cleanup-audio', 'POST', { days });
};

export const getSmtpSettings = async (): Promise<SmtpSettings> => {
    return apiCall('/settings/smtp');
};

export const saveSmtpSettings = async (settings: SmtpSettings): Promise<SmtpSettings> => {
    return apiCall('/settings/smtp', 'POST', settings);
};

// Legacy
export const updateUserUsage = async (userId: string, usedSeconds: number) => {};
export const initializeStorage = () => {}; 
export const clearAllData = () => {};
export const exportData = () => {};
export const importData = async (file: File) => false;
export const getApiKey = () => ""; 
export const setApiKey = (key: string) => {};
