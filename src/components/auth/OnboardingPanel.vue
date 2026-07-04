<script setup lang="ts">
import { ref } from "vue";
import { Scale, FileText } from "lucide-vue-next";
import { UserProfile } from "../../types";

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
        <h2 class="text-xl font-extrabold text-gray-950 dark:text-white leading-tight">Boas-vindas ao English Volunteer!</h2>
        <p class="text-xs text-gray-500 dark:text-slate-400">Diga-nos brevemente qual o seu foco para personalizarmos os mini-cursos.</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Seu Nome de Exibição</label>
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
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Qual seu perfil? *</label>
            <select
              id="select-onboard-role"
              :value="onboardRole"
              @change="$emit('update:onboardRole', ($event.target as HTMLSelectElement).value as 'student' | 'instructor')"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
              <option value="student" class="dark:bg-slate-900">Estudante (Student)</option>
              <option value="instructor" class="dark:bg-slate-900">Instrutor (Teacher)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Seu nível de inglês *</label>
            <select
              id="select-onboard-level"
              :value="onboardLevel"
              @change="$emit('update:onboardLevel', ($event.target as HTMLSelectElement).value as UserProfile['level'])"
              class="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm border border-gray-250 dark:border-slate-700 rounded-xl p-3 cursor-pointer text-gray-700 dark:text-slate-200 font-bold"
            >
              <option value="Beginner" class="dark:bg-slate-900">A1-A2: Beginner</option>
              <option value="Intermediate" class="dark:bg-slate-900">B1-B2: Intermediate</option>
              <option value="Advanced" class="dark:bg-slate-900">C1-C2: Advanced</option>
              <option value="All" class="dark:bg-slate-900">Acesso Geral (All)</option>
            </select>
          </div>
        </div>

        <div v-if="onboardRole === 'instructor'" class="space-y-1.5 animate-fadeIn">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-350 mb-1">Código de Segurança do Instrutor (Teacher Code)</label>
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
            Professores e voluntários precisam desse token fornecido pelo administrador voluntário para evitar spam ou intrusões na grade de aulas cadastrada.
          </p>
        </div>
        <!-- Consent Block for Registration / Google Registrations -->
        <div class="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-left mb-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <FileText class="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div class="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
              <span class="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">LGPD, Termos de Voluntariado & Privacidade v1.0</span>
              Para prosseguir com o seu cadastro (incluindo via Google), é obrigatório ler e dar consentimento expresso de processamento para fins pedagógicos.
            </div>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              @click="showLgpdModalInOnboard = true" 
              class="text-[10px] font-black hover:underline cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
            >
              <Scale class="w-3.5 h-3.5" />
              Ver termos completos na íntegra
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
            Declaro que li e aceito as condições dos Termos de Voluntariado Pedagógico e concordo com as normas de privacidade descritas em acordo com a LGPD. *
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
        Prosseguir e Começar Estudos →
      </button>

      <div class="pt-2 text-center select-none text-[10px] text-slate-400 leading-normal">
        Ao continuar, você concorda com os termos de auxílio colaborativos e sem fins lucrativos da comunidade English Volunteer.
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
                Termos de Uso e Política LGPD (Cadastro Google)
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">Regulamento Geral de Voluntariado Educativo</p>
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
              Este regulamento dita as diretrizes de tratamento de dados pessoais no English Volunteer, em conformidade com o marco civil da internet e a Lei Geral de Proteção de Dados (LGPD - LEI Nº 13.709/2018):
            </p>
            
            <div class="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 space-y-2.5">
              <div class="space-y-1.5">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  1. Finalidade do Consentimento
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Ao se registrar como estudante ou professor colaborador, seus dados pessoais serão utilizados exclusivamente para gerenciar as rotinas das turmas de inglês gratuitas, calcular os índices de quizzes respondidos, facilitar as salas de chats tutoradas e emitir seus respectivos certificados. Não fazemos captação indireta de comportamento.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  2. Princípio da Minimização
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Coletamos apenas as peças mínimas fundamentais de identificação: Nome Completo (para fins de confeecção e segurança jurídica do certificado), Endereço de E-mail (chave de login única de autenticação), Nível Teórico de inglês e dados essenciais de andamento pedagógico (como presenças marcadas).</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  3. Não-Compartilhamento Comercial
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Com respeito à integridade dos voluntários, absolutamente nenhum contato ou informação é partilhada com empresas ou entidades do terceiro setor. Nosso banco de dados é restrito, estruturado em ambiente de nuvem seguro.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  4. Direito de Revogação e Exclusão
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Em obediência ao Artigo 18 da LGPD, o voluntário poderá a qualquer momento exigir do English Volunteer o livre acesso e a total destruição de seus dados pessoais. Seus dados cadastrais serão deletados de forma definitiva e irreversível em até 72 horas úteis. <strong>Salvaguarda Acadêmica:</strong> Visando não romper o progresso pedagógico e certificação de estudantes matriculados, quaisquer matérias didáticas ou minicursos criados pelo voluntário permanecerão sob custódia anônima do sistema/administração.</p>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850/40">
                <h4 class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  5. Relação Não-Trabalhista
                </h4>
                <p class="pl-3.5 text-slate-600 dark:text-slate-400">Em acordo com a Lei de Voluntariado nacional, declaramos que a presente atividade ofertada por mentores e usufruída pelos alunos não estabelece qualquer liame de natureza trabalhista ou expectativa de remuneração pecuniária direta ou indireta.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              type="button"
              @click="showLgpdModalInOnboard = false; lgpdAccepted = true"
              class="px-6 py-2.5 text-xs sm:text-sm font-black text-white rounded-xl transition-all duration-150 cursor-pointer shadow-md inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98"
            >
              Entendido e Concordo
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
