
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrashIcon, PlusIcon } from 'lucide-react'
import { DocumentPermission } from '@/types/database'

interface DocumentAccessControlProps {
  documentId: string;
}

export function DocumentAccessControl({ documentId }: DocumentAccessControlProps) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPermission, setNewPermission] = useState('read')
  const [addingUser, setAddingUser] = useState(false)
  const { toast } = useToast()

  // Fetch document permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('document_permissions')
          .select('*')
          .eq('document_id', documentId)
        
        if (error) throw error
        
        setPermissions(data || [])
      } catch (error) {
        console.error('Error fetching permissions:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load document permissions"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchPermissions()
  }, [documentId, toast])

  // Add new permission
  const handleAddPermission = async () => {
    if (!newEmail || !newPermission) return
    
    setAddingUser(true)
    try {
      // Try to find user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newEmail)
        .single()
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }
      
      // If user not found, create a role-based permission
      const userId = userData?.id
      let role = null
      
      if (!userId) {
        // Check if it's a role name
        if (['admin', 'editor', 'viewer'].includes(newEmail)) {
          role = newEmail
        } else {
          toast({
            variant: "destructive",
            title: "User not found",
            description: "No user with that email was found"
          })
          return
        }
      }
      
      // Add permission
      const { data, error } = await supabase
        .from('document_permissions')
        .insert({
          document_id: documentId,
          user_id: userId,
          role: role,
          permission_level: newPermission
        })
        .select()
      
      if (error) throw error
      
      setPermissions([...permissions, data[0]])
      setNewEmail('')
      
      toast({
        title: "Permission added",
        description: "Document access permission has been updated"
      })
    } catch (error) {
      console.error('Error adding permission:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add permission"
      })
    } finally {
      setAddingUser(false)
    }
  }

  // Remove permission
  const handleRemovePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('document_permissions')
        .delete()
        .eq('id', permissionId)
      
      if (error) throw error
      
      setPermissions(permissions.filter(p => p.id !== permissionId))
      
      toast({
        title: "Permission removed",
        description: "Document access permission has been removed"
      })
    } catch (error) {
      console.error('Error removing permission:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove permission"
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Access Control</CardTitle>
        <CardDescription>
          Manage who can access this document
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Add new permission form */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Email or Role
              </label>
              <Input
                placeholder="user@example.com or role name"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-1 block">
                Access
              </label>
              <Select
                value={newPermission}
                onValueChange={setNewPermission}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddPermission} 
              disabled={!newEmail || addingUser}
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {/* Permissions list */}
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading permissions...</p>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-4 border rounded-md">
              <p className="text-muted-foreground">No permissions set</p>
              <p className="text-xs text-muted-foreground mt-1">
                Document is accessible according to default system permissions
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User/Role</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        {permission.user_id ? (
                          <span>{permission.user_id}</span>
                        ) : permission.role ? (
                          <span className="capitalize">{permission.role} (Role)</span>
                        ) : (
                          <span>Public</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {permission.permission_level}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Changes to permissions take effect immediately
        </p>
      </CardFooter>
    </Card>
  )
}
