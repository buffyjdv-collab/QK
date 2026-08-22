'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAdminModifierGroups, api } from '@/hooks/api'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner, EmptyState, ButtonWithLoading } from '@/components/restaurant/loading-states'
import { ConfirmDialog } from '@/components/restaurant/confirm-dialog'

export function ModifierGroupsManager() {
  const { data, isLoading } = useAdminModifierGroups()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  const handleNew = () => {
    setEditing({
      name: '',
      description: '',
      selectionType: 'SINGLE',
      required: false,
      minSelection: 0,
      maxSelection: 1,
      modifiers: [{ name: 'Option 1', price: 0 }],
      menuItemId: null,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing.id) {
        await api(`/api/admin/menu/modifier-groups/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editing),
        })
        toast.success('Modifier group updated')
      } else {
        await api(`/api/admin/menu/modifier-groups`, {
          method: 'POST',
          body: JSON.stringify(editing),
        })
        toast.success('Modifier group created')
      }
      qc.invalidateQueries({ queryKey: ['admin-modifier-groups'] })
      setOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    }
  }

  const handleDelete = async (g: any) => {
    try {
      await api(`/api/admin/menu/modifier-groups/${g.id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['admin-modifier-groups'] })
      toast.success('Deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modifier groups</h1>
          <p className="text-sm text-muted-foreground">
            Reusable add-ons, spice levels, sizes — used across your menu.
          </p>
        </div>
        <Button onClick={handleNew} className="bg-orange-600 text-white hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" /> New group
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      ) : !data?.length ? (
        <EmptyState
          title="No modifier groups yet"
          description="Create your first group (e.g. 'Add-ons' or 'Spice Level') to apply to menu items."
          action={
            <Button onClick={handleNew} className="bg-orange-600 text-white hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" /> New group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((g: any) => (
            <Card key={g.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {g.selectionType}
                      {g.required && ' · required'}
                      {g.menuItem ? ` · ${g.menuItem.name}` : ' · restaurant-wide'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(g)
                        setOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title={`Delete ${g.name}?`}
                      description="This will remove the group from any menu items it's attached to."
                      confirmLabel="Delete"
                      variant="destructive"
                      onConfirm={() => handleDelete(g)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {g.modifiers?.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.price > 0 ? `+₹${m.price}` : 'incl.'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null) }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit group' : 'New modifier group'}</DialogTitle>
            <DialogDescription>
              Single = customer picks one (radio). Multiple = customer can pick several (checkbox).
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Selection type</Label>
                  <Select
                    value={editing.selectionType}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        selectionType: v,
                        maxSelection: v === 'SINGLE' ? 1 : 5,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single (radio)</SelectItem>
                      <SelectItem value="MULTIPLE">Multiple (checkbox)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max selections</Label>
                  <Input
                    type="number"
                    value={editing.maxSelection}
                    onChange={(e) => setEditing({ ...editing, maxSelection: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Switch
                  checked={editing.required}
                  onCheckedChange={(v) =>
                    setEditing({
                      ...editing,
                      required: v,
                      minSelection: v ? 1 : 0,
                    })
                  }
                />
                <span className="text-sm">Required (customer must select)</span>
              </label>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        modifiers: [
                          ...(editing.modifiers || []),
                          { name: '', price: 0 },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
                {(editing.modifiers || []).map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...editing.modifiers]
                        next[idx] = { ...next[idx], name: e.target.value }
                        setEditing({ ...editing, modifiers: next })
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="₹"
                      value={m.price}
                      onChange={(e) => {
                        const next = [...editing.modifiers]
                        next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 }
                        setEditing({ ...editing, modifiers: next })
                      }}
                      className="w-24"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          modifiers: editing.modifiers.filter((_: any, i: number) => i !== idx),
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <ButtonWithLoading
              onClick={handleSave}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {editing?.id ? 'Save changes' : 'Create group'}
            </ButtonWithLoading>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
