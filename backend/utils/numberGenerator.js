import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';

/**
 * Generate unique invoice number with format: INV-YYYYMMDD-XXXXXX
 * @returns {Promise<string>} Generated invoice number
 */
export const generateInvoiceNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}`;

  // Find the last invoice for today
  const lastInvoice = await Transaction.findOne({
    invoiceNumber: { $regex: `^${datePrefix}` }
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  let sequence = 1;
  
  if (lastInvoice && lastInvoice.invoiceNumber) {
    // Extract sequence number from last invoice
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  // Format sequence with 6 digits
  const sequenceStr = String(sequence).padStart(6, '0');
  
  return `${datePrefix}-${sequenceStr}`;
};

/**
 * Generate unique receipt number with format: PAY-YYYYMMDD-XXXXXX
 * @returns {Promise<string>} Generated receipt number
 */
export const generateReceiptNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `PAY-${year}${month}${day}`;

  // Find the last receipt for today
  const lastReceipt = await Payment.findOne({
    receiptNumber: { $regex: `^${datePrefix}` }
  })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber')
    .lean();

  let sequence = 1;
  
  if (lastReceipt && lastReceipt.receiptNumber) {
    // Extract sequence number from last receipt
    const lastSequence = parseInt(lastReceipt.receiptNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  // Format sequence with 6 digits
  const sequenceStr = String(sequence).padStart(6, '0');
  
  return `${datePrefix}-${sequenceStr}`;
};

/**
 * Validate if invoice number is unique
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {Promise<boolean>} True if unique, false otherwise
 */
export const isInvoiceNumberUnique = async (invoiceNumber) => {
  const existingInvoice = await Transaction.findOne({ invoiceNumber }).lean();
  return !existingInvoice;
};

/**
 * Validate if receipt number is unique
 * @param {string} receiptNumber - Receipt number to validate
 * @returns {Promise<boolean>} True if unique, false otherwise
 */
export const isReceiptNumberUnique = async (receiptNumber) => {
  const existingReceipt = await Payment.findOne({ receiptNumber }).lean();
  return !existingReceipt;
};
