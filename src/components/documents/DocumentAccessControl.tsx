
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DocumentPermission } from '@/types/documentTypes'

interface DocumentAccessControlProps {
  documentId: string;
}

export function DocumentAccessControl({ documentId }: DocumentAccessControlProps) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [newPermission, setNewPermission] = useState({
    permissionLevel: 'read',
    userId: '',
    role: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [documentId])
  
  const fetchPermissions = async () => {
    try {
      setLoading(true)
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
  
  const addPermission = async () => {
    try {
      if (!newPermission.permissionLevel) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Permission level is required"
        })
        return
      }
      
      // At least userId or role must be provided
      if (!newPermission.userId && !newPermission.role) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Either user ID or role must be provided"
        })
        return
      }
      
      const { data, error } = await supabase
        .from('document_permissions')
        .insert({
          document_id: documentId,
          permission_level: newPermission.permissionLevel,
          user_id: newPermission.userId || null,
          role: newPermission.role || null
        })
        .select()
      
      if (error) throw error
      
      toast({
        title: "Permission Added",
        description: "Document access permission has been added"
      })
      
      // Reset form and refresh permissions
      setNewPermission({
        permissionLevel: 'read',
        userId: '',
        role: ''
      })
      
      fetchPermissions()
    } catch (error) {
      console.error('Error adding permission:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add permission"
      })
    }
  }
  
  const removePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('document_permissions')
        .delete()
        .eq('id', permissionId)
      
      if (error) throw error
      
      toast({
        title: "Permission Removed",
        description: "Document access permission has been removed"
      })
      
      // Refresh permissions
      fetchPermissions()
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
          Manage document access permissions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              Permission Level
            </label>
            <Select
              value={newPermission.permissionLevel}
              onValueChange={(value) => setNewPermission({...newPermission, permissionLevel: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="write">Read & Write</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              User ID (optional)
            </label>
            <Input
              value={newPermission.userId}
              onChange={(e) => setNewPermission({...newPermission, userId: e.target.value})}
              placeholder="User ID"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              Role (optional)
            </label>
            <Input
              value={newPermission.role}
              onChange={(e) => setNewPermission({...newPermission, role: e.target.value})}
              placeholder="Role (e.g. admin, editor)"
            />
          </div>
          
          <Button onClick={addPermission}>
            Add Permission
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <p>Loading permissions...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-4 border rounded-md">
            <p className="text-muted-foreground">No permissions set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Document is only accessible to administrators
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    {permission.user_id ? 'User' : 'Role'}
                  </TableCell>
                  <TableCell>
                    {permission.user_id || permission.role || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {permission.permission_level === 'read' && 'Read Only'}
                    {permission.permission_level === 'write' && 'Read & Write'}
                    {permission.permission_level === 'admin' && 'Admin'}
                  </TableCell>
                  <TableCell>
                    {permission.expires_at || 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePermission(permission.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Note: Changes to access control take effect immediately
        </div>
      </CardFooter>
    </Card>
  )
}
