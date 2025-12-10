/**
 * Email Service for Order Fulfillment
 * Uses Resend API for transactional emails
 */

// Types
export type FulfillmentEmailType = 
  | 'order_confirmed'
  | 'order_delivered'
  | 'order_shipped'
  | 'order_failed'
  | 'course_access'
  | 'subscription_activated'
  | 'tracking_update';

interface EmailData {
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    totalPrice: number;
    type: string;
    digitalDelivery?: {
      type: string;
      accessUrl?: string;
      googleDrive?: {
        shareLink?: string;
      };
    };
  }>;
  digitalDelivery?: {
    type: string;
    accessUrl?: string;
    googleDrive?: {
      shareLink?: string;
    };
  };
  shipping?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
}

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@fayapoint.com';
const FROM_NAME = 'FayaPoint';

/**
 * Send fulfillment notification email
 */
export async function sendFulfillmentEmail(
  to: string,
  type: FulfillmentEmailType,
  data: EmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!RESEND_API_KEY) {
      console.log('[Email] Resend API key not configured, skipping email');
      // Return success even if not configured (graceful degradation)
      return { success: true, messageId: 'not-configured' };
    }

    const { subject, html } = generateEmailContent(type, data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Send failed:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log(`[Email] Sent ${type} to ${to}`);
    
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('[Email] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate email content based on type
 */
function generateEmailContent(
  type: FulfillmentEmailType,
  data: EmailData
): { subject: string; html: string } {
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
      .item { display: flex; padding: 15px 0; border-bottom: 1px solid #f3f4f6; }
      .item:last-child { border-bottom: none; }
      .item-name { flex: 1; font-weight: 500; }
      .item-qty { color: #6b7280; margin-right: 15px; }
      .item-price { font-weight: 600; color: #6366f1; }
      .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
      .button:hover { background: #4f46e5; }
      .tracking-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .tracking-number { font-size: 18px; font-weight: 700; color: #6366f1; letter-spacing: 1px; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      .success-icon { font-size: 48px; margin-bottom: 10px; }
      .digital-access { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
  `;

  switch (type) {
    case 'order_confirmed':
      return {
        subject: `✅ Pedido ${data.orderNumber} confirmado!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1>Pedido Confirmado!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Seu pedido <strong>#${data.orderNumber}</strong> foi confirmado e está sendo processado!</p>
                
                <h3>Itens do Pedido:</h3>
                ${data.items.map(item => `
                  <div class="item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span class="item-price">R$ ${item.totalPrice.toFixed(2)}</span>
                  </div>
                `).join('')}
                
                ${data.shipping ? `
                  <div class="tracking-box">
                    <h4>📦 Endereço de Entrega:</h4>
                    <p>
                      ${data.shipping.address?.street || ''}<br>
                      ${data.shipping.address?.city || ''} - ${data.shipping.address?.state || ''}<br>
                      CEP: ${data.shipping.address?.postalCode || ''}
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">
                      Você receberá o código de rastreio assim que o pedido for enviado.
                    </p>
                  </div>
                ` : ''}
                
                <p style="text-align: center;">
                  <a href="https://fayapoint.com/pt-BR/portal?tab=orders" class="button">
                    Ver Meus Pedidos
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>Obrigado por comprar na FayaPoint! 🚀</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_delivered':
      return {
        subject: `🎉 Pedido ${data.orderNumber} entregue!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #10b981, #059669);">
                <div class="success-icon">🎉</div>
                <h1>Pedido Entregue!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Seu pedido <strong>#${data.orderNumber}</strong> foi entregue com sucesso!</p>
                
                ${data.digitalDelivery ? `
                  <div class="digital-access">
                    <h4>🔓 Acesso Liberado:</h4>
                    <p>Seu conteúdo digital já está disponível!</p>
                    <p style="text-align: center;">
                      <a href="${data.digitalDelivery.accessUrl || 'https://fayapoint.com/pt-BR/portal'}" class="button">
                        Acessar Agora
                      </a>
                    </p>
                    ${data.digitalDelivery.googleDrive?.shareLink ? `
                      <p style="margin-top: 15px;">
                        <strong>Google Drive:</strong><br>
                        <a href="${data.digitalDelivery.googleDrive.shareLink}" target="_blank">
                          ${data.digitalDelivery.googleDrive.shareLink}
                        </a>
                      </p>
                    ` : ''}
                  </div>
                ` : ''}
                
                <h3>Itens Entregues:</h3>
                ${data.items.map(item => `
                  <div class="item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span style="color: #10b981;">✓ Entregue</span>
                  </div>
                `).join('')}
                
                <p style="text-align: center; margin-top: 20px;">
                  <a href="https://fayapoint.com/pt-BR/portal?tab=orders" class="button">
                    Ver Detalhes
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>Obrigado por confiar na FayaPoint! ❤️</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_shipped':
      return {
        subject: `📦 Pedido ${data.orderNumber} enviado! Rastreie sua entrega`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                <div class="success-icon">📦</div>
                <h1>Pedido Enviado!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Seu pedido <strong>#${data.orderNumber}</strong> está a caminho!</p>
                
                <div class="tracking-box">
                  <h4>🚚 Informações de Rastreio:</h4>
                  <p>
                    <strong>Transportadora:</strong> ${data.shipping?.carrier || 'A confirmar'}<br>
                    <strong>Código de Rastreio:</strong>
                  </p>
                  <p class="tracking-number">${data.shipping?.trackingNumber || 'Processando...'}</p>
                  ${data.shipping?.trackingUrl ? `
                    <p style="text-align: center; margin-top: 15px;">
                      <a href="${data.shipping.trackingUrl}" class="button" target="_blank">
                        Rastrear Pedido
                      </a>
                    </p>
                  ` : ''}
                </div>
                
                <h3>Itens Enviados:</h3>
                ${data.items.map(item => `
                  <div class="item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                  </div>
                `).join('')}
              </div>
              <div class="footer">
                <p>Aguarde seu pedido! 🚀</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'course_access':
      return {
        subject: `📚 Acesso liberado: ${data.items[0]?.name || 'Seu curso'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);">
                <div class="success-icon">📚</div>
                <h1>Acesso Liberado!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Seu acesso ao curso foi liberado com sucesso!</p>
                
                <div class="digital-access">
                  <h3>${data.items[0]?.name || 'Seu Curso'}</h3>
                  <p>Clique no botão abaixo para começar a estudar:</p>
                  <p style="text-align: center;">
                    <a href="${data.digitalDelivery?.accessUrl || 'https://fayapoint.com/pt-BR/portal?tab=courses'}" class="button">
                      Começar Curso
                    </a>
                  </p>
                  ${data.digitalDelivery?.googleDrive?.shareLink ? `
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <h4>📁 Material Complementar (Google Drive):</h4>
                    <p>
                      <a href="${data.digitalDelivery.googleDrive.shareLink}" target="_blank">
                        Acessar pasta de materiais
                      </a>
                    </p>
                  ` : ''}
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Dica: Você pode acessar seus cursos a qualquer momento pelo portal.
                </p>
              </div>
              <div class="footer">
                <p>Bons estudos! 🎓</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'subscription_activated':
      return {
        subject: `⭐ Plano ${data.items[0]?.name || 'Premium'} ativado!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #f59e0b, #f97316);">
                <div class="success-icon">⭐</div>
                <h1>Plano Ativado!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Seu plano <strong>${data.items[0]?.name || 'Premium'}</strong> foi ativado com sucesso!</p>
                
                <div class="digital-access" style="background: #fef3c7; border-color: #f59e0b;">
                  <h4>🎁 Benefícios desbloqueados:</h4>
                  <ul>
                    <li>Acesso a recursos premium</li>
                    <li>Suporte prioritário</li>
                    <li>Novos cursos e ferramentas</li>
                    <li>Geração de imagens ilimitada</li>
                  </ul>
                  <p style="text-align: center;">
                    <a href="https://fayapoint.com/pt-BR/portal" class="button">
                      Explorar Recursos
                    </a>
                  </p>
                </div>
              </div>
              <div class="footer">
                <p>Aproveite ao máximo! 🚀</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_failed':
      return {
        subject: `⚠️ Problema com o pedido ${data.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                <div class="success-icon">⚠️</div>
                <h1>Problema no Pedido</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Infelizmente houve um problema ao processar seu pedido <strong>#${data.orderNumber}</strong>.</p>
                
                <p>Nossa equipe já foi notificada e entrará em contato em breve para resolver.</p>
                
                <p style="text-align: center;">
                  <a href="https://fayapoint.com/pt-BR/contato" class="button">
                    Entrar em Contato
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>Pedimos desculpas pelo inconveniente.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'tracking_update':
      return {
        subject: `📍 Atualização: Pedido ${data.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">📍</div>
                <h1>Atualização do Pedido</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.userName}</strong>,</p>
                <p>Há uma atualização no seu pedido <strong>#${data.orderNumber}</strong>.</p>
                
                <div class="tracking-box">
                  <p class="tracking-number">${data.shipping?.trackingNumber || ''}</p>
                  ${data.shipping?.trackingUrl ? `
                    <p style="text-align: center;">
                      <a href="${data.shipping.trackingUrl}" class="button" target="_blank">
                        Ver Rastreio Completo
                      </a>
                    </p>
                  ` : ''}
                </div>
              </div>
              <div class="footer">
                <p>FayaPoint - Seu pedido está a caminho!</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: `Pedido ${data.orderNumber} - FayaPoint`,
        html: `<p>Atualização do pedido ${data.orderNumber}</p>`,
      };
  }
}

/**
 * Send admin notification for new orders
 */
export async function sendAdminNotification(
  type: 'new_order' | 'fulfillment_failed' | 'high_value_order',
  data: EmailData
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'ricardofaya@gmail.com';
  
  await sendFulfillmentEmail(adminEmail, 'order_confirmed', data);
}

export default {
  sendFulfillmentEmail,
  sendAdminNotification,
};
