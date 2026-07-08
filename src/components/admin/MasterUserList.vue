<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Plus, 
  Download, 
  XOctagon, 
  Mail, 
  Search,
  Info,
  Key,
  Copy,
  Trash2,
  Lock,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { UserProfile } from '../../types';
import { db, auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { showToast, useAppState } from '../../composables/useAppState';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
  users: UserProfile[];
  currentUserId: string;
  isDemoUser?: boolean;
  primaryColor?: string;
}>();

const emit = defineEmits<{
  (e: 'update-user-role', uid: string, isInstructor: boolean): void;
  (e: 'delete-user-completely', uid: string): void;
}>();

const { isDarkMode, allUsers } = useAppState();
const { t, locale } = useI18n();

const searchQuery = ref('');

// Filter state for search table: 'all' | 'teachers' | 'students'
const selectedRoleFilter = ref<'all' | 'teachers' | 'students'>('all');

// Edit User Profiles State for Admin
const uToEdit = ref<UserProfile | null>(null);
const editUserName = ref("");
const editUserLevel = ref<UserProfile['level']>("Beginner");
const editUserBio = ref("");
const editUserRole = ref<"student" | "instructor">("student");
const editUserEmail = ref("");

const teachers = computed(() => props.users.filter(u => u && u.isInstructor && u.uid && u.uid !== 'undefined' && u.uid !== 'null' && u.uid !== 'uid'));

const filteredUsers = computed(() => {
  return props.users.filter(u => {
    if (!u || !u.uid) return false;
    const uidStr = String(u.uid).trim();
    if (uidStr === "" || uidStr === "undefined" || uidStr === "null" || uidStr === "uid") {
      return false;
    }
    if (u.displayName === (locale.value === 'pt' ? "Usuário Sem Nome" : "Anonymous User") && !u.email && !u.bio) {
      return false;
    }

    // Role matching
    if (selectedRoleFilter.value === 'teachers' && !u.isInstructor) return false;
    if (selectedRoleFilter.value === 'students' && u.isInstructor) return false;
    
    // Text matching
    const queryStr = searchQuery.value.toLowerCase();
    const nameStr = u.displayName || u.email || u.uid || '';
    const matchName = nameStr.toLowerCase().includes(queryStr);
    const matchUid = u.uid ? u.uid.toLowerCase().includes(queryStr) : false;
    const matchEmail = u.email ? u.email.toLowerCase().includes(queryStr) : false;
    
    return matchName || matchUid || matchEmail;
  });
});

const usersPage = ref(1);
const usersPerPage = ref(8);

watch([searchQuery, selectedRoleFilter], () => {
  usersPage.value = 1;
});

const totalUsersPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / usersPerPage.value) || 1;
});

const paginatedUsers = computed(() => {
  const start = (usersPage.value - 1) * usersPerPage.value;
  const end = start + usersPerPage.value;
  return filteredUsers.value.slice(start, end);
});

const handleRevokeTeacher = (teacher: { uid: string; displayName: string }) => {
  emit('update-user-role', teacher.uid, false);
};

const startEditUser = (user: UserProfile) => {
  uToEdit.value = user;
  editUserName.value = user.displayName || "";
  editUserLevel.value = user.level || "Beginner";
  editUserBio.value = user.bio || "";
  editUserRole.value = user.isInstructor ? "instructor" : "student";
  editUserEmail.value = user.email || "";
};

const handleSaveUserFromAdmin = async () => {
  if (!uToEdit.value) return;
  try {
    const isInst = editUserRole.value === "instructor";
    const targetRef = doc(db, "users", uToEdit.value.uid);
    const updatedProfile: UserProfile = {
      ...uToEdit.value,
      displayName: editUserName.value.trim(),
      level: editUserLevel.value,
      bio: editUserBio.value.trim(),
      email: editUserEmail.value.trim(),
      isInstructor: isInst
    };
    
    if (db) {
      await setDoc(targetRef, updatedProfile, { merge: true });
    }
    
    // Update the shared state so UI reacts immediately
    const foundIdx = allUsers.value.findIndex(x => x.uid === uToEdit.value?.uid);
    if (foundIdx !== -1) {
      allUsers.value[foundIdx] = {
        ...allUsers.value[foundIdx],
        displayName: editUserName.value.trim(),
        level: editUserLevel.value,
        bio: editUserBio.value.trim(),
        email: editUserEmail.value.trim(),
        isInstructor: isInst
      };
    }
    
    showToast(locale.value === 'pt' ? "Dados do usuário alterados com sucesso no Firestore!" : "User data updated successfully in Firestore!", "success");
    uToEdit.value = null;
  } catch (err: any) {
    showToast((locale.value === 'pt' ? "Erro ao salvar atualização de usuário: " : "Error saving user update: ") + err.message, "error");
  }
};

const handleAdminResetPassword = async (userEmailStr?: string) => {
  const emailToUse = userEmailStr || editUserEmail.value.trim();
  if (!emailToUse) {
    showToast(locale.value === 'pt' ? "Este usuário não possui e-mail de acesso catalogado. Cadastre o e-mail no campo antes de disparar o reset correspondente." : "This user has no registered access email. Enter an email in the field before triggering the reset.", "warning");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, emailToUse);
    showToast(locale.value === 'pt' ? `E-mail enviado! O usuário receberá um link oficial do Firebase para cadastrar uma nova senha.` : `Email sent! The user will receive an official Firebase link to register a new password.`, "success");
  } catch (err: any) {
    showToast((locale.value === 'pt' ? "Falha ao redefinir: " : "Failed to reset: ") + err.message, "error");
  }
};

const handleAdminDeleteUser = () => {
  if (!uToEdit.value) return;
  const uidToDel = uToEdit.value.uid;
  emit('delete-user-completely', uidToDel);
  uToEdit.value = null;
};

// Excel Exporter
const exportTeachersXLSX = () => {
  const listToExport = filteredUsers.value;
  if (listToExport.length === 0) {
    showToast(locale.value === 'pt' ? "Nenhum usuário correspondente aos filtros para exportar!" : "No users matching the filters to export!", "warning");
    return;
  }

  const dataToExport = listToExport.map(t => {
    return {
      [locale.value === 'pt' ? "ID do Usuário" : "User ID"]: t.uid || "",
      [locale.value === 'pt' ? "Nome de Exibição" : "Display Name"]: t.displayName || t.email || (locale.value === 'pt' ? "Usuário Sem Nome" : "Anonymous User"),
      [locale.value === 'pt' ? "É Professor?" : "Is Teacher?"]: t.isInstructor ? (locale.value === 'pt' ? "Sim" : "Yes") : (locale.value === 'pt' ? "Não" : "No"),
      [locale.value === 'pt' ? "É Administrador?" : "Is Admin?"]: t.isAdmin ? (locale.value === 'pt' ? "Sim" : "Yes") : (locale.value === 'pt' ? "Não" : "No")
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, locale.value === 'pt' ? "Usuarios_English_Volunteer" : "Users_English_Volunteer");

  worksheet['!cols'] = Object.keys(dataToExport[0]).map(h => ({ wch: 20 }));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  const dateSuffix = new Date().toLocaleDateString(locale.value === 'pt' ? "pt-BR" : "en-US").replace(/\//g, "-");
  link.download = locale.value === 'pt' ? `Relatorio_Patrulha_Usuarios_${dateSuffix}.xlsx` : `User_Patrol_Report_${dateSuffix}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// JSON Exporter
const exportTeachersJSON = () => {
  const listToExport = filteredUsers.value;
  if (listToExport.length === 0) {
    showToast(locale.value === 'pt' ? "Nenhum usuário correspondente aos filtros para exportar!" : "No users matching the filters to export!", "warning");
    return;
  }

  const sanitizedList = listToExport.map(t => {
    return {
      uid: t.uid || "",
      displayName: t.displayName || t.email || (locale.value === 'pt' ? "Usuário Sem Nome" : "Anonymous User"),
      isInstructor: t.isInstructor || false,
      isAdmin: t.isAdmin || false
    };
  });

  const jsonContent = JSON.stringify(sanitizedList, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateSuffix = new Date().toLocaleDateString(locale.value === 'pt' ? "pt-BR" : "en-US").replace(/\//g, "-");
  link.download = locale.value === 'pt' ? `Relatorio_Usuarios_${dateSuffix}.json` : `Users_Report_${dateSuffix}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Teacher registration codes management
const teacherCodes = ref<any[]>([]);
const newCodeInput = ref('');
const codeLoading = ref(false);

const codeSearchQuery = ref('');
const codesPage = ref(1);
const codesPerPage = ref(5);

watch([codeSearchQuery], () => {
  codesPage.value = 1;
});

const filteredTeacherCodes = computed(() => {
  return teacherCodes.value.filter(item => {
    if (!codeSearchQuery.value) return true;
    const query = codeSearchQuery.value.trim().toLowerCase();
    const matchCode = item.code.toLowerCase().includes(query);
    const matchStatus = item.status.toLowerCase().includes(query);
    const matchDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale.value === 'pt' ? 'pt-BR' : 'en-US').includes(query) : false;
    return matchCode || matchStatus || matchDate;
  });
});

const totalCodesPages = computed(() => {
  return Math.ceil(filteredTeacherCodes.value.length / codesPerPage.value) || 1;
});

const paginatedTeacherCodes = computed(() => {
  const start = (codesPage.value - 1) * codesPerPage.value;
  const end = start + codesPerPage.value;
  return filteredTeacherCodes.value.slice(start, end);
});

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  newCodeInput.value = `EV-${rand}`;
};

let unsub: (() => void) | undefined;
onMounted(() => {
  if (props.isDemoUser) {
    teacherCodes.value = [
      { id: "EV-DEMO1", code: "EV-DEMO1", status: "valid", createdAt: new Date().toISOString(), usedBy: null, usedAt: null },
      { id: "EV-SUPER", code: "EV-SUPER", status: "valid", createdAt: new Date().toISOString(), usedBy: null, usedAt: null }
    ];
    return;
  }
  const codesRef = collection(db, "teacher_codes");
  unsub = onSnapshot(codesRef, (snap) => {
    const list: any[] = [];
    snap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    teacherCodes.value = list;
  }, (err) => {
    console.error("Erro ao escutar teacher_codes:", err);
  });
});

const handleCreateCode = async () => {
  const codeVal = newCodeInput.value.trim().toUpperCase();
  if (!codeVal) {
    showToast(locale.value === 'pt' ? "Por favor, digite ou gere um código válido." : "Please type or generate a valid code.", "warning");
    return;
  }
  
  codeLoading.value = true;
  try {
    const newCode = {
      code: codeVal,
      status: "valid",
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null
    };

    if (db) {
      await setDoc(doc(db, "teacher_codes", codeVal), newCode);
    }
    if (!teacherCodes.value.some(item => item.id === codeVal)) {
      teacherCodes.value = [{ id: codeVal, ...newCode }, ...teacherCodes.value];
    }

    newCodeInput.value = '';
    showToast(locale.value === 'pt' ? `Código de convite ${codeVal} ativado e pronto para uso!` : `Invitation code ${codeVal} activated and ready for use!`, "success");
  } catch (err) {
    console.error("Erro ao criar código de professor:", err);
    showToast(locale.value === 'pt' ? "Erro nas permissões. Verifique se você é Administrador Master." : "Permission error. Verify that you are a Master Administrator.", "error");
  } finally {
    codeLoading.value = false;
  }
};

const handleDeleteCode = async (id: string) => {
  const originalList = [...teacherCodes.value];
  teacherCodes.value = teacherCodes.value.filter(item => item.id !== id);

  try {
    if (db) {
      await deleteDoc(doc(db, "teacher_codes", id));
    }
    showToast(locale.value === 'pt' ? `Código ${id} foi revogado com sucesso.` : `Code ${id} was successfully revoked.`, "success");
  } catch (err) {
    console.error("Erro ao excluir código:", err);
    teacherCodes.value = originalList;
    showToast(locale.value === 'pt' ? "Erro ao excluir o código." : "Error deleting the code.", "error");
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast(locale.value === 'pt' ? `Código ${text} copiado com sucesso!` : `Code ${text} copied successfully!`, "success");
  }).catch(err => {
    console.error('Erro ao copiar código:', err);
    showToast(locale.value === 'pt' ? `Código do Tutor: ${text}` : `Tutor Code: ${text}`, "info", 10000);
  });
};
</script>

<template>
  <div>
    <!-- Grid for Monitoring & Invitation Codes -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Main User Monitoring & Account Editing panel -->
      <div class="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs text-left space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800 pb-4">
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block">
              {{ locale === 'pt' ? 'Painel Geral de Usuários e Monitoria' : 'General User & Monitoring Panel' }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ locale === 'pt' ? 'Inspecione voluntários registrados, altere níveis curriculares ou revogue acessos.' : 'Inspect registered volunteers, modify curriculum levels, or revoke access.' }}
            </p>
          </div>
          
          <div class="flex flex-wrap items-center gap-2 select-none">
            <button
              type="button"
              @click="exportTeachersXLSX"
              class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10.5px] font-black rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Download class="w-3.5 h-3.5" /> {{ locale === 'pt' ? 'Exportar Planilha (XLSX)' : 'Export Spreadsheet (XLSX)' }}
            </button>
            <button
              type="button"
              @click="exportTeachersJSON"
              class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-[10.5px] font-black rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Download class="w-3.5 h-3.5" /> {{ locale === 'pt' ? 'Exportar JSON' : 'Export JSON' }}
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-3 items-center justify-between select-none">
          <!-- Role filters (All / Teachers / Students) -->
          <div class="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
            <button
              type="button"
              @click="selectedRoleFilter = 'all'"
              :class="[
                'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
                selectedRoleFilter === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              {{ locale === 'pt' ? 'Todos' : 'All' }} ({{ users.length }})
            </button>
            <button
              type="button"
              @click="selectedRoleFilter = 'teachers'"
              :class="[
                'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
                selectedRoleFilter === 'teachers' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              {{ locale === 'pt' ? 'Professores' : 'Teachers' }} ({{ teachers.length }})
            </button>
            <button
              type="button"
              @click="selectedRoleFilter = 'students'"
              :class="[
                'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
                selectedRoleFilter === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              ]"
            >
              {{ locale === 'pt' ? 'Alunos' : 'Students' }} ({{ users.length - teachers.length }})
            </button>
          </div>

          <div class="relative w-full md:max-w-xs">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search class="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              :placeholder="locale === 'pt' ? 'Buscar por nome, e-mail ou UID...' : 'Search by name, email or UID...'"
              v-model="searchQuery"
              class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-205 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <!-- Empty list feedback -->
        <div v-if="filteredUsers.length === 0" class="py-12 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center text-xs text-gray-400 dark:text-slate-500 italic">
          {{ locale === 'pt' ? 'Nenhum cadastro coincide com a pesquisa de patrulha.' : 'No registrations match the query.' }}
        </div>

        <!-- Table of Users -->
        <div v-else class="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-slate-850 bg-white dark:bg-slate-900">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-850 text-slate-450 font-extrabold uppercase tracking-wider text-[10px]">
                <th class="p-4">{{ locale === 'pt' ? 'Voluntário' : 'Volunteer' }}</th>
                <th class="p-4">{{ locale === 'pt' ? 'Nível Cadastrado' : 'Registered Level' }}</th>
                <th class="p-4">{{ locale === 'pt' ? 'Cargo / Nível de Acesso' : 'Role / Access Level' }}</th>
                <th class="p-4 text-right">{{ locale === 'pt' ? 'Ação Corretiva' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-850">
              <tr v-for="user in paginatedUsers" :key="user.uid" class="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition">
                <td class="p-4 flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center border border-slate-200/50 dark:border-slate-700 shrink-0">
                    {{ (user.displayName || user.email || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div class="truncate">
                    <p class="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-tight">
                      {{ user.displayName || user.email || (locale === 'pt' ? 'Usuário Sem Nome' : 'Anonymous User') }}
                      <span v-if="user.isAdmin" class="inline-flex text-[8.5px] font-black bg-red-50 text-red-700 px-1.5 rounded-sm border border-red-100 dark:bg-red-950/30 dark:border-red-900">Admin</span>
                    </p>
                    <span class="block text-[10px] text-gray-405 dark:text-gray-500 font-mono mt-0.5 truncate max-w-xs">UID: {{ user.uid }}</span>
                  </div>
                </td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-850 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px] tracking-wider border border-transparent dark:border-slate-800">
                    {{ user.level || 'Beginner' }}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-1.5">
                    <span 
                      v-if="user.isInstructor" 
                      class="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-800 px-2 py-0.5 rounded"
                    >
                      🧑‍🏫 {{ locale === 'pt' ? 'Professor Voluntário' : 'Volunteer Teacher' }}
                    </span>
                    <span 
                      v-else 
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-850 border border-gray-150 dark:border-slate-800 px-2 py-0.5 rounded"
                    >
                      🎓 {{ locale === 'pt' ? 'Aluno Integrante' : 'Student Member' }}
                    </span>
                  </div>
                </td>
                <td class="p-4 text-right">
                  <button
                    type="button"
                    @click="startEditUser(user)"
                    class="px-2.5 py-1 text-[10.5px] font-black bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer select-none transition"
                  >
                    ✏️ {{ locale === 'pt' ? 'Detalhes' : 'Details' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Control for Users -->
          <div v-if="filteredUsers.length > 0" class="p-4 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between gap-4 flex-wrap text-xs font-semibold select-none text-slate-450 dark:text-slate-400">
            <span>
              <template v-if="locale === 'pt'">
                Mostrando <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredUsers.length, (usersPage - 1) * usersPerPage + 1) }}</strong> a 
                <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredUsers.length, usersPage * usersPerPage) }}</strong> de 
                <strong class="text-slate-900 dark:text-slate-200">{{ filteredUsers.length }}</strong> registros
              </template>
              <template v-else>
                Showing <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredUsers.length, (usersPage - 1) * usersPerPage + 1) }}</strong> to 
                <strong class="text-slate-900 dark:text-slate-200">{{ Math.min(filteredUsers.length, usersPage * usersPerPage) }}</strong> of 
                <strong class="text-slate-900 dark:text-slate-200">{{ filteredUsers.length }}</strong> records
              </template>
            </span>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                :disabled="usersPage === 1"
                @click="usersPage--"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]"
              >
                <ChevronLeft class="w-3.5 h-3.5" /> {{ locale === 'pt' ? 'Anterior' : 'Previous' }}
              </button>
              
              <span class="px-2 text-[11px]">
                {{ locale === 'pt' ? `Página ${usersPage} de ${totalUsersPages}` : `Page ${usersPage} of ${totalUsersPages}` }}
              </span>
              
              <button
                type="button"
                :disabled="usersPage === totalUsersPages"
                @click="usersPage++"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]"
              >
                {{ locale === 'pt' ? 'Próxima' : 'Next' }} <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Teacher invitation codes card -->
      <div class="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs text-left space-y-4">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
            <Key class="w-4.5 h-4.5 text-blue-600" />
            {{ locale === 'pt' ? 'Códigos de Convite (Tutor)' : 'Invitation Codes (Tutor)' }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ locale === 'pt' ? 'Gere ou remova códigos de credenciamento autônomo para instrutores parceiros.' : 'Generate or remove autonomous accreditation codes for partner instructors.' }}</p>
        </div>

        <!-- Add code form -->
        <div class="space-y-2 select-none">
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Ex: EV-AMANDA"
              v-model="newCodeInput"
              class="flex-grow text-xs uppercase bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-xl p-3 focus:outline-hidden text-gray-900 dark:text-white font-bold"
            />
            <button
              type="button"
              @click="generateRandomCode"
              class="px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
            >
              {{ locale === 'pt' ? 'Gerar' : 'Generate' }}
            </button>
          </div>
          <button
            type="button"
            :disabled="codeLoading"
            @click="handleCreateCode"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus class="w-4 h-4" /> {{ locale === 'pt' ? 'Ativar Código no Banco' : 'Activate Code in Database' }}
          </button>
        </div>

        <!-- List of codes -->
        <div class="space-y-2 border-t border-gray-50 dark:border-slate-800/80 pt-4">
          <!-- Search inside codes -->
          <div class="relative w-full">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search class="w-3 h-3" />
            </span>
            <input
              type="text"
              :placeholder="locale === 'pt' ? 'Filtrar códigos cadastrados...' : 'Filter registered codes...'"
              v-model="codeSearchQuery"
              class="w-full text-[10.5px] pl-8 bg-slate-50 dark:bg-slate-955 focus:bg-white border border-gray-205 dark:border-slate-850 rounded-lg p-2 focus:outline-hidden text-gray-900 dark:text-white"
            />
          </div>

          <div v-if="filteredTeacherCodes.length === 0" class="py-6 text-center text-[11px] text-gray-400 dark:text-slate-500 italic">
            {{ locale === 'pt' ? 'Nenhum código cadastrado coincide.' : 'No registered codes match.' }}
          </div>
          <div v-else class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="item in paginatedTeacherCodes"
              :key="item.id"
              class="p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between gap-2 text-xs"
            >
              <div class="truncate">
                <p class="font-extrabold text-slate-950 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                  {{ item.code }}
                  <span v-if="item.status === 'valid'" class="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.1 rounded font-black font-sans uppercase">{{ locale === 'pt' ? 'Válido' : 'Valid' }}</span>
                  <span v-else class="text-[8px] bg-gray-200 text-gray-600 px-1 py-0.1 rounded font-black font-sans uppercase">{{ locale === 'pt' ? 'Usado' : 'Used' }}</span>
                </p>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{{ locale === 'pt' ? 'Criado em:' : 'Created at:' }} {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US') : '-' }}</p>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click="copyToClipboard(item.code)"
                  class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  :title="locale === 'pt' ? 'Copiar código' : 'Copy code'"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="handleDeleteCode(item.id)"
                  class="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-rose-500 cursor-pointer"
                  :title="locale === 'pt' ? 'Revogar / Excluir' : 'Revoke / Delete'"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Paginator Footer for Teacher Codes -->
          <div v-if="filteredTeacherCodes.length > 5" class="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold select-none border-t border-slate-100 dark:border-slate-800/60 mt-2">
            <span>{{ locale === 'pt' ? `Pg ${codesPage} de ${totalCodesPages}` : `Pg ${codesPage} of ${totalCodesPages}` }}</span>            <span>Pg {{ codesPage }} de {{ totalCodesPages }}</span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                :disabled="codesPage === 1"
                @click="codesPage--"
                class="p-0.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-250 dark:hover:bg-slate-850 rounded-md cursor-pointer disabled:opacity-40 transition"
              >
                ◀
              </button>
              <button
                type="button"
                :disabled="codesPage === totalCodesPages"
                @click="codesPage++"
                class="p-0.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-250 dark:hover:bg-slate-850 rounded-md cursor-pointer disabled:opacity-40 transition"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>
        <!-- Admin User Modification Modal Overlay -->
    <div v-if="uToEdit" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
      <form 
        @submit.prevent="handleSaveUserFromAdmin"
        class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-scaleUp text-slate-900 dark:text-white"
      >
        <div class="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-2.5">
          <div>
            <h4 class="font-extrabold text-base text-slate-950 dark:text-white flex items-center gap-1.5">
              <UserCheck class="w-5 h-5" :style="{ color: props.primaryColor || '#4f46e5' }" />
              {{ locale === 'pt' ? 'Alterar Informações de Conta' : 'Change Account Information' }}
            </h4>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ locale === 'pt' ? 'Mude e salve dados de cadastro do voluntário diretamente no Firestore.' : 'Change and save volunteer registration data directly in Firestore.' }}
            </p>
          </div>
          <button 
            type="button"
            @click="uToEdit=null"
            class="text-slate-400 hover:text-slate-600 hover:bg-slate-105 rounded p-1"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3.5">
          <!-- Display Name -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ locale === 'pt' ? 'Nome Completo do Aluno/Professor (Não editável)' : 'Student/Teacher Full Name (Non-editable)' }}
            </label>
            <input 
              v-model="editUserName"
              type="text"
              required
              disabled
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden cursor-not-allowed opacity-75"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ locale === 'pt' ? 'E-mail Cadastrado (Não editável)' : 'Registered Email (Non-editable)' }}
            </label>
            <input 
              v-model="editUserEmail"
              type="email"
              disabled
              :placeholder="locale === 'pt' ? 'Não informado' : 'Not informed'"
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-955 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-800 rounded-xl p-3 focus:outline-hidden cursor-not-allowed opacity-75"
            />
          </div>

          <!-- English Level & Privilege Roles -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
                {{ locale === 'pt' ? 'Nível de Inglês' : 'English Level' }}
              </label>
              <select 
                v-model="editUserLevel"
                class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl p-3 cursor-pointer"
              >
                <option value="Beginner">{{ locale === 'pt' ? 'Beginner (Básico)' : 'Beginner' }}</option>
                <option value="Intermediate">{{ locale === 'pt' ? 'Intermediate (Intermediário)' : 'Intermediate' }}</option>
                <option value="Advanced">{{ locale === 'pt' ? 'Advanced (Avançado)' : 'Advanced' }}</option>
                <option value="All">{{ locale === 'pt' ? 'All (Profissional)' : 'All (Professional)' }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
                {{ locale === 'pt' ? 'Cargo / Role' : 'Role / Type' }}
              </label>
              <select 
                v-model="editUserRole"
                class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-805 rounded-xl p-3 cursor-pointer"
              >
                <option value="student">{{ locale === 'pt' ? 'Estudante' : 'Student' }}</option>
                <option value="instructor">{{ locale === 'pt' ? 'Professor' : 'Teacher' }}</option>
              </select>
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ locale === 'pt' ? 'Anotações / Bio Pedagógica (Não editável)' : 'Notes / Pedagogical Bio (Non-editable)' }}
            </label>
            <textarea 
              v-model="editUserBio"
              rows="2"
              disabled
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-955 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-850 rounded-xl p-3 focus:outline-hidden resize-none cursor-not-allowed opacity-75"
            />
          </div>

          <!-- Trigger Reset Password -->
          <div 
            class="border rounded-xl p-3 space-y-1.5 transition text-left"
            :style="{ 
              backgroundColor: (props.primaryColor || '#4f46e5') + '10', 
              borderColor: (props.primaryColor || '#4f46e5') + '25' 
            }"
          >
            <span 
              class="inline-flex items-center gap-1.5 text-xs font-black uppercase leading-none"
              :style="{ color: props.primaryColor || '#4f46e5' }"
            >
              <Lock class="w-3.5 h-3.5" :style="{ color: props.primaryColor || '#4f46e5' }" />
              {{ locale === 'pt' ? 'Esqueceu / Redefinir Senha' : 'Forgot / Reset Password' }}
            </span>
            <p class="text-[9.5px] text-slate-650 dark:text-slate-350 leading-normal font-medium">
              {{ locale === 'pt' ? 'Você pode disparar um link de reset de senha oficial do Firebase diretamente para o e-mail cadastrado deste usuário para que ele troque a própria senha com total sigilo.' : 'You can trigger an official Firebase password reset link directly to this user\'s registered email so they can change their password with absolute confidentiality.' }}
            </p>
            <button
              type="button"
              @click="handleAdminResetPassword()"
              class="w-full py-2 text-white font-black text-[10.5px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1 hover:brightness-110 active:scale-[0.98]"
              :style="{ backgroundColor: props.primaryColor || '#4f46e5' }"
            >
              {{ locale === 'pt' ? 'Disparar Reset de Senha via E-mail' : 'Trigger Password Reset via Email' }}
            </button>
          </div>
        </div>

        <div class="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
          <button 
            type="button"
            @click="uToEdit=null"
            class="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-850 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            {{ locale === 'pt' ? 'Cancelar' : 'Cancel' }}
          </button>
          <button 
            type="submit"
            class="w-1/2 py-2.5 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md text-center transition hover:brightness-110 active:scale-[0.98]"
            :style="{ backgroundColor: props.primaryColor || '#4f46e5' }"
          >
            {{ locale === 'pt' ? 'Salvar Cadastro' : 'Save Registration' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </div>
</template>
