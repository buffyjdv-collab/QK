'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, type PlanId } from '@/lib/plans'

interface SignupWizardProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess?: () => void
}

type Step = 1 | 2 | 3 | 4

export function SignupWizard({ open, onOpenChange, onSuccess }: SignupWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Step 1: Restaurant
  const [restaurant, setRestaurant] = useState({
    name: '',
    slug: '',
    tagline: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  })

  // Step 2: Owner
  const [owner, setOwner] = useState({
    name: '',
    email: '',
    password: '',
  })

  // Step 3: Plan
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('TRIAL')
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  const updateRestaurant = (k: keyof typeof restaurant, v: string) => {
    setRestaurant((r) => ({ ...r, [k]: v }))
    if (k === 'name' && (!restaurant.slug || restaurant.slug === slugify(restaurant.name))) {
      setRestaurant((r) => ({ ...r, slug: slugify(v) }))
    }
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const canProceedStep1 = restaurant.name && restaurant.slug && restaurant.address && restaurant.phone
  const canProceedStep2 = owner.name && owner.email && owner.password.length >= 8

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          slug: restaurant.slug,
          tagline: restaurant.tagline || undefined,
          address: restaurant.address,
          city: restaurant.city,
          phone: restaurant.phone,
          email: restaurant.email || owner.email,
          ownerName: owner.name,
          ownerEmail: owner.email,
          ownerPassword: owner.password,
          plan: selectedPlan,
          billingCycle,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to create restaurant')
        return
      }
      setDone(true)
      toast.success('Restaurant created! Welcome to QR Dine.')
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setDone(false)
    setRestaurant({ name: '', slug: '', tagline: '', address: '', city: '', phone: '', email: '' })
    setOwner({ name: '', email: '', password: '' })
    setSelectedPlan('TRIAL')
    setBillingCycle('MONTHLY')
  }

  const close = () => {
    onOpenChange(false)
    if (done) {
      reset()
      onSuccess?.()
      // Auto-login after signup
      setTimeout(() => window.location.reload(), 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {done ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Welcome aboard!
              </>
            ) : (
              <>
                <span>Start your restaurant — step {step} of 3</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        {!done && (
          <div className="mb-2 flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? 'bg-orange-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{restaurant.name} is ready!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your restaurant is set up with a default table (T1), three menu categories,
                and the <span className="font-semibold">{PLANS[selectedPlan].name}</span> plan.
                Sign in with <span className="font-mono text-xs">{owner.email}</span> to start
                building your menu.
              </p>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="space-y-3 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Restaurant name *</Label>
                <Input
                  value={restaurant.name}
                  onChange={(e) => updateRestaurant('name', e.target.value)}
                  placeholder="e.g. Spice Garden"
                />
              </div>
              <div>
                <Label>URL slug *</Label>
                <Input
                  value={restaurant.slug}
                  onChange={(e) =>
                    setRestaurant((r) => ({ ...r, slug: e.target.value.toLowerCase() }))
                  }
                  placeholder="spice-garden"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Your menu URL: /?table=&lt;slug&gt;-...
                </p>
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={restaurant.tagline}
                onChange={(e) => updateRestaurant('tagline', e.target.value)}
                placeholder="Authentic Indian cuisine"
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Textarea
                value={restaurant.address}
                onChange={(e) => updateRestaurant('address', e.target.value)}
                placeholder="Full address"
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  value={restaurant.city}
                  onChange={(e) => updateRestaurant('city', e.target.value)}
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={restaurant.phone}
                  onChange={(e) => updateRestaurant('phone', e.target.value)}
                  placeholder="+91 80 1234 5678"
                />
              </div>
            </div>
            <div>
              <Label>Restaurant email</Label>
              <Input
                value={restaurant.email}
                onChange={(e) => updateRestaurant('email', e.target.value)}
                placeholder="hello@restaurant.com"
                type="email"
              />
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-3 py-2">
            <div>
              <Label>Your name *</Label>
              <Input
                value={owner.name}
                onChange={(e) => setOwner((o) => ({ ...o, name: e.target.value }))}
                placeholder="Rajesh Kapoor"
              />
            </div>
            <div>
              <Label>Your email *</Label>
              <Input
                value={owner.email}
                onChange={(e) => setOwner((o) => ({ ...o, email: e.target.value }))}
                placeholder="owner@restaurant.com"
                type="email"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                This will be your login email as the restaurant owner.
              </p>
            </div>
            <div>
              <Label>Password * <span className="text-muted-foreground">(min 8 characters)</span></Label>
              <Input
                value={owner.password}
                onChange={(e) => setOwner((o) => ({ ...o, password: e.target.value }))}
                type="password"
                placeholder="••••••••"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>Billing cycle</Label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
                    billingCycle === 'MONTHLY'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold">Monthly</p>
                  <p className="text-xs text-muted-foreground">Pay every month</p>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('YEARLY')}
                  className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
                    billingCycle === 'YEARLY'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    Yearly <span className="text-emerald-600">-17%</span>
                  </p>
                  <p className="text-xs text-muted-foreground">2 months free</p>
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.values(PLANS)).map((p) => {
                const selected = selectedPlan === p.id
                const price = billingCycle === 'YEARLY' ? p.yearlyPrice : p.monthlyPrice
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`relative rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-orange-600 bg-orange-50 shadow-sm'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-2 right-3 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Popular
                      </span>
                    )}
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="mt-1 text-xl font-extrabold">
                      ₹{price}
                      <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.tagline}</p>
                    <ul className="mt-2 space-y-1">
                      {p.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
              {selectedPlan === 'TRIAL' ? (
                <p>
                  You&rsquo;ll start a <strong className="text-slate-900">14-day free trial</strong>.
                  No credit card required. We&rsquo;ll remind you before it expires.
                </p>
              ) : (
                <p>
                  You&rsquo;ll be subscribed to the <strong className="text-slate-900">{PLANS[selectedPlan].name}</strong> plan
                  billed {billingCycle === 'YEARLY' ? 'annually' : 'monthly'}. Payment details
                  will be collected separately after signup.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {done ? (
            <Button onClick={close} className="bg-orange-600 hover:bg-orange-700">
              Sign in now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create my restaurant
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
