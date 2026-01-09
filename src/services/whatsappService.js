// services/whatsappService.js
require('dotenv').config();
const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Send payment request via WhatsApp
   */
  async sendPaymentRequest(phoneNumber, customerName, amount, transactionId) {
    try {
      console.log('📱 Sending WhatsApp payment request:', {
        to: phoneNumber,
        customerName,
        amount,
        transactionId
      });

      // Format phone number
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      
      // Create message
      const message = this.createPaymentRequestMessage(
        customerName, 
        amount, 
        transactionId
      );

      // Send message
      const response = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: formattedPhone,
        statusCallback: `${process.env.WEBHOOK_BASE_URL}/api/payments/message-status`
      });

      console.log('✅ WhatsApp message sent successfully:', {
        messageId: response.sid,
        status: response.status,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status,
        timestamp: new Date(),
        error: null
      };

    } catch (error) {
      console.error('❌ WhatsApp send error:', {
        error: error.message,
        code: error.code,
        to: phoneNumber
      });

      return {
        success: false,
        messageId: null,
        status: 'FAILED',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneForWhatsApp(phoneNumber) {
    try {
      // Remove all non-digits
      let cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // Handle Kenyan phone numbers
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '254' + cleanNumber.substring(1);
      } else if (cleanNumber.startsWith('7') && cleanNumber.length === 9) {
        cleanNumber = '254' + cleanNumber;
      } else if (!cleanNumber.startsWith('254')) {
        cleanNumber = '254' + cleanNumber;
      }
      
      // Ensure it's exactly 12 digits (254XXXXXXXXX)
      if (cleanNumber.length === 12 && cleanNumber.startsWith('254')) {
        return `whatsapp:+${cleanNumber}`;
      } else {
        throw new Error(`Invalid phone number format: ${phoneNumber} -> ${cleanNumber}`);
      }
    } catch (error) {
      console.error('Phone number formatting error:', error);
      throw error;
    }
  }

  /**
   * Create payment request message
   */
  createPaymentRequestMessage(customerName, amount, transactionId) {
    const timestamp = new Date().toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const date = new Date().toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'long' 
    });

    return `📱 *MPESA Payment Request*\n\nDear ${customerName},\n\nYou have a payment request for *KES ${amount.toLocaleString()}*.\n\n*Transaction ID:* ${transactionId}\n*Date:* ${date}\n*Time:* ${timestamp}\n\nTo complete payment:\n\n1. Open MPESA\n2. Select "Lipa na MPESA"\n3. Select "Pay Bill"\n4. Business No: *123456*\n5. Account No: ${transactionId}\n6. Amount: ${amount}\n7. Enter your MPESA PIN\n\n⚠️ *Security Notice:*\n• Never share your PIN\n• This is an automated request\n• Contact support if unsure\n\nThank you,\nLoan Collections System`;
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(phoneNumber, transaction) {
    try {
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      const message = this.createReceiptMessage(transaction);

      const response = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: formattedPhone
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };

    } catch (error) {
      console.error('Receipt send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create receipt message
   */
  createReceiptMessage(transaction) {
    const timestamp = new Date().toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const date = new Date().toLocaleDateString('en-KE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    return `✅ *PAYMENT CONFIRMED*\n\n*Receipt No:* ${transaction.mpesaReceiptNumber}\n*Amount:* KES ${transaction.amount.toLocaleString()}\n*Date:* ${date}\n*Time:* ${timestamp}\n*Phone:* ${transaction.phoneNumber}\n*Transaction ID:* ${transaction.transactionId}\n\n*New Loan Balance:* KES ${transaction.loanBalanceAfter.toLocaleString()}\n*New Arrears:* KES ${transaction.arrearsAfter.toLocaleString()}\n\nThank you for your payment!`;
  }

  /**
   * Send reminder message
   */
  async sendReminder(phoneNumber, customerName, arrears, transactionId) {
    try {
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      const message = `🔔 *Payment Reminder*\n\nDear ${customerName},\n\nYour outstanding arrears: *KES ${arrears.toLocaleString()}*\nTransaction ID: ${transactionId}\n\nPlease make payment to avoid penalties.\n\nThank you.`;

      const response = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: formattedPhone
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };

    } catch (error) {
      console.error('Reminder send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify phone number is valid for WhatsApp
   */
  async validatePhoneNumber(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      return {
        valid: true,
        formatted: formattedPhone,
        original: phoneNumber
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        original: phoneNumber
      };
    }
  }
}

module.exports = new WhatsAppService();