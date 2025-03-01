
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  createdAt: string;
  lastSignIn: string;
  isAdmin: boolean;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  onToggleAdmin: (userId: string, currentStatus: boolean) => void;
  onUpdateProfile: (userId: string, profileData: any) => void;
}

export function UserTable({ users, loading, onToggleAdmin, onUpdateProfile }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
  });

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveClick = () => {
    if (editingUser) {
      onUpdateProfile(editingUser.id, editFormData);
      setEditingUser(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Last Signin</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                Loading user data...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  {user.firstName || user.lastName ? (
                    `${user.firstName} ${user.lastName}`
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.company || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.createdAt ? (
                    <span title={new Date(user.createdAt).toLocaleString()}>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {user.lastSignIn ? (
                    <span title={new Date(user.lastSignIn).toLocaleString()}>
                      {formatDistanceToNow(new Date(user.lastSignIn), { addSuffix: true })}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={user.isAdmin}
                      onCheckedChange={() => onToggleAdmin(user.id, user.isAdmin)}
                    />
                    {user.isAdmin && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        Admin
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(user)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editingUser?.email}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={editFormData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={editFormData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={editFormData.company}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveClick}>
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
