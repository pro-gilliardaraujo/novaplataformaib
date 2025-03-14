import { supabase } from "@/lib/supabase"

export interface ScenarioConfig {
  id?: string
  user_id: string
  column_order: string[]
  column_colors: Record<string, Record<string, string>> // date -> { columnId -> color }
  minimized_columns: string[]
  selected_frotas: string[]
  created_at?: string
  updated_at?: string
}

export const scenarioConfigService = {
  async saveConfig(config: Omit<ScenarioConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ScenarioConfig> {
    console.log('Saving scenario config:', config)
    
    const { data: existingConfig } = await supabase
      .from('scenario_configs')
      .select('*')
      .eq('user_id', config.user_id)
      .single()

    console.log('Existing config:', existingConfig)

    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('scenario_configs')
        .update({
          column_order: config.column_order,
          column_colors: config.column_colors,
          minimized_columns: config.minimized_columns,
          selected_frotas: config.selected_frotas,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating config:', error)
        throw error
      }
      console.log('Updated config:', data)
      return data
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('scenario_configs')
        .insert([{
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating config:', error)
        throw error
      }
      console.log('Created new config:', data)
      return data
    }
  },

  async loadConfig(userId: string): Promise<ScenarioConfig | null> {
    console.log('Loading config for user:', userId)
    
    const { data, error } = await supabase
      .from('scenario_configs')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('No existing config found for user')
        return null
      }
      console.error('Error loading config:', error)
      throw error
    }

    console.log('Loaded config:', data)
    return data
  }
} 