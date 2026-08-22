'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { VegBadge } from '@/components/restaurant/veg-badge'
import { SpicyBadge } from '@/components/restaurant/spicy-badge'
import { Price } from '@/components/restaurant/price'
import { Minus, Plus, Flame } from 'lucide-react'
import { useCustomerCart, lineKeyOf } from '@/stores/customer-cart'
import type { MenuItemWithRelations } from './types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  item: MenuItemWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currencySymbol: string
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
}: Props) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [selectedModifierIds, setSelectedModifierIds] = useState<
    Record<string, string[]>
  >({})

  // Reset local state when item changes
  useEffect(() => {
    if (item) {
      setQuantity(1)
      setNotes('')
      const defaultVariant =
        item.variants.find((v) => v.isDefault) || item.variants[0]
      setSelectedVariantId(defaultVariant?.id || '')
      const initMods: Record<string, string[]> = {}
      for (const grp of item.modifierGroups) {
        if (grp.selectionType === 'SINGLE') {
          const def = grp.modifiers.find((m) => m.isDefault)
          initMods[grp.id] = def ? [def.id] : []
        } else {
          initMods[grp.id] = grp.modifiers.filter((m) => m.isDefault).map((m) => m.id)
        }
      }
      setSelectedModifierIds(initMods)
    }
  }, [item?.id])

  const variant = useMemo(
    () => item?.variants.find((v) => v.id === selectedVariantId),
    [item, selectedVariantId],
  )

  const { unitPrice, modifiersTotal, allModifierIds } = useMemo(() => {
    if (!item) {
      return { unitPrice: 0, modifiersTotal: 0, allModifierIds: [] as string[] }
    }
    const variantPrice = variant?.priceModifier || 0
    let modsTotal = 0
    const ids: string[] = []
    for (const grp of item.modifierGroups) {
      const chosen = selectedModifierIds[grp.id] || []
      for (const m of grp.modifiers) {
        if (chosen.includes(m.id)) {
          modsTotal += m.price
          ids.push(m.id)
        }
      }
    }
    return {
      unitPrice: item.basePrice + variantPrice + modsTotal,
      modifiersTotal: modsTotal,
      allModifierIds: ids,
    }
  }, [item, variant, selectedModifierIds])

  if (!item) return null

  // Validation for required groups
  const requiredGroupsValid = item.modifierGroups
    .filter((g) => g.required)
    .every((g) => (selectedModifierIds[g.id] || []).length >= g.minSelection)

  const handleToggleMultiple = (groupId: string, modifierId: string, max: number) => {
    setSelectedModifierIds((prev) => {
      const cur = prev[groupId] || []
      let next: string[]
      if (cur.includes(modifierId)) {
        next = cur.filter((x) => x !== modifierId)
      } else {
        if (cur.length >= max) {
          toast.warning(`You can select up to ${max}.`)
          return prev
        }
        next = [...cur, modifierId]
      }
      return { ...prev, [groupId]: next }
    })
  }

  const handleAdd = () => {
    if (!requiredGroupsValid) {
      toast.error('Please complete all required selections.')
      return
    }
    const cartItem = {
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.basePrice,
      variantId: variant?.id,
      variantName: variant?.name,
      variantPrice: variant?.priceModifier || 0,
      modifierIds: allModifierIds,
      modifierNames: collectModifierNames(item, selectedModifierIds),
      modifiersTotal,
      quantity,
      notes: notes.trim() || undefined,
      isVeg: item.isVeg,
      unitPrice,
      totalPrice: unitPrice * quantity,
    }
    useCustomerCart.getState().addItem(cartItem)
    toast.success(`${quantity} × ${item.name} added to cart`, {
      description: variant ? `Variant: ${variant.name}` : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="px-0">
          <DrawerTitle className="sr-only">{item.name}</DrawerTitle>
          <div className="relative h-44 w-full overflow-hidden bg-orange-50">
            {item.image ? (
               
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                🍽️
              </div>
            )}
          </div>
        </DrawerHeader>

        <div className="max-h-[42vh] overflow-y-auto px-4 pb-2">
          <div className="mb-1 flex items-center gap-2">
            <VegBadge isVeg={item.isVeg} />
            {item.isSpicy && <SpicyBadge />}
            {item.isFeatured && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Featured
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <Price amount={unitPrice} size="lg" />
            <span className="text-xs text-muted-foreground">
              ~{item.prepTime} min prep
            </span>
          </div>

          <Separator className="my-4" />

          {/* Variants */}
          {item.variants.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm font-semibold">Choose size</Label>
              <RadioGroup
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
                className="mt-2 grid grid-cols-1 gap-1"
              >
                {item.variants.map((v) => (
                  <label
                    key={v.id}
                    htmlFor={`v-${v.id}`}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                      selectedVariantId === v.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id={`v-${v.id}`} value={v.id} />
                      <span className="font-medium">{v.name}</span>
                      {v.isDefault && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          default
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {v.priceModifier > 0
                        ? `+₹${v.priceModifier}`
                        : v.priceModifier < 0
                        ? `-₹${Math.abs(v.priceModifier)}`
                        : 'included'}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Modifier groups */}
          {item.modifierGroups.map((grp) => (
            <div key={grp.id} className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-semibold">{grp.name}</Label>
                <span className="text-[11px] text-muted-foreground">
                  {grp.selectionType === 'SINGLE' ? 'Choose one' : `Up to ${grp.maxSelection}`}
                  {grp.required && <span className="ml-1 text-orange-600">*</span>}
                </span>
              </div>
              {grp.selectionType === 'SINGLE' ? (
                <RadioGroup
                  value={(selectedModifierIds[grp.id] || [])[0] || ''}
                  onValueChange={(val) =>
                    setSelectedModifierIds((p) => ({ ...p, [grp.id]: [val] }))
                  }
                  className="grid grid-cols-1 gap-1"
                >
                  {grp.modifiers.map((m) => (
                    <label
                      key={m.id}
                      htmlFor={`m-${m.id}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                        (selectedModifierIds[grp.id] || []).includes(m.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`m-${m.id}`} value={m.id} />
                        <span>{m.name}</span>
                      </div>
                      {m.price > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +₹{m.price}
                        </span>
                      )}
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {grp.modifiers.map((m) => {
                    const checked = (selectedModifierIds[grp.id] || []).includes(m.id)
                    return (
                      <label
                        key={m.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                          checked
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              handleToggleMultiple(grp.id, m.id, grp.maxSelection)
                            }
                          />
                          <span>{m.name}</span>
                        </div>
                        {m.price > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +₹{m.price}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Special instructions */}
          <div className="mb-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Special instructions
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g. less spicy, no onion"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={280}
              className="mt-1.5"
              rows={2}
            />
          </div>
        </div>

        <DrawerFooter className="flex-row items-center justify-between gap-3 border-t bg-white px-4 pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!requiredGroupsValid}
            className="flex-1 bg-orange-600 text-white hover:bg-orange-700"
          >
            Add to cart · ₹{(unitPrice * quantity).toFixed(0)}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function collectModifierNames(
  item: MenuItemWithRelations,
  selected: Record<string, string[]>,
): string[] {
  const names: string[] = []
  for (const grp of item.modifierGroups) {
    const chosen = selected[grp.id] || []
    for (const m of grp.modifiers) {
      if (chosen.includes(m.id)) names.push(m.name)
    }
  }
  return names
}
