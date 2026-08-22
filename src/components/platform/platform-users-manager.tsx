'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  Loader2,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/auth'
import { formatRelative } from '@/lib/format'

interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  phone?: string | null
  restaurant?: { id: string; name: string; slug: string } | null
  createdAt: string
}

async function fetchUsers(search: string, role: string): Promise<PlatformUser[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role && role !== 'ALL') params.set('role', role)
  const res = await fetch(`/api/platform/users?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load users')
  const json = await res.json()
  return json.data
}

export function PlatformUsersManager() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const { data, isLoading } = useQuery({
    queryKey: ['platform-users', search, role],
    queryFn: () => fetchUsers(search, role),
    refetchInterval: 30_000,
  })

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All users</h1>
        <p className="text-sm text-muted-foreground">
          Every account across all tenants
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="RESTAURANT_OWNER">Restaurant Owner</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
            <SelectItem value="WAITER">Waiter</SelectItem>
            <SelectItem value="CASHIER">Cashier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No users match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenant</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{u.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {u.restaurant ? (
                          <span className="text-xs">{u.restaurant.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">● Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700">● Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatRelative(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
