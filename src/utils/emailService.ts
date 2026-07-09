import { doc, getDoc } from 'firebase/firestore';
import { activeEnvMode, db } from '../firebase';

/**
 * Service to manage secure, quota-conscious EmailJS integrations.
 * Due to the tight 200 emails/month free quota limit, this module
 * enforces strong rate-limiting on chat notifications and daily caps
 * to preserve the allowance.
 */

export interface EmailJsConfig {
  serviceId: string;
  templateCommId: string;
  templateSysId: string;
  publicKey: string;
}

// Fetch configuration dynamically from Firestore
export async function fetchEmailJsConfig(): Promise<EmailJsConfig | null> {
  if (activeEnvMode === 'offline') {
    console.warn('[EmailJS] Cannot fetch config: offline mode enabled.');
    return null;
  }
  try {
    const configDocRef = doc(db, 'settings', 'emailjs');
    const configDoc = await getDoc(configDocRef);
    if (configDoc.exists()) {
      return configDoc.data() as EmailJsConfig;
    }
  } catch (error) {
    console.error('[EmailJS] Error fetching emailjs config from Firestore:', error);
  }
  return null;
}

// Helper to check if EmailJS is configured
export const isEmailJsConfigured = async (): Promise<boolean> => {
  const config = await fetchEmailJsConfig();
  return !!(
    config &&
    config.serviceId &&
    config.publicKey &&
    config.templateCommId &&
    config.templateSysId
  );
};

// Global day cap configuration: max 6 emails sent per user/browser per day
const DAILY_EMAIL_CAP = 6;

const getDailyEmailsSentCount = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(`emailjs_sent_count_${today}`);
  return stored ? parseInt(stored, 10) : 0;
};

const incrementDailyEmailsSent = () => {
  const today = new Date().toISOString().split('T')[0];
  const count = getDailyEmailsSentCount();
  localStorage.setItem(`emailjs_sent_count_${today}`, (count + 1).toString());
};

// Sub-rate limit for chat room emails: 1 email per room per user every 30 minutes
const CHAT_EMAIL_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

const checkChatEmailThrottled = (roomId: string, recipientEmail: string): boolean => {
  const key = `emailjs_last_chat_sent_${roomId}_${recipientEmail}`;
  const lastSent = localStorage.getItem(key);
  if (!lastSent) return false;
  const elapsed = Date.now() - parseInt(lastSent, 10);
  return elapsed < CHAT_EMAIL_THROTTLE_MS;
};

const markChatEmailSent = (roomId: string, recipientEmail: string) => {
  const key = `emailjs_last_chat_sent_${roomId}_${recipientEmail}`;
  localStorage.setItem(key, Date.now().toString());
};

/**
 * Generic core dispatcher for EmailJS REST API
 */
async function dispatchEmail(
  templateType: 'sys' | 'comm',
  params: Record<string, string>
): Promise<boolean> {
  if (activeEnvMode === 'offline') {
    console.warn('[EmailJS] Dispatch aborted: System is currently running offline.');
    return false;
  }

  const config = await fetchEmailJsConfig();
  if (
    !config ||
    !config.serviceId ||
    !config.publicKey ||
    !config.templateCommId ||
    !config.templateSysId
  ) {
    console.warn(
      `[EmailJS] Dispatch skipped. Keys not fully configured in your database settings. Fired template type: ${templateType}`,
      params
    );
    return false;
  }

  const templateId = templateType === 'sys' ? config.templateSysId : config.templateCommId;

  // Enforce daily cap to keep safe under quota limits
  const dailyCount = getDailyEmailsSentCount();
  if (dailyCount >= DAILY_EMAIL_CAP) {
    console.warn(
      `[EmailJS] Dispatch aborted. Quota defense: Daily email send cap of ${DAILY_EMAIL_CAP} reached for today.`
    );
    return false;
  }

  try {
    const payload = {
      service_id: config.serviceId,
      template_id: templateId,
      user_id: config.publicKey,
      template_params: params,
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      incrementDailyEmailsSent();
      console.log(`[EmailJS] Email successfuly dispatched! Template ID: ${templateId}`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[EmailJS] Server rejected delivery:`, errText);
      return false;
    }
  } catch (err) {
    console.error(`[EmailJS] Network error during delivery:`, err);
    return false;
  }
}

/// =========================================================================
// ELEGANT RESPONSIVE MASTER FRAME WRAPPER
// =========================================================================

const wrapInElegantEmailFrame = (
  title: string,
  typeLabel: string,
  contentBodyHtml: string,
  themeColor: string
): string => {
  return `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
        <!-- Header / Accent Bar -->
        <tr>
          <td style="background-color: ${themeColor}; height: 6px;"></td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 40px 32px;">
            <!-- Category Badge -->
            <div style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 30px; padding: 4px 12px; margin-bottom: 24px;">
              <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.05em; color: #64748b; text-transform: uppercase;">${typeLabel}</span>
            </div>

            <!-- Branding Header -->
            <h2 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${themeColor};">ENGLISH VOLUNTEER</h2>

            <!-- Main Title -->
            <h1 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.02em;">${title}</h1>

            <!-- Dynamic Content -->
            <div style="font-size: 15px; color: #334155;">
              ${contentBodyHtml}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">English Volunteer Group • REDE DE EDUCAÇÃO VOLUNTÁRIA</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">Este é um e-mail transacional de notificação do sistema enviado em estrita conformidade com os termos da LGPD (Artigo 18). Por favor, não responda a este endereço automático.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
};

// =========================================================================
// PUBLIC TRIGGER FUNCTIONS
// =========================================================================

/**
 * 1. Send Welcome Email (System & Account Template) - DEACTIVATED
 * Disclaim: Disabled per user configuration to conserve email delivery quotas.
 */
export async function sendWelcomeEmail(
  displayName: string,
  recipientEmail: string,
  themeColor: string
): Promise<boolean> {
  console.log(`[EmailJS] Welcome email send skipped for ${recipientEmail} (Deactivated).`);
  return false;
}

/**
 * 2. Send LGPD Deletion Confirmation Email (System & Account Template)
 */
export async function sendDeletionConfirmationEmail(
  displayName: string,
  recipientEmail: string,
  themeColor: string
): Promise<boolean> {
  const title = `Confirmação de Exclusão Definitiva de Dados (Direito de Eliminação - Artigo 18 LGPD)`;
  const formattedContent = `
    <p style="margin: 0 0 16px; font-weight: bold; font-size: 16px; color: #0f172a;">Prezado(a) ${displayName},</p>
    <p style="margin: 0 0 16px; line-height: 1.6;">Em conformidade estrita com o <strong>Artigo 18 da Lei Geral de Proteção de Dados (LGPD)</strong>, confirmamos que sua solicitação de auto-exclusão e esquecimento definitivo do English Volunteer foi totalmente processada.</p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <tr>
        <td style="color: #991b1b; font-size: 14px;">
          <div style="font-weight: 850; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #dc2626; margin-bottom: 6px;">❌ Extensão dos Dados Excluídos Permanentemente:</div>
          <p style="margin: 0; line-height: 1.5; font-weight: 500;">
            • Perfil de acesso, e-mail e credenciais básicas.<br/>
            • Histórico completo de progresso em minicursos.<br/>
            • Notas, registros de quizzes e certificados gerados.<br/>
            • Diálogos, perguntas e respostas nos canais de tutoria/suporte.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; color: #64748b; font-size: 14px;">Lamentamos sua partida, mas asseguramos integralmente a soberania de sua privacidade e pegada digital. Sua conta encontra-se permanentemente encerrada.</p>
  `;

  const finalHtml = wrapInElegantEmailFrame(
    'Exclusão de Dados Concluída',
    'PRIVACIDADE - LGPD',
    formattedContent,
    themeColor
  );

  return await dispatchEmail('sys', {
    recipient_email: recipientEmail,
    recipient_name: displayName,
    subject: `English Volunteer - Confirmação de Exclusão de Dados (LGPD)`,
    type_label: 'EXCLUSÃO DE DADOS',
    content_html: finalHtml,
    primary_color: themeColor,
  });
}

/**
 * 3. Send Support Topic Opened Email - DEACTIVATED
 */
export async function sendSupportTopicOpenedEmail(
  instructorEmail: string,
  instructorName: string,
  studentName: string,
  topic: string,
  courseTitle: string,
  themeColor: string
): Promise<boolean> {
  console.log(`[EmailJS] Support topic email notifications are deactivated.`);
  return false;
}

/**
 * 4. Send Support Topic Closed Email - DEACTIVATED
 */
export async function sendSupportTopicClosedEmail(
  recipientEmail: string,
  recipientName: string,
  closedByName: string,
  topic: string,
  courseTitle: string,
  themeColor: string
): Promise<boolean> {
  console.log(`[EmailJS] Support topic closed email notifications are deactivated.`);
  return false;
}

/**
 * 5. Send Chat Message Throttle-Aware Notification Email - DEACTIVATED
 */
export async function sendChatMessageNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  topic: string,
  lastMessage: string,
  themeColor: string,
  roomId: string
): Promise<boolean> {
  console.log(`[EmailJS] Chat message email notifications are deactivated.`);
  return false;
}

/**
 * 6. Send Class meeting schedule link notification (Communication Template)
 * Warns student of scheduled time and classes that are coming up, and includes URL.
 */
export async function sendClassMeetingNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  classTitle: string,
  scheduledAt: string,
  callUrl: string,
  instructorName: string,
  themeColor: string
): Promise<boolean> {
  const notificationKey = `email_class_meet_notified_${recipientEmail}_${callUrl}`;
  if (localStorage.getItem(notificationKey)) return false;

  const title = `Sua Próxima Aula ao Vivo Está Pronta! Link de Acesso`;
  const formattedContent = `
    <p style="margin: 0 0 16px;">Olá, <strong>${recipientName}</strong>!</p>
    <p style="margin: 0 0 16px;">Seu instrutor voluntário <strong>${instructorName}</strong> ativou o agendamento e publicou as informações de sala de aula e conversação ativa para: <strong>${classTitle}</strong>.</p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <tr>
        <td style="color: #166534; font-size: 14px; line-height: 1.6;">
          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #16a34a; margin-bottom: 4px;">📅 DATA E HORÁRIO CONFIRMADOS:</div>
          <div style="font-size: 16px; font-weight: 850; color: #14532d; margin-bottom: 16px;">${scheduledAt}</div>

          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #16a34a; margin-bottom: 4px;">🔗 LINK DA VIDEOCONFERÊNCIA:</div>
          <a href="${callUrl}" target="_blank" style="color: #15803d; font-weight: 800; text-decoration: underline; word-break: break-all;">
            ${callUrl}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px; line-height: 1.6; font-size: 14px;">Recomendamos que você verifique sua conexão com a internet, garanta o funcionamento de seu fone e microfone com antecedência para obter um desempenho extraordinário na prática da conversação!</p>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="${callUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 850; font-size: 13px; letter-spacing: 0.01em; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.06));">Acessar Sala de Aula</a>
    </div>
  `;

  const finalHtml = wrapInElegantEmailFrame(
    'Aula Disponível',
    'SALA DE AULA ATIVA',
    formattedContent,
    themeColor
  );

  const success = await dispatchEmail('comm', {
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    subject: `Link Disponível para a Aula: ${classTitle} 🔗`,
    type_label: 'AULA AO VIVO',
    content_html: finalHtml,
    primary_color: themeColor,
  });

  if (success) {
    localStorage.setItem(notificationKey, 'true');
  }
  return success;
}
