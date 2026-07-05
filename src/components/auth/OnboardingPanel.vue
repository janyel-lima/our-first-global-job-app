<script setup lang="ts">
import { ref } from "vue";
import { Scale, FileText } from "lucide-vue-next";
import { UserProfile } from "../../types";
import { useI18n } from "../../composables/useI18n";

defineProps<{
  onboardName: string;
  onboardRole: "student" | "instructor";
  onboardLevel: UserProfile["level"];
  onboardCode: string;
}>();

defineEmits<{
  (e: "update:onboardName", val: string): void;
  (e: "update:onboardRole", val: "student" | "instructor"): void;
  (e: "update:onboardLevel", val: UserProfile["level"]): void;
  (e: "update:onboardCode", val: string): void;
  (e: "submit"): void;
}>();

const { locale } = useI18n();
const lgpdAccepted = ref(false);
const showLgpdModalInOnboard = ref(false);
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
    <form 
      id="form-onboarding"
      @submit.prevent="$emit('submit')" 
      class="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6 text-left animate-fadeIn transition-colors duration-200"
    >
      <div class="text-center space-y-2">
        <h2 class="text-xl font-extrabold text-gray-950 dark:text-white leading-tight">
          {{ locale === 'pt' ? 'Boas-vindas ao English Volunteer!' : 'Welcome to English Volunteer!' }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-slate-400">
          {{ locale === 'pt' ? 'Diga-nos brevemente qual o seu foco para personalizarmos os mini-cursos.' : 'Tell us briefly what your focus is so we can customize the mini-courses.' }}
        </p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {{ locale === 'pt' ? 'Seu Nome de Exibição' : 'Your Display Name' }}
          </label>
          <input
            id="input-onboard-name"
            type="text"
            required
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-750 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-slate-50"
            :value="onboardName"
            @input="$emit('update:onboardName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {{ locale === 'pt' ? 'Qual seu perfil? *' : 'What is your profile? *' }}
            </label>
            <select
              id="select-onboard-role"
              :value="onboardRole"
              @change="$emit('update:onboardRole', ($event.target as HTMLSelectElement).value as 'student' | 'instructor')"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
              <option value="student" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'Estudante (Student)' : 'Student (Estudante)' }}
              </option>
              <option value="instructor" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'Instrutor (Teacher)' : 'Teacher / Volunteer (Instrutor)' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {{ locale === 'pt' ? 'Seu nível de inglês *' : 'Your English level *' }}
            </label>
            <select
              id="select-onboard-level"
              :value="onboardLevel"
              @change="$emit('update:onboardLevel', ($event.target as HTMLSelectElement).value as UserProfile['level'])"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
              <option value="Beginner" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'A1-A2: Iniciante (Beginner)' : 'A1-A2: Beginner' }}
              </option>
              <option value="Intermediate" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'B1-B2: Intermediário (Intermediate)' : 'B1-B2: Intermediate' }}
              </option>
              <option value="Advanced" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'C1-C2: Avançado (Advanced)' : 'C1-C2: Advanced' }}
              </option>
              <option value="All" class="dark:bg-slate-900">
                {{ locale === 'pt' ? 'Acesso Geral (All)' : 'General Access (All)' }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="onboardRole === 'instructor'" class="space-y-1.5 animate-fadeIn">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">
            {{ locale === 'pt' ? 'Código de Segurança do Instrutor (Teacher Code)' : 'Instructor Security Code (Teacher Code)' }}
          </label>
          <input
            id="input-onboard-code"
            type="text"
            required
            placeholder="Ex: TEACH-XXXX-XXXX"
            class="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-755 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl p-3 uppercase font-extrabold text-blue-600"
            :value="onboardCode"
            @input="$emit('update:onboardCode', ($event.target as HTMLInputElement).value)"
          />
          <p class="text-[10px] text-gray-400 dark:text-slate-400 font-medium leading-relaxed">
            {{ locale === 'pt' 
              ? 'Professores e voluntários precisam desse token fornecido pelo administrador voluntário para evitar spam ou intrusões na grade de aulas cadastrada.' 
              : 'Teachers and volunteers need this token provided by the volunteer administrator to prevent spam or intrusions into the registered class schedule.' 
            }}
          </p>
        </div>
        <!-- Consent Block for Registration / Google Registrations -->
        <div class="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-left mb-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <FileText class="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div class="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
              <span class="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                {{ locale === 'pt' ? 'LGPD, Termos de Voluntariado & Privacidade v1.0' : 'LGPD, Terms of Volunteering & Privacy v1.0' }}
              </span>
              {{ locale === 'pt'
                ? 'Para prosseguir com o seu cadastro (incluindo via Google), é obrigatório ler e dar consentimento expresso de processamento para fins pedagógicos.'
                : 'To proceed with your registration (including via Google), it is mandatory to read and give express consent for processing for pedagogical purposes.'
              }}
            </div>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              @click="showLgpdModalInOnboard = true" 
              class="text-[10px] font-black hover:underline cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
            >
              <Scale class="w-3.5 h-3.5" />
              {{ locale === 'pt' ? 'Ver termos completos na íntegra' : 'View full terms in their entirety' }}
            </button>
          </div>
        </div>

        <div class="flex items-start gap-2.5 select-none bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <input 
            id="chk-onboard-lgpd"
            type="checkbox"
            v-model="lgpdAccepted"
            class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer shrink-0"
          />
          <label for="chk-onboard-lgpd" class="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed cursor-pointer">
            {{ locale === 'pt'
              ? 'Declaro que li e aceito as condições dos Termos de Voluntariado Pedagógico e concordo com as normas de privacidade descritas em acordo com a LGPD. *'
              : 'I declare that I have read and accept the conditions of the Pedagogical Volunteer Terms and agree to the privacy rules described in accordance with the LGPD. *'
            }}
          </label>
        </div>
      </div>

      <button
        id="btn-submit-onboarding"
        type="submit"
        :disabled="!lgpdAccepted"
        class="w-full py-3.5 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        style="background-color: var(--primary-color) !important; color: #ffffff !important;"
      >
        {{ locale === 'pt' ? 'Prosseguir e Começar Estudos →' : 'Proceed and Start Studies →' }}
      </button>

      <div class="pt-2 text-center select-none text-[10px] text-slate-400 leading-normal">
        {{ locale === 'pt'
          ? 'Ao continuar, você concorda com os termos de auxílio colaborativos e sem fins lucrativos da comunidade English Volunteer.'
          : 'By continuing, you agree to the collaborative and non-profit support terms of the English Volunteer community.'
        }}
      </div>
    </form>

    <!-- LGPD Full Policy Modal Dialog in Onboarding -->
    <Teleport to="body">
      <div 
        v-if="showLgpdModalInOnboard" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 text-left"
      >
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-scaleUp shadow-2xl">
          <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 leading-none">
                <Scale class="w-6 h-6 text-blue-600" />
                {{ locale === 'pt' ? 'Termos de Uso e Política LGPD (Cadastro Google)' : 'Terms of Use & LGPD Policy (Google Sign-up)' }}
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">
                {{ locale === 'pt' ? 'Regulamento Geral de Voluntariado Educativo' : 'General Regulations for Educational Volunteering' }}
              </p>
            </div>
            <button 
              type="button"
              @click="showLgpdModalInOnboard = false"
              class="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-black leading-none p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4 overflow-y-auto max-h-[50vh] pr-4 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 font-medium">
            <p class="font-bold text-slate-900 dark:text-white text-sm sm:text-base border-l-4 pl-3 py-1 border-blue-600">
              {{ locale === 'pt'
                ? 'Este regulamento dita as diretrizes de tratamento de dados pessoais no English Volunteer, em conformidade com o marco civil da internet e a Lei Geral de Proteção de Dados (LGPD - LEI Nº 13.709/2018):'
                : 'This regulation dictates the guidelines for processing personal data on English Volunteer, in compliance with the Internet Civil Framework and the General Data Protection Law (LGPD - LAW No. 13,709/2018):'
              }}
            </p>
            
            <div class="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
              <div class="space-y-1.5">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ locale === 'pt' ? '1. Finalidade do Consentimento' : '1. Purpose of Consent' }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ locale === 'pt'
                    ? 'Ao se registrar como estudante ou professor colaborador, seus dados pessoais serão utilizados exclusivamente para gerenciar as rotinas das turmas de inglês gratuitas, calcular os índices de quizzes respondidos, facilitar as salas de chats tutoradas e emitir seus respectivos certificados. Não fazemos captação indireta de comportamento.'
                    : 'By registering as a student or collaborating teacher, your personal data will be used exclusively to manage the schedules of free English classes, calculate quiz response rates, facilitate mentored chat rooms, and issue their respective certificates. We do not perform indirect tracking of behavior.'
                  }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ locale === 'pt' ? '2. Princípio da Minimização' : '2. Principle of Minimization' }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ locale === 'pt'
                    ? 'Coletamos apenas as peças mínimas fundamentais de identificação: Nome Completo (para fins de confeecção e segurança jurídica do certificado), Endereço de E-mail (chave de login única de autenticação), Nível Teórico de inglês e dados essenciais de andamento pedagógico (como presenças marcadas).'
                    : 'We collect only the minimum fundamental items of identification: Full Name (for the purposes of certificate creation and legal security), Email Address (unique login authentication key), English Level, and essential pedagogical progress data (such as recorded attendance).'
                  }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ locale === 'pt' ? '3. Não-Compartilhamento Comercial' : '3. No Commercial Sharing' }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ locale === 'pt'
                    ? 'Com respeito à integridade dos voluntários, absolutamente nenhum contato ou informação é partilhada com empresas ou entidades do terceiro setor. Nosso banco de dados é restrito, estruturado em ambiente de nuvem seguro.'
                    : 'With respect to the integrity of our volunteers, absolutely no contact or information is shared with companies or third-sector entities. Our database is private, structured in a secure cloud environment.'
                  }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ locale === 'pt' ? '4. Direito de Revogação e Exclusão' : '4. Right of Revocation and Deletion' }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ locale === 'pt'
                    ? 'Em obediência ao Artigo 18 da LGPD, o voluntário poderá a qualquer momento exigir do English Volunteer o livre acesso e a total destruição de seus dados pessoais. Seus dados cadastrais serão deletados de forma definitiva e irreversível em até 72 horas úteis. Salvaguarda Acadêmica: Visando não romper o progresso pedagógico e certificação de estudantes matriculados, quaisquer matérias didáticas ou minicursos criados pelo voluntário permanecerão sob custódia anônima do sistema/administração.'
                    : 'In compliance with Article 18 of the LGPD, the volunteer may at any time demand free access and complete deletion of their personal data from English Volunteer. Your registration data will be permanently and irreversibly deleted within 72 business hours. Academic Safeguard: In order to not disrupt the pedagogical progress and certification of enrolled students, any teaching materials or mini-courses created by the volunteer will remain under anonymous custody of the system/administration.'
                  }}
                </p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {{ locale === 'pt' ? '5. Relação Não-Trabalhista' : '5. Non-Employment Relationship' }}
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">
                  {{ locale === 'pt'
                    ? 'Em acordo com a Lei de Voluntariado nacional, declaramos que a presente atividade ofertada por mentores e usufruída pelos alunos não estabelece qualquer liame de natureza trabalhista ou expectativa de remuneração pecuniária direta ou indireta.'
                    : 'In accordance with the national Volunteer Law, we declare that the present activity offered by mentors and enjoyed by students does not establish any employment relationship or expectation of direct or indirect pecuniary remuneration.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              type="button"
              @click="showLgpdModalInOnboard = false; lgpdAccepted = true"
              class="px-6 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl transition-all duration-150 cursor-pointer shadow-md inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98"
            >
              {{ locale === 'pt' ? 'Entendido e Concordo' : 'Understood and I Agree' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
