/**
 * Plan definitions and limits for the multi-tenant SaaS.
 *
 * Each plan defines hard limits enforced at the API layer.
 * The frontend also reads these to gate UI (e.g. show "Upgrade" badges).
 */

export type PlanId = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'

export interface PlanDefinition {
  id: PlanId
  name: string
  tagline: string
  monthlyPrice: number   // INR rupees (not paise) — display only
  yearlyPrice: number
  highlight?: boolean
  features: string[]
  limits: {
    maxTables: number | null      // null = unlimited
    maxMenuItems: number | null
    maxStaff: number | null
    maxBranches: number | null
    maxCategories: number | null
  }
  capabilities: {
    onlinePayment: boolean
    advancedReports: boolean
    customBranding: boolean
    multiBranch: boolean
    apiAccess: boolean
    auditLogs: boolean
    prioritySupport: boolean
  }
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Trial',
    tagline: 'Get started — free for 14 days',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 5 tables',
      'Up to 20 menu items',
      '3 staff accounts',
      'Single branch',
      'QR code generation',
      'Real-time kitchen display',
      'Basic reports',
    ],
    limits: {
      maxTables: 5,
      maxMenuItems: 20,
      maxStaff: 3,
      maxBranches: 1,
      maxCategories: 6,
    },
    capabilities: {
      onlinePayment: false,
      advancedReports: false,
      customBranding: false,
      multiBranch: false,
      apiAccess: false,
      auditLogs: false,
      prioritySupport: false,
    },
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'For small restaurants getting started',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    features: [
      'Up to 15 tables',
      'Up to 75 menu items',
      '8 staff accounts',
      'Single branch',
      'Online payments (UPI)',
      'Email support',
      '7-day reports',
      'QR code generation',
    ],
    limits: {
      maxTables: 15,
      maxMenuItems: 75,
      maxStaff: 8,
      maxBranches: 1,
      maxCategories: 12,
    },
    capabilities: {
      onlinePayment: true,
      advancedReports: false,
      customBranding: false,
      multiBranch: false,
      apiAccess: false,
      auditLogs: true,
      prioritySupport: false,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    tagline: 'For growing & multi-location restaurants',
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    highlight: true,
    features: [
      'Up to 60 tables',
      'Up to 500 menu items',
      '25 staff accounts',
      'Up to 3 branches',
      'Online payments (UPI + Cards)',
      'Advanced reports & exports',
      'Custom branding',
      'Audit logs',
      'Priority support',
    ],
    limits: {
      maxTables: 60,
      maxMenuItems: 500,
      maxStaff: 25,
      maxBranches: 3,
      maxCategories: 30,
    },
    capabilities: {
      onlinePayment: true,
      advancedReports: true,
      customBranding: true,
      multiBranch: true,
      apiAccess: true,
      auditLogs: true,
      prioritySupport: true,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'For chains & large operations',
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    features: [
      'Unlimited tables',
      'Unlimited menu items',
      'Unlimited staff',
      'Unlimited branches',
      'All payment methods',
      'API access',
      'White-label option',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom integrations',
    ],
    limits: {
      maxTables: null,
      maxMenuItems: null,
      maxStaff: null,
      maxBranches: null,
      maxCategories: null,
    },
    capabilities: {
      onlinePayment: true,
      advancedReports: true,
      customBranding: true,
      multiBranch: true,
      apiAccess: true,
      auditLogs: true,
      prioritySupport: true,
    },
  },
}

export const PLAN_LIST: PlanDefinition[] = Object.values(PLANS)

/** Get plan definition by id (defaults to TRIAL if unknown). */
export function getPlan(id: string | undefined | null): PlanDefinition {
  if (!id) return PLANS.TRIAL
  return PLANS[id as PlanId] ?? PLANS.TRIAL
}

/** Check whether the restaurant has exceeded a particular limit. */
export function checkLimit(
  planId: string,
  limitKey: keyof PlanDefinition['limits'],
  currentCount: number,
  incrementBy = 1,
): { allowed: boolean; limit: number | null; current: number; remaining: number | null } {
  const plan = getPlan(planId)
  const limit = plan.limits[limitKey]
  if (limit === null) {
    return { allowed: true, limit: null, current: currentCount, remaining: null }
  }
  const remaining = Math.max(0, limit - currentCount)
  return {
    allowed: currentCount + incrementBy <= limit,
    limit,
    current: currentCount,
    remaining,
  }
}

/** Check whether a capability is enabled for the plan. */
export function hasCapability(planId: string, capability: keyof PlanDefinition['capabilities']): boolean {
  return getPlan(planId).capabilities[capability]
}

/**
 * Determine whether a tenant is currently billable / active.
 * TRIALING tenants past their trialEndsAt are considered SUSPENDED.
 */
export function isTenantActive(params: {
  plan: string
  subscriptionStatus: string
  trialEndsAt?: Date | string | null
  suspendedAt?: Date | string | null
}): { active: boolean; reason?: string } {
  if (params.suspendedAt) {
    return { active: false, reason: 'Account suspended — contact support' }
  }
  if (params.subscriptionStatus === 'CANCELLED') {
    return { active: false, reason: 'Subscription cancelled' }
  }
  if (params.plan === 'TRIAL' && params.trialEndsAt) {
    const endsAt = new Date(params.trialEndsAt)
    if (endsAt.getTime() < Date.now()) {
      return { active: false, reason: 'Trial expired — upgrade to continue' }
    }
  }
  if (params.subscriptionStatus === 'PAST_DUE') {
    return { active: false, reason: 'Payment past due — update billing' }
  }
  return { active: true }
}
