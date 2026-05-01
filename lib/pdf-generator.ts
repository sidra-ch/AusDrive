import PDFDocument from 'pdfkit';
import { Stream } from 'stream';

export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  items: Array<{
    description: string;
    amount: number; // in AUD
  }>;
  subtotal: number;
  gstAmount: number;
  total: number;
}

export interface AgreementData {
  agreementNumber: string;
  date: Date;
  customerName: string;
  licenseNumber: string;
  carMakeModel: string;
  carPlate: string;
  pickupDate: Date;
  dropoffDate: Date;
  dailyRate: number;
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('TAX INVOICE', { align: 'right' });
      doc.fontSize(10).text('AusDrive Premium', 50, 50);
      doc.text('ABN: 12 345 678 901');
      doc.text('123 Sydney Road');
      doc.text('Sydney, NSW 2000');
      doc.text('Australia');

      doc.moveDown(2);

      // Invoice Details
      doc.text(`Invoice Number: ${data.invoiceNumber}`);
      doc.text(`Date: ${data.date.toLocaleDateString('en-AU')}`);
      doc.moveDown();

      // Bill To
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).text(data.customerName);
      doc.text(data.customerEmail);
      if (data.customerAddress) doc.text(data.customerAddress);

      doc.moveDown(2);

      // Items Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount (AUD)', 400, tableTop, { align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
      doc.font('Helvetica');

      // Items
      let y = tableTop + 25;
      data.items.forEach(item => {
        doc.text(item.description, 50, y);
        doc.text(`$${item.amount.toFixed(2)}`, 400, y, { align: 'right' });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(500, y).stroke();
      y += 15;

      // Totals
      doc.text('Subtotal:', 300, y);
      doc.text(`$${data.subtotal.toFixed(2)}`, 400, y, { align: 'right' });
      y += 20;

      doc.text('GST (10%):', 300, y);
      doc.text(`$${data.gstAmount.toFixed(2)}`, 400, y, { align: 'right' });
      y += 20;

      doc.font('Helvetica-Bold');
      doc.text('Total Amount:', 300, y);
      doc.text(`$${data.total.toFixed(2)}`, 400, y, { align: 'right' });

      // Footer
      doc.moveDown(4);
      doc.font('Helvetica').fontSize(10).text('Thank you for choosing AusDrive Premium!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateRentalAgreementPDF(data: AgreementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(18).text('VEHICLE RENTAL AGREEMENT', { align: 'center', underline: true });
      doc.moveDown(2);

      doc.fontSize(12).text(`Agreement #: ${data.agreementNumber}`);
      doc.text(`Date: ${data.date.toLocaleDateString('en-AU')}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('1. THE PARTIES');
      doc.font('Helvetica').text(`This agreement is made between AusDrive Premium ("Owner") and ${data.customerName} ("Renter").`);
      doc.text(`Renter License Number: ${data.licenseNumber}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('2. THE VEHICLE');
      doc.font('Helvetica').text(`Vehicle Make & Model: ${data.carMakeModel}`);
      doc.text(`Registration Plate: ${data.carPlate}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('3. RENTAL PERIOD');
      doc.font('Helvetica').text(`Pickup: ${data.pickupDate.toLocaleString('en-AU')}`);
      doc.text(`Dropoff: ${data.dropoffDate.toLocaleString('en-AU')}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('4. TERMS AND CONDITIONS');
      doc.font('Helvetica').text('1. The Renter agrees to return the Vehicle in the same condition as received.');
      doc.text('2. The Renter is responsible for any traffic fines, tolls, or damage during the rental period.');
      doc.text('3. The Vehicle shall not be driven by anyone other than the Renter.');
      doc.text('4. Smoking and pets are strictly prohibited inside the Vehicle.');
      doc.text('5. A cleaning fee will be applied if the Vehicle is returned unreasonably dirty.');
      doc.moveDown(3);

      doc.text('_________________________                  _________________________');
      doc.text('AusDrive Representative                    Renter Signature');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
