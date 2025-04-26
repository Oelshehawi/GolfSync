"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { GuestTable } from "./GuestTable";
import { AddGuestDialog } from "./AddGuestDialog";
import { EditGuestDialog } from "./EditGuestDialog";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  searchGuestsAction,
} from "~/server/guests/actions";
import toast from "react-hot-toast";
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
import { Plus } from "lucide-react";
import { SearchBar } from "~/components/ui/search-bar";
import { BaseGuest } from "~/app/types/GuestTypes";
import { ThemeConfig } from "~/app/types/UITypes";

interface GuestsHandlerProps {
  initialGuests: BaseGuest[];
  theme: ThemeConfig;
}

const ITEMS_PER_PAGE = 6;

export function GuestsHandler({ initialGuests, theme }: GuestsHandlerProps) {
  const [guests, setGuests] = useState<BaseGuest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<BaseGuest | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(guests.length / ITEMS_PER_PAGE);

  // Get current page guests
  const getCurrentPageGuests = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return guests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery) {
        const results = await searchGuestsAction(searchQuery);
        setGuests(results);
        setCurrentPage(1);
      } else {
        setGuests(initialGuests);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialGuests]);

  const handleAddGuest = async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    handicap?: string;
  }) => {
    try {
      const result = await createGuest(data);

      if (result.success && result.data) {
        // Type assertion to match BaseGuest
        const newGuest = {
          id: result.data.id,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone,
          handicap: result.data.handicap,
        } as BaseGuest;

        setGuests([...guests, newGuest]);
        toast.success("Guest created successfully");
      } else {
        toast.error(result.error || "Failed to create guest");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const handleEditGuest = async (
    guestId: number,
    data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      handicap?: string;
    },
  ) => {
    try {
      const result = await updateGuest(guestId, data);

      if (result.success && result.data) {
        // Type assertion to match BaseGuest
        const updatedGuest = {
          id: result.data.id,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone,
          handicap: result.data.handicap,
        } as BaseGuest;

        setGuests(
          guests.map((guest) => (guest.id === guestId ? updatedGuest : guest)),
        );
        toast.success("Guest updated successfully");
      } else {
        toast.error(result.error || "Failed to update guest");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return;

    try {
      const result = await deleteGuest(selectedGuest.id);

      if (result.success) {
        setGuests(guests.filter((guest) => guest.id !== selectedGuest.id));
        setIsDeleteDialogOpen(false);
        setSelectedGuest(null);
        toast.success("Guest deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete guest");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guests</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>

      <div className="space-y-4">
        <div className="w-full">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search guests by name or email..."
            theme={theme}
          />
        </div>

        <GuestTable
          guests={getCurrentPageGuests()}
          onEdit={(guest) => {
            setSelectedGuest(guest);
            setIsEditDialogOpen(true);
          }}
          onDelete={(guest) => {
            setSelectedGuest(guest);
            setIsDeleteDialogOpen(true);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          theme={theme}
        />
      </div>

      <AddGuestDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddGuest}
        theme={theme}
      />

      <EditGuestDialog
        guest={selectedGuest}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditGuest}
        theme={theme}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              guest and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGuest}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
