<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  ShieldAlert, 
  LogOut, 
  User, 
  Sparkles, 
  Compass, 
  ExternalLink,
  Award,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Plus,
  ArrowRight,
  BookMarked,
  Trash2,
  ChevronDown,
  ChevronUp,
  Paintbrush,
  Check,
  Sun,
  Moon,
  RefreshCw,
  Info,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-vue-next";

import { signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, createUserWithEmailAndPassword, updateEmail, updatePassword } from "firebase/auth";
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, activeEnvMode } from "./firebase";
import { UserProfile, Course, Lesson, ClassTurma, Progress, ChatRoom, ChatMessage } from "./types";
import { hexToHsl, hslToHex } from "./utils/theme";
import { sendDeletionConfirmationEmail } from "./utils/emailService";

// Composables & subcomponents
import { useAppState } from "./composables/useAppState";
import CourseView from "./components/courses/CourseView.vue";
import ClassScheduler from "./components/scheduler/ClassScheduler.vue";
import SupportChats from "./components/chats/SupportChats.vue";
import InstructorPanel from "./components/admin/InstructorPanel.vue";
import CertificateViewer from "./components/courses/CertificateViewer.vue";
import MasterPanel from "./components/admin/MasterPanel.vue";
import LoginPanel from "./components/auth/LoginPanel.vue";
import OnboardingPanel from "./components/auth/OnboardingPanel.vue";
import StudentCourses from "./components/courses/StudentCourses.vue";
import MyProgress from "./components/courses/MyProgress.vue";
import UserProfileModal from "./components/auth/UserProfileModal.vue";
import AppHeader from "./components/layout/AppHeader.vue";

// Instantiate State Composable
const {
  currentUser,
  userProfile,
  isOnboarding,
  isDemoUser,
  currentEnvMode,
  primaryColor,
  secondaryColor,
  bgColor,
  isDarkMode,
  autoBg,
  isMasterEnabled,
  onboardName,
  onboardRole,
  onboardLevel,
  onboardCode,
  isAdminLoginForm,
  adminEmail,
  adminPassword,
  adminError,
  adminLoading,
  activeTab,
  courses,
  lessons,
  classes,
  progressList,
  chatRooms,
  unreadChatsCount,
  allUsers,
  demoChatRooms,
  demoChatMessages,
  activeCourseId,
  selectedRoomId,
  chatMessagesLimit,
  activeMessages,
  showCertificateData,
  isDbLoading,
  isUsingFallback,
  isOnline,
  deferredPrompt,
  showInstallBanner,
  completedCountGlobal,
  completedCoursesWithCertificates,
  getProgressForCourse,
  handleSaveProgress,
  handleSaveProfile,
  handleUploadCourse,
  handleJoinClass,
  handleLeaveClass,
  handleCreateClass,
  handleDeleteClass,
  handleUpdateClass,
  handleMarkPresence,
  handleStartChatRoom,
  handleSendMessage,
  handleResolveRoom,
  handleDeleteCourse,
  handleUpdateCourseConfig,
  handleUpdateUserRole,
  handleDeleteUserPhoto,
  handleSelectRoomAndTab,
  syncOfflineProgress,
  appNotifications,
  showToast,
  dismissToast
} = useAppState();

const isDeletingAccount = ref(false);

const handleDeleteUserCompletely = async (targetUid: string) => {
  showToast("Restrição Administrativa: O administrador não tem permissão para excluir contas.", "error");
};

// Course Filtering and Pagination State
const courseSearchQuery = ref("");
const courseLevelFilter = ref("All");
const courseCurrentPage = ref(1);
const courseItemsPerPage = ref(4);

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const queryStr = courseSearchQuery.value.toLowerCase().trim();
    const titleMatch = course.title && course.title.toLowerCase().includes(queryStr);
    const descMatch = course.description && course.description.toLowerCase().includes(queryStr);
    const creatorMatch = course.creatorName && course.creatorName.toLowerCase().includes(queryStr);
    const matchesSearch = !queryStr || titleMatch || descMatch || creatorMatch;

    const userRoleLevel = userProfile.value?.level || "Beginner";
    const isAdmin = userProfile.value?.isAdmin || false;
    
    let isPermittedByLevel = false;
    if (isAdmin || userRoleLevel === "All") {
      isPermittedByLevel = true;
    } else if (userRoleLevel === "Advanced") {
      isPermittedByLevel = ["Advanced", "Intermediate", "Beginner"].includes(course.level);
    } else if (userRoleLevel === "Intermediate") {
      isPermittedByLevel = ["Intermediate", "Beginner"].includes(course.level);
    } else {
      isPermittedByLevel = course.level === "Beginner";
    }

    const matchesLevel = courseLevelFilter.value === "All" || course.level === courseLevelFilter.value;

    return matchesSearch && matchesLevel && isPermittedByLevel;
  });
});

const paginatedCourses = computed(() => {
  const start = (courseCurrentPage.value - 1) * courseItemsPerPage.value;
  const end = start + courseItemsPerPage.value;
  return filteredCourses.value.slice(start, end);
});

const totalCoursePages = computed(() => {
  return Math.ceil(filteredCourses.value.length / courseItemsPerPage.value) || 1;
});

watch([courseSearchQuery, courseLevelFilter], () => {
  courseCurrentPage.value = 1;
});

// Security guard: force redirect if user doesn't have privileges for the current activeTab (e.g. after logout or account swap)
watch([userProfile, activeTab], () => {
  const isAdmin = userProfile.value?.isAdmin || false;
  const isInstructor = userProfile.value?.isInstructor || false;
  
  if (!userProfile.value) {
    if (activeTab.value === 'master' || activeTab.value === 'instructor') {
      activeTab.value = 'courses';
    }
    return;
  }
  
  if (activeTab.value === 'master' && !isAdmin) {
    activeTab.value = 'courses';
  } else if (activeTab.value === 'instructor' && !isInstructor && !isAdmin) {
    activeTab.value = 'courses';
  }
}, { immediate: true, deep: true });

// Profile Editing Modal
const showProfileModal = ref(false);
const profileEditName = ref("");
const profileEditLevel = ref<"Beginner" | "Intermediate" | "Advanced" | "All">("Beginner");
const profileEditBio = ref("");

const openProfileModal = () => {
  if (!userProfile.value) return;
  profileEditName.value = userProfile.value.displayName;
  profileEditLevel.value = userProfile.value.level || "Beginner";
  profileEditBio.value = userProfile.value.bio || "";
  showProfileModal.value = true;
};

const handleSaveProfileFromModal = async () => {
  if (!currentUser.value) return;
  try {
    const updatedName = profileEditName.value.trim();
    const updatedLevel = profileEditLevel.value;
    const updatedBio = profileEditBio.value.trim();
    
    if (!updatedName) {
      showToast("Por favor, preencha o seu nome.", "warning");
      return;
    }

    if (!isDemoUser.value) {
      const profileRef = doc(db, "users", currentUser.value.uid);
      await updateDoc(profileRef, {
        displayName: updatedName,
        level: updatedLevel,
        bio: updatedBio
      });
    }

    if (userProfile.value) {
      userProfile.value.displayName = updatedName;
      userProfile.value.level = updatedLevel;
      userProfile.value.bio = updatedBio;
    }

    showProfileModal.value = false;
    showToast("Perfil atualizado com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    showToast("Falha ao salvar modificações de perfil.", "error");
  }
};

const onUpdateProfileFromModal = async (data: { 
  displayName: string, 
  level: string, 
  bio: string, 
  email?: string, 
  password?: string,
  signatureType?: "text" | "drawn",
  signatureText?: string,
  signatureImage?: string
}) => {
  profileEditName.value = data.displayName;
  profileEditLevel.value = data.level as UserProfile["level"];
  profileEditBio.value = data.bio;
  
  if (!isDemoUser.value && currentUser.value) {
    if (data.email && data.email.trim() !== currentUser.value.email) {
      try {
        await updateEmail(currentUser.value, data.email.trim());
      } catch (err: any) {
        console.error("Erro ao mudar e-mail:", err);
        if (err.code === "auth/requires-recent-login") {
          showToast("Erro de segurança: Alteração de e-mail requer login recente. Saia e entre novamente no aplicativo para confirmar sua identidade.", "error", 10000);
          return;
        } else {
          showToast("Não foi possível alterar seu e-mail: " + err.message, "error");
          return;
        }
      }
    }
    
    if (data.password && data.password.trim() !== "") {
      try {
        await updatePassword(currentUser.value, data.password.trim());
      } catch (err: any) {
        console.error("Erro ao mudar senha:", err);
        if (err.code === "auth/requires-recent-login") {
          showToast("Erro de segurança: Alteração de senha requer login recente. Saia e entre novamente no aplicativo para confirmar sua identidade.", "error", 10000);
          return;
        } else {
          showToast("Não foi possível alterar sua senha: " + err.message, "error");
          return;
        }
      }
    }
  }

  try {
    const updatedName = data.displayName.trim();
    const updatedLevel = data.level as UserProfile["level"];
    const updatedBio = data.bio.trim();
    const updatedEmail = data.email?.trim() || currentUser.value?.email || "";

    if (!isDemoUser.value && currentUser.value) {
      const profileRef = doc(db, "users", currentUser.value.uid);
      await setDoc(profileRef, {
        displayName: updatedName,
        level: updatedLevel,
        bio: updatedBio,
        email: updatedEmail,
        signatureType: data.signatureType || "text",
        signatureText: data.signatureText || "",
        signatureImage: data.signatureImage || ""
      }, { merge: true });
    }

    if (userProfile.value) {
      userProfile.value.displayName = updatedName;
      userProfile.value.level = updatedLevel;
      userProfile.value.bio = updatedBio;
      userProfile.value.email = updatedEmail;
      userProfile.value.signatureType = data.signatureType || "text";
      userProfile.value.signatureText = data.signatureText || "";
      userProfile.value.signatureImage = data.signatureImage || "";
    }

    showProfileModal.value = false;
    showToast("Perfil e credenciais de acesso atualizados com sucesso!", "success");
  } catch (err: any) {
    console.error("Erro ao salvar perfil no Firestore:", err);
    showToast("Perfil atualizado localmente, mas ocorreram erros ao sincronizar com o Firestore.", "warning");
  }
};

const handleRequestLgpdDataDeletion = async () => {
  if (!currentUser.value && !isDemoUser.value) return;
  const uid = currentUser.value?.uid || userProfile.value?.uid || "demo-student-uid";
  const userName = userProfile.value?.displayName || currentUser.value?.displayName || "Voluntário";
  const userEmail = userProfile.value?.email || currentUser.value?.email;
  const isInstructor = userProfile.value?.isInstructor || (userProfile.value?.uid === "demo-instructor-uid") || false;
  
  // O usuário já confirmou clicando no botão vermelho "Sim, excluir meus dados permanentemente" no modal do perfil.
  // Ignoramos a caixa nativa confirm() para evitar bloqueios de sandbox do iframe no ambiente AI Studio.
  
  try {
    isDeletingAccount.value = true;
    showProfileModal.value = false;

    if (userEmail && userEmail !== "Não informado" && !userEmail.includes("@localhost") && userEmail.includes("@")) {
      try {
        await sendDeletionConfirmationEmail(userName, userEmail, primaryColor.value);
      } catch (emailErr) {
        console.warn("[LGPD] Falha de envio do email explicativo (prosseguindo mesmo assim):", emailErr);
      }
    }
    
    // ---- REAL FIREBASE RECURSIVE DELETION (Executed whenever Firestore is available) ----
    if (db && uid) {
      // 1. Se o usuário for um Instrutor/Professor, transferir a propriedade dos cursos e turmas ministradas ANTES de perder permissões
      if (isInstructor) {
        try {
          const coursesSnap = await getDocs(collection(db, "courses"));
          const courseBatch = writeBatch(db);
          let coursesChanged = false;
          coursesSnap.forEach((courseDoc) => {
            const data = courseDoc.data();
            if (data.creatorId === uid) {
              courseBatch.update(courseDoc.ref, {
                creatorId: "system-volunteer",
                creatorName: "Administração"
              });
              coursesChanged = true;
            }
          });
          if (coursesChanged) {
            await courseBatch.commit();
          }
        } catch (e) {
          console.warn("Erro ao reatribuir propriedade de cursos Firestore:", e);
        }

        try {
          const classesQuery = query(collection(db, "classes"), where("instructorId", "==", uid));
          const instructorClassesSnap = await getDocs(classesQuery);
          const instClassBatch = writeBatch(db);
          let instClassesChanged = false;
          instructorClassesSnap.forEach((classDoc) => {
            instClassBatch.update(classDoc.ref, {
              instructorId: "system-volunteer",
              instructorName: "Administração"
            });
            instClassesChanged = true;
          });
          if (instClassesChanged) {
            await instClassBatch.commit();
          }
        } catch (e) {
          console.warn("Erro ao reatribuir turmas Firestore:", e);
        }

        try {
          const instructorChatsQuery = query(collection(db, "chats"), where("instructorId", "==", uid));
          const instructorChatsSnap = await getDocs(instructorChatsQuery);
          const instChatBatch = writeBatch(db);
          let instChatsChanged = false;
          instructorChatsSnap.forEach((chatDoc) => {
            instChatBatch.update(chatDoc.ref, {
              instructorId: "system-volunteer",
              instructorName: "Administração"
            });
            instChatsChanged = true;
          });
          if (instChatsChanged) {
            await instChatBatch.commit();
          }
        } catch (e) {
          console.warn("Erro ao reatribuir suporte chat dadores Firestore:", e);
        }
      }

      // 2. Remover o ID de estudante de todas as turmas agendadas (desmatrícula automática)
      try {
        const classesSnap = await getDocs(collection(db, "classes"));
        const classBatch = writeBatch(db);
        let updatedClasses = false;
        classesSnap.forEach((classDoc) => {
          const data = classDoc.data();
          let changed = false;
          let studentIds = data.studentIds || [];
          let presentStudentIds = data.presentStudentIds || [];
          if (studentIds.includes(uid)) {
            studentIds = studentIds.filter((id: string) => id !== uid);
            changed = true;
          }
          if (presentStudentIds.includes(uid)) {
            presentStudentIds = presentStudentIds.filter((id: string) => id !== uid);
            changed = true;
          }
          if (changed) {
            classBatch.update(classDoc.ref, { studentIds, presentStudentIds });
            updatedClasses = true;
          }
        });
        if (updatedClasses) {
          await classBatch.commit();
        }
      } catch (e) {
        console.warn("Erro ao expurgar matrículas Firestore:", e);
      }

      // 3. Excluir canais de diálogo de tutoria/suporte do estudante (e suas subcoleções de mensagens)
      try {
        const studentChatsQuery = query(collection(db, "chats"), where("studentId", "==", uid));
        const studentChatsSnap = await getDocs(studentChatsQuery);
        
        for (const chatDoc of studentChatsSnap.docs) {
          const chatRoomId = chatDoc.id;
          const messagesSnap = await getDocs(collection(db, "chats", chatRoomId, "messages"));
          const messageBatch = writeBatch(db);
          messagesSnap.forEach((msgDoc) => {
            messageBatch.delete(msgDoc.ref);
          });
          await messageBatch.commit();
          
          await deleteDoc(doc(db, "chats", chatRoomId));
        }
      } catch (e) {
        console.warn("Erro ao expurgar chats suporte Firestore:", e);
      }

      // 3.5. Excluir mensagens individuais escritas por este usuário em QUALQUER outro canal de chat (LGPD completo)
      try {
        const chatsSnap = await getDocs(collection(db, "chats"));
        for (const chatDoc of chatsSnap.docs) {
          const chatRoomId = chatDoc.id;
          const messagesQuery = query(collection(db, "chats", chatRoomId, "messages"), where("senderId", "==", uid));
          const messagesSnap = await getDocs(messagesQuery);
          if (!messagesSnap.empty) {
            const messageBatch = writeBatch(db);
            messagesSnap.forEach((msgDoc) => {
              messageBatch.delete(msgDoc.ref);
            });
            await messageBatch.commit();
          }
        }
      } catch (e) {
        console.warn("Erro ao expurgar mensagens individuais do Firestore:", e);
      }

      // 4. Excluir todo o histórico de progresso, quizzes, notas e certificados do estudante
      try {
        const progressQuery = query(collection(db, "progress"), where("userId", "==", uid));
        const progressSnap = await getDocs(progressQuery);
        const progressBatch = writeBatch(db);
        progressSnap.forEach((docSnap) => {
          progressBatch.delete(docSnap.ref);
        });
        await progressBatch.commit();
      } catch (e) {
        console.warn("Erro ao expurgar progresso Firestore:", e);
      }

      // 5. Excluir dados no sub-documento de informações privadas
      try {
        await deleteDoc(doc(db, "users", uid, "private", "info"));
      } catch (e) {
        console.warn("Sem documento de info privada ou sem acesso:", e);
      }

      // 6. Excluir o documento do perfil do usuário por último
      await deleteDoc(doc(db, "users", uid));

      // 7. Excluir a credencial do Firebase Auth caso exista usuário real autenticado
      if (currentUser.value && !isDemoUser.value) {
        try {
          await currentUser.value.delete();
        } catch (authErr) {
          console.warn("Could not delete Auth user directly (might need recent login):", authErr);
        }
      }
    }

    // ---- ALSO SINK CHANGES TO LOCAL CACHES & SIMULATED CORES ----
    progressList.value = progressList.value.filter(p => p.userId !== uid);
    
    // Obter IDs dos canais de chat do estudante ANTES de filtrá-los da lista local
    const studentChatRoomIds = demoChatRooms.value.filter(r => r.studentId === uid).map(r => r.id);
    studentChatRoomIds.forEach(id => {
      delete demoChatMessages.value[id];
    });

    // Remover todas as mensagens locais individuais enviadas por este usuário em qualquer canal de chat (local/demo)
    Object.keys(demoChatMessages.value).forEach(id => {
      if (demoChatMessages.value[id]) {
        demoChatMessages.value[id] = demoChatMessages.value[id].filter(m => m.senderId !== uid);
      }
    });
    activeMessages.value = activeMessages.value.filter(m => m.senderId !== uid);

    demoChatRooms.value = demoChatRooms.value.filter(r => r.studentId !== uid);
    chatRooms.value = [...demoChatRooms.value];
    
    // Sincronizar o cache local de chats imediatamente
    localStorage.setItem("all_chats_cache", JSON.stringify(chatRooms.value));

    classes.value = classes.value.map(c => {
      let changed = false;
      let studentIds = c.studentIds || [];
      let presentStudentIds = c.presentStudentIds || [];
      if (studentIds.includes(uid)) {
        studentIds = studentIds.filter(id => id !== uid);
        changed = true;
      }
      if (presentStudentIds.includes(uid)) {
        presentStudentIds = presentStudentIds.filter(id => id !== uid);
        changed = true;
      }
      return changed ? { ...c, studentIds, presentStudentIds } : c;
    });

    if (isInstructor) {
      courses.value = courses.value.map(course => {
        if (course.creatorId === uid) {
          return {
            ...course,
            creatorId: "system-volunteer",
            creatorName: "Administração"
          };
        }
        return course;
      });

      classes.value = classes.value.map(c => {
        if (c.instructorId === uid) {
          return {
            ...c,
            instructorId: "system-volunteer",
            instructorName: "Administração"
          };
        }
        return c;
      });

      demoChatRooms.value = demoChatRooms.value.map(r => {
        if (r.instructorId === uid) {
          return {
            ...r,
            instructorId: "system-volunteer",
            instructorName: "Administração"
          };
        }
        return r;
      });
      chatRooms.value = [...demoChatRooms.value];
    }

    // Gravar caches de persistência atualizados do LocalStorage
    localStorage.setItem("all_courses_cache", JSON.stringify(courses.value));
    localStorage.setItem("all_classes_cache", JSON.stringify(classes.value));
    localStorage.setItem("all_progress_snapshots", JSON.stringify(progressList.value));

    // Remover da lista de renderização local
    allUsers.value = allUsers.value.filter(u => u.uid !== uid);
    
    isDeletingAccount.value = false;
    showToast("Solicitação processada com sucesso de acordo com a LGPD! Seus dados foram permanentemente excluídos.", "success", 10000);
    await handleLogout();
  } catch (error) {
    isDeletingAccount.value = false;
    console.error("Erro ao deletar conta de forma recursiva:", error);
    showToast("Ocorreu um erro ao processar o encerramento seguro de dados.", "error");
  }
};

const handleReassignCoursePayload = ({ courseId, instructorId, instructorName }: { courseId: string; instructorId: string; instructorName: string }) => {
  courses.value = courses.value.map(c => {
    if (c.id === courseId) {
      return {
        ...c,
        creatorId: instructorId,
        creatorName: instructorName
      };
    }
    return c;
  });
  localStorage.setItem("all_courses_cache", JSON.stringify(courses.value));
};

// Lifecycle Hooks & Subscriptions
onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser.value = user;
      isDemoUser.value = false;
      const profileRef = doc(db, "users", user.uid);
      
      let hasAdminClaim = false;
      let hasInstructorClaim = false;
      try {
        const idTokenResult = await user.getIdTokenResult(true);
        hasAdminClaim = !!idTokenResult?.claims?.admin || idTokenResult?.claims?.role === "admin";
        hasInstructorClaim = !!idTokenResult?.claims?.instructor || idTokenResult?.claims?.role === "instructor";
      } catch (err: any) {
        console.warn("[AUTH] Erro ao carregar custom claims:", err);
        const errCode = err?.code || "";
        const errMsg = err?.message || "";
        if (
          errCode.includes("not-found") ||
          errCode.includes("disabled") ||
          errCode.includes("expired") ||
          errCode.includes("invalid") ||
          errMsg.includes("not-found") ||
          errMsg.includes("disabled") ||
          errMsg.includes("USER_NOT_FOUND") ||
          errMsg.includes("token-expired")
        ) {
          console.warn("[AUTH] Usuário desativado ou deletado backend-side. Efetuando limpeza e logoff...");
          localStorage.removeItem(`dev_claim_admin_${user.uid}`);
          localStorage.removeItem(`dev_claim_instructor_${user.uid}`);
          try {
            await handleLogout();
          } catch {
            currentUser.value = null;
            userProfile.value = null;
            await signOut(auth);
          }
          return;
        }
      }
      
      const isSimulatedAdmin = localStorage.getItem(`dev_claim_admin_${user.uid}`) === "true";
      const isSimulatedInstructor = localStorage.getItem(`dev_claim_instructor_${user.uid}`) === "true";

      onSnapshot(profileRef, (snap) => {
        if (isDeletingAccount.value) return;
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          const deservesAdmin = hasAdminClaim || isSimulatedAdmin || profile.isAdmin;
          const deservesInstructor = deservesAdmin || isSimulatedInstructor || profile.isInstructor || hasInstructorClaim;
          
          if (!snap.metadata.fromCache) {
            if (deservesAdmin && (!profile.isAdmin || !profile.isInstructor)) {
              updateDoc(profileRef, { isAdmin: true, isInstructor: true }).catch(err => {
                console.error("Erro ao auto-promover admin:", err);
              });
              profile.isAdmin = true;
              profile.isInstructor = true;
            } else if (deservesInstructor && !profile.isInstructor) {
              updateDoc(profileRef, { isInstructor: true }).catch(err => {
                console.error("Erro ao auto-promover instrutor:", err);
              });
              profile.isInstructor = true;
            }
          }
          
          userProfile.value = profile;
          isOnboarding.value = false;
        } else {
          // Se o documento não existe e o snapshot vem do cache offline local, ignore para evitar recriar 
          // com dados velhos antes da resposta final limpa ser obtida do servidor.
          if (snap.metadata.fromCache) return;

          // Se o perfil foi de fato apagado do servidor, apenas autogeramos se houver claims reais (não simulados na máquina local)
          const deservesRealAdmin = hasAdminClaim;
          const deservesRealInstructor = deservesRealAdmin || hasInstructorClaim;
          
          onboardName.value = user.displayName || "";
          
          if (deservesRealAdmin || deservesRealInstructor) {
            const autoProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || "Conta Administradora",
              isInstructor: deservesRealInstructor,
              level: "Advanced",
              bio: deservesRealAdmin ? "Administrador Master do English Volunteer" : "Instrutor Voluntário",
              isAdmin: deservesRealAdmin,
              email: user.email || ""
            };
            setDoc(profileRef, autoProfile).catch(e => {
              console.error("Erro salvando perfil auto-gerado:", e);
            });
            userProfile.value = autoProfile;
            isOnboarding.value = false;
          } else {
            // Caso contrário, enviamos para onboarding/boas-vindas para registrar as informações limpas
            isOnboarding.value = true;
          }
        }
      }, (error) => {
        const deservesAdmin = hasAdminClaim || isSimulatedAdmin;
        const deservesInstructor = deservesAdmin || isSimulatedInstructor;
        userProfile.value = {
          uid: user.uid,
          displayName: user.displayName || "Estudante Voluntário",
          isInstructor: deservesInstructor,
          level: "Beginner",
          bio: deservesAdmin ? "Administrador Master do English Volunteer" : "Estudando inglês com a comunidade!",
          isAdmin: deservesAdmin,
          email: user.email || ""
        };
        isOnboarding.value = false;
      });
    } else {
      // Se for um usuário de demonstração, ignoramos o onAuthStateChanged(null) 
      // pois usuários de demonstração não possuem uma sessão real no Firebase Auth SDK.
      if (isDemoUser.value) {
        return;
      }
      
      // Se estiver offline e possuir sessão em cache local, mantém a sessão do usuário ativa
      const hasCachedSession = !!localStorage.getItem("cached_auth_user");
      if (isOnline.value || !hasCachedSession) {
        currentUser.value = null;
        userProfile.value = null;
        isOnboarding.value = false;
      }
    }
  });

  let activeUnsubs: (() => void)[] = [];
  const clearActiveSubscriptions = () => {
    activeUnsubs.forEach(u => { try { u(); } catch {} });
    activeUnsubs = [];
  };

  watch([currentUser, isDemoUser, userProfile], () => {
    clearActiveSubscriptions();
    
    // Save to local storage for instant offline / reload restore
    if (!currentUser.value && !isDemoUser.value) {
      localStorage.removeItem("cached_auth_user");
      localStorage.removeItem("cached_user_profile");
      localStorage.removeItem("cached_is_demo_user");
      return;
    }

    if (currentUser.value) {
      localStorage.setItem("cached_auth_user", JSON.stringify({
        uid: currentUser.value.uid,
        email: currentUser.value.email,
        displayName: currentUser.value.displayName,
        photoURL: currentUser.value.photoURL,
        isOfflinePlaceholder: currentUser.value.isOfflinePlaceholder || false
      }));
    } else {
      localStorage.removeItem("cached_auth_user");
    }

    if (userProfile.value) {
      localStorage.setItem("cached_user_profile", JSON.stringify(userProfile.value));
    } else {
      localStorage.removeItem("cached_user_profile");
    }

    localStorage.setItem("cached_is_demo_user", String(isDemoUser.value));

    isDbLoading.value = true;
    const isAdmin = userProfile.value?.isAdmin || false;
    const isInstructor = userProfile.value?.isInstructor || false;

    if (isAdmin) {
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        let list: UserProfile[] = [];
        snap.forEach(d => list.push(d.data() as UserProfile));

        // Filtrar resquícios de usuários excluídos de cache local persistente
        const purgedUids = JSON.parse(localStorage.getItem("lgpd_purged_uids") || "[]");
        list = list.filter(u => !purgedUids.includes(u.uid));

        if (isDemoUser.value) {
          const mockList: UserProfile[] = [
            {
              uid: "demo-student-uid",
              displayName: "Lucas Ribeiro (Estudante)",
              isInstructor: false,
              level: "Beginner"
            }
          ];
          mockList.forEach(m => {
            if (list.findIndex(l => l.uid === m.uid) === -1) {
              list.push(m);
            }
          });
        }
        allUsers.value = list;
      }, () => {
        if (isDemoUser.value) {
          allUsers.value = [
            {
              uid: "demo-student-uid",
              displayName: "Lucas Ribeiro (Estudante)",
              isInstructor: false,
              level: "Beginner"
            }
          ];
        } else {
          allUsers.value = [];
        }
      });
      activeUnsubs.push(unsubUsers);
    } else {
      const ownProfile = userProfile.value || {
        uid: currentUser.value?.uid || "uid",
        displayName: currentUser.value?.displayName || "Você",
        isInstructor,
        level: "Beginner"
      };
      if (isDemoUser.value) {
        allUsers.value = [
          ownProfile,
          {
            uid: "demo-student-uid",
            displayName: "Lucas Ribeiro (Estudante)",
            isInstructor: false,
            level: "Beginner"
          }
        ];
      } else {
        allUsers.value = [ownProfile];
      }
    }

    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      const list: Course[] = [];
      snap.forEach(d => list.push(d.data() as Course));
      const uniqueList = list.filter((item, index, self) => self.findIndex(c => c.id === item.id) === index);
      courses.value = uniqueList;
      localStorage.setItem("all_courses_cache", JSON.stringify(uniqueList));
    }, (error) => {
      if (isOnline.value && activeEnvMode !== "offline") {
        courses.value = [];
        localStorage.setItem("all_courses_cache", JSON.stringify([]));
      } else {
        isUsingFallback.value = true;
        courses.value = getCachedVal<Course[]>("all_courses_cache", []);
      }
      console.warn("[Sync] courses snapshot error:", error);
    });
    activeUnsubs.push(unsubCourses);

    const unsubLessons = onSnapshot(collection(db, "lessons"), (snap) => {
      const list: Lesson[] = [];
      snap.forEach(d => list.push(d.data() as Lesson));
      const uniqueSorted = list.sort((a,b) => a.order - b.order).filter((item, index, self) => self.findIndex(l => l.id === item.id) === index);
      lessons.value = uniqueSorted;
      localStorage.setItem("all_lessons_cache", JSON.stringify(uniqueSorted));
    }, (error) => {
      if (isOnline.value && activeEnvMode !== "offline") {
        lessons.value = [];
        localStorage.setItem("all_lessons_cache", JSON.stringify([]));
      } else {
        lessons.value = getCachedVal<Lesson[]>("all_lessons_cache", []);
      }
      console.warn("[Sync] lessons snapshot error:", error);
    });
    activeUnsubs.push(unsubLessons);

    const unsubClasses = onSnapshot(collection(db, "classes"), (snap) => {
      const list: ClassTurma[] = [];
      snap.forEach(d => list.push(d.data() as ClassTurma));
      const uniqueList = list.filter((item, index, self) => self.findIndex(c => c.id === item.id) === index);
      classes.value = uniqueList;
      localStorage.setItem("all_classes_cache", JSON.stringify(uniqueList));
    }, (error) => {
      if (isOnline.value && activeEnvMode !== "offline") {
        classes.value = [];
        localStorage.setItem("all_classes_cache", JSON.stringify([]));
      } else {
        classes.value = getCachedVal<ClassTurma[]>("all_classes_cache", []);
      }
      console.warn("[Sync] classes snapshot error:", error);
    });
    activeUnsubs.push(unsubClasses);

    const isRealUser = currentUser.value && !isDemoUser.value;
    const progressTarget = (isRealUser && !isAdmin && !isInstructor)
      ? query(collection(db, "progress"), where("userId", "==", currentUser.value.uid))
      : collection(db, "progress");

    let chatsTarget;
    if (isRealUser) {
      if (isAdmin) {
        chatsTarget = collection(db, "chats");
      } else if (isInstructor) {
        chatsTarget = query(collection(db, "chats"), where("instructorId", "==", currentUser.value.uid));
      } else {
        chatsTarget = query(collection(db, "chats"), where("studentId", "==", currentUser.value.uid));
      }
    } else {
      chatsTarget = collection(db, "chats");
    }

    const unsubProgress = onSnapshot(progressTarget, (snap) => {
      const list: Progress[] = [];
      snap.forEach(d => list.push(d.data() as Progress));
      const uniqueList = list.filter((item, index, self) => self.findIndex(p => p.id === item.id) === index);
      progressList.value = uniqueList;
      localStorage.setItem("all_progress_snapshots", JSON.stringify(uniqueList));
    }, (error) => {
      if (isOnline.value && activeEnvMode !== "offline") {
        progressList.value = [];
        localStorage.setItem("all_progress_snapshots", JSON.stringify([]));
      } else {
        progressList.value = getCachedVal<Progress[]>("all_progress_snapshots", []);
      }
      console.warn("[Sync] progress snapshot error:", error);
    });
    activeUnsubs.push(unsubProgress);

    const unsubChats = onSnapshot(chatsTarget, (snap) => {
      const list: ChatRoom[] = [];
      snap.forEach(d => list.push(d.data() as ChatRoom));
      const uniqueList = list.filter((item, index, self) => self.findIndex(c => c.id === item.id) === index);
      if (isDemoUser.value) {
        const merged = [...demoChatRooms.value];
        uniqueList.forEach(c => {
          if (merged.findIndex(r => r.id === c.id) === -1) {
            merged.push(c);
          }
        });
        chatRooms.value = merged;
      } else {
        chatRooms.value = uniqueList;
      }
      localStorage.setItem("all_chats_cache", JSON.stringify(uniqueList));
    }, (error) => {
      if (isOnline.value && activeEnvMode !== "offline" && !isDemoUser.value) {
        chatRooms.value = [];
        localStorage.setItem("all_chats_cache", JSON.stringify([]));
      } else {
        if (isDemoUser.value) {
          chatRooms.value = demoChatRooms.value;
        } else {
          chatRooms.value = getCachedVal<ChatRoom[]>("all_chats_cache", []);
        }
      }
      console.warn("[Sync] chats snapshot error:", error);
    });
    activeUnsubs.push(unsubChats);

    isDbLoading.value = false;
  }, { immediate: true });

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      isOnline.value = true;
      syncOfflineProgress();
    });
    window.addEventListener("offline", () => {
      isOnline.value = false;
    });
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.value = e;
      if (!sessionStorage.getItem("pwa_closed_banner_session")) {
        showInstallBanner.value = true;
      }
    });
    syncOfflineProgress();

    try {
      const cached = localStorage.getItem("all_progress_snapshots");
      if (cached) {
        const parsed = JSON.parse(cached);
        const list = (Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" ? Object.values(parsed) : [])) as Progress[];
        if (list.length > 0 && progressList.value.length === 0) {
          progressList.value = list;
        }
      }
    } catch {}
  }
});

// Message limits and active messages listener
watch([selectedRoomId, chatMessagesLimit], ([roomId, limitVal], [oldRoomId, _], onCleanup) => {
  if (roomId !== oldRoomId) {
    chatMessagesLimit.value = 15;
  }
  if (!roomId) {
    activeMessages.value = [];
    return;
  }
  const currentLimit = roomId !== oldRoomId ? 15 : limitVal;
  let unsub;
  if (!isDemoUser.value) {
    const messagesRef = collection(db, "chats", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(currentLimit));
    unsub = onSnapshot(q, (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach(d => list.push(d.data() as ChatMessage));
      activeMessages.value = list.filter((item, index, self) => self.findIndex(m => m.id === item.id) === index).reverse();
    }, () => {
      console.warn("Utilizando fila de mensagens local.");
    });
  } else {
    if (!demoChatMessages.value[roomId]) {
      demoChatMessages.value[roomId] = [];
    }
    activeMessages.value = [...demoChatMessages.value[roomId]];
  }
  onCleanup(() => {
    if (unsub) {
      try { unsub(); } catch {}
    }
  });
});

// Auth Click actions
const handleDemoLogin = (role: "student" | "instructor" | "admin") => {
  isDemoUser.value = true;
  const isStudent = role === "student";
  const isInstructorOnly = role === "instructor";
  const isAdmin = role === "admin";

  const dUid = isStudent ? "demo-student-uid" : (isInstructorOnly ? "demo-instructor-uid" : "demo-admin-uid");
  const dName = isStudent 
    ? "Lucas Ribeiro (Estudante)" 
    : (isInstructorOnly ? "Thiago Martins (Professor Voluntário)" : "Felipe Almeida (Professor Admin)");

  currentUser.value = { uid: dUid, displayName: dName };
  userProfile.value = {
    uid: dUid,
    displayName: dName,
    isInstructor: !isStudent,
    level: "Beginner",
    bio: isStudent ? "Estudante e praticante de inglês em busca de proficiência para o trabalho!" : "Dedico meu tempo livre no English Volunteer para partilhar conhecimento.",
    isAdmin
  };
};

const handleOnboardingComplete = async () => {
  if (!currentUser.value) return;
  let isInstructor = false;
  let isAdmin = false;

  if (onboardRole.value === "instructor") {
    const cleanedCode = onboardCode.value.trim().toUpperCase();
    if (!cleanedCode) {
      showToast("Por favor, insira o código de convite de professor para prosseguir.", "warning");
      return;
    }

    try {
      const codeRef = doc(db, "teacher_codes", cleanedCode);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) {
        showToast("Código de professor inválido.", "error");
        return;
      }
      const codeData = codeSnap.data();
      if (codeData?.status !== "valid" && codeData?.status !== "active") {
        showToast("Código inativo ou já utilizado.", "error");
        return;
      }
      await updateDoc(codeRef, {
        status: "used",
        usedBy: currentUser.value.uid,
        usedAt: new Date().toISOString()
      });
      isInstructor = true;
    } catch {
      showToast("Erro ao validar código.", "error");
      return;
    }
  }

  const newProfile: UserProfile = {
    uid: currentUser.value.uid,
    displayName: onboardName.value || currentUser.value.displayName || "Estudante",
    email: currentUser.value ? currentUser.value.email || undefined : undefined,
    isInstructor,
    level: onboardLevel.value,
    bio: isInstructor ? "Sou voluntário ensinando inglês!" : "Quero aprender inglês!",
    isAdmin
  };

  try {
    await setDoc(doc(db, "users", currentUser.value.uid), newProfile);
    userProfile.value = newProfile;
    isOnboarding.value = false;
  } catch (err) {
    userProfile.value = newProfile;
    isOnboarding.value = false;
    handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.value.uid}`);
  }
};

const handleAdminLogin = async () => {
  if (!adminEmail.value || !adminPassword.value) {
    adminError.value = "Por favor, preencha todos os campos.";
    return;
  }
  adminLoading.value = true;
  adminError.value = "";
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail.value, adminPassword.value);
    const user = cred.user;
    const profileRef = doc(db, "users", user.uid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      const defaultAdminProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || "Admin Master",
        isInstructor: true,
        level: "All",
        bio: "Administrador Master",
        isAdmin: true,
        email: user.email || adminEmail.value
      };
      await setDoc(profileRef, defaultAdminProfile);
      userProfile.value = defaultAdminProfile;
    } else {
      const existingProfile = snap.data() as UserProfile;
      if (!existingProfile.isAdmin || !existingProfile.isInstructor) {
        await updateDoc(profileRef, { isAdmin: true, isInstructor: true });
        existingProfile.isAdmin = true;
        existingProfile.isInstructor = true;
      }
      userProfile.value = existingProfile;
    }
    isOnboarding.value = false;
    activeTab.value = "master";
  } catch (err: any) {
    adminError.value = "Erro ao autenticar: " + (err.message || err);
  } finally {
    adminLoading.value = false;
  }
};

const handleForgotPassword = async () => {
  if (!adminEmail.value) {
    adminError.value = "Por favor, digite seu e-mail no campo acima.";
    return;
  }
  adminLoading.value = true;
  adminError.value = "";
  try {
    await sendPasswordResetEmail(auth, adminEmail.value);
    showToast("Link de redefinição enviado com sucesso para " + adminEmail.value, "success");
  } catch (err: any) {
    adminError.value = "Erro ao enviar: " + (err.message || err);
  } finally {
    adminLoading.value = false;
  }
};

const handleGoogleLoginClick = () => {
  if (currentEnvMode.value === "offline") {
    handleDemoLogin("admin");
  } else {
    loginWithGoogle().catch(err => {
      console.error(err);
      showToast("Falha Google: " + err.message, "error");
    });
  }
};

const handleEmailLoginClick = async ({ email, pass }: { email: string, pass: string }) => {
  if (currentEnvMode.value === "offline") {
    handleDemoLogin("student");
    return;
  }
  adminLoading.value = true;
  adminError.value = "";
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    isOnboarding.value = false;
  } catch (err: any) {
    console.error(err);
    showToast("Falha ao entrar com e-mail/senha: " + (err.message || err), "error");
  } finally {
    adminLoading.value = false;
  }
};

const handleEmailSignupClick = async ({ name, email, pass }: { name: string, email: string, pass: string }) => {
  if (currentEnvMode.value === "offline") {
    isDemoUser.value = true;
    currentUser.value = { uid: "demo-new-user-uid", displayName: name, email } as any;
    userProfile.value = {
      uid: "demo-new-user-uid",
      displayName: name,
      email,
      isInstructor: false,
      level: "Beginner",
      bio: "Estudante voluntário!",
      isAdmin: false
    };
    isOnboarding.value = false;
    return;
  }
  adminLoading.value = true;
  adminError.value = "";
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    await updateProfile(user, { displayName: name });
    
    onboardName.value = name;
    // Ensure email is preset
    if (user) {
      currentUser.value = user;
    }
    isOnboarding.value = true;
    showToast("Conta de voluntário pré-cadastrada com sucesso! Escolha suas preferências iniciais.", "success", 8000);
  } catch (err: any) {
    console.error(err);
    showToast("Não foi possível criar sua conta: " + (err.message || err), "error");
  } finally {
    adminLoading.value = false;
  }
};

const handleLogout = async () => {
  if (isDemoUser.value) {
    isDemoUser.value = false;
    currentUser.value = null;
    userProfile.value = null;
  } else {
    await logoutUser();
  }
  activeCourseId.value = null;
  selectedRoomId.value = null;
  activeTab.value = 'courses';
};

const triggerPwaInstall = async () => {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const choiceResult = await deferredPrompt.value.userChoice;
  if (choiceResult.outcome === "accepted") {
    console.log("PWA instalada!");
  }
  deferredPrompt.value = null;
  showInstallBanner.value = false;
};

const closeInstallBanner = () => {
  showInstallBanner.value = false;
  sessionStorage.setItem("pwa_closed_banner_session", "true");
};

const showLoginColors = ref(false);
const loginPresets = [
  { hex: '#2563EB', name: 'Azul' },
  { hex: '#4F46E5', name: 'Índigo' },
  { hex: '#0891B2', name: 'Ciano' },
  { hex: '#059669', name: 'Esmeralda' },
  { hex: '#DC2626', name: 'Vermelho' },
  { hex: '#E11D48', name: 'Rosa' },
  { hex: '#8B5CF6', name: 'Violeta' },
  { hex: '#F59E0B', name: 'Âmbar' }
];

const updateLoginThemeColor = (color: string) => {
  primaryColor.value = color;
  const hsl = hexToHsl(color);
  const darkerHsl = { ...hsl, l: Math.max(10, hsl.l - 8) };
  secondaryColor.value = hslToHex(darkerHsl.h, darkerHsl.s, darkerHsl.l);
};

const toggleLoginDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};
</script>

<template>
  <!-- Main template wrapper -->
  <div v-if="!currentUser && !isDemoUser" class="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100 relative">
    <LoginPanel
      :loading="adminLoading"
      @google-login="handleGoogleLoginClick"
      @email-login="handleEmailLoginClick"
      @email-signup="handleEmailSignupClick"
    />

    <!-- Floating Theme Controls on Login Page -->
    <div class="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      <!-- Theme Color Palette Selector -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-y-2 opacity-0 scale-95"
        enter-to-class="transform translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100 scale-100"
        leave-to-class="transform translate-y-2 opacity-0 scale-95"
      >
        <div 
          v-if="showLoginColors" 
          class="bg-white border rounded-2xl p-3 shadow-2xl flex gap-2 items-center transition-all duration-350"
          :style="{
            borderColor: primaryColor,
            boxShadow: '0 8px 30px -4px ' + primaryColor + '30'
          }"
        >
          <button
            v-for="preset in loginPresets"
            :key="preset.hex"
            type="button"
            @click="updateLoginThemeColor(preset.hex)"
            class="w-7 h-7 rounded-full border-2 border-transparent transition-all scale-100 hover:scale-115 active:scale-90 cursor-pointer relative flex items-center justify-center shrink-0"
            :style="{ 
              backgroundColor: preset.hex,
              borderColor: primaryColor === preset.hex ? '#ffffff' : 'transparent',
              boxShadow: primaryColor === preset.hex ? '0 0 0 2px ' + primaryColor : 'none'
            }"
            :title="preset.name"
          >
            <Check v-if="primaryColor === preset.hex" class="w-3.5 h-3.5 text-white stroke-[4px]" />
          </button>
        </div>
      </transition>

      <!-- FAB trigger buttons -->
      <div 
        class="flex gap-2 bg-white p-1.5 rounded-full shadow-2xl border transition-all duration-350"
        :style="{
          borderColor: primaryColor,
          boxShadow: '0 4px 20px -2px ' + primaryColor + '40'
        }"
      >
        <!-- Paintbrush / Color cycle -->
        <button
          type="button"
          @click="showLoginColors = !showLoginColors"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
          :style="{
            color: showLoginColors ? '#ffffff' : primaryColor,
            backgroundColor: showLoginColors ? primaryColor : 'transparent'
          }"
          title="Mudar Cor de Destaque"
        >
          <Paintbrush class="w-5 h-5" :class="{ 'animate-pulse': showLoginColors }" />
        </button>

        <!-- Dark/Light theme toggle -->
        <button
          type="button"
          @click="toggleLoginDarkMode"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer hover:opacity-90"
          :style="{
            backgroundColor: primaryColor,
            color: '#ffffff'
          }"
          :title="isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'"
        >
          <Sun v-if="isDarkMode" class="w-5 h-5 animate-spin-slow" />
          <Moon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>

  <div v-else-if="isOnboarding" class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <OnboardingPanel
      v-model:onboardName="onboardName"
      v-model:onboardRole="onboardRole"
      v-model:onboardLevel="onboardLevel"
      v-model:onboardCode="onboardCode"
      @submit="handleOnboardingComplete"
    />
  </div>

  <div v-else class="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-blue-100 flex flex-col justify-between">
    <!-- PWA CUSTOM SETUP DIALOG BANNER -->
    <div 
      v-if="showInstallBanner" 
      class="bg-blue-600 text-white text-[11.5px] sm:text-xs py-2.5 px-4 font-bold flex items-center justify-between gap-3 text-left animate-fadeIn shadow-md h-auto"
    >
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-amber-300 shrink-0 select-none animate-pulse" />
        <span>Instale o aplicativo English Volunteer para estudar 100% offline e sincronizar seu progresso automaticamente ao reconectar!</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button 
          @click="triggerPwaInstall" 
          class="bg-amber-400 hover:bg-amber-500 text-gray-950 px-3 py-1 rounded-md text-[10px] font-black transition cursor-pointer"
        >
          Instalar App
        </button>
        <button 
          @click="closeInstallBanner" 
          class="bg-blue-700 hover:bg-blue-800 text-blue-100 px-2 py-1 rounded-md text-[10px] transition cursor-pointer"
        >
          Depois
        </button>
      </div>
    </div>

    <!-- Dynamic Header -->
    <AppHeader
      v-model:activeTab="activeTab"
      v-model:activeCourseId="activeCourseId"
      v-model:primaryColor="primaryColor"
      v-model:secondaryColor="secondaryColor"
      v-model:isDarkMode="isDarkMode"
      v-model:autoBg="autoBg"
      v-model:bgColor="bgColor"
      :userProfile="userProfile"
      :isOnline="isOnline"
      :isMasterEnabled="isMasterEnabled"
      :unreadChatsCount="unreadChatsCount"
      @open-profile="openProfileModal"
      @logout="handleLogout"
    />

    <!-- Main Container Content with dynamic contrast layout -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col justify-between">
      
      <!-- Fallback catalog warnings -->
      <div v-if="isUsingFallback" class="mb-6 p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex items-center justify-between text-left">
        <div class="flex items-center gap-2">
          <ShieldAlert class="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <p class="font-bold">Modo de Contingência Ativos: Exibindo catálogo de mini-cursos local devido ao limite de conexões Firestore.</p>
        </div>
        <button @click="isUsingFallback = false" class="text-xs underline font-black hover:opacity-80 shrink-0 cursor-pointer">✕ Ignorar</button>
      </div>

      <!-- Database loading state -->
      <div v-if="isDbLoading" class="flex-1 flex flex-col items-center justify-center py-20">
        <RefreshCw class="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p class="text-xs text-gray-400 font-bold">Iniciando ambiente voluntário, por favor aguarde...</p>
      </div>

      <div v-else class="w-full flex-1">
        
        <!-- Tab 1: Courses view -->
        <div v-if="activeTab === 'courses'" class="space-y-6">
          <div v-if="!activeCourseId" class="space-y-8 text-left">
            <StudentCourses
              :courses="courses"
              :lessons="lessons"
              :progressList="progressList"
              :completedCountGlobal="completedCountGlobal"
              :currentUser="currentUser"
              :userProfile="userProfile"
              :primaryColor="primaryColor"
              @select-course="(courseId) => activeCourseId = courseId"
            />
          </div>

          <div v-else>
            <!-- Course View container -->
            <CourseView
              :course="courses.find(c => c.id === activeCourseId)!"
              :lessons="lessons.filter(l => l.courseId === activeCourseId)"
              :progressReport="getProgressForCourse(activeCourseId)"
              :currentUserId="currentUser?.uid || 'demo-student-uid'"
              :studentName="userProfile?.displayName || currentUser?.displayName || 'Estudante Voluntário'"
              :primaryColor="primaryColor"
              @save-progress="handleSaveProgress"
              @back="activeCourseId = null"
              @show-certificate="(cert) => showCertificateData = cert"
              @navigate-chat="handleSelectRoomAndTab"
            />
          </div>
        </div>

        <!-- Tab 2: Scheduler booking list -->
        <div v-if="activeTab === 'scheduler'">
          <ClassScheduler
            :classes="classes"
            :courses="courses"
            :currentUserId="currentUser?.uid || 'demo-student-uid'"
            :isInstructor="userProfile?.isInstructor || userProfile?.isAdmin || false"
            :isAdmin="userProfile?.isAdmin || false"
            :userDisplayName="userProfile?.displayName || currentUser?.displayName || 'Voluntário'"
            @join="handleJoinClass"
            @leave="handleLeaveClass"
            @create="handleCreateClass"
            @delete="handleDeleteClass"
            @join-class="handleJoinClass"
            @leave-class="handleLeaveClass"
            @create-class="handleCreateClass"
            @delete-class="handleDeleteClass"
            @update-class="handleUpdateClass"
            @mark-presence="handleMarkPresence"
          />
        </div>

        <!-- Tab 3: Chat Q&A helproom -->
        <div v-if="activeTab === 'chats'">
          <SupportChats
            :chatRooms="chatRooms"
            :activeMessages="activeMessages"
            :courses="courses"
            :currentUserId="currentUser?.uid || 'demo-student-uid'"
            :userDisplayName="userProfile?.displayName || currentUser?.displayName || 'Estudante'"
            :isInstructor="userProfile?.isInstructor || userProfile?.isAdmin || false"
            :isAdmin="userProfile?.isAdmin || false"
            :selectedRoomId="selectedRoomId"
            :messagesLimit="chatMessagesLimit"
            :isDarkMode="isDarkMode"
            @select-room="(roomId) => selectedRoomId = roomId"
            @start-room="handleStartChatRoom"
            @send-message="handleSendMessage"
            @resolve-room="handleResolveRoom"
            @load-more-messages="chatMessagesLimit += 15"
          />
        </div>

        <!-- Tab 4: Instructor Content publisher section -->
        <div v-if="activeTab === 'instructor'">
          <InstructorPanel
            :courses="courses"
            :progressReports="progressList"
            :chatRooms="chatRooms"
            :classes="classes"
            :lessons="lessons"
            :users="allUsers"
            :userDisplayName="userProfile?.displayName || 'Instrutor'"
            :instructorId="userProfile?.uid || ''"
            :uploadCourseFn="handleUploadCourse"
            :deleteCourseFn="handleDeleteCourse"
            @upload-course="handleUploadCourse"
            @delete-course="handleDeleteCourse"
            @update-course-config="handleUpdateCourseConfig"
          />
        </div>

        <!-- Tab 5: Master control Panel monitoring -->
        <div v-if="activeTab === 'master'">
          <MasterPanel
            :users="allUsers"
            :courses="courses"
            :classes="classes"
            :progressReports="progressList"
            :currentUserId="currentUser?.uid || 'demo-admin-uid'"
            :isDemoUser="isDemoUser"
            :primaryColor="primaryColor"
            @update-user-role="handleUpdateUserRole"
            @delete-user="handleDeleteUserPhoto"
            @delete-user-completely="handleDeleteUserCompletely"
            @reassign-course-owner="handleReassignCoursePayload"
          />
        </div>

        <!-- Tab 6: Progress Tracking of Completed Courses (Independent of level) -->
        <div v-if="activeTab === 'tracking'" class="space-y-6 text-left">
          <MyProgress
            :completedCoursesWithCertificates="completedCoursesWithCertificates"
            :progressList="progressList"
            :courses="courses"
            :currentUser="currentUser"
            :userProfile="userProfile"
            :primaryColor="primaryColor"
            @open-profile="openProfileModal"
            @show-certificate="(cert) => showCertificateData = cert"
            @navigate-courses="activeTab = 'courses'"
          />
        </div>

      </div>

    </main>

    <!-- Certificate viewer popup Dialog -->
    <CertificateViewer
      v-if="showCertificateData"
      :studentName="showCertificateData.studentName"
      :courseTitle="showCertificateData.courseTitle"
      :certificateId="showCertificateData.id"
      :primaryColor="showCertificateData.primaryColor"
      :iconUrl="showCertificateData.iconUrl"
      :creatorId="showCertificateData.creatorId"
      @close="showCertificateData = null"
    />


    <!-- User Profile Editor Modal Dialog -->
    <UserProfileModal
      :isOpen="showProfileModal"
      :initialName="profileEditName"
      :initialLevel="profileEditLevel"
      :initialBio="profileEditBio"
      :initialEmail="currentUser?.email || undefined"
      :primaryColor="primaryColor"
      :isInstructor="userProfile?.isInstructor || userProfile?.isAdmin"
      :initialSignatureType="userProfile?.signatureType"
      :initialSignatureText="userProfile?.signatureText"
      :initialSignatureImage="userProfile?.signatureImage"
      @close="showProfileModal = false"
      @update-profile="onUpdateProfileFromModal"
      @delete-account="handleRequestLgpdDataDeletion"
    />



    <!-- Footer of the English Volunteer network -->
    <footer class="bg-white border-t border-gray-150 py-6 text-center select-none mt-10 shrink-0">
      <div class="max-w-7xl mx-auto px-4 text-xs text-gray-400 font-medium font-semibold">
        <p>© {{ new Date().getFullYear() }} English Volunteer Network. Desenvolvido de forma comunitária e gratuita.</p>
        <p class="mt-1">Hospedado no plano livre Google de alta velocidade.</p>
      </div>
    </footer>

  </div>

  <!-- Custom Tray Notification Center -->
  <div class="fixed top-5 right-5 z-[10000] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <transition-group
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="translate-y-[-20px] opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-205 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in appNotifications"
        :key="toast.id"
        class="pointer-events-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex items-start gap-3 text-left relative overflow-hidden animate-scaleIn"
        :style="{
          borderLeft: `5px solid ${
            toast.type === 'success' ? '#10b981' : 
            toast.type === 'error' ? '#f43f5e' : 
            toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
          }`
        }"
      >
        <!-- Accent top-bar for decoration -->
        <div 
          class="absolute top-0 left-0 right-0 h-[3px]"
          :class="{
            'bg-emerald-500': toast.type === 'success',
            'bg-rose-500': toast.type === 'error',
            'bg-amber-500': toast.type === 'warning',
            'bg-blue-500': toast.type === 'info'
          }"
        ></div>

        <!-- Type icons -->
        <div class="shrink-0 mt-0.5">
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-500" />
          <AlertCircle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <Info v-else class="w-5 h-5 text-blue-500" />
        </div>

        <!-- Notification text -->
        <div class="flex-grow pr-4">
          <p class="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss button -->
        <button
          type="button"
          @click="dismissToast(toast.id)"
          class="text-slate-305 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-0.5 rounded transition cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style>
:root {
  --primary-color: #2563EB;
  --secondary-color: #4F46E5;
  --bg-color: #f8fafc;
  --card-background: #ffffff;
}

/* Dynamically map blue-related properties to calculated shades */
.text-blue-50 { color: var(--color-blue-50) !important; }
.text-blue-100 { color: var(--color-blue-100) !important; }
.text-blue-200 { color: var(--color-blue-200) !important; }
.text-blue-300 { color: var(--color-blue-300) !important; }
.text-blue-400 { color: var(--color-blue-400) !important; }
.text-blue-500 { color: var(--color-blue-500) !important; }
.text-blue-600 { color: var(--color-blue-600) !important; }
.text-blue-700 { color: var(--color-blue-700) !important; }
.text-blue-800 { color: var(--color-blue-800) !important; }
.text-blue-900 { color: var(--color-blue-900) !important; }
.text-blue-950 { color: var(--color-blue-950) !important; }

.bg-blue-50 { background-color: var(--color-blue-50) !important; }
.bg-blue-100 { background-color: var(--color-blue-100) !important; }
.bg-blue-200 { background-color: var(--color-blue-200) !important; }
.bg-blue-300 { background-color: var(--color-blue-300) !important; }
.bg-blue-400 { background-color: var(--color-blue-400) !important; }
.bg-blue-500 { background-color: var(--color-blue-500) !important; }
.bg-blue-600 { background-color: var(--color-blue-600) !important; }
.bg-blue-700 { background-color: var(--color-blue-700) !important; }
.bg-blue-800 { background-color: var(--color-blue-800) !important; }
.bg-blue-900 { background-color: var(--color-blue-900) !important; }
.bg-blue-950 { background-color: var(--color-blue-950) !important; }

.border-blue-50 { border-color: var(--color-blue-50) !important; }
.border-blue-100 { border-color: var(--color-blue-100) !important; }
.border-blue-200 { border-color: var(--color-blue-200) !important; }
.border-blue-300 { border-color: var(--color-blue-300) !important; }
.border-blue-400 { border-color: var(--color-blue-400) !important; }
.border-blue-500 { border-color: var(--color-blue-500) !important; }
.border-blue-600 { border-color: var(--color-blue-600) !important; }
.border-blue-700 { border-color: var(--color-blue-700) !important; }
.border-blue-800 { border-color: var(--color-blue-800) !important; }
.border-blue-900 { border-color: var(--color-blue-900) !important; }
.border-blue-950 { border-color: var(--color-blue-950) !important; }

/* Dynamically map indigo-related fields so they follow secondary-color */
.text-indigo-50 { color: var(--color-indigo-50) !important; }
.text-indigo-100 { color: var(--color-indigo-100) !important; }
.text-indigo-200 { color: var(--color-indigo-200) !important; }
.text-indigo-300 { color: var(--color-indigo-300) !important; }
.text-indigo-400 { color: var(--color-indigo-400) !important; }
.text-indigo-500 { color: var(--color-indigo-500) !important; }
.text-indigo-600 { color: var(--color-indigo-600) !important; }
.text-indigo-700 { color: var(--color-indigo-700) !important; }
.text-indigo-800 { color: var(--color-indigo-800) !important; }
.text-indigo-900 { color: var(--color-indigo-900) !important; }
.text-indigo-950 { color: var(--color-indigo-950) !important; }

.bg-indigo-50 { background-color: var(--color-indigo-50) !important; }
.bg-indigo-100 { background-color: var(--color-indigo-100) !important; }
.bg-indigo-200 { background-color: var(--color-indigo-200) !important; }
.bg-indigo-300 { background-color: var(--color-indigo-300) !important; }
.bg-indigo-400 { background-color: var(--color-indigo-400) !important; }
.bg-indigo-500 { background-color: var(--color-indigo-500) !important; }
.bg-indigo-600 { background-color: var(--color-indigo-600) !important; }
.bg-indigo-700 { background-color: var(--color-indigo-700) !important; }
.bg-indigo-800 { background-color: var(--color-indigo-800) !important; }
.bg-indigo-900 { background-color: var(--color-indigo-900) !important; }
.bg-indigo-950 { background-color: var(--color-indigo-950) !important; }

.border-indigo-50 { border-color: var(--color-indigo-50) !important; }
.border-indigo-100 { border-color: var(--color-indigo-100) !important; }
.border-indigo-200 { border-color: var(--color-indigo-200) !important; }
.border-indigo-300 { border-color: var(--color-indigo-300) !important; }
.border-indigo-400 { border-color: var(--color-indigo-400) !important; }
.border-indigo-500 { border-color: var(--color-indigo-500) !important; }
.border-indigo-600 { border-color: var(--color-indigo-600) !important; }
.border-indigo-700 { border-color: var(--color-indigo-700) !important; }
.border-indigo-800 { border-color: var(--color-indigo-800) !important; }
.border-indigo-900 { border-color: var(--color-indigo-900) !important; }
.border-indigo-950 { border-color: var(--color-indigo-950) !important; }

/* Map gray and slate palettes so headers, text titles, borders, backgrounds follow primary-derived gray harmoniously! */
.text-gray-950 { color: var(--color-gray-950) !important; }
.text-gray-900 { color: var(--color-gray-900) !important; }
.text-gray-800 { color: var(--color-gray-800) !important; }
.text-gray-700 { color: var(--color-gray-700) !important; }
.text-gray-650 { color: var(--color-gray-650) !important; }
.text-gray-600 { color: var(--color-gray-600) !important; }
.text-gray-500 { color: var(--color-gray-500) !important; }
.text-gray-400 { color: var(--color-gray-400) !important; }
.text-gray-300 { color: var(--color-gray-300) !important; }
.text-gray-200 { color: var(--color-gray-200) !important; }
.text-gray-100 { color: var(--color-gray-100) !important; }
.text-gray-50 { color: var(--color-gray-50) !important; }

.text-slate-950 { color: var(--color-slate-950) !important; }
.text-slate-900 { color: var(--color-slate-900) !important; }
.text-slate-800 { color: var(--color-slate-800) !important; }
.text-slate-705 { color: var(--color-slate-705) !important; }
.text-slate-700 { color: var(--color-slate-700) !important; }
.text-slate-600 { color: var(--color-slate-600) !important; }
.text-slate-500 { color: var(--color-slate-500) !important; }
.text-slate-400 { color: var(--color-slate-400) !important; }
.text-slate-300 { color: var(--color-slate-300) !important; }
.text-slate-200 { color: var(--color-slate-200) !important; }
.text-slate-100 { color: var(--color-slate-100) !important; }
.text-slate-50 { color: var(--color-slate-50) !important; }

.bg-slate-50 { background-color: var(--color-slate-50) !important; }
.bg-slate-100 { background-color: var(--color-slate-100) !important; }
.bg-slate-200 { background-color: var(--color-slate-200) !important; }
.bg-slate-300 { background-color: var(--color-slate-300) !important; }

.bg-gray-50 { background-color: var(--color-gray-50) !important; }
.bg-gray-100 { background-color: var(--color-gray-100) !important; }
.bg-gray-200 { background-color: var(--color-gray-200) !important; }
.bg-gray-300 { background-color: var(--color-gray-300) !important; }

.border-gray-100 { border-color: var(--color-gray-100) !important; }
.border-gray-150 { border-color: var(--color-gray-150) !important; }
.border-gray-200 { border-color: var(--color-gray-200) !important; }
.border-gray-250 { border-color: var(--color-gray-250) !important; }
.border-gray-300 { border-color: var(--color-gray-300) !important; }

.border-slate-100 { border-color: var(--color-slate-100) !important; }
.border-slate-150 { border-color: var(--color-slate-150) !important; }
.border-slate-200 { border-color: var(--color-slate-200) !important; }
.border-slate-300 { border-color: var(--color-slate-300) !important; }

/* Background layout components */
body, .bg-slate-50, .dark body, .dark .min-h-screen, .dark .bg-slate-50, .dark .bg-slate-50\/50 {
  background-color: var(--bg-color) !important;
}

.bg-white, header.bg-white, .dark .bg-white, .dark header.bg-white {
  background-color: var(--card-background) !important;
}

header {
  border-bottom: 1px solid var(--color-slate-100) !important;
}

/* Ensure nice active selection classes match colors */
::selection {
  background-color: var(--color-blue-100) !important;
  color: var(--color-blue-900) !important;
}

a, button, select, input, textarea {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

a {
  color: var(--color-blue-600);
}
a:hover {
  color: var(--color-blue-700);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-blue-300);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-blue-500);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 200ms ease-out forwards;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Status overlays / alerts high contrast */
.bg-amber-50, .bg-amber-50\/50 {
  background-color: #fffbeb !important;
  border-color: #fcd34d !important;
  color: #b45309 !important;
}
.bg-amber-100 {
  background-color: #fef3c7 !important;
  border-color: #fcd34d !important;
  color: #92400e !important;
}
.text-amber-650, .text-amber-600 { color: #d97706 !important; }
.text-amber-700 { color: #b45309 !important; }
.text-amber-800 { color: #92400e !important; }
.border-amber-100, .border-amber-200 { border-color: #fde68a !important; }

.bg-rose-50, .bg-rose-50\/50 {
  background-color: #fef2f2 !important;
  border-color: #fca5a5 !important;
  color: #991b1b !important;
}
.bg-rose-100 {
  background-color: #fee2e2 !important;
  border-color: #fecaca !important;
  color: #991b1b !important;
}
.text-rose-600 { color: #dc2626 !important; }
.text-rose-700 { color: #b45309 !important; /* fallback or specific color */ color: #b91c1c !important; }
.text-rose-800 { color: #991b1b !important; }
.border-rose-100, .border-rose-200 { border-color: #fecaca !important; }

.bg-emerald-50, .bg-emerald-50\/50 {
  background-color: #f0fdf4 !important;
  border-color: #a7f3d0 !important;
  color: #065f46 !important;
}
.bg-emerald-100 {
  background-color: #d1fae5 !important;
  border-color: #a7f3d0 !important;
  color: #065f46 !important;
}
.text-emerald-600 { color: #059669 !important; }
.text-emerald-700 { color: #047857 !important; }
.text-emerald-800 { color: #065f46 !important; }
.border-emerald-100, .border-emerald-250, .border-emerald-200 { border-color: #a7f3d0 !important; }

/* Dark mode explicit overrides for semantic status alerts */
.dark .bg-amber-50, .dark .bg-amber-50\/50 {
  background-color: #2e1a05 !important;
  border-color: #78350f !important;
  color: #fbbf24 !important;
}
.dark .bg-amber-100 {
  background-color: #451a03 !important;
  border-color: #78350f !important;
  color: #fdeb8a !important;
}
.dark .text-amber-600 { color: #f59e0b !important; }
.dark .text-amber-700 { color: #fbbf24 !important; }
.dark .text-amber-800 { color: #fde68a !important; }
.dark .border-amber-100, .dark .border-amber-200 { border-color: #78350f !important; }

.dark .bg-rose-50, .dark .bg-rose-50\/50 {
  background-color: #2d0f0f !important;
  border-color: #7f1d1d !important;
  color: #fca5a5 !important;
}
.dark .bg-rose-100 {
  background-color: #4c1d1d !important;
  border-color: #7f1d1d !important;
  color: #fecaca !important;
}
.dark .text-rose-600 { color: #f87171 !important; }
.dark .text-rose-700 { color: #fca5a5 !important; }
.dark .text-rose-800 { color: #fee2e2 !important; }
.dark .border-rose-100, .dark .border-rose-200 { border-color: #7f1d1d !important; }

.dark .bg-emerald-50, .dark .bg-emerald-50\/50 {
  background-color: #022c22 !important;
  border-color: #065f46 !important;
  color: #34d399 !important;
}
.dark .bg-emerald-100 {
  background-color: #064e3b !important;
  border-color: #065f46 !important;
  color: #a7f3d0 !important;
}
.dark .text-emerald-600 { color: #34d399 !important; }
.dark .text-emerald-700 { color: #6ee7b7 !important; }
.dark .text-emerald-800 { color: #a7f3d0 !important; }
.dark .border-emerald-100, .dark .border-emerald-200 { border-color: #065f46 !important; }

/* Input boxes dynamic mapping */
input, select, textarea, .dark input, .dark select, .dark textarea {
  background-color: var(--card-background) !important;
  border-color: var(--color-slate-200) !important;
  color: var(--color-slate-900) !important;
}

.dark input:focus, .dark select:focus, .dark textarea:focus, input:focus, select:focus, textarea:focus {
  outline: none !important;
  border-color: var(--color-blue-500) !important;
  box-shadow: 0 0 0 2px var(--color-blue-100) !important;
}

tr th {
  background-color: var(--color-slate-100) !important;
  color: var(--color-slate-800) !important;
  border-color: var(--color-slate-200) !important;
}

tr:hover, .hover\:bg-slate-50\/50:hover, .hover\:bg-gray-50\/50:hover {
  background-color: var(--color-slate-50) !important;
}

/* Button overrides for standard template layouts */
button, .cursor-pointer {
  outline: none;
}

/* Banner gradient */
.dark .bg-gradient-to-r.from-blue-50.to-indigo-50 {
  background-image: linear-gradient(to right, var(--color-blue-900), var(--color-indigo-950)) !important;
  border-color: var(--color-slate-200) !important;
}

/* Ensure dark mode borders on dynamic slate shades are appropriately dark and theme-compliant rather than light/white */
.dark .border-slate-800,
.dark .border-slate-850,
.dark .border-slate-700,
.dark .border-slate-750,
.dark .border-slate-755,
.dark .border-slate-805,
.dark .border-slate-705,
.dark .border-gray-100,
.dark .border-gray-150,
.dark .border-gray-200,
.dark [class*="border-slate-800"],
.dark [class*="border-slate-850"],
.dark [class*="border-slate-700"],
.dark [class*="border-slate-755"],
.dark [class*="border-slate-805"],
.dark [class*="border-slate-705"],
.dark [class*="border-slate-700/80"],
.dark [class*="border-slate-800/80"] {
  border-color: var(--color-slate-200) !important;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  h1, .text-2xl, .text-xl {
    font-size: 1.25rem !important;
    line-height: 1.625rem !important;
    letter-spacing: -0.02em !important;
  }
  h2, .text-lg {
    font-size: 1.125rem !important;
    line-height: 1.5rem !important;
  }
  h3, .text-base {
    font-size: 0.95rem !important;
    line-height: 1.35rem !important;
  }
  p, td, th, li, label, select, input, textarea, span, button {
    font-size: 0.8125rem !important;
  }
  .p-5, .p-6, .p-8 {
    padding: 0.875rem !important;
  }
  .gap-6 {
    gap: 0.875rem !important;
  }
  button, select, input, a {
    min-height: 38px !important;
  }
}
</style>
