import { User, Meeting, Company, UserRole } from '../types';

export const MOCK_COMPANY: Company = {
  id: 'company-1',
  name: 'Pincopallo SPA',
  logoUrl: 'https://placehold.co/200x200/007bff/FFFFFF/png?text=PS',
};

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@aiscriba.com',
    role: UserRole.GeneralAdmin,
    companyId: 'company-1', // Added companyId to allow creating meetings in demo mode
    monthlyAllowanceSeconds: 252000,
    usedSecondsThisMonth: 0,
  },
  {
    id: 'user-2',
    email: 'admin@pincopallo.com',
    role: UserRole.CompanyAdmin,
    companyId: 'company-1',
    monthlyAllowanceSeconds: 252000,
    usedSecondsThisMonth: 0,
  },
  {
    id: 'user-3',
    email: 'mario.rossi@pincopallo.com',
    role: UserRole.User,
    companyId: 'company-1',
    monthlyAllowanceSeconds: 252000,
    usedSecondsThisMonth: 3600,
  }
];

export const MOCK_MEETINGS: Meeting[] = [
    {
        id: 'meeting-1',
        title: 'Project Kickoff Pincopallo',
        participants: ['Mario Rossi', 'Luigi Verdi', 'Anna Bianchi'],
        date: new Date().toISOString().split('T')[0],
        status: 'processed',
        companyId: 'company-1',
        creatorId: 'user-3',
        visibility: 'company',
        verbal: {
            executiveSummary: "La riunione ha dato il via al nuovo progetto 'Scriba'. Il budget è stato approvato e sono stati assegnati i primi compiti.",
            decisions: [
                { decision: "Approvato il budget preliminare di 50.000€" },
                { decision: "Scelto lo stack tecnologico: React + Node.js" }
            ],
            actionItems: [
                { task: "Creare la roadmap dettagliata", owner: "Mario Rossi", dueDate: "2024-12-31" },
                { task: "Configurare l'ambiente di sviluppo", owner: "Luigi Verdi", dueDate: "2024-10-15" }
            ],
            discussionSummary: "Ampia discussione sulle tempistiche. Anna ha sollevato dubbi sulla scadenza di novembre, che è stata posticipata a dicembre. Luigi ha confermato la disponibilità del team tecnico.",
            fullTranscript: "Mario: Buongiorno a tutti, iniziamo.\nAnna: Ciao Mario.\nLuigi: Presente.\nMario: L'obiettivo di oggi è il kickoff del progetto...\n[...]",
            flowchart: 'graph TD; A[Inizio Kickoff] --> B{Budget Approvato?}; B -- Si --> C[Assegnazione Task]; B -- No --> D[Revisione Costi]; C --> E[Fine Riunione];'
        }
    }
];