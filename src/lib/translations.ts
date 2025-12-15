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
    
    // Monthly Report Page
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
    
    // Language
    language: "Language",
    english: "English",
    kiswahili: "Kiswahili",
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
    
    // Monthly Report Page
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
    
    // Language
    language: "Lugha",
    english: "Kiingereza",
    kiswahili: "Kiswahili",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
