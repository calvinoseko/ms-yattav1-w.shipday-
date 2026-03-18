
const axios = require('axios');

class MpesaProvider {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.baseUrl = this.env === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke' 
      : 'https://api.safaricom.co.ke';
    
    // Token Caching
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if we have a valid cached token (buffer of 5 minutes)
    if (this.tokenCache && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.tokenCache;
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    try {
      const { data } = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      this.tokenCache = data.access_token;
      // Set expiry to 55 minutes from now (Token usually lasts 1 hour)
      this.tokenExpiry = new Date(new Date().getTime() + 55 * 60 * 1000);
      
      return data.access_token;
    } catch (error) {
      console.error('M-Pesa Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with payment provider');
    }
  }

  formatPhoneNumber(phone) {
    // Remove spaces, dashes, plus signs
    let p = phone.replace(/[\s\-\+]/g, '');
    
    // Handle 07... -> 2547...
    if (p.startsWith('0')) {
      return `254${p.substring(1)}`;
    }
    // Handle 7... -> 2547...
    if (p.startsWith('7') || p.startsWith('1')) {
      return `254${p}`;
    }
    // Handle 254... (Keep as is)
    if (p.startsWith('254')) {
      return p;
    }
    
    return p;
  }

  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hour = ('0' + date.getHours()).slice(-2);
    const minute = ('0' + date.getMinutes()).slice(-2);
    const second = ('0' + date.getSeconds()).slice(-2);
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  async initiatePayment({ amount, phone, orderId }) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

    const formattedPhone = this.formatPhoneNumber(phone);

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount), // M-Pesa accepts integers
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.API_URL}/api/v1/payments/callback/mpesa`,
      AccountReference: `Order-${orderId.toString().slice(-6)}`,
      TransactionDesc: `Payment for Order ${orderId}`
    };

    try {
      const { data } = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.ResponseCode === '0') {
        return {
          status: 'pending',
          providerReference: data.CheckoutRequestID,
          metadata: data
        };
      } else {
        throw new Error(data.ResponseDescription || 'STK Push failed');
      }
    } catch (error) {
      console.error('M-Pesa STK Error:', error.response?.data || error.message);
      throw new Error('Payment initiation failed at provider');
    }
  }

  verifyCallback(payload) {
    if (!payload?.Body?.stkCallback) return false;
    // In production: Verify IP whitelist (Safaricom IPs)
    return true;
  }

  parseCallback(payload) {
    const callback = payload.Body.stkCallback;
    const result = {
      success: callback.ResultCode === 0,
      providerReference: callback.CheckoutRequestID,
      transactionId: null,
      raw: payload
    };

    if (result.success && callback.CallbackMetadata) {
      const items = callback.CallbackMetadata.Item;
      const receiptItem = items.find(i => i.Name === 'MpesaReceiptNumber');
      if (receiptItem) {
        result.transactionId = receiptItem.Value;
      }
    }

    return result;
  }
}

module.exports = new MpesaProvider();
