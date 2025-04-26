"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MembersTable } from "~/components/members/MembersTable";
import { SearchBar } from "~/components/ui/search-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import type { Member } from "~/app/types/MemberTypes";
import {
  createMember,
  updateMember,
  deleteMember,
  searchMembersAction,
} from "~/server/members/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AddMemberForm } from "./AddMemberForm";
import { EditMemberForm } from "./EditMemberForm";

interface MembersHandlerProps {
  initialMembers: Member[];
  theme: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

const ITEMS_PER_PAGE = 6;

export function MembersHandler({ initialMembers, theme }: MembersHandlerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE);

  // Get current page members
  const getCurrentPageMembers = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return members.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery) {
        const results = await searchMembersAction(searchQuery);
        setMembers(results);
        setCurrentPage(1);
      } else {
        setMembers(initialMembers);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialMembers]);

  const handleCreateMember = async (values: any) => {
    try {
      await createMember(values);
      setIsFormOpen(false);
      toast.success("Member created successfully");
    } catch (error) {
      toast.error("Failed to create member");
      console.error(error);
    }
  };

  const handleUpdateMember = async (values: any) => {
    if (!selectedMember) return;
    try {
      await updateMember(selectedMember.id, values);
      setIsFormOpen(false);
      toast.success("Member updated successfully");
    } catch (error) {
      toast.error("Failed to update member");
      console.error(error);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    try {
      await deleteMember(selectedMember.id);
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast.success("Member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete member");
      console.error(error);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Members</h1>
        <Button
          onClick={() => {
            setSelectedMember(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search members by name or number..."
          theme={theme}
        />

        <MembersTable
          members={getCurrentPageMembers()}
          onEdit={(member) => {
            setSelectedMember(member);
            setIsFormOpen(true);
          }}
          onDelete={(member) => {
            setSelectedMember(member);
            setIsDeleteDialogOpen(true);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          theme={theme}
        />
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setIsFormOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? "Edit Member" : "Add Member"}
            </DialogTitle>
          </DialogHeader>
          {selectedMember ? (
            <EditMemberForm
              member={selectedMember}
              onSubmit={handleUpdateMember}
              onCancel={resetForm}
              theme={theme}
            />
          ) : (
            <AddMemberForm onSubmit={handleCreateMember} onCancel={resetForm} theme={theme} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              member and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
