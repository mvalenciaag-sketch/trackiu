export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      body_measurements: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      exercise_muscle_groups: {
        Row: {
          exercise_id: string
          id: string
          muscle_group_id: string
          relation: string
        }
        Insert: {
          exercise_id: string
          id?: string
          muscle_group_id: string
          relation?: string
        }
        Update: {
          exercise_id?: string
          id?: string
          muscle_group_id?: string
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_groups_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscle_groups_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string | null
          id: string
          mechanics: string
          name: string
          notes: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment?: string | null
          id?: string
          mechanics?: string
          name: string
          notes?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment?: string | null
          id?: string
          mechanics?: string
          name?: string
          notes?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_day_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          routine_day_id: string
          superset_group: number | null
          target_sets: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          routine_day_id: string
          superset_group?: number | null
          target_sets?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          routine_day_id?: string
          superset_group?: number | null
          target_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_day_exercises_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_days: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          routine_day_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          routine_day_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          routine_day_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean
          notes: string | null
          reps: number | null
          rest_seconds: number | null
          rir: number | null
          rom: string | null
          rpe: number | null
          session_id: string
          set_number: number
          set_type: string
          tempo: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rom?: string | null
          rpe?: number | null
          session_id: string
          set_number: number
          set_type?: string
          tempo?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rom?: string | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          set_type?: string
          tempo?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          routine_day_id: string | null
          scheduled_session_id: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          routine_day_id?: string | null
          scheduled_session_id?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          routine_day_id?: string | null
          scheduled_session_id?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Domain types (Row aliases)
export type Exercise = Tables<"exercises">
export type MuscleGroup = Tables<"muscle_groups">
export type ExerciseMuscleGroup = Tables<"exercise_muscle_groups">
export type RoutineDay = Tables<"routine_days">
export type RoutineDayExercise = Tables<"routine_day_exercises">
export type ScheduledSession = Tables<"scheduled_sessions">
export type WorkoutSession = Tables<"workout_sessions">
export type SetLog = Tables<"set_logs">
export type BodyMeasurement = Tables<"body_measurements">

// Enriched types for UI (joined)
export type ExerciseWithMuscles = Exercise & {
  exercise_muscle_groups: (ExerciseMuscleGroup & {
    muscle_groups: MuscleGroup
  })[]
}

export type RoutineDayWithExercises = RoutineDay & {
  routine_day_exercises: (RoutineDayExercise & {
    exercises: Exercise
  })[]
}
