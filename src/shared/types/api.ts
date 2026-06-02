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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_details: {
        Row: {
          billing_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          mandays: number
          project_id: string | null
          rate_per_manday: number
          role_id: string
          subtotal: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          mandays?: number
          project_id?: string | null
          rate_per_manday?: number
          role_id: string
          subtotal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          mandays?: number
          project_id?: string | null
          rate_per_manday?: number
          role_id?: string
          subtotal?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_details_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_details_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_details_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_projects: {
        Row: {
          billing_id: string
          project_id: string
        }
        Insert: {
          billing_id: string
          project_id: string
        }
        Update: {
          billing_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_projects_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      billings: {
        Row: {
          billing_number: string
          billing_period_end: string
          billing_period_start: string
          billing_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          remarks: string | null
          status: Database["public"]["Enums"]["billing_status"]
          total_amount: number
          total_mandays: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_number: string
          billing_period_end: string
          billing_period_start: string
          billing_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["billing_status"]
          total_amount?: number
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_number?: string
          billing_period_end?: string
          billing_period_start?: string
          billing_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["billing_status"]
          total_amount?: number
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_projects: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          platform: string | null
          project_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          platform?: string | null
          project_code: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          platform?: string | null
          project_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      member_roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          member_id: string
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          member_id: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          member_id?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      po_members: {
        Row: {
          actual_hours: number
          actual_mandays: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          end_date: string | null
          id: string
          is_billable: boolean
          po_id: string
          project_member_id: string
          rate_per_manday: number
          role_id: string
          start_date: string | null
          total_cost: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_hours?: number
          actual_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_billable?: boolean
          po_id: string
          project_member_id: string
          rate_per_manday?: number
          role_id: string
          start_date?: string | null
          total_cost?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_hours?: number
          actual_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_billable?: boolean
          po_id?: string
          project_member_id?: string
          rate_per_manday?: number
          role_id?: string
          start_date?: string | null
          total_cost?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_members_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_members_project_member_id_fkey"
            columns: ["project_member_id"]
            isOneToOne: false
            referencedRelation: "project_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_projects: {
        Row: {
          allocated_mandays: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          po_id: string
          project_id: string
          remarks: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allocated_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          po_id: string
          project_id: string
          remarks?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allocated_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          po_id?: string
          project_id?: string
          remarks?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_projects_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activities: {
        Row: {
          activity_name: string
          actual_end: string | null
          actual_start: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          details: string | null
          duration_days: number
          end_date: string | null
          feature: string | null
          id: string
          is_milestone: boolean
          mandays: number
          parent_id: string | null
          phase: Database["public"]["Enums"]["project_phase"]
          progress_pct: number
          project_id: string
          sort_order: number
          start_date: string | null
          sub_feature: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_name: string
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          details?: string | null
          duration_days?: number
          end_date?: string | null
          feature?: string | null
          id?: string
          is_milestone?: boolean
          mandays?: number
          parent_id?: string | null
          phase?: Database["public"]["Enums"]["project_phase"]
          progress_pct?: number
          project_id: string
          sort_order?: number
          start_date?: string | null
          sub_feature?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_name?: string
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          details?: string | null
          duration_days?: number
          end_date?: string | null
          feature?: string | null
          id?: string
          is_milestone?: boolean
          mandays?: number
          parent_id?: string | null
          phase?: Database["public"]["Enums"]["project_phase"]
          progress_pct?: number
          project_id?: string
          sort_order?: number
          start_date?: string | null
          sub_feature?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          actual_mandays: number
          assigned_mandays: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          joined_at: string
          member_id: string
          project_id: string
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_mandays?: number
          assigned_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          joined_at?: string
          member_id: string
          project_id: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_mandays?: number
          assigned_mandays?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          joined_at?: string
          member_id?: string
          project_id?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          created_by: string | null
          customer: string | null
          deleted_at: string | null
          end_date: string | null
          id: string
          is_active: boolean
          parent_project_id: string | null
          pic_client: string | null
          pic_internal: string | null
          progress_pct: number
          project_id: string
          remarks: string | null
          repository_link: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          timeline_link: string | null
          timeline_remark: string | null
          total_mandays: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          customer?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          parent_project_id?: string | null
          pic_client?: string | null
          pic_internal?: string | null
          progress_pct?: number
          project_id: string
          remarks?: string | null
          repository_link?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          timeline_link?: string | null
          timeline_remark?: string | null
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          customer?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          parent_project_id?: string | null
          pic_client?: string | null
          pic_internal?: string | null
          progress_pct?: number
          project_id?: string
          remarks?: string | null
          repository_link?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          timeline_link?: string | null
          timeline_remark?: string | null
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "master_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          po_name: string
          po_number: string
          remarks: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          total_amount: number
          total_mandays: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          po_name: string
          po_number: string
          remarks?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          po_name?: string
          po_number?: string
          remarks?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number
          total_mandays?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_rates: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          is_active: boolean
          rate_per_manday_project: number
          rate_per_manday_support: number
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          rate_per_manday_project?: number
          rate_per_manday_support?: number
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          rate_per_manday_project?: number
          rate_per_manday_support?: number
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_rates_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_ticket_assignees: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          end_date: string | null
          hours_spent: number
          id: string
          member_id: string
          notes: string | null
          role_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["support_ticket_detail_status"]
          support_ticket_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          hours_spent?: number
          id?: string
          member_id: string
          notes?: string | null
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["support_ticket_detail_status"]
          support_ticket_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          hours_spent?: number
          id?: string
          member_id?: string
          notes?: string | null
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["support_ticket_detail_status"]
          support_ticket_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_assignees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_assignees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_assignees_support_ticket_id_fkey"
            columns: ["support_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          created_by: string | null
          customer: string | null
          deleted_at: string | null
          end_date: string | null
          folder_attachment: string | null
          hours_spent: number
          id: string
          is_active: boolean
          issue_description: string | null
          issue_title: string
          mandays_spent: number
          master_project_id: string | null
          notes: string | null
          pic_client: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          ticket_code: string
          update_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer?: string | null
          deleted_at?: string | null
          end_date?: string | null
          folder_attachment?: string | null
          hours_spent?: number
          id?: string
          is_active?: boolean
          issue_description?: string | null
          issue_title: string
          mandays_spent?: number
          master_project_id?: string | null
          notes?: string | null
          pic_client?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          ticket_code: string
          update_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer?: string | null
          deleted_at?: string | null
          end_date?: string | null
          folder_attachment?: string | null
          hours_spent?: number
          id?: string
          is_active?: boolean
          issue_description?: string | null
          issue_title?: string
          mandays_spent?: number
          master_project_id?: string | null
          notes?: string | null
          pic_client?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          ticket_code?: string
          update_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_master_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "master_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_mandays: { Args: { p_hours: number }; Returns: number }
      current_employee_id: { Args: never; Returns: string }
      current_profile_id: { Args: never; Returns: string }
      has_role: { Args: { p_role_code: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      recalculate_project_progress: {
        Args: { p_project_id: string }
        Returns: number
      }
      refresh_project_summary: { Args: never; Returns: undefined }
      refresh_support_summary: { Args: never; Returns: undefined }
    }
    Enums: {
      billing_status: "DRAFT" | "FINALIZED" | "CANCELLED"
      invoice_status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
      project_phase:
        | "FCAB"
        | "REQUIREMENT"
        | "ANALYSIS"
        | "DESIGN"
        | "SRS"
        | "CRQ"
        | "DEVELOPMENT"
        | "UT SIT"
        | "TRA TC"
        | "REVIEW"
        | "SIT"
        | "UAT"
        | "NFT"
        | "SECURITY"
        | "RFS"
        | "FUT"
      project_status:
        | "PLANNING"
        | "IN PROGRESS"
        | "SIT"
        | "UAT"
        | "CLOSED"
        | "ON HOLD"
        | "CANCELLED"
        | "FUT"
      purchase_order_status:
        | "DRAFT"
        | "ACTIVE"
        | "IN PROGRESS"
        | "COMPLETED"
        | "CLOSED"
        | "CANCELLED"
      support_ticket_detail_status: "OPEN" | "IN PROGRESS" | "DONE" | "ON HOLD"
      support_ticket_status:
        | "OPEN"
        | "IN PROGRESS"
        | "DEV DONE"
        | "SIT DONE"
        | "UAT DONE"
        | "DONE"
        | "ON HOLD"
        | "CANCELLED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_status: ["DRAFT", "FINALIZED", "CANCELLED"],
      invoice_status: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"],
      project_phase: [
        "FCAB",
        "REQUIREMENT",
        "ANALYSIS",
        "DESIGN",
        "SRS",
        "CRQ",
        "DEVELOPMENT",
        "UT SIT",
        "TRA TC",
        "REVIEW",
        "SIT",
        "UAT",
        "NFT",
        "SECURITY",
        "RFS",
        "FUT",
      ],
      project_status: [
        "PLANNING",
        "IN PROGRESS",
        "SIT",
        "UAT",
        "CLOSED",
        "ON HOLD",
        "CANCELLED",
        "FUT",
      ],
      purchase_order_status: [
        "DRAFT",
        "ACTIVE",
        "IN PROGRESS",
        "COMPLETED",
        "CLOSED",
        "CANCELLED",
      ],
      support_ticket_detail_status: ["OPEN", "IN PROGRESS", "DONE", "ON HOLD"],
      support_ticket_status: [
        "OPEN",
        "IN PROGRESS",
        "DEV DONE",
        "SIT DONE",
        "UAT DONE",
        "DONE",
        "ON HOLD",
        "CANCELLED",
      ],
    },
  },
} as const


// ==========================================
// Compatibility Mappings (OpenAPI -> Supabase)
// ==========================================

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelCaseKeys<T> = T extends Array<infer U>
  ? Array<CamelCaseKeys<U>>
  : T extends object
  ? {
      [K in keyof T as SnakeToCamelCase<K & string>]: CamelCaseKeys<T[K]>
    }
  : T;

export interface components {
  schemas: {
    BaseResponseDto: {
      success: boolean;
      message?: string;
    };
    UserResponseDto: CamelCaseKeys<Database['public']['Tables']['members']['Row']> & {
      roles?: Array<{ code: string; name: string }>;
    };
    CreateUserDto: CamelCaseKeys<Database['public']['Tables']['members']['Insert']>;
    UpdateUserDto: CamelCaseKeys<Database['public']['Tables']['members']['Update']>;

    RoleResponseDto: CamelCaseKeys<Database['public']['Tables']['roles']['Row']>;
    CreateRoleDto: CamelCaseKeys<Database['public']['Tables']['roles']['Insert']>;
    UpdateRoleDto: CamelCaseKeys<Database['public']['Tables']['roles']['Update']>;

    RoleRateResponseDto: CamelCaseKeys<Database['public']['Tables']['role_rates']['Row']>;
    CreateRoleRateDto: CamelCaseKeys<Database['public']['Tables']['role_rates']['Insert']>;
    UpdateRoleRateDto: CamelCaseKeys<Database['public']['Tables']['role_rates']['Update']>;

    MasterProjectResponseDto: CamelCaseKeys<Database['public']['Tables']['master_projects']['Row']>;
    CreateMasterProjectDto: Omit<CamelCaseKeys<Database['public']['Tables']['master_projects']['Insert']>, 'projectCode'> & { projectCode?: string };

    ProjectResponseDto: CamelCaseKeys<Database['public']['Tables']['projects']['Row']>;
    CreateProjectDto: CamelCaseKeys<Database['public']['Tables']['projects']['Insert']>;
    UpdateProjectDto: CamelCaseKeys<Database['public']['Tables']['projects']['Update']>;

    ProjectMemberResponseDto: CamelCaseKeys<Database['public']['Tables']['project_members']['Row']>;
    AddProjectMemberDto: CamelCaseKeys<Database['public']['Tables']['project_members']['Insert']> & { userId?: string };

    ProjectActivityResponseDto: CamelCaseKeys<Database['public']['Tables']['project_activities']['Row']>;
    CreateProjectActivityDto: Omit<CamelCaseKeys<Database['public']['Tables']['project_activities']['Insert']>, 'projectId' | 'assignedTo'> & { projectId?: string; assignedToId?: string; assignedTo?: string | null };

    PurchaseOrderResponseDto: CamelCaseKeys<Database['public']['Tables']['purchase_orders']['Row']>;
    CreatePurchaseOrderDto: CamelCaseKeys<Database['public']['Tables']['purchase_orders']['Insert']>;

    SupportTicketResponseDto: CamelCaseKeys<Database['public']['Tables']['support_tickets']['Row']>;
    CreateSupportTicketDto: Omit<CamelCaseKeys<Database['public']['Tables']['support_tickets']['Insert']>, 'ticketCode'> & { ticketCode?: string; masterProjectName?: string };

    SupportTicketAssigneeResponseDto: CamelCaseKeys<Database['public']['Tables']['support_ticket_assignees']['Row']>;
    CreateSupportTicketAssigneeDto: CamelCaseKeys<Database['public']['Tables']['support_ticket_assignees']['Insert']> & { userId?: string };
    UpdateSupportTicketAssigneeDto: CamelCaseKeys<Database['public']['Tables']['support_ticket_assignees']['Update']>;

    BillingResponseDto: CamelCaseKeys<Database['public']['Tables']['billings']['Row']>;
    GenerateBillingDto: {
      billingType: 'PROJECT' | 'SUPPORT';
      projectIds?: string[];
      supportTicketIds?: string[];
      startDate: string;
      endDate: string;
      remarks?: string;
    };

    AuthResponseDto: {
      user: CamelCaseKeys<Database['public']['Tables']['members']['Row']>;
      accessToken: string;
    };
    LoginDto: {
      email: string;
      password?: string;
    };
    RegisterDto: {
      email: string;
      fullName: string;
      password?: string;
    };
    ChangePasswordDto: {
      oldPassword?: string;
      newPassword?: string;
    };
  };
}
