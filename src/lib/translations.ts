export type Language = "en" | "sw";

export const translations = {
  en: {
    // Header
    appTitle: "Pharmaceutical Inventory",
    appSubtitle: "Manage your medicine stock efficiently",
    monthlyReport: "Monthly Report",
    recordSales: "Record Sales",
    logout: "Logout",
    
    // Tabs
    inventory: "Inventory",
    sales: "Sales",
    userManagement: "User Management",
    
    // Dashboard
    overview: "Overview",
    totalMedicines: "Total Medicines",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    totalSales: "Total Sales",
    
    // Medicine Table
    medicines: "Medicines",
    name: "Name",
    category: "Category",
    currentStock: "Current Stock",
    minStockLevel: "Min Stock Level",
    entryDate: "Entry Date",
    actions: "Actions",
    noMedicinesFound: "No medicines found",
    search: "Search",
    searchMedicines: "Search medicines...",
    
    // Add Medicine Dialog
    addMedicine: "Add Medicine",
    addNewMedicine: "Add New Medicine",
    addNewMedicineDesc: "Add a new medicine batch to your inventory",
    medicineName: "Medicine Name",
    selectCategory: "Select category",
    initialStock: "Initial Stock",
    cancel: "Cancel",
    
    // Transaction Dialog
    recordIntake: "Record Intake",
    stockIntake: "Stock Intake",
    recordStockIntake: "Record new stock intake for medicines",
    selectMedicine: "Select medicine",
    quantity: "Quantity",
    notes: "Notes",
    optionalNotes: "Optional notes about this intake...",
    submit: "Submit",
    
    // Sales Table
    salesRecords: "Sales Records",
    medicine: "Medicine",
    quantitySold: "Quantity Sold",
    unitPrice: "Unit Price",
    totalAmount: "Total Amount",
    saleDate: "Sale Date",
    noSalesFound: "No sales records found",
    
    // User Management
    manageUsers: "Manage Users",
    manageUsersDesc: "Register workers and manage user roles",
    registerWorker: "Register Worker",
    registerNewWorker: "Register New Worker",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    register: "Register",
    registeredUsers: "Registered Users",
    worker: "Worker",
    admin: "Admin",
    makeAdmin: "Make Admin",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    available: "available",
    backToDashboard: "Back to Dashboard",
    
    // Sales Recording Page
    recordDailySales: "Record Daily Sales",
    enterSalesForDate: "Enter all medicine sales for the selected date",
    selectDate: "Select Date",
    chooseDateForSales: "Choose the date for these sales records",
    salesEntries: "Sales Entries",
    addMedicinesSoldOn: "Add all medicines sold on",
    addEntry: "Add Entry",
    entry: "Entry",
    autoSaved: "Auto-saved",
    medicineBatch: "Medicine Batch",
    selectBatch: "Select batch",
    unitPriceDollar: "Unit Price ($)",
    subtotal: "Subtotal",
    notesOptional: "Notes (Optional)",
    addNotes: "Add any notes...",
    totalFor: "Total for",
    saveDailySales: "Save Daily Sales",
    allSaved: "All saved",
    allEntriesAlreadySaved: "All entries are already saved.",
    dailySalesSaved: "Daily sales saved",
    successfullySavedEntries: "Successfully saved entries for",
    validationError: "Validation Error",
    insufficientStock: "Insufficient Stock",
    onlyUnitsAvailable: "Only units available",
    
    // Monthly Report Page - Basic
    analyzeMonthlyData: "Analyze monthly sales and stock data",
    totalRevenue: "Total Revenue",
    forMonth: "For",
    unitsSold: "Units Sold",
    totalQuantitySold: "Total quantity sold",
    medicinesSold: "Medicines Sold",
    differentMedicines: "Different medicines",
    totalUnitsAvailable: "Total units available",
    salesByMedicine: "Sales by Medicine",
    revenueBreakdownFor: "Revenue breakdown for",
    noSalesDataForMonth: "No sales data for this month",
    salesDetails: "Sales Details",
    breakdownByMedicine: "Breakdown by medicine for",
    totalRevenueLabel: "Total Revenue",
    avgPricePerUnit: "Avg Price/Unit",
    noSalesRecordedForMonth: "No sales recorded for this month",
    
    // Monthly Report - Sales Summary
    salesSummary: "Sales Summary",
    totalSalesValue: "Total Sales Value",
    totalTransactions: "Total Transactions",
    prescriptionSales: "Prescription Sales",
    otcSales: "OTC Sales",
    averageSaleValue: "Average Sale Value",
    monthComparison: "vs Previous Month",
    increase: "increase",
    decrease: "decrease",
    noChange: "no change",
    
    // Monthly Report - Sales Breakdown
    salesBreakdown: "Sales Breakdown",
    byCategory: "By Category",
    byProduct: "By Product",
    prescriptionMedicines: "Prescription Medicines",
    otcMedicines: "OTC Medicines",
    controlledDrugs: "Controlled Drugs",
    medicalSupplies: "Medical Supplies",
    topSellingMedicines: "Top 10 Best-Selling",
    leastSellingMedicines: "Least-Selling Medicines",
    quantitySoldLabel: "Quantity Sold",
    revenuePerMedicine: "Revenue per Medicine",
    
    // Monthly Report - Inventory Status
    inventoryStatus: "Inventory Status (Critical)",
    openingStock: "Opening Stock Balance",
    closingStock: "Closing Stock Balance",
    currentStockOnHand: "Current Stock on Hand",
    stockValueCost: "Stock Value (Cost)",
    stockValueSelling: "Stock Value (Selling)",
    outOfStockMedicines: "Out-of-Stock Medicines",
    lowStockMedicines: "Low-Stock Medicines",
    overstockedMedicines: "Overstocked Medicines",
    
    // Monthly Report - Stock Movement
    stockMovementSummary: "Stock Movement Summary",
    totalStockReceived: "Total Stock Received",
    totalStockIssued: "Total Stock Issued/Sold",
    netStockChange: "Net Stock Change",
    stockAdjustments: "Stock Adjustments",
    
    // Monthly Report - Controlled Drugs
    controlledDrugsReport: "Controlled Drugs Report",
    legalRequirement: "Legal Requirement",
    openingBalance: "Opening Balance",
    quantityReceived: "Quantity Received",
    quantityDispensed: "Quantity Dispensed",
    closingBalance: "Closing Balance",
    prescriberReference: "Prescriber Reference",
    variancesDiscrepancies: "Variances/Discrepancies",
    complianceConfirmed: "Compliance Confirmed",
    
    // Monthly Report - Losses & Returns
    lossesReturnsAdjustments: "Losses, Returns & Adjustments",
    damagedMedicines: "Damaged Medicines",
    expiredWriteOffs: "Expired Write-offs",
    customerReturns: "Customer Returns",
    supplierReturns: "Supplier Returns",
    theftUnexplainedLosses: "Theft/Unexplained Losses",
    totalLossValue: "Total Loss Value",
    lossPercentage: "Loss % of Inventory",
    
    // Monthly Report - Audit & Activity
    auditUserActivity: "Audit & User Activity",
    salesPerStaff: "Sales per Staff",
    stockIntakePerUser: "Stock Intake per User",
    adjustmentsPerUser: "Adjustments per User",
    deletedEditedRecords: "Deleted/Edited Records",
    adminOnly: "Admin Only",
    auditTrail: "Audit Trail",
    timestamp: "Timestamp",
    actionType: "Action",
    performedBy: "Performed By",
    
    // Monthly Report - Financial Summary
    financialSummary: "Financial Summary",
    costOfGoodsSold: "Cost of Goods Sold (COGS)",
    grossProfit: "Gross Profit",
    grossProfitMargin: "Gross Profit Margin",
    highMarginMedicines: "High-Margin Medicines",
    lowMarginMedicines: "Low-Margin Medicines",
    
    // Monthly Report - Export
    exportCompliance: "Export & Compliance",
    printPDF: "Print PDF",
    exportExcel: "Export Excel/CSV",
    secureArchive: "Secure Archive",
    pharmacistSignature: "Pharmacist-in-Charge Signature",
    signatureDate: "Date",
    signatureName: "Name",
    
    // Language
    language: "Language",
    english: "English",
    kiswahili: "Kiswahili",
    
    // Additional
    units: "units",
    currency: "TZS",
    noData: "No data available",
    viewDetails: "View Details",
    transactions: "transactions",
    
    // Staff Performance (Admin)
    totalTeamSales: "Total Team Sales",
    topPerformer: "Top Performer",
    averageSalesPerStaff: "Avg. Sales per Staff",
    performance: "Performance",
    teamShare: "Team Share",
    date: "Date",
    noSalesDetails: "No sales details available",
    
    // Attendance
    attendance: "Attendance",
    clockIn: "Clock In",
    clockOut: "Clock Out",
    clockedInAt: "Clocked in at",
    status: "Status",
    attendanceManagement: "Attendance Management",
    monitorStaffAttendance: "Monitor staff attendance and work hours",
    staffMember: "Staff Member",
    duration: "Duration",
    
    // Inventory View
    allInventory: "All Inventory",
    viewAllProducts: "View all products in inventory",
  },
  sw: {
    // Header
    appTitle: "Hesabu ya Dawa",
    appSubtitle: "Simamia hisa yako ya dawa kwa ufanisi",
    monthlyReport: "Ripoti ya Mwezi",
    recordSales: "Rekodi Mauzo",
    logout: "Ondoka",
    
    // Tabs
    inventory: "Hesabu",
    sales: "Mauzo",
    userManagement: "Usimamizi wa Watumiaji",
    
    // Dashboard
    overview: "Muhtasari",
    totalMedicines: "Jumla ya Dawa",
    lowStock: "Hisa Chini",
    outOfStock: "Hisa Imeisha",
    totalSales: "Jumla ya Mauzo",
    
    // Medicine Table
    medicines: "Dawa",
    name: "Jina",
    category: "Aina",
    currentStock: "Hisa ya Sasa",
    minStockLevel: "Kiwango cha Chini cha Hisa",
    entryDate: "Tarehe ya Kuingiza",
    actions: "Vitendo",
    noMedicinesFound: "Hakuna dawa zilizopatikana",
    search: "Tafuta",
    searchMedicines: "Tafuta dawa...",
    
    // Add Medicine Dialog
    addMedicine: "Ongeza Dawa",
    addNewMedicine: "Ongeza Dawa Mpya",
    addNewMedicineDesc: "Ongeza kundi jipya la dawa kwenye hesabu yako",
    medicineName: "Jina la Dawa",
    selectCategory: "Chagua aina",
    initialStock: "Hisa ya Awali",
    cancel: "Ghairi",
    
    // Transaction Dialog
    recordIntake: "Rekodi Upokeaji",
    stockIntake: "Upokeaji wa Hisa",
    recordStockIntake: "Rekodi upokeaji mpya wa hisa kwa dawa",
    selectMedicine: "Chagua dawa",
    quantity: "Kiasi",
    notes: "Maelezo",
    optionalNotes: "Maelezo ya hiari kuhusu upokeaji huu...",
    submit: "Wasilisha",
    
    // Sales Table
    salesRecords: "Rekodi za Mauzo",
    medicine: "Dawa",
    quantitySold: "Kiasi Kilichouzwa",
    unitPrice: "Bei ya Kitengo",
    totalAmount: "Jumla ya Kiasi",
    saleDate: "Tarehe ya Mauzo",
    noSalesFound: "Hakuna rekodi za mauzo zilizopatikana",
    
    // User Management
    manageUsers: "Simamia Watumiaji",
    manageUsersDesc: "Sajili wafanyakazi na simamia majukumu ya watumiaji",
    registerWorker: "Sajili Mfanyakazi",
    registerNewWorker: "Sajili Mfanyakazi Mpya",
    fullName: "Jina Kamili",
    email: "Barua Pepe",
    password: "Nenosiri",
    register: "Sajili",
    registeredUsers: "Watumiaji Waliosajiliwa",
    worker: "Mfanyakazi",
    admin: "Msimamizi",
    makeAdmin: "Fanya Msimamizi",
    
    // Common
    loading: "Inapakia...",
    error: "Kosa",
    success: "Imefanikiwa",
    save: "Hifadhi",
    delete: "Futa",
    edit: "Hariri",
    confirm: "Thibitisha",
    available: "inapatikana",
    backToDashboard: "Rudi kwenye Dashibodi",
    
    // Sales Recording Page
    recordDailySales: "Rekodi Mauzo ya Kila Siku",
    enterSalesForDate: "Ingiza mauzo yote ya dawa kwa tarehe iliyochaguliwa",
    selectDate: "Chagua Tarehe",
    chooseDateForSales: "Chagua tarehe kwa rekodi hizi za mauzo",
    salesEntries: "Ingizo za Mauzo",
    addMedicinesSoldOn: "Ongeza dawa zote zilizouzwa tarehe",
    addEntry: "Ongeza Ingizo",
    entry: "Ingizo",
    autoSaved: "Imehifadhiwa",
    medicineBatch: "Kundi la Dawa",
    selectBatch: "Chagua kundi",
    unitPriceDollar: "Bei ya Kitengo ($)",
    subtotal: "Jumla ndogo",
    notesOptional: "Maelezo (Hiari)",
    addNotes: "Ongeza maelezo yoyote...",
    totalFor: "Jumla ya",
    saveDailySales: "Hifadhi Mauzo ya Siku",
    allSaved: "Yote yamehifadhiwa",
    allEntriesAlreadySaved: "Ingizo zote zimeshahifadhiwa.",
    dailySalesSaved: "Mauzo ya siku yamehifadhiwa",
    successfullySavedEntries: "Imehifadhiwa kwa mafanikio ingizo za",
    validationError: "Kosa la Uthibitishaji",
    insufficientStock: "Hisa Haitoshi",
    onlyUnitsAvailable: "Vitengo vilivyopatikana tu",
    
    // Monthly Report Page - Basic
    analyzeMonthlyData: "Changanua mauzo ya kila mwezi na data ya hisa",
    totalRevenue: "Jumla ya Mapato",
    forMonth: "Kwa",
    unitsSold: "Vitengo Vilivyouzwa",
    totalQuantitySold: "Jumla ya kiasi kilichouzwa",
    medicinesSold: "Dawa Zilizouzwa",
    differentMedicines: "Dawa tofauti",
    totalUnitsAvailable: "Jumla ya vitengo vinavyopatikana",
    salesByMedicine: "Mauzo kwa Dawa",
    revenueBreakdownFor: "Mgawanyo wa mapato kwa",
    noSalesDataForMonth: "Hakuna data ya mauzo kwa mwezi huu",
    salesDetails: "Maelezo ya Mauzo",
    breakdownByMedicine: "Mgawanyo kwa dawa kwa",
    totalRevenueLabel: "Jumla ya Mapato",
    avgPricePerUnit: "Bei ya Wastani/Kitengo",
    noSalesRecordedForMonth: "Hakuna mauzo yaliyorekodiwa kwa mwezi huu",
    
    // Monthly Report - Sales Summary
    salesSummary: "Muhtasari wa Mauzo",
    totalSalesValue: "Thamani ya Mauzo",
    totalTransactions: "Jumla ya Miamala",
    prescriptionSales: "Mauzo ya Dawa za Daktari",
    otcSales: "Mauzo ya OTC",
    averageSaleValue: "Wastani wa Mauzo",
    monthComparison: "vs Mwezi Uliopita",
    increase: "ongezeko",
    decrease: "pungufu",
    noChange: "hakuna mabadiliko",
    
    // Monthly Report - Sales Breakdown
    salesBreakdown: "Mgawanyo wa Mauzo",
    byCategory: "Kwa Aina",
    byProduct: "Kwa Bidhaa",
    prescriptionMedicines: "Dawa za Daktari",
    otcMedicines: "Dawa za OTC",
    controlledDrugs: "Dawa Zinazodhibitiwa",
    medicalSupplies: "Vifaa vya Matibabu",
    topSellingMedicines: "Dawa 10 Bora",
    leastSellingMedicines: "Dawa Zinazouzwa Kidogo",
    quantitySoldLabel: "Kiasi Kilichouzwa",
    revenuePerMedicine: "Mapato kwa Dawa",
    
    // Monthly Report - Inventory Status
    inventoryStatus: "Hali ya Hesabu (Muhimu)",
    openingStock: "Hisa ya Mwanzo",
    closingStock: "Hisa ya Mwisho",
    currentStockOnHand: "Hisa ya Sasa",
    stockValueCost: "Thamani ya Hisa (Gharama)",
    stockValueSelling: "Thamani ya Hisa (Kuuza)",
    outOfStockMedicines: "Dawa Zisizo na Hisa",
    lowStockMedicines: "Dawa za Hisa Chini",
    overstockedMedicines: "Dawa Zenye Hisa Nyingi",
    
    // Monthly Report - Stock Movement
    stockMovementSummary: "Muhtasari wa Mwendo wa Hisa",
    totalStockReceived: "Jumla ya Hisa Iliyopokelewa",
    totalStockIssued: "Jumla ya Hisa Iliyotolewa/Kuzwa",
    netStockChange: "Mabadiliko ya Hisa",
    stockAdjustments: "Marekebisho ya Hisa",
    
    // Monthly Report - Controlled Drugs
    controlledDrugsReport: "Ripoti ya Dawa Zinazodhibitiwa",
    legalRequirement: "Sharti la Kisheria",
    openingBalance: "Salio la Mwanzo",
    quantityReceived: "Kiasi Kilichopokelewa",
    quantityDispensed: "Kiasi Kilichotolewa",
    closingBalance: "Salio la Mwisho",
    prescriberReference: "Rejea ya Daktari",
    variancesDiscrepancies: "Tofauti/Makosa",
    complianceConfirmed: "Utiifu Umethibitishwa",
    
    // Monthly Report - Losses & Returns
    lossesReturnsAdjustments: "Hasara, Urejeshaji & Marekebisho",
    damagedMedicines: "Dawa Zilizoharibiwa",
    expiredWriteOffs: "Dawa Zilizoisha Muda",
    customerReturns: "Urejeshaji wa Mteja",
    supplierReturns: "Urejeshaji kwa Muuzaji",
    theftUnexplainedLosses: "Wizi/Hasara Zisizoeleweka",
    totalLossValue: "Jumla ya Thamani ya Hasara",
    lossPercentage: "% ya Hasara ya Hesabu",
    
    // Monthly Report - Audit & Activity
    auditUserActivity: "Ukaguzi & Shughuli za Mtumiaji",
    salesPerStaff: "Mauzo kwa Mfanyakazi",
    stockIntakePerUser: "Upokeaji wa Hisa kwa Mtumiaji",
    adjustmentsPerUser: "Marekebisho kwa Mtumiaji",
    deletedEditedRecords: "Rekodi Zilizofutwa/Kurekebishwa",
    adminOnly: "Wasimamizi Tu",
    auditTrail: "Historia ya Ukaguzi",
    timestamp: "Wakati",
    actionType: "Kitendo",
    performedBy: "Imefanywa na",
    
    // Monthly Report - Financial Summary
    financialSummary: "Muhtasari wa Fedha",
    costOfGoodsSold: "Gharama ya Bidhaa Zilizouzwa",
    grossProfit: "Faida Ghafi",
    grossProfitMargin: "Pembejeo ya Faida Ghafi",
    highMarginMedicines: "Dawa za Faida Kubwa",
    lowMarginMedicines: "Dawa za Faida Ndogo",
    
    // Monthly Report - Export
    exportCompliance: "Eksporti & Utiifu",
    printPDF: "Chapisha PDF",
    exportExcel: "Eksporti Excel/CSV",
    secureArchive: "Kumbukumbu Salama",
    pharmacistSignature: "Sahihi ya Mfamasia Mkuu",
    signatureDate: "Tarehe",
    signatureName: "Jina",
    
    // Language
    language: "Lugha",
    english: "Kiingereza",
    kiswahili: "Kiswahili",
    
    // Additional
    units: "vitengo",
    currency: "TZS",
    noData: "Hakuna data",
    viewDetails: "Tazama Maelezo",
    transactions: "miamala",
    
    // Staff Performance (Admin)
    totalTeamSales: "Jumla ya Mauzo ya Timu",
    topPerformer: "Mwenye Utendaji Bora",
    averageSalesPerStaff: "Wastani wa Mauzo kwa Mfanyakazi",
    performance: "Utendaji",
    teamShare: "Sehemu ya Timu",
    date: "Tarehe",
    noSalesDetails: "Hakuna maelezo ya mauzo",
    
    // Attendance
    attendance: "Mahudhurio",
    clockIn: "Ingia Kazini",
    clockOut: "Toka Kazini",
    clockedInAt: "Uliingia saa",
    status: "Hali",
    attendanceManagement: "Usimamizi wa Mahudhurio",
    monitorStaffAttendance: "Fuatilia mahudhurio na masaa ya kazi",
    staffMember: "Mfanyakazi",
    duration: "Muda",
    
    // Inventory View
    allInventory: "Hesabu Yote",
    viewAllProducts: "Tazama bidhaa zote kwenye hesabu",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;