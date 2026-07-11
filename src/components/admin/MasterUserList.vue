<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Key,
  Lock,
  Plus,
  Search,
  Trash2,
  UserCheck
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import { showToast, useAppState } from '../../composables/useAppState';
import { useI18n } from '../../composables/useI18n';
import { auth, db } from '../../firebase';
import { UserProfile } from '../../types';

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

const isMobile = ref(false);
const updateMobileStatus = () => {
  isMobile.value = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
};

const usersPage = ref(1);
const usersPerPage = computed(() => isMobile.value ? 4 : 8);

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
    showToast(t('master.noUsersToExport'), "warning");
    return;
  }

  const dataToExport = listToExport.map(u => {
    return {
      [t('master.xlsxUserId')]: u.uid || "",
      [t('master.xlsxDisplayName')]: u.displayName || u.email || t('master.anonymousUser'),
      [t('master.xlsxIsTeacher')]: u.isInstructor ? t('master.yes') : t('master.no'),
      [t('master.xlsxIsAdmin')]: u.isAdmin ? t('master.yes') : t('master.no')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('master.xlsxSheetName'));

  worksheet['!cols'] = Object.keys(dataToExport[0]).map(h => ({ wch: 20 }));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const dateSuffix = new Date().toLocaleDateString(locale.value === 'pt' ? "pt-BR" : "en-US").replace(/\//g, "-");
  link.download = `${t('master.xlsxFilenamePrefix')}${dateSuffix}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// JSON Exporter
const exportTeachersJSON = () => {
  const listToExport = filteredUsers.value;
  if (listToExport.length === 0) {
    showToast(t('master.noUsersToExport'), "warning");
    return;
  }

  const sanitizedList = listToExport.map(u => {
    return {
      uid: u.uid || "",
      displayName: u.displayName || u.email || t('master.anonymousUser'),
      isInstructor: u.isInstructor || false,
      isAdmin: u.isAdmin || false
    };
  });

  const jsonContent = JSON.stringify(sanitizedList, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateSuffix = new Date().toLocaleDateString(locale.value === 'pt' ? "pt-BR" : "en-US").replace(/\//g, "-");
  link.download = `${t('master.jsonFilenamePrefix')}${dateSuffix}.json`;
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
const codesPerPage = computed(() => isMobile.value ? 3 : 5);

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
  updateMobileStatus();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobileStatus);
  }

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

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobileStatus);
  }
  if (unsub) {
    unsub();
  }
});

const handleCreateCode = async () => {
  const codeVal = newCodeInput.value.trim().toUpperCase();
  if (!codeVal) {
    showToast(t('master.errCodeEmpty'), "warning");
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
    showToast(t('master.successCodeActivated', { code: codeVal }), "success");
  } catch (err) {
    console.error("Erro ao criar código de professor:", err);
    showToast(t('master.errPermission'), "error");
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
    showToast(t('master.successCodeRevoked', { code: id }), "success");
  } catch (err) {
    console.error("Erro ao excluir código:", err);
    teacherCodes.value = originalList;
    showToast(t('master.errDeleteCode'), "error");
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast(t('master.successCodeCopied', { code: text }), "success");
  }).catch(err => {
    console.error('Erro ao copiar código:', err);
    showToast(t('master.infoTutorCode', { code: text }), "info", 10000);
  });
};
</script>

<template>
  <div>
    <!-- Grid for Monitoring & Invitation Codes -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      <!-- Main User Monitoring & Account Editing panel -->
      <div
        class="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs text-left space-y-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800 pb-4">
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block">
              {{ t('master.userPanelTitle') }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('master.userPanelSubtitle') }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 select-none">
            <button type="button" @click="exportTeachersXLSX"
              class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10.5px] font-black rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer">
              <Download class="w-3.5 h-3.5" /> {{ t('master.exportXlsxLabel') }}
            </button>
            <button type="button" @click="exportTeachersJSON"
              class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-[10.5px] font-black rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer">
              <Download class="w-3.5 h-3.5" /> {{ t('master.exportJsonLabel') }}
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-3 items-center justify-between select-none">
          <!-- Role filters (All / Teachers / Students) -->
          <div class="flex bg-slate-100 dark:bg-slate-955 p-1 rounded-xl w-full md:w-auto">
            <button type="button" @click="selectedRoleFilter = 'all'" :class="[
              'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
              selectedRoleFilter === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            ]">
              {{ t('master.allFilter') }} ({{ users.length }})
            </button>
            <button type="button" @click="selectedRoleFilter = 'teachers'" :class="[
              'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
              selectedRoleFilter === 'teachers' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            ]">
              {{ t('master.teachersFilter') }} ({{ teachers.length }})
            </button>
            <button type="button" @click="selectedRoleFilter = 'students'" :class="[
              'flex-1 md:flex-none px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer',
              selectedRoleFilter === 'students' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            ]">
              {{ t('master.studentsFilter') }} ({{ users.length - teachers.length }})
            </button>
          </div>

          <div class="relative w-full md:max-w-xs">
            <span
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search class="w-3.5 h-3.5" />
            </span>
            <input type="text" :placeholder="t('master.searchPlaceholder')" v-model="searchQuery"
              class="w-full text-xs pl-9 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 border border-gray-205 dark:border-slate-850 rounded-xl p-2.5 focus:outline-hidden text-gray-900 dark:text-white" />
          </div>
        </div>

        <!-- Empty list feedback -->
        <div v-if="filteredUsers.length === 0"
          class="py-12 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-center text-xs text-gray-400 dark:text-slate-500 italic">
          {{ t('master.noMatches') }}
        </div>

        <!-- Table of Users -->
        <div v-else
          class="rounded-xl border border-gray-200/50 dark:border-slate-850 bg-white dark:bg-slate-900 overflow-hidden">
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr
                  class="bg-slate-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-850 text-slate-450 font-extrabold uppercase tracking-wider text-[10px]">
                  <th class="p-4">{{ t('master.thVolunteer') }}</th>
                  <th class="p-4">{{ t('master.thLevel') }}</th>
                  <th class="p-4">{{ t('master.thRole') }}</th>
                  <th class="p-4 text-right">{{ t('master.thAction') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-850">
                <tr v-for="user in paginatedUsers" :key="user.uid"
                  class="hover:bg-slate-50/50 dark:hover:bg-slate-955/25 transition">
                  <td class="p-4 flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center border border-slate-200/50 dark:border-slate-700 shrink-0">
                      {{ (user.displayName || user.email || 'U').charAt(0).toUpperCase() }}
                    </div>
                    <div class="truncate">
                      <p class="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-tight">
                        {{ user.displayName || user.email || t('master.anonymousUser') }}
                        <span v-if="user.isAdmin"
                          class="inline-flex text-[8.5px] font-black bg-red-50 text-red-700 px-1.5 rounded-sm border border-red-100 dark:bg-red-955/30 dark:border-red-900">Admin</span>
                      </p>
                      <span
                        class="block text-[10px] text-gray-405 dark:text-gray-500 font-mono mt-0.5 truncate max-w-xs">UID:
                        {{ user.uid }}</span>
                    </div>
                  </td>
                  <td class="p-4">
                    <span
                      class="px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-850 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px] tracking-wider border border-transparent dark:border-slate-800">
                      {{ user.level || 'Beginner' }}
                    </span>
                  </td>
                  <td class="p-4">
                    <div class="flex items-center gap-1.5">
                      <span v-if="user.isInstructor"
                        class="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-800 px-2 py-0.5 rounded">
                        🧑‍🏫 {{ t('master.volunteerTeacher') }}
                      </span>
                      <span v-else
                        class="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-850 border border-gray-150 dark:border-slate-800 px-2 py-0.5 rounded">
                        🎓 {{ t('master.studentMember') }}
                      </span>
                    </div>
                  </td>
                  <td class="p-4 text-right">
                    <button type="button" @click="startEditUser(user)"
                      class="px-2.5 py-1 text-[10.5px] font-black bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer select-none transition">
                      ✏️ {{ t('master.btnDetails') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile view: shown on mobile, hidden on md and above -->
          <div
            class="block md:hidden p-4 space-y-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-850">
            <div v-for="user in paginatedUsers" :key="user.uid"
              class="p-4 bg-slate-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-850 rounded-xl space-y-3 text-xs text-left">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center border border-slate-200/50 dark:border-slate-700 shrink-0">
                  {{ (user.displayName || user.email || 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="truncate">
                  <div class="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-tight">
                    {{ user.displayName || user.email || t('master.anonymousUser') }}
                    <span v-if="user.isAdmin"
                      class="inline-flex text-[8px] font-black bg-red-50 text-red-700 px-1 rounded border border-red-100 dark:bg-red-955/30 dark:border-red-900">Admin</span>
                  </div>
                  <span class="block text-[10px] text-gray-405 dark:text-gray-500 font-mono mt-0.5 truncate">UID: {{
                    user.uid }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-gray-250/20 dark:border-slate-800/40">
                <div class="space-y-1">
                  <span class="block text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500">Nível</span>
                  <span
                    class="block px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-850 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px] tracking-wider border border-transparent dark:border-slate-800">
                    {{ user.level || 'Beginner' }}
                  </span>
                </div>
                <div class="space-y-1">
                  <span class="block text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500">Função</span>
                  <span v-if="user.isInstructor"
                    class="inline-flex items-center gap-1 text-[9.5px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                    🧑‍🏫 {{ t('master.volunteerTeacher') }}
                  </span>
                  <span v-else
                    class="inline-flex items-center gap-1 text-[9.5px] font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-850 border border-gray-150 dark:border-slate-800 px-1.5 py-0.5 rounded">
                    🎓 {{ t('master.studentMember') }}
                  </span>
                </div>
              </div>

              <div class="pt-2 border-t border-gray-250/20 dark:border-slate-800/40">
                <button type="button" @click="startEditUser(user)"
                  class="w-full py-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 text-[11px] font-bold rounded-lg transition text-center">
                  ✏️ {{ t('master.btnDetails') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination Control for Users -->
          <div v-if="filteredUsers.length > 0"
            class="p-4 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between gap-4 flex-wrap text-xs font-semibold select-none text-slate-450 dark:text-slate-400">
            <span v-html="t('master.showingUsers', {
              from: Math.min(filteredUsers.length, (usersPage - 1) * usersPerPage + 1),
              to: Math.min(filteredUsers.length, usersPage * usersPerPage),
              total: filteredUsers.length
            })"></span>

            <div class="flex items-center gap-1.5">
              <button type="button" :disabled="usersPage === 1" @click="usersPage--"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]">
                <ChevronLeft class="w-3.5 h-3.5" /> {{ t('master.prev') }}
              </button>

              <span class="px-2 text-[11px]">
                {{ t('master.pageOf', { current: usersPage, total: totalUsersPages }) }}
              </span>

              <button type="button" :disabled="usersPage === totalUsersPages" @click="usersPage++"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]">
                {{ t('master.next') }}
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invite Codes -->
      <div
        class="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs text-left space-y-4">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
            <Key class="w-4.5 h-4.5 text-blue-600" />
            {{ t('master.inviteCodesTitle') }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('master.inviteCodesSubtitle') }}</p>
        </div>

        <!-- Add code form -->
        <div class="space-y-2 select-none">
          <div class="flex gap-2">
            <input type="text" placeholder="Ex: EV-AMANDA" v-model="newCodeInput"
              class="flex-grow text-xs uppercase bg-slate-50 dark:bg-slate-955 border border-gray-200 dark:border-slate-850 rounded-xl p-3 focus:outline-hidden text-gray-900 dark:text-white font-bold" />
            <button type="button" @click="generateRandomCode"
              class="px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition duration-150 cursor-pointer">
              {{ t('master.btnGenerate') }}
            </button>
          </div>
          <button type="button" :disabled="codeLoading" @click="handleCreateCode"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1 shadow-sm">
            <Plus class="w-4 h-4" /> {{ t('master.btnActivateCode') }}
          </button>
        </div>

        <!-- List of codes -->
        <div class="space-y-2 border-t border-gray-50 dark:border-slate-800/80 pt-4">
          <!-- Search inside codes -->
          <div class="relative w-full">
            <span
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search class="w-3 h-3" />
            </span>
            <input type="text" :placeholder="t('master.filterCodesPlaceholder')" v-model="codeSearchQuery"
              class="w-full text-[10.5px] pl-8 bg-slate-50 dark:bg-slate-955 focus:bg-white border border-gray-205 dark:border-slate-850 rounded-lg p-2 focus:outline-hidden text-gray-900 dark:text-white" />
          </div>

          <div v-if="filteredTeacherCodes.length === 0"
            class="py-6 text-center text-[11px] text-gray-400 dark:text-slate-500 italic">
            {{ t('master.noCodesMatch') }}
          </div>
          <div v-else class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            <div v-for="item in paginatedTeacherCodes" :key="item.id"
              class="p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div class="truncate">
                <p class="font-extrabold text-slate-955 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                  {{ item.code }}
                  <span v-if="item.status === 'valid'"
                    class="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.1 rounded font-black font-sans uppercase">{{
                      t('master.statusValid') }}</span>
                  <span v-else
                    class="text-[8px] bg-gray-200 text-gray-600 px-1 py-0.1 rounded font-black font-sans uppercase">{{
                      t('master.statusUsed') }}</span>
                </p>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{{ t('master.createdAtLabel') }} {{
                  item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US') :
                  '-' }}</p>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button type="button" @click="copyToClipboard(item.code)"
                  class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  :title="t('master.copyCodeTooltip')">
                  <Copy class="w-3.5 h-3.5" />
                </button>
                <button type="button" @click="handleDeleteCode(item.id)"
                  class="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-rose-500 cursor-pointer"
                  :title="t('master.deleteCodeTooltip')">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Paginator Footer for Teacher Codes -->
          <div v-if="filteredTeacherCodes.length > 0"
            class="pt-3 flex items-center justify-between gap-4 flex-wrap text-xs font-semibold select-none text-slate-450 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 mt-3">
            <span v-html="t('master.showingCodes', {
              from: Math.min(filteredTeacherCodes.length, (codesPage - 1) * codesPerPage + 1),
              to: Math.min(filteredTeacherCodes.length, codesPage * codesPerPage),
              total: filteredTeacherCodes.length
            })"></span>

            <div class="flex items-center gap-1.5">
              <button type="button" :disabled="codesPage === 1" @click="codesPage--"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]">
                <ChevronLeft class="w-3.5 h-3.5" /> {{ t('master.prev') }}
              </button>

              <span class="px-2 text-[11px]">
                {{ t('master.pageOf', { current: codesPage, total: totalCodesPages }) }}
              </span>

              <button type="button" :disabled="codesPage === totalCodesPages" @click="codesPage++"
                class="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 dark:disabled:bg-slate-950 border border-gray-102 dark:border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition duration-150 inline-flex items-center gap-1 text-[11px]">
                {{ t('master.next') }}
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin User Modification Modal Overlay -->
    <div v-if="uToEdit"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left animate-fadeIn">
      <form @submit.prevent="handleSaveUserFromAdmin"
        class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-scaleUp text-slate-900 dark:text-white">
        <div class="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-2.5">
          <div>
            <h4 class="font-extrabold text-base text-slate-950 dark:text-white flex items-center gap-1.5">
              <UserCheck class="w-5 h-5" :style="{ color: props.primaryColor || '#4f46e5' }" />
              {{ t('master.editAccountTitle') }}
            </h4>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ t('master.editAccountSubtitle') }}
            </p>
          </div>
          <button type="button" @click="uToEdit = null"
            class="text-slate-400 hover:text-slate-600 hover:bg-slate-105 rounded p-1">
            ✕
          </button>
        </div>

        <div class="space-y-3.5">
          <!-- Display Name -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ t('master.fullNameLabel') }}
            </label>
            <input v-model="editUserName" type="text" required disabled
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-880 rounded-xl p-3 focus:outline-hidden cursor-not-allowed opacity-75" />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ t('master.registeredEmailLabel') }}
            </label>
            <input v-model="editUserEmail" type="email" disabled :placeholder="t('master.notInformed')"
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-955 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-880 rounded-xl p-3 focus:outline-hidden cursor-not-allowed opacity-75" />
          </div>

          <!-- English Level & Privilege Roles -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
                {{ t('master.englishLevelLabel') }}
              </label>
              <select v-model="editUserLevel"
                class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-880 rounded-xl p-3 cursor-pointer">
                <option value="Beginner">{{ t('master.beginnerBasic') }}</option>
                <option value="Intermediate">{{ t('master.intermediateLabel') }}</option>
                <option value="Advanced">{{ t('master.advancedLabel') }}</option>
                <option value="All">All</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
                {{ t('master.roleLabel') }}
              </label>
              <select v-model="editUserRole"
                class="w-full text-xs font-bold bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-805 rounded-xl p-3 cursor-pointer">
                <option value="student">{{ t('master.studentLabel') }}</option>
                <option value="instructor">{{ t('master.teacherLabel') }}</option>
              </select>
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1">
              {{ t('master.notesBioLabel') }}
            </label>
            <textarea v-model="editUserBio" rows="2" disabled
              class="w-full text-xs font-bold bg-slate-100 dark:bg-slate-955 text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-slate-850 rounded-xl p-3 focus:outline-hidden resize-none cursor-not-allowed opacity-75" />
          </div>

          <!-- Trigger Reset Password -->
          <div class="border rounded-xl p-3 space-y-1.5 transition text-left" :style="{
            backgroundColor: (props.primaryColor || '#4f46e5') + '10',
            borderColor: (props.primaryColor || '#4f46e5') + '25'
          }">
            <span class="inline-flex items-center gap-1.5 text-xs font-black uppercase leading-none"
              :style="{ color: props.primaryColor || '#4f46e5' }">
              <Lock class="w-3.5 h-3.5" :style="{ color: props.primaryColor || '#4f46e5' }" />
              {{ t('master.resetPasswordTitle') }}
            </span>
            <p class="text-[9.5px] text-slate-650 dark:text-slate-350 leading-normal font-medium">
              {{ t('master.resetPasswordSubtitle') }}
            </p>
            <button type="button" @click="handleAdminResetPassword()"
              class="w-full py-2 text-white font-black text-[10.5px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1 hover:brightness-110 active:scale-[0.98]"
              :style="{ backgroundColor: props.primaryColor || '#4f46e5' }">
              {{ t('master.btnTriggerResetPassword') }}
            </button>
          </div>
        </div>

        <div class="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
          <button type="button" @click="uToEdit = null"
            class="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-855 font-bold text-xs rounded-xl cursor-pointer transition-colors">
            {{ t('master.cancel') }}
          </button>
          <button type="submit"
            class="w-1/2 py-2.5 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md text-center transition hover:brightness-110 active:scale-[0.98]"
            :style="{ backgroundColor: props.primaryColor || '#4f46e5' }">
            {{ t('master.saveRegistration') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
