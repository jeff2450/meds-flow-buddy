export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          performed_at: string
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          performed_at?: string
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          performed_at?: string
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      controlled_drugs_log: {
        Row: {
          closing_balance: number
          compliance_confirmed: boolean | null
          created_at: string
          id: string
          log_date: string
          medicine_id: string
          notes: string | null
          opening_balance: number
          organization_id: string | null
          prescriber_reference: string | null
          quantity_dispensed: number
          quantity_received: number
          recorded_by: string | null
          variance: number | null
        }
        Insert: {
          closing_balance?: number
          compliance_confirmed?: boolean | null
          created_at?: string
          id?: string
          log_date?: string
          medicine_id: string
          notes?: string | null
          opening_balance?: number
          organization_id?: string | null
          prescriber_reference?: string | null
          quantity_dispensed?: number
          quantity_received?: number
          recorded_by?: string | null
          variance?: number | null
        }
        Update: {
          closing_balance?: number
          compliance_confirmed?: boolean | null
          created_at?: string
          id?: string
          log_date?: string
          medicine_id?: string
          notes?: string | null
          opening_balance?: number
          organization_id?: string | null
          prescriber_reference?: string | null
          quantity_dispensed?: number
          quantity_received?: number
          recorded_by?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "controlled_drugs_log_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controlled_drugs_log_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controlled_drugs_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          credit_balance: number
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          organization_id: string
          payment_method: string | null
          recorded_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          organization_id: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          organization_id?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_sales: {
        Row: {
          amount_paid: number
          balance_due: number
          created_at: string
          customer_id: string | null
          id: string
          is_prescription: boolean | null
          medicine_id: string
          notes: string | null
          organization_id: string | null
          payment_method: string
          payment_reference: string | null
          quantity_sold: number
          receipt_number: string | null
          recorded_by: string | null
          sale_date: string
          total_amount: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          is_prescription?: boolean | null
          medicine_id: string
          notes?: string | null
          organization_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          quantity_sold: number
          receipt_number?: string | null
          recorded_by?: string | null
          sale_date: string
          total_amount?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          is_prescription?: boolean | null
          medicine_id?: string
          notes?: string | null
          organization_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          quantity_sold?: number
          receipt_number?: string | null
          recorded_by?: string | null
          sale_date?: string
          total_amount?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sales_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sales_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          batch_number: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          current_stock: number
          entry_date: string | null
          expiry_date: string | null
          id: string
          medicine_type: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level: number
          name: string
          organization_id: string | null
          selling_price: number | null
          total_stock: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          entry_date?: string | null
          expiry_date?: string | null
          id?: string
          medicine_type?: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level?: number
          name: string
          organization_id?: string | null
          selling_price?: number | null
          total_stock?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          entry_date?: string | null
          expiry_date?: string | null
          id?: string
          medicine_type?: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level?: number
          name?: string
          organization_id?: string | null
          selling_price?: number | null
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string
          recorded_by: string | null
          reference_number: string | null
          sale_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          sale_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "medicine_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          invoice_number: string | null
          medicine_id: string
          notes: string | null
          organization_id: string
          payment_status: string
          purchase_date: string
          quantity: number
          recorded_by: string | null
          supplier_id: string | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          amount_paid?: number
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          invoice_number?: string | null
          medicine_id: string
          notes?: string | null
          organization_id: string
          payment_status?: string
          purchase_date?: string
          quantity: number
          recorded_by?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number
        }
        Update: {
          amount_paid?: number
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          invoice_number?: string | null
          medicine_id?: string
          notes?: string | null
          organization_id?: string
          payment_status?: string
          purchase_date?: string
          quantity?: number
          recorded_by?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_counters: {
        Row: {
          next_number: number
          organization_id: string
        }
        Insert: {
          next_number?: number
          organization_id: string
        }
        Update: {
          next_number?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjustment_date: string
          adjustment_type: string
          created_at: string
          id: string
          medicine_id: string
          notes: string | null
          organization_id: string | null
          quantity: number
          recorded_by: string | null
          value: number | null
        }
        Insert: {
          adjustment_date?: string
          adjustment_type: string
          created_at?: string
          id?: string
          medicine_id: string
          notes?: string | null
          organization_id?: string | null
          quantity: number
          recorded_by?: string | null
          value?: number | null
        }
        Update: {
          adjustment_date?: string
          adjustment_type?: string
          created_at?: string
          id?: string
          medicine_id?: string
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          recorded_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          notes: string | null
          organization_id: string | null
          quantity: number
          recorded_by: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          notes?: string | null
          organization_id?: string | null
          quantity: number
          recorded_by?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          recorded_by?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      medicines_staff_view: {
        Row: {
          current_stock: number | null
          id: string | null
          medicine_type: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level: number | null
          name: string | null
          organization_id: string | null
        }
        Insert: {
          current_stock?: number | null
          id?: string | null
          medicine_type?: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level?: number | null
          name?: string | null
          organization_id?: string | null
        }
        Update: {
          current_stock?: number | null
          id?: string | null
          medicine_type?: Database["public"]["Enums"]["medicine_type"] | null
          min_stock_level?: number | null
          name?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_next_folio_number: { Args: never; Returns: number }
      get_user_list_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email_masked: string
          full_name: string
          id: string
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_receipt_number: { Args: { _org_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "worker" | "manager" | "pharmacist" | "staff"
      medicine_type: "prescription" | "otc" | "controlled" | "medical_supplies"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "worker", "manager", "pharmacist", "staff"],
      medicine_type: ["prescription", "otc", "controlled", "medical_supplies"],
    },
  },
} as const
