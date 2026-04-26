import Medicine from '../models/Medicine.js';

const normalizeMedicineText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getPrescribedMedicineName = (item = {}) =>
  item.name || item.medicineName || item.drugName || item.medication || '';

const getPrescribedQuantity = (item = {}) => {
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? Math.ceil(quantity) : 1;
};

const findInventoryMatch = (prescribedName, medicines) => {
  const normalizedPrescribed = normalizeMedicineText(prescribedName);
  if (!normalizedPrescribed) return null;

  return medicines.find((medicine) => {
    const normalizedInventoryName = normalizeMedicineText(medicine.name);
    return (
      normalizedInventoryName === normalizedPrescribed ||
      normalizedPrescribed.includes(normalizedInventoryName) ||
      normalizedInventoryName.includes(normalizedPrescribed)
    );
  }) || null;
};

export async function buildPrescriptionOrderPricing(prescription) {
  const prescribedMedicines = Array.isArray(prescription?.medicines)
    ? prescription.medicines
    : [];

  if (prescribedMedicines.length === 0) {
    return {
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      pricingNotes: ['No medicines were recorded on this prescription. Pharmacist must add pricing manually.']
    };
  }

  const medicines = await Medicine.find({ isActive: true }).select('_id name price stock requiresPrescription');
  const items = [];
  const pricingNotes = [];

  for (const prescribedMedicine of prescribedMedicines) {
    const prescribedName = getPrescribedMedicineName(prescribedMedicine);
    const quantity = getPrescribedQuantity(prescribedMedicine);
    const matchedMedicine = findInventoryMatch(prescribedName, medicines);

    if (!matchedMedicine) {
      pricingNotes.push(`${prescribedName || 'Unnamed medicine'} was not found in inventory.`);
      continue;
    }

    if (Number(matchedMedicine.stock || 0) < quantity) {
      pricingNotes.push(`${matchedMedicine.name} is out of stock or below requested quantity (${quantity}).`);
      continue;
    }

    items.push({
      medicineId: matchedMedicine._id,
      name: matchedMedicine.name,
      price: matchedMedicine.price,
      quantity,
      requiresPrescription: matchedMedicine.requiresPrescription
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const deliveryFee = items.length > 0 ? 2.5 : 0;

  return {
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    pricingNotes
  };
}
