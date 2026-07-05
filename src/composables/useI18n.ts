import { ref, computed } from "vue";

export type Locale = "pt" | "en";

const savedLocale = (localStorage.getItem("app_locale") as Locale) || "pt";
export const locale = ref<Locale>(savedLocale);

export const setLocale = (lang: Locale) => {
  locale.value = lang;
  localStorage.setItem("app_locale", lang);
};

export const isPt = computed(() => locale.value === "pt");
export const isEn = computed(() => locale.value === "en");

export const translations: Record<Locale, Record<string, any>> = {
  pt: {
    nav: {
      grade: "Grade",
      turmas: "Turmas",
      duvidas: "Dúvidas",
      progresso: "Progresso",
      tutor: "Tutor",
      master: "Master",
    },
    header: {
      editProfile: "Clique para editar seu perfil e nível",
      level: "Nível {level}",
      englishLevel: "Nível de Inglês",
      selectLang: "Selecionar Idioma",
    },
    hero: {
      badge: "100% GRATUITO & SOLIDÁRIO",
      title: "Aprenda Inglês Prático com o Auxílio de Mentores Voluntários!",
      subtitle: "Consuma lições interativas bilingues, teste suas respostas com quizzes com feedback imediato e agende práticas guiadas em tempo real com tutores cadastrados.",
      certBadge: "EMISSÃO VÁLIDA",
      certBadgeSub: "O Certificado-chave",
    },
    auth: {
      title: "English Volunteer",
      subtitle: "Conectando alunos e mentores para o ensino prático de inglês.",
      welcome: "Bem-vindo de volta!",
      enterEmail: "Digite seu e-mail",
      enterPass: "Digite sua senha",
      login: "Entrar com E-mail",
      loginGoogle: "Entrar com Google",
      loginDemo: "Entrar como Convidado (Rápido)",
      or: "ou",
      noAccount: "Não tem conta?",
      register: "Cadastre-se",
      hasAccount: "Já tem conta?",
      signUp: "Criar Conta",
      name: "Seu Nome Completo",
      registering: "Registrando...",
      signingIn: "Entrando...",
      logout: "Sair da Conta",
    },
    onboarding: {
      title: "Seja bem-vindo(a)!",
      subtitle: "Vamos personalizar sua experiência no English Volunteer.",
      chooseRole: "Escolha seu papel na comunidade:",
      student: "Quero aprender inglês (Aluno)",
      studentDesc: "Acesse lições gratuitas, participe de conversações em tempo real e emita certificados de conclusão.",
      instructor: "Quero ensinar inglês (Voluntário)",
      instructorDesc: "Ajude outras pessoas praticando conversação, tirando dúvidas e criando novos cursos.",
      levelTitle: "Qual seu nível atual de inglês?",
      beginner: "Iniciante (Beginner)",
      intermediate: "Intermediário (Intermediate)",
      advanced: "Avançado (Advanced)",
      all: "Todos os Níveis (Admin)",
      finish: "Concluir Onboarding",
    },
    courses: {
      searchPlaceholder: "Pesquisar por título ou professor...",
      noCourses: "Nenhum curso encontrado com essa busca.",
      by: "Por {name}",
      level: "Nível: {level}",
      lessonsCount: "{count} lições",
      enroll: "Matricular-se no Curso",
      enrolled: "Matriculado (Acessar)",
      comunitario: "Comunitário",
      myClasses: "Minhas Aulas Agendadas",
      noMyClasses: "Você ainda não se inscreveu em nenhuma aula ao vivo. Acesse a aba 'Turmas' para agendar uma prática de conversação!",
      activeCourses: "Cursos Ativos na Plataforma",
    },
    scheduler: {
      title: "Turmas de Conversação Ativa",
      subtitle: "Agende e participe de sessões de conversação ao vivo com mentores voluntários de todo o Brasil.",
      noClasses: "Nenhuma turma agendada no momento. Que tal falar com os voluntários no chat ou aguardar novos agendamentos?",
      addClass: "Agendar Nova Turma",
      editClass: "Editar Turma",
      selectCourse: "Selecione o Mini-Curso...",
      customClassOption: "⚡ Aula Avulsa (Sem Curso Associado)",
      customClassTitleLabel: "Título da Aula Avulsa *",
      customClassTitlePlaceholder: "Ex: Conversação Geral, Feedback Individual, Dúvidas de Gramática...",
      capacity: "Capacidade de Alunos *",
      day: "Data da Aula *",
      hour: "Horário (Brasília) *",
      linkLabel: "Link da Transmissão / Sala (Zoom, Meet, Teams) *",
      linkPlaceholder: "Cole o link da chamada de vídeo",
      createBtn: "Agendar Aula",
      saving: "Salvando...",
      cancel: "Cancelar",
      editBtn: "Salvar Alterações",
      status: "Status da Aula",
      statusScheduled: "Agendada / Ativa",
      statusCompleted: "Concluída",
      statusCancelled: "Cancelada",
      autor: "Autor: {name}",
      customDesc: "Aula independente com foco em conversação dinâmica, feedback personalizado e esclarecimento de dúvidas.",
      vacancies: "{count} vagas restantes",
      full: "Turma Cheia",
      enrollBtn: "Agendar Minha Presença",
      unenrollBtn: "Cancelar Meu Agendamento",
      joinClass: "Acessar Sala de Aula Ao Vivo",
      classStartsAt: "Aula agendada para: {date} às {time}",
      notStarted: "O link da chamada será liberado pelo professor próximo ao horário da aula.",
      deleteClass: "Excluir Turma",
      confirmDelete: "Tem certeza de que deseja excluir esta turma? Esta ação é irreversível.",
    },
    chat: {
      title: "Fórum de Dúvidas & Chat",
      subtitle: "Converse em tempo real com instrutores e estudantes para tirar suas dúvidas de inglês.",
      selectRoom: "Selecione uma sala de conversa ao lado para começar a interagir!",
      typePlaceholder: "Digite sua mensagem em inglês ou português...",
      send: "Enviar",
      emptyRoom: "Nenhuma mensagem nesta sala ainda. Seja o primeiro a dizer 'Hello'!",
      activeRooms: "Salas de Discussão Ativas",
      general: "Geral (English Only 💬)",
      beginners: "Iniciantes (Dúvidas Básicas 🇧🇷)",
      pronunciation: "Dicas de Pronúncia & Vídeos 🗣️",
      grammar: "Estruturas Gramaticais ✍️",
    },
    progress: {
      title: "Meu Painel de Progresso",
      subtitle: "Acompanhe suas conquistas pedagógicas, lições concluídas e emita certificados autorizados.",
      statsTitle: "Métricas Gerais",
      completedLessons: "Lições Concluídas",
      scheduledClasses: "Turmas Agendadas",
      completedCourses: "Cursos Finalizados",
      certificatesEarned: "Certificados Conquistados",
      lessonsHistory: "Histórico de Conclusão de Lições",
      noLessonsHistory: "Você ainda não concluiu nenhuma lição interativa. Explore os cursos na página inicial!",
      certificatesTitle: "Certificados Disponíveis para Emissão",
      notEligible: "Conclua todas as lições deste curso para liberar a emissão do certificado assinado.",
      issueCert: "Visualizar e Emitir Certificado",
      viewCertTitle: "Certificado de Conclusão",
    },
    tutor: {
      title: "Painel do Instrutor Voluntário",
      subtitle: "Gerencie seus cursos criados, veja o engajamento dos alunos e crie novos conteúdos pedagógicos.",
      newCourse: "Criar Novo Curso",
      analytics: "Estatísticas & Alunos",
      courseCreator: "Criador de Cursos",
    },
    master: {
      title: "Controle Administrativo Global (Master)",
      subtitle: "Acesso exclusivo para administradores gerenciarem permissões, órfãos de cursos e auditorias completas.",
    },
    profileModal: {
      title: "Seu Perfil do Voluntário",
      subtitle: "Configure suas informações de exibição, nível acadêmico e assinaturas para certificados.",
      nameLabel: "Seu Nome de Exibição",
      levelLabel: "Nível Teórico de Inglês",
      bioLabel: "Sua Biografia / Apresentação",
      save: "Salvar Perfil",
      saving: "Salvando...",
    },
  },
  en: {
    nav: {
      grade: "Classes",
      turmas: "Schedule",
      duvidas: "Support",
      progresso: "Progress",
      tutor: "Tutor",
      master: "Admin",
    },
    header: {
      editProfile: "Click to edit your profile and level",
      level: "Level {level}",
      englishLevel: "English Level",
      selectLang: "Select Language",
    },
    hero: {
      badge: "100% FREE & SOLIDARY",
      title: "Learn Practical English with the Help of Volunteer Mentors!",
      subtitle: "Consume interactive bilingual lessons, test your answers with immediate feedback quizzes, and schedule guided real-time practice with registered tutors.",
      certBadge: "VALID ISSUANCE",
      certBadgeSub: "Key Certificate",
    },
    auth: {
      title: "English Volunteer",
      subtitle: "Connecting students and mentors for practical English learning.",
      welcome: "Welcome back!",
      enterEmail: "Enter your email",
      enterPass: "Enter your password",
      login: "Log In with Email",
      loginGoogle: "Log In with Google",
      loginDemo: "Log In as Guest (Quick)",
      or: "or",
      noAccount: "Don't have an account?",
      register: "Sign Up",
      hasAccount: "Already have an account?",
      signUp: "Create Account",
      name: "Your Full Name",
      registering: "Registering...",
      signingIn: "Signing in...",
      logout: "Log Out",
    },
    onboarding: {
      title: "Welcome!",
      subtitle: "Let's personalize your experience at English Volunteer.",
      chooseRole: "Choose your role in the community:",
      student: "I want to learn English (Student)",
      studentDesc: "Access free lessons, participate in real-time conversations, and issue certificates of completion.",
      instructor: "I want to teach English (Volunteer)",
      instructorDesc: "Help other people by practicing conversation, answering questions, and creating new courses.",
      levelTitle: "What is your current English level?",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      all: "All Levels (Admin)",
      finish: "Complete Onboarding",
    },
    courses: {
      searchPlaceholder: "Search by title or teacher...",
      noCourses: "No courses found with this search.",
      by: "By {name}",
      level: "Level: {level}",
      lessonsCount: "{count} lessons",
      enroll: "Enroll in Course",
      enrolled: "Enrolled (Access)",
      comunitario: "Community",
      myClasses: "My Scheduled Classes",
      noMyClasses: "You haven't registered for any live classes yet. Go to the 'Schedule' tab to schedule a conversation practice!",
      activeCourses: "Active Courses on the Platform",
    },
    scheduler: {
      title: "Active Conversation Classes",
      subtitle: "Schedule and participate in live conversation sessions with volunteer mentors from all over Brazil.",
      noClasses: "No classes scheduled at the moment. How about talking to volunteers in the chat or waiting for new schedules?",
      addClass: "Schedule New Class",
      editClass: "Edit Class",
      selectCourse: "Select Mini-Course...",
      customClassOption: "⚡ Solo Class (No Associated Course)",
      customClassTitleLabel: "Solo Class Title *",
      customClassTitlePlaceholder: "E.g., General Conversation, One-on-one Feedback, Grammar Q&A...",
      capacity: "Student Capacity *",
      day: "Class Date *",
      hour: "Time (Brasília) *",
      linkLabel: "Stream / Meeting Link (Zoom, Meet, Teams) *",
      linkPlaceholder: "Paste the video call link",
      createBtn: "Schedule Class",
      saving: "Saving...",
      cancel: "Cancel",
      editBtn: "Save Changes",
      status: "Class Status",
      statusScheduled: "Scheduled / Active",
      statusCompleted: "Completed",
      statusCancelled: "Cancelled",
      autor: "Author: {name}",
      customDesc: "Independent class with a focus on dynamic conversation, personalized feedback, and clarification of doubts.",
      vacancies: "{count} vacancies left",
      full: "Class Full",
      enrollBtn: "Schedule My Presence",
      unenrollBtn: "Cancel My Schedule",
      joinClass: "Access Live Classroom",
      classStartsAt: "Class scheduled for: {date} at {time}",
      notStarted: "The video call link will be released by the teacher close to the class time.",
      deleteClass: "Delete Class",
      confirmDelete: "Are you sure you want to delete this class? This action is irreversible.",
    },
    chat: {
      title: "Questions Forum & Chat",
      subtitle: "Chat in real-time with instructors and students to clear up your English doubts.",
      selectRoom: "Select a chat room on the side to start interacting!",
      typePlaceholder: "Type your message in English or Portuguese...",
      send: "Send",
      emptyRoom: "No messages in this room yet. Be the first to say 'Hello'!",
      activeRooms: "Active Discussion Rooms",
      general: "General (English Only 💬)",
      beginners: "Beginners (Basic Doubts 🇧🇷)",
      pronunciation: "Pronunciation Tips & Videos 🗣️",
      grammar: "Grammar Structures ✍️",
    },
    progress: {
      title: "My Progress Dashboard",
      subtitle: "Track your pedagogical achievements, completed lessons, and issue authorized certificates.",
      statsTitle: "General Metrics",
      completedLessons: "Completed Lessons",
      scheduledClasses: "Scheduled Classes",
      completedCourses: "Completed Courses",
      certificatesEarned: "Earned Certificates",
      lessonsHistory: "Lessons Completion History",
      noLessonsHistory: "You haven't completed any interactive lessons yet. Explore courses on the homepage!",
      certificatesTitle: "Certificates Available for Issuance",
      notEligible: "Complete all lessons of this course to unlock the signed certificate issuance.",
      issueCert: "View and Issue Certificate",
      viewCertTitle: "Certificate of Completion",
    },
    tutor: {
      title: "Volunteer Instructor Dashboard",
      subtitle: "Manage your created courses, view student engagement, and create new pedagogical content.",
      newCourse: "Create New Course",
      analytics: "Stats & Students",
      courseCreator: "Course Creator",
    },
    master: {
      title: "Global Administrative Control (Master)",
      subtitle: "Exclusive access for administrators to manage permissions, orphaned courses, and complete audits.",
    },
    profileModal: {
      title: "Your Volunteer Profile",
      subtitle: "Set up your display information, academic level, and certificate signatures.",
      nameLabel: "Your Display Name",
      levelLabel: "Theoretical English Level",
      bioLabel: "Your Biography / Bio",
      save: "Save Profile",
      saving: "Saving...",
    },
  },
};

export function t(key: string, args?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: any = translations[locale.value];
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      value = null;
      break;
    }
  }

  if (!value) {
    // Try PT fallback
    value = translations.pt;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
  }

  if (!value || typeof value !== "string") {
    return key;
  }

  if (args) {
    let result = value;
    for (const [argKey, argVal] of Object.entries(args)) {
      result = result.replace(new RegExp(`{${argKey}}`, "g"), String(argVal));
    }
    return result;
  }

  return value;
}

export function useI18n() {
  return {
    locale,
    setLocale,
    isPt,
    isEn,
    t,
  };
}
