export const WhatsAppService = {
    formatPhone(phone: string) {
        // Remove tudo que não é número
        const cleanPhone = phone.replace(/\D/g, "");

        // Adiciona o código do país (55) se não tiver
        if (cleanPhone.length <= 11) {
            return `55${cleanPhone}`;
        }
        return cleanPhone;
    },

    getNewLoanMessage(clientName: string, amount: string, dueDate: string) {
        return `Olá ${clientName}, confirmamos seu débito de R$ ${amount} conosco. Vencimento: ${dueDate}.`;
    },

    getDueSoonMessage(clientName: string, amount: string, dueDate: string, interestAmount: string) {
        return `Olá ${clientName}, seu empréstimo vence dia ${dueDate}.
        
Opções de pagamento:
1️⃣ Quitação total: R$ ${amount}
2️⃣ Renovação (só juros): R$ ${interestAmount}
        
Qual opção você prefere?`;
    },

    getOverdueMessage(clientName: string, amount: string, daysLate: number) {
        return `Olá ${clientName}, identificamos um atraso de ${daysLate} dias no seu pagamento.
Valor atualizado: R$ ${amount}
Por favor, entre em contato para regularizar.`;
    },

    getLink(phone: string, message: string) {
        const formattedPhone = this.formatPhone(phone);
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    },
};
