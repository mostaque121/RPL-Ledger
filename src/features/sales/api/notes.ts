import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { sortNotes } from '../crm'

export interface SaleNote {
  id: string
  saleId: string
  body: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export const saleNoteKeys = {
  all: ['sale-notes'] as const,
  forSale: (saleId: string) => ['sale-notes', saleId] as const,
}

/** One sale's notes, pinned first, then newest first. */
async function fetchNotes(saleId: string): Promise<SaleNote[]> {
  const rows = unwrap(
    await supabase.from('sale_notes').select('id, sale_id, body, pinned, created_at, updated_at').eq('sale_id', saleId),
  )
  return sortNotes(
    rows.map((r) => ({
      id: r.id,
      saleId: r.sale_id,
      body: r.body,
      pinned: r.pinned,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  )
}

export function useSaleNotesQuery(saleId: string) {
  return useQuery({ queryKey: saleNoteKeys.forSale(saleId), queryFn: () => fetchNotes(saleId) })
}

// ---------------------------------------------------------------- mutations

export interface NoteInput {
  saleId: string
  /** Set to edit an existing note. */
  id?: string
  body: string
  pinned?: boolean
}

async function saveNote({ id, saleId, body, pinned }: NoteInput) {
  const row = { body: body.trim(), ...(pinned !== undefined && { pinned }) }
  unwrap(
    await (id
      ? supabase.from('sale_notes').update(row).eq('id', id)
      : supabase.from('sale_notes').insert({ ...row, sale_id: saleId })),
  )
}

export function useSaveNoteMutation() {
  return useAppMutation({
    mutationFn: saveNote,
    invalidate: [saleNoteKeys.all],
    success: (_, v) => (v.id ? 'Note saved' : 'Note added'),
  })
}

async function setPinned({ id, pinned }: { id: string; pinned: boolean }) {
  unwrap(await supabase.from('sale_notes').update({ pinned }).eq('id', id))
}

export function useSetNotePinnedMutation() {
  return useAppMutation({
    mutationFn: setPinned,
    invalidate: [saleNoteKeys.all],
    success: (_, v) => (v.pinned ? 'Note pinned' : 'Note unpinned'),
  })
}

async function deleteNote(id: string) {
  unwrap(await supabase.from('sale_notes').delete().eq('id', id))
}

export function useDeleteNoteMutation() {
  return useAppMutation({ mutationFn: deleteNote, invalidate: [saleNoteKeys.all], success: 'Note deleted' })
}
