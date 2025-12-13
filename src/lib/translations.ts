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
    
    // Language
    language: "Lugha",
    english: "Kiingereza",
    kiswahili: "Kiswahili",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
