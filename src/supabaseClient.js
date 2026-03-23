import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const fromRow = (row) => ({
  id:                  row.id,
  name:                row.name,
  region:              row.region,
  cuisine:             row.cuisine,
  price:               row.price,
  ranks:               row.ranks        || [],
  sizes:               row.sizes        || [],
  genders:             row.genders      || [],
  mealTimes:           row.meal_times   || [],
  alcohols:            row.alcohols     || [],
  corkage:             row.corkage      || '',
  ambiance:            row.ambiance     || [],
  naverUrl:            row.naver_url    || '',
  rating:              row.rating       || 4,
  reservationRequired: row.reservation_required || false,
  reservationTip:      row.reservation_tip      || '',
  notes:               row.notes        || '',
  favorite:            row.favorite     || false,
  visitCount:          row.visit_count  || 0,
  lastVisit:           row.last_visit   || '',
  visitLogs:           row.visit_logs   || [],
})

export const toRow = (r) => ({
  name:                 r.name,
  region:               r.region,
  cuisine:              r.cuisine,
  price:                r.price,
  ranks:                r.ranks        || [],
  sizes:                r.sizes        || [],
  genders:              r.genders      || [],
  meal_times:           r.mealTimes    || [],
  alcohols:             r.alcohols     || [],
  corkage:              r.corkage      || '',
  ambiance:             r.ambiance     || [],
  naver_url:            r.naverUrl     || '',
  rating:               r.rating       || 4,
  reservation_required: r.reservationRequired || false,
  reservation_tip:      r.reservationTip      || '',
  notes:                r.notes        || '',
  favorite:             r.favorite     || false,
  visit_count:          r.visitCount   || 0,
  last_visit:           r.lastVisit    || '',
  visit_logs:           r.visitLogs    || [],
})

export const db = {
  async getAll() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
  },

  async insert(restaurant) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(toRow(restaurant))
      .select()
      .single()
    if (error) throw error
    return fromRow(data)
  },

  async update(id, restaurant) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(toRow(restaurant))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromRow(data)
  },

  async delete(id) {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
