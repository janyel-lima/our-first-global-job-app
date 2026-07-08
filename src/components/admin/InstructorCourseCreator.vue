<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  FileText, 
  UploadCloud, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  Trash2, 
  PlusCircle, 
  Check, 
  Plus, 
  ShieldCheck, 
  AlertCircle,
  BookOpen,
  Bold,
  Italic,
  Heading3,
  List,
  MessageSquare,
  Table,
  Lightbulb,
  Edit,
  Info,
  X,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next';
import MarkdownRenderer from '../common/MarkdownRenderer.vue';
import { Course, Lesson, QuizQuestion } from '../../types';
import { showToast } from '../../composables/useAppState';

interface DraftLesson {
  tempId: string;
  title: string;
  content: string; // Markdown format
  videoUrl: string;
  quiz: QuizQuestion[];
}

const props = defineProps<{
  userDisplayName: string;
  uploadCourseFn?: (course: Course, lessons: Lesson[]) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'upload-course', course: Course, lessons: Lesson[]): void;
}>();

const activeLessonTab = ref<'edit' | 'preview' | 'quiz'>('edit');

// Manual course creation states
const manualTitle = ref('');
const manualDescription = ref('');
const manualLevel = ref<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
const requireReading = ref(true);
const requireQuiz = ref(false);
const minQuizScore = ref(70);
const requireVideo = ref(false);
const importFileInputRef = ref<HTMLInputElement | null>(null);
const lessonsList = ref<DraftLesson[]>([]);
const selectedLessonId = ref<string | null>(null);

// States to add a quiz question dynamically
const newQuestionText = ref('');
const newOption1 = ref('');
const newOption2 = ref('');
const newOption3 = ref('');
const newOption4 = ref('');
const newCorrectIndex = ref<number>(0);
const newExplanation = ref('');

// Refs for multi-file upload
const multiFileInputRef = ref<HTMLInputElement | null>(null);

// Loading states
const isGenerating = ref(false);
const generationError = ref<string | null>(null);
const generationSuccess = ref(false);
const importSuccess = ref(false);
const showTutorial = ref(true);

const triggerMultiMdUpload = () => {
  if (multiFileInputRef.value) {
    multiFileInputRef.value.click();
  }
};

const activeLessonObject = computed(() => {
  return lessonsList.value.find(l => l.tempId === selectedLessonId.value);
});

// Templates list for quick loading
const eslTemplatesList = [
  {
    name: "Cumprimentos e Apresentações (Basic Greetings)",
    title: "Lesson 1: Meeting New People",
    videoUrl: "https://www.youtube.com/watch?v=Fw0S1ZPr6pE",
    content: `### Lesson 1: Meeting New People
 
Nesta lição, aprenderemos a realizar apresentações formais e informais no idioma inglês.

#### 🗣️ Diálogo Simulado (Simulated Dialogue)

**Lucas:** Hello! Good morning! My name is Lucas. What is your name?
**Sofia:** Hi, good morning! My name is Sofia. Nice to meet you, Lucas!
**Lucas:** Nice to meet you too, Sofia! Where are you from?
**Sofia:** I am from Rio de Janeiro, Brazil. And you?
**Lucas:** I am from Toronto, Canada!

---

#### 📊 Tabela Glossária de Expressões (Greetings Sheet)

| Termo em Inglês (English) | Pronúncia Guia | Significado em Português |
| :--- | :--- | :--- |
| Nice to meet you | [naiss tú mít iú] | Prazer em conhecer você |
| Good morning | [gʊd ˈmɔrnɪŋ] | Bom dia |
| Where are you from? | [uér ár iú fróm] | De onde você é? |
| Welcome | [uél-cam] | Bem-vindo / De nada |

---

> 💡 **Pro Tip (Dica Prática):**
> Para responder "Nice to meet you" de forma natural e rápida, você pode usar apenas **"Likewise!"** (Igualmente!) ou responder elegantemente com **"The pleasure is all mine!"** (O prazer é todo meu!).`,
    quiz: [
      {
        question: "Qual das alternativas representa uma resposta natural e educada para 'Nice to meet you'?",
        options: ["Likewise! (Igualmente)", "I am from Canada", "No problem"],
        correctAnswer: 0,
        explanation: "Likewise é usado no dia a dia como abreviação de 'Nice to meet you too' (igualmente!)."
      },
      {
        question: "De onde Lucas é, conforme o diálogo?",
        options: ["Toronto, Canada", "Rio de Janeiro, Brazil", "London, England"],
        correctAnswer: 0,
        explanation: "No diálogo Lucas afirma: 'I am from Toronto, Canada!'."
      }
    ]
  },
  {
    name: "Business English / Entrevista (Job Interview)",
    title: "Lesson 2: Simple Past for Careers",
    videoUrl: "https://www.youtube.com/watch?v=pcK99-C-Wz4",
    content: `### Lesson 2: Aceitando o Desafio da Entrevista

Dominar o vocabulário de diálogos e entrevistas de emprego em inglês abre horizontes incríveis. Vamos praticar!

#### 💼 Diálogo de Entrevista (Interview Scenario)

**Interviewer:** So, Sofia, tell me about your strengths.
**Sofia:** Well, I consider myself a fast learner and highly organized. In my last volunteer role, I managed event schedule files and coordinated team actions.
**Interviewer:** Perfect. Why do you want to join our organization?
**Sofia:** I want to leverage my skills to build high-quality education tools and help our local community thrive.

---

#### 📚 Tabela Corporativa (Corporate Vocabulary)

| Expressão Chave | Pronúncia Guia | Significado / Aplicação |
| :--- | :--- | :--- |
| Strengths | [strén-fiss] | Pontos fortes / Qualidades |
| Leverage | [lé-ve-redj] | Potencializar / Alavancar |
| Highly organized | [ráili ór-ga-na-iz'd] | Altamente organizado |
| Fast learner | [fést lér-ner] | Aprendiz rápido |

---

> ⚠️ **Grammar Tip (Dica de Gramática):**
> Ao falar sobre realizações passadas em entrevistas, use sempre verbos de ação no **Simple Past** (managed, coordinated, increased, designed) para soar confiante e firme.`,
    quiz: [
      {
        question: "Por que se sobressai usar verbos no 'Simple Past' ao falar sobre suas realizações?",
        options: [
          "Para soar ativo(a) e confiante sobre ações concluídas no passado.",
          "Porque expressa ações não resolvidas e planos em aberto.",
          "Verbos no Simple Past não são recomendados no meio corporativo."
        ],
        correctAnswer: 0,
        explanation: "Verbos de ação no passado (como managed, coordinated) denotam firmeza e conclusividade sobre seus projetos."
      }
    ]
  },
  {
    name: "At the Coffee Shop (Diálogo em Viagem)",
    title: "Lesson 3: Ordering Food and Drinks",
    videoUrl: "https://www.youtube.com/watch?v=Gek3p8B_1X8",
    content: `### Lesson 3: Pedindo um Café (At the Starbucks)

Saber pedir alimentos e bebidas com cortesia é essencial em suas viagens. Veja um roteiro prático.

#### ☕ Diálogo Simulado (At the Counter)

**Barista:** Hello! Welcome to the English Cafe. What can I get started for you today?
**Customer:** Hi! Can I have a warm chocolate muffin and a regular black coffee, please?
**Barista:** Sure! What size would you like for your coffee? Small, medium or large?
**Customer:** Medium size, please. Also, could I get some sugar packages on the side?
**Barista:** Definitely. That will be $5.20. Credit card or cash?
**Customer:** Credit card, please. Here you go!
**Barista:** Thank you! Have a great day!

---

#### 🥐 Tabela Utilitária (Traveler Words)

| Inglês (English) | Pronúncia Modelada | Tradução em Português |
| :--- | :--- | :--- |
| Can I have... please? | [quén ái hév ... pliz] | Gostaria de / Pode me dar... por favor? |
| Warmed up / Warm | [uórmd áp] | Aquecido / Quentinho |
| Regular black coffee | [rég-iu-lar blék có-fi] | Café puro tradicional |
| On the side | [ón de sá-id] | À parte / Separado |

---

> 💡 **Politeness Anchor (Polidez):**
> Em países de língua inglesa, evite dizer "I want..." (Eu quero) ao solicitar coisas em lojas ou restaurantes. Use sempre as formas gentis **"Can I have..."** ou **"Could I get..."** acompanhadas de **"please"**.`,
    quiz: [
      {
        question: "Qual das expressões abaixo é a mais polida para pedir um café em um balcão em vez de usar 'I want...'?",
        options: ["Give me some coffee!", "Can I have a regular black coffee, please?", "I demand a drink."],
        correctAnswer: 1,
        explanation: "O uso de 'Can I have...' acompanhado de 'please' é a forma de maior polidez e elegância para diálogos diários."
      }
    ]
  },
  {
    name: "Past Simple vs Present Perfect (Gramática)",
    title: "Lesson 4: Past Simple vs Present Perfect",
    videoUrl: "https://www.youtube.com/watch?v=mWhZ4mDozW0",
    content: `### Lesson 4: Passado Resolvido vs. Conexão Presente

Conhecer a diferença real entre o **Simple Past** e o **Present Perfect** impulsiona a habilidade de comunicação analítica.

#### 🗣️ Diálogo Ilustrativo

**John:** Hey, Emma! **Have you seen** the new volunteer schedule yet?
**Emma:** Yes, **I saw** it yesterday! It looks really organized.
**John:** That's great! I **have been** a volunteer instructor for two weeks now, and I'm loving it!

---

#### 📊 Tabela de Mapeamento Temporal (Time Mapping)

| Tempo Verbal | Quando Usar | Exemplos de Uso | Marcadores de Tempo Comuns |
| :--- | :--- | :--- | :--- |
| **Simple Past** | Ações totalmente findadas no passado com data/tempo definido. | I lived in Chicago in 2021. | yesterday, last year, in 2018 |
| **Present Perfect** | Ações que começaram no passado e continuam ou afetam o presente. | I have lived in Bahia for five years. | since, for, already, yet, ever |

---

> 🧠 **Dica de Memorização:**
> Se o tempo em que a ação ocorreu é **específico** (yesterday, last class), use o **Simple Past**! Se o período é **em aberto** ou o que importa é a experiência em si sem focar em datas, use o **Present Perfect**.`,
    quiz: [
      {
        question: "Complete as lacunas: 'I ____ Sofia yesterday' e 'I ____ in Rio de Janeiro for three years'.",
        options: ["saw / have lived", "have seen / lived", "saw / am live"],
        correctAnswer: 0,
        explanation: "Usamos 'saw' (Simple Past) porque especificamos ontem (yesterday) e 'have lived' (Present Perfect) para expressar um período que começou no passado e ainda continua no presente."
      }
    ]
  }
];

const handleCreateCourseManual = async () => {
  generationError.value = null;
  generationSuccess.value = false;
  importSuccess.value = false;

  if (!manualTitle.value.trim()) {
    generationError.value = "O título do mini-curso é obrigatório.";
    return;
  }
  if (!manualDescription.value.trim()) {
    generationError.value = "A descrição do mini-curso é obrigatória.";
    return;
  }
  if (lessonsList.value.length === 0) {
    generationError.value = "Adicione pelo menos uma lição ao seu mini-curso.";
    return;
  }

  // Validate draft lessons
  for (let i = 0; i < lessonsList.value.length; i++) {
    const lesson = lessonsList.value[i];
    if (!lesson.title.trim()) {
      generationError.value = `A lição ${i + 1} está sem título.`;
      return;
    }
    if (!lesson.content.trim()) {
      generationError.value = `A lição "${lesson.title || `Lição ${i+1}`}" está com o conteúdo em markdown vazio.`;
      return;
    }
  }

  isGenerating.value = true;
  try {
    const courseId = `course-${Math.random().toString(36).substring(2, 9)}`;
    
    const parsedCourse: Course = {
      id: courseId,
      title: manualTitle.value.trim(),
      description: manualDescription.value.trim(),
      level: manualLevel.value,
      creatorId: "current-instructor",
      creatorName: props.userDisplayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressConfig: {
        requireReading: requireReading.value,
        requireQuiz: requireQuiz.value,
        minQuizScore: Number(minQuizScore.value || 70),
        requireVideo: requireVideo.value
      },
      certificateConfig: {
        primaryColor: "#1e3a8a",
        iconUrl: "",
        bgStyle: "clean-light",
        frameStyle: "modern-border",
        detailColor: "theme"
      }
    };

    const parsedLessons: Lesson[] = lessonsList.value.map((less, index) => ({
      id: `lesson-${courseId}-${index + 1}`,
      courseId,
      title: less.title.trim(),
      content: less.content,
      videoUrl: less.videoUrl?.trim() || "",
      order: index + 1,
      quiz: less.quiz
    }));

    if (props.uploadCourseFn) {
      await props.uploadCourseFn(parsedCourse, parsedLessons);
    } else {
      emit('upload-course', parsedCourse, parsedLessons);
    }
    
    // Cleanup states ONLY if the asynchronous database commit finishes successfully!
    manualTitle.value = '';
    manualDescription.value = '';
    requireReading.value = true;
    requireQuiz.value = false;
    minQuizScore.value = 70;
    requireVideo.value = false;
    lessonsList.value = [];
    selectedLessonId.value = null;
    generationSuccess.value = true;
    setTimeout(() => {
      generationSuccess.value = false;
    }, 12050);
  } catch (err: any) {
    console.error("Erro ao criar mini-curso manual:", err);
    let debugMsg = err.message || String(err);
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && parsed.error) {
        debugMsg = parsed.error;
      }
    } catch {}
    generationError.value = `Não foi possível criar o curso no banco de dados. Erro: ${debugMsg}. (Sua digitação não foi perdida, por favor, verifique suas permissões e tente novamente!)`;
  } finally {
    isGenerating.value = false;
  }
};

const downloadDummyTemplate = () => {
  const data = {
    course: {
      title: "Introdução ao Inglês de Sobrevivência (Dummy Import)",
      description: "Aprenda saudações básicas, como se apresentar de maneira confiante e estruturas conversacionais universais.",
      level: "Beginner",
      progressConfig: {
        requireReading: true,
        requireQuiz: true,
        minQuizScore: 70,
        requireVideo: false
      }
    },
    lessons: [
      {
        title: "Lesson 1: Greetings & Introductions",
        content: `# Greetings & Introductions 🇬🇧\n\nNesta lição, você aprenderá as principais saudações em inglês domésticas.\n\n## 1. Saudações Básicas\n- **Hello!** (Olá!)\n- **Good morning!** (Bom dia!)\n- **Good afternoon!** (Boa tarde!)\n- **Good evening!** (Boa noite - na chegada)\n\n## 2. Diálogo Breve\n**A:** Hello, how are you?\n**B:** I'm good, thank you. And you?\n**A:** I'm great!`,
        videoUrl: "https://www.youtube.com/watch?v=Fw0S1ZPr6pE",
        order: 1,
        quiz: [
          {
            question: "Qual expressão é usada para saudar alguém à tarde?",
            options: ["Good morning", "Good afternoon", "Good night", "Excuse me"],
            correctAnswer: 1,
            explanation: "Usamos Good afternoon especificamente entre as 12h00 e as 18h00 do dia."
          }
        ]
      }
    ]
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = "modelo-curso-dummy.json";
  link.click();
  URL.revokeObjectURL(url);
};

const triggerImportClick = () => {
  if (importFileInputRef.value) {
    importFileInputRef.value.click();
  }
};

const handleImportCourseJson = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (!data || !data.course || !data.course.title || !data.course.description) {
        throw new Error("Formato inválido. O JSON deve conter os nós 'course' e 'lessons' estruturados.");
      }
      
      manualTitle.value = data.course.title;
      manualDescription.value = data.course.description;
      manualLevel.value = data.course.level || "Beginner";
      
      if (data.course.progressConfig) {
        requireReading.value = data.course.progressConfig.requireReading !== false;
        requireQuiz.value = !!data.course.progressConfig.requireQuiz;
        minQuizScore.value = data.course.progressConfig.minQuizScore || 70;
        requireVideo.value = !!data.course.progressConfig.requireVideo;
      } else {
        requireReading.value = true;
        requireQuiz.value = false;
        minQuizScore.value = 70;
        requireVideo.value = false;
      }
      
      if (Array.isArray(data.lessons)) {
        lessonsList.value = data.lessons.map((l: any, index: number) => ({
          tempId: `draft-less-${Math.random().toString(36).substring(2, 9)}`,
          title: l.title || `Lição ${index + 1}`,
          content: l.content || `# ${l.title || `Lição ${index + 1}`}\n\nConteúdo da lição.`,
          videoUrl: l.videoUrl || "",
          quiz: Array.isArray(l.quiz) ? l.quiz : []
        }));
        
        if (lessonsList.value.length > 0) {
          selectedLessonId.value = lessonsList.value[0].tempId;
        }
      }
      
      importSuccess.value = true;
      generationSuccess.value = false;
      generationError.value = null;
      setTimeout(() => {
        importSuccess.value = false;
      }, 12050);
      showToast("Mini-curso importado com sucesso! Edite as lições geradas e clique em 'Publicar Curso Voluntário' para salvar.", "success", 8000);
    } catch (err: any) {
      console.error(err);
      generationError.value = "Falha ao analisar o JSON do curso: " + err.message;
      showToast("Erro ao importar: " + err.message, "error");
    }
  };
  reader.readAsText(file);
};

const handleAddEmptyLesson = () => {
  const tempId = `draft-${Math.random().toString(36).substring(2, 9)}`;
  const newLesson: DraftLesson = {
    tempId,
    title: `Lesson ${lessonsList.value.length + 1}: Nova Lição`,
    content: `### Lesson ${lessonsList.value.length + 1}: Nova Lição\n\nEscreva o conteúdo da aula de inglês aqui. Use a barra superior para adicionar formatações rápidas.`,
    videoUrl: '',
    quiz: []
  };
  lessonsList.value.push(newLesson);
  selectedLessonId.value = tempId;
};

const handleLoadLessonTemplate = (title: string, markdown: string) => {
  const tempId = `draft-${Math.random().toString(36).substring(2, 9)}`;
  const templateMatched = eslTemplatesList.find(t => t.title === title || t.content === markdown);
  const quizQuestions = templateMatched?.quiz ? JSON.parse(JSON.stringify(templateMatched.quiz)) : [
    {
      question: "Resolva esta questão simples de fixação em inglês:",
      options: ["Opção Correta", "Opção Incorreta", "Revisão Necessária"],
      correctAnswer: 0,
      explanation: "Parabéns! Resposta correta."
    }
  ];

  const newLesson: DraftLesson = {
    tempId,
    title,
    content: markdown,
    videoUrl: templateMatched?.videoUrl || "",
    quiz: quizQuestions
  };
  lessonsList.value.push(newLesson);
  selectedLessonId.value = tempId;

  setTimeout(() => {
    const el = document.getElementById("instructor-shield") || document.querySelector(".lg\\:col-span-8");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleApplyTemplateToCurrentLesson = (title: string, markdown: string) => {
  if (!selectedLessonId.value) {
    showToast("Nenhum rascunho de lição selecionado para aplicar o modelo.", "warning");
    return;
  }
  const templateMatched = eslTemplatesList.find(t => t.title === title || t.content === markdown);
  const quizQuestions = templateMatched?.quiz ? JSON.parse(JSON.stringify(templateMatched.quiz)) : [
    {
      question: "Resolva esta questão simples de fixação em inglês:",
      options: ["Opção Correta", "Opção Incorreta", "Revisão Necessária"],
      correctAnswer: 0,
      explanation: "Parabéns! Resposta correta."
    }
  ];

  const currentLessonIdx = lessonsList.value.findIndex(l => l.tempId === selectedLessonId.value);
  if (currentLessonIdx !== -1) {
    lessonsList.value[currentLessonIdx].title = title;
    lessonsList.value[currentLessonIdx].content = markdown;
    lessonsList.value[currentLessonIdx].videoUrl = templateMatched?.videoUrl || "";
    lessonsList.value[currentLessonIdx].quiz = quizQuestions;
    showToast(`Modelo "${title}" injetado com sucesso no rascunho atual!`, "success");
    activeLessonTab.value = 'edit';
  }

  setTimeout(() => {
    const el = document.getElementById("instructor-shield") || document.querySelector(".lg\\:col-span-8");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleRemoveLesson = (tempId: string) => {
  lessonsList.value = lessonsList.value.filter(l => l.tempId !== tempId);
  if (selectedLessonId.value === tempId) {
    selectedLessonId.value = lessonsList.value.length > 0 ? lessonsList.value[0].tempId : null;
  }
};

const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
  const targetIdx = direction === 'up' ? index - 1 : index + 1;
  if (targetIdx < 0 || targetIdx >= lessonsList.value.length) return;

  const temp = lessonsList.value[index];
  lessonsList.value[index] = lessonsList.value[targetIdx];
  lessonsList.value[targetIdx] = temp;
};

const handleMultiMdUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  const totalFiles = files.length;
  let processed = 0;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Tentar obter o título da lição (geralmente começa com # na primeira linha)
        const lines = text.split("\n");
        const firstLine = lines.find((l) => l.trim().startsWith("# "));
        const title = firstLine 
          ? firstLine.replace("# ", "").trim() 
          : file.name.replace(".md", "");

        const tempId = `draft-${Math.random().toString(36).substring(2, 9)}`;
        const newLesson: DraftLesson = {
          tempId,
          title,
          content: text,
          videoUrl: "",
          quiz: [
            {
              question: "De acordo com a leitura realizada, marque a resposta correta:",
              options: ["Afirmação Correta", "Alternativa Falsa", "Não mencionado"],
              correctAnswer: 0,
              explanation: "Revise o conteúdo acima se necessário."
            }
          ]
        };
        lessonsList.value.push(newLesson);
        processed++;
        if (processed === totalFiles) {
          selectedLessonId.value = lessonsList.value[lessonsList.value.length - totalFiles].tempId;
          showToast(`${totalFiles} arquivos markdown importados com sucesso na grade curricular!`, "success");
        }
      }
    };
    reader.readAsText(file);
  }
};

const handleAddQuizQuestion = (lessonId: string) => {
  if (!newQuestionText.value.trim() || !newOption1.value.trim() || !newOption2.value.trim()) {
    showToast("Preencha ao menos o enunciado e as alternativas A e B.", "warning");
    return;
  }

  const options = [newOption1.value.trim(), newOption2.value.trim()];
  if (newOption3.value.trim()) options.push(newOption3.value.trim());
  if (newOption4.value.trim()) options.push(newOption4.value.trim());

  if (newCorrectIndex.value >= options.length) {
    showToast("A alternativa correta selecionada não está preenchida.", "warning");
    return;
  }

  const questionObj: QuizQuestion = {
    question: newQuestionText.value.trim(),
    options,
    correctAnswer: newCorrectIndex.value,
    explanation: newExplanation.value.trim() || undefined
  };

  const lesson = lessonsList.value.find(l => l.tempId === lessonId);
  if (lesson) {
    lesson.quiz.push(questionObj);
    showToast("Questão registrada no rascunho com sucesso!", "success");
    
    // Clear inputs
    newQuestionText.value = '';
    newOption1.value = '';
    newOption2.value = '';
    newOption3.value = '';
    newOption4.value = '';
    newCorrectIndex.value = 0;
    newExplanation.value = '';
  }
};

const handleRemoveQuizQuestion = (lessonId: string, qIndex: number) => {
  const lesson = lessonsList.value.find(l => l.tempId === lessonId);
  if (lesson) {
    lesson.quiz.splice(qIndex, 1);
    showToast("Questão removida do rascunho.", "info");
  }
};

const handleInsertMarkdownSyntax = (syntax: string) => {
  if (!selectedLessonId.value) return;
  const textarea = document.getElementById(`textarea-markdown-editor-${selectedLessonId.value}`) as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentText = textarea.value;
  const selectedText = currentText.substring(start, end);

  let insertion = "";
  switch(syntax) {
    case 'bold':
      insertion = `**${selectedText || 'Texto em negrito'}**`;
      break;
    case 'italic':
      insertion = `*${selectedText || 'Texto em itálico'}*`;
      break;
    case 'heading':
      insertion = `\n### ${selectedText || 'Subtítulo'}\n`;
      break;
    case 'list':
      insertion = `\n- ${selectedText || 'Item 1'}\n- Item 2\n`;
      break;
    case 'dialogue':
      insertion = `\n**Lucas:** ${selectedText || 'Hi, Sofia! How is it going?'}\n**Sofia:** I am fine, thank you!\n`;
      break;
    case 'table':
      insertion = `\n| Termo em Inglês | Significado em Português | Pronúncia |\n| :--- | :--- | :--- |\n| ${selectedText || 'Hello'} | Olá | [rélou] |\n`;
      break;
    case 'alert':
      insertion = `\n> 💡 **Tip (Dica de Ouro):**\n> ${selectedText || 'Insira uma dica gramatical prática aqui.'}\n`;
      break;
  }

  const valueUpdated = currentText.substring(0, start) + insertion + currentText.substring(end);
  const targetLesson = lessonsList.value.find(l => l.tempId === selectedLessonId.value);
  if (targetLesson) {
    targetLesson.content = valueUpdated;
  }

  // Refocus
  setTimeout(() => {
    textarea.focus();
    const cursorOffset = start + insertion.length;
    textarea.setSelectionRange(cursorOffset, cursorOffset);
  }, 50);
};
</script>

<template>
  <div class="space-y-6">
    
    <!-- Informative banner -->
    <div class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-xs">
      <div class="space-y-1">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 font-bold text-[10px] rounded-full uppercase tracking-wide">
          <Info class="w-3 h-3" /> Construtor Autônomo de Inglês
        </span>
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-blue-400 leading-tight">Canal de Criação de Cursos & Lições</h3>
        <p class="text-xs text-slate-650 dark:text-slate-305 leading-snug">
          Crie novos tópicos e aplique modelos prontos de conversação. O assistente formata e consolida as questões avaliativas instantaneamente para os alunos.
        </p>
      </div>
      
      <button
        type="button"
        @click="showTutorial = !showTutorial"
        class="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <BookOpen class="w-3.5 h-3.5" />
        {{ showTutorial ? "Esconder Tutorial de Markdown" : "Exibir Tutorial e Exemplos" }}
      </button>
    </div>

    <!-- Quick Template Injection tool inside Tutorial menu -->
    <div v-if="showTutorial" class="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 text-left space-y-4 shadow-2xs">
      <div>
        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Lightbulb class="w-4 h-4 text-amber-500" />
          Modelos de Lição (Injeção Rápida de Atividades)
        </h4>
        <p class="text-xs text-slate-500">Selecione um modelo de conversação e termos de inglês para anexar ou substituir na grade curricular de seu curso:</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="tmpl in eslTemplatesList"
          :key="tmpl.name"
          class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div class="space-y-1.5 mb-4">
            <div class="flex items-center gap-1.5 justify-between">
              <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100 dark:border-blue-900">
                Modelo de Aula
              </span>
              <span class="text-[9.5px] text-slate-400 dark:text-slate-400 font-bold">
                {{ (tmpl.quiz || []).length }} questões
              </span>
            </div>
            <h5 class="text-xs font-extrabold text-slate-950 dark:text-slate-50">{{ tmpl.name }}</h5>
            <p class="text-[10.5px] text-slate-550 dark:text-slate-350 leading-relaxed">
              Injeta automaticamente diálogo bilíngue, glossário pronunciado, dicas estruturais e quiz avaliativo customizado.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
            <button
              type="button"
              @click="handleLoadLessonTemplate(tmpl.title, tmpl.content)"
              class="flex-1 py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10.5px] font-extrabold transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:shadow-xs"
            >
              <PlusCircle class="w-3.5 h-3.5" />
              Criar Nova Lição
            </button>
            
            <button
              type="button"
              :disabled="!selectedLessonId"
              @click="handleApplyTemplateToCurrentLesson(tmpl.title, tmpl.content)"
              :class="[
                'flex-1 py-1 px-3 rounded-xl text-[10.5px] font-extrabold transition-all text-center flex items-center justify-center gap-1 border cursor-pointer',
                selectedLessonId
                  ? 'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:text-amber-900'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-550 border-slate-200 dark:border-slate-805 opacity-60 cursor-not-allowed'
              ]"
              :title="selectedLessonId ? 'Substitui o conteúdo do rascunho selecionado por este modelo integrado' : 'Selecione uma lição no Passo 2 antes de usar esta opção'"
            >
              <Edit class="w-3.5 h-3.5" />
              Injetar na Lição Atual
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import / Export Hub -->
    <div class="bg-slate-50 dark:bg-slate-900 border border-indigo-100/50 dark:border-indigo-900/40 rounded-2xl p-4.5 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="space-y-1">
        <h4 class="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud class="w-4 h-4 text-indigo-600 dark:text-indigo-450" />
          Importação e Exportação de Novas Matrizes (JSON)
        </h4>
        <p class="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed">
          Tem um curso completo formatado em JSON? Carregue-o para preencher automaticamente toda a grade de lições e quizzes, ou baixe um modelo pronto para servir de base.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          @click="triggerImportClick"
          class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <UploadCloud class="w-3.5 h-3.5" />
          Importar Curso JSON
        </button>
        <input
          ref="importFileInputRef"
          type="file"
          accept=".json"
          @change="handleImportCourseJson"
          class="hidden"
        />
        <button
          type="button"
          @click="downloadDummyTemplate"
          class="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-900 text-indigo-750 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <FileText class="w-3.5 h-3.5" />
          Baixar Modelo Dummy
        </button>
      </div>
    </div>

    <!-- Global Course details builder -->
    <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 text-left space-y-4">
      <p class="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-1">Passo 1: Metadados do Mini-Curso</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Título do Mini-Curso *</label>
          <input
            type="text"
            required
            v-model="manualTitle"
            placeholder="Ex: Business English: Reuniões e Negociações"
            class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Classificação de Nível *</label>
          <select
            required
            v-model="manualLevel"
            class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <option value="Beginner">Iniciante (Beginner)</option>
            <option value="Intermediate">Intermediário (Intermediate)</option>
            <option value="Advanced">Avançado (Advanced)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Sinopse Pedagógica / Descrição *</label>
        <textarea
          required
          rows="2"
          v-model="manualDescription"
          placeholder="Apresente brevemente o objetivo e o que o aluno de voluntariado irá praticar neste módulo..."
          class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
        />
      </div>

      <!-- Progress requirement options -->
      <div class="border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <ShieldCheck class="w-4 h-4 text-emerald-600 animate-pulse" />
          Métrica de Progresso Configurável (Definido pelo Professor)
        </p>
        <p class="text-[11px] text-slate-500 mb-3.5 leading-snug">
          Selecione quais conquistas de aula o aluno precisa finalizar para avançar no progresso do curso e obter a sua certificação:
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-850">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="requireReading"
              class="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Confirmar Leitura</span>
              <span class="block text-[10px] text-slate-500 leading-snug">Aluno clica em "Marcar como Concluído"</span>
            </div>
          </label>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="requireVideo"
              class="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Assistir ao Vídeo</span>
              <span class="block text-[10px] text-slate-500 leading-snug">Exige interagir/clicar no vídeo (se houver)</span>
            </div>
          </label>

          <div class="space-y-2">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                v-model="requireQuiz"
                class="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Resolver Mini-Quiz (Fixação)</span>
                <span class="block text-[10px] text-slate-500 leading-snug">Exige submeter e obter aprovação</span>
              </div>
            </label>

            <div v-if="requireQuiz" class="pl-7 pt-1 animate-fadeIn">
              <label class="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Aproveitamento Mínimo Necessário (%)</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  v-model="minQuizScore"
                  class="w-20 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-md p-1 focus:ring-1 focus:ring-blue-500 text-center font-bold"
                />
                <span class="text-[11px] font-bold text-slate-500">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lessons section builder -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
      
      <!-- Drawer left: Outline of draft lessons -->
      <div class="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
        <div class="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-2">
          <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Passo 2: Lições do Programa</span>
          <button
            type="button"
            @click="handleAddEmptyLesson"
            class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" /> Adicionar Lição
          </button>
        </div>

        <!-- Multiple file upload connector -->
        <div class="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-900/50 rounded-xl text-center space-y-2">
          <div class="text-center">
            <UploadCloud class="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto" />
            <p class="text-[10.5px] font-bold text-blue-900 dark:text-blue-300 mt-1">Carregar Múltiplos Arquivos .MD</p>
            <p class="text-[9.5px] text-blue-600 dark:text-blue-400">Importe textos prontos com tabelas e diálogos para acelerar.</p>
          </div>
          <button
            type="button"
            @click="triggerMultiMdUpload"
            class="px-2.5 py-1 bg-white hover:bg-gray-50 dark:bg-slate-850 dark:hover:bg-slate-750 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-slate-700 rounded-lg cursor-pointer transition-colors"
          >
            Procurar Arquivos
          </button>
          <input
            ref="multiFileInputRef"
            type="file"
            multiple
            accept=".md"
            @change="handleMultiMdUpload"
            class="hidden"
          />
        </div>

        <div v-if="lessonsList.length === 0" class="py-6 text-center text-xs text-gray-400 dark:text-slate-500 italic">
          Nenhuma lição adicionada à matriz ainda.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(less, idx) in lessonsList"
            :key="less.tempId"
            :class="[
              'p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer',
              selectedLessonId === less.tempId 
                ? 'bg-blue-50/50 dark:bg-slate-800/65 border-blue-300 dark:border-blue-900/60' 
                : 'bg-white dark:bg-slate-950/40 border-transparent dark:border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/40'
            ]"
            @click="selectedLessonId = less.tempId"
          >
            <div class="flex items-center gap-2 truncate pr-1">
              <span class="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-405 font-bold flex items-center justify-center shrink-0">
                {{ idx + 1 }}
              </span>
              <p 
                :class="[
                  'text-xs font-bold truncate',
                  selectedLessonId === less.tempId 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : 'text-slate-800 dark:text-slate-200'
                ]"
              >{{ less.title }}</p>
            </div>

            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <button
                type="button"
                :disabled="idx === 0"
                @click="handleMoveLesson(idx, 'up')"
                class="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                :disabled="idx === lessonsList.length - 1"
                @click="handleMoveLesson(idx, 'down')"
                class="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="handleRemoveLesson(less.tempId)"
                class="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main workspace: Markdown Editor, previewing, and quizzes builder -->
      <div id="instructor-shield" class="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 min-h-[400px]">
        <div v-if="!activeLessonObject" class="py-12 text-center text-xs text-gray-400 dark:text-slate-500 italic">
          <FileText class="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
          Selecione uma lição existente ou adicione uma nova coluna ao menu à esquerda para iniciar o editor avançado.
        </div>
        <div v-else class="space-y-4">
          
          <!-- Workspace panel tab selection -->
          <div class="flex justify-between items-center border-b border-gray-150 dark:border-slate-800 pb-2">
            <div class="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg select-none border border-transparent dark:border-slate-800">
              <button
                type="button"
                @click="activeLessonTab = 'edit'"
                :class="[
                  'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer',
                  activeLessonTab === 'edit' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                ]"
              >
                📝 Editor e Texto
              </button>
              <button
                type="button"
                @click="activeLessonTab = 'preview'"
                :class="[
                  'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer',
                  activeLessonTab === 'preview' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                ]"
              >
                👁️ Pré-visualização Real
              </button>
              <button
                type="button"
                @click="activeLessonTab = 'quiz'"
                :class="[
                  'px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer',
                  activeLessonTab === 'quiz' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                ]"
              >
                ✔️ Quiz de Fixação ({{ activeLessonObject.quiz.length }})
              </button>
            </div>

            <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/45 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-transparent dark:border-indigo-900/50">
              Rascunho Ativo
            </span>
          </div>

          <!-- TAB 1: Advanced Editor with helper syntax shortcuts -->
          <div v-if="activeLessonTab === 'edit'" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Título da Lição *</label>
                <input
                  type="text"
                  required
                  v-model="activeLessonObject.title"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
              <div class="animate-fadeIn">
                <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <span>Vídeo do YouTube</span>
                    <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-1.5 py-0.25 rounded uppercase tracking-wider">Opcional</span>
                  </span>
                  <span v-if="requireVideo" class="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-1.5 py-0.25 rounded-md flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Obrigatório para concluir aula
                  </span>
                  <span v-else class="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-705 px-1.5 py-0.25 rounded-md">
                    Complementar (informativo)
                  </span>
                </label>
                <input
                  type="text"
                  v-model="activeLessonObject.videoUrl"
                  placeholder="Ex: https://www.youtube.com/watch?v=Fw0S1ZPr6pE"
                  class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-205 dark:border-slate-800 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <p class="text-[10px] leading-tight text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Suporta links de vídeo inteiros ou IDs simples (Ex: <span class="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Fw0S1ZPr6pE</span>).
                </p>
              </div>
            </div>

            <!-- Quick syntax shortcuts toolbar -->
            <div class="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-955 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mr-1">Markup:</span>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('bold')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Negrito"
              >
                <Bold class="w-3 h-3" /> Bold
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('italic')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Itálico"
              >
                <Italic class="w-3 h-3" /> Italic
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('heading')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Subtítulo"
              >
                <Heading3 class="w-3 h-3" /> H3
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('list')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Marcadores"
              >
                <List class="w-3 h-3" /> Lista
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('dialogue')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Montar Diálogo"
              >
                <MessageSquare class="w-3 h-3" /> Diálogo
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('table')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Criar Lista Glossária"
              >
                <Table class="w-3 h-3" /> Glossário
              </button>
              <button
                type="button"
                @click="handleInsertMarkdownSyntax('alert')"
                class="p-1 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors flex items-center gap-1"
                title="Adicionar Nota / Dica"
              >
                <Lightbulb class="w-3 h-3 text-amber-500" /> Dica Box
              </button>
            </div>

            <!-- Content Editor Textarea -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Conteúdo da Lição (Suporta Tabelas, Gráficos e Box) *</label>
              <textarea
                :id="`textarea-markdown-editor-${activeLessonObject.tempId}`"
                rows="14"
                required
                v-model="activeLessonObject.content"
                placeholder="Escreva as tabelas de vocubulário, regras gramaticais e exemplos de conversações utilizando as regras de injeção acima..."
                class="w-full text-xs sm:text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3.5 focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <!-- TAB 2: Live Preview -->
          <div v-if="activeLessonTab === 'preview'" class="space-y-4">
            <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-indigo-100/40 dark:border-indigo-950/80 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              📍 <strong>Visão de Consumo Prático:</strong> É exatamente dessa maneira que os estudantes visualizarão o material em seus respectivos celulares ou computadores. Revise o layout!
            </div>

            <div class="border border-slate-150 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-950">
              <MarkdownRenderer :content="activeLessonObject.content" />
            </div>
          </div>

          <!-- TAB 3: Quiz Builder -->
          <div v-if="activeLessonTab === 'quiz'" class="space-y-6">
            <div class="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-850 space-y-4">
              <p class="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-left">Adicionar Questão de Múltipla Escolha</p>
              
              <div class="space-y-3 text-left">
                <div>
                  <label class="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1">Enunciado da Pergunta *</label>
                  <input
                    type="text"
                    v-model="newQuestionText"
                    placeholder="Ex: Qual a tradução mais aceitável de 'How are you doing?' no cotidiano?"
                    class="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa A (Opção 1) *</label>
                    <input
                      type="text"
                      v-model="newOption1"
                      placeholder="Ex: Como vai você?"
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa B (Opção 2) *</label>
                    <input
                      type="text"
                      v-model="newOption2"
                      placeholder="Ex: O que você faz diariamente?"
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa C (Opção 3)</label>
                    <input
                      type="text"
                      v-model="newOption3"
                      placeholder="Ex: O que você está vestindo?"
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Alternativa D (Opção 4)</label>
                    <input
                      type="text"
                      v-model="newOption4"
                      placeholder="Ex: Onde fica seu trabalho?"
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Qual a opção correta? *</label>
                    <select
                      v-model="newCorrectIndex"
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option :value="0">Alternativa A (Opção 1)</option>
                      <option :value="1">Alternativa B (Opção 2)</option>
                      <option :value="2">Alternativa C (Opção 3)</option>
                      <option :value="3">Alternativa D (Opção 4)</option>
                    </select>
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Explicação Curta (Feedback Didático)</label>
                    <input
                      type="text"
                      v-model="newExplanation"
                      placeholder="Ex: A expressão 'How are you doing?' é equivalente a 'como vai você?' ou 'tudo bem?'..."
                      class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div class="flex justify-end pt-1">
                  <button
                    type="button"
                    @click="handleAddQuizQuestion(activeLessonObject.tempId)"
                    class="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle class="w-4 h-4" /> Registrar Questão no Rascunho
                  </button>
                </div>
              </div>
            </div>

            <!-- List of configured quiz questions for the active lesson draft -->
            <div class="space-y-4 text-left">
              <p class="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Questões registradas no rascunho</p>
              <div v-if="activeLessonObject.quiz.length === 0" class="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                Nenhuma questão registrada para esta aula. Adicione pelo menos uma para o progresso do estudante.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="(q, qIdx) in activeLessonObject.quiz"
                  :key="qIdx"
                  class="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2 relative"
                >
                  <button
                    type="button"
                    @click="handleRemoveQuizQuestion(activeLessonObject.tempId, qIdx)"
                    class="absolute top-3 right-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded transition-all cursor-pointer"
                    title="Apagar Pergunta"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>

                  <p class="font-extrabold text-xs text-slate-800 dark:text-slate-205 pr-8">
                    Q{{ qIdx + 1 }}: {{ q.question }}
                  </p>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div
                      v-for="(opt, optIdx) in q.options"
                      :key="optIdx"
                      :class="[
                        'p-2 rounded text-[11px] font-medium text-left',
                        q.correctAnswer === optIdx 
                          ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-405 font-bold border border-emerald-100 dark:border-emerald-900/50' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                      ]"
                    >
                      {{ String.fromCharCode(65 + optIdx) }}) {{ opt }}
                      <span v-if="q.correctAnswer === optIdx" class="ml-1 text-[9px] uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-405 px-1.5 py-0.5 rounded-sm font-bold border border-emerald-200 dark:border-emerald-900/40">Correta</span>
                    </div>
                  </div>

                  <p v-if="q.explanation" class="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1">
                    <strong>Feedback técnico:</strong> {{ q.explanation }}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>

    <!-- Submit manual course block -->
    <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left shadow-2xs">
      <div>
        <h4 class="font-extrabold text-sm text-slate-900 dark:text-white">Passo 3: Publicação dos Dados</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Certifique-se de que a estrutura esteja impecável antes de submeter ao banco.</p>
      </div>

      <div class="flex items-center gap-3">
        <p v-if="isGenerating" class="text-xs text-blue-600 dark:text-blue-400 font-bold animate-pulse">Sincronizando com a base...</p>
        <button
          type="button"
          :disabled="isGenerating || lessonsList.length === 0"
          @click="handleCreateCourseManual"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl hover:shadow-md transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check class="w-4 h-4" />
          Publicar Curso Voluntário
        </button>
      </div>
    </div>

    <!-- Floating Admin Notification Trays -->
    <Teleport to="body">
      <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <TransitionGroup
          enter-active-class="transform transition duration-300 ease-out"
          enter-from-class="translate-y-4 opacity-0 scale-95"
          enter-to-class="translate-y-0 opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <!-- Error floating block -->
          <div 
            v-if="generationError" 
            key="gen-error"
            class="pointer-events-auto bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/80 rounded-2xl p-4.5 shadow-2xl flex items-start gap-3.5 text-left relative overflow-hidden animate-fadeIn"
            style="border-left: 5px solid #ef4444;"
          >
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-rose-500"></div>
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div class="flex-grow pr-4">
              <p class="font-bold text-xs text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-1">Ajuste Necessário</p>
              <p class="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{{ generationError }}</p>
            </div>
            <button 
              type="button" 
              @click="generationError = null" 
              class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-1 shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Import Success floating block -->
          <div 
            v-if="importSuccess" 
            key="import-success"
            class="pointer-events-auto bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-950/80 rounded-2xl p-4.5 shadow-2xl flex items-start gap-3.5 text-left relative overflow-hidden animate-fadeIn"
            style="border-left: 5px solid #3b82f6;"
          >
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-blue-500"></div>
            <Info class="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
            <div class="flex-grow pr-4">
              <p class="font-bold text-xs text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Mini-Curso Carregado!</p>
              <p class="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold mb-2">
                O curso e suas lições foram importados com sucesso para edição no formulário abaixo.
              </p>
              <p class="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 leading-tight">
                ⚠️ O salvamento definitivo requer postar o curso no botão de publicação abaixo.
              </p>
            </div>
            <button 
              type="button" 
              @click="importSuccess = false" 
              class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-1 shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Generation Success floating block -->
          <div 
            v-if="generationSuccess" 
            key="gen-success"
            class="pointer-events-auto bg-white dark:bg-slate-900 border border-emerald-250/50 dark:border-emerald-950/80 rounded-2xl p-4.5 shadow-2xl flex items-start gap-3.5 text-left relative overflow-hidden animate-fadeIn"
            style="border-left: 5px solid #10b981;"
          >
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500"></div>
            <CheckCircle class="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <div class="flex-grow pr-4">
              <p class="font-bold text-xs text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">Sucesso Absoluto!</p>
              <p class="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">O mini-curso voluntário foi registrado e catalogado no banco de dados com segurança. Os alunos já podem acessá-lo.</p>
            </div>
            <button 
              type="button" 
              @click="generationSuccess = false" 
              class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-1 shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>
